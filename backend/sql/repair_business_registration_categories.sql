-- Apply manually via the Supabase SQL editor after category has been
-- converted to public.service_category.
--
-- The original conversion handled "business registration" but missed the
-- application's legacy "business-registration" value, so those rows fell
-- through to "other". Recover those service rows from their names.

UPDATE public.services
SET category = 'business_registration'::public.service_category
WHERE category = 'other'::public.service_category
  AND lower(btrim(service_name)) LIKE 'business registration%';
