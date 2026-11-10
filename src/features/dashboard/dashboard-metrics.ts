// Cálculos del tablero de inicio a partir del directorio; sin dependencias de Vue ni Supabase.

export interface DirectoryRow {
  id: string | null
  full_name: string | null
  employee_number: string | null
  employment_status: string | null
  job_profile_name: string | null
  hire_date: string | null
  termination_date: string | null
  has_payroll_account: boolean | null
}

export interface StatusCounts {
  active: number
  onboarding: number
  terminated: number
}

export function countByStatus(rows: DirectoryRow[]): StatusCounts {
  const counts: StatusCounts = { active: 0, onboarding: 0, terminated: 0 }
  for (const row of rows) {
    const status = row.employment_status
    if (status === 'active' || status === 'onboarding' || status === 'terminated') counts[status]++
  }
  return counts
}

// Personas activas sin cuenta de Nómina; null cuando el perfil no puede consultarlo.
export function countWithoutPayrollAccount(rows: DirectoryRow[]): number | null {
  const active = rows.filter((row) => row.employment_status === 'active')
  if (active.some((row) => row.has_payroll_account === null)) return null
  return active.filter((row) => row.has_payroll_account === false).length
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export interface MonthMovement {
  key: string
  label: string
  hires: number
  terminations: number
}

// Altas y bajas de los últimos meses, incluido el actual; las fechas son civiles (AAAA-MM-DD).
export function monthlyMovements(rows: DirectoryRow[], today: Date, months = 6): MonthMovement[] {
  const formatter = new Intl.DateTimeFormat('es-MX', { month: 'short' })
  const result: MonthMovement[] = []
  for (let offset = months - 1; offset >= 0; offset--) {
    const month = new Date(today.getFullYear(), today.getMonth() - offset, 1)
    result.push({
      key: monthKey(month),
      label: formatter.format(month).replace('.', ''),
      hires: 0,
      terminations: 0,
    })
  }
  const byKey = new Map(result.map((month) => [month.key, month]))
  for (const row of rows) {
    const hire = byKey.get(row.hire_date?.slice(0, 7) ?? '')
    if (hire) hire.hires++
    const termination = byKey.get(row.termination_date?.slice(0, 7) ?? '')
    if (termination) termination.terminations++
  }
  return result
}

export interface LabelCount {
  label: string
  count: number
}

// Puestos con más personal vigente (activo o en integración).
export function topJobProfiles(rows: DirectoryRow[], limit = 5): LabelCount[] {
  const counts = new Map<string, number>()
  for (const row of rows) {
    if (row.employment_status === 'terminated') continue
    const label = row.job_profile_name ?? 'Sin puesto vigente'
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  return [...counts]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'es-MX'))
    .slice(0, limit)
}

export function recentHires(rows: DirectoryRow[], limit = 5): DirectoryRow[] {
  return rows
    .filter((row) => row.hire_date && row.employment_status !== 'terminated')
    .sort((a, b) => (b.hire_date ?? '').localeCompare(a.hire_date ?? ''))
    .slice(0, limit)
}

export interface TrainingCounts {
  current: number
  expired: number
  missing: number
  unverified: number
}

export function countTraining(rows: { training_status: string | null }[]): TrainingCounts {
  const counts: TrainingCounts = { current: 0, expired: 0, missing: 0, unverified: 0 }
  for (const { training_status: status } of rows) {
    if (status && status in counts) counts[status as keyof TrainingCounts]++
  }
  return counts
}
