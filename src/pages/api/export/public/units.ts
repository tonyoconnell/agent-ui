/**
 * GET /api/export/public/units.json — List public units only
 *
 * Returns: Curated public demo world (units marked for demo)
 * For visitor mode: read-only view of public agents
 * Caching: 5s
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

type UnitExport = {
  id: string
  uid: string
  name: string
  kind?: string
  model?: string
  generation?: number
  successRate?: number
  balance?: number
  lastSignalAt?: string
  group?: string
  status: string
  isPublic: boolean
}

export const GET: APIRoute = async () => {
  try {
    // For now, return top units by success rate (curated public demo)
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
      select $id, $n, $k, $sr, $g, $m, $b, $lu;
      limit 50;
    `)

    const units: UnitExport[] = []

    for (const r of results) {
      units.push({
        id: r.id as string,
        uid: r.id as string,
        name: r.n as string,
        kind: r.k as string,
        ...(r.m && { model: r.m as string }),
        generation: r.g as number,
        successRate: r.sr as number,
        ...(r.b && { balance: r.b as number }),
        ...(r.lu && { lastSignalAt: r.lu as string }),
        status: 'active',
        isPublic: true,
      })
    }

    return Response.json(units, {
      headers: { 'Cache-Control': 'public, max-age=5' },
    })
  } catch {
    return Response.json([], {
      headers: { 'Cache-Control': 'public, max-age=5' },
    })
  }
}
