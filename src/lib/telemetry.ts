/**
 * API Telemetry — Server-side signal emission
 *
 * Unlike SDK/CLI telemetry that POSTs to /api/signal, this module writes
 * directly to TypeDB via writeSilent() to avoid recursive HTTP calls.
 *
 * Emits: `api:<route>:<method>` with tags for status, latency bucket, error type.
 */

import { writeSilent } from './typedb'

const RATE_LIMIT = 500
const RATE_WINDOW_MS = 3_600_000

let tokenCount = 0
let windowStart = Date.now()

// Per-isolate session ID (Cloudflare Workers restart isolates frequently)
const sessionId = crypto.randomUUID().slice(0, 16)

function consume(): boolean {
  const now = Date.now()
  if (now - windowStart > RATE_WINDOW_MS) {
    tokenCount = 0
    windowStart = now
  }
  if (tokenCount >= RATE_LIMIT) return false
  tokenCount++
  return true
}

function latencyBucket(ms: number): string {
  if (ms < 50) return 'fast'
  if (ms < 200) return 'normal'
  if (ms < 1000) return 'slow'
  return 'timeout'
}

function escapeTql(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
}

export interface ApiTelemetryEvent {
  route: string
  method: string
  status: number
  latencyMs: number
  error?: string
  tags?: string[]
}

/**
 * Emit API telemetry signal. Fire-and-forget — never blocks request.
 *
 * @example
 * const start = Date.now()
 * // ... handle request ...
 * emit({
 *   route: '/api/signal',
 *   method: 'POST',
 *   status: 200,
 *   latencyMs: Date.now() - start,
 *   tags: ['receiver:bot', 'has-task']
 * })
 */
export function emit(event: ApiTelemetryEvent): void {
  if (!consume()) return

  const { route, method, status, latencyMs, error, tags = [] } = event
  const receiver = `api:${route.replace(/^\/api\//, '').replace(/\//g, ':')}:${method.toLowerCase()}`
  const bucket = latencyBucket(latencyMs)
  const statusClass = status < 300 ? 'ok' : status < 500 ? 'client-error' : 'server-error'

  const allTags = ['telemetry', 'api', method.toLowerCase(), statusClass, bucket, ...tags]

  const now = new Date().toISOString().replace('Z', '')

  // Write telemetry signal directly to TypeDB (fire-and-forget)
  writeSilent(`
    insert $s isa signal,
      has data "${escapeTql(
        JSON.stringify({
          receiver,
          tags: allTags,
          weight: status < 300 ? 1 : 0.5,
          content: {
            session: sessionId,
            route,
            method,
            status,
            latencyMs,
            bucket,
            error: error?.slice(0, 200),
          },
        }),
      )}",
      has amount 0,
      has success ${status < 300},
      has latency ${latencyMs}.0,
      has ts ${now};
  `)
}

/**
 * Middleware-style helper for Astro API routes.
 *
 * @example
 * export const POST: APIRoute = async (ctx) => {
 *   return withTelemetry(ctx, '/api/signal', async () => {
 *     // ... your handler ...
 *     return Response.json({ ok: true })
 *   })
 * }
 */
export async function withTelemetry(
  _ctx: { request: Request },
  route: string,
  handler: () => Promise<Response>,
): Promise<Response> {
  const start = Date.now()
  const method = _ctx.request.method

  try {
    const response = await handler()
    emit({
      route,
      method,
      status: response.status,
      latencyMs: Date.now() - start,
    })
    return response
  } catch (err) {
    emit({
      route,
      method,
      status: 500,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    })
    throw err
  }
}

/**
 * Get current session ID for this isolate.
 */
export function getSessionId(): string {
  return sessionId
}

/**
 * Check if telemetry is rate-limited.
 */
export function isRateLimited(): boolean {
  const now = Date.now()
  if (now - windowStart > RATE_WINDOW_MS) return false
  return tokenCount >= RATE_LIMIT
}
