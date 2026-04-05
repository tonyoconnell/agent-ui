import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

export const GET: APIRoute = async () => {
  const results = await readParsed(`
    match
      $s isa skill, has skill-id $sid, has price $p;
      (provider: $u, offered: $s) isa capability;
      $u has uid $uid;
    select $sid, $p, $uid;
  `)

  const skills: Record<string, { providers: string[]; price: number }> = {}
  for (const r of results) {
    const sid = r.sid as string
    if (!skills[sid]) {
      skills[sid] = { providers: [], price: r.p as number }
    }
    skills[sid].providers.push(r.uid as string)
  }

  return Response.json(skills, {
    headers: { 'Cache-Control': 'public, max-age=5' },
  })
}
