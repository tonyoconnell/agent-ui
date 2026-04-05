# Emergent Intelligence System

## Status: COMPLETE (Phases 1-6)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   70 lines.  Two fields.  Concurrency safe.  AI agents.                     │
│                                                                             │
│   { receiver, data }                                                        │
│                                                                             │
│   Everything else emerges.                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## The Foundation (DONE)

```
src/engine/substrate.ts    →  70 lines, the substrate
src/engine/unit.ts         →  Legacy compatible
src/engine/world.ts       →  Legacy compatible
```

## The Primitive

```typescript
type Signal = {
  receiver: string
  data?: unknown
}
```

**The Verbs:**
- **signal** - move through world
- **mark** - add weight to path
- **fade** - decay
- **trace** - query

---

## The Flow (DONE)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │     │             │
│ agents.tql  │────▶│ agents.json │────▶│ substrate   │────▶│ ColonyEditor│
│             │     │             │     │             │     │             │
│  (schema)   │     │   (data)    │     │  (runtime)  │     │    (UI)     │
│             │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘

     WHAT              WHAT               WHAT              WHAT
     CAN               DOES               LIVES             YOU
     EXIST             EXIST                                SEE + SHAPE
```

---

## What's Built

### Substrate (70 lines)

```typescript
{ receiver, data }                 // Two fields
.on(name, (d, emit, ctx) => r)     // Define task
.then(name, r => signal)           // Define continuation
ctx: { from, self }                // Know identity
emit(signal)                       // Fan out
```

### World Editor (Interactive)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   OBSERVE                        INTERACT                                   │
│   ───────                        ────────                                   │
│   • World graph                 • Draw edges (drag handle → handle)        │
│   • Edge weights                 • Pheromone editor (click edge)            │
│   • Heat map mode                • Signal injection (double-click node)     │
│   • Superhighway detection       • Spawn nodes (drag from palette)          │
│                                                                             │
│   AUTOMATE                       PERSIST                                    │
│   ────────                       ───────                                    │
│   • Record signals               • Save colony state (JSON)                 │
│   • Replay signals               • Load colony state                        │
│   • AI self-organization         • Position persistence                     │
│   • Time-lapse evolution         • Scent persistence                        │
│                                                                             │
│   CELEBRATE                                                                 │
│   ─────────                                                                 │
│   • Particle burst on superhighway formation                                │
│   • Animated signal tracers                                                 │
│   • Pulsing highways                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phases Completed

### ✓ Phase 1: Foundation
- [x] `substrate.ts` — 70 lines, zero returns, two fields
- [x] Context awareness: `{ from, self }`
- [x] Concurrency safe (no global state)
- [x] `emit` for streaming/fan-out

### ✓ Phase 2: Engine Swap
- [x] `AgentWorkspace.tsx` uses colony
- [x] `agents.json` hydration working
- [x] Signals flow and edges strengthen

### ✓ Phase 3: Highways Panel
- [x] `HighwayPanel.tsx` created
- [x] Top edges with strength bars
- [x] Real-time updates

### ✓ Phase 4: Edge Info
- [x] `EdgeInfo.tsx` created
- [x] Incoming/outgoing edges per agent
- [x] Integrated in Flow view

### ✓ Phase 5: World Tab
- [x] World tab in navigation
- [x] `ColonyGraph.tsx` — full network visualization
- [x] `ColonyEditor.tsx` — interactive editing

### ✓ Phase 6: Live Learning
- [x] Periodic fade with visual update
- [x] Signal injection UI
- [x] Highways emerge in real-time
- [x] **BONUS**: Record/replay
- [x] **BONUS**: AI self-organization mode
- [x] **BONUS**: Heat map visualization
- [x] **BONUS**: Time-lapse evolution (1x-10x)
- [x] **BONUS**: Save/Load colony state
- [x] **BONUS**: Superhighway celebrations
- [x] **BONUS**: Pheromone slider editor
- [x] **BONUS**: Drag & drop node spawning

### ○ Phase 7: Real Data (NEXT)
- [ ] Connect to Hyperliquid ticks
- [ ] Stream real signals through colony
- [ ] Watch trading patterns emerge as highways
- [ ] Connect to other data sources

---

## AI Agent Patterns (READY)

The substrate supports all planned AI agent patterns:

```typescript
// Request / Response
.on('ask', ({ q }, emit, { self }) => {
  emit({ receiver: 'oracle', data: { q, replyTo: self } })
})

// Claim Task
.on('claim', ({ id }, emit, { from }) => {
  !claims[id] && (claims[id] = from,
    emit({ receiver: from, data: { claimed: id } }))
})

// Payment
.on('pay', ({ to, amount }, emit, { from }) => {
  bal[from] >= amount && (
    bal[from] -= amount, bal[to] += amount,
    emit({ receiver: to, data: { received: amount } }))
})

// Group Formation
.on('join', ({ capabilities }, emit, { from }) => {
  registry[from] = capabilities
  Object.keys(registry).forEach(id =>
    emit({ receiver: id, data: { joined: from } }))
})

// Streaming
.on('ingest', async ({ url }, emit) => {
  const s = await connect(url)
  s.on('data', d => emit({ receiver: 'process', data: d }))
})
```

---

## Files

```
src/engine/
├── substrate.ts              # 70 lines — THE FOUNDATION
├── unit.ts                   # Legacy compatible
├── world.ts                 # Legacy compatible
└── index.ts                  # Exports

src/components/
├── AgentWorkspace.tsx        # Main workspace
├── graph/
│   ├── ColonyGraph.tsx       # View mode
│   └── ColonyEditor.tsx      # Interactive mode (full features)
├── panels/
│   └── HighwayPanel.tsx      # Strongest paths
├── EdgeInfo.tsx              # Edge details per agent
└── EnvelopeFlowCanvas.tsx    # Flow visualization

docs/
├── code.md                   # Substrate specification
├── PLAN-emerge.md            # This file
└── examples.md               # Usage patterns
```

---

## What's Next

### Phase 7: Real Data Sources

```typescript
// YouTube streams
net.send({ receiver: 'ingest:youtube', data: { url: 'https://...' } })

// Hyperliquid ticks
net.send({ receiver: 'ingest:hyperliquid', data: { market: 'BTC-USD' } })

// Twitter firehose
net.send({ receiver: 'ingest:twitter', data: { query: '#bitcoin' } })

// RSS feeds
net.send({ receiver: 'ingest:rss', data: { feeds: [...] } })
```

### Phase 8: Multi-World

```typescript
// Federation between colonies
colonyA.send({ receiver: 'bridge:colonyB', data: { ... } })

// Cross-colony highways
colonyA.highways() + colonyB.highways()
```

### Phase 9: Persistence Layer

```typescript
// TypeDB integration
typedb.insert(world.strength)
typedb.query('match $e isa path, has strength > 50')
```

---

## The Insight

```
We planned 85 lines.
We built 70 lines (cleaner).

We planned 7 phases.
We completed 6 + bonuses.

We planned basic visualization.
We built an interactive editor.

The substrate is ready.
AI agents can:
  • Claim tasks
  • Pay each other
  • Negotiate
  • Form swarms
  • Stream data
  • Self-organize

70 lines.
Two fields.
Everything emerges.
```

---

## See Also

- [flows.md](flows.md) — How signals flow through the built substrate
- [emergence.md](emergence.md) — Theory behind the emergent intelligence system
- [TODO-emerge.md](TODO-emerge.md) — Detailed task tracking
- [agents.md](agents.md) — Agent patterns implemented in the substrate
- [group.md](group.md) — Coordination patterns the colony enables
- [code.md](code.md) — The 70-line substrate implementation
