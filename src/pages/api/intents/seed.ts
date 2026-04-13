/**
 * POST /api/intents/seed
 *
 * Seed intent registry from button config.
 * Call on app startup or when button definitions change.
 *
 * Body: { intents: Array<{ name, label, keywords, examples? }> }
 */

import type { APIRoute } from 'astro'
import { type Intent, seedIntents } from '@/engine/intent'

export const POST: APIRoute = async ({ request, locals }) => {
  const { intents } = (await request.json()) as { intents: Intent[] }
  if (!Array.isArray(intents))
    return new Response(JSON.stringify({ ok: false, error: 'intents must be array' }), { status: 400 })

  const env = (locals as { runtime?: { env?: { DB?: D1Database } } }).runtime?.env
  if (!env?.DB) return new Response(JSON.stringify({ ok: false, error: 'no DB binding' }), { status: 503 })

  await seedIntents(env.DB, intents)
  return new Response(JSON.stringify({ ok: true, seeded: intents.length }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
