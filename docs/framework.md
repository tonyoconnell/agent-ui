# Framework

TypeDB stores reality. TypeQL queries it. JSON renders it. The UI skins it.

## The Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         TypeDB                                   │
│  one.tql / metaphors.tql — stores the 6 dimensions              │
│  Actors, Groups, Flows, Things, Events, Knowledge               │
└────────────────────────────┬────────────────────────────────────┘
                             │ TypeQL
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Query Layer                                │
│  open() / blocked() / best() / proven() / highways()            │
│  Functions return entities, relations, aggregates               │
└────────────────────────────┬────────────────────────────────────┘
                             │ JSON
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      UI Components                               │
│  ColonyEditor / ColonyGraph / EnvelopeFlowCanvas                │
│  ReactFlow nodes, edges, animations                              │
└────────────────────────────┬────────────────────────────────────┘
                             │ Metaphor
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Skin Layer                                 │
│  Ant / Brain / Team / Mail / Water / Signal                     │
│  Labels, colors, icons, terminology                              │
└─────────────────────────────────────────────────────────────────┘
```

## TypeQL to JSON

### World State Query

```typeql
# Get the world for UI rendering
match
  $a isa actor, has actor-id $id, has actor-name $name, has actor-status $status;
  $c (source: $src, target: $tgt) isa connection,
      has weight $w, has alarm $al, has connection-status $cs;
  $src has actor-id $src-id;
  $tgt has actor-id $tgt-id;
select $id, $name, $status, $src-id, $tgt-id, $w, $al, $cs;
```

### JSON Output

```json
{
  "actors": [
    { "id": "scout", "name": "Scout", "status": "proven", "kind": "agent" },
    { "id": "analyst", "name": "Analyst", "status": "active", "kind": "agent" },
    { "id": "trader", "name": "Trader", "status": "proven", "kind": "agent" }
  ],
  "flows": [
    { "from": "scout", "to": "analyst", "strength": 75, "resistance": 2, "status": "open" },
    { "from": "analyst", "to": "trader", "strength": 60, "resistance": 5, "status": "open" },
    { "from": "scout", "to": "trader", "strength": 8, "resistance": 25, "status": "blocked" }
  ],
  "patterns": [
    { "id": "scout-analyst-highway", "confidence": 0.95, "count": 150 }
  ]
}
```

## Metaphor Skins

The same JSON renders differently based on metaphor:

### Skin Definition

```typescript
interface MetaphorSkin {
  id: string
  name: string
  
  // Entity labels
  actor: string       // "ant" | "neuron" | "agent" | "mailbox" | "pool" | "receiver"
  group: string       // "colony" | "network" | "team" | "office" | "watershed" | "network"
  flow: string        // "trail" | "synapse" | "workflow" | "route" | "channel" | "frequency"
  carrier: string     // "scent" | "impulse" | "task" | "envelope" | "drop" | "signal"
  
  // Action labels
  send: string        // "forage" | "fire" | "delegate" | "deliver" | "flow" | "transmit"
  strengthen: string  // "deposit" | "potentiate" | "commend" | "stamp" | "carve" | "boost"
  weaken: string      // "alarm" | "inhibit" | "flag" | "return" | "dam" | "jam"
  decay: string       // "evaporate" | "decay" | "forget" | "archive" | "dry" | "attenuate"
  
  // Status labels
  open: string        // "trail" | "pathway" | "go-to" | "express" | "river" | "clear"
  blocked: string     // "toxic" | "dead" | "flagged" | "returned" | "dammed" | "jammed"
  
  // Colors
  colors: {
    primary: string       // Actor nodes
    secondary: string     // Flows
    success: string       // Open flows
    danger: string        // Blocked flows
    background: string    // Canvas
  }
  
  // Icons (emoji or SVG paths)
  icons: {
    actor: string
    group: string
    flow: string
    entry: string
  }
}
```

### The 6 Skins

```typescript
const skins: Record<string, MetaphorSkin> = {
  ant: {
    id: 'ant',
    name: 'Ant Colony',
    actor: 'ant', group: 'colony', flow: 'trail', carrier: 'scent',
    send: 'forage', strengthen: 'deposit', weaken: 'alarm', decay: 'evaporate',
    open: 'trail', blocked: 'toxic',
    colors: { primary: '#84cc16', secondary: '#65a30d', success: '#22c55e', danger: '#ef4444', background: '#1a1a0a' },
    icons: { actor: '🐜', group: '🏔️', flow: '~~~', entry: '🌱' }
  },
  
  brain: {
    id: 'brain',
    name: 'Neural Network',
    actor: 'neuron', group: 'network', flow: 'synapse', carrier: 'impulse',
    send: 'fire', strengthen: 'potentiate', weaken: 'inhibit', decay: 'decay',
    open: 'pathway', blocked: 'dead',
    colors: { primary: '#a855f7', secondary: '#9333ea', success: '#c084fc', danger: '#f87171', background: '#0f0a1a' },
    icons: { actor: '🔮', group: '🧠', flow: '⚡', entry: '👁️' }
  },
  
  team: {
    id: 'team',
    name: 'Organization',
    actor: 'agent', group: 'team', flow: 'workflow', carrier: 'task',
    send: 'delegate', strengthen: 'commend', weaken: 'flag', decay: 'forget',
    open: 'go-to', blocked: 'flagged',
    colors: { primary: '#3b82f6', secondary: '#2563eb', success: '#60a5fa', danger: '#f87171', background: '#0a0a14' },
    icons: { actor: '👤', group: '🏢', flow: '→', entry: '📥' }
  },
  
  mail: {
    id: 'mail',
    name: 'Postal System',
    actor: 'mailbox', group: 'office', flow: 'route', carrier: 'envelope',
    send: 'deliver', strengthen: 'stamp', weaken: 'return', decay: 'archive',
    open: 'express', blocked: 'returned',
    colors: { primary: '#f59e0b', secondary: '#d97706', success: '#fbbf24', danger: '#dc2626', background: '#14100a' },
    icons: { actor: '📬', group: '🏤', flow: '✉️', entry: '📮' }
  },
  
  water: {
    id: 'water',
    name: 'Watershed',
    actor: 'pool', group: 'watershed', flow: 'channel', carrier: 'drop',
    send: 'flow', strengthen: 'carve', weaken: 'dam', decay: 'dry',
    open: 'river', blocked: 'dammed',
    colors: { primary: '#06b6d4', secondary: '#0891b2', success: '#22d3ee', danger: '#f87171', background: '#0a1014' },
    icons: { actor: '💧', group: '🌊', flow: '〰️', entry: '🌧️' }
  },
  
  signal: {
    id: 'signal',
    name: 'Signal Network',
    actor: 'receiver', group: 'network', flow: 'frequency', carrier: 'signal',
    send: 'transmit', strengthen: 'boost', weaken: 'jam', decay: 'attenuate',
    open: 'clear', blocked: 'jammed',
    colors: { primary: '#10b981', secondary: '#059669', success: '#34d399', danger: '#f87171', background: '#0a140f' },
    icons: { actor: '📡', group: '🛰️', flow: '〜', entry: '📻' }
  }
}
```

## UI Components + Skins

### MetaphorContext

```typescript
// contexts/MetaphorContext.tsx
import { createContext, useContext, useState } from 'react'

interface MetaphorContextType {
  skin: MetaphorSkin
  setSkin: (id: string) => void
  t: (key: string) => string  // Translate term
}

const MetaphorContext = createContext<MetaphorContextType>(null!)

export function MetaphorProvider({ children }: { children: React.ReactNode }) {
  const [skinId, setSkinId] = useState('team')
  const skin = skins[skinId]
  
  const t = (key: string) => skin[key as keyof MetaphorSkin] as string || key
  
  return (
    <MetaphorContext.Provider value={{ skin, setSkin: setSkinId, t }}>
      {children}
    </MetaphorContext.Provider>
  )
}

export const useMetaphor = () => useContext(MetaphorContext)
```

### Skinned Node

```typescript
// ChamberNode becomes skinnable
function ActorNode({ data }: NodeProps) {
  const { skin, t } = useMetaphor()
  
  return (
    <div style={{ 
      background: `linear-gradient(to bottom, ${skin.colors.primary}20, ${skin.colors.background})`,
      borderColor: data.isOpen ? skin.colors.success : skin.colors.primary
    }}>
      <div className="flex items-center gap-2">
        <span>{skin.icons.actor}</span>
        <span>{data.name}</span>
        {data.status === 'proven' && <span title={`Proven ${t('actor')}`}>⭐</span>}
      </div>
      
      <div className="text-xs text-slate-500">
        {t('actor')} | {data.actions.join(', ')}
      </div>
      
      <div className="flex items-center gap-1">
        <span className="text-xs">IN {t('flow')}s:</span>
        <Bar value={data.incoming} color={skin.colors.success} />
      </div>
    </div>
  )
}
```

### Skinned Edge

```typescript
// TrailEdge becomes skinnable
function FlowEdge(props: EdgeProps) {
  const { skin, t } = useMetaphor()
  const { strength, resistance, status } = props.data
  
  const color = status === 'open' 
    ? skin.colors.success 
    : status === 'blocked' 
      ? skin.colors.danger 
      : skin.colors.secondary
  
  return (
    <g>
      <BaseEdge {...props} style={{ stroke: color, strokeWidth: Math.max(1, strength / 10) }} />
      <EdgeLabelRenderer>
        <div style={{ background: `${color}30` }}>
          <span>{t('flow')}</span>
          <span>{strength.toFixed(0)}</span>
          {status === 'open' && <span>{skin.icons.flow} {t('open')}</span>}
          {status === 'blocked' && <span>⛔ {t('blocked')}</span>}
        </div>
      </EdgeLabelRenderer>
    </g>
  )
}
```

### Skin Switcher

```typescript
function SkinSwitcher() {
  const { skin, setSkin } = useMetaphor()
  
  return (
    <div className="flex gap-2 p-2 bg-black/50 rounded-lg">
      {Object.values(skins).map(s => (
        <button
          key={s.id}
          onClick={() => setSkin(s.id)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm transition-all",
            skin.id === s.id 
              ? "bg-white/20 text-white" 
              : "text-slate-400 hover:text-white"
          )}
          style={{ borderColor: s.colors.primary }}
        >
          {s.icons.actor} {s.name}
        </button>
      ))}
    </div>
  )
}
```

## TypeQL Queries for UI

### actors.json

```typeql
# Generate actors for UI
fun ui_actors() -> { actor }:
  match 
    $a isa actor, 
        has actor-id $id, 
        has actor-name $name, 
        has actor-kind $kind,
        has actor-status $status;
  return { $a };

# Usage
match 
  let $actors in ui_actors();
  $actors has actor-id $id, has actor-name $name, has actor-kind $kind, has actor-status $status;
select $id, $name, $kind, $status;
```

### flows.json

```typeql
# Generate flows for UI
fun ui_flows($limit: integer) -> { connection }:
  match
    $c isa connection,
        has connection-id $id,
        has weight $w,
        has alarm $al,
        has connection-status $status;
    $c (source: $src, target: $tgt);
    $src has actor-id $src-id;
    $tgt has actor-id $tgt-id;
  sort $w desc;
  limit $limit;
  return { $c };

# With source/target
match
  let $flows in ui_flows(50);
  $flows (source: $src, target: $tgt),
      has weight $w, has alarm $al, has connection-status $status;
  $src has actor-id $src-id;
  $tgt has actor-id $tgt-id;
select $src-id, $tgt-id, $w, $al, $status;
```

### world.json (Complete)

```typeql
# Complete world state for UI
fun ui_world($group_id: string) -> { actor, connection, pattern }:
  match
    $g isa group, has group-id $group_id;
    (group: $g, member: $a) isa membership;
    $a isa actor;
    $c (source: $src, target: $tgt) isa connection;
    { $src = $a; } or { $tgt = $a; };
  return { $a, $c };
```

## JSON Schema

### World State

```typescript
interface WorldState {
  meta: {
    group: string
    metaphor: string
    timestamp: string
  }
  
  actors: Actor[]
  flows: Flow[]
  patterns: Pattern[]
  
  stats: {
    totalActors: number
    provenActors: number
    atRiskActors: number
    openFlows: number
    blockedFlows: number
    closingFlows: number
    totalStrength: number
    avgConfidence: number
  }
}

interface Actor {
  id: string
  name: string
  kind: string
  status: 'active' | 'proven' | 'at-risk'
  actions: string[]
  incoming: number
  outgoing: number
  heatLevel?: number
}

interface Flow {
  id: string
  from: string
  to: string
  fromTask?: string
  toTask?: string
  strength: number
  resistance: number
  status: 'open' | 'closing' | 'blocked'
  hits?: number
  misses?: number
}

interface Pattern {
  id: string
  name: string
  confidence: number
  discoveryCount: number
  sourceFlow: string
}
```

## The Pipeline

```
┌──────────────────┐
│     TypeDB       │
│  one.tql schema  │
│  metaphors.tql   │
└────────┬─────────┘
         │ store
         ▼
┌──────────────────┐
│   World Data     │
│  actors, flows   │
│  patterns        │
└────────┬─────────┘
         │ ui_world()
         ▼
┌──────────────────┐
│   TypeQL Query   │
│  select, sort    │
│  aggregate       │
└────────┬─────────┘
         │ HTTP / parse
         ▼
┌──────────────────┐
│   JSON State     │
│  WorldState      │
└────────┬─────────┘
         │ React Context
         ▼
┌──────────────────┐
│  UI Components   │
│  ActorNode       │
│  FlowEdge        │
└────────┬─────────┘
         │ useMetaphor()
         ▼
┌──────────────────┐
│  Metaphor Skin   │
│  labels, colors  │
│  icons           │
└──────────────────┘
```

## Live Updates

```typescript
// hooks/useWorld.ts
export function useWorld(groupId: string) {
  const [world, setWorld] = useState<WorldState | null>(null)
  
  useEffect(() => {
    // Initial load
    loadWorld(groupId).then(setWorld)
    
    // Subscribe to changes (WebSocket or polling)
    const unsubscribe = subscribe(groupId, (delta) => {
      setWorld(prev => applyDelta(prev, delta))
    })
    
    return unsubscribe
  }, [groupId])
  
  return world
}

// Delta types
interface WorldDelta {
  type: 'actor-update' | 'flow-update' | 'pattern-created'
  payload: Partial<Actor | Flow | Pattern>
}
```

## File Structure

```
src/
├── engine/
│   ├── substrate.ts      # 70 lines - unit + colony + envelope
│   ├── one.ts            # 70 lines - world() interface
│   └── persist.ts        # 40 lines - TypeDB persistence
│
├── schema/
│   ├── one.tql           # 150 lines - 6 dimensions
│   └── metaphors.tql     # 150 lines - universal ontology
│
├── api/
│   ├── world.ts          # TypeQL → JSON
│   └── subscribe.ts      # Real-time updates
│
├── contexts/
│   ├── WorldContext.tsx  # World state provider
│   └── MetaphorContext.tsx # Skin provider
│
├── components/
│   ├── graph/
│   │   ├── WorldGraph.tsx      # Main visualization
│   │   ├── ActorNode.tsx       # Skinnable actor node
│   │   ├── FlowEdge.tsx        # Skinnable flow edge
│   │   └── EntryNode.tsx       # Skinnable entry point
│   │
│   ├── panels/
│   │   ├── FlowPanel.tsx       # Open/blocked flows
│   │   ├── ActorPanel.tsx      # Proven/at-risk actors
│   │   └── PatternPanel.tsx    # Crystallized knowledge
│   │
│   └── controls/
│       ├── SkinSwitcher.tsx    # Metaphor selector
│       ├── FlowEditor.tsx      # Adjust strength/resistance
│       └── SignalInjector.tsx  # Test signals
│
└── skins/
    ├── index.ts          # Skin definitions
    ├── ant.ts
    ├── brain.ts
    ├── team.ts
    ├── mail.ts
    ├── water.ts
    └── signal.ts
```

## Integration Points

| Source | Provides | Consumers |
|--------|----------|-----------|
| `one.tql` | Schema, inference rules | TypeDB |
| `metaphors.tql` | Universal functions | Query layer |
| `ui_world()` | JSON state | React components |
| `WorldContext` | Actor/flow state | Nodes, edges |
| `MetaphorContext` | Labels, colors | All components |
| `skins/*.ts` | Skin definitions | SkinSwitcher |

## The Vision

```
User selects metaphor: "Ant Colony"
                ↓
UI applies skin: green tones, ant emoji, "trail" labels
                ↓
Same TypeDB data: actors, flows, patterns
                ↓
Same inference: open/blocked/proven/at-risk
                ↓
Different experience: intuitive to domain expert
```

Switch to "Neural Network":
- Actors become neurons
- Flows become synapses
- Trails become pathways
- Colors shift to purple
- Same data, different lens

## The Truth

```
TypeDB stores ONE ontology (universal)
TypeQL queries extract state (functions)
JSON carries to frontend (transport)
React renders components (structure)
Skins provide metaphors (meaning)

The ontology is ONE.
The views are many.
```

---

*One database. Many metaphors. Infinite clarity.*
