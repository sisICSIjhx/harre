const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0'
const TRANSIENT_STATUSES = new Set([408, 412, 423, 429, 500, 502, 503, 504])

export interface GraphConfig {
  tenantId: string
  clientId: string
  clientSecret: string
}

export class GraphError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly transient: boolean,
    readonly retryAfterSeconds: number | null = null,
  ) {
    super(message)
    this.name = 'GraphError'
  }
}

function parseRetryAfter(value: string | null): number | null {
  const seconds = Number(value)
  return value && Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds) : null
}

// Autenticación de servicio con credenciales de cliente.
async function getAccessToken(config: GraphConfig): Promise<string> {
  const response = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`,
    {
      method: 'POST',
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        scope: 'https://graph.microsoft.com/.default',
      }),
    },
  )
  if (!response.ok) {
    throw new GraphError(
      `No se obtuvo el token de Entra ID (HTTP ${response.status})`,
      response.status,
      response.status >= 500,
    )
  }
  const body = (await response.json()) as { access_token: string }
  return body.access_token
}

export interface GraphClient {
  request(path: string, init?: RequestInit): Promise<Response>
}

export function createGraphClient(config: GraphConfig): GraphClient {
  let token: string | null = null

  return {
    async request(path, init = {}) {
      token ??= await getAccessToken(config)
      const headers = new Headers(init.headers)
      headers.set('Authorization', `Bearer ${token}`)

      const response = await fetch(`${GRAPH_BASE_URL}${path}`, { ...init, headers })
      if (!response.ok) {
        // Solo código de estado: el cuerpo de Graph puede incluir rutas e identificadores.
        throw new GraphError(
          `Microsoft Graph respondió HTTP ${response.status}`,
          response.status,
          TRANSIENT_STATUSES.has(response.status),
          parseRetryAfter(response.headers.get('retry-after')),
        )
      }
      return response
    },
  }
}
