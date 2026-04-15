/**
 * POST /api/buy/bounty — Create a bounty signal with Sui escrow lock.
 *
 * Body: { providerUid, skillId, price, deadlineMs, rubricThresholds, tags?, description? }
 * Returns: { ok: true, bountyId, txHash, status: 'posted' }
 */
import type { APIRoute } from 'astro'
import { resolve, resolvePath } from '@/engine/bridge'
import { auth } from '@/lib/auth'
import { createEscrow } from '@/lib/sui'
import { writeSilent } from '@/lib/typedb'

export const prerender = false

interface BountyBody {
  providerUid: string
  skillId: string
  price: number
  deadlineMs: number
  rubricThresholds: { fit: number; form: number; truth: number; taste: number }
  tags?: string[]
  description?: string
}

export const POST: APIRoute = async ({ request }) => {
  // Auth gate
  const session = await auth.api.getSession({ headers: request.headers }).catch(() => null)
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: BountyBody
  try {
    body = (await request.json()) as BountyBody
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { providerUid, skillId, price, deadlineMs, rubricThresholds, tags = [], description } = body

  if (!providerUid || !skillId || typeof price !== 'number' || price <= 0 || typeof deadlineMs !== 'number') {
    return Response.json(
      { error: 'Missing or invalid fields: providerUid, skillId, price, deadlineMs required' },
      { status: 400 },
    )
  }

  if (!rubricThresholds || typeof rubricThresholds.fit !== 'number') {
    return Response.json({ error: 'rubricThresholds must include fit, form, truth, taste' }, { status: 400 })
  }

  const bountyId = `bounty:${crypto.randomUUID()}`
  const posterUid = session.user.id
  const now = new Date().toISOString().replace('Z', '')

  // ── Sui escrow creation ──────────────────────────────────────────────────
  // Requires both units to have on-chain identities and a path between them.
  // Falls back to 'pending' if Sui is not configured or identities are absent.
  let txHash = 'pending'
  try {
    const [posterIds, providerIds] = await Promise.all([resolve(posterUid), resolve(providerUid)])
    if (posterIds?.unitId && providerIds?.unitId) {
      const pathObjectId = await resolvePath(posterUid, providerUid)
      if (pathObjectId) {
        // TODO: pass MIST amount (price × 1e9) once economic units are standardised
        const escrowResult = await createEscrow(
          posterUid,
          posterIds.unitId,
          providerIds.unitId,
          skillId,
          Math.round(price * 1e9),
          deadlineMs,
          pathObjectId,
        )
        txHash = escrowResult.digest
      }
      // else: no on-chain path yet — escrow is 'pending' until path is mirrored
    }
    // else: units not yet on-chain — escrow is 'pending'
  } catch {
    // Sui not configured or tx failed — bounty still posted in TypeDB
    txHash = 'pending'
  }

  // ── Persist bounty signal in TypeDB ─────────────────────────────────────
  const dataPayload = JSON.stringify({
    kind: 'bounty',
    bountyId,
    skillId,
    price,
    deadlineMs,
    rubricThresholds,
    tags,
    description,
    txHash,
    posterUid,
  })
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')

  writeSilent(`
    match
      $poster isa unit, has uid "${posterUid}";
      $provider isa unit, has uid "${providerUid}";
    insert
      (sender: $poster, receiver: $provider) isa signal,
        has data "${dataPayload}",
        has amount ${price},
        has success true,
        has ts ${now};
  `)

  return Response.json({ ok: true, bountyId, txHash, status: 'posted' })
}
