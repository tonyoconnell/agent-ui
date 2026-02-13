# PLAN: Emergent Intelligence System

## The Foundation

We have 85 lines of code. The substrate for emergent intelligence.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   unit.js (30 lines)         colony.js (55 lines)              │
│   ─────────────────          ──────────────────────             │
│   Nodes that compute         Edges that connect                 │
│                              Weights that learn                 │
│                              Signals that flow                  │
│                                                                 │
│   THE LOOP:                                                     │
│   Signal travels → Edge strengthens → More signals follow      │
│   Time passes → Edge weakens → Path forgotten                  │
│                                                                 │
│   That's intelligence.                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

This plan builds everything else on top of this foundation.

---

## The Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │     │             │
│ agents.tql  │────▶│ agents.json │────▶│  colony.js  │────▶│ index.astro │
│             │     │             │     │             │     │             │
│  (schema)   │     │   (data)    │     │  (runtime)  │     │    (UI)     │
│             │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘

     WHAT              WHAT               WHAT              WHAT
     CAN               DOES               RUNS              YOU
     EXIST             EXIST                                SEE
```

---

## What We Have (Keep It!)

The current UI is beautiful. We keep it and evolve it.

```
┌─────────────────────────────────────────────────────────────────┐
│                    CURRENT UI (KEEP)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  AGENT GRID                                              │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                  │   │
│  │  │ Scout   │  │ Analyst │  │ Trader  │   Beautiful      │   │
│  │  │ ● ready │  │ ● ready │  │ ○ idle  │   cards          │   │
│  │  └─────────┘  └─────────┘  └─────────┘                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  TABS                                                    │   │
│  │  [Agents] [scout] [analyst] [trader]    Clickable tabs  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  FLOW VIEW (EnvelopeFlowCanvas)                          │   │
│  │  ┌──────────┐    ┌───────┐    ┌──────────┐              │   │
│  │  │ envelope │───▶│ logic │───▶│ callback │   Animated   │   │
│  │  └──────────┘    └───────┘    └──────────┘              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ✓ Dark theme                                                  │
│  ✓ Status dots (green/amber/red)                               │
│  ✓ ReactFlow visualization                                     │
│  ✓ Tab management (open/close)                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Hybrid Evolution

Keep the beautiful UI. Add the intelligence.

```
┌─────────────────────────────────────────────────────────────────┐
│                    EVOLVED UI                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Colony] [scout] [analyst] [trader]              ← ADD Colony  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  WHEN "Colony" TAB SELECTED: (NEW)                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │       ┌──────┐══════════════════▶┌────────┐             │   │
│  │       │SCOUT │    scent: 847     │ANALYST │             │   │
│  │       └──────┘                   └────────┘             │   │
│  │            │                          │                  │   │
│  │            │ scent: 12               │ scent: 392       │   │
│  │            ▼                          ▼                  │   │
│  │       ┌──────┐                   ┌────────┐             │   │
│  │       │LOGGER│                   │ TRADER │             │   │
│  │       └──────┘                   └────────┘             │   │
│  │                                                          │   │
│  │  Full network graph — all nodes, all edges, all weights │   │
│  │  Edge thickness = scent strength                        │   │
│  │  Watch highways emerge in real-time                     │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  WHEN AGENT TAB SELECTED: (ENHANCED)                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  INCOMING EDGES                    (NEW)                 │   │
│  │  ════════════════════════════════════════                │   │
│  │  scout:observe → analyst:evaluate   scent: 847  ███████ │   │
│  │  logger:check → analyst:evaluate    scent: 12   █░░░░░░ │   │
│  │                                                          │   │
│  │  ┌──────────┐    ┌───────┐    ┌──────────┐              │   │
│  │  │ envelope │───▶│ logic │───▶│ callback │  (KEEP)      │   │
│  │  └──────────┘    └───────┘    └──────────┘              │   │
│  │                                                          │   │
│  │  OUTGOING EDGES                    (NEW)                 │   │
│  │  ════════════════════════════════════════                │   │
│  │  analyst:evaluate → trader:execute  scent: 392  █████░░ │   │
│  │  analyst:decide → logger:record     scent: 5    █░░░░░░ │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  HIGHWAYS PANEL (NEW - sidebar or bottom)                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🛤️ HIGHWAYS                                             │   │
│  │  ───────────────────────────────────────────────────     │   │
│  │  scout:observe → analyst:evaluate    ████████████  847   │   │
│  │  analyst:evaluate → trader:execute   ████████░░░░  392   │   │
│  │  entry → scout:observe               ██████░░░░░░  234   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layer 1: Schema (agents.tql)

The TypeQL schema defines what CAN exist in the system.

```tql
# Nodes (chambers/units)
entity agent,
    owns id @key,
    owns name,
    owns status;

# Node capabilities (tasks/services)
entity action,
    owns action-name @key,
    owns result;

relation capability,
    relates executor,    # agent
    relates action;      # what it can do

# Signals (ants/envelopes)
entity envelope,
    owns id @key,
    owns action-name,
    owns inputs,
    owns payload-status;

# Edges (trails between nodes)
relation routing,
    relates sender,
    relates receiver,
    relates message;

# Paths (callback chains)
relation chain,
    relates parent,
    relates child;

# Edge weights (pheromones/scent)
attribute scent, value double;

relation trail,
    relates from-node,
    relates to-node,
    owns scent;
```

**This is the genome.** It defines the shape of intelligence.

---

## Layer 2: Data (agents.json)

The JSON data describes what DOES exist. Keep current format, add edges.

```json
{
  "agents": [
    {
      "id": "scout",
      "name": "Scout",
      "actions": {
        "observe": { "processed": true },
        "report": { "reported": true }
      }
    },
    {
      "id": "analyst",
      "name": "Analyst",
      "actions": {
        "evaluate": { "signal": "strong" },
        "decide": { "action": "buy" }
      }
    },
    {
      "id": "trader",
      "name": "Trader",
      "actions": {
        "execute": { "executed": true, "orderId": "123" }
      }
    }
  ],

  "envelopes": [
    {
      "action": "observe",
      "inputs": { "source": "feed" },
      "sender": "system",
      "receiver": "scout",
      "callback": {
        "action": "evaluate",
        "inputs": { "data": "{{ results }}" },
        "sender": "scout",
        "receiver": "analyst",
        "callback": {
          "action": "execute",
          "inputs": { "signal": "{{ results }}" },
          "sender": "analyst",
          "receiver": "trader"
        }
      }
    }
  ]
}
```

**This is the phenotype.** Specific instances of the pattern.

---

## Layer 3: Runtime (colony.js + unit.js)

Replace OLD engine with NEW engine. Minimal change.

```javascript
// OLD (AgentWorkspace.tsx)
import { Runtime, Agent, createEnvelope } from "@/engine"
const runtime = new Runtime()
agents.forEach(a => runtime.register(a))
await runtime.send(createEnvelope(env))

// NEW (AgentWorkspace.tsx)
import { colony } from "@/engine"
const net = colony()
data.agents.forEach(a => net.spawnFromJSON(a))
await net.send(env)

// The network is now LEARNING
// Edges strengthen with each signal
// Call net.highways() to see what emerged
```

---

## Layer 4: UI Evolution

### Step 1: Replace Engine (Minimal Change)

Update `AgentWorkspace.tsx` to use `colony` instead of `Runtime`.
Everything else stays the same initially.

```tsx
// src/components/AgentWorkspace.tsx

import { colony } from "@/engine"
import type { Colony } from "@/engine"

async function load() {
  const res = await fetch("/agents.json")
  const data = await res.json()

  // NEW: Use colony instead of Runtime
  const net = colony()

  // Spawn agents as chambers
  for (const agent of data.agents) {
    net.spawnFromJSON(agent)
  }

  // Process envelopes — edges strengthen automatically!
  for (const env of data.envelopes) {
    await net.send(env)
  }

  return { colony: net, agents: data.agents }
}
```

### Step 2: Add Highways Panel

Add a panel showing the strongest edges.

```tsx
// src/components/panels/HighwayPanel.tsx

interface HighwayPanelProps {
  colony: Colony
}

export function HighwayPanel({ colony }: HighwayPanelProps) {
  const highways = colony.highways(10)

  return (
    <div className="bg-[#161622] rounded-xl p-4 border border-[#252538]">
      <h3 className="text-sm text-slate-500 uppercase mb-3">Highways</h3>
      <div className="space-y-2">
        {highways.map(({ edge, strength }) => (
          <div key={edge} className="flex items-center gap-3">
            <div className="flex-1">
              <code className="text-xs text-slate-400">{edge}</code>
            </div>
            <div className="w-24 h-2 bg-[#252538] rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${Math.min(strength, 100)}%` }}
              />
            </div>
            <span className="text-xs text-slate-500 w-12 text-right">
              {strength.toFixed(0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Step 3: Add Colony Tab

Add a "Colony" tab that shows the full network graph.

```tsx
// In Tabs component, add Colony as first tab
<button
  onClick={() => onSelect("colony")}
  className={cn(
    "px-4 py-3 text-sm font-medium border-b-2 -mb-px",
    active === "colony" ? "text-white border-blue-500" : "text-slate-500"
  )}
>
  Colony
</button>
```

### Step 4: Add Edge Info to Flow View

Show incoming/outgoing edges for the selected agent.

```tsx
// src/components/EdgeInfo.tsx

interface EdgeInfoProps {
  colony: Colony
  agentId: string
  direction: "incoming" | "outgoing"
}

export function EdgeInfo({ colony, agentId, direction }: EdgeInfoProps) {
  const highways = colony.highways(50)

  const edges = highways.filter(({ edge }) => {
    const [from, to] = edge.split(" → ")
    if (direction === "incoming") {
      return to.startsWith(agentId + ":")
    } else {
      return from.startsWith(agentId + ":")
    }
  })

  return (
    <div className="space-y-1">
      <div className="text-xs text-slate-500 uppercase">
        {direction === "incoming" ? "Incoming Edges" : "Outgoing Edges"}
      </div>
      {edges.map(({ edge, strength }) => (
        <div key={edge} className="flex items-center gap-2 text-xs">
          <code className="text-slate-400 flex-1">{edge}</code>
          <div className="w-16 h-1.5 bg-[#252538] rounded-full">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${Math.min(strength, 100)}%` }}
            />
          </div>
          <span className="text-slate-500">{strength.toFixed(0)}</span>
        </div>
      ))}
      {edges.length === 0 && (
        <div className="text-xs text-slate-600">No edges yet</div>
      )}
    </div>
  )
}
```

### Step 5: Colony Graph View

Full network visualization for the Colony tab.

```tsx
// src/components/graph/ColonyGraph.tsx

import ReactFlow, { Node, Edge } from '@xyflow/react'

export function ColonyGraph({ colony }: { colony: Colony }) {
  const nodes: Node[] = colony.list().map((id, i) => ({
    id,
    data: { label: id, tasks: colony.get(id)?.list() || [] },
    position: { x: 200 * (i % 3), y: 200 * Math.floor(i / 3) }
  }))

  const edges: Edge[] = colony.highways(50).map(({ edge, strength }) => {
    const [from, to] = edge.split(" → ")
    const sourceId = from === "entry" ? "entry" : from.split(":")[0]
    const targetId = to.split(":")[0]

    return {
      id: edge,
      source: sourceId,
      target: targetId,
      label: strength.toFixed(0),
      style: {
        strokeWidth: Math.max(1, Math.min(strength / 50, 10)),
        stroke: strength > 100 ? "#3b82f6" : "#64748b"
      },
      animated: strength > 100
    }
  })

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      fitView
      className="bg-[#0f0f17]"
    />
  )
}
```

---

## Layer 5: The Learning Loop

The UI shows the system learning in real-time.

### Live Updates

```tsx
// In AgentWorkspace, add state for highways
const [highways, setHighways] = useState<Edge[]>([])

// Update after each signal
async function sendSignal(env: Envelope) {
  await colony.send(env)
  setHighways(colony.highways(10))  // Trigger re-render
}

// Periodic decay
useEffect(() => {
  const interval = setInterval(() => {
    colony.fade(0.1)
    setHighways(colony.highways(10))
  }, 5000)
  return () => clearInterval(interval)
}, [colony])
```

---

## Build Order

### Phase 1: Foundation (DONE ✓)

- [x] `src/engine/unit.js` — Node (30 lines)
- [x] `src/engine/colony.js` — Network + Learning (55 lines)
- [x] `src/engine/unit.ts` — TypeScript version
- [x] `src/engine/colony.ts` — TypeScript version

### Phase 2: Engine Swap (Minimal Change)

- [ ] Update `AgentWorkspace.tsx` — Replace `Runtime` with `colony`
- [ ] Keep all existing UI components working
- [ ] Verify signals flow and edges strengthen

### Phase 3: Highways Panel

- [ ] Create `src/components/panels/HighwayPanel.tsx`
- [ ] Add to AgentWorkspace layout (sidebar or bottom)
- [ ] Show top 10 edges with strength bars

### Phase 4: Edge Info in Flow View

- [ ] Create `src/components/EdgeInfo.tsx`
- [ ] Add incoming edges above EnvelopeFlowCanvas
- [ ] Add outgoing edges below EnvelopeFlowCanvas

### Phase 5: Colony Tab

- [ ] Add "Colony" tab to tab bar
- [ ] Create `src/components/graph/ColonyGraph.tsx`
- [ ] Show full network with weighted edges

### Phase 6: Live Learning

- [ ] Add periodic fade with visual update
- [ ] Add signal injection UI
- [ ] Watch highways emerge in real-time

### Phase 7: Real Data

- [ ] Connect to Hyperliquid ticks
- [ ] Stream real signals through the colony
- [ ] Watch trading patterns emerge as highways

---

## Component Summary

### Keep (Current Components)

| Component | Status | Notes |
|-----------|--------|-------|
| `AgentWorkspace.tsx` | MODIFY | Replace engine, add highways |
| `EnvelopeFlowCanvas.tsx` | KEEP | Add edge info above/below |
| `Tabs` component | MODIFY | Add Colony tab |
| `Grid` component | KEEP | Beautiful agent cards |
| `Flow` component | MODIFY | Add EdgeInfo panels |
| `Dot` component | KEEP | Status indicators |

### Add (New Components)

| Component | Purpose |
|-----------|---------|
| `HighwayPanel.tsx` | Show top edges with strength |
| `EdgeInfo.tsx` | Incoming/outgoing edges for agent |
| `ColonyGraph.tsx` | Full network visualization |

---

## The Minimal Path

The fastest way to see it work:

```
1. Replace Runtime with colony          (30 min)
2. Add HighwayPanel to layout           (30 min)
3. Log highways to console              (5 min)
4. Send multiple signals                (5 min)
5. Watch highways grow                  (immediate)
```

**That's it.** The learning is already in the 85 lines.
The UI just needs to show it.

---

## The Profound Simplicity

Everything builds on 85 lines.

```
agents.tql    →  What CAN exist (schema)
agents.json   →  What DOES exist (data)
colony.js     →  What LIVES (runtime)
components/   →  What you SEE (UI)
```

The current UI is beautiful. We keep it.
We add the intelligence underneath.
We surface it through highways and edge weights.

**The network learns. The UI reveals.**

```
Signal travels → Edge strengthens → Highway emerges → You see it
Time passes → Edge weakens → Highway fades → You see it
```

This is what ants discovered 100 million years ago.
This is what we built in 85 lines.
This is what the UI will show.

---

*Keep what's beautiful. Add what's intelligent. Show what emerges.*
