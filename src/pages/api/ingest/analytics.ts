/**
 * POST /api/ingest/analytics — Batched page events → mark/warn
 *
 * Body: { events: AnalyticsEvent[] }
 * Maps dwell/scroll/pageview → mark, bounce/rage-click/error → warn
 * Weights per ingestion.md Tier 3 taxonomy.
 */
import type { APIRoute } from 'astro'
import { getNet } from '@/lib/net'

type AnalyticsEvent = {
  type: 'pageview' | 'dwell' | 'scroll' | 'bounce' | 'rage-click' | 'error'
  page: string
  referrer?: string
  durationMs?: number
}

function classify(e: AnalyticsEvent): { weight: number; dir: 'mark' | 'warn' } | null {
  if (e.type === 'dwell') {
    const ms = e.durationMs ?? 0
    if (ms >= 120_000) return { weight: 0.7, dir: 'mark' }
    if (ms >= 30_000) return { weight: 0.3, dir: 'mark' }
    return null
  }
  const map: Record<string, { weight: number; dir: 'mark' | 'warn' }> = {
    pageview: { weight: 0.05, dir: 'mark' },
    scroll: { weight: 0.4, dir: 'mark' },
    bounce: { weight: 0.2, dir: 'warn' },
    'rage-click': { weight: 0.5, dir: 'warn' },
    error: { weight: 0.5, dir: 'warn' },
  }
  return map[e.type] ?? null
}

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json()) as { events?: AnalyticsEvent[] }
  if (!Array.isArray(body.events)) {
    return Response.json({ error: 'events array required' }, { status: 400 })
  }

  const net = await getNet()
  let marks = 0
  let warns = 0

  for (const event of body.events) {
    const from = (event.referrer ?? 'direct').slice(0, 255)
    const to = `page:${event.page}`.slice(0, 255)
    const edge = `${from}→${to}`
    const classification = classify(event)
    if (!classification) continue
    if (classification.dir === 'mark') {
      net.mark(edge, classification.weight)
      marks++
    } else {
      net.warn(edge, classification.weight)
      warns++
    }
  }

  return Response.json({ ok: true, edges: marks + warns, marks, warns })
}
