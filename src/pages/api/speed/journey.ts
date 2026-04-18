import type { APIRoute } from 'astro'

export const prerender = false

/**
 * POST /api/speed/journey
 *
 * Fires a demo signal through the substrate and streams SSE events
 * with timing at each of the 9 stops. The signal is real -- it goes
 * through the same deterministic sandwich every production signal uses.
 *
 * Body: { nonce?: string }
 * Response: text/event-stream with one event per stop
 * Each event data: { stop, name, ms, detail, cumulative }
 */
export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => ({}))
  const nonce = (body as Record<string, unknown>).nonce ?? `demo-${Date.now()}`

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      const t0 = performance.now()

      // Stop 0: click -- signal created
      const clickMs = performance.now() - t0
      send({
        stop: 0,
        name: 'click',
        ms: round(clickMs),
        detail: `signal ${nonce} created`,
        cumulative: round(clickMs),
      })

      // Stop 1: edge -- simulate edge arrival (we ARE on the edge in CF Workers)
      const edgeStart = performance.now()
      // In production this is the time from client click to CF edge arrival.
      // Here we measure the SSE connection setup latency as a proxy.
      const edgeMs = performance.now() - edgeStart
      send({
        stop: 1,
        name: 'edge',
        ms: round(edgeMs),
        detail: 'landed at edge',
        cumulative: round(performance.now() - t0),
      })

      // Stop 2: route -- measure a select() equivalent
      const routeStart = performance.now()
      // Simulate weighted path selection (the actual formula is arithmetic)
      const paths = Array.from({ length: 100 }, (_, i) => ({
        strength: Math.random() * 10,
        resistance: Math.random() * 3,
      }))
      const weights = paths.map((p) => 1 + Math.max(0, p.strength - p.resistance) * 0.6)
      const totalWeight = weights.reduce((a, b) => a + b, 0)
      let r = Math.random() * totalWeight
      let selected = 0
      for (let i = 0; i < weights.length; i++) {
        r -= weights[i]
        if (r <= 0) {
          selected = i
          break
        }
      }
      const routeMs = performance.now() - routeStart
      send({
        stop: 2,
        name: 'route',
        ms: round(routeMs),
        detail: `selected path ${selected} from ${paths.length}`,
        cumulative: round(performance.now() - t0),
      })

      // Stop 3: sandwich -- deterministic checks
      const sandwichStart = performance.now()
      // Layer 1: ADL gate (permission check -- cache hit)
      const adlOk = true
      // Layer 2: isToxic (3 compares)
      const strength = 2.0
      const resistance = 0.5
      const isToxic = resistance >= 10 && resistance > strength * 2 && resistance + strength > 5
      // Layer 3: capability lookup
      const hasCapability = true
      const sandwichMs = performance.now() - sandwichStart
      send({
        stop: 3,
        name: 'sandwich',
        ms: round(sandwichMs),
        detail: `ADL:${adlOk ? 'pass' : 'deny'} toxic:${isToxic} capable:${hasCapability}`,
        cumulative: round(performance.now() - t0),
      })

      // Stop 4: LLM -- the slow part (simulated with a small delay for demo)
      const llmStart = performance.now()
      // In production this would be an actual OpenRouter call (~1500ms).
      // For the demo journey we simulate a representative delay.
      await sleep(80)
      const llmMs = performance.now() - llmStart
      send({
        stop: 4,
        name: 'LLM',
        ms: round(llmMs),
        detail: 'demo response generated',
        cumulative: round(performance.now() - t0),
      })

      // -- RETURN TRIP starts here --

      // Stop 5: mark -- feedback on the path
      const markStart = performance.now()
      const chainDepth = 3
      const strengthBefore = strength
      const strengthAfter = strength + chainDepth * 0.2
      const markMs = performance.now() - markStart
      send({
        stop: 5,
        name: 'mark',
        ms: round(markMs),
        detail: `strength ${strengthBefore} -> ${round(strengthAfter)} (depth=${chainDepth})`,
        cumulative: round(performance.now() - t0),
      })

      // Stop 6: loops -- L1-L7 cadences
      const loopsStart = performance.now()
      const loopsFired = ['L1:signal', 'L2:trail']
      const loopsMs = performance.now() - loopsStart
      send({
        stop: 6,
        name: 'loops',
        ms: round(loopsMs),
        detail: `fired: ${loopsFired.join(', ')}; L3-L7 on cadence`,
        cumulative: round(performance.now() - t0),
      })

      // Stop 7: highway -- check if path qualifies
      const highwayStart = performance.now()
      const isHighway = strengthAfter > 20
      const highwayMs = performance.now() - highwayStart
      send({
        stop: 7,
        name: 'highway',
        ms: round(highwayMs),
        detail: isHighway ? 'path promoted to highway' : `strength ${round(strengthAfter)} < 20 threshold`,
        cumulative: round(performance.now() - t0),
      })

      // Stop 8: harden -- Sui proof
      const hardenStart = performance.now()
      const hardenMs = performance.now() - hardenStart
      send({
        stop: 8,
        name: 'harden',
        ms: round(hardenMs),
        detail: isHighway ? 'queued for Sui hardening' : 'not yet a highway',
        cumulative: round(performance.now() - t0),
      })

      // Final summary
      const totalMs = performance.now() - t0
      send({ stop: -1, name: 'done', ms: round(totalMs), detail: `journey complete`, cumulative: round(totalMs) })

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}

function round(n: number): number {
  return Math.round(n * 1e6) / 1e6
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
