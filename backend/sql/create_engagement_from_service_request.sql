-- Apply manually via the Supabase SQL editor.
-- Service requests now leave service_id unset until the firm selects a
-- template while approving the request. Replace the legacy five-argument
-- RPC so approval atomically records that selection, creates the engagement,
-- copies its tasks, and approves the request.

DROP FUNCTION IF EXISTS public.create_engagement(uuid, uuid, date, date, numeric);

CREATE FUNCTION public.create_engagement(
  p_service_request_id uuid,
  p_service_id uuid,
  p_assigned_staff uuid,
  p_start_date date,
  p_due_date date,
  p_fee numeric
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE
  v_business_id uuid;
  v_engagement_id uuid;
  v_task record;
BEGIN
  IF auth.uid() IS NULL
     OR NOT EXISTS (
       SELECT 1
       FROM public.user_roles
       WHERE user_id = auth.uid()
         AND role IN ('admin', 'staff')
     )
     OR EXISTS (
       SELECT 1
       FROM public.users
       WHERE user_id = auth.uid()
         AND status = 'deactivated'
     ) THEN
    RAISE EXCEPTION 'Only active firm admins and staff can approve service requests'
      USING ERRCODE = '42501';
  END IF;

  IF p_service_id IS NULL THEN
    RAISE EXCEPTION 'A service template is required to approve a service request';
  END IF;

  IF p_assigned_staff IS NULL
     OR NOT EXISTS (
       SELECT 1
       FROM public.user_roles
       WHERE user_id = p_assigned_staff
         AND role = 'staff'
     ) THEN
    RAISE EXCEPTION 'Assigned lead must be a staff member';
  END IF;

  IF p_start_date IS NULL OR p_due_date IS NULL OR p_due_date < p_start_date THEN
    RAISE EXCEPTION 'A valid engagement date range is required';
  END IF;

  SELECT business_id
  INTO v_business_id
  FROM public.service_requests
  WHERE service_request_id = p_service_request_id
    AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service request % not found or not pending', p_service_request_id;
  END IF;

  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'Service request % has no business', p_service_request_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.services WHERE service_id = p_service_id
  ) THEN
    RAISE EXCEPTION 'Service % not found', p_service_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.template_tasks WHERE service_id = p_service_id
  ) THEN
    RAISE EXCEPTION 'Service % has no template tasks; cannot create engagement', p_service_id;
  END IF;

  INSERT INTO public.engagements (
    business_id,
    service_id,
    status,
    fee,
    assigned_staff,
    start_date,
    due_date
  )
  VALUES (
    v_business_id,
    p_service_id,
    'document_collection',
    p_fee,
    p_assigned_staff,
    p_start_date,
    p_due_date
  )
  RETURNING engagement_id INTO v_engagement_id;

  INSERT INTO public.engagement_tasks (
    engagement_id,
    title,
    has_reference,
    is_required
  )
  SELECT
    v_engagement_id,
    title,
    has_reference,
    is_required
  FROM public.template_tasks
  WHERE service_id = p_service_id;

  UPDATE public.service_requests
  SET service_id = p_service_id,
      status = 'approved'
  WHERE service_request_id = p_service_request_id;

  RETURN v_engagement_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_engagement(uuid, uuid, uuid, date, date, numeric)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_engagement(uuid, uuid, uuid, date, date, numeric)
  TO authenticated;

NOTIFY pgrst, 'reload schema';
