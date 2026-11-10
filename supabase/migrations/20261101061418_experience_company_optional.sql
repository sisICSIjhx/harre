-- El expediente real tiene experiencias con puesto y periodo, pero sin empresa capturada.
-- Lo desconocido queda vacío; no se inventa un valor.
alter table public.employee_experience
  alter column company drop not null;
