/**
 * GET /api/intents/stats
 *
 * Hit rates and usage counts per intent.
 * Use to see which intents are working and which need more keywords.
 */

import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ locals }) => {
  const { getEnv } = await import('@/lib/cf-env')
  const env = (await getEnv(locals)) as { DB?: D1Database }
  if (!env?.DB) return new Response(JSON.stringify({ ok: false, error: 'no DB binding' }), { status: 503 })

  const [intents, queries] = await Promise.all([
    env.DB.prepare('SELECT name, label, hit_count FROM intents ORDER BY hit_count DESC').all<{
      name: string
      label: string
      hit_count: number
    }>(),
    env.DB.prepare(`
      SELECT intent, resolver, COUNT(*) as count, SUM(cached) as hits
      FROM intent_queries WHERE ts > ?
      GROUP BY intent, resolver
    `)
      .bind(Date.now() - 7 * 86_400_000)
      .all<{ intent: string | null; resolver: string; count: number; hits: number }>(),
  ])

  const stats = (intents.results ?? []).map((i) => {
    const rows = (queries.results ?? []).filter((q) => q.intent === i.name)
    const total = rows.reduce((n, r) => n + r.count, 0)
    const cached = rows.reduce((n, r) => n + (r.hits || 0), 0)
    return {
      name: i.name,
      label: i.label,
      hitCount: i.hit_count,
      weeklyQueries: total,
      weeklyCacheHits: cached,
      cacheHitRate: total > 0 ? cached / total : null,
      resolvers: rows.map((r) => ({ resolver: r.resolver, count: r.count })),
    }
  })

  const unknownCount = (queries.results ?? []).filter((q) => !q.intent).reduce((n, r) => n + r.count, 0)

  return new Response(JSON.stringify({ ok: true, stats, unknownCount }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
