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
    // TWO-STAGE QUERY (TypeDB 3.x planner fix):
    //
    // A single compound match that pulls 6 unit attributes + joins through
    // capability + filters by skill-name times out at 8s because the planner
    // tries to scan all capabilities for each unit-attr combination.
    //
    // Stage 1: find (uid, skill) pairs for skills matching the param.
    //          Minimal attribute reads = fast.
    // Stage 2: fetch unit attrs in bulk, bounded by the uids from stage 1.
    //          Narrow scan, no cross-join = fast.
    const pairRows = await readParsed(`
      match
        $s isa skill, has name $sn, has skill-id $sid;
        $sn contains "${skillParam.toLowerCase()}";
        (provider: $u, offered: $s) isa capability, has price $p;
        $u has uid $uid;
      select $uid, $sid, $sn, $p;
      limit ${limit};
    `).catch(() => [])

    if (pairRows.length === 0) {
      return new Response(JSON.stringify({ agents: [], skill: skillParam, count: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Stage 2: bulk-fetch unit attributes for the uids we just found.
    const uidsForFetch = [...new Set(pairRows.map((r) => r.uid as string).filter(Boolean))]
    const uidListLiteral = uidsForFetch.map((u) => `"${u}"`).join(', ')
    const unitRows = await readParsed(`
      match
        $u isa unit, has uid $uid;
        $uid in [${uidListLiteral}];
        $u has name $n, has unit-kind $k, has reputation $rep,
           has success-rate $sr, has activity-score $activity;
      select $uid, $n, $k, $rep, $sr, $activity;
    `).catch(() => [])

    // Index unit attrs by uid for the merge.
    const unitByUid: Record<string, Record<string, unknown>> = {}
    for (const r of unitRows) {
      const u = r.uid as string | undefined
      if (u) unitByUid[u] = r
    }

    // Merge stage 1 (skill/price) with stage 2 (unit attrs).
    const rows = pairRows.map((p) => ({
      uid: p.uid,
      sid: p.sid,
      sn: p.sn,
      p: p.p,
      ...(unitByUid[p.uid as string] || {
        n: p.uid,
        k: 'agent',
        rep: 0,
        sr: 0.5,
        activity: 0,
      }),
    }))

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

    // Fetch pheromone strength only for the discovered uids.
    // A global `match $u isa unit; ... isa path` times out at scale —
    // bound the query to the uids we already have.
    const uids = [...new Set(rows.map((r) => r.uid as string).filter(Boolean))]
    const strengthMap: Record<string, number> = {}
    if (uids.length > 0) {
      // Bound by uid — prevents a Cartesian scan over all paths when
      // many units exist. TypeDB 3.x `in` takes a list literal.
      const uidList = uids.map((u) => `"${u}"`).join(', ')
      const strengthRows = await readParsed(`
        match
          $u isa unit, has uid $uid;
          $uid in [${uidList}];
          (source: $src, target: $u) isa path, has strength $s;
        select $uid, $s;
      `).catch(() => [])

      for (const row of strengthRows) {
        const uid = row.uid as string | undefined
        if (uid) {
          strengthMap[uid] = (strengthMap[uid] || 0) + ((row.s as number) || 0)
        }
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
