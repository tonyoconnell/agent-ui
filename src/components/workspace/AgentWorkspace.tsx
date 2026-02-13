import { useEffect, useState } from "react"
import { Runtime, Agent, createEnvelope } from "@/engine"
import { cn } from "@/lib/utils"
import { EnvelopeFlowCanvas } from "@/components/flow/EnvelopeFlowCanvas"

// Sample data
function setup() {
  const runtime = new Runtime()

  const agents = [
    new Agent("agent-a", "Data Processor", {
      processData: () => ({ processed: true, count: 42 }),
    }),
    new Agent("agent-b", "Router", {
      routeEnvelope: (i) => ({ routed: true, target: (i as { target?: string }).target }),
    }),
    new Agent("agent-c", "Validator", {
      signPayload: () => ({ signed: true, hash: "0xabc..." }),
    }),
  ]

  agents.forEach((a) => runtime.register(a))

  const chain = createEnvelope({
    action: "processData",
    inputs: { source: "api/feed", limit: 100 },
    sender: "system",
    receiver: "agent-a",
    callback: createEnvelope({
      action: "routeEnvelope",
      inputs: { target: "agent-c", data: "{{ results }}" },
      sender: "agent-a",
      receiver: "agent-b",
      callback: createEnvelope({
        action: "signPayload",
        inputs: { payload: "{{ results }}" },
        sender: "agent-b",
        receiver: "agent-c",
      }),
    }),
  })

  return { runtime, agents, chain }
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
  tabs: Agent[]
  active: string | null
  onSelect: (id: string | null) => void
  onClose: (id: string) => void
}) {
  return (
    <div className="flex bg-[#0f0f17] border-b border-[#1e293b] px-2">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "px-4 py-3 text-sm font-medium border-b-2 -mb-px",
          !active ? "text-white border-blue-500" : "text-slate-500 border-transparent hover:text-slate-300"
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
function Grid({ agents, open, onSelect }: { agents: Agent[]; open: string[]; onSelect: (id: string) => void }) {
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
function Flow({ agent }: { agent: Agent }) {
  const envelope = agent.envelopes[0]
  const data = envelope ? {
    id: envelope.id,
    action: envelope.env.action,
    inputs: envelope.env.inputs,
    results: envelope.payload.results as Record<string, unknown> | undefined,
    status: envelope.payload.status,
    callback: envelope.callback ? {
      id: envelope.callback.id,
      action: envelope.callback.env.action,
      inputs: envelope.callback.env.inputs,
      receiver: envelope.callback.metadata?.receiver,
    } : null,
  } : null

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-[#252538]">
        <Dot status={agent.status} pulse />
        <h2 className="text-lg font-medium text-white">{agent.name}</h2>
        <span className="text-slate-500 text-sm font-mono">{Object.keys(agent.actions).join(", ")}</span>
      </div>
      <div className="flex-1">
        <EnvelopeFlowCanvas envelope={data} />
      </div>
    </div>
  )
}

// Main
export default function AgentWorkspace() {
  const [state, setState] = useState<{ runtime: Runtime; agents: Agent[] } | null>(null)
  const [open, setOpen] = useState<string[]>([])
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const { runtime, agents, chain } = setup()
    runtime.send(chain).then(() => setState({ runtime, agents }))
  }, [])

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

  const activeAgent = active ? state.agents.find((a) => a.id === active) : null
  const openTabs = open.map((id) => state.agents.find((a) => a.id === id)!).filter(Boolean)

  return (
    <div className="h-screen bg-[#0f0f17] flex flex-col">
      <Tabs tabs={openTabs} active={active} onSelect={setActive} onClose={closeTab} />
      {activeAgent ? <Flow agent={activeAgent} /> : <Grid agents={state.agents} open={open} onSelect={openAgent} />}
    </div>
  )
}
