-- audit_logs triggers — reference copy.
-- Apply manually via the Supabase SQL editor (live DB is the source of truth).
--
-- Replaces the application-level inserts that used to live in
-- backend/controllers/user.controller.js (user_created, user_role_changed,
-- password_changed) and adds auditing for:
--   * client retainer type / fee changes (businesses.type, businesses.retainer_fee)
--   * report CSV/PDF exports (via the log_report_export RPC)
--
-- audit_logs DDL (for reference — table already exists in the live DB):
--   create table public.audit_logs (
--     log_id uuid not null default gen_random_uuid(),
--     actor_id uuid null,
--     action text not null,
--     entity_type text null,
--     entity_id text null,
--     details jsonb null,
--     created_at timestamptz not null default now(),
--     constraint audit_logs_pkey primary key (log_id),
--     constraint audit_logs_actor_id_fkey foreign key (actor_id)
--       references auth.users (id)
--   );
--
-- Actor attribution:
--   * Browser writes carry the user's JWT  -> auth.uid().
--   * Service-role writes (Express supabaseAdmin) have auth.uid() IS NULL,
--     so the app passes the acting admin via an `x-actor-id` request header.
--     pgrst_pre_request() stashes it in transaction-local GUC app.actor_id;
--     current_actor_id() trusts it ONLY when the request JWT role is
--     service_role, so anon/authenticated callers cannot impersonate anyone.
--   * Staff creation: the actor is stored in auth.users.raw_app_meta_data
--     ->> 'created_by' (set by createStaff) because the audit trigger runs
--     inside auth.admin.createUser, before any app-controlled request.

-- ============================================================
-- 0) Drop anything from a previous apply (idempotent re-run).
-- ============================================================
DROP TRIGGER IF EXISTS trg_log_user_created ON public.user_roles;
DROP FUNCTION IF EXISTS public.log_user_created();

DROP TRIGGER IF EXISTS trg_log_user_role_changed ON public.user_roles;
DROP FUNCTION IF EXISTS public.log_user_role_changed();

DROP TRIGGER IF EXISTS trg_log_password_changed ON auth.users;
DROP FUNCTION IF EXISTS public.log_password_changed();

DROP TRIGGER IF EXISTS trg_log_client_retainer_changed ON public.businesses;
DROP FUNCTION IF EXISTS public.log_client_retainer_changed();

DROP FUNCTION IF EXISTS public.pgrst_pre_request();
DROP FUNCTION IF EXISTS public.current_actor_id();
DROP FUNCTION IF EXISTS public.log_report_export(text, text, integer, jsonb);

-- ============================================================
-- 1) Actor plumbing for service-role requests.
-- ============================================================

-- PostgREST calls pgrst_pre_request() before every request (Supabase
-- convention: function lives in the exposed public schema, no args,
-- returns void). set_config(..., true) is transaction-local — PostgREST
-- runs one request per transaction, so the GUC dies with the request.
CREATE OR REPLACE FUNCTION public.pgrst_pre_request()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_header text;
BEGIN
  BEGIN
    v_header := current_setting('request.headers', true)::json ->> 'x-actor-id';
  EXCEPTION WHEN OTHERS THEN
    v_header := NULL;
  END;
  PERFORM set_config('app.actor_id', COALESCE(v_header, ''), true);
END;
$$;

-- Resolves the acting user for audit rows.
--   1. auth.uid()              — browser JWT (retainer changes, report RPC).
--   2. app.actor_id            — only trusted for service_role requests
--                                (Express supabaseAdmin sending x-actor-id).
--   3. NULL                    — anything else.
CREATE OR REPLACE FUNCTION public.current_actor_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN auth.uid() IS NOT NULL THEN auth.uid()
    WHEN COALESCE(auth.jwt() ->> 'role', '') = 'service_role'
      THEN NULLIF(COALESCE(current_setting('app.actor_id', true), ''), '')::uuid
    ELSE NULL
  END;
$$;

-- ============================================================
-- 2) user_created — firm staff/admin accounts.
-- ============================================================
-- Fires on the user_roles INSERT inside public.handle_new_user(), which
-- runs from the on_auth_user_created trigger during auth.admin.createUser.
-- Clients are filtered out (role = 'client'); the controller's later
-- upsert is an UPDATE (on conflict), so this logs exactly once.
-- Actor comes from raw_app_meta_data ->> 'created_by', written by
-- createStaff as app_metadata: { role, created_by }.
CREATE OR REPLACE FUNCTION public.log_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid;
BEGIN
  IF NEW.role IN ('admin', 'staff', 'billing_officer') THEN
    SELECT NULLIF(u.raw_app_meta_data ->> 'created_by', '')::uuid
    INTO v_actor
    FROM auth.users u
    WHERE u.id = NEW.user_id;

    INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details)
    VALUES (
      -- Staff creation runs inside the auth.users trigger transaction, where
      -- auth.uid()/auth.jwt() are not request context. The controller places
      -- the validated admin ID in raw_app_meta_data instead.
      v_actor,
      'user_created',
      'user',
      NEW.user_id::text,
      jsonb_build_object('role', NEW.role)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_user_created
AFTER INSERT ON public.user_roles
FOR EACH ROW
WHEN (NEW.role IN ('admin', 'staff', 'billing_officer'))
EXECUTE FUNCTION public.log_user_created();

-- ============================================================
-- 3) user_role_changed — role flips on user_roles.
-- ============================================================
-- Covers updateUserRole (service role + x-actor-id header) and the
-- role sync inside handle_user_metadata_update (browser JWT).
-- Skips client->client no-ops; logs firm<->client transitions too.
CREATE OR REPLACE FUNCTION public.log_user_role_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role
     AND (OLD.role IN ('admin', 'staff', 'billing_officer')
       OR NEW.role IN ('admin', 'staff', 'billing_officer')) THEN
    INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details)
    VALUES (
      public.current_actor_id(),
      'user_role_changed',
      'user',
      NEW.user_id::text,
      jsonb_build_object('from', OLD.role, 'to', NEW.role)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_user_role_changed
AFTER UPDATE ON public.user_roles
FOR EACH ROW
WHEN (OLD.role IS DISTINCT FROM NEW.role)
EXECUTE FUNCTION public.log_user_role_changed();

-- ============================================================
-- 4) password_changed — any auth.users password write.
-- ============================================================
-- Fires during GoTrue's password UPDATE, i.e. BEFORE changeOwnPassword
-- flips public.users.status inactive -> active, so first_login still
-- reads 'inactive' on a first login — same semantics as the old app code.
-- Actor is the user themselves (matches the previous req.user.id).
-- Precedent: on_auth_user_created already triggers on auth.users.
CREATE OR REPLACE FUNCTION public.log_password_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details)
  VALUES (
    NEW.id,
    'password_changed',
    'user',
    NEW.id::text,
    jsonb_build_object(
      'first_login',
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.user_id = NEW.id AND u.status = 'inactive'
      )
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_password_changed
AFTER UPDATE ON auth.users
FOR EACH ROW
WHEN (NEW.encrypted_password IS DISTINCT FROM OLD.encrypted_password)
EXECUTE FUNCTION public.log_password_changed();

-- ============================================================
-- 5) client_retainer_changed — businesses.type / retainer_fee.
-- ============================================================
-- Only actual type/fee changes log (IS DISTINCT FROM), so other profile
-- updates are ignored. The browser sends the admin's own JWT, so
-- actor_id = auth.uid(). businesses_guard_update already restricts
-- these columns to admins in the live DB.
CREATE OR REPLACE FUNCTION public.log_client_retainer_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details)
  VALUES (
    public.current_actor_id(),
    'client_retainer_changed',
    'business',
    NEW.business_id::text,
    jsonb_build_object(
      'owner_id', NEW.owner_id,
      'from', jsonb_build_object('type', OLD.type, 'retainer_fee', OLD.retainer_fee),
      'to',   jsonb_build_object('type', NEW.type, 'retainer_fee', NEW.retainer_fee)
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_client_retainer_changed
AFTER UPDATE ON public.businesses
FOR EACH ROW
WHEN (
  OLD.type IS DISTINCT FROM NEW.type
  OR OLD.retainer_fee IS DISTINCT FROM NEW.retainer_fee
)
EXECUTE FUNCTION public.log_client_retainer_changed();

-- ============================================================
-- 6) log_report_export RPC — browser-side CSV/PDF downloads.
-- ============================================================
-- Report exports never touch a table, so no trigger can see them; the
-- frontend calls this RPC instead (log-report-export.js). SECURITY
-- DEFINER so it works regardless of audit_logs RLS; actor is FORCED to
-- auth.uid() — callers cannot log as anyone else.
CREATE OR REPLACE FUNCTION public.log_report_export(
  p_report text,
  p_format text,
  p_row_count integer DEFAULT 0,
  p_filters jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_report IS NULL OR p_report NOT IN ('engagements', 'billing', 'clients') THEN
    RAISE EXCEPTION 'invalid report: %', p_report;
  END IF;
  IF p_format IS NULL OR p_format NOT IN ('csv', 'pdf') THEN
    RAISE EXCEPTION 'invalid format: %', p_format;
  END IF;
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(),
    'report_exported',
    'report',
    p_report,
    jsonb_build_object(
      'format', p_format,
      'row_count', COALESCE(p_row_count, 0),
      'filters', COALESCE(p_filters, '{}'::jsonb)
    )
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_report_export(text, text, integer, jsonb)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_report_export(text, text, integer, jsonb)
  TO authenticated;

-- Optional: dashboard reads newest-first; add if audit_logs grows large.
-- CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx
--   ON public.audit_logs (created_at DESC);

-- Make PostgREST pick up the new functions/triggers without a restart.
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- 7) Read access for the Admin dashboard "Audit Logs" panel.
-- ============================================================
-- The panel reads audit_logs from the browser (auditAPI.js -> useFetchRecentActivity).
-- Triggers/RPC above are SECURITY DEFINER (table owner), so RLS does not
-- affect them; this only gates SELECT. Firm admins read firm-wide; everyone
-- else gets no rows.
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_logs_select_admin ON public.audit_logs;
CREATE POLICY audit_logs_select_admin
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
  )
);

GRANT SELECT ON public.audit_logs TO authenticated;

-- ============================================================
-- 8) Verification probes (run after applying).
-- ============================================================
-- a) Staff create (as admin, via UI or POST /api/v1/staffs/create), then:
-- SELECT action, actor_id, entity_id, details, created_at
--   FROM audit_logs WHERE action = 'user_created' ORDER BY created_at DESC LIMIT 1;
--   expect: actor_id = creating admin, details = {"role": "..."}.
--
-- b) Role change (PATCH /api/v1/staffs/:userId/role), then:
-- SELECT action, actor_id, details FROM audit_logs
--   WHERE action = 'user_role_changed' ORDER BY created_at DESC LIMIT 1;
--   expect: actor_id = acting admin, details = {"from": "...", "to": "..."}.
--
-- c) Change own password (PATCH /api/v1/staffs/password), then:
-- SELECT action, actor_id, details FROM audit_logs
--   WHERE action = 'password_changed' ORDER BY created_at DESC LIMIT 1;
--   expect: actor_id = self, details.first_login true only on first login.
--
-- d) Flip a client to Retainer + fee on ClientDetailPage, then:
-- SELECT action, actor_id, details FROM audit_logs
--   WHERE action = 'client_retainer_changed' ORDER BY created_at DESC LIMIT 1;
--   expect: actor_id = editing admin, details.from/to carry type + fee.
--
-- e) Export any report (CSV or PDF) on /admin/reports, then:
-- SELECT action, actor_id, entity_id, details FROM audit_logs
--   WHERE action = 'report_exported' ORDER BY created_at DESC LIMIT 1;
--   expect: actor_id = admin, entity_id = report name,
--           details = {"format": "...", "row_count": N, "filters": {...}}.
--
-- f) Impersonation probe (must return NULL):
-- SELECT public.current_actor_id();  -- as anon/authenticated, no service role
