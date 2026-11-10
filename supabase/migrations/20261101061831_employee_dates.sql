-- Fecha de alta y de baja en la ficha de la persona, y carga histórica de ex empleados, en la que
-- es normal no tener la información completa: solo el nombre es obligatorio.

alter table public.employees
  alter column last_name drop not null;

-- Sin número capturado, se asigna el siguiente PER-####. El bloqueo evita repetirlo entre capturas.
create function private.assign_employee_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if nullif(btrim(new.employee_number), '') is null then
    perform pg_advisory_xact_lock(hashtext('employee_number'));
    select 'PER-' || lpad(
      (coalesce(max(substring(e.employee_number from '^PER-(\d+)$')::integer), 0) + 1)::text, 4, '0'
    )
    into new.employee_number
    from public.employees e;
  end if;
  return new;
end;
$$;

revoke all on function private.assign_employee_number() from public;

create trigger employees_assign_number
  before insert on public.employees
  for each row execute function private.assign_employee_number();

-- SECURITY INVOKER: RLS autoriza cada escritura; persona y fechas se guardan como una unidad.
create function public.create_employee(
  p_first_name text,
  p_employment_status text default 'active',
  p_employee_number text default null,
  p_last_name text default null,
  p_second_last_name text default null,
  p_hire_date date default null,
  p_termination_date date default null,
  p_notes text default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_termination_date is not null and p_employment_status <> 'terminated' then
    raise exception 'Con fecha de baja, el estatus debe ser Inactivo' using errcode = '23514';
  end if;

  insert into public.employees (employee_number, first_name, last_name, second_last_name, employment_status, notes)
  values (p_employee_number, p_first_name, p_last_name, p_second_last_name, p_employment_status, p_notes)
  returning id into v_id;

  if p_hire_date is not null or p_termination_date is not null then
    insert into public.employment_records (employee_id, hire_date, termination_date, status)
    values (
      v_id, p_hire_date, p_termination_date,
      case when p_termination_date is null then 'Activo' else 'Finalizado' end
    );
  end if;

  return v_id;
end;
$$;

-- Las fechas corresponden al contrato más reciente; un reingreso se agrega en Contratos y sedes.
-- Devuelve null si otra captura ya avanzó la versión.
create function public.update_employee(
  p_id uuid,
  p_version integer,
  p_first_name text,
  p_employment_status text,
  p_employee_number text default null,
  p_last_name text default null,
  p_second_last_name text default null,
  p_hire_date date default null,
  p_termination_date date default null,
  p_notes text default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_record uuid;
begin
  if p_termination_date is not null and p_employment_status <> 'terminated' then
    raise exception 'Con fecha de baja, el estatus debe ser Inactivo' using errcode = '23514';
  end if;

  update public.employees
  set employee_number = coalesce(nullif(btrim(p_employee_number), ''), employee_number),
      first_name = p_first_name,
      last_name = p_last_name,
      second_last_name = p_second_last_name,
      employment_status = p_employment_status,
      notes = p_notes
  where id = p_id and version = p_version;

  if not found then
    return null;
  end if;

  select r.id into v_record
  from public.employment_records r
  where r.employee_id = p_id
  order by r.hire_date desc nulls last, r.created_at desc
  limit 1;

  if v_record is not null then
    update public.employment_records r
    set hire_date = p_hire_date,
        termination_date = p_termination_date,
        status = case
          when p_termination_date is not null then 'Finalizado'
          when r.status = 'Finalizado' then 'Activo'
          else r.status
        end
    where r.id = v_record;
  elsif p_hire_date is not null or p_termination_date is not null then
    insert into public.employment_records (employee_id, hire_date, termination_date, status)
    values (
      p_id, p_hire_date, p_termination_date,
      case when p_termination_date is null then 'Activo' else 'Finalizado' end
    );
  end if;

  return p_id;
end;
$$;

revoke all on function public.create_employee(text, text, text, text, text, date, date, text) from public, anon;
revoke all on function public.update_employee(uuid, integer, text, text, text, text, text, date, date, text) from public, anon;
grant execute on function public.create_employee(text, text, text, text, text, date, date, text) to authenticated;
grant execute on function public.update_employee(uuid, integer, text, text, text, text, text, date, date, text) to authenticated;
