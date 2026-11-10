-- Reglamento en «Contratos y sedes»: fecha de firma y link opcional, varios por persona
-- (conforme se actualiza el reglamento se agrega otro). Misma tabla que los demás documentos
-- firmados (RLS solo RRHH, auditoría, updated_at y encolado). Cambio aditivo: el bloque
-- `confidentiality` de la instantánea ya publica todos los tipos, sin cambios en la función.
alter table public.employee_confidentiality_agreements
  drop constraint employee_confidentiality_agreements_document_kind_check,
  add constraint employee_confidentiality_agreements_document_kind_check
    check (document_kind in (
      'Carta de confidencialidad', 'Acuerdo de confidencialidad', 'Resguardo de casillero',
      'Resguardo de vehículo', 'Acta administrativa', 'Préstamo', 'Reglamento'
    ));

comment on table public.employee_confidentiality_agreements is
  'Documentos firmados por persona: cartas y acuerdos de confidencialidad, resguardos de casillero y de vehículo, actas administrativas, préstamos y reglamentos.';
