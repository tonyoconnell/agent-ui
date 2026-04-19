/**
 * GET /api/waves/expire — Stale wave-lock recovery
 *
 * Finds wave-locks claimed >2 hours ago and releases them.
 * Called from /api/tick as part of L3 cleanup (every 5 min).
 * Returns: { expired: [...], count: N }
 */
import type { APIRoute } from 'astro'

export const GET: APIRoute = async () => {
  // TODO: claimed-at not in master schema (one.tql) — TTL expiration disabled
  // Once claimed-at is added to schema, restore TTL logic (2h TTL)
  // For now, return empty (no stale locks expired)
  return new Response(JSON.stringify({ expired: [], count: 0, note: 'wave TTL disabled (schema mismatch)' }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
