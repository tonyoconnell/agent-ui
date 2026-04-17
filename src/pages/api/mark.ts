/**
 * POST /api/mark — Add weight to a path (success pheromone)
 *
 * Body: { from: string, to: string, strength?: number }
 */
import type { APIRoute } from 'astro'
import { write } from '@/lib/typedb'

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
    } catch {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  await write(`
    match
      $from isa unit, has uid "${from}";
      $to isa unit, has uid "${to}";
      $e (source: $from, target: $to) isa path, has strength $s;
    delete $s of $e;
    insert $e has strength ($s + ${strength});
  `).catch(() =>
    write(`
      match
        $from isa unit, has uid "${from}";
        $to isa unit, has uid "${to}";
      insert
        (source: $from, target: $to) isa path,
          has strength ${strength}, has resistance 0.0, has traversals 0, has revenue 0.0;
    `),
  )

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
