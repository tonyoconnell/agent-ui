/**
 * POST /api/decay — Run asymmetric decay cycle
 *
 * Body: { trailRate?: number, resistanceRate?: number }
 * Defaults: strength 5% (slow), resistance 20% (fast)
 *
 * From ant biology: success persists, failure forgives.
 */
import type { APIRoute } from 'astro'
import { decay } from '@/lib/typedb'

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json().catch(() => ({}))) as {
    trailRate?: number
    resistanceRate?: number
  }

  await decay(body.trailRate, body.resistanceRate)

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
