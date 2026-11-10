-- Datos bancarios del personal: hasta una cuenta de Nómina y una Alternativa por persona.
-- Rol `payroll` (Nómina): lee lo mismo que `viewer` más las cuentas, sin escribir.

insert into public.roles (code, name) values ('payroll', 'Nómina');

-- CLABE: 18 dígitos; el último es el verificador con pesos 3, 7, 1 sobre los 17 primeros.
-- Misma regla que `src/shared/lib/clabe.ts`.
create function private.is_valid_clabe(p_clabe text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_sum integer := 0;
  i integer;
begin
  if p_clabe is null then
    return null;
  end if;
  if p_clabe !~ '^[0-9]{18}$' then
    return false;
  end if;
  for i in 1..17 loop
    v_sum := v_sum + (substr(p_clabe, i, 1)::integer * (array[3, 7, 1])[(i - 1) % 3 + 1]) % 10;
  end loop;
  return (10 - v_sum % 10) % 10 = substr(p_clabe, 18, 1)::integer;
end;
$$;

revoke all on function private.is_valid_clabe(text) from public;
grant execute on function private.is_valid_clabe(text) to authenticated, service_role;

-- Catálogo de bancos. La clave es el prefijo de la CLABE (los tres últimos dígitos de la clave
-- SPEI de Banxico); puede faltar en instituciones agregadas por RRHH.
create table public.banks (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text unique check (code ~ '^[0-9]{3}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger banks_set_updated_at
  before update on public.banks
  for each row execute function private.set_updated_at();

-- Claves verificadas contra el catálogo de participantes SPEI de Banxico (2026-11-02).
insert into public.banks (name, code) values
  ('Banamex', '002'),
  ('BBVA México', '012'),
  ('Santander', '014'),
  ('Banjército', '019'),
  ('HSBC', '021'),
  ('Banco del Bajío', '030'),
  ('Inbursa', '036'),
  ('Mifel', '042'),
  ('Scotiabank', '044'),
  ('Banregio', '058'),
  ('Afirme', '062'),
  ('Banorte', '072'),
  ('Banco Azteca', '127'),
  ('Compartamos', '130'),
  ('BanCoppel', '137'),
  ('Ualá', '138'),
  ('Banco del Bienestar', '166'),
  ('Hey Banco', '167'),
  ('Nu México', '638'),
  ('STP', '646'),
  ('Klar', '661'),
  ('Mercado Pago', '722'),
  ('Spin by OXXO', '728');

create table public.employee_bank_accounts (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete restrict,
  account_type text not null check (account_type in ('Nómina', 'Alternativa')),
  bank_id uuid not null references public.banks (id) on delete restrict,
  clabe text not null check (private.is_valid_clabe(clabe)),
  account_number text,
  holder_name text,
  document_url text check (document_url ~* '^https?://'),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, account_type)
);

create index employee_bank_accounts_bank_id_idx on public.employee_bank_accounts (bank_id);

create trigger employee_bank_accounts_set_updated_at
  before update on public.employee_bank_accounts
  for each row execute function private.set_updated_at();

-- Un `check` no puede consultar otra tabla: la congruencia con el banco va por trigger.
create function private.check_bank_account_clabe()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
begin
  select b.code into v_code from public.banks b where b.id = new.bank_id;
  if v_code is not null and left(new.clabe, 3) <> v_code then
    raise exception 'La CLABE no corresponde al banco elegido'
      using errcode = '23514', hint = 'clabe_bank_mismatch';
  end if;
  return new;
end;
$$;

revoke all on function private.check_bank_account_clabe() from public;

create trigger employee_bank_accounts_check_clabe
  before insert or update on public.employee_bank_accounts
  for each row execute function private.check_bank_account_clabe();

-- Historial y publicación del Excel, como las demás tablas del expediente.
create trigger banks_audit
  after insert or update or delete on public.banks
  for each row execute function private.audit_row_change();
create trigger banks_enqueue_sync
  after insert or update or delete on public.banks
  for each row execute function private.enqueue_sync();
create trigger employee_bank_accounts_audit
  after insert or update or delete on public.employee_bank_accounts
  for each row execute function private.audit_row_change();
create trigger employee_bank_accounts_enqueue_sync
  after insert or update or delete on public.employee_bank_accounts
  for each row execute function private.enqueue_sync();

-- Permisos. Las políticas de Nómina son nuevas y permisivas: se suman a las existentes sin
-- modificarlas.
alter table public.banks enable row level security;
alter table public.employee_bank_accounts enable row level security;
revoke all on public.banks from anon;
revoke all on public.employee_bank_accounts from anon;

create policy banks_select on public.banks
  for select to authenticated
  using (private.has_role('hr') or private.has_role('viewer') or private.has_role('payroll'));

create policy banks_hr_write on public.banks
  for all to authenticated
  using (private.has_role('hr')) with check (private.has_role('hr'));

create policy employee_bank_accounts_hr_all on public.employee_bank_accounts
  for all to authenticated
  using (private.has_role('hr')) with check (private.has_role('hr'));

create policy employee_bank_accounts_payroll_select on public.employee_bank_accounts
  for select to authenticated
  using (private.has_role('payroll'));

-- Nómina lee la información general que hoy lee `viewer`.
do $$
declare
  t text;
begin
  foreach t in array array[
    'employees', 'employee_assignments', 'job_profiles', 'projects', 'courses',
    'job_required_courses', 'project_required_courses', 'document_types',
    'education_document_rules', 'external_systems'
  ] loop
    execute format(
      'create policy %I on public.%I for select to authenticated
         using (private.has_role(''payroll''))',
      t || '_payroll_select', t
    );
  end loop;
end;
$$;

-- Columna nueva al final: el directorio conserva su contrato. Para perfiles sin acceso a las
-- cuentas llega vacía, no `false`.
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
  current_site.site,
  case
    when private.has_role('hr') or private.has_role('payroll') then exists (
      select 1 from public.employee_bank_accounts ba
      where ba.employee_id = e.id and ba.account_type = 'Nómina'
    )
  end as has_payroll_account
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

-- Igual que en publish_personal_data, más `bank_accounts`: una fila por cuenta y una marca por
-- persona activa sin cuenta de Nómina. Sin comprobante ni observaciones.
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
$$;
