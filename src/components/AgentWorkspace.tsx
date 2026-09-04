import { useEffect, useState } from 'react'
import { EdgeInfo } from '@/components/EdgeInfo'
import { EnvelopeFlowCanvas } from '@/components/EnvelopeFlowCanvas'
import { WorldEditor } from '@/components/graph/WorldEditor'
import { HighwayPanel } from '@/components/panels/HighwayPanel'
import type { Edge, World } from '@/engine'
import { createWorld } from '@/engine'
import { cn } from '@/lib/utils'

// Agent data from JSON (plain object, not a class instance)
interface AgentData {
  id: string
  name: string
  caste?: string
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

// Caste icons from TQL schema
const casteIcon: Record<string, string> = {
  queen: '👑',
  scout: '🔭',
  harvester: '⛏️',
  forager: '🌿',
  relay: '📡',
  nurse: '💊',
  soldier: '🛡️',
  'major-worker': '⚙️',
  'minor-worker': '🔩',
}

// Chain colors for parallel flows
const chainColor: Record<string, string> = {
  market: 'text-primary-bright',
  intelligence: 'text-secondary-bright',
  defense: 'text-destructive',
  care: 'text-tertiary-bright',
  recon: 'text-gold',
}

// Flatten envelope chain to assign to agents
function assignEnvelopes(agents: AgentData[], envelopes: AgentData['envelopes'][0][]) {
  for (const env of envelopes) {
    // Find agent and add envelope
    const agent = agents.find((a) => a.id === env.receiver)
    if (agent) {
      agent.envelopes.push(env)
    }
    // Recurse into callback chain
    if (env.callback) {
      assignEnvelopes(agents, [env.callback as AgentData['envelopes'][0]])
    }
  }
}

// Load from JSON
async function load() {
  const res = await fetch('/agents.json')
  const data = (await res.json()) as any

  const net = createWorld()
  const agents = data.agents as AgentData[]

  // Initialize empty envelopes arrays
  agents.forEach((a) => {
    a.envelopes = a.envelopes || []
  })

  // Assign envelopes to their receiver agents
  assignEnvelopes(agents, data.envelopes)

  // Spawn agents into colony
  agents.forEach((a) => {
    const u = net.add(a.id)
    for (const [name, result] of Object.entries(a.actions || {})) {
      u.on(name, () => result)
    }
  })

  // Process all envelope chains as signals
  for (const env of data.envelopes) {
    net.signal({ receiver: env.receiver, data: env.payload }, env.receiver)
  }

  // Log highways for signal flow verification (SWP-005)
  console.log('Highways:', net.highways())

  return { world: net, agents, highways: net.highways(30) }
}

// Status dot
function Dot({ status, pulse }: { status: string; pulse?: boolean }) {
  const color =
    {
      ready: 'bg-[hsl(var(--color-tertiary-bright))]',
      idle: 'bg-muted-foreground',
      error: 'bg-[hsl(var(--color-destructive))]',
    }[status] || 'bg-muted-foreground'
  return (
    <span className="relative flex h-2 w-2">
      {pulse && <span className={cn('animate-ping absolute inset-0 rounded-full opacity-75', color)} />}
      <span className={cn('relative rounded-full h-2 w-2', color)} />
    </span>
  )
}

// Tab bar
function Tabs({
  tabs,
  active,
  onSelect,
  onClose,
}: {
  tabs: AgentData[]
  active: string | 'group' | null
  onSelect: (id: string | 'group' | null) => void
  onClose: (id: string) => void
}) {
  return (
    <div className="flex items-center bg-background border-b border-border px-4 h-14">
      {/* Navigation */}
      <a href="/" className="px-3 py-1.5 bg-primary-bright text-white text-sm font-medium rounded-lg mr-2">
        Agents
      </a>
      <a
        href="/world"
        className="px-3 py-1.5 bg-muted hover:bg-card text-font text-sm font-medium rounded-lg mr-2 transition-colors"
      >
        Graph
      </a>
      <a
        href="/chat"
        className="px-3 py-1.5 bg-muted hover:bg-card text-font text-sm font-medium rounded-lg mr-2 transition-colors"
      >
        Chat
      </a>
      <a
        href="/ceo"
        className="px-3 py-1.5 bg-muted hover:bg-card text-font text-sm font-medium rounded-lg mr-4 transition-colors"
      >
        CEO
      </a>

      <div className="w-px h-6 bg-border mr-4" />

      <button
        onClick={() => onSelect('group')}
        className={cn(
          'px-5 py-2 text-base font-semibold rounded-lg mr-2 transition-all',
          active === 'group'
            ? 'text-white bg-primary-bright/20 border border-primary-bright/50'
            : 'text-muted-foreground hover:text-font hover:bg-muted',
        )}
      >
        Colony
      </button>
      <button
        onClick={() => onSelect(null)}
        className={cn(
          'px-5 py-2 text-base font-semibold rounded-lg mr-2 transition-all',
          active === null
            ? 'text-font bg-card/50 border border-card'
            : 'text-muted-foreground hover:text-font hover:bg-muted',
        )}
      >
        Agents
      </button>
      {tabs.length > 0 && <div className="w-px h-6 bg-border mx-2" />}
      {tabs.map((t) => (
        <div
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={cn(
            'group flex items-center gap-2 px-4 py-2 text-base font-medium rounded-lg mx-1 cursor-pointer transition-all',
            active === t.id
              ? 'text-font bg-tertiary-bright/20 border border-tertiary-bright/50'
              : 'text-muted-foreground hover:text-font hover:bg-muted',
          )}
        >
          <Dot status={t.status} />
          <span>{t.name}</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClose(t.id)
            }}
            className="ml-2 w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-font hover:bg-card opacity-0 group-hover:opacity-100 transition-all"
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
    <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
      <div className="w-full max-w-5xl">
        <h1 className="text-3xl font-light text-font mb-2 text-center">Colony</h1>
        <p className="text-muted-foreground text-sm mb-8 text-center">
          {agents.length} agents • {new Set(agents.map((a) => a.caste).filter(Boolean)).size} castes • 5 parallel chains
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => onSelect(agent.id)}
              className={cn(
                'bg-card border rounded-2xl p-6 text-left transition-all hover:scale-[1.02] hover:-translate-y-1',
                open.includes(agent.id) ? 'border-primary-bright/50' : 'border-border hover:border-foreground',
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl">{casteIcon[agent.caste || ''] || '🐜'}</span>
                <Dot status={agent.status} />
                <span className="text-font font-medium text-lg">{agent.name}</span>
              </div>
              {agent.caste && (
                <div className="text-muted-foreground text-[10px] font-mono uppercase tracking-wider mb-3">
                  {agent.caste}
                </div>
              )}
              <div className="text-muted-foreground text-xs font-mono mb-4">
                {Object.keys(agent.actions).join(' • ')}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-muted-foreground text-sm">
                  {agent.envelopes.length} envelope{agent.envelopes.length !== 1 ? 's' : ''} →
                </div>
                {agent.envelopes.length > 0 && (
                  <div className="flex gap-1">
                    {agent.envelopes.map((e, i) => {
                      const chain = (e.payload as Record<string, unknown>)?.chain as string
                      return chain ? (
                        <span
                          key={i}
                          className={cn(
                            'text-[9px] px-1.5 py-0.5 rounded-full bg-muted',
                            chainColor[chain] || 'text-muted-foreground',
                          )}
                        >
                          {chain}
                        </span>
                      ) : null
                    })}
                  </div>
                )}
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
  const data = envelope
    ? {
        id: `${envelope.receiver}:${envelope.receive}`,
        action: envelope.receive,
        inputs: envelope.payload,
        results: agent.actions[envelope.receive] as Record<string, unknown> | undefined,
        status: 'resolved' as const,
        callback: envelope.callback
          ? {
              id: `${envelope.callback.receiver}:${envelope.callback.receive}`,
              action: envelope.callback.receive,
              inputs: envelope.callback.payload,
              receiver: envelope.callback.receiver,
            }
          : null,
      }
    : null

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Dot status={agent.status} pulse />
        <h2 className="text-lg font-medium text-font">{agent.name}</h2>
        <span className="text-muted-foreground text-sm font-mono">{Object.keys(agent.actions).join(', ')}</span>
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
  const [state, setState] = useState<{ world: World; agents: AgentData[]; highways: Edge[] } | null>(null)
  const [open, setOpen] = useState<string[]>([])
  const [active, setActive] = useState<string | 'group' | null>('group')

  useEffect(() => {
    load().then(setState)
  }, [])

  // Periodic fade (LRN-003) - decay edge weights every 5 seconds
  useEffect(() => {
    if (!state) return
    const interval = setInterval(() => {
      state.world.fade(0.1)
      setState((prev) => (prev ? { ...prev, highways: state.world.highways(30) } : null))
    }, 5000)
    return () => clearInterval(interval)
  }, [state?.world, state])

  // Signal injection — fire all parallel chains simultaneously
  const injectSignal = () => {
    if (!state) return
    // Fire chain-head signals; continuations run via .then() on each actor
    state.world.signal({ receiver: 'scout:observe', data: { source: 'test', chain: 'market' } })
    state.world.signal({ receiver: 'forager:search', data: { source: 'onchain', chain: 'intelligence' } })
    state.world.signal({ receiver: 'soldier:validate', data: { signals: 'all', chain: 'defense' } })
    state.world.signal({ receiver: 'nurse:monitor', data: { colony: 'all', chain: 'care' } })
    state.world.signal({ receiver: 'scout:scan', data: { source: 'sentiment', chain: 'recon' } })
    setState((prev) => (prev ? { ...prev, highways: state.world.highways(30) } : null))
  }

  if (!state)
    return <div className="h-screen bg-muted flex items-center justify-center text-muted-foreground">Loading...</div>

  const openAgent = (id: string) => {
    if (!open.includes(id)) setOpen([...open, id])
    setActive(id)
  }

  const closeTab = (id: string) => {
    const next = open.filter((t) => t !== id)
    setOpen(next)
    if (active === id) setActive(next.at(-1) || null)
  }

  const activeAgent = active && active !== 'group' ? state.agents.find((a) => a.id === active) : null
  const openTabs = open.map((id) => state.agents.find((a) => a.id === id)!).filter(Boolean)

  return (
    <div className="h-screen bg-muted flex flex-col">
      <Tabs tabs={openTabs} active={active} onSelect={setActive} onClose={closeTab} />
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 h-full">
          {active === 'group' ? (
            <WorldEditor
              world={state.world}
              agents={state.agents}
              highways={state.highways}
              onAgentSelect={openAgent}
              onWorldChange={() => setState((prev) => (prev ? { ...prev, highways: state.world.highways(30) } : null))}
            />
          ) : activeAgent ? (
            <Flow agent={activeAgent} highways={state.highways} />
          ) : (
            <Grid agents={state.agents} open={open} onSelect={openAgent} />
          )}
        </div>
        <div className="w-64 p-4 border-l border-border flex flex-col gap-4">
          <HighwayPanel highways={state.highways} />
          <button
            onClick={injectSignal}
            className="w-full px-3 py-2 bg-primary-bright hover:bg-primary-bright/80 text-white text-sm rounded-lg transition-colors"
          >
            Inject Signal
          </button>
        </div>
      </div>
    </div>
  )
}
