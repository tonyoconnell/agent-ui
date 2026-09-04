/**
 * POST /api/warn — Add resistance to a path (failure pheromone).
 *
 * Fail-open on missing Authorization header; gated on `hasPathRelationship`
 * when authed (caller must have participated in signals between from/to).
 *
 * Body: { from: string, to: string, weight?: number }
 */
import type { APIRoute } from 'astro'
import { readParsed, write } from '@/lib/typedb'

export const POST: APIRoute = async ({ request }) => {
  try {
    const {
      from,
      to,
      weight = 1.0,
    } = (await request.json()) as {
      from: string
      to: string
      weight?: number
    }

    // Sanitize at entry so every downstream path (auth + write) uses safe interpolants.
    const safeFrom = from.replace(/[^a-zA-Z0-9_:.-]/g, '')
    const safeTo = to.replace(/[^a-zA-Z0-9_:.-]/g, '')
    const safeWeight = Number.isFinite(weight) ? Number(weight) : 1.0

    // Governance: role check if auth provided (fail-open for backward compat)
    const authHeader = request.headers.get('Authorization')
    if (authHeader) {
      const { validateApiKey, getRoleForUser } = await import('@/lib/api-auth')
      const { roleCheck } = await import('@/lib/role-check')
      try {
        const auth = await validateApiKey(request)
        if (!auth.isValid) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        const role = await getRoleForUser(auth.user)
        if (!roleCheck(role ?? 'agent', 'warn')) {
          return new Response(JSON.stringify({ error: 'Forbidden: agent+ role required' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        // Pheromone gate: caller must have participated in this path (as sender or receiver
        // of any signal between from and to). Fail-open preserved for headerless callers.
        const safeUid = auth.user.replace(/[^a-zA-Z0-9_:.-]/g, '')
        const participates = await readParsed(
          `match $u isa actor, has aid "${safeUid}";
           $s isa actor, has aid "${safeFrom}";
           $t isa actor, has aid "${safeTo}";
           { (sender: $u, receiver: $t) isa signal; } or
           { (sender: $s, receiver: $u) isa signal; };
           select $u; limit 1;`,
        ).catch(() => [])
        if (participates.length === 0) {
          return new Response(JSON.stringify({ error: 'forbidden: caller has no pheromone on this path' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      } catch {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    await write(`
      match
        $from isa actor, has aid "${safeFrom}";
        $to isa actor, has aid "${safeTo}";
        $e (source: $from, target: $to) isa path, has resistance $r;
      delete $r of $e;
      insert $e has resistance ($r + ${safeWeight});
    `).catch(() =>
      write(`
        match
          $from isa actor, has aid "${safeFrom}";
          $to isa actor, has aid "${safeTo}";
        insert
          (source: $from, target: $to) isa path,
            has strength 0.0, has resistance ${safeWeight}, has traversals 0, has revenue 0.0;
      `),
    )

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
