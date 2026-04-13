# TODO — Sui

> Goal: deploy to testnet, sync one agent, see it on-chain. Build from real data.

> **Source of truth:** [DSL.md](DSL.md) — signal language,
> [dictionary.md](dictionary.md) — canonical names,
> [rubrics.md](rubrics.md) — quality scoring,
> [speed.md](speed.md) — the benchmarks,
> [lifecycle.md](lifecycle.md) — crystallize stage
>
> **Schema:** Tasks map to `world.tql` dimension 3b. Sui entities mirror in `sui.tql`. Execute with `/wave`. Create with `/todo`.

---

## Step 1: Get on Testnet (DO THIS FIRST)

These are sequential. Each depends on the previous.

- [x] **1a. Install Sui CLI** — `sui 1.61.2-homebrew`
- [x] **1b. Create keypair** — `0x90096b9e11cff8f0127a22be75c67f8188ee503add9b4c7ff98978fd04cc765d`
- [x] **1c. Fund from faucet** — ~1.9 SUI across 26 gas coins
- [x] **1d. Build contract** — Clean build (removed pinned framework dep, auto-resolved)
- [x] **1e. Run Move tests** — 6/6 pass (unit, deposit/withdraw, path, mark/warn, pay, fade, highway/toxic)
- [x] **1f. Publish** — Package `0xa5e6bddae833220f58546ea4d2932a2673208af14a52bb25c4a603492078a09e`, tx `5GNhTrAyoaHP8BEd3JgnrvZRTThSwv7xu5tNsGg3a6Q6`
- [x] **1g. Set env vars** — `SUI_PACKAGE_ID`, `SUI_PROTOCOL_ID`, `SUI_NETWORK=testnet` in `.env`
- [x] **1h. Generate platform seed** — `SUI_SEED` in `.env`
- [x] **1i. Verify** — `sui client object $SUI_PROTOCOL_ID` shows Protocol { treasury: 0, fee_bps: 50 }

---

## Step 2: First Agent On-Chain

One agent. End to end. Proves the bridge works.

- [x] **2a. Create scout on-chain** — Unit `0x6fd45656222db69f81dbf61c70873fd466ebd8b157bf6694f81314e3e0c13af8`, wallet `0xb0e2d65f43a080ba09275cf3f1ce89ed35309b5fca38df6ad7e6100e616f6dba`
- [x] **2b. Verify on-chain** — Unit { name: "scout", unit_type: "agent", activity: 0, balance: 0 }
- [x] **2c. TypeDB ↔ Sui link** — `absorb()` writes `sui-unit-id` on unit; `resolve(uid)` reads it back
- [x] **2d. View on explorer** — `https://suiscan.xyz/testnet/object/0x6fd45656222db69f81dbf61c70873fd466ebd8b157bf6694f81314e3e0c13af8`

---

## Step 3: First Signal On-Chain

Two agents. One signal between them. Path created + marked.

- [x] **3a. Create analyst** — Unit `0x952fea2b99904aa8a365939c5ebc8079014b7cef7ac1ab2375b5a10e4ec6c47d`, wallet `0xfab3...8104`
- [x] **3b. Send signal** — Signal `0x8a17...da42`, payload "hello from scout", task "research"
- [x] **3c. Verify Signal object** — Signal owned by analyst address, payload + sender + receiver correct
- [x] **3d. Verify Path created** — Path `0x956c...76da` scout→analyst, strength: 1, type: "interaction"
- [x] **3e. Check events** — UnitCreated, SignalSent, Marked events all emitted

---

## Step 4: Payment On-Chain

Revenue = weight. First real token flow.

- [x] **4a. Deposit SUI to unit** — 100000 MIST deposited into scout Unit balance
- [x] **4b. Pay via withdraw+transfer+mark** — Scout withdrew 1000 MIST → analyst address, path marked. Note: Move `pay()` needs both `&mut Unit` (co-sign required) — use withdraw+transfer+mark or escrow pattern instead
- [x] **4c. Verify balances** — Scout: 99000 (100000 - 1000). 1000 MIST arrived at analyst address
- [x] **4d. Protocol fee design** — withdraw+mark bypasses fee (by design). Escrow flow (Phase 3) collects fees atomically via `release_escrow()`
- [x] **4e. Verify path strength** — Path strength: 2, hits: 2 (signal mark + payment mark)

---

## Step 5: The Bridge (`src/engine/bridge.ts`)

Three systems, one truth. Each makes the others smarter.

```
     mark()              Marked event           strength++
  ┌──────────┐  mirror  ┌──────────┐  absorb  ┌──────────┐
  │ Runtime  │─────────►│   Sui    │─────────►│  TypeDB  │
  │ persist  │          │  chain   │          │  brain   │
  └────┬─────┘          └──────────┘          └────┬─────┘
       │                                           │
       └──────────────── load() ◄──────────────────┘
```

**Two directions. Three functions. Zero configuration.**

```typescript
mirrorMark(from, to, n)   // Runtime → Sui (fire-and-forget)
mirrorWarn(from, to, n)   // Runtime → Sui (fire-and-forget)
absorb(cursor?)           // Sui → TypeDB (poll events, write state)
```

**The glue:** `sui-unit-id` and `sui-path-id` attributes in TypeDB schema.
Every unit knows its on-chain object. Every path knows its on-chain path.
`resolve(uid)` looks up both. `resolvePath(from, to)` finds the path.

- [x] **5a. Bridge module** — `src/engine/bridge.ts`: mirror + absorb + resolve
- [x] **5b. Schema updated** — `sui-unit-id` on unit, `sui-path-id` on path
- [x] **5c. persist.ts wired** — mark/warn/actor auto-mirror to Sui
- [x] **5d. Absorb endpoint** — `POST /api/absorb { cursor? }` → polls Sui events → writes to TypeDB
- [x] **5e. Verify events queryable** — 5 events (2 UnitCreated, 1 SignalSent, 2 Marked) returned by `queryEvents()`

---

## Done (what's built)

| # | What | File |
|---|------|------|
| 0a | Move contract (680 lines, 7 objects, 6 verbs, 6 tests) | `src/move/one/sources/one.move` |
| 0b | TypeQL schema (sui-unit-id, sui-path-id attributes) | `src/schema/world.tql` |
| 0c | Sui client — all contract functions | `src/lib/sui.ts` |
| 0d | Bridge — mirror + absorb + resolve | `src/engine/bridge.ts` |
| 0e | persist.ts — mark/warn/actor auto-mirror to Sui | `src/engine/persist.ts` |
| 0f | `syncAgentWithIdentity()` — TypeDB + Sui in one call | `src/engine/agent-md.ts` |
| 0g | `/api/agents/sync` returns `{ wallet, suiObjectId }` | `src/pages/api/agents/sync.ts` |
| 0h | `/api/signal` mirrors to Sui (graceful fallback) | `src/pages/api/signal.ts` |
| 0i | `/api/pay` wired to Sui | `src/pages/api/pay.ts` |
| 0j | Testnet faucet auto-fund | `src/lib/sui.ts` |
| 0k | Published to testnet with 8 proof transactions | `docs/SUI.md` |

---

## Phase 2: Identity & Wallet (Next)

One agent, multiple chains. Deterministic keypair from substrate UID.

- [ ] **2.1 Keypair derivation** — `deriveAgentKeypair(uid, seed)` in `src/lib/sui.ts` + tests
- [ ] **2.2 Wire to /api/agents/sync** — returns `{ wallet: 0x... }` on agent creation
- [ ] **2.3 Wallet Adapter UI** — `@mysten/dapp-kit` in browser for manual signing
- [ ] **2.4 Read-only Discovery** — follow() + select() read Sui Path weights, weight pheromone by on-chain strength
- [ ] **2.5 Transaction history** — `/api/agent/{id}/transactions` → Sui Explorer links
- [ ] **2.6 Gas sponsorship** — Protocol pays gas for new agent creation (Phase 3 escrow setup)

---

## After Testnet (build from real data)

Once Steps 1-5 are done and we have real on-chain state, these open up:

### Identity & Wallet (Phase 2)
- [ ] Sui Wallet Adapter (`@mysten/dapp-kit`) for browser wallet connect
- [ ] Agent identity = keypair (self-sovereign, not platform-derived)
- [ ] Discovery on-chain (`follow()`/`select()` read Sui path weights)
- [ ] Transaction history UI (link to Sui Explorer)
- [ ] Gas sponsorship (Protocol pays gas for new agents)

### Escrow & x402 (Phase 3)
- [ ] Create escrow on-chain (lock SUI for async tasks)
- [ ] Release on success (payment + mark + fee, atomic)
- [ ] Cancel on timeout (tokens return, path warned)
- [ ] x402 HTTP flow (402 → fund → execute → release)
- [ ] Multi-hop payment chains
- [ ] Multi-currency (USDC, FET)

### Crystallization (Phase 4)
- [ ] On-chain fade (CF Worker cron)
- [ ] Crystallize highways (`freeze_object()`, $0.50 fee)
- [ ] Read frozen highways (on-chain badge in UI)
- [ ] Proof of delivery / consumption

### Colony Economics (Phase 5)
- [ ] Colony treasury on-chain
- [ ] Colony splitting
- [ ] Unit dissolve (balance returns to colony)
- [ ] Protocol fee management
- [ ] Federation (cross-group signals)

### Mainnet (Phase 6)
- [ ] Security audit
- [ ] Mainnet deployment
- [ ] SDK publish (`@one/sdk`)
- [ ] Multi-chain bridge

---

## Summary

```
Steps 1-5 (testnet):     33 done, 0 open ← TESTNET COMPLETE
Phase 2 (identity):      0 done, 6 open ← IN FLIGHT
Phases 3-6 (after P2):   0 done, 22 open
──────────────────────────────────────────
Total: 33 done, 28 open
```

---

*Deploy first. Verify on-chain. Build from real data.*

---

## See Also

- [DSL.md](DSL.md) — the signal language (always loaded)
- [dictionary.md](dictionary.md) — everything named (always loaded)
- [rubrics.md](rubrics.md) — quality scoring as tagged edges
- [speed.md](speed.md) — crystallization speed: sub-second Sui finality
- [lifecycle.md](lifecycle.md) — stage 8: CRYSTALLIZE (highway → Sui → permanent proof)
- [TODO-template.md](TODO-template.md) — the wave pattern
- [TODO-task-management.md](TODO-task-management.md) — self-learning task system
