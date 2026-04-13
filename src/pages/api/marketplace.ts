/**
 * GET /api/marketplace — List services with prices
 *
 * Optional ?type= filter for task type.
 * Returns providers with prices, ranked by path strength.
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

export const GET: APIRoute = async ({ url }) => {
  const typeFilter = url.searchParams.get('type')

  // Find signals with amount > 0 (paid services) joined with path strength
  const tql = `
    match
      $from isa unit, has uid $from_id;
      $to isa unit, has uid $to_id;
      $sig (sender: $from, receiver: $to) isa signal,
        has data $task, has amount $amt;
      $amt > 0;
      $e (source: $from, target: $to) isa path,
        has strength $str, has revenue $rev;
    ${typeFilter ? `$task = "${typeFilter}";` : ''}
    select $from_id, $to_id, $task, $amt, $str, $rev;
  `

  const rows = await readParsed(tql).catch(() => [])

  // Aggregate: group by provider+task, find best price, total revenue
  const services = new Map<
    string,
    {
      provider: string
      task: string
      price: number
      strength: number
      revenue: number
      calls: number
    }
  >()

  for (const row of rows) {
    const key = `${row.to_id}:${row.task}`
    const existing = services.get(key)
    const amt = Number(row.amt) || 0
    const str = Number(row.str) || 0
    const rev = Number(row.rev) || 0

    if (!existing) {
      services.set(key, {
        provider: String(row.to_id),
        task: String(row.task),
        price: amt,
        strength: str,
        revenue: rev,
        calls: 1,
      })
    } else {
      existing.price = Math.min(existing.price, amt)
      existing.strength = Math.max(existing.strength, str)
      existing.revenue += amt
      existing.calls += 1
    }
  }

  // Sort by path strength (reputation)
  const sorted = [...services.values()].sort((a, b) => b.strength - a.strength)

  return new Response(JSON.stringify({ services: sorted }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
