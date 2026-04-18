/**
 * GET /api/dashboard/kpis — 7 KPI cards for the dashboard.
 *
 * Reads directly from TypeDB (paths, skills, capabilities) and D1 (signals).
 * Cache-Control: public, max-age=30
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

export const prerender = false

type KpiCard = {
  id: string
  label: string
  value: number
  delta?: number
  unit?: string
  sparkline?: number[]
}

export const GET: APIRoute = async ({ locals }) => {
  const { getD1 } = await import('@/lib/cf-env')
  const db = await getD1(locals)

  // 1. closedLoopRate — % signals last hour with success != null
  let closedLoopRate = 0
  try {
    if (db) {
      const [total, closed] = await Promise.all([
        db.prepare('SELECT COUNT(*) AS n FROM signals WHERE ts > unixepoch() - 3600').first<{ n: number }>(),
        db
          .prepare('SELECT COUNT(*) AS n FROM signals WHERE ts > unixepoch() - 3600 AND success IS NOT NULL')
          .first<{ n: number }>(),
      ])
      const t = total?.n ?? 0
      const c = closed?.n ?? 0
      closedLoopRate = t > 0 ? Math.round((c / t) * 100) : 0
    }
  } catch {
    /* default 0 */
  }

  // 2. medianSettlementMs — median latency_ms from signals last hour
  let medianSettlementMs = 0
  try {
    if (db) {
      const rows = await db
        .prepare(
          'SELECT latency_ms FROM signals WHERE ts > unixepoch() - 3600 AND latency_ms IS NOT NULL ORDER BY latency_ms',
        )
        .all<{ latency_ms: number }>()
      const vals = rows.results ?? []
      if (vals.length > 0) {
        const mid = Math.floor(vals.length / 2)
        medianSettlementMs =
          vals.length % 2 === 0
            ? Math.round((vals[mid - 1].latency_ms + vals[mid].latency_ms) / 2)
            : vals[mid].latency_ms
      }
    }
  } catch {
    /* default 0 */
  }

  // 3. takeRate — % revenue retained (stub)
  const takeRate = 0.05

  // 4. highwaysCount — paths with strength >= 20
  let highwaysCount = 0
  try {
    const rows = await readParsed(`
      match
        $p isa path, has strength $str;
        $str >= 20.0;
      select $str;
    `)
    highwaysCount = rows.length
  } catch {
    /* default 0 */
  }

  // 5. frontierCoverage — unique tags with < 2 capabilities (opportunity zones)
  let frontierCoverage = 0
  try {
    const tagRows = await readParsed(`
      match
        $s isa skill, has tag $tag;
        (provider: $u, offered: $s) isa capability;
      select $tag;
    `)
    const tagCounts = new Map<string, number>()
    for (const r of tagRows) {
      const t = r.tag as string
      tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1)
    }
    frontierCoverage = [...tagCounts.values()].filter((n) => n < 2).length
  } catch {
    /* default 0 */
  }

  // 6. toxicPathTrend — count of toxic paths now vs 24h ago (delta stub 0)
  let toxicPathTrend = 0
  try {
    const rows = await readParsed(`
      match
        $p isa path, has strength $str, has resistance $r;
        $r >= 10;
        $r > $str * 2;
      select $str, $r;
    `)
    toxicPathTrend = rows.filter((r) => (r.r as number) + (r.str as number) > 5).length
  } catch {
    /* default 0 */
  }

  // 7. revenuePerHour — sum of capability prices fired last hour (stub 0 if no payment signals)
  let revenuePerHour = 0
  try {
    if (db) {
      const rows = await db
        .prepare("SELECT data FROM signals WHERE ts > unixepoch() - 3600 AND data LIKE '%payment%'")
        .all<{ data: string }>()
      for (const row of rows.results ?? []) {
        try {
          const parsed = JSON.parse(row.data) as { payment?: { amount?: number } }
          revenuePerHour += parsed?.payment?.amount ?? 0
        } catch {
          /* skip malformed */
        }
      }
    }
  } catch {
    /* default 0 */
  }

  const kpis: KpiCard[] = [
    { id: 'closedLoopRate', label: 'Closed Loop Rate', value: closedLoopRate, unit: '%' },
    { id: 'medianSettlementMs', label: 'Median Settlement', value: medianSettlementMs, unit: 'ms' },
    { id: 'takeRate', label: 'Take Rate', value: takeRate, unit: '%', delta: 0 },
    { id: 'highwaysCount', label: 'Highways', value: highwaysCount },
    { id: 'frontierCoverage', label: 'Frontier Tags', value: frontierCoverage },
    { id: 'toxicPathTrend', label: 'Toxic Paths', value: toxicPathTrend, delta: 0 },
    { id: 'revenuePerHour', label: 'Revenue / Hour', value: revenuePerHour, unit: 'SUI' },
  ]

  return Response.json({ kpis, refreshedAt: Date.now() }, { headers: { 'Cache-Control': 'public, max-age=30' } })
}
