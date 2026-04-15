import type { APIRoute } from 'astro'

export const prerender = false

const nanoclawBase = (): string =>
  (import.meta.env.NANOCLAW_URL as string | undefined) ?? 'https://nanoclaw.oneie.workers.dev'

/**
 * POST /api/identity/claim
 * Body: { sessionId: string }
 * Returns: { nonce: string } on success, { error: string } on failure.
 * Proxies to nanoclaw POST /claim which stores the nonce in KV (5-min TTL).
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const { sessionId } = (await request.json()) as { sessionId?: string }
    if (!sessionId) {
      return Response.json({ error: 'sessionId required' }, { status: 400 })
    }

    const res = await fetch(`${nanoclawBase()}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })

    if (!res.ok) {
      return Response.json({ error: `nanoclaw error: ${res.status}` }, { status: 502 })
    }

    const data = (await res.json()) as { ok?: boolean; nonce?: string; expiresIn?: number }
    if (!data.nonce) {
      return Response.json({ error: 'no nonce returned' }, { status: 502 })
    }

    return Response.json({ nonce: data.nonce, expiresIn: data.expiresIn ?? 300 })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'claim failed' }, { status: 500 })
  }
}

/**
 * GET /api/identity/claim?sessionId=X
 * Returns: { linked: boolean, canonicalUid?: string }
 * Proxies to nanoclaw GET /claim/status?sessionId=X.
 * The Pages app polls this endpoint every 2s after initiating a claim.
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    const sessionId = url.searchParams.get('sessionId')
    if (!sessionId) {
      return Response.json({ error: 'sessionId required' }, { status: 400 })
    }

    const res = await fetch(`${nanoclawBase()}/claim/status?sessionId=${encodeURIComponent(sessionId)}`)

    if (!res.ok) {
      return Response.json({ linked: false }, { status: 200 })
    }

    const data = (await res.json()) as { linked?: boolean; canonicalUid?: string }
    return Response.json({
      linked: data.linked ?? false,
      ...(data.canonicalUid ? { canonicalUid: data.canonicalUid } : {}),
    })
  } catch {
    return Response.json({ linked: false })
  }
}
