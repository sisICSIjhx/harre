import { describe, expect, it, vi } from 'vitest'
import type { UserClient } from '../../server/supabase/user.js'
import { authorizeHrUser, authorizeUser } from '../../server/security/authorize-user.js'

// Las filas imitan la consulta real: el filtro de perfil activo lo aplica la base.
function fakeClient(options: { user?: boolean; roles?: string[] } = {}) {
  const { user = true, roles = [] } = options
  const query = {
    select: () => query,
    eq: () => query,
    then: (resolve: (value: unknown) => void) =>
      resolve({ data: roles.map((code) => ({ roles: { code } })), error: null }),
  }
  const client = {
    auth: {
      getUser: vi.fn(async () =>
        user
          ? { data: { user: { id: 'u1' } }, error: null }
          : { data: { user: null }, error: new Error('token inválido') },
      ),
    },
    from: vi.fn(() => query),
  }
  return client as unknown as UserClient
}

describe('authorizeUser', () => {
  it('rechaza peticiones sin token', async () => {
    const create = vi.fn()
    expect(await authorizeUser(null, ['hr'], create)).toBeNull()
    expect(await authorizeUser('Basic abc', ['hr'], create)).toBeNull()
    expect(create).not.toHaveBeenCalled()
  })

  it('rechaza un token que Supabase no reconoce', async () => {
    expect(await authorizeUser('Bearer t', ['hr'], () => fakeClient({ user: false }))).toBeNull()
  })

  it('acepta a Admin cuando se permite', async () => {
    const client = fakeClient({ roles: ['admin'] })
    expect(await authorizeUser('Bearer t', ['hr', 'admin'], () => client)).toBe(client)
  })

  it('rechaza Consulta y Nómina', async () => {
    const client = fakeClient({ roles: ['viewer', 'payroll'] })
    expect(await authorizeUser('Bearer t', ['hr', 'admin'], () => client)).toBeNull()
  })

  it('rechaza un perfil inactivo (la consulta no devuelve roles)', async () => {
    expect(await authorizeUser('Bearer t', ['hr', 'admin'], () => fakeClient())).toBeNull()
  })

  it('authorizeHrUser solo acepta RRHH', async () => {
    expect(await authorizeHrUser('Bearer t', () => fakeClient({ roles: ['admin'] }))).toBeNull()
    const client = fakeClient({ roles: ['hr'] })
    expect(await authorizeHrUser('Bearer t', () => client)).toBe(client)
  })
})
