/**
 * GET /api/frontiers — Promising frontiers
 *
 * Returns frontiers with expected_value >= 0.5. Unexplored territory worth pursuing.
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

export const GET: APIRoute = async () => {
  const rows = await readParsed(`
    match
      $f isa frontier,
        has fid $fid,
        has frontier-type $ft,
        has frontier-description $fd,
        has expected-value $ev,
        has frontier-status $fs;
      $ev >= 0.5;
    select $fid, $ft, $fd, $ev, $fs;
  `).catch(() => [])

  const frontiers = rows
    .map((row) => ({
      fid: row.fid,
      type: row.ft,
      description: row.fd,
      expectedValue: Number(row.ev) || 0,
      status: row.fs,
    }))
    .sort((a, b) => b.expectedValue - a.expectedValue)

  return new Response(JSON.stringify({ frontiers }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
