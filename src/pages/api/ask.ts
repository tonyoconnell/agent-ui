/**
 * POST /api/ask — Signal + wait for outcome
 *
 * Body: { receiver: string, data?: unknown, timeout?: number, from?: string }
 * Response: { result?: unknown, timeout?: true, dissolved?: true, failure?: true, latency: number }
 *
 * Default timeout: 30000ms. Max: 120000ms.
 *
 * BaaS metering (Cycle 1 T-B1-05): authenticated callers are rate-limited by
 * their tier's monthly API-call cap. Anonymous callers skip the gate
 * (Cloudflare frontdoor handles basic abuse).
 */
import type { APIRoute } from 'astro'
import { resolveUnitFromSession } from '@/lib/api-auth'
import { getD1 } from '@/lib/cf-env'
import { getUsage, recordCall } from '@/lib/metering'
import { getNet } from '@/lib/net'
import { checkApiCallLimit, tierLimitResponse } from '@/lib/tier-limits'

const DEFAULT_TIMEOUT = 30_000
const MAX_TIMEOUT = 120_000

export const POST: APIRoute = async ({ request, locals }) => {
  const started = Date.now()
  try {
    const body = (await request.json()) as {
      receiver?: string
      data?: unknown
      timeout?: number
      from?: string
    }
    if (!body?.receiver || typeof body.receiver !== 'string') {
      return new Response(JSON.stringify({ error: 'receiver required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // BaaS metering gate (identical shape to /api/signal).
    const db = await getD1(locals)
    const auth = await resolveUnitFromSession(request, locals).catch(() => null)
    if (auth?.isValid) {
      const tier = auth.tier ?? 'free'
      const usage = await getUsage(db, auth.keyId)
      const gate = checkApiCallLimit(tier, usage)
      if (!gate.ok) return tierLimitResponse(gate)
      void recordCall(db, auth.keyId)
    }

    const timeout = Math.min(Math.max(body.timeout ?? DEFAULT_TIMEOUT, 100), MAX_TIMEOUT)
    const net = await getNet()
    // ── TAG RECEIVER ROUTING (Stage 12: Subscribe — Cycle 2) ────────────────────
    let resolvedReceiver = body.receiver
    if (resolvedReceiver.startsWith('tag:')) {
      const { resolveTagReceiver } = await import('@/lib/subscribe-routing')
      const tagUid = await resolveTagReceiver(resolvedReceiver.slice(4), db)
      if (!tagUid) {
        return new Response(
          JSON.stringify({
            dissolved: true,
            reason: 'no-subscriber',
            tag: resolvedReceiver,
            latency: Date.now() - started,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      resolvedReceiver = tagUid
    }
    const outcome = await net.ask({ receiver: resolvedReceiver, data: body.data }, body.from ?? 'api-ask', timeout)
    return new Response(JSON.stringify({ ...outcome, latency: Date.now() - started }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err), latency: Date.now() - started }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
