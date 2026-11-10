-- Solo desarrollo. Ejecutar con psql -v ON_ERROR_STOP=1; toda captura se revierte.
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
begin
  insert into public.employee_credits (employee_id, credit_type, credit_number) values
    (current_setting('test.employee')::uuid, 'INFONAVIT', '0012345678'),
    (current_setting('test.employee')::uuid, 'FONACOT', '000987');

  begin
    insert into public.employee_credits (employee_id, credit_type, credit_number)
    values (current_setting('test.employee')::uuid, 'FONACOT', '000987');
    raise exception 'Se aceptó un número duplicado';
  exception when unique_violation then null;
  end;
  begin
    insert into public.employee_credits (employee_id, credit_type, credit_number)
    values (current_setting('test.employee')::uuid, 'INFONAVIT', '   ');
    raise exception 'Se aceptó un número vacío';
  exception when check_violation then null;
  end;
  begin
    insert into public.employee_credits (employee_id, credit_type, credit_number)
    values (current_setting('test.employee')::uuid, 'FOBAPROA', '1');
    raise exception 'Se aceptó un tipo fuera del catálogo';
  exception when check_violation then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', current_setting('test.payroll'), true);
do $$
declare affected integer;
begin
  if (select count(*) from public.employee_credits where employee_id = current_setting('test.employee')::uuid) <> 2 then
    raise exception 'Nómina no lee los créditos';
  end if;
  update public.employee_credits set credit_number = 'X' where employee_id = current_setting('test.employee')::uuid;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Nómina editó un crédito'; end if;
  begin
    insert into public.employee_credits (employee_id, credit_type, credit_number)
    values (current_setting('test.employee')::uuid, 'INFONAVIT', '1');
    raise exception 'Nómina insertó un crédito';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', current_setting('test.other'), true);
do $$
begin
  if exists (select 1 from public.employee_credits where employee_id = current_setting('test.employee')::uuid) then
    raise exception 'Fuga de créditos a otro rol';
  end if;
end;
$$;

reset role;
update public.sync_state set lease_token = gen_random_uuid(), lease_expires_at = now() + interval '1 minute'
where target = 'personal-icsi';
do $$
declare payload jsonb; rows jsonb;
begin
  if (select pending_revision from public.sync_state where target = 'personal-icsi') <= current_setting('test.revision')::bigint then
    raise exception 'No se encolaron cambios';
  end if;
  if (select count(*) from public.audit_logs where table_name = 'employee_credits'
        and record_id in (select id::text from public.employee_credits
                          where employee_id = current_setting('test.employee')::uuid)) < 2 then
    raise exception 'Falta auditoría de créditos';
  end if;
  select public.sync_read_snapshot(target, lease_token) into payload from public.sync_state where target = 'personal-icsi';
  select jsonb_agg(value) into rows from jsonb_array_elements(payload -> 'credits')
  where value ->> 'employee_number' = 'QA-' || current_setting('test.employee');
  if jsonb_array_length(rows) <> 2
     or not rows @> '[{"credit_type": "INFONAVIT", "credit_number": "0012345678"}]'::jsonb then
    raise exception 'Instantánea de créditos incorrecta';
  end if;
end;
$$;
rollback;
\echo 'OK: alta, duplicado, vacío, catálogo, lectura de Nómina, aislamiento, auditoría, cola y snapshot; todo revertido.'
