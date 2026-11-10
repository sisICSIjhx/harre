-- Enlaces capturados a mano hacia el archivo, sea cual sea su ubicación.
alter table public.employee_courses
  add column document_url text check (document_url ~* '^https?://');
alter table public.employee_addresses
  add column document_url text check (document_url ~* '^https?://');
alter table public.employee_document_checklist
  add column document_url text check (document_url ~* '^https?://');

-- Un archivo está en Supabase Storage (los ya cargados) o en SharePoint, nunca en ambos.
alter table public.employee_documents
  alter column bucket drop not null,
  alter column storage_path drop not null,
  add column sharepoint_item_id text unique,
  add column web_url text check (web_url ~* '^https?://'),
  add constraint employee_documents_location_check
    check ((storage_path is not null) <> (sharepoint_item_id is not null));

-- Tabla aparte: escribir en employees incrementaría su versión y causaría conflictos de edición.
create table public.employee_sharepoint_folders (
  employee_id uuid primary key references public.employees (id) on delete restrict,
  item_id text not null unique,
  folder_name text not null unique,
  web_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.employee_sharepoint_folders enable row level security;
revoke all on public.employee_sharepoint_folders from anon;

create policy employee_sharepoint_folders_hr_all on public.employee_sharepoint_folders
  for all to authenticated
  using (private.has_role('hr')) with check (private.has_role('hr'));

create trigger employee_sharepoint_folders_audit
  after insert or update or delete on public.employee_sharepoint_folders
  for each row execute function private.audit_row_change();
create trigger employee_sharepoint_folders_set_updated_at
  before update on public.employee_sharepoint_folders
  for each row execute function private.set_updated_at();

-- Columnas nuevas al final: el directorio conserva su contrato. La sede, como las fechas, es
-- exclusiva de RRHH: para otros perfiles, RLS la deja vacía.
create or replace view public.vw_employee_directory
with (security_invoker = true)
as
select
  e.id,
  e.employee_number,
  concat_ws(' ', e.first_name, e.last_name, e.second_last_name) as full_name,
  current_job.job_profile_id,
  current_job.job_profile_name,
  e.employment_status,
  latest_record.hire_date,
  latest_record.termination_date,
  current_job.project_name,
  current_site.site
from public.employees e
left join lateral (
  select r.hire_date, r.termination_date
  from public.employment_records r
  where r.employee_id = e.id
  order by r.hire_date desc nulls last, r.created_at desc
  limit 1
) latest_record on true
left join lateral (
  select a.job_profile_id, jp.name as job_profile_name, p.name as project_name
  from public.employee_assignments a
  join public.job_profiles jp on jp.id = a.job_profile_id
  left join public.projects p on p.id = a.project_id
  where a.employee_id = e.id
    and a.is_primary
    and (a.end_date is null or a.end_date >= current_date)
    and (a.start_date is null or a.start_date <= current_date)
  order by a.start_date desc nulls last
  limit 1
) current_job on true
left join lateral (
  select w.site
  from public.employee_work_sites w
  where w.employee_id = e.id and w.is_current
  order by w.start_date desc nulls last
  limit 1
) current_site on true;
