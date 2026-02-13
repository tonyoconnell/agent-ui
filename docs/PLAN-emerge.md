# Emergent Intelligence System

## Status: COMPLETE (Phases 1-6)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   70 lines.  Two fields.  Concurrency safe.  AI agents.                     │
│                                                                             │
│   { receiver, payload }                                                     │
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
src/engine/colony.ts       →  Legacy compatible
```

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
{ receiver, payload }              // Two fields
.on(name, (p, emit, ctx) => r)     // Define task
.then(name, r => envelope)         // Define continuation
ctx: { from, self }                // Know identity
emit(envelope)                     // Fan out
```

### Colony Editor (Interactive)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   OBSERVE                        INTERACT                                   │
│   ───────                        ────────                                   │
│   • Colony graph                 • Draw edges (drag handle → handle)        │
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

### ✓ Phase 5: Colony Tab
- [x] Colony tab in navigation
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
  emit({ receiver: 'oracle', payload: { q, replyTo: self } })
})

// Claim Task
.on('claim', ({ id }, emit, { from }) => {
  !claims[id] && (claims[id] = from,
    emit({ receiver: from, payload: { claimed: id } }))
})

// Payment
.on('pay', ({ to, amount }, emit, { from }) => {
  bal[from] >= amount && (
    bal[from] -= amount, bal[to] += amount,
    emit({ receiver: to, payload: { received: amount } }))
})

// Swarm Formation
.on('join', ({ capabilities }, emit, { from }) => {
  registry[from] = capabilities
  Object.keys(registry).forEach(id =>
    emit({ receiver: id, payload: { joined: from } }))
})

// Streaming
.on('ingest', async ({ url }, emit) => {
  const s = await connect(url)
  s.on('data', d => emit({ receiver: 'process', payload: d }))
})
```

---

## Files

```
src/engine/
├── substrate.ts              # 70 lines — THE FOUNDATION
├── unit.ts                   # Legacy compatible
├── colony.ts                 # Legacy compatible
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
net.send({ receiver: 'ingest:youtube', payload: { url: 'https://...' } })

// Hyperliquid ticks
net.send({ receiver: 'ingest:hyperliquid', payload: { market: 'BTC-USD' } })

// Twitter firehose
net.send({ receiver: 'ingest:twitter', payload: { query: '#bitcoin' } })

// RSS feeds
net.send({ receiver: 'ingest:rss', payload: { feeds: [...] } })
```

### Phase 8: Multi-Colony

```typescript
// Federation between colonies
colonyA.send({ receiver: 'bridge:colonyB', payload: { ... } })

// Cross-colony highways
colonyA.highways() + colonyB.highways()
```

### Phase 9: Persistence Layer

```typescript
// TypeDB integration
typedb.insert(colony.scent)
typedb.query('match $e isa edge, has strength > 50')
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
