import { Background, type Edge, type EdgeTypes, type Node, type NodeTypes, Panel, ReactFlow } from '@xyflow/react'
import { useEffect, useMemo, useState } from 'react'
import '@xyflow/react/dist/style.css'
import {
  useAgentList,
  useGroupMembers,
  useGroupRole,
  useGroups,
  useHighways,
  useHypotheses,
  useSignals,
} from '@oneie/sdk/react'
import { SkinSwitcher } from '@/components/controls/SkinSwitcher'
import { SdkProvider } from '@/components/providers/SdkProvider'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'
import { type DraftKind, EditPalette } from './EditPalette'
import { PathEdge } from './edges/PathEdge'
import { GroupSwitcher } from './GroupSwitcher'
import { InspectorV2 } from './InspectorV2'
import { KpiStrip } from './KpiStrip'
import { type LayerState, LayerToggle } from './LayerToggle'
import type { TimeWindow } from './lib/at-timestamp'
import { GroupNode } from './nodes/GroupNode'
import { InsightNode } from './nodes/InsightNode'
import { PersonNode } from './nodes/PersonNode'
import { ThingNode } from './nodes/ThingNode'
import { DEFAULT_LABELS, type LabelAliases, loadLabels, OntologyPrefs, saveLabels } from './OntologyPrefs'
import { TimeSlider } from './TimeSlider'
import { type TqlAction, TqlPreview } from './TqlPreview'

// ─── Node / edge type registrations ──────────────────────────────────────────

const NODE_TYPES: NodeTypes = {
  group: GroupNode,
  person: PersonNode,
  thing: ThingNode,
  insight: InsightNode,
}

const EDGE_TYPES: EdgeTypes = {
  path: PathEdge,
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_LAYERS: LayerState = {
  groups: true,
  people: true,
  things: true,
  paths: true,
  events: true,
  insight: true,
}

const COLORS = {
  groups: '#6366f1',
  people: '#3b82f6',
  things: '#10b981',
  paths: '#f59e0b',
  events: '#fbbf24',
  insight: '#a855f7',
} as const

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Props {
  initialGroup: string
  isAuthenticated: boolean
}

interface AgentLike {
  uid?: string
  id?: string
  name?: string
  group?: string
  skills?: Array<{ name?: string; skillId?: string; price?: number; tags?: string[] }>
  successRate?: number
  kind?: 'human' | 'agent' | 'animal' | 'world'
}

interface HighwayLike {
  from?: string
  to?: string
  source?: string
  target?: string
  strength?: number
  resistance?: number
}

interface GroupLike {
  gid?: string
  id?: string
  name?: string
  memberCount?: number
  visibility?: 'public' | 'private'
}

interface MemberLike {
  uid?: string
  id?: string
  name?: string
  role?: string
  kind?: 'human' | 'agent' | 'animal' | 'world'
  successRate?: number
}

interface HypothesisLike {
  hid?: string
  id?: string
  subject?: string
  label?: string
  confidence?: number
  status?: string
}

interface SignalLike {
  from?: string
  source?: string
  to?: string
  target?: string
  receiver?: string
}

// ─── Outer shell (provides SdkProvider context) ───────────────────────────────

export function OntologyEditor({ initialGroup, isAuthenticated }: Props) {
  return (
    <SdkProvider>
      <OntologyEditorInner initialGroup={initialGroup} isAuthenticated={isAuthenticated} />
    </SdkProvider>
  )
}

// ─── Inner component ──────────────────────────────────────────────────────────

function OntologyEditorInner({ initialGroup, isAuthenticated }: Props) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [layers, setLayers] = useState<LayerState>(DEFAULT_LAYERS)
  const [group, setGroup] = useState(initialGroup)
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [selected, setSelected] = useState<Node | null>(null)
  const [extraNodes, setExtraNodes] = useState<Node[]>([])
  const [time, setTime] = useState<TimeWindow>({ at: null })
  const [labels, setLabels] = useState<LabelAliases>(DEFAULT_LABELS)
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<TqlAction | null>(null)

  // Load labels from localStorage whenever the active group changes
  useEffect(() => {
    setLabels(loadLabels(group))
  }, [group])

  // ── Data hooks ────────────────────────────────────────────────────────────
  const { data: roleData } = useGroupRole(group)
  const groupRole = roleData?.groupRole

  const { data: agents } = useAgentList()
  const { data: members } = useGroupMembers(group)
  const { data: highways } = useHighways(50)
  const { data: signals } = useSignals({ limit: 30 })
  const { data: hypotheses } = useHypotheses()
  const { data: groups } = useGroups()

  // ── Normalise raw data arrays ─────────────────────────────────────────────

  const agentList: AgentLike[] = useMemo(() => {
    if (Array.isArray(agents)) return agents as AgentLike[]
    const nested = agents as { agents?: unknown; data?: unknown } | null
    if (nested && Array.isArray(nested.agents)) return nested.agents as AgentLike[]
    if (nested && Array.isArray(nested.data)) return nested.data as AgentLike[]
    return []
  }, [agents])

  const memberList: MemberLike[] = useMemo(() => {
    if (Array.isArray(members)) return members as MemberLike[]
    const nested = members as { members?: unknown; data?: unknown } | null
    if (nested && Array.isArray(nested.members)) return nested.members as MemberLike[]
    if (nested && Array.isArray(nested.data)) return nested.data as MemberLike[]
    return []
  }, [members])

  const highwayList: HighwayLike[] = useMemo(() => {
    if (Array.isArray(highways)) return highways as HighwayLike[]
    const nested = highways as { highways?: unknown; data?: unknown } | null
    if (nested && Array.isArray(nested.highways)) return nested.highways as HighwayLike[]
    if (nested && Array.isArray(nested.data)) return nested.data as HighwayLike[]
    return []
  }, [highways])

  const signalList: SignalLike[] = useMemo(() => {
    if (Array.isArray(signals)) return signals as SignalLike[]
    const nested = signals as { signals?: unknown; data?: unknown } | null
    if (nested && Array.isArray(nested.signals)) return nested.signals as SignalLike[]
    if (nested && Array.isArray(nested.data)) return nested.data as SignalLike[]
    return []
  }, [signals])

  const hypothesisList: HypothesisLike[] = useMemo(() => {
    const hyp = hypotheses as { hypotheses?: unknown; data?: unknown } | unknown[] | null
    if (Array.isArray(hyp)) return hyp as HypothesisLike[]
    if (hyp && Array.isArray((hyp as { hypotheses?: unknown }).hypotheses))
      return (hyp as { hypotheses: HypothesisLike[] }).hypotheses
    if (hyp && Array.isArray((hyp as { data?: unknown }).data)) return (hyp as { data: HypothesisLike[] }).data
    return []
  }, [hypotheses])

  const groupList: GroupLike[] = useMemo(() => {
    if (Array.isArray(groups)) return groups as GroupLike[]
    const nested = groups as { groups?: unknown; data?: unknown } | null
    if (nested && Array.isArray(nested.groups)) return nested.groups as GroupLike[]
    if (nested && Array.isArray(nested.data)) return nested.data as GroupLike[]
    return []
  }, [groups])

  // ── Role-derived permission flags ─────────────────────────────────────────
  const canMark =
    mode === 'edit' &&
    (groupRole === 'chairman' || groupRole === 'ceo' || groupRole === 'operator' || groupRole === 'agent')
  const canMintCapability = mode === 'edit' && (groupRole === 'chairman' || groupRole === 'ceo')
  const editable = mode === 'edit' && isAuthenticated
  const isChairman = groupRole === 'chairman' || groupRole === 'ceo'

  // ── Event signal counts per edge key ─────────────────────────────────────
  const signalCountByEdge = useMemo(() => {
    const counts = new Map<string, number>()
    for (const sig of signalList) {
      const from = sig.from ?? sig.source ?? ''
      const to = sig.to ?? sig.target ?? sig.receiver ?? ''
      if (from && to) {
        const key = `${from}-${to}`
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
    }
    return counts
  }, [signalList])

  // ── Build nodes ───────────────────────────────────────────────────────────

  const nodes: Node[] = useMemo(() => {
    const result: Node[] = []

    // People nodes — from group members (prefer) or agents fallback
    const peopleSource: MemberLike[] = memberList.length > 0 ? memberList : (agentList as MemberLike[])

    peopleSource.forEach((m, i) => {
      const uid = m.uid ?? m.id ?? `person-${i}`
      result.push({
        id: uid,
        type: 'person',
        position: { x: (i % 8) * 160 + 60, y: Math.floor(i / 8) * 120 + 60 },
        data: {
          label: m.name ?? uid,
          uid,
          kind: m.kind ?? 'agent',
          successRate: m.successRate,
        },
        hidden: !layers.people,
      })
    })

    // Thing nodes — skills from agents
    const seenSkillIds = new Set<string>()
    agentList.forEach((a, ai) => {
      ;(a.skills ?? []).forEach((skill, si) => {
        const tid = skill.name ?? skill.skillId ?? `skill-${ai}-${si}`
        if (seenSkillIds.has(tid)) return
        seenSkillIds.add(tid)
        result.push({
          id: tid,
          type: 'thing',
          position: {
            x: (si % 10) * 100 + 40,
            y: Math.floor(si / 10) * 100 + Math.floor(agentList.length / 8) * 120 + 200,
          },
          data: {
            label: tid,
            tid,
            thingType: 'skill' as const,
            price: skill.price,
          },
          hidden: !layers.things,
        })
      })
    })

    // Group nodes
    groupList.forEach((g, gi) => {
      const gid = g.gid ?? g.id ?? `group-${gi}`
      result.push({
        id: gid,
        type: 'group',
        position: { x: gi * 200, y: -120 },
        data: {
          label: g.name ?? gid,
          gid,
          visibility: g.visibility,
          memberCount: g.memberCount,
        },
        hidden: !layers.groups,
      })
    })

    // Insight nodes
    hypothesisList.forEach((h, hi) => {
      const hid = h.hid ?? h.id ?? `insight-${hi}`
      result.push({
        id: hid,
        type: 'insight',
        position: {
          x: (hi % 5) * 140 + 60,
          y: 400 + Math.floor(hi / 5) * 120,
        },
        data: {
          label: h.label ?? h.subject ?? hid,
          hid,
          confidence: h.confidence,
          status: h.status,
        },
        hidden: !layers.insight,
      })
    })

    return result
  }, [memberList, agentList, groupList, hypothesisList, layers])

  // ── Build edges ───────────────────────────────────────────────────────────

  const edges: Edge[] = useMemo(
    () =>
      highwayList.map((h, i) => {
        const source = h.from ?? h.source ?? ''
        const target = h.to ?? h.target ?? ''
        const edgeKey = `${source}-${target}`
        return {
          id: `e-${i}`,
          source,
          target,
          type: 'path',
          data: {
            strength: h.strength ?? 0,
            resistance: h.resistance ?? 0,
            traversals: undefined,
            signals: signalCountByEdge.get(edgeKey) ?? 0,
            scope: 'group' as const,
          },
          hidden: !layers.paths,
          animated: false, // PathEdge has its own animated dots via SVG
        }
      }),
    [highwayList, layers.paths, signalCountByEdge],
  )

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleLayerChange = (layer: keyof LayerState, visible: boolean) => {
    emitClick('ui:ontology:layer-toggle', { layer, visible })
    setLayers((prev) => ({ ...prev, [layer]: visible }))
  }

  const handleGroupChange = (newGroup: string) => {
    emitClick('ui:ontology:group-switch', { from: group, to: newGroup })
    setGroup(newGroup)
  }

  const handleModeToggle = () => {
    if (!isAuthenticated) return
    const next = mode === 'view' ? 'edit' : 'view'
    emitClick('ui:ontology:mode-toggle', { from: mode, to: next })
    setMode(next)
  }

  const handleConnect = (c: { source: string | null; target: string | null }) => {
    if (!editable) return
    emitClick('ui:ontology:draw-path', { from: c.source, to: c.target })
    // draw-path creates a pheromone-zero edge locally only; TqlPreview is not opened here.
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!editable) return
    const kind = e.dataTransfer.getData('application/ontology-draft') as DraftKind
    if (!kind) return
    e.preventDefault()
    const id = `draft:${kind}:${Date.now()}`
    const newNode: Node = {
      id,
      type: kind,
      position: { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY },
      data: (() => {
        if (kind === 'person') return { label: kind, uid: id, kind: 'agent' as const }
        if (kind === 'thing') return { label: kind, tid: id, thingType: 'skill' as const }
        if (kind === 'group') return { label: kind, gid: id, visibility: 'private' as const }
        return { label: kind, hid: id }
      })(),
    }
    setExtraNodes((prev) => [...prev, newNode])
    emitClick('ui:ontology:add-unit', { kind, id })
    // Show TqlPreview so the owner can optionally persist the draft
    setPendingAction({
      kind: 'add-unit',
      uid: id,
      name: kind,
      actorType: 'agent',
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen w-full flex-col bg-[#0a0a0f] text-slate-200">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-[#252538] bg-[#0d0d14] px-4 py-2">
        <span className="font-mono text-sm text-slate-400">/ontology</span>
        <GroupSwitcher value={group} onChange={handleGroupChange} agents={agentList} />
        <SkinSwitcher variant="compact" />

        {/* Gear button — opens OntologyPrefs */}
        <button
          type="button"
          onClick={() => {
            emitClick('ui:ontology:prefs-open')
            setPrefsOpen(true)
          }}
          title="Customize vocabulary and group parameters"
          className="rounded border border-[#252538] px-2 py-0.5 text-xs text-slate-400 hover:bg-[#161622] hover:text-slate-100 transition-colors"
          aria-label="Open preferences"
        >
          ⚙
        </button>

        {/* View / Edit toggle */}
        <div className="ml-auto flex items-center gap-1 rounded-md border border-[#252538] p-0.5">
          <button
            type="button"
            onClick={handleModeToggle}
            className={cn(
              'rounded px-2 py-0.5 text-xs',
              mode === 'view' ? 'bg-[#252538] text-slate-100' : 'text-slate-400',
            )}
          >
            view
          </button>
          <button
            type="button"
            onClick={handleModeToggle}
            disabled={!isAuthenticated}
            title={!isAuthenticated ? 'Sign in to edit' : 'Edit mode'}
            className={cn(
              'rounded px-2 py-0.5 text-xs',
              mode === 'edit' ? 'bg-[#252538] text-slate-100' : 'text-slate-400',
              !isAuthenticated && 'cursor-not-allowed opacity-40',
            )}
          >
            edit
          </button>
        </div>
      </header>

      {/* KPI strip — between header and body */}
      <KpiStrip gid={group} />

      {/* Body: left rail + canvas + right inspector */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left rail */}
        <aside className="w-44 shrink-0 border-r border-[#252538] bg-[#0d0d14] p-3 overflow-y-auto">
          <LayerToggle value={layers} onChange={handleLayerChange} colors={COLORS} />

          {/* Time slider */}
          <div className="mt-6 border-t border-[#252538] pt-3">
            <TimeSlider value={time} onChange={setTime} />
          </div>

          <div className="mt-4 border-t border-[#252538] pt-3 text-xs text-slate-500">
            <div>{agentList.length} units</div>
            <div>{highwayList.length} paths</div>
          </div>
        </aside>

        {/* Canvas */}
        <main
          className="relative flex-1 bg-[#0a0a0f]"
          onDragOver={(e) => editable && e.preventDefault()}
          onDrop={handleDrop}
        >
          <ReactFlow
            nodes={[...nodes, ...extraNodes]}
            edges={edges}
            nodeTypes={NODE_TYPES}
            edgeTypes={EDGE_TYPES}
            fitView
            defaultEdgeOptions={{ type: 'path' }}
            onConnect={handleConnect}
            onNodeClick={(_, n) => {
              setSelected(n)
              emitClick('ui:ontology:node-click', { node: n.id })
            }}
            nodesDraggable={editable}
            nodesConnectable={editable}
          >
            <Background color="#252538" gap={20} />
            <Panel
              position="top-right"
              className="rounded border border-[#252538] bg-[#161622] px-2 py-1 text-xs text-slate-400"
            >
              {Object.values(layers).filter(Boolean).length} of 6 layers
              {editable ? <span className="ml-2 text-emerald-400">edit</span> : null}
            </Panel>
            <EditPalette visible={mode === 'edit'} enabled={editable} />
          </ReactFlow>
        </main>

        {/* Right inspector */}
        <InspectorV2
          node={selected}
          mode={mode}
          groupRole={groupRole}
          onTqlAction={(a) => setPendingAction(a)}
          onClose={() => setSelected(null)}
        />
      </div>

      {/* Customization panel (chairman-only group params) */}
      <OntologyPrefs
        open={prefsOpen}
        gid={group}
        isChairman={!!isChairman}
        groupName={group}
        onLabelsChange={(next) => {
          setLabels(next)
          saveLabels(group, next)
        }}
        onTqlAction={(a) => setPendingAction(a)}
        onClose={() => setPrefsOpen(false)}
      />

      {/* TQL Preview drawer */}
      <TqlPreview
        open={pendingAction !== null}
        action={pendingAction}
        onApplied={() => setPendingAction(null)}
        onClose={() => setPendingAction(null)}
      />
    </div>
  )
}
