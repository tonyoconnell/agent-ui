# Gaps

**What's built, what's not, what's next.**

---

## What's Built

| Layer | Lines | Status |
|-------|-------|--------|
| **Substrate** (src/engine/) | 957 | Fully implemented — colony, unit, signals, pheromones |
| **TypeQL Schemas** (src/schema/) | 1,606 | Production-quality — 6 dimensions, inference rules, metaphors |
| **Inference Patterns** (packages/) | 4,157 | Reference library — biology-grounded, 6 lessons |
| **UI Components** (src/components/) | 4,660 | Polished — graph editor, metaphor switching, world view |
| **Move Contract** (src/move/) | 335 | Complete — Unit, Colony, Envelope, Flow, Highway on Sui |
| **LLM Adapters** (src/engine/llm.ts) | 40 | Wired — Anthropic + OpenAI, unit-based |

**Architecture: 80% implemented. Integration: 20% implemented.**

---

## Critical Gaps

### 1. TypeDB Not Connected

```
src/engine/persist.ts    → stub (44 lines, no driver)
src/schema/*.tql         → 1,606 lines of schema, nowhere to run
packages/typedb-*/       → 4,157 lines of patterns, not loaded
```

**What's missing:** `@typedb/driver` not in package.json. No TypeDB instance. `persist.ts` accepts a `query(tql)` function but nothing provides one.

**Fix:** Install driver, start TypeDB, pass query function to `persisted()`. Schema is ready — just needs a database.

### 2. UI Shows Static Data

```
src/components/AgentWorkspace.tsx  → fetches agents.json (hardcoded)
src/components/WorldWorkspace.tsx  → builds from static config
src/components/graph/*             → graph manipulation works, not persisted
```

**What's missing:** No live TypeDB queries feed the UI. Graph edits don't persist. Metaphor switching works visually but data doesn't change.

**Fix:** Wire components to TypeDB via pulse client (patterns exist in packages/). Replace JSON fetch with TypeQL queries.

### 3. Data Sources Not Integrated

25+ API keys configured in `.env`, zero integration code:

| Service | Keys Present | Code Written |
|---------|-------------|-------------|
| Stripe | Secret + webhook | None |
| Shopify | Token + shop URL | None |
| YouTube | API key + channel | None |
| GitHub | Token + repo | None |
| Notion | API key + DB ID | None |
| Coinbase | Key + secret | None |
| Hyperliquid | — | None |

**Fix:** Build oracle units — each data source becomes a unit that emits signals. Pattern exists in examples.md (trading swarm).

### 4. LLM Not Wired to UI

```
src/engine/llm.ts       → adapters work (Anthropic, OpenAI)
src/engine/asi.ts       → orchestrator routes via pheromones
src/components/*        → no LLM calls, no streaming display
```

**What's missing:** ASI orchestrator and LLM adapters exist but UI never calls them. No agentic reasoning visible to users.

**Fix:** Wire WorldView → ASI orchestrator → LLM pool. Add streaming response display.

### 5. Move Contract Not Deployed

```
src/move/one/sources/one.move  → 335 lines, production-quality
Sui deployment                  → not configured
Web UI → Move calls             → not wired
```

**What's missing:** No `sui client publish`. No PTB builder in TypeScript. No wallet connection in UI.

**Fix:** Deploy to testnet. Add `@mysten/sui` SDK. Wire wallet (Nightly key exists in .env).

### 6. Auth / Identity Missing

```
.env has: BetterAuth, Google OAuth, GitHub OAuth
Codebase: zero auth middleware, zero OAuth handlers
Move contract: Unit has no pubkey field yet
```

**What's missing:** No login flow. No agent-to-identity binding. No Sybil defense.

**Fix:** Wire BetterAuth. Bind Sui wallet address to agent identity. Add pubkey to Unit struct.

### 7. Payment / Escrow Empty

```
Move: Unit.balance exists, Colony.treasury exists
Move: dissolve() returns balance to treasury
Missing: transfer(), escrow(), settle() functions
Stripe/Coinbase: keys configured, zero code
```

**Fix:** Add payment functions to Move contract. Wire Stripe for fiat. Implement x402 for agent-to-agent.

---

## Security (Future)

| Attack | Fix | Blocked By |
|--------|-----|-----------|
| Sybil swarm | Pubkeys + MIN_STAKE | Gap 6 (identity) |
| Path poisoning | Stake-weighted reinforcement | Gap 7 (payment) |
| Treasury drain | Multi-sig escrow | Gap 5 (Move deploy) + Gap 7 |

## Stability (Future)

| Failure | Fix | Blocked By |
|---------|-----|-----------|
| Server restart (paths lost) | TypeDB persistence | Gap 1 |
| Memory overflow | Bounded edge maps, LRU | Substrate handles this |
| Cascade failure | Circuit breakers | Substrate handles this (natural topology) |

---

## Priority Order

```
Gap 1: TypeDB          → everything persists
Gap 2: UI ↔ TypeDB     → users see real data
Gap 3: Data sources    → signals flow from real world
Gap 4: LLM ↔ UI       → agents reason visibly
Gap 5: Move deploy     → on-chain state
Gap 6: Auth            → identity and access
Gap 7: Payment         → economics work
```

Each gap unblocks the next. TypeDB is the keystone.

---

*The architecture is done. Now wire it together.*

---

## See Also

- [flows.md](flows.md) — The flows these gaps affect
- [one-protocol-gaps.md](one-protocol-gaps.md) — Protocol-level gap analysis
- [Plan.md](Plan.md) — Strategic roadmap
- [executive-summary.md](executive-summary.md) — Business case
- [strategy.md](strategy.md) — Competitive positioning
- [the-stack.md](the-stack.md) — What's built vs what's needed
