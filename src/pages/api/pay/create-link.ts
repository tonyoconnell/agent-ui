// ported from pay-plan.md spec on 2026-04-20
/**
 * POST /api/pay/create-link
 *
 * Creates a payment shortlink (pay.one.ie) or payment link (Stripe).
 * ADL gates: lifecycle check, network permission check, body schema validation.
 * Emits substrate:pay signal with status:"pending" after link creation.
 *
 * Body: { to: string, rail: "card"|"crypto"|"weight", amount: number,
 *         chain?: string, sku?: string, from?: string }
 *       chain — for crypto rail: "sui"|"eth"|"sol"|"btc"|"base"|"arb"|"opt" (default "sui")
 * Returns: { linkUrl: string, qr?: string, intent?: string }
 */
import type { APIRoute } from 'astro'
import * as PayService from '@/components/u/lib/PayService'
import { audit, enforcementMode, invalidateAdlCache } from '@/engine/adl-cache'
import { buildPaymentUri, deriveAddressForChain } from '@/lib/pay/chains'
import { readParsed } from '@/lib/typedb'

const _PAY_ONE_API_KEY = import.meta.env.PAY_ONE_API_KEY as string | undefined

// Accepted rails
type Rail = 'card' | 'crypto' | 'weight'

interface CreateLinkBody {
  to: string
  rail: Rail
  amount: number
  chain?: string
  sku?: string
  from?: string
  currency?: string
  memo?: string
}

// ADL lifecycle gate — check adl-status and sunset-at
async function checkLifecycle(uid: string): Promise<{ ok: boolean; reason?: string }> {
  try {
    const rows = await readParsed(`
      match $u isa unit, has uid "${uid.replace(/"/g, '')}";
      select $u has adl-status $s, $u has sunset-at $sa;
    `).catch(() => [])

    if (!rows.length) return { ok: true } // unknown uid passes through

    const row = rows[0] as Record<string, unknown>
    const status = (row.s as string) || 'active'
    const sunsetAt = row.sa as string | undefined

    if (status === 'retired') return { ok: false, reason: 'unit retired' }
    if (status === 'deprecated') return { ok: false, reason: 'unit deprecated' }

    if (sunsetAt) {
      const sunset = new Date(sunsetAt)
      if (!Number.isNaN(sunset.getTime()) && Date.now() > sunset.getTime()) {
        return { ok: false, reason: `sunset at ${sunsetAt}` }
      }
    }

    return { ok: true }
  } catch {
    return { ok: true } // fail-open on TypeDB error
  }
}

// ADL network gate — check perm-network.allowed_hosts for required host
async function checkNetwork(uid: string, requiredHost: string): Promise<{ ok: boolean; reason?: string }> {
  try {
    const rows = await readParsed(`
      match $u isa unit, has uid "${uid.replace(/"/g, '')}",
            has perm-network $pn;
      select $pn;
    `).catch(() => [])

    if (!rows.length) return { ok: true } // no network restriction

    const row = rows[0] as Record<string, unknown>
    const raw = row.pn as string | undefined
    if (!raw) return { ok: true }

    const perms = JSON.parse(raw) as { allowed_hosts?: string[]; allowedHosts?: string[] }
    const hosts = perms.allowed_hosts || perms.allowedHosts || []

    if (hosts.length === 0) return { ok: true } // empty = unrestricted

    const allowed = hosts.some((h: string) => h === requiredHost || h === '*' || requiredHost.endsWith(h))
    if (!allowed) return { ok: false, reason: `host ${requiredHost} not in allowed_hosts` }

    return { ok: true }
  } catch {
    return { ok: true }
  }
}

// Emit substrate:pay signal (fire-and-forget)
function emitPaySignal(opts: {
  rail: string
  from: string
  to: string
  ref: string
  sku?: string
  status: string
  provider: string
  amount: number
}): void {
  const baseUrl =
    typeof import.meta !== 'undefined'
      ? ((import.meta as { env?: Record<string, string> }).env?.ONE_API_URL ?? 'http://localhost:4321')
      : 'http://localhost:4321'

  // Promise.resolve wrap tolerates environments where fetch is undefined or throws sync
  Promise.resolve()
    .then(() =>
      fetch(`${baseUrl}/api/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver: 'substrate:pay',
          data: {
            weight: opts.amount,
            tags: ['pay', opts.rail === 'card' ? 'card' : opts.rail === 'crypto' ? 'crypto' : 'weight', 'accept'],
            content: {
              rail: opts.rail,
              from: opts.from,
              to: opts.to,
              ref: opts.ref,
              sku: opts.sku,
              status: opts.status,
              provider: opts.provider,
            },
          },
        }),
      }),
    )
    .catch(() => {})
}

export const POST: APIRoute = async ({ request }) => {
  let body: CreateLinkBody
  try {
    body = (await request.json()) as CreateLinkBody
  } catch {
    emitPaySignal({
      rail: 'unknown',
      from: 'anon',
      to: 'unknown',
      ref: 'failed',
      status: 'failed',
      provider: 'validation',
      amount: 0,
    })
    return Response.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  const { to, rail, amount, sku, from = 'anon', currency = 'usd', memo, chain = 'sui' } = body

  // Body validation
  if (!to || !rail || amount == null) {
    emitPaySignal({
      rail: rail ?? 'unknown',
      from: from ?? 'anon',
      to: to ?? 'unknown',
      ref: 'failed',
      status: 'failed',
      provider: 'validation',
      amount: 0,
    })
    return Response.json({ error: 'to, rail, amount required' }, { status: 400 })
  }
  if (!['card', 'crypto', 'weight'].includes(rail)) {
    emitPaySignal({ rail, from, to, ref: 'failed', status: 'failed', provider: 'validation', amount: 0 })
    return Response.json({ error: 'rail must be card|crypto|weight' }, { status: 400 })
  }
  if (typeof amount !== 'number' || amount <= 0) {
    emitPaySignal({ rail, from, to, ref: 'failed', status: 'failed', provider: 'validation', amount: 0 })
    return Response.json({ error: 'amount must be a positive number' }, { status: 400 })
  }

  const mode = enforcementMode()

  // ADL lifecycle gate (PEP-3.5)
  const lifecycle = await checkLifecycle(to)
  if (!lifecycle.ok) {
    audit({ sender: from, receiver: to, gate: 'lifecycle', decision: 'deny', mode, reason: lifecycle.reason })
    if (mode === 'enforce') {
      emitPaySignal({ rail, from, to, ref: 'failed', sku, status: 'failed', provider: 'adl', amount })
      return Response.json({ error: 'unit retired or sunset', gate: 'lifecycle' }, { status: 410 })
    }
    // audit mode: emit adl:denial signal and proceed
    emitPaySignal({ rail, from, to, ref: 'pending', sku, status: 'adl:denial:lifecycle', provider: 'adl', amount })
  }

  // ADL network gate (PEP-3) — required host depends on rail
  const requiredHost = rail === 'card' ? 'api.stripe.com' : 'pay.one.ie'
  const network = await checkNetwork(to, requiredHost)
  if (!network.ok) {
    audit({ sender: from, receiver: to, gate: 'network', decision: 'deny', mode, reason: network.reason })
    if (mode === 'enforce') {
      emitPaySignal({ rail, from, to, ref: 'failed', sku, status: 'failed', provider: 'adl', amount })
      return Response.json({ error: 'network host not permitted', gate: 'network' }, { status: 403 })
    }
    emitPaySignal({ rail, from, to, ref: 'pending', sku, status: 'adl:denial:network', provider: 'adl', amount })
  }

  // Create payment link via PayService
  try {
    if (rail === 'card') {
      // Card rail: create Stripe payment link via pay.one.ie shortlink
      const result = await PayService.createPaymentLink({
        amount: String(Math.round(amount * 100)), // cents
        currency,
        recipient: to,
        memo: memo || sku || 'payment',
        chain: 'stripe',
      })

      if (!result.success || !result.data) {
        emitPaySignal({ rail, from, to, ref: 'failed', sku, status: 'failed', provider: 'stripe', amount })
        return Response.json({ error: result.error?.message || 'link creation failed' }, { status: 502 })
      }

      const ref = `sl_${Date.now()}`
      emitPaySignal({ rail, from, to, ref, sku, status: 'pending', provider: 'stripe', amount })

      return Response.json({ linkUrl: result.data.link, intent: ref })
    }

    if (rail === 'crypto') {
      // Crypto rail: derive chain-specific receive address for the recipient uid,
      // build a payment URI, and wrap it as a pay.one.ie shortlink.
      let receiverAddress: string
      try {
        receiverAddress = await deriveAddressForChain(to, chain)
      } catch (deriveErr) {
        emitPaySignal({ rail, from, to, ref: 'failed', sku, status: 'failed', provider: 'chain-derive', amount })
        return Response.json(
          { error: deriveErr instanceof Error ? deriveErr.message : 'address derivation failed' },
          { status: 500 },
        )
      }

      const paymentUri = buildPaymentUri(receiverAddress, amount, chain)

      const payload = JSON.stringify({
        to,
        address: receiverAddress,
        chain: chain.toLowerCase(),
        amount,
        currency: currency.toUpperCase(),
        paymentUri,
        sku,
        from,
        rail,
      })
      const signature = `sig_${Date.now()}` // TODO: real HMAC in production

      const result = await PayService.createShortlink({
        payload,
        signature,
        baseUrl: 'https://pay.one.ie',
      })

      if (!result.success || !result.data) {
        emitPaySignal({ rail, from, to, ref: 'failed', sku, status: 'failed', provider: 'pay.one.ie', amount })
        return Response.json({ error: result.error?.message || 'shortlink creation failed' }, { status: 502 })
      }

      const ref = `sl_${result.data.code}`
      emitPaySignal({ rail, from, to, ref, sku, status: 'pending', provider: 'pay.one.ie', amount })

      invalidateAdlCache(to)

      return Response.json({
        linkUrl: result.data.shortUrl,
        qr: `https://pay.one.ie/qr?code=${result.data.code}`,
        intent: ref,
        // expose the derived address and payment URI to callers
        address: receiverAddress,
        chain: chain.toLowerCase(),
        paymentUri,
      })
    }

    // Weight rail: create shortlink via pay.one.ie (passthrough, no chain derivation)
    const payload = JSON.stringify({ to, amount, currency: currency.toUpperCase(), sku, from, rail })
    const signature = `sig_${Date.now()}` // TODO: real HMAC in production

    const result = await PayService.createShortlink({
      payload,
      signature,
      baseUrl: 'https://pay.one.ie',
    })

    if (!result.success || !result.data) {
      emitPaySignal({ rail, from, to, ref: 'failed', sku, status: 'failed', provider: 'pay.one.ie', amount })
      return Response.json({ error: result.error?.message || 'shortlink creation failed' }, { status: 502 })
    }

    const ref = `sl_${result.data.code}`
    emitPaySignal({ rail, from, to, ref, sku, status: 'pending', provider: 'pay.one.ie', amount })

    // Optionally invalidate ADL cache if any ADL attr was written
    invalidateAdlCache(to)

    return Response.json({
      linkUrl: result.data.shortUrl,
      qr: `https://pay.one.ie/qr?code=${result.data.code}`,
      intent: ref,
    })
  } catch (err) {
    emitPaySignal({
      rail: body?.rail ?? 'unknown',
      from: body?.from ?? 'anon',
      to: body?.to ?? 'unknown',
      ref: 'failed',
      sku: body?.sku,
      status: 'failed',
      provider: 'unknown',
      amount: body?.amount ?? 0,
    })
    return Response.json({ error: err instanceof Error ? err.message : 'unexpected error' }, { status: 500 })
  }
}
