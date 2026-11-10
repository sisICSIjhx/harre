import type { SheetDefinition } from '../build-workbook.js'

export const addressesSheet: SheetDefinition = {
  name: 'V_DOMICILIOS',
  title: 'DIRECCIONES DEL PERSONAL',
  subtitle: 'Una fila por domicilio: INE, fiscal, actual u otro. Sin enlace al comprobante.',
  columns: [
    { header: 'EMPLEADO', key: 'full_name', width: 36 },
    { header: 'ID PERSONA', key: 'employee_number', width: 12 },
    { header: 'TIPO', key: 'address_type', width: 13 },
    { header: 'CALLE', key: 'street', width: 30 },
    { header: 'NÚM. EXT.', key: 'exterior_number', width: 10 },
    { header: 'NÚM. INT.', key: 'interior_number', width: 10 },
    { header: 'COLONIA', key: 'neighborhood', width: 26 },
    { header: 'C.P.', key: 'postal_code', width: 9 },
    { header: 'MUNICIPIO', key: 'city', width: 20 },
    { header: 'ESTADO', key: 'state', width: 22 },
    { header: 'PAÍS', key: 'country', width: 14 },
    { header: 'VIGENTE', key: 'is_current', kind: 'boolean', width: 10 },
    { header: 'VERIFICADO', key: 'verified_on', kind: 'date', width: 13 },
    { header: 'DOMICILIO COMPLETO', key: 'full_address', width: 60 },
    { header: 'OBSERVACIONES', key: 'notes', width: 40 },
  ],
}
