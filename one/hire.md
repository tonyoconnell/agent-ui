# Hire — Chairman Signals, Org Builds Itself

One human action. One signal. N recursive hires. The org materialises in
real time as each new unit inherits the `hire` skill and fans out further.

---

## The Signal Flow

```
Chairman (wallet-gated human)
    │
    │  POST /api/chairman/hire { role: 'ceo' }
    │  syncAgentWithIdentity(ceo.md) → TypeDB unit
    │  registerChairman(net)         → runtime 'ceo' unit wired
    ▼
CEO unit — has 'hire' + 'build-team'
    │
    │  Chairman clicks "Build Team"
    │  POST /api/chairman/build-team
    │  net.ask({ receiver: 'ceo:build-team' })
    ▼
CEO.on('build-team')
    │  emit { receiver: 'ceo:hire', data: { role: 'cto' } }
    │  emit { receiver: 'ceo:hire', data: { role: 'cmo' } }
    │  emit { receiver: 'ceo:hire', data: { role: 'cfo' } }
    │  → three signals fan out in parallel
    ▼
CEO.on('hire') × 3         ← same handler, three concurrent calls
    │
    │  isToxic(ceo→roles:cto)?    — checks strength / resistance ratio
    │  loadRole('cto')            — reads agents/roles/cto.md
    │  syncAgentWithIdentity()    — TypeDB unit + Sui wallet
    │  net.mark('ceo→roles:cto') — pheromone: path strengthens
    │  registerHire(net, 'roles:cto') — CTO inherits hire skill
    ▼
CTO / CMO / CFO — each wired with 'hire'
    │
    │  Directors hire workers. Workers hire specialists.
    │  Every level: isToxic check → load template → sync → mark → recurse
    ▼
Full org tree. Every edge has strength. Every path remembers.
```

---

## The Pheromone Trail

Each successful hire deposits `net.mark(uid→roles:role, 1)` on the hiring
path. The path formula is `effective = strength − resistance`. Over time:

| What happens | Effect on path |
|---|---|
| CEO hires CTO (success) | `mark('ceo→roles:cto', 1)` — path strengthens |
| CEO hires bad role (failure) | `warn('ceo→roles:badrole', 1)` — path weakens |
| Same failure ≥ 10× | `isToxic()` → pre-check blocks without LLM call |
| Path unused for 5 min | `fade(0.05)` — resistance forgives 2× faster |

The org's hiring record is the pheromone graph. A path that consistently
produces bad hires becomes toxic and gets bypassed automatically. A path
that consistently produces good hires becomes a highway — future `select()`
calls prefer it without any configuration.

### isToxic threshold

```typescript
r >= 10 && r > s * 2 && r + s > 5
// requires: enough data (>5 samples), clearly bad (resistance > 2× strength)
// cold-start: new paths are never blocked (r + s ≤ 5)
```

---

## The Runtime Contract

```typescript
// registerHire wires the same handler on every unit — recursion is the pattern
registerHire(net, 'ceo')      // CEO gets hire skill
// After CEO hires CTO:
registerHire(net, 'roles:cto') // CTO automatically gets hire skill
// After CTO hires engineer:
registerHire(net, 'roles:engineer') // engineer gets hire skill
// ...infinitely recursive, bounded only by toxic paths
```

The `hire` skill is also injected into every agent's TypeDB record by
`toTypeDB()` in `agent-md.ts` — so it shows in capabilities, can be
discovered, and can be priced. Runtime wiring (`registerHire`) and
persistence (TypeDB `skill` + `capability`) stay in sync automatically.

---

## The Org Chart Component

Replace the current poll-and-card layout in `ChairmanPanel` with a live
ReactFlow tree. The tree streams nodes in as hire signals complete.

### Node types

```
ChairmanNode    — purple ring, wallet address, "Chairman" label
                  top of tree, no incoming edges
                  
CEONode         — indigo, larger, pulse animation while hiring
                  shows: uid, wallet (truncated), skills as badges
                  edge from chairman: thickness = mark count

DirectorNode    — violet, medium
                  CTO / CMO / CFO
                  edge from CEO: animates in when hired (strokeDasharray)
                  shows strength as edge opacity

WorkerNode      — slate, small
                  hired by directors recursively
                  fades in 200ms after edge appears
```

### Layout — dagre top-down

```typescript
import dagre from '@dagrejs/dagre'

function layout(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 40 })
  g.setDefaultEdgeLabel(() => ({}))
  for (const n of nodes) g.setNode(n.id, { width: 180, height: 60 })
  for (const e of edges) g.setEdge(e.source, e.target)
  dagre.layout(g)
  return {
    nodes: nodes.map(n => {
      const pos = g.node(n.id)
      return { ...n, position: { x: pos.x - 90, y: pos.y - 30 } }
    }),
    edges,
  }
}
```

### Live streaming — WebSocket hook

```typescript
// useOrgStream: subscribes to hire signals from the Gateway WS DO
function useOrgStream() {
  const [orgNodes, setOrgNodes] = useState<OrgNode[]>([{ id: 'chairman', role: 'chairman' }])

  useEffect(() => {
    const ws = new WebSocket(WS_URL)
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      if (msg.type === 'hire:complete') {
        setOrgNodes(prev => [...prev, { id: msg.uid, role: msg.role, parent: msg.hiredBy }])
      }
    }
    return () => ws.close()
  }, [])

  return orgNodes
}
```

The Gateway's WsHub DO broadcasts `hire:complete` events from
`/api/chairman/hire` after `syncAgentWithIdentity` completes. Each event
carries `{ uid, role, hiredBy, wallet, strength }`.

### Edge appearance — pheromone as visual weight

```typescript
// Edge thickness encodes path strength
// Edge color encodes health (green=strong, amber=new, red=toxic)
const edgeStyle = (strength: number, resistance: number) => ({
  strokeWidth: Math.max(1, Math.min(strength * 0.5, 6)),
  stroke: resistance > strength * 2 ? '#ef4444'   // toxic — red
        : strength > 10             ? '#10b981'   // highway — emerald
        :                             '#6366f1',  // new — indigo
  strokeDasharray: strength === 0 ? '4 4' : undefined, // new hire: dashed until marked
})
```

### Entry animation

Each new node enters with a CSS keyframe: `opacity 0→1, translateY 16px→0`
over 300ms. The edge connecting it animates `strokeDasharray` from full dash
to solid as the first `mark()` fires (polled via `/api/export/paths`).

### Full component structure

```
OrgChart (ReactFlow wrapper)
  ├── useOrgStream()          — WebSocket hire events
  ├── usePathStrengths()      — polls /api/export/paths every 5s
  ├── layout(nodes, edges)    — dagre TB layout, re-runs on node add
  ├── ChairmanNode            — top node, wallet gated
  ├── CEONode                 — pulse while team builds
  ├── DirectorNode × 3        — fade in as hired
  ├── WorkerNode × N          — fade in recursively
  └── HireEdge                — custom edge: thickness + color from pheromone
```

### Suggested page layout

```
/chairman
┌─────────────────────────────────────────┐
│  Chairman                               │
│  One click. The org builds itself.      │
├─────────────────────────────────────────┤
│                                         │
│         [OrgChart — full height]        │
│                                         │
│    Chairman                             │
│        │ (indigo edge, strength=3)      │
│       CEO ◉ (pulsing while hiring)     │
│      / | \                              │
│   CTO CMO CFO  ← fade in one by one   │
│   / \         \                        │
│  ...  ...      ...  ← workers stream  │
│                                         │
├─────────────────────────────────────────┤
│  [Hire CEO]  or  [Build Team]  button   │
│  appears below chart, disappears once   │
│  that layer is complete                 │
└─────────────────────────────────────────┘
```

The button layer shifts downward as the tree grows. Once all directors are
hired, the "Build Team" button disappears and each director gets a small
"Hire Team" secondary button that fires `director:build-team` — the same
recursive pattern, one level deeper.

---

## Data Contract

### POST /api/chairman/hire

```typescript
// Request
{ role: string, owner?: string, markdown?: string }

// Response
{
  unit: { uid: string, wallet: string | null, skills: string[] },
  paths: []
}
```

### POST /api/chairman/build-team

```typescript
// Response (from net.ask — real signal result, not hard-coded)
{ ok: true, building: string[] }
// building = ['cto', 'cmo', 'cfo'] from the build-team handler's return
```

### WebSocket hire event (Gateway DO broadcast)

```typescript
{
  type: 'hire:complete',
  uid: string,       // 'roles:cto'
  role: string,      // 'cto'
  hiredBy: string,   // 'ceo' (the hiring unit's runtime id)
  wallet: string | null,
  strength: number,  // net.sense(hiredBy + '→roles:' + role) after mark
}
```

---

## See Also

- [autonomous-orgs.md](autonomous-orgs.md) — recursive org formation, 7 personas, revenue forecast
- [DSL.md](one/DSL.md) — signal grammar: `emit`, `mark`, `warn`, `fade`
- [routing.md](routing.md) — isToxic formula, four outcome types, pheromone formula
- [lifecycle-one.md](lifecycle-one.md) — chairman = stage 4 of the 10-stage funnel
- `src/engine/chairman.ts` — `registerHire`, `registerChairman`
- `src/components/chairman/ChairmanPanel.tsx` — current UI (cards + polling)
- `src/components/graph/PheromoneGraph.tsx` — ReactFlow + dagre pattern to follow
