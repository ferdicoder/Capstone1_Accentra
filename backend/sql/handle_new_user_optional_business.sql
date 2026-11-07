-- Reference copy — apply manually via the Supabase SQL editor.
-- Live DB is the source of truth; this file only records the intended change.
--
-- Business rule: every CLIENT gets a businesses row at signup so service
-- requests / engagements can reference business_id immediately. Firm users
-- (admin/staff/billing_officer) never get one. The frontend sends
-- `has_business` in raw_user_meta_data:
--   true  -> row created with full data from the signup form,
--            type = 'non-retainer' (mirrors the column DEFAULT)
--   false -> row created EMPTY (business fields are "") with type = NULL,
--            i.e. unclassified; the firm classifies them later via
--            Edit Client, and the client can fill the business in from
--            their profile page
-- Absent flag defaults to true so existing signup paths keep working.
--
-- No table DDL change is required: businesses.type is already nullable.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role text;
begin
  assigned_role := coalesce(new.raw_app_meta_data ->> 'role', 'client');

  insert into public.users (user_id, email, first_name, last_name, middle_name, contact_no, birthdate)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    coalesce(new.raw_user_meta_data ->> 'last_name', ' '),
    new.raw_user_meta_data ->> 'middle_name',
    new.raw_user_meta_data ->> 'contact_no',
    (new.raw_user_meta_data ->> 'birth_date')::date
  ) on conflict (user_id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, assigned_role)
  on conflict (user_id) do update set role = excluded.role;

  -- Clients only: every client gets a businesses row so service requests /
  -- engagements can reference business_id immediately. Firm users
  -- (admin/staff/billing_officer) never get one. has_business = false only
  -- marks the row as unclassified (type = NULL) — it never skips the insert.
  if assigned_role = 'client' then
    insert into public.businesses (
      owner_id, name, business_type, tin_no, industry, contact_no,
      house_no, street, barangay, district, city, zip_code, type
    )
    values (
      new.id,
      new.raw_user_meta_data ->> 'business_name',
      new.raw_user_meta_data ->> 'business_type',
      new.raw_user_meta_data ->> 'tin_no',
      new.raw_user_meta_data ->> 'industry',
      new.raw_user_meta_data ->> 'contact_no',
      new.raw_user_meta_data ->> 'house_no',
      new.raw_user_meta_data ->> 'street',
      new.raw_user_meta_data ->> 'barangay',
      new.raw_user_meta_data ->> 'district',
      new.raw_user_meta_data ->> 'city',
      new.raw_user_meta_data ->> 'zip_code',
      case when coalesce(new.raw_user_meta_data ->> 'has_business', 'true') = 'false'
           then null
           else 'non-retainer'::public.client_type   -- mirrors the column DEFAULT
      end
    ) on conflict (owner_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- handle_user_metadata_update is unchanged: it only syncs roles and removes
-- businesses when a user stops being a client. Profile edits write to
-- public.businesses directly, not through auth metadata.

-- Optional backfill: give any client created during the earlier no-row
-- testing phase a placeholder row (type = NULL, empty fields).
-- insert into public.businesses (
--   owner_id, name, business_type, tin_no, industry, contact_no,
--   house_no, street, barangay, district, city, zip_code, type
-- )
-- select u.user_id, '', '', '', '', '', '', '', '', '', '', '', null
-- from public.users u
-- join public.user_roles ur on ur.user_id = u.user_id and ur.role = 'client'
-- where not exists (select 1 from public.businesses b where b.owner_id = u.user_id);
