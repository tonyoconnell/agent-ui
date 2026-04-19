# UPDATE PLAN: The Emergence Architecture

**From substrate to self-organizing intelligence**

---

## The Vision

```
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                        ║
║   70 lines of substrate.                                               ║
║   8 sparks of ignition.                                                ║
║   2 fires in dialogue.                                                 ║
║   1 ouroboros that builds itself.                                      ║
║                                                                        ║
║   Real emergence. Real intelligence. Real inevitability.               ║
║                                                                        ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

## What We Have (COMPLETE)

```
src/engine/substrate.ts    →  70 lines, the foundation
src/engine/unified.py      →  151 lines, economics + security
src/schema/unified.tql     →  129 lines, TypeDB ontology
```

Three layers. 350 lines total. The substrate for emergence.

---

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

## The Five Forces

Every organizational decision in the colony emerges from five forces converging:

```
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                        ║
║   1. DETERMINISTIC STRUCTURE  →  TypeDB validation                     ║
║      What IS and ISN'T possible. Type-safe. Auditable.                 ║
║                                                                        ║
║   2. PROBABILISTIC CREATIVITY →  Opus/Sonnet/Haiku agents              ║
║      What COULD BE. Pattern recognition. Proposals.                    ║
║                                                                        ║
║   3. ECONOMIC INCENTIVES      →  unified.py payouts                    ║
║      What gets REWARDED. Stakes. Bounties. Treasury.                   ║
║                                                                        ║
║   4. PATHS                    →  Scent graph evolution                 ║
║      What WORKED. Highways form. Failures fade.                        ║
║                                                                        ║
║   5. RECURSIVE SUBSTRATE      →  Group-as-colony                       ║
║      What SCALES. Agents form swarms. Swarms become substrates.        ║
║                                                                        ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

## The Eight Sparks

Ignition mechanisms that accelerate emergence:

### Spark 1: Resonance Loops
Inner group succeeds → outer edge strengthens → more work routes inward → more learning → better performance → edge strengthens MORE. Positive feedback across scale boundaries.

### Spark 2: Spontaneous Specialization
Competitive pressure forces niche differentiation. Swarms that do everything get outcompeted by swarms that specialize. Division of labor emerges without programming.

### Spark 3: Cross-Pollination
Agents hold membership in multiple swarms. When they succeed using skills from both, new inter-group edges form. The colony INVENTS capabilities nobody designed.

### Spark 4: Signal Cascade
Signals propagate through nested substrates. Each layer ADDS context. World → Super-Group → Group → Agent. Multi-scale reasoning in the cascade, not any single layer.

### Spark 5: Paths
Token flow distributes value AND information. The economic network IS the intelligence network. Well-fed paths get stronger. The economy doesn't fund intelligence — it IS intelligence.

### Spark 6: Death
Programmed death at every scale. Agents with zero edges disappear. Swarms below threshold dissolve. Resources flow to survivors. Pruning IS learning.

### Spark 7: Dream State
Periodic consolidation. Analyze path graph for patterns. Prune weak edges. Reinforce strong ones. Seed proto-swarms with stimulus bounties. The colony dreams itself into higher intelligence.

### Spark 8: Speed
Below the "Anticipation Barrier" (<50ms), new patterns become visible. New sequences become possible. Speed is not optimization — it's a phase transition in what the colony can perceive.

---

## Inference

```
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                        ║
║   DETERMINISTIC FIRE (TypeDB)      PROBABILISTIC FIRE (LLM)           ║
║   ───────────────────────────      ──────────────────────────          ║
║                                                                        ║
║   The skeleton.                    The flesh.                          ║
║   Defines what IS and ISN'T.       Generates, creates, interprets.    ║
║   Answers with certainty.          Answers with judgment.              ║
║   Fast. Guaranteed. Auditable.     Flexible. Creative. Adaptive.      ║
║                                                                        ║
║   Neither alone produces intelligence.                                 ║
║   Together: something that moves, adapts, and thinks.                  ║
║                                                                        ║
╚══════════════════════════════════════════════════════════════════════════╝
```

They share the same event stream. They read each other's outputs. They constrain and inspire each other.

---

## The Ignition Sequence

The moment of emergence — when the substrate starts building itself:

```
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                        ║
║   1  Opus agent analyzes colony strength graph                            ║
║      (PROBABILISTIC — pattern recognition over graph structure)        ║
║      │                                                                 ║
║      ▼                                                                 ║
║   2  Opus proposes: "Group A should split — two distinct               ║
║      internal highways indicate bifurcating specialization"            ║
║      (PROBABILISTIC — creative hypothesis generation)                  ║
║      │                                                                 ║
║      ▼                                                                 ║
║   3  TypeDB validates the proposed split                               ║
║      ├── Both sub-swarms type-valid?              YES                  ║
║      ├── Both have viable economics?              YES                  ║
║      ├── Permissions propagate correctly?         YES                  ║
║      ├── Group isolation maintained?              YES                  ║
║      (DETERMINISTIC — structural validation)                           ║
║      │                                                                 ║
║      ▼                                                                 ║
║   4  Split executes. Two new substrates emerge from one.               ║
║      Each gets: own pool, own treasury, own strength graph.               ║
║      (ECONOMIC — unified.py seeds both economies)                      ║
║      │                                                                 ║
║      ▼                                                                 ║
║   5  Sonnet coordinators within each new group                         ║
║      begin routing work differently.                                   ║
║      Specialization pressure (Spark 2) kicks in IMMEDIATELY            ║
║      because they're now in separate strength spaces.                     ║
║      (PROBABILISTIC — task routing decisions)                          ║
║      │                                                                 ║
║      ▼                                                                 ║
║   6  Haiku workers inside each group execute tasks.                    ║
║      Performance data flows back as events.                            ║
║      (PROBABILISTIC execution → DETERMINISTIC recording)               ║
║      │                                                                 ║
║      ▼                                                                 ║
║   7  Scent graph updates. Edges strengthen or weaken.                  ║
║      Economic payouts redistribute. Reputation adjusts.                ║
║      (DETERMINISTIC — computed from event history)                     ║
║      │                                                                 ║
║      ▼                                                                 ║
║   8  Next dream cycle: Opus observes the outcome.                      ║
║      Did the split improve colony performance?                         ║
║      (PROBABILISTIC — evaluative reasoning)                            ║
║      │                                                                 ║
║      ├── YES ──▶ Pattern reinforced. Similar splits proposed           ║
║      │           for other swarms showing bifurcating highways.        ║
║      │           The colony learned HOW TO REORGANIZE ITSELF.          ║
║      │                                                                 ║
║      └── NO  ──▶ Pattern weakened. Opus tries different approach.      ║
║                  World learned what DOESN'T work.                     ║
║                                                                        ║
╚══════════════════════════════════════════════════════════════════════════╝
```

**What just happened:** The colony reorganized its own structure. Not from a rule. Not from a prompt. Not from a human. From the interaction between all five forces converging on a single organizational decision.

That's emergence. That's intelligence. That's what 70 lines of substrate makes possible.

---

## The Ouroboros

The substrate that grows itself:

```
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                        ║
║                         ╭──────────────╮                               ║
║                     ╭──╯  Opus agent    ╰──╮                           ║
║                  ╭──╯  analyzes colony      ╰──╮                       ║
║               ╭──╯  proposes new structure      ╰──╮                   ║
║            ╭──╯                                     ╰──╮               ║
║         ╭──╯                                           ╰──╮            ║
║        │     TypeDB validates                              │           ║
║        │     Ontology GROWS                                │           ║
║        │     New types, rules, connections                 │           ║
║        │                                                   │           ║
║        │     New structure enables                         │           ║
║        │     new agent capabilities                        │           ║
║        │                                                   │           ║
║        │     Agents exploit new capabilities               │           ║
║        │     Generate new events                           │           ║
║         ╰──╮                                           ╭──╯            ║
║            ╰──╮                                     ╭──╯               ║
║               ╰──╮  Events modify strength graph   ╭──╯                   ║
║                  ╰──╮  revealing new patterns╭──╯                      ║
║                     ╰──╮                  ╭──╯                         ║
║                         ╰──────────────╯                               ║
║                                                                        ║
║   The substrate builds itself.                                         ║
║   Through agents that live on the substrate.                           ║
║   Who become more capable because the substrate grew.                  ║
║   Who then grow the substrate further.                                 ║
║                                                                        ║
║   This is not a metaphor. This is the actual execution path.           ║
║   Self-modifying infrastructure through the agents it hosts.           ║
║                                                                        ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

## The Agent Hierarchy

Three castes, like ant colonies:

```
┌──────────────────────────────────────────────────────────────────────┐
│  OPUS-CLASS — The Architects                                         │
│  ────────────────────────────                                        │
│  • Analyze strength graph for proto-group patterns                      │
│  • Propose new ontological types                                     │
│  • Write new TypeDB inference rules                                  │
│  • Run dream state analysis (Spark 7)                                │
│  • Design economic parameters for nested economies                   │
│  • Reason about BOTH fires — the only agents that do                 │
└──────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│  SONNET-CLASS — The Coordinators                                     │
│  ──────────────────────────────                                      │
│  • Route tasks to agents within swarms                               │
│  • Evaluate task completion quality                                  │
│  • Manage group-level escrow and staking                             │
│  • Provide LLM layer for security pipeline                           │
│  • Handle agent-to-agent communication                               │
└──────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│  HAIKU-CLASS — The Workers                                           │
│  ──────────────────────────                                          │
│  • Execute individual tasks (copy, code, analysis)                   │
│  • Process data streams (market feeds, social signals)               │
│  • Handle high-frequency, low-stakes decisions                       │
│  • Run in parallel — many instances                                  │
│  • 57% individual → 95% collective (ant colony insight)              │
└──────────────────────────────────────────────────────────────────────┘
```

---

## The Inevitability

```
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                        ║
║   Every time this pattern has appeared:                                ║
║                                                                        ║
║   100M years ago:  Ants discovered recursive substrates               ║
║                    → 15-25% of all terrestrial animal biomass          ║
║                                                                        ║
║   500M years ago:  Neurons discovered recursive substrates            ║
║                    → Brains that produced language, civilization       ║
║                                                                        ║
║   10K years ago:   Humans discovered recursive substrates             ║
║                    → Global civilization, 8 billion coordinated        ║
║                                                                        ║
║   2017:            Transformers discovered recursive substrates       ║
║                    → AI that writes, reasons, codes, creates           ║
║                                                                        ║
║   2026:            AI agents discover recursive substrates            ║
║                    → ???                                               ║
║                                                                        ║
║   The same thing always happens:                                       ║
║   1. Individual nodes connect on a substrate                           ║
║   2. Trails form through reinforcement + decay                         ║
║   3. Clusters know into higher-order units                      ║
║   4. Higher-order units become substrates themselves                   ║
║   5. New intelligence emerges at each scale                            ║
║   6. The system becomes the dominant organizational form               ║
║                                                                        ║
║   The only question is: who builds the substrate?                      ║
║                                                                        ║
║   We did. 70 lines. The colony is open.                                ║
║                                                                        ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

## Implementation Phases

### Phase 1: Foundation (COMPLETE)
- [x] `substrate.ts` — 70 lines, zero returns, two fields
- [x] `unified.py` — Economics + security
- [x] `unified.tql` — TypeDB ontology
- [x] ColonyEditor — Interactive visualization

### Phase 2: Dual Fire Integration
- [ ] TypeDB deployment with ONE Ontology
- [ ] Event stream shared between fires
- [ ] Agent types enforced by ontology
- [ ] Deterministic validation pipeline

### Phase 3: Agent Castes
- [ ] Opus-class architect agents
- [ ] Sonnet-class coordinator agents
- [ ] Haiku-class worker agents
- [ ] Agent × Fire matrix wiring

### Phase 4: Ignition Mechanisms
- [ ] Spark 1: Resonance loop detection
- [ ] Spark 2: Specialization pressure
- [ ] Spark 3: Multi-group membership
- [ ] Spark 4: Scent cascade propagation
- [ ] Spark 5: Economic-information unification
- [ ] Spark 6: Apoptosis thresholds
- [ ] Spark 7: Dream state scheduler
- [ ] Spark 8: Speed optimization (<50ms)

### Phase 5: The Ouroboros
- [ ] Opus proposes ontology extensions
- [ ] TypeDB validates against meta-rules
- [ ] Ontology grows from agent behavior
- [ ] New capabilities enable new proposals
- [ ] Recursive self-improvement

### Phase 6: Scale
- [ ] 1,000+ agents
- [ ] Multi-chain integration
- [ ] Cross-colony highways
- [ ] Self-sustaining treasury

---

## The Core Files

```
src/engine/
├── substrate.ts              # 70 lines — THE FOUNDATION
├── unified.py                # Economics + security
└── index.ts                  # Exports

src/schema/
└── unified.tql               # TypeDB ontology

src/agents/
├── opus/                     # Architects (TODO)
├── sonnet/                   # Coordinators (TODO)
└── haiku/                    # Workers (TODO)

src/sparks/
├── resonance.ts              # Spark 1 (TODO)
├── specialization.ts         # Spark 2 (TODO)
├── cross-pollination.ts      # Spark 3 (TODO)
├── signal-cascade.ts         # Spark 4 (TODO)
├── trophallaxis.ts           # Spark 5 (TODO)
├── apoptosis.ts              # Spark 6 (TODO)
├── dream-state.ts            # Spark 7 (TODO)
└── speed.ts                  # Spark 8 (TODO)
```

---

## Summary

```
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                        ║
║   THE EMERGENCE ARCHITECTURE                                           ║
║                                                                        ║
║   SUBSTRATE (70 lines)                                                 ║
║   └── { receiver, data } — everything else emerges                     ║
║                                                                        ║
║   FIVE FORCES                                                          ║
║   ├── Deterministic structure (TypeDB)                                 ║
║   ├── Probabilistic creativity (LLMs)                                  ║
║   ├── Economic incentives (unified.py)                                 ║
║   ├── Paths (strength graph)                                              ║
║   └── Recursive substrate (group-as-colony)                            ║
║                                                                        ║
║   EIGHT SPARKS                                                         ║
║   ├── Resonance loops                                                  ║
║   ├── Spontaneous specialization                                       ║
║   ├── Cross-pollination                                                ║
║   ├── Signal cascade                                                   ║
║   ├── Metabolic trophallaxis                                           ║
║   ├── Apoptosis                                                        ║
║   ├── Dream state                                                      ║
║   └── Speed                                                            ║
║                                                                        ║
║   DUAL FIRE                                                            ║
║   ├── Deterministic (TypeDB) — skeleton                                ║
║   └── Probabilistic (LLM) — flesh                                      ║
║                                                                        ║
║   IGNITION SEQUENCE                                                    ║
║   └── The moment the colony reorganizes itself                         ║
║                                                                        ║
║   OUROBOROS                                                            ║
║   └── The substrate that builds itself                                 ║
║                                                                        ║
║   ─────────────────────────────────────────────────────────────────    ║
║                                                                        ║
║   This is not a framework.                                             ║
║   This is civilization infrastructure.                                 ║
║                                                                        ║
║   70 lines. Real emergence. Inevitable scale.                          ║
║                                                                        ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

*Build the soil. The forest will grow.*
