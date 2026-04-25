/**
 * POST /api/agents/deploy — BaaS hosted deploy
 *
 * Accepts agent markdown + API key. Parses → syncAgent → returns uid + webhookUrl + suiAddress.
 * Returns 402 if developer's tier doesn't include hostedWebhooks (Scale+).
 *
 * CLI: oneie deploy --hosted agent.md
 */
import type { APIRoute } from 'astro'
import { resolveUnitFromSession } from '@/lib/api-auth'
import { tierAllows } from '@/lib/tier-limits'

export const prerender = false

export const POST: APIRoute = async ({ request, locals }) => {
  const auth = await resolveUnitFromSession(request, locals).catch(() => null)
  if (!auth?.isValid) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const tier = auth.tier ?? 'free'
  if (!tierAllows(tier, 'hostedWebhooks')) {
    return Response.json(
      {
        error: `hosted deploy requires Scale+ tier — current: ${tier}`,
        upgradeUrl: 'https://one.ie/pricing',
      },
      { status: 402 },
    )
  }

  const body = (await request.json().catch(() => ({}))) as { markdown?: string }
  if (!body.markdown) {
    return Response.json({ error: 'markdown required' }, { status: 400 })
  }

  try {
    const { parse, syncAgent } = await import('@/engine/agent-md')
    const spec = parse(body.markdown)
    await syncAgent(spec)

    const uid = `${spec.group ? `${spec.group}:` : ''}${spec.name}`
    const suiAddress = ''
    const webhookUrl = `https://nanoclaw.oneie.workers.dev/webhook/telegram?agent=${encodeURIComponent(uid)}`

    return Response.json(
      {
        ok: true,
        uid,
        webhookUrl,
        suiAddress: suiAddress || null,
      },
      { status: 201 },
    )
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'deploy failed'
    return Response.json({ error: msg }, { status: 500 })
  }
}
