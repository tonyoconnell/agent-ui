/**
 * GET /api/signals — Recent signal log
 *
 * Query: ?limit=50 (default 50, max 200)
 * Returns: { signals: Array<{ sender, receiver, data, amount, success, latency, ts }> }
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

export const GET: APIRoute = async ({ url }) => {
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200)

  try {
    const rows = await readParsed(`
      match
        $s (sender: $from, receiver: $to) isa signal,
          has data $d,
          has amount $amt,
          has success $ok,
          has ts $ts;
        $from has uid $fid, has name $fn;
        $to has uid $tid, has name $tn;
      sort $ts desc; limit ${limit};
      select $fid, $fn, $tid, $tn, $d, $amt, $ok, $ts;
    `)

    // Try to get latency too (optional attribute)
    const withLatency = await readParsed(`
      match
        $s (sender: $from, receiver: $to) isa signal,
          has data $d,
          has amount $amt,
          has success $ok,
          has latency $lat,
          has ts $ts;
        $from has uid $fid, has name $fn;
        $to has uid $tid, has name $tn;
      sort $ts desc; limit ${limit};
      select $fid, $fn, $tid, $tn, $d, $amt, $ok, $lat, $ts;
    `).catch(() => [])

    // Merge: prefer rows with latency
    const latencyMap = new Map<string, number>()
    for (const r of withLatency) {
      latencyMap.set(`${r.fid}-${r.tid}-${r.ts}`, r.lat as number)
    }

    const signals = rows.map(r => ({
      sender: { uid: r.fid as string, name: r.fn as string },
      receiver: { uid: r.tid as string, name: r.tn as string },
      data: r.d as string,
      amount: r.amt as number,
      success: r.ok as boolean,
      latency: latencyMap.get(`${r.fid}-${r.tid}-${r.ts}`) ?? null,
      ts: r.ts as string,
    }))

    return new Response(JSON.stringify({ signals }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ signals: [], error: message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
