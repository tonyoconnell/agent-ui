/**
 * /api/groups/:gid/multisig — Configure N-of-M chairman multisig (Gap 3 §3.s2).
 *
 * Caller flow:
 *   1. Existing chairman of the group POSTs { n, m, members } here.
 *   2. Endpoint UPSERTs chairman_multisig row in D1.
 *   3. Owner-bypass actions against this group will then require N
 *      verified WebAuthn assertions from distinct members within the
 *      5-min assertion window (3.s3 — deferred).
 *
 * Auth: caller must hold role==='chairman' (or role==='owner') for the
 * specified group. Verified via getRoleForUser(uid, gid).
 *
 * Spec: compliance.md §"Implementation notes for W3" + W2 decisions.
 */

import type { APIRoute } from 'astro'
import { getRoleForUser, resolveUnitFromSession } from '@/lib/api-auth'
import { getD1 } from '@/lib/cf-env'

export const prerender = false

interface MultisigBody {
  n?: number
  m?: number
  members?: Array<{ uid?: string; credId?: string; pubKey?: string }>
}

function err(status: number, error: string, reason?: string) {
  return new Response(JSON.stringify({ error, reason }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const POST: APIRoute = async ({ request, params, locals }) => {
  const gid = params?.gid
  if (!gid || typeof gid !== 'string') return err(400, 'bad-input', 'gid required in path')

  // 1. Authenticate
  const auth = await resolveUnitFromSession(request, locals).catch(() => null)
  if (!auth?.isValid) return err(401, 'unauthenticated')

  // 2. Verify caller is chairman OR owner of THIS group
  const callerRole = await getRoleForUser(auth.user, gid).catch(() => undefined)
  if (callerRole !== 'chairman' && callerRole !== 'owner') {
    return err(403, 'forbidden', `caller role=${callerRole ?? 'none'} for ${gid}; chairman or owner required`)
  }

  // 3. Parse + validate body
  const body = (await request.json().catch(() => ({}))) as MultisigBody
  const n = body.n
  const m = body.m
  const members = body.members

  if (!Number.isInteger(n) || (n as number) < 1) return err(400, 'bad-input', 'n must be a positive integer')
  if (!Number.isInteger(m) || (m as number) < 1) return err(400, 'bad-input', 'm must be a positive integer')
  if ((n as number) > (m as number)) return err(400, 'bad-input', 'n must be <= m')
  if ((m as number) > 50) return err(400, 'bad-input', 'm must be <= 50')

  if (!Array.isArray(members)) return err(400, 'bad-input', 'members[] required')
  if (members.length !== m)
    return err(400, 'bad-input', `members.length must equal m (got ${members.length}, want ${m})`)

  for (const mem of members) {
    if (!mem || typeof mem !== 'object') return err(400, 'bad-input', 'each member must be an object')
    if (!mem.uid || typeof mem.uid !== 'string') return err(400, 'bad-input', 'each member needs a uid')
    if (!mem.credId || typeof mem.credId !== 'string') return err(400, 'bad-input', 'each member needs a credId')
    if (!mem.pubKey || typeof mem.pubKey !== 'string')
      return err(400, 'pubkey-required', 'each member needs a pubKey (base64url COSE key from registration)')
  }

  // 4. UPSERT chairman_multisig row
  const db = await getD1(locals)
  if (!db) return err(503, 'd1-unavailable')

  const memberCreds = JSON.stringify(
    members.map((m) => ({
      uid: m.uid,
      credId: m.credId,
      pubKey: m.pubKey,
      addedAt: Math.floor(Date.now() / 1000),
      signCount: 0,
    })),
  )

  try {
    await db
      .prepare(
        `INSERT INTO chairman_multisig (group_id, threshold_n, threshold_m, member_credentials, configured_by)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (group_id) DO UPDATE SET
           threshold_n = excluded.threshold_n,
           threshold_m = excluded.threshold_m,
           member_credentials = excluded.member_credentials,
           configured_at = unixepoch(),
           configured_by = excluded.configured_by`,
      )
      .bind(gid, n, m, memberCreds, auth.user)
      .run()
  } catch (e) {
    return err(500, 'd1-failed', (e as Error).message)
  }

  return Response.json({
    ok: true,
    gid,
    n,
    m,
    members: members.length,
    configuredBy: auth.user,
  })
}

export const GET: APIRoute = async ({ request, params, locals }) => {
  const gid = params?.gid
  if (!gid || typeof gid !== 'string') return err(400, 'bad-input', 'gid required in path')

  const auth = await resolveUnitFromSession(request, locals).catch(() => null)
  if (!auth?.isValid) return err(401, 'unauthenticated')

  const callerRole = await getRoleForUser(auth.user, gid).catch(() => undefined)
  if (!callerRole) return err(403, 'forbidden', 'caller is not a member of this group')

  const db = await getD1(locals)
  if (!db) return err(503, 'd1-unavailable')

  const row = await db
    .prepare(
      `SELECT group_id AS gid, threshold_n AS n, threshold_m AS m, member_credentials AS members,
              configured_at AS configuredAt, configured_by AS configuredBy
         FROM chairman_multisig WHERE group_id = ?`,
    )
    .bind(gid)
    .first<{
      gid: string
      n: number
      m: number
      members: string
      configuredAt: number
      configuredBy: string
    }>()
    .catch(() => null)

  if (!row) return Response.json({ gid, multisig: null })

  return Response.json({
    gid,
    multisig: {
      n: row.n,
      m: row.m,
      members: JSON.parse(row.members) as Array<{ uid: string; credId: string; addedAt: number }>,
      configuredAt: row.configuredAt,
      configuredBy: row.configuredBy,
    },
  })
}
