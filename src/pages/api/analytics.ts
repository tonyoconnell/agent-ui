/**
 * GET /api/analytics
 *
 * Real-time analytics from D1 marks table.
 * Four queries: throughput, hot paths, emergence velocity, toxic formation.
 * All from D1 — no TypeDB round-trip. Target: <5ms response.
 *
 * Query params:
 *   ?window=3600  (seconds of history, default 1 hour)
 */

export const prerender = false

interface AnalyticsResult {
  window_seconds: number
  throughput: {
    total_marks: number
    total_warns: number
    marks_per_minute: number
  }
  hotPaths: Array<{
    edge: string
    strength_delta: number
    resistance_delta: number
    count: number
  }>
  velocity: {
    new_edges_created: number
    surge_edges: number
    declining_edges: number
  }
  toxic: Array<{
    edge: string
    strength: number
    resistance: number
    net: number
  }>
  query_ms: number
}

export const GET = async ({ locals, url }: { locals: any; url: URL }): Promise<Response> => {
  const db = locals.runtime?.env?.DB as D1Database | undefined
  if (!db) {
    return new Response(JSON.stringify({ error: 'D1 not available' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const windowSeconds = parseInt(url.searchParams.get('window') || '3600', 10)
  const startTime = new Date(Date.now() - windowSeconds * 1000).toISOString()

  const startMs = performance.now()
  const result: AnalyticsResult = {
    window_seconds: windowSeconds,
    throughput: { total_marks: 0, total_warns: 0, marks_per_minute: 0 },
    hotPaths: [],
    velocity: { new_edges_created: 0, surge_edges: 0, declining_edges: 0 },
    toxic: [],
    query_ms: 0,
  }

  try {
    // 1. Throughput: total marks vs warns in window
    const throughputRows = await db
      .prepare(
        `
      SELECT
        SUM(CASE WHEN delta_s > 0 THEN count ELSE 0 END) as mark_count,
        SUM(CASE WHEN delta_r > 0 THEN count ELSE 0 END) as warn_count
      FROM marks
      WHERE ts >= ?
    `,
      )
      .bind(startTime)
      .all()
    if (throughputRows.results && throughputRows.results.length > 0) {
      const r = throughputRows.results[0] as Record<string, number>
      result.throughput.total_marks = r.mark_count || 0
      result.throughput.total_warns = r.warn_count || 0
      result.throughput.marks_per_minute = Math.round((result.throughput.total_marks / windowSeconds) * 60)
    }

    // 2. Hot paths: top 10 edges by delta_s
    const hotRows = await db
      .prepare(
        `
      SELECT
        edge,
        SUM(delta_s) as strength_delta,
        SUM(delta_r) as resistance_delta,
        SUM(count) as count
      FROM marks
      WHERE ts >= ?
      GROUP BY edge
      ORDER BY SUM(delta_s) DESC
      LIMIT 10
    `,
      )
      .bind(startTime)
      .all()
    if (hotRows.results) {
      result.hotPaths = (hotRows.results as any[]).map((r) => ({
        edge: r.edge,
        strength_delta: r.strength_delta || 0,
        resistance_delta: r.resistance_delta || 0,
        count: r.count || 0,
      }))
    }

    // 3. Velocity: detect emerging patterns
    // New edges = appeared only in this window
    // Surge = strength_delta > 5
    // Declining = resistance_delta > strength_delta
    const velocityRows = await db
      .prepare(
        `
      SELECT
        COUNT(DISTINCT edge) as edge_count,
        SUM(CASE WHEN SUM(delta_s) > 5 THEN 1 ELSE 0 END) as surge_count,
        SUM(CASE WHEN SUM(delta_r) > SUM(delta_s) THEN 1 ELSE 0 END) as decline_count
      FROM (
        SELECT
          edge,
          SUM(delta_s) as delta_s,
          SUM(delta_r) as delta_r
        FROM marks
        WHERE ts >= ?
        GROUP BY edge
      ) grouped
    `,
      )
      .bind(startTime)
      .all()
    if (velocityRows.results && velocityRows.results.length > 0) {
      const r = velocityRows.results[0] as Record<string, number>
      result.velocity.new_edges_created = r.edge_count || 0
      result.velocity.surge_edges = r.surge_count || 0
      result.velocity.declining_edges = r.decline_count || 0
    }

    // 4. Toxic formation: edges with resistance > 10 and resistance > 2 * strength
    const toxicRows = await db
      .prepare(
        `
      SELECT
        edge,
        SUM(delta_s) as strength,
        SUM(delta_r) as resistance
      FROM marks
      WHERE ts >= ?
      GROUP BY edge
      HAVING SUM(delta_r) > 10 AND SUM(delta_r) > SUM(delta_s) * 2
      ORDER BY SUM(delta_r) DESC
      LIMIT 20
    `,
      )
      .bind(startTime)
      .all()
    if (toxicRows.results) {
      result.toxic = (toxicRows.results as any[]).map((r) => ({
        edge: r.edge,
        strength: r.strength || 0,
        resistance: r.resistance || 0,
        net: (r.strength || 0) - (r.resistance || 0),
      }))
    }
  } catch (err) {
    console.error('[analytics] query error:', err)
    return new Response(JSON.stringify({ error: 'Query failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  result.query_ms = Math.round(performance.now() - startMs)

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=5',
    },
  })
}
