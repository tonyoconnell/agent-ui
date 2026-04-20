import type { APIRoute } from 'astro'
import { resolveUnitFromSession } from '@/lib/api-auth'
import { getAgentCount, getUsage } from '@/lib/metering'
import { TIER_LIMITS } from '@/lib/tier-limits'
import { readParsed } from '@/lib/typedb'

export const prerender = false

/** GET /api/dashboard/usage — tier + monthly usage for authenticated developer */
export const GET: APIRoute = async ({ request, locals }) => {
  const { getD1 } = await import('@/lib/cf-env')
  const db = await getD1(locals)
  const auth = await resolveUnitFromSession(request, locals).catch(() => null)

  if (!auth?.isValid) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const tier = auth.tier ?? 'free'
  const [calls, agents] = await Promise.all([getUsage(db, auth.keyId ?? ''), getAgentCount(db, auth.keyId ?? '')])
  const limits = TIER_LIMITS[tier]

  let highwaysCount = 0
  try {
    const rows = await readParsed('match $p isa path, has strength $s; $s >= 20.0; select $s;')
    highwaysCount = rows.length
  } catch {
    /* default 0 */
  }

  return Response.json({
    tier,
    calls_this_month: calls,
    agents_count: agents,
    api_limit: limits.apiCalls,
    agent_limit: limits.agents,
    loops: limits.loops,
    highways_count: highwaysCount,
    upgrade_url: 'https://one.ie/pricing',
  })
}
