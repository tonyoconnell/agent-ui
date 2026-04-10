/**
 * GET /api/signals — Recent signals (for ticker, timeline scrubber)
 *
 * Query params:
 * - limit: max results (default 10, max 200)
 * - since: timestamp to filter from
 * - from: start of time range (ms)
 * - to: end of time range (ms)
 *
 * Returns: Array<{ id, from, to, skill, outcome, revenue, ts }>
 * Caching: none (live)
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

type SignalExport = {
  id: string
  from: string
  to: string
  skill?: string
  outcome: 'success' | 'failure' | 'timeout'
  revenue: number
  ts: string
}

export const GET: APIRoute = async ({ url }) => {
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '10', 10), 200)
  const since = url.searchParams.get('since')
  const fromTime = url.searchParams.get('from')
  const toTime = url.searchParams.get('to')

  try {
    let query = `
      match
        $s (sender: $from, receiver: $to) isa signal,
          has data $d,
          has amount $amt,
          has success $ok,
          has ts $ts;
        $from has uid $fid, has name $fn;
        $to has uid $tid, has name $tn;
    `

    if (since) {
      query += `      $ts > ${JSON.stringify(since)};\n`
    }

    if (fromTime && toTime) {
      // Time range support for scrubber replay
      const fromMs = parseInt(fromTime, 10)
      const toMs = parseInt(toTime, 10)
      // Convert to ISO string for TypeDB comparison
      const fromIso = new Date(fromMs).toISOString()
      const toIso = new Date(toMs).toISOString()
      query += `      $ts >= ${JSON.stringify(fromIso)}; $ts <= ${JSON.stringify(toIso)};\n`
    }

    query += `
      sort $ts desc; limit ${limit};
      select $fid, $fn, $tid, $tn, $d, $amt, $ok, $ts;
    `

    const rows = await readParsed(query)

    const signals: SignalExport[] = rows.map((r, i) => ({
      id: `sig-${r.fid}-${r.tid}-${i}`,
      from: r.fn as string,
      to: r.tn as string,
      skill: (r.d as string) || undefined,
      outcome: (r.ok as boolean) ? 'success' : 'failure',
      revenue: r.amt as number,
      ts: r.ts as string,
    }))

    return new Response(JSON.stringify(signals), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
    })
  }
}
