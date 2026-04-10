/**
 * POST /api/absorb
 *
 * Poll Sui events → write to TypeDB.
 * Call from sync worker cron or manually.
 *
 * Body: { cursor?: string }
 * Returns: { count, cursor }
 */

import type { APIRoute } from 'astro'
import { absorb } from '@/engine/bridge'

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({})) as any
    const result = await absorb(body.cursor)
    return Response.json({ ok: true, ...result })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
