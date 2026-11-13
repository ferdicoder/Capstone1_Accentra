-- Reference copy — apply manually via the Supabase SQL editor.
-- Live DB is the source of truth; this file records the intended change.
--
-- RLS for public.service_requests and public.service_request_code_counters.
--
-- Access matrix enforced here:
--   service_requests SELECT  active admin/staff/billing_officer — firm
--           dashboards; clients only requests for businesses they own.
--   service_requests INSERT  active clients only, for a business they own.
--   service_requests UPDATE  active admin/staff for workflow decisions;
--           active clients may cancel their own pending requests.
--   service_requests DELETE  nobody from the browser.
--   service_request_code_counters  no browser access; request-code triggers
--           and the service role remain able to use the table.
--
-- The approval flow is public.create_engagement(...), a SECURITY DEFINER
-- RPC that atomically sets service_id/status and creates the engagement.
-- The service role bypasses RLS. These policies do not replace role checks
-- in that RPC or in backend routes.

-- ============================================================
-- 0) Discovery — run first and review output before applying.
-- ============================================================

SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('service_requests', 'service_request_code_counters')
ORDER BY tablename, policyname;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('service_requests', 'service_request_code_counters')
ORDER BY table_name, ordinal_position;

SELECT c.conrelid::regclass AS referencing_table,
       a.attname AS referencing_column,
       c.confrelid::regclass AS referenced_table,
       c.conname AS constraint_name
FROM pg_constraint c
JOIN pg_attribute a
  ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
WHERE c.contype = 'f'
  AND (c.conrelid IN (
         'public.service_requests'::regclass,
         'public.service_request_code_counters'::regclass
       )
       OR c.confrelid IN (
         'public.service_requests'::regclass,
         'public.service_request_code_counters'::regclass
       ))
ORDER BY 1, 2;

SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('service_requests', 'service_request_code_counters')
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;

-- ============================================================
-- 1) Pre-flight — fail loudly if the policy paths do not match the live DB.
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
    ('service_requests', 'service_request_id'),
    ('service_requests', 'business_id'),
    ('service_requests', 'service_id'),
    ('service_requests', 'description'),
    ('service_requests', 'status'),
    ('service_requests', 'request_code'),
    ('service_requests', 'created_at'),
    ('service_requests', 'rejection_reason'),
    ('service_requests', 'rejected_at'),
    ('service_requests', 'category'),
    ('service_request_code_counters', 'year'),
    ('service_request_code_counters', 'last_seq'),
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
-- 2) Helpers — security definer avoids depending on RLS state of
-- user_roles, users, or businesses while policies evaluate ownership.
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

CREATE OR REPLACE FUNCTION public.is_my_business(p_business_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.businesses
    WHERE business_id = p_business_id
      AND owner_id = auth.uid()
  );
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_firm_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_active_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_my_business(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_firm_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_my_business(uuid) TO authenticated;

-- ============================================================
-- 3) Enable RLS and remove stale policies.
-- ============================================================

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_request_code_counters ENABLE ROW LEVEL SECURITY;
-- Trigger functions run as the table owner. Ensure a previous deployment did
-- not force that owner through RLS, which would block the counter increment.
ALTER TABLE public.service_request_code_counters NO FORCE ROW LEVEL SECURITY;

DO $$
DECLARE
  policy_row record;
BEGIN
  FOR policy_row IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('service_requests', 'service_request_code_counters')
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

CREATE POLICY service_requests_select_firm_or_owner
ON public.service_requests FOR SELECT
TO authenticated
USING (
  public.is_active_user()
  AND (
    public.is_firm_user()
    OR public.is_my_business(business_id)
  )
);

CREATE POLICY service_requests_insert_owner
ON public.service_requests FOR INSERT
TO authenticated
WITH CHECK (
  public.is_active_user()
  AND NOT public.is_firm_user()
  AND public.is_my_business(business_id)
);

CREATE POLICY service_requests_update_workflow
ON public.service_requests FOR UPDATE
TO authenticated
USING (
  public.is_active_user()
  AND (
    public.has_role('admin')
    OR public.has_role('staff')
    OR (
      public.is_my_business(business_id)
      AND status = 'pending'
    )
  )
)
WITH CHECK (
  public.is_active_user()
  AND (
    public.has_role('admin')
    OR public.has_role('staff')
    OR (
      public.is_my_business(business_id)
      AND status = 'cancelled'
    )
  )
);

CREATE POLICY service_requests_delete_blocked
ON public.service_requests FOR DELETE
TO authenticated
USING (false);

-- The counter is trigger/service-role-only. Do not add a browser policy.

-- ============================================================
-- 5) Request-code generation — the trigger must be SECURITY DEFINER.
--    The counter intentionally has no browser policy. A SECURITY INVOKER
--    trigger would therefore fail with 42501 during a client INSERT.
-- ============================================================

CREATE OR REPLACE FUNCTION public.assign_service_request_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_year integer;
  next_sequence bigint;
BEGIN
  request_year := EXTRACT(YEAR FROM COALESCE(NEW.created_at, now()))::integer;

  INSERT INTO public.service_request_code_counters (year, last_seq)
  VALUES (request_year, 1)
  ON CONFLICT (year)
  DO UPDATE SET last_seq = public.service_request_code_counters.last_seq + 1
  RETURNING last_seq INTO next_sequence;

  NEW.request_code := format('SR-%s-%s', request_year, lpad(next_sequence::text, 4, '0'));
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.assign_service_request_code()
  SECURITY DEFINER
  SET search_path = public;

REVOKE ALL ON FUNCTION public.assign_service_request_code() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS service_requests_assign_code ON public.service_requests;
CREATE TRIGGER service_requests_assign_code
  BEFORE INSERT ON public.service_requests
  FOR EACH ROW
  WHEN (NEW.request_code IS NULL)
  EXECUTE FUNCTION public.assign_service_request_code();

-- ============================================================
-- 6) Column grants — prevent browser callers from changing identity,
-- generated, approval, and rejection metadata even when a row policy matches.
-- ============================================================

REVOKE INSERT, UPDATE ON public.service_requests FROM authenticated;
GRANT INSERT (
  business_id,
  category,
  description
) ON public.service_requests TO authenticated;
GRANT UPDATE (
  status,
  rejection_reason,
  rejected_at
) ON public.service_requests TO authenticated;

-- ============================================================
-- 7) Guard trigger — RLS cannot express immutable fields or reject
-- client-side attempts to change workflow metadata.
-- ============================================================

CREATE OR REPLACE FUNCTION public.service_requests_guard_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Service role / SQL editor / migrations have no end-user JWT.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.users
    WHERE user_id = auth.uid()
      AND status = 'deactivated'
  ) THEN
    RAISE EXCEPTION 'deactivated users cannot write the service_requests table';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status IS DISTINCT FROM 'pending'::public.service_request_status THEN
      RAISE EXCEPTION 'new service requests must start in pending status';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.service_request_id IS DISTINCT FROM OLD.service_request_id
     OR NEW.business_id IS DISTINCT FROM OLD.business_id
     OR NEW.request_code IS DISTINCT FROM OLD.request_code
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.category IS DISTINCT FROM OLD.category
     OR NEW.description IS DISTINCT FROM OLD.description THEN
    RAISE EXCEPTION 'service request identity and submission fields are immutable';
  END IF;

  IF public.has_role('admin') OR public.has_role('staff') THEN
    RETURN NEW;
  END IF;

  IF NEW.service_id IS DISTINCT FROM OLD.service_id THEN
    RAISE EXCEPTION 'clients may not assign a service template';
  END IF;

  IF OLD.status IS DISTINCT FROM 'pending'::public.service_request_status
     OR NEW.status IS DISTINCT FROM 'cancelled'::public.service_request_status
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
     OR NEW.rejected_at IS DISTINCT FROM OLD.rejected_at THEN
    RAISE EXCEPTION 'clients may only cancel pending service requests';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS service_requests_guard_write ON public.service_requests;
CREATE TRIGGER service_requests_guard_write
  BEFORE INSERT OR UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.service_requests_guard_write();

-- ============================================================
-- 8) Verification — replace placeholders before running.
-- ============================================================

SELECT p.proname, p.prosecdef AS is_security_definer, p.proconfig
FROM pg_proc AS p
JOIN pg_namespace AS n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'assign_service_request_code';

SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity,
       pg_get_userbyid(c.relowner) AS table_owner,
       p.proowner::regrole AS function_owner
FROM pg_class AS c
JOIN pg_proc AS p
  ON p.oid = 'public.assign_service_request_code()'::regprocedure
WHERE c.oid = 'public.service_request_code_counters'::regclass;

SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('service_requests', 'service_request_code_counters')
ORDER BY tablename, policyname;

-- As a client: only own requests are visible.
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claims = '{"sub":"<CLIENT>","role":"authenticated"}';
-- SELECT count(*) FROM public.service_requests;
-- INSERT INTO public.service_requests (business_id, category, description)
-- VALUES ('<MY_BIZ>', '<CATEGORY>'::public.service_category, 'test');
-- UPDATE public.service_requests SET status = 'cancelled'
-- WHERE service_request_id = '<PENDING_OWN_REQUEST>';
-- UPDATE public.service_requests SET status = 'approved'
-- WHERE service_request_id = '<PENDING_OWN_REQUEST>'; -- expect 0 rows/error
--
-- As staff/admin: all active requests are visible and workflow updates work.
-- As billing officer: SELECT works; INSERT/UPDATE match no policy.
-- As any authenticated browser role: counter SELECT/INSERT/UPDATE is denied.
