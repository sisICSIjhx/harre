import { supabase } from '@/shared/lib/supabase'

// PostgREST entrega como máximo 1000 filas por consulta (max_rows): se piden por páginas.
const PAGE_SIZE = 1000

async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
) {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1)
    if (error) throw error
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) return rows
  }
}

export function listDirectorySummary() {
  return fetchAll((from, to) =>
    supabase
      .from('vw_employee_directory')
      .select(
        'id, full_name, employee_number, employment_status, job_profile_name, hire_date, termination_date, has_payroll_account',
      )
      .order('id')
      .range(from, to),
  )
}

// La vista solo devuelve filas a RRHH.
export function listTrainingStatusSummary() {
  return fetchAll((from, to) =>
    supabase
      .from('vw_employee_training_status')
      .select('training_status')
      .order('employee_id')
      .order('course_id')
      .range(from, to),
  )
}
