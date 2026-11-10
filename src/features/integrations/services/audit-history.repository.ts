import { supabase } from '@/shared/lib/supabase'

const PAGE_SIZE = 200

// Declarado aquí: el tipo Json generado es demasiado profundo para inferirlo en la vista.
export interface AuditHistoryRow {
  id: number
  change_date: string | null
  change_time: string | null
  actor_name: string | null
  action_label: string | null
  table_name: string | null
  employee_number: string | null
  changed_fields: string[] | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
}

export async function listAuditHistory(search: string): Promise<AuditHistoryRow[]> {
  let query = supabase
    .from('vw_audit_history')
    .select('*')
    .order('occurred_at', { ascending: false })
    .limit(PAGE_SIZE)

  // Se eliminan los caracteres con significado en la sintaxis de filtros de PostgREST.
  const term = search.replace(/[,()*%\\"]/g, ' ').trim()
  if (term) {
    query = query.or(
      `actor_name.ilike.%${term}%,employee_number.ilike.%${term}%,table_name.ilike.%${term}%`,
    )
  }

  const { data, error } = await query
  if (error) throw error
  return data as unknown as AuditHistoryRow[]
}
