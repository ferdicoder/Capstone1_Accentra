-- Reference copy — apply manually via the Supabase SQL editor.
-- The live Supabase schema is the source of truth; this file records the
-- intended RLS configuration for the service-template tables.
--
-- RLS for:
--   public.services
--   public.service_categories
--   public.template_tasks
--   public.template_task_documents
--
-- Access matrix:
--   services SELECT:
--     active firm users (admin/staff/billing_officer) — service management,
--     service-request selection, billing, and engagement views;
--     clients only services referenced by one of their own service requests
--     or engagements (historical service details without a public catalog).
--   services UPDATE:
--     active admins and staff — the service editor and status toggle.
--   services INSERT/DELETE:
--     no browser access. Creation and hard deletion use the backend service
--     role; the delete RPC also enforces its usage guard.
--   service_categories SELECT:
--     authenticated users may read active categories; firm users may also
--     read inactive categories.
--   service_categories INSERT/UPDATE/DELETE:
--     admins only.
--   template_tasks SELECT:
--     active admins and staff only — template management and backend flows.
--   template_tasks INSERT/UPDATE/DELETE:
--     active admins and staff. The update RPC is SECURITY INVOKER and must
--     be able to maintain its child rows when called from the browser.
--   template_task_documents SELECT:
--     active admins and staff only — template management.
--   template_task_documents INSERT:
--     no browser access. Template document upload uses the backend service
--     role.
--   template_task_documents DELETE:
--     active admins and staff — the update RPC removes documents belonging
--     to dropped template tasks.
--
-- The service role bypasses RLS. These policies do not replace the role
-- checks in backend routes or the authorization checks inside RPCs.
--
-- Client service-template documents are intentionally not exposed here.
-- create_engagement/copyTemplateReferences copies them into engagement
-- reference documents, which have their own access policy.

-- ============================================================
-- 0) Discovery — run first and review output before applying.
-- ============================================================

SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'services',
    'service_categories',
    'template_tasks',
    'template_task_documents'
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
  AND (
    c.conrelid IN (
      'public.services'::regclass,
      'public.service_categories'::regclass,
      'public.template_tasks'::regclass,
      'public.template_task_documents'::regclass
    )
    OR c.confrelid IN (
      'public.services'::regclass,
      'public.service_categories'::regclass,
      'public.template_tasks'::regclass,
      'public.template_task_documents'::regclass
    )
  )
ORDER BY 1, 2;

SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN (
    'services',
    'service_categories',
    'template_tasks',
    'template_task_documents'
  )
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
    ('services', 'service_id'),
    ('services', 'status'),
    ('template_tasks', 'template_id'),
    ('template_tasks', 'service_id'),
    ('template_task_documents', 'file_id'),
    ('template_task_documents', 'template_task_id'),
    ('service_requests', 'service_request_id'),
    ('service_requests', 'business_id'),
    ('service_requests', 'service_id'),
    ('engagements', 'engagement_id'),
    ('engagements', 'business_id'),
    ('engagements', 'service_id'),
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
-- 2) Helpers — SECURITY DEFINER avoids depending on the RLS state of
-- user_roles, businesses, service_requests, or engagements while policies
-- evaluate cross-table ownership.
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

-- A client may see service metadata only after the service is attached to
-- that client's request or engagement. The direct ownership check avoids
-- recursion through the businesses/service_requests/engagements policies.
CREATE OR REPLACE FUNCTION public.can_view_service(p_service_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.is_firm_user()
  OR EXISTS (
    SELECT 1
    FROM public.service_requests sr
    JOIN public.businesses b ON b.business_id = sr.business_id
    WHERE sr.service_id = p_service_id
      AND b.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.engagements e
    JOIN public.businesses b ON b.business_id = e.business_id
    WHERE e.service_id = p_service_id
      AND b.owner_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_service_templates()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.is_active_user()
    AND (
      public.has_role('admin')
      OR public.has_role('staff')
    );
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_firm_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_active_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_view_service(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_manage_service_templates() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_firm_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_service(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_service_templates() TO authenticated;

-- ============================================================
-- 3) Enable RLS and remove stale policies.
--    Policies are permissive and OR-combine, so stale broad policies would
--    otherwise defeat this access model.
-- ============================================================

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_task_documents ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  policy_row record;
BEGIN
  FOR policy_row IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'services',
        'template_tasks',
        'template_task_documents'
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

CREATE POLICY services_select_visible
ON public.services FOR SELECT
TO authenticated
USING (
  public.is_active_user()
  AND public.can_view_service(service_id)
);

CREATE POLICY services_update_manager
ON public.services FOR UPDATE
TO authenticated
USING (public.can_manage_service_templates())
WITH CHECK (public.can_manage_service_templates());

CREATE POLICY template_tasks_select_manager
ON public.template_tasks FOR SELECT
TO authenticated
USING (public.can_manage_service_templates());

CREATE POLICY template_tasks_insert_manager
ON public.template_tasks FOR INSERT
TO authenticated
WITH CHECK (public.can_manage_service_templates());

CREATE POLICY template_tasks_update_manager
ON public.template_tasks FOR UPDATE
TO authenticated
USING (public.can_manage_service_templates())
WITH CHECK (public.can_manage_service_templates());

CREATE POLICY template_tasks_delete_manager
ON public.template_tasks FOR DELETE
TO authenticated
USING (public.can_manage_service_templates());

CREATE POLICY template_task_documents_select_manager
ON public.template_task_documents FOR SELECT
TO authenticated
USING (public.can_manage_service_templates());

CREATE POLICY template_task_documents_delete_manager
ON public.template_task_documents FOR DELETE
TO authenticated
USING (public.can_manage_service_templates());
