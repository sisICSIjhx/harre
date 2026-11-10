import type { SheetDefinition } from '../build-workbook.js'

export const experienceSheet: SheetDefinition = {
  name: 'V_EXPERIENCIA',
  title: 'HISTORIAL DE EXPERIENCIA LABORAL',
  subtitle: 'Una fila por experiencia o proyecto. No equivale a las altas y bajas de ICSI.',
  columns: [
    { header: 'EMPLEADO', key: 'full_name', width: 36 },
    { header: 'ID PERSONA', key: 'employee_number', width: 12 },
    { header: 'EMPRESA', key: 'company', width: 32 },
    { header: 'TIPO DE EMPRESA', key: 'company_type', width: 16 },
    { header: 'FECHA INICIO', key: 'start_date', kind: 'date', width: 13 },
    { header: 'FECHA FIN', key: 'end_date', kind: 'date', width: 13 },
    { header: 'PERIODO', key: 'period_text', width: 18 },
    { header: 'PUESTO', key: 'position_title', width: 28 },
    { header: 'PROYECTO', key: 'project_name', width: 30 },
    { header: 'ACTIVIDADES', key: 'activities', width: 44 },
    { header: 'MUNICIPIO', key: 'municipality', width: 18 },
    { header: 'ESTADO', key: 'state', width: 18 },
    { header: 'PAÍS', key: 'country', width: 14 },
    { header: 'LUGAR DE TRABAJO', key: 'work_location_detail', width: 28 },
    { header: 'REFERENCIA', key: 'work_reference', width: 28 },
    { header: 'VERIFICACIÓN', key: 'verification_status', width: 18 },
    { header: 'OBSERVACIONES', key: 'notes', width: 40 },
  ],
}

export const employmentSheet: SheetDefinition = {
  name: 'V_ALTAS_BAJAS',
  title: 'ALTAS Y BAJAS',
  subtitle:
    'Ingresos, altas de IMSS, bajas y reingresos en ICSI. ÚLTIMO marca el ingreso más reciente. Los contratos están en V_CONTRATOS.',
  columns: [
    { header: 'EMPLEADO', key: 'full_name', width: 36 },
    { header: 'ID PERSONA', key: 'employee_number', width: 12 },
    { header: 'EMPRESA', key: 'company', width: 14 },
    { header: 'INGRESO', key: 'hire_date', kind: 'date', width: 13 },
    { header: 'ALTA IMSS', key: 'imss_registration_date', kind: 'date', width: 13 },
    { header: 'BAJA', key: 'termination_date', kind: 'date', width: 13 },
    { header: 'ESTADO', key: 'status', width: 13 },
    { header: 'CENTRO TRABAJO', key: 'work_center', width: 22 },
    { header: 'ÁREA', key: 'area', width: 20 },
    { header: 'ÚLTIMO', key: 'is_latest', kind: 'boolean', width: 9 },
    { header: 'OBSERVACIONES', key: 'notes', width: 40 },
  ],
}

export const contractsSheet: SheetDefinition = {
  name: 'V_CONTRATOS',
  title: 'CONTRATOS',
  subtitle:
    'Una fila por contrato o renovación, con sus fechas. ÚLTIMO marca el más reciente. Las altas y bajas están en V_ALTAS_BAJAS y la confidencialidad en V_CONFIDENCIALIDAD.',
  columns: [
    { header: 'EMPLEADO', key: 'full_name', width: 36 },
    { header: 'ID PERSONA', key: 'employee_number', width: 12 },
    { header: 'CONTRATO', key: 'contract_type', width: 20 },
    { header: 'INICIO', key: 'start_date', kind: 'date', width: 13 },
    { header: 'TÉRMINO', key: 'end_date', kind: 'date', width: 13 },
    { header: 'ÚLTIMO', key: 'is_latest', kind: 'boolean', width: 9 },
    { header: 'OBSERVACIONES', key: 'notes', width: 40 },
  ],
}

// Sin el enlace de SharePoint: el libro no publica enlaces.
export const CONFIDENTIALITY_KINDS = ['Carta de confidencialidad', 'Acuerdo de confidencialidad']
export const confidentialitySheet: SheetDefinition = {
  name: 'V_CONFIDENCIALIDAD',
  title: 'CARTAS Y ACUERDOS DE CONFIDENCIALIDAD',
  subtitle:
    'Una fila por carta o acuerdo firmado. ÚLTIMO marca el más reciente de cada tipo por persona.',
  columns: [
    { header: 'EMPLEADO', key: 'full_name', width: 36 },
    { header: 'ID PERSONA', key: 'employee_number', width: 12 },
    { header: 'DOCUMENTO', key: 'document_kind', width: 28 },
    { header: 'FECHA DE FIRMA', key: 'signed_on', kind: 'date', width: 14 },
    { header: 'ÚLTIMO', key: 'is_latest', kind: 'boolean', width: 9 },
    { header: 'OBSERVACIONES', key: 'notes', width: 40 },
  ],
}

// Comparte tabla y bloque del snapshot con la confidencialidad; también sin enlace.
export const LOCKER_CUSTODY_KIND = 'Resguardo de casillero'
export const lockerCustodySheet: SheetDefinition = {
  name: 'V_RESGUARDO_CASILLERO',
  title: 'RESGUARDOS DE CASILLERO',
  subtitle: 'Una fila por resguardo firmado. ÚLTIMO marca el más reciente por persona.',
  columns: [
    { header: 'EMPLEADO', key: 'full_name', width: 36 },
    { header: 'ID PERSONA', key: 'employee_number', width: 12 },
    { header: 'FECHA DE FIRMA', key: 'signed_on', kind: 'date', width: 14 },
    { header: 'ÚLTIMO', key: 'is_latest', kind: 'boolean', width: 9 },
    { header: 'OBSERVACIONES', key: 'notes', width: 40 },
  ],
}

export const VEHICLE_CUSTODY_KIND = 'Resguardo de vehículo'
export const vehicleCustodySheet: SheetDefinition = {
  ...lockerCustodySheet,
  name: 'V_RESGUARDO_VEHICULO',
  title: 'RESGUARDOS DE VEHÍCULO',
}

export const REGULATION_KIND = 'Reglamento'
export const regulationsSheet: SheetDefinition = {
  ...lockerCustodySheet,
  name: 'V_REGLAMENTO',
  title: 'REGLAMENTOS',
  subtitle:
    'Una fila por reglamento firmado. ÚLTIMO marca el más reciente por persona.',
}

// En actas y préstamos, `signed_on` es la fecha del documento.
export const ADMINISTRATIVE_ACT_KIND = 'Acta administrativa'
export const administrativeActsSheet: SheetDefinition = {
  name: 'V_ACTAS_ADMINISTRATIVAS',
  title: 'ACTAS ADMINISTRATIVAS',
  subtitle: 'Una fila por acta administrativa, de la más reciente a la más antigua por persona.',
  columns: [
    { header: 'EMPLEADO', key: 'full_name', width: 36 },
    { header: 'ID PERSONA', key: 'employee_number', width: 12 },
    { header: 'FECHA', key: 'signed_on', kind: 'date', width: 13 },
    { header: 'OBSERVACIONES', key: 'notes', width: 50 },
  ],
}

export const LOAN_KIND = 'Préstamo'
export const loansSheet: SheetDefinition = {
  name: 'V_PRESTAMOS',
  title: 'PRÉSTAMOS AL PERSONAL',
  subtitle: 'Una fila por préstamo, con su fecha y cantidad en pesos.',
  columns: [
    { header: 'EMPLEADO', key: 'full_name', width: 36 },
    { header: 'ID PERSONA', key: 'employee_number', width: 12 },
    { header: 'FECHA', key: 'signed_on', kind: 'date', width: 13 },
    { header: 'CANTIDAD', key: 'amount', kind: 'money', width: 16 },
    { header: 'OBSERVACIONES', key: 'notes', width: 40 },
  ],
}
