/**
 * GET /api/waves/expire — Stale wave-lock recovery
 *
 * Finds wave-locks claimed >2 hours ago and releases them.
 * Called from /api/tick as part of L3 cleanup (every 5 min).
 * Returns: { expired: [...], count: N }
 */
import type { APIRoute } from 'astro'
import { read, write } from '@/lib/typedb'

const WAVE_LOCK_TTL_MS = 2 * 60 * 60 * 1000 // 2 hours

export const GET: APIRoute = async () => {
  try {
    // Read all wave-locks
    const q = `match $wl isa wave-lock, has wave-lock-id $id, has owner $o, has claimed-at $c; select $id, $o, $c;`
    const rows = (await read(q)) as Array<{ id: string; o: string; c: string }>

    const expired = []
    const now = new Date()

    for (const row of rows) {
      if (!row.c) continue
      const claimedAt = new Date(row.c)
      const age = now.getTime() - claimedAt.getTime()

      if (age > WAVE_LOCK_TTL_MS) {
        // Release stale wave-lock
        const release = `match $wl isa wave-lock, has wave-lock-id "${row.id}"; delete $wl;`
        await write(release)
        expired.push({ id: row.id, owner: row.o, releasedAt: now.toISOString() })
      }
    }

    return new Response(JSON.stringify({ expired, count: expired.length }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    // Log error but don't fail (expire is best-effort)
    console.error('Wave-lock expire error:', e instanceof Error ? e.message : String(e))
    return new Response(JSON.stringify({ expired: [], count: 0, error: 'Expire check failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
