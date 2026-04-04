/**
 * GET/POST /api/hypotheses — Manage hypotheses
 *
 * GET: List hypotheses, optional ?status= filter (pending/testing/confirmed/rejected)
 * POST: Create hypothesis { statement: string }
 */
import type { APIRoute } from 'astro'
import { readParsed, write } from '@/lib/typedb'

export const GET: APIRoute = async ({ url }) => {
  const status = url.searchParams.get('status')

  const tql = `
    match
      $h isa hypothesis,
        has hid $hid,
        has statement $stmt,
        has hypothesis-status $hs,
        has observations-count $obs,
        has p-value $pv,
        has action-ready $ar;
    ${status ? `$hs = "${status}";` : ''}
    select $hid, $stmt, $hs, $obs, $pv, $ar;
  `

  const rows = await readParsed(tql).catch(() => [])

  const hypotheses = rows.map(row => ({
    hid: row.hid,
    statement: row.stmt,
    status: row.hs,
    observations: Number(row.obs) || 0,
    pValue: Number(row.pv) || 1.0,
    actionReady: Boolean(row.ar),
  }))

  return new Response(JSON.stringify({ hypotheses }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export const POST: APIRoute = async ({ request }) => {
  const { statement } = await request.json() as { statement: string }

  if (!statement) {
    return new Response(JSON.stringify({ error: 'Missing statement' }), { status: 400 })
  }

  const hid = `h-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  await write(`
    insert
      $h isa hypothesis,
        has hid "${hid}",
        has statement "${statement.replace(/"/g, '\\"')}",
        has hypothesis-status "pending",
        has observations-count 0,
        has p-value 1.0,
        has action-ready false;
  `)

  return new Response(JSON.stringify({ ok: true, hid }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
