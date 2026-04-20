# Gaps

**What's built, what's not, what's next.**

---

## What's Built

| Layer | Lines | Status |
|-------|-------|--------|
| **Substrate** (src/engine/) | 957 | Fully implemented — colony, unit, signals, pheromones |
| **TypeQL Schemas** (src/schema/) | 1,606 | Production-quality — 6 dimensions, classifier functions, metaphors |
| **Inference Patterns** (packages/) | 4,157 | Reference library — biology-grounded, 6 lessons |
| **UI Components** (src/components/) | 4,660 | Polished — graph editor, metaphor switching, world view |
| **Move Contract** (src/move/) | 335 | Complete — Unit, World, Signal, Path, Highway on Sui |
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

**Fix:** Build oracle units — each data source becomes a unit that emits signals. Pattern exists in examples.md (trading group).

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
Move: Unit.balance exists, World.treasury exists
Move: dissolve() returns balance to treasury
Missing: transfer(), escrow(), settle() functions
Stripe/Coinbase: keys configured, zero code
```

**Fix:** Add payment functions to Move contract. Wire Stripe for fiat. Implement x402 for agent-to-agent.

---

## Security (Future)

| Attack | Fix | Blocked By |
|--------|-----|-----------|
| Sybil group | Pubkeys + MIN_STAKE | Gap 6 (identity) |
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
Gap 1: TypeDB          → everything persists (single source of truth)
Gap 2: Agent Registry  → any species can register and discover
Gap 3: MCP Server      → Hermes + MCP clients connect to substrate
Gap 4: AI SDK Control  → generateObject() + streamText() drive agents
Gap 5: UI ↔ TypeDB     → users see real data
Gap 6: Data sources    → signals flow from real world
Gap 7: Move deploy     → on-chain state
Gap 8: Auth            → identity and access
Gap 9: Payment         → economics work
```

Each gap unblocks the next. TypeDB is the keystone. Agent registry is the first step after.

### New: Agent Integration Gaps

| Gap | What's Missing | Fix |
|-----|---------------|-----|
| Agent Registry | No `/api/agents` endpoint, no capability insert | Build registration + discovery API |
| MCP Server | No `gateway/mcp-one/` | Build MCP server exposing substrate tools |
| AI SDK Control | `streamText()` exists but no substrate tools | Add signal/mark/discover as AI SDK tools |
| AGENTS.md Gen | No script to generate from TypeDB | Build `scripts/generate_agents_md.py` |
| Multi-Species | World assumes single agent type | Add species-aware routing to `optimal_route()` |

---

*The architecture is done. The agent integration is designed. Now wire it together.*

---

## See Also

- [hermes-agent.md](hermes-agent.md) — Multi-species agent architecture + implementation steps
- [strategy.md](one/strategy.md) — First steps (week-by-week)
- [flows.md](flows.md) — The flows these gaps affect
- [revenue.md](one/revenue.md) — How closing these gaps generates revenue
- [executive-summary.md](executive-summary.md) — Business case
- [the-stack.md](the-stack.md) — What's built vs what's needed
