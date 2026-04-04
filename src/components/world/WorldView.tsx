/**
 * WORLD VIEW — Chat + Graph + Metaphors
 *
 * The living interface for the ONE ontology.
 * Speak or type commands. Watch the world respond.
 */

import { useState, useCallback, useEffect } from "react"
import { colony } from "@/engine"
import type { Colony, Edge } from "@/engine"
import { MetaphorProvider, useMetaphor } from "@/contexts/MetaphorContext"
import { SkinSwitcher } from "@/components/controls/SkinSwitcher"
import { WorldGraph } from "@/components/graph/WorldGraph"
import { WorldChat } from "@/components/world/WorldChat"

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface ActorData {
  id: string
  name: string
  status: string
  actions: Record<string, unknown>
}

interface WorldState {
  colony: Colony
  actors: ActorData[]
  flows: Edge[]
}


// ═══════════════════════════════════════════════════════════════════════════════
// STATS BAR
// ═══════════════════════════════════════════════════════════════════════════════

function StatsBar({ actors, flows }: { actors: ActorData[]; flows: Edge[] }) {
  const { skin, t } = useMetaphor()
  const openFlows = flows.filter((f) => f.strength >= 50).length
  const totalStrength = flows.reduce((sum, f) => sum + f.strength, 0)

  return (
    <div
      className="flex items-center justify-between px-4 py-2 border-b"
      style={{
        backgroundColor: skin.colors.surface,
        borderColor: skin.colors.muted + "30",
      }}
    >
      {/* Left: Nav + Stats */}
      <div className="flex items-center gap-4">
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
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Graph
          </a>
          <a
            href="/chat"
            className="px-3 py-1.5 text-white text-sm font-medium rounded-lg"
            style={{ backgroundColor: skin.colors.primary }}
          >
            Chat
          </a>
        </div>

        <div className="h-5 w-px bg-slate-700" />

        {/* Stats */}
        <div className="flex items-center gap-3 text-sm">
          <span>
            {skin.icons.actor}{" "}
            <span style={{ color: skin.colors.primary }}>{actors.length}</span>
          </span>
          <span>
            {skin.icons.flow}{" "}
            <span style={{ color: skin.colors.secondary }}>{flows.length}</span>
          </span>
          <span>
            {skin.icons.open}{" "}
            <span style={{ color: skin.colors.success }}>{openFlows}</span>
          </span>
          <span>
            Σ <span style={{ color: skin.colors.warning }}>{totalStrength.toFixed(0)}</span>
          </span>
        </div>
      </div>

      {/* Right: Skin switcher */}
      <SkinSwitcher variant="icons" />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// WORLD VIEW INNER
// ═══════════════════════════════════════════════════════════════════════════════

function WorldViewInner() {
  const { skin } = useMetaphor()
  const [world, setWorld] = useState<WorldState | null>(null)

  // Initialize world
  useEffect(() => {
    const net = colony()

    // Spawn initial actors
    const actors: ActorData[] = [
      { id: "scout", name: "Scout", status: "ready", actions: { observe: {}, scan: {} } },
      { id: "analyst", name: "Analyst", status: "ready", actions: { evaluate: {} } },
      { id: "trader", name: "Trader", status: "ready", actions: { execute: {} } },
      { id: "forager", name: "Forager", status: "ready", actions: { search: {}, harvest: {} } },
      { id: "relay", name: "Relay", status: "ready", actions: { broadcast: {} } },
    ]

    actors.forEach((a) => net.spawnFromJSON(a))

    // Create initial flows
    net.send({ receiver: "scout", receive: "observe", payload: { init: true } })
    net.send({
      receiver: "scout",
      receive: "observe",
      payload: {},
      callback: { receiver: "analyst", receive: "evaluate", payload: {} },
    })

    setWorld({ colony: net, actors, flows: net.highways(30) })
  }, [])

  // Periodic decay
  useEffect(() => {
    if (!world) return
    const interval = setInterval(() => {
      world.colony.fade(0.05)
      setWorld((prev) =>
        prev ? { ...prev, flows: world.colony.highways(30) } : null
      )
    }, 3000)
    return () => clearInterval(interval)
  }, [world?.colony])

  // Update world state (called by WorldChat after commands)
  const handleWorldUpdate = useCallback(() => {
    if (!world) return
    setWorld((prev) =>
      prev ? { ...prev, flows: world.colony.highways(30) } : null
    )
  }, [world])

  if (!world) {
    return (
      <div
        className="h-screen flex items-center justify-center"
        style={{ backgroundColor: skin.colors.background }}
      >
        <span className="text-3xl animate-pulse">{skin.icons.group}</span>
      </div>
    )
  }

  return (
    <div
      className="h-screen flex flex-col"
      style={{ backgroundColor: skin.colors.background }}
    >
      <StatsBar actors={world.actors} flows={world.flows} />
      <div className="flex-1 flex min-h-0">
        <div className="w-[360px] border-r" style={{ borderColor: skin.colors.muted + '20' }}>
          <WorldChat
            colony={world.colony}
            agents={world.actors}
            onWorldUpdate={handleWorldUpdate}
          />
        </div>
        <div className="flex-1">
          <WorldGraph
            colony={world.colony}
            agents={world.actors}
            highways={world.flows}
          />
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTED COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function WorldView() {
  return (
    <MetaphorProvider initialSkin="team">
      <WorldViewInner />
    </MetaphorProvider>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ~400 lines. Chat + Graph + Voice. ONE world.
// ═══════════════════════════════════════════════════════════════════════════════
