# Sui

**What Move adds. Why it matters. How it completes the substrate.**

---

## Quick Start — Deploy to Sui Testnet

```bash
# 1. Install Sui CLI
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui

# 2. Create keypair (first time only)
sui client new-env --alias testnet --rpc https://fullnode.testnet.sui.io:443
sui client switch --env testnet
sui client new-address ed25519    # Save the address + recovery phrase
sui client faucet                 # Get testnet SUI for gas

# 3. Publish the contract
cd src/move/one
sui move build
sui move test                     # Run Move tests first
sui client publish --gas-budget 100000000
# → Records package ID. Save it.

# 4. Store package ID
echo "SUI_PACKAGE_ID=0x<your-package-id>" >> ../../../.env
echo "SUI_NETWORK=testnet" >> ../../../.env

# 5. Install TS SDK (from project root)
cd ../../..
bun install @mysten/sui

# 6. Verify
sui client objects               # Should show Protocol singleton
```

**After deploy:**
- Package ID goes in `.env` as `SUI_PACKAGE_ID`
- Protocol singleton (shared object) created on `init()`
- Contract address: `one::substrate` module on Sui testnet
- Explorer: `https://suiscan.xyz/testnet/object/<package-id>`

---

## Live on Testnet

Published 2026-04-06. All transactions verified.

### Objects

| Object | ID | Type |
|--------|-----|------|
| Package | `0xd064518697137f39a333d50f3a6066117332aeb079fc23a7617271b9ad5f4980` | Immutable |
| Protocol | `0xc30a7702e7c8a4b9914d8bdb4b1da20c5e2c9bc924fed1e8c947ed66ec16e379` | Shared — treasury: 0, fee: 50 bps |
| Scout Unit | `0x6fd45656222db69f81dbf61c70873fd466ebd8b157bf6694f81314e3e0c13af8` | Owned — name: "scout", balance: 99000 MIST |
| Analyst Unit | `0x952fea2b99904aa8a365939c5ebc8079014b7cef7ac1ab2375b5a10e4ec6c47d` | Owned — name: "analyst" |
| Path | `0x956cbf6c2f62769248676f225b9897c5ecfcc52a193c67b86438568d993076da` | Shared — scout→analyst, strength: 2, hits: 2 |
| Signal | `0x8a17e80a0484969b0e4816bd705ed8b798ce29025f4d259e52c86cf60129da42` | Owned by analyst — payload: "hello from scout" |

### Proof Transactions

| Step | What | Digest |
|------|------|--------|
| Publish | Contract deployed, Protocol created | `5GNhTrAyoaHP8BEd3JgnrvZRTThSwv7xu5tNsGg3a6Q6` |
| Create scout | Unit { name: "scout", unit_type: "agent" } | `5etcefzNgZ1vJsVH9uZS5PkY9zdxvbTCdRoeCC3FQkSv` |
| Create analyst | Unit { name: "analyst", unit_type: "agent" } | `9hLakZxVEwcEDR9HnBKYnRVvta3Yyu15RT69BKfxY4pJ` |
| Create path | Path scout→analyst, type: "interaction" | `BwCwZcirBE5sA9YUbtsyYFHXHMTSB11WCofUjNmXpmFi` |
| Send signal | Signal "research" with payload, scout→analyst | `316kNqFFnuUemiT73KzorUpoviBacMV2kgh2kQ8tPULz` |
| Mark path | Path strength: 1→2 (signal delivery) | `81ppuA3A5F8RhN64K295TqpjfXfS9AXDjALiNukfTjwn` |
| Deposit | 100000 MIST into scout Unit balance | `D3LYBvdy5BESX3nTkQRPYm2CJjRZrNAVTKx6u7xvLYR2` |
| Payment | Withdraw 1000 MIST → analyst, mark path | `ABWX2g6UrVL1jnfPZNiop7L65AVUKgJjcxREVeEWwB9d` |

### Verify

```bash
# Any object
sui client object 0xd064518697137f39a333d50f3a6066117332aeb079fc23a7617271b9ad5f4980

# Explorer
open https://suiscan.xyz/testnet/object/0xd064518697137f39a333d50f3a6066117332aeb079fc23a7617271b9ad5f4980
```

---

## The Bridge

Three systems. One truth. Each makes the others smarter.

```
     mark()              Marked event           strength++
  ┌──────────┐  mirror  ┌──────────┐  absorb  ┌──────────┐
  │ Runtime  │─────────►│   Sui    │─────────►│  TypeDB  │
  │ persist  │          │  chain   │          │  brain   │
  └────┬─────┘          └──────────┘          └────┬─────┘
       │                                           │
       └──────────────── load() ◄──────────────────┘
```

### Three Functions

```typescript
mirrorMark(from, to, n)   // Runtime → Sui   (action becomes on-chain fact)
mirrorWarn(from, to, n)   // Runtime → Sui   (failure becomes on-chain fact)
absorb(cursor?)           // Sui → TypeDB    (on-chain facts become knowledge)
```

### One Mark, Three Systems

Every `mark()` in the runtime does three things:

```
persist.mark("scout→analyst", 1)
  │
  ├── Memory    net.strength["scout→analyst"] += 1     immediate
  ├── Brain     TypeDB path.strength += 1              writeSilent()
  └── Chain     Sui Path.strength += 1                 mirrorMark()
```

Every `absorb()` reads Sui events, writes to TypeDB:

```
absorb(cursor)
  │
  ├── UnitCreated  → store sui-unit-id on unit
  ├── Marked       → update path.strength
  ├── Warned       → update path.resistance
  ├── SignalSent   → record signal event
  └── PaymentSent  → update path.revenue
```

### The Glue

Two TypeDB attributes connect every unit and path to their on-chain twin:

```
unit  →  sui-unit-id   "0x6fd4..."    (Sui Unit object ID)
path  →  sui-path-id   "0x956c..."    (Sui Path object ID)
```

`resolve(uid)` finds both. `resolvePath(from, to)` finds the path.
First interaction creates the on-chain path automatically.

### Files

```
src/engine/bridge.ts     Bridge: mirror + absorb + resolve
src/engine/persist.ts    mark/warn/actor auto-mirror to Sui
src/lib/sui.ts           Sui client: all contract functions
src/schema/world.tql     sui-unit-id, sui-path-id attributes
src/pages/api/absorb.ts  POST /api/absorb → poll events
```

### The Cycle

```
1. Agent sends signal          Runtime mark()      → strength++
2. persist.ts mirrors          Sui mark()          → on-chain strength++
3. Sui emits Marked event      Event log           → queryable
4. absorb() polls events       TypeDB write        → path.strength synced
5. TypeDB infers               path_status()       → "highway" if ≥ 50
6. Runtime loads on boot       load()              → hydrate from TypeDB
7. select() picks highway      Weighted random     → proven path chosen
8. Signal flows faster         Chain strengthens   → repeat
```

TypeDB reasons. Sui enforces. The runtime acts.
None is optional. None is primary. They are one substrate.

---

## The Thesis

TypeDB reasons. Move acts. Together they are two deterministic fires burning the same ontology.

TypeDB can infer that a path is a highway. But it can't stop someone from lying about it.
Move can't infer anything. But it can guarantee that `strength` only increments through
`mark()`, that `balance` only moves through `transfer()`, that a frozen highway stays frozen forever.

```
TypeDB                              Move
──────                              ────
Inference                           Enforcement
"this path IS a highway"            "this path CAN ONLY become a highway through 50 real drops"
Soft truth (can be overwritten)     Hard truth (cannot be overwritten)
Reads the world                     Constrains the world
```

Remove either and you have half a brain. TypeDB without Move is a genius with no backbone.
Move without TypeDB is a vault with no one who can read.

---

## What Move's Type System Actually Gives You

### 1. Linear Types = Signals Can't Be Copied

In TypeScript, a signal is a JSON object. Anyone can `JSON.parse(JSON.stringify(signal))`.
Two agents can both claim they received the same signal. There's no proof.

In Move, a signal is an **owned object**. It exists once. When you transfer it, you don't have it anymore.
When the receiver consumes it, it's gone. Not deleted from a database. Gone from the universe.

```
TypeScript:                          Move:
signal = { receiver: 'bob' }        struct Signal has key, store { ... }
// copy it? sure                     // copy it? impossible
// double-spend it? sure             // double-spend it? impossible
// prove you received it? no         // prove you received it? yes (object ID on chain)
```

This is what makes `{ receiver, data }` real. Not a metaphor. Not a log entry. A physical object
that moves between addresses. Ant pheromone is a physical molecule. Move signals are physical objects.

### 2. Owned vs Shared = Fast Path vs Consensus

Sui splits the world into two speeds:

| Object Type | Consensus | Latency | ONE Mapping |
|-------------|-----------|---------|-------------|
| **Owned** | None (fast path) | ~400ms | Unit, Signal |
| **Shared** | Full consensus | ~2-3s | World, Flow, Escrow |
| **Frozen** | None (immutable) | Instant read | Highway |

A unit is owned by its operator. Nobody votes on whether your agent exists.
A colony is shared — every member can modify it, so consensus is needed.
A signal is owned, then transferred. Fast. No committee.

This maps perfectly:

```
Agent sends signal to agent          → owned object transfer  → 400ms
World treasury pays bounty          → shared object modify   → 2-3s
Proven highway known          → freeze_object()        → permanent
```

TypeDB doesn't know about latency. It infers. Move knows about latency because
the object model IS the performance model.

### 3. Abilities = What Can Happen to an Object

Move has four abilities: `key`, `store`, `copy`, `drop`. Every struct declares what's possible.

```move
struct Unit has key, store { ... }      // Can be owned, can be stored inside other objects
struct Signal has key, store { ... }    // Can be owned, transferred, stored
struct Highway has key { ... }          // Can be owned. Can NOT be stored inside something else.
                                        // Once frozen, nothing can wrap it or move it.
```

No `copy` on any of them. You can't clone a unit. You can't clone a signal.
You can't clone a highway. This isn't a policy. It's a type-system guarantee.

TypeDB has no concept of "this entity cannot be duplicated." Move does. The type system
IS the security model.

### 4. `freeze_object()` = Hardening Is a Language Primitive

In most systems, "immutable" means a database flag. Someone with admin access can flip it.
In Sui, `freeze_object()` is irreversible at the VM level. No admin. No upgrade. No fork.
The object is frozen in the global object store. Forever.

```
highway.strength = 82
highway.completions = 500
highway.confidence = 0.97
freeze_object(highway)

// From this point:
// - No function can modify it
// - No authority can unfreeze it
// - Anyone can read it
// - It costs nothing to verify
```

This is what makes hardening real. A TypeDB entity with `hypothesis-status: "confirmed"`
can still be overwritten by the next transaction. A frozen Sui object cannot be overwritten
by anything. Not the deployer. Not a validator. Not a governance vote.

Proven knowledge becomes physics.

---

## The Object Model IS the Signal Pattern

| Ant World | ONE Substrate | Sui Object Model |
|------------|--------------|-----------------|
| Ant | Unit | Owned object — agent controls itself |
| World | Group | Shared object — members coordinate via consensus |
| Pheromone drop | Signal | Transferred object — moves from sender to receiver, consumed |
| Trail | Flow | Shared object — both endpoints modify strength/resistance |
| Established trail | Highway | Frozen object — permanent, verified, immutable |
| Foraging territory | World treasury | Shared object — collective resource pool |

Every row maps 1:1. Not by analogy. By structure. Sui's object model was designed for
exactly this kind of ownership and transfer pattern. They just didn't call it pheromone.

---

## What Each Primitive Gets from Move

### Signal

```
Without Move:                        With Move:
─────────────                        ──────────
JSON in TypeDB                       Owned object on Sui
Can be faked                         Can't be faked (signed by sender's keypair)
No proof of delivery                 Transfer receipt on chain
No proof of consumption              Object destroyed = consumed
Can be replayed                      Object ID is unique, consumed once
```

Signals become **unforgeable, unreplayable, provably delivered events**.
The ant's pheromone drop is real because chemistry is real. The agent's signal is real because Move is real.

### Path / Flow

```
Without Move:                        With Move:
─────────────                        ──────────
TypeDB relation                      Shared object
Anyone can write strength            Only mark() increments strength
Anyone can write resistance               Only warn() increments resistance
Decay is a cron job                  Decay is an on-chain function (auditable)
Revenue is a number                  Revenue is actual token balance
```

Paths become **trustless**. You don't need to trust the router to report strength accurately.
The chain is the ledger. `strength = 82` means 82 real, verified drops happened.

### Highway

```
Without Move:                        With Move:
─────────────                        ──────────
TypeDB entity                        Frozen object
"confirmed" is a string              Frozen is a VM-level guarantee
Admin can change it                  Nobody can change it
You trust the operator               You trust math
```

Highways become **permanent public goods**. A frozen highway on Sui is a fact that any agent,
any colony, any chain can verify without trusting anyone.

### Unit

```
Without Move:                        With Move:
─────────────                        ──────────
TypeDB entity                        Owned object
Wallet is a string field             Wallet is the Sui address that owns the object
Identity is self-reported            Identity is cryptographic (keypair)
Balance is a database number         Balance is real tokens
```

Units become **self-sovereign**. The agent owns its own object. No platform can freeze it
(only the agent can freeze it — that's hardening). No platform can modify its balance
(only signed transactions can).

### World / Group

```
Without Move:                        With Move:
─────────────                        ──────────
TypeDB relations                     Shared object
Membership is a database entry       Membership is on-chain (verifiable)
Treasury is a number                 Treasury is a real token pool
Splitting is inferred                Splitting creates real new objects
```

Colonies become **real economic entities**. A colony's treasury is actual SUI tokens.
When `splitting-colony` fires in TypeDB, the Move contract creates two new World objects
and splits the treasury. Not a database migration. A financial event.

---

## The Two-Fire Loop

```
1. Agent sends signal           → Move: transfer owned object to receiver
2. Receiver processes signal    → Move: consume object, emit result
3. Success?                     → Move: mark() → path.strength++ (on-chain)
4. Failure?                     → Move: warn() → path.resistance++ (on-chain)
5. TypeDB syncs on-chain state  → TypeDB: infer path_status, unit_classification
6. TypeDB suggests route        → TypeDB: suggest_route() returns best path
7. Router follows suggestion    → Move: next signal transferred to suggested unit
8. Repeat
```

Move acts (steps 1-4). TypeDB reasons (steps 5-6). The router follows (step 7).
Neither system is complete alone. Together they are a brain with a spine.

```
                    ┌─────────────┐
                    │   TypeDB    │
                    │  (reasons)  │
                    │             │
                    │ path_status │
                    │ suggest_    │
                    │   route()   │
                    └──────┬──────┘
                           │ reads state
                           │ returns route
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
     ┌─────────┐    ┌──────────┐    ┌──────────┐
     │  Unit A  │───▶│  Signal  │───▶│  Unit B  │
     │ (owned)  │    │(transfer)│    │ (owned)  │
     └─────────┘    └──────────┘    └──────────┘
          │                                │
          │         ┌──────────┐           │
          └────────▶│   Flow   │◀──────────┘
                    │ (shared) │
                    │ strength │
                    │  resistance   │
                    └────┬─────┘
                         │
                         │ strength >= 50
                         ▼
                    ┌──────────┐
                    │ Highway  │
                    │ (frozen) │
                    │ forever  │
                    └──────────┘
```

---

## What You Can't Do Without Move

| Capability | TypeDB Only | TypeDB + Move |
|-----------|-------------|---------------|
| Prove a signal was delivered | No (log says so) | Yes (transfer receipt on chain) |
| Prevent signal replay | No (application logic) | Yes (object consumed once) |
| Prove strength is real | No (database says so) | Yes (each drop is a signed tx) |
| Make a highway permanent | No (admin can overwrite) | Yes (freeze is irreversible) |
| Hold real money in escrow | No (numbers in a DB) | Yes (tokens locked in shared object) |
| Split a colony's treasury | No (update two rows) | Yes (token transfer, auditable) |
| Verify an agent's identity | No (self-reported) | Yes (Sui keypair) |
| Enforce capability pricing | No (honor system) | Yes (Move function requires payment) |

Every row is the same pattern: **TypeDB tells you what happened. Move guarantees it happened honestly.**

---

## Economics: Why Move Makes Revenue Real

In the substrate without Move:

```
signal fee = $0.0001          ← who collects it? A database increment.
highway route = $0.001        ← who enforces it? Application code.
hardening = $0.50       ← who guarantees it? Trust us.
```

With Move:

```
signal fee = 0.0001 SUI       ← collected by the contract. Automatic. Auditable.
highway route = 0.001 SUI     ← enforced by the contract. Can't skip payment.
hardening = 0.5 SUI     ← freeze_object() requires payment. Guaranteed.
escrow = locked tokens         ← bounty held until completion. No trust needed.
```

Revenue becomes **protocol revenue**. Not "our API charges this." The contract charges this.
No one can waive the fee. No one can discount it. No one can steal it.

Every payment strengthens a path. Revenue IS weight. This isn't a metaphor when the tokens
actually flow through the contract and the path strength increments in the same transaction.

---

## Escrow: The Missing Primitive

TypeDB can model escrow as a relation. But it can't hold money.

```move
struct Escrow has key {
    id: UID,
    poster: address,          // who posted the bounty
    worker: address,          // who's doing the work
    bounty: Balance<SUI>,     // real tokens, locked
    deadline: u64,            // auto-release timestamp
}
```

When a task has `price > 0`, the requester creates an Escrow object with real tokens.
The worker completes the task. The contract releases the bounty. If the deadline passes
without completion, the poster gets the tokens back.

No arbitrator. No disputes team. No PayPal. The contract is the escrow agent.

This makes x402 (HTTP 402 Payment Required) real:

```
1. Agent requests service          → HTTP 402: pay 0.01 SUI to escrow
2. Requester creates Escrow        → tokens locked on chain
3. Service agent executes          → result returned
4. Success verified                → escrow releases to worker
5. Path strength incremented       → same transaction
```

Payment and weight in one atomic transaction. You can't have one without the other.

---

## Agent Identity: Keypairs > Usernames

Without Move, a unit's identity is a `uid` string in TypeDB. Anyone who can write to TypeDB
can create a fake unit, fake signals, fake drops.

With Move, a unit is an owned object controlled by a Sui keypair:

```
Agent's identity = Sui address (ed25519 public key)
Agent's actions = signed transactions (verifiable)
Agent's reputation = on-chain object (auditable)
```

Sybil attack in TypeDB-only: create 1000 fake units, fake drop each other, manufacture highways.
Sybil attack with Move: each unit needs a real keypair, each drop is a signed transaction
costing gas, manufacturing a highway costs real money (50+ transactions * gas).

The cost of lying scales linearly. The cost of truth is fixed.

---

## Parallel Execution: Sui's Hidden Advantage

Most blockchains: all transactions are sequential. One global state.
Sui: **owned object transactions run in parallel**. No global ordering needed.

```
Agent A signals Agent B    → parallel (different owned objects)
Agent C signals Agent D    → parallel (different owned objects)
World X modifies treasury → sequential (shared object, consensus needed)
```

This means: a colony of 1000 agents can all send signals simultaneously.
No bottleneck. No gas wars. No mempool congestion for agent-to-agent communication.

Only shared state (colonies, flows, escrows) requires consensus.
Owned state (units, signals) is free to flow at network speed.

The substrate learns in parallel. Same as a real ant colony — 10,000 ants
foraging simultaneously, each dropping pheromone independently, trails emerging
from the aggregate.

---

## The Completeness Argument

```
TypeDB alone:
  ✓ Inference (path_status, unit_classification, needs_evolution)
  ✓ Routing (suggest_route, optimal_route, cheapest_provider)
  ✓ Knowledge (hypotheses, frontiers, objectives)
  ✗ Enforcement (anyone can write anything)
  ✗ Economics (numbers, not tokens)
  ✗ Identity (strings, not keypairs)
  ✗ Permanence (everything is mutable)

Move alone:
  ✓ Enforcement (type system guarantees)
  ✓ Economics (real tokens)
  ✓ Identity (cryptographic)
  ✓ Permanence (freeze_object)
  ✗ Inference (no reasoning engine)
  ✗ Routing (no query language for graph traversal)
  ✗ Knowledge (no hypothesis testing, no pattern detection)

TypeDB + Move:
  ✓ Everything
```

One reasons. The other enforces. Neither is optional.

---

## Summary

Move adds five things that TypeDB cannot provide:

1. **Linearity** — signals exist once, transfer once, consume once. No copies. No replays.
2. **Enforcement** — strength only increments through mark(). Balance only moves through transfer(). The type system IS the security model.
3. **Permanence** — freeze_object() is irreversible at the VM level. Hardend highways are facts, not database entries.
4. **Economics** — tokens are real. Escrow holds real money. Revenue is protocol revenue, not application revenue.
5. **Identity** — agents are keypairs. Actions are signed. Reputation is auditable. Sybil costs real money.

TypeDB is the brain. Move is the body. The substrate needs both.

---

## Tasks

> **See [TODO-SUI.md](TODO-SUI.md) for the full task list.**
>
> | Step | What | Status |
> |------|------|--------|
> | 1 | Get on Testnet | **9/9 done** |
> | 2 | First Agent On-Chain | **4/4 done** |
> | 3 | First Signal On-Chain | **5/5 done** |
> | 4 | Payment On-Chain | **5/5 done** |
> | 5 | The Bridge | **5/5 done** |
>
> **Testnet complete.** 33 done, 22 open (phases 2-6).

---

---

## Governance Events (sys-304)

Every TypeDB governance write has an on-chain receipt via `GovernanceEvent`.

### Event shape

```move
public struct GovernanceEvent has copy, drop {
    kind: String,    // chairman-grant | group-create | key-revoke | role-perm-change
    subject: String, // uid of entity acted on
    object: String,  // group id, key id, or permission name
    actor: address,  // chairman's address (on-chain identity receipt)
    timestamp: u64,  // clock ms
}
```

### Bridge function

```typescript
import { mirrorGovernance } from '@/engine/bridge'

// Called after every TypeDB governance write
await mirrorGovernance('chairman-grant', 'marketing:creative', 'g:marketing', keypair)
```

### Replay guarantee

`absorb()` ingests `GovernanceEvent` back to TypeDB as `hypothesis { source: "sui" }`. Replaying all `GovernanceEvent`s from the Sui transaction log reconstructs identical role state in TypeDB.

### Emit function

`emit_governance(kind, subject, object, clock, ctx)` — public entry, no auth gate. Authority is established by `actor = ctx.sender()` on-chain. Fake events from non-chairman addresses are detectable by actor mismatch.

---

## See Also

- [buy-and-sell.md](buy-and-sell.md) — **Commerce mechanics: list/discover/execute/settle, two ledgers, escrow, market dynamics**
- [plan.md](plan.md) — Why Sui, the five forces
- [the-stack.md](the-stack.md) — Two fires, one ontology
- [lifecycle.md](one/lifecycle.md) — Register through know
- [architecture.md](one/architecture.md) — 6 dimensions, routing, inference
- [revenue.md](one/revenue.md) — Economics: protocol revenue via Move
- [events.md](one/events.md) — The universal primitive, on-chain
- [patterns.md](one/patterns.md) — Weight loop, routing, evolution

---

*TypeDB reasons. Move enforces. Two deterministic fires. One truth.*
