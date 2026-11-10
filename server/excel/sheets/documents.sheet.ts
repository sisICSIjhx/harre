import type { SheetDefinition } from '../build-workbook.js'

export const documentsSheet: SheetDefinition = {
  name: 'V_DOCUMENTOS',
  title: 'DOCUMENTOS DEL EXPEDIENTE',
  subtitle:
    'Lista por persona. Todo documento es requerido salvo que RR. HH. indique otra cosa. Sin enlaces a los archivos.',
  statusKey: 'traffic_light',
  columns: [
    { header: 'EMPLEADO', key: 'full_name', width: 36 },
    { header: 'ID PERSONA', key: 'employee_number', width: 12 },
    { header: 'CLAVE', key: 'code', width: 10 },
    { header: 'DOCUMENTO', key: 'document_name', width: 48 },
    { header: 'APLICA', key: 'applies', width: 14 },
    { header: 'REVISIÓN', key: 'review_status', width: 13 },
    { header: 'RECIBIDO', key: 'received_on', kind: 'date', width: 13 },
    { header: 'EMISIÓN', key: 'issued_on', kind: 'date', width: 13 },
    { header: 'VENCIMIENTO', key: 'expires_on', kind: 'date', width: 13 },
    { header: 'SEMÁFORO', key: 'traffic_light', width: 14 },
    { header: 'VALIDÓ', key: 'validated_by', width: 22 },
    { header: 'OBSERVACIONES', key: 'notes', width: 40 },
    { header: 'CLAVE DE ELECTOR', key: 'ine_elector_key', width: 24 },
    { header: 'CIC', key: 'ine_cic', width: 18 },
    { header: 'OCR', key: 'ine_ocr', width: 18 },
    { header: 'NÚMERO DE LICENCIA', key: 'license_number', width: 24 },
    { header: 'TIPO DE LICENCIA', key: 'license_type', width: 20 },
    { header: 'ESTADO DE EXPEDICIÓN', key: 'license_state', width: 24 },
    { header: 'RESTRICCIONES', key: 'license_restrictions', width: 28 },
    { header: 'DONADOR DE ÓRGANOS', key: 'license_organ_donor', width: 18 },
  ],
}

export const followUpSheet: SheetDefinition = {
  name: 'V_SEGUIMIENTO',
  title: 'SEGUIMIENTO DE EXPEDIENTES | RR. HH.',
  subtitle: 'Resumen de documentos y cursos por persona, según lo capturado.',
  statusKey: 'situation',
  columns: [
    { header: 'PERSONAL', key: 'full_name', width: 36 },
    { header: 'ID PERSONA', key: 'employee_number', width: 12 },
    { header: 'UBICACIÓN', key: 'site', width: 18 },
    { header: 'DOCS VALIDADOS', key: 'docs_validated', kind: 'number', width: 11 },
    { header: 'DOCS PENDIENTES', key: 'docs_pending', kind: 'number', width: 12 },
    { header: 'POR CONFIRMAR', key: 'docs_undefined', kind: 'number', width: 12 },
    { header: 'CURSOS PENDIENTES', key: 'courses_pending', kind: 'number', width: 12 },
    { header: 'SITUACIÓN DOCUMENTAL', key: 'situation', width: 26 },
  ],
}

export const documentTypesViewSheet: SheetDefinition = {
  name: 'V_CAT_DOCUMENTOS',
  title: 'CATÁLOGO DE DOCUMENTOS DEL EXPEDIENTE',
  subtitle: 'Documentos que se controlan por persona, con su regla de aplicación e instrucciones.',
  columns: [
    { header: 'CLAVE', key: 'code', width: 10 },
    { header: 'DOCUMENTO', key: 'name', width: 48 },
    { header: 'GRUPO', key: 'document_group', width: 16 },
    { header: 'REGLA', key: 'applicability_rule', width: 15 },
    { header: 'VALIDEZ ESPERADA', key: 'expected_validity', width: 22 },
    { header: 'INSTRUCCIONES', key: 'instructions', width: 50 },
  ],
}

export const documentTypesSheet: SheetDefinition = {
  name: '14_CAT_DOCUMENTOS',
  columns: [
    { header: 'Clave', key: 'code', width: 10 },
    { header: 'Documento', key: 'name', width: 48 },
    { header: 'Grupo', key: 'document_group', width: 16 },
    { header: 'Regla', key: 'applicability_rule', width: 15 },
    { header: 'Validez_esperada', key: 'expected_validity', width: 22 },
  ],
}
