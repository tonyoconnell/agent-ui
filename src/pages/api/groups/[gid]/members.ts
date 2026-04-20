/**
 * GET /api/groups/[gid]/members — list members of a group with current roles.
 *
 * Returns: { gid, members: [{ uid, name, role }] }
 * Requires session auth (cookie or Bearer). Any authed member can view the
 * roster — no role gating. Chairman uses this to pick targets for role changes.
 */
import type { APIRoute } from 'astro'
import { getRoleForUser, resolveUnitFromSession } from '@/lib/api-auth'
import { readParsed } from '@/lib/typedb'

export const prerender = false

const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9_:.-]/g, '')

export const GET: APIRoute = async ({ request, params }) => {
  const gid = params.gid
  if (!gid) {
    return Response.json({ error: 'gid required' }, { status: 400 })
  }

  const ctx = await resolveUnitFromSession(request)
  if (!ctx.isValid || !ctx.user) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const safeGid = sanitize(gid)

  const memberRole = await getRoleForUser(ctx.user, gid)
  if (!memberRole) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const rows = await readParsed(`
      match
        $g isa group, has gid "${safeGid}";
        (member: $u, group: $g) isa membership, has member-role $r;
        $u has uid $uid;
        $u has name $name;
      select $uid, $name, $r;
    `).catch(() => [])

    const members = rows.map((row) => ({
      uid: String(row.uid ?? ''),
      name: String(row.name ?? ''),
      role: String(row.r ?? 'agent'),
    }))

    return Response.json({ gid, members })
  } catch (err) {
    console.error('[groups/members] error:', err)
    return Response.json({ error: 'internal server error' }, { status: 500 })
  }
}
