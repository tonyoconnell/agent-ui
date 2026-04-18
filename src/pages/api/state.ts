/**
 * GET /api/state — Full world state for UI
 *
 * Primary: reads KV snapshots (paths.json, units.json, highways.json, toxic.json)
 *   — written by sync worker every minute, 0ms reads from CF edge cache.
 *
 * Fallback: waits up to 5s for in-memory TypeDB world (local dev).
 *
 * Returns: { units, edges, highways, tags, tagMap, stats }
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

const isToxic = (s: number, r: number) => r >= 10 && r > s * 2 && r + s > 5

const emptyState = () => ({
  units: [],
  edges: [],
  highways: [],
  tags: [],
  tagMap: {},
  stats: { units: 0, proven: 0, highways: 0, edges: 0, tags: 0, revenue: 0 },
  loading: true,
})

type KVEnv = { KV?: KVNamespace }

async function fromKV(kv: KVNamespace) {
  const [pathsRaw, unitsRaw, toxicRaw] = await Promise.all([
    kv.get('paths.json'),
    kv.get('units.json'),
    kv.get('toxic.json'),
  ])

  const pathRows: Array<{
    from: string
    to: string
    strength: number
    resistance: number
    revenue?: number
    toxic?: boolean
  }> = pathsRaw ? JSON.parse(pathsRaw) : []
  const unitRows: Array<{ uid: string; name: string; kind?: string; successRate?: number; generation?: number }> =
    unitsRaw ? JSON.parse(unitsRaw) : []
  const toxicSet = new Set<string>(toxicRaw ? JSON.parse(toxicRaw) : [])

  const units = unitRows.map((u) => ({
    id: u.uid,
    name: u.name,
    kind: u.kind ?? 'agent',
    status: 'active',
    sr: u.successRate ?? 0,
    g: u.generation ?? 1,
  }))

  const edges = pathRows.map((p) => ({
    from: p.from,
    to: p.to,
    strength: p.strength,
    resistance: p.resistance,
    revenue: p.revenue ?? 0,
    toxic: p.toxic ?? toxicSet.has(`${p.from}→${p.to}`) ?? isToxic(p.strength, p.resistance),
  }))

  const highways = edges.filter((e) => !e.toxic && e.strength >= 50)

  return {
    units,
    edges,
    highways,
    tags: [],
    tagMap: {},
    stats: {
      units: units.length,
      proven: units.filter((u) => u.status === 'proven').length,
      highways: highways.length,
      edges: edges.length,
      tags: 0,
      revenue: edges.reduce((s, e) => s + e.revenue, 0),
    },
  }
}

async function fromTypeDB() {
  const [unitRows, pathRows] = await Promise.all([
    readParsed(`
      match $u isa unit, has uid $id, has name $n, has unit-kind $k,
            has success-rate $sr, has generation $g;
      select $id, $n, $k, $sr, $g;
    `).catch(() => []),
    readParsed(`
      match $p (source: $s, target: $t) isa path, has strength $str, has resistance $r;
            $s has uid $sid; $t has uid $tid;
      select $sid, $tid, $str, $r;
    `).catch(() => []),
  ])

  const units = unitRows.map((r) => ({
    id: r.id as string,
    name: r.n as string,
    kind: r.k as string,
    status: 'active',
    sr: r.sr as number,
    g: r.g as number,
  }))

  const edges = pathRows.map((r) => {
    const s = r.str as number,
      res = r.r as number
    return {
      from: r.sid as string,
      to: r.tid as string,
      strength: s,
      resistance: res,
      revenue: 0,
      toxic: isToxic(s, res),
    }
  })

  const highways = edges.filter((e) => !e.toxic && e.strength >= 50)

  return {
    units,
    edges,
    highways,
    tags: [],
    tagMap: {},
    stats: {
      units: units.length,
      proven: units.filter((u) => u.status === 'proven').length,
      highways: highways.length,
      edges: edges.length,
      tags: 0,
      revenue: 0,
    },
  }
}

export const GET: APIRoute = async (context) => {
  let kv: KVNamespace | undefined
  try {
    kv = ((context.locals as any)?.runtime?.env as KVEnv)?.KV
  } catch {
    // Astro 6 removed locals.runtime.env — getter throws. Fall through to TypeDB.
  }

  const data = kv ? await fromKV(kv).catch(() => fromTypeDB()) : await fromTypeDB()

  return new Response(JSON.stringify(data ?? emptyState()), { headers: { 'Content-Type': 'application/json' } })
}
