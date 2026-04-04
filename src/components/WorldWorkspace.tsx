/**
 * WORLD WORKSPACE — The ONE ontology made visible
 *
 * TypeDB → JSON → UI → Metaphor Skins
 *
 * Same data. Switchable lenses. Infinite clarity.
 */

import { useEffect, useState, useCallback } from "react"
import { colony } from "@/engine"
import type { Colony, Edge } from "@/engine"
import { cn } from "@/lib/utils"
import { MetaphorProvider, useMetaphor } from "@/contexts/MetaphorContext"
import { SkinSwitcher } from "@/components/controls/SkinSwitcher"
import { WorldGraph } from "@/components/graph/WorldGraph"

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
  colony: Colony
  actors: ActorData[]
  flows: Edge[]
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA LOADING
// ═══════════════════════════════════════════════════════════════════════════════

function assignEnvelopes(actors: ActorData[], envelopes: ActorData["envelopes"][0][]) {
  for (const env of envelopes) {
    const actor = actors.find((a) => a.id === env.receiver)
    if (actor) actor.envelopes.push(env)
    if (env.callback) assignEnvelopes(actors, [env.callback as ActorData["envelopes"][0]])
  }
}

async function loadWorld(): Promise<WorldState> {
  const res = await fetch("/agents.json")
  const data = await res.json()

  const net = colony()
  const actors = data.agents as ActorData[]

  actors.forEach((a) => (a.envelopes = a.envelopes || []))
  assignEnvelopes(actors, data.envelopes)
  actors.forEach((a) => net.spawnFromJSON(a))

  for (const env of data.envelopes) {
    await net.send(env)
  }

  return { colony: net, actors, flows: net.highways(30) }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SKINNED STATS HEADER
// ═══════════════════════════════════════════════════════════════════════════════

function StatsHeader({ actors, flows }: { actors: ActorData[]; flows: Edge[] }) {
  const { skin, t } = useMetaphor()

  const openFlows = flows.filter((f) => f.strength >= 50).length
  const totalStrength = flows.reduce((sum, f) => sum + f.strength, 0)

  return (
    <div
      className="flex items-center justify-between px-6 py-3 border-b"
      style={{
        backgroundColor: skin.colors.surface,
        borderColor: skin.colors.primary + "30",
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
          <Stat icon={skin.icons.actor} label={`${t("actor")}s`} value={actors.length} color={skin.colors.primary} />
          <Stat icon={skin.icons.flow} label={`${t("flow")}s`} value={flows.length} color={skin.colors.secondary} />
          <Stat icon={skin.icons.open} label={t("open")} value={openFlows} color={skin.colors.success} />
          <Stat icon="Σ" label="strength" value={totalStrength.toFixed(0)} color={skin.colors.warning} />
        </div>
      </div>

      {/* Right: Skin Switcher */}
      <SkinSwitcher variant="icons" />
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
// SKINNED FLOW PANEL
// ═══════════════════════════════════════════════════════════════════════════════

function FlowPanel({ flows }: { flows: Edge[] }) {
  const { skin, t } = useMetaphor()

  const openFlows = flows.filter((f) => f.strength >= 50)
  const closingFlows = flows.filter((f) => f.strength > 0 && f.strength < 5)

  return (
    <div
      className="rounded-xl p-4 border"
      style={{
        backgroundColor: skin.colors.surface,
        borderColor: skin.colors.primary + "30",
      }}
    >
      <h3 className="text-sm uppercase mb-3" style={{ color: skin.colors.primary }}>
        {skin.icons.open} {t("open")} {t("flow")}s
      </h3>

      <div className="space-y-2">
        {openFlows.map(({ path, strength }) => (
          <div key={path} className="flex items-center gap-3">
            <div className="flex-1">
              <code className="text-xs text-slate-400">{path}</code>
            </div>
            <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: skin.colors.muted + "30" }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.min(strength, 100)}%`, backgroundColor: skin.colors.success }}
              />
            </div>
            <span className="text-xs font-mono w-8 text-right" style={{ color: skin.colors.success }}>
              {strength.toFixed(0)}
            </span>
          </div>
        ))}

        {openFlows.length === 0 && <div className="text-xs text-slate-600">No {t("open")} {t("flow")}s yet</div>}
      </div>

      {closingFlows.length > 0 && (
        <>
          <h3 className="text-sm uppercase mt-4 mb-2" style={{ color: skin.colors.warning }}>
            {t("closing")}
          </h3>
          <div className="space-y-1">
            {closingFlows.slice(0, 3).map(({ path, strength }) => (
              <div key={path} className="flex items-center gap-2 text-xs">
                <code className="text-slate-500 flex-1 truncate">{path}</code>
                <span style={{ color: skin.colors.warning }}>{strength.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROL BUTTONS
// ═══════════════════════════════════════════════════════════════════════════════

function Controls({
  onInject,
  onDecay,
}: {
  onInject: () => void
  onDecay: () => void
}) {
  const { skin, t } = useMetaphor()

  return (
    <div className="space-y-2">
      <button
        onClick={onInject}
        className="w-full px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
        style={{
          backgroundColor: skin.colors.success + "20",
          color: skin.colors.success,
          borderColor: skin.colors.success + "50",
          borderWidth: 1,
        }}
      >
        {skin.icons.entry} {t("send")}
      </button>

      <button
        onClick={onDecay}
        className="w-full px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
        style={{
          backgroundColor: skin.colors.muted + "20",
          color: skin.colors.muted,
        }}
      >
        ⏱️ {t("decay")}
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN WORKSPACE (INNER)
// ═══════════════════════════════════════════════════════════════════════════════

function WorkspaceInner() {
  const { skin } = useMetaphor()
  const [world, setWorld] = useState<WorldState | null>(null)

  useEffect(() => {
    loadWorld().then(setWorld)
  }, [])

  // Periodic decay
  useEffect(() => {
    if (!world) return
    const interval = setInterval(() => {
      world.colony.fade(0.1)
      setWorld((prev) => (prev ? { ...prev, flows: world.colony.highways(30) } : null))
    }, 5000)
    return () => clearInterval(interval)
  }, [world?.colony])

  const handleInject = useCallback(async () => {
    if (!world) return
    // Fire all 5 parallel chains simultaneously
    await Promise.allSettled([
      // Market: scout → analyst → trader
      world.colony.send({
        receiver: "scout", receive: "observe",
        payload: { source: "manual", chain: "market" },
        callback: { receiver: "analyst", receive: "evaluate", payload: { data: "{{result}}" },
          callback: { receiver: "trader", receive: "execute", payload: { signal: "{{result}}" } } }
      }),
      // Intelligence: forager → relay → queen
      world.colony.send({
        receiver: "forager", receive: "search",
        payload: { source: "onchain", chain: "intelligence" },
        callback: { receiver: "relay", receive: "broadcast", payload: { patterns: "{{result}}" },
          callback: { receiver: "queen", receive: "orchestrate", payload: { intel: "{{result}}" } } }
      }),
      // Defense: soldier → sentinel
      world.colony.send({
        receiver: "soldier", receive: "validate",
        payload: { signals: "all", chain: "defense" },
        callback: { receiver: "sentinel", receive: "risk", payload: { validated: "{{result}}" } }
      }),
      // Care: nurse monitors colony
      world.colony.send({
        receiver: "nurse", receive: "monitor",
        payload: { colony: "all", chain: "care" },
        callback: { receiver: "nurse", receive: "heal", payload: { unhealthy: "{{result}}" } }
      }),
      // Recon: scout → forager → queen
      world.colony.send({
        receiver: "scout", receive: "scan",
        payload: { source: "sentiment", chain: "recon" },
        callback: { receiver: "forager", receive: "harvest", payload: { regions: "{{result}}" },
          callback: { receiver: "queen", receive: "crystallize", payload: { patterns: "{{result}}" } } }
      }),
    ])
    setWorld((prev) => (prev ? { ...prev, flows: world.colony.highways(30) } : null))
  }, [world])

  const handleDecay = useCallback(() => {
    if (!world) return
    world.colony.fade(0.2)
    setWorld((prev) => (prev ? { ...prev, flows: world.colony.highways(30) } : null))
  }, [world])

  if (!world) {
    return (
      <div
        className="h-screen flex items-center justify-center"
        style={{ backgroundColor: skin.colors.background }}
      >
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
        {/* Main graph */}
        <div className="flex-1 h-full">
          <WorldGraph colony={world.colony} agents={world.actors} highways={world.flows} />
        </div>

        {/* Side panel */}
        <div
          className="w-72 p-4 border-l flex flex-col gap-4 overflow-y-auto"
          style={{ borderColor: skin.colors.primary + "20" }}
        >
          <FlowPanel flows={world.flows} />
          <Controls onInject={handleInject} onDecay={handleDecay} />

          <div className="mt-auto pt-4 border-t border-slate-800">
            <div className="text-xs text-slate-600 mb-2">Switch Metaphor</div>
            <SkinSwitcher variant="compact" className="w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTED COMPONENT (WITH PROVIDER)
// ═══════════════════════════════════════════════════════════════════════════════

export default function WorldWorkspace() {
  return (
    <MetaphorProvider initialSkin="team">
      <WorkspaceInner />
    </MetaphorProvider>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ~280 lines. ONE ontology. Many lenses.
// ═══════════════════════════════════════════════════════════════════════════════
