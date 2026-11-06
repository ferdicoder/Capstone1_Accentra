-- Applied manually via the Supabase SQL editor (schema lives outside this repo).
-- Fixes: (1) duplicated p_is_recurring param (missing comma, did not compile),
-- (2) adds p_is_retainer_covered to match frontend/src/services/api/serviceAPI.js,
-- (3) deletes template_documents of dropped tasks before deleting the tasks
-- so removing a task cannot hit an FK violation.
-- Do NOT revoke execute from authenticated — the frontend calls this RPC directly.

CREATE OR REPLACE FUNCTION update_service_with_template_tasks(
    p_service_id UUID,
    p_price NUMERIC,
    p_service_name VARCHAR,
    p_category VARCHAR,
    p_description VARCHAR,
    p_estimated_time VARCHAR,
    p_is_recurring BOOLEAN,
    p_is_retainer_covered BOOLEAN,
    p_status service_status,
    p_tasks JSONB   -- array of { template_id (nullable), title, has_reference, is_required }
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_task JSONB;
    v_submitted_ids UUID[];
BEGIN
    IF p_tasks IS NULL OR jsonb_array_length(p_tasks) = 0 THEN
        RAISE EXCEPTION 'At least one task is required';
    END IF;

    UPDATE services
    SET price = p_price,
        service_name = p_service_name,
        category = p_category,
        description = p_description,
        estimated_time = p_estimated_time,
        is_recurring = p_is_recurring,
        is_retainer_covered = p_is_retainer_covered,
        status = p_status
    WHERE service_id = p_service_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Service % not found', p_service_id;
    END IF;

    SELECT array_agg((t->>'template_id')::UUID)
    INTO v_submitted_ids
    FROM jsonb_array_elements(p_tasks) t
    WHERE t->>'template_id' IS NOT NULL;

    -- Remove documents of dropped tasks first so the task delete below
    -- cannot hit an FK violation.
    DELETE FROM template_documents
    WHERE template_task_id IN (
        SELECT template_id FROM template_tasks
        WHERE service_id = p_service_id
          AND (v_submitted_ids IS NULL OR template_id != ALL(v_submitted_ids))
    );

    DELETE FROM template_tasks
    WHERE service_id = p_service_id
      AND (v_submitted_ids IS NULL OR template_id != ALL(v_submitted_ids));

    FOR v_task IN SELECT * FROM jsonb_array_elements(p_tasks)
    LOOP
        IF v_task->>'template_id' IS NOT NULL THEN
            UPDATE template_tasks
            SET title = v_task->>'title',
                has_reference = (v_task->>'has_reference')::boolean,
                is_required = (v_task->>'is_required')::boolean
            WHERE template_id = (v_task->>'template_id')::UUID
              AND service_id = p_service_id;
        ELSE
            INSERT INTO template_tasks (service_id, title, has_reference, is_required)
            VALUES (
                p_service_id,
                v_task->>'title',
                (v_task->>'has_reference')::boolean,
                (v_task->>'is_required')::boolean
            );
        END IF;
    END LOOP;

    RETURN p_service_id;
END;
$$;
