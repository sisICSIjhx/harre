-- Vigencia del contrato, cartas y acuerdos de confidencialidad ligados a un contrato,
-- y documentos laborales requeridos para todo el personal. Cambio aditivo: no transforma datos.

-- 1. Vigencia del contrato. Los contratos existentes quedan sin vigencia (nula).
alter table public.employment_records
  add column contract_term text
    check (contract_term in (
      'Indeterminado', 'Por meses', 'Por obra determinada', 'Por ocasión', 'Por temporada',
      'Periodo de prueba', 'Capacitación inicial', 'Otro'
    )),
  add column contract_term_months integer
    check (contract_term_months between 1 and 120),
  -- Meses solo, y siempre, con «Por meses».
  add constraint employment_records_term_months_check
    check (
      case when contract_term = 'Por meses'
        then contract_term_months is not null
        else contract_term_months is null
      end
    ),
  -- Permite exigir que la confidencialidad apunte a un contrato de la misma persona.
  add constraint employment_records_id_employee_id_key unique (id, employee_id);

-- 2. Cartas y acuerdos de confidencialidad.
create table public.employee_confidentiality_agreements (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete restrict,
  document_kind text not null
    check (document_kind in ('Carta de confidencialidad', 'Acuerdo de confidencialidad')),
  employment_record_id uuid not null,
  signed_on date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (employment_record_id, employee_id)
    references public.employment_records (id, employee_id) on delete restrict,
  unique (employment_record_id, document_kind)
);

create index employee_confidentiality_agreements_employee_id_idx
  on public.employee_confidentiality_agreements (employee_id);
create index employee_confidentiality_agreements_contract_idx
  on public.employee_confidentiality_agreements (employment_record_id, employee_id);

create trigger employee_confidentiality_agreements_set_updated_at
  before update on public.employee_confidentiality_agreements
  for each row execute function private.set_updated_at();
create trigger employee_confidentiality_agreements_audit
  after insert or update or delete on public.employee_confidentiality_agreements
  for each row execute function private.audit_row_change();

alter table public.employee_confidentiality_agreements enable row level security;
revoke all on public.employee_confidentiality_agreements from anon;

-- Información del expediente: exclusiva de RRHH, como los contratos.
create policy employee_confidentiality_agreements_hr_all
  on public.employee_confidentiality_agreements for all to authenticated
  using (private.has_role('hr')) with check (private.has_role('hr'));

-- 3. Opciones legibles de contrato para elegirlo en el formulario. Hereda RLS de employment_records.
create view public.vw_employment_record_options
with (security_invoker = true)
as
select
  r.id,
  r.employee_id,
  concat_ws(
    ' · ',
    r.company,
    coalesce(r.contract_type, 'Sin tipo'),
    'Ingreso ' || coalesce(to_char(r.hire_date, 'DD/MM/YYYY'), 'sin fecha'),
    r.status
  ) as label
from public.employment_records r;

revoke all on public.vw_employment_record_options from anon;
grant select on public.vw_employment_record_options to authenticated;

-- 4. Documentos laborales requeridos para todos (regla General: sin fila de control = Requerido).
insert into public.document_types (code, name, document_group, applicability_rule, instructions, expected_validity)
values
  ('DOC-021', 'Contrato', 'Laboral', 'General', 'Contrato firmado vigente', 'Según la vigencia del contrato'),
  ('DOC-022', 'Carta de confidencialidad', 'Laboral', 'General', 'Carta firmada ligada al contrato', 'Sin vencimiento'),
  ('DOC-023', 'Acuerdo de confidencialidad', 'Laboral', 'General', 'Acuerdo firmado ligado al contrato', 'Sin vencimiento')
on conflict (code) do nothing;
