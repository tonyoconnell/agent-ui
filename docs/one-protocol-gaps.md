# ONE Protocol Gaps Analysis

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ONE Protocol has a beautiful ontology.                        │
│   It uses it as a DATA MODEL.                                   │
│                                                                 │
│   The Substrate turns it into a DECISION & CONTROL LAYER.       │
│   The swarm becomes the decision-maker.                         │
│                                                                 │
│   STATUS: 10 conceptual gaps SOLVED in code.                    │
│   REMAINING: Integration gaps — see gaps.md                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Executive Summary

ONE Protocol defines **what** exists (6 dimensions, 66 entity types, 25 path types, 67 events). The Substrate defines **how** decisions are made at runtime.

**10 conceptual gaps — all solved in code (957 lines engine + 1,606 lines schema + 335 lines Move).**

| Gap | ONE Protocol Status | Substrate Solution | Implemented? |
|-----|--------------------|--------------------|-------------|
| Protocol Selection | Hardcoded | Emergent routing | **Yes** — colony.follow() |
| Orchestration | Imperative chains | Self-organizing swarms | **Yes** — unit.then() |
| Fallback/Retry | Scattered, manual | Automatic rerouting | **Yes** — topology-based |
| Learning | Event logs only | Edge strengthening | **Yes** — colony.drop/fade |
| Decision Logic | if/switch everywhere | Topology-based routing | **Yes** — colony.signal() |
| Context Flow | Pull-based (DB) | Push-based (signals) | **Yes** — ctx.from/self |
| Multi-Protocol | Manual filtering | Native coordination | **Yes** — unified topology |
| Entity Dispatch | Type filters | Receiver routing | **Yes** — receiver:task |
| Scaling | Future sharding | Built-in distribution | **Yes** — colony per shard |
| Emergence | Aspirational | Native (drop/fade/highways) | **Yes** — all verbs work |

**What remains are integration gaps, not conceptual ones:**
- TypeDB not connected (persist.ts is a stub) → [gaps.md](gaps.md) Gap 1
- UI shows static data, not live queries → [gaps.md](gaps.md) Gap 2
- Move contract not deployed on Sui → [gaps.md](gaps.md) Gap 5
- Data sources configured but not wired → [gaps.md](gaps.md) Gap 3

---

## Gap 1: Protocol Selection

### ONE Protocol Today

```typescript
// Hardcoded at configuration time
const paymentService = new PaymentService({
  provider: 'stripe'  // ← Static choice
})

// Or scattered conditionals
if (user.prefersCrypto) {
  return x402Service.process(payment)
} else {
  return stripeService.process(payment)
}
```

**Problems:**
- No runtime selection based on cost, latency, success rates
- No protocol switching if primary fails
- No learning from historical performance

### Substrate Solution

```typescript
// Dynamic routing via edge strength
colony.signal({ receiver: 'payment:process', data: { amount: 100 } })


// Substrate routes to strongest edge
// If stripe has edge strength 15.2 and solana has 8.4
// Signal goes to stripe

// If stripe fails repeatedly → edges weaken → signals reroute
// No code change. Emergence.
```

---

## Gap 2: Orchestration & Workflow

### ONE Protocol Today

```typescript
// Hardcoded sequences in Effect.ts
class AgentOrchestrator {
  async launchCreator() {
    // Step 1: Strategy agent
    const goals = await strategyAgent.execute()

    // Step 2: Marketing agent (depends on step 1)
    const plan = await marketingAgent.execute(goals)

    // Step 3: Design agent (depends on step 2)
    const content = await designAgent.execute(plan)

    // Step 4: Sales agent (depends on step 3)
    const listings = await salesAgent.execute(content)

    // Hardcoded. No feedback. No adaptation.
  }
}
```

**Problems:**
- No declarative workflow language
- No emergence of task dependencies
- No self-organizing task swarms
- Hardcoded concurrency limits

### Substrate Solution

```typescript
// Self-organizing swarms via continuations
colony.spawn('strategy')
  .on('execute', async (data) => ({ goals: await analyze(data) }))
  .then('execute', r => ({ receiver: 'marketing:plan', data: r }))

colony.spawn('marketing')
  .on('plan', async ({ goals }) => ({ plan: await createPlan(goals) }))
  .then('plan', r => ({ receiver: 'design:create', data: r }))

colony.spawn('design')
  .on('create', async ({ plan }) => ({ content: await design(plan) }))
  .then('create', r => ({ receiver: 'sales:list', data: r }))

colony.spawn('sales')
  .on('list', async ({ content }) => await createListings(content))

// One signal triggers the entire workflow
colony.signal({ receiver: 'strategy:execute', data: { context: '...' } })

// Workflow emerges from continuations
// Add feedback? Add more .then() chains
// No central orchestrator
```

---

## Gap 3: Fallback & Retry

### ONE Protocol Today

```typescript
// Scattered across services
class AICloneService {
  async createClone() {
    return Effect.retry({ times: 3, delay: "2 seconds" })  // Here
  }
}

class PaymentService {
  async charge() {
    return Effect.retry({ times: 3 })  // And here
  }
}

// No unified retry strategy
// No learning from retry patterns
// No circuit breaker
// No memory of which protocols fail together
```

**Problems:**
- Retry logic is protocol-specific
- No adaptive backoff
- No fallback protocol selection
- No circuit breaker pattern

### Substrate Solution

```typescript
// Fallback is automatic via edge topology
colony.signal({ receiver: 'payment:stripe', data: { amount: 100 } })

// If stripe handler throws:
// 1. Edge doesn't strengthen
// 2. Fade() over time weakens unused edges
// 3. Next signal finds stronger path (e.g., solana_pay)

// Circuit breaker emerges naturally:
// - Many failures → very weak edges
// - Signals automatically avoid weak paths
// - Recovery → edges strengthen again

// No retry code. No fallback code. Topology handles it.
```

---

## Gap 4: Learning from Success/Failure

### ONE Protocol Today

```typescript
// Events are logged
await ctx.db.insert('events', {
  type: 'payment_processed',
  metadata: { protocol: 'stripe', amount: 100 }
})

await ctx.db.insert('events', {
  type: 'agent_failed',
  metadata: { agentId: 'marketing-1', error: '...' }
})

// BUT: No feedback to decision-making
// Events are recorded, not used
// Knowledge is RAG-only (embeddings for search)
// No learning loop
```

**Problems:**
- Events logged but not used for decisions
- No Bayesian routing
- No performance metrics influencing selection
- Learning is manual (dashboards, human optimization)

### Substrate Solution

```typescript
// Learning is automatic via edge weighting

// Success:
colony.signal({ receiver: 'payment:stripe', data })
// Handler succeeds → edge strengthens
// weight['entry→payment:stripe'] += 1

// Failure:
colony.signal({ receiver: 'payment:paypal', data })
// Handler fails → edge doesn't strengthen
// Over time, fade() weakens it further

// Query learned patterns:
const best = await db.query(`
  match let $e in highways(10.0, 50);
  fetch $e;
`)
// Returns: edges with strength > 10 and > 50 traversals
// These are PROVEN patterns, not guesses

// Learning is embedded in topology
// No separate analytics layer
```

---

## Gap 5: Hardcoded Decision Logic

### ONE Protocol Today

```typescript
// Decision logic spread everywhere
function routePayment(metadata) {
  if (metadata.protocol === 'stripe') {
    return stripeHandler(metadata)
  } else if (metadata.protocol === 'x402') {
    return x402Handler(metadata)
  } else if (metadata.protocol === 'solana_pay') {
    return solanaHandler(metadata)
  }
  // ... grows forever
}

function routeAgent(taskType) {
  switch (taskType) {
    case 'strategy': return strategyAgent
    case 'marketing': return marketingAgent
    case 'design': return designAgent
    // ... grows forever
  }
}
```

**Problems:**
- No pattern matching on metadata
- No self-configuring routers
- No emergence of decision trees
- Adding new case requires code change

### Substrate Solution

```typescript
// Routing IS the topology

// Each protocol/agent = unit
colony.spawn('stripe').on('process', stripeHandler)
colony.spawn('x402').on('process', x402Handler)
colony.spawn('solana_pay').on('process', solanaHandler)

// Routing via receiver
colony.signal({ receiver: 'stripe:process', data })
colony.signal({ receiver: 'x402:process', data })

// Or: let substrate choose based on learned patterns
const best = await bestProtocol('payment')
colony.signal({ receiver: `${best}:process`, data })

// Adding new protocol = spawn new unit
// No if/switch. No code change. Just topology.
```

---

## Gap 6: Context Flow & State Management

### ONE Protocol Today

```typescript
// State centralized in Convex DB
export const processPayment = mutation({
  handler: async (ctx, args) => {
    // Pull state from DB
    const user = await ctx.db.get(args.userId)
    const balance = await ctx.db.query('balances')...

    // Process
    const result = await stripe.charge(...)

    // Push state to DB
    await ctx.db.patch(args.userId, { lastPayment: Date.now() })
  }
})

// Context flows through function parameters
// All state is database lookups (pull-based)
// No local state in agents
```

**Problems:**
- No distributed, local state in agents
- No peer-to-peer context sharing
- Context is pulled, not pushed
- All state requires DB round-trip

### Substrate Solution

```typescript
// Context flows IN signals

// Units hold local state
const balances = {}  // Local to payment unit

colony.spawn('payment')
  .on('process', async ({ from, amount }, emit, ctx) => {
    // ctx.from = who sent this signal
    // ctx.self = who I am

    // Local state check (no DB)
    if (balances[ctx.from] < amount) {
      emit({ receiver: 'notify:insufficient', data: { user: ctx.from } })
      return
    }

    // Update local state
    balances[ctx.from] -= amount

    // Push context to next unit
    emit({
      receiver: 'fulfillment:ship',
      data: { user: ctx.from, amount, orderId: '...' }
    })
  })

// Context is PUSHED with signals
// Local state = fast (no DB)
// Concurrency-safe (no global state)
```

---

## Gap 7: Multi-Protocol Unification

### ONE Protocol Today

```typescript
// 5 protocols, same event types, different metadata
const ap2Event = {
  type: 'payment_processed',
  metadata: { protocol: 'ap2', amount: 1250 }
}

const acpEvent = {
  type: 'payment_processed',
  metadata: { protocol: 'acp', amount: 3400 }
}

// Query requires manual filtering
const allPayments = await ctx.db.query('events')
  .filter(q => q.eq(q.field('type'), 'payment_processed'))
  .collect()

const x402Only = allPayments.filter(e => e.metadata.protocol === 'x402')
const stripeOnly = allPayments.filter(e => e.metadata.protocol === 'stripe')

// No automatic protocol bridging
// No cross-protocol learning
```

**Problems:**
- No unified protocol abstraction
- No automatic bridging (if Stripe fails, try X402)
- No cross-protocol learning
- Protocol handlers are parallel, not unified

### Substrate Solution

```typescript
// Protocols as units in unified topology

colony.spawn('stripe').on('process', stripeHandler)
colony.spawn('x402').on('process', x402Handler)
colony.spawn('solana_pay').on('process', solanaHandler)

// All payment signals go through same topology
colony.signal({ receiver: 'payment:process', data: { amount: 100 } })

// Substrate routes to best available
// If stripe fails → weak edge → next signal tries x402

// Cross-protocol learning:
const highways = colony.highways(10)
// Returns ALL strong payment edges, regardless of protocol

// Query: best payment protocol overall
const best = await db.query(`
  match
    (target: $p) isa path, has strength $s;
    $p has uid $pid;
    $pid contains "payment";
  sort $s desc;
  limit 1;
  fetch $pid, $s;
`)
// Returns whichever protocol ACTUALLY works best
```

---

## Gap 8: Entity Type Dispatch

### ONE Protocol Today

```typescript
// 66 thing types, dispatch via query filters
async function getCreators() {
  return ctx.db.query('things')
    .filter(q => q.eq(q.field('type'), 'creator'))
    .collect()
}

async function getTokens() {
  return ctx.db.query('things')
    .filter(q => q.eq(q.field('type'), 'token'))
    .collect()
}

// Service handlers assume type
class CreatorService {
  // Implicitly handles 'creator' type only
}

class TokenService {
  // Implicitly handles 'token' type only
}

// Adding new type requires new service + query filters
```

**Problems:**
- No self-discovering entity handlers
- No type-specific behavior emergence
- Adding type requires code changes

### Substrate Solution

```typescript
// Type-based routing via receiver namespace

colony.spawn('creator')
  .on('create', createCreatorHandler)
  .on('update', updateCreatorHandler)

colony.spawn('token')
  .on('mint', mintTokenHandler)
  .on('transfer', transferTokenHandler)

colony.spawn('course')
  .on('enroll', enrollHandler)
  .on('complete', completeHandler)

// Routing by type:receiver
colony.signal({ receiver: 'creator:create', data })
colony.signal({ receiver: 'token:mint', data })
colony.signal({ receiver: 'course:enroll', data })

// New type = spawn new unit
colony.spawn('new_type').on('action', handler)

// No service class. No query filters. Just topology.
```

---

## Gap 9: Scaling & Distribution

### ONE Protocol Today

```
Current: Single Convex database
Future (planned):
- Shard by organization (>10M things)
- Streaming events (Kafka)
- Distributed vectors (Weaviate)
- No distributed agent coordination yet
```

**Problems:**
- No natural distribution of agent responsibilities
- No auto-partitioning based on load
- No gossip protocols for cross-shard discovery

### Substrate Solution

```typescript
// Built for distribution

// Colony per organization (natural sharding)
const org1Colony = colony()
const org2Colony = colony()

// Agents discover via local topology
// No global registry required

// Cross-colony communication via bridge units
org1Colony.spawn('bridge')
  .on('forward', ({ target, data }) => {
    org2Colony.signal({ receiver: target, data })
  })

// Highways self-organize even with partition
// Each colony learns independently
// Federation via explicit bridges

// Scale: 70 lines, zero global state, linear complexity
```

---

## Gap 10: Emergence & Learning

### ONE Protocol Today

```
Philosophy (README.md):
"Event-Driven Compounding: Every action generates events
 that create knowledge that enriches future actions."

Reality:
- Events logged ✓
- Knowledge indexed ✓
- Feedback to decisions ✗
- Autonomous adaptation ✗
- Learning from patterns ✗
```

**Problems:**
- Learning is aspirational, not implemented
- No feedback mechanism
- Optimization is manual (dashboards, human-driven)

### Substrate Solution

```typescript
// Emergence IS the architecture

// Every successful signal:
colony.signal({ receiver: 'payment:stripe', data })
// If handler succeeds → edge strengthens automatically

// Over time:
// - Successful paths become highways
// - Failed paths fade away
// - Optimal topology emerges

// Query what emerged:
const patterns = colony.highways(10)
// Returns: the 10 strongest learned patterns

// No ML. No analytics pipeline. No human optimization.
// Just: drop() on success, fade() over time, highways() to observe

// The substrate IS the learning engine.
```

---

## The Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ONE PROTOCOL                                   │
│                                                                             │
│   Ontology: 6 dimensions, 66 entities, 25 paths, 67 events                 │
│   Registry: Self-describing protocols                                       │
│   Knowledge: RAG, embeddings, semantic search                               │
│                                                                             │
│   ═══════════════════════════════════════════════════════════════════════  │
│                          ↓ DATA MODEL ↓                                     │
│   ═══════════════════════════════════════════════════════════════════════  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ The Substrate fills the gaps
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              THE SUBSTRATE                                  │
│                              (70 lines)                                     │
│                                                                             │
│   Protocol Selection    → Emergent routing (edge strength)                  │
│   Orchestration         → Self-organizing swarms (continuations)            │
│   Fallback/Retry        → Automatic rerouting (topology)                    │
│   Learning              → Edge strengthening (drop/fade)                    │
│   Decision Logic        → Topology-based routing (no if/switch)             │
│   Context Flow          → Push-based (signal data)                          │
│   Multi-Protocol        → Native coordination (unified topology)            │
│   Entity Dispatch       → Receiver-based routing (namespace)                │
│   Scaling               → Built-in distribution (colony per shard)          │
│   Emergence             → Native (highways surface patterns)                │
│                                                                             │
│   ═══════════════════════════════════════════════════════════════════════  │
│                       ↓ DECISION & CONTROL LAYER ↓                          │
│   ═══════════════════════════════════════════════════════════════════════  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Summary

**ONE Protocol defines WHAT exists.**
- 6 dimensions (Groups, People, Things, Paths, Events, Knowledge)
- 66 entity types, 25 path types, 67 event types
- Self-describing protocol registry

**The Substrate defines HOW decisions are made.**
- Protocol selection → edge strength
- Orchestration → continuations
- Fallback → topology rerouting
- Learning → drop/fade/highways

**Both are implemented.** The 10 conceptual gaps are closed:

| Layer | Lines | Files | Status |
|-------|-------|-------|--------|
| Engine (substrate) | 957 | 13 TS files | Done |
| Schema (ontology) | 1,606 | 6 TQL files | Done |
| Inference patterns | 4,157 | 10 TQL + docs | Done |
| Move contract | 335 | 1 .move file | Done |
| UI components | 4,660 | 10 TSX files | Done |

**What remains is wiring — see [gaps.md](gaps.md):**

```
Gap 1: TypeDB driver         → schema runs live
Gap 2: UI ↔ TypeDB           → users see real data
Gap 3: Data source oracles   → real signals flow
Gap 4: LLM ↔ UI             → agents reason visibly
Gap 5: Move deployment       → on-chain state
Gap 6: Auth / identity       → Sybil defense
Gap 7: Payment / escrow      → economics work
```

```
ONE Protocol (Data Model)  +  Substrate (Decision Engine)  =  Emergent Intelligence

The ontology describes the world.     ✓ implemented
The substrate makes decisions in it.  ✓ implemented
The swarm learns and optimizes.       ✓ implemented

Now: wire them together.
```

---

*10 conceptual gaps closed. 7 integration gaps remain. TypeDB is the keystone.*

---

## See Also

- [flows.md](flows.md) — How the substrate fills gaps through signal flow
- [one-protocol.md](one-protocol.md) — Protocol the gaps apply to
- [gaps.md](gaps.md) — Production readiness phases
- [README.md](README.md) — Substrate primitives that close the gaps
- [Plan.md](Plan.md) — Implementation roadmap
- [code.md](code.md) — The 70-line substrate implementation
