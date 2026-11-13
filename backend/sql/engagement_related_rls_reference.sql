-- Reference copy — apply manually via the Supabase SQL editor.
-- Live DB is the source of truth; this file records the intended change.
--
-- RLS for:
--   * public.engagement_deliverables
--   * public.engagement_activity
--   * public.engagement_code_counters
--
-- Access matrix:
--   engagement_deliverables SELECT
--       active firm users, and clients who own the engagement's business.
--       INSERT/UPDATE/DELETE are backend-owned because file metadata and
--       bytes are written through the authenticated Express backend.
--   engagement_activity SELECT
--       active firm users, and clients who own the engagement's business.
--       INSERT assigned staff/admin only, and only as themselves. The
--       frontend logs task/status changes after the corresponding write.
--       Trigger-generated activity uses SECURITY DEFINER functions.
--       UPDATE/DELETE are not available from the browser.
--   engagement_code_counters
--       no browser access. Engagement-code RPCs/triggers and service-role
--       operations retain access; service_role bypasses RLS.
--
-- Assumptions:
--   * businesses.owner_id = the client's auth.uid().
--   * The helpers below are SECURITY DEFINER so their ownership checks do
--     not depend on the RLS state of engagements or businesses.
--   * Service-role writes bypass RLS. SECURITY DEFINER activity triggers
--     also bypass caller table policies.

-- ============================================================
-- 0) Discovery — run first and review output before applying.
-- ============================================================

SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'engagement_deliverables',
    'engagement_activity',
    'engagement_code_counters'
  )
ORDER BY tablename, policyname;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'engagement_deliverables',
    'engagement_activity',
    'engagement_code_counters'
  )
ORDER BY table_name, ordinal_position;

SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN (
    'engagement_deliverables',
    'engagement_activity',
    'engagement_code_counters'
  )
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;

-- ============================================================
-- 1) Pre-flight — fail loudly if the live schema has drifted.
-- ============================================================

DO $$
DECLARE
  missing text;
BEGIN
  SELECT string_agg(
           format('%I.%I', expected.table_name, expected.column_name),
           ', ' ORDER BY expected.table_name, expected.column_name
         )
  INTO missing
  FROM (VALUES
    ('engagement_deliverables', 'file_id'),
    ('engagement_deliverables', 'engagement_id'),
    ('engagement_activity', 'activity_id'),
    ('engagement_activity', 'engagement_id'),
    ('engagement_activity', 'type'),
    ('engagement_activity', 'message'),
    ('engagement_activity', 'actor_id'),
    ('engagement_activity', 'created_at'),
    ('engagement_code_counters', 'year'),
    ('engagement_code_counters', 'last_seq'),
    ('engagements', 'engagement_id'),
    ('engagements', 'business_id'),
    ('engagements', 'assigned_staff'),
    ('businesses', 'business_id'),
    ('businesses', 'owner_id'),
    ('user_roles', 'user_id'),
    ('user_roles', 'role'),
    ('users', 'user_id'),
    ('users', 'status')
  ) AS expected(table_name, column_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM information_schema.columns actual
    WHERE actual.table_schema = 'public'
      AND actual.table_name = expected.table_name
      AND actual.column_name = expected.column_name
  );

  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'live schema missing expected columns: %', missing;
  END IF;
END $$;

-- ============================================================
-- 2) Helpers — recreated with the signatures used by the other
-- engagement RLS reference files, so application order is immaterial.
-- ============================================================

CREATE OR REPLACE FUNCTION public.has_role(required text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = required
  );
$$;

CREATE OR REPLACE FUNCTION public.is_firm_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'staff', 'billing_officer')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE user_id = auth.uid()
      AND status IS DISTINCT FROM 'deactivated'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_my_engagement(p_engagement_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.engagements e
    JOIN public.businesses b ON b.business_id = e.business_id
    WHERE e.engagement_id = p_engagement_id
      AND b.owner_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_engagement_activity(
  p_engagement_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.engagements e
    WHERE e.engagement_id = p_engagement_id
      AND (
        public.has_role('admin')
        OR (
          public.has_role('staff')
          AND e.assigned_staff = auth.uid()
        )
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_firm_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_active_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_my_engagement(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE
  ON FUNCTION public.can_manage_engagement_activity(uuid)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_firm_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_my_engagement(uuid) TO authenticated;
GRANT EXECUTE
  ON FUNCTION public.can_manage_engagement_activity(uuid)
  TO authenticated;

-- ============================================================
-- 3) Enable RLS and remove stale policies. Policies are permissive
-- by default, so an old broad policy would otherwise OR with these.
-- ============================================================

ALTER TABLE public.engagement_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_code_counters ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  policy_row record;
BEGIN
  FOR policy_row IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'engagement_deliverables',
        'engagement_activity',
        'engagement_code_counters'
      )
  LOOP
    EXECUTE format(
      'DROP POLICY %I ON public.%I',
      policy_row.policyname,
      policy_row.tablename
    );
  END LOOP;
END $$;

-- ============================================================
-- 4) Policies — anon receives no access.
-- ============================================================

CREATE POLICY engagement_deliverables_select_visible
ON public.engagement_deliverables FOR SELECT
TO authenticated
USING (
  public.is_active_user()
  AND (
    public.is_firm_user()
    OR public.is_my_engagement(engagement_id)
  )
);

CREATE POLICY engagement_deliverables_writes_blocked
ON public.engagement_deliverables FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY engagement_activity_select_visible
ON public.engagement_activity FOR SELECT
TO authenticated
USING (
  public.is_active_user()
  AND (
    public.is_firm_user()
    OR public.is_my_engagement(engagement_id)
  )
);

CREATE POLICY engagement_activity_insert_manager
ON public.engagement_activity FOR INSERT
TO authenticated
WITH CHECK (
  public.is_active_user()
  AND actor_id = auth.uid()
  AND public.can_manage_engagement_activity(engagement_id)
);

CREATE POLICY engagement_activity_updates_blocked
ON public.engagement_activity FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY engagement_activity_deletes_blocked
ON public.engagement_activity FOR DELETE
TO authenticated
USING (false);

-- Deliberately no policies on engagement_code_counters: authenticated
-- and anon have no row access even if table grants are later broadened.

-- ============================================================
-- 5) Table grants — make the intended browser surface explicit.
-- ============================================================

REVOKE ALL ON public.engagement_deliverables FROM anon, authenticated;
REVOKE ALL ON public.engagement_activity FROM anon, authenticated;
REVOKE ALL ON public.engagement_code_counters FROM anon, authenticated;

GRANT SELECT ON public.engagement_deliverables TO authenticated;

REVOKE INSERT, UPDATE, DELETE
  ON public.engagement_deliverables, public.engagement_activity
  FROM anon, authenticated;
GRANT SELECT, INSERT ON public.engagement_activity TO authenticated;

-- ============================================================
-- 6) Verification — inspect policies and privileges after applying.
-- ============================================================

SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'engagement_deliverables',
    'engagement_activity',
    'engagement_code_counters'
  )
ORDER BY tablename, policyname;

SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN (
    'engagement_deliverables',
    'engagement_activity',
    'engagement_code_counters'
  )
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;
