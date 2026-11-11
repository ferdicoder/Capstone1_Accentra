-- Reference copy — apply manually via the Supabase SQL editor.
-- Live DB is the source of truth; this file only records the intended change.
--
-- RLS for public.users (+ the user_roles / roles read policies it depends on).
--
-- Access matrix enforced here:
--   SELECT  self; all rows for firm roles (admin/staff/billing_officer);
--           clients only rows referenced by their own data (assigned staff,
--           document uploaders, activity actors on their engagements) —
--           required for portal embeds (engagementAPI, documentAPI).
--   UPDATE  self (profile fields) or admin (any row, incl. status flips —
--           the UI gates these but no backend endpoint exists, so RLS is
--           the only enforcement layer).
--   INSERT  nobody (rows are created only by the security-definer signup
--           trigger on auth.users).
--   DELETE  nobody.
--
-- Column-level rules RLS cannot express are enforced by the
-- users_guard_update trigger: immutable user_id/created_at, admin-only
-- status changes, no self email changes, no writes by deactivated callers.
--
-- Assumptions:
--   * users.user_id = auth.uid() (signup trigger inserts from auth.users).
--   * has_role() from firm_settings.sql (re-created here, idempotent).
--   * Service role (Express / supabaseAdmin) bypasses RLS; triggers still
--     fire for it — the guard trigger treats auth.uid() IS NULL as
--     privileged (service role, SQL editor, migrations).
--   * Browser UPDATE privileges are explicitly limited to fields used by
--     the frontend. The trigger remains the column/value-level guard for
--     immutable fields, status, and self email changes.
--
-- Residual risks (accepted):
--   * PostgREST column selection is not row-policy-controlled: a client
--     could directly SELECT birthdate/email of a referenced staff row
--     (portal embeds only request names). Splitting that would need
--     per-user PostgreSQL roles — out of scope.
--   * Admin edits to another user's email do not sync auth.users.email.

-- ============================================================
-- 0) Discovery — run first, review output before applying.
-- ============================================================

-- 0a. Current policies on the three tables.
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'user_roles', 'roles')
ORDER BY tablename, policyname;

-- 0b. Live users columns vs the intended DDL.
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- 0c. Every FK that could feed a "referenced row" chain (surfaces chains
--     missed by code reading, e.g. audit_logs).
SELECT c.conrelid::regclass  AS referencing_table,
       a.attname             AS referencing_column,
       c.confrelid::regclass AS referenced_table,
       c.conname             AS constraint_name
FROM pg_constraint c
JOIN pg_attribute a
  ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
WHERE c.contype = 'f'
  AND c.confrelid IN ('auth.users'::regclass, 'public.users'::regclass)
ORDER BY 1, 2;

-- 0d. Table privileges (Supabase default grants should already give
--     SELECT/UPDATE to authenticated; RLS is the actual control).
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('users', 'user_roles', 'roles')
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;

-- ============================================================
-- 1) Pre-flight: the reference chains below assume these columns.
--    Fails loudly if the live schema has drifted.
-- ============================================================
DO $$
DECLARE
  missing text;
BEGIN
  SELECT string_agg(format('%I.%I', t.table_name, t.column_name), ', ' ORDER BY 1)
  INTO missing
  FROM (VALUES
    ('users','user_id'), ('users','first_name'), ('users','middle_name'),
    ('users','last_name'), ('users','email'), ('users','contact_no'),
    ('users','status'),
    ('users','created_at'),
    ('user_roles','user_id'), ('user_roles','role'),
    ('businesses','business_id'), ('businesses','owner_id'),
    ('engagements','engagement_id'), ('engagements','business_id'),
    ('engagements','assigned_staff'),
    ('engagement_tasks','engagement_task_id'), ('engagement_tasks','engagement_id'),
    ('engagement_task_submissions','engagement_task_id'),
    ('engagement_task_submissions','file_id'),
    ('files','file_id'), ('files','uploaded_by'),
    ('engagement_activity','engagement_id'), ('engagement_activity','actor_id')
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
ALTER TABLE public.users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles       ENABLE ROW LEVEL SECURITY;
-- No FORCE: the table owner / migrations keep full access.

-- ============================================================
-- 3) Helper functions (security definer so policies can check roles
--    and cross-table references without tripping RLS on user_roles /
--    engagements / ... — same rationale as firm_settings.sql:43).
-- ============================================================

-- Same contract as firm_settings.sql (re-created idempotently).
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

-- Firm roles: the directory / management portals.
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

-- Browser access is revoked for deactivated accounts. This helper is
-- security definer so checking the caller's users row does not depend on
-- the users table's own RLS policy.
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

-- True when `target` is referenced by the caller's own (client) data:
--   1. assigned staff on an engagement of one of my businesses
--   2. uploader of a file submitted on a task of one of my engagements
--   3. actor on activity of one of my engagements
-- Rooted at businesses.owner_id = auth.uid() so it works regardless of
-- the RLS state of engagements/files/etc. (no dependency ordering).
CREATE OR REPLACE FUNCTION public.client_referenced_user(target uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.engagements e
    WHERE e.assigned_staff = target
      AND EXISTS (
        SELECT 1 FROM public.businesses b
        WHERE b.business_id = e.business_id
          AND b.owner_id = auth.uid()
      )
  )
  OR EXISTS (
    SELECT 1
    FROM public.engagement_task_submissions s
    JOIN public.engagement_tasks t
      ON t.engagement_task_id = s.engagement_task_id
    JOIN public.files f ON f.file_id = s.file_id
    JOIN public.engagements e ON e.engagement_id = t.engagement_id
    JOIN public.businesses b  ON b.business_id = e.business_id
    WHERE f.uploaded_by = target
      AND b.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.engagement_activity a
    JOIN public.engagements e ON e.engagement_id = a.engagement_id
    JOIN public.businesses b  ON b.business_id = e.business_id
    WHERE a.actor_id = target
      AND b.owner_id = auth.uid()
  );
$$;

-- Lock helpers down: authenticated only (policies run as the caller;
-- the backend never uses these — service role bypasses RLS).
REVOKE EXECUTE ON FUNCTION public.has_role(text)               FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_firm_user()               FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_active_user()             FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.client_referenced_user(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.has_role(text)               TO authenticated;
GRANT  EXECUTE ON FUNCTION public.is_firm_user()               TO authenticated;
GRANT  EXECUTE ON FUNCTION public.is_active_user()             TO authenticated;
GRANT  EXECUTE ON FUNCTION public.client_referenced_user(uuid) TO authenticated;

-- ============================================================
-- 4) Drop every existing policy on the three tables — permissive
--    policies OR-combine, so a stale broad policy would defeat these.
-- ============================================================
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('users', 'user_roles', 'roles')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ============================================================
-- 5) Policies (TO authenticated; anon gets nothing here).
-- ============================================================

-- users: self, any firm user (directory + client management), or a row
-- the client's own data references (portal embeds).
CREATE POLICY users_select_self_firm_or_referenced
ON public.users FOR SELECT
TO authenticated
USING (
  public.is_active_user()
  AND (
    user_id = auth.uid()
    OR public.is_firm_user()
    OR public.client_referenced_user(user_id)
  )
);

-- users: self (profile edits) or admin (incl. status flips — the only
-- enforcement layer; no backend endpoint exists for status changes).
CREATE POLICY users_update_self_or_admin
ON public.users FOR UPDATE
TO authenticated
USING (
  public.is_active_user()
  AND (user_id = auth.uid() OR public.has_role('admin'))
)
WITH CHECK (
  public.is_active_user()
  AND (user_id = auth.uid() OR public.has_role('admin'))
);

-- users: rows are inserted only by the security-definer signup trigger.
CREATE POLICY users_insert_blocked
ON public.users FOR INSERT
TO authenticated
WITH CHECK (false);

-- users: no browser-side deletes.
CREATE POLICY users_delete_blocked
ON public.users FOR DELETE
TO authenticated
USING (false);

-- user_roles: own row (setUserRole on every session) + firm rows
-- (the user_roles!inner joins in getUsers / getBusinesses).
-- Writes stay backend-only → no write policies (deny by default).
CREATE POLICY user_roles_select_self_or_firm
ON public.user_roles FOR SELECT
TO authenticated
USING (
  public.is_active_user()
  AND (user_id = auth.uid() OR public.is_firm_user())
);

-- roles: catalog read for the user-management UI.
CREATE POLICY roles_select_firm
ON public.roles FOR SELECT
TO authenticated
USING (public.is_active_user() AND public.is_firm_user());

-- RLS controls which rows can be updated, while grants control which
-- columns browser clients can submit. Admin status/email edits remain
-- available; the trigger below rejects those operations for non-admins
-- and rejects self email changes.
REVOKE UPDATE ON public.users FROM authenticated;
GRANT UPDATE (
  first_name,
  middle_name,
  last_name,
  email,
  contact_no,
  status
) ON public.users TO authenticated;

-- ============================================================
-- 6) Guard trigger — column rules RLS cannot express.
-- ============================================================
CREATE OR REPLACE FUNCTION public.users_guard_update()
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
  -- still be valid until refresh).
  IF EXISTS (
    SELECT 1 FROM public.users
    WHERE user_id = auth.uid() AND status = 'deactivated'
  ) THEN
    RAISE EXCEPTION 'deactivated users cannot update the users table';
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'users.user_id is immutable';
  END IF;

  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'users.created_at is immutable';
  END IF;

  -- status flips are admin-only (matches UI: admin routes / canManageClients).
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NOT public.has_role('admin') THEN
    RAISE EXCEPTION 'only admins may change users.status';
  END IF;

  -- email is the auth identifier: self-service changes would desync
  -- from auth.users with no verification. Admins may edit others'.
  IF NEW.email IS DISTINCT FROM OLD.email
     AND NEW.user_id = auth.uid() THEN
    RAISE EXCEPTION 'users cannot change their own email';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS users_guard_update ON public.users;
CREATE TRIGGER users_guard_update
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.users_guard_update();

-- ============================================================
-- 7) Verification — run each block separately (an error aborts that
--    block's transaction). Replace the UUIDs first:
--      <CLIENT>  a user with role 'client'
--      <ADMIN>   a user with role 'admin'
--      <STAFF>   a user with role 'staff'
--      <OTHER>   a different client the <CLIENT> does not own
--    Each block sets request.jwt.claims for auth.uid(). If probes come
--    back empty (older Supabase auth.uid reads a different GUC), also
--    add: SET LOCAL request.jwt.claim.sub = '<UUID>';
-- ============================================================

-- 7a. Discovery: policies now in place.
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'user_roles', 'roles')
ORDER BY tablename, policyname;

-- 7b. As a client: reads are scoped (self + referenced only).
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<CLIENT>","role":"authenticated"}';
SELECT 'self'        AS probe, count(*) FROM public.users WHERE user_id = '<CLIENT>';   -- expect 1
SELECT 'other'       AS probe, count(*) FROM public.users WHERE user_id = '<OTHER>';    -- expect 0
SELECT 'own_role'    AS probe, count(*) FROM public.user_roles WHERE user_id = '<CLIENT>'; -- expect 1
SELECT 'all_roles'   AS probe, count(*) FROM public.user_roles;                         -- expect 1 (own row only)
SELECT 'visible'     AS probe, count(*) FROM public.users;                              -- expect 1 + referenced staff/uploaders/actors
COMMIT;

-- 7c. As a client: self profile edit succeeds.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<CLIENT>","role":"authenticated"}';
UPDATE public.users SET first_name = first_name WHERE user_id = '<CLIENT>';  -- expect 1 row
COMMIT;

-- 7c.1. Temporarily deactivate the probe client as an admin.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<ADMIN>","role":"authenticated"}';
UPDATE public.users SET status = 'deactivated' WHERE user_id = '<CLIENT>';
COMMIT;

-- 7c.2. A deactivated caller cannot read users, roles, or user_roles.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<CLIENT>","role":"authenticated"}';
SELECT 'deactivated_users' AS probe, count(*) FROM public.users; -- expect 0
SELECT 'deactivated_user_roles' AS probe, count(*) FROM public.user_roles; -- expect 0
SELECT 'deactivated_roles' AS probe, count(*) FROM public.roles; -- expect 0
COMMIT;

-- 7c.3. Restore the probe client.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<ADMIN>","role":"authenticated"}';
UPDATE public.users SET status = 'active' WHERE user_id = '<CLIENT>';
COMMIT;

-- 7d. As a client: status flip blocked by the guard trigger.
--     expect ERROR: only admins may change users.status
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<CLIENT>","role":"authenticated"}';
UPDATE public.users SET status = 'inactive' WHERE user_id = '<CLIENT>';
COMMIT;

-- 7e. As a client: self email change blocked by the guard trigger.
--     expect ERROR: users cannot change their own email
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<CLIENT>","role":"authenticated"}';
UPDATE public.users SET email = 'probe@example.com' WHERE user_id = '<CLIENT>';
COMMIT;

-- 7f. As a client: cannot touch another user's row (RLS hides it).
--     expect 0 rows updated
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<CLIENT>","role":"authenticated"}';
UPDATE public.users SET first_name = 'X' WHERE user_id = '<OTHER>';
COMMIT;

-- 7g. As a client: insert denied by RLS.
--     expect ERROR: new row violates row-level security policy for table users
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<CLIENT>","role":"authenticated"}';
INSERT INTO public.users (user_id, first_name, last_name, birthdate, email)
VALUES ('<CLIENT>', 'Probe', 'Row', '2000-01-01', 'probe@example.com');
COMMIT;

-- 7h. As a client: delete denied (0 rows — no DELETE policy).
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<CLIENT>","role":"authenticated"}';
DELETE FROM public.users WHERE user_id = '<CLIENT>';
COMMIT;

-- 7i. As an admin: status flip works; rolled back to leave data clean.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<ADMIN>","role":"authenticated"}';
UPDATE public.users SET status = 'inactive' WHERE user_id = '<CLIENT>';  -- expect 1 row
UPDATE public.users SET status = 'active'   WHERE user_id = '<CLIENT>';  -- expect 1 row (restore)
COMMIT;

-- 7j. As an admin: user_id immutable even for admins.
--     expect ERROR: users.user_id is immutable
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<ADMIN>","role":"authenticated"}';
UPDATE public.users SET user_id = '<OTHER>' WHERE user_id = '<CLIENT>';
COMMIT;

-- 7k. As staff: full directory visible.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<STAFF>","role":"authenticated"}';
SELECT count(*) FROM public.users;   -- expect: total row count
SELECT count(*) FROM public.user_roles; -- expect: total row count
COMMIT;

-- ============================================================
-- 8) Notes
-- ============================================================
-- * Service role (Express / supabaseAdmin) bypasses RLS; backend
--   endpoints keep their own authUser + requireRole checks. The guard
--   trigger still fires for service-role writes — auth.uid() IS NULL
--   makes it a no-op for them (staff create sets status='inactive',
--   changeOwnPassword sets status='active').
-- * user_roles and roles have no write policies: browser writes are
--   denied by default; all writes already go through the service role
--   (staff create, role change in user.controller.js).
-- * Ordering: this file has no dependency on the RLS state of
--   engagements / files / ... — cross-table checks run security definer.
-- * The client SELECT policy also gates searchClients (direct users
--   query, no role filter): a client probing it only matches self +
--   referenced rows; firm roles match everything.
-- * Optional indexes if client_referenced_user shows up in EXPLAIN:
--     CREATE INDEX IF NOT EXISTS engagements_assigned_staff_idx
--       ON public.engagements (assigned_staff);
--     CREATE INDEX IF NOT EXISTS files_uploaded_by_idx
--       ON public.files (uploaded_by);
--     CREATE INDEX IF NOT EXISTS engagement_activity_actor_id_idx
--       ON public.engagement_activity (actor_id);
--   Verify with \d first — FK columns are often indexed already.
-- * Rollback: drop the policies/trigger from the discovery output in
--   step 0a and the trigger users_guard_update; helpers can stay.
