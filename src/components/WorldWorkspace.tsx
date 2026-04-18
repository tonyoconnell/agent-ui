/**
 * WORLD WORKSPACE — The ONE ontology made visible
 *
 * TypeDB → JSON → UI → Metaphor Skins
 *
 * Same data. Switchable lenses. Infinite clarity.
 */

import { useCallback, useEffect, useState } from 'react'
import { SkinSwitcher } from '@/components/controls/SkinSwitcher'
import { WorldGraph } from '@/components/graph/WorldGraph'
import { AgentCard } from '@/components/world/AgentCard'
import { OrgTree } from '@/components/world/OrgTree'
import { PersonaMenu } from '@/components/world/PersonaMenu'
import { TimeScrubber } from '@/components/world/TimeScrubber'
import { useSkin } from '@/contexts/SkinContext'
import type { Edge, World } from '@/engine'
import { createWorld } from '@/engine'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface ActorData {
  id: string
  name: string
  status: string
  actions: Record<string, unknown>
  envelopes: Array<{
    receiver: string
    receive: string
    payload: Record<string, unknown>
    callback?: {
      receiver: string
      receive: string
      payload: Record<string, unknown>
    }
  }>
}

interface WorldState {
  world: World
  actors: ActorData[]
  flows: Edge[]
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA LOADING
// ═══════════════════════════════════════════════════════════════════════════════

function assignEnvelopes(actors: ActorData[], envelopes: ActorData['envelopes'][0][]) {
  for (const env of envelopes) {
    const actor = actors.find((a) => a.id === env.receiver)
    if (actor) actor.envelopes.push(env)
    if (env.callback) assignEnvelopes(actors, [env.callback as ActorData['envelopes'][0]])
  }
}

async function fetchWithTimeout(url: string, timeout = 3000): Promise<Response | null> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(id)
    return res
  } catch {
    clearTimeout(id)
    return null
  }
}

async function loadWorld(): Promise<WorldState> {
  const net = createWorld()

  // Try live TypeDB data first (3s timeout)
  try {
    const stateRes = await fetchWithTimeout('/api/state', 3000)
    if (stateRes?.ok) {
      const stateData = (await stateRes.json()) as any
      if (stateData?.units?.length > 0) {
        const actors: ActorData[] = (stateData.units as Array<{ id: string; name: string; status: string }>).map(
          (u) => ({
            id: u.id,
            name: u.name,
            status: u.status,
            actions: {},
            envelopes: [],
          }),
        )

        actors.forEach((a) => {
          const u = net.add(a.id)
          for (const [name, result] of Object.entries(a.actions || {})) {
            u.on(name, () => result)
          }
        })

        for (const e of (stateData.edges || []) as Array<{ from: string; to: string; strength: number }>) {
          net.mark(`${e.from}→${e.to}`, e.strength)
        }

        return { world: net, actors, flows: net.highways(30) }
      }
    }
  } catch {
    // TypeDB not available — fall through to static JSON
  }

  // Fallback: static JSON
  try {
    const res = await fetchWithTimeout('/agents.json', 3000)
    if (!res) throw new Error('Timeout')
    const data = (await res.json()) as any
    const actors = data.agents as ActorData[]

    actors.forEach((a) => (a.envelopes = a.envelopes || []))
    assignEnvelopes(actors, data.envelopes)
    actors.forEach((a) => {
      const u = net.add(a.id)
      for (const [name, result] of Object.entries(a.actions || {})) {
        u.on(name, () => result)
      }
    })

    for (const env of data.envelopes) {
      net.signal({ receiver: env.receiver, data: env.payload }, env.receiver)
    }

    return { world: net, actors, flows: net.highways(30) }
  } catch {
    return { world: net, actors: [], flows: [] }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SKINNED STATS HEADER
// ═══════════════════════════════════════════════════════════════════════════════

function StatsHeader({ actors, flows }: { actors: ActorData[]; flows: Edge[] }) {
  const { skin, t } = useSkin()

  const openFlows = flows.filter((f) => f.strength >= 50).length
  const totalStrength = flows.reduce((sum, f) => sum + f.strength, 0)

  return (
    <div
      className="flex items-center justify-between px-6 py-3 border-b"
      style={{
        backgroundColor: skin.colors.surface,
        borderColor: `${skin.colors.primary}30`,
      }}
    >
      {/* Left: Nav + Stats */}
      <div className="flex items-center gap-6">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <a
            href="/"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Agents
          </a>
          <a
            href="/world"
            className="px-3 py-1.5 text-white text-sm font-medium rounded-lg"
            style={{ backgroundColor: skin.colors.primary }}
          >
            Graph
          </a>
          <a
            href="/chat"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Chat
          </a>
        </div>

        <div className="h-6 w-px bg-slate-700" />

        {/* World name */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">{skin.icons.group}</span>
          <span className="text-xl font-light text-white">{skin.name}</span>
        </div>

        <div className="h-6 w-px bg-slate-700" />

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <Stat icon={skin.icons.actor} label={`${t('actor')}s`} value={actors.length} color={skin.colors.primary} />
          <Stat icon={skin.icons.flow} label={`${t('flow')}s`} value={flows.length} color={skin.colors.secondary} />
          <Stat icon={skin.icons.open} label={t('open')} value={openFlows} color={skin.colors.success} />
          <Stat icon="Σ" label="strength" value={totalStrength.toFixed(0)} color={skin.colors.warning} />
        </div>
      </div>

      {/* Right: Persona Menu + Skin Switcher */}
      <div className="flex items-center gap-4">
        <PersonaMenu />
        <SkinSwitcher variant="icons" />
      </div>
    </div>
  )
}

function Stat({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg">{icon}</span>
      <span className="text-slate-500">{label}:</span>
      <span className="font-mono font-medium" style={{ color }}>
        {value}
      </span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN WORKSPACE (INNER)
// ═══════════════════════════════════════════════════════════════════════════════

function WorkspaceInner() {
  const { skin } = useSkin()
  const [world, setWorld] = useState<WorldState | null>(null)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    const attempt = () => {
      loadWorld().then((w) => {
        if (cancelled) return
        if (w.actors.length > 0) {
          setWorld(w)
        } else {
          // World still loading — retry in 2s
          timer = setTimeout(attempt, 2000)
        }
      })
    }
    attempt()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [])

  // Periodic decay
  useEffect(() => {
    if (!world) return
    const interval = setInterval(() => {
      world.world.fade(0.1)
      setWorld((prev) => (prev ? { ...prev, flows: world.world.highways(30) } : null))
    }, 5000)
    return () => clearInterval(interval)
  }, [world?.world, world])

  const _handleInject = useCallback(() => {
    if (!world) return
    // Fire chain-head signals; continuations run via .then() on each unit
    world.world.signal({ receiver: 'scout:observe', data: { source: 'manual', chain: 'market' } })
    world.world.signal({ receiver: 'forager:search', data: { source: 'onchain', chain: 'intelligence' } })
    world.world.signal({ receiver: 'soldier:validate', data: { signals: 'all', chain: 'defense' } })
    world.world.signal({ receiver: 'nurse:monitor', data: { colony: 'all', chain: 'care' } })
    world.world.signal({ receiver: 'scout:scan', data: { source: 'sentiment', chain: 'recon' } })
    setWorld((prev) => (prev ? { ...prev, flows: world.world.highways(30) } : null))
  }, [world])

  const _handleDecay = useCallback(() => {
    if (!world) return
    world.world.fade(0.2)
    setWorld((prev) => (prev ? { ...prev, flows: world.world.highways(30) } : null))
  }, [world])

  if (!world) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: skin.colors.background }}>
        <div className="flex items-center gap-3">
          <span className="text-3xl animate-pulse">{skin.icons.group}</span>
          <span className="text-slate-500">Loading {skin.name}...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: skin.colors.background }}>
      <StatsHeader actors={world.actors} flows={world.flows} />

      <div className="flex-1 flex min-h-0">
        {/* Left: Organization Tree */}
        <div
          className="w-64 border-r flex flex-col overflow-hidden"
          style={{ borderColor: `${skin.colors.primary}20` }}
        >
          <OrgTree className="flex-1 overflow-y-auto" />
        </div>

        {/* Center: Main graph */}
        <div className="flex-1 h-full flex flex-col">
          <div className="flex-1 h-full">
            <WorldGraph
              world={world.world}
              agents={world.actors}
              highways={world.flows}
              onSelectAgent={(id) => window.dispatchEvent(new CustomEvent('world:focus', { detail: { id } }))}
            />
          </div>

          {/* Time Scrubber at bottom */}
          <TimeScrubber />
        </div>

        {/* Right: Agent detail panel */}
        <div
          className="w-80 border-l flex flex-col overflow-hidden"
          style={{ borderColor: `${skin.colors.primary}20` }}
        >
          <AgentCard className="flex-1 overflow-y-auto" />
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTED COMPONENT (WITH PROVIDER)
// ═══════════════════════════════════════════════════════════════════════════════

export default function WorldWorkspace() {
  // SkinProvider is now at the page level via WorldPageWrapper
  return <WorkspaceInner />
}

// ═══════════════════════════════════════════════════════════════════════════════
// ~280 lines. ONE ontology. Many lenses.
// ═══════════════════════════════════════════════════════════════════════════════
