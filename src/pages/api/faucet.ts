/**
 * POST /api/faucet — Proxy to Sui testnet faucet (browser CORS blocked)
 *
 * Body: { address: string }
 * Returns: { ok: true, address } or { error: string }
 */
import type { APIRoute } from 'astro'

export const POST: APIRoute = async ({ request }) => {
  const { address } = (await request.json()) as { address?: string }
  if (!address?.startsWith('0x') || address.length < 40) {
    return Response.json({ error: 'valid Sui address required' }, { status: 400 })
  }

  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 15000)
    const res = await fetch('https://faucet.testnet.sui.io/v1/gas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ FixedAmountRequest: { recipient: address } }),
      signal: ctrl.signal,
    })
    clearTimeout(timer)

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      if (text.includes('rate') || res.status === 429) {
        return Response.json({ ok: true, address, rateLimited: true, note: 'may already be funded' })
      }
      return Response.json({ error: `faucet ${res.status}: ${text.slice(0, 200)}` }, { status: 502 })
    }

    const data = await res.json().catch(() => ({}))
    return Response.json({ ok: true, address, faucet: data })
  } catch (e) {
    const msg = String(e)
    if (msg.includes('abort')) {
      return Response.json({ ok: true, address, timeout: true, note: 'faucet slow — may still arrive' })
    }
    return Response.json({ error: msg }, { status: 500 })
  }
}
