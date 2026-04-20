import type { D1Database } from '@cloudflare/workers-types'

/**
 * Resolve a tag name to the best matching subscriber uid.
 * Queries D1 `subscriptions` table — public scope only.
 * Returns the most-recently-subscribed uid, or null if no subscriber exists.
 * Private-scope filtering (group membership check) is deferred to Cycle 3.
 */
export async function resolveTagReceiver(tag: string, db: D1Database | null): Promise<string | null> {
  if (!db) return null
  const row = await db
    .prepare('SELECT uid FROM subscriptions WHERE tag = ? AND scope = ? ORDER BY created_at DESC LIMIT 1')
    .bind(tag, 'public')
    .first<{ uid: string }>()
    .catch(() => null)
  return row?.uid ?? null
}
