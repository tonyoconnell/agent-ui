'use client'

import { useEffect, useState } from 'react'
import { SkinSwitcher } from '@/components/controls/SkinSwitcher'
import { LoopsPanel } from '@/components/speed/LoopsPanel'
import { PathAnimator } from '@/components/speed/PathAnimator'
import { RunItBlock } from '@/components/speed/RunItBlock'
import { SandwichStack } from '@/components/speed/SandwichStack'
import { SignalStrip } from '@/components/speed/SignalStrip'
import { Stop } from '@/components/speed/Stop'
import { SkinProvider, useSkin } from '@/contexts/SkinContext'
import { emitClick } from '@/lib/ui-signal'

export function SpeedJourney() {
  return (
    <SkinProvider initialSkin="signal">
      <SpeedJourneyContent />
    </SkinProvider>
  )
}

function SpeedJourneyContent() {
  const [lastMs, setLastMs] = useState<number | null>(null)
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const [speedMult, setSpeedMult] = useState(1)
  const { setSkin, t, skinId } = useSkin()

  // URL param sync on mount: ?skin=ant&step=3&speed=50
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const skin = params.get('skin')
    const step = params.get('step')
    const speed = params.get('speed')

    if (skin) setSkin(skin)

    if (speed) {
      const n = Number(speed)
      if (!Number.isNaN(n) && n > 0) setSpeedMult(1 / n)
    }

    if (step) {
      const n = Number(step)
      if (!Number.isNaN(n) && n >= 0 && n <= 8) {
        setActiveStep(n)
        setTimeout(() => {
          document.getElementById(`stop-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 150)
      }
    }
  }, [setSkin])

  // Skin-aware action labels. In 'signal' skin these stay canonical.
  const markVerb = t('strengthen') // mark | deposit | potentiate | commend | boost
  const warnVerb = t('weaken') // naming:allow — metaphor alias list (ant=alarm, brain=inhibit)

  return (
    <div className="space-y-8">
      {/* Skin switcher */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-slate-500">
          Same mechanics. Different metaphor. Current lens: <span className="text-slate-400 font-mono">{skinId}</span>
        </p>
        <SkinSwitcher variant="compact" />
      </div>

      {/* Signal strip — the interactive journey */}
      <SignalStrip
        onJourneyComplete={(ms) => {
          setLastMs(ms)
          emitClick('ui:speed:complete')
        }}
      />

      {/* 9 stops — detailed panels for each step of the journey */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-200">The 9 Stops</h2>

        {/* Outbound */}
        <Stop
          step={0}
          id="stop-0"
          active={activeStep === 0}
          title="The click"
          vocab={['signal', 'receiver', 'emit']}
          liveNumber="<0.1ms"
          code={`net.signal({ receiver: 'demo:route' })`}
        >
          <p>Every action in ONE starts as a signal. This is the primitive.</p>
        </Stop>

        <Stop
          step={1}
          id="stop-1"
          active={activeStep === 1}
          title="The edge"
          vocab={['edge', 'gateway', 'KV cache']}
          liveNumber="<10ms"
        >
          <p>Signal lands at the nearest Cloudflare edge. No origin round-trip.</p>
          <RunItBlock
            command={`curl -w "%{time_starttransfer}" https://api.one.ie/health`}
            description="Measure the edge yourself:"
          />
        </Stop>

        <Stop
          step={2}
          id="stop-2"
          active={activeStep === 2}
          title="Route: the formula"
          vocab={['strength', 'resistance', 'select', 'follow', 'weight', 'sensitivity']}
          liveNumber="<0.005ms"
          code={`weight = 1 + max(0, strength - resistance) * sensitivity\nconst next = net.select()`}
        >
          <p>Routing is math. Not ML. Not a coordinator. Just arithmetic.</p>
        </Stop>

        <Stop
          step={3}
          id="stop-3"
          active={activeStep === 3}
          title="The sandwich"
          vocab={['sandwich', 'ADL', 'toxic', 'capability', markVerb, warnVerb]}
          liveNumber="<1ms"
        >
          <p>Four checks. Each cheaper than a database lookup. Only one costs money.</p>
          <SandwichStack />
        </Stop>

        <Stop
          step={4}
          id="stop-4"
          active={activeStep === 4}
          title="LLM: the slow part"
          vocab={['LLM', 'task', 'generation']}
          liveNumber="~1,500ms"
          code={`// the one probabilistic step\nconst result = await llm.ask(prompt)`}
        >
          <p>Everyone's LLM is slow. Ours is the same speed. The difference is everything around it.</p>
        </Stop>

        <Stop
          step={5}
          id="stop-5"
          active={activeStep === 5}
          title={`${markVerb === 'mark' ? 'Mark' : markVerb.charAt(0).toUpperCase() + markVerb.slice(1)}: feedback starts`}
          vocab={[markVerb, warnVerb, 'chain depth', 'outcome', 'closed loop', 'pheromone']}
          liveNumber="<0.001ms"
        >
          <p>The signal closed its loop. Watch the feedback travel back.</p>
          <PathAnimator
            strengthBefore={2.0}
            strengthAfter={2.6}
            chainDepth={3}
            edge="demo → route"
            verb={markVerb}
            speedMult={speedMult}
          />
        </Stop>

        <Stop
          step={6}
          id="stop-6"
          active={activeStep === 6}
          title="The seven loops"
          vocab={['loop', 'tick', 'decay', 'hypothesis', 'frontier', 'evolution', 'know']}
          liveNumber="L1-L7"
        >
          <p>Your signal is already in two loops. Five more will find it.</p>
          <LoopsPanel />
        </Stop>

        <Stop
          step={7}
          id="stop-7"
          active={activeStep === 7}
          title="Highway: what emerges"
          vocab={['highway', 'follow', 'depth', 'cached', 'hardened']}
          liveNumber="strength>20"
        >
          <p>Fifty {markVerb}s. One highway. Seventeen times faster.</p>
          <RunItBlock command="curl https://dev.one.ie/api/export/highways" description="See live proven paths:" />
        </Stop>

        <Stop
          step={8}
          id="stop-8"
          active={activeStep === 8}
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
        <h2 className="text-lg font-medium text-slate-100">Now run it yourself</h2>
        <div className="space-y-3">
          <RunItBlock command="bun vitest run routing.test.ts" description="Run the routing benchmarks:" />
          <RunItBlock command="curl https://api.one.ie/health" description="Check the gateway:" />
          <RunItBlock command="curl https://dev.one.ie/api/export/highways" description="See live proven paths:" />
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
