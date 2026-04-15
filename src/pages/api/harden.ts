/**
 * POST /api/harden — Freeze a proven highway permanently on Sui
 *
 * Accepts: { uid, from, to }
 *   uid  — agent uid that signs the Sui transaction
 *   from — source unit id
 *   to   — target unit id
 *
 * Validates strength - resistance >= 50 before calling Sui.
 * Resolves sui-path-id from TypeDB, calls harden() from sui.ts,
 * then writes sui-highway-id + hardened-at back to the path.
 *
 * Returns: { digest, highwayId, strength, resistance }
 */
import type { APIRoute } from 'astro'
import { getNet } from '@/lib/net'
import { harden as suiHarden } from '@/lib/sui'
import { readParsed, writeSilent } from '@/lib/typedb'

const HARDEN_THRESHOLD = 50

export const POST: APIRoute = async ({ request }) => {
  let body: { uid?: string; from?: string; to?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  const { uid, from, to } = body
  if (!uid || !from || !to) {
    return Response.json({ error: 'uid, from, and to are required' }, { status: 400 })
  }

  // ── 1. Validate strength - resistance >= 50 ──────────────────────────────
  const net = await getNet()
  const edge = `${from}→${to}`
  const strength = net.sense(edge)
  const resistance = net.danger(edge)
  const effective = strength - resistance

  if (effective < HARDEN_THRESHOLD) {
    return Response.json(
      {
        error: `path not strong enough to harden`,
        reason: `effective weight ${effective.toFixed(2)} < ${HARDEN_THRESHOLD} (strength=${strength.toFixed(2)}, resistance=${resistance.toFixed(2)})`,
        strength,
        resistance,
        effective,
      },
      { status: 400 },
    )
  }

  // ── 2. Resolve sui-path-id from TypeDB ───────────────────────────────────
  const rows = await readParsed(`
    match $src isa unit, has uid "${from}";
          $tgt isa unit, has uid "${to}";
          $p (source: $src, target: $tgt) isa path,
             has sui-path-id $pid;
    select $pid;
  `).catch(() => [] as Record<string, unknown>[])

  const pathId = rows[0]?.pid as string | undefined

  if (!pathId) {
    return Response.json(
      {
        error: 'path not on-chain yet; call bridge.mirror first',
        from,
        to,
      },
      { status: 409 },
    )
  }

  // ── 3. Call Sui harden() ──────────────────────────────────────────────────
  const { digest, highwayId } = await suiHarden(uid, pathId)

  // ── 4. Persist sui-highway-id + hardened-at back to TypeDB ───────────────
  const nowIso = new Date().toISOString().replace('Z', '')
  writeSilent(`
    match $src isa unit, has uid "${from}";
          $tgt isa unit, has uid "${to}";
          $p (source: $src, target: $tgt) isa path;
    insert $p has sui-highway-id "${highwayId}",
              has hardened-at ${nowIso};
  `)

  // ── 5. Return receipt ─────────────────────────────────────────────────────
  return Response.json({ digest, highwayId, strength, resistance })
}
