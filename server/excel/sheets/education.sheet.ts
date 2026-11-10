import type { SheetDefinition } from '../build-workbook.js'

export const educationSheet: SheetDefinition = {
  name: 'V_FORMACION',
  title: 'FORMACIÓN ACADÉMICA COMPROBABLE',
  subtitle:
    'El grado reportado no equivale al acreditado: este último exige evidencia validada. GRADO MÁXIMO marca el estudio más alto de la persona.',
  columns: [
    { header: 'EMPLEADO', key: 'full_name', width: 36 },
    { header: 'ID PERSONA', key: 'employee_number', width: 12 },
    { header: 'GRADO REPORTADO', key: 'level', width: 20 },
    { header: 'CARRERA / ESPECIALIDAD', key: 'degree_title', width: 30 },
    { header: 'INSTITUCIÓN', key: 'institution', width: 30 },
    { header: 'NÚM. CÉDULA', key: 'professional_license', width: 14 },
    { header: 'INICIO', key: 'start_date', kind: 'date', width: 13 },
    { header: 'FIN', key: 'end_date', kind: 'date', width: 13 },
    { header: 'MUNICIPIO', key: 'municipality', width: 18 },
    { header: 'ESTADO', key: 'state', width: 18 },
    { header: 'PAÍS', key: 'country', width: 14 },
    { header: 'CERTIFICADO', key: 'certificate_status', width: 14 },
    { header: 'TÍTULO', key: 'diploma_status', width: 14 },
    { header: 'CÉDULA', key: 'license_status', width: 14 },
    { header: 'VALIDACIÓN', key: 'validation_status', width: 13 },
    { header: 'GRADO MÁXIMO', key: 'is_highest_level', kind: 'boolean', width: 11 },
    { header: 'GRADO ACREDITADO', key: 'accredited_level', width: 26 },
    { header: 'REVISADO', key: 'reviewed_on', kind: 'date', width: 13 },
    { header: 'REVISÓ', key: 'reviewed_by', width: 22 },
    { header: 'OBSERVACIONES', key: 'notes', width: 40 },
  ],
}
