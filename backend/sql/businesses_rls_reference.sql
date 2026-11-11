-- Reference copy — apply manually via the Supabase SQL editor.
-- Live DB is the source of truth; this file only records the intended change.
--
-- RLS for public.businesses.
--
-- Access matrix enforced here:
--   SELECT  owner of the row; all firm roles (admin/staff/billing_officer)
--           — firm dashboards, billing, client search, and the
--           businesses(...) embeds on engagements / service_requests.
--   INSERT  owner only (owner_id = auth.uid()) — createMyBusiness from the
--           client profile page. Signup-row creation goes through the
--           security-definer trigger on auth.users (bypasses RLS).
--   UPDATE  owner of the row (profile columns), or admin (any row — the
--           type/retainer_fee classification, which updateBusinessType
--           writes with NO role check in code; RLS + trigger is the only
--           enforcement). Staff / billing_officer are read-only.
--   DELETE  nobody (no delete path exists in the repo).
--
-- Column-level rules RLS cannot express are enforced by the
-- businesses_guard_update trigger: immutable business_id/owner_id, and
-- type/retainer_fee changes are admin-only (a client must not be able to
-- reclassify their own business as retainer). Column grants additionally
-- exclude business_id/owner_id from browser UPDATEs.
--
-- Assumptions:
--   * owner_id is UNIQUE => at most one business per user.
--   * has_role() / is_firm_user() / is_active_user() from
--     users_rls_reference.sql — re-created here with identical
--     signatures so application order between the two files does not
--     matter.
--   * Service role (Express / supabaseAdmin) bypasses RLS; triggers still
--     fire for it — the guard trigger treats auth.uid() IS NULL as
--     privileged (service role, SQL editor, migrations). Note: the
--     Express backend never touches businesses today.
--   * The table has no created_at column (per intended DDL) — no
--     created_at immutability rule, unlike users.
--
-- Residual risks (accepted):
--   * PostgREST column selection is not row-policy-controlled: any firm
--     user can SELECT tin_no / address of any business (the firm UI
--     already displays raw tin_no; column-level splits would need
--     per-user PostgreSQL roles — out of scope).
--   * Admin edits to profile columns (name, tin_no, ...) have no UI today
--     but are permitted by the policy; only type/retainer_fee is
--     actively written by the firm portal.

-- ============================================================
-- 0) Discovery — run first, review output before applying.
-- ============================================================

-- 0a. Current policies on businesses.
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'businesses'
ORDER BY policyname;

-- 0b. Live businesses columns vs the intended DDL.
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'businesses'
ORDER BY ordinal_position;

-- 0c. FK inventory both directions — tables referencing businesses
--     (embeds / later RLS files) and businesses referencing users.
SELECT c.conrelid::regclass  AS referencing_table,
       a.attname             AS referencing_column,
       c.confrelid::regclass AS referenced_table,
       c.conname             AS constraint_name
FROM pg_constraint c
JOIN pg_attribute a
  ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
WHERE c.contype = 'f'
  AND (c.confrelid = 'public.businesses'::regclass
       OR c.conrelid  = 'public.businesses'::regclass)
ORDER BY 1, 2;

-- 0d. Table privileges (Supabase default grants should already give
--     SELECT/INSERT/UPDATE to authenticated; RLS is the actual control).
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'businesses'
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY grantee, privilege_type;

-- ============================================================
-- 1) Pre-flight: the policies and trigger below assume these
--    columns. Fails loudly if the live schema has drifted.
-- ============================================================
DO $$
DECLARE
  missing text;
BEGIN
  SELECT string_agg(format('%I.%I', t.table_name, t.column_name), ', ' ORDER BY 1)
  INTO missing
  FROM (VALUES
    ('businesses','business_id'), ('businesses','owner_id'),
    ('businesses','name'), ('businesses','business_type'),
    ('businesses','type'), ('businesses','tin_no'),
    ('businesses','industry'), ('businesses','contact_no'),
    ('businesses','house_no'), ('businesses','street'),
    ('businesses','barangay'), ('businesses','district'),
    ('businesses','city'), ('businesses','zip_code'),
    ('businesses','retainer_fee')
  ) AS t(table_name, column_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name  = t.table_name
      AND c.column_name = t.column_name
  );

  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'live schema missing expected columns: %', missing;
  END IF;
END $$;

-- ============================================================
-- 2) Enable RLS.
-- ============================================================
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
-- No FORCE: the table owner / migrations keep full access.

-- ============================================================
-- 3) Helper functions — re-created with the SAME signatures as
--    users_rls_reference.sql (idempotent) so the two files can be
--    applied in either order.
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_role(required text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
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
    SELECT 1 FROM public.user_roles
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

REVOKE EXECUTE ON FUNCTION public.has_role(text)    FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_firm_user()    FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_active_user()  FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.has_role(text)    TO authenticated;
GRANT  EXECUTE ON FUNCTION public.is_firm_user()    TO authenticated;
GRANT  EXECUTE ON FUNCTION public.is_active_user()  TO authenticated;

-- ============================================================
-- 4) Drop every existing policy on businesses — permissive policies
--    OR-combine, so a stale broad policy would defeat these.
-- ============================================================
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'businesses'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.businesses', pol.policyname);
  END LOOP;
END $$;

-- ============================================================
-- 5) Policies (TO authenticated; anon gets nothing here).
-- ============================================================

-- businesses: owner sees own row; firm roles see all rows (directory,
-- billing, client search, engagement/service-request embeds).
CREATE POLICY businesses_select_owner_or_firm
ON public.businesses FOR SELECT
TO authenticated
USING (
  public.is_active_user()
  AND (
    owner_id = auth.uid()
    OR public.is_firm_user()
  )
);

-- businesses: owner updates own row (profile columns — type/retainer_fee
-- is held back by the guard trigger); admin updates any row (the
-- type/retainer_fee classification path, which has no role check in
-- code). Staff / billing_officer match no rows — read-only.
CREATE POLICY businesses_update_owner_or_admin
ON public.businesses FOR UPDATE
TO authenticated
USING (
  public.is_active_user()
  AND (owner_id = auth.uid() OR public.has_role('admin'))
)
WITH CHECK (
  public.is_active_user()
  AND (owner_id = auth.uid() OR public.has_role('admin'))
);

-- businesses: only a client creating their own row (createMyBusiness).
-- Signup rows come from the security-definer trigger on auth.users.
CREATE POLICY businesses_insert_own
ON public.businesses FOR INSERT
TO authenticated
WITH CHECK (
  public.is_active_user()
  AND owner_id = auth.uid()
);

-- businesses: no browser-side deletes (none exist in the repo).
CREATE POLICY businesses_delete_blocked
ON public.businesses FOR DELETE
TO authenticated
USING (false);

-- RLS controls which ROWS can be updated, while grants control which
-- COLUMNS browser clients can submit. business_id/owner_id stay
-- service-role/SQL-editor only (the trigger enforces the same); INSERT
-- privileges are untouched so createMyBusiness can still set owner_id.
REVOKE UPDATE ON public.businesses FROM authenticated;
GRANT UPDATE (
  name,
  business_type,
  type,
  tin_no,
  industry,
  contact_no,
  house_no,
  street,
  barangay,
  district,
  city,
  zip_code,
  retainer_fee
) ON public.businesses TO authenticated;

-- ============================================================
-- 6) Guard trigger — column rules RLS cannot express.
-- ============================================================
CREATE OR REPLACE FUNCTION public.businesses_guard_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Service role / SQL editor / migrations: no end-user JWT → privileged.
  -- (Triggers fire even for service-role writes, so this bypass is needed.)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Deactivated callers get no browser writes at all (their JWT may
  -- still be valid until refresh). RLS is_active_user() also blocks
  -- them — defense-in-depth, mirroring users_guard_update.
  IF EXISTS (
    SELECT 1 FROM public.users
    WHERE user_id = auth.uid() AND status = 'deactivated'
  ) THEN
    RAISE EXCEPTION 'deactivated users cannot update the businesses table';
  END IF;

  IF NEW.business_id IS DISTINCT FROM OLD.business_id THEN
    RAISE EXCEPTION 'businesses.business_id is immutable';
  END IF;

  IF NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
    RAISE EXCEPTION 'businesses.owner_id is immutable';
  END IF;

  -- Classification is admin-only: the owner may edit profile fields but
  -- must not reclassify their own business as retainer. updateBusinessType
  -- has no role check in code — this rule plus the RLS policy is the
  -- only enforcement.
  IF (NEW.type IS DISTINCT FROM OLD.type
      OR NEW.retainer_fee IS DISTINCT FROM OLD.retainer_fee)
     AND NOT public.has_role('admin') THEN
    RAISE EXCEPTION 'only admins may change businesses.type/retainer_fee';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS businesses_guard_update ON public.businesses;
CREATE TRIGGER businesses_guard_update
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.businesses_guard_update();

-- ============================================================
-- 7) Verification — run each block separately (an error aborts that
--    block's transaction). Replace the placeholders first:
--      <OWNER>        a client who owns a business (role 'client')
--      <ADMIN>        a user with role 'admin'
--      <STAFF>        a user with role 'staff' (read-only probe)
--      <OTHER_OWNER>  a different client who owns a business
--      <BIZ>          <OWNER>'s business_id
--      <OTHER_BIZ>    <OTHER_OWNER>'s business_id
--    Each block sets request.jwt.claims for auth.uid(). If probes come
--    back empty (older Supabase auth.uid reads a different GUC), also
--    add: SET LOCAL request.jwt.claim.sub = '<UUID>';
-- ============================================================

-- 7a. Discovery: policies now in place.
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'businesses'
ORDER BY policyname;

-- 7b. As the owner: reads are scoped to own row.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<OWNER>","role":"authenticated"}';
SELECT 'own'    AS probe, count(*) FROM public.businesses WHERE business_id = '<BIZ>';       -- expect 1
SELECT 'other'  AS probe, count(*) FROM public.businesses WHERE business_id = '<OTHER_BIZ>'; -- expect 0
SELECT 'visible' AS probe, count(*) FROM public.businesses;                                  -- expect 1
COMMIT;

-- 7c. As staff: full read, no writes.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<STAFF>","role":"authenticated"}';
SELECT 'visible' AS probe, count(*) FROM public.businesses;  -- expect: total row count
UPDATE public.businesses SET type = 'retainer' WHERE business_id = '<BIZ>';  -- expect 0 rows
COMMIT;

-- 7d. As the owner: profile edit succeeds.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<OWNER>","role":"authenticated"}';
UPDATE public.businesses SET name = name WHERE business_id = '<BIZ>';  -- expect 1 row
COMMIT;

-- 7e. As the owner: reclassification blocked by the guard trigger.
--     expect ERROR: only admins may change businesses.type/retainer_fee
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<OWNER>","role":"authenticated"}';
UPDATE public.businesses SET type = 'retainer', retainer_fee = 1000
WHERE business_id = '<BIZ>';
COMMIT;

-- 7f. As the owner: owner_id not updatable (column grant excludes it).
--     expect ERROR: permission denied for column owner_id
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<OWNER>","role":"authenticated"}';
UPDATE public.businesses SET owner_id = '<OTHER_OWNER>' WHERE business_id = '<BIZ>';
COMMIT;

-- 7g. As the owner: cannot touch another owner's row (RLS hides it).
--     expect 0 rows updated
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<OWNER>","role":"authenticated"}';
UPDATE public.businesses SET name = 'X' WHERE business_id = '<OTHER_BIZ>';
COMMIT;

-- 7h. As the owner: insert with a foreign owner_id blocked by RLS.
--     expect ERROR: new row violates row-level security policy for table businesses
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<OWNER>","role":"authenticated"}';
INSERT INTO public.businesses (owner_id, name, business_type, tin_no, industry,
                               contact_no, house_no, street, barangay, district,
                               city, zip_code)
VALUES ('<OTHER_OWNER>', 'Probe', 'Sole Proprietor', '000-000-000-000', 'Trade',
        '0000000000', '1', 'Main', 'Poblacion', '1st',
        'City', '0000');
COMMIT;

-- 7i. As the owner: delete denied (0 rows — no DELETE policy).
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<OWNER>","role":"authenticated"}';
DELETE FROM public.businesses WHERE business_id = '<BIZ>';
COMMIT;

-- 7j. As admin: classification flip works; rolled back to leave data clean.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<ADMIN>","role":"authenticated"}';
UPDATE public.businesses SET type = 'retainer', retainer_fee = 1000
WHERE business_id = '<BIZ>';                                                   -- expect 1 row
UPDATE public.businesses SET type = 'non-retainer', retainer_fee = NULL
WHERE business_id = '<BIZ>';                                                   -- expect 1 row (restore)
COMMIT;

-- 7k. As admin: owner_id still immutable (column grant, not role).
--     expect ERROR: permission denied for column owner_id
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<ADMIN>","role":"authenticated"}';
UPDATE public.businesses SET owner_id = '<OTHER_OWNER>' WHERE business_id = '<BIZ>';
COMMIT;

-- 7l. Deactivated owner sees nothing.
--     First (as admin): UPDATE public.users SET status='deactivated' WHERE user_id='<OWNER>';
--     Then run this block, then restore status='active'.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<OWNER>","role":"authenticated"}';
SELECT 'deactivated' AS probe, count(*) FROM public.businesses;  -- expect 0
COMMIT;

-- ============================================================
-- 8) Notes
-- ============================================================
-- * Service role (Express / supabaseAdmin) bypasses RLS — but the
--   Express backend never touches businesses today; every live write
--   path is browser-side and therefore fully covered here.
-- * updateBusinessType (businessAPI.js:167) has NO role check in code —
--   the businesses_update_owner_or_admin policy plus the guard trigger's
--   type/retainer_fee rule are the only enforcement. Staff and billing
--   officers match no UPDATE rows at all.
-- * Ordering: applying this file before/after users_rls_reference.sql
--   is safe — helpers are re-created with identical signatures, and
--   client_referenced_user (users file) reads businesses as security
--   definer, so it ignores this table's RLS.
-- * Embeds: PostgREST applies this policy to businesses(...) embeds on
--   engagements / service_requests. Clients embedding a foreign
--   engagement's business (e.g. the unfiltered getEngagements() on the
--   client calendar pages) will get business: null until engagements
--   SELECT RLS scopes those rows — expected, and a separate concern of
--   the engagements file.
-- * client_referenced_user in the users file roots at
--   businesses.owner_id = auth.uid() as security definer — no circular
--   dependency with this file.
-- * Rollback: drop the policies from the discovery output in step 0a,
--   the trigger businesses_guard_update, and restore column grants with
--   GRANT UPDATE ON public.businesses TO authenticated; helpers can
--   stay.
