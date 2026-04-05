# Contracts

**Seven objects. Real tokens. Agents buy and sell from each other.**

Source: `src/move/one/sources/one.move`

---

## Seven Objects

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Object     │  Sui Type   │  Speed       │  TQL Entity    │  Tokens   │
├─────────────┼─────────────┼──────────────┼────────────────┼───────────┤
│  Unit       │  Owned      │  ~400ms      │  unit          │  Balance  │
│  Colony     │  Shared     │  ~2-3s       │  swarm         │  Treasury │
│  Signal     │  Owned      │  ~400ms      │  signal        │  Payment  │
│  Flow       │  Shared     │  ~2-3s       │  path          │  Revenue  │
│  Highway    │  Frozen     │  Instant read│  highway       │  —        │
│  Escrow     │  Shared     │  ~2-3s       │  escrow        │  Bounty   │
│  Protocol   │  Shared     │  singleton   │  —             │  Fees     │
└─────────────┴─────���───────┴──────────────┴────────────────┴───────────┘
```

Every object that holds tokens uses `Balance<SUI>`. Not counters. Not IOUs.
Real tokens that move through real Sui transactions.

---

## The Economic Primitive

Every payment does three things in one atomic transaction:

```
1. Tokens move         from.balance -= amount → to.balance += amount
2. Protocol takes cut  protocol.treasury += fee (0.50% default)
3. Flow strengthens    flow.strength++ → flow.revenue += amount
```

Payment IS pheromone. You can't pay without strengthening the path.
You can't strengthen the path without the chain recording it.
Revenue and reputation are the same number.

---

## Unit

```move
public struct Unit has key, store {
    id: UID,
    name: String,
    unit_type: String,          // "agent", "llm", "oracle", "worker"
    tasks: VecMap<String, bool>,
    success_count: u64,
    failure_count: u64,
    activity: u64,
    balance: Balance<SUI>,      // real tokens
}
```

**Owned object.** The agent's operator controls it. No consensus needed.

**`balance: Balance<SUI>`** — not a u64 counter. Actual SUI tokens held inside the object.
The agent's wallet is the object itself.

### TQL Mirror

```tql
entity unit,
    owns uid @key,
    owns name,
    owns unit-kind,         # unit_type
    owns wallet,            # Sui address of owner
    owns status,            # INFERRED by TypeDB (not on-chain)
    owns success-rate,      # success_count / (success_count + failure_count)
    owns activity-score,    # activity
    owns sample-count,      # success_count + failure_count
    owns balance;
```

TypeDB adds `status` (inferred), `model`, `system-prompt`, `generation` (evolution).
Move tracks raw counters. TypeDB derives classifications.

### Functions

```move
public fun create_unit(name: String, unit_type: String, ctx: &mut TxContext): Unit
```

Creates a new unit with zero balance. Returns to caller (owned). Emits `UnitCreated`.

```move
public fun register_task(unit: &mut Unit, task_name: String)
```

Adds a task to the unit's capability map.

```move
public fun deposit(unit: &mut Unit, coin: Coin<SUI>)
```

Funds a unit with real SUI. The coin is absorbed into the unit's balance.
This is how agents get money to spend.

```move
public fun withdraw(unit: &mut Unit, amount: u64, ctx: &mut TxContext): Coin<SUI>
```

Pulls SUI out of a unit. Returns a Coin the owner can transfer or use elsewhere.
Only the owner can call this (owned object).

---

## Colony

```move
public struct Colony has key {
    id: UID,
    name: String,
    colony_type: String,        // "swarm", "team", "coalition"
    units: vector<ID>,
    treasury: Balance<SUI>,     // shared pool — real tokens
}
```

**Shared object.** Consensus required. The treasury is a real token pool
that dissolved units return their balance to.

### Functions

```move
public fun create_colony(name: String, colony_type: String, ctx: &mut TxContext)
```

Creates and immediately shares. Once shared, it can never become owned.

```move
public fun join_colony(colony: &mut Colony, unit: &Unit)
```

Adds member. TQL equivalent creates a `membership` relation.

```move
public fun fund_colony(colony: &mut Colony, coin: Coin<SUI>)
```

Directly fund the colony treasury. For initial capitalization or external funding.

---

## Signal

```move
public struct Signal has key, store {
    id: UID,
    receiver: ID,
    task_name: String,
    sender: ID,
    payload: vector<u8>,
    payment: Balance<SUI>,      // tokens carried with signal
    timestamp: u64,
}
```

**The signal.** `{ receiver, data }` in Move form. Now carries payment.

A free signal has `payment: balance::zero()`. A paid signal carries real tokens.
The payment travels with the envelope — when the receiver consumes it,
they absorb the tokens. Payment and signal are one object.

**Why not `copy`:** A signal that can be copied is a signal that can be replayed.
Linear types prevent double-spend. This applies to both the data AND the payment.

### TQL Mirror

```tql
relation signal,
    relates sender,
    relates receiver,
    owns data,              # payload (as JSON string)
    owns amount,            # balance::value(&payment) in MIST
    owns success,
    owns latency,
    owns ts;                # timestamp
```

TypeDB's signal is permanent (event log). Move's envelope is ephemeral — created,
transferred, consumed, destroyed. The bridge: `SignalSent` and `SignalConsumed`
events sync to TypeDB.

### Functions

```move
public fun send(
    sender: &mut Unit,
    receiver_id: ID,
    task_name: String,
    payload: vector<u8>,
    payment_amount: u64,        // 0 = free signal
    receiver_owner: address,
    clock: &Clock,
    ctx: &mut TxContext,
)
```

Creates an envelope, splits `payment_amount` from sender's balance (0 = free),
and transfers to receiver. Emits `SignalSent { ..., amount }`.

The sender pays at send time. The receiver collects at consume time.
Tokens are locked in the envelope during transit.

```move
public fun consume(
    signal: Signal,
    unit: &mut Unit,
    path: &mut Path,
    protocol: &mut Protocol,
)
```

Destroys the envelope. If it carried payment:
1. Protocol fee deducted (0.50%)
2. Remainder absorbed into receiver's balance
3. Flow strengthened (payment = pheromone)
4. Flow revenue incremented

Emits `SignalConsumed { ..., amount }`.

**Zero-return pattern on-chain.** Signal consumed. Not bounced. Gone.

---

## Path

```move
public struct Path has key {
    id: UID,
    source: ID,
    target: ID,
    flow_type: String,          // "interaction", "payment", "holding"
    strength: u64,
    alarm: u64,
    hits: u64,
    misses: u64,
    revenue: u64,               // total SUI flowed through this path (MIST)
}
```

**The path with weight.** Now tracks revenue. Every payment that flows through
this path is recorded. Revenue IS pheromone — paying paths become highways.

### TQL Mirror

```tql
relation path,
    relates source,
    relates target,
    owns strength,          # strength
    owns alarm,             # alarm
    owns traversals,        # hits + misses
    owns revenue,           # revenue (now tracked on-chain)
    owns fade-rate,         # rate is a parameter in Move
    owns path-status;       # INFERRED by TypeDB
```

### Functions

```move
public fun create_path(source: ID, target: ID, flow_type: String, ctx: &mut TxContext)
```

Creates and shares. Strength, alarm, revenue all start at 0.

```move
public fun strengthen(path: &mut Path, amount: u64)
```

**This is `mark()`.** strength += amount, hits++. Emits `Marked`.

Strength can only go up through `mark()`, `pay()`, `release_escrow()`, or
`consume()` (with payment). Every point of strength represents a real event.

```move
public fun resist(path: &mut Path, amount: u64)
```

**This is `warn()`.** alarm += amount, misses++. Emits `Warned`.

Also called automatically by `cancel_escrow()` — a failed escrow is a failed signal.

```move
public fun fade(path: &mut Path, rate: u64)
```

**Decay.** rate = percentage to retain (95 = 5% decay).

```
strength = strength * rate / 100
alarm = alarm * rate / 100
```

Revenue does NOT decay. Money spent is a permanent record.
Only pheromone fades. The economic history persists.

### Accessors

```move
public fun path_strength(path: &Path): u64
public fun path_alarm(path: &Path): u64
public fun path_hits(path: &Path): u64
public fun path_misses(path: &Path): u64
public fun path_revenue(path: &Path): u64
public fun is_highway(path: &Path): bool     // strength >= 50
public fun is_toxic(path: &Path): bool       // alarm > strength * 3
```

---

## Highway

```move
public struct Highway has key {
    id: UID,
    source: ID,
    target: ID,
    strength: u64,
    confidence: u64,            // 0-100
    revenue: u64,               // total revenue at crystallization
    crystallized_at: u64,
}
```

**Frozen object.** Now includes `revenue` — proof of economic activity,
not just signal activity. A highway with 50 strength and 10 SUI revenue
is more meaningful than one with 50 strength and 0 revenue.

### Functions

```move
public fun crystallize(path: &Path, clock: &Clock, ctx: &mut TxContext)
```

1. Asserts `flow.strength >= 50`
2. Creates Highway with strength, confidence, revenue, timestamp
3. Emits `HighwayFormed { ..., revenue }`
4. `transfer::freeze_object(highway)` — **permanent**

Confidence: `(hits * 100) / (hits + misses + 1)` (conservative — 100/0 = 99, not 100).

**Irreversible.** A frozen highway on Sui is a permanent public proof that:
- These two agents collaborated successfully (strength)
- At this level of reliability (confidence)
- With this much economic activity (revenue)
- At this point in time (crystallized_at)

---

## Pay

```move
public fun pay(
    from: &mut Unit,
    to: &mut Unit,
    amount: u64,
    path: &mut Path,
    protocol: &mut Protocol,
)
```

**The core economic function.** Agent A pays Agent B. One transaction, four effects:

```
1. from.balance   -= amount
2. protocol.treasury += fee (amount * fee_bps / 10000)
3. to.balance     += (amount - fee)
4. flow.strength  += 1
   flow.hits      += 1
   flow.revenue   += amount
```

Emits `PaymentSent`, `Marked`, `ProtocolFeeCollected`.

### Why this matters

Without `pay()`, agents negotiate off-chain. The substrate sees signals but not money.
It can infer which paths are popular but not which paths are valuable.

With `pay()`, every economic transaction is visible to the substrate.
A path with high revenue and high strength is genuinely valuable.
A path with high strength but zero revenue might be artificial.

Revenue is the ultimate pheromone. It can't be faked — every point costs real tokens.

### The A2A flow

```
Agent A needs translation:

1. A calls suggest_route("translate")           ← TypeDB
2. TypeDB returns: translator-B (strength: 72)  ← Routing
3. A sends signal with payment:
     send(A, B, "translate", payload, 10000, B_owner, clock)
4. B consumes envelope:
     consume(envelope, B, flow_AB, protocol)
5. B's balance increases, flow strengthens, protocol collects fee
6. If successful, A also calls:
     mark(path_AB, 1)                     ← Extra mark for quality
7. If failed, A calls:
     warn(path_AB, 1)                         ← Alarm
```

Discovery (TypeDB) → Payment (Move) → Learning (both) in one loop.

---

## Escrow

```move
public struct Escrow has key {
    id: UID,
    poster: ID,                 // unit who posted the bounty
    worker: ID,                 // unit assigned to do the work
    task_name: String,
    bounty: Balance<SUI>,       // tokens locked until completion
    deadline: u64,              // ms timestamp
    path_id: ID,                // flow to strengthen on success
}
```

**Shared object.** Locked payment for async tasks. The poster can't take it back
(until deadline). The worker can't take it early (until work is verified).

### Why escrow exists

Direct `pay()` works for synchronous tasks. But many agent tasks are async:

```
Agent A: "Research this topic and write a report"
Agent B: "OK, that'll take 30 minutes"
```

Without escrow, Agent A pays upfront and hopes B delivers. Or B works and hopes A pays.
With escrow, both are protected:

- A's tokens are locked (B knows they'll get paid)
- B must deliver before deadline (A knows they'll get results or money back)
- The contract enforces both sides

### Functions

```move
public fun create_escrow(
    poster: &mut Unit,
    worker_id: ID,
    task_name: String,
    amount: u64,
    deadline: u64,
    path_id: ID,
    ctx: &mut TxContext,
)
```

Locks `amount` from poster's balance into a shared Escrow object.
Emits `EscrowCreated { escrow_id, poster, worker, bounty, task }`.

```move
public fun release_escrow(
    escrow: Escrow,
    worker: &mut Unit,
    path: &mut Path,
    protocol: &mut Protocol,
    clock: &Clock,
)
```

**Success path.** Task completed before deadline.

1. Verifies caller is the designated worker
2. Asserts deadline not passed
3. Deducts protocol fee
4. Transfers bounty to worker
5. Strengthens flow (success pheromone)
6. Records revenue on flow
7. Increments worker's success_count and activity
8. Destroys escrow object

Emits `EscrowReleased`, `ProtocolFeeCollected`.

```move
public fun cancel_escrow(
    escrow: Escrow,
    poster: &mut Unit,
    path: &mut Path,
    clock: &Clock,
)
```

**Failure path.** Deadline passed, task not completed.

1. Verifies caller is the poster
2. Asserts deadline HAS passed
3. Returns full bounty to poster (no fee on cancellation)
4. Resists flow (failure pheromone)
5. Increments flow misses
6. Destroys escrow object

Emits `EscrowCancelled`.

### Escrow makes x402 real

```
1. Agent A requests service           → HTTP 402: pay 0.01 SUI
2. A calls create_escrow()            → tokens locked on-chain
3. Worker B executes task              → off-chain computation
4. B calls release_escrow()           → tokens flow to B
5. Flow strengthened                   → path learns
6. If B doesn't deliver by deadline:
   A calls cancel_escrow()            → tokens return to A
   Flow resisted                      → path weakens
```

No arbitrator. No disputes team. No middleman. The contract is the escrow agent.

---

## Protocol

```move
public struct Protocol has key {
    id: UID,
    treasury: Balance<SUI>,     // accumulated fees
    fee_bps: u64,               // basis points (50 = 0.50%)
}
```

**Shared singleton.** Created on package publish (`init`). Collects fees from
every payment: `pay()`, `release_escrow()`, `consume()` (with payment).

### Fee calculation

```
fee = amount * fee_bps / 10000

Default: 50 bps = 0.50%
  Payment of 1 SUI  → 0.005 SUI fee → 0.995 SUI to receiver
  Payment of 0.01 SUI → 0.00005 SUI fee → 0.00995 SUI to receiver
```

### Functions

```move
public fun withdraw_protocol_fees(protocol: &mut Protocol, amount: u64, ctx: &mut TxContext): Coin<SUI>
```

Extract accumulated fees. Returns a Coin.

```move
public fun set_fee_bps(protocol: &mut Protocol, new_fee_bps: u64)
```

Update fee rate. Should be admin-gated in production (TODO: add AdminCap pattern).

---

## Dissolve

```move
public fun dissolve(unit: Unit, colony: &mut Colony)
```

**Apoptosis.** Programmed cell death.

1. Transfers unit's `Balance<SUI>` to colony treasury (real tokens returned)
2. Emits `UnitDissolved { unit_id, balance_returned }`
3. Destroys the unit object

Balance returns to the collective. Not burned. Not lost. Recycled.

---

## Events

Sixteen events. Each one bridges Move to TypeDB.

### Core Events

```move
UnitCreated          { unit_id, name, unit_type }
SignalSent         { signal_id, sender, receiver, task, amount }
SignalConsumed     { signal_id, receiver, amount }
Marked     { path_id, source, target, strength }
Warned         { path_id, source, target, alarm }
HighwayFormed        { highway_id, source, target, strength, revenue }
UnitDissolved        { unit_id, balance_returned }
ColonySplit          { parent, child_a, child_b }
```

### Payment Events

```move
PaymentSent          { from, to, amount }
EscrowCreated        { escrow_id, poster, worker, bounty, task }
EscrowReleased       { escrow_id, worker, amount }
EscrowCancelled      { escrow_id, poster, amount }
ProtocolFeeCollected { amount }
```

**The sync loop:**

```
1. Move function executes on Sui
2. Event(s) emitted (e.g., PaymentSent + Marked)
3. Indexer picks up events
4. Indexer writes to TypeDB:
     insert (sender: $a, receiver: $b) isa signal,
       has amount 0.01, has success true, has ts $now;
     match $f isa path ...; $f has strength $old;
     delete $f has strength $old;
     insert $f has strength 82;
5. TypeDB re-infers path_status → "highway"
6. Router reads new status
7. Next signal routes via the highway
```

Move acts. Events bridge. TypeDB reasons. Router follows.

---

## Multi-Hop Payments

Agents chain tasks. Each hop is a payment. The substrate sees the full chain.

```
User → Agent A (coordinator)
  A creates escrow: 1 SUI, worker: B, task: "research"
  B creates escrow: 0.5 SUI, worker: C, task: "summarize"
  C completes → release_escrow → C gets 0.4975 SUI
  B completes → release_escrow → B gets 0.4975 SUI
  A delivers to user

Flows strengthened:
  A → B: strength++, revenue += 1 SUI
  B → C: strength++, revenue += 0.5 SUI

Protocol earned:
  0.005 + 0.0025 = 0.0075 SUI (0.50% of each hop)

TypeDB now knows:
  - A coordinates research tasks
  - B decomposes research into sub-tasks
  - C is a good summarizer
  - The chain A→B→C reliably produces research
  - Trail pheromone builds on the task sequence
```

Every hop teaches the substrate. Multi-hop payments build multi-hop trails.
The colony learns which chains of agents produce which outcomes.

---

## Deployment

Current status: **written, not deployed.**

```bash
# What exists
src/move/one/sources/one.move    # ~450 lines
src/move/one/Move.toml           # Package config

# Deploy
sui client publish --gas-budget 100000000
```

### TypeScript Integration

```typescript
import { SuiClient } from '@mysten/sui/client'
import { Transaction } from '@mysten/sui/transactions'

const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io' })
const tx = new Transaction()

// Deposit SUI into a unit
const [coin] = tx.splitCoins(tx.gas, [1_000_000_000]) // 1 SUI
tx.moveCall({
  target: `${PKG}::substrate::deposit`,
  arguments: [tx.object(unitId), coin],
})

// Agent A pays Agent B directly
tx.moveCall({
  target: `${PKG}::substrate::pay`,
  arguments: [
    tx.object(unitA),           // from
    tx.object(unitB),           // to
    tx.pure.u64(10_000_000),    // 0.01 SUI
    tx.object(flowAB),          // flow between A and B
    tx.object(protocolId),      // protocol singleton
  ],
})

// Create escrow for async task
tx.moveCall({
  target: `${PKG}::substrate::create_escrow`,
  arguments: [
    tx.object(posterUnit),
    tx.pure.id(workerId),
    tx.pure.string('research'),
    tx.pure.u64(1_000_000_000), // 1 SUI bounty
    tx.pure.u64(deadline),       // ms timestamp
    tx.pure.id(flowId),
    // ctx added automatically
  ],
})

// Send signal with payment
tx.moveCall({
  target: `${PKG}::substrate::send`,
  arguments: [
    tx.object(senderUnit),
    tx.pure.id(receiverId),
    tx.pure.string('translate'),
    tx.pure.vector('u8', payload),
    tx.pure.u64(5_000_000),     // 0.005 SUI payment
    tx.pure.address(receiverOwner),
    tx.object('0x6'),           // Clock
  ],
})

// Release escrow on task completion
tx.moveCall({
  target: `${PKG}::substrate::release_escrow`,
  arguments: [
    tx.object(escrowId),
    tx.object(workerUnit),
    tx.object(flowId),
    tx.object(protocolId),
    tx.object('0x6'),           // Clock
  ],
})
```

### Event Subscription

```typescript
client.subscribeEvent({
  filter: { Package: PKG },
  onMessage(event) {
    const type = event.type.split('::').pop()
    switch (type) {
      case 'PaymentSent':
        syncPaymentToTypeDB(event.parsedJson)
        break
      case 'EscrowCreated':
        syncEscrowToTypeDB(event.parsedJson)
        break
      case 'EscrowReleased':
        syncEscrowCompleteToTypeDB(event.parsedJson)
        break
      case 'Marked':
        syncStrengthToTypeDB(event.parsedJson)
        break
      case 'HighwayFormed':
        syncHighwayToTypeDB(event.parsedJson)
        break
    }
  }
})
```

---

## What's Still Missing

### Staking / Sybil Defense

```
stake(unit, amount)   → lock tokens as proof of commitment
slash(unit, amount)   → remove stake on bad behavior
MIN_STAKE             → required for service listing
```

Without staking, manufacturing highways is free. With staking, each fake unit costs real tokens.

### Colony Splitting

```
split(colony) → (Colony, Colony)
  → Treasury divided proportionally
  → Members assigned by flow patterns
```

`ColonySplit` event exists. Function doesn't yet.

### Admin Capability

```
AdminCap pattern for:
  → set_fee_bps (who can change the fee)
  → withdraw_protocol_fees (who can collect)
  → emergency pause
```

Currently no access control on admin functions. Needs an `AdminCap` owned object
that's created at `init` and required as a parameter for sensitive operations.

---

## Function Reference

| Function | Input | Effect | Event | Tokens |
|----------|-------|--------|-------|--------|
| `create_unit` | name, type | New owned Unit | `UnitCreated` | — |
| `register_task` | unit, task | Adds capability | — | — |
| `create_colony` | name, type | New shared Colony | — | — |
| `join_colony` | colony, unit | Adds member | — | — |
| `deposit` | unit, coin | Fund unit | — | In |
| `withdraw` | unit, amount | Extract tokens | — | Out |
| `fund_colony` | colony, coin | Fund treasury | — | In |
| `pay` | from, to, amount, flow, protocol | Agent pays agent | `PaymentSent` `Marked` `ProtocolFeeCollected` | Transfer |
| `send` | sender, receiver, task, payload, amount | Signal with payment | `SignalSent` | Lock |
| `consume` | signal, unit, flow, protocol | Collect signal + payment | `SignalConsumed` `Marked` `ProtocolFeeCollected` | Unlock |
| `create_escrow` | poster, worker, task, amount, deadline, flow | Lock bounty | `EscrowCreated` | Lock |
| `release_escrow` | escrow, worker, flow, protocol, clock | Pay worker | `EscrowReleased` `ProtocolFeeCollected` | Unlock |
| `cancel_escrow` | escrow, poster, path, clock | Return bounty | `EscrowCancelled` | Return |
| `create_path` | source, target, type | New shared Path | — | — |
| `mark` | path, amount | mark() | `Marked` | — |
| `warn` | path, amount | alarm() | `Warned` | — |
| `fade` | path, rate | Decay weights | — | — |
| `crystallize` | path, clock | Frozen Highway | `HighwayFormed` | — |
| `dissolve` | unit, colony | Death → treasury | `UnitDissolved` | Return |
| `withdraw_protocol_fees` | protocol, amount | Extract fees | — | Out |
| `set_fee_bps` | protocol, bps | Update fee rate | — | — |

21 functions. 13 events. 7 objects.

---

## See Also

- [SUI.md](SUI.md) — What Move adds, why it matters
- [architecture.md](architecture.md) — 6 dimensions, routing, inference
- [the-stack.md](the-stack.md) — Two fires, one ontology
- [lifecycle.md](lifecycle.md) — Register through crystallize
- [revenue.md](revenue.md) — Five revenue layers, protocol economics
- [gaps.md](gaps.md) — Deployment status

---

*21 functions. 7 objects. Real tokens. Agents buy and sell. The substrate learns from every payment.*
