/**
 * GET /api/export/skills.json — List all skills with tags and providers
 *
 * Returns: { id, name, price, tags[], providers[] }
 * Caching: 1s
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

type SkillExport = {
  id: string
  name: string
  price: number
  tags: string[]
  providers: string[]
}

export const GET: APIRoute = async () => {
  try {
    const skillRows = await readParsed(`
      match
        $s isa skill, has skill-id $sid, has name $name, has price $p;
      select $sid, $name, $p;
    `)

    // Get tags for each skill
    const tagRows = await readParsed(`
      match
        $s isa skill, has skill-id $sid, has tag $tag;
      select $sid, $tag;
    `).catch(() => [])

    const tagMap = new Map<string, string[]>()
    for (const r of tagRows) {
      const sid = r.sid as string
      if (!tagMap.has(sid)) tagMap.set(sid, [])
      tagMap.get(sid)!.push(r.tag as string)
    }

    // Get providers for each skill
    const providerRows = await readParsed(`
      match
        $s isa skill, has skill-id $sid;
        (provider: $u, offered: $s) isa capability;
        $u has uid $uid;
      select $sid, $uid;
    `).catch(() => [])

    const providerMap = new Map<string, string[]>()
    for (const r of providerRows) {
      const sid = r.sid as string
      if (!providerMap.has(sid)) providerMap.set(sid, [])
      providerMap.get(sid)!.push(r.uid as string)
    }

    const skills: SkillExport[] = skillRows.map((r) => ({
      id: r.sid as string,
      name: r.name as string,
      price: r.p as number,
      tags: tagMap.get(r.sid as string) || [],
      providers: providerMap.get(r.sid as string) || [],
    }))

    return Response.json(skills, {
      headers: { 'Cache-Control': 'public, max-age=1' },
    })
  } catch {
    return Response.json([], {
      headers: { 'Cache-Control': 'public, max-age=1' },
    })
  }
}
