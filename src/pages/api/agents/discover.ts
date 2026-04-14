/**
 * GET /api/agents/discover — Discover units capable of a skill
 *
 * Query: ?skill=X&limit=N
 * Returns: ranked units with capability, reputation, and pheromone strength.
 * Uses suggest_route pattern from TypeDB.
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

export const GET: APIRoute = async ({ url }) => {
  const skillParam = url.searchParams.get('skill')
  const limitParam = url.searchParams.get('limit') || '10'
  const limit = Math.min(Math.max(parseInt(limitParam, 10) || 10, 1), 100)

  if (!skillParam) {
    return new Response(JSON.stringify({ agents: [], error: 'skill parameter required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    // Query: find units with capability for skill, ranked by pheromone strength
    // Include path strength from any source as a discovery metric
    const rows = await readParsed(`
      match
        $u isa unit,
          has uid $uid,
          has name $n,
          has unit-kind $k,
          has reputation $rep,
          has success-rate $sr,
          has activity-score $activity;
        (provider: $u, offered: $s) isa capability, has price $p;
        $s isa skill, has skill-id $sid, has name $sn;
        $sn contains "${skillParam.toLowerCase()}";
      select $uid, $n, $k, $rep, $sr, $activity, $sid, $sn, $p;
      sort $sr desc, $rep desc;
      limit ${limit};
    `).catch(() => [])

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({
          agents: [],
          skill: skillParam,
          count: 0,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    // Fetch pheromone strength for each unit
    const strengthMap: Record<string, number> = {}
    const strengthRows = await readParsed(`
      match
        $u isa unit;
        $e (source: $src, target: $u) isa path, has strength $s;
      select $u, $s;
    `).catch(() => [])

    for (const row of strengthRows) {
      // Note: row.u might be an object, extract uid if needed
      const uidKey = (row as Record<string, unknown>).u as unknown
      let uid: string | undefined
      if (typeof uidKey === 'string') {
        uid = uidKey
      } else if (uidKey && typeof uidKey === 'object' && 'uid' in uidKey) {
        uid = String((uidKey as Record<string, unknown>).uid)
      }
      if (uid) {
        strengthMap[uid] = (strengthMap[uid] || 0) + ((row.s as number) || 0)
      }
    }

    // GATE: Only return agents with at least one capability (CAPABLE → DISCOVER)
    // This is enforced by the query: (provider: $u, offered: $s) isa capability
    // ensures only units with capabilities are returned
    const agents = rows.map((row) => ({
      uid: row.uid as string,
      name: row.n as string,
      unitKind: row.k as string,
      skillId: row.sid as string,
      skillName: row.sn as string,
      reputation: (row.rep as number) || 0,
      successRate: (row.sr as number) || 0,
      activityScore: (row.activity as number) || 0,
      price: (row.p as number) || 0,
      currency: 'SUI',
      strength: strengthMap[(row.uid as string) || ''] || 0,
    }))

    // Sort by composite score: strength (pheromone) × successRate
    agents.sort((a, b) => {
      const scoreA = a.strength * (a.successRate || 0.5)
      const scoreB = b.strength * (b.successRate || 0.5)
      return scoreB - scoreA
    })

    return new Response(
      JSON.stringify({
        agents,
        skill: skillParam,
        count: agents.length,
        limit,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(
      JSON.stringify({
        agents: [],
        skill: skillParam,
        error: message,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
