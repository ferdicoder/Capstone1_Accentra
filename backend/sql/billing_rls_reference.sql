-- Reference copy — apply manually via the Supabase SQL editor.
-- Live DB is the source of truth; this file records the intended change.
--
-- RLS for:
--   * public.billings
--   * public.billing_engagements
--   * public.payments
--   * public.payment_proofs
--   * public.billing_code_counters
--   * public.files (payment and engagement-linked file metadata)
--
-- Access matrix:
--   billings SELECT
--       active firm users, and clients who own the billing's business.
--   billings INSERT
--       active admin, staff, or billing_officer users. The firm portal
--       creates billings directly from completed engagements.
--   billings UPDATE
--       active admin or billing_officer users. This is the payment
--       verification/status workflow used by the firm billing screens.
--   billings DELETE
--       active firm users. There is no normal delete UI; this permits the
--       create-billing rollback path used by every firm billing screen.
--   billing_engagements SELECT
--       anyone who can see the parent billing.
--   billing_engagements INSERT
--       active admin, staff, or billing_officer users creating billings.
--   billing_engagements UPDATE/DELETE
--       active firm users; no normal browser update path exists, but the
--       create-billing rollback path can remove its just-created links.
--   payments SELECT
--       anyone who can see the parent billing.
--   payments INSERT/DELETE
--       backend-owned; payment submission uses service_role.
--   payments UPDATE
--       active admin or billing_officer users for payment verification.
--   payment_proofs SELECT
--       anyone who can see the parent payment.
--   payment_proofs INSERT/UPDATE/DELETE
--       backend-owned; proof files are created and cleaned up by Express.
--   files SELECT
--       active firm users, and clients whose own payment or engagement
--       references the file. This covers nested PostgREST file metadata
--       without exposing unrelated B2 object metadata.
--   files INSERT/UPDATE/DELETE
--       backend-owned; file metadata and B2 objects are managed by Express.
--   billing_code_counters
--       no browser access; the billing-code trigger and service-role
--       operations retain access.
--
-- Assumptions:
--   * businesses.owner_id = the client's auth.uid().
--   * has_role(), is_firm_user(), and is_active_user() match the helpers
--     used by the other RLS reference files. They are re-created here so
--     application order between reference files is immaterial.
--   * Service-role writes bypass RLS. The backend payment controller uses
--     supabaseAdmin and therefore does not need browser INSERT policies.
--   * The files table is shared by payment proofs, engagement documents,
--     task submissions, task references, and template documents. Its policy
--     therefore checks every client-visible junction, not only payments.

-- ============================================================
-- 0) Discovery — run first and review output before applying.
-- ============================================================

SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'billings',
    'billing_engagements',
    'payments',
    'payment_proofs',
    'billing_code_counters',
    'files'
  )
ORDER BY tablename, policyname;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'billings',
    'billing_engagements',
    'payments',
    'payment_proofs',
    'billing_code_counters',
    'files'
  )
ORDER BY table_name, ordinal_position;

SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN (
    'billings',
    'billing_engagements',
    'payments',
    'payment_proofs',
    'billing_code_counters',
    'files'
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
    ('billings', 'billing_id'),
    ('billings', 'business_id'),
    ('billings', 'status'),
    ('billing_engagements', 'billing_id'),
    ('billing_engagements', 'engagement_id'),
    ('payments', 'payment_id'),
    ('payments', 'billing_id'),
    ('payment_proofs', 'file_id'),
    ('payment_proofs', 'payment_id'),
    ('billing_code_counters', 'year'),
    ('billing_code_counters', 'last_seq'),
    ('files', 'file_id'),
    ('files', 'uploaded_by'),
    ('businesses', 'business_id'),
    ('businesses', 'owner_id'),
    ('engagements', 'engagement_id'),
    ('engagements', 'business_id'),
    ('engagement_task_references', 'file_id'),
    ('engagement_task_references', 'engagement_task_id'),
    ('engagement_task_submissions', 'file_id'),
    ('engagement_task_submissions', 'engagement_task_id'),
    ('engagement_tasks', 'engagement_task_id'),
    ('engagement_tasks', 'engagement_id'),
    ('engagement_deliverables', 'file_id'),
    ('engagement_deliverables', 'engagement_id'),
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
-- 2) Helpers — SECURITY DEFINER avoids nested-table RLS recursion.
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

CREATE OR REPLACE FUNCTION public.can_view_billing(p_billing_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.billings b
    WHERE b.billing_id = p_billing_id
      AND public.is_my_business(b.business_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_payment(p_payment_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.payments p
    WHERE p.payment_id = p_payment_id
      AND public.can_view_billing(p.billing_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_file(p_file_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.payment_proofs pp
    JOIN public.payments p ON p.payment_id = pp.payment_id
    WHERE pp.file_id = p_file_id
      AND public.can_view_billing(p.billing_id)
  )
  OR EXISTS (
    SELECT 1
    FROM public.engagement_deliverables d
    JOIN public.engagements e ON e.engagement_id = d.engagement_id
    JOIN public.businesses b ON b.business_id = e.business_id
    WHERE d.file_id = p_file_id
      AND b.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.engagement_task_submissions s
    JOIN public.engagement_tasks t
      ON t.engagement_task_id = s.engagement_task_id
    JOIN public.engagements e ON e.engagement_id = t.engagement_id
    JOIN public.businesses b ON b.business_id = e.business_id
    WHERE s.file_id = p_file_id
      AND b.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.engagement_task_references r
    JOIN public.engagement_tasks t
      ON t.engagement_task_id = r.engagement_task_id
    JOIN public.engagements e ON e.engagement_id = t.engagement_id
    JOIN public.businesses b ON b.business_id = e.business_id
    WHERE r.file_id = p_file_id
      AND b.owner_id = auth.uid()
  );
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_firm_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_active_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_my_business(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_view_billing(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_view_payment(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_view_file(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_firm_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_my_business(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_billing(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_payment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_file(uuid) TO authenticated;

-- ============================================================
-- 3) Enable RLS and remove stale policies.
-- ============================================================

ALTER TABLE public.billings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_code_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  policy_row record;
BEGIN
  FOR policy_row IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'billings',
        'billing_engagements',
        'payments',
        'payment_proofs',
        'billing_code_counters',
        'files'
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

CREATE POLICY billings_select_visible
ON public.billings FOR SELECT
TO authenticated
USING (
  public.is_active_user()
  AND (
    public.is_firm_user()
    OR public.is_my_business(business_id)
  )
);

CREATE POLICY billings_insert_firm
ON public.billings FOR INSERT
TO authenticated
WITH CHECK (
  public.is_active_user()
  AND public.is_firm_user()
);

CREATE POLICY billings_update_billing_staff
ON public.billings FOR UPDATE
TO authenticated
USING (
  public.is_active_user()
  AND (public.has_role('admin') OR public.has_role('billing_officer'))
)
WITH CHECK (
  public.is_active_user()
  AND (public.has_role('admin') OR public.has_role('billing_officer'))
);

CREATE POLICY billings_delete_firm
ON public.billings FOR DELETE
TO authenticated
USING (
  public.is_active_user()
  AND public.is_firm_user()
);

CREATE POLICY billing_engagements_select_visible
ON public.billing_engagements FOR SELECT
TO authenticated
USING (
  public.is_active_user()
  AND (
    public.is_firm_user()
    OR public.can_view_billing(billing_id)
  )
);

CREATE POLICY billing_engagements_insert_firm
ON public.billing_engagements FOR INSERT
TO authenticated
WITH CHECK (
  public.is_active_user()
  AND public.is_firm_user()
);

CREATE POLICY billing_engagements_update_billing_staff
ON public.billing_engagements FOR UPDATE
TO authenticated
USING (
  public.is_active_user()
  AND (public.has_role('admin') OR public.has_role('billing_officer'))
)
WITH CHECK (
  public.is_active_user()
  AND (public.has_role('admin') OR public.has_role('billing_officer'))
);

CREATE POLICY billing_engagements_delete_firm
ON public.billing_engagements FOR DELETE
TO authenticated
USING (
  public.is_active_user()
  AND public.is_firm_user()
);

CREATE POLICY payments_select_visible
ON public.payments FOR SELECT
TO authenticated
USING (
  public.is_active_user()
  AND (
    public.is_firm_user()
    OR public.can_view_billing(billing_id)
  )
);

CREATE POLICY payments_update_billing_staff
ON public.payments FOR UPDATE
TO authenticated
USING (
  public.is_active_user()
  AND (public.has_role('admin') OR public.has_role('billing_officer'))
)
WITH CHECK (
  public.is_active_user()
  AND (public.has_role('admin') OR public.has_role('billing_officer'))
);

CREATE POLICY payment_proofs_select_visible
ON public.payment_proofs FOR SELECT
TO authenticated
USING (
  public.is_active_user()
  AND (
    public.is_firm_user()
    OR public.can_view_payment(payment_id)
  )
);

CREATE POLICY files_select_visible
ON public.files FOR SELECT
TO authenticated
USING (
  public.is_active_user()
  AND (
    public.is_firm_user()
    OR public.can_view_file(file_id)
  )
);

-- No INSERT/UPDATE/DELETE policies are intentional: proof and document
-- lifecycles are backend-owned and service_role bypasses RLS.

-- Deliberately no policies on billing_code_counters: authenticated and anon
-- have no row access even if table grants are later broadened.

-- ============================================================
-- 5) Table grants — make the intended browser surface explicit.
-- ============================================================

REVOKE ALL ON public.billings,
  public.billing_engagements,
  public.payments,
  public.payment_proofs,
  public.billing_code_counters,
  public.files
FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.billings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.billing_engagements TO authenticated;
GRANT SELECT, UPDATE ON public.payments TO authenticated;
GRANT SELECT ON public.payment_proofs TO authenticated;
GRANT SELECT ON public.files TO authenticated;

-- ============================================================
-- 6) Verification — inspect policies and privileges after applying.
-- ============================================================

SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'billings',
    'billing_engagements',
    'payments',
    'payment_proofs',
    'billing_code_counters',
    'files'
  )
ORDER BY tablename, policyname;

SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN (
    'billings',
    'billing_engagements',
    'payments',
    'payment_proofs',
    'billing_code_counters',
    'files'
  )
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;
