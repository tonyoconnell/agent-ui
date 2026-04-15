/**
 * GET  /api/market/bundle/:id          — resolve bundle skill + contained paths (step-ordered)
 * POST /api/market/bundle/:id/activate — emit signal to bundle receiver, cascade via .then()
 *
 * :id  — bundle skill-id suffix, e.g. "scout:analyst" for bundle:scout:analyst
 *         OR URL-encoded edge "scout%E2%86%92analyst" (decoded to "scout→analyst", → stripped)
 *
 * GET returns:
 *   {
 *     skillId, name, price, totalPrice,
 *     steps: [{ skillId, name, price, step }],  // sorted by step:N tag
 *     status: 'active' | 'toxic' | 'exploratory'
 *   }
 *
 * POST /activate returns:
 *   { ok: true, receiver: string, data?: unknown }
 *
 * Error: 404 { error: string }
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

export type BundleStep = {
  skillId: string
  name: string
  price: number
  step: number
}

export type BundleDetail = {
  skillId: string
  name: string
  price: number
  steps: BundleStep[]
  totalPrice: number
  status: 'active' | 'toxic' | 'exploratory'
}

/** Normalise :id param to a bundle skill-id like "bundle:scout:analyst" */
function parseBundleId(raw: string): string | null {
  const decoded = decodeURIComponent(raw)
  // Already prefixed
  if (decoded.startsWith('bundle:')) return decoded
  // Edge format "from→to" or "from->to"
  const sep = decoded.includes('→') ? '→' : decoded.includes('->') ? '->' : null
  if (sep) {
    const parts = decoded.split(sep).map((p) => p.trim())
    if (parts.length === 2 && parts[0] && parts[1]) return `bundle:${parts[0]}:${parts[1]}`
  }
  // Bare "from:to" suffix
  if (/^[\w.-]+:[\w.-]+$/.test(decoded)) return `bundle:${decoded}`
  return null
}

/** Parse step number from tags like ["contains", "step:3"] → 3, default 0 */
function parseStep(tags: string[]): number {
  const stepTag = tags.find((t) => t.startsWith('step:'))
  return stepTag ? parseInt(stepTag.slice(5), 10) || 0 : 0
}

export const GET: APIRoute = async ({ params }) => {
  const bundleId = parseBundleId(params.id ?? '')
  if (!bundleId) {
    return Response.json({ error: `Invalid bundle id: "${params.id}"` }, { status: 404 })
  }

  // Sanitise
  if (!/^[\w:.-]+$/.test(bundleId)) {
    return Response.json({ error: 'Invalid characters in bundle id.' }, { status: 404 })
  }

  try {
    // 1. Resolve the bundle skill entity
    const bundleRows = await readParsed(`
      match
        $s isa skill, has skill-id "${bundleId}", has name $n, has price $p;
      select $n, $p;
    `)

    if (!bundleRows.length) {
      return Response.json({ error: `Bundle not found: "${bundleId}"` }, { status: 404 })
    }

    const bundleName = bundleRows[0].n as string
    const bundlePrice = bundleRows[0].p as number

    // 2. Query contained paths: path(source: bundle-skill, target: component-skill, tag:["contains","step:N"])
    const stepRows = await readParsed(`
      match
        $bundle isa skill, has skill-id "${bundleId}";
        (source: $bundle, target: $comp) isa path, has tag $tag;
        $comp isa skill, has skill-id $csid, has name $cname, has price $cp;
      select $csid, $cname, $cp, $tag;
    `).catch(() => [] as Record<string, unknown>[])

    // Group tags by component skill-id to reconstruct step ordering
    const stepMap = new Map<string, { name: string; price: number; tags: string[] }>()
    for (const r of stepRows) {
      const sid = r.csid as string
      const tag = r.tag as string
      if (!stepMap.has(sid)) {
        stepMap.set(sid, { name: r.cname as string, price: r.cp as number, tags: [] })
      }
      stepMap.get(sid)!.tags.push(tag)
    }

    const steps: BundleStep[] = Array.from(stepMap.entries())
      .map(([skillId, { name, price, tags }]) => ({
        skillId,
        name,
        price,
        step: parseStep(tags),
      }))
      .filter((s) => s.step > 0 || stepMap.size > 0) // include all if no step tags
      .sort((a, b) => a.step - b.step)

    const totalPrice = steps.reduce((sum, s) => sum + s.price, 0)

    // Derive status from bundle path strength (source=bundle, aggregate)
    const strengthRows = await readParsed(`
      match
        $bundle isa skill, has skill-id "${bundleId}";
        (source: $bundle) isa path, has strength $str, has resistance $r;
      select $str, $r;
    `).catch(() => [] as Record<string, unknown>[])

    let status: BundleDetail['status'] = 'exploratory'
    if (strengthRows.length) {
      const str = strengthRows[0].str as number
      const res = (strengthRows[0].r as number) ?? 0
      if (res >= 10 && res > str * 2 && str + res > 5) status = 'toxic'
      else if (str > 0 || res > 0) status = 'active'
    }

    const detail: BundleDetail = {
      skillId: bundleId,
      name: bundleName,
      price: bundlePrice,
      steps,
      totalPrice: Math.round(totalPrice * 10000) / 10000,
      status,
    }

    return Response.json(detail, {
      headers: { 'Cache-Control': 'public, max-age=10' },
    })
  } catch {
    return Response.json({ error: `Failed to resolve bundle: "${bundleId}"` }, { status: 500 })
  }
}

/**
 * POST /api/market/bundle/:id/activate
 *
 * Emits a signal with receiver = bundleId (e.g. "bundle:scout:analyst").
 * The substrate routes to the first contained path; cascade runs via .then() continuations
 * on the providing units — the bundle is a facade.
 *
 * Body (optional): { data?: unknown }
 */
export const POST: APIRoute = async ({ params, request }) => {
  // Only handle /activate sub-path (Astro catches all POSTs to this route)
  const url = new URL(request.url)
  if (!url.pathname.endsWith('/activate')) {
    return Response.json({ error: 'Use POST /activate to trigger a bundle' }, { status: 405 })
  }

  const bundleId = parseBundleId(params.id ?? '')
  if (!bundleId) {
    return Response.json({ error: `Invalid bundle id: "${params.id}"` }, { status: 404 })
  }
  if (!/^[\w:.-]+$/.test(bundleId)) {
    return Response.json({ error: 'Invalid characters in bundle id.' }, { status: 404 })
  }

  let body: { data?: unknown } = {}
  try {
    body = (await request.json()) as { data?: unknown }
  } catch {
    // body is optional
  }

  try {
    // Emit to /api/signal — the substrate handles routing + pheromone
    const origin = url.origin
    const res = await fetch(`${origin}/api/signal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiver: bundleId, data: body.data ?? {} }),
    })

    if (!res.ok) {
      const err = await res.text()
      return Response.json({ error: `Signal emit failed: ${err}` }, { status: 502 })
    }

    return Response.json({ ok: true, receiver: bundleId, data: body.data ?? {} })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
