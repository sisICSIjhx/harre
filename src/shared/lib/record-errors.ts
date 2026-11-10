// Mensajes para los errores de la base al guardar desde RecordEditor.
const MESSAGES: Record<string, string> = {
  '23505': 'Ya existe un registro con esos datos.',
  '23503': 'No se puede eliminar: otros registros lo utilizan.',
  '23514': 'Algún dato no cumple las reglas, por ejemplo las fechas.',
  '42501': 'No tienes permiso para esta operación.',
}

// Reglas de la base que necesitan un mensaje propio; se reconocen por su `hint`.
const HINTS: Record<string, string> = {
  document_expiry_before_issue: 'El vencimiento no puede ser anterior a la fecha de emisión.',
  document_fields_mismatch: 'Los datos capturados no corresponden al tipo de documento.',
  clabe_bank_mismatch: 'La CLABE no corresponde al banco elegido.',
  document_history_not_allowed: 'Solo la INE y la licencia de conducir conservan histórico.',
}

// Restricciones con mensaje propio; se reconocen por su nombre en el mensaje de la base.
const CONSTRAINTS: Record<string, string> = {
  employee_contracts_dates_check: 'El término del contrato no puede ser anterior a su inicio.',
  employee_contracts_indefinite_dates_check:
    'Un contrato indeterminado no lleva fechas de inicio ni de término.',
  employee_confidentiality_agreements_contract_fkey:
    'No se puede eliminar el contrato: tiene cartas o acuerdos de confidencialidad vinculados.',
}

export function errorMessage(error: {
  code?: string
  hint?: string | null
  message?: string
}): string {
  const constraint = Object.keys(CONSTRAINTS).find((name) => error.message?.includes(name))
  return (
    HINTS[error.hint ?? ''] ??
    (constraint ? CONSTRAINTS[constraint] : undefined) ??
    MESSAGES[error.code ?? ''] ??
    'No fue posible guardar. Intenta de nuevo.'
  )
}
