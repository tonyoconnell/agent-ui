/**
 * POST /api/resistance — Add resistance to a path (failure pheromone)
 *
 * Body: { from: string, to: string, strength?: number }
 */
import type { APIRoute } from 'astro'
import { validateApiKey } from '@/lib/api-auth'
import { escapeTqlString, write } from '@/lib/typedb'

export const POST: APIRoute = async ({ request }) => {
  const auth = await validateApiKey(request)
  if (!auth.isValid) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }
  const {
    from,
    to,
    strength = 1.0,
  } = (await request.json()) as {
    from: string
    to: string
    strength?: number
  }

  const ef = escapeTqlString(from)
  const et = escapeTqlString(to)
  await write(`
    match
      $from isa unit, has uid "${ef}";
      $to isa unit, has uid "${et}";
      $e (source: $from, target: $to) isa path, has resistance $r;
    delete $r of $e;
    insert $e has resistance ($r + ${strength});
  `).catch(() =>
    write(`
      match
        $from isa unit, has uid "${ef}";
        $to isa unit, has uid "${et}";
      insert
        (source: $from, target: $to) isa path,
          has strength 0.0, has resistance ${strength}, has traversals 0, has revenue 0.0;
    `),
  )

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
