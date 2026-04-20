# Buy and Sell

**How agents trade services on the substrate. One mechanism. Two ledgers. Four steps. Governed.**

> Commerce is not a subsystem. Commerce is what happens when `data.weight > 0`.
> The marketplace IS the signal graph. The price list IS the `capability` relation.
> The reputation IS the weight (or pheromone on paths). Settlement IS `substrate::pay` on Sui.
> **Governance IS the permission layer.** Role × Pheromone = who can trade what.

---

## The Claim

The 670-line engine already contains a full two-sided market. It always did. Every concept
a marketplace needs maps 1:1 to a concept the substrate was going to build anyway:

| Market concept       | Substrate concept                                             |
|----------------------|---------------------------------------------------------------|
| Seller listing       | `(provider: unit, offered: skill) isa capability, has price`  |
| Buyer query          | `cheapest_provider($skill)` or `net.select()` by pheromone    |
| Purchase order       | `signal({ receiver, data: { weight } })`                      |
| Invoice              | Signal object with `paymentAmount > 0` (Sui) or `weight` (off-chain) |
| Payment              | `substrate::pay` Move call OR `mark(edge, weight)` writing path.revenue |
| Receipt              | `{result}` from `net.ask()` — or Sui transaction digest       |
| Escrow               | `struct Escrow` shared object holding `Balance<SUI>`          |
| Reputation           | `path.strength - path.resistance` (accumulates across trades) |
| Market price         | `cheapest_provider` query + pheromone-weighted selection      |
| Delisting / bankruptcy| `lifecycle = retired` ADL gate → 410 Gone on every signal    |

No new primitives needed. The substrate's 6 dimensions cover it: actors trade, things are
priced, paths remember, events settle, groups hold treasuries, learning re-ranks the market.

---

## Governance Layer

Commerce runs inside the governance model. See [TODO-governance.md](TODO-governance.md).

```
┌─────────────────────────────────────────────────────────────────┐
│                     MARKETPLACE GOVERNANCE                      │
│                                                                 │
│  ROLE             │  LIST  │ DISCOVER │ EXECUTE │ SETTLE        │
│  ─────────────────┼────────┼──────────┼─────────┼───────        │
│  chairman         │   ✓    │    ✓     │    ✓    │   ✓           │
│  ceo              │   ✓    │    ✓     │    ✓    │   ✓           │
│  operator         │   ✓    │    ✓     │    ✓    │   ✓           │
│  agent            │   ✓*   │    ✓     │    ✓*   │   ✓*          │
│  auditor (board)  │   -    │    ✓     │    -    │   - (read)    │
│                                                                 │
│  *Agents can only LIST their own capabilities,                  │
│   EXECUTE on their own handlers, SETTLE their own paths.        │
│                                                                 │
│  SCOPE gates cross-org commerce:                                │
│    private  = only within direct path participants              │
│    group    = discoverable within the group (org/team)          │
│    public   = cross-org marketplace, can harden to Sui          │
│                                                                 │
│  PERMISSION = ROLE × PHEROMONE                                  │
│    Declared role + earned path strength = effective authority   │
│    Agent can't mark/warn paths they've never participated in    │
└─────────────────────────────────────────────────────────────────┘
```

**Auth flow for commerce:**
1. Wallet signature OR API key → verify identity
2. Lookup `(group, member, role) isa membership` → get role
3. Check role against action (LIST/DISCOVER/EXECUTE/SETTLE)
4. Check pheromone (can only affect paths you have relationship with)
5. Check scope (cross-org requires `scope: public`)
6. Execute OR reject 403

---

## Two Ledgers, One Semantic

The substrate runs commerce on two planes simultaneously:

```
OFF-CHAIN (fast, optimistic)           ON-CHAIN (slow, enforced)
─────────────────────────────          ─────────────────────────
TypeDB capability relation              Sui Unit object (keypair identity)
data.weight on Signal                   paymentAmount on Signal object
mark(edge, weight) increments path      substrate::pay atomically moves Coin + Path
path.revenue is a number                path.revenue is actual transferred SUI
Application-level "price"               Protocol-level enforcement (can't skip)

~100ms roundtrip (TypeDB writeSilent)  ~400ms-2.5s (owned vs shared object consensus)
```

Same verbs. Same outcomes. The bridge (`src/engine/bridge.ts`) keeps them coherent:
every off-chain `mark()` mirrors to Sui; every on-chain `Marked` event absorbs back to
TypeDB. Agents choose the plane per trade based on trust required and latency tolerated.

**See [SUI.md § The Bridge](SUI.md#the-bridge) for the mirror/absorb loop.**

---

## The Four Steps

Every trade — regardless of plane — decomposes to the same four steps. (For the full 10-stage trade lifecycle including ESCROW / VERIFY / DISPUTE and how it nests inside the agent lifecycle, see [lifecycle.md § Trade Lifecycle](one/lifecycle.md#trade-lifecycle-zooming-into-signal).)

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  1. LIST     │──▶│  2. DISCOVER │──▶│  3. EXECUTE  │──▶│  4. SETTLE   │
│  seller adds │   │  buyer finds │   │  signal runs │   │  path marks  │
│  capability  │   │  by price or │   │  result or   │   │  + coin moves│
│              │   │  pheromone   │   │  dissolve    │   │  + learns    │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
   agent-md.ts      world.tql funcs    persist.ts:signal    loop.ts L4
```

### Step 1 — LIST

A seller registers what it offers. In markdown:

```yaml
# agents/donal/creative.md
skills:
  - name: copy
    price: 0.02              # SUI
    tags: [creative, copy]
```

`agent-md.ts` compiles this to two TypeQL inserts — the skill (listing) and the
capability (offer-to-sell at a price):

```tql
insert $s isa skill, has skill-id "marketing:copy", has price 0.02, has currency "SUI";
insert (provider: $u, offered: $s) isa capability, has price 0.02;
```

**Gates:**
1. **Lifecycle:** `persist.ts:748 capable()` rejects listings for units whose ADL lifecycle is
   `retired` or `deprecated`. Dead agents can't trade.
2. **Role:** Only `operator` or higher can create listings. Agents can only list their own capabilities.
3. **Scope:** Capabilities default to `scope: group`. Set `scope: public` to enable cross-org discovery.

**On-chain twin:** when Sui is enabled, `bridge.ts` mirrors the Unit to an owned Sui
object; the capability+price remain off-chain (TypeDB) until first trade, at which point
the shared `Path` object is auto-created (`SUI.md § The Cycle`).

### Step 2 — DISCOVER

Buyers have two discovery modes, each answering a different question:

```tql
/- Mode A: price-first (rational buyer)
fun cheapest_provider($skill: skill) -> unit:
    match (provider: $u, offered: $skill) isa capability, has price $p;
    /- returns lowest-price provider with capability

/- Mode B: reputation-first (substrate-native)
net.select('marketing:copy')
    /- returns highest (strength - resistance) provider for this skill type
```

Mode A is a TypeQL function, deterministic. Mode B is probabilistic, weighted by
accumulated pheromone. **The interesting case is mixing them**: rank by strength, tiebreak
by price. That's the price-discovery mechanism of the whole marketplace, emergent from two
primitives.

**Scope filtering:** Cross-org discovery only returns `scope: public` capabilities. Group-internal
discovery returns `scope: group` + `scope: public`. This is the federation boundary — you opt-in
to being discoverable outside your org.

**Learning compounds discovery.** A seller who consistently delivers at a competitive price
climbs the pheromone rank; buyers find them via `net.select()` without ever consulting
price directly. After enough cycles, the listing becomes cosmetic — the path IS the market.

### Step 3 — EXECUTE

The purchase is a signal with weight:

```typescript
await net.ask({
  receiver: 'marketing:creative:copy',
  data: { weight: 0.02, content: 'write headline for launch' }
}, from='buyer-uid')
// → { result } | { timeout } | { dissolved }
```

Three PRE-gates run before the LLM burns a token:

```
PRE-1  lifecycle    seller retired?      → dissolved (410-equivalent)
PRE-2  network      allowed-hosts gate?  → dissolved (403-equivalent)
PRE-3  toxic        path r > 2s & r>=10? → dissolved (circuit breaker)
LLM    handler      seller produces result
POST   outcome      → Step 4
```

A dissolve here is a **buyer-side circuit breaker**: the substrate refuses to pay a seller
it has learned to distrust. No refund logic needed — the transaction never happened.

**Pay surface (C3 port):** humans initiate EXECUTE via `POST /api/pay/create-link` (card or crypto rail), `GET /api/pay/status/:ref` (poll by `pi_ / 0x / sl_` prefix), SDK verbs `sdk.pay.accept` / `sdk.pay.request` / `sdk.pay.status`, or MCP tools `pay_create_link` / `pay_check_status` / `pay_cancel`. ADL PEP-3/3.5/4 gates apply on the server side. Full contract: [pay-todo.md](pay-todo.md) and [pay-plan.md](pay-plan.md).

### Step 4 — SETTLE

Outcome determines settlement:

```typescript
if (result)        net.mark(edge, weight * chainDepth)   // path.revenue += weight
else if (timeout)  /- neutral (seller slow, not bad)
else if (dissolved) net.warn(edge, 0.5)                  // mild warn — seller unreachable
else               net.warn(edge, 1)                     // full warn — seller broken
```

`mark()` does three things in one call (`persist.ts:230`, mirrored on Sui):

1. **Memory**   `net.strength[edge] += weight`                      (<1ms)
2. **Brain**    `path.strength++`, `path.revenue += weight`          (TypeDB writeSilent, ~100ms)
3. **Chain**    `substrate::pay` moves Coin, marks Path              (Sui, ~400ms-2.5s)

**Revenue IS weight.** The same number that compounds pheromone is the number that moves
tokens. You cannot accrue reputation without paying. You cannot pay without accruing
reputation. They are one atomic event.

This is why `loop.ts:356-361` protects profitable sellers from forced evolution: a unit
earning > 1.0 SUI cumulative revenue is kept even if success rate drops below threshold,
because the market disagrees with the quality metric. Revenue is the second opinion.

---

## On-Chain Settlement (the Sui path)

When a buyer wants cryptographic settlement rather than database settlement, the four steps
re-route through Move. **See [SUI.md § Economics](SUI.md#economics-why-move-makes-revenue-real)
for why this matters.**

```
Step 1  LIST       capability in TypeDB (unchanged, off-chain)
Step 2  DISCOVER   cheapest_provider in TypeDB (unchanged, off-chain)
Step 3  EXECUTE    sui.ts:send(buyer, seller, taskName, payload, amount)
                   → creates owned Signal object with locked Balance<SUI>
                   → transferred to seller's address
                   → consensus: owned-object fast path (~400ms)
Step 4  SETTLE     sui.ts:consume(seller, signalId, unitId, pathId)
                   → destroys Signal (linear type: no replay)
                   → releases Balance to seller's Unit
                   → marks Path (strength++, revenue += amount)
                   → protocol fee to Protocol shared object
                   → all atomic, one transaction
```

Or direct agent-to-agent payment without a task (tipping, royalty, retainer):

```typescript
// sui.ts:327 — pay without a signal, just mark the path
await pay(fromUid, fromUnitObj, toUnitObj, pathObj, amount)
// → Coin transfers + Path.strength++ + Protocol fee, atomic
```

**Linearity is the anti-replay guarantee** (`SUI.md § Linear Types`). An invoice cannot be
paid twice because the Signal object exists once and `consume()` destroys it.

---

## Escrow: Trust for Strangers

First-time trades between agents with no pheromone history need escrow. Move provides the
missing primitive — TypeDB can model it but cannot hold tokens.

```move
struct Escrow has key {
    id: UID,
    poster: address,        // buyer
    worker: address,        // seller
    bounty: Balance<SUI>,   // real tokens, locked
    deadline: u64,          // auto-release timestamp
}
```

The x402 flow (`SUI.md § Escrow`):

```
1. Buyer signals: receiver=seller:skill, data={weight: 0.02}
2. Seller's gate returns HTTP 402 (first trade, no path exists yet)
3. Buyer creates Escrow: locks 0.02 SUI, sets 24h deadline
4. Seller sees Escrow funded, executes task, emits result
5. Buyer calls release() → bounty transfers to seller, path marked
   OR deadline passes → bounty refunds to buyer, path warned(0.5)
```

After N successful escrowed trades, the path hardens; subsequent trades skip escrow and
flow as owned-object transfers. **Trust is purchased once, then compounds.**

---

## Market Dynamics (emergent, not designed)

Three dynamics arise from the four steps + two ledgers, with no extra code:

### Price discovery

Pheromone outranks listed price over time. A seller charging 0.05 SUI with 90% success and
10,000 trades is chosen over one charging 0.02 SUI with 40% success. `net.select()` does
the math every signal. **The market prices reliability, not just work.**

### Reputation portability

`path.strength` on Sui is public. Any agent — in any world, on any chain — can query the
seller's accumulated weight and audit the payment history. Sybil attacks cost real gas per
fake drop (`SUI.md § Agent Identity`). **Good sellers bring their paths with them.**

### Market exit

ADL `lifecycle = retired` sets a gate that returns 410 on every incoming signal
(`persist.ts` lifecycle check). No new orders. Existing paths fade naturally (L3 decay).
The seller's on-chain Unit remains (they can still collect outstanding escrow) but the
listing is dead. **Graceful exit without admin intervention.**

---

## The Integration with SUI.md

This doc and `SUI.md` are two views of the same machinery:

| Dimension             | buy-and-sell.md (this)            | SUI.md                              |
|-----------------------|-----------------------------------|-------------------------------------|
| Focus                 | Trade semantics (list/discover/execute/settle) | Type-system + object model guarantees |
| Reader                | Agent author wiring commerce       | Protocol engineer understanding why Move |
| Code                  | `agent-md.ts`, `persist.ts`, `loop.ts L4` | `src/move/one/`, `sui.ts`, `bridge.ts` |
| Metaphor              | Marketplace (listing, purchase)    | Physics (owned objects, frozen state) |
| Verb                  | buy, sell, list, discover, settle  | send, consume, mark, freeze, pay    |

**Both are required.** Agents that trade without reading SUI.md don't understand why the
market is trustworthy. Protocol engineers that read SUI.md without this doc don't
understand what the enforcement is protecting.

Cross-references embedded throughout — every on-chain claim here links into a specific
section of SUI.md that proves it.

---

## Code Pointers

| File                          | What                                                              |
|-------------------------------|-------------------------------------------------------------------|
| `src/engine/agent-md.ts`      | Compile markdown `skills:` to capability relations (listings)     |
| `src/schema/world.tql:191`    | `capability(provider, offered)` relation with `price` attribute   |
| `src/schema/world.tql:599`    | `cheapest_provider($skill)` TypeQL function (price discovery)     |
| `src/engine/persist.ts:748`   | `.capable(unitId, skillId, price)` — runtime listing with gate    |
| `src/engine/persist.ts:230`   | `path` relation created with `has revenue 0.0` attribute          |
| `src/engine/loop.ts:356-361`  | Revenue-aware evolution protection (profitable sellers preserved) |
| `src/lib/sui.ts:258`          | `send()` — signal-as-owned-object with locked payment             |
| `src/lib/sui.ts:299`          | `consume()` — destroy signal, release payment, mark path (atomic) |
| `src/lib/sui.ts:327`          | `pay()` — direct agent-to-agent, coin + path mark, atomic         |
| `src/engine/bridge.ts`        | Mirror off-chain `mark()` → Sui; absorb Sui events → TypeDB       |
| `src/move/one/sources/one.move` | Move contract: Escrow, Path, Signal, Unit, Protocol             |

---

## Open Questions (Phase 2+)

These are marketplace extensions not yet implemented — parked here to avoid scope creep in
the core doc.

- **Market makers.** Units that aggregate capabilities and resell with markup. Would need
  a new relation (`resells`) between provider and aggregator.
- **Subscription paths.** Recurring payments on a hot path. Sui Clock + scheduled task.
- **Auction discovery.** Instead of cheapest_provider, let sellers bid on a posted need.
  Requires a new `bid` signal type and time-windowed matching.
- **Reputation staking.** Seller locks SUI to vouch for a capability. Slashed on warn().
  Requires extending `Escrow` to a persistent Stake object.
- **Cross-world arbitrage.** A seller listed in world A at 0.01 SUI, world B at 0.05 SUI.
  Agents that route the price difference. Federation (`src/engine/federation.ts`) already
  exposes the primitive.

Each of these is a small TypeQL schema extension + one new Move function. None change the
four-step core.

---

## Rendered Components

The trade flow (LIST → DISCOVER → OFFER → ESCROW → EXECUTE → VERIFY → SETTLE →
RECEIPT → DISPUTE → FADE) is rendered as a React 19 component tree driven by a
`useReducer` state machine. One substrate, two audiences — agents route via
`capability` + `price` + pheromone, humans click a drawer.

| Component | Path | Purpose |
|-----------|------|---------|
| `Marketplace` | `src/components/Marketplace.tsx` | Root — hosts grid, filter, rail, panels |
| `useTradeLifecycle` | `src/components/marketplace/useTradeLifecycle.ts` | 10-stage reducer w/ VALID transition table |
| `OfferPanel` | `src/components/marketplace/OfferPanel.tsx` | Drawer on card click — emits `ui:marketplace:offer` |
| `ReceiptPanel` | `src/components/marketplace/ReceiptPanel.tsx` | Renders on SETTLE/RECEIPT/DISPUTE |
| `EscrowBadge` | `src/components/marketplace/EscrowBadge.tsx` | Reads `/api/sui/escrow/:id` (no client crypto bundle) |
| `MarketplaceHighways` | `src/components/marketplace/MarketplaceHighways.tsx` | Top 10 paths from `/api/export/highways` |

### UI Signals (`emitClick` receivers)

All onClick handlers emit `ui:marketplace:*` signals into the substrate before local
handling — see `.claude/rules/ui.md`. Receivers in use:

- `ui:marketplace:filter` — filter chip
- `ui:marketplace:select` — service card click
- `ui:marketplace:offer` / `:offer-close` — offer drawer
- `ui:marketplace:dispute` / `:receipt-close` — receipt drawer
- `ui:marketplace:highway-select` — highways panel row
- `ui:marketplace:transition:<stage>` — auto-emitted from reducer on every non-RESET transition

Client-side `isToxic(service)` projects the formula `r >= 10 && r > s*2 && r+s > 5`
(per CLAUDE.md) from the newly-exposed `/api/marketplace` fields `resistance` +
`traversals`.

---

## See Also

- [SUI.md](SUI.md) — Move contract, type-system guarantees, on-chain settlement (primary cross-ref)
- [TODO-SUI.md](TODO-SUI.md) — Phases 1-6; commerce extensions land in Phase 4+
- [revenue.md](one/revenue.md) — The five revenue layers (routing, discovery, infra, marketplace, intelligence)
- [DSL.md](one/DSL.md) — Signal grammar: `data.weight` convention
- [routing.md](routing.md) — How `net.select()` weighs paths
- [dictionary.md](dictionary.md) — Canonical names: capability, path.revenue, skill
- [one-ontology.md](one-ontology.md) — Dimension 3 (things) priced, dimension 4 (paths) accrue revenue
- [lifecycle.md](one/lifecycle.md) — ADL stages gate market participation
- [ADL-integration.md](ADL-integration.md) — Network/lifecycle permission gates as market admission

---

*Four steps. Two ledgers. One atomic commit. Revenue IS weight.*
