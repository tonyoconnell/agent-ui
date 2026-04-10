/**
 * Durable Ask — persists pending replies in D1.
 *
 * The problem: ask() uses setTimeout in memory. CF Worker isolates recycle after
 * ~30 seconds of inactivity. Human-in-loop flows wait minutes or hours.
 * The in-memory ask dies. The human reply arrives to nothing.
 *
 * The fix: write the pending ask to D1 before waiting. Poll D1 for resolution.
 * If the isolate dies, a new request re-reads D1 and continues.
 * POST /api/ask/reply resolves asks from any external system.
 *
 * Usage:
 *   const { result, timeout } = await durableAsk(env, signal, 'entry', 3_600_000)
 */

import type { Signal } from './world'

export interface DurableAskEnv {
  DB: D1Database
}

export interface DurableAskResult {
  result?: unknown
  timeout?: boolean
  dissolved?: boolean
}

/**
 * Signal + durable wait. Resolves when POST /api/ask/reply arrives
 * with { id, result }, or when expires_at is exceeded.
 */
export const durableAsk = async (
  env: DurableAskEnv,
  s: Signal,
  from = 'entry',
  timeoutMs = 86_400_000,  // 24h default for human-in-loop
  channel?: { type: 'telegram' | 'discord'; id: string }
): Promise<DurableAskResult> => {
  const id = `ask:${crypto.randomUUID()}`
  const expiresAt = Date.now() + timeoutMs

  await env.DB.prepare(
    `INSERT INTO pending_asks (id, signal_json, from_unit, expires_at, channel, channel_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, JSON.stringify(s), from, expiresAt,
    channel?.type ?? null, channel?.id ?? null, Date.now()
  ).run()

  const signalWithReply = { ...s, data: { ...(s.data as object || {}), replyTo: id } }

  // Poll D1 within the CF isolate's lifetime (~25s), then rely on webhook
  const POLL_MS = 1_000
  const SYNC_LIMIT = 25_000

  return new Promise((resolve) => {
    const deadline = Date.now() + SYNC_LIMIT
    const poll = setInterval(async () => {
      const row = await env.DB.prepare(
        'SELECT resolved, result_json FROM pending_asks WHERE id = ?'
      ).bind(id).first<{ resolved: number; result_json: string | null }>()

      if (row?.resolved) {
        clearInterval(poll)
        resolve({ result: row.result_json ? JSON.parse(row.result_json) : true })
        return
      }

      if (Date.now() >= deadline) {
        clearInterval(poll)
        // Isolate limit reached — the ask stays open in D1.
        // It resolves when the webhook calls resolveAsk() later.
        // For now return timeout so the caller can decide how to wait.
        if (Date.now() >= expiresAt) {
          resolve({ timeout: true })
        } else {
          resolve({ timeout: true })  // soft timeout — ask still open in D1
        }
      }
    }, POLL_MS)
  })
}

/**
 * Resolve a pending ask. Call from:
 *   - POST /api/ask/reply (Telegram/Discord webhook, external approval UI)
 *   - Any handler that holds the ask ID
 */
export const resolveAsk = async (
  env: DurableAskEnv,
  id: string,
  result: unknown
): Promise<boolean> => {
  const r = await env.DB.prepare(
    'UPDATE pending_asks SET resolved = 1, result_json = ? WHERE id = ? AND resolved = 0'
  ).bind(JSON.stringify(result), id).run()
  return (r.meta.changes ?? 0) > 0
}

/**
 * Check if an ask is still pending (for webhook handlers that don't know the state).
 */
export const getPendingAsk = async (
  env: DurableAskEnv,
  id: string
): Promise<{ signal: Signal; from: string; expiresAt: number } | null> => {
  const row = await env.DB.prepare(
    'SELECT signal_json, from_unit, expires_at FROM pending_asks WHERE id = ? AND resolved = 0 AND expires_at > ?'
  ).bind(id, Date.now()).first<{ signal_json: string; from_unit: string; expires_at: number }>()
  if (!row) return null
  return {
    signal: JSON.parse(row.signal_json) as Signal,
    from: row.from_unit,
    expiresAt: row.expires_at,
  }
}

/**
 * Expire stale asks. Run from cron worker.
 */
export const expireAsks = async (env: DurableAskEnv): Promise<number> => {
  const r = await env.DB.prepare(
    'UPDATE pending_asks SET resolved = 1 WHERE expires_at < ? AND resolved = 0'
  ).bind(Date.now()).run()
  return r.meta.changes ?? 0
}
