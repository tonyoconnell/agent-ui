/**
 * ONE Gateway — Cloudflare Worker proxy to TypeDB Cloud
 *
 * Routes:
 *   POST /v1/signin  → JWT auth (cached 61s per isolate)
 *   POST /v1/query   → TypeQL read/write proxy
 *   GET  /health         → Status check
 *
 * All TypeDB access goes through here. Browser → Worker → TypeDB Cloud.
 * CORS configured for localhost (dev) + one.ie (prod).
 */

interface Env {
  TYPEDB_URL: string
  TYPEDB_DATABASE: string
  TYPEDB_USERNAME: string
  TYPEDB_PASSWORD: string
  VERSION: string
}

// Token cache (per-isolate, 61s TTL)
let cachedToken: { token: string; expires: number } | null = null

const CORS_ORIGINS = [
  'http://localhost:4321',
  'http://localhost:3000',
  'https://one.ie',
  'https://app.one.ie',
  'https://www.one.ie',
]

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && CORS_ORIGINS.some(o => origin.startsWith(o)) ? origin : CORS_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }
}

async function getToken(env: Env): Promise<string> {
  if (cachedToken && cachedToken.expires > Date.now() + 60_000) {
    return cachedToken.token
  }

  const res = await fetch(`${env.TYPEDB_URL}/v1/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: env.TYPEDB_USERNAME,
      password: env.TYPEDB_PASSWORD,
    }),
  })

  if (!res.ok) {
    throw new Error(`TypeDB signin failed: ${res.status}`)
  }

  const data = await res.json() as { token: string }
  const payload = JSON.parse(atob(data.token.split('.')[1]))
  cachedToken = { token: data.token, expires: payload.exp * 1000 }
  return cachedToken.token
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin')
    const headers = corsHeaders(origin)

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers })
    }

    // Health check
    if (url.pathname === '/health') {
      return Response.json(
        { status: 'ok', version: env.VERSION, database: env.TYPEDB_DATABASE },
        { headers },
      )
    }


    // POST /typedb/query — proxy TypeQL queries to TypeDB Cloud /v1/query
    if (url.pathname === '/typedb/query' && request.method === 'POST') {
      try {
        const token = await getToken(env)
        const body = await request.json() as {
          query: string
          transactionType?: 'read' | 'write'
          commit?: boolean
        }

        const res = await fetch(`${env.TYPEDB_URL}/v1/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            databaseName: env.TYPEDB_DATABASE,
            transactionType: body.transactionType || 'read',
            query: body.query,
            commit: body.commit ?? (body.transactionType === 'write'),
          }),
        })

        if (!res.ok) {
          const text = await res.text()
          return Response.json(
            { error: 'TypeDB query failed', status: res.status, detail: text },
            { status: res.status, headers },
          )
        }

        const data = await res.json()
        return Response.json(data, { headers })
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error'
        return Response.json({ error: msg }, { status: 500, headers })
      }
    }

    return Response.json({ error: 'Not found' }, { status: 404, headers })
  },
}
