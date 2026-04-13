/**
 * POST /api/signup — Register a new unit (name reservation)
 *
 * Body: { name: string, unitKind: "human" | "agent" | "llm", wallet?: string }
 * Creates unit in TypeDB with initial stats.
 */
import type { APIRoute } from 'astro'
import { write } from '@/lib/typedb'

export const POST: APIRoute = async ({ request }) => {
  const { name, unitKind, wallet } = (await request.json()) as {
    name: string
    unitKind: string
    wallet?: string
  }

  if (!name || !unitKind) {
    return new Response(JSON.stringify({ error: 'Missing name or unitKind' }), { status: 400 })
  }

  // Sanitize name: lowercase, alphanumeric + hyphens
  const safeName = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 32)
  if (!safeName) {
    return new Response(JSON.stringify({ error: 'Invalid name' }), { status: 400 })
  }

  // Generate uid from name
  const uid = safeName

  const walletClause = wallet ? `has wallet "${wallet}",` : ''

  try {
    await write(`
      insert
        $u isa unit,
          has uid "${uid}",
          has name "${safeName}",
          has unit-kind "${unitKind}",
          ${walletClause}
          has status "active",
          has balance 0.0,
          has reputation 0.0,
          has success-rate 0.5,
          has activity-score 0.0,
          has sample-count 0;
    `)

    return new Response(JSON.stringify({ ok: true, uid }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    // TypeDB will throw if uid already exists (@key constraint)
    if (message.includes('already') || message.includes('unique') || message.includes('key')) {
      return new Response(JSON.stringify({ error: `Name "${safeName}" is already taken` }), { status: 409 })
    }
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}
