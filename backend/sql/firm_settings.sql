-- Reference copy — apply manually via the Supabase SQL editor.
-- Live DB is the source of truth; this file only records the intended change.
--
-- Singleton firm settings table: one row (singleton = true) holding the
-- firm's public branding (name, logo, contact email, about, terms).
-- Readable by anon + authenticated (landing page, signup T&C dialog);
-- writes restricted to the admin role.

create table public.firm_settings (
  singleton     boolean primary key default true check (singleton),

  firm_name     text not null default '',
  logo_storage_key text,
  logo_b2_file_id  text,
  logo_file_name   text,
  logo_mime_type   text,

  contact_email text not null,
  about         text not null default '',
  terms_and_conditions text not null default '',

  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users(id)
);

alter table public.firm_settings enable row level security;

-- Keeps updated_at / updated_by current on every write.
create or replace function public.set_firm_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;

create trigger firm_settings_updated_at
  before update on public.firm_settings
  for each row execute function public.set_firm_settings_updated_at();

-- security definer so policies can check roles without tripping user_roles RLS.
create or replace function public.has_role(required text)
returns boolean
language sql
security definer
set search_path = public
stable as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = required
  );
$$;

create policy "firm settings readable by everyone"
  on public.firm_settings for select
  to authenticated, anon
  using (true);

create policy "only admins insert firm settings"
  on public.firm_settings for insert
  to authenticated
  with check (public.has_role('admin'));

create policy "only admins update firm settings"
  on public.firm_settings for update
  to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

create policy "deletes blocked"
  on public.firm_settings for delete
  to authenticated
  using (false);

-- Seed the singleton row. contact_email is NOT NULL with no default —
-- EDIT the address below before running.
insert into public.firm_settings (singleton, contact_email)
values (true, 'firm@example.com')
on conflict (singleton) do nothing;
