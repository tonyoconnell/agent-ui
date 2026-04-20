/**
 * Platform BaaS metering — per-key monthly call counts in D1.
 *
 * Contract:
 *   - Fire-and-forget on the hot path: `void recordCall(db, keyId)` never throws.
 *   - Durable: counts survive worker restarts (D1 is backing store).
 *   - Month key: "YYYY-MM" UTC. Rollover is automatic on first insert.
 *   - Reads are authoritative; writes never block the caller.
 *
 * See one/pricing.md for tier limits and one/platform-baas-todo.md T-B1-03.
 */

import type { D1Database } from '@cloudflare/workers-types'

/** Returns the current "YYYY-MM" month key (UTC). */
export function currentMonth(now: Date = new Date()): string {
  const y = now.getUTCFullYear()
  const m = (now.getUTCMonth() + 1).toString().padStart(2, '0')
  return `${y}-${m}`
}

/**
 * Increment the monthly call counter for a key. Never throws.
 * Safe to invoke as `void recordCall(...)`.
 */
export async function recordCall(db: D1Database | null, keyId: string): Promise<void> {
  if (!db || !keyId) return
  const month = currentMonth()
  try {
    await db
      .prepare(
        'INSERT INTO meter (key_id, month, calls) VALUES (?, ?, 1) ' +
          'ON CONFLICT(key_id, month) DO UPDATE SET calls = calls + 1',
      )
      .bind(keyId, month)
      .run()
  } catch {
    /* metering must never break the caller */
  }
}

/** Return the current month's call count for a key. 0 on any error. */
export async function getUsage(db: D1Database | null, keyId: string, month?: string): Promise<number> {
  if (!db || !keyId) return 0
  const m = month || currentMonth()
  try {
    const row = await db
      .prepare('SELECT calls FROM meter WHERE key_id = ? AND month = ?')
      .bind(keyId, m)
      .first<{ calls?: number }>()
    return Number(row?.calls ?? 0)
  } catch {
    return 0
  }
}

/** Return the number of agents a key has registered. 0 on any error. */
export async function getAgentCount(db: D1Database | null, keyId: string): Promise<number> {
  if (!db || !keyId) return 0
  try {
    const row = await db
      .prepare('SELECT COUNT(*) AS n FROM developer_agents WHERE key_id = ?')
      .bind(keyId)
      .first<{ n?: number }>()
    return Number(row?.n ?? 0)
  } catch {
    return 0
  }
}

/**
 * Record a new agent registration for a key. Idempotent on (key_id, uid).
 * Never throws.
 */
export async function recordAgent(db: D1Database | null, keyId: string, uid: string): Promise<void> {
  if (!db || !keyId || !uid) return
  try {
    await db
      .prepare(
        'INSERT INTO developer_agents (key_id, uid, created_at) VALUES (?, ?, unixepoch()) ' +
          'ON CONFLICT(key_id, uid) DO NOTHING',
      )
      .bind(keyId, uid)
      .run()
  } catch {
    /* best-effort */
  }
}
