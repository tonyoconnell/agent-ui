/**
 * POST /api/pay — x402 payment between units
 *
 * Body: { from: string, to: string, task: string, amount: number }
 * Records signal with amount, strengthens path by payment amount (revenue = pheromone).
 */
import type { APIRoute } from 'astro'
import { write } from '@/lib/typedb'

export const POST: APIRoute = async ({ request }) => {
  const { from, to, task, amount } = await request.json() as {
    from: string
    to: string
    task: string
    amount: number
  }

  if (!from || !to || !task || !amount || amount <= 0) {
    return new Response(JSON.stringify({ error: 'Missing from, to, task, or valid amount' }), { status: 400 })
  }

  const now = new Date().toISOString().replace('Z', '')

  // Record payment signal
  await write(`
    match
      $from isa unit, has uid "${from}";
      $to isa unit, has uid "${to}";
    insert
      (sender: $from, receiver: $to) isa signal,
        has data "${task}",
        has amount ${amount},
        has success true,
        has ts ${now};
  `)

  // Strengthen path by payment amount (revenue = pheromone)
  await write(`
    match
      $from isa unit, has uid "${from}";
      $to isa unit, has uid "${to}";
      $e (source: $from, target: $to) isa path,
        has strength $s, has traversals $t, has revenue $r;
    delete $s of $e; delete $t of $e; delete $r of $e;
    insert
      $e has strength ($s + ${amount}),
        has traversals ($t + 1),
        has revenue ($r + ${amount});
  `).catch(() =>
    write(`
      match
        $from isa unit, has uid "${from}";
        $to isa unit, has uid "${to}";
      insert
        (source: $from, target: $to) isa path,
          has strength ${amount}, has resistance 0.0,
          has traversals 1, has revenue ${amount};
    `)
  )

  return new Response(JSON.stringify({ ok: true, from, to, task, amount }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
