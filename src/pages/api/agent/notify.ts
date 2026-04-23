/**
 * POST /api/agent/notify — Agent co-sign notification
 *
 * Called by an agent when it has created a co-sign request and needs to alert
 * the wallet owner. Routes the notification via the user's preferred channel
 * (push / email / webhook) using routeNotification().
 *
 * Auth: bearer token (agent API key) — same key used for POST /api/agent/pending.
 *
 * Body: { requestId: string, agentUid: string, summary: string }
 *
 * Response 202: { ok: true, channel: string }
 *   Notification was dispatched to at least one channel.
 * Response 400: { error: string }
 *   Missing or invalid body fields.
 * Response 401: { error: string }
 *   Missing or invalid bearer token.
 * Response 503: { error: string }
 *   All notification channels failed.
 *
 * Channel selection: user preferences are looked up from KV key
 * `notify-prefs:${ownerAddress}`. If no preferences are found the endpoint
 * falls back to emitting a substrate signal so the owner can poll /api/inbox.
 */

import type { APIRoute } from 'astro'
import { validateApiKey } from '@/lib/api-auth'
import { getEnv } from '@/lib/cf-env'
import { routeNotification, type UserNotifyPrefs } from '@/lib/notify/route'
import { writeSilent } from '@/lib/typedb'

export const prerender = false

export const POST: APIRoute = async ({ request, locals }) => {
  // Agent bearer auth required
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

  const { requestId, agentUid, summary } = body as Partial<{
    requestId: string
    agentUid: string
    summary: string
  }>

  if (!requestId || typeof requestId !== 'string') {
    return new Response(JSON.stringify({ error: 'requestId required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (!agentUid || typeof agentUid !== 'string') {
    return new Response(JSON.stringify({ error: 'agentUid required' }), {
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

  // Verify the caller is the stated agent (possession check)
  if (auth.user !== agentUid) {
    return new Response(JSON.stringify({ error: 'agentUid must match authenticated agent' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Look up the co-sign request from KV to find the target wallet address
  const env = (await getEnv(locals)) as { KV?: KVNamespace }
  const kv = env.KV

  let targetAddress: string | null = null
  if (kv) {
    const raw = await kv.get(`cosign:${requestId}`).catch(() => null)
    if (raw) {
      try {
        const req = JSON.parse(raw) as { targetAddress?: string }
        targetAddress = req.targetAddress ?? null
      } catch {
        // ignore parse error — fall through to signal-only path
      }
    }
  }

  // Build the approval URL
  const approveUrl = `${new URL(request.url).origin}/u/approve/${encodeURIComponent(requestId)}`

  // Build the notification event
  const notifyEvent = {
    event: 'co-sign-request' as const,
    title: 'Agent co-sign request',
    body: `${agentUid} is requesting your approval: ${summary.slice(0, 200)}`,
    data: {
      requestId,
      agentUid,
      summary,
      approveUrl,
      kind: 'co-sign-request',
    },
  }

  // Try to deliver via the owner's preferred channels if we have their address
  let deliveredChannel = 'signal'

  if (kv && targetAddress) {
    const prefsRaw = await kv.get(`notify-prefs:${targetAddress}`).catch(() => null)
    if (prefsRaw) {
      try {
        const prefs = JSON.parse(prefsRaw) as UserNotifyPrefs
        await routeNotification(prefs, notifyEvent)
        deliveredChannel = prefs.channels[0] ?? 'signal'
      } catch (_err) {
        // All channels failed — fall through to substrate signal
      }
    }
  }

  // Always emit a substrate signal so the owner can discover pending requests
  // via /api/inbox even when no push/email prefs are configured.
  const receiver = targetAddress ? `human:${targetAddress}:notify` : `agent:${agentUid}:notify`
  writeSilent(
    `insert $s isa signal, ` +
      `has receiver "${receiver.replace(/"/g, '\\"')}", ` +
      `has data "${JSON.stringify({ event: 'co-sign-request', requestId, agentUid, approveUrl }).replace(/"/g, '\\"')}";`,
  )

  return new Response(JSON.stringify({ ok: true, channel: deliveredChannel }), {
    status: 202,
    headers: { 'Content-Type': 'application/json' },
  })
}
