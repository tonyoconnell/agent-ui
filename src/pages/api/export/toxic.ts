import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

/**
 * GET /api/export/toxic — Paths currently blocking market routing
 *
 * Returns all paths meeting the toxicity threshold for marketplace UI:
 * - resistance >= 10 (enough samples to be confident)
 * - resistance > 2× strength (clearly bad)
 * - samples > 5 (don't block brand new paths)
 *
 * Marketplace uses this to:
 * 1. Show red toxicity badges on service cards
 * 2. Deprioritize in discover results (follow() avoids these)
 * 3. Send warning to buyers about unreliable sellers
 */
export const GET: APIRoute = async () => {
  try {
    const results = await readParsed(`
      match
        (source: $s, target: $t) isa path, has strength $str, has resistance $r, has traversals $tv;
        $s has uid $sid;
        $t has uid $tid;
        $r >= 10;
        $r > $str * 2;
      select $sid, $tid, $str, $r, $tv;
    `)

    // L4 marketplace blocker: paths meeting full toxicity threshold
    const toxic = results
      .filter((r) => (r.r as number) + (r.str as number) > 5)
      .map((r) => ({
        path: `${r.sid}→${r.tid}`,
        strength: r.str as number,
        resistance: r.r as number,
        traversals: r.tv as number,
        isToxic: true,
      }))

    return Response.json(toxic, {
      headers: { 'Cache-Control': 'public, max-age=5' },
    })
  } catch {
    return Response.json([], {
      headers: { 'Cache-Control': 'public, max-age=5' },
    })
  }
}
