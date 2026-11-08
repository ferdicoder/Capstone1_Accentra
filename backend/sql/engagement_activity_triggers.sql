-- Engagement activity log triggers — reference copy.
-- Apply manually via the Supabase SQL editor (live DB is the source of truth).
-- Rewritten for the post-refactor schema:
--   * documents live in engagement_task_submissions + files (not engagement_documents)
--   * tasks use status (not is_completed)
--   * activity_type must cover every type the frontend inserts.

-- 1) Expand the enum. Run as a standalone statement — ALTER TYPE ... ADD VALUE
--    cannot run inside a transaction block.
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'staff_reassigned';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'schedule_updated';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'task_approved';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'task_revision_requested';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'task_added';

-- 2) Drop obsolete triggers/functions (pre-refactor schema).
DROP TRIGGER IF EXISTS trg_log_engagement_document_uploaded ON engagement_documents;
DROP FUNCTION IF EXISTS log_engagement_document_uploaded();

DROP TRIGGER IF EXISTS trg_log_engagement_task_completed ON engagement_tasks;
DROP FUNCTION IF EXISTS log_engagement_task_completed();

DROP TRIGGER IF EXISTS trg_log_engagement_status_change ON engagements;
DROP FUNCTION IF EXISTS log_engagement_status_change();

-- 3) Client/staff document upload → engagement_task_submissions junction insert.
--    File metadata lives on the linked `files` row; the uploader is files.uploaded_by
--    (backend writes via the admin client, so auth.uid() is not reliable here).
CREATE OR REPLACE FUNCTION log_engagement_document_uploaded()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_engagement_id UUID;
  v_file_name VARCHAR;
  v_uploaded_by UUID;
BEGIN
  SELECT et.engagement_id, f.file_name, f.uploaded_by
  INTO v_engagement_id, v_file_name, v_uploaded_by
  FROM engagement_tasks et
  JOIN files f ON f.file_id = NEW.file_id
  WHERE et.engagement_task_id = NEW.engagement_task_id;

  IF v_engagement_id IS NULL THEN
    RAISE EXCEPTION
      'Could not find engagement for task %',
      NEW.engagement_task_id;
  END IF;

  INSERT INTO engagement_activity (engagement_id, type, message, actor_id)
  VALUES (v_engagement_id, 'document_uploaded', v_file_name, v_uploaded_by);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_engagement_document_uploaded
AFTER INSERT ON engagement_task_submissions
FOR EACH ROW EXECUTE FUNCTION log_engagement_document_uploaded();

-- 4) Task completion is now status = 'approved' (was is_completed = true).
CREATE OR REPLACE FUNCTION log_engagement_task_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'approved' THEN
    INSERT INTO engagement_activity (engagement_id, type, message, actor_id)
    VALUES (NEW.engagement_id, 'task_completed', NEW.title, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_engagement_task_completed
AFTER UPDATE ON engagement_tasks
FOR EACH ROW EXECUTE FUNCTION log_engagement_task_completed();

-- 5) Engagement stage change (unchanged — engagements.status still applies).
CREATE OR REPLACE FUNCTION log_engagement_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO engagement_activity (engagement_id, type, message, actor_id)
    VALUES (NEW.engagement_id, 'stage_change', NEW.status::text, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_engagement_status_change
AFTER UPDATE ON engagements
FOR EACH ROW EXECUTE FUNCTION log_engagement_status_change();
