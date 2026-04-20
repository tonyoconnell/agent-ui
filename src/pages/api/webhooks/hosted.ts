import type { APIRoute } from 'astro'
import { resolveUnitFromSession } from '@/lib/api-auth'
import { tierAllows } from '@/lib/tier-limits'

export const prerender = false

/** POST /api/webhooks/hosted — register a hosted webhook for a developer's agent */
export const POST: APIRoute = async ({ request, locals }) => {
  const { getD1 } = await import('@/lib/cf-env')
  const db = await getD1(locals)

  const auth = await resolveUnitFromSession(request, locals).catch(() => null)
  if (!auth?.isValid) return Response.json({ error: 'unauthorized' }, { status: 401 })

  const tier = auth.tier ?? 'free'
  if (!tierAllows(tier, 'hostedWebhooks')) {
    return Response.json(
      { error: `hosted webhooks require Scale+ tier — current: ${tier}`, upgradeUrl: 'https://one.ie/pricing' },
      { status: 402 },
    )
  }

  const body = (await request.json().catch(() => ({}))) as {
    uid?: string
    channel?: 'telegram' | 'discord' | 'web'
    channelId?: string
  }

  if (!body.uid || !body.channelId) {
    return Response.json({ error: 'uid and channelId required' }, { status: 400 })
  }

  const id = `wh_${auth.keyId}_${Date.now().toString(36)}`
  const channel = body.channel ?? 'telegram'
  const webhookUrl = `https://nanoclaw.oneie.workers.dev/webhook/${channel}?agent=${encodeURIComponent(body.uid)}&key=${id}`

  if (!db) return Response.json({ error: 'database unavailable' }, { status: 503 })

  try {
    await db
      .prepare(
        'INSERT INTO developer_webhooks (id, key_id, uid, channel, channel_id, webhook_url, active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, unixepoch())',
      )
      .bind(id, auth.keyId, body.uid, channel, body.channelId, webhookUrl)
      .run()
  } catch {
    return Response.json({ error: 'failed to register webhook' }, { status: 500 })
  }

  return Response.json({ id, uid: body.uid, webhookUrl, channel }, { status: 201 })
}

/** GET /api/webhooks/hosted — list active webhooks for this developer */
export const GET: APIRoute = async ({ request, locals }) => {
  const { getD1 } = await import('@/lib/cf-env')
  const db = await getD1(locals)

  const auth = await resolveUnitFromSession(request, locals).catch(() => null)
  if (!auth?.isValid) return Response.json({ error: 'unauthorized' }, { status: 401 })

  const rows = await db
    ?.prepare(
      'SELECT id, uid, channel, webhook_url, active, created_at FROM developer_webhooks WHERE key_id = ? AND active = 1 ORDER BY created_at DESC',
    )
    .bind(auth.keyId)
    .all<{ id: string; uid: string; channel: string; webhook_url: string; active: number; created_at: number }>()

  return Response.json({ webhooks: rows?.results ?? [] })
}
