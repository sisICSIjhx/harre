import { z } from 'zod'
import { isIsoDate } from '../../../shared/utils/format.js'

const optionalText = z
  .string()
  .trim()
  .nullish()
  .transform((value) => value || null)

const optionalDate = z
  .string()
  .refine(isIsoDate, 'Usa una fecha válida en formato DD/MM/AAAA')
  .or(z.literal(''))
  .nullish()
  .transform((value) => value || null)

// Solo el nombre es obligatorio: en la carga histórica de ex empleados es normal que falten datos.
export const employeeSchema = z
  .object({
    employee_number: optionalText,
    first_name: z.string({ error: 'Escribe el nombre' }).trim().min(1, 'Escribe el nombre'),
    last_name: optionalText,
    second_last_name: optionalText,
    employment_status: z.enum(['active', 'terminated', 'onboarding'], {
      error: 'Selecciona el estatus',
    }),
    hire_date: optionalDate,
    termination_date: optionalDate,
    notes: optionalText,
  })
  .refine(
    (value) =>
      !value.hire_date || !value.termination_date || value.termination_date >= value.hire_date,
    { path: ['termination_date'], message: 'La baja no puede ser anterior al alta' },
  )
  .refine((value) => !value.termination_date || value.employment_status === 'terminated', {
    path: ['employment_status'],
    message: 'Con fecha de baja, el estatus debe ser Inactivo',
  })

export type EmployeeFormInput = z.input<typeof employeeSchema>
export type EmployeeFormValues = z.output<typeof employeeSchema>
