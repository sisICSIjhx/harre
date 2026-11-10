-- Identidad de aplicación y roles.
-- Los roles son una propuesta inicial pendiente de validar con ICSI (docs/security.md).

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null
);

insert into public.roles (code, name) values
  ('admin', 'Administrador del sistema'),
  ('hr', 'Recursos Humanos'),
  ('viewer', 'Consulta autorizada');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  is_active boolean not null default false,
  employee_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

create table public.user_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete restrict,
  assigned_by uuid default auth.uid(),
  assigned_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create index user_roles_role_id_idx on public.user_roles (role_id);

-- Toda cuenta nueva nace inactiva y sin roles: un administrador la habilita.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Se basa en tablas administradas, nunca en metadatos modificables por el usuario.
create function private.has_role(role_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    join public.profiles p on p.id = ur.user_id
    where ur.user_id = (select auth.uid())
      and r.code = role_code
      and p.is_active
  );
$$;

revoke all on function private.has_role(text) from public;
grant execute on function private.has_role(text) to authenticated, service_role;
revoke all on function private.handle_new_user() from public;
revoke all on function private.set_updated_at() from public;
