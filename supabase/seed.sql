-- SOLO desarrollo local: todos los datos son ficticios. Nunca ejecutar en producción.
-- Usuarios: rrhh@icsi.test, admin@icsi.test, consulta@icsi.test y nomina@icsi.test
-- (contraseña: Local-Prueba-2026!)

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
select
  '00000000-0000-0000-0000-000000000000', u.id::uuid, 'authenticated', 'authenticated', u.email,
  extensions.crypt('Local-Prueba-2026!', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', u.full_name), now(), now(), '', '', '', ''
from (values
  ('10000000-0000-4000-8000-000000000001', 'rrhh@icsi.test', 'Usuario RRHH de prueba'),
  ('10000000-0000-4000-8000-000000000002', 'admin@icsi.test', 'Usuario Admin de prueba'),
  ('10000000-0000-4000-8000-000000000003', 'consulta@icsi.test', 'Usuario Consulta de prueba'),
  ('10000000-0000-4000-8000-000000000004', 'nomina@icsi.test', 'Usuario Nómina de prueba')
) as u (id, email, full_name);

insert into auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at, last_sign_in_at)
select gen_random_uuid(), u.id, u.id::text, 'email',
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       now(), now(), now()
from auth.users u
where u.email like '%@icsi.test';

update public.profiles set is_active = true
where id in (select id from auth.users where email like '%@icsi.test');

insert into public.user_roles (user_id, role_id)
select v.user_id::uuid, r.id
from (values
  ('10000000-0000-4000-8000-000000000001', 'hr'),
  ('10000000-0000-4000-8000-000000000002', 'admin'),
  ('10000000-0000-4000-8000-000000000003', 'viewer'),
  ('10000000-0000-4000-8000-000000000004', 'payroll')
) as v (user_id, role_code)
join public.roles r on r.code = v.role_code;

insert into public.job_profiles (id, name) values
  ('20000000-0000-4000-8000-000000000001', 'Puesto de prueba A'),
  ('20000000-0000-4000-8000-000000000002', 'Puesto de prueba B');

insert into public.courses (id, name, validity_months) values
  ('30000000-0000-4000-8000-000000000001', 'Curso de prueba 1', 12),
  ('30000000-0000-4000-8000-000000000002', 'Curso de prueba 2', null);

insert into public.job_required_courses (job_profile_id, course_id) values
  ('20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002');

insert into public.employees (id, employee_number, first_name, last_name, second_last_name) values
  ('40000000-0000-4000-8000-000000000001', '000123', 'Empleado', 'Ficticio', 'Uno'),
  ('40000000-0000-4000-8000-000000000002', '000124', 'Empleada', 'Ficticia', 'Dos');

insert into public.employment_records (employee_id, hire_date, imss_registration_date, contract_type, work_center) values
  ('40000000-0000-4000-8000-000000000001', '2024-01-15', '2024-01-15', 'Indeterminado', 'Sede de prueba'),
  ('40000000-0000-4000-8000-000000000002', '2025-06-01', null, 'Proyecto', 'Sede de prueba');

insert into public.employee_work_sites (employee_id, site, site_type) values
  ('40000000-0000-4000-8000-000000000001', 'Sede de prueba', 'Centro de trabajo'),
  ('40000000-0000-4000-8000-000000000002', 'Sede de prueba', 'Centro de trabajo');

insert into public.projects (id, name, tender_number, client, status) values
  ('50000000-0000-4000-8000-000000000001', 'Proyecto de prueba', 'LIC-PRUEBA-001', 'Cliente de prueba', 'En ejecución');

insert into public.employee_assignments (employee_id, job_profile_id, project_id, start_date, is_primary) values
  ('40000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', '2024-01-15', true),
  ('40000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', null, '2025-06-01', true);

-- Datos personales inventados: se publican solo en V_DATOS_PERSONALES.
insert into public.employee_sensitive_data (employee_id, curp, rfc, nss, blood_type) values
  ('40000000-0000-4000-8000-000000000001', 'CURPFICTICIA0000', 'RFCFICTICIO00', '00000000042', 'O+');

insert into public.emergency_contacts (employee_id, full_name, relationship, phone, is_primary) values
  ('40000000-0000-4000-8000-000000000001', 'Contacto Ficticio', 'Familiar', '0000000002', true);

-- Ceros iniciales deliberados para comprobar que se conservan.
insert into public.employee_phones (employee_id, phone_type, phone_number, is_primary) values
  ('40000000-0000-4000-8000-000000000001', 'Celular', '0000000001', true);

insert into public.employee_emails (employee_id, email_type, email, is_primary) values
  ('40000000-0000-4000-8000-000000000001', 'Trabajo', 'empleado.uno@icsi.test', true);

insert into public.employee_control_numbers (employee_id, system_id, control_number)
select '40000000-0000-4000-8000-000000000001', s.id, '00042'
from public.external_systems s
where s.name = 'Checador';

insert into public.employee_courses (employee_id, course_id, completed_on, expires_on) values
  ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '2025-01-10', '2026-01-10');
