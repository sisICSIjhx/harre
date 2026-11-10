import type { Row, SheetDefinition } from '../build-workbook.js'

export const emailsSheet: SheetDefinition = {
  name: 'V_CORREOS',
  title: 'CORREOS DEL PERSONAL | RR. HH.',
  subtitle:
    'Una fila por persona. Correos por tipo; se identifican los principales e inactivos. V_DIRECTORIO muestra solo los activos.',
  columns: [
    { header: 'PERSONAL ADSCRITO', key: 'full_name', width: 36 },
    { header: 'ID PERSONA', key: 'employee_number', width: 12 },
    { header: 'UBICACIÓN', key: 'site', width: 18 },
    { header: 'PERSONAL', key: 'email_personal', width: 38 },
    { header: 'CORPORATIVO', key: 'email_corporate', width: 38 },
    { header: 'LICITACIONES', key: 'email_tenders', width: 38 },
    { header: 'OBSERVACIONES', key: 'notes', width: 40 },
  ],
}

export function emailRows(employees: Row[], emails: Row[]): Row[] {
  return employees.map((employee) => {
    const records = emails.filter((email) => email.employee_number === employee.employee_number)
    const row: Row = {
      full_name: employee.full_name,
      employee_number: employee.employee_number,
      site: employee.site,
    }
    for (const [type, key] of [
      ['Personal', 'email_personal'],
      ['Corporativo', 'email_corporate'],
      ['Licitaciones', 'email_tenders'],
    ] as const) {
      row[key] =
        records
          .filter((email) => email.email_type === type)
          .map(
            (email) =>
              `${email.email}${email.is_primary ? ' (principal)' : ''}${email.is_active === false ? ' (inactivo)' : ''}`,
          )
          .join('\n') || null
    }
    row.notes =
      records
        .filter(
          (email) =>
            email.notes ||
            !['Personal', 'Corporativo', 'Licitaciones'].includes(String(email.email_type)),
        )
        .map(
          (email) =>
            `${email.email_type} — ${email.email}${email.is_primary ? ' (principal)' : ''}${email.is_active === false ? ' (inactivo)' : ''}${email.notes ? `: ${email.notes}` : ''}`,
        )
        .join('\n') || null
    return row
  })
}

export const phonesSheet: SheetDefinition = {
  name: 'V_TELEFONOS',
  title: 'TELÉFONOS DEL PERSONAL',
  subtitle: 'Una fila por número registrado.',
  columns: [
    { header: 'EMPLEADO', key: 'full_name', width: 36 },
    { header: 'ID PERSONA', key: 'employee_number', width: 12 },
    { header: 'SEDE', key: 'site', width: 18 },
    { header: 'TIPO', key: 'phone_type', width: 14 },
    { header: 'TELÉFONO', key: 'phone_number', width: 17 },
    { header: 'EXTENSIÓN', key: 'extension', width: 11 },
    { header: 'PRINCIPAL', key: 'is_primary', kind: 'boolean', width: 11 },
    { header: 'VIGENTE', key: 'is_current', kind: 'boolean', width: 10 },
    { header: 'ACTUALIZADO', key: 'updated_on', kind: 'date', width: 13 },
    { header: 'OBSERVACIONES', key: 'notes', width: 40 },
  ],
}

export const contactsSheet: SheetDefinition = {
  name: 'V_CONTACTOS',
  title: 'CONTACTOS DE EMERGENCIA Y BENEFICIARIOS',
  subtitle:
    'Una fila por contacto de emergencia o beneficiario. PRINCIPAL solo aplica a los contactos de emergencia.',
  columns: [
    { header: 'EMPLEADO', key: 'full_name', width: 36 },
    { header: 'ID PERSONA', key: 'employee_number', width: 12 },
    { header: 'SEDE', key: 'site', width: 18 },
    { header: 'TIPO', key: 'contact_type', width: 14 },
    { header: 'NOMBRE', key: 'contact_name', width: 32 },
    { header: 'PARENTESCO', key: 'relationship', width: 16 },
    { header: 'TELÉFONO', key: 'phone', width: 17 },
    { header: 'PRINCIPAL', key: 'is_primary', kind: 'boolean', width: 11 },
    { header: 'OBSERVACIONES', key: 'notes', width: 40 },
  ],
}
