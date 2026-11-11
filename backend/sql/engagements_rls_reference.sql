-- Reference copy — apply manually via the Supabase SQL editor.
-- Live DB is the source of truth; this file only records the intended change.
--
-- RLS for public.engagements.
-- SUPERSEDES engagement_status_rls_reference.sql — that file's UPDATE-only
-- policy is re-created here (extended with is_active_user()); stop applying
-- the old file once this one is in place.
--
-- Access matrix enforced here:
--   SELECT  all firm roles (admin/staff/billing_officer) — dashboards,
--           list pages, reports, usage counts; clients only engagements of
--           businesses they own (getMyEngagements, and strict scoping of
--           the unfiltered calendar queries / raw-id detail fetch, which
--           matches the stated intent at ClientCalendarPage.jsx:212-213).
--   INSERT  admin + staff — only meaningful if the live create RPCs are
--           SECURITY INVOKER (discovery 0e reveals this; no direct
--           .insert() on engagements exists anywhere in the repo).
--   UPDATE  status: admin, or the assigned staff member on their own row
--           (stage change + cancel UI). assigned_staff / start_date /
--           due_date / fee: ADMIN ONLY — enforced by the guard trigger,
--           closing the column gap documented at
--           engagement_status_rls_reference.sql:67-69. Clients and
--           billing officers never update.
--   DELETE  nobody (no delete path exists in the repo).
--
-- Column-level rules RLS cannot express are enforced by the
-- engagements_guard_update trigger: immutable identity columns, admin-only
-- schedule/assignment/fee edits, and a terminal-status lock (completed /
-- cancelled can never be reopened from the browser).
--
-- Assumptions:
--   * has_role() / is_firm_user() / is_active_user() from
--     users_rls_reference.sql — re-created here with identical
--     signatures so application order between files does not matter.
--   * is_my_business() roots at businesses.owner_id = auth.uid() as
--     security definer — independent of the businesses file's RLS state.
--   * Service role (Express / supabaseAdmin) bypasses RLS; triggers still
--     fire for it — the guard trigger treats auth.uid() IS NULL as
--     privileged (service role, SQL editor, migrations).
--   * The AFTER triggers (log_engagement_status_change, notification
--     triggers if present on live) are SECURITY DEFINER and unaffected.
--
-- Residual risks (accepted):
--   * RLS cannot validate status TRANSITIONS (linear stage progression,
--     task preconditions) — that stays UI-only, as today.
--   * If the live create RPCs are SECURITY INVOKER, they also insert
--     engagement_tasks — that table has no RLS file yet (follow-up); see
--     section 8.

-- ============================================================
-- 0) Discovery — run first, review output before applying.
-- ============================================================

-- 0a. Current policies on engagements (and engagement_tasks, which an
--     invoker RPC would also write).
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('engagements', 'engagement_tasks')
ORDER BY tablename, policyname;

-- 0b. Live engagements columns vs the intended DDL.
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'engagements'
ORDER BY ordinal_position;

-- 0c. FK inventory both directions.
SELECT c.conrelid::regclass  AS referencing_table,
       a.attname             AS referencing_column,
       c.confrelid::regclass AS referenced_table,
       c.conname             AS constraint_name
FROM pg_constraint c
JOIN pg_attribute a
  ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
WHERE c.contype = 'f'
  AND (c.confrelid = 'public.engagements'::regclass
       OR c.conrelid  = 'public.engagements'::regclass)
ORDER BY 1, 2;

-- 0d. Table privileges.
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'engagements'
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY grantee, privilege_type;

-- 0e. CREATE RPC security type — decisive for whether the INSERT policy
--     below is load-bearing. prosecdef = true  => SECURITY DEFINER
--     (bypasses RLS; policy is belt-and-suspenders).
--     prosecdef = false => SECURITY INVOKER (policy MUST allow the caller).
--     Also run \df+ create_engagement and \df+ create_standalone_engagement
--     in psql for the full definitions.
SELECT p.proname,
       p.prosecdef                          AS is_security_definer,
       pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('create_engagement', 'create_standalone_engagement')
ORDER BY p.proname;

-- 0f. Live engagement_status enum values (confirm the five canonical
--     stages plus anything legacy before writing the terminal lock).
SELECT unnest(enum_range(NULL::engagement_status)) AS status_value;

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
    ('engagements','engagement_id'), ('engagements','business_id'),
    ('engagements','service_id'), ('engagements','assigned_staff'),
    ('engagements','engagement_code'), ('engagements','status'),
    ('engagements','fee'), ('engagements','start_date'),
    ('engagements','due_date'), ('engagements','created_at')
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
ALTER TABLE public.engagements ENABLE ROW LEVEL SECURITY;
-- No FORCE: the table owner / migrations keep full access.

-- ============================================================
-- 3) Helper functions — re-created with the SAME signatures as
--    users_rls_reference.sql / businesses_rls_reference.sql
--    (idempotent) so application order between files does not matter.
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

-- Client scope for engagements: does the caller own this business?
-- security definer rooted at businesses.owner_id so it works regardless
-- of the businesses table's RLS state (same rationale as
-- client_referenced_user in the users file).
CREATE OR REPLACE FUNCTION public.is_my_business(p_business_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.businesses
    WHERE business_id = p_business_id
      AND owner_id = auth.uid()
  );
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(text)         FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_firm_user()         FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_active_user()       FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_my_business(uuid)   FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.has_role(text)         TO authenticated;
GRANT  EXECUTE ON FUNCTION public.is_firm_user()         TO authenticated;
GRANT  EXECUTE ON FUNCTION public.is_active_user()       TO authenticated;
GRANT  EXECUTE ON FUNCTION public.is_my_business(uuid)   TO authenticated;

-- ============================================================
-- 4) Drop every existing policy on engagements — permissive policies
--    OR-combine, so a stale broad policy would defeat these. This also
--    removes the UPDATE policy from engagement_status_rls_reference.sql
--    (re-created below, extended with is_active_user()).
-- ============================================================
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'engagements'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.engagements', pol.policyname);
  END LOOP;
END $$;

-- ============================================================
-- 5) Policies (TO authenticated; anon gets nothing here).
-- ============================================================

-- engagements: firm roles see all rows (unfiltered dashboards/lists);
-- clients see only engagements of businesses they own.
CREATE POLICY engagements_select_firm_or_owner
ON public.engagements FOR SELECT
TO authenticated
USING (
  public.is_active_user()
  AND (
    public.is_firm_user()
    OR public.is_my_business(business_id)
  )
);

-- engagements: admin may update any row; the assigned staff member may
-- update their own row (status transitions + cancel). The guard trigger
-- then restricts WHICH columns each of them may change. Clients and
-- billing officers match no rows. The is_firm_user() conjunct stops a
-- client id that somehow became assigned_staff from writing.
CREATE POLICY engagements_update_admin_or_assigned
ON public.engagements FOR UPDATE
TO authenticated
USING (
  public.is_active_user()
  AND (
    public.has_role('admin')
    OR (assigned_staff = auth.uid() AND public.is_firm_user())
  )
)
WITH CHECK (
  public.is_active_user()
  AND (
    public.has_role('admin')
    OR (assigned_staff = auth.uid() AND public.is_firm_user())
  )
);

-- engagements: creation goes through create_engagement /
-- create_standalone_engagement RPCs. If those are SECURITY INVOKER
-- (discovery 0e), this policy is what authorizes the caller; if they are
-- DEFINER, it is belt-and-suspenders. Scope matches the UI: admin-only
-- for create-from-request, admin+staff for standalone; billing_officer
-- excluded (canManageEngagements). No direct .insert() exists in code.
CREATE POLICY engagements_insert_admin_or_staff
ON public.engagements FOR INSERT
TO authenticated
WITH CHECK (
  public.is_active_user()
  AND (public.has_role('admin') OR public.has_role('staff'))
);

-- engagements: no browser-side deletes (none exist in the repo).
CREATE POLICY engagements_delete_blocked
ON public.engagements FOR DELETE
TO authenticated
USING (false);

-- RLS controls which ROWS can be updated, while grants control which
-- COLUMNS browser clients can submit. Identity columns stay
-- service-role/SQL-editor only (the trigger enforces the same); INSERT
-- privileges are untouched so the create RPCs can still set
-- business_id/service_id/engagement_code/created_at.
REVOKE UPDATE ON public.engagements FROM authenticated;
GRANT UPDATE (
  status,
  assigned_staff,
  start_date,
  due_date,
  fee
) ON public.engagements TO authenticated;

-- ============================================================
-- 6) Guard trigger — column rules RLS cannot express.
-- ============================================================
CREATE OR REPLACE FUNCTION public.engagements_guard_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Service role / SQL editor / migrations: no end-user JWT → privileged.
  -- (Triggers fire even for service-role writes, so this bypass is needed;
  -- it also keeps the SECURITY DEFINER AFTER triggers working.)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Deactivated callers get no browser writes at all (their JWT may
  -- still be valid until refresh). RLS is_active_user() also blocks
  -- them — defense-in-depth, mirroring the other guard triggers.
  IF EXISTS (
    SELECT 1 FROM public.users
    WHERE user_id = auth.uid() AND status = 'deactivated'
  ) THEN
    RAISE EXCEPTION 'deactivated users cannot update the engagements table';
  END IF;

  IF NEW.engagement_id IS DISTINCT FROM OLD.engagement_id THEN
    RAISE EXCEPTION 'engagements.engagement_id is immutable';
  END IF;

  IF NEW.business_id IS DISTINCT FROM OLD.business_id THEN
    RAISE EXCEPTION 'engagements.business_id is immutable';
  END IF;

  IF NEW.service_id IS DISTINCT FROM OLD.service_id THEN
    RAISE EXCEPTION 'engagements.service_id is immutable';
  END IF;

  IF NEW.engagement_code IS DISTINCT FROM OLD.engagement_code THEN
    RAISE EXCEPTION 'engagements.engagement_code is immutable';
  END IF;

  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'engagements.created_at is immutable';
  END IF;

  -- Terminal statuses can never be reopened from the browser — mirrors
  -- the UI (no reopen path exists for completed/cancelled).
  IF OLD.status IN ('completed', 'cancelled')
     AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'engagement is in a terminal status (%); cannot change status', OLD.status;
  END IF;

  -- Schedule / assignment / fee are admin-only in the UI
  -- (canEditEngagementDetails = admin, EngagementDetailsPage.jsx:88;
  -- fee has no update path at all). The row-level policy alone would let
  -- the assigned staff member write these — this closes the gap
  -- documented at engagement_status_rls_reference.sql:67-69.
  IF (NEW.assigned_staff IS DISTINCT FROM OLD.assigned_staff
      OR NEW.start_date   IS DISTINCT FROM OLD.start_date
      OR NEW.due_date     IS DISTINCT FROM OLD.due_date
      OR NEW.fee          IS DISTINCT FROM OLD.fee)
     AND NOT public.has_role('admin') THEN
    RAISE EXCEPTION 'only admins may change engagements assigned_staff/schedule/fee';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS engagements_guard_update ON public.engagements;
CREATE TRIGGER engagements_guard_update
  BEFORE UPDATE ON public.engagements
  FOR EACH ROW EXECUTE FUNCTION public.engagements_guard_update();

-- ============================================================
-- 7) Verification — run each block separately (an error aborts that
--    block's transaction). Replace the placeholders first:
--      <ADMIN>         a user with role 'admin'
--      <ASSIGNED>      a user with role 'staff', assigned_staff on <ENG>
--      <OTHER_STAFF>   a user with role 'staff', NOT assigned to <ENG>
--      <BO>            a user with role 'billing_officer'
--      <CLIENT>        a client who owns <MY_BIZ>
--      <ENG>           an engagement in a NON-terminal status, assigned
--                      to <ASSIGNED>, belonging to <MY_BIZ>
--      <FOREIGN_ENG>   an engagement of a business <CLIENT> does NOT own
--    Each block sets request.jwt.claims for auth.uid(). If probes come
--    back empty (older Supabase auth.uid reads a different GUC), also
--    add: SET LOCAL request.jwt.claim.sub = '<UUID>';
-- ============================================================

-- 7a. Discovery: policies now in place + RPC security types.
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'engagements'
ORDER BY policyname;

SELECT p.proname, p.prosecdef AS is_security_definer
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('create_engagement', 'create_standalone_engagement');

-- 7b. As the client: reads scoped to own-business engagements.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<CLIENT>","role":"authenticated"}';
SELECT 'mine'     AS probe, count(*) FROM public.engagements WHERE engagement_id = '<ENG>';         -- expect 1
SELECT 'foreign'  AS probe, count(*) FROM public.engagements WHERE engagement_id = '<FOREIGN_ENG>'; -- expect 0
SELECT 'visible'  AS probe, count(*) FROM public.engagements;  -- expect: only engagements of <CLIENT>'s businesses
UPDATE public.engagements SET status = 'cancelled' WHERE engagement_id = '<ENG>';  -- expect 0 rows (no UPDATE match)
COMMIT;

-- 7c. As the client: insert denied by RLS.
--     expect ERROR: new row violates row-level security policy for table engagements
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<CLIENT>","role":"authenticated"}';
INSERT INTO public.engagements (business_id, service_id, start_date, due_date)
VALUES ('<MY_BIZ>', '00000000-0000-0000-0000-000000000000', CURRENT_DATE, CURRENT_DATE + 7);
COMMIT;

-- 7d. As the client: delete denied (0 rows — no DELETE policy).
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<CLIENT>","role":"authenticated"}';
DELETE FROM public.engagements WHERE engagement_id = '<ENG>';
COMMIT;

-- 7e. As assigned staff: status change on own engagement succeeds
--     (select re-read needs SELECT too — expect 1 row).
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<ASSIGNED>","role":"authenticated"}';
UPDATE public.engagements SET status = 'for_validation'
WHERE engagement_id = '<ENG>' AND assigned_staff = '<ASSIGNED>'
RETURNING engagement_id;                                             -- expect 1 row
UPDATE public.engagements SET status = 'document_collection'
WHERE engagement_id = '<ENG>' AND assigned_staff = '<ASSIGNED>';     -- restore, expect 1 row
COMMIT;

-- 7f. As assigned staff: schedule/assignment/fee edits blocked by the
--     guard trigger (even on their own engagement).
--     expect ERROR: only admins may change engagements assigned_staff/schedule/fee
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<ASSIGNED>","role":"authenticated"}';
UPDATE public.engagements SET due_date = due_date + 7 WHERE engagement_id = '<ENG>';
COMMIT;

-- 7g. As non-assigned staff: status change matches no rows (RLS).
--     expect 0 rows
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<OTHER_STAFF>","role":"authenticated"}';
UPDATE public.engagements SET status = 'cancelled' WHERE engagement_id = '<ENG>';
COMMIT;

-- 7h. As non-assigned staff: full SELECT visibility (firm directory).
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<OTHER_STAFF>","role":"authenticated"}';
SELECT 'visible' AS probe, count(*) FROM public.engagements;  -- expect: total row count
COMMIT;

-- 7i. As billing officer: read-only.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<BO>","role":"authenticated"}';
SELECT 'visible' AS probe, count(*) FROM public.engagements;  -- expect: total row count
UPDATE public.engagements SET status = 'cancelled' WHERE engagement_id = '<ENG>';  -- expect 0 rows
COMMIT;

-- 7j. As admin: schedule/assignment edit succeeds; rolled back to leave
--     data clean. (fee left untouched — flip it here if you want to
--     probe that column too.)
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<ADMIN>","role":"authenticated"}';
UPDATE public.engagements SET due_date = due_date + 7 WHERE engagement_id = '<ENG>';  -- expect 1 row
UPDATE public.engagements SET due_date = due_date - 7 WHERE engagement_id = '<ENG>';  -- restore, expect 1 row
COMMIT;

-- 7k. Terminal lock: admin cannot reopen a completed engagement.
--     expect ERROR: engagement is in a terminal status (completed)...
--     (Runs as admin so only the terminal rule can fire; restore within
--     the same transaction is impossible after RAISE, so the UPDATE pair
--     below is sequenced so the failing statement comes second.)
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<ADMIN>","role":"authenticated"}';
UPDATE public.engagements SET status = 'completed' WHERE engagement_id = '<ENG>';     -- expect 1 row
UPDATE public.engagements SET status = 'in_progress' WHERE engagement_id = '<ENG>';   -- expect ERROR (terminal lock)
ROLLBACK;  -- undoes the completed flip too, leaving data clean (no COMMIT — the
           -- error already aborted the transaction; COMMIT after ROLLBACK errors)

-- 7l. As admin: identity columns blocked by the column grant.
--     expect ERROR: permission denied for column business_id
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<ADMIN>","role":"authenticated"}';
UPDATE public.engagements SET business_id = '<MY_BIZ>' WHERE engagement_id = '<ENG>';
COMMIT;

-- 7m. Deactivated assigned staff sees nothing and cannot write.
--     First (as admin): UPDATE public.users SET status='deactivated' WHERE user_id='<ASSIGNED>';
--     Then run this block, then restore status='active'.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<ASSIGNED>","role":"authenticated"}';
SELECT 'deactivated' AS probe, count(*) FROM public.engagements;  -- expect 0
UPDATE public.engagements SET status = 'cancelled' WHERE engagement_id = '<ENG>';  -- expect 0 rows
COMMIT;

-- ============================================================
-- 8) Notes
-- ============================================================
-- * SUPERSEDES engagement_status_rls_reference.sql: same admin-or-
--   assigned UPDATE rule, now with is_active_user(), plus SELECT/INSERT/
--   DELETE policies, column grants, and the guard trigger. Stop applying
--   the old file.
-- * CREATE RPCs (discovery 0e): if create_engagement or
--   create_standalone_engagement is SECURITY INVOKER, the INSERT policy
--   above authorizes the engagement row — but the historical
--   create_standalone_engagement also INSERTs engagement_tasks, which has
--   no RLS file yet. Verify with \df+; if invoker and engagement_tasks
--   has RLS enabled, either give engagement_tasks an INSERT policy
--   (follow-up file) or ALTER the RPC to SECURITY DEFINER.
-- * Client calendar pages (ClientCalendarPage.jsx:219,
--   ClientBillingCalendarPage.jsx:400) call the unfiltered
--   getEngagements() — under this policy they now return only the
--   client's own engagements, which is the stated intent
--   (ClientCalendarPage.jsx:212-213). ClientEngagementDetailPage's
--   raw-id getEngagement() returns null/empty for foreign ids — correct.
-- * Embeds: PostgREST applies the already-applied businesses/users
--   policies to businesses(...) and assignedStaffUser:users(...) inside
--   engagement queries — no extra work here. is_my_business() is
--   security definer, so this file has no ordering dependency on the
--   businesses file.
-- * updateEngagementDetails does a pre-SELECT then UPDATE, and
--   updateEngagementStatus re-selects after the write — both need SELECT
--   on the same row, covered by engagements_select_firm_or_owner.
-- * Browser-side logEngagementActivity INSERTs into engagement_activity
--   (engagementAPI.js:116) — that table needs its own INSERT policy in a
--   follow-up file; the SECURITY DEFINER logging triggers are unaffected.
-- * Status TRANSITION validation (linear stages, task preconditions)
--   stays UI-only — this file gates roles and columns, not the workflow
--   graph. Service role (Express) bypasses RLS; backend deliverable/
--   document guards keep their own role checks.
-- * Rollback: drop the policies from discovery 0a, the trigger
--   engagements_guard_update, and restore column grants with
--   GRANT UPDATE ON public.engagements TO authenticated; helpers can
--   stay.
