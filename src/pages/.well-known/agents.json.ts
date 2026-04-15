/**
 * GET /.well-known/agents.json
 *
 * ADL Discovery endpoint. Lists all active units as ADL documents.
 * Follows the "well-known" convention for agent discovery.
 *
 * Cache: public, max-age=60 (refreshes every minute)
 * Gracefully falls back for legacy units (no ADL attributes).
 */

import type { APIRoute } from 'astro'
import { adlFromUnit } from '@/engine/adl'
import { readParsed } from '@/lib/typedb'

export const GET: APIRoute = async () => {
  try {
    // Query all active units
    const rows = await readParsed(`
      match $u isa unit, has uid $id, has adl-status $status;
            $status in ["active"];
      select $id;
    `).catch(() => [])

    if (!rows.length) {
      return new Response(
        JSON.stringify({
          agents: [],
          count: 0,
          updated: new Date().toISOString(),
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=60',
          },
        },
      )
    }

    // Reconstruct ADL documents for all units
    const agents = await Promise.all(
      rows.map(async (row) => {
        const uid = row.id as string
        try {
          return await adlFromUnit(uid)
        } catch {
          // Fallback: if adlFromUnit fails, return minimal ADL doc
          return {
            id: uid,
            name: uid,
            version: '1.0.0',
            adlVersion: '0.2.0',
            status: 'active' as const,
            data: { sensitivity: 'internal' as const },
          }
        }
      }),
    )

    // Filter out nulls
    const validAgents = agents.filter((a): a is Exclude<typeof a, null> => a !== null)

    return new Response(
      JSON.stringify({
        agents: validAgents,
        count: validAgents.length,
        updated: new Date().toISOString(),
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
        },
      },
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return new Response(
      JSON.stringify({
        error: msg,
        agents: [],
        count: 0,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
  }
}
