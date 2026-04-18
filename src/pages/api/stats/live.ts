import type { APIRoute } from 'astro'

export const prerender = false

export const GET: APIRoute = async ({ locals }) => {
  const { getEnv } = await import('@/lib/cf-env')
  const env = (await getEnv(locals)) as { KV?: KVNamespace; DB?: D1Database }
  const kv = env.KV
  const db = env.DB

  let highways = 0
  let activeWorlds = 0
  let signalsLastHour = 0
  const tests = 320

  try {
    if (kv) {
      const raw = await kv.get('highways')
      if (raw) highways = (JSON.parse(raw) as unknown[]).length
    }
  } catch {
    /* default 0 */
  }

  try {
    if (db) {
      const [worlds, signals] = await Promise.all([
        db
          .prepare('SELECT COUNT(DISTINCT receiver) AS n FROM signals WHERE ts > unixepoch() - 3600')
          .first<{ n: number }>(),
        db.prepare('SELECT COUNT(*) AS n FROM signals WHERE ts > unixepoch() - 3600').first<{ n: number }>(),
      ])
      activeWorlds = worlds?.n ?? 0
      signalsLastHour = signals?.n ?? 0
    }
  } catch {
    /* default 0 */
  }

  return Response.json(
    { highways, activeWorlds, signalsLastHour, tests },
    { headers: { 'Cache-Control': 'public, max-age=60' } },
  )
}
