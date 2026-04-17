'use client'

import { useState } from 'react'
import { SignalStrip } from '@/components/speed/SignalStrip'
import { Stop } from '@/components/speed/Stop'
import { emitClick } from '@/lib/ui-signal'

// ── Component ────────────────────────────────────────────────────────────────

export function SpeedJourney() {
  const [lastMs, setLastMs] = useState<number | null>(null)

  return (
    <div className="space-y-8">
      {/* Signal strip — the interactive journey */}
      <SignalStrip
        onJourneyComplete={(ms) => {
          setLastMs(ms)
          emitClick('ui:speed:complete')
        }}
      />

      {/* 9 stops — static shells for Cycle 1 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-200">The 9 Stops</h3>

        {/* Outbound */}
        <Stop
          step={0}
          title="The click"
          vocab={['signal', 'receiver', 'emit']}
          liveNumber="<0.1ms"
          code={`net.signal({ receiver: 'demo:route' })`}
        >
          <p>Every action in ONE starts as a signal. This is the primitive.</p>
        </Stop>

        <Stop
          step={1}
          title="The edge"
          vocab={['edge', 'gateway', 'KV cache']}
          liveNumber="<10ms"
          code={`curl -w "%{time_starttransfer}" https://api.one.ie/health`}
        >
          <p>Signal lands at the nearest Cloudflare edge. No origin round-trip.</p>
        </Stop>

        <Stop
          step={2}
          title="Route: the formula"
          vocab={['strength', 'resistance', 'select', 'follow', 'weight', 'sensitivity']}
          liveNumber="<0.005ms"
          code={`weight = 1 + max(0, strength - resistance) * sensitivity\nconst next = net.select()`}
        >
          <p>Routing is math. Not ML. Not a coordinator. Just arithmetic.</p>
        </Stop>

        <Stop
          step={3}
          title="The sandwich"
          vocab={['sandwich', 'ADL', 'toxic', 'capability', 'mark', 'warn']}
          liveNumber="<1ms"
          code={`ADL gate   → cache hit, <1ms\nisToxic?   → 3 compares, <0.001ms\ncapability → 1 lookup, <1ms\nLLM        → 1,500ms (physics)\nmark/warn  → <0.001ms`}
        >
          <p>4 of 5 layers are deterministic and free. The LLM is the only cost.</p>
        </Stop>

        <Stop
          step={4}
          title="LLM: the slow part"
          vocab={['LLM', 'task', 'generation']}
          liveNumber="~1,500ms"
          code={`// the one probabilistic step\nconst result = await llm.ask(prompt)`}
        >
          <p>Everyone's LLM is slow. Ours is the same speed. The difference is everything around it.</p>
        </Stop>

        {/* Return trip */}
        <div className="flex items-center gap-3 py-2">
          <span className="flex-1 border-t border-dashed border-slate-600" />
          <span className="text-xs text-amber-400 font-mono">return trip</span>
          <span className="flex-1 border-t border-dashed border-slate-600" />
        </div>

        <Stop
          step={5}
          title="Mark: feedback starts"
          vocab={['mark', 'warn', 'chain depth', 'outcome', 'closed loop', 'pheromone']}
          liveNumber="<0.001ms"
          code={`if (result)        net.mark(edge, chainDepth)\nelse if (timeout)  /* neutral */\nelse if (dissolved) net.warn(edge, 0.5)\nelse               net.warn(edge, 1)`}
        >
          <p>ONE does not train. It deposits math on an edge. The edge remembers.</p>
        </Stop>

        <Stop
          step={6}
          title="The seven loops"
          vocab={['loop', 'tick', 'decay', 'hypothesis', 'frontier', 'evolution', 'know']}
          liveNumber="L1-L7"
          code={`L1 SIGNAL     per signal      route, ask, outcome\nL2 TRAIL      per outcome     strength/resistance updates\nL3 FADE       every 5 min     asymmetric decay\nL4 ECONOMIC   per payment     revenue on paths\nL5 EVOLUTION  every 10 min    rewrite failing prompts\nL6 KNOWLEDGE  every hour      promote highways\nL7 FRONTIER   every hour      detect unexplored clusters`}
        >
          <p>ONE is not one loop. It is seven, each at its own timescale.</p>
        </Stop>

        <Stop
          step={7}
          title="Highway: what emerges"
          vocab={['highway', 'follow', 'depth', 'cached', 'hardened']}
          liveNumber="strength>20"
          code={`curl /api/export/highways → top 5 proven paths`}
        >
          <p>Highways are auto-cached behavior. Nobody wrote them. Nobody trained them. 50 marks did.</p>
        </Stop>

        <Stop
          step={8}
          title="Harden: Sui proof"
          vocab={['harden', 'highway', 'Sui']}
          liveNumber="4.25s"
          code={`// highway → on-chain, immutable\n// other agents can license the proven path`}
        >
          <p>Highways harden into tradable IP. One agent's knowledge becomes another's.</p>
        </Stop>
      </div>

      {/* Outro */}
      <div className="rounded-lg bg-[#161622] border border-[#252538] p-5 space-y-3">
        <h3 className="text-lg font-medium text-slate-100">Now run it yourself</h3>
        <div className="space-y-2">
          <pre className="text-xs font-mono p-3 rounded-md bg-[#0a0a0f] text-slate-400 border border-slate-800 overflow-x-auto">
            <code>{`bun vitest run routing.test.ts   # 54/54 in <200ms\ncurl api.one.ie/health           # 292ms p50\ncurl .../api/export/highways     # live JSON`}</code>
          </pre>
        </div>
        {lastMs !== null && (
          <p className="text-sm text-slate-400">
            Your last signal completed in <span className="text-cyan-400 font-mono">{lastMs.toFixed(1)}ms</span>.
          </p>
        )}
      </div>
    </div>
  )
}
