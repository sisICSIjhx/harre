-- Auditoría y cola de publicación. Datos, auditoría y mensaje se confirman en la misma
-- transacción de la captura; un fallo de Graph nunca revierte un cambio ya guardado.

create table public.audit_logs (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_id uuid,
  action text not null,
  table_name text not null,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  reason text
);

create index audit_logs_table_record_idx on public.audit_logs (table_name, record_id);
create index audit_logs_occurred_at_idx on public.audit_logs (occurred_at desc);

alter table public.audit_logs enable row level security;
revoke all on public.audit_logs from anon, authenticated, service_role;
grant select on public.audit_logs to authenticated, service_role;

-- admin gestiona acceso: solo ve la auditoría de identidad, no la de expedientes.
create policy audit_logs_select on public.audit_logs
  for select to authenticated
  using (
    private.has_role('hr')
    or (private.has_role('admin') and table_name in ('profiles', 'user_roles', 'roles'))
  );

-- Actor y fecha provienen del backend. El motivo es opcional: `set local app.audit_reason`.
create function private.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_row jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  new_row jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
begin
  insert into public.audit_logs (actor_id, action, table_name, record_id, old_data, new_data, reason)
  values (
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    coalesce(new_row ->> 'id', old_row ->> 'id'),
    old_row,
    new_row,
    nullif(current_setting('app.audit_reason', true), '')
  );
  return coalesce(new, old);
end;
$$;

revoke all on function private.audit_row_change() from public;

create extension if not exists pgmq;
select pgmq.create('sharepoint_sync');

create table public.sync_state (
  target text primary key,
  pending_revision bigint not null default 0,
  published_revision bigint not null default 0,
  lease_token uuid,
  lease_expires_at timestamptz,
  attempts integer not null default 0,
  next_attempt_at timestamptz,
  drive_item_id text,
  published_etag text,
  last_success_at timestamptz,
  last_error text,
  updated_at timestamptz not null default now()
);

insert into public.sync_state (target) values ('personal-icsi');

create trigger sync_state_set_updated_at
  before update on public.sync_state
  for each row execute function private.set_updated_at();

create table public.sync_jobs (
  id uuid primary key default gen_random_uuid(),
  target text not null references public.sync_state (target) on delete restrict,
  status text not null default 'running' check (status in ('running', 'succeeded', 'failed')),
  attempt integer not null,
  revision bigint,
  published_etag text,
  error_summary text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index sync_jobs_target_started_idx on public.sync_jobs (target, started_at desc);

alter table public.sync_state enable row level security;
alter table public.sync_jobs enable row level security;
revoke all on public.sync_state, public.sync_jobs from anon, authenticated;

-- El token del arrendamiento no se expone al navegador.
grant select (target, pending_revision, published_revision, lease_expires_at, attempts,
              next_attempt_at, last_success_at, last_error, updated_at)
  on public.sync_state to authenticated;
grant select on public.sync_jobs to authenticated;

create policy sync_state_select on public.sync_state
  for select to authenticated
  using (private.has_role('hr') or private.has_role('admin'));

create policy sync_jobs_select on public.sync_jobs
  for select to authenticated
  using (private.has_role('hr') or private.has_role('admin'));

-- La actualización de sync_state retiene la fila hasta el commit: las revisiones se confirman en orden.
create function private.enqueue_sync()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_revision bigint;
begin
  update public.sync_state
  set pending_revision = pending_revision + 1
  where target = 'personal-icsi'
  returning pending_revision into next_revision;

  perform pgmq.send(
    'sharepoint_sync',
    jsonb_build_object(
      'target', 'personal-icsi',
      'revision', next_revision,
      'table', tg_table_name,
      'op', lower(tg_op)
    )
  );
  return coalesce(new, old);
end;
$$;

revoke all on function private.enqueue_sync() from public;

do $$
declare
  t text;
begin
  foreach t in array array[
    'roles', 'profiles', 'user_roles', 'job_profiles', 'employees', 'employee_phones',
    'employee_emails', 'employee_addresses', 'employee_documents', 'employee_education',
    'employee_experience', 'courses', 'job_required_courses', 'employee_courses',
    'employee_control_numbers'
  ] loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I
         for each row execute function private.audit_row_change()',
      t || '_audit', t
    );
  end loop;

  -- Solo las tablas que alimentan el Excel generan publicación.
  foreach t in array array[
    'job_profiles', 'employees', 'employee_phones', 'employee_emails', 'employee_addresses',
    'employee_education', 'employee_experience', 'courses', 'employee_courses'
  ] loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I
         for each row execute function private.enqueue_sync()',
      t || '_enqueue_sync', t
    );
  end loop;
end;
$$;
