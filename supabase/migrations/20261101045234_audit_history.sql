-- Historial de cambios: quién editó qué, fecha y hora. El nombre se guarda como copia para que
-- el registro siga diciendo quién fue aunque el usuario cambie de nombre o se elimine.

alter table public.audit_logs
  add column actor_name text,
  add column actor_email text,
  add column employee_id uuid,
  add column changed_fields text[];

create index audit_logs_employee_id_idx on public.audit_logs (employee_id, occurred_at desc);
create index audit_logs_actor_id_idx on public.audit_logs (actor_id, occurred_at desc);

create or replace function private.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_row jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  new_row jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  actor uuid := auth.uid();
  v_name text;
  v_email text;
  v_changed text[];
begin
  if actor is not null then
    select p.full_name, u.email into v_name, v_email
    from auth.users u
    left join public.profiles p on p.id = u.id
    where u.id = actor;
  end if;

  if tg_op = 'UPDATE' then
    select array_agg(n.key order by n.key) into v_changed
    from jsonb_each(new_row) n
    where n.key not in ('updated_at', 'version')
      and n.value is distinct from old_row -> n.key;

    -- Una actualización sin cambios reales no se registra.
    if v_changed is null then
      return new;
    end if;
  end if;

  insert into public.audit_logs (
    actor_id, actor_name, actor_email, action, table_name, record_id, employee_id,
    changed_fields, old_data, new_data, reason
  )
  values (
    actor,
    -- Sin sesión de usuario: procesos del sistema, como migraciones o cargas.
    case when actor is null then 'Sistema' else coalesce(nullif(btrim(v_name), ''), v_email) end,
    v_email,
    lower(tg_op),
    tg_table_name,
    coalesce(new_row ->> 'id', old_row ->> 'id', new_row ->> 'employee_id', old_row ->> 'employee_id'),
    case
      when tg_table_name = 'employees' then coalesce(new_row ->> 'id', old_row ->> 'id')::uuid
      else coalesce(new_row ->> 'employee_id', old_row ->> 'employee_id')::uuid
    end,
    v_changed,
    old_row,
    new_row,
    nullif(current_setting('app.audit_reason', true), '')
  );
  return coalesce(new, old);
end;
$$;

-- El historial no se edita ni se borra, tampoco con la clave privilegiada.
create function private.reject_audit_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'El historial de cambios no se puede modificar' using errcode = '42501';
end;
$$;

revoke all on function private.reject_audit_change() from public;

create trigger audit_logs_immutable
  before update or delete on public.audit_logs
  for each row execute function private.reject_audit_change();

create trigger audit_logs_no_truncate
  before truncate on public.audit_logs
  for each statement execute function private.reject_audit_change();

-- Vista de lectura: fecha y hora de México; aplica las políticas de quien consulta.
create view public.vw_audit_history
with (security_invoker = true)
as
select
  l.id,
  l.occurred_at,
  to_char(l.occurred_at at time zone 'America/Mexico_City', 'YYYY-MM-DD') as change_date,
  to_char(l.occurred_at at time zone 'America/Mexico_City', 'HH24:MI:SS') as change_time,
  l.actor_id,
  l.actor_name,
  l.actor_email,
  case l.action when 'insert' then 'Creó' when 'update' then 'Editó' when 'delete' then 'Eliminó' end as action_label,
  l.table_name,
  l.record_id,
  l.employee_id,
  e.employee_number,
  l.changed_fields,
  l.old_data,
  l.new_data,
  l.reason
from public.audit_logs l
left join public.employees e on e.id = l.employee_id;

revoke all on public.vw_audit_history from anon;
