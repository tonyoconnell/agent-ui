# TODO: Create for MVP

**What must be built to have a working product.**

Derived from: lifecycle.md, one.tql, strategy.md, revenue.md, gaps.md, and current codebase state.

---

## What EXISTS (no creation needed — just wire/deploy)

| Layer | Files | Status |
|-------|-------|--------|
| Substrate engine | `substrate.ts` (157 lines) | Working — unit, colony, pheromone, fade |
| World runtime | `one.ts` (109 lines) | Working — 6 dimensions, group/actor/thing/flow |
| TypeDB client | `lib/typedb.ts` (184 lines) | Working — read/write/decay/callFunction, gateway + direct |
| Persistence | `persist.ts` (88 lines) | Working — mark/warn/fade sync to TypeDB |
| ASI orchestrator | `asi.ts` (83 lines) | Working — routes via pheromone, falls back to LLM |
| Agentverse bridge | `agentverse.ts` (82 lines) | Working — register/discover/call |
| Schema | `one.tql` (543 lines) | Production — 6 dimensions, 20+ functions |
| API endpoints | 20+ routes in `pages/api/` | Exist — signal, drop, alarm, agents, discover, etc. |
| Pages | 10 Astro pages | Exist — index, world, chat, tasks, marketplace, etc. |
| UI components | 4,660 lines | Exist — graph editor, workspace, metaphors |

---

## What must be CREATED for MVP

### Phase 0: Infrastructure (blocks everything)

- [ ] **TypeDB instance** — Start a TypeDB Cloud or local instance. Load `one.tql`. Without this, every persist/read/write is a no-op.
- [ ] **`.env` configuration** — Set `TYPEDB_URL`, `TYPEDB_DATABASE`, `TYPEDB_USERNAME`, `TYPEDB_PASSWORD`. Gateway URL if using Worker.
- [ ] **Seed data script** — `scripts/seed.ts` that inserts initial units, tasks, capabilities, and paths into TypeDB so the system has something to route. The `api/seed.ts` endpoint exists but needs real seed data matching lifecycle Stage 0 (REGISTER) + Stage 1 (CAPABLE).
- [ ] **Bootstrap script** — `scripts/bootstrap.sh` exists but needs: install deps, start TypeDB, load schema, seed data, start dev server. One command to go from zero to running.

### Phase 1: Signal Loop (the core product)

This is lifecycle Stages 0–4: Register → Capable → Discover → Signal → Drop.

- [ ] **Agent registration flow** — `POST /api/agents` exists but needs: insert unit into TypeDB with `uid`, `name`, `unit-kind`, `status`, `success-rate`, `activity-score`, `sample-count`. Return the uid. This is lifecycle Stage 0.
- [ ] **Capability declaration** — `POST /api/agents/:id/capabilities` — insert `capability(provider, skill)` with `price`. This is lifecycle Stage 1. Currently no endpoint for this.
- [ ] **Signal routing end-to-end** — `POST /api/signal` exists. Verify it: writes signal to TypeDB, calls `suggest_route()` or `optimal_route()` from schema, executes the target agent, writes result signal, calls `drop()` on success / `alarm()` on failure. This is the CORE LOOP from engine.md.
- [ ] **Decay cron** — `api/decay-cycle.ts` exists. Wire it to run on interval (every 5 min in dev, every hour in prod). Calls `decay()` from `lib/typedb.ts`. This is lifecycle Stage 6.
- [ ] **At least 3 working agents** — Create 3 units with real LLM backing (via `llm.ts`): one for summarization, one for translation, one for analysis. They need `model`, `system-prompt` on the unit entity. Register them, declare capabilities, and have them process signals.

### Phase 2: Discovery + UI (users can see and use it)

This is what makes it a product people can touch.

- [ ] **Live dashboard** — Wire `src/pages/dashboard.astro` to fetch from TypeDB: highway count, active units, signal volume, revenue. Currently shows static data.
- [ ] **Agent discovery page** — `src/pages/discover.astro` exists. Wire to `suggest_route()` / `cheapest_provider()` so users can search "who can do X?" and get pheromone-ranked results.
- [ ] **Signal log view** — Show recent signals (sender, receiver, success, latency) from TypeDB. Real-time or polling. Users need to see the colony working.
- [ ] **Highway visualization** — Wire `WorldWorkspace.tsx` to `net.highways()` from live TypeDB data. Show the graph forming in real time. This is the "aha moment."
- [ ] **Task board** — `src/pages/tasks.astro` exists. Wire to `ready_tasks()`, `attractive_tasks()`, `repelled_tasks()` from schema functions. Show which tasks are ready, blocked, attractive.

### Phase 3: Auth + Identity (multi-user)

- [ ] **Auth flow** — BetterAuth config exists in `lib/auth.ts`. Wire login/signup pages (`signup.astro` exists). Bind user identity to a TypeDB `unit` with `unit-kind: "human"`.
- [ ] **Wallet connection** — Nightly/Sui wallet. Bind `wallet` attribute on unit entity. Needed for any payment or crystallization.
- [ ] **API key system** — Connected-mode agents need API keys to call `POST /api/signal`. Simple: key → unit mapping in TypeDB.

### Phase 4: Payment + Revenue (the business)

This is what makes it a business, not a demo.

- [ ] **x402 middleware** — Intercept API calls. Check `X-Payment` header. Deduct from unit balance or accept Sui payment. The pricing from revenue.md: $0.0001/signal, $0.001/highway route, $0.001/discovery.
- [ ] **Balance management** — `unit.balance` exists in schema. Create `POST /api/pay` to add funds. Create deduction logic in signal routing.
- [ ] **Revenue tracking** — `path.revenue` and `trail.revenue` exist in schema. Increment on every paid signal. `api/revenue.ts` exists — wire it to `total_revenue()` function.
- [ ] **Stripe integration** — Keys exist in `.env`. Create `POST /api/stripe/checkout` for fiat → balance. `POST /api/stripe/webhook` for confirmation.

### Phase 5: Crystallization (the moat)

- [ ] **Sui Move deployment** — `src/move/one/sources/one.move` exists (335 lines). Deploy to testnet. Get package ID.
- [ ] **Crystallize endpoint** — `POST /api/crystallize` — when a path reaches highway status (strength >= 50), freeze it on Sui as a `ProvenCapability` object. This is lifecycle Stage 8.
- [ ] **On-chain verification** — Read Sui objects to verify crystallized highways. Display on agent profile.

---

## MVP Definition

**The minimum product is Phase 0 + Phase 1 + Phase 2.**

A user can:
1. Register an agent (or themselves)
2. Declare capabilities
3. Send a signal → substrate routes it → agent processes it → trail forms
4. See highways forming on the dashboard
5. Discover agents by capability (pheromone-ranked)
6. Watch the colony learn (trails strengthen, fade, reroute)

This demonstrates the full lifecycle: Register → Capable → Discover → Signal → Drop → Highway.

No auth needed for MVP (single-tenant). No payment needed (free tier). No Sui needed (crystallization is "Out of ONE" — later).

---

## Creation Order

```
Phase 0: Infrastructure          ← DO THIS FIRST
  TypeDB instance
  .env config
  Seed data
  Bootstrap script

Phase 1: Signal Loop             ← THIS IS THE PRODUCT
  Agent registration
  Capability declaration
  Signal routing end-to-end
  Decay cron
  3 working agents

Phase 2: Discovery + UI          ← THIS MAKES IT VISIBLE
  Live dashboard
  Agent discovery
  Signal log
  Highway visualization
  Task board

Phase 3: Auth + Identity         ← MULTI-USER
Phase 4: Payment + Revenue       ← BUSINESS
Phase 5: Crystallization         ← MOAT
```

Each phase unblocks the next. TypeDB is the keystone.

---

## What We're NOT Building for MVP

- MCP server (Hermes integration — Week 2 in strategy.md, post-MVP)
- AI SDK control plane (generateObject from TypeDB — Week 3, post-MVP)
- AGENTS.md generation (Week 5, post-MVP)
- Multi-machine federation (enterprise feature)
- Intelligence products (Layer 5 revenue — Year 2+)
- OpenClaw / embodied integration (post-colony)
- Custom decay rates per path (exists in schema, configure later)
- Hypothesis/frontier/objective lifecycle (Dimension 6 — emerges from usage)

---

## Effort Estimate

| Phase | Items | Complexity |
|-------|-------|-----------|
| Phase 0 | 4 items | Low — config + scripts, schema exists |
| Phase 1 | 5 items | Medium — wiring exists, need end-to-end test |
| Phase 2 | 5 items | Medium — components exist, need TypeDB queries |
| Phase 3 | 3 items | Medium — auth lib exists, need flow |
| Phase 4 | 4 items | High — payment logic, x402 spec |
| Phase 5 | 3 items | High — Move deployment, cross-chain |

**MVP (Phases 0–2): 14 items. Most code exists — it's wiring, not writing.**

---

*The architecture is done. The schema is done. The engine is done. Now connect the wires.*
