import { describe, expect, it } from 'vitest'
import { employeeSchema } from '../../src/features/employees/schemas/employee.schema.js'

const base = { first_name: 'Empleado', employment_status: 'active' as const }

describe('employeeSchema', () => {
  it('conserva ceros iniciales y normaliza opcionales vacíos a null', () => {
    const result = employeeSchema.parse({
      ...base,
      employee_number: '000123',
      notes: '',
      hire_date: '',
    })
    expect(result.employee_number).toBe('000123')
    expect(result.notes).toBeNull()
    expect(result.hire_date).toBeNull()
  })

  it('un ex empleado solo necesita nombre', () => {
    const result = employeeSchema.safeParse({ first_name: 'Ex', employment_status: 'terminated' })
    expect(result.success).toBe(true)
  })

  it('informa en español si falta el nombre', () => {
    const result = employeeSchema.safeParse({ employment_status: 'active' })
    expect(result.error?.issues[0]?.message).toBe('Escribe el nombre')
  })

  it('con fecha de baja, el estatus debe ser Inactivo', () => {
    const active = employeeSchema.safeParse({ ...base, termination_date: '2025-01-01' })
    expect(active.error?.issues[0]?.message).toBe('Con fecha de baja, el estatus debe ser Inactivo')
    const inactive = employeeSchema.safeParse({
      first_name: 'Ex',
      employment_status: 'terminated',
      termination_date: '2025-01-01',
    })
    expect(inactive.success).toBe(true)
  })

  it('rechaza una baja anterior al alta', () => {
    const result = employeeSchema.safeParse({
      first_name: 'Ex',
      employment_status: 'terminated',
      hire_date: '2025-01-02',
      termination_date: '2025-01-01',
    })
    expect(result.success).toBe(false)
  })

  it('rechaza estatus fuera de catálogo', () => {
    expect(employeeSchema.safeParse({ ...base, employment_status: 'otro' }).success).toBe(false)
  })
})
