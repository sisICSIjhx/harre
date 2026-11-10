import type { SheetDefinition } from '../build-workbook.js'

// Sin comprobante ni observaciones de la cuenta. CLABE y cuenta como texto: conservan sus ceros.
export const bankAccountsSheet: SheetDefinition = {
  name: 'V_DATOS_BANCARIOS',
  title: 'DATOS BANCARIOS DEL PERSONAL',
  subtitle:
    'Una fila por cuenta. Las personas activas sin cuenta de nómina aparecen con el aviso en la última columna.',
  statusKey: 'control_note',
  columns: [
    { header: 'EMPLEADO', key: 'full_name', width: 36 },
    { header: 'ID PERSONA', key: 'employee_number', width: 12 },
    { header: 'ESTATUS', key: 'status', width: 13 },
    { header: 'TIPO DE CUENTA', key: 'account_type', width: 14 },
    { header: 'BANCO', key: 'bank', width: 22 },
    { header: 'CLABE', key: 'clabe', width: 22 },
    { header: 'NÚM. DE CUENTA', key: 'account_number', width: 16 },
    { header: 'TITULAR', key: 'holder_name', width: 30 },
    { header: 'AVISO', key: 'control_note', width: 22 },
  ],
}
