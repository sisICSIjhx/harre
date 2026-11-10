-- Autorización: acceso anónimo denegado y políticas por tabla.
-- Matriz inicial pendiente de confirmar con ICSI:
--   hr      gestiona Personal, catálogos y documentos.
--   viewer  solo lee datos generales de empleados y catálogos.
--   admin   gestiona acceso; no recibe expedientes por defecto.

do $$
declare
  t text;
begin
  foreach t in array array[
    'roles', 'profiles', 'user_roles', 'job_profiles', 'employees', 'employee_phones',
    'employee_emails', 'employee_addresses', 'employee_documents', 'employee_education',
    'employee_experience', 'courses', 'job_required_courses', 'employee_courses',
    'employee_control_numbers'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;

  -- Secciones del expediente: exclusivas de RRHH.
  foreach t in array array[
    'employee_phones', 'employee_emails', 'employee_addresses', 'employee_documents',
    'employee_education', 'employee_experience', 'employee_courses',
    'employee_control_numbers'
  ] loop
    execute format(
      'create policy %I on public.%I for all to authenticated
         using (private.has_role(''hr'')) with check (private.has_role(''hr''))',
      t || '_hr_all', t
    );
  end loop;

  -- Catálogos: lectura para perfiles habilitados, escritura para RRHH.
  foreach t in array array['job_profiles', 'courses', 'job_required_courses'] loop
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
end;
$$;

-- Empleados: sin política de borrado; la baja es un estado.
create policy employees_select on public.employees
  for select to authenticated
  using (private.has_role('hr') or private.has_role('viewer'));

create policy employees_hr_insert on public.employees
  for insert to authenticated
  with check (private.has_role('hr'));

create policy employees_hr_update on public.employees
  for update to authenticated
  using (private.has_role('hr'))
  with check (private.has_role('hr'));

-- Identidad.
create policy roles_select on public.roles
  for select to authenticated
  using (true);

create policy profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or private.has_role('admin'));

create policy profiles_admin_update on public.profiles
  for update to authenticated
  using (private.has_role('admin'))
  with check (private.has_role('admin'));

create policy user_roles_select on public.user_roles
  for select to authenticated
  using (user_id = (select auth.uid()) or private.has_role('admin'));

create policy user_roles_admin_write on public.user_roles
  for all to authenticated
  using (private.has_role('admin'))
  with check (private.has_role('admin'));

-- Documentos: bucket privado; la ruta `<employee_uuid>/<document_uuid>/<archivo>` no autoriza
-- por sí sola. Límites iniciales pendientes de confirmar con RRHH.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'employee-documents',
  'employee-documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']
);

create policy employee_documents_objects_select on storage.objects
  for select to authenticated
  using (bucket_id = 'employee-documents' and private.has_role('hr'));

create policy employee_documents_objects_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'employee-documents'
    and private.has_role('hr')
    and exists (
      select 1 from public.employees e
      where e.id::text = (storage.foldername(name))[1]
    )
  );

create policy employee_documents_objects_update on storage.objects
  for update to authenticated
  using (bucket_id = 'employee-documents' and private.has_role('hr'))
  with check (bucket_id = 'employee-documents' and private.has_role('hr'));

create policy employee_documents_objects_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'employee-documents' and private.has_role('hr'));

-- Vistas: security_invoker para que apliquen las políticas de quien consulta.
create view public.vw_employee_directory
with (security_invoker = true)
as
select
  e.id,
  e.employee_number,
  concat_ws(' ', e.first_name, e.last_name, e.second_last_name) as full_name,
  e.job_profile_id,
  jp.name as job_profile_name,
  e.employment_status,
  e.hire_date,
  e.termination_date
from public.employees e
left join public.job_profiles jp on jp.id = e.job_profile_id;

create view public.vw_employee_contacts
with (security_invoker = true)
as
select e.id as employee_id, e.employee_number, 'phone' as contact_kind,
       p.phone_type as contact_type, p.phone_number as contact_value, p.is_primary
from public.employees e
join public.employee_phones p on p.employee_id = e.id
union all
select e.id, e.employee_number, 'email', m.email_type, m.email, m.is_primary
from public.employees e
join public.employee_emails m on m.employee_id = e.id;

-- Las reglas de cumplimiento se acordarán con RRHH; por ahora se deriva de la vigencia registrada.
-- Restringida a RRHH: sin acceso a employee_courses, otro perfil vería todo como faltante.
create view public.vw_employee_training_status
with (security_invoker = true)
as
select
  e.id as employee_id,
  e.employee_number,
  c.id as course_id,
  c.name as course_name,
  latest.completed_on,
  latest.expires_on,
  case
    when latest.id is null then 'missing'
    when latest.expires_on is not null and latest.expires_on < current_date then 'expired'
    else 'current'
  end as training_status
from public.employees e
join public.job_required_courses jrc on jrc.job_profile_id = e.job_profile_id
join public.courses c on c.id = jrc.course_id
left join lateral (
  select ec.id, ec.completed_on, ec.expires_on
  from public.employee_courses ec
  where ec.employee_id = e.id and ec.course_id = c.id
  order by ec.completed_on desc nulls last
  limit 1
) latest on true
where private.has_role('hr');

revoke all on public.vw_employee_directory, public.vw_employee_contacts,
  public.vw_employee_training_status from anon;
