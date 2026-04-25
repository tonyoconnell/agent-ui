import type { APIRoute } from 'astro'
import { resolveUnitFromSession } from '@/lib/api-auth'
import { getD1 } from '@/lib/cf-env'
import { getUsage, recordCall } from '@/lib/metering'
import { checkApiCallLimit, tierAllows, tierLimitResponse } from '@/lib/tier-limits'

export const prerender = false

export const POST: APIRoute = async ({ request, locals }) => {
  const auth = await resolveUnitFromSession(request, locals)
  if (!auth.isValid) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const tier = auth.tier ?? 'free'
  if (!tierAllows(tier, 'hostedWebhooks')) {
    return Response.json(
      {
        error: `custom domains require Scale tier or above — current: ${tier}`,
        tier,
        required: 'scale',
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

  const body = (await request.json().catch(() => ({}))) as { hostname?: string }
  if (!body.hostname || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(body.hostname)) {
    return Response.json({ error: 'valid hostname required (e.g. tutor.example.com)' }, { status: 400 })
  }

  const hostname = body.hostname.toLowerCase()
  const id = `dom_${auth.keyId}_${Date.now().toString(36)}`

  if (!db) return Response.json({ error: 'database unavailable' }, { status: 503 })

  // CF for SaaS: create custom hostname via CF API (fire if env vars present)
  let cfHostnameId: string | null = null
  const cfApiKey =
    typeof process !== 'undefined' && process.env?.CLOUDFLARE_GLOBAL_API_KEY
      ? process.env.CLOUDFLARE_GLOBAL_API_KEY
      : undefined
  const cfEmail =
    typeof process !== 'undefined' && process.env?.CLOUDFLARE_EMAIL ? process.env.CLOUDFLARE_EMAIL : undefined
  const cfZoneId = typeof process !== 'undefined' && process.env?.CF_ZONE_ID ? process.env.CF_ZONE_ID : undefined
  if (cfApiKey && cfEmail && cfZoneId) {
    try {
      const cfRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${cfZoneId}/custom_hostnames`, {
        method: 'POST',
        headers: { 'X-Auth-Email': cfEmail, 'X-Auth-Key': cfApiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostname, ssl: { method: 'http', type: 'dv', settings: { min_tls_version: '1.2' } } }),
      })
      const cfData = (await cfRes.json()) as { result?: { id?: string } }
      cfHostnameId = cfData.result?.id ?? null
    } catch {
      // CF API optional — proceed without it
    }
  }

  try {
    await db
      .prepare('INSERT INTO developer_domains (id, key_id, uid, hostname, cf_hostname_id) VALUES (?, ?, ?, ?, ?)')
      .bind(id, auth.keyId, auth.user, hostname, cfHostnameId)
      .run()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('UNIQUE constraint')) {
      return Response.json({ error: 'hostname already registered' }, { status: 409 })
    }
    return Response.json({ error: `domain record failed: ${msg}` }, { status: 500 })
  }

  return Response.json({ ok: true, id, hostname, cfHostnameId, sslStatus: 'pending' })
}
