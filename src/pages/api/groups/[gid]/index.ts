/**
 * GET    /api/groups/:gid — Group details (403 if private + non-member)
 * PATCH  /api/groups/:gid — Update group (owner/admin only)
 * DELETE /api/groups/:gid — Delete group + cascade (owner only)
 */
import type { APIRoute } from 'astro'
import { getRoleForUser, resolveUnitFromSession } from '@/lib/api-auth'
import { roleCheck } from '@/lib/role-check'
import { readParsed, writeSilent } from '@/lib/typedb'

export const prerender = false

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

export const GET: APIRoute = async ({ params, request }) => {
  const gid = params.gid as string
  const ctx = await resolveUnitFromSession(request)

  try {
    const rows = await readParsed(`
      match $g isa group, has gid "${esc(gid)}", has name $n, has group-type $t, has visibility $v;
      select $n, $t, $v;
    `)
    if (rows.length === 0) return Response.json({ error: 'not found' }, { status: 404 })

    const { n: name, t: groupType, v: visibility } = rows[0] as Record<string, string>

    if (visibility === 'private') {
      if (!ctx.isValid || !ctx.user) return Response.json({ error: 'Forbidden' }, { status: 403 })
      const role = await getRoleForUser(ctx.user, gid)
      if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    return Response.json({ gid, name, 'group-type': groupType, visibility })
  } catch {
    return Response.json({ error: 'lookup failed' }, { status: 500 })
  }
}

export const PATCH: APIRoute = async ({ params, request }) => {
  const gid = params.gid as string
  const ctx = await resolveUnitFromSession(request)
  if (!ctx.isValid || !ctx.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const role = await getRoleForUser(ctx.user, gid)
  if (!role || !roleCheck(role, 'update_group')) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { name?: string; visibility?: string; brand?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const updates: string[] = []
  if (body.name) updates.push(`has name "${esc(body.name)}"`)
  if (body.visibility) updates.push(`has visibility "${esc(body.visibility)}"`)
  if (body.brand) updates.push(`has brand "${esc(body.brand)}"`)
  if (updates.length === 0) return Response.json({ error: 'no fields to update' }, { status: 400 })

  try {
    writeSilent(`match $g isa group, has gid "${esc(gid)}"; insert $g ${updates.join(', ')};`)
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'update failed' }, { status: 500 })
  }
}

export const DELETE: APIRoute = async ({ params, request }) => {
  const gid = params.gid as string
  const ctx = await resolveUnitFromSession(request)
  if (!ctx.isValid || !ctx.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const role = await getRoleForUser(ctx.user, gid)
  if (!role || !roleCheck(role, 'delete_group')) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // Cascade: memberships → group
    writeSilent(`match $g isa group, has gid "${esc(gid)}"; $m (group: $g) isa membership; delete $m isa membership;`)
    writeSilent(`match $g isa group, has gid "${esc(gid)}"; delete $g isa group;`)
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'delete failed' }, { status: 500 })
  }
}
