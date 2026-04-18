/**
 * POST /api/sync/d1-marks
 *
 * Sync unsynced marks from D1 to TypeDB.
 * Job 3 of the sync worker (runs hourly).
 *
 * Coalesces marks by edge, updates path strength/resistance in TypeDB.
 * Marks rows as synced=1 (safe to delete after retention period).
 */

export const prerender = false

interface D1SyncResult {
  edges_synced: number
  total_marks: number
  total_strength: number
  total_resistance: number
  typedb_updates: number
  duration_ms: number
}

export const POST = async ({ locals }: { locals: any }): Promise<Response> => {
  const db = locals.runtime?.env?.DB as D1Database | undefined
  if (!db) {
    return new Response(JSON.stringify({ error: 'D1 not available' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const startMs = performance.now()
  const result: D1SyncResult = {
    edges_synced: 0,
    total_marks: 0,
    total_strength: 0,
    total_resistance: 0,
    typedb_updates: 0,
    duration_ms: 0,
  }

  try {
    // 1. Query unsynced marks, coalesced by edge
    const rows = await db
      .prepare(
        `
      SELECT
        edge,
        SUM(delta_s) as strength_delta,
        SUM(delta_r) as resistance_delta,
        SUM(count) as mark_count
      FROM marks
      WHERE synced = 0
      GROUP BY edge
    `,
      )
      .all()

    if (!rows.results || rows.results.length === 0) {
      result.duration_ms = Math.round(performance.now() - startMs)
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { writeSilent } = await import('@/lib/typedb')

    // 2. For each edge, update TypeDB
    let updatesOk = 0
    for (const row of rows.results as any[]) {
      const edge = row.edge as string
      const strength = (row.strength_delta as number) || 0
      const resistance = (row.resistance_delta as number) || 0
      const count = (row.mark_count as number) || 0

      result.total_marks += count
      result.total_strength += strength
      result.total_resistance += resistance

      // Parse edge: "from→to"
      const parts = edge.split('→')
      if (parts.length !== 2) continue

      const [from, to] = parts.map((s) => s.trim())
      if (!from || !to) continue

      // Update path in TypeDB
      try {
        await writeSilent(`
          match $from isa unit, has uid "${from}"; $to isa unit, has uid "${to}";
          $e (source: $from, target: $to) isa path, has strength $s, has resistance $r, has traversals $t;
          delete $s of $e; delete $r of $e; delete $t of $e;
          insert $e has strength (${strength}), has resistance (${resistance}), has traversals (${count});
        `)
        updatesOk++
      } catch (err) {
        console.error(`[d1-sync] TypeDB update failed for ${edge}:`, err)
      }

      result.edges_synced++
    }

    result.typedb_updates = updatesOk

    // 3. Mark all synced marks with synced=1
    try {
      await db
        .prepare(
          `
        UPDATE marks SET synced = 1 WHERE synced = 0
      `,
        )
        .run()
    } catch (err) {
      console.error('[d1-sync] failed to mark synced:', err)
    }

    // 4. Cleanup old synced marks (>7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    try {
      const cleanupResult = await db
        .prepare(
          `
        DELETE FROM marks WHERE synced = 1 AND ts < ?
      `,
        )
        .bind(sevenDaysAgo)
        .all()
      console.log(`[d1-sync] cleaned up ${cleanupResult?.meta?.duration || 0} old marks`)
    } catch (err) {
      console.error('[d1-sync] cleanup failed:', err)
    }
  } catch (err) {
    console.error('[d1-sync] error:', err)
    return new Response(JSON.stringify({ error: 'Sync failed', details: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  result.duration_ms = Math.round(performance.now() - startMs)

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
