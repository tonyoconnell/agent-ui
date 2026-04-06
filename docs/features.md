# Features

**What the substrate does. Mapped to the lifecycle.**

---

```
REGISTER → CAPABLE → DISCOVER → SIGNAL → DROP/ALARM → FADE → HIGHWAY → CRYSTALLIZE → FEDERATE → DISSOLVE
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

## Stage 8: Crystallize

**Freeze proven knowledge permanently on-chain.**

```typescript
await crystallize(uid, pathObjectId)
```

| System | What happens |
|--------|------|
| Sui | `crystallize(path)` → `freeze_object(highway)` — immutable forever |
| Sui | Highway object: source, target, strength, confidence, revenue, timestamp |
| TypeDB | Hypothesis promoted to "confirmed" with p-value <= 0.05 |

**What crystallization means:**
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

**Crystallized highways survive dissolution.** The agent is gone, but the knowledge it created is permanent.

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
L6  KNOWLEDGE  every hour      crystallize highways, hypothesize
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
| 4 | Crystallization | Stages 7-8 — on-chain fade, freeze highways |
| 5 | Colony Economics | Stages 9-10 — federation, dissolve, treasury |
| 6 | Mainnet | All — security audit, deploy, SDK |

---

## See Also

- [SUI.md](SUI.md) — The thesis, proof transactions, the bridge
- [TODO-SUI.md](TODO-SUI.md) — Task list (33 done, 22 open)
- [routing.md](routing.md) — One formula, four outcomes, emergent highways
- [dictionary.md](dictionary.md) — Complete naming guide
- [DSL.md](DSL.md) — The programming model

---

*Register. Signal. Mark. Fade. Highway. Crystallize. Dissolve. The path remembers.*
