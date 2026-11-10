import type { RecordField } from '../../../shared/lib/record-fields.js'

// Documentos firmados de «Contratos y sedes». Comparten la tabla
// `employee_confidentiality_agreements`; el filtro de cada apartado fija su tipo al agregar.
// El enlace de SharePoint es opcional y no se publica en el Excel. El contrato ya no se pide
// (los registros anteriores lo conservan).
const documentUrl: RecordField = {
  key: 'document_url',
  label: 'Link de SharePoint',
  type: 'url',
  linkLabel: 'Ver documento',
}
const notes: RecordField = {
  key: 'notes',
  label: 'Observaciones',
  type: 'textarea',
  formOnly: true,
}
const signedOn: RecordField = {
  key: 'signed_on',
  label: 'Fecha de firma',
  type: 'date',
  required: true,
}
// En actas y préstamos, `signed_on` es la fecha del documento.
const documentDate: RecordField = { ...signedOn, label: 'Fecha' }

const signedFields: RecordField[] = [signedOn, documentUrl, notes]

export const SIGNED_DOCUMENTS = [
  {
    kind: 'Carta de confidencialidad',
    title: 'Cartas de confidencialidad',
    empty: 'Sin cartas de confidencialidad registradas.',
    fields: signedFields,
  },
  {
    kind: 'Acuerdo de confidencialidad',
    title: 'Acuerdos de confidencialidad',
    empty: 'Sin acuerdos de confidencialidad registrados.',
    fields: signedFields,
  },
  {
    kind: 'Resguardo de casillero',
    title: 'Resguardo de casillero',
    empty: 'Sin resguardos de casillero registrados.',
    fields: signedFields,
  },
  {
    kind: 'Resguardo de vehículo',
    title: 'Resguardo de vehículo',
    empty: 'Sin resguardos de vehículo registrados.',
    fields: signedFields,
  },
  {
    kind: 'Reglamento',
    title: 'Reglamento',
    empty: 'Sin reglamentos registrados.',
    fields: signedFields,
  },
  {
    kind: 'Acta administrativa',
    title: 'Actas administrativas',
    empty: 'Sin actas administrativas registradas.',
    fields: [documentDate, documentUrl, notes],
  },
  {
    kind: 'Préstamo',
    title: 'Préstamos',
    empty: 'Sin préstamos registrados.',
    fields: [
      { key: 'amount', label: 'Cantidad', type: 'money', required: true },
      documentDate,
      documentUrl,
      notes,
    ],
  },
] as const satisfies readonly {
  kind: string
  title: string
  empty: string
  fields: readonly RecordField[]
}[]
