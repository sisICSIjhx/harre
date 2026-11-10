-- Solo desarrollo. Ejecutar con psql -v ON_ERROR_STOP=1; toda captura se revierte.
begin;
select set_config('test.hr', gen_random_uuid()::text, true);
select set_config('test.other', gen_random_uuid()::text, true);
select set_config('test.employee', gen_random_uuid()::text, true);
select set_config('test.assignment', gen_random_uuid()::text, true);
select set_config('test.job', gen_random_uuid()::text, true);
select set_config('test.ine', gen_random_uuid()::text, true);
select set_config('test.license', gen_random_uuid()::text, true);

insert into auth.users (id, email) values
  (current_setting('test.hr')::uuid, current_setting('test.hr') || '@qa.invalid'),
  (current_setting('test.other')::uuid, current_setting('test.other') || '@qa.invalid');
update public.profiles set is_active = true
where id in (current_setting('test.hr')::uuid, current_setting('test.other')::uuid);
insert into public.user_roles (user_id, role_id)
select current_setting('test.hr')::uuid, id from public.roles where code = 'hr';
insert into public.user_roles (user_id, role_id)
select current_setting('test.other')::uuid, id from public.roles where code in ('viewer', 'payroll', 'admin');
insert into public.employees (id, employee_number, first_name)
values (current_setting('test.employee')::uuid, 'QA-' || current_setting('test.employee'), 'Persona ficticia de prueba');
insert into public.job_profiles (id, name)
values (current_setting('test.job')::uuid, 'Puesto ficticio ' || current_setting('test.job'));
select set_config('test.revision', pending_revision::text, true)
from public.sync_state where target = 'personal-icsi';

select set_config('request.jwt.claim.sub', current_setting('test.hr'), true);
set local role authenticated;
insert into public.employee_assignments (id, employee_id, job_profile_id, is_primary)
values (current_setting('test.assignment')::uuid, current_setting('test.employee')::uuid, current_setting('test.job')::uuid, true);
insert into public.employee_document_checklist
  (id, employee_id, document_type_id, ine_elector_key, ine_cic, ine_ocr, issued_on, expires_on, document_url)
select current_setting('test.ine')::uuid, current_setting('test.employee')::uuid, id,
  'CLAVE-FICTICIA', '000123', '000456', '2026-01-01', '2030-12-31', 'https://example.invalid/qa'
from public.document_types where code = 'DOC-014';
insert into public.employee_document_checklist
  (id, employee_id, document_type_id, license_number, license_type, license_state,
   license_restrictions, license_organ_donor, issued_on, expires_on)
select current_setting('test.license')::uuid, current_setting('test.employee')::uuid, id,
  '000789', 'Tipo de prueba', 'Estado de prueba', 'Usar lentes', 'Sí', '2026-01-01', '2028-12-31'
from public.document_types where code = 'DOC-012';

do $$
declare
  v_hint text;
begin
  if (select count(*) from public.employee_document_checklist where id in
      (current_setting('test.ine')::uuid, current_setting('test.license')::uuid)) <> 2 then
    raise exception 'No se guardaron ambos documentos';
  end if;
  begin
    update public.employee_document_checklist set expires_on = '2025-12-31'
    where id = current_setting('test.ine')::uuid;
    raise exception 'Se aceptaron fechas invertidas';
  exception when check_violation then
    get stacked diagnostics v_hint = pg_exception_hint;
    if v_hint <> 'document_expiry_before_issue' then raise exception 'Hint incorrecto'; end if;
  end;
  begin
    update public.employee_document_checklist set ine_cic = 'NO-APLICA'
    where id = current_setting('test.license')::uuid;
    raise exception 'Se mezclaron campos INE con licencia';
  exception when check_violation then
    get stacked diagnostics v_hint = pg_exception_hint;
    if v_hint <> 'document_fields_mismatch' then raise exception 'Hint incorrecto'; end if;
  end;
  begin
    update public.employee_document_checklist set license_number = 'NO-APLICA'
    where id = current_setting('test.ine')::uuid;
    raise exception 'Se mezclaron campos licencia con INE';
  exception when check_violation then null;
  end;
  begin
    update public.employee_document_checklist set license_organ_donor = 'Sí'
    where id = current_setting('test.ine')::uuid;
    raise exception 'Se aceptó donador de órganos en INE';
  exception when check_violation then null;
  end;
  -- Los demás documentos siguen con un registro por persona y tipo, sin histórico.
  begin
    insert into public.employee_document_checklist (employee_id, document_type_id)
    select current_setting('test.employee')::uuid, id from public.document_types where code = 'DOC-021';
    raise exception 'Se aceptó un duplicado';
  exception when unique_violation then null;
  end;
  begin
    update public.employee_document_checklist set is_current = false
    where employee_id = current_setting('test.employee')::uuid
      and document_type_id = (select id from public.document_types where code = 'DOC-021');
    raise exception 'Se aceptó histórico en otro documento';
  exception when check_violation then
    get stacked diagnostics v_hint = pg_exception_hint;
    if v_hint <> 'document_history_not_allowed' then raise exception 'Hint incorrecto'; end if;
  end;
  update public.employee_document_checklist set ine_cic = '000999'
  where id = current_setting('test.ine')::uuid;
end;
$$;

-- Histórico de INE: la nueva queda vigente; la anterior se conserva.
select set_config('test.ine2', gen_random_uuid()::text, true);
select set_config('test.ine_old', gen_random_uuid()::text, true);
insert into public.employee_document_checklist (id, employee_id, document_type_id, ine_cic, issued_on, expires_on)
select current_setting('test.ine2')::uuid, current_setting('test.employee')::uuid, id, '000777', '2031-01-01', '2040-12-31'
from public.document_types where code = 'DOC-014';
insert into public.employee_document_checklist (id, employee_id, document_type_id, issued_on, expires_on, is_current)
select current_setting('test.ine_old')::uuid, current_setting('test.employee')::uuid, id, '2010-01-01', '2020-12-31', false
from public.document_types where code = 'DOC-014';
do $$
declare v_current uuid[];
begin
  select array_agg(id) into v_current from public.employee_document_checklist
  where employee_id = current_setting('test.employee')::uuid and is_current
    and document_type_id = (select id from public.document_types where code = 'DOC-014');
  if v_current is distinct from array[current_setting('test.ine2')::uuid] then
    raise exception 'La renovación no dejó vigente solo la nueva INE';
  end if;
  if (select count(*) from public.employee_document_checklist
      where employee_id = current_setting('test.employee')::uuid
        and document_type_id = (select id from public.document_types where code = 'DOC-014')) <> 3 then
    raise exception 'No se conservó el histórico de INE';
  end if;
  -- Al eliminar la vigente, pasa a vigente la de vencimiento más reciente.
  delete from public.employee_document_checklist where id = current_setting('test.ine2')::uuid;
  if not (select is_current from public.employee_document_checklist where id = current_setting('test.ine')::uuid) then
    raise exception 'No se promovió la INE anterior';
  end if;
  -- Desmarcar la vigente promueve otra; nunca queda sin vigente.
  update public.employee_document_checklist set is_current = false where id = current_setting('test.ine')::uuid;
  if not (select is_current from public.employee_document_checklist where id = current_setting('test.ine_old')::uuid) then
    raise exception 'No se promovió otra INE al desmarcar';
  end if;
  update public.employee_document_checklist set is_current = true where id = current_setting('test.ine')::uuid;
end;
$$;

-- Sin RRHH: ni lectura de documentos ni escritura/borrado, aunque tenga los otros roles.
reset role;
select set_config('request.jwt.claim.sub', current_setting('test.other'), true);
set local role authenticated;
do $$
declare affected integer;
begin
  if exists (select 1 from public.employee_document_checklist where employee_id = current_setting('test.employee')::uuid) then
    raise exception 'Fuga de documentos a otro rol';
  end if;
  update public.employee_document_checklist set ine_cic = 'NO-PERMITIDO'
  where id = current_setting('test.ine')::uuid;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Otro rol editó INE'; end if;
  delete from public.employee_assignments where id = current_setting('test.assignment')::uuid;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Otro rol eliminó puesto'; end if;
  begin
    insert into public.employee_document_checklist (employee_id, document_type_id)
    select current_setting('test.employee')::uuid, id from public.document_types where code = 'DOC-014';
    raise exception 'Otro rol insertó documento';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', current_setting('test.hr'), true);
set local role authenticated;
delete from public.employee_assignments where id = current_setting('test.assignment')::uuid;
do $$
begin
  if not exists (select 1 from public.job_profiles where id = current_setting('test.job')::uuid)
    or not exists (select 1 from public.employees where id = current_setting('test.employee')::uuid) then
    raise exception 'Se borró el catálogo o la persona';
  end if;
  if exists (select 1 from public.vw_employee_directory
             where id = current_setting('test.employee')::uuid and job_profile_name is not null) then
    raise exception 'El directorio conservó el puesto eliminado';
  end if;
  if not exists (select 1 from public.audit_logs where employee_id = current_setting('test.employee')::uuid
      and table_name = 'employee_assignments' and action = 'delete' and actor_id = current_setting('test.hr')::uuid) then
    raise exception 'Falta auditoría del borrado';
  end if;
  if not exists (select 1 from public.audit_logs where record_id = current_setting('test.ine')
      and action = 'update' and new_data ->> 'ine_cic' = '000999') then
    raise exception 'Falta auditoría de INE';
  end if;
end;
$$;

reset role;
update public.sync_state set lease_token = gen_random_uuid(), lease_expires_at = now() + interval '1 minute'
where target = 'personal-icsi';
do $$
declare payload jsonb; document jsonb;
begin
  if (select pending_revision from public.sync_state where target = 'personal-icsi') <= current_setting('test.revision')::bigint then
    raise exception 'No se encolaron cambios';
  end if;
  select public.sync_read_snapshot(target, lease_token) into payload from public.sync_state where target = 'personal-icsi';
  if (select count(*) from jsonb_array_elements(payload -> 'documents')
      where value ->> 'employee_number' = 'QA-' || current_setting('test.employee') and value ->> 'code' = 'DOC-014') <> 1 then
    raise exception 'La instantánea no tiene una sola INE';
  end if;
  select value into document from jsonb_array_elements(payload -> 'documents')
  where value ->> 'employee_number' = 'QA-' || current_setting('test.employee') and value ->> 'code' = 'DOC-014';
  if document is null or document ->> 'ine_cic' <> '000999' or document ? 'document_url' then
    raise exception 'Instantánea documental incorrecta';
  end if;
  select value into document from jsonb_array_elements(payload -> 'documents')
  where value ->> 'employee_number' = 'QA-' || current_setting('test.employee') and value ->> 'code' = 'DOC-012';
  if document is null or document ->> 'license_number' <> '000789'
     or document ->> 'license_restrictions' <> 'Usar lentes' or document ->> 'license_organ_donor' <> 'Sí' then
    raise exception 'Falta número de licencia en instantánea';
  end if;
end;
$$;
rollback;
\echo 'OK: captura, fechas, separación, unicidad, histórico, RLS, borrado, auditoría, cola y snapshot; todo revertido.'
