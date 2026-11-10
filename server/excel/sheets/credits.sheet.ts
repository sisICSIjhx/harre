import type { SheetDefinition } from '../build-workbook.js'

// El número va como texto: conserva sus ceros iniciales.
export const creditsSheet: SheetDefinition = {
  name: 'V_CREDITOS',
  title: 'CRÉDITOS DEL PERSONAL',
  subtitle:
    'Una fila por crédito INFONAVIT o FONACOT. Quien no aparece no tiene créditos registrados.',
  columns: [
    { header: 'EMPLEADO', key: 'full_name', width: 36 },
    { header: 'ID PERSONA', key: 'employee_number', width: 12 },
    { header: 'CRÉDITO', key: 'credit_type', width: 14 },
    { header: 'NÚMERO DE CRÉDITO', key: 'credit_number', width: 22 },
  ],
}
