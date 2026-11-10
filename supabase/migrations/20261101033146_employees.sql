-- Catálogo de puestos y empleados.
-- Campos mínimos del modelo propuesto. RFC, CURP y NSS no se incluyen hasta que RRHH
-- confirme que son requeridos y cómo se protegerán.

create table public.job_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (btrim(name) <> ''),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger job_profiles_set_updated_at
  before update on public.job_profiles
  for each row execute function private.set_updated_at();

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_number text not null unique check (btrim(employee_number) <> ''),
  first_name text not null check (btrim(first_name) <> ''),
  last_name text not null check (btrim(last_name) <> ''),
  second_last_name text,
  job_profile_id uuid references public.job_profiles (id) on delete restrict,
  employment_status text not null default 'active'
    check (employment_status in ('active', 'terminated')),
  hire_date date,
  termination_date date,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (termination_date is null or hire_date is null or termination_date >= hire_date)
);

create index employees_job_profile_id_idx on public.employees (job_profile_id);
create index employees_status_idx on public.employees (employment_status);
create index employees_name_idx on public.employees (last_name, first_name);

-- Control de versión: el cliente actualiza con `version = <leída>`; si otra captura ya
-- avanzó la versión, la actualización no afecta filas y se reporta el conflicto.
create function private.bump_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.bump_version() from public;

create trigger employees_bump_version
  before update on public.employees
  for each row execute function private.bump_version();

alter table public.profiles
  add constraint profiles_employee_id_fkey
  foreign key (employee_id) references public.employees (id) on delete set null;

create index profiles_employee_id_idx on public.profiles (employee_id);
