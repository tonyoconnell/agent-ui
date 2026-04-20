/**
 * POST /api/marketplace/list — seller LIST endpoint
 *
 * Creates a capability relation in TypeDB so the unit can offer a skill at a price.
 * Tier gate: Builder+ only — free tier cannot sell.
 *
 * Body: { receiver: string, price: number, tags?: string[] }
 *   receiver — the skill receiver name (used as skill-id and derives skill name)
 *   price    — price in SUI (must be > 0)
 *   tags     — optional classification tags
 *
 * Emits marketplace:sell signal (fire-and-forget) on success.
 */
import type { APIRoute } from 'astro'
import { resolveUnitFromSession } from '@/lib/api-auth'
import { getD1 } from '@/lib/cf-env'
import { getUsage, recordCall } from '@/lib/metering'
import { checkApiCallLimit, tierLimitResponse } from '@/lib/tier-limits'
import { write } from '@/lib/typedb'

export const prerender = false

export const POST: APIRoute = async ({ request, locals }) => {
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

  // Tier gate: Builder+ can sell; free cannot
  if (tier === 'free') {
    return Response.json(
      {
        error: 'selling requires Builder tier or above — upgrade at https://one.ie/pricing',
        tier,
        upgradeUrl: 'https://one.ie/pricing',
      },
      { status: 402 },
    )
  }

  // Parse body
  const body = (await request.json().catch(() => ({}))) as {
    receiver?: unknown
    price?: unknown
    tags?: unknown
  }

  const receiver = typeof body.receiver === 'string' ? body.receiver.trim() : ''
  const price = typeof body.price === 'number' ? body.price : Number(body.price)
  const tags = Array.isArray(body.tags) ? body.tags.filter((t): t is string => typeof t === 'string') : []

  if (!receiver) return Response.json({ error: 'receiver is required' }, { status: 400 })
  if (!Number.isFinite(price) || price <= 0) {
    return Response.json({ error: 'price must be a positive number' }, { status: 400 })
  }

  const uid = auth.user
  // skillId = receiver (used verbatim); skillName = last segment after ":"
  const skillId = receiver
  const skillName = receiver.includes(':') ? receiver.split(':').pop()! : receiver

  // Build tag inserts
  const tagInserts = tags.map((t) => `, has tag "${t.replace(/"/g, '')}"`)
  const tagTql = tagInserts.join('')

  try {
    await write(`
      match $u isa unit, has uid "${uid.replace(/"/g, '')}";
      insert $s isa skill, has skill-id "${skillId.replace(/"/g, '')}", has name "${skillName.replace(/"/g, '')}", has price ${price}${tagTql};
             (provider: $u, offered: $s) isa capability, has price ${price};
    `)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'typedb write failed'
    return Response.json({ error: msg }, { status: 500 })
  }

  // Fire-and-forget signal
  const signalUrl = new URL('/api/signal', request.url).toString()
  void fetch(signalUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      receiver: 'marketplace:sell',
      data: { tags: ['marketplace', 'sell', ...tags], content: { uid, receiver, price } },
    }),
  }).catch(() => {
    /* fire-and-forget — ignore failures */
  })

  return Response.json({ ok: true, receiver, price, tags })
}
