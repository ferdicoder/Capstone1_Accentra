-- Engagements UPDATE hardening — reference copy.
-- Apply manually via the Supabase SQL editor (live DB is the source of truth).
--
-- Purpose: enforce at the database level what the frontend already gates in
-- the UI — only the admin or the staff member assigned to an engagement
-- (assigned_staff) may UPDATE its row (status transitions, schedule, staff).
-- Without this, any authenticated firm user can write engagements.status
-- directly with the publishable key.
--
-- NOT covered here: SELECT / INSERT policies, other tables, and the client
-- portal. Review the discovery query below before applying so you know which
-- existing UPDATE policies this replaces.

-- 1) Discovery: list the current policies on engagements.
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'engagements'
ORDER BY policyname;

-- 2) Make sure RLS is on (no-op if already enabled).
ALTER TABLE public.engagements ENABLE ROW LEVEL SECURITY;

-- 3) Drop every existing UPDATE policy on engagements so the new restriction
--    actually binds (permissive policies are OR-combined — leaving an old
--    "all staff" UPDATE policy in place would defeat the new one).
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'engagements'
      AND cmd = 'UPDATE'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.engagements', pol.policyname);
  END LOOP;
END $$;

-- 4) New policy: admin role, or the assigned staff member.
--    Assumes user_roles.role holds 'admin' | 'staff' | ... and that
--    auth.uid() equals users.user_id (same identity files.uploaded_by uses).
CREATE POLICY engagements_update_admin_or_assigned
ON public.engagements
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
  OR assigned_staff = auth.uid()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
  OR assigned_staff = auth.uid()
);

-- Notes:
-- * The backend's service role bypasses RLS, so Express endpoints (deliverable
--   upload/delete, etc.) must keep their own role checks — this policy only
--   covers browser-side writes.
-- * RLS cannot distinguish WHICH columns changed: an assigned staff member
--   allowed by this policy can update any column of their engagement, not just
--   status. The frontend remains the guard for admin-only edits (staff/schedule).
-- * Engagement creation goes through RPCs; if any RPC is SECURITY INVOKER it
--   needs its own INSERT policy — verify with \df+ before removing anything.
