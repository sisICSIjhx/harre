import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../src/shared/types/database.types.js'

export type AdminClient = SupabaseClient<Database>

// Elude RLS: usar solo para las funciones del procesador, nunca para tablas de expedientes.
export function createAdminClient(): AdminClient {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) {
    throw new Error('Faltan SUPABASE_URL o SUPABASE_SECRET_KEY')
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
