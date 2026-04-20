/**
 * POST /api/groups/:gid/invite — add an agent to a group with a role
 *
 * Tier gate: Scale+ only (groupScoping feature).
 * Requires auth via resolveUnitFromSession.
 *
 * Body: { uid: string, role?: string }
 *   uid  — the unit to invite
 *   role — member-role to assign (defaults to "operator")
 *
 * Writes a membership relation to TypeDB.
 */
import type { APIRoute } from 'astro'
import { resolveUnitFromSession } from '@/lib/api-auth'
import { getD1 } from '@/lib/cf-env'
import { getUsage, recordCall } from '@/lib/metering'
import { checkApiCallLimit, tierAllows, tierLimitResponse } from '@/lib/tier-limits'
import { write } from '@/lib/typedb'

export const prerender = false

export const POST: APIRoute = async ({ request, locals, params }) => {
  // Auth
  const auth = await resolveUnitFromSession(request, locals).catch(() => null)
  if (!auth?.isValid) return Response.json({ error: 'unauthorized' }, { status: 401 })

  // BaaS metering gate
  const db = await getD1(locals)
  const tier = auth.tier ?? 'free'
  const usage = await getUsage(db, auth.keyId)
  const gate = checkApiCallLimit(tier, usage)
  if (!gate.ok) return tierLimitResponse(gate)
  void recordCall(db, auth.keyId)

  // Tier gate: groupScoping requires Scale+
  if (!tierAllows(tier, 'groupScoping')) {
    return Response.json(
      {
        error: 'group invites require Scale tier or above — upgrade at https://one.ie/pricing',
        tier,
        upgradeUrl: 'https://one.ie/pricing',
      },
      { status: 402 },
    )
  }

  const gid = params.gid ?? ''
  if (!gid) return Response.json({ error: 'gid is required' }, { status: 400 })

  // Parse body
  const body = (await request.json().catch(() => ({}))) as {
    uid?: unknown
    role?: unknown
  }

  const uid = typeof body.uid === 'string' ? body.uid.trim() : ''
  const role = typeof body.role === 'string' ? body.role.trim() : 'operator'

  if (!uid) return Response.json({ error: 'uid is required' }, { status: 400 })

  const safeGid = gid.replace(/"/g, '')
  const safeUid = uid.replace(/"/g, '')
  const safeRole = role.replace(/"/g, '')

  try {
    await write(`
      match $g isa group, has gid "${safeGid}";
            $u isa unit, has uid "${safeUid}";
      insert (group: $g, member: $u) isa membership, has member-role "${safeRole}";
    `)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'typedb write failed'
    return Response.json({ error: msg }, { status: 500 })
  }

  return Response.json({ ok: true, gid, uid, role })
}
