-- Permisos del personal: Nómina los consulta sin editarlos, como los créditos y las cuentas.
create policy employee_leave_permits_payroll_select on public.employee_leave_permits
  for select to authenticated
  using (private.has_role('payroll'));

comment on table public.employee_leave_permits is
  'Permisos del personal por días u horas, con motivo. RRHH edita y Nómina consulta.';
