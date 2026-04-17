/**
 * POST /api/agents/register
 *
 * Register a new agent unit with optional capabilities and wallet link.
 *
 * Body:
 *   { uid: string, kind?: string, capabilities?: { skill: string, price?: number }[], wallet?: string, chain?: string }
 *
 * Returns:
 *   { uid: string, status: "registered", capabilities: number, walletLinked?: boolean }
 *
 * Lifecycle gate: creates unit + capability relations in one call.
 * Rate limit: 10 wallet-link writes per uid per day (returns 429 if exceeded).
 */

import type { APIRoute } from 'astro'
import { world } from '@/engine/persist'
import { addressFor } from '@/lib/sui'
import { writeSilent } from '@/lib/typedb'

// In-memory rate limiter: uid → { count, day }
const walletLinkWrites = new Map<string, { count: number; day: string }>()
const MAX_LINKS_PER_DAY = 10

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function checkRateLimit(uid: string): boolean {
  const today = todayKey()
  const entry = walletLinkWrites.get(uid)
  if (!entry || entry.day !== today) {
    walletLinkWrites.set(uid, { count: 1, day: today })
    return true
  }
  if (entry.count >= MAX_LINKS_PER_DAY) return false
  entry.count++
  return true
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as {
      uid?: string
      kind?: string
      capabilities?: { skill: string; price?: number }[]
      wallet?: string
      chain?: string
    }

    if (!body.uid) {
      return Response.json({ error: 'uid required' }, { status: 400 })
    }

    const net = world()
    const kind = body.kind || 'agent'

    // Create the unit (register stage)
    net.actor(body.uid, kind)

    // Declare capabilities if provided
    if (body.capabilities?.length) {
      for (const cap of body.capabilities) {
        net.thing(cap.skill, { price: cap.price || 0 })
        await net.capable(body.uid, cap.skill, cap.price || 0)
      }
    }

    // Link external wallet if provided (rate-limited)
    let walletLinked = false
    if (body.wallet) {
      if (!checkRateLimit(body.uid)) {
        return Response.json({ error: 'wallet-link rate limit exceeded (10/day per actor)' }, { status: 429 })
      }
      // Insert ext-wallet entity + wallet-link relation
      const chain = body.chain || 'sui'
      await writeSilent(`
        match
          $a isa actor, has aid "${body.uid}";
        insert
          $w isa ext-wallet, has wallet-address "${body.wallet}";
          (substrate: $a, external: $w) isa wallet-link;
      `)
      walletLinked = true
    }

    const suiWallet = await addressFor(body.uid).catch(() => null)
    return Response.json({
      ok: true,
      uid: body.uid,
      status: 'registered',
      kind,
      wallet: suiWallet,
      walletLinked,
      capabilities: body.capabilities?.length || 0,
    })
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 })
  }
}
