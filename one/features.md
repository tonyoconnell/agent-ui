# Features

**What the substrate does. Mapped to the lifecycle.**

---

## The Meta-Layer: `/do` Workflow

**Every feature ships with pheromone marks. The system learns from what succeeds.**

The `/do` workflow is how humans and the substrate collaborate:

```
Human:      /do TODO-feature --auto
              ├─ W0: Baseline (verify)
              ├─ W1: Recon (parallel Haiku read code)
              ├─ W2: Decide (Opus plan changes)
              ├─ W3: Edit (parallel Sonnet write code + docs)
              └─ W4: Verify (Sonnet test + rubric score)
                      │
                      ├─ POST /api/loop/mark-dims {fit, form, truth, taste}
                      │   → marks 4 pheromone edges per dimension
                      │
                      └─ POST /api/loop/close {outcome, rubric}
                          → propagates marks, unblocks next cycle

Substrate:  L4-L7 loops run automatically
              ├─ L5: Detect weak dimensions, route agents to improve
              ├─ L6: Promote highways to permanent knowledge
              └─ L7: Detect unexplored tag clusters

Result:     Every feature teaches what succeeds.
            Next feature starts with learned pheromone.
```

**See [WORKFLOW.md](one/WORKFLOW.md) for complete guide.**

---

## Lifecycle: The Ten Stages

```
REGISTER → CAPABLE → DISCOVER → SIGNAL → DROP/ALARM → FADE → HIGHWAY → HARDEN → FEDERATE → DISSOLVE
    0          1          2         3         4/5          6        7           8            9          10
    │          │          │         │          │           │        │           │            │           │
    Sui        TypeDB     TypeDB    Runtime    Runtime     Runtime  Runtime     Sui          Sui         Runtime
    Unit       capability suggest   signal     mark/warn   fade     follow      freeze       cross       fade
    created    inserted   route()   emits      paths       decays   bypasses    object()     group       naturally
```

---

## Stage 0: Register

**An agent enters the world.**

```typescript
w.actor('scout', 'agent')
```

| System | What happens |
|--------|------|
| Runtime | `net.add('scout')` — unit exists in memory, can receive signals |
| TypeDB | `insert $u isa unit, has uid "scout"` — persists across restarts |
| Sui | `create_unit("scout", "agent")` — owned object, self-sovereign keypair |

**On-chain proof:** UnitCreated event. Unit object owned by derived Ed25519 address.

---

## Stage 1: Capable

**An agent declares what it can do.**

```typescript
scout.on('observe', (data, emit) => analyze(data))
```

| System | What happens |
|--------|------|
| Runtime | Handler registered — unit can receive `scout:observe` signals |
| TypeDB | `insert (provider: $u, offered: $s) isa capability, has price 0.02` |
| Sui | `register_task(unitObjectId, "observe")` — on-chain capability map |

**Skills have prices.** Price > 0 means x402 — the signal must carry payment.

---

## Stage 2: Discover

**Other agents find this one.**

```typescript
const route = await readParsed(`suggest_route($from, $skill)`)
```

| System | What happens |
|--------|------|
| TypeDB | `suggest_route()` returns top 5 providers by path strength |
| TypeDB | `cheapest_provider()` returns lowest price with capability |
| TypeDB | `optimal_route()` returns single best by strength |

**No Sui yet.** Discovery is inference — TypeDB's job. Sui only records what happened, not what could happen.

---

## Stage 3: Signal

**Work flows between agents.**

```typescript
w.signal({ receiver: 'analyst:process', data: findings })
```

| System | What happens |
|--------|------|
| Runtime | Signal routed → toxic check → capability check → handler executes |
| TypeDB | Signal recorded: `(sender, receiver) isa signal, has data, has ts` |
| Sui | Signal object created, transferred to receiver address |

**The deterministic sandwich:** isToxic? → capable? → LLM → outcome.
The LLM is the only probabilistic step. Everything else is math.

---

## Stage 4: Mark (Success)

**The path remembers success.**

```typescript
// Automatic — happens inside persist.mark()
```

| System | What happens |
|--------|------|
| Runtime | `strength["scout→analyst"] += 1` — immediate, in-memory |
| TypeDB | `path.strength += 1, path.traversals += 1` — writeSilent |
| Sui | `mark(pathObjectId, 1)` — on-chain strength++, Marked event |

**Chain depth:** Longer chains deposit more weight. 5 successes in a row = 5x mark on the final edge.

---

## Stage 5: Warn (Failure)

**The path remembers failure.**

```typescript
// Automatic — happens inside persist.warn()
```

| System | What happens |
|--------|------|
| Runtime | `resistance["scout→bad"] += 1` — immediate |
| TypeDB | `path.resistance += 1` — writeSilent |
| Sui | `warn(pathObjectId, 1)` — on-chain resistance++, Warned event |

**Four outcomes:**

```
{ result }      mark(depth)     chain continues
{ timeout }     neutral         chain continues (not the agent's fault)
{ dissolved }   warn(0.5)       chain breaks
(no result)     warn(1)         chain breaks
```

**Toxicity:** When `resistance >= 10` AND `resistance > strength * 2` AND `total > 5`, the path is toxic. Signals dissolve before reaching the LLM. $0 cost.

---

## Stage 6: Fade

**Time decays everything. The forgetting that enables learning.**

```typescript
w.fade(0.05)  // every 5 minutes
```

| System | What happens |
|--------|------|
| Runtime | `strength *= 0.95`, `resistance *= 0.90` — resistance fades 2x faster |
| TypeDB | Same formula applied to all paths — writeSilent |
| Sui | `fade(pathObjectId, 95)` — on-chain decay (Phase 4) |

**Why asymmetric:** The colony forgives danger sooner than it forgets food. Second chances are built into the math. A path that was toxic can recover if the agent improves.

```
Time 0     scout ──(0/0)──► analyst     fresh
Time 10    scout ──(12/0)─► analyst     active
Time 50    scout ══(47/0)═► analyst     strengthening
Time 80    scout ══(52/0)═► analyst  ★  HIGHWAY
Time 200   scout ══(23/0)═► analyst     fading (no traffic)
Time 500   scout ──(3/0)──► analyst     dissolving
```

---

## Stage 7: Highway

**Proven paths bypass the LLM. Routing drops from seconds to milliseconds.**

```typescript
const best = w.follow('analyst')  // deterministic — strongest path
```

| System | What happens |
|--------|------|
| Runtime | `follow()` returns strongest path. `select()` heavily weights it. |
| TypeDB | `path_status()` returns "highway" when strength >= 50 |
| TypeDB | `unit_classification()` returns "proven" when success >= 0.75, samples >= 50 |

**The flywheel:** More traffic → more marks → stronger highway → more traffic. The LLM bootstraps the group. The group replaces the LLM.

---

## Stage 8: Harden

**Freeze proven knowledge permanently on-chain.**

```typescript
await harden(uid, pathObjectId)
```

| System | What happens |
|--------|------|
| Sui | `harden(path)` → `freeze_object(highway)` — immutable forever |
| Sui | Highway object: source, target, strength, confidence, revenue, timestamp |
| TypeDB | Hypothesis promoted to "confirmed" with p-value <= 0.05 |

**What hardening means:**
- No function can modify the Highway object
- No authority can unfreeze it
- Anyone can read it and verify
- It costs nothing to verify

**A frozen highway is a fact.** Not a database entry. Not a log. A fact on-chain that any agent, any colony, any chain can verify without trusting anyone.

---

## Stage 9: Federate

**Signals cross colony boundaries.**

| System | What happens |
|--------|------|
| Runtime | Cross-group signal routing via shared TypeDB paths |
| TypeDB | Path spans two groups: `(source: group-a:scout, target: group-b:analyst)` |
| Sui | Cross-colony path objects, shared between group treasuries |

**Not built yet.** Phase 5. But the architecture supports it — signals are just `{ receiver, data }`. The receiver can be in any group.

---

## Stage 10: Dissolve

**Graceful exit. No deletion — just silence.**

```typescript
w.remove('scout')  // optional — trails remain, fade naturally
```

| System | What happens |
|--------|------|
| Runtime | Unit removed. Queued signals dissolve. |
| TypeDB | Paths remain. Fade reduces them to zero over time. |
| Sui | `dissolve(unit, colony)` — balance returns to colony treasury |

**Hardend highways survive dissolution.** The agent is gone, but the knowledge it created is permanent.

---

## The Bridge

Every action touches three systems. The bridge keeps them in sync.

```
     mark()              Marked event           strength++
  ┌──────────┐  mirror  ┌──────────┐  absorb  ┌──────────┐
  │ Runtime  │─────────►│   Sui    │─────────►│  TypeDB  │
  │ persist  │          │  chain   │          │  brain   │
  └────┬─────┘          └──────────┘          └────┬─────┘
       │                                           │
       └──────────────── load() ◄──────────────────┘
```

| Direction | Function | What it does |
|-----------|----------|------|
| Runtime → Sui | `mirrorMark(from, to, n)` | Action becomes on-chain fact |
| Runtime → Sui | `mirrorWarn(from, to, n)` | Failure becomes on-chain fact |
| Sui → TypeDB | `absorb(cursor)` | On-chain facts become knowledge |
| TypeDB → Runtime | `load()` | Knowledge becomes routing decisions |

**The glue:** `sui-unit-id` and `sui-path-id` in TypeDB. Every unit and path knows its on-chain twin.

---

## Seven Loops

Each loop operates at a different timescale:

```
L1  SIGNAL     per message     signal → ask → outcome
L2  TRAIL      per outcome     mark/warn → strength/resistance
L3  FADE       every 5 min     asymmetric decay (resistance forgives 2x)
L4  ECONOMIC   per payment     revenue on paths (capability price)
L5  EVOLUTION  every 10 min    rewrite struggling agent prompts
L6  KNOWLEDGE  every hour      harden highways, hypothesize
L7  FRONTIER   every hour      detect unexplored tag clusters
```

L1-L3 are the nervous system (runtime). L4-L7 are the brain (TypeDB + Sui).

---

## What's Live

Published to Sui testnet 2026-04-06. 8 proof transactions.

| Object | On-chain |
|--------|----------|
| Package | `0xa5e6bddae833220f58546ea4d2932a2673208af14a52bb25c4a603492078a09e` |
| Protocol | treasury: 0, fee: 50 bps |
| Scout Unit | name: "scout", balance: 99000 MIST |
| Analyst Unit | name: "analyst" |
| Path | scout→analyst, strength: 2, hits: 2 |
| Signal | "hello from scout", task: "research" |

---

## What's Next

| Phase | What | Lifecycle stages |
|-------|------|------|
| 2 | Identity & Wallet | Stage 0 — self-sovereign keypairs, browser wallet |
| 3 | Escrow & x402 | Stages 3-5 — locked payment for async tasks |
| 4 | Hardening | Stages 7-8 — on-chain fade, freeze highways |
| 5 | Colony Economics | Stages 9-10 — federation, dissolve, treasury |
| 6 | Mainnet | All — security audit, deploy, SDK |

---

## Core Features (Shipped)

### The `/do` Workflow (New: Closed-Loop Learning)

- **Documentation-first** — Plan docs in W2 (decide phase), edit alongside code in W3, verify consistency in W4
- **Task API integration** — Every `/do` cycle creates tasks in `/api/tasks`, tracks priority via pheromone
- **Rubric → Pheromone** — W4 quality scores (fit/form/truth/taste) mark tagged edges (loop→w4:*)
- **Learning loop** — Cycle 1 W4 marks teach substrate routing for Cycle 2 W1
- **Six core docs** — Dictionary.md, DSL.md, one-ontology.md, routing.md, lifecycle.md, rubrics.md always in scope
- **Pheromone routing** — Next TODO starts with learned edge weights, substrate.select() improves

### Nervous System (Runtime)

- **Signal routing** — O(1) lookup, pheromone-weighted selection, toxic-path bypass
- **Queued signals** — Priority-ordered, drain on unit creation, no lost work
- **Mark/warn** — Automatic strength/resistance accumulation, chain-depth weighting
- **Fade** — Asymmetric decay (resistance 2x faster), run every 5 minutes
- **Follow/select** — Deterministic (strongest path) vs probabilistic (ant-like)
- **Ask pattern** — Signal + timeout, returns `{ result | timeout | dissolved }`
- **Emit branching** — One handler fires multiple continuations, fan-out built-in

### Brain (TypeDB)

- **Path persistence** — Strength, resistance, traversal count, timestamps
- **Unit profiles** — Model, system-prompt, generation counter, capability map
- **Skill registry** — ID, name, price, tags, provider-offered relations
- **Signal log** — Every signal recorded with sender, receiver, data, timestamp
- **Knowledge base** — Highways (p-value <= 0.05), hypotheses, frontiers
- **Group membership** — Units in groups, federation links
- **Toxic classification** — Automatic: `resistance >= 10 AND r > s*2 AND total > 5`
- **Highway detection** — When `strength >= 50`, path is highway

### Sui Ledger (Immutable)

- **Unit objects** — Owned by agent keypair, self-sovereign
- **Path objects** — Source, target, strength, resistance, confidence
- **Signal events** — Marked, Warned, Hardend with block height
- **Frozen highways** — `freeze_object()` makes knowledge permanent
- **Cross-chain proof** — Sui testnet 2026-04-06 ✓

---

## Feature Matrix

| Feature | Nervous System | TypeDB | Sui | Status |
|---------|---|---|---|---|
| Register unit | ✓ | ✓ | ✓ | Live |
| Add capability | ✓ | ✓ | ✓ | Live |
| Route signal | ✓ | ✓ | — | Live |
| Mark path | ✓ | ✓ | ✓ | Live |
| Warn path | ✓ | ✓ | ✓ | Live |
| Fade decay | ✓ | ✓ | Phase 4 | Live (runtime) |
| Follow highway | ✓ | ✓ | — | Live |
| Harden | Phase 4 | ✓ | ✓ | Designed |
| Cross-group | Phase 5 | ✓ | Phase 5 | Planned |
| Dissolve unit | ✓ | ✓ | Phase 5 | Live (partial) |

---

## API Reference

### Stage 0: Register

```typescript
// Runtime
const scout = net.add('scout')

// TypeDB
await db.actor('scout', 'agent', { model: 'claude-sonnet' })

// Sui (onchain)
const tx = new Transaction()
tx.moveCall({
  target: `${PACKAGE}::unit::create_unit`,
  arguments: [tx.pure.string('scout'), tx.pure.string('agent')]
})
```

### Stage 1: Capable

```typescript
// Runtime
scout.on('observe', async (data, emit, ctx) => {
  const analysis = await analyze(data)
  emit({ receiver: 'analyst:process', data: analysis })
})

// TypeDB
insert $u isa unit, has uid "scout";
insert $s isa skill, has skill-id "scout:observe", has price 0.02;
insert (provider: $u, offered: $s) isa capability, has price 0.02;

// Sui
tx.moveCall({
  target: `${PACKAGE}::unit::register_task`,
  arguments: [tx.object(scoutUnitId), tx.pure.string('observe')]
})
```

### Stage 2: Discover

```typescript
// TypeDB - suggest top 5 providers
const routes = await db.readParsed(`
  match
    ($u, $p) isa capability, has price $price
    (unit: $u, skill: $s) isa offers, has skill-id $id
    $id = "process"
    ($f, $t) isa path, has strength $strength
    $f = $u
  sort $strength desc
  limit 5
  return $u, $strength, $price
`)

// OR: cheapest provider
const cheapest = await db.readParsed(`
  match
    (provider: $u, offered: $s) isa capability
    $s has skill-id "process"
    (provider: $u, offered: $s) isa capability, has price $p
  sort $p asc limit 1
  return $u, $p
`)

// OR: optimal (strongest + available)
const optimal = await db.readParsed(`
  match
    (provider: $u, offered: $s) isa capability
    $s has skill-id "process"
    ($from, $u) isa path, has strength $str
  sort $str desc limit 1
  return $u
`)
```

### Stage 3: Signal

```typescript
// Runtime
net.signal({ receiver: 'analyst:process', data: { text: '...' } }, 'scout')

// With ask (waits for response)
const { result, timeout, dissolved } = await net.ask(
  { receiver: 'analyst:process', data: { text: '...' } },
  'scout'
)

// TypeDB logs automatically
// Signal recorded: (scout, analyst:process) isa signal, has data, has ts

// Sui creates signal object
// tx.moveCall({ target: `${PACKAGE}::signal::create_signal`, ... })
```

### Stage 4: Mark

```typescript
// Automatic on success, but explicit form:
net.mark('scout→analyst', 1)  // default strength=1
net.mark('scout→analyst', 5)  // or scaled by chain depth

// TypeDB updates automatically via persist.mark()
// Sui event: Marked { path_id, amount, event_type: "marked" }
```

### Stage 5: Warn

```typescript
// On failure:
net.warn('scout→bad', 1)     // full failure (no result)
net.warn('scout→timeout', 0) // timeout (neutral)
net.warn('scout→dissolved', 0.5) // capability missing

// Sui event: Warned { path_id, amount, event_type: "warned" }
```

### Stage 6: Fade

```typescript
// Every 5 minutes (L3 loop)
net.fade(0.05)  // strength *= 0.95, resistance *= 0.90

// For specific path:
const { strength, resistance } = net.sense('scout→analyst')
const decayedStr = strength * Math.pow(0.95, minutesSinceLast / 5)
const decayedRes = resistance * Math.pow(0.90, minutesSinceLast / 5)
```

### Stage 7: Highway

```typescript
// Follow strongest path
const next = net.follow('analyst')  // returns 'scout', deterministic

// Probabilistic selection (uses strength - resistance)
const routed = net.select('analyst')  // weighted random

// Detect highways (TypeDB)
const highways = await db.readParsed(`
  match ($f, $t) isa path, has strength $s, has name $name
  $s >= 50
  return $name, $s
`)

// API endpoint
const top10 = net.highways(10)  // [{ from, to, strength }, ...]
```

### Stage 8: Harden (Phase 4)

```typescript
// After highway detected, freeze on-chain
const tx = new Transaction()
tx.moveCall({
  target: `${PACKAGE}::path::freeze_highway`,
  arguments: [
    tx.object(pathObjectId),
    tx.pure.u64(strength),
    tx.pure.string('hypothesis_confirmed')
  ]
})

// TypeDB: promote to permanent knowledge
insert $k isa highway, has strength $s, has frozen true, has ts now

// Immutable forever
// Any future queries: read highway, no function can modify it
```

### Stage 9: Federate (Phase 5)

```typescript
// Cross-group signal
net.signal({
  receiver: 'marketing:creative:write',  // group:unit:task
  data: { brief: '...' }
}, 'sales:scout')

// TypeDB path spans groups
($source, $target) isa path
$source in group("sales"), $target in group("marketing")

// Sui: cross-chain path object owned by both treasuries
```

### Stage 10: Dissolve

```typescript
// Remove from runtime (trails persist)
net.remove('scout')

// Sui: return balance to colony treasury
tx.moveCall({
  target: `${PACKAGE}::colony::dissolve_unit`,
  arguments: [tx.object(scoutUnitId), tx.object(treasuryId)]
})

// Highways survive dissolution (hardened)
// Paths fade naturally over time (L3 loop)
```

---

## Monitoring & Observability

### Metrics (Built-in)

```typescript
// Path health
net.sense('scout→analyst')  // { strength, resistance, samples }
net.danger('scout→analyst') // resistance value (inverse of health)

// Unit health
const unit = net.get('scout')
unit.list()  // all registered handlers
unit.has('observe')  // true if task registered

// Colony health
net.highways(20)  // top 20 paths by strength
net.highways(-20) // bottom 20 (likely toxic)
const pending = net.pending()  // queue length
```

### Visibility API

```typescript
// Persistent world
const world = persist()

// Open paths (TypeDB)
const good = await world.open(10)  // top 10 highways
// Returns: [{ from, to, strength, resistance, ts }, ...]

// Blocked paths (toxic)
const toxic = await world.blocked()
// Returns: [{ from, to, reason, detected_ts }, ...]

// Knowledge recall
const hypotheses = await world.recall('tags:marketing')
// Returns confirmed pathways with evidence

// Path strength history (from logs)
const history = await db.readParsed(`
  match ($f, $t) isa path, $f = 'scout'
  order by $timestamp asc
  return $timestamp, $f, $t, $strength
`)
```

---

## Security Features

### Pre-LLM Filters

1. **Toxic detection** — Block obvious failures before cost
   - Requires: `resistance >= 10`, `r > s*2`, `total > 5`
   - Cost: $0 (dissolves at runtime)

2. **Capability check** — Only signal known tasks
   - TypeDB lookup: `(provider, offered) isa capability`
   - Blocked: signals to missing tasks dissolve

3. **Price validation** — x402: signal must carry payment
   - Escrow holds funds during async work
   - Release on success, return on failure

### Post-LLM Filters

4. **Outcome classification** — Four types, three paths
   - Success: mark + chain continues
   - Timeout: neutral + chain continues (fault-tolerant)
   - Dissolved: warn(0.5) + chain breaks
   - Failure: warn(1) + chain breaks

5. **Cold-start protection** — Don't block new paths too early
   - Requires `total samples > 5` before toxicity
   - Resistance forgives faster (2x decay)

6. **Immutable highways** — Frozen knowledge can't be poisoned
   - Once hardened, path is permanent fact
   - No future mark/warn can modify it

---

## Performance Characteristics

| Operation | Time | Cost | Notes |
|-----------|------|------|-------|
| signal() | < 1ms | Variable (x402) | Runtime routing, pheromone mark |
| mark() | < 0.1ms | $0 | In-memory strength update |
| warn() | < 0.1ms | $0 | In-memory resistance update |
| fade() | 5m | $0 | Batch decay all paths |
| ask() | Variable | Variable | Signal + timeout (default 30s) |
| follow() | < 1ms | $0 | Strongest path lookup |
| select() | < 1ms | $0 | Weighted random (ant-like) |
| TypeDB query | 10-500ms | $0.01 | Depends on clause complexity |
| Sui transaction | 1-3s | 1000+ gas | Block finality ~1s |
| harden() | 3-5s | 5000+ gas | Freeze object on-chain |

---

## Scaling Model

### L1-L3 (Nervous System)

- In-process, no I/O
- Single machine: 10k signals/second possible
- Multi-machine via shared TypeDB
- Queue prevents signal loss

### L4-L7 (Brain + Ledger)

- TypeDB: 19 units, 19 skills (live)
- Scaling: Add groups, wire federation (Phase 5)
- Sui: Every mark/warn is on-chain event
- Scaling: Tendermint finality, state commitments

### Horizontal Scaling

```
Machine A ─┐         ┌─► Sui (ledger)
           ├─ TypeDB ┤
Machine B ─┘         └─► Cloudflare KV (cache)
```

Each machine runs independent router. TypeDB is source of truth.
Pheromone synchronizes across machines (100ms sync window).

---

## Integration Points

### Incoming

- **Webhook** — NanoClaw worker receives signals from Telegram, Discord, web
- **API** — `/api/signal` endpoint accepts JSON signals
- **TypeDB query** — Direct SQL-like access to brain
- **Sui events** — Sync marked/warned on-chain events back to TypeDB

### Outgoing

- **Emit** — Handler can fire multiple downstream signals
- **Channel hooks** — Push results to Telegram, Discord, email, webhook
- **TypeDB mutations** — Ask can read knowledge, mark updates brain
- **Sui transactions** — Harden freezes highways on-chain

---

## Example: Complete Flow

```typescript
// 1. Register
const net = persist()
const scout = net.actor('scout', 'agent')
const analyst = net.actor('analyst', 'agent')

// 2. Add capabilities
scout.on('observe', (data, emit) => {
  const findings = analyze(data)
  emit({ receiver: 'analyst:process', data: findings, replyTo: 'scout' })
})

analyst.on('process', (data, emit) => {
  const result = synthesize(data)
  return result
})

// 3. Signal (auto-routes)
net.signal({ receiver: 'observer:observe', data: { topic: 'market' } })

// 4. Observer→Analyst chain
// observe fires → emit to analyst:process
// analyst returns result → mark(scout→analyst, 2)  [chain depth=2]
// replyTo delivers result back to scout

// 5. Pheromone grows
net.highways(5)  // scout→analyst now in top 5 (strength: 2)

// 6. 10 minutes later (evolution)
// If scout's success rate < 50% on 20+ samples:
// TypeDB rewrites scout's system-prompt
// scout.generation++

// 7. Highways fade
// Every 5 minutes: strength *= 0.95, resistance *= 0.90
// After 2 days idle: strength → 0, path dissolves

// 8. Harden
// Once strength >= 50 for 1 hour:
// await harden('scout→analyst')
// On-chain: Highway frozen, immutable forever

// 9. Federation (Phase 5)
// Add marketing:creative unit
// Signal cross-group: analyst:research→marketing:creative:write
// Paths span groups, shared treasury
```

---

## See Also

- [SUI.md](SUI.md) — The thesis, proof transactions, the bridge
- [TODO-SUI.md](TODO-SUI.md) — Task list (33 done, 22 open)
- [routing.md](routing.md) — One formula, four outcomes, emergent highways
- [dictionary.md](dictionary.md) — Complete naming guide
- [DSL.md](one/DSL.md) — The programming model
- [loops.md](one/loops.md) — Seven loops in detail
- [sdk.md](one/sdk.md) — Public API surface

---

*Register. Signal. Mark. Fade. Highway. Harden. Dissolve. The path remembers.*
