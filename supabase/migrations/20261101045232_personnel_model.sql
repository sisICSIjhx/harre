-- Modelo real de Personal, a partir del libro de RR. HH.: datos sensibles, historial laboral,
-- proyectos, varios puestos por persona, requisitos de cursos y control documental.
-- Pendiente de retirar cuando la interfaz use las asignaciones y el historial:
-- employees.job_profile_id, employees.hire_date y employees.termination_date.

comment on column public.employees.job_profile_id is
  'Obsoleta: el puesto actual se obtiene de employee_assignments.';
comment on column public.employees.hire_date is
  'Obsoleta: las fechas laborales viven en employment_records.';
comment on column public.employees.termination_date is
  'Obsoleta: las fechas laborales viven en employment_records.';

alter table public.employees
  add column notes text,
  drop constraint employees_employment_status_check,
  add constraint employees_employment_status_check
    check (employment_status in ('active', 'terminated', 'onboarding'));

-- En tabla aparte: RLS protege filas, no columnas. Solo RRHH las lee.
create table public.employee_sensitive_data (
  employee_id uuid primary key references public.employees (id) on delete restrict,
  birth_date date,
  curp text unique,
  rfc text unique,
  nss text unique,
  blood_type text check (blood_type in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Desconocido')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.employment_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete restrict,
  company text not null default 'ICSI',
  contract_type text check (contract_type in ('Indeterminado', 'Determinado', 'Proyecto', 'Honorarios', 'Otro')),
  hire_date date,
  imss_registration_date date,
  termination_date date,
  status text not null default 'Activo' check (status in ('Activo', 'Finalizado', 'Suspendido')),
  work_center text,
  area text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (termination_date is null or hire_date is null or termination_date >= hire_date)
);

alter table public.employee_phones
  add column extension text,
  add column is_current boolean not null default true,
  add column notes text;

alter table public.employee_emails
  add column is_active boolean not null default true,
  add column notes text;

alter table public.employee_addresses
  add column verified_on date,
  add column is_current boolean not null default true,
  add column notes text;

create table public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete restrict,
  full_name text not null check (btrim(full_name) <> ''),
  relationship text,
  phone text,
  is_primary boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.beneficiaries (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete restrict,
  full_name text not null check (btrim(full_name) <> ''),
  relationship text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.job_profiles
  add column area text,
  add column profile_version text,
  add column notes text;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (btrim(name) <> ''),
  tender_number text,
  client text,
  location text,
  start_date date,
  end_date date,
  status text not null default 'En licitación'
    check (status in ('En licitación', 'Adjudicado', 'En ejecución', 'Terminado', 'No adjudicado')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

-- Una persona puede tener varios puestos, uno por proyecto. Se cierra con end_date; no se borra.
create table public.employee_assignments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete restrict,
  job_profile_id uuid not null references public.job_profiles (id) on delete restrict,
  project_id uuid references public.projects (id) on delete restrict,
  start_date date,
  end_date date,
  is_primary boolean not null default false,
  work_center text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create unique index employee_assignments_one_primary_idx
  on public.employee_assignments (employee_id)
  where is_primary and end_date is null;

alter table public.courses
  add column category text check (category in ('Curso', 'Certificación', 'Evaluación', 'Otro')),
  add column required_evidence text check (required_evidence in ('DC-3', 'Certificación', 'Constancia', 'Otro')),
  add column standard_or_body text,
  add column notes text;

alter table public.job_required_courses
  add column is_mandatory boolean not null default true,
  add column periodicity_months integer check (periodicity_months is null or periodicity_months > 0),
  add column notes text;

alter table public.employee_courses
  add column evidence_type text check (evidence_type in ('DC-3', 'Certificación', 'Constancia', 'Otro')),
  add column certificate_folio text,
  add column issuer text,
  add column notes text;

create table public.employee_course_requirements (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete restrict,
  job_profile_id uuid references public.job_profiles (id) on delete restrict,
  course_id uuid not null references public.courses (id) on delete restrict,
  is_mandatory boolean not null default true,
  deadline date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, course_id)
);

alter table public.employee_education
  add column municipality text,
  add column state text,
  add column country text,
  add column certificate_status text not null default 'No entregado'
    check (certificate_status in ('No entregado', 'Recibido', 'Verificado', 'No aplica')),
  add column diploma_status text not null default 'No entregado'
    check (diploma_status in ('No entregado', 'Recibido', 'Verificado', 'No aplica')),
  add column license_status text not null default 'No entregado'
    check (license_status in ('No entregado', 'Recibido', 'Verificado', 'No aplica')),
  add column validation_status text not null default 'Pendiente'
    check (validation_status in ('Pendiente', 'En revisión', 'Validado', 'Rechazado')),
  add column is_highest_level boolean not null default false,
  add column reviewed_on date,
  add column reviewed_by text,
  add column notes text;

alter table public.employee_experience
  add column company_type text check (company_type in ('ICSI', 'Externa')),
  add column period_text text,
  add column project_name text,
  add column activities text,
  add column municipality text,
  add column state text,
  add column country text,
  add column work_location_detail text,
  add column work_reference text,
  add column verification_status text not null default 'Sin verificar'
    check (verification_status in ('Sin verificar', 'Referencia disponible', 'Verificado')),
  add column notes text;

create table public.document_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  document_group text,
  applicability_rule text check (applicability_rule in ('General', 'Académico', 'Opcional', 'Por confirmar')),
  instructions text,
  expected_validity text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.education_document_rules (
  education_level text not null,
  document_type_id uuid not null references public.document_types (id) on delete cascade,
  applies text not null check (applies in ('Sí', 'No', 'Por confirmar')),
  primary key (education_level, document_type_id)
);

-- Una fila por empleado y tipo de documento. El archivo, si existe, está en employee_documents.
create table public.employee_document_checklist (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete restrict,
  document_type_id uuid not null references public.document_types (id) on delete restrict,
  document_id uuid,
  manual_decision text check (manual_decision in ('Requerido', 'No aplica', 'Opcional')),
  review_status text not null default 'Sin revisar'
    check (review_status in ('Sin revisar', 'Recibido', 'Validado', 'Rechazado')),
  received_on date,
  issued_on date,
  expires_on date,
  validated_by text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, document_type_id),
  foreign key (document_id, employee_id) references public.employee_documents (id, employee_id)
);

create table public.external_systems (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (btrim(name) <> ''),
  purpose text,
  responsible_area text,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.external_systems (name, purpose) values ('Checador', 'Control de asistencia');

alter table public.employee_control_numbers
  add column system_id uuid references public.external_systems (id) on delete restrict,
  add column assigned_on date,
  add column ended_on date,
  add column status text not null default 'Activo' check (status in ('Activo', 'Inactivo')),
  add column work_center text,
  add column verified_on date,
  add column notes text;

create table public.employee_work_sites (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete restrict,
  site text not null check (btrim(site) <> ''),
  start_date date,
  end_date date,
  is_current boolean not null default true,
  site_type text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create index employment_records_employee_id_idx on public.employment_records (employee_id);
create index emergency_contacts_employee_id_idx on public.emergency_contacts (employee_id);
create index beneficiaries_employee_id_idx on public.beneficiaries (employee_id);
create index employee_assignments_employee_id_idx on public.employee_assignments (employee_id);
create index employee_assignments_job_profile_id_idx on public.employee_assignments (job_profile_id);
create index employee_assignments_project_id_idx on public.employee_assignments (project_id);
create index employee_course_requirements_course_id_idx on public.employee_course_requirements (course_id);
create index employee_document_checklist_document_type_id_idx on public.employee_document_checklist (document_type_id);
create index employee_work_sites_employee_id_idx on public.employee_work_sites (employee_id);
create index employee_control_numbers_system_id_idx on public.employee_control_numbers (system_id);

do $$
declare
  t text;
begin
  foreach t in array array[
    'employee_sensitive_data', 'employment_records', 'emergency_contacts', 'beneficiaries',
    'projects', 'employee_assignments', 'employee_course_requirements', 'document_types',
    'education_document_rules', 'employee_document_checklist', 'external_systems',
    'employee_work_sites'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format(
      'create trigger %I after insert or update or delete on public.%I
         for each row execute function private.audit_row_change()',
      t || '_audit', t
    );
    if t <> 'education_document_rules' then
      execute format(
        'create trigger %I before update on public.%I
           for each row execute function private.set_updated_at()',
        t || '_set_updated_at', t
      );
    end if;
  end loop;

  -- Información del expediente: exclusiva de RRHH.
  foreach t in array array[
    'employee_sensitive_data', 'employment_records', 'emergency_contacts', 'beneficiaries',
    'employee_assignments', 'employee_course_requirements', 'employee_document_checklist',
    'employee_work_sites'
  ] loop
    execute format(
      'create policy %I on public.%I for all to authenticated
         using (private.has_role(''hr'')) with check (private.has_role(''hr''))',
      t || '_hr_all', t
    );
  end loop;

  -- Catálogos: lectura para perfiles habilitados, escritura para RRHH.
  foreach t in array array['projects', 'document_types', 'education_document_rules', 'external_systems'] loop
    execute format(
      'create policy %I on public.%I for select to authenticated
         using (private.has_role(''hr'') or private.has_role(''viewer''))',
      t || '_select', t
    );
    execute format(
      'create policy %I on public.%I for all to authenticated
         using (private.has_role(''hr'')) with check (private.has_role(''hr''))',
      t || '_hr_write', t
    );
  end loop;

  -- Datos que alimentan el Excel.
  foreach t in array array[
    'employment_records', 'emergency_contacts', 'beneficiaries', 'projects',
    'employee_assignments', 'employee_course_requirements', 'document_types',
    'education_document_rules', 'employee_document_checklist', 'external_systems',
    'employee_work_sites', 'job_required_courses', 'employee_control_numbers'
  ] loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I
         for each row execute function private.enqueue_sync()',
      t || '_enqueue_sync', t
    );
  end loop;
end;
$$;

-- Estado derivado: una asignación con fecha de fin pasada es historial.
create view public.vw_employee_assignments
with (security_invoker = true)
as
select
  a.id,
  a.employee_id,
  e.employee_number,
  concat_ws(' ', e.first_name, e.last_name, e.second_last_name) as full_name,
  a.job_profile_id,
  jp.name as job_profile_name,
  a.project_id,
  p.name as project_name,
  a.start_date,
  a.end_date,
  a.is_primary,
  a.work_center,
  case
    when a.start_date > current_date then 'Próxima'
    when a.end_date < current_date then 'Histórico'
    else 'Vigente'
  end as assignment_status
from public.employee_assignments a
join public.employees e on e.id = a.employee_id
join public.job_profiles jp on jp.id = a.job_profile_id
left join public.projects p on p.id = a.project_id;

revoke all on public.vw_employee_assignments from anon;

-- Licitaciones: quién cumple los cursos obligatorios de un puesto. Un curso cuenta si tiene
-- acreditación y sigue vigente; sin fecha de vencimiento, solo si el curso no caduca.
-- Misma regla que V_LICITACIONES en el Excel.
create function public.candidates_for_job_profile(p_job_profile_id uuid)
returns table (
  employee_id uuid,
  employee_number text,
  full_name text,
  employment_status text,
  required_count integer,
  covered_count integer,
  missing_courses text[],
  meets_requirements boolean
)
language sql
stable
set search_path = ''
as $$
  with required as (
    select jrc.course_id, c.name, c.validity_months
    from public.job_required_courses jrc
    join public.courses c on c.id = jrc.course_id
    where jrc.job_profile_id = p_job_profile_id and jrc.is_mandatory
  ),
  evaluated as (
    select
      e.id as employee_id,
      r.name,
      exists (
        select 1
        from public.employee_courses ec
        where ec.employee_id = e.id
          and ec.course_id = r.course_id
          and ec.completed_on is not null
          and (
            ec.expires_on >= current_date
            or (ec.expires_on is null and coalesce(r.validity_months, 0) = 0)
          )
      ) as covered
    from public.employees e
    cross join required r
  )
  select
    e.id,
    e.employee_number,
    concat_ws(' ', e.first_name, e.last_name, e.second_last_name),
    e.employment_status,
    (select count(*)::integer from required),
    coalesce(s.covered_count, 0),
    coalesce(s.missing, '{}'),
    (select count(*) > 0 from required) and coalesce(s.covered_count, 0) = (select count(*) from required)
  from public.employees e
  left join lateral (
    select
      count(*) filter (where ev.covered)::integer as covered_count,
      array_agg(ev.name order by ev.name) filter (where not ev.covered) as missing
    from evaluated ev
    where ev.employee_id = e.id
  ) s on true
  -- Sin acceso a employee_courses, otro perfil vería a todos como no cumplidos.
  where private.has_role('hr')
  order by 8 desc, e.employee_number;
$$;

revoke all on function public.candidates_for_job_profile(uuid) from public, anon;
grant execute on function public.candidates_for_job_profile(uuid) to authenticated;
