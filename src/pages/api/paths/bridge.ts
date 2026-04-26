/**
 * POST   /api/paths/bridge — Federation handshake: two chairmen connect two groups
 * DELETE /api/paths/bridge — Dissolve a bridge path (either chairman can dissolve)
 *
 * State machine: pending → accepted → dissolved
 * Pending state lives in-memory (lost on worker restart — chairmen re-request).
 * Accepted state writes a TypeDB path with bridge-kind="federation".
 *
 * Gap 6 §6.s1: Extended body supports peer owner assertion + version.
 * When peerOwnerAddress is present, peer_owner_address + peer_owner_version
 * are stored as attributes on the bridge path for inbound role downgrade
 * and version-mismatch rejection in src/engine/federation.ts inbound().
 */
import type { APIRoute } from 'astro'
import { getRoleForUser, resolveUnitFromSession } from '@/lib/api-auth'
import { fetchPeerPubkey } from '@/lib/federation-discovery'
import { writeSilent } from '@/lib/typedb'

export const prerender = false

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

// In-memory pending state: "from:to" → {initiator, ts, peerOwnerAddress?, peerOwnerVersion?}
const pending = new Map<
  string,
  { initiator: string; ts: number; peerOwnerAddress?: string; peerOwnerVersion?: number }
>()

const bridgeKey = (a: string, b: string) => [a, b].sort().join(':')

/**
 * Gap 6 §6.s1 — extended request body (V2).
 *
 * peerOwnerAddress  — foreign substrate owner's Sui address
 * peerOwnerVersion  — foreign owner key version (matches Gap 4 key rotation)
 * peerHost          — foreign substrate base URL (e.g. "https://other.one.ie").
 *                     Used to fetch /.well-known/owner-pubkey.json for V2 verify.
 *                     If absent, bridge is accepted without discovery verification
 *                     (legacy V1 path — still MUCH safer than V1's blind trust,
 *                      because V1 stored but never verified; V2 rejects on
 *                      discovery failure when peerHost is supplied).
 * peerAssertion     — V2 shape: cryptographic proof field accepted in body.
 *                     V2 verifies the claimed address+version via discovery.
 *                     V2.2 TODO: full WebAuthn JWKS verify (COSE key from peer).
 */
interface BridgeBody {
  from?: string
  to?: string
  peerOwnerAddress?: string
  peerOwnerVersion?: number
  /**
   * Gap 6 V2: foreign substrate's base URL.
   * When present, bridge verification fetches /.well-known/owner-pubkey.json
   * and validates address + version before accepting.
   */
  peerHost?: string
  peerAssertion?: {
    credId: string
    clientDataJSON: string
    authenticatorData: string
    signature: string
  }
}

export const POST: APIRoute = async ({ request }) => {
  const ctx = await resolveUnitFromSession(request)
  if (!ctx.isValid || !ctx.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: BridgeBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body.from || !body.to) return Response.json({ error: 'from and to required' }, { status: 400 })
  if (body.from === body.to) return Response.json({ error: 'cannot bridge to self' }, { status: 400 })

  // Caller must be chairman of their side
  const fromRole = await getRoleForUser(ctx.user, body.from)
  const toRole = await getRoleForUser(ctx.user, body.to)
  const callerGid = fromRole ? body.from : toRole ? body.to : null
  if (!callerGid) return Response.json({ error: 'Forbidden — must be chairman of one side' }, { status: 403 })

  const key = bridgeKey(body.from, body.to)
  const existing = pending.get(key)

  if (!existing) {
    // First side — record pending (carry peer owner fields if provided)
    pending.set(key, {
      initiator: ctx.user,
      ts: Date.now(),
      peerOwnerAddress: body.peerOwnerAddress,
      peerOwnerVersion: body.peerOwnerVersion,
    })
    return Response.json({ status: 'pending', awaiting: body.to, key }, { status: 202 })
  }

  if (existing.initiator === ctx.user) {
    return Response.json({ status: 'pending', message: 'awaiting other side', key }, { status: 202 })
  }

  // Second side — complete handshake
  const peerOwnerAddress = body.peerOwnerAddress ?? existing.peerOwnerAddress
  const peerOwnerVersion = body.peerOwnerVersion ?? existing.peerOwnerVersion
  const peerHost = body.peerHost

  // ── Gap 6 V2: peer-discovery verification ────────────────────────────────
  // When peerHost is provided, fetch the peer's /.well-known/owner-pubkey.json
  // and verify that the claimed address + version match the published values.
  // This replaces the V1 stub (which stored the assertion but never verified it).
  //
  // V2 acceptance: reachable host + matching address + matching version.
  // V2.2 TODO: extend PeerPubkey with JWKS (COSE keys) and run
  //   verifyAuthenticationResponse() for full WebAuthn signature verification.
  if (peerOwnerAddress && peerHost) {
    const peerKey = await fetchPeerPubkey(peerHost)

    if (!peerKey) {
      return Response.json(
        {
          error: 'peer-discovery-failed',
          detail: `Could not fetch ${peerHost}/.well-known/owner-pubkey.json — host unreachable or response malformed`,
        },
        { status: 503 },
      )
    }

    if (peerKey.address.toLowerCase() !== peerOwnerAddress.toLowerCase()) {
      return Response.json(
        {
          error: 'peer-address-mismatch',
          detail: `discovery published address ${peerKey.address} but body claims ${peerOwnerAddress}`,
        },
        { status: 403 },
      )
    }

    if (typeof peerOwnerVersion === 'number' && peerKey.version !== peerOwnerVersion) {
      return Response.json(
        {
          error: 'peer-version-mismatch',
          detail: `discovery says v${peerKey.version} but body claims v${peerOwnerVersion}`,
        },
        { status: 403 },
      )
    }
  }
  // If peerHost is absent: skip discovery (V1 legacy path — no peerHost supplied).
  // The bridge is still stored with peer_owner_address + peer_owner_version for
  // inbound role-downgrade and version-mismatch checks (§6.s2 inbound flow).
  // Gap 6 V2.1 note: discovery-only verification is correct for V2;
  // full WebAuthn assertion verification (V2.2) requires the peer to also
  // publish JWKS/COSE keys at a companion endpoint.
  // ─────────────────────────────────────────────────────────────────────────

  pending.delete(key)

  // Base bridge path insert (existing behaviour, unchanged)
  const baseInsert = `
    match $a isa group, has gid "${esc(body.from)}";
          $b isa group, has gid "${esc(body.to)}";
    insert (source: $a, target: $b) isa path,
      has scope "public",
      has bridge-kind "federation",
      has strength 1.0,
      has resistance 0.0,
      has traversals 0;
  `

  if (peerOwnerAddress) {
    // Gap 6 §6.s1 — store peer owner address + version on the bridge path.
    // V1: peerAssertion cryptographic verification is skipped (see TODO above).
    const escapedAddr = esc(peerOwnerAddress)
    const versionNum = typeof peerOwnerVersion === 'number' ? peerOwnerVersion : 0
    writeSilent(`
      match $a isa group, has gid "${esc(body.from)}";
            $b isa group, has gid "${esc(body.to)}";
      insert (source: $a, target: $b) isa path,
        has scope "public",
        has bridge-kind "federation",
        has strength 1.0,
        has resistance 0.0,
        has traversals 0,
        has peer-owner-address "${escapedAddr}",
        has peer-owner-version ${versionNum};
    `)
  } else {
    // Legacy single-side bridge — no peer owner assertion
    writeSilent(baseInsert)
  }

  return Response.json(
    {
      ok: true,
      status: 'accepted',
      from: body.from,
      to: body.to,
      bridgeKind: 'federation',
      ...(peerOwnerAddress ? { peerOwnerAddress, peerOwnerVersion } : {}),
    },
    { status: 201 },
  )
}

export const DELETE: APIRoute = async ({ request }) => {
  const ctx = await resolveUnitFromSession(request)
  if (!ctx.isValid || !ctx.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { from?: string; to?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body.from || !body.to) return Response.json({ error: 'from and to required' }, { status: 400 })

  // Either side's chairman can dissolve
  const fromRole = await getRoleForUser(ctx.user, body.from)
  const toRole = await getRoleForUser(ctx.user, body.to)
  if (!fromRole && !toRole) return Response.json({ error: 'Forbidden' }, { status: 403 })

  // Clear pending (if any)
  pending.delete(bridgeKey(body.from, body.to))

  // Remove TypeDB path in both directions
  writeSilent(`
    match $a isa group, has gid "${esc(body.from)}";
          $b isa group, has gid "${esc(body.to)}";
          $p (source: $a, target: $b) isa path, has bridge-kind "federation";
    delete $p isa path;
  `)
  writeSilent(`
    match $a isa group, has gid "${esc(body.from)}";
          $b isa group, has gid "${esc(body.to)}";
          $p (source: $b, target: $a) isa path, has bridge-kind "federation";
    delete $p isa path;
  `)
  return Response.json({ ok: true, status: 'dissolved' })
}
