import type { RecordField } from '../../../shared/lib/record-fields.js'

// INE y licencia conservan histórico: el registro nuevo queda vigente y el anterior pasa a
// histórico en la base. Desmarcar «Vigente» captura un documento anterior sin cambiar el vigente.
const commonFields: RecordField[] = [
  { key: 'issued_on', label: 'Fecha de emisión', type: 'date' },
  { key: 'expires_on', label: 'Fecha de vencimiento', type: 'date' },
  { key: 'is_current', label: 'Vigente', type: 'boolean', initial: true },
  {
    key: 'review_status',
    label: 'Revisión',
    type: 'select',
    required: true,
    options: ['Sin revisar', 'Recibido', 'Validado', 'Rechazado'],
    initial: 'Sin revisar',
  },
  {
    key: 'manual_decision',
    label: '¿Aplica a esta persona?',
    type: 'select',
    required: true,
    options: ['Requerido', 'No aplica', 'Opcional'],
    initial: 'Requerido',
    formOnly: true,
  },
  { key: 'received_on', label: 'Fecha de recepción', type: 'date', formOnly: true },
  { key: 'validated_by', label: 'Validado por', formOnly: true },
  { key: 'document_url', label: 'Enlace al documento', type: 'url', linkLabel: 'Ver documento' },
  { key: 'notes', label: 'Observaciones', type: 'textarea', formOnly: true },
]

export const EXPIRING_DOCUMENTS = [
  {
    code: 'DOC-014',
    title: 'INE',
    empty: 'Sin INE registrada.',
    fields: [
      { key: 'ine_elector_key', label: 'Clave de elector' },
      { key: 'ine_cic', label: 'CIC', formOnly: true },
      { key: 'ine_ocr', label: 'OCR', formOnly: true },
      ...commonFields,
    ] as RecordField[],
  },
  {
    code: 'DOC-012',
    title: 'Licencia de conducir',
    empty: 'Sin licencia de conducir registrada.',
    fields: [
      { key: 'license_number', label: 'Número de licencia' },
      { key: 'license_type', label: 'Tipo de licencia' },
      { key: 'license_state', label: 'Estado de expedición' },
      { key: 'license_restrictions', label: 'Restricciones', formOnly: true },
      { key: 'license_organ_donor', label: 'Donador de órganos', formOnly: true },
      ...commonFields,
    ] as RecordField[],
  },
] as const
