/**
 * POST /api/mark — Add weight to a path (success pheromone)
 *
 * Body: { from: string, to: string, strength?: number }
 */
import type { APIRoute } from 'astro'
import { readParsed, write } from '@/lib/typedb'

export const POST: APIRoute = async ({ request }) => {
  const {
    from,
    to,
    strength = 1.0,
  } = (await request.json()) as {
    from: string
    to: string
    strength?: number
  }

  // Sanitize at entry so every downstream path (auth + write) uses safe interpolants.
  // Allowlist matches substrate uid convention: alnum, underscore, colon, dot, hyphen.
  const safeFrom = from.replace(/[^a-zA-Z0-9_:.-]/g, '')
  const safeTo = to.replace(/[^a-zA-Z0-9_:.-]/g, '')
  const safeStrength = Number.isFinite(strength) ? Number(strength) : 1.0

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
      if (!roleCheck(role ?? 'agent', 'mark')) {
        return new Response(JSON.stringify({ error: 'Forbidden: operator+ role required' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      // Pheromone gate: caller must have participated in this path (as sender or receiver of any signal between from and to).
      // Fail-open preserved for headerless callers (block above would have returned early).
      const safeUid = auth.user.replace(/[^a-zA-Z0-9_:.-]/g, '')
      const participates = await readParsed(
        `match $u isa unit, has uid "${safeUid}";
         $s isa unit, has uid "${safeFrom}";
         $t isa unit, has uid "${safeTo}";
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
      $from isa unit, has uid "${safeFrom}";
      $to isa unit, has uid "${safeTo}";
      $e (source: $from, target: $to) isa path, has strength $s;
    delete $s of $e;
    insert $e has strength ($s + ${safeStrength});
  `).catch(() =>
    write(`
      match
        $from isa unit, has uid "${safeFrom}";
        $to isa unit, has uid "${safeTo}";
      insert
        (source: $from, target: $to) isa path,
          has strength ${safeStrength}, has resistance 0.0, has traversals 0, has revenue 0.0;
    `),
  )

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
