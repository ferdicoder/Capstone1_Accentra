-- Applied manually via the Supabase SQL editor (schema lives outside this repo).
-- Adds p_is_retainer_covered to match backend/controllers/service.controller.js,
-- which already passes it (create was failing against the live DB without it).

CREATE OR REPLACE FUNCTION create_service_with_template_tasks(
    p_price NUMERIC,
    p_service_name VARCHAR,
    p_category VARCHAR,
    p_description VARCHAR,
    p_estimated_time VARCHAR,
    p_is_recurring BOOLEAN,
    p_is_retainer_covered BOOLEAN,
    p_status service_status,
    p_tasks JSONB
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_service_id UUID;
    v_task JSONB;
BEGIN
    IF p_tasks IS NULL OR jsonb_array_length(p_tasks) = 0 THEN
        RAISE EXCEPTION 'At least one task is required';
    END IF;

    INSERT INTO services (price, service_name, category, description, estimated_time, is_recurring, is_retainer_covered, status)
    VALUES (p_price, p_service_name, p_category, p_description, p_estimated_time, p_is_recurring, p_is_retainer_covered, p_status)
    RETURNING service_id INTO v_service_id;

    FOR v_task IN SELECT * FROM jsonb_array_elements(p_tasks)
    LOOP
        INSERT INTO template_tasks (service_id, title, has_reference, is_required)
        VALUES (
            v_service_id,
            v_task->>'title',
            (v_task->>'has_reference')::boolean,
            (v_task->>'is_required')::boolean
        );
    END LOOP;

    RETURN v_service_id;
END;
$$;
