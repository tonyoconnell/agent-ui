/**
 * ONE Gateway — Cloudflare Worker proxy to TypeDB Cloud + D1
 *
 * Routes:
 *   POST /v1/signin     → JWT auth (cached 61s per isolate)
 *   POST /v1/query      → TypeQL read/write proxy
 *   GET  /messages      → Query conversation from D1
 *   GET  /health        → Status check
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
  DB?: D1Database
  KV?: KVNamespace
  BROADCAST_SECRET?: string
}

// Token cache (per-isolate, 61s TTL)
let cachedToken: { token: string; expires: number } | null = null

// WebSocket client tracking (per-isolate — cross-isolate needs Durable Objects)
const connectedClients = new Set<WebSocket>()

// Security: Limits and allowed message types
const MAX_WS_CONNECTIONS = 100
const ALLOWED_MESSAGE_TYPES = ['complete', 'unblock', 'mark', 'warn', 'task-update', 'sync']

const CORS_ORIGINS = [
  'http://localhost:4321',
  'http://localhost:3000',
  'https://one.ie',
  'https://app.one.ie',
  'https://www.one.ie',
]

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && CORS_ORIGINS.some((o) => origin.startsWith(o)) ? origin : CORS_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Upgrade, Connection',
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

  const data = (await res.json()) as { token: string }
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
      return Response.json({ status: 'ok', version: env.VERSION, database: env.TYPEDB_DATABASE }, { headers })
    }

    // GET /ws — WebSocket upgrade for live TaskBoard updates
    if (url.pathname === '/ws') {
      // Security: Check origin against allowed CORS origins
      const wsOrigin = request.headers.get('Origin')
      if (!wsOrigin || !CORS_ORIGINS.some((o) => wsOrigin.startsWith(o))) {
        return new Response('Origin not allowed', { status: 403, headers })
      }

      // Security: Limit connections per isolate
      if (connectedClients.size >= MAX_WS_CONNECTIONS) {
        return new Response('Too many connections', { status: 503, headers })
      }

      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected WebSocket upgrade', { status: 426, headers })
      }
      const pair = new WebSocketPair()
      const [client, server] = Object.values(pair) as [WebSocket, WebSocket]
      server.accept()
      connectedClients.add(server)
      server.addEventListener('message', (event: MessageEvent) => {
        if (event.data === 'ping') server.send('pong')
      })
      server.addEventListener('close', () => {
        connectedClients.delete(server)
      })
      server.addEventListener('error', () => {
        connectedClients.delete(server)
      })
      return new Response(null, { status: 101, webSocket: client })
    }

    // POST /broadcast — relay a WsMessage to all connected WebSocket clients
    if (url.pathname === '/broadcast' && request.method === 'POST') {
      // Security: Require shared secret
      const secret = request.headers.get('X-Broadcast-Secret')
      if (!env.BROADCAST_SECRET || secret !== env.BROADCAST_SECRET) {
        return Response.json({ error: 'Forbidden' }, { status: 403, headers })
      }

      try {
        const message = await request.text()
        const parsed = JSON.parse(message)

        // Security: Validate message type
        if (!parsed.type || !ALLOWED_MESSAGE_TYPES.includes(parsed.type)) {
          return Response.json(
            { error: 'Invalid message type', allowed: ALLOWED_MESSAGE_TYPES },
            { status: 400, headers },
          )
        }

        let sent = 0
        for (const client of connectedClients) {
          try {
            client.send(message)
            sent++
          } catch {
            connectedClients.delete(client)
          }
        }
        return Response.json({ ok: true, sent }, { headers })
      } catch {
        return Response.json({ error: 'Invalid JSON' }, { status: 400, headers })
      }
    }

    // GET /tasks — Task list from KV cache (fallback: TypeDB)
    if (url.pathname === '/tasks' && request.method === 'GET') {
      try {
        // Fast path: read from KV cache (updated by sync worker every 1 min)
        if (env.KV) {
          const cached = await env.KV.get('tasks.json', 'json')
          if (cached) {
            return Response.json(cached, {
              headers: { ...headers, 'X-Cache': 'HIT' },
            })
          }
        }

        // Slow path: query TypeDB directly (only on KV miss)
        const token = await getToken(env)
        const query = `
          match
            $s isa skill, has skill-id $id, has name $name;
          select $id, $name;
          limit 100;
        `

        const res = await fetch(`${env.TYPEDB_URL}/v1/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            databaseName: env.TYPEDB_DATABASE,
            transactionType: 'read',
            query,
          }),
        })

        if (!res.ok) {
          const text = await res.text()
          return Response.json({ error: 'TypeDB query failed', detail: text }, { status: 500, headers })
        }

        const data = await res.json()
        return Response.json(data, {
          headers: { ...headers, 'X-Cache': 'MISS' },
        })
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error'
        return Response.json({ error: msg }, { status: 500, headers })
      }
    }

    // POST /typedb/query — proxy TypeQL queries to TypeDB Cloud /v1/query
    if (url.pathname === '/typedb/query' && request.method === 'POST') {
      try {
        const token = await getToken(env)
        const body = (await request.json()) as {
          query: string
          transactionType?: 'read' | 'write'
          commit?: boolean
        }

        const res = await fetch(`${env.TYPEDB_URL}/v1/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            databaseName: env.TYPEDB_DATABASE,
            transactionType: body.transactionType || 'read',
            query: body.query,
            commit: body.commit ?? body.transactionType === 'write',
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

    // GET /messages — Query conversation from D1
    if (url.pathname === '/messages' && request.method === 'GET') {
      try {
        const groupId = url.searchParams.get('group')
        if (!groupId) {
          return Response.json({ error: 'group parameter required' }, { status: 400, headers })
        }

        if (!env.DB) {
          return Response.json({ error: 'D1 not available' }, { status: 500, headers })
        }

        const result = await env.DB.prepare(`
          SELECT id, sender, content, role, ts FROM messages
          WHERE group_id = ?
          ORDER BY ts ASC
          LIMIT 100
        `)
          .bind(groupId)
          .all()

        return Response.json({ group: groupId, messages: result.results || [] }, { headers })
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error'
        return Response.json({ error: msg }, { status: 500, headers })
      }
    }

    // Index — useful for health checks on root
    if (url.pathname === '/' || url.pathname === '') {
      return Response.json(
        { status: 'ok', service: 'one-gateway', version: env.VERSION, database: env.TYPEDB_DATABASE },
        { headers },
      )
    }

    return Response.json({ error: 'Not found' }, { status: 404, headers })
  },
}
