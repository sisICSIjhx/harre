-- Funciones del procesador. Solo service_role las ejecuta, salvo sync_request_retry.

create function public.sync_acquire_lease(p_target text, p_lease_seconds integer default 180)
returns table (lease_token uuid, job_id uuid, attempt integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token uuid := gen_random_uuid();
  v_attempt integer;
  v_job_id uuid;
begin
  update public.sync_state s
  set lease_token = v_token,
      lease_expires_at = now() + make_interval(secs => p_lease_seconds),
      attempts = s.attempts + 1
  where s.target = p_target
    and s.pending_revision > s.published_revision
    and (s.lease_token is null or s.lease_expires_at < now())
    and (s.next_attempt_at is null or s.next_attempt_at <= now())
  returning s.attempts into v_attempt;

  if not found then
    return;
  end if;

  -- Una ejecución anterior que no cerró perdió su arrendamiento.
  update public.sync_jobs j
  set status = 'failed',
      error_summary = 'Ejecución interrumpida: arrendamiento vencido',
      finished_at = now()
  where j.target = p_target and j.status = 'running';

  insert into public.sync_jobs (target, attempt)
  values (p_target, v_attempt)
  returning id into v_job_id;

  return query select v_token, v_job_id, v_attempt;
end;
$$;

-- STABLE: todas las consultas usan la misma instantánea, incluidos revisión y mensajes.
-- Es la proyección aprobada: columnas explícitas, sin documentos ni auditoría.
create function public.sync_read_snapshot(p_target text, p_lease_token uuid)
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

  return jsonb_build_object(
    'revision', v_revision,
    'message_ids', (
      select coalesce(jsonb_agg(q.msg_id), '[]'::jsonb) from pgmq.q_sharepoint_sync q
    ),
    'employees', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.employee_number), '[]'::jsonb)
      from (
        select e.employee_number, e.first_name, e.last_name, e.second_last_name,
               jp.name as job_profile, e.employment_status, e.hire_date, e.termination_date
        from public.employees e
        left join public.job_profiles jp on jp.id = e.job_profile_id
      ) t
    ),
    'contacts', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.employee_number, t.contact_kind), '[]'::jsonb)
      from (
        select e.employee_number, 'Teléfono' as contact_kind, p.phone_type as contact_type,
               p.phone_number as contact_value, p.is_primary
        from public.employee_phones p
        join public.employees e on e.id = p.employee_id
        union all
        select e.employee_number, 'Correo', m.email_type, m.email, m.is_primary
        from public.employee_emails m
        join public.employees e on e.id = m.employee_id
      ) t
    ),
    'addresses', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.employee_number), '[]'::jsonb)
      from (
        select e.employee_number, a.address_type, a.street, a.exterior_number, a.interior_number,
               a.neighborhood, a.city, a.state, a.postal_code, a.country
        from public.employee_addresses a
        join public.employees e on e.id = a.employee_id
      ) t
    ),
    'education', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.employee_number), '[]'::jsonb)
      from (
        select e.employee_number, d.level, d.institution, d.degree_title,
               d.professional_license, d.start_date, d.end_date
        from public.employee_education d
        join public.employees e on e.id = d.employee_id
      ) t
    ),
    'experience', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.employee_number), '[]'::jsonb)
      from (
        select e.employee_number, x.company, x.position_title, x.start_date, x.end_date
        from public.employee_experience x
        join public.employees e on e.id = x.employee_id
      ) t
    ),
    'training', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.employee_number, t.course_name), '[]'::jsonb)
      from (
        select e.employee_number, c.name as course_name, ec.completed_on, ec.expires_on
        from public.employee_courses ec
        join public.employees e on e.id = ec.employee_id
        join public.courses c on c.id = ec.course_id
      ) t
    )
  );
end;
$$;

-- Confirma únicamente los mensajes cubiertos; los llegados después quedan pendientes.
create function public.sync_complete(
  p_target text,
  p_lease_token uuid,
  p_job_id uuid,
  p_revision bigint,
  p_message_ids bigint[],
  p_drive_item_id text,
  p_etag text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.sync_state s
  set published_revision = greatest(s.published_revision, p_revision),
      lease_token = null,
      lease_expires_at = null,
      attempts = 0,
      next_attempt_at = null,
      drive_item_id = p_drive_item_id,
      published_etag = p_etag,
      last_success_at = now(),
      last_error = null
  where s.target = p_target and s.lease_token = p_lease_token;

  if not found then
    raise exception 'Arrendamiento perdido para %', p_target;
  end if;

  update public.sync_jobs j
  set status = 'succeeded', revision = p_revision, published_etag = p_etag, finished_at = now()
  where j.id = p_job_id;

  perform pgmq.delete('sharepoint_sync', p_message_ids);
end;
$$;

-- Espera creciente con variación aleatoria. Un error permanente espera un reintento autorizado.
create function public.sync_fail(
  p_target text,
  p_lease_token uuid,
  p_job_id uuid,
  p_error text,
  p_retry_after_seconds integer default null,
  p_permanent boolean default false
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.sync_state s
  set lease_token = null,
      lease_expires_at = null,
      last_error = left(p_error, 500),
      next_attempt_at = case
        when p_permanent then 'infinity'::timestamptz
        else now() + make_interval(secs => greatest(
          coalesce(p_retry_after_seconds, 0),
          least(3600, 60 * power(2, greatest(s.attempts - 1, 0))) * (0.8 + random() * 0.4)
        ))
      end
  where s.target = p_target and s.lease_token = p_lease_token;

  update public.sync_jobs j
  set status = 'failed', error_summary = left(p_error, 500), finished_at = now()
  where j.id = p_job_id and j.status = 'running';
end;
$$;

create function public.sync_request_retry(p_target text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (private.has_role('hr') or private.has_role('admin')) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  update public.sync_state s
  set next_attempt_at = null, attempts = 0
  where s.target = p_target;
end;
$$;

revoke all on function public.sync_acquire_lease(text, integer) from public, anon, authenticated;
revoke all on function public.sync_read_snapshot(text, uuid) from public, anon, authenticated;
revoke all on function public.sync_complete(text, uuid, uuid, bigint, bigint[], text, text)
  from public, anon, authenticated;
revoke all on function public.sync_fail(text, uuid, uuid, text, integer, boolean)
  from public, anon, authenticated;
revoke all on function public.sync_request_retry(text) from public, anon;

grant execute on function public.sync_acquire_lease(text, integer) to service_role;
grant execute on function public.sync_read_snapshot(text, uuid) to service_role;
grant execute on function public.sync_complete(text, uuid, uuid, bigint, bigint[], text, text)
  to service_role;
grant execute on function public.sync_fail(text, uuid, uuid, text, integer, boolean)
  to service_role;
grant execute on function public.sync_request_retry(text) to authenticated;
