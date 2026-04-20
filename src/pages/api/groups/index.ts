/**
 * POST /api/groups — Create a new group
 * GET  /api/groups — List groups (public + authenticated user's groups)
 */
import type { APIRoute } from 'astro'
import { resolveUnitFromSession } from '@/lib/api-auth'
import { readParsed, writeSilent } from '@/lib/typedb'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  const ctx = await resolveUnitFromSession(request)
  if (!ctx.isValid || !ctx.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { gid?: string; name?: string; visibility?: string; 'group-type'?: string; parent?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const gid = body.gid?.replace(/[^a-z0-9:_-]/gi, '-').toLowerCase()
  const name = body.name?.trim()
  if (!gid || !name) {
    return Response.json({ error: 'gid and name required' }, { status: 400 })
  }

  const visibility = body.visibility ?? 'private'
  const groupType = body['group-type'] ?? 'team'
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

  try {
    // Check if gid already taken
    const existing = await readParsed(`match $g isa group, has gid "${esc(gid)}"; select $g;`)
    if (existing.length > 0) {
      return Response.json({ error: 'gid already taken' }, { status: 409 })
    }

    // Create group
    writeSilent(`insert $g isa group,
      has gid "${esc(gid)}",
      has name "${esc(name)}",
      has group-type "${esc(groupType)}",
      has visibility "${esc(visibility)}",
      has status "active";`)

    // Add creator as chairman
    writeSilent(`match $g isa group, has gid "${esc(gid)}"; $u isa unit, has uid "${esc(ctx.user)}";
      insert (group: $g, member: $u) isa membership, has member-role "chairman";`)

    // Wire parent hierarchy if provided
    if (body.parent) {
      writeSilent(`match $p isa group, has gid "${esc(body.parent)}"; $c isa group, has gid "${esc(gid)}";
        insert (parent: $p, child: $c) isa hierarchy;`)
    }

    return Response.json({ ok: true, gid, visibility, 'group-type': groupType }, { status: 201 })
  } catch {
    return Response.json({ error: 'group creation failed' }, { status: 500 })
  }
}

export const GET: APIRoute = async ({ request }) => {
  const ctx = await resolveUnitFromSession(request)
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

  try {
    if (ctx.isValid && ctx.user) {
      // Authenticated: public groups + user's own groups
      const rows = await readParsed(`
        match
          $g isa group, has gid $gid, has name $n, has group-type $t, has visibility $v;
          (member: $u, group: $g) isa membership, has member-role $r;
          $u isa unit, has uid "${esc(ctx.user)}";
        select $gid, $n, $t, $v, $r;
      `)
      const publicRows = await readParsed(`
        match $g isa group, has gid $gid, has name $n, has group-type $t, has visibility "public";
        select $gid, $n, $t;
      `)

      const myGids = new Set(rows.map((r) => r.gid as string))
      const combined = [
        ...rows.map((r) => ({ gid: r.gid, name: r.n, 'group-type': r.t, visibility: r.v, role: r.r })),
        ...publicRows
          .filter((r) => !myGids.has(r.gid as string))
          .map((r) => ({ gid: r.gid, name: r.n, 'group-type': r.t, visibility: 'public', role: null })),
      ]
      return Response.json(combined)
    } else {
      // Unauthenticated: public only
      const rows = await readParsed(`
        match $g isa group, has gid $gid, has name $n, has group-type $t, has visibility "public";
        select $gid, $n, $t;
      `)
      return Response.json(
        rows.map((r) => ({ gid: r.gid, name: r.n, 'group-type': r.t, visibility: 'public', role: null })),
      )
    }
  } catch {
    return Response.json([], { status: 200 })
  }
}
