/**
 * POST /api/membership/role — Chairman updates a member's role.
 *
 * Body: { gid: string, uid: string, role: 'chairman'|'board'|'ceo'|'operator'|'agent'|'auditor' }
 *
 * - Requires Authorization header + appoint_role permission (chairman only per role-check.ts).
 * - 404 if target unit is not already a member of gid; use POST /api/me/groups/:gid/invite to
 *   create a fresh membership.
 * - Updates member-role via delete-then-insert (canonical pattern from invite.ts).
 */
import type { APIRoute } from 'astro'
import { getRoleForUser, resolveUnitFromSession } from '@/lib/api-auth'
import { roleCheck } from '@/lib/role-check'
import { readParsed, write } from '@/lib/typedb'

export const prerender = false

const VALID_ROLES = ['chairman', 'board', 'ceo', 'operator', 'agent', 'auditor'] as const
type Role = (typeof VALID_ROLES)[number]

const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9_:.-]/g, '')

export const POST: APIRoute = async ({ request }) => {
  const auth = await resolveUnitFromSession(request)
  if (!auth.isValid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const callerRole = await getRoleForUser(auth.user)
  if (!roleCheck(callerRole ?? 'agent', 'appoint_role')) {
    return Response.json({ error: 'Forbidden: chairman role required' }, { status: 403 })
  }

  let body: { gid?: string; uid?: string; role?: string }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return Response.json({ error: 'invalid JSON' }, { status: 400 })
  }

  if (!body.gid) return Response.json({ error: 'gid required' }, { status: 400 })
  if (!body.uid) return Response.json({ error: 'uid required' }, { status: 400 })
  if (!body.role || !VALID_ROLES.includes(body.role as Role)) {
    return Response.json({ error: `role must be one of: ${VALID_ROLES.join(', ')}` }, { status: 400 })
  }

  const safeGid = sanitize(body.gid)
  const safeUid = sanitize(body.uid)
  const safeRole = body.role as Role

  try {
    const memberRows = await readParsed(`
      match
        $u isa unit, has uid "${safeUid}";
        $g isa group, has gid "${safeGid}";
        (member: $u, group: $g) isa membership, has member-role $r;
      select $r;
    `).catch(() => [])

    if (memberRows.length === 0) {
      return Response.json(
        {
          error: `unit ${body.uid} is not a member of ${body.gid}`,
          hint: `use POST /api/me/groups/${body.gid}/invite to create membership`,
        },
        { status: 404 },
      )
    }

    const currentRole = String(memberRows[0].r ?? '')
    if (currentRole === safeRole) {
      return Response.json({
        ok: true,
        gid: body.gid,
        uid: body.uid,
        role: safeRole,
        changed: false,
      })
    }

    await write(`
      match
        $u isa unit, has uid "${safeUid}";
        $g isa group, has gid "${safeGid}";
        $m (member: $u, group: $g) isa membership, has member-role $old;
      delete $old of $m;
      insert $m has member-role "${safeRole}";
    `)

    return Response.json({
      ok: true,
      gid: body.gid,
      uid: body.uid,
      role: safeRole,
      changed: true,
      previous: currentRole,
    })
  } catch (err) {
    console.error('[membership/role] error:', err)
    return Response.json({ error: 'internal server error' }, { status: 500 })
  }
}
