/**
 * POST /api/buy/hire — Open a chat with a provider + create a guest membership.
 *
 * Body: { providerUid: string, skillId: string, initialMessage?: string }
 * Returns: { ok: true, groupId, chatUrl } | { error: string } | { status: 402, escrow_template: {...} }
 */
import type { APIRoute } from 'astro'
import { world } from '@/engine/persist'
import { auth } from '@/lib/auth'
import { readParsed, writeSilent } from '@/lib/typedb'
import type { Payment402Response } from '@/types/escrow'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  // Auth guard
  const session = await auth.api.getSession({ headers: request.headers }).catch(() => null)
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const buyerUid = session.user.id

  // Parse body
  let providerUid: string, skillId: string, initialMessage: string | undefined
  try {
    const body = (await request.json()) as { providerUid?: string; skillId?: string; initialMessage?: string }
    providerUid = body.providerUid ?? ''
    skillId = body.skillId ?? ''
    initialMessage = body.initialMessage
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!providerUid || !skillId) {
    return Response.json({ error: 'providerUid and skillId are required' }, { status: 400 })
  }

  // Verify provider + skill capability exists
  let capabilityPrice = 0
  try {
    const rows = await readParsed(`
      match
        $u isa unit, has uid "${providerUid}";
        $s isa skill, has skill-id "${skillId}";
        (provider: $u, offered: $s) isa capability, has price $p;
      select $p;
    `)
    if (rows.length === 0) {
      return Response.json({ dissolved: true, error: `no capability ${skillId} on ${providerUid}` }, { status: 404 })
    }
    capabilityPrice = Number((rows[0] as Record<string, unknown>)?.p || 0)
  } catch {
    return Response.json({ error: 'capability lookup failed' }, { status: 500 })
  }

  // Check pheromone: insufficient strength → 402 with escrow template
  try {
    const net = world()
    const pathKey = `${buyerUid}→${providerUid}`
    const pathStrength = net.sense(pathKey)

    // Threshold: hits < 2 OR strength < 1.0 means insufficient pheromone
    // We check strength directly (path.hits is implicit in strength calculation)
    if (pathStrength < 1.0) {
      // Query for Sui IDs needed for escrow template
      const workerQueryRows = await readParsed(`
        match $u isa unit, has uid "${providerUid}", has sui-unit-id $wid;
        select $wid;
      `)
      const workerUnitId = String((workerQueryRows[0] as Record<string, unknown>)?.wid || '')

      const pathQueryRows = await readParsed(`
        match
          $p isa path,
            has from-uid "${buyerUid}",
            has to-uid "${providerUid}",
            has sui-path-id $pid;
        select $pid;
      `)
      const pathId = String((pathQueryRows[0] as Record<string, unknown>)?.pid || '')

      const deadlineMs = Date.now() + 3600000 // 1 hour
      const response: Payment402Response = {
        status: 402,
        code: 'payment_required',
        escrow_template: {
          worker_id: workerUnitId,
          task_name: skillId,
          amount_mist: Math.floor(capabilityPrice * 1e9), // capability price in SUI → MIST
          deadline_ms: deadlineMs,
          path_id: pathId,
          settlement_url: '/api/capability/hire/settle',
        },
        expires_at: deadlineMs,
      }

      return Response.json(response, { status: 402 })
    }
  } catch (e) {
    // Pheromone check failed, but continue with execution (non-blocking)
    console.error('[hire] pheromone check error:', e)
  }

  // Resolve or create chat group
  const groupId = `hire:${buyerUid}:${providerUid}:${Date.now()}`

  try {
    writeSilent(`insert $g isa group, has group-id "${groupId}", has name "hire:${providerUid}", has tag "hire";`)
    writeSilent(
      `match $g isa group, has group-id "${groupId}"; $b isa unit, has uid "${buyerUid}"; insert (member: $b, group: $g) isa membership, has role "buyer";`,
    )
    writeSilent(
      `match $g isa group, has group-id "${groupId}"; $p isa unit, has uid "${providerUid}"; insert (member: $p, group: $g) isa membership, has role "provider";`,
    )
  } catch {
    return Response.json({ error: 'group creation failed' }, { status: 500 })
  }

  // Emit initial signal if message provided
  if (initialMessage) {
    const origin = new URL(request.url).origin
    fetch(`${origin}/api/signal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: request.headers.get('cookie') ?? '' },
      body: JSON.stringify({
        receiver: providerUid,
        data: { tags: ['hire', 'initial'], content: initialMessage, groupId },
      }),
    }).catch(() => {})
  }

  return Response.json({ ok: true, groupId, chatUrl: `/app/${groupId}` })
}
