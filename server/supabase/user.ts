import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../src/shared/types/database.types.js'

export type UserClient = SupabaseClient<Database>

// Actúa con la sesión de quien llama: los expedientes siguen protegidos por RLS.
export function createUserClient(token: string): UserClient {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    throw new Error('Faltan SUPABASE_URL o SUPABASE_PUBLISHABLE_KEY')
  }
  return createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
