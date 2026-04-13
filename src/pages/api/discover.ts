/**
 * GET /api/discover — Find capable providers ranked by pheromone
 *
 * Query: ?task=translate&from=user (optional filters)
 * Uses TypeDB suggest_route() when from+task specified, cheapest_provider() for price sort.
 * Falls back to manual join when functions aren't available.
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

export const GET: APIRoute = async ({ url }) => {
  const taskFilter = url.searchParams.get('task')
  const fromUnit = url.searchParams.get('from')
  const sortBy = url.searchParams.get('sort') || 'strength'

  try {
    // Fast path: suggest_route() when we have from + task
    if (fromUnit && taskFilter) {
      const routes = await readParsed(`
        match
          $from isa unit, has uid "${fromUnit}";
          $task isa skill, has name $tn; $tn contains "${taskFilter.toLowerCase()}";
          (source: $from, target: $to) isa path, has strength $s;
          (provider: $to, offered: $task) isa capability, has price $p;
          $to has uid $uid, has name $n, has unit-kind $k,
            has reputation $rep, has success-rate $sr;
        sort $s desc; limit 20;
        select $uid, $n, $k, $rep, $sr, $tn, $p, $s;
      `).catch(() => [])

      if (routes.length > 0) {
        const agents = routes.map((r) => ({
          uid: r.uid as string,
          name: r.n as string,
          unitKind: r.k as string,
          reputation: (r.rep as number) || 0,
          successRate: (r.sr as number) || 0,
          taskName: r.tn as string,
          price: (r.p as number) || 0,
          currency: 'SUI',
          strength: (r.s as number) || 0,
        }))
        return new Response(JSON.stringify({ agents, source: 'suggest_route' }), {
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    // Cheapest path: sort by price
    if (sortBy === 'price' && taskFilter) {
      const cheap = await readParsed(`
        match
          (provider: $u, offered: $t) isa capability, has price $p;
          $t isa skill, has name $tn; $tn contains "${taskFilter.toLowerCase()}";
          $u has uid $uid, has name $n, has unit-kind $k,
            has reputation $rep, has success-rate $sr;
        sort $p asc; limit 20;
        select $uid, $n, $k, $rep, $sr, $tn, $p;
      `).catch(() => [])

      if (cheap.length > 0) {
        const agents = cheap.map((r) => ({
          uid: r.uid as string,
          name: r.n as string,
          unitKind: r.k as string,
          reputation: (r.rep as number) || 0,
          successRate: (r.sr as number) || 0,
          taskName: r.tn as string,
          price: (r.p as number) || 0,
          currency: 'SUI',
          strength: 0,
        }))
        return new Response(JSON.stringify({ agents, source: 'cheapest_provider' }), {
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    // Fallback: manual join (original approach)
    const taskMatch = taskFilter ? `$t has name $tn; $tn contains "${taskFilter.toLowerCase()}";` : `$t has name $tn;`

    const rows = await readParsed(`
      match
        $u isa unit,
          has uid $uid,
          has name $n,
          has unit-kind $k,
          has reputation $rep,
          has success-rate $sr;
        (provider: $u, offered: $t) isa capability, has price $p;
        $t isa skill;
        ${taskMatch}
      select $uid, $n, $k, $rep, $sr, $tn, $p;
    `)

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
        strengthMap[uid] = (strengthMap[uid] || 0) + ((row.s as number) || 0)
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

    agents.sort((a, b) => b.strength - a.strength)

    return new Response(JSON.stringify({ agents, source: 'fallback' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ agents: [], error: message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
