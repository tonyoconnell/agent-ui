/**
 * GET/POST /api/hypotheses — Manage hypotheses
 *
 * GET: List hypotheses, optional ?status= filter (pending/testing/confirmed/rejected)
 * POST: Create hypothesis { statement: string }
 *
 * BaaS metering (Cycle 1 T-B1-06): L6 feature — requires Scale+ tier.
 * Free/Builder tiers return 402.
 */
import type { APIRoute } from 'astro'
import { resolveUnitFromSession } from '@/lib/api-auth'
import { getD1 } from '@/lib/cf-env'
import { getUsage, recordCall } from '@/lib/metering'
import { checkApiCallLimit, TIER_LIMITS, tierLimitResponse } from '@/lib/tier-limits'
import { readParsed, write } from '@/lib/typedb'

const SCALE_TIERS = new Set(['scale', 'world', 'enterprise'])

async function gate(request: Request, locals: App.Locals | undefined): Promise<Response | null> {
  const db = await getD1(locals)
  const auth = await resolveUnitFromSession(request, locals).catch(() => null)
  if (!auth?.isValid) {
    return new Response(JSON.stringify({ error: 'Unauthorized: valid API key required for L6 hypotheses feature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const tier = auth.tier ?? 'free'
  if (!SCALE_TIERS.has(tier)) {
    const limit = TIER_LIMITS[tier].apiCalls
    return new Response(
      JSON.stringify({
        error: `Hypotheses require Scale+ tier (you have: ${tier})`,
        tier,
        limit,
        required: 'scale',
        upgradeUrl: 'https://one.ie/pricing',
      }),
      { status: 402, headers: { 'Content-Type': 'application/json' } },
    )
  }
  const usage = await getUsage(db, auth.keyId)
  const callGate = checkApiCallLimit(tier, usage)
  if (!callGate.ok) return tierLimitResponse(callGate)
  void recordCall(db, auth.keyId)
  return null
}

export const GET: APIRoute = async ({ url, request, locals }) => {
  const blocked = await gate(request, locals)
  if (blocked) return blocked

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

  const hypotheses = rows.map((row) => ({
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

export const POST: APIRoute = async ({ request, locals }) => {
  const blocked = await gate(request, locals)
  if (blocked) return blocked

  const { statement } = (await request.json()) as { statement: string }

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
