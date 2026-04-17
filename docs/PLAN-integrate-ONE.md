# PLAN: Integrate ../ONE/ into Envelopes

> **Status:** Draft — W1 recon complete, strategic analysis done
> **Source:** `../ONE/` monorepo (pnpm, Convex, Effect.ts, 860 docs, 1185 frontend files)
> **Target:** `/Users/toc/Server/envelopes/` (TypeDB, signal engine, CF Workers)
> **Protocol:** [one-protocol.md](one-protocol.md) — private intelligence, public results
> **Chains:** [chains.md](chains.md) — every chain is a unit, $ONE settles

---

## The Two Codebases

| Aspect | ONE (`../ONE/`) | Envelopes |
|--------|----------------|-----------|
| **DB** | Convex (real-time) | TypeDB Cloud |
| **Ontology** | Groups, People, Things, Connections, Events, Knowledge | Groups, Actors, Things, Paths, Events, Learning |
| **Backend** | Effect.ts services + Convex mutations | Signal engine (world/persist/loop) |
| **Frontend** | Astro 5 + React 19 + shadcn/ui | Astro 5 + React 19 + shadcn/ui |
| **Auth** | Better Auth (OAuth, WebAuthn) | Custom |
| **Deploy** | CF Pages + Convex Cloud | CF Workers + Pages + TypeDB Cloud |
| **CLI** | `oneie` v3.6.40 | Already merged into `cli/` |
| **Agents** | YAML-driven (missions, templates) | Markdown-driven (agent-md.ts) |
| **Commerce** | Stripe + Convex (cart, orders, payments) | Sui on-chain (bridge.ts), any-token via bridge units |
| **Chains** | Multi-chain wallet (`/u`) | Sui-native + bridge units per chain (see [chains.md](chains.md)) |
| **Token** | — | $ONE (`Coin<ONE>` on Sui) — all fees, settlement |

---

## Strategic Frame

This integration serves the [ONE Protocol](one-protocol.md):

1. **ONE's `/u` wallet** becomes the user-facing surface for the protocol's chain layer
2. **Products** become capabilities in TypeDB — listed, discovered, settled in $ONE
3. **Multi-chain sends** route through bridge units — pheromone learns the cheapest path
4. **Every transaction** feeds the protocol's private intelligence (Layer 5 revenue)

Without substrate wiring, `/u` creates a shadow economy — users transact peer-to-peer,
the substrate learns nothing, revenue is $0. See [migrate-u.md](migrate-u.md) for the full
strategic analysis.

---

## What NOT to Bring (Dead Weight)

| Skip | Why |
|------|-----|
| Convex backend (`backend/convex/`) | TypeDB is the brain. No second database. |
| Effect.ts service layer | Substrate's 4-outcome algebra IS the effect system. |
| Better Auth adapter for Convex | Auth strategy TBD — not a copy-paste. |
| `/apps/` (24 example apps) | Templates for `@oneie/templates`. Not integration targets. |
| `/missions/` (25 templates) | Same — templates for later. |
| `/import/` (9.6 GB data) | Import utilities, not portable. |
| `/media/` (3 GB assets) | Static assets, copy individually as needed. |
| Convex schema.ts (654 lines) | ONE ontology uses different dimension names. Map, don't copy. |

---

## What TO Bring

### Tier 1 — Wallet Dashboard (`/u`)

The highest-value integration. 66 files, zero Convex dependency, same
frontend stack. Becomes Stage 0-2 of `lifecycle-one.md`.

See [migrate-u.md](migrate-u.md) for full strategic analysis.
See [TODO-migrate-u.md](TODO-migrate-u.md) for execution cycles.

### Tier 2 — Chain Infrastructure

ONE's `BlockchainService.ts` has RPC configs and balance/history methods
for ETH, BTC, SOL, SUI, Base. These become the implementation inside
bridge unit handlers — the substrate wraps them with routing and pheromone.

See [chains.md](chains.md) for architecture.

### Tier 3 — Components & Pages (selective)

| Source | Target | What | Effort |
|--------|--------|------|--------|
| `web/src/components/` (74 components) | `src/components/` | Audit for Convex depth, copy pure ones | Medium |
| `web/src/pages/` (70 pages) | `src/pages/` | Copy non-conflicting, wire to substrate APIs | Medium |
| `web/src/styles/global.css` | `src/styles/` | Design tokens — see PLAN-design-system.md | Low |

### Tier 4 — Strategic (requires decisions)

| Source | Decision |
|--------|----------|
| Better Auth | Adopt for humans, or Sui wallet = identity? |
| 860 ontology docs | Which become TypeDB hypotheses? |
| Feature flags (core, blog, portfolio, shop) | Map to substrate capabilities? |

---

## Ontology Mapping

| # | ONE Dimension | Envelopes Dimension | Mapping |
|---|--------------|--------------------|--------------------|
| 1 | **Groups** | **Groups** | 1:1 |
| 2 | **People** (4 roles) | **Actors** (unit) | People → actors, roles → capabilities |
| 3 | **Things** (66+ types) | **Things** (skill) | Types → skill tags, products → priced skills |
| 4 | **Connections** (25+ types) | **Paths** (strength/resistance) | Connections → weighted paths |
| 5 | **Events** (67+ types) | **Events** (signal) | Events → signals |
| 6 | **Knowledge** (vectors/RAG) | **Learning** (hypothesis) | Labels → tags, vectors → hypotheses |

**Envelopes dimension names are LOCKED (2026-04-13).** ONE names map INTO envelopes names. See `docs/dictionary.md`.

---

## Integration Cycles

### Cycle 0 — Inventory & Strategy (complete)

- [x] W1: Recon both codebases (haiku agents)
- [x] W2: Strategic impact analysis ([migrate-u.md](migrate-u.md))
- [x] W3: Chain integration architecture ([chains.md](chains.md))
- [ ] W4: Verify no naming conflicts, update dictionary.md

### Cycle 1 — Wallet Dashboard (`/u`)

**Goal:** 66-file wallet dashboard runs in envelopes with substrate wiring.
**Detail:** [TODO-migrate-u.md](TODO-migrate-u.md) — 3 sub-cycles (WIRE/PROVE/GROW)

- [ ] Copy 66 files, install framer-motion, resolve route conflict
- [ ] Fix 10 imports, create 3 stubs, swap 16 layouts
- [ ] Deep-wire 3 files (WalletsPage, SendPage, UDashboard) + emitClick on 15+

### Cycle 2 — Bridge Units (chain infrastructure)

**Goal:** `BlockchainService.ts` → substrate bridge units. Multi-chain balance/history in substrate.
**Detail:** [chains.md](chains.md) Phases 1-2, [TODO-chains.md](TODO-chains.md) Cycle 1

- [ ] Register `bridge:evm`, `bridge:sol`, `bridge:btc` as units with balance/history handlers
- [ ] Wire existing `BlockchainService.ts` methods as handler implementations
- [ ] Add send handlers (EVM first via viem, then SOL, then BTC)
- [ ] Every send = signal. Paths learn. Four outcomes apply.

### Cycle 3 — $ONE Token & Commerce

**Goal:** Deploy `Coin<ONE>` on Sui. Products settle in $ONE. Accept any token.
**Detail:** [chains.md](chains.md) Phases 3-4, [TODO-chains.md](TODO-chains.md) Cycle 2

- [ ] Deploy $ONE token contract on Sui (Move module)
- [ ] Products in `/u` → capabilities in TypeDB (LIST)
- [ ] Payment links → pre-routed signals (DISCOVER + EXECUTE)
- [ ] Settlement in $ONE via `mark(buyer→seller, amount)` + `pay()` (SETTLE)
- [ ] DEX units (Cetus, Jupiter, Uniswap) for swap routing

### Cycle 4 — Cross-Chain Payment Routing

**Goal:** Any token → any product. Pheromone finds cheapest bridge path.
**Detail:** [chains.md](chains.md) Phases 5-6, [TODO-chains.md](TODO-chains.md) Cycle 3

- [ ] Bridge protocol units (CCTP, Wormhole, THORChain) as competing units
- [ ] Payment routing: `select('route:eth→sui')` → pheromone-weighted path
- [ ] `/pay/:skill-id` public commerce page
- [ ] Route learning: fast bridges get stronger paths, failed bridges get warned

### Cycle 5 — Auth & Identity

**Goal:** Users authenticate and get substrate + self-custodial identity.

- [ ] Decide: Better Auth (humans) + `deriveKeypair` (agents), or wallet-native auth
- [ ] Wallet-link relation in TypeDB (substrate identity ↔ external wallets)
- [ ] Sign-in flow for `/u` dashboard

### Cycle 6 — Additional Components & Pages

**Goal:** Migrate useful ONE components beyond `/u`.

- [ ] Audit 74 components for Convex dependency depth
- [ ] Copy pure components, adapt hooked ones
- [ ] Wire `emitClick()` on all interactive elements
- [ ] Replace Convex hooks with `useTaskWebSocket()` + fetch

---

## Signal Flow (Integration)

```
/u Component (React 19)
  │
  ├── onClick → emitClick('ui:wallet:send', { amount, chain })
  │                    │
  │                    ▼
  │              /api/signal → substrate world
  │                    │
  │                    ├── ask({ receiver: 'pay', data: { pay: ETH, settle: ONE } })
  │                    │         │
  │                    │         ▼
  │                    │    pay unit → select('route:eth→sui') → finds best path
  │                    │         │
  │                    │         ▼
  │                    │    bridge:evm → dex:uniswap → bridge:cctp → dex:cetus
  │                    │         │
  │                    │         ▼
  │                    │    mark(every hop) → seller receives $ONE
  │                    │
  │                    └── WsHub broadcast → useTaskWebSocket()
  │                                              │
  └──────────── React state update ◄─────────────┘
```

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Shadow economy (sends bypass substrate) | $0 revenue, no learning | Commerce sends = signals, private sends = direct |
| Two wallet models confuse users | Identity fragmentation | Substrate wallet primary, /u wallets linked |
| Crypto sends are irreversible | Sandwich assumes cheap dissolution | PRE checks matter more, escrow for large amounts |
| Bridge protocol failures | Lost funds | Competing bridge units, pheromone routes around failures |
| $ONE token price volatility | Settlement uncertainty | Price locked at signal-time, DEX pool as oracle |
| ONE ontology names leak into code | Dictionary violation | Grep for dead names in every W4 |
| Bundle size regression | CF Pages 10 MiB limit | `client:only="react"` on all /u pages, SSR external rules |

---

## Decision Log

| # | Decision | Status | Notes |
|---|----------|--------|-------|
| D1 | /u wallet model | **Decided** | Substrate primary + self-custodial linked (Option A) |
| D2 | Commerce sends through substrate? | **Decided** | Yes for products, opt-in toggle for personal |
| D3 | Multi-chain architecture | **Decided** | Chains = units, tokens = skills, pheromone routes |
| D4 | Settlement currency | **Decided** | $ONE on Sui, accept any token via bridge units |
| D5 | Better Auth vs wallet auth | Pending Cycle 5 | — |
| D6 | Which ONE docs → hypotheses? | Pending Cycle 6 | — |

---

## See Also

- [one-protocol.md](one-protocol.md) — private intelligence, public results
- [chains.md](chains.md) — every chain is a unit, $ONE settles
- [migrate-u.md](migrate-u.md) — /u strategic impact analysis
- [TODO-migrate-u.md](TODO-migrate-u.md) — /u execution cycles (WIRE/PROVE/GROW)
- [TODO-chains.md](TODO-chains.md) — chain execution cycles (bridges → $ONE → routing)
- [buy-and-sell.md](buy-and-sell.md) — LIST→DISCOVER→EXECUTE→SETTLE
- [revenue.md](revenue.md) — five revenue layers
- [lifecycle-one.md](lifecycle-one.md) — 10-stage user funnel
- [sdk.md](sdk.md) — `one.hire()` auto-settles across chains
- [dictionary.md](dictionary.md) — canonical names (locked)
- [PLAN-design-system.md](PLAN-design-system.md) — design token strategy
