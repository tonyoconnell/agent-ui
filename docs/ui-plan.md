# UI Plan

Build, watch, and shape intelligence. The living interface.

## The Vision

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              WORLD                                           │
│                                                                              │
│  ┌─────────────────────┐    ┌─────────────────────────────────────────────┐ │
│  │       CHAT          │    │                 GRAPH                        │ │
│  │                     │    │                                              │ │
│  │  [User speaks]      │    │    🌱 ──→ 🐜Scout ──→ 🐜Analyst ──→ 🐜Trader │ │
│  │  [Agent responds]   │    │              │            │            │      │ │
│  │  [Shows thinking]   │    │              ▼            ▼            ▼      │ │
│  │  [Generative UI]    │    │         pheromone    pheromone    pheromone   │ │
│  │                     │    │           trail        trail        trail     │ │
│  │  Voice: 🎤          │    │                                              │ │
│  │                     │    │    [Click to edit] [Drag to connect]         │ │
│  └─────────────────────┘    └─────────────────────────────────────────────┘ │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                           SANDBOX                                      │  │
│  │  New agents being built • Testing before integration • Preview flows   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  [🐜 Ant] [🔮 Brain] [👤 Team] [📬 Mail] [💧 Water] [📡 Signal]  Metaphor   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## The Loop Visualized

```
         USER                           WORLD                          TYPEDB
           │                              │                               │
           │  "Create a trading agent"    │                               │
           ├─────────────────────────────▶│                               │
           │                              │                               │
           │                              │  spawn(agent)                 │
           │                              ├──────────────────────────────▶│
           │                              │                               │
           │  [Watch agent appear]        │                               │
           │◀─────────────────────────────┤                               │
           │                              │                               │
           │  "Connect it to the scout"   │                               │
           ├─────────────────────────────▶│                               │
           │                              │                               │
           │                              │  flow(scout, trader)          │
           │                              ├──────────────────────────────▶│
           │                              │                               │
           │  [Watch edge animate]        │                               │
           │◀─────────────────────────────┤                               │
           │                              │                               │
           │  [Send test signal]          │                               │
           ├─────────────────────────────▶│                               │
           │                              │                               │
           │  [Watch particles flow]      │  strengthen()                 │
           │  [See edge thicken]          ├──────────────────────────────▶│
           │  [Trail becomes highway]     │                               │
           │◀─────────────────────────────┤                               │
```

## Three Zones

| Zone | Purpose | Interaction |
|------|---------|-------------|
| **Chat** | Converse, command, observe | Voice, text, generative UI |
| **Graph** | Visualize, connect, shape | Click, drag, draw edges |
| **Sandbox** | Test, preview, experiment | Safe space before integration |

## Integration: ONE Repo Chat + Envelopes Graph

### From ONE Repo (../ONE/web/src)

```
components/ai/Chat.tsx           → ChatPanel (AI SDK streaming)
components/ai/chat/ChatInput.tsx → Voice + text input
components/ai/chat/ChatMessages.tsx → Message display
stores/chat-store.ts             → Nanostores state
hooks/use-voice-input.ts         → Speech recognition
```

### From Envelopes (this repo)

```
components/graph/WorldGraph.tsx  → Skinnable visualization
contexts/MetaphorContext.tsx     → Skin switching
skins/index.ts                   → 6 metaphor definitions
engine/one.ts                    → World interface
```

### Merged Architecture

```typescript
// WorldView.tsx - Main layout
function WorldView() {
  return (
    <MetaphorProvider>
      <div className="grid grid-cols-[350px_1fr]">
        <ChatPanel onCommand={handleCommand} />
        <GraphPanel />
      </div>
      <SandboxDrawer />
    </MetaphorProvider>
  )
}
```

## Chat → World Commands

```typescript
// Natural language → world operations
type WorldCommand =
  | { type: 'spawn'; id: string; kind: string; tasks: string[] }
  | { type: 'connect'; from: string; to: string }
  | { type: 'send'; to: string; payload: unknown }
  | { type: 'strengthen'; from: string; to: string }
  | { type: 'resist'; from: string; to: string }
  | { type: 'query'; query: 'open' | 'blocked' | 'proven' | 'atRisk' }

// Voice commands
"Create a new scout agent"           → { type: 'spawn', kind: 'scout' }
"Connect scout to analyst"           → { type: 'connect', from: 'scout', to: 'analyst' }
"Send a test signal"                 → { type: 'send', to: 'scout', payload: { test: true } }
"Show me the highways"               → { type: 'query', query: 'open' }
"Strengthen scout to analyst"        → { type: 'strengthen', from: 'scout', to: 'analyst' }
```

## Multi-Agent Parallel Chains

```
┌─────────────────────────────────────────────────────────────────┐
│                     PARALLEL CHAINS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Market (blue)        scout ══▶ analyst ══▶ trader              │
│  Intelligence (purple) forager ══▶ relay ══▶ queen              │
│  Defense (red)        soldier ══▶ sentinel                      │
│  Care (green)         nurse ══▶ nurse                           │
│  Recon (amber)        scout ══▶ forager ══▶ queen               │
│                                                                 │
│  ● = signal in flight    ══ = highway    ── = active            │
└─────────────────────────────────────────────────────────────────┘
```

## Training Visualization

### Heat Map Mode

```
🔴 Hot (high traffic, strong trails)
🟠 Warm (moderate traffic)
🟡 Active (some traffic)
🟢 Cool (low traffic)
⚫ Cold (no recent traffic)
```

### Time-Lapse Controls

```
[|◀ Start] [◀◀ -10s] [◀ -1s] [▶ Play] [▶▶ +1s] [End ▶|]
                    Speed: [1x] [2x] [5x] [10x]
```

## Visual Agent Builder

```
┌─────────────────────────────────────────────────────────────────┐
│  NEW AGENT                                           [Cancel] ✕ │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Name: [trader-001        ]                                     │
│                                                                 │
│  Kind: [▼ trader    ]  🔭scout 📊analyst 💱trader 📡relay       │
│                                                                 │
│  Tasks:                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ + execute    payload → { order, amount }                │   │
│  │ + validate   payload → { signal, confidence }           │   │
│  │ [+ Add Task]                                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Preview:                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │      analyst ─────▶ [trader-001] ─────▶ ???             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Test in Sandbox]                [Create Agent]                │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Phases

### Phase 1: Foundation ✓
- [x] ONE ontology engine (one.ts)
- [x] TypeDB schemas (one.tql, skins.tql)
- [x] WorldGraph with metaphor skins
- [x] SkinSwitcher component
- [x] Basic signal injection

### Phase 2: Chat Integration
- [ ] Copy Chat components from ONE repo
- [ ] Integrate voice input
- [ ] Parse natural language → world commands
- [ ] Generative UI for agent cards

### Phase 3: Interactive Building
- [ ] Drag-and-drop agent creation (NodePalette)
- [ ] Click-to-connect edges
- [ ] Visual flow builder
- [ ] Sandbox preview mode

### Phase 4: Real-Time Sync
- [ ] WebSocket event streaming
- [ ] TypeDB persistence layer
- [ ] Live metric dashboard
- [ ] Multi-user collaboration

### Phase 5: Training Visualization
- [ ] Heat map mode
- [ ] Time-lapse playback
- [ ] Session recording/replay
- [ ] Training metrics charts

## File Structure

```
src/
├── components/
│   ├── world/
│   │   ├── WorldView.tsx          # Main layout (chat + graph)
│   │   ├── ChatPanel.tsx          # AI chat integration
│   │   ├── GraphPanel.tsx         # ReactFlow wrapper
│   │   └── SandboxDrawer.tsx      # Testing zone
│   │
│   ├── graph/
│   │   ├── WorldGraph.tsx         # Skinnable graph ✓
│   │   ├── ActorNode.tsx          # Actor visualization (in WorldGraph)
│   │   ├── FlowEdge.tsx           # Flow visualization (in WorldGraph)
│   │   └── NodePalette.tsx        # Drag-and-drop source
│   │
│   ├── chat/
│   │   ├── Chat.tsx               # From ONE repo
│   │   ├── ChatInput.tsx          # Voice + text
│   │   └── ChatMessages.tsx       # Message display
│   │
│   └── controls/
│       ├── SkinSwitcher.tsx       # Metaphor selection ✓
│       ├── VoiceButton.tsx        # Voice toggle
│       └── TimeControls.tsx       # Time-lapse
│
├── hooks/
│   ├── useWorld.ts                # World state + commands
│   ├── useVoiceInput.ts           # From ONE repo
│   └── useWorldSocket.ts          # Real-time sync
│
├── stores/
│   ├── world-store.ts             # Actors, flows, signals
│   └── chat-store.ts              # From ONE repo
│
├── skins/
│   └── index.ts                   # 6 metaphor definitions ✓
│
└── contexts/
    └── MetaphorContext.tsx        # Skin provider ✓
```

## Parallel Agent Tasks

Run multiple agents simultaneously for Phase 2:

```bash
# Agent 1: Copy chat components from ONE
# Agent 2: Create voice input hook
# Agent 3: Build command parser
# Agent 4: Create WorldView layout
# Agent 5: Integrate stores
```

## The Truth

```
Chat speaks.
Graph shows.
Sandbox tests.
World learns.

Human watches.
Agent builds.
Group emerges.
Intelligence crystallizes.

ONE ontology.
Many metaphors.
Infinite possibilities.
```

---

*Build. Watch. Shape. The world awaits.*
