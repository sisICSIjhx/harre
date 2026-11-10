-- Contratos separados de las altas y bajas. Ingreso, Alta IMSS y Baja describen la relación con la
-- empresa (`employment_records`); cada contrato, incluidas sus renovaciones, va en
-- `employee_contracts`. La confidencialidad se liga al contrato. Además, Contrato, Carta y Acuerdo de
-- confidencialidad se agregan al control de documentos de cada persona, también de las nuevas.

set local app.audit_reason = 'Separación de contratos y documentos laborales para todo el personal';

-- 1. Tabla de contratos.
create table public.employee_contracts (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete restrict,
  contract_type text not null
    check (contract_type in (
      'Indeterminado', 'Determinado', 'Por meses', 'Por obra determinada', 'Por ocasión',
      'Por temporada', 'Periodo de prueba', 'Capacitación inicial', 'Proyecto', 'Honorarios', 'Otro'
    )),
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employee_contracts_dates_check
    check (end_date is null or start_date is null or end_date >= start_date),
  -- Un contrato indeterminado no lleva fechas de inicio ni de término.
  constraint employee_contracts_indefinite_dates_check
    check (contract_type <> 'Indeterminado' or (start_date is null and end_date is null)),
  -- Permite exigir que la confidencialidad apunte a un contrato de la misma persona.
  constraint employee_contracts_id_employee_id_key unique (id, employee_id)
);

create index employee_contracts_employee_id_idx on public.employee_contracts (employee_id);

create trigger employee_contracts_set_updated_at
  before update on public.employee_contracts
  for each row execute function private.set_updated_at();
create trigger employee_contracts_audit
  after insert or update or delete on public.employee_contracts
  for each row execute function private.audit_row_change();
create trigger employee_contracts_enqueue_sync
  after insert or update or delete on public.employee_contracts
  for each row execute function private.enqueue_sync();

alter table public.employee_contracts enable row level security;
revoke all on public.employee_contracts from anon;

-- Información del expediente: exclusiva de RRHH, como las altas y bajas.
create policy employee_contracts_hr_all
  on public.employee_contracts for all to authenticated
  using (private.has_role('hr')) with check (private.has_role('hr'));

-- 2. Traslado de los contratos capturados en las altas y bajas.
create temporary table contract_map as
select r.id as record_id, gen_random_uuid() as contract_id, r.employee_id, r.contract_type,
       r.contract_start_date, r.contract_end_date, r.created_at
from public.employment_records r
where r.contract_type is not null;

do $$
begin
  if exists (
    select 1 from public.employee_confidentiality_agreements c
    where not exists (select 1 from contract_map m where m.record_id = c.employment_record_id)
  ) then
    raise exception 'Hay confidencialidad ligada a un alta sin tipo de contrato; revísala antes de migrar';
  end if;
end;
$$;

insert into public.employee_contracts (id, employee_id, contract_type, start_date, end_date, created_at)
select contract_id, employee_id, contract_type, contract_start_date, contract_end_date, created_at
from contract_map;

-- 3. La confidencialidad apunta al contrato.
alter table public.employee_confidentiality_agreements add column contract_id uuid;

update public.employee_confidentiality_agreements c
set contract_id = m.contract_id
from contract_map m
where m.record_id = c.employment_record_id;

-- Al retirar la columna se retiran su FK, su índice y su unicidad por tipo.
alter table public.employee_confidentiality_agreements
  drop column employment_record_id,
  alter column contract_id set not null,
  add constraint employee_confidentiality_agreements_contract_fkey
    foreign key (contract_id, employee_id)
    references public.employee_contracts (id, employee_id) on delete restrict,
  add constraint employee_confidentiality_contract_kind_key
    unique (contract_id, document_kind);

create index employee_confidentiality_agreements_contract_idx
  on public.employee_confidentiality_agreements (contract_id, employee_id);

drop table contract_map;

-- 4. Opciones legibles de contrato para elegirlo en la confidencialidad. Hereda RLS.
drop view public.vw_employment_record_options;

create view public.vw_employee_contract_options
with (security_invoker = true)
as
select
  c.id,
  c.employee_id,
  concat_ws(
    ' · ',
    c.contract_type,
    'Inicio ' || to_char(c.start_date, 'DD/MM/YYYY'),
    'Término ' || to_char(c.end_date, 'DD/MM/YYYY')
  ) as label
from public.employee_contracts c;

revoke all on public.vw_employee_contract_options from anon;
grant select on public.vw_employee_contract_options to authenticated;

-- 5. Excel: V_ALTAS_BAJAS (`employment`) y V_CONTRATOS (`contracts`). Igual que la versión de
--    contract_dates salvo esos dos bloques.
CREATE OR REPLACE FUNCTION public.sync_read_snapshot(p_target text, p_lease_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
        coalesce(ch.manual_decision, 'Requerido') as applies
      from person p
      cross join public.document_types t
      left join public.employee_document_checklist ch on ch.employee_id = p.id and ch.document_type_id = t.id
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
          sd.birth_date, sd.curp, sd.rfc, sd.nss, sd.blood_type, sd.allergies,
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
        left join public.employee_sensitive_data sd on sd.employee_id = p.id
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
      'employment', (select coalesce(jsonb_agg(to_jsonb(t) order by t.full_name, t.hire_date desc nulls last), '[]'::jsonb) from (
        select p.full_name, r.company, r.hire_date, r.imss_registration_date, r.termination_date,
               r.status, r.work_center, r.area
        from public.employment_records r join person p on p.id = r.employee_id
      ) t),
      'contracts', (select coalesce(jsonb_agg(to_jsonb(t) order by t.full_name, t.start_date desc nulls last), '[]'::jsonb) from (
        select p.full_name, c.contract_type, c.start_date, c.end_date,
               (select a.signed_on from public.employee_confidentiality_agreements a
                 where a.contract_id = c.id and a.document_kind = 'Carta de confidencialidad') as confidentiality_letter_signed_on,
               (select a.signed_on from public.employee_confidentiality_agreements a
                 where a.contract_id = c.id and a.document_kind = 'Acuerdo de confidencialidad') as confidentiality_agreement_signed_on
        from public.employee_contracts c join person p on p.id = c.employee_id
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
      ) t),
      'bank_accounts', (select coalesce(jsonb_agg(to_jsonb(t) order by t.full_name, t.account_type nulls last), '[]'::jsonb) from (
        select p.full_name, p.status, ba.account_type, b.name as bank, ba.clabe, ba.account_number, ba.holder_name,
               null::text as control_note
        from public.employee_bank_accounts ba
        join person p on p.id = ba.employee_id
        join public.banks b on b.id = ba.bank_id
        union all
        select p.full_name, p.status, null, null, null, null, null, 'Sin cuenta de nómina'
        from person p
        where p.employment_status = 'active'
          and not exists (
            select 1 from public.employee_bank_accounts ba
            where ba.employee_id = p.id and ba.account_type = 'Nómina'
          )
      ) t)
    )
  );
end;
$function$;

-- 6. Las altas y bajas dejan de guardar el contrato.
alter table public.employment_records
  drop column contract_type,
  drop column contract_start_date,
  drop column contract_end_date,
  drop constraint employment_records_id_employee_id_key;

-- 7. Contrato, Carta y Acuerdo de confidencialidad en el control de cada persona.
insert into public.employee_document_checklist (employee_id, document_type_id)
select e.id, t.id
from public.employees e
cross join public.document_types t
where t.code in ('DOC-021', 'DOC-022', 'DOC-023')
on conflict (employee_id, document_type_id) do nothing;

-- Y en el de cada persona nueva, con los valores predeterminados (Requerido, Sin revisar).
create function private.add_labor_documents()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.employee_document_checklist (employee_id, document_type_id)
  select new.id, t.id
  from public.document_types t
  where t.code in ('DOC-021', 'DOC-022', 'DOC-023')
  on conflict (employee_id, document_type_id) do nothing;
  return null;
end;
$$;

revoke all on function private.add_labor_documents() from public, anon, authenticated;

create trigger employees_add_labor_documents
  after insert on public.employees
  for each row execute function private.add_labor_documents();
