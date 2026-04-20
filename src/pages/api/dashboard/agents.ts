import type { APIRoute } from 'astro'
import { resolveUnitFromSession } from '@/lib/api-auth'
import { readParsed } from '@/lib/typedb'

export const prerender = false

/** GET /api/dashboard/agents — agents in the developer's personal group */
export const GET: APIRoute = async ({ request, locals }) => {
  const auth = await resolveUnitFromSession(request, locals).catch(() => null)
  if (!auth?.isValid) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const uid = auth.user
  const gid = `group:${uid}`

  let agents: { uid: string; name: string }[] = []
  try {
    const rows = await readParsed(`
      match
        $g isa group, has gid "${gid}";
        (group: $g, member: $a) isa membership;
        $a has uid $uid, has name $name;
      select $uid, $name;
    `)
    agents = rows.map((r) => ({ uid: r.uid as string, name: r.name as string }))
  } catch {
    /* empty on missing group */
  }

  return Response.json({ agents, group: gid })
}
