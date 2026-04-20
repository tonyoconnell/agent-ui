/**
 * POST /api/board/join
 *
 * Stage 3 (Join Board) of the lifecycle funnel.
 * Creates a membership relation between a unit and a group.
 *
 * Body:
 *   { uid: string, group?: string }
 *
 * Returns:
 *   { ok: true, uid, group, boardId: group, role: "agent" }
 *
 * Idempotent: returns the same JSON if membership already exists.
 */

import type { APIRoute } from 'astro'
import { readParsed, writeSilent } from '@/lib/typedb'

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as {
      uid?: string
      group?: string
    }

    if (!body.uid) {
      return Response.json({ error: 'uid required' }, { status: 400 })
    }

    // Gate: caller must be self (uid matches API key user) OR have operator+ role
    const { requireRole } = await import('@/lib/api-auth')
    const gate = await requireRole(request, 'add_unit', { uid: body.uid, gate: 'stage-3' })
    if (!gate.ok) return gate.res
    const isSelf = gate.auth.user === body.uid
    const hasPrivilege = ['chairman', 'ceo', 'operator'].includes(gate.role)
    if (!isSelf && !hasPrivilege) {
      return Response.json(
        { error: 'caller must be the joining unit or have operator+ role', gate: 'stage-3' },
        { status: 403 },
      )
    }

    const uid = body.uid
    const group = body.group || 'board'

    // Check if membership already exists (idempotency)
    const existing = await readParsed(`
      match
        $u isa unit, has uid "${uid}";
        $g isa group, has group-id "${group}";
        $m (group: $g, member: $u) isa membership;
      select $m;
    `)

    if (!existing.length) {
      // Create membership relation
      await writeSilent(`
        match
          $u isa unit, has uid "${uid}";
          $g isa group, has group-id "${group}";
        insert
          (group: $g, member: $u) isa membership, has member-role "agent";
      `)

      // Emit mark signal for board join event
      writeSilent(`
        insert $s isa signal,
          has receiver "board:join",
          has data "${JSON.stringify({ tags: ['stage:join-board', 'membership'], uid, group })}";
      `)
    }

    return Response.json({
      ok: true,
      uid,
      group,
      boardId: group,
      role: 'agent',
    })
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 })
  }
}
