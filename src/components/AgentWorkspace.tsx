import { useEffect, useState } from "react"
import { colony } from "@/engine"
import type { Colony, Edge } from "@/engine"
import { cn } from "@/lib/utils"
import { EnvelopeFlowCanvas } from "@/components/EnvelopeFlowCanvas"
import { HighwayPanel } from "@/components/panels/HighwayPanel"
import { EdgeInfo } from "@/components/EdgeInfo"
import { ColonyGraph } from "@/components/graph/ColonyGraph"

// Agent data from JSON (plain object, not a class instance)
interface AgentData {
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

// Flatten envelope chain to assign to agents
function assignEnvelopes(agents: AgentData[], envelopes: AgentData["envelopes"][0][]) {
  for (const env of envelopes) {
    // Find agent and add envelope
    const agent = agents.find(a => a.id === env.receiver)
    if (agent) {
      agent.envelopes.push(env)
    }
    // Recurse into callback chain
    if (env.callback) {
      assignEnvelopes(agents, [env.callback as AgentData["envelopes"][0]])
    }
  }
}

// Load from JSON
async function load() {
  const res = await fetch("/agents.json")
  const data = await res.json()

  const net = colony()
  const agents = data.agents as AgentData[]

  // Initialize empty envelopes arrays
  agents.forEach(a => { a.envelopes = a.envelopes || [] })

  // Assign envelopes to their receiver agents
  assignEnvelopes(agents, data.envelopes)

  // Spawn agents into colony
  agents.forEach(a => net.spawnFromJSON(a))

  // Process all envelope chains
  for (const env of data.envelopes) {
    await net.send(env)
  }

  // Log highways for signal flow verification (SWP-005)
  console.log("Highways:", net.highways())

  return { colony: net, agents, highways: net.highways(20) }
}

// Status dot
function Dot({ status, pulse }: { status: string; pulse?: boolean }) {
  const color = { ready: "bg-green-500", idle: "bg-slate-500", error: "bg-red-500" }[status] || "bg-slate-500"
  return (
    <span className="relative flex h-2 w-2">
      {pulse && <span className={cn("animate-ping absolute inset-0 rounded-full opacity-75", color)} />}
      <span className={cn("relative rounded-full h-2 w-2", color)} />
    </span>
  )
}

// Tab bar
function Tabs({ tabs, active, onSelect, onClose }: {
  tabs: AgentData[]
  active: string | "colony" | null
  onSelect: (id: string | "colony" | null) => void
  onClose: (id: string) => void
}) {
  return (
    <div className="flex bg-[#0f0f17] border-b border-[#1e293b] px-2">
      <button
        onClick={() => onSelect("colony")}
        className={cn(
          "px-4 py-3 text-sm font-medium border-b-2 -mb-px",
          active === "colony" ? "text-white border-blue-500" : "text-slate-500 border-transparent hover:text-slate-300"
        )}
      >
        Colony
      </button>
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "px-4 py-3 text-sm font-medium border-b-2 -mb-px",
          active === null ? "text-white border-blue-500" : "text-slate-500 border-transparent hover:text-slate-300"
        )}
      >
        Agents
      </button>
      {tabs.map((t) => (
        <div
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={cn(
            "group flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px cursor-pointer",
            active === t.id ? "text-white border-blue-500" : "text-slate-500 border-transparent hover:text-slate-300"
          )}
        >
          <Dot status={t.status} />
          <span>{t.name}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(t.id) }}
            className="ml-1 text-slate-600 hover:text-white opacity-0 group-hover:opacity-100"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

// Agent grid
function Grid({ agents, open, onSelect }: { agents: AgentData[]; open: string[]; onSelect: (id: string) => void }) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-light text-white mb-2 text-center">Agents</h1>
        <p className="text-slate-500 text-sm mb-12 text-center">Select an agent to view its flow</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => onSelect(agent.id)}
              className={cn(
                "bg-[#161622] border rounded-2xl p-8 text-left transition-all hover:scale-[1.02] hover:-translate-y-1",
                open.includes(agent.id) ? "border-blue-500/50" : "border-[#252538] hover:border-slate-500"
              )}
            >
              <div className="flex items-center gap-3 mb-4">
                <Dot status={agent.status} />
                <span className="text-white font-medium text-lg">{agent.name}</span>
              </div>
              <div className="text-slate-500 text-xs font-mono mb-6">
                {Object.keys(agent.actions).join(" • ")}
              </div>
              <div className="text-slate-600 text-sm">
                {agent.envelopes.length} envelope{agent.envelopes.length !== 1 ? "s" : ""} →
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Flow view
function Flow({ agent, highways }: { agent: AgentData; highways: Edge[] }) {
  const envelope = agent.envelopes[0]
  // Build envelope data for the flow canvas
  const data = envelope ? {
    id: `${envelope.receiver}:${envelope.receive}`,
    action: envelope.receive,
    inputs: envelope.payload,
    results: agent.actions[envelope.receive] as Record<string, unknown> | undefined,
    status: "resolved" as const,
    callback: envelope.callback ? {
      id: `${envelope.callback.receiver}:${envelope.callback.receive}`,
      action: envelope.callback.receive,
      inputs: envelope.callback.payload,
      receiver: envelope.callback.receiver,
    } : null,
  } : null

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-[#252538]">
        <Dot status={agent.status} pulse />
        <h2 className="text-lg font-medium text-white">{agent.name}</h2>
        <span className="text-slate-500 text-sm font-mono">{Object.keys(agent.actions).join(", ")}</span>
      </div>
      <EdgeInfo highways={highways} agentId={agent.id} direction="incoming" />
      <div className="flex-1 min-h-0">
        <EnvelopeFlowCanvas envelope={data} />
      </div>
      <EdgeInfo highways={highways} agentId={agent.id} direction="outgoing" />
    </div>
  )
}

// Main
export default function AgentWorkspace() {
  const [state, setState] = useState<{ colony: Colony; agents: AgentData[]; highways: Edge[] } | null>(null)
  const [open, setOpen] = useState<string[]>([])
  const [active, setActive] = useState<string | "colony" | null>("colony")

  useEffect(() => {
    load().then(setState)
  }, [])

  // Periodic fade (LRN-003) - decay edge weights every 5 seconds
  useEffect(() => {
    if (!state) return
    const interval = setInterval(() => {
      state.colony.fade(0.1)
      setState(prev => prev ? { ...prev, highways: state.colony.highways(20) } : null)
    }, 5000)
    return () => clearInterval(interval)
  }, [state?.colony])

  // Signal injection (LRN-004) - inject a test signal through the network
  const injectSignal = async () => {
    if (!state) return
    await state.colony.send({
      receiver: "scout",
      receive: "observe",
      payload: { source: "test" },
      callback: {
        receiver: "analyst",
        receive: "evaluate",
        payload: { data: "{{result}}" }
      }
    })
    setState(prev => prev ? { ...prev, highways: state.colony.highways(20) } : null)
  }

  if (!state) return <div className="h-screen bg-[#0f0f17] flex items-center justify-center text-slate-600">Loading...</div>

  const openAgent = (id: string) => {
    if (!open.includes(id)) setOpen([...open, id])
    setActive(id)
  }

  const closeTab = (id: string) => {
    const next = open.filter((t) => t !== id)
    setOpen(next)
    if (active === id) setActive(next.at(-1) || null)
  }

  const activeAgent = active && active !== "colony" ? state.agents.find((a) => a.id === active) : null
  const openTabs = open.map((id) => state.agents.find((a) => a.id === id)!).filter(Boolean)

  return (
    <div className="h-screen bg-[#0f0f17] flex flex-col">
      <Tabs tabs={openTabs} active={active} onSelect={setActive} onClose={closeTab} />
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 h-full">
          {active === "colony" ? (
            <ColonyGraph agents={state.agents} highways={state.highways} onSelectAgent={openAgent} />
          ) : activeAgent ? (
            <Flow agent={activeAgent} highways={state.highways} />
          ) : (
            <Grid agents={state.agents} open={open} onSelect={openAgent} />
          )}
        </div>
        <div className="w-64 p-4 border-l border-[#252538] flex flex-col gap-4">
          <HighwayPanel highways={state.highways} />
          <button
            onClick={injectSignal}
            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
          >
            Inject Signal
          </button>
        </div>
      </div>
    </div>
  )
}
