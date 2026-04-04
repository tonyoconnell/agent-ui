/**
 * POST /api/alarm — Add resistance to a path (failure pheromone)
 *
 * Body: { from: string, to: string, strength?: number }
 */
import type { APIRoute } from 'astro'
import { write } from '@/lib/typedb'

export const POST: APIRoute = async ({ request }) => {
  const { from, to, strength = 1.0 } = await request.json() as {
    from: string
    to: string
    strength?: number
  }

  await write(`
    match
      $from isa unit, has uid "${from}";
      $to isa unit, has uid "${to}";
      $e (source: $from, target: $to) isa path, has alarm $a;
    delete $a of $e;
    insert $e has alarm ($a + ${strength});
  `).catch(() =>
    write(`
      match
        $from isa unit, has uid "${from}";
        $to isa unit, has uid "${to}";
      insert
        (source: $from, target: $to) isa path,
          has strength 0.0, has alarm ${strength}, has traversals 0, has revenue 0.0;
    `)
  )

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
