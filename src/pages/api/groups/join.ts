/**
 * POST /api/groups/join — Join a public group (auto-role: member)
 * Private groups require an invite via /api/invites/accept
 */
import type { APIRoute } from 'astro'
import { resolveUnitFromSession } from '@/lib/api-auth'
import { readParsed, writeSilent } from '@/lib/typedb'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  const ctx = await resolveUnitFromSession(request)
  if (!ctx.isValid || !ctx.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let gid: string
  try {
    const body = (await request.json()) as { gid?: string }
    gid = body.gid ?? ''
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!gid) return Response.json({ error: 'gid required' }, { status: 400 })

  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

  try {
    const rows = await readParsed(`match $g isa group, has gid "${esc(gid)}", has visibility $v; select $v;`)
    if (rows.length === 0) return Response.json({ error: 'group not found' }, { status: 404 })
    if (rows[0].v !== 'public') return Response.json({ error: 'private group — invite required' }, { status: 403 })

    // Idempotent join
    const existing = await readParsed(`
      match $g isa group, has gid "${esc(gid)}"; $u isa unit, has uid "${esc(ctx.user)}";
      (group: $g, member: $u) isa membership; select $g;
    `)
    if (existing.length > 0) return Response.json({ ok: true, role: 'member', already: true })

    writeSilent(`match $g isa group, has gid "${esc(gid)}"; $u isa unit, has uid "${esc(ctx.user)}";
      insert (group: $g, member: $u) isa membership, has member-role "member";`)

    return Response.json({ ok: true, gid, role: 'member' })
  } catch {
    return Response.json({ error: 'join failed' }, { status: 500 })
  }
}
