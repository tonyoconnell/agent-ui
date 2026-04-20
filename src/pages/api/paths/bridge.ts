/**
 * POST   /api/paths/bridge — Federation handshake: two chairmen connect two groups
 * DELETE /api/paths/bridge — Dissolve a bridge path (either chairman can dissolve)
 *
 * State machine: pending → accepted → dissolved
 * Pending state lives in-memory (lost on worker restart — chairmen re-request).
 * Accepted state writes a TypeDB path with bridge-kind="federation".
 */
import type { APIRoute } from 'astro'
import { getRoleForUser, resolveUnitFromSession } from '@/lib/api-auth'
import { writeSilent } from '@/lib/typedb'

export const prerender = false

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

// In-memory pending state: "from:to" → {initiator, ts}
const pending = new Map<string, { initiator: string; ts: number }>()

const bridgeKey = (a: string, b: string) => [a, b].sort().join(':')

export const POST: APIRoute = async ({ request }) => {
  const ctx = await resolveUnitFromSession(request)
  if (!ctx.isValid || !ctx.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { from?: string; to?: string }
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
    // First side — record pending
    pending.set(key, { initiator: ctx.user, ts: Date.now() })
    return Response.json({ status: 'pending', awaiting: body.to, key }, { status: 202 })
  }

  if (existing.initiator === ctx.user) {
    return Response.json({ status: 'pending', message: 'awaiting other side', key }, { status: 202 })
  }

  // Second side — complete handshake
  pending.delete(key)
  writeSilent(`
    match $a isa group, has gid "${esc(body.from)}";
          $b isa group, has gid "${esc(body.to)}";
    insert (source: $a, target: $b) isa path,
      has scope "public",
      has bridge-kind "federation",
      has strength 1.0,
      has resistance 0.0,
      has traversals 0;
  `)
  return Response.json(
    { ok: true, status: 'accepted', from: body.from, to: body.to, bridgeKind: 'federation' },
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
