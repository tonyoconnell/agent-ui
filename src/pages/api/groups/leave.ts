/**
 * POST /api/groups/leave — Leave a group
 * Owner must transfer ownership before leaving.
 * Personal group chairman cannot leave (only DELETE).
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

  // Look up the caller's role in this specific group
  let role: string | undefined
  try {
    const rows = await readParsed(`
      match $g isa group, has gid "${esc(gid)}"; $u isa unit, has uid "${esc(ctx.user)}";
      (group: $g, member: $u) isa membership, has member-role $r;
      select $r;
    `)
    role = rows[0]?.r as string | undefined
  } catch {
    role = undefined
  }

  if (!role) return Response.json({ error: 'not a member' }, { status: 403 })

  // Personal group chairman cannot leave
  if (gid === `group:${ctx.user}` && role === 'chairman') {
    return Response.json({ error: 'cannot leave personal group — use DELETE to dissolve' }, { status: 409 })
  }

  // Owner must transfer before leaving
  if (role === 'chairman') {
    return Response.json({ error: 'transfer ownership before leaving' }, { status: 409 })
  }

  try {
    writeSilent(`match $g isa group, has gid "${esc(gid)}"; $u isa unit, has uid "${esc(ctx.user)}";
      $m (group: $g, member: $u) isa membership; delete $m isa membership;`)
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'leave failed' }, { status: 500 })
  }
}
