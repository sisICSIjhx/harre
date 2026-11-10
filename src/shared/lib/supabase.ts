import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database.types'

// En modo «tunnel» (ngrok) Supabase se alcanza por el proxy de Vite en el mismo origen.
const url =
  import.meta.env.MODE === 'tunnel' ? window.location.origin : import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !publishableKey) {
  throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY')
}

// Solo clave pública: la autorización efectiva la aplica RLS.
export const supabase = createClient<Database>(url, publishableKey)
