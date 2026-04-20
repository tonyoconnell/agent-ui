/**
 * Subscribe a unit to tags — Stage 12 of lifecycle-one.md
 *
 * POST /api/subscribe { uid, tags: string[], scope?: 'private' | 'public' }
 *   → { ok: true, uid, subscriptions: [{ tag, scope }] }
 *
 * GET  /api/subscribe?uid=X    → { uid, subscriptions: [{ tag, scope }] }
 * GET  /api/subscribe?tag=X    → { tag, subscribers: [{ uid, scope }] }
 *
 * Subscriptions are stored in D1 `subscriptions` table (migrations/0020_subscriptions.sql).
 * A substrate signal is emitted so pheromone learns which tags attract subscribers.
 * Scope 'private' → only fires for senders sharing a group with the subscriber (Cycle 2 routing).
 * Scope 'public'  → fires for any world member (Cycle 2 routing).
 */
import type { APIRoute } from 'astro'
import { resolveUnitFromSession } from '@/lib/api-auth'
import { getD1 } from '@/lib/cf-env'

export const prerender = false

export const POST: APIRoute = async ({ request, locals }) => {
  const auth = await resolveUnitFromSession(request, locals)

  const body = (await request.json().catch(() => ({}))) as {
    uid?: string
    receiver?: string // backward-compat alias for uid
    tags?: unknown
    scope?: string
  }

  // Auth is optional — authenticated callers use their session uid;
  // unauthenticated callers (agents, CLI, tests) provide uid in body.
  const uid = auth.isValid ? (auth.user ?? body.uid ?? body.receiver) : (body.uid ?? body.receiver)
  if (!uid || !Array.isArray(body.tags) || body.tags.length === 0) {
    return Response.json({ error: 'uid and tags[] required' }, { status: 400 })
  }

  const scope = body.scope === 'private' ? 'private' : 'public'
  const tags = (body.tags as unknown[]).map(String).filter(Boolean)

  // Build subscriptions from request (DB write is best-effort)
  const subscriptions = tags.map((tag) => ({ tag, scope }))

  const db = await getD1(locals)
  if (db) {
    for (const tag of tags) {
      await db
        .prepare(
          'INSERT INTO subscriptions (uid, tag, scope, created_at) VALUES (?, ?, ?, unixepoch()) ' +
            'ON CONFLICT(uid, tag) DO UPDATE SET scope = excluded.scope',
        )
        .bind(uid, tag, scope)
        .run()
        .catch(() => null)
    }
  }

  // Fire-and-forget: pheromone learns which tags attract subscribers
  void fetch(new URL('/api/signal', request.url).toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: request.headers.get('Authorization') ?? '',
    },
    body: JSON.stringify({
      sender: uid,
      receiver: `tag:subscribe`,
      data: { tags: ['stage:subscribe', ...tags.map((t) => `tag:${t}`)], content: { uid, scope } },
    }),
  }).catch(() => {
    /* pheromone is best-effort */
  })

  return Response.json({ ok: true, uid, subscriptions })
}

export const GET: APIRoute = async ({ url, locals }) => {
  const uid = url.searchParams.get('uid')
  const tag = url.searchParams.get('tag')

  if (!uid && !tag) {
    return Response.json({ error: 'uid or tag query param required' }, { status: 400 })
  }

  const db = await getD1(locals)
  if (!db) {
    return uid ? Response.json({ uid, subscriptions: [] }) : Response.json({ tag, subscribers: [] })
  }

  if (uid) {
    const rows = await db
      .prepare('SELECT tag, scope FROM subscriptions WHERE uid = ? ORDER BY created_at DESC')
      .bind(uid)
      .all<{ tag: string; scope: string }>()
    return Response.json({ uid, subscriptions: rows?.results ?? [] })
  }

  // tag query — return public subscribers (private senders are scope-filtered at routing time)
  const rows = await db
    .prepare('SELECT uid, scope FROM subscriptions WHERE tag = ? ORDER BY created_at DESC')
    .bind(tag)
    .all<{ uid: string; scope: string }>()
  return Response.json({ tag, subscribers: rows?.results ?? [] })
}
