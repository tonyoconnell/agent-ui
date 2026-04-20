/**
 * GET /api/inbox/[uid] — Signals received by a unit (inbox)
 *
 * Auth: caller must be the uid in the path (v1: ctx.user === uid).
 * Returns 403 if uid does not match authenticated user.
 *
 * Query params:
 * - limit: max results (default 50, max 200)
 * - before: ISO datetime cursor for pagination (exclusive upper bound)
 *
 * Returns: { uid, signals: [{sender, senderName, data, amount, success, ts}] }
 */
import type { APIRoute } from 'astro'
import { resolveUnitFromSession } from '@/lib/api-auth'
import { readParsed } from '@/lib/typedb'

type InboxSignal = {
  sender: string
  senderName: string
  data: string | null
  amount: number
  success: boolean
  ts: string
}

export const GET: APIRoute = async ({ request, params }) => {
  const uid = params.uid as string

  const ctx = await resolveUnitFromSession(request)
  if (!ctx.isValid || ctx.user !== uid) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200)
  const before = url.searchParams.get('before')

  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

  try {
    let query = `
      match
        $s (sender: $from, receiver: $to) isa signal,
          has data $d,
          has amount $amt,
          has success $ok,
          has ts $ts;
        $to has uid "${esc(uid)}";
        $from has uid $fid, has name $fn;
    `

    if (before) {
      query += `      $ts < ${JSON.stringify(before)};\n`
    }

    query += `
      sort $ts desc; limit ${limit};
      select $fid, $fn, $d, $amt, $ok, $ts;
    `

    const rows = await readParsed(query)

    const signals: InboxSignal[] = rows.map((r) => ({
      sender: r.fid as string,
      senderName: r.fn as string,
      data: (r.d as string) || null,
      amount: (r.amt as number) ?? 0,
      success: r.ok as boolean,
      ts: r.ts as string,
    }))

    return new Response(JSON.stringify({ uid, signals }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
    })
  } catch (err) {
    const _message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ uid, signals: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
    })
  }
}
