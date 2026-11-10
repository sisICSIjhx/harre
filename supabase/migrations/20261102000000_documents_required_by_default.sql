-- Todo documento es requerido salvo que RRHH indique otra cosa para esa persona.
-- La regla del catálogo deja de decidir si un documento aplica.

update public.employee_document_checklist
set manual_decision = 'Requerido'
where manual_decision is null;

alter table public.employee_document_checklist
  alter column manual_decision set default 'Requerido',
  alter column manual_decision set not null;

-- Igual que en adapt_to_workbook, salvo el cálculo de `applies`.
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
