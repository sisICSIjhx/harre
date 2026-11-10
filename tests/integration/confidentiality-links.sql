-- Solo desarrollo. Ejecutar con psql -v ON_ERROR_STOP=1; toda captura se revierte.
begin;
select set_config('test.hr', gen_random_uuid()::text, true);
select set_config('test.other', gen_random_uuid()::text, true);
select set_config('test.employee', gen_random_uuid()::text, true);

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

select set_config('request.jwt.claim.sub', current_setting('test.hr'), true);
set local role authenticated;
do $$
begin
  -- Sin contrato y con enlace: dos cartas y un acuerdo de la misma persona.
  insert into public.employee_confidentiality_agreements (employee_id, document_kind, signed_on, document_url, notes)
  values
    (current_setting('test.employee')::uuid, 'Carta de confidencialidad', '2025-01-10', 'https://example.invalid/carta-1', null),
    (current_setting('test.employee')::uuid, 'Carta de confidencialidad', '2026-01-10', 'https://example.invalid/carta-2', 'Renovada'),
    (current_setting('test.employee')::uuid, 'Acuerdo de confidencialidad', '2025-03-01', 'https://example.invalid/acuerdo', null);

  begin
    insert into public.employee_confidentiality_agreements (employee_id, document_kind, signed_on, document_url)
    values (current_setting('test.employee')::uuid, 'Carta de confidencialidad', '2026-02-01', 'javascript:alert(1)');
    raise exception 'Se aceptó un enlace que no es http(s)';
  exception when check_violation then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', current_setting('test.other'), true);
do $$
begin
  if exists (select 1 from public.employee_confidentiality_agreements
             where employee_id = current_setting('test.employee')::uuid) then
    raise exception 'Fuga de confidencialidad a otro rol';
  end if;
end;
$$;

reset role;
update public.sync_state set lease_token = gen_random_uuid(), lease_expires_at = now() + interval '1 minute'
where target = 'personal-icsi';
do $$
declare payload jsonb; rows jsonb;
begin
  select public.sync_read_snapshot(target, lease_token) into payload from public.sync_state where target = 'personal-icsi';
  select jsonb_agg(value) into rows from jsonb_array_elements(payload -> 'confidentiality')
  where value ->> 'employee_number' = 'QA-' || current_setting('test.employee');
  if jsonb_array_length(rows) <> 3 then raise exception 'Faltan filas de confidencialidad'; end if;
  if exists (select 1 from jsonb_array_elements(rows) r where r ? 'document_url' or r ? 'contract_id') then
    raise exception 'La instantánea publica enlace o contrato';
  end if;
  if (select count(*) from jsonb_array_elements(rows) r where (r ->> 'is_latest')::boolean) <> 2 then
    raise exception 'ÚLTIMO debe marcar una carta y un acuerdo';
  end if;
  if not exists (select 1 from jsonb_array_elements(rows) r
                 where r ->> 'document_kind' = 'Carta de confidencialidad'
                   and r ->> 'signed_on' = '2026-01-10' and (r ->> 'is_latest')::boolean) then
    raise exception 'La carta más reciente no es la última';
  end if;
  if exists (select 1 from jsonb_array_elements(payload -> 'contracts') c
             where c ? 'confidentiality_letter_signed_on') then
    raise exception 'V_CONTRATOS conserva columnas de confidencialidad';
  end if;
end;
$$;
rollback;
\echo 'OK: sin contrato, enlace http(s), RLS y snapshot por persona sin enlaces; todo revertido.'
