/**
 * POST /api/signal — Record a signal event in TypeDB
 *
 * Body: { sender: string, receiver: string, data?: string, amount?: number }
 * Records signal + strengthens path between sender and receiver.
 */
import type { APIRoute } from 'astro'
import { write } from '@/lib/typedb'

export const POST: APIRoute = async ({ request }) => {
  const { sender, receiver, data, amount = 0 } = await request.json() as {
    sender: string
    receiver: string
    data?: string
    amount?: number
  }

  if (!sender || !receiver) {
    return new Response(JSON.stringify({ error: 'Missing sender or receiver' }), { status: 400 })
  }

  const dataStr = data ? JSON.stringify(data).replace(/"/g, '\\"') : ''
  const now = new Date().toISOString().replace('Z', '')

  // Record signal + strengthen path in one write transaction
  await write(`
    match
      $from isa unit, has uid "${sender}";
      $to isa unit, has uid "${receiver}";
    insert
      (sender: $from, receiver: $to) isa signal,
        has data "${dataStr}",
        has amount ${amount},
        has success true,
        has ts ${now};
  `)

  // Strengthen path (upsert pattern: try update, insert if missing)
  await write(`
    match
      $from isa unit, has uid "${sender}";
      $to isa unit, has uid "${receiver}";
      $e (source: $from, target: $to) isa path,
        has strength $s, has traversals $t, has revenue $r;
    delete $s of $e; delete $t of $e; delete $r of $e;
    insert
      $e has strength ($s + 1.0),
        has traversals ($t + 1),
        has revenue ($r + ${amount});
  `).catch(() => {
    // Path doesn't exist yet — create it
    return write(`
      match
        $from isa unit, has uid "${sender}";
        $to isa unit, has uid "${receiver}";
      insert
        (source: $from, target: $to) isa path,
          has strength 1.0, has alarm 0.0,
          has traversals 1, has revenue ${amount};
    `)
  })

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
