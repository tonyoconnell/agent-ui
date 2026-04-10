/**
 * GET /api/signals — Recent signals (for ticker, timeline scrubber)
 *
 * Query: ?limit=10 (default 10, max 200), ?since=<timestamp>
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
