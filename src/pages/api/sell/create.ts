/**
 * POST /api/sell/create — Create a new capability listing.
 *
 * Body: { name, priceMist, tags, description? }
 *
 * Requires session auth (Better Auth cookie or API key).
 * Derives the provider uid from the authenticated session.
 *
 * Returns: { capabilityId, payUrl }
 */
import type { APIRoute } from 'astro'
import { requireAuth, validateApiKey } from '@/lib/api-auth'
import { createCapability } from '@/lib/sell/capability'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  const auth = await validateApiKey(request)
  try {
    requireAuth(auth)
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const uid = (auth as { uid?: string }).uid ?? 'unknown'

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const b = body as Record<string, unknown>

  if (typeof b.name !== 'string' || !b.name.trim()) {
    return Response.json({ error: 'name is required' }, { status: 400 })
  }

  // priceMist may arrive as number or string (bigint serializes as string)
  const rawMist = b.priceMist
  if (rawMist === undefined || rawMist === null) {
    return Response.json({ error: 'priceMist is required' }, { status: 400 })
  }
  let priceMist: bigint
  try {
    priceMist = BigInt(String(rawMist))
  } catch {
    return Response.json({ error: 'priceMist must be a valid integer (in MIST)' }, { status: 400 })
  }
  if (priceMist < 0n) {
    return Response.json({ error: 'priceMist must be non-negative' }, { status: 400 })
  }

  const tags = Array.isArray(b.tags) ? (b.tags as unknown[]).filter((t): t is string => typeof t === 'string') : []

  const description = typeof b.description === 'string' ? b.description : undefined

  try {
    const result = await createCapability({ uid, name: b.name, priceMist, tags, description })
    return Response.json({ ok: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
