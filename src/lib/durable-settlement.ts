/**
 * Durable Settlement Storage — D1 table for escrow settlement state.
 *
 * Provides fire-and-forget settlement with durability across worker restarts.
 * Uses D1 as the source of truth for settlement status.
 */

import type { DurableSettlement, EscrowReleasedEvent } from '@/types/escrow-settlement'

// Lazy-load D1 — only available in worker context
let _db: any = null

function getDb() {
  // In Astro SSR/Pages context, we don't have direct D1 access
  // Instead, use fetch to POST to our own API endpoint
  // This is handled by the route itself (database passed via context)
  if (!_db) {
    throw new Error('D1 database not available in this context')
  }
  return _db
}

/**
 * Initialize with D1 database handle (from Astro context).
 * This must be called before any storage operations.
 */
export function initDurableSettlement(db: any) {
  _db = db
}

/**
 * Store a pending settlement request.
 * Called right after client proves TX digest.
 *
 * Returns: settlement ID for polling/status checks.
 */
export async function storePendingSettlement(
  escrow_id: string,
  tx_digest: string,
  original_request: DurableSettlement['original_request'],
  db?: any,
): Promise<string> {
  const database = db || getDb()

  const settlementId = `settle:${escrow_id}`
  const now = Date.now()
  const expiresAt = now + 24 * 60 * 60 * 1000 // 24h

  await database.run(
    `
    INSERT INTO escrow_settlements
    (id, escrow_id, tx_digest, original_request, status, created_at, expires_at)
    VALUES (?, ?, ?, ?, 'pending', ?, ?)
    `,
    [settlementId, escrow_id, tx_digest, JSON.stringify(original_request), now, expiresAt],
  )

  return settlementId
}

/**
 * Retrieve pending settlement by escrow_id.
 * Used to check settlement status and retrieve original request for re-execution.
 */
export async function getPendingSettlement(escrow_id: string, db?: any): Promise<DurableSettlement | null> {
  const database = db || getDb()

  const result = await database
    .prepare(
      `
    SELECT * FROM escrow_settlements
    WHERE escrow_id = ?
    LIMIT 1
    `,
    )
    .bind(escrow_id)
    .first()

  if (!result) return null

  return {
    id: result.id,
    escrow_id: result.escrow_id,
    tx_digest: result.tx_digest,
    original_request: JSON.parse(result.original_request),
    status: result.status,
    result_json: result.result_json,
    error_message: result.error_message,
    retry_count: result.retry_count,
    created_at: result.created_at,
    settled_at: result.settled_at,
    expires_at: result.expires_at,
  }
}

/**
 * Mark settlement as settled (idempotent).
 * Once settled, the same escrow_id will not re-execute.
 */
export async function markSettled(escrow_id: string, result: unknown, db?: any): Promise<boolean> {
  const database = db || getDb()

  const now = Date.now()
  const resultJson = JSON.stringify(result)

  await database.run(
    `
    UPDATE escrow_settlements
    SET status = 'settled', result_json = ?, settled_at = ?
    WHERE escrow_id = ?
    `,
    [resultJson, now, escrow_id],
  )

  return true
}

/**
 * Mark settlement as failed (with retry tracking).
 * Retries up to 3 times before giving up.
 */
export async function markFailed(escrow_id: string, error: string, db?: any): Promise<boolean> {
  const database = db || getDb()

  await database.run(
    `
    UPDATE escrow_settlements
    SET status = 'failed', error_message = ?, retry_count = retry_count + 1
    WHERE escrow_id = ?
    `,
    [error, escrow_id],
  )

  return true
}

/**
 * Retrieve settlement by ID (settlement ID, not escrow ID).
 * Used for polling settlement status.
 */
export async function getSettlementById(settlementId: string, db?: any): Promise<DurableSettlement | null> {
  const database = db || getDb()

  const result = await database
    .prepare(
      `
    SELECT * FROM escrow_settlements
    WHERE id = ?
    LIMIT 1
    `,
    )
    .bind(settlementId)
    .first()

  if (!result) return null

  return {
    id: result.id,
    escrow_id: result.escrow_id,
    tx_digest: result.tx_digest,
    original_request: JSON.parse(result.original_request),
    status: result.status,
    result_json: result.result_json,
    error_message: result.error_message,
    retry_count: result.retry_count,
    created_at: result.created_at,
    settled_at: result.settled_at,
    expires_at: result.expires_at,
  }
}

/**
 * Clean up expired settlements (older than 24h).
 * Run this periodically to prevent table bloat.
 */
export async function cleanupExpiredSettlements(db?: any): Promise<number> {
  const database = db || getDb()

  const result = await database.run(
    `
    DELETE FROM escrow_settlements
    WHERE expires_at < ? AND status IN ('settled', 'failed')
    `,
    [Date.now()],
  )

  return result.meta.changes || 0
}
