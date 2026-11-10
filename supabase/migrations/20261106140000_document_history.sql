-- INE y licencia de conducir con histórico: varios registros por persona, exactamente uno vigente.
-- Los demás documentos siguen con un registro por persona y tipo. Los registros existentes quedan
-- vigentes. El control de documentos, el semáforo y V_DOCUMENTOS usan solo el vigente.

alter table public.employee_document_checklist
  add column is_current boolean not null default true;

comment on column public.employee_document_checklist.is_current is
  'Registro vigente de la persona y el tipo. Solo INE (DOC-014) y licencia (DOC-012) admiten históricos (false).';

-- La unicidad por persona y tipo pasa a aplicar solo entre vigentes.
alter table public.employee_document_checklist
  drop constraint employee_document_checklist_employee_id_document_type_id_key;
create unique index employee_document_checklist_current_key
  on public.employee_document_checklist (employee_id, document_type_id) where is_current;
create index employee_document_checklist_employee_type_idx
  on public.employee_document_checklist (employee_id, document_type_id);

-- Al guardar un registro vigente de INE o licencia, el anterior vigente pasa a histórico.
-- Los demás tipos no admiten históricos.
create function private.keep_single_current_document()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  document_code text;
begin
  select code into document_code from public.document_types where id = new.document_type_id;

  if document_code is distinct from 'DOC-014' and document_code is distinct from 'DOC-012' then
    if not new.is_current then
      raise exception 'Solo INE y licencia de conducir conservan histórico'
        using errcode = '23514', hint = 'document_history_not_allowed';
    end if;
    return new;
  end if;

  if new.is_current then
    update public.employee_document_checklist
    set is_current = false
    where employee_id = new.employee_id
      and document_type_id = new.document_type_id
      and is_current
      and id <> new.id;
  end if;
  return new;
end;
$$;

-- Si deja de haber vigente (se eliminó o se desmarcó), pasa a vigente el de vencimiento más reciente, de
-- preferencia otro registro distinto del que cambió. No actúa cuando el cambio viene de
-- otro trigger: al renovar, el anterior pasa a histórico antes de insertar el nuevo vigente.
create function private.promote_current_document()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if pg_trigger_depth() > 1 then
    return null;
  end if;

  if not exists (
    select 1 from public.employee_document_checklist
    where employee_id = old.employee_id and document_type_id = old.document_type_id and is_current
  ) then
    update public.employee_document_checklist
    set is_current = true
    where id = (
      select c.id from public.employee_document_checklist c
      where c.employee_id = old.employee_id and c.document_type_id = old.document_type_id
      order by c.id = old.id, c.expires_on desc nulls last, c.issued_on desc nulls last, c.created_at desc
      limit 1
    );
  end if;
  return null;
end;
$$;

revoke all on function private.keep_single_current_document() from public;
revoke all on function private.promote_current_document() from public;

create trigger employee_document_checklist_single_current
  before insert or update of is_current, employee_id, document_type_id
  on public.employee_document_checklist
  for each row execute function private.keep_single_current_document();
create trigger employee_document_checklist_promote_after_update
  after update of is_current, employee_id, document_type_id on public.employee_document_checklist
  for each row
  when (old.is_current and (not new.is_current
    or old.employee_id <> new.employee_id or old.document_type_id <> new.document_type_id))
  execute function private.promote_current_document();
create trigger employee_document_checklist_promote_after_delete
  after delete on public.employee_document_checklist
  for each row when (old.is_current)
  execute function private.promote_current_document();

-- Documentos laborales de cada persona nueva, con la unicidad parcial.
create or replace function private.add_labor_documents()
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
  on conflict (employee_id, document_type_id) where is_current do nothing;
  return null;
end;
$$;

-- Instantánea: misma proyección; el control documental une solo el registro vigente.
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
        e.notes,
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
      select a.employee_id, jrc.course_id, jrc.is_mandatory, null::date as deadline, null::text as notes
      from public.employee_assignments a
      join public.job_required_courses jrc on jrc.job_profile_id = a.job_profile_id
      join person p on p.id = a.employee_id and p.employment_status <> 'terminated'
      where (a.end_date is null or a.end_date >= current_date)
        and (a.start_date is null or a.start_date <= current_date)
      union all
      select a.employee_id, prc.course_id, prc.is_mandatory, null::date, null::text
      from public.employee_assignments a
      join public.project_required_courses prc
        on prc.job_profile_id = a.job_profile_id and prc.project_id = a.project_id
      join person p on p.id = a.employee_id and p.employment_status <> 'terminated'
      where (a.end_date is null or a.end_date >= current_date)
        and (a.start_date is null or a.start_date <= current_date)
      union all
      select r.employee_id, r.course_id, r.is_mandatory, r.deadline, r.notes
      from public.employee_course_requirements r
      join person p on p.id = r.employee_id and p.employment_status <> 'terminated'
    ),
    course_control as (
      select
        rc.employee_id,
        rc.course_id,
        bool_or(rc.is_mandatory) as is_mandatory,
        max(rc.deadline) as deadline,
        string_agg(distinct rc.notes, '; ') as notes
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
        p.employee_number,
        p.full_name,
        t.code,
        t.name as document_name,
        ch.review_status,
        ch.received_on,
        ch.issued_on,
        ch.expires_on,
        ch.validated_by,
        ch.ine_elector_key, ch.ine_cic, ch.ine_ocr,
        ch.license_number, ch.license_type, ch.license_state, ch.license_restrictions, ch.license_organ_donor,
        ch.notes,
        coalesce(ch.manual_decision, 'Requerido') as applies
      from person p
      cross join public.document_types t
      left join public.employee_document_checklist ch on ch.employee_id = p.id and ch.document_type_id = t.id
        and ch.is_current
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
        select p.employee_number, p.full_name, p.status, p.site, p.hire_date, p.termination_date, p.notes,
          p.education_level,
          sd.birth_date, sd.curp, sd.rfc, sd.nss, sd.blood_type, sd.allergies, sd.has_medical_certificate, sd.medical_certificate_date,
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
          (select count(*) filter (where d.traffic_light = 'CUMPLE') from document_status d where d.employee_id = p.id) as docs_validated,
          (select count(*) filter (where d.traffic_light in ('PENDIENTE', 'VENCIDO')) from document_status d where d.employee_id = p.id) as docs_pending,
          (select count(*) filter (where d.traffic_light = 'POR DEFINIR') from document_status d where d.employee_id = p.id) as docs_undefined,
          (select count(*) filter (where c.compliance <> 'Cubierto') from control_status c where c.employee_id = p.id) as courses_pending
        from person p
        left join public.employee_sensitive_data sd on sd.employee_id = p.id
      ) t),
      'phones', (select coalesce(jsonb_agg(to_jsonb(t) order by t.full_name), '[]'::jsonb) from (
        select p.full_name, p.employee_number, p.site, f.phone_type, f.phone_number, f.extension, f.is_primary,
               f.is_current, f.updated_at::date as updated_on, f.notes
        from public.employee_phones f join person p on p.id = f.employee_id
      ) t),
      'emails', (select coalesce(jsonb_agg(to_jsonb(t) order by t.full_name, t.email_type, t.email), '[]'::jsonb) from (
        select p.full_name, p.employee_number, p.site, m.email_type, m.email, m.is_primary, m.is_active, m.notes
        from public.employee_emails m join person p on p.id = m.employee_id
      ) t),
      'contacts', (select coalesce(jsonb_agg(to_jsonb(t) order by t.full_name, t.contact_type desc, t.is_primary desc nulls last, t.created_at), '[]'::jsonb) from (
        select p.full_name, p.employee_number, p.site, 'Emergencia' as contact_type, em.full_name as contact_name,
               em.relationship, em.phone, em.is_primary, em.notes, em.created_at
        from public.emergency_contacts em join person p on p.id = em.employee_id
        union all
        select p.full_name, p.employee_number, p.site, 'Beneficiario', b.full_name, b.relationship, b.phone,
               null::boolean, b.notes, b.created_at
        from public.beneficiaries b join person p on p.id = b.employee_id
      ) t),
      'work_sites', (select coalesce(jsonb_agg(to_jsonb(t) order by t.full_name, t.start_date desc nulls last), '[]'::jsonb) from (
        select p.full_name, p.employee_number, w.site, w.site_type, w.start_date, w.end_date, w.is_current, w.notes
        from public.employee_work_sites w join person p on p.id = w.employee_id
      ) t),
      'addresses', (select coalesce(jsonb_agg(to_jsonb(t) order by t.full_name, t.is_current desc, t.address_type), '[]'::jsonb) from (
        select p.full_name, p.employee_number, a.address_type, a.street, a.exterior_number, a.interior_number,
               a.neighborhood, a.postal_code, a.city, a.state, a.country, a.is_current, a.verified_on, a.notes,
               nullif(concat_ws(', ',
                 nullif(concat_ws(' ', nullif(a.street, ''), nullif(a.exterior_number, ''),
                   'Int. ' || nullif(a.interior_number, '')), ''),
                 nullif(a.neighborhood, ''),
                 'C.P. ' || nullif(a.postal_code, ''),
                 nullif(a.city, ''),
                 nullif(a.state, '')), '') as full_address
        from public.employee_addresses a join person p on p.id = a.employee_id
      ) t),
      'education', (select coalesce(jsonb_agg(to_jsonb(t) order by t.full_name), '[]'::jsonb) from (
        select p.full_name, p.employee_number, d.level, d.degree_title, d.institution, d.professional_license,
               d.start_date, d.end_date, d.municipality, d.state, d.country,
               d.certificate_status, d.diploma_status, d.license_status, d.validation_status,
               d.is_highest_level, d.reviewed_on, d.reviewed_by, d.notes,
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
        select p.full_name, p.employee_number, x.company, x.company_type, x.start_date, x.end_date, x.period_text,
               x.position_title, x.project_name, x.activities, x.municipality, x.state, x.country,
               x.work_location_detail, x.work_reference, x.verification_status, x.notes
        from public.employee_experience x join person p on p.id = x.employee_id
      ) t),
      'employment', (select coalesce(jsonb_agg(to_jsonb(t) order by t.full_name, t.hire_date desc nulls last), '[]'::jsonb) from (
        select p.full_name, p.employee_number, r.company, r.hire_date, r.imss_registration_date, r.termination_date,
               r.status, r.work_center, r.area, r.notes,
               row_number() over (partition by r.employee_id
                 order by r.hire_date desc nulls last, r.created_at desc) = 1 as is_latest
        from public.employment_records r join person p on p.id = r.employee_id
      ) t),
      'contracts', (select coalesce(jsonb_agg(to_jsonb(t) order by t.full_name, t.start_date desc nulls last), '[]'::jsonb) from (
        select p.full_name, p.employee_number, c.contract_type, c.start_date, c.end_date, c.notes,
               row_number() over (partition by c.employee_id
                 order by c.start_date desc nulls last, c.created_at desc) = 1 as is_latest
        from public.employee_contracts c join person p on p.id = c.employee_id
      ) t),
      -- Cartas y acuerdos por persona, sin enlace de SharePoint ni contrato.
      'confidentiality', (select coalesce(jsonb_agg(to_jsonb(t) order by t.full_name, t.document_kind, t.signed_on desc), '[]'::jsonb) from (
        select p.full_name, p.employee_number, a.document_kind, a.signed_on, a.notes,
               row_number() over (partition by a.employee_id, a.document_kind
                 order by a.signed_on desc, a.created_at desc) = 1 as is_latest
        from public.employee_confidentiality_agreements a join person p on p.id = a.employee_id
      ) t),
      'job_profiles', (select coalesce(jsonb_agg(to_jsonb(t) order by t.name), '[]'::jsonb) from (
        select jp.name, jp.area, jp.description, jp.profile_version, jp.is_active, jp.notes from public.job_profiles jp
      ) t),
      'projects', (select coalesce(jsonb_agg(to_jsonb(t) order by t.name), '[]'::jsonb) from (
        select pr.name, pr.tender_number, pr.client, pr.location, pr.start_date, pr.end_date, pr.status, pr.notes,
          (select count(*) from assignment a where a.project_id = pr.id
            and (a.end_date is null or a.end_date >= current_date)
            and (a.start_date is null or a.start_date <= current_date)) as people
        from public.projects pr
      ) t),
      'assignments', (select coalesce(jsonb_agg(to_jsonb(t) order by t.full_name, t.start_date desc nulls last), '[]'::jsonb) from (
        select a.employee_number, a.full_name, a.job_profile, a.project, a.start_date, a.end_date, a.is_primary,
               a.work_center, a.notes
        from assignment a
      ) t),
      'courses', (select coalesce(jsonb_agg(to_jsonb(t) order by t.name), '[]'::jsonb) from (
        select c.name, c.category, c.description, c.required_evidence, c.standard_or_body,
               coalesce(c.validity_months, 0) as validity_months, c.is_active, c.notes
        from public.courses c
      ) t),
      'requirements', (select coalesce(jsonb_agg(to_jsonb(t) order by t.project nulls first, t.job_profile, t.course), '[]'::jsonb) from (
        select null::text as project, jp.name as job_profile, c.name as course, c.required_evidence, jrc.is_mandatory,
               jrc.periodicity_months, null::text as source, jrc.notes
        from public.job_required_courses jrc
        join public.job_profiles jp on jp.id = jrc.job_profile_id
        join public.courses c on c.id = jrc.course_id
        union all
        select pr.name, jp.name, c.name, c.required_evidence, prc.is_mandatory, null::integer, prc.source, prc.notes
        from public.project_required_courses prc
        join public.projects pr on pr.id = prc.project_id
        join public.job_profiles jp on jp.id = prc.job_profile_id
        join public.courses c on c.id = prc.course_id
      ) t),
      'accreditations', (select coalesce(jsonb_agg(to_jsonb(t) order by t.full_name, t.course), '[]'::jsonb) from (
        select a.employee_number, a.full_name, a.course, a.completed_on, a.expires_on, a.evidence_type, a.certificate_folio,
               a.validity_months, a.validity, a.issuer, a.duration_hours, a.notes
        from accreditation a
      ) t),
      'course_controls', (select coalesce(jsonb_agg(to_jsonb(t) order by t.full_name, t.course), '[]'::jsonb) from (
        select p.full_name, p.employee_number, c.name as course, cs.is_mandatory, cs.deadline, cs.compliance, cs.notes
        from control_status cs
        join person p on p.id = cs.employee_id
        join public.courses c on c.id = cs.course_id
      ) t),
      'documents', (select coalesce(jsonb_agg(to_jsonb(t) order by t.full_name, t.code), '[]'::jsonb) from (
        select d.full_name, d.employee_number, d.code, d.document_name, d.applies,
               coalesce(d.review_status, 'Sin revisar') as review_status,
               d.received_on, d.issued_on, d.expires_on, d.validated_by, d.traffic_light, d.notes,
               d.ine_elector_key, d.ine_cic, d.ine_ocr, d.license_number, d.license_type, d.license_state,
               d.license_restrictions, d.license_organ_donor
        from document_status d
      ) t),
      'document_types', (select coalesce(jsonb_agg(to_jsonb(t) order by t.code), '[]'::jsonb) from (
        select dt.code, dt.name, dt.document_group, dt.applicability_rule, dt.expected_validity, dt.instructions
        from public.document_types dt
      ) t),
      'systems', (select coalesce(jsonb_agg(to_jsonb(t) order by t.name), '[]'::jsonb) from (
        select s.name, s.purpose, s.responsible_area, s.is_active, s.notes from public.external_systems s
      ) t),
      'control_numbers', (select coalesce(jsonb_agg(to_jsonb(t) order by t.full_name, t.system_name), '[]'::jsonb) from (
        select p.full_name, p.employee_number, s.name as system_name, n.control_number, n.status, n.work_center,
               n.assigned_on, n.ended_on, n.verified_on, n.notes
        from public.employee_control_numbers n
        join person p on p.id = n.employee_id
        join public.external_systems s on s.id = n.system_id
      ) t),
      'credits', (select coalesce(jsonb_agg(to_jsonb(t) order by t.full_name, t.credit_type, t.credit_number), '[]'::jsonb) from (
        select p.full_name, p.employee_number, c.credit_type, c.credit_number
        from public.employee_credits c join person p on p.id = c.employee_id
      ) t),
      -- Sin comprobante ni observaciones de las cuentas.
      'bank_accounts', (select coalesce(jsonb_agg(to_jsonb(t) order by t.full_name, t.account_type nulls last), '[]'::jsonb) from (
        select p.full_name, p.employee_number, p.status, ba.account_type, b.name as bank, ba.clabe, ba.account_number,
               ba.holder_name, null::text as control_note
        from public.employee_bank_accounts ba
        join person p on p.id = ba.employee_id
        join public.banks b on b.id = ba.bank_id
        union all
        select p.full_name, p.employee_number, p.status, null, null, null, null, null, 'Sin cuenta de nómina'
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
