# The Stack

Everything is units. Everything is colonies. ~370 lines total.

---

## The Foundation: ONE Ontology

```
┌─────────────────────────────────────────────────────────────────┐
│                         ONE ONTOLOGY                            │
│                    (The 6 Dimensions)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   1. GROUPS       Namespaces, tenants, scopes                   │
│                                                                 │
│   2. ACTORS       Units that do things (agents, LLMs, ASI)      │
│                                                                 │
│   3. THINGS       Entities (envelopes, protocols, data)         │
│                                                                 │
│   4. FLOWS        Connections between actors (trails, edges)    │
│                                                                 │
│   5. EVENTS       Automatic audit log (signals, outcomes)       │
│                                                                 │
│   6. KNOWLEDGE    Crystallized patterns (highways, proven)      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Every module maps to ONE. Every concept has a dimension.

---

## The Modules

| Module | Lines | What it does | ONE Dimension |
|--------|-------|--------------|---------------|
| `one.ts` | 70 | world() — the 6-dimension runtime | ALL |
| `substrate.ts` | 70 | Unit + Colony + Envelope | Actors, Flows |
| `persist.ts` | 40 | TypeDB persistence | Knowledge |
| `llm.ts` | 30 | Any model as a unit | Actors |
| `agentverse.ts` | 70 | 2M agents as a colony | Groups, Actors |
| `asi.ts` | 70 | Orchestrator as a unit | Actors, Knowledge |

## The Insight

```
world()    = ONE ontology runtime (6 dimensions)

LLM        = world.actor('claude', 'llm')
Agent      = world.actor('agent-xyz', 'translator')  
Agentverse = world.group('agentverse') + actors
ASI-1      = world.actor('asi', 'orchestrator')

Flows      = world.flow('scout', 'analyst')  // trails emerge
Knowledge  = world.crystallize()             // patterns persist

Same ontology. Same dimensions. Same 70 lines.
```

## How They Compose

```typescript
import { world } from '@/engine/one'
import { llm, agentverse, asi, anthropic } from '@/engine'

// 1. Create the world (ONE ontology as foundation)
const w = world()

// 2. Groups — namespace isolation
w.group('translation', 'domain')
w.group('orchestration', 'domain')

// 3. Actors — LLMs, agents, orchestrators
const claude = w.actor('claude', 'llm', { group: 'orchestration' })
claude.on('complete', async ({ prompt }) => anthropic.complete(prompt))

const translator = w.actor('translator-1', 'translator', { group: 'translation' })
translator.on('translate', ({ text, to }) => ({ translated: `${text} → ${to}` }))

// 4. Things — register protocol definitions
w.thing('stripe', 'protocol', { group: 'payment' })
w.thing('solana', 'protocol', { group: 'payment' })

// 5. Flows — connections strengthen with use
const flow = w.flow('entry', 'translator-1', { group: 'translation' })
// flow.strengthen() called automatically on success
// flow.resist() called automatically on failure

// 6. Events — automatic (every send() is logged)

// 7. Knowledge — patterns emerge
w.crystallize()  // highways become permanent knowledge

// 8. Query the world
w.best('translator')     // → 'translator-1' (highest flow strength)
w.proven()               // → ['claude', 'translator-1'] (strength >= 20)
w.confidence('llm')      // → 0.85 (aggregate flow strength)
w.open(10)               // → top 10 flows (highways)
w.blocked()              // → resisted flows (failures)

// 9. Everything talks via envelopes
w.send({
  receiver: 'claude:complete',
  payload: { prompt: 'Translate Hello to Spanish' }
})
```

## The Flow

```
User Request
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│  ASI (70 lines)                               [Actors, Knowledge]│
│                                                                  │
│  world.confidence('translate') > 0.7?                           │
│    YES → follow highway → skip LLM                              │
│    NO  → ask LLM → record decision                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│  AGENTVERSE (70 lines)                           [Groups, Actors]│
│                                                                  │
│  world.best('translator') → actor with strongest flows          │
│  world.flow(from, to).strengthen() on success                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│  AGENT / LLM (30 lines)                                  [Actors]│
│                                                                  │
│  world.actor('translator').on('translate', ...) → emit          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│  SUBSTRATE (70 lines)                              [Actors, Flows]│
│                                                                  │
│  flow.strengthen() → trails grow                                 │
│  flow.resist() → paths weaken                                    │
│  net.fade() → decay old flows                                    │
│  world.open() → highways emerge                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│  TYPEDB (40 lines)                                    [Knowledge]│
│                                                                  │
│  world.crystallize() → patterns persist                          │
│  world.proven() → highways become permanent                      │
│  inference → rules derive new knowledge                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
┌═════════════════════════════════════════════════════════════════┐
║  ONE ONTOLOGY (70 lines)                          [ALL 6 DIMENSIONS]║
║                                                                  ║
║  Groups    │ Namespaces for isolation                            ║
║  Actors    │ Units that do things                                ║
║  Things    │ Entities in the world                               ║
║  Flows     │ Connections that strengthen/weaken                  ║
║  Events    │ Automatic audit log                                 ║
║  Knowledge │ Crystallized patterns                               ║
║                                                                  ║
║  world() — the unified interface                                 ║
║                                                                  ║
└═════════════════════════════════════════════════════════════════┘
```

## What Each Layer Learns

| Layer | Learns | How | ONE Dimension |
|-------|--------|-----|---------------|
| Substrate | Which paths work | flow.strengthen/resist | Flows |
| ASI | When to skip LLM | world.confidence() | Knowledge |
| Agentverse | Which agents for which domains | world.best(type) | Actors |
| LLM | Nothing (stateless) | — | Actors |
| TypeDB | Permanent patterns | world.crystallize() | Knowledge |
| ONE | Everything above | Unified 6-dimension model | ALL |

## The Numbers

```
Traditional Stack:
  - LangChain: 50,000+ lines
  - AutoGPT: 30,000+ lines
  - Agent frameworks: 10,000+ lines each

This Stack:
  - ONE (one.ts): 70 lines     ← Foundation
  - Substrate: 70 lines        ← Actors, Flows
  - Persist: 40 lines          ← Knowledge
  - LLM: 30 lines              ← Actors
  - Agentverse: 70 lines       ← Groups, Actors
  - ASI: 70 lines              ← Actors, Knowledge
  ─────────────────────
  Total: ~350 lines
```

## Why It Works

1. **ONE ontology everywhere** — 6 dimensions: Groups, Actors, Things, Flows, Events, Knowledge
2. **Same primitive everywhere** — Envelope { receiver, payload }
3. **Same pattern everywhere** — world.actor().on(task, handler)
4. **Same learning everywhere** — flow.strengthen/resist, world.crystallize
5. **Composition over configuration** — actors in groups in world

## Full Example

```typescript
import { world } from '@/engine/one'
import { anthropic } from '@/engine'

// Initialize — world() is the unified interface
const w = world()

// GROUPS — namespace isolation
w.group('translation', 'domain')
w.group('coding', 'domain')

// ACTORS — register with types
const claude = w.actor('claude', 'llm')
claude.on('complete', async ({ prompt }) => anthropic.complete(prompt))

w.actor('translator-1', 'translator', { group: 'translation' })
  .on('translate', ({ text, to }) => translate(text, to))

w.actor('translator-2', 'translator', { group: 'translation' })
  .on('translate', ({ text, to }) => translateAlt(text, to))

w.actor('coder-1', 'coder', { group: 'coding' })
  .on('code', ({ spec }) => generateCode(spec))

// THINGS — protocol definitions
w.thing('deepl-api', 'protocol', { group: 'translation' })
w.thing('openai-api', 'protocol', { group: 'coding' })

// Handle a request
async function handle(task: string, type: string, payload: unknown) {
  // Query ONE for best actor
  const best = w.best(type)  // uses flow strength
  if (!best) return null
  
  // Check confidence
  if (w.confidence(type) > 0.7) {
    // Highway exists — use proven path
    w.send({ receiver: `${best}:${task}`, payload })
  } else {
    // Still learning — ask LLM to decide
    w.send({ receiver: 'claude:complete', payload: { prompt: task } })
  }
  
  // KNOWLEDGE — crystallize strong patterns
  w.crystallize()
  
  return w.proven()  // actors with strength >= 20
}

// FLOWS decay daily (keeps learning fresh)
setInterval(() => w.fade(0.05), 24 * 60 * 60 * 1000)
```

## The Emergent Properties

1. **Self-organizing routing** — highways form without configuration
2. **Automatic failover** — toxic paths avoided, alternatives found
3. **Continuous learning** — every interaction improves the system
4. **Cost optimization** — LLM calls decrease as confidence increases
5. **Decentralized** — no single point of failure

## What's NOT Here

- No prompt engineering framework
- No chain abstractions
- No memory modules
- No retrieval systems
- No agent "personalities"

Because:
- Prompts are just payload (Things)
- Chains are just continuations (.then) (Flows)
- Memory is flow strength (Flows)
- Retrieval is world.open() (Knowledge)
- Personality is an actor's handlers (Actors)

**ONE is the ontology. The substrate is the runtime. Everything else is just actors.**

---

## The ONE Mapping

```
┌─────────────────────────────────────────────────────────────────┐
│  ONE Dimension    │  Substrate Concept   │  world() Method      │
├───────────────────┼──────────────────────┼──────────────────────┤
│  Groups           │  Namespaces          │  world.group()       │
│  Actors           │  Units               │  world.actor()       │
│  Things           │  Protocols, Data     │  world.thing()       │
│  Flows            │  Edges, Trails       │  world.flow()        │
│  Events           │  Signals (auto)      │  world.send()        │
│  Knowledge        │  Highways, Proven    │  world.crystallize() │
└─────────────────────────────────────────────────────────────────┘

Query Methods:
  world.open(n)         → top n flows (highways)
  world.blocked()       → resisted flows (failures)
  world.best(type)      → strongest actor of type
  world.proven()        → actors with strength >= 20
  world.confidence(type)→ aggregate flow strength for type
```

---

*~350 lines. ONE ontology. The whole stack.*
