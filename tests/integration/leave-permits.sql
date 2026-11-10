-- Solo desarrollo. Ejecutar con psql -v ON_ERROR_STOP=1; toda captura se revierte.
-- Permisos del personal y documentos firmados nuevos (vehículo, acta y préstamo).
begin;
select set_config('test.hr', gen_random_uuid()::text, true);
select set_config('test.payroll', gen_random_uuid()::text, true);
select set_config('test.other', gen_random_uuid()::text, true);
select set_config('test.employee', gen_random_uuid()::text, true);

insert into auth.users (id, email) values
  (current_setting('test.hr')::uuid, current_setting('test.hr') || '@qa.invalid'),
  (current_setting('test.payroll')::uuid, current_setting('test.payroll') || '@qa.invalid'),
  (current_setting('test.other')::uuid, current_setting('test.other') || '@qa.invalid');
update public.profiles set is_active = true
where id in (current_setting('test.hr')::uuid, current_setting('test.payroll')::uuid, current_setting('test.other')::uuid);
insert into public.user_roles (user_id, role_id)
select current_setting('test.hr')::uuid, id from public.roles where code = 'hr';
insert into public.user_roles (user_id, role_id)
select current_setting('test.payroll')::uuid, id from public.roles where code = 'payroll';
insert into public.user_roles (user_id, role_id)
select current_setting('test.other')::uuid, id from public.roles where code in ('viewer', 'admin');
insert into public.employees (id, employee_number, first_name)
values (current_setting('test.employee')::uuid, 'QA-' || current_setting('test.employee'), 'Persona ficticia de prueba');
select set_config('test.revision', pending_revision::text, true)
from public.sync_state where target = 'personal-icsi';

select set_config('request.jwt.claim.sub', current_setting('test.hr'), true);
set local role authenticated;
do $$
declare e uuid := current_setting('test.employee')::uuid; v_end date;
begin
  insert into public.employee_leave_permits (employee_id, permit_type, start_date, reason)
  values (e, 'Días', '2026-11-10', 'Motivo ficticio') returning end_date into v_end;
  if v_end <> '2026-11-10' then raise exception 'El término no tomó la fecha de inicio'; end if;
  insert into public.employee_leave_permits (employee_id, permit_type, start_date, end_date, start_time, end_time, reason)
  values (e, 'Horas', '2026-11-11', '2026-11-12', '09:00', '11:30', 'Motivo ficticio');

  begin
    insert into public.employee_leave_permits (employee_id, permit_type, start_date, start_time, reason)
    values (e, 'Horas', '2026-11-10', '09:00', 'x');
    raise exception 'Se aceptó un permiso por horas sin hora de término';
  exception when check_violation then null;
  end;
  begin
    insert into public.employee_leave_permits (employee_id, permit_type, start_date, start_time, end_time, reason)
    values (e, 'Horas', '2026-11-10', '11:00', '11:00', 'x');
    raise exception 'Se aceptó una hora de término no posterior';
  exception when check_violation then null;
  end;
  begin
    insert into public.employee_leave_permits (employee_id, permit_type, start_date, start_time, end_time, reason)
    values (e, 'Días', '2026-11-10', '09:00', '10:00', 'x');
    raise exception 'Se aceptaron horas en un permiso por días';
  exception when check_violation then null;
  end;
  begin
    insert into public.employee_leave_permits (employee_id, permit_type, start_date, end_date, reason)
    values (e, 'Días', '2026-11-10', '2026-11-09', 'x');
    raise exception 'Se aceptó un término anterior al inicio';
  exception when check_violation then null;
  end;
  begin
    insert into public.employee_leave_permits (employee_id, permit_type, start_date, reason)
    values (e, 'Días', '2026-11-10', '   ');
    raise exception 'Se aceptó un motivo vacío';
  exception when check_violation then null;
  end;

  insert into public.employee_confidentiality_agreements (employee_id, document_kind, signed_on, amount) values
    (e, 'Resguardo de vehículo', '2026-11-01', null),
    (e, 'Acta administrativa', '2026-11-02', null),
    (e, 'Préstamo', '2026-11-03', 5000);
  begin
    insert into public.employee_confidentiality_agreements (employee_id, document_kind, signed_on)
    values (e, 'Préstamo', '2026-11-03');
    raise exception 'Se aceptó un préstamo sin cantidad';
  exception when check_violation then null;
  end;
  begin
    insert into public.employee_confidentiality_agreements (employee_id, document_kind, signed_on, amount)
    values (e, 'Préstamo', '2026-11-03', 0);
    raise exception 'Se aceptó un préstamo en cero';
  exception when check_violation then null;
  end;
  begin
    insert into public.employee_confidentiality_agreements (employee_id, document_kind, signed_on, amount)
    values (e, 'Acta administrativa', '2026-11-03', 10);
    raise exception 'Se aceptó una cantidad fuera de un préstamo';
  exception when check_violation then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', current_setting('test.payroll'), true);
do $$
declare affected integer;
begin
  if (select count(*) from public.employee_leave_permits where employee_id = current_setting('test.employee')::uuid) <> 2 then
    raise exception 'Nómina no lee los permisos';
  end if;
  update public.employee_leave_permits set reason = 'X' where employee_id = current_setting('test.employee')::uuid;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Nómina editó un permiso'; end if;
  delete from public.employee_leave_permits where employee_id = current_setting('test.employee')::uuid;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Nómina eliminó un permiso'; end if;
  begin
    insert into public.employee_leave_permits (employee_id, permit_type, start_date, reason)
    values (current_setting('test.employee')::uuid, 'Días', '2026-11-10', 'x');
    raise exception 'Nómina insertó un permiso';
  exception when insufficient_privilege then null;
  end;
  if exists (select 1 from public.employee_confidentiality_agreements where employee_id = current_setting('test.employee')::uuid) then
    raise exception 'Nómina leyó documentos firmados';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', current_setting('test.other'), true);
do $$
declare affected integer;
begin
  if exists (select 1 from public.employee_leave_permits where employee_id = current_setting('test.employee')::uuid) then
    raise exception 'Fuga de permisos a otro rol';
  end if;
  update public.employee_leave_permits set reason = 'X' where employee_id = current_setting('test.employee')::uuid;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Otro rol editó un permiso'; end if;
  begin
    insert into public.employee_leave_permits (employee_id, permit_type, start_date, reason)
    values (current_setting('test.employee')::uuid, 'Días', '2026-11-10', 'x');
    raise exception 'Otro rol insertó un permiso';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
update public.sync_state set lease_token = gen_random_uuid(), lease_expires_at = now() + interval '1 minute'
where target = 'personal-icsi';
do $$
declare payload jsonb; permits jsonb; loans jsonb;
begin
  if (select pending_revision from public.sync_state where target = 'personal-icsi') <= current_setting('test.revision')::bigint then
    raise exception 'No se encolaron cambios';
  end if;
  if (select count(*) from public.audit_logs where table_name = 'employee_leave_permits'
        and record_id in (select id::text from public.employee_leave_permits
                          where employee_id = current_setting('test.employee')::uuid)) < 2 then
    raise exception 'Falta auditoría de permisos';
  end if;
  select public.sync_read_snapshot(target, lease_token) into payload from public.sync_state where target = 'personal-icsi';
  select jsonb_agg(value) into permits from jsonb_array_elements(payload -> 'permits')
  where value ->> 'employee_number' = 'QA-' || current_setting('test.employee');
  if jsonb_array_length(permits) <> 2
     or not permits @> '[{"permit_type": "Horas", "start_time": "09:00", "end_time": "11:30", "days": 2, "hours_per_day": 2.50}]'::jsonb
     or not permits @> '[{"permit_type": "Días", "days": 1, "end_date": "2026-11-10"}]'::jsonb then
    raise exception 'Instantánea de permisos incorrecta: %', permits;
  end if;
  select jsonb_agg(value) into loans from jsonb_array_elements(payload -> 'confidentiality')
  where value ->> 'employee_number' = 'QA-' || current_setting('test.employee')
    and value ->> 'document_kind' = 'Préstamo';
  if not loans @> '[{"amount": 5000.00}]'::jsonb then
    raise exception 'Instantánea de préstamos incorrecta: %', loans;
  end if;
end;
$$;
rollback;
\echo 'OK: término por omisión, reglas de horas y fechas, motivo, documentos nuevos, lectura de Nómina, aislamiento, auditoría, cola y snapshot; todo revertido.'
