/**
 * PATCH /api/groups/:gid/role — Change a member's role (owner/admin only)
 * Ownership transfer: old chairman auto-demoted to admin.
 */
import type { APIRoute } from 'astro'
import { getRoleForUser, resolveUnitFromSession } from '@/lib/api-auth'
import { roleCheck } from '@/lib/role-check'
import { writeSilent } from '@/lib/typedb'

export const prerender = false

export const PATCH: APIRoute = async ({ params, request }) => {
  const gid = params.gid as string
  const ctx = await resolveUnitFromSession(request)
  if (!ctx.isValid || !ctx.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const callerRole = await getRoleForUser(ctx.user, gid)
  if (!callerRole || !roleCheck(callerRole, 'change_role')) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { uid?: string; role?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body.uid || !body.role) return Response.json({ error: 'uid and role required' }, { status: 400 })

  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

  try {
    // If transferring ownership, demote current chairman first
    if (body.role === 'chairman') {
      writeSilent(`
        match $g isa group, has gid "${esc(gid)}";
          $u isa unit, has uid "${esc(ctx.user)}";
          $m (group: $g, member: $u) isa membership, has member-role $r;
        delete $r of $m;
        insert $m has member-role "admin";
      `)
    }

    // Update target member's role
    writeSilent(`
      match $g isa group, has gid "${esc(gid)}";
        $u isa unit, has uid "${esc(body.uid)}";
        $m (group: $g, member: $u) isa membership, has member-role $r;
      delete $r of $m;
      insert $m has member-role "${esc(body.role)}";
    `)

    return Response.json({ ok: true, uid: body.uid, role: body.role })
  } catch {
    return Response.json({ error: 'role update failed' }, { status: 500 })
  }
}
