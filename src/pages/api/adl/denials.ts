/**
 * `/see denials` surface (Cycle 3).
 *
 * Reads the ADL audit trail from D1 `adl_audit`. Every gate in the
 * deterministic sandwich (lifecycle / network / sensitivity / schema /
 * bridge-network / bridge-error) writes here via `audit()` in adl-cache.ts.
 *
 * Filters: ?gate=schema&decision=deny&receiver=donal:cmo&since=<ISO>&limit=100
 *
 * Each call flushes the in-memory ring buffer first so records captured
 * inside the engine (where D1 isn't bound) become durable.
 */
import type { APIRoute } from 'astro'
import { auditStats, flushAuditBuffer } from '@/engine/adl-cache'

export const prerender = false

export const GET: APIRoute = async ({ request, locals }) => {
  const db = locals?.runtime?.env?.DB
  if (!db) {
    return Response.json({ error: 'D1 database not available' }, { status: 500 })
  }

  // Flush whatever the engine captured since the last request.
  const flushed = await flushAuditBuffer(db).catch(() => 0)

  const url = new URL(request.url)
  const gate = url.searchParams.get('gate')
  const decision = url.searchParams.get('decision')
  const receiver = url.searchParams.get('receiver')
  const since = url.searchParams.get('since')
  const limit = Math.min(Number.parseInt(url.searchParams.get('limit') || '100', 10) || 100, 500)

  const where: string[] = []
  const binds: unknown[] = []
  if (gate) {
    where.push('gate = ?')
    binds.push(gate)
  }
  if (decision) {
    where.push('decision = ?')
    binds.push(decision)
  }
  if (receiver) {
    where.push('receiver = ?')
    binds.push(receiver)
  }
  if (since) {
    where.push('ts >= ?')
    binds.push(since)
  }
  const sql = `SELECT id, ts, sender, receiver, gate, decision, mode, reason
               FROM adl_audit
               ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
               ORDER BY ts DESC
               LIMIT ?`
  binds.push(limit)

  const result = await db
    .prepare(sql)
    .bind(...binds)
    .all()
    .catch((e: unknown) => {
      console.error('[adl denials] query failed:', e)
      return { results: [] as unknown[] }
    })

  return Response.json({
    denials: result.results || [],
    flushed,
    stats: auditStats(),
    filters: { gate, decision, receiver, since, limit },
  })
}
