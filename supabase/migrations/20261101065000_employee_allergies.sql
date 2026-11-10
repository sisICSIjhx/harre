-- Alergias: dato de salud, junto a los demás datos personales exclusivos de RRHH.

alter table public.employee_sensitive_data
  add column allergies text;
