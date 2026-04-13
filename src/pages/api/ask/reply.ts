/**
 * POST /api/ask/reply
 *
 * Resolves a pending durable ask. Called by:
 *   - NanoClaw when a Telegram user replies to a bot message containing an ask ID
 *   - Discord webhook handlers
 *   - Human approval UI
 *   - Any external system that holds a replyTo ask ID
 *
 * Body: { id: string, result: unknown }
 * Returns: { ok: boolean }
 */

import type { APIRoute } from 'astro'
import { resolveAsk } from '@/engine/durable-ask'

export const POST: APIRoute = async ({ request, locals }) => {
  const body = (await request.json()) as { id?: string; result?: unknown }
  if (!body?.id) return new Response(JSON.stringify({ ok: false, error: 'missing id' }), { status: 400 })

  const env = (locals as { runtime?: { env?: { DB?: D1Database } } }).runtime?.env
  if (!env?.DB) return new Response(JSON.stringify({ ok: false, error: 'no DB binding' }), { status: 503 })

  const resolved = await resolveAsk({ DB: env.DB }, body.id, body.result ?? true)
  return new Response(JSON.stringify({ ok: resolved }), { headers: { 'Content-Type': 'application/json' } })
}
