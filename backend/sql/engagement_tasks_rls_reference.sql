-- Reference copy — apply manually via the Supabase SQL editor.
-- Live DB is the source of truth; this file records the intended change.
--
-- RLS for public.engagement_tasks,
-- public.engagement_task_references, and
-- public.engagement_task_submissions.
--
-- Access matrix:
--   SELECT  all active firm roles (admin/staff/billing_officer);
--           clients only tasks and files belonging to engagements of
--           businesses they own.
--   INSERT  admin or the staff member assigned to the engagement for tasks.
--   UPDATE  admin or the assigned staff member for task fields used by the
--           firm UI. Task submission status changes made by the backend use
--           the service role and bypass RLS.
--   DELETE  nobody from the browser.
--   Junction INSERT/UPDATE/DELETE
--           service role only. File metadata and bytes are managed by the
--           authenticated backend controllers, not by PostgREST.
--
-- Assumptions:
--   * has_role(), is_firm_user(), and is_active_user() are defined by the
--     users/engagements RLS reference files (the definitions below are
--     intentionally recreated so application order does not matter).
--   * businesses.owner_id = the client's auth.uid().
--   * service role bypasses RLS.

-- ============================================================
-- 0) Discovery — run first and review output before applying.
-- ============================================================

SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'engagement_tasks',
    'engagement_task_references',
    'engagement_task_submissions'
  )
ORDER BY tablename, policyname;

SELECT c.conrelid::regclass AS referencing_table,
       a.attname AS referencing_column,
       c.confrelid::regclass AS referenced_table,
       c.conname AS constraint_name
FROM pg_constraint c
JOIN pg_attribute a
  ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
WHERE c.contype = 'f'
  AND c.conrelid IN (
    'public.engagement_tasks'::regclass,
    'public.engagement_task_references'::regclass,
    'public.engagement_task_submissions'::regclass
  )
ORDER BY 1, 2;

-- ============================================================
-- 1) Pre-flight — fail loudly if the policy paths do not match the live DB.
-- ============================================================

DO $$
DECLARE
  missing text;
BEGIN
  SELECT string_agg(format('%I.%I', expected.table_name, expected.column_name), ', '
                    ORDER BY expected.table_name, expected.column_name)
  INTO missing
  FROM (VALUES
    ('engagement_tasks', 'engagement_task_id'),
    ('engagement_tasks', 'engagement_id'),
    ('engagement_tasks', 'title'),
    ('engagement_tasks', 'has_reference'),
    ('engagement_tasks', 'is_required'),
    ('engagement_tasks', 'status'),
    ('engagement_tasks', 'remark'),
    ('engagement_tasks', 'reviewed_by'),
    ('engagement_tasks', 'reviewed_at'),
    ('engagement_tasks', 'due_date'),
    ('engagement_task_references', 'file_id'),
    ('engagement_task_references', 'engagement_task_id'),
    ('engagement_task_submissions', 'file_id'),
    ('engagement_task_submissions', 'engagement_task_id'),
    ('engagement_task_submissions', 'review_status'),
    ('engagement_task_submissions', 'remark'),
    ('engagement_task_submissions', 'reviewed_by'),
    ('engagement_task_submissions', 'reviewed_at'),
    ('engagements', 'engagement_id'),
    ('engagements', 'business_id'),
    ('engagements', 'assigned_staff'),
    ('businesses', 'business_id'),
    ('businesses', 'owner_id')
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
-- 2) Helpers — SECURITY DEFINER avoids dependency on the RLS state of
-- engagements and businesses while evaluating a task policy.
-- ============================================================

CREATE OR REPLACE FUNCTION public.has_role(required text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid() AND role = required
  );
$$;

CREATE OR REPLACE FUNCTION public.is_firm_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE AS $$
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
STABLE AS $$
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
STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.engagements e
    JOIN public.businesses b ON b.business_id = e.business_id
    WHERE e.engagement_id = p_engagement_id
      AND b.owner_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_engagement_task(p_engagement_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.engagements e
    WHERE e.engagement_id = p_engagement_id
      AND (
        public.has_role('admin')
        OR (
          e.assigned_staff = auth.uid()
          AND public.has_role('staff')
        )
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_firm_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_active_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_my_engagement(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_manage_engagement_task(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_firm_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_my_engagement(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_engagement_task(uuid) TO authenticated;

-- ============================================================
-- 3) Enable RLS and remove stale policies. Permissive policies OR-combine,
-- so leaving an old broad policy in place would defeat this access model.
-- ============================================================

ALTER TABLE public.engagement_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_task_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_task_submissions ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  policy_row record;
BEGIN
  FOR policy_row IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'engagement_tasks',
        'engagement_task_references',
        'engagement_task_submissions'
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

CREATE POLICY engagement_tasks_select_visible
ON public.engagement_tasks FOR SELECT
TO authenticated
USING (
  public.is_active_user()
  AND (
    public.is_firm_user()
    OR public.is_my_engagement(engagement_id)
  )
);

CREATE POLICY engagement_tasks_insert_manager
ON public.engagement_tasks FOR INSERT
TO authenticated
WITH CHECK (
  public.is_active_user()
  AND public.can_manage_engagement_task(engagement_id)
);

CREATE POLICY engagement_tasks_update_manager
ON public.engagement_tasks FOR UPDATE
TO authenticated
USING (
  public.is_active_user()
  AND public.can_manage_engagement_task(engagement_id)
)
WITH CHECK (
  public.is_active_user()
  AND public.can_manage_engagement_task(engagement_id)
);

CREATE POLICY engagement_tasks_delete_blocked
ON public.engagement_tasks FOR DELETE
TO authenticated
USING (false);

CREATE POLICY engagement_task_references_select_visible
ON public.engagement_task_references FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.engagement_tasks task
    WHERE task.engagement_task_id =
      public.engagement_task_references.engagement_task_id
      AND public.is_active_user()
      AND (
        public.is_firm_user()
        OR public.is_my_engagement(task.engagement_id)
      )
  )
);

CREATE POLICY engagement_task_submissions_select_visible
ON public.engagement_task_submissions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.engagement_tasks task
    WHERE task.engagement_task_id =
      public.engagement_task_submissions.engagement_task_id
      AND public.is_active_user()
      AND (
        public.is_firm_user()
        OR public.is_my_engagement(task.engagement_id)
      )
  )
);

-- The backend owns file metadata and junction writes through supabaseAdmin.
-- Explicit denies document that no browser write path is intended.
CREATE POLICY engagement_task_references_writes_blocked
ON public.engagement_task_references FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY engagement_task_submissions_writes_blocked
ON public.engagement_task_submissions FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Restrict browser task updates to fields used by the firm task UI.
REVOKE UPDATE ON public.engagement_tasks FROM authenticated;
GRANT UPDATE (
  title,
  has_reference,
  is_required,
  status,
  remark,
  reviewed_by,
  reviewed_at,
  due_date
) ON public.engagement_tasks TO authenticated;

-- Keep junction writes service-role/SQL-editor only even if table grants
-- were broadened elsewhere.
REVOKE INSERT, UPDATE, DELETE
  ON public.engagement_task_references,
     public.engagement_task_submissions
  FROM authenticated, anon;
