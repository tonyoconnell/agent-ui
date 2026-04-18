---
title: "Chain Integration — Read-only Bridges → Sui-native Commerce → Cross-chain (deferred)"
type: roadmap
version: 2.0.0
priority: Wire → Sell → Learn (only when data says so)
total_tasks: 11
completed: 0
status: ACTIVE
---

# TODO: Chain Integration

> **Time units:** tasks → waves → cycles. Never days, hours, weeks.
>
> **Strategy shift (v2.0.0):** [chains.md](chains.md) remains the architecture.
> This TODO no longer mirrors it 1:1. Ship revenue-capable commerce on Sui first,
> then let marketplace data decide whether multi-chain is worth the engineering.
>
> **Goal:** Read-only bridge units unblock the wallet dashboard (C1).
> Sui-native `/pay/:skillId` unblocks L4 Marketplace revenue (C2).
> Cross-chain, $ONE token, DEX routing (C3) is frozen until pheromone shows demand.
>
> **Source of truth:** [chains.md § Execution vs Architecture](chains.md#execution-vs-architecture) — read this first,
> [one-protocol.md](one-protocol.md) — private intelligence, public results,
> [buy-and-sell.md](buy-and-sell.md) — LIST→DISCOVER→EXECUTE→SETTLE,
> [revenue.md](revenue.md) — L4 Marketplace is the near-term revenue line,
> [DSL.md](DSL.md) — signal grammar,
> [dictionary.md](dictionary.md) — canonical names
>
> **Depends on:** [TODO-migrate-u.md](TODO-migrate-u.md) Cycle 3 (wallet dashboard),
> [TODO-SUI.md](TODO-SUI.md) Phase 2 (wallet + escrow + capability contract on testnet).
>
> **Shape:** 2 active cycles (WIRE, SELL) + 1 conditional cycle (LEARN, pheromone-gated).

---

## Why the strategy changed (v1 → v2)

| Old plan (v1, 3 cycles back-to-back) | New plan (v2, 2 active + 1 conditional) | Reason |
|---|---|---|
| Phases 1-6 executed sequentially | C1 Phase 1; C2 Sui-native commerce; C3 frozen | Build for traffic that exists, not traffic you hope for |
| $ONE token as settlement currency | USDC-on-Sui settles; $ONE deferred | Decouple three products (settlement + governance + staking) — bundling them at launch is high risk |
| Cross-chain bridges as Cycle 3 priority | Cross-chain triggered by data (>10% non-Sui buyers OR ≥1k Sui trades) | L5 Intelligence (learned routes) needs L4 Marketplace training data |
| `bridge:sui` unit for discovery symmetry | Drop — Sui is home, not a bridge | [chains.md L39](chains.md) doctrine: Sui is where the protocol lives |

L4 Marketplace (2% of trades) produces revenue first. L5 Intelligence sells that revenue's exhaust back to payment companies. Reverse the order and you build a world-class router with no traffic through it.

---

## Routing

```
signal DOWN                              result UP
──────────                               ─────────
/do TODO-chains.md                       mark(hop, amount × depth)
     │                                        ▲
     ▼                                        │
┌─ Cycle 1: WIRE ────────┐                ┌───┴──────────┐
│ bridge units (read-only)│──► balance ──►│ substrate    │
│ + wallet dashboard data │    history    │ sees chains  │
│ NO bridge:sui (home)    │    price      │              │
└─────────┬──────────────-┘                └──────────────┘
          │
┌─ Cycle 2: SELL ────────┐                ┌──────────────┐
│ /pay/:skillId page      │──► USDC ────►│ commerce on   │
│ Sui-only, USDC settle   │    escrow    │ Sui works.    │
│ Platform takes 2%       │              │ L4 earns.     │
│ No $ONE. No DEX. No CC. │              │ Pheromone marks│
└─────────┬──────────────-┘                └───────┬──────┘
          │                                        │
          ▼                                        ▼
┌─ Cycle 3: LEARN ───────┐    gate ←── data ────┐
│ DEFERRED                │                      │
│ Re-opens when pheromone │ ≥10% non-Sui buyers  │
│ says non-Sui demand     │   OR                 │
│ is real                 │ ≥1,000 Sui trades    │
└─────────────────────────┘                      │
```

---

## Cycle 1: WIRE — Bridge Units (read-only)

**chains.md Phase 1 only.** Wrap chain RPCs as substrate units.
The substrate sees multi-chain data. No sends, no swaps — just balance, history, price.

### Cycle 1 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit | Skill |
|---|-------------|------|-------------------------------|------|-------|
| 1 | `src/engine/bridges.ts` | Bridge unit factory — `chainConfig → wired unit` with balance/history/price handlers | 0.40/0.20/0.30/0.10 | `net.ask({ receiver: 'bridge:evm:balance' })` returns ETH balance | `chains:bridge-factory` |
| 2 | `bridge:evm` unit | EVM bridge (ETH, Base, Arb, Polygon) with balance + history + price | 0.35/0.20/0.35/0.10 | Balance query returns real RPC data | `chains:bridge-evm` |
| 3 | `bridge:sol` unit | Solana bridge with balance + history + price | 0.35/0.20/0.35/0.10 | Balance query returns real Solana RPC data | `chains:bridge-sol` |
| 4 | `bridge:btc` unit | Bitcoin bridge with balance + history | 0.35/0.20/0.35/0.10 | Balance query returns Blockstream data | `chains:bridge-btc` |
| 5 | Token skills in TypeDB | `sui:one`, `sui:usdc`, `eth:eth`, `eth:usdc`, `sol:sol`, `btc:btc` | 0.30/0.20/0.40/0.10 | `discover({ tags: ['token', 'eth'] })` returns ETH + USDC | `chains:token-skills` |
| 6 | API routes | `/api/chain/balance`, `/api/chain/history`, `/api/chain/price` | 0.35/0.25/0.30/0.10 | `curl /api/chain/balance?chain=eth&address=0x...` returns balance | `chains:api` |

**NOT in scope:** `bridge:sui` (Sui is home — `sui.ts` used directly; `sui:*` skills resolve to native handlers). `$ONE` token (deferred to C3). Send/swap handlers (deferred to C3).

### Wave 1 — Recon (Haiku x 6, parallel)

| Agent | File | What to look for |
|-------|------|-----------------|
| R1 | `src/components/u/lib/BlockchainService.ts` | All exports, chain configs, RPC endpoints, return types |
| R2 | `src/engine/api.ts` | `apiUnit()` pattern — HTTP endpoints as units |
| R3 | `src/engine/world.ts` | `unit().on()` registration, four outcomes |
| R4 | `src/lib/sui.ts` | Existing Sui balance/TX methods — what already works |
| R5 | `src/engine/apis/index.ts` | Pre-built API units — pattern to follow |
| R6 | `src/schema/one.tql` | Skill/capability schema — where token skills fit |

### Wave 2 — Decide (Opus x 1)

Key decisions:
1. **Bridge factory vs per-chain files:** Factory. `BlockchainService.ts` already has `CHAINS` config. Loop over it.
2. **`BlockchainService.ts` location:** Move from `src/components/u/lib/` to `src/lib/chains.ts` — it's infrastructure, not UI.
3. **Drop `bridge:sui`:** chains.md L39 says "Sui is home, not a bridge." `sui:*` skills exist but are native, not proxied. This is a deliberate asymmetry.
4. **Token skill seeding:** Auto-register in `boot.ts` by looping `CHAINS` config. Stablecoins (USDC) added as separate skills with shared `stablecoin` tag for cross-chain discovery.
5. **Price caching:** Keep `BlockchainService.ts` CoinGecko cache (60s TTL) — handler-level, not substrate-level.
6. **Vitest coverage:** Every bridge unit has a unit test asserting `ask({ receiver: 'bridge:X:balance' })` returns schema-valid data. RPC mocked via MSW or stubbed fetch.

### Wave 3 — Edits (Sonnet x 5, parallel)

| Job | File(s) | Est. edits |
|-----|---------|-----------|
| E1 | Move `BlockchainService.ts` → `src/lib/chains.ts`, update imports | 1 move + ~3 import updates |
| E2 | Create `src/engine/bridges.ts` — factory with balance/history/price handlers | 1 new file (~80 lines) |
| E3 | Register bridge units in `boot.ts` — loop CHAINS, add units, seed token skills | ~3 edits |
| E4 | Create API routes `/api/chain/balance.ts`, `/api/chain/history.ts`, `/api/chain/price.ts` | 3 new files |
| E5 | Create `test/engine/bridges.test.ts` — unit tests per bridge with mocked RPC | 1 new test file |

### Wave 4 — Verify (Sonnet x 2, parallel)

| Shard | Owns | Checks |
|-------|------|--------|
| V1 | Bridge correctness | `net.ask()` returns real data for each bridge; vitest passes |
| V2 | Build + TypeDB | `bun run build` green, token skills queryable, API routes return real data |

### Cycle 1 Gate

```bash
bun vitest run                                             # bridges.test.ts green, no regressions
bun run build                                              # succeeds, bundle < 10 MiB
grep -r "bridge:evm\|bridge:sol\|bridge:btc" src/engine/   # bridge units registered
curl localhost:4321/api/chain/balance?chain=eth&address=0x  # returns balance
```

- [ ] `bridge:evm`, `bridge:sol`, `bridge:btc` registered as units (no `bridge:sui`)
- [ ] Balance/history/price queries return real blockchain data
- [ ] Token skills in TypeDB (`sui:one`, `sui:usdc`, `eth:eth`, `eth:usdc`, `sol:sol`, `btc:btc`)
- [ ] API routes work
- [ ] Unit tests green (`bun vitest run test/engine/bridges.test.ts`)
- [ ] `bun run build` green
- [ ] No regressions (`bun vitest run`)

---

## Cycle 2: SELL — `/pay/:skillId` on Sui with USDC Settlement

**Commerce, not plumbing.** Single chain. Single stablecoin. Revenue-capable.
Unlocks L4 Marketplace — the revenue line that funds everything else.

**Depends on:** Cycle 1 complete (wallet dashboard sees balances).
**Parallel dep:** [TODO-SUI.md](TODO-SUI.md) escrow + capability contract live on testnet.

### Why Sui-only, USDC-only, no $ONE

- **Sui-only:** [chains.md L39](chains.md) — "Sui is home, not a bridge." Build commerce at home first.
- **USDC-only:** Already liquid on Sui. Sellers price in USD, pay in USD-equivalent. No oracle, no slippage, no DEX dependency.
- **No $ONE:** A protocol token bundles three products (settlement, governance, staking). Ship settlement on USDC. Introduce $ONE later when there's a governance reason (DAO, fee share, stake-for-priority routing). Launching $ONE now couples payment volume to token launch risk.

### Cycle 2 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit | Skill |
|---|-------------|------|-------------------------------|------|-------|
| 1 | `src/engine/pay.ts` | `pay` unit v1 — Sui-only routing: buyer USDC → escrow → seller USDC, platform takes 2% | 0.45/0.15/0.30/0.10 | `ask({ receiver: 'pay', data: { skill, buyer, amount } })` executes on testnet | `chains:pay-unit-v1` |
| 2 | `/pay/[skillId].astro` | Public commerce page — SSR shell, product info, wallet connect island | 0.35/0.25/0.25/0.15 | Visit `/pay/alice:cat-photo` → renders, no 500s | `chains:pay-page-sui` |
| 3 | `PayPage.tsx` island | React 19 component — wallet state, amount formatting, single-hop route preview, confirm button with `emitClick` | 0.30/0.30/0.25/0.15 | Component hydrates, handles connect/pay/confirm states | `chains:pay-page-ui` |
| 4 | Platform fee hook | On escrow `claim`, 2% of amount routes to treasury unit's Sui address | 0.40/0.15/0.40/0.05 | Treasury balance increases by 2% on every settlement | `chains:treasury-fee` |
| 5 | End-to-end test | Buyer pays → escrow holds → seller claims → treasury gets cut → all hops marked | 0.40/0.10/0.45/0.05 | `scripts/test-pay-sui.ts` passes on Sui testnet | `chains:e2e-sui` |

### Wave 1 — Recon (Haiku x 5, parallel)

| Agent | File | What to look for |
|-------|------|-----------------|
| R1 | `src/lib/sui.ts` | `signAndExecute()`, `pay()`, existing escrow methods |
| R2 | `src/move/one/sources/one.move` | Escrow + capability objects — how commerce is contracted |
| R3 | `src/components/u/pages/SendPage.tsx` | Send UI patterns — reusable pieces for `/pay` |
| R4 | `src/pages/speed.astro` | Astro page pattern — reference for `/pay/[skillId].astro` |
| R5 | `docs/buy-and-sell.md` § EXECUTE/SETTLE | Current commerce flow — what `pay` must honor |

### Wave 2 — Decide (Opus x 1)

Key decisions:
1. **Route logic in pay.ts v1:** Hard-coded single hop `buyer:sui → escrow → seller:sui`. No `select()`, no tags-based routing yet. Pheromone still marks the hop for future C3 analytics.
2. **Wallet adapter:** `@mysten/wallet-kit` (official). Already a dep from `/u` migration.
3. **Fee collection:** Treasury is a substrate unit with a Sui address. Escrow contract's `claim` transfers 2% directly — no separate fee TX.
4. **Four outcomes mapping:** Insufficient balance → `{ dissolved: true }` + warn(0.5). Wallet rejects → no result + warn(1). RPC timeout → `{ timeout: true }` + neutral. Confirmed TX → `{ result }` + mark(amount × depth).
5. **Price display:** Sellers set USD in `agents/*.md`. USDC 1:1, so USD→USDC is identity on Sui. No oracle for Cycle 2.
6. **Revenue signal:** On every successful `pay:result`, fire `commerce:settle` to `/api/signal` — this is how L4 Marketplace gets wired and how C3 trigger data accumulates.

### Wave 3 — Edits (Sonnet x 4, parallel)

| Job | File(s) | Est. edits |
|-----|---------|-----------|
| E1 | Create `src/engine/pay.ts` — `pay` unit v1 with Sui-only routing | 1 new file (~120 lines) |
| E2 | Create `src/pages/pay/[skillId].astro` — SSR shell + `PayPage` island | 1 new file |
| E3 | Create `src/components/pay/PayPage.tsx` — React 19 commerce UI with @mysten/wallet-kit | 1 new file (~200 lines) |
| E4 | Create `scripts/test-pay-sui.ts` — e2e testnet payment | 1 new file |

### Wave 4 — Verify (Sonnet x 3, parallel)

| Shard | Owns | Checks |
|-------|------|--------|
| V1 | Pay unit correctness | All 4 outcomes wired; treasury receives 2%; buyer marked on success, warned on failure |
| V2 | Page + UI | `/pay/:skillId` renders, wallet connects, flow works end-to-end on testnet; bundle < 10 MiB |
| V3 | Revenue signal | `commerce:settle` fires on every successful pay; `/api/signal` log confirms (L4 Marketplace armed, C3 trigger data flowing) |

### Cycle 2 Gate

```bash
bun run build                                   # green, bundle < 10 MiB
bun vitest run                                  # no regressions
bun run scripts/test-pay-sui.ts                 # e2e passes on Sui testnet
curl localhost:4321/pay/alice:cat-photo         # renders, no 500s
curl "localhost:4321/api/signal?type=commerce:settle&since=1h"  # returns fresh signals
```

- [ ] `pay` unit v1 routes Sui-native USDC payments through escrow
- [ ] `/pay/:skillId` page renders, wallet connects, payment flows end-to-end on Sui testnet
- [ ] Platform takes 2% to treasury unit on every settlement
- [ ] All hops (buyer → pay → seller, pay → treasury) marked in substrate
- [ ] `commerce:settle` signals fire (L4 revenue armed, C3 trigger data flowing)
- [ ] Bundle < 10 MiB

---

## Cycle 3: LEARN — DEFERRED (conditional, pheromone-gated)

**chains.md Phases 2-6.** Send handlers, DEX routing, $ONE token, cross-chain bridges,
learned route selection.

**Status:** FROZEN. Do not execute until trigger fires.

### Trigger signals

Either of these unlocks Cycle 3:

| Signal | Meaning | Source |
|--------|---------|--------|
| ≥10% of `/pay` attempts from non-Sui source wallets | Non-Sui demand is real | `/api/signal` filter: `commerce:attempt` where `source_chain != sui` |
| ≥1,000 completed Sui-native payments | L4 has volume → L5 has training data | `commerce:settle` count from signal log |
| Governance/staking use case lands | $ONE has a non-payment reason to exist (DAO, fee share, stake-for-priority) | Product decision, not metric |

Until one fires, C3 scope stays frozen. Monitor via `/see events --tag commerce:attempt` weekly.

### What gets built (when triggered)

Only after a trigger:

- EVM/SOL send handlers (`bridge:evm:send`, `bridge:sol:send`) — viem + @solana/web3.js
- DEX units as `apiUnit()` wrappers (`dex:uniswap`, `dex:cetus`, `dex:jupiter`)
- $ONE token (`Coin<ONE>` Move module on Sui) — **only if governance use case crystallized**
- Cetus USDC/$ONE liquidity pool — only if $ONE deploys
- Cross-chain bridge units (`bridge:cctp`, `bridge:wormhole`) as competing units
- `pay.ts` v2 — `select('route:${from}:${to}', tags)` replaces hard-coded single hop
- Chain-specific keypair derivation — shared `SUI_SEED`, chain-specific KDF (secp256k1 for EVM, Ed25519 for SOL)

### Why deferred, not cancelled

The architecture in [chains.md](chains.md) is correct and the moat is real — pheromone-learned cross-chain routes as L5 Intelligence (see [revenue.md](revenue.md)). But training a router before L4 has volume is building infrastructure for traffic that doesn't exist yet. When data says demand is there, the scope above is ready to execute as a focused cycle with real route data from C2.

---

## Status

- [x] **Cycle 1: WIRE** — Bridge units (read-only: balance, history, price) ✓ 2026-04-18
  - [x] W1 — Recon (Haiku x 6)
  - [x] W2 — Decide (Opus x 1)
  - [x] W3 — Edits (Sonnet x 5)
  - [x] W4 — Verify (Sonnet x 2)
- [x] **Cycle 2: SELL** — `/pay/:skillId` on Sui with USDC settlement ✓ 2026-04-18
  - [x] W1 — Recon (Haiku x 5)
  - [x] W2 — Decide (Opus x 1)
  - [x] W3 — Edits (Sonnet x 4): pay.ts + [skillId].astro + PayPage.tsx + test-pay-sui.ts
  - [x] W4 — Verify (Sonnet x 3): tsc clean on new files, bridges.test 12/12 green, pay unit registered in boot.ts
- [ ] **Cycle 3: LEARN** — FROZEN (pheromone-gated)
  - [ ] Trigger monitor: weekly `/see events --tag commerce:attempt` and `commerce:settle` count

---

## Documentation Updates (W2)

**Docs modified per cycle:**
- `docs/chains.md` — "Execution vs Architecture" callout already in place; update per-chain status as C1 lands
- `docs/buy-and-sell.md` — add Sui-native USDC settlement example (C2)
- `docs/revenue.md` — wire L4 Marketplace signal `commerce:settle` (C2)
- `docs/lifecycle-one.md` — Stage 9-10 (sell/buy) become concrete on Sui (C2)
- `src/engine/CLAUDE.md` — add `bridges.ts`, `pay.ts` to file table
- `src/pages/CLAUDE.md` — add `/pay/:skillId` route

**Schema changes:**
- Token skills (C1): `sui:one`, `sui:usdc`, `eth:eth`, `eth:usdc`, `sol:sol`, `btc:btc`
- Bridge units (C1): `bridge:evm`, `bridge:sol`, `bridge:btc` in TypeDB (**NOT** `bridge:sui`)
- Treasury unit (C2): platform fee recipient, Sui address

---

## Execution

```bash
# Run the next wave
/do TODO-chains.md

# Check commerce state
/see highways --tag payment         # proven Sui payment paths
/see tasks --tag chains             # open chain tasks
/see events --tag commerce:settle   # settlement count for C3 trigger
/see events --tag commerce:attempt  # source-chain distribution for C3 trigger

# Manual testnet verification
bun run scripts/test-pay-sui.ts
```

---

## See Also

- [chains.md](chains.md) — architecture (this TODO is the execution schedule; they differ intentionally — see "Execution vs Architecture" at the top of chains.md)
- [one-protocol.md](one-protocol.md) — private intelligence, public results
- [TODO-migrate-u.md](TODO-migrate-u.md) — prerequisite: `/u` wallet dashboard
- [TODO-SUI.md](TODO-SUI.md) — prerequisite: escrow + capability contract live on testnet
- [PLAN-integrate-ONE.md](PLAN-integrate-ONE.md) — parent plan
- [buy-and-sell.md](buy-and-sell.md) — LIST→DISCOVER→EXECUTE→SETTLE
- [revenue.md](revenue.md) — L4 Marketplace is Cycle 2's target; L5 Intelligence unlocks with C3
- [sdk.md](sdk.md) — `one.hire()` settles USDC on Sui today
- [DSL.md](DSL.md) — signal grammar
- [dictionary.md](dictionary.md) — canonical names

---

*Read-only bridges unblock the wallet dashboard. Sui-native /pay unblocks marketplace revenue.
Cross-chain waits for data. Build for traffic that exists, not traffic you hope for.
Pheromone decides when to grow.*
