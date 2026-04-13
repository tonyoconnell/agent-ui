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
      select $id, $n, $k, $sr, $g;
    `)

    const units: UnitExport[] = results.map((r) => ({
      id: r.id as string,
      uid: r.id as string,
      name: r.n as string,
      kind: r.k as string,
      generation: r.g as number,
      successRate: r.sr as number,
      status: 'active',
    }))

    return Response.json(units, {
      headers: { 'Cache-Control': 'public, max-age=1' },
    })
  } catch {
    return Response.json([], {
      headers: { 'Cache-Control': 'public, max-age=1' },
    })
  }
}
