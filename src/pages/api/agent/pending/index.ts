/**
 * /api/agent/pending — Co-sign request list + creation
 *
 * GET  /api/agent/pending?address=<sui-address>
 *   List pending co-sign requests for a wallet address.
 *   Auth: session (human) or bearer (agent).
 *   Returns: { requests: CoSignRequestWire[] }
 *
 * POST /api/agent/pending
 *   Agent creates a new co-sign request (bearer auth with agent API key).
 *   Body: { agentUid, txBytesB64, agentSigB64, summary }
 *   Returns: { id, expiresAt }
 *
 * KV key: `cosign:${id}` with 300s TTL (auto-expires in KV).
 * In-process cache: none — KV is the source of truth (TTL-managed by KV itself).
 *
 * Pattern A from agents.md: agent drafts + signs first, human approves via Touch ID.
 */

import type { APIRoute } from 'astro'
import { getEnv } from '@/lib/cf-env'
import { resolveUnitFromSession, validateApiKey } from '@/lib/api-auth'

export const prerender = false

/** Wire format for CoSignRequest (Uint8Array fields serialised as base64) */
interface CoSignRequestWire {
  id: string
  agentUid: string
  txBytesB64: string
  agentSigB64: string
  summary: string
  expiresAt: number
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  /** The wallet address this request targets (for lookup by address) */
  targetAddress: string
}

const COSIGN_TTL_SECONDS = 300 // 5 minutes — matches CoSignRequest.expiresAt

// ── GET — list pending requests for a wallet address ──────────────────────

export const GET: APIRoute = async ({ request, locals }) => {
  // Auth: session (human in browser) or bearer (agent)
  const auth = await resolveUnitFromSession(request, locals)
  if (!auth.isValid) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const url = new URL(request.url)
  const address = url.searchParams.get('address')
  if (!address) {
    return new Response(JSON.stringify({ error: 'address query param required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const env = (await getEnv(locals)) as { KV?: KVNamespace }
  const kv = env.KV
  if (!kv) {
    // Dev mode without KV binding — return empty list
    return Response.json({ requests: [] })
  }

  // KV list: all keys with prefix `cosign:` — filter by targetAddress
  // KV.list() returns up to 1000 keys; co-sign requests are short-lived (5 min)
  // so the active set is tiny in practice.
  try {
    const listed = await kv.list({ prefix: 'cosign:' })
    const requests: CoSignRequestWire[] = []

    await Promise.all(
      listed.keys.map(async (key) => {
        const raw = await kv.get(key.name)
        if (!raw) return
        try {
          const req = JSON.parse(raw) as CoSignRequestWire
          // Filter by targetAddress and only return pending/non-expired entries
          if (req.targetAddress !== address) return
          if (req.status !== 'pending') return
          if (req.expiresAt < Date.now()) return
          requests.push(req)
        } catch {
          // Malformed KV value — skip
        }
      }),
    )

    return Response.json({ requests })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message ?? 'KV list failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// ── POST — agent creates a new co-sign request ────────────────────────────

export const POST: APIRoute = async ({ request, locals }) => {
  // Auth: bearer (agent API key) required for creation
  const auth = await validateApiKey(request, undefined, locals)
  if (!auth.isValid) {
    return new Response(JSON.stringify({ error: 'Unauthorized — agent bearer key required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const {
    agentUid,
    txBytesB64,
    agentSigB64,
    summary,
    targetAddress,
  } = body as Partial<{
    agentUid: string
    txBytesB64: string
    agentSigB64: string
    summary: string
    targetAddress: string
  }>

  if (!agentUid || typeof agentUid !== 'string') {
    return new Response(JSON.stringify({ error: 'agentUid required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (!txBytesB64 || typeof txBytesB64 !== 'string') {
    return new Response(JSON.stringify({ error: 'txBytesB64 required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (!agentSigB64 || typeof agentSigB64 !== 'string') {
    return new Response(JSON.stringify({ error: 'agentSigB64 required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (!summary || typeof summary !== 'string') {
    return new Response(JSON.stringify({ error: 'summary required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (!targetAddress || typeof targetAddress !== 'string') {
    return new Response(JSON.stringify({ error: 'targetAddress required (human wallet address)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Verify the caller is the stated agent (possession check)
  if (auth.user !== agentUid) {
    return new Response(JSON.stringify({ error: 'agentUid must match authenticated agent' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const env = (await getEnv(locals)) as { KV?: KVNamespace }
  const kv = env.KV
  if (!kv) {
    return new Response(JSON.stringify({ error: 'KV not available' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const id = crypto.randomUUID()
  const expiresAt = Date.now() + COSIGN_TTL_SECONDS * 1000

  const req: CoSignRequestWire = {
    id,
    agentUid,
    txBytesB64,
    agentSigB64,
    summary: summary.slice(0, 500), // cap at 500 chars
    expiresAt,
    status: 'pending',
    targetAddress,
  }

  try {
    await kv.put(`cosign:${id}`, JSON.stringify(req), {
      expirationTtl: COSIGN_TTL_SECONDS,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message ?? 'KV write failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ id, expiresAt }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  })
}
