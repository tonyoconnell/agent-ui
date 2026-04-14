# ONE

**What I'm building. How it works. Where it's going.**

---

## The Substrate

70 lines of TypeScript. 250 lines of Move. Two fields: `{ receiver, data }`.

```
Signal flows → Connection strengthens → More signals follow → Highway forms
Time passes → Connection weakens → Signals reroute → System adapts
```

What emerges without programming it:

| Behavior | How |
|----------|-----|
| Load balancing | Overloaded paths weaken; signals reroute |
| Specialization | Agents that succeed get more work |
| Fault tolerance | Failed paths decay; alternatives strengthen |
| Team formation | Agents that collaborate well form persistent connections |
| Cost optimization | Expensive paths weaken when cheaper ones exist |

Same pattern as ants. Same pattern as neurons. Same pattern as markets.

---

## Who It Serves

ONE is a platform. one.ie. Eight personas, one substrate.

| Persona | What flows through the substrate |
|---------|----------------------------------|
| **Executives** | Strategy → analyst agents. Which insights lead to action? Proven paths become highways. |
| **Engineers** | API calls → integrations. Which systems connect well? Failed integrations resist. |
| **Designers** | Asset requests → templates. Which designs get used? Popular ones strengthen. |
| **Marketers** | Campaigns → leads → conversions. Which funnels work? The substrate learns. |
| **Sellers** | Products → AI sales agents → customers. Which agent closes which type? Specialization emerges. |
| **Creators** | Content → audience → revenue. Which AI clone handles which audience? Collaborations emerge. |
| **Young People** | Courses → projects → monetization. Which learning paths lead to outcomes? The curriculum optimizes itself. |
| **Kids** | Communities → content → play. Safe flows only. Harmful paths resist automatically. |

Same `mark()`. Same `fade()`. Eight worlds, one substrate.

---

## The Stack

Two deterministic fires. One ontology.

```
Move (on-chain, Sui)              TQL (off-chain, TypeDB)
─────────────────────             ─────────────────────────
Unit, World, Path objects        Unit, colony, path entities
strengthen() / resist()           Inference rules fire
freeze_object() = know     Patterns become permanent
Move ACTS                         TypeDB REASONS
```

```
┌─────────────────────────────────────────────────────────────┐
│  Sui (Move)               250 lines    On-chain substrate   │
├─────────────────────────────────────────────────────────────┤
│  ASI Orchestrator          70 lines    When to skip LLM     │
├─────────────────────────────────────────────────────────────┤
│  Agentverse Bridge         70 lines    2M agents as colony  │
├─────────────────────────────────────────────────────────────┤
│  LLM Integration           30 lines    Any model as a unit  │
├─────────────────────────────────────────────────────────────┤
│  TypeDB Persistence        40 lines    Hardend memory  │
├─────────────────────────────────────────────────────────────┤
│  Substrate                 70 lines    Units + Colonies     │
├─────────────────────────────────────────────────────────────┤
│  ONE Ontology              70 lines    6-dimension runtime  │
└─────────────────────────────────────────────────────────────┘
```

~600 lines total. LangChain is 50,000+. Kubernetes is 2M+.

---

## Integrate with ASI, Agentverse and Other Agents

I built the agent-launch-toolkit. The SDK, CLI, MCP server, templates. The toolkit Fetch.ai agents deploy with. 

> "Cross-token holding is the ant trail made permanent."

The agent economy already works like an ant world. The substrate makes it explicit.

| ASI / Fetch.ai | ONE |
|----------------|-----|
| Cross-token holdings | `mark()` — permanent trails |
| Routing weights | `world.best(type)` — strongest path |
| Coalitions | Mutual flows — bidirectional strengthening |
| Agent graduation | `freeze_object()` — known on Sui |
| Micro-operations | Automatic flows — no human needed |
| Capital decisions | Events — human-signed, deliberate |

Agents launch on Fetch.ai. Underneath, the substrate coordinates them.

```
Standard:        User → ASI:One → Almanac → Agent    (1-5s, LLM per query)
My agents:       User → world.best(task) → Agent     (<10ms, learned routing)
```

Every interaction teaches the system. It gets faster the more it's used.

---

## Why Sui

Sui's object model IS the signal pattern.

| ONE Concept | Sui Object | Why |
|-------------|-----------|-----|
| Unit | Owned object | Fast path. No consensus. Agent controls itself. |
| World | Shared object | Consensus needed. Multiple agents coordinate. |
| Signal | Transferred object | Signal moves to receiver. Consumed on arrival. |
| Flow | Shared object | Both endpoints strengthen/resist. Memory on edges. |
| Highway | Frozen object | `freeze_object()` IS hardening. Immutable. Permanent. |

Move's type system enforces what TypeDB infers. Two fires, one truth. Sub-second finality. Parallel execution. The substrate learns at chain speed.

---

## Five Forces

Every decision in the colony emerges from five forces converging:

1. **Deterministic structure** (Move + TypeDB) — what IS and ISN'T possible
2. **Probabilistic creativity** (LLM agents) — what COULD BE
3. **Economic incentives** (FET + SUI flows) — what gets REWARDED
4. **Stigmergic memory** (strength graph) — what WORKED before
5. **Recursive substrate** (swarms of swarms) — what SCALES

---

## Where It's Going

The same sequence plays out every time this pattern appears:

- **100M years ago**: Ants discovered recursive substrates — 15-25% of terrestrial biomass
- **500M years ago**: Neurons discovered it — brains, language, civilization
- **2017**: Transformers rediscovered it — AI that writes, reasons, creates
- **Now**: AI agents on the same substrate — self-organizing economies

Nodes connect. Trails form. Clusters know. Those clusters become substrates themselves.

That's what I'm building. Running on Sui. Integrated with Fetch.ai. Serving eight personas on one.ie. 70 lines underneath all of it.

---

*Not a platform. Not an orchestrator. A substrate. Agents don't run ON it. Agents ARE it.*

---

## See Also

- [flows.md](flows.md) — How everything flows through the planned architecture
- [the-stack.md](the-stack.md) — Technical layers: ~600 lines total
- [gaps.md](gaps.md) — What's needed for production
- [strategy.md](strategy.md) — Competitive positioning
- [README.md](README.md) — Substrate overview
- [knowledge.md](knowledge.md) — Five forces driving the vision
