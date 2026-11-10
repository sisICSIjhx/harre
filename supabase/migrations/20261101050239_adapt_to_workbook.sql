-- Adaptación final al libro de RR. HH.: retira campos obsoletos, carga los catálogos documentales
-- y publica una proyección sin CURP, RFC, NSS, fecha de nacimiento ni tipo de sangre.

drop view public.vw_employee_directory;
drop view public.vw_employee_training_status;

-- Los cursos exigidos dependen de cada licitación, además de los generales del puesto.
create table public.project_required_courses (
  project_id uuid not null references public.projects (id) on delete cascade,
  job_profile_id uuid not null references public.job_profiles (id) on delete restrict,
  course_id uuid not null references public.courses (id) on delete restrict,
  is_mandatory boolean not null default true,
  source text,
  notes text,
  created_at timestamptz not null default now(),
  primary key (project_id, job_profile_id, course_id)
);

create index project_required_courses_job_profile_id_idx on public.project_required_courses (job_profile_id);
create index project_required_courses_course_id_idx on public.project_required_courses (course_id);

alter table public.project_required_courses enable row level security;
revoke all on public.project_required_courses from anon;

create policy project_required_courses_select on public.project_required_courses
  for select to authenticated
  using (private.has_role('hr') or private.has_role('viewer'));

create policy project_required_courses_hr_write on public.project_required_courses
  for all to authenticated
  using (private.has_role('hr')) with check (private.has_role('hr'));

create trigger project_required_courses_audit
  after insert or update or delete on public.project_required_courses
  for each row execute function private.audit_row_change();

create trigger project_required_courses_enqueue_sync
  after insert or update or delete on public.project_required_courses
  for each row execute function private.enqueue_sync();

alter table public.employee_courses
  add column duration_hours numeric(6, 1) check (duration_hours is null or duration_hours > 0);

-- Sin proyecto: requisitos generales del puesto. Con proyecto: además, los de esa licitación.
-- POR VERIFICAR: tiene el curso, pero sin la fecha que permite confirmar su vigencia.
drop function public.candidates_for_job_profile(uuid);

create function public.candidates_for_job_profile(p_job_profile_id uuid, p_project_id uuid default null)
returns table (
  employee_id uuid,
  employee_number text,
  full_name text,
  employment_status text,
  required_count integer,
  covered_count integer,
  missing_courses text[],
  pending_courses text[],
  assigned_to_project boolean,
  result text
)
language sql
stable
set search_path = ''
as $$
  with required as (
    select distinct c.id as course_id, c.name, c.validity_months
    from public.courses c
    where c.id in (
      select jrc.course_id from public.job_required_courses jrc
      where jrc.job_profile_id = p_job_profile_id and jrc.is_mandatory
      union
      select prc.course_id from public.project_required_courses prc
      where prc.job_profile_id = p_job_profile_id and prc.project_id = p_project_id and prc.is_mandatory
    )
  ),
  evaluated as (
    select
      e.id as employee_id,
      r.name,
      exists (
        select 1 from public.employee_courses ec
        where ec.employee_id = e.id and ec.course_id = r.course_id and ec.completed_on is not null
          and (ec.expires_on >= current_date or (ec.expires_on is null and coalesce(r.validity_months, 0) = 0))
      ) as covered,
      exists (
        select 1 from public.employee_courses ec
        where ec.employee_id = e.id and ec.course_id = r.course_id
          and (ec.completed_on is null or (ec.expires_on is null and coalesce(r.validity_months, 0) > 0))
      ) as pending
    from public.employees e
    cross join required r
  ),
  totals as (
    select
      ev.employee_id,
      count(*) filter (where ev.covered)::integer as covered_count,
      array_agg(ev.name order by ev.name) filter (where not ev.covered and not ev.pending) as missing,
      array_agg(ev.name order by ev.name) filter (where not ev.covered and ev.pending) as pending
    from evaluated ev
    group by ev.employee_id
  ),
  scored as (
    select
      e.id,
      e.employee_number,
      concat_ws(' ', e.first_name, e.last_name, e.second_last_name) as full_name,
      e.employment_status,
      (select count(*)::integer from required) as required_count,
      coalesce(t.covered_count, 0) as covered_count,
      coalesce(t.missing, '{}') as missing,
      coalesce(t.pending, '{}') as pending,
      exists (
        select 1 from public.employee_assignments a
        where a.employee_id = e.id and a.project_id = p_project_id
          and a.job_profile_id = p_job_profile_id
          and (a.end_date is null or a.end_date >= current_date)
      ) as assigned
    from public.employees e
    left join totals t on t.employee_id = e.id
    -- Sin acceso a employee_courses, otro perfil vería a todos como no cumplidos.
    where private.has_role('hr')
  )
  select
    s.id, s.employee_number, s.full_name, s.employment_status, s.required_count, s.covered_count,
    s.missing, s.pending, s.assigned,
    case
      when s.required_count = 0 then 'SIN REQUISITOS'
      when s.covered_count = s.required_count then 'CUMPLE'
      when cardinality(s.missing) = 0 then 'POR VERIFICAR'
      else 'NO CUMPLE'
    end
  from scored s
  order by s.assigned desc, s.covered_count desc, s.employee_number;
$$;

revoke all on function public.candidates_for_job_profile(uuid, uuid) from public, anon;
grant execute on function public.candidates_for_job_profile(uuid, uuid) to authenticated;

-- El puesto y las fechas laborales ya viven en employee_assignments y employment_records.
insert into public.employee_assignments (employee_id, job_profile_id, is_primary)
select e.id, e.job_profile_id, true
from public.employees e
where e.job_profile_id is not null;

insert into public.employment_records (employee_id, hire_date, termination_date, status)
select e.id, e.hire_date, e.termination_date,
       case when e.termination_date is null then 'Activo' else 'Finalizado' end
from public.employees e
where e.hire_date is not null or e.termination_date is not null;

alter table public.employees
  drop column job_profile_id,
  drop column hire_date,
  drop column termination_date;

-- Los sistemas pasan a catálogo.
insert into public.external_systems (name)
select distinct c.source_system
from public.employee_control_numbers c
on conflict (name) do nothing;

update public.employee_control_numbers c
set system_id = s.id
from public.external_systems s
where s.name = c.source_system;

alter table public.employee_control_numbers
  alter column system_id set not null,
  drop column source_system,
  add constraint employee_control_numbers_system_number_key unique (system_id, control_number);

-- El directorio y los puestos son información general, sin datos sensibles.
create policy employee_assignments_viewer_select on public.employee_assignments
  for select to authenticated
  using (private.has_role('viewer'));

create view public.vw_employee_directory
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
  latest_record.termination_date
from public.employees e
left join lateral (
  -- Exclusivo de RRHH: para otros perfiles, RLS deja estas fechas vacías.
  select r.hire_date, r.termination_date
  from public.employment_records r
  where r.employee_id = e.id
  order by r.hire_date desc nulls last, r.created_at desc
  limit 1
) latest_record on true
left join lateral (
  select a.job_profile_id, jp.name as job_profile_name
  from public.employee_assignments a
  join public.job_profiles jp on jp.id = a.job_profile_id
  where a.employee_id = e.id
    and a.is_primary
    and (a.end_date is null or a.end_date >= current_date)
    and (a.start_date is null or a.start_date <= current_date)
  order by a.start_date desc nulls last
  limit 1
) current_job on true;

-- Cursos obligatorios de todos los puestos vigentes de la persona.
create view public.vw_employee_training_status
with (security_invoker = true)
as
select distinct on (e.id, c.id)
  e.id as employee_id,
  e.employee_number,
  c.id as course_id,
  c.name as course_name,
  latest.completed_on,
  latest.expires_on,
  case
    when latest.id is null then 'missing'
    when latest.expires_on < current_date then 'expired'
    when latest.expires_on is null and coalesce(c.validity_months, 0) > 0 then 'unverified'
    else 'current'
  end as training_status
from public.employees e
join public.employee_assignments a
  on a.employee_id = e.id
  and (a.end_date is null or a.end_date >= current_date)
  and (a.start_date is null or a.start_date <= current_date)
join lateral (
  select jrc.course_id from public.job_required_courses jrc
  where jrc.job_profile_id = a.job_profile_id and jrc.is_mandatory
  union
  select prc.course_id from public.project_required_courses prc
  where prc.job_profile_id = a.job_profile_id and prc.project_id = a.project_id and prc.is_mandatory
) needed on true
join public.courses c on c.id = needed.course_id
left join lateral (
  select ec.id, ec.completed_on, ec.expires_on
  from public.employee_courses ec
  where ec.employee_id = e.id and ec.course_id = c.id
  order by ec.completed_on desc nulls last
  limit 1
) latest on true
where private.has_role('hr')
order by e.id, c.id;

revoke all on public.vw_employee_directory, public.vw_employee_training_status from anon;

-- Catálogos documentales de RR. HH.
alter table public.document_types
  drop constraint document_types_applicability_rule_check,
  add constraint document_types_applicability_rule_check
    check (applicability_rule in ('General', 'Académico', 'Opcional', 'Empleo previo', 'Según puesto', 'Por confirmar'));

alter table public.education_document_rules
  drop constraint education_document_rules_applies_check,
  add constraint education_document_rules_applies_check check (applies in ('Sí', 'No', 'Revisar'));

insert into public.document_types (code, name, document_group, applicability_rule, instructions, expected_validity) values
  ('DOC-001', 'Certificado de secundaria', 'Escolaridad', 'Académico', 'Aplica cuando es el último grado reportado', 'Sin vencimiento'),
  ('DOC-002', 'Certificado de bachillerato', 'Escolaridad', 'Académico', 'Aplica cuando es el último grado reportado', 'Sin vencimiento'),
  ('DOC-003', 'Certificado, título o constancia de carrera técnica', 'Escolaridad', 'Académico', 'Se acepta uno de los documentos que acredite la carrera técnica', 'Sin vencimiento'),
  ('DOC-004', 'Certificado de estudios de licenciatura o ingeniería', 'Escolaridad', 'Académico', 'Para pasante y titulado; certificado de estudios', 'Sin vencimiento'),
  ('DOC-005', 'Título profesional', 'Escolaridad', 'Académico', 'Adicional al certificado cuando esté titulado', 'Sin vencimiento'),
  ('DOC-006', 'Cédula profesional', 'Escolaridad', 'Académico', 'Adicional al certificado y título cuando esté titulado', 'Sin vencimiento'),
  ('DOC-007', 'CURP descargada recientemente', 'Identidad', 'General', 'Obtener versión reciente y verificable', 'Reciente'),
  ('DOC-008', 'Acta de nacimiento certificada y actualizada', 'Identidad', 'General', 'Preferentemente documento digital certificado', 'Actualizada'),
  ('DOC-009', 'Constancia de Situación Fiscal completa', 'Fiscal', 'General', 'Verificar RFC, régimen y código postal fiscal', 'Reciente'),
  ('DOC-010', 'Fotografía infantil a color escaneada en PDF', 'Personal', 'General', 'Fotografía tamaño infantil en PDF', 'Según política interna'),
  ('DOC-011', 'Constancia de ingresos del empleo anterior', 'Laboral', 'Empleo previo', 'Confirmar si hubo empleo anterior; documentar exención', 'Según política interna'),
  ('DOC-012', 'Licencia de conducir vigente', 'Habilitación', 'Según puesto', 'Exigir solamente si el puesto requiere conducir', 'Según vencimiento'),
  ('DOC-013', 'Documento de situación del crédito INFONAVIT', 'Laboral', 'General', 'Con crédito o sin crédito: documento que acredite su situación', 'Actualizada'),
  ('DOC-014', 'Identificación INE', 'Complementario', 'Opcional', 'Para verificar datos de identidad y dirección INE', 'Según vencimiento'),
  ('DOC-015', 'Comprobante de domicilio', 'Complementario', 'Opcional', 'Soporte de la dirección declarada en los domicilios', 'Reciente'),
  ('DOC-016', 'CV rubricado', 'Laboral', 'General', 'CV actualizado hasta el último empleo, impreso a doble cara y rubricado en cada página', 'Según política interna'),
  ('DOC-017', 'Comprobante de NSS', 'Identidad', 'General', 'Comprobante de asignación de NSS actualizado, en formato digital', 'Reciente'),
  ('DOC-018', 'Contacto de emergencia', 'Personal', 'General', 'Nombre completo, parentesco y número telefónico actualizado', 'Actualizada'),
  ('DOC-019', 'Beneficiario', 'Personal', 'General', 'Nombre completo del beneficiario, número de contacto y parentesco', 'Actualizada'),
  ('DOC-020', 'Solicitud de empleo', 'Laboral', 'General', 'Llenada de puño y letra, sin espacios en blanco, firmada y legible', 'Sin vencimiento');

insert into public.education_document_rules (education_level, document_type_id, applies)
select r.level, t.id, r.applies
from (values
  ('Secundaria', 'DOC-001', 'Sí'), ('Secundaria', 'DOC-002', 'No'), ('Secundaria', 'DOC-003', 'No'),
  ('Secundaria', 'DOC-004', 'No'), ('Secundaria', 'DOC-005', 'No'), ('Secundaria', 'DOC-006', 'No'),
  ('Bachillerato', 'DOC-001', 'No'), ('Bachillerato', 'DOC-002', 'Sí'), ('Bachillerato', 'DOC-003', 'No'),
  ('Bachillerato', 'DOC-004', 'No'), ('Bachillerato', 'DOC-005', 'No'), ('Bachillerato', 'DOC-006', 'No'),
  ('Carrera técnica', 'DOC-001', 'No'), ('Carrera técnica', 'DOC-002', 'No'), ('Carrera técnica', 'DOC-003', 'Sí'),
  ('Carrera técnica', 'DOC-004', 'No'), ('Carrera técnica', 'DOC-005', 'No'), ('Carrera técnica', 'DOC-006', 'No'),
  ('Lic./Ing. pasante', 'DOC-001', 'No'), ('Lic./Ing. pasante', 'DOC-002', 'No'), ('Lic./Ing. pasante', 'DOC-003', 'No'),
  ('Lic./Ing. pasante', 'DOC-004', 'Sí'), ('Lic./Ing. pasante', 'DOC-005', 'No'), ('Lic./Ing. pasante', 'DOC-006', 'No'),
  ('Lic./Ing. titulado', 'DOC-001', 'No'), ('Lic./Ing. titulado', 'DOC-002', 'No'), ('Lic./Ing. titulado', 'DOC-003', 'No'),
  ('Lic./Ing. titulado', 'DOC-004', 'Sí'), ('Lic./Ing. titulado', 'DOC-005', 'Sí'), ('Lic./Ing. titulado', 'DOC-006', 'Sí'),
  ('Posgrado', 'DOC-001', 'Revisar'), ('Posgrado', 'DOC-002', 'Revisar'), ('Posgrado', 'DOC-003', 'Revisar'),
  ('Posgrado', 'DOC-004', 'Revisar'), ('Posgrado', 'DOC-005', 'Revisar'), ('Posgrado', 'DOC-006', 'Revisar'),
  ('Otro / por determinar', 'DOC-001', 'Revisar'), ('Otro / por determinar', 'DOC-002', 'Revisar'),
  ('Otro / por determinar', 'DOC-003', 'Revisar'), ('Otro / por determinar', 'DOC-004', 'Revisar'),
  ('Otro / por determinar', 'DOC-005', 'Revisar'), ('Otro / por determinar', 'DOC-006', 'Revisar')
) as r (level, code, applies)
join public.document_types t on t.code = r.code;

-- Proyección aprobada del Excel. STABLE: todo se lee de una sola instantánea.
-- No incluye employee_sensitive_data ni observaciones libres del expediente.
create or replace function public.sync_read_snapshot(p_target text, p_lease_token uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_revision bigint;
begin
  select s.pending_revision into v_revision
  from public.sync_state s
  where s.target = p_target and s.lease_token = p_lease_token and s.lease_expires_at > now();

  if not found then
    raise exception 'Arrendamiento no válido para %', p_target;
  end if;

  return (
    with person as (
      select
        e.id,
        e.employee_number,
        concat_ws(' ', e.first_name, e.last_name, e.second_last_name) as full_name,
        e.employment_status,
        (select r.hire_date from public.employment_records r where r.employee_id = e.id
          order by r.hire_date desc nulls last, r.created_at desc limit 1) as hire_date,
        (select r.termination_date from public.employment_records r where r.employee_id = e.id
          order by r.hire_date desc nulls last, r.created_at desc limit 1) as termination_date,
        case e.employment_status
          when 'active' then 'Activo' when 'terminated' then 'Inactivo' else 'En integración'
        end as status,
        (select w.site from public.employee_work_sites w
          where w.employee_id = e.id and w.is_current
          order by w.start_date desc nulls last limit 1) as site,
        (select l.education_level from (
            select d.level as education_level from public.employee_education d
            where d.employee_id = e.id and d.is_highest_level and d.validation_status = 'Validado'
            limit 1
          ) l) as education_level
      from public.employees e
    ),
    assignment as (
      select a.*, p.employee_number, p.full_name, jp.name as job_profile, pr.name as project
      from public.employee_assignments a
      join person p on p.id = a.employee_id
      join public.job_profiles jp on jp.id = a.job_profile_id
      left join public.projects pr on pr.id = a.project_id
    ),
    accreditation as (
      select ec.*, p.employee_number, p.full_name, c.name as course, coalesce(c.validity_months, 0) as validity_months,
        case
          when ec.completed_on is null then 'Sin evidencia'
          when ec.expires_on < current_date then 'Vencido'
          when ec.expires_on is not null then 'Vigente'
          when coalesce(c.validity_months, 0) = 0 then 'Vigente'
          else 'Por verificar'
        end as validity
      from public.employee_courses ec
      join person p on p.id = ec.employee_id
      join public.courses c on c.id = ec.course_id
    ),
    required_course as (
      -- Exigidos por sus puestos vigentes, más los anotados a mano con fecha límite.
      -- A quien ya causó baja no se le exigen cursos.
      select a.employee_id, jrc.course_id, jrc.is_mandatory, null::date as deadline
      from public.employee_assignments a
      join public.job_required_courses jrc on jrc.job_profile_id = a.job_profile_id
      join person p on p.id = a.employee_id and p.employment_status <> 'terminated'
      where (a.end_date is null or a.end_date >= current_date)
        and (a.start_date is null or a.start_date <= current_date)
      union all
      select a.employee_id, prc.course_id, prc.is_mandatory, null::date
      from public.employee_assignments a
      join public.project_required_courses prc
        on prc.job_profile_id = a.job_profile_id and prc.project_id = a.project_id
      join person p on p.id = a.employee_id and p.employment_status <> 'terminated'
      where (a.end_date is null or a.end_date >= current_date)
        and (a.start_date is null or a.start_date <= current_date)
      union all
      select r.employee_id, r.course_id, r.is_mandatory, r.deadline
      from public.employee_course_requirements r
      join person p on p.id = r.employee_id and p.employment_status <> 'terminated'
    ),
    course_control as (
      select
        rc.employee_id,
        rc.course_id,
        bool_or(rc.is_mandatory) as is_mandatory,
        max(rc.deadline) as deadline
      from required_course rc
      group by rc.employee_id, rc.course_id
    ),
    control_status as (
      select
        cc.*,
        case
          when exists (select 1 from accreditation x where x.employee_id = cc.employee_id and x.course_id = cc.course_id and x.validity = 'Vigente') then 'Cubierto'
          when exists (select 1 from accreditation x where x.employee_id = cc.employee_id and x.course_id = cc.course_id and x.validity = 'Vencido') then 'Vencido'
          when cc.deadline < current_date then 'Atrasado'
          else 'Pendiente'
        end as compliance
      from course_control cc
    ),
    document_row as (
      select
        p.id as employee_id,
        p.full_name,
        t.code,
        t.name as document_name,
        ch.review_status,
        ch.received_on,
        ch.expires_on,
        coalesce(ch.manual_decision, case t.applicability_rule
          when 'General' then 'Requerido'
          when 'Opcional' then 'Opcional'
          when 'Académico' then case r.applies
            when 'Sí' then 'Requerido' when 'No' then 'No aplica' else 'Por confirmar' end
          else 'Por confirmar'
        end) as applies
      from person p
      cross join public.document_types t
      left join public.employee_document_checklist ch on ch.employee_id = p.id and ch.document_type_id = t.id
      left join public.education_document_rules r on r.document_type_id = t.id and r.education_level = p.education_level
      -- Un expediente histórico puede estar incompleto: solo se lista lo que sí se capturó.
      where p.employment_status <> 'terminated' or ch.id is not null
    ),
    document_status as (
      select d.*,
        case
          when d.applies = 'No aplica' then 'NO APLICA'
          when d.applies = 'Requerido' and d.review_status = 'Validado' and d.expires_on < current_date then 'VENCIDO'
          when d.applies = 'Requerido' and d.review_status = 'Validado' then 'CUMPLE'
          when d.applies = 'Requerido' then 'PENDIENTE'
          when d.applies = 'Por confirmar' then 'POR DEFINIR'
          when d.applies = 'Opcional' and d.review_status = 'Validado' then 'OPCIONAL OK'
          else 'OPCIONAL'
        end as traffic_light
      from document_row d
    )
    select jsonb_build_object(
      'revision', v_revision,
      'message_ids', (select coalesce(jsonb_agg(q.msg_id), '[]'::jsonb) from pgmq.q_sharepoint_sync q),
      'employees', (select coalesce(jsonb_agg(to_jsonb(t) order by t.employee_number), '[]'::jsonb) from (
        select p.employee_number, p.full_name, p.status, p.site, p.hire_date, p.termination_date,
          (select a.job_profile from assignment a
            where a.employee_id = p.id and a.is_primary and (a.end_date is null or a.end_date >= current_date)
            order by a.start_date desc nulls last limit 1) as job_profile,
          (select f.phone_number from public.employee_phones f
            where f.employee_id = p.id and f.is_current
            order by f.is_primary desc, f.created_at desc limit 1) as phone,
          (select string_agg(m.email, ', ' order by m.email) from public.employee_emails m
            where m.employee_id = p.id and m.is_active and m.email_type = 'Licitaciones') as email_tenders,
          (select string_agg(m.email, ', ' order by m.email) from public.employee_emails m
            where m.employee_id = p.id and m.is_active and m.email_type = 'Corporativo') as email_corporate,
          (select string_agg(m.email, ', ' order by m.email) from public.employee_emails m
            where m.employee_id = p.id and m.is_active and m.email_type = 'Personal') as email_personal,
          (select n.control_number from public.employee_control_numbers n
            join public.external_systems s on s.id = n.system_id
            where n.employee_id = p.id and n.status = 'Activo' and s.name = 'Checador'
            order by n.assigned_on desc nulls last limit 1) as time_clock_number,
          (select em.full_name from public.emergency_contacts em where em.employee_id = p.id order by em.is_primary desc, em.created_at desc limit 1) as emergency_name,
          (select em.relationship from public.emergency_contacts em where em.employee_id = p.id order by em.is_primary desc, em.created_at desc limit 1) as emergency_relationship,
          (select em.phone from public.emergency_contacts em where em.employee_id = p.id order by em.is_primary desc, em.created_at desc limit 1) as emergency_phone,
          (select b.full_name from public.beneficiaries b where b.employee_id = p.id order by b.created_at desc limit 1) as beneficiary_name,
          (select b.relationship from public.beneficiaries b where b.employee_id = p.id order by b.created_at desc limit 1) as beneficiary_relationship,
          (select b.phone from public.beneficiaries b where b.employee_id = p.id order by b.created_at desc limit 1) as beneficiary_phone,
          (select count(*) filter (where d.traffic_light = 'CUMPLE') from document_status d where d.employee_id = p.id) as docs_validated,
          (select count(*) filter (where d.traffic_light in ('PENDIENTE', 'VENCIDO')) from document_status d where d.employee_id = p.id) as docs_pending,
          (select count(*) filter (where d.traffic_light = 'POR DEFINIR') from document_status d where d.employee_id = p.id) as docs_undefined,
          (select count(*) filter (where c.compliance <> 'Cubierto') from control_status c where c.employee_id = p.id) as courses_pending
        from person p
      ) t),
      'phones', (select coalesce(jsonb_agg(to_jsonb(t) order by t.full_name), '[]'::jsonb) from (
        select p.full_name, p.site, f.phone_type, f.phone_number, f.extension, f.is_primary, f.is_current, f.updated_at::date as updated_on
        from public.employee_phones f join person p on p.id = f.employee_id
      ) t),
      'addresses', (select coalesce(jsonb_agg(to_jsonb(t) order by t.full_name), '[]'::jsonb) from (
        select p.full_name, a.address_type, a.street, a.exterior_number, a.interior_number, a.neighborhood,
               a.postal_code, a.city, a.state, a.is_current
        from public.employee_addresses a join person p on p.id = a.employee_id
      ) t),
      'education', (select coalesce(jsonb_agg(to_jsonb(t) order by t.full_name), '[]'::jsonb) from (
        select p.full_name, d.level, d.degree_title, d.institution, d.start_date, d.end_date, d.municipality, d.state,
               d.certificate_status, d.diploma_status, d.license_status, d.validation_status,
               case
                 when d.validation_status <> 'Validado' then 'Pendiente de confirmación'
                 when d.level = 'Lic./Ing. titulado' then case
                   when d.certificate_status = 'Verificado' and d.diploma_status = 'Verificado' and d.license_status = 'Verificado'
                   then d.level else 'Pendiente de confirmación' end
                 when d.level = 'Lic./Ing. pasante' then case
                   when d.certificate_status = 'Verificado' then d.level else 'Pendiente de confirmación' end
                 when 'Verificado' in (d.certificate_status, d.diploma_status, d.license_status) then d.level
                 else 'Pendiente de confirmación'
               end as accredited_level
        from public.employee_education d join person p on p.id = d.employee_id
      ) t),
      'experience', (select coalesce(jsonb_agg(to_jsonb(t) order by t.full_name, t.start_date desc nulls last), '[]'::jsonb) from (
        select p.full_name, x.company, x.start_date, x.end_date, x.position_title, x.project_name, x.activities,
               x.municipality, x.state, x.verification_status
        from public.employee_experience x join person p on p.id = x.employee_id
      ) t),
      'contracts', (select coalesce(jsonb_agg(to_jsonb(t) order by t.full_name, t.hire_date desc nulls last), '[]'::jsonb) from (
        select p.full_name, r.company, r.contract_type, r.hire_date, r.imss_registration_date, r.termination_date,
               r.status, r.work_center, r.area
        from public.employment_records r join person p on p.id = r.employee_id
      ) t),
      'job_profiles', (select coalesce(jsonb_agg(to_jsonb(t) order by t.name), '[]'::jsonb) from (
        select jp.name, jp.area, jp.is_active from public.job_profiles jp
      ) t),
      'projects', (select coalesce(jsonb_agg(to_jsonb(t) order by t.name), '[]'::jsonb) from (
        select pr.name, pr.tender_number, pr.client, pr.start_date, pr.end_date, pr.status,
          (select count(*) from assignment a where a.project_id = pr.id
            and (a.end_date is null or a.end_date >= current_date)
            and (a.start_date is null or a.start_date <= current_date)) as people
        from public.projects pr
      ) t),
      'assignments', (select coalesce(jsonb_agg(to_jsonb(t) order by t.full_name, t.start_date desc nulls last), '[]'::jsonb) from (
        select a.employee_number, a.full_name, a.job_profile, a.project, a.start_date, a.end_date, a.is_primary, a.work_center
        from assignment a
      ) t),
      'courses', (select coalesce(jsonb_agg(to_jsonb(t) order by t.name), '[]'::jsonb) from (
        select c.name, c.category, c.required_evidence, coalesce(c.validity_months, 0) as validity_months, c.is_active from public.courses c
      ) t),
      'requirements', (select coalesce(jsonb_agg(to_jsonb(t) order by t.project nulls first, t.job_profile, t.course), '[]'::jsonb) from (
        select null::text as project, jp.name as job_profile, c.name as course, c.required_evidence, jrc.is_mandatory, jrc.periodicity_months, jrc.notes
        from public.job_required_courses jrc
        join public.job_profiles jp on jp.id = jrc.job_profile_id
        join public.courses c on c.id = jrc.course_id
        union all
        select pr.name, jp.name, c.name, c.required_evidence, prc.is_mandatory, null::integer, prc.notes
        from public.project_required_courses prc
        join public.projects pr on pr.id = prc.project_id
        join public.job_profiles jp on jp.id = prc.job_profile_id
        join public.courses c on c.id = prc.course_id
      ) t),
      'accreditations', (select coalesce(jsonb_agg(to_jsonb(t) order by t.full_name, t.course), '[]'::jsonb) from (
        select a.employee_number, a.full_name, a.course, a.completed_on, a.expires_on, a.evidence_type, a.certificate_folio,
               a.validity_months, a.validity, a.issuer, a.duration_hours
        from accreditation a
      ) t),
      'course_controls', (select coalesce(jsonb_agg(to_jsonb(t) order by t.full_name, t.course), '[]'::jsonb) from (
        select p.full_name, c.name as course, cs.is_mandatory, cs.deadline, cs.compliance
        from control_status cs
        join person p on p.id = cs.employee_id
        join public.courses c on c.id = cs.course_id
      ) t),
      'documents', (select coalesce(jsonb_agg(to_jsonb(t) order by t.full_name, t.code), '[]'::jsonb) from (
        select d.full_name, d.code, d.document_name, d.applies, coalesce(d.review_status, 'Sin revisar') as review_status,
               d.received_on, d.expires_on, d.traffic_light
        from document_status d
      ) t),
      'document_types', (select coalesce(jsonb_agg(to_jsonb(t) order by t.code), '[]'::jsonb) from (
        select dt.code, dt.name, dt.document_group, dt.applicability_rule, dt.expected_validity from public.document_types dt
      ) t),
      'systems', (select coalesce(jsonb_agg(to_jsonb(t) order by t.name), '[]'::jsonb) from (
        select s.name, s.purpose, s.is_active from public.external_systems s
      ) t),
      'control_numbers', (select coalesce(jsonb_agg(to_jsonb(t) order by t.full_name, t.system_name), '[]'::jsonb) from (
        select p.full_name, s.name as system_name, n.control_number, n.status, n.work_center, n.assigned_on, n.verified_on
        from public.employee_control_numbers n
        join person p on p.id = n.employee_id
        join public.external_systems s on s.id = n.system_id
      ) t)
    )
  );
end;
$$;

-- Republicación programada: vigencias y vencimientos cambian con la fecha, sin que nadie edite.
create function public.sync_mark_dirty(p_target text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_revision bigint;
begin
  update public.sync_state
  set pending_revision = pending_revision + 1
  where target = p_target
  returning pending_revision into next_revision;

  if found then
    perform pgmq.send(
      'sharepoint_sync',
      jsonb_build_object('target', p_target, 'revision', next_revision, 'table', 'schedule', 'op', 'refresh')
    );
  end if;
end;
$$;

revoke all on function public.sync_mark_dirty(text) from public, anon, authenticated;
grant execute on function public.sync_mark_dirty(text) to service_role;
