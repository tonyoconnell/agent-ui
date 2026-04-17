/**
 * ONE Gateway — Cloudflare Worker proxy to TypeDB Cloud + D1
 *
 * Routes:
 *   POST /v1/signin     → JWT auth (cached 61s per isolate)
 *   POST /v1/query      → TypeQL read/write proxy
 *   GET  /messages      → Query conversation from D1
 *   GET  /health        → Status check
 *   GET  /proxy/sse     → SSE stream proxy (origin-checked)
 *
 * All TypeDB access goes through here. Browser → Worker → TypeDB Cloud.
 * CORS configured for localhost (dev) + one.ie (prod).
 */

import { getAllowedOrigins, isOriginAllowed } from './origin-allow'
import { sseProxy } from './sse-proxy'

interface Env {
  TYPEDB_URL: string
  TYPEDB_DATABASE: string
  TYPEDB_USERNAME: string
  TYPEDB_PASSWORD: string
  VERSION: string
  DB?: D1Database
  KV?: KVNamespace
  BROADCAST_SECRET?: string
  WS_HUB: DurableObjectNamespace
}

// Token cache (per-isolate, 61s TTL)
let cachedToken: { token: string; expires: number } | null = null

// Security: Limits and allowed message types
const MAX_WS_CONNECTIONS = 100
const ALLOWED_MESSAGE_TYPES = ['complete', 'unblock', 'mark', 'warn', 'task-update', 'sync']

/**
 * WsHub — Durable Object that centralizes WebSocket connections.
 *
 * All /ws upgrades and /broadcast POSTs route to the same DO instance
 * (named "global") so they share the connectedClients Set. This fixes
 * the cross-isolate limitation of module-level Sets in CF Workers.
 *
 * Uses the hibernation API: accepted sockets survive DO eviction and
 * wake the DO only on message receipt — no idle memory cost.
 */
export class WsHub {
  private state: DurableObjectState

  constructor(state: DurableObjectState, _env: Env) {
    this.state = state
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    // WebSocket upgrade
    if (url.pathname === '/connect') {
      const pair = new WebSocketPair()
      const [client, server] = Object.values(pair) as [WebSocket, WebSocket]

      // Hibernation: DO sleeps between messages, socket persists
      this.state.acceptWebSocket(server)

      return new Response(null, { status: 101, webSocket: client })
    }

    // Broadcast to all connected sockets
    if (url.pathname === '/send' && request.method === 'POST') {
      const message = await request.text()
      const sockets = this.state.getWebSockets()
      let sent = 0
      for (const ws of sockets) {
        try {
          ws.send(message)
          sent++
        } catch {
          // Socket closed, ignore
        }
      }
      return Response.json({ ok: true, sent })
    }

    // Count connections (for limit check)
    if (url.pathname === '/count') {
      return Response.json({ count: this.state.getWebSockets().length })
    }

    return new Response('Not found', { status: 404 })
  }

  // Hibernation: called when a hibernated socket receives a message
  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void {
    if (typeof message === 'string' && message === 'ping') {
      ws.send('pong')
    }
  }

  // Hibernation: called when a socket closes
  webSocketClose(ws: WebSocket, _code: number, _reason: string, _wasClean: boolean): void {
    try {
      ws.close()
    } catch {
      // already closed
    }
  }

  webSocketError(ws: WebSocket, _error: unknown): void {
    try {
      ws.close()
    } catch {
      // already closed
    }
  }
}

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
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Upgrade, Connection',
    'Access-Control-Max-Age': '86400',
  }
}

async function getToken(env: Env, forceFresh = false): Promise<string> {
  if (!forceFresh && cachedToken && cachedToken.expires > Date.now() + 60_000) {
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

/**
 * Query TypeDB with 401-retry.
 *
 * TypeDB Cloud may invalidate a JWT when the same user signs in from
 * another process (gateway vs Better Auth adapter both use `admin`).
 * On a 401 response we null the cached token, re-signin once, and retry.
 * Second 401 surfaces as a real error.
 */
async function typedbQuery(env: Env, body: object): Promise<Response> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await getToken(env, attempt === 1)
    const res = await fetch(`${env.TYPEDB_URL}/v1/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })
    if (res.status === 401 && attempt === 0) {
      cachedToken = null
      continue
    }
    return res
  }
  // Unreachable — the loop returns or continues.
  throw new Error('typedbQuery: exhausted retries')
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
    // Routes to the WsHub Durable Object so all isolates see the same clients.
    if (url.pathname === '/ws') {
      // Security: Check origin against CORS_ORIGINS + per-agent KV allowlist
      const wsOrigin = request.headers.get('Origin')
      if (!wsOrigin) {
        return new Response('Origin not allowed', { status: 403, headers })
      }
      const target = url.searchParams.get('target') ?? ''
      const agentAllowed = target && env.KV ? await getAllowedOrigins(target, env.KV) : []
      if (!isOriginAllowed(wsOrigin, agentAllowed, CORS_ORIGINS)) {
        return new Response('Origin not allowed', { status: 403, headers })
      }

      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected WebSocket upgrade', { status: 426, headers })
      }

      // Security: Enforce global connection limit via DO
      const hubId = env.WS_HUB.idFromName('global')
      const hub = env.WS_HUB.get(hubId)
      const countRes = await hub.fetch('https://do/count')
      const { count } = (await countRes.json()) as { count: number }
      if (count >= MAX_WS_CONNECTIONS) {
        return new Response('Too many connections', { status: 503, headers })
      }

      // Forward the upgrade to the DO (with the Upgrade header preserved)
      return hub.fetch('https://do/connect', request)
    }

    // POST /broadcast — relay a WsMessage to all connected WebSocket clients via DO
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

        // Forward to the global WsHub DO — all isolates share this one hub
        const hubId = env.WS_HUB.idFromName('global')
        const hub = env.WS_HUB.get(hubId)
        const result = await hub.fetch('https://do/send', {
          method: 'POST',
          body: message,
        })
        const data = (await result.json()) as { ok: boolean; sent: number }
        return Response.json(data, { headers })
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
        const query = `
          match
            $s isa skill, has skill-id $id, has name $name;
          select $id, $name;
          limit 100;
        `

        const res = await typedbQuery(env, {
          databaseName: env.TYPEDB_DATABASE,
          transactionType: 'read',
          query,
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

    // PATCH /tasks/:tid — Update task status in D1 + broadcast via WsHub
    if (url.pathname.startsWith('/tasks/') && request.method === 'PATCH') {
      const tid = url.pathname.split('/tasks/')[1]?.split('/')[0]
      if (!tid) return Response.json({ error: 'Missing task id' }, { status: 400, headers })
      if (!env.DB) return Response.json({ error: 'D1 not available' }, { status: 500, headers })

      try {
        const body = (await request.json()) as { status?: string }
        const validStatuses = ['todo', 'in_progress', 'complete', 'blocked', 'failed']
        if (!body.status || !validStatuses.includes(body.status)) {
          return Response.json({ error: 'Invalid status' }, { status: 400, headers })
        }

        const now = Date.now()

        // Upsert to D1 — update if exists, insert minimal row if not
        const existing = await env.DB.prepare('SELECT tid FROM project_tasks WHERE tid = ?').bind(tid).first()
        if (existing) {
          await env.DB.prepare('UPDATE project_tasks SET status = ?, updated_at = ? WHERE tid = ?')
            .bind(body.status, now, tid)
            .run()
        } else {
          await env.DB.prepare(
            'INSERT INTO project_tasks (tid, name, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
          )
            .bind(tid, tid, body.status, now, now)
            .run()
        }

        // Cascade unblock: if completing, find blocked tasks whose blockers are all done
        const unblocked: string[] = []
        if (body.status === 'complete') {
          const blocked = await env.DB.prepare(
            "SELECT tid, blocked_by FROM project_tasks WHERE status = 'blocked'",
          ).all()
          for (const row of blocked.results || []) {
            const blockedBy: string[] = JSON.parse((row.blocked_by as string) || '[]')
            if (!blockedBy.includes(tid)) continue
            // Check if all blockers are now complete
            const otherBlockers = blockedBy.filter((b) => b !== tid)
            let allDone = true
            for (const b of otherBlockers) {
              const blocker = await env.DB.prepare('SELECT status FROM project_tasks WHERE tid = ?').bind(b).first()
              if (!blocker || blocker.status !== 'complete') {
                allDone = false
                break
              }
            }
            if (allDone) {
              await env.DB.prepare("UPDATE project_tasks SET status = 'todo', updated_at = ? WHERE tid = ?")
                .bind(now, row.tid)
                .run()
              unblocked.push(row.tid as string)
            }
          }
        }

        // Broadcast status change via WsHub DO (instant to all connected browsers)
        const hubId = env.WS_HUB.idFromName('global')
        const hub = env.WS_HUB.get(hubId)
        await hub.fetch('https://do/send', {
          method: 'POST',
          body: JSON.stringify({ type: 'task-update', task: { tid, name: tid, status: body.status }, timestamp: now }),
        })

        // Broadcast unblock events
        for (const ubTid of unblocked) {
          await hub.fetch('https://do/send', {
            method: 'POST',
            body: JSON.stringify({ type: 'unblock', taskId: ubTid, unblockedBy: tid, timestamp: now }),
          })
        }

        return Response.json({ ok: true, tid, status: body.status, unblocked }, { headers })
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error'
        return Response.json({ error: msg }, { status: 500, headers })
      }
    }

    // POST /tasks/:tid/complete — Mark pheromone + status in D1 + broadcast
    if (url.pathname.match(/^\/tasks\/[^/]+\/complete$/) && request.method === 'POST') {
      const tid = url.pathname.split('/tasks/')[1]?.split('/')[0]
      if (!tid) return Response.json({ error: 'Missing task id' }, { status: 400, headers })
      if (!env.DB) return Response.json({ error: 'D1 not available' }, { status: 500, headers })

      try {
        const body = (await request.json()) as { from?: string; failed?: boolean }
        const failed = body.failed === true
        const now = Date.now()
        const delta = failed ? 8.0 : 5.0
        const field = failed ? 'alarm_pheromone' : 'trail_pheromone'

        // Update pheromone in D1
        await env.DB.prepare(
          `UPDATE project_tasks SET ${field} = MIN(100, ${field} + ?), status = ?, updated_at = ? WHERE tid = ?`,
        )
          .bind(delta, failed ? 'failed' : 'complete', now, tid)
          .run()

        // Read back for broadcast values
        const task = (await env.DB.prepare('SELECT trail_pheromone, alarm_pheromone FROM project_tasks WHERE tid = ?')
          .bind(tid)
          .first()) as { trail_pheromone: number; alarm_pheromone: number } | null

        // Broadcast via WsHub DO
        const hubId = env.WS_HUB.idFromName('global')
        const hub = env.WS_HUB.get(hubId)

        if (failed) {
          await hub.fetch('https://do/send', {
            method: 'POST',
            body: JSON.stringify({ type: 'warn', taskId: tid, resistance: task?.alarm_pheromone ?? 0, timestamp: now }),
          })
        } else {
          await hub.fetch('https://do/send', {
            method: 'POST',
            body: JSON.stringify({ type: 'mark', taskId: tid, strength: task?.trail_pheromone ?? 0, timestamp: now }),
          })
          await hub.fetch('https://do/send', {
            method: 'POST',
            body: JSON.stringify({ type: 'complete', taskId: tid, timestamp: now }),
          })
        }

        return Response.json({ ok: true, tid, outcome: failed ? 'failed' : 'success' }, { headers })
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error'
        return Response.json({ error: msg }, { status: 500, headers })
      }
    }

    // POST /typedb/query — proxy TypeQL queries to TypeDB Cloud /v1/query
    if (url.pathname === '/typedb/query' && request.method === 'POST') {
      try {
        const body = (await request.json()) as {
          query: string
          transactionType?: 'read' | 'write'
          commit?: boolean
        }

        const res = await typedbQuery(env, {
          databaseName: env.TYPEDB_DATABASE,
          transactionType: body.transactionType || 'read',
          query: body.query,
          commit: body.commit ?? body.transactionType === 'write',
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

    // GET /proxy/sse?upstream=<encoded-url> — stream SSE from an upstream URL
    // Origin check mirrors /ws: CORS_ORIGINS + per-agent KV allowlist via ?target=
    if (url.pathname === '/proxy/sse' && request.method === 'GET') {
      const upstream = url.searchParams.get('upstream')
      if (!upstream) {
        return Response.json({ error: 'upstream parameter required' }, { status: 400, headers })
      }
      const sseOrigin = request.headers.get('Origin')
      if (!sseOrigin) {
        return new Response('Origin not allowed', { status: 403, headers })
      }
      const target = url.searchParams.get('target') ?? ''
      const agentAllowed = target && env.KV ? await getAllowedOrigins(target, env.KV) : []
      if (!isOriginAllowed(sseOrigin, agentAllowed, CORS_ORIGINS)) {
        return new Response('Origin not allowed', { status: 403, headers })
      }
      return sseProxy(decodeURIComponent(upstream), request, sseOrigin)
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
