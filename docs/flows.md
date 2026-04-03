# Flows

How things move, form, live, and die in the world.

---

## The One Flow

Everything reduces to this:

```
Signal { receiver, data }
  → enters world
    → finds unit
      → executes task
        → emits new signals
          → drops weight on path
            → path strengthens or fades
              → highways emerge
```

Five verbs. One loop. All complexity emerges from here.

```
signal  →  drop  →  follow  →  fade  →  sense
  │          │         │          │         │
  move     weight    traverse   decay    perceive
```

---

## Signal Flow

A signal is born, routed, consumed, and may spawn children.

```
                    ┌─────────────────────────────────┐
                    │           WORLD                   │
                    │                                   │
  { receiver,  ──→  │  route(receiver)                  │
    data }          │    │                              │
                    │    ▼                              │
                    │  unit.task(data, emit, ctx)       │
                    │    │           │                  │
                    │    ▼           ▼                  │
                    │  result    emit({receiver, data}) │
                    │    │           │                  │
                    │    ▼           ▼                  │
                    │  continuation  drop(from→to)      │
                    │    │           │                  │
                    │    ▼           ▼                  │
                    │  new signal   path weight++       │
                    │    │                              │
                    │    └──→ re-enters world ──→ ...   │
                    └─────────────────────────────────┘
```

**Key properties:**
- Signals carry no return address (push-only, zero pull)
- `ctx.from` tells you who sent it — reply patterns use this
- Missing handler = signal dissolves, swarm continues
- Each emit carries `ctx.self` as the new `from`

> See: [signal.md](signal.md) for the primitive, [code.md](code.md) for implementation

---

## Actor Lifecycle

An actor (unit/agent) moves through predictable phases:

```
SPAWN → IDLE → SENSE → ACT → LEARN → SPECIALIZE → CRYSTALLIZE
  │                                        │              │
  │                                        ▼              ▼
  │                                    highway        frozen on-chain
  │                                    emerges        (permanent proof)
  │                                        │
  └────────── fade back to IDLE ◄──────────┘
```

### Phase Detail

| Phase | What Happens | Substrate Operation |
|-------|-------------|-------------------|
| **Spawn** | Unit created in colony with tasks | `colony.spawn(id)` |
| **Idle** | Waiting for signals | No cost, no state |
| **Sense** | Receives signal, reads context | `task(data, emit, ctx)` |
| **Act** | Executes task, emits signals | `emit({ receiver, data })` |
| **Learn** | Paths strengthen from successful flow | `drop(from→to, weight)` |
| **Specialize** | Repeated success creates preferred routes | Weight accumulates |
| **Crystallize** | Proven paths become highways | `weight ≥ 50 → highway` |

### Death and Rebirth

Agents don't crash — they fade.

```
Active agent
  → paths strengthen with use
  → paths fade without use (fade rate 0.95)
  → weight drops below threshold (< 5 = fading)
  → signals route elsewhere
  → agent effectively dormant
  → new signals can revive it
```

No garbage collection. No shutdown. No error. Silence is valid.

> See: [agents.md](agents.md) for anatomy, [ants.md](ants.md) for biological grounding

---

## Group Containment

Groups are the containers of the world. Everything lives inside a group.

```
ROOT GROUP (world)
├── TRADING
│   ├── Actors: scout, analyst, trader
│   ├── Things: tick-data, positions
│   ├── Paths: scout→analyst (weight: 72) ★ highway
│   └── Knowledge: "analyst is fastest for BTC ticks"
│
├── SUPPORT
│   ├── Actors: classifier, responder, escalator
│   ├── Things: tickets, templates
│   ├── Paths: classifier→responder (weight: 45)
│   └── Knowledge: "responder handles 80% without escalation"
│
└── INFRASTRUCTURE
    ├── Actors: monitor, alerter, healer
    ├── Things: services, logs
    └── Paths: monitor→alerter→healer (chain)
```

### Group Properties

- **Isolation**: Paths within a group don't leak to other groups
- **Hierarchy**: Groups nest — a group can contain sub-groups
- **Multi-tenancy**: Each tenant gets a group, same substrate
- **Billing**: Group boundaries = billing boundaries
- **Federation**: Cross-group paths form when groups cooperate

### Group Lifecycle

```
CREATE → POPULATE → ISOLATE → LEARN → FEDERATE
  │         │          │         │         │
  new     spawn      paths     highways   cross-group
  group   actors     scoped    emerge     paths form
```

> See: [one-ontology.md](one-ontology.md) for the 6 dimensions, [swarm.md](swarm.md) for coordination

---

## Path Formation

Paths are the memory of the world. They record what worked.

```
First signal:    A ──→ B         (weight: 0, new path created)
Success:         A ══→ B         (weight: +1.0, drop)
Repeated:        A ═══→ B        (weight: 15, strengthening)
Proven:          A ════→ B  ★    (weight: 50+, HIGHWAY)
Crystallized:    A ════→ B  ◆    (frozen on-chain, permanent)
```

### The Learning Loop

```
DROP                        FADE
  │                           │
  ▼                           ▼
weight++                weight *= 0.95
  │                           │
  ▼                           ▼
more signals              less traffic
  │                           │
  ▼                           ▼
HIGHWAY                   reroute
  │                           │
  ▼                           ▼
crystallize               dissolve
```

### Path Types by Weight

| Weight | Classification | Meaning |
|--------|---------------|---------|
| 0–5 | **Fading** | Unused, dissolving |
| 5–49 | **Active** | In use, not yet proven |
| 50+ | **Highway** | Proven route, fast lane |
| alarm > weight | **Toxic** | Failed, avoid |

### Negative Paths

Not all paths strengthen. Failure creates resistance:

```
signal(A→B) → B fails
  → resist(A→B)           // alarm pheromone
  → alarm > weight        // path becomes toxic
  → follow() skips B      // traffic reroutes
  → C gets the signal     // natural failover
```

> See: [substrate-learning.md](substrate-learning.md) for the learning model, [ontology.md](ontology.md) for inference rules

---

## Knowledge Emergence

Raw events become knowledge through three stages:

```
Stage 1: DATA                Stage 2: PATTERNS           Stage 3: KNOWLEDGE
─────────────────           ──────────────────          ──────────────────
Signals flow                 Paths accumulate weight     Highways crystallize
Events log                   Clusters form               Rules fire (inference)
Weights change               Specialists emerge          Proven capabilities freeze

  signal()                     drop() / fade()              highways() / best()
  │                              │                              │
  ▼                              ▼                              ▼
  raw event stream            weighted topology             queryable intelligence
```

### What the Substrate Learns

| Dimension | Learns | How |
|-----------|--------|-----|
| **Paths** | Which routes work | drop on success, resist on failure |
| **Events** | What happened | Signal log with timestamps |
| **Knowledge** | What's proven | Inference rules over accumulated paths |
| **Actors** | Who's good at what | Path weight to/from each actor |
| **Things** | What gets used | Signal frequency per thing |
| **Groups** | Which teams perform | Aggregate path health per group |

> See: [emergence.md](emergence.md) for the five forces, [typedb.md](typedb.md) for persistence

---

## The Complete Flow

An engineer's view — everything connected:

```
USER REQUEST
  │
  ▼
world.signal({ receiver: 'router', data: request })
  │
  ▼
Router checks highways:  best('task-type') → proven agent?
  │                         │
  YES                       NO
  │                         │
  ▼                         ▼
Follow highway          LLM decides (expensive, slow)
(fast, cheap)           Signal to candidate agents
  │                         │
  ▼                         ▼
Agent executes task     Agent executes task
  │                         │
  ▼                         ▼
emit() results          emit() results
  │                         │
  ▼                         ▼
drop() on path          drop() on path  ←── THIS IS LEARNING
  │                         │
  ▼                         ▼
Path strengthens        New path created
  │                         │
  ▼                         ▼
Next request follows    Next request might follow
the proven path         this path if it works again
  │
  ▼
After many successes: weight ≥ 50 → HIGHWAY
  │
  ▼
Cost drops from $0.01/2s → $0.0001/50ms
  │
  ▼
Highway frozen on-chain (Sui freeze_object)
  │
  ▼
Permanent proof of capability
```

---

## Flow Patterns

### Fan-Out (Broadcast)

```
signal → router
           ├──→ agent-A
           ├──→ agent-B
           └──→ agent-C
```

One signal, many receivers. Router emits multiple signals.

### Fan-In (Gather)

```
agent-A ──→ aggregator → combined result
agent-B ──→     │
agent-C ──→     │
```

Many signals, one collector. Aggregator waits and merges.

### Pipeline (Chain)

```
scout ──→ analyst ──→ trader ──→ settlement
```

Sequential processing. Each stage's output is the next stage's input via continuations.

### Compete (Race)

```
signal → agent-A ──→ first response wins
       → agent-B ──→ (claim pattern)
       → agent-C ──→
```

Multiple candidates, first to claim wins. Losers' signals dissolve.

### Stigmergy (Indirect)

```
agent-A drops weight on path X
                                   ← no direct communication
agent-B follows strongest path → finds X
```

No messages exchanged. Coordination through shared environment.

> See: [swarm.md](swarm.md) for coordination patterns, [examples.md](examples.md) for production implementations

---

## Metaphor Mapping

The same flow, different words:

| Flow Concept | Ant | Brain | Team | Mail | Water | Signal |
|-------------|-----|-------|------|------|-------|--------|
| Signal moves | ant walks | spike fires | message sent | letter posted | water flows | signal transmitted |
| Path strengthens | pheromone deposited | synapse strengthens | trust builds | route preferred | channel deepens | frequency locked |
| Highway forms | trail established | memory consolidated | process documented | express lane | river formed | broadcast channel |
| Path fades | scent evaporates | synapse weakens | contact lost | route deprecated | channel dries | signal fades |
| Toxic path | alarm pheromone | pain signal | conflict flagged | returned mail | contamination | jamming |

> See: [metaphors.md](metaphors.md) for complete vocabulary, [framework.md](framework.md) for UI skins

---

## Reading Order for Engineers

Start here, follow the flow:

1. **[signal.md](signal.md)** — The primitive. Two fields. Five verbs.
2. **[code.md](code.md)** — 70 lines of TypeScript. Read the actual substrate.
3. **[agents.md](agents.md)** — What a unit is. Tasks, continuations, roles.
4. **[world.md](world.md)** — The universal ontology. Ants = humans = agents.
5. **[swarm.md](swarm.md)** — Many agents. Coordination patterns.
6. **[ants.md](ants.md)** — The biological source. Nine castes. Five chains.
7. **[emergence.md](emergence.md)** — How intelligence arises from five forces.
8. **[one-ontology.md](one-ontology.md)** — The 6 dimensions that model everything.
9. **[substrate-learning.md](substrate-learning.md)** — How paths = reinforcement learning.
10. **[integration.md](integration.md)** — How it all connects to real systems.

---

*Signal. Drop. Follow. Fade. Highway. Everything flows.*
