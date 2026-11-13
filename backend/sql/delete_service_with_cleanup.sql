-- Applied manually via the Supabase SQL editor (schema lives outside this repo).
-- Atomic hard delete for a service template: usage guard + child-row deletes +
-- service delete run in a single transaction (PostgREST wraps each RPC call),
-- so any failure (guard RAISE, FK violation) rolls everything back.
-- Backend-only: called by backend/controllers/service.controller.js via
-- supabaseAdmin (service_role). Error messages are matched there:
--   'Service not found' -> 404, 'referenced by' -> 409, FK violation -> 409.

CREATE OR REPLACE FUNCTION delete_service_with_cleanup(p_service_id UUID)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_engagement_count BIGINT;
    v_request_count    BIGINT;
    v_task_ids         UUID[];
BEGIN
    IF NOT EXISTS (SELECT 1 FROM services WHERE service_id = p_service_id) THEN
        RAISE EXCEPTION 'Service not found';
    END IF;

    SELECT COUNT(*) INTO v_engagement_count FROM engagements WHERE service_id = p_service_id;
    SELECT COUNT(*) INTO v_request_count    FROM service_requests WHERE service_id = p_service_id;
    IF v_engagement_count > 0 OR v_request_count > 0 THEN
        RAISE EXCEPTION 'Service is referenced by % engagement(s) and % service request(s); deactivate it instead',
            v_engagement_count, v_request_count;
    END IF;

    SELECT COALESCE(ARRAY_AGG(template_id), '{}') INTO v_task_ids
    FROM template_tasks WHERE service_id = p_service_id;

    DELETE FROM template_task_documents WHERE template_task_id = ANY(v_task_ids);
    DELETE FROM template_tasks           WHERE template_id      = ANY(v_task_ids);
    DELETE FROM services           WHERE service_id       = p_service_id;

    RETURN p_service_id;
END;
$$;

REVOKE ALL ON FUNCTION delete_service_with_cleanup(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_service_with_cleanup(UUID) TO service_role;
