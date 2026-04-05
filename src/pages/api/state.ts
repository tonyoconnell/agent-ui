/**
 * GET /api/state — Full world state for UI
 *
 * Returns: { units, edges, skills, highways, tags, stats }
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

type R = Record<string, unknown>

export const GET: APIRoute = async () => {
  const [units, edges, tags] = await Promise.all([
    readParsed(`
      match $u isa unit, has uid $id, has name $name, has unit-kind $kind,
        has status $status, has success-rate $sr, has generation $g;
      select $id, $name, $kind, $status, $sr, $g;
    `).catch(() => []),
    readParsed(`
      match $e (source: $from, target: $to) isa path,
        has strength $s, has alarm $a, has traversals $t, has revenue $r;
      $from has uid $fid; $to has uid $tid;
      select $fid, $tid, $s, $a, $t, $r;
    `).catch(() => []),
    readParsed(`
      match $sk isa skill, has skill-id $sid, has tag $tag;
      select $sid, $tag;
    `).catch(() => []),
  ])

  // Collect tags
  const allTags = new Set<string>()
  const tagMap: Record<string, string[]> = {}
  for (const r of tags as R[]) {
    const sid = r.sid as string, tag = r.tag as string
    allTags.add(tag)
    ;(tagMap[sid] ||= []).push(tag)
  }

  const highways = (edges as R[]).filter(e => (e.s as number) >= 50)

  return new Response(JSON.stringify({
    units, edges, highways,
    tags: [...allTags].sort(),
    stats: {
      units: (units as R[]).length,
      proven: (units as R[]).filter(u => u.status === 'proven').length,
      highways: highways.length,
      edges: (edges as R[]).length,
      tags: allTags.size,
      revenue: (edges as R[]).reduce((s, e) => s + ((e.r as number) || 0), 0),
    },
  }), { headers: { 'Content-Type': 'application/json' } })
}
