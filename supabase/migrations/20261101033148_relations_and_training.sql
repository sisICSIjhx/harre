-- Secciones del expediente y capacitación. Teléfonos y números de control son texto para
-- conservar ceros iniciales. `on delete restrict`: la baja laboral es un estado, no un borrado.

create table public.employee_phones (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete restrict,
  phone_type text not null,
  phone_number text not null check (btrim(phone_number) <> ''),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.employee_emails (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete restrict,
  email_type text not null,
  email text not null check (position('@' in email) > 1),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, email)
);

create table public.employee_addresses (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete restrict,
  address_type text not null,
  street text,
  exterior_number text,
  interior_number text,
  neighborhood text,
  city text,
  state text,
  postal_code text,
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.employee_documents (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete restrict,
  document_type text not null,
  bucket text not null default 'employee-documents',
  storage_path text not null unique,
  original_filename text not null,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  expires_on date,
  uploaded_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, employee_id)
);

create table public.employee_education (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete restrict,
  level text not null,
  institution text,
  degree_title text,
  professional_license text,
  start_date date,
  end_date date,
  document_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date),
  foreign key (document_id, employee_id) references public.employee_documents (id, employee_id)
);

create table public.employee_experience (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete restrict,
  company text not null,
  position_title text,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (btrim(name) <> ''),
  description text,
  validity_months integer check (validity_months is null or validity_months > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.job_required_courses (
  job_profile_id uuid not null references public.job_profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (job_profile_id, course_id)
);

create table public.employee_courses (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete restrict,
  course_id uuid not null references public.courses (id) on delete restrict,
  completed_on date,
  expires_on date,
  evidence_document_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, course_id, completed_on),
  check (expires_on is null or completed_on is null or expires_on >= completed_on),
  -- La evidencia debe pertenecer al mismo empleado.
  foreign key (evidence_document_id, employee_id)
    references public.employee_documents (id, employee_id)
);

create table public.employee_control_numbers (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete restrict,
  source_system text not null,
  control_number text not null check (btrim(control_number) <> ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_system, control_number)
);

create index employee_phones_employee_id_idx on public.employee_phones (employee_id);
create index employee_emails_employee_id_idx on public.employee_emails (employee_id);
create index employee_addresses_employee_id_idx on public.employee_addresses (employee_id);
create index employee_documents_employee_id_idx on public.employee_documents (employee_id);
create index employee_education_employee_id_idx on public.employee_education (employee_id);
create index employee_experience_employee_id_idx on public.employee_experience (employee_id);
create index employee_courses_employee_id_idx on public.employee_courses (employee_id);
create index employee_courses_course_id_idx on public.employee_courses (course_id);
create index employee_control_numbers_employee_id_idx on public.employee_control_numbers (employee_id);
create index job_required_courses_course_id_idx on public.job_required_courses (course_id);

do $$
declare
  t text;
begin
  foreach t in array array[
    'employee_phones', 'employee_emails', 'employee_addresses', 'employee_documents',
    'employee_education', 'employee_experience', 'courses', 'employee_courses',
    'employee_control_numbers'
  ] loop
    execute format(
      'create trigger %I before update on public.%I
         for each row execute function private.set_updated_at()',
      t || '_set_updated_at', t
    );
  end loop;
end;
$$;
