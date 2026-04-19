/**
 * POST /api/me/groups/:gid/invite — caller must be chairman or ceo of gid.
 * Body: { uid: string, role?: string }
 * Inserts (member: $target, group: $g) isa membership, has member-role '<role>'. Idempotent.
 */
import type { APIRoute } from 'astro'
import { resolveUnitFromSession } from '@/lib/api-auth'
import { readParsed, write, writeSilent } from '@/lib/typedb'

export const prerender = false

const VALID_ROLES = ['chairman', 'board', 'ceo', 'operator', 'agent', 'auditor'] as const
type Role = (typeof VALID_ROLES)[number]

const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9_:.-]/g, '')

export const POST: APIRoute = async ({ request, params }) => {
  const gid = params.gid
  if (!gid) return Response.json({ error: 'gid required' }, { status: 400 })

  const ctx = await resolveUnitFromSession(request)
  if (!ctx.isValid) return Response.json({ error: 'unauthorized' }, { status: 401 })

  let uid: string, role: Role
  try {
    const body = (await request.json()) as { uid?: string; role?: string }
    if (!body.uid) return Response.json({ error: 'uid required' }, { status: 400 })
    uid = body.uid
    const rawRole = body.role ?? 'agent'
    if (!VALID_ROLES.includes(rawRole as Role)) {
      return Response.json({ error: `role must be one of: ${VALID_ROLES.join(', ')}` }, { status: 400 })
    }
    role = rawRole as Role
  } catch {
    return Response.json({ error: 'invalid JSON' }, { status: 400 })
  }

  const safeGid = sanitize(gid)
  const safeCaller = sanitize(ctx.user)
  const safeTarget = sanitize(uid)
  const safeRole = role // already validated against allowlist

  try {
    // Authority check: caller must be chairman or ceo of gid
    const callerRows = await readParsed(`
      match
        $caller isa unit, has uid "${safeCaller}";
        $g isa group, has group-id "${safeGid}";
        (member: $caller, group: $g) isa membership, has member-role $r;
      select $r;
    `)

    const callerRoles = callerRows.map((r) => String(r.r ?? ''))
    const hasAuthority = callerRoles.some((r) => r === 'chairman' || r === 'ceo')
    if (!hasAuthority) {
      return Response.json({ error: 'forbidden: chairman or ceo role required' }, { status: 403 })
    }

    // Validate target unit exists
    const targetRows = await readParsed(`
      match $t isa unit, has uid "${safeTarget}";
      select $t;
    `)
    if (targetRows.length === 0) {
      return Response.json({ error: `unit ${uid} not found` }, { status: 404 })
    }

    // Idempotency check: is target already a member?
    const memberRows = await readParsed(`
      match
        $t isa unit, has uid "${safeTarget}";
        $g isa group, has group-id "${safeGid}";
        (member: $t, group: $g) isa membership, has member-role $r;
      select $r;
    `)

    if (memberRows.length > 0) {
      const existingRole = String(memberRows[0].r ?? '')
      if (existingRole === safeRole) {
        return Response.json({ ok: true, uid, role, already_member: true })
      }

      // Role update: delete old + insert new (best-effort)
      await write(`
        match
          $t isa unit, has uid "${safeTarget}";
          $g isa group, has group-id "${safeGid}";
          $m (member: $t, group: $g) isa membership, has member-role $old;
        delete $old of $m;
        insert $m has member-role "${safeRole}";
      `).catch(() =>
        writeSilent(`
          match
            $t isa unit, has uid "${safeTarget}";
            $g isa group, has group-id "${safeGid}";
          insert (member: $t, group: $g) isa membership, has member-role "${safeRole}";
        `),
      )

      return Response.json({ ok: true, uid, role, already_member: false })
    }

    // Fresh insert
    await write(`
      match
        $t isa unit, has uid "${safeTarget}";
        $g isa group, has group-id "${safeGid}";
      insert (member: $t, group: $g) isa membership, has member-role "${safeRole}";
    `)

    return Response.json({ ok: true, uid, role, already_member: false })
  } catch (err) {
    console.error('[me/groups/invite] error:', err)
    return Response.json({ error: 'internal server error' }, { status: 500 })
  }
}
