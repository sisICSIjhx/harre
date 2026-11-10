import type { SheetDefinition } from '../build-workbook.js'

export const directorySheet: SheetDefinition = {
  name: 'V_DIRECTORIO',
  title: 'DIRECTORIO GENERAL DE PERSONAL | RR. HH.',
  subtitle:
    'Una fila por persona. El puesto actual es la asignación principal vigente; los correos son los activos de cada tipo.',
  columns: [
    { header: 'NOMBRE COMPLETO', key: 'full_name', width: 36 },
    { header: 'ID PERSONA', key: 'employee_number', width: 12 },
    { header: 'SEDE', key: 'site', width: 18 },
    { header: 'PUESTO ACTUAL', key: 'job_profile', width: 32 },
    { header: 'TELÉFONO', key: 'phone', width: 17 },
    { header: 'CORREO LICITACIONES', key: 'email_tenders', width: 36 },
    { header: 'CORREO CORPORATIVO', key: 'email_corporate', width: 36 },
    { header: 'CORREO PERSONAL', key: 'email_personal', width: 36 },
    { header: 'NÚM. CHECADOR', key: 'time_clock_number', width: 14 },
    { header: 'ESTADO', key: 'status', width: 14 },
    { header: 'FECHA DE ALTA', key: 'hire_date', kind: 'date', width: 13 },
    { header: 'FECHA DE BAJA', key: 'termination_date', kind: 'date', width: 13 },
    { header: 'OBSERVACIONES', key: 'notes', width: 40 },
  ],
}

export const personalDataSheet: SheetDefinition = {
  name: 'V_DATOS_PERSONALES',
  title: 'DATOS PERSONALES | SOLO RR. HH. AUTORIZADO',
  subtitle: 'Una fila por persona. Las celdas vacías indican datos sin capturar.',
  columns: [
    { header: 'NOMBRE COMPLETO', key: 'full_name', width: 36 },
    { header: 'ID PERSONA', key: 'employee_number', width: 12 },
    { header: 'FECHA DE NACIMIENTO', key: 'birth_date', kind: 'date', width: 13 },
    { header: 'CURP', key: 'curp', width: 22 },
    { header: 'RFC', key: 'rfc', width: 16 },
    { header: 'NSS', key: 'nss', width: 14 },
    { header: 'TIPO DE SANGRE', key: 'blood_type', width: 12 },
    { header: 'ALERGIAS', key: 'allergies', width: 36 },
    { header: 'CERTIFICADO MÉDICO', key: 'has_medical_certificate', width: 12 },
    {
      header: 'FECHA CERTIFICADO MÉDICO',
      key: 'medical_certificate_date',
      kind: 'date',
      width: 13,
    },
  ],
}

export const workSitesSheet: SheetDefinition = {
  name: 'V_SEDES',
  title: 'HISTORIAL DE SEDES',
  subtitle: 'Una fila por sede asignada, con sus fechas. ACTUAL marca la sede vigente.',
  columns: [
    { header: 'EMPLEADO', key: 'full_name', width: 36 },
    { header: 'ID PERSONA', key: 'employee_number', width: 12 },
    { header: 'SEDE', key: 'site', width: 22 },
    { header: 'TIPO', key: 'site_type', width: 18 },
    { header: 'INICIO', key: 'start_date', kind: 'date', width: 13 },
    { header: 'FIN', key: 'end_date', kind: 'date', width: 13 },
    { header: 'ACTUAL', key: 'is_current', kind: 'boolean', width: 10 },
    { header: 'OBSERVACIONES', key: 'notes', width: 40 },
  ],
}

// Lista oculta que usan las fórmulas de V_LICITACIONES.
export const peopleSheet: SheetDefinition = {
  name: '01_PERSONAL',
  columns: [
    { header: 'Numero_empleado', key: 'employee_number', width: 16 },
    { header: 'Nombre_completo', key: 'full_name', width: 36 },
    { header: 'Estatus', key: 'status', width: 14 },
    { header: 'Sede', key: 'site', width: 18 },
    { header: 'Puesto_actual', key: 'job_profile', width: 32 },
  ],
}
