/**
 * GET /api/intents/learn
 *
 * Return the most common unrecognised queries from the past week.
 * Review these to discover new intents — add keywords → immediate cache benefit.
 *
 * Query params:
 *   limit        max results (default 50)
 *   minFrequency min times seen (default 3)
 */

import type { APIRoute } from 'astro'
import { unknownQueries } from '@/engine/intent'

export const GET: APIRoute = async ({ url, locals }) => {
  const env = (locals as { runtime?: { env?: { DB?: D1Database } } }).runtime?.env
  if (!env?.DB) return new Response(JSON.stringify({ ok: false, error: 'no DB binding' }), { status: 503 })

  const limit = Number(url.searchParams.get('limit') ?? 50)
  const minFrequency = Number(url.searchParams.get('minFrequency') ?? 3)

  const unknowns = await unknownQueries(env.DB, { limit, minFrequency })
  return new Response(JSON.stringify({ ok: true, unknowns }), { headers: { 'Content-Type': 'application/json' } })
}
