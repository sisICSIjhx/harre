import { describe, expect, it } from 'vitest'
import {
  countByStatus,
  countTraining,
  countWithoutPayrollAccount,
  monthlyMovements,
  recentHires,
  topJobProfiles,
  type DirectoryRow,
} from '../../src/features/dashboard/dashboard-metrics.js'

function row(values: Partial<DirectoryRow>): DirectoryRow {
  return {
    id: crypto.randomUUID(),
    full_name: 'Persona Ficticia',
    employee_number: '0001',
    employment_status: 'active',
    job_profile_name: null,
    hire_date: null,
    termination_date: null,
    has_payroll_account: true,
    ...values,
  }
}

describe('tablero de inicio', () => {
  it('cuenta personas por estatus', () => {
    const rows = [
      row({}),
      row({ employment_status: 'onboarding' }),
      row({ employment_status: 'terminated' }),
      row({}),
    ]
    expect(countByStatus(rows)).toEqual({ active: 2, onboarding: 1, terminated: 1 })
  })

  it('cuenta activos sin cuenta de nómina y oculta la cifra si el perfil no la ve', () => {
    const rows = [
      row({ has_payroll_account: false }),
      row({ employment_status: 'terminated', has_payroll_account: false }),
      row({}),
    ]
    expect(countWithoutPayrollAccount(rows)).toBe(1)
    expect(countWithoutPayrollAccount([row({ has_payroll_account: null })])).toBeNull()
  })

  it('agrupa altas y bajas por mes, incluido el actual', () => {
    const months = monthlyMovements(
      [
        row({ hire_date: '2026-11-02' }),
        row({ hire_date: '2026-10-31', termination_date: '2026-11-01' }),
        row({ hire_date: '2026-05-31' }),
      ],
      new Date(2026, 10, 3),
      6,
    )
    expect(months.map((month) => month.key)).toEqual([
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
      '2026-11',
    ])
    expect(months.at(-1)).toMatchObject({ hires: 1, terminations: 1 })
    expect(months.at(-2)).toMatchObject({ hires: 1, terminations: 0 })
    expect(months[0]).toMatchObject({ hires: 0, terminations: 0 })
  })

  it('cruza el cambio de año', () => {
    const months = monthlyMovements([row({ hire_date: '2025-12-15' })], new Date(2026, 0, 10), 2)
    expect(months.map((month) => [month.key, month.hires])).toEqual([
      ['2025-12', 1],
      ['2026-01', 0],
    ])
  })

  it('ordena puestos con personal vigente', () => {
    const rows = [
      row({ job_profile_name: 'Soldador' }),
      row({ job_profile_name: 'Soldador' }),
      row({ job_profile_name: 'Almacenista' }),
      row({ job_profile_name: 'Almacenista', employment_status: 'terminated' }),
      row({}),
    ]
    expect(topJobProfiles(rows, 2)).toEqual([
      { label: 'Soldador', count: 2 },
      { label: 'Almacenista', count: 1 },
    ])
  })

  it('lista altas recientes sin personas inactivas', () => {
    const rows = [
      row({ full_name: 'A', hire_date: '2026-01-01' }),
      row({ full_name: 'B', hire_date: '2026-03-01' }),
      row({ full_name: 'C', hire_date: '2026-04-01', employment_status: 'terminated' }),
      row({ full_name: 'D' }),
    ]
    expect(recentHires(rows).map((person) => person.full_name)).toEqual(['B', 'A'])
  })

  it('cuenta requisitos de capacitación por estado', () => {
    const rows = ['current', 'current', 'expired', 'missing', 'unverified', null].map(
      (training_status) => ({ training_status }),
    )
    expect(countTraining(rows)).toEqual({ current: 2, expired: 1, missing: 1, unverified: 1 })
  })
})
