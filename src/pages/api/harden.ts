/**
 * POST /api/harden — Freeze proven highways to durable knowledge
 *
 * Calls know() to identify highways with strength ≥ 50, inserts confirmed
 * hypothesis entities in TypeDB, returns count of frozen highways.
 *
 * Returns: { highways_frozen: number, insights: Array<{ pattern, confidence }> }
 */
import type { APIRoute } from 'astro'
import { getNet } from '@/lib/net'
import { writeTracked } from '@/lib/typedb'

export const POST: APIRoute = async () => {
  const net = await getNet()
  const insights = await net.know()

  const nowIso = new Date().toISOString().replace('Z', '')
  const cycle = Date.now()
  let frozen = 0

  for (const i of insights.filter((i) => i.confidence >= 0.8)) {
    const ok = await writeTracked(`
      insert $h isa hypothesis, has hid "harden-${i.pattern.replace(/[→:]/g, '-')}-${cycle}",
        has statement "path ${i.pattern} is proven (confidence ${i.confidence.toFixed(2)})",
        has hypothesis-status "confirmed", has observations-count ${Math.round(i.confidence * 50)},
        has p-value 0.01, has source "observed", has observed-at ${nowIso};
    `)
    if (ok) frozen++
  }

  return new Response(JSON.stringify({ highways_frozen: frozen, insights }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
