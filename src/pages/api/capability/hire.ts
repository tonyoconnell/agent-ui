/**
 * POST /api/capability/hire — Hire a capability via x402 payment gate.
 *
 * Body: { buyer: string, provider: string, skillId: string, initialMessage?: string }
 *
 * Responses:
 *   402 — payment required; body + X-Payment-Required header contain escrow template
 *   200 — hired; { ok: true, groupId, chatUrl }
 *   400 — missing/invalid params
 *   404 — capability not found on provider
 *
 * Gate logic:
 *   - skill.price = 0 → proceed immediately (free capability)
 *   - skill.price > 0 AND pheromone(buyer→provider) ≥ 1.0 → proceed (earned trust)
 *   - skill.price > 0 AND X-Payment header present AND valid → verify + proceed
 *   - skill.price > 0 AND no payment → return 402 with escrow template
 *
 * The pheromone threshold (1.0) means a buyer who has successfully paid at least
 * once accumulates enough strength to skip payment on repeat hires. Revenue = weight.
 */

import type { APIRoute } from 'astro'
import { world } from '@/engine/persist'
import { verifySuiTx } from '@/lib/sui-verify'
import { readParsed, writeSilent } from '@/lib/typedb'
import { emitClick } from '@/lib/ui-signal'
import { buildEscrowTemplate, buildX402Requirement, parseXPayment, payment402Response, x402Network } from '@/lib/x402'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { buyer, provider, skillId, initialMessage } = body as {
    buyer?: string
    provider?: string
    skillId?: string
    initialMessage?: string
  }

  if (!buyer || !provider || !skillId) {
    return Response.json({ error: 'buyer, provider, and skillId are required' }, { status: 400 })
  }

  // Look up capability and price
  const capRows = await readParsed(`
    match
      $u isa unit, has uid "${provider}";
      $s isa skill, has skill-id "${skillId}";
      $c (provider: $u, offered: $s) isa capability, has price $capPrice;
    select $capPrice;
  `).catch(() => [] as unknown[])

  if (capRows.length === 0) {
    return Response.json({ error: `Capability ${skillId} not found on ${provider}` }, { status: 404 })
  }

  const price = Number((capRows[0] as Record<string, unknown>).capPrice ?? 0)

  // Look up provider Sui address (separate query — optional field)
  const suiRows = await readParsed(`
    match $u isa unit, has uid "${provider}", has sui-unit-id $suiId;
    select $suiId;
  `).catch(() => [] as unknown[])

  const providerSuiId = suiRows.length > 0 ? String((suiRows[0] as Record<string, unknown>).suiId) : provider

  const pathKey = `${buyer}→${provider}`
  const net = world()
  const pheromone = net.sense(pathKey)

  // Gate: priced + low trust → check for payment
  if (price > 0 && pheromone < 1.0) {
    const xPayment = parseXPayment(request.headers.get('X-Payment'))

    if (xPayment) {
      // Verify the Sui escrow release TX
      const verify = await verifySuiTx(xPayment.escrow_id, xPayment.tx_digest)
      if (!verify.valid) {
        return Response.json({ error: 'X-Payment verification failed', reason: verify.reason }, { status: 402 })
      }
      // Payment verified — deposit pheromone and continue to hire below
      net.mark(pathKey, price)
      writeSilent(`
        match $p isa path, has from-unit "${buyer}", has to-unit "${provider}", has strength $s;
        delete $p has strength $s;
        insert $p has strength ($s + ${price});
      `)
      emitClick('ui:capability:hire-paid', { buyer, provider, skillId, tx: xPayment.tx_digest })
    } else {
      // No payment — return 402 with x402 escrow template
      const template = buildEscrowTemplate(providerSuiId, skillId, price)
      const requirement = buildX402Requirement(
        template,
        providerSuiId,
        skillId,
        '/api/capability/hire',
        price,
        x402Network(),
      )
      emitClick('ui:capability:hire-gated', { buyer, provider, skillId, price })
      return payment402Response(requirement)
    }
  }

  // Create hire group and membership
  const groupId = `hire:${buyer}:${provider}:${Date.now()}`

  writeSilent(`insert $g isa group, has gid "${groupId}", has name "hire:${provider}", has tag "hire";`)
  writeSilent(`
    match $g isa group, has gid "${groupId}"; $b isa unit, has uid "${buyer}";
    insert (member: $b, group: $g) isa membership, has member-role "buyer";
  `)
  writeSilent(`
    match $g isa group, has gid "${groupId}"; $p isa unit, has uid "${provider}";
    insert (member: $p, group: $g) isa membership, has member-role "provider";
  `)

  // Emit initial signal if message provided
  if (initialMessage) {
    const ts = new Date().toISOString().replace('Z', '')
    writeSilent(`
      match $p isa unit, has uid "${provider}";
      insert (sender: $p, receiver: $p) isa signal,
        has data ${JSON.stringify(JSON.stringify({ tags: ['hire', 'initial'], content: initialMessage, groupId }))},
        has success true,
        has ts ${ts};
    `)
  }

  // Mark path — hire itself is a successful interaction (closed loop)
  net.mark(pathKey, 0.1)
  emitClick('ui:capability:hired', { buyer, provider, skillId, groupId })

  return Response.json({ ok: true, groupId, chatUrl: `/app/${groupId}` }, { status: 200 })
}
