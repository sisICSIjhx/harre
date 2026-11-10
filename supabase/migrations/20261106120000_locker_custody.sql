-- Resguardo de casillero: documento firmado por persona con fecha de firma y enlace opcional
-- de SharePoint, igual que las cartas y los acuerdos de confidencialidad. Se guarda en la misma
-- tabla, que ya tiene RLS de solo RRHH, auditoría, updated_at y encolado. Cambio aditivo.
alter table public.employee_confidentiality_agreements
  drop constraint employee_confidentiality_agreements_document_kind_check,
  add constraint employee_confidentiality_agreements_document_kind_check
    check (document_kind in (
      'Carta de confidencialidad', 'Acuerdo de confidencialidad', 'Resguardo de casillero'
    ));

comment on table public.employee_confidentiality_agreements is
  'Documentos firmados por persona: cartas y acuerdos de confidencialidad y resguardos de casillero.';
