/**
 * GET /api/discover — Find capable providers ranked by path strength
 *
 * Query: ?task=translate (optional — filters by task name)
 * Returns: { agents: Agent[] } sorted by aggregate path strength
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

export const GET: APIRoute = async ({ url }) => {
  const taskFilter = url.searchParams.get('task')

  try {
    // Query: find units with capabilities, joined with their path strengths
    const taskMatch = taskFilter
      ? `$t has name $tn; $tn contains "${taskFilter.toLowerCase()}";`
      : `$t has name $tn;`

    const rows = await readParsed(`
      match
        $u isa unit,
          has uid $uid,
          has name $n,
          has unit-kind $k,
          has reputation $rep,
          has success-rate $sr;
        (provider: $u, skill: $t) isa capability, has price $p;
        $t isa task,
          has task-type $tt;
        ${taskMatch}
      select $uid, $n, $k, $rep, $sr, $tn, $tt, $p;
    `)

    // Fetch path strengths for each agent (aggregate)
    const strengthMap: Record<string, number> = {}
    if (rows.length > 0) {
      const strengthRows = await readParsed(`
        match
          $u isa unit, has uid $uid;
          (provider: $u, skill: $t) isa capability;
          $e (source: $src, target: $u) isa path, has strength $s;
        select $uid, $s;
      `).catch(() => [])

      for (const row of strengthRows) {
        const uid = row.uid as string
        const s = row.s as number || 0
        strengthMap[uid] = (strengthMap[uid] || 0) + s
      }
    }

    const agents = rows.map((row) => ({
      uid: row.uid as string,
      name: row.n as string,
      unitKind: row.k as string,
      reputation: (row.rep as number) || 0,
      successRate: (row.sr as number) || 0,
      taskName: row.tn as string,
      taskType: row.tt as string,
      price: (row.p as number) || 0,
      currency: 'SUI',
      strength: strengthMap[row.uid as string] || 0,
    }))

    // Sort by strength descending
    agents.sort((a, b) => b.strength - a.strength)

    return new Response(JSON.stringify({ agents }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ agents: [], error: message }), {
      status: 200, // Return empty rather than 500, so UI degrades gracefully
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
