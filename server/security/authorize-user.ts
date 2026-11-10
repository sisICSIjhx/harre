import { createUserClient, type UserClient } from '../supabase/user.js'

export type AppRole = 'hr' | 'admin' | 'viewer' | 'payroll'

// Graph y el cliente administrativo no los limita RLS: el permiso se comprueba antes de usarlos.
export async function authorizeUser(
  header: string | null,
  roles: readonly AppRole[],
  createClient: (token: string) => UserClient = createUserClient,
): Promise<UserClient | null> {
  const token = /^Bearer (.+)$/.exec(header ?? '')?.[1]
  if (!token) return null

  const client = createClient(token)
  const { data: auth, error: authError } = await client.auth.getUser(token)
  if (authError || !auth.user) return null

  const { data, error } = await client
    .from('user_roles')
    .select('roles(code), profiles!inner(is_active)')
    .eq('user_id', auth.user.id)
    .eq('profiles.is_active', true)
  if (error) throw error
  return data.some((row) => roles.includes(row.roles?.code as AppRole)) ? client : null
}

export function authorizeHrUser(
  header: string | null,
  createClient: (token: string) => UserClient = createUserClient,
): Promise<UserClient | null> {
  return authorizeUser(header, ['hr'], createClient)
}
