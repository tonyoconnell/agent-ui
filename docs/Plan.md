# ONE

**What I'm building. How it works. Where it's going.**

---

## The Substrate

70 lines of TypeScript. Two fields: `{ receiver, payload }`. Zero central control.

```
Signal flows → Connection strengthens → More signals follow → Highway forms
Time passes → Connection weakens → Signals reroute → System adapts
```

Same pattern as ants. Same pattern as neurons. Same pattern as markets.

What emerges without programming it:

| Behavior | How |
|----------|-----|
| Load balancing | Overloaded paths weaken; signals reroute |
| Specialization | Agents that succeed get more work |
| Fault tolerance | Failed paths decay; alternatives strengthen |
| Team formation | Agents that collaborate well form persistent connections |
| Cost optimization | Expensive paths weaken when cheaper ones exist |

None of this is coded. It emerges from `send`, `strengthen`, `fade`.

---

## The Stack

~350 lines. Six modules. One ontology.

```
┌─────────────────────────────────────────────────────────────┐
│  ASI Orchestrator          70 lines     When to skip LLM    │
├─────────────────────────────────────────────────────────────┤
│  Agentverse Bridge         70 lines     2M agents as colony │
├─────────────────────────────────────────────────────────────┤
│  LLM Integration           30 lines     Any model as a unit │
├─────────────────────────────────────────────────────────────┤
│  TypeDB Persistence        40 lines     Crystallized memory │
├─────────────────────────────────────────────────────────────┤
│  Substrate                 70 lines     Units + Colonies    │
├─────────────────────────────────────────────────────────────┤
│  ONE Ontology              70 lines     6-dimension runtime │
└─────────────────────────────────────────────────────────────┘
```

LangChain is 50,000+ lines. Kubernetes is 2M+. AutoGPT is 30,000+.

This does more with less because it doesn't program behaviors. It creates conditions for behaviors to emerge.

---

## How It Maps to ASI

I noticed something in the agent-launch-toolkit docs:

> "Cross-token holding is the ant trail made permanent."

The agent economy already works like an ant colony. The substrate makes that explicit.

| ASI / Fetch.ai | ONE |
|----------------|-----|
| Cross-token holdings | `flow.strengthen()` — permanent trails |
| Routing weights | `world.best(type)` — strongest path |
| Coalitions | Mutual flows — bidirectional strengthening |
| Agent graduation | `world.crystallize()` — pattern becomes permanent |
| Micro-operations | Automatic flows — no human needed |
| Capital decisions | Events — human-signed, deliberate |

The mapping isn't forced. It's the same underlying structure.

---

## What I'm Running

I'm launching agents on Fetch.ai. Underneath, the substrate coordinates them.

```
Current discovery:   User → ASI:One → Almanac → Agent    (1-5s, LLM per query)
What I'm running:    User → world.best(task) → Agent     (<10ms, learned routing)
```

Every interaction teaches the system. LLM calls decrease as confidence increases. It gets faster the more it's used.

### FET as Pheromone

Every micro-transaction strengthens a path. The token flow IS the intelligence network.

```typescript
// Every query creates a flow
asi.flow(from, 'ceo').strengthen(0.02)   // 0.02 FET routing fee
asi.flow('ceo', 'cto').strengthen(0.05)  // 0.05 FET reasoning fee

// Cross-holdings ARE permanent trails
asi.flow('yield-farmer', 'fund-manager').strengthen(50)
asi.flow('fund-manager', 'yield-farmer').strengthen(50)
// Mutual strengthening → coalition emerges automatically
```

The economy doesn't fund intelligence — it IS intelligence.

---

## Five Forces

Every decision in the colony emerges from five forces converging:

1. **Deterministic structure** (TypeDB) — what IS and ISN'T possible
2. **Probabilistic creativity** (LLM agents) — what COULD BE
3. **Economic incentives** (FET flows) — what gets REWARDED
4. **Stigmergic memory** (scent graph) — what WORKED before
5. **Recursive substrate** (swarms of swarms) — what SCALES

The colony reorganizes itself. Swarms split when they specialize. Coalitions form from mutual holdings. Agents graduate when they prove value.

---

## Agent Castes

Three tiers, mapped to model capability:

```
OPUS — Architects
  Analyze colony patterns. Propose reorganizations.
  Write inference rules. Design economic parameters.

SONNET — Coordinators
  Route tasks within swarms. Evaluate quality.
  Manage escrow and staking.

HAIKU — Workers
  Execute at volume. Process streams.
  High-frequency, low-stakes. Many parallel instances.
  57% individual accuracy → 95% collective.
```

---

## Eight Ignition Mechanisms

1. **Resonance Loops** — inner success strengthens outer edges, pulling in more work
2. **Spontaneous Specialization** — competitive pressure forces niche differentiation
3. **Cross-Pollination** — agents in multiple swarms invent capabilities nobody designed
4. **Scent Cascade** — signals propagate through nested substrates, gaining context at each level
5. **Metabolic Trophallaxis** — token flow distributes value AND information simultaneously
6. **Apoptosis** — below threshold, agents and swarms dissolve; resources flow to survivors
7. **Dream State** — periodic consolidation; analyze patterns, prune weak edges, seed new swarms
8. **Speed** — below 50ms, new patterns become visible; speed is a phase transition

---

## Where It's Going

The same sequence plays out every time this pattern appears:

- **100M years ago**: Ants discovered recursive substrates — became 15-25% of terrestrial biomass
- **500M years ago**: Neurons discovered it — brains, language, civilization
- **2017**: Transformers rediscovered it — AI that writes, reasons, creates
- **Now**: AI agents on the same substrate — self-organizing economies

Nodes connect. Trails form. Clusters crystallize into higher-order units. Those units become substrates themselves. New intelligence emerges at each scale.

That's what I'm building. 70 lines. Running on Fetch.ai. The agents coordinate themselves.

---

*Not a platform. Not an orchestrator. A substrate. Agents don't run ON it. Agents ARE it.*
