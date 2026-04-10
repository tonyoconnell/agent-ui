/**
 * GET /api/export/units.json — List all units with stats
 *
 * Returns: { id, uid, name, aliases, model, generation, successRate, balance, lastSignalAt, group }
 * Caching: 1s
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

type UnitExport = {
  id: string
  uid: string
  name: string
  aliases?: Record<string, string>
  kind?: string
  model?: string
  generation?: number
  successRate?: number
  balance?: number
  lastSignalAt?: string
  group?: string
  status: string
}

export const GET: APIRoute = async () => {
  try {
    const results = await readParsed(`
      match
        $u isa unit,
          has uid $id,
          has name $n,
          has unit-kind $k,
          has success-rate $sr,
          has generation $g;
        ?$u has model $m;
        ?$u has balance $b;
        ?$u has last-used $lu;
        ?$u has alias-ant $aa;
        ?$u has alias-brain $ab;
        ?$u has alias-team $at;
        ?$u has alias-mail $am;
        ?$u has alias-water $aw;
        ?$u has alias-signal $as;
      select $id, $n, $k, $sr, $g, $m, $b, $lu, $aa, $ab, $at, $am, $aw, $as;
    `)

    const units: UnitExport[] = []

    for (const r of results) {
      const aliases: Record<string, string> = {}
      if (r.aa) aliases.ant = r.aa as string
      if (r.ab) aliases.brain = r.ab as string
      if (r.at) aliases.team = r.at as string
      if (r.am) aliases.mail = r.am as string
      if (r.aw) aliases.water = r.aw as string
      if (r.as) aliases.signal = r.as as string

      units.push({
        id: r.id as string,
        uid: r.id as string,
        name: r.n as string,
        ...(Object.keys(aliases).length > 0 && { aliases }),
        kind: r.k as string,
        ...(r.m && { model: r.m as string }),
        generation: r.g as number,
        successRate: r.sr as number,
        ...(r.b && { balance: r.b as number }),
        ...(r.lu && { lastSignalAt: r.lu as string }),
        status: 'active',
      })
    }

    return Response.json(units, {
      headers: { 'Cache-Control': 'public, max-age=1' },
    })
  } catch {
    return Response.json([], {
      headers: { 'Cache-Control': 'public, max-age=1' },
    })
  }
}
