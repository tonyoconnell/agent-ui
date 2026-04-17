---
title: "Chain Integration — Bridge Units, $ONE Token, Cross-Chain Routing"
type: roadmap
version: 1.0.0
priority: Wire → Prove → Grow
total_tasks: 30
completed: 0
status: ACTIVE
---

# TODO: Chain Integration

> **Time units:** tasks → waves → cycles. Never days, hours, weeks.
>
> **Goal:** Every blockchain is a unit. Every token is a skill. Every payment
> is a routed signal. Settlement in $ONE. Pheromone learns the cheapest path.
>
> **Source of truth:** [chains.md](chains.md) — the architecture,
> [one-protocol.md](one-protocol.md) — private intelligence, public results,
> [buy-and-sell.md](buy-and-sell.md) — LIST→DISCOVER→EXECUTE→SETTLE,
> [revenue.md](revenue.md) — five revenue layers,
> [DSL.md](DSL.md) — signal grammar,
> [dictionary.md](dictionary.md) — canonical names
>
> **Depends on:** [TODO-migrate-u.md](TODO-migrate-u.md) Cycle 3 complete
> (wallet dashboard with substrate wiring — wallets as actors, products as capabilities).
>
> **Shape:** 3 cycles mapping to [chains.md](chains.md) Phases 1-6.
> Each cycle deepens the protocol's private intelligence.

---

## Routing

```
signal DOWN                          result UP
──────────                           ─────────
/do TODO-chains.md                   mark(hop, amount × depth)
     │                                    ▲
     ▼                                    │
┌─ Cycle 1: WIRE ─┐               ┌──────┴──────┐
│ bridge units     │──► balance ──►│ substrate    │
│ (read-only)      │    history    │ sees chains  │
└────────┬─────────┘               └─────────────┘
         │
┌─ Cycle 2: PROVE ─┐              ┌──────────────┐
│ $ONE token        │──► send ───►│ sends are     │
│ send handlers     │    settle   │ signals. paths │
│ DEX units         │    swap     │ learn.         │
└────────┬──────────┘              └──────────────┘
         │
┌─ Cycle 3: GROW ──┐              ┌──────────────┐
│ cross-chain       │──► route ──►│ pheromone     │
│ bridges           │    any→any  │ finds cheapest│
│ /pay page         │    pay page │ path. moat.   │
└───────────────────┘              └──────────────┘
```

---

## Cycle 1: WIRE — Bridge Units (read-only)

**chains.md Phases 1-2.** Wrap `BlockchainService.ts` as substrate units.
The substrate sees multi-chain data. No sends yet — just balance and history.

### Cycle 1 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit | Skill |
|---|-------------|------|-------------------------------|------|-------|
| 1 | `src/engine/bridges.ts` | Bridge unit factory — register chain as unit with balance/history/price handlers | 0.40/0.20/0.30/0.10 | `net.ask({ receiver: 'bridge:evm:balance' })` returns ETH balance | `chains:bridge-factory` |
| 2 | `bridge:evm` unit | EVM bridge (ETH, Base, Arb, Polygon) with balance + history + price | 0.35/0.20/0.35/0.10 | Balance query returns real data from RPC | `chains:bridge-evm` |
| 3 | `bridge:sol` unit | Solana bridge with balance + history + price | 0.35/0.20/0.35/0.10 | Balance query returns real data from Solana RPC | `chains:bridge-sol` |
| 4 | `bridge:btc` unit | Bitcoin bridge with balance + history | 0.35/0.20/0.35/0.10 | Balance query returns real data from Blockstream | `chains:bridge-btc` |
| 5 | Token skills in TypeDB | `sui:one`, `eth:eth`, `sol:sol`, `btc:btc`, `eth:usdc`, `sui:usdc` | 0.30/0.20/0.40/0.10 | `discover({ tags: ['token', 'eth'] })` returns ETH + USDC | `chains:token-skills` |
| 6 | API routes | `/api/chain/balance`, `/api/chain/history`, `/api/chain/price` | 0.35/0.25/0.30/0.10 | `curl /api/chain/balance?address=0x...&chain=eth` returns balance | `chains:api` |

### Wave 1 — Recon (Haiku x 6, parallel)

| Agent | File | What to look for |
|-------|------|-----------------|
| R1 | `src/components/u/lib/BlockchainService.ts` | All exported functions, chain configs, RPC endpoints, return types |
| R2 | `src/engine/api.ts` | `apiUnit()` pattern — how HTTP endpoints become units |
| R3 | `src/engine/world.ts` | `unit().on()` handler registration, four outcomes |
| R4 | `src/lib/sui.ts` | Existing Sui balance/TX methods — what already works |
| R5 | `src/engine/apis/index.ts` | Pre-built API units (github, slack, etc.) — pattern to follow |
| R6 | `src/schema/one.tql` | Current skill/capability schema — where token skills fit |

### Wave 2 — Decide (Opus x 1)

Key decisions:
1. **Bridge factory vs individual files:** One `bridges.ts` factory that takes a `ChainConfig` and returns a wired unit, or one file per chain? → Factory. `BlockchainService.ts` already has `CHAINS` config. Loop over it.
2. **Where does BlockchainService live?** Keep in `src/components/u/lib/` or move to `src/lib/chains/`? → Move to `src/lib/chains.ts` — it's infrastructure, not UI.
3. **Sui bridge unit vs existing sui.ts:** Create `bridge:sui` that wraps `sui.ts`, or treat Sui as native (no bridge)? → Both. `bridge:sui` exists for consistency (`discover('token', {tags:['sui']})`), but Sui operations use `sui.ts` directly.
4. **Token skill seeding:** Manual TypeDB inserts or auto-register from `CHAINS` config? → Auto-register in `boot.ts`. Loop over chains, create skills + capabilities.
5. **Price caching:** Use `BlockchainService.ts` CoinGecko cache (60s TTL) or substrate cache? → Keep CoinGecko cache as-is. It's handler-level, not substrate-level.

### Wave 3 — Edits (Sonnet x 5, parallel)

| Job | File(s) | Est. edits |
|-----|---------|-----------|
| E1 | Move `BlockchainService.ts` → `src/lib/chains.ts`, update imports | 1 move + ~3 import updates |
| E2 | Create `src/engine/bridges.ts` — factory: `chainConfig → wired unit` with balance/history/price handlers | 1 new file (~80 lines) |
| E3 | Register bridge units in `boot.ts` — loop CHAINS, add units, seed token skills | ~3 edits |
| E4 | Create API routes `/api/chain/balance.ts`, `/api/chain/history.ts`, `/api/chain/price.ts` | 3 new files |
| E5 | TypeDB seed: token skills + capabilities for bridge units | 1 new seed script or boot.ts additions |

### Wave 4 — Verify (Sonnet x 2, parallel)

| Shard | Owns | Checks |
|-------|------|--------|
| V1 | Bridge unit correctness | `net.ask({ receiver: 'bridge:evm:balance', data: { address, chain: 'eth' } })` returns data; same for sol, btc |
| V2 | Build + TypeDB | `bun run build` green, token skills queryable in TypeDB, API routes return real data |

### Cycle 1 Gate

```bash
bun run build                                              # succeeds
grep -r "bridge:evm\|bridge:sol\|bridge:btc" src/engine/   # bridge units registered
curl localhost:4321/api/chain/balance?chain=sui&address=0x  # returns balance
```

- [ ] `bridge:evm`, `bridge:sol`, `bridge:btc` registered as units
- [ ] Balance queries return real blockchain data
- [ ] Token skills in TypeDB (`sui:one`, `eth:eth`, etc.)
- [ ] API routes work
- [ ] `bun run build` green
- [ ] No regressions (`bun vitest run`)

---

## Cycle 2: PROVE — $ONE Token + Send Handlers + DEX Units

**chains.md Phases 3-4.** Sends become signals. $ONE token deployed. Swaps route through DEX units.
This is where the substrate starts learning payment paths.

**Depends on:** Cycle 1 complete. Bridge units must exist before adding send/swap handlers.

### Cycle 2 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit | Skill |
|---|-------------|------|-------------------------------|------|-------|
| 1 | EVM send handler | `bridge:evm:send` broadcasts signed TX | 0.40/0.15/0.35/0.10 | Send ETH on testnet → TX hash returned, path marked | `chains:send-evm` |
| 2 | Solana send handler | `bridge:sol:send` broadcasts signed TX | 0.40/0.15/0.35/0.10 | Send SOL on devnet → signature returned, path marked | `chains:send-sol` |
| 3 | $ONE token contract | `Coin<ONE>` deployed on Sui testnet | 0.45/0.10/0.35/0.10 | Token exists on-chain, mintable by treasury | `chains:one-token` |
| 4 | `pay` unit | Payment routing unit — accepts any token, finds path to settlement | 0.45/0.15/0.30/0.10 | `ask({ receiver: 'pay', data: { pay: ETH, settle: ONE } })` returns route | `chains:pay-unit` |
| 5 | `dex:cetus` unit | Cetus DEX integration on Sui (USDC↔ONE, SUI↔ONE) | 0.35/0.20/0.35/0.10 | Swap quote returned for USDC→ONE | `chains:dex-cetus` |
| 6 | `dex:uniswap` unit | Uniswap integration on EVM (ETH↔USDC) | 0.35/0.20/0.35/0.10 | Swap quote returned for ETH→USDC | `chains:dex-uniswap` |

### Wave 1 — Recon (Haiku x 7, parallel)

| Agent | File | What to look for |
|-------|------|-----------------|
| R1 | `src/lib/sui.ts` | `signAndExecute()`, `pay()`, `send()` — existing Sui TX signing |
| R2 | `src/move/one/sources/one.move` | Existing Move contract — can $ONE token be a new module in same package? |
| R3 | `src/engine/bridge.ts` | `mirrorMark`, `mirrorWarn` — how Sui bridge syncs with TypeDB |
| R4 | `src/engine/bridges.ts` (from Cycle 1) | Bridge factory — where to add send handlers |
| R5 | Cetus SDK docs (web search) | Swap API, pool queries, Sui integration |
| R6 | Uniswap SDK docs (web search) | Quote API, router contract, EVM integration |
| R7 | `docs/buy-and-sell.md` § Step 3-4 | EXECUTE→SETTLE flow — how `pay` unit maps to existing commerce |

### Wave 2 — Decide (Opus x 1)

Key decisions:
1. **TX signing for EVM:** viem or ethers.js? → viem (smaller, TypeScript-native, modern).
2. **$ONE token design:** Fixed supply or mintable? → Treasury-mintable with cap. Platform mints for faucet/rewards.
3. **Pay unit routing:** Hard-coded routes or `select()` from pheromone? → Hybrid. Phase 1: hard-coded per-pair routes. Phase 2 (Cycle 3): `select()` from learned paths.
4. **DEX integration depth:** Full SDK or API-only? → API-only (quote endpoint). Don't bundle DEX SDKs — use them as HTTP units via `apiUnit()`.
5. **Testnet first:** All send handlers on testnet/devnet. Mainnet gated by separate config.

### Wave 3 — Edits (Sonnet x 6, parallel)

| Job | File(s) | Est. edits |
|-----|---------|-----------|
| E1 | Add `.on('send')` to EVM bridge — viem TX signing | ~1 file, ~50 lines |
| E2 | Add `.on('send')` to Solana bridge — @solana/web3.js | ~1 file, ~50 lines |
| E3 | Create `src/move/one-token/sources/one_token.move` — Coin<ONE> | 1 new Move module |
| E4 | Create `src/engine/pay.ts` — `pay` unit with route selection | 1 new file (~100 lines) |
| E5 | Create DEX units via `apiUnit()` — Cetus API + Uniswap API | 2 new files or add to `apis/index.ts` |
| E6 | Install `viem`, `@solana/web3.js` | deps + SSR external rules |

### Wave 4 — Verify (Sonnet x 3, parallel)

| Shard | Owns | Checks |
|-------|------|--------|
| V1 | Send handlers | EVM testnet send returns TX hash; SOL devnet send returns signature; paths marked |
| V2 | $ONE token | Token deployed on Sui testnet, mint works, balance queryable |
| V3 | Pay unit + DEX | `ask({ receiver: 'pay' })` returns a route; DEX quotes return prices; build green |

### Cycle 2 Gate

```bash
bun run build                                       # succeeds
bun vitest run                                      # no regressions
# Testnet verification (manual)
# 1. Send ETH on Sepolia → TX hash
# 2. Send SOL on devnet → signature
# 3. $ONE token on Sui testnet → mint + balance
# 4. pay unit → route for ETH→ONE returned
```

- [ ] EVM send handler works on testnet
- [ ] Solana send handler works on devnet
- [ ] `Coin<ONE>` deployed on Sui testnet
- [ ] `pay` unit returns routes for known token pairs
- [ ] DEX units return swap quotes
- [ ] `bun run build` green, bundle < 10 MiB
- [ ] New deps SSR-externalized (viem, @solana/web3.js)

---

## Cycle 3: GROW — Cross-Chain Bridges + /pay Page

**chains.md Phases 5-6.** Bridge protocols as competing units. Pheromone picks the
winner. Public commerce page. This is where the moat forms — learned routes are
Layer 5 Intelligence.

**Depends on:** Cycle 2 complete. Send handlers + $ONE token + DEX units must work
before cross-chain routing can chain them together.

### Cycle 3 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit | Skill |
|---|-------------|------|-------------------------------|------|-------|
| 1 | `bridge:cctp` unit | Circle CCTP — USDC native transfer (EVM↔Sui) | 0.40/0.15/0.35/0.10 | Transfer USDC from Sepolia to Sui testnet | `chains:bridge-cctp` |
| 2 | `bridge:wormhole` unit | Wormhole — general cross-chain (competing with CCTP) | 0.35/0.20/0.35/0.10 | Transfer token cross-chain via Wormhole testnet | `chains:bridge-wormhole` |
| 3 | Pheromone-based route selection | `pay` unit uses `select('route:eth→sui')` instead of hard-coded routes | 0.45/0.10/0.35/0.10 | After 10 transfers, `select()` prefers faster bridge | `chains:pheromone-routing` |
| 4 | `/pay/:skillId` page | Public commerce page — accept any token, show route, confirm payment | 0.35/0.25/0.25/0.15 | Visit `/pay/alice:cat-photo`, select ETH, see route, confirm | `chains:pay-page` |
| 5 | End-to-end test | ETH → swap → bridge → swap → $ONE → seller | 0.40/0.10/0.45/0.05 | Full payment on testnet, all hops marked, seller receives $ONE | `chains:e2e` |

### Wave 1 — Recon (Haiku x 6, parallel)

| Agent | File | What to look for |
|-------|------|-----------------|
| R1 | Circle CCTP docs (web search) | Testnet contracts, transfer API, Sui support status |
| R2 | Wormhole SDK docs (web search) | Testnet deployment, VAA flow, Sui integration |
| R3 | `src/engine/pay.ts` (from Cycle 2) | Current route logic — where to add `select()` |
| R4 | `src/engine/world.ts` | `select()` API — how to query with tags for route selection |
| R5 | `src/pages/speed.astro` | Existing page pattern — reference for `/pay` page structure |
| R6 | `src/components/u/pages/SendPage.tsx` | Send UI patterns — reuse for `/pay` page |

### Wave 2 — Decide (Opus x 1)

Key decisions:
1. **CCTP vs Wormhole priority:** CCTP first (USDC-only, fast, native). Wormhole second (broader but slower). Both as competing units — pheromone picks.
2. **Route selection:** Replace hard-coded routes in `pay.ts` with `select('route:${from}:${to}', tags)`. Cold start: try all known routes. Warm: prefer strongest path.
3. **Pay page design:** Minimal — product info, token picker, route preview, confirm button. `client:only="react"`. Reuse `/u` components where possible.
4. **THORChain for BTC:** Defer. BTC cross-chain is high complexity. Focus on EVM↔Sui first.
5. **Mainnet readiness:** All Cycle 3 on testnet. Mainnet is a separate gated deployment.

### Wave 3 — Edits (Sonnet x 5, parallel)

| Job | File(s) | Est. edits |
|-----|---------|-----------|
| E1 | Create `bridge:cctp` unit — Circle CCTP testnet integration | 1 new file (~80 lines) |
| E2 | Create `bridge:wormhole` unit — Wormhole testnet integration | 1 new file (~80 lines) |
| E3 | Update `pay.ts` — replace hard-coded routes with `select()` + tag-based routing | ~4 edits |
| E4 | Create `/pay/[skillId].astro` + `PayPage.tsx` — commerce page | 2 new files |
| E5 | Create `scripts/test-chain-e2e.ts` — end-to-end testnet payment | 1 new file |

### Wave 4 — Verify (Sonnet x 3, parallel)

| Shard | Owns | Checks |
|-------|------|--------|
| V1 | Bridge correctness | CCTP transfer completes on testnet; Wormhole transfer completes; both mark paths |
| V2 | Route learning | After multiple transfers, `select()` returns different weights for CCTP vs Wormhole |
| V3 | Pay page + e2e | `/pay/:skillId` renders, shows route, confirm triggers payment; build green |

### Cycle 3 Gate

```bash
bun run build                                            # succeeds
bun vitest run                                           # no regressions
# Testnet verification (manual or script)
# 1. CCTP: USDC Sepolia → Sui testnet (< 60s)
# 2. Wormhole: token transfer cross-chain
# 3. select('route:eth→sui') returns weighted results
# 4. /pay/test-product renders and processes payment
# 5. End-to-end: ETH → USDC → bridge → ONE → seller
```

- [ ] `bridge:cctp` transfers USDC cross-chain on testnet
- [ ] `bridge:wormhole` transfers tokens on testnet
- [ ] `select()` route learning — prefers faster bridge after multiple transfers
- [ ] `/pay/:skillId` page renders product, token picker, route preview
- [ ] End-to-end testnet payment: ETH → swap → bridge → $ONE → seller
- [ ] All hops marked in substrate (pheromone accumulates)
- [ ] `bun run build` green, bundle < 10 MiB

---

## Status

- [ ] **Cycle 1: WIRE** — Bridge units (read-only: balance, history, price)
  - [ ] W1 — Recon (Haiku x 6)
  - [ ] W2 — Decide (Opus x 1)
  - [ ] W3 — Edits (Sonnet x 5)
  - [ ] W4 — Verify (Sonnet x 2)
- [ ] **Cycle 2: PROVE** — $ONE token + send handlers + DEX units
  - [ ] W1 — Recon (Haiku x 7)
  - [ ] W2 — Decide (Opus x 1)
  - [ ] W3 — Edits (Sonnet x 6)
  - [ ] W4 — Verify (Sonnet x 3)
- [ ] **Cycle 3: GROW** — Cross-chain bridges + pheromone routing + /pay page
  - [ ] W1 — Recon (Haiku x 6)
  - [ ] W2 — Decide (Opus x 1)
  - [ ] W3 — Edits (Sonnet x 5)
  - [ ] W4 — Verify (Sonnet x 3)

---

## Documentation Updates (W2)

**Docs modified per cycle:**
- `docs/chains.md` — update per-chain status as handlers land
- `docs/buy-and-sell.md` — add multi-token settlement examples
- `docs/revenue.md` — add chain fee projections
- `src/engine/CLAUDE.md` — add bridges.ts, pay.ts to file table
- `src/pages/CLAUDE.md` — add `/pay/:skillId` route
- `CLAUDE.md` (root) — update deploy section if new workers needed

**Schema changes:**
- Token skills (Cycle 1): `sui:one`, `eth:eth`, `sol:sol`, `btc:btc`, stablecoins
- Bridge units (Cycle 1): `bridge:evm`, `bridge:sol`, `bridge:btc` in TypeDB
- $ONE token (Cycle 2): `Coin<ONE>` Move module on Sui
- Bridge protocol units (Cycle 3): `bridge:cctp`, `bridge:wormhole` in TypeDB

---

## Execution

```bash
# Run the next wave
/do TODO-chains.md

# Check chain state
/see highways --tag payment     # proven payment routes
/see tasks --tag chains         # open chain tasks

# Manual testnet verification
bun run scripts/test-chain-e2e.ts
```

---

## See Also

- [chains.md](chains.md) — architecture (this TODO implements it)
- [one-protocol.md](one-protocol.md) — private intelligence, public results
- [TODO-migrate-u.md](TODO-migrate-u.md) — prerequisite: /u wallet dashboard
- [PLAN-integrate-ONE.md](PLAN-integrate-ONE.md) — parent plan (Cycles 2-4)
- [buy-and-sell.md](buy-and-sell.md) — LIST→DISCOVER→EXECUTE→SETTLE
- [revenue.md](revenue.md) — five revenue layers
- [sdk.md](sdk.md) — `one.hire()` auto-settles across chains
- [TODO-SUI.md](TODO-SUI.md) — Sui phases (token, escrow, bridge)
- [DSL.md](DSL.md) — signal grammar
- [dictionary.md](dictionary.md) — canonical names

---

*3 cycles. Bridge units → $ONE + sends + DEX → cross-chain + /pay page.
Every chain is a unit. Every token is a skill. Every payment is a signal.
The protocol routes. Pheromone learns. $ONE settles.
Phase 5 is when others start asking how.*
