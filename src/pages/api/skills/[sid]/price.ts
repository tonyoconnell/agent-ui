/**
 * PATCH /api/skills/:sid/price — Update price (and optional metadata) on a capability
 *
 * Body: { price: number, mode?: string, visibility?: string }
 *
 * Updates the `price` attribute on the capability relation that offers the skill.
 * `mode` and `visibility` are stored as tags on the skill for future use;
 * signal-scope is not in the current schema so visibility is a no-op at the DB level.
 */
import type { APIRoute } from 'astro'
import { requireAuth, validateApiKey } from '@/lib/api-auth'
import { write } from '@/lib/typedb'

export const PATCH: APIRoute = async ({ request, params }) => {
  const auth = await validateApiKey(request)
  try {
    requireAuth(auth)
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const sid = params.sid
  if (!sid || !/^[a-zA-Z0-9:_-]+$/.test(sid)) {
    return new Response(JSON.stringify({ error: 'Invalid skill id' }), { status: 400 })
  }

  const body = (await request.json()) as { price?: unknown; mode?: string; visibility?: string }
  const { price, mode, visibility } = body

  if (typeof price !== 'number' || price < 0) {
    return new Response(JSON.stringify({ error: 'price must be a non-negative number' }), { status: 400 })
  }

  try {
    // Update price on the capability relation that offers this skill
    await write(`
      match
        $s isa skill, has skill-id "${sid}";
        $cap (offered: $s) isa capability, has price $p;
      delete $p of $cap;
      insert $cap has price ${price};
    `)

    return new Response(JSON.stringify({ ok: true, sid, price, mode, visibility }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}
