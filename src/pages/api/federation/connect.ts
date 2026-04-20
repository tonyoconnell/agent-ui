/**
 * POST /api/federation/connect — Open a federation bridge to another ONE world
 *
 * Body: { targetUrl: string, targetWorld?: string, name?: string, apiKeyHint?: string }
 *   targetUrl   — HTTPS URL of the remote ONE instance (required)
 *   targetWorld — optional gid of the target world (e.g. "world:legal")
 *   name        — optional display label (defaults to the target's slug)
 *   apiKeyHint  — non-secret last-4 of the API key used for diagnostics (never store the full key here)
 *
 * What this does:
 *   1. Records the federation intent in D1 `federations` table (operational config)
 *   2. Emits a `federation:connect` substrate signal so pheromone learns which bridges open
 *   3. Returns the federation id + metadata
 *
 * What this does NOT do (by design):
 *   - Does NOT modify src/engine/federation.ts wiring at runtime. That's boot-time
 *     configuration and lives in the world bootstrap. Adding runtime wiring from a
 *     user API call would be a privilege escalation path. Production federations
 *     are wired by operators via config.
 *
 * Tier: Enterprise only (per one/pricing.md § Pricing tiers).
 * See src/engine/federation.ts for the runtime federate() primitive.
 */
import type { APIRoute } from 'astro'
import { resolveUnitFromSession } from '@/lib/api-auth'
import { getD1 } from '@/lib/cf-env'
import { getUsage, recordCall } from '@/lib/metering'
import { checkApiCallLimit, tierAllows, tierLimitResponse } from '@/lib/tier-limits'

export const prerender = false

function slugFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/[^a-z0-9-]/gi, '-').toLowerCase()
  } catch {
    return url.replace(/[^a-z0-9-]/gi, '-').toLowerCase()
  }
}

export const POST: APIRoute = async ({ request, locals }) => {
  const auth = await resolveUnitFromSession(request, locals)
  if (!auth.isValid) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const tier = auth.tier ?? 'free'
  if (!tierAllows(tier, 'federation')) {
    return Response.json(
      {
        error: `federation requires Enterprise tier — current: ${tier}`,
        tier,
        required: 'enterprise',
        upgradeUrl: 'https://one.ie/pricing',
      },
      { status: 402 },
    )
  }

  const db = await getD1(locals)
  const usage = await getUsage(db, auth.keyId)
  const callGate = checkApiCallLimit(tier, usage)
  if (!callGate.ok) return tierLimitResponse(callGate)
  void recordCall(db, auth.keyId)

  const body = (await request.json().catch(() => ({}))) as {
    targetUrl?: string
    targetWorld?: string
    name?: string
    apiKeyHint?: string
  }

  if (!body.targetUrl || !/^https?:\/\//.test(body.targetUrl)) {
    return Response.json({ error: 'targetUrl (https://...) required' }, { status: 400 })
  }

  const slug = slugFromUrl(body.targetUrl)
  const targetWorld = body.targetWorld ?? `world:${slug}`
  const name = body.name ?? slug
  const id = `fed_${auth.keyId}_${Date.now().toString(36)}`

  if (!db) {
    return Response.json({ error: 'database unavailable' }, { status: 503 })
  }

  try {
    await db
      .prepare(
        'INSERT INTO federations (id, source_uid, target_url, target_world, name, api_key_hint, status, created_at) ' +
          "VALUES (?, ?, ?, ?, ?, ?, 'active', unixepoch())",
      )
      .bind(id, auth.user, body.targetUrl, targetWorld, name, body.apiKeyHint ?? null)
      .run()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: `federation record failed: ${msg}` }, { status: 500 })
  }

  // Emit the federation:connect signal so pheromone learns which bridges get opened.
  // Fire-and-forget; never blocks the response.
  void fetch(new URL('/api/signal', request.url).toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: request.headers.get('Authorization') ?? '',
    },
    body: JSON.stringify({
      sender: auth.user,
      receiver: `federation:${slug}`,
      data: { tags: ['federation', 'connect'], content: { targetUrl: body.targetUrl, targetWorld } },
    }),
  }).catch(() => {
    /* signal emission is best-effort */
  })

  return Response.json({
    ok: true,
    id,
    source: auth.user,
    target: {
      url: body.targetUrl,
      world: targetWorld,
      name,
    },
    status: 'active',
  })
}

/** GET /api/federation/connect — list a developer's active federations */
export const GET: APIRoute = async ({ request, locals }) => {
  const auth = await resolveUnitFromSession(request, locals)
  if (!auth.isValid) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const db = await getD1(locals)
  if (!db) {
    return Response.json({ federations: [] })
  }

  const rows = await db
    .prepare(
      'SELECT id, target_url, target_world, name, status, created_at FROM federations WHERE source_uid = ? AND status = ? ORDER BY created_at DESC',
    )
    .bind(auth.user, 'active')
    .all<{
      id: string
      target_url: string
      target_world: string
      name: string
      status: string
      created_at: number
    }>()

  return Response.json({ federations: rows?.results ?? [] })
}
