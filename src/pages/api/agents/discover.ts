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
    // THREE-STAGE QUERY — TypeDB 3.x planner workaround.
    //
    // Combining `$sn contains "X"` + relation-join + multi-attr projection
    // in one match times out at 30s regardless of bindings. Single-role
    // capability queries that only read key attrs return in 500ms. So we
    // split the work: find matching skills first, fetch ALL cap pairs
    // unfiltered, intersect in JS (~1500 rows), then bulk-fetch unit attrs.
    const needle = skillParam.toLowerCase()
    const skillRows = await readParsed(`
      match
        $s isa skill, has name $sn, has skill-id $sid;
        $sn contains "${needle}";
      select $sid, $sn;
      limit ${limit * 5};
    `).catch(() => [])

    if (skillRows.length === 0) {
      return new Response(JSON.stringify({ agents: [], skill: skillParam, count: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const wantedSkillIds = new Set(skillRows.map((r) => r.sid as string).filter(Boolean))
    const skillNameById: Record<string, string> = {}
    for (const r of skillRows) {
      if (r.sid && r.sn) skillNameById[r.sid as string] = r.sn as string
    }

    // Stage 1: unfiltered capability pairs — this shape completes fast
    // (~500ms for ~1.5k rows) because the planner uses relation+role-key
    // indices and skips the scan explosion caused by `$sn contains`.
    const pairRows = await readParsed(`
      match
        (provider: $u, offered: $s) isa capability, has price $p;
        $u has uid $uid;
        $s has skill-id $sid;
      select $uid, $sid, $p;
    `).catch(() => [])

    const pairs = pairRows.filter((r) => r.sid && wantedSkillIds.has(r.sid as string)).slice(0, limit)

    if (pairs.length === 0) {
      return new Response(JSON.stringify({ agents: [], skill: skillParam, count: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Stage 2: bulk-fetch unit attrs bounded by the uids we need.
    const uidsForFetch = [...new Set(pairs.map((r) => r.uid as string).filter(Boolean))]
    const uidListLiteral = uidsForFetch.map((u) => `"${u}"`).join(', ')
    const unitRows = await readParsed(`
      match
        $u isa unit, has uid $uid;
        $uid in [${uidListLiteral}];
        $u has name $n, has unit-kind $k, has reputation $rep,
           has success-rate $sr, has activity-score $activity;
      select $uid, $n, $k, $rep, $sr, $activity;
    `).catch(() => [])

    const unitByUid: Record<string, Record<string, unknown>> = {}
    for (const r of unitRows) {
      const u = r.uid as string | undefined
      if (u) unitByUid[u] = r
    }

    const rows = pairs.map((p) => ({
      uid: p.uid,
      sid: p.sid,
      sn: skillNameById[p.sid as string] || p.sid,
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
