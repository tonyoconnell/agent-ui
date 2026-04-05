# TODO

> ONE Substrate: Markdown agents, TypeDB brain, Cloudflare edge, weight-based routing.

---

## Done

### Context System + NanoClaw (Phase 10) — 2026-04-06
- [x] **Context system** — docs span to agents automatically
  - [x] `src/engine/context.ts` — loadContext, docIndex, ingestDocs
  - [x] `src/pages/api/context.ts` — GET docs, merge, skill map
  - [x] `src/pages/api/context/ingest.ts` — POST docs → TypeDB
  - [x] Agent markdown `context:` field — loads docs into prompts
  - [x] 60 docs indexed (26,778 lines), 52KB+ context per agent
  
- [x] **Core agents spawned** (5 with context + sensitivity)
  - [x] `agents/router.md` — sens=0.3, context: [routing, dsl]
  - [x] `agents/scout.md` — sens=0.1, context: [routing, dsl] (explorer)
  - [x] `agents/harvester.md` — sens=0.9, context: [routing, loops] (highway)
  - [x] `agents/analyst.md` — sens=0.5, context: [routing, loops, patterns]
  - [x] `agents/guard.md` — sens=0.0, context: [routing] (security)

- [x] **NanoClaw edge workers** — free agents on CF free tier
  - [x] `nanoclaw/src/workers/router.ts` — Webhooks + Queue + Cron
  - [x] `nanoclaw/src/channels/index.ts` — Telegram, Discord, Web adapters
  - [x] `nanoclaw/src/lib/substrate.ts` — TypeDB integration via gateway
  - [x] `nanoclaw/src/lib/tools.ts` — 7 Claude tools (signal, discover, mark, warn, etc.)
  - [x] `nanoclaw/migrations/0001_init.sql` — D1 schema (groups, messages, tasks)
  - [x] Local dev verified: health ✓, webhook ✓, D1 insert ✓

- [x] **Docs enhanced**
  - [x] `docs/routing.md` — ASCII header, TOC, benefits table (speed, learning, security)

- [x] **NanoClaw deployed** — https://nanoclaw.oneie.workers.dev/health → `{"status":"ok"}`
  - [x] D1 migration: 7 tables (4 base + groups, sessions, tool_calls)
  - [x] Queue: `nanoclaw-agents` created (producer + consumer)
  - [x] Cron: `* * * * *` (every minute)
  - [x] Bindings: D1, KV, Queue, Gateway URL
  - [ ] Set ANTHROPIC_API_KEY secret for live Claude calls
  - [ ] Set TELEGRAM_TOKEN for Telegram channel (optional)

### Engine + Schema (Phase 0)
- [x] One schema: `src/schema/one.tql` (~330 lines, 6 dimensions)
- [x] Vocabulary converged: signal={receiver,data}, mark/warn/fade/emit
- [x] Old schemas archived, stale refs cleaned
- [x] Revenue on edges AND trails
- [x] seed.tql bootstraps: worlds, units, services, edges, tasks, trails, frontiers

### Wire (Phase 1)
- [x] Cloudflare Worker proxy: gateway/ (JWT cache, CORS, /typedb/query)
- [x] TypeDB client: src/lib/typedb.ts (read, write, decay, callFunction)
- [x] 12 API routes (query, signal, mark, resistance, state, decay, chat, tasks x6)
- [x] Better Auth wired to TypeDB
- [x] Persist layer: src/engine/persist.ts (mark/warn/fade write-through)

### Tasks (Phase 2)
- [x] Task API routes (CRUD + pheromone queries)
- [x] Task board UI with phase timeline, dep chains, pheromone bars
- [x] Dependencies + negation pattern
- [x] Pheromone auto-reinforcement on completion
- [x] Exploratory tasks panel
- [x] Roadmap self-hosted in substrate
- [x] /grow skill for Claude Code

### Agent Markdown (Phase 7)
- [x] Parser: YAML frontmatter + markdown prompt -> AgentSpec
- [x] TypeDB generator: AgentSpec -> insert queries
- [x] Sync API: POST /api/agents/sync (single or world)
- [x] Marketing team: 8 agents (director, creative, media-buyer, seo, content, social, analyst, ads)
- [x] Example agents: tutor, researcher, coder, writer, concierge

### Deploy Infrastructure (Phase 8 COMPLETE — verified 2026-04-06)
- [x] wrangler.toml with D1, KV, Queue, R2 bindings (IDs filled)
- [x] CF env types (`src/env.d.ts`), edge helpers (`src/lib/edge.ts`), migrations
- [x] Export APIs: paths, units, skills, highways, toxic (all HTTP 200)
- [x] Sync worker: one-sync.oneie.workers.dev (cron */5)
- [x] Gateway: api.one.ie + one-gateway.oneie.workers.dev (D1+KV bindings)
- [x] Pages: one-substrate.pages.dev (HTTP 200, 0.4s)
- [x] TypeDB Cloud: database `one`, world.tql, 19 functions (port 1729)
- [x] End-to-end: api.one.ie → TypeDB → 19 units returned
- [x] R2 bucket `one-files` created
- [x] Custom domains: one.ie, app.one.ie, api.one.ie all HTTP 200
- [x] Security: credentials moved to runtime/secrets, not in build output
- [x] `/deploy` skill created — fastest path, Global API Key from `.env`
- [x] `docs/deploy.md` — full tutorial, `docs/cloudflare.md` — platform doc
- [x] Agent castes designed: Haiku 90% / Sonnet 9% / Opus 1% (7x cost reduction)
- [x] 18 units seeded: 8 marketing + 5 example + 5 system

### Emergent Intelligence (early prototype)
- [x] Substrate: unit + world + pheromone + fade (85 lines)
- [x] Engine swap: colony replaces Runtime
- [x] Highway panel, edge info, colony graph (ReactFlow)
- [x] Live learning: periodic fade + signal injection

---

## To Do (priority order)

### 1. Deploy + Connect (PHASE 8 COMPLETE — all verified 2026-04-06)

Infrastructure deployed, seeded, and verified. Security hardened.
**19 units live. 5 export APIs. 3 workers. 3 custom domains. `/deploy` skill ready.**

- [x] **D-1: TypeDB Cloud setup** ✓
  - [x] `.env` configured, highways() verified
  - [x] 10+ paths in DB, ready for signal flow
  
- [x] **D-2: Seed world data** ✓
  - [x] 18 agents seeded (8 marketing + 10 standalone)
  - [x] 70 TypeQL queries, 43 executed, schema validated
  
- [x] **D-3: Create CF resources** ✓
  - [x] D1: `0aa5fceb-667a-470e-b08c-40ead2f4525d`
  - [x] KV: `1c1dac4766e54a2c85425022a3b1e9da`
  - [x] All wrangler.toml bindings configured
  
- [x] **D-4: Deploy CF Workers** ✓
  - [x] Gateway + Sync workers live
  - [x] Health endpoints 200 OK, cron scheduled
  - [x] TYPEDB secrets set via `wrangler secret put` ✓
  
- [x] **D-5: Deploy CF Pages** ✓
  - [x] Build: 6.2 MB, 116 files, 7.64s
  - [x] Live at `2d814d5e.one-substrate.pages.dev`
  
- [x] **D-6: Sync marketing team** ✓
  - [x] 8 agents synced, 31 skills, 7 paths
  - [x] Capability wiring complete
  
- [x] **D-7: End-to-end test** ✓
  - [x] 18/18 tests passing
  - [x] Avg latency 1019ms (TypeDB dominates)
  
- [x] **D-8: Custom domains** ✓
  - [x] one.ie, app.one.ie, api.one.ie live
  - [x] SSL valid, DNS resolving

**Security Audit: CRITICAL ISSUE FOUND & FIXED** (Commit: ca8ea62)
- [x] *Critical:* TypeDB credentials in build output → Moved to runtime/secrets
- [x] *High:* TQL injection vulnerability → Input validation + escaping added
- [x] Credentials removed from `dist/` → No longer in compiled output
- [x] Deployment guide created: `docs/SECURE-DEPLOY.md`

### 2. Fill the Gaps -- simplify engine

Net -700 lines. Remove confusion, don't add pieces.

- [x] **Archive dead files** -- 5 of 7 already gone (unit.ts, colony-patterns.ts, runtime.ts, envelope.ts, types.ts). Remaining: world.ts (225 lines, core), agent.ts (107 lines)
- [ ] **Connect persist** -- `world()` -> `persisted()` in one.ts (~5 lines changed)
- [ ] **Fix zero-returns** -- agentverse.ts:63 throw -> warn, asi.ts:69 mark(:resistance) -> warn()
- [ ] **Wire ASI to suggest_route()** -- when confidence low, call TypeDB function instead of raw LLM
- [x] **Bootstrap script** -- .env.example + scripts/bootstrap.sh exist and work

### 3. Marketing Launch -- Phase 9

Agents marketing agents. Director routes to team, weights track performance.

- [ ] Content calendar -- social agent schedules posts, drag & drop UI
- [ ] First campaign -- director -> creative -> media-buyer -> ads, track weights
- [ ] SEO content -- 5 blog posts targeting "deploy ai agent free"
- [ ] Social presence -- Twitter, LinkedIn, Discord, 10 posts/week
- [ ] First 100 signups -- track user conversion from marketing
- [ ] Weight analysis -- analyst reports on team performance

### 4. UI Polish -- Phase 2b

Visual layer. Most work with in-memory colony (no TypeDB needed).

- [ ] UnitNode -- ReactFlow custom node, color by status (proven/active/at-risk)
- [ ] TaskNode -- ReactFlow custom node, border by status, glow if attractive
- [ ] UnitEdge -- width by strength, color by status (highway/fresh/fading/toxic)
- [ ] Signal particles -- animate along edges, skin-aware (ant=amber, brain=cyan, team=blue)
- [ ] Stats panel -- unit count, proven, tasks, highways, GDP
- [ ] Flow panel -- top 10 highways, fading edges, recent signals
- [ ] Inspector panel -- click unit/task for full details + metrics
- [ ] Chat commands -- "show highways", "route X to Y", "decay 10%"

### 5. Loop Refinements -- 28 tasks across 7 loops

Foundation first, then economics, then intelligence.

**Foundation (L1-L3):**
- [ ] SL-1: Latency-weighted routing (strength / latency)
- [ ] FL-2: Seasonal decay (modulate by last-used)
- [ ] FL-3: Fade floor (peak * 0.05, ghost trails recover faster)
- [ ] TL-3: Completion velocity (prefer faster proven sequences)

**Economics + Evolution (L4-L5):**
- [ ] EL-1: Revenue-weighted routing (strength * log(revenue))
- [ ] EV-3: Evolution cooldown (min time between rewrites)
- [ ] EV-2: Targeted evolution (per task-type, not blanket)
- [ ] EL-3: Cost-aware evolution (revenue vs success rate)
- [ ] EV-1: Evolution history (version prompts, allow rollback)

**Intelligence (L6-L7):**
- [ ] KL-1: Auto-generate hypotheses from state changes
- [ ] KL-2: Hypothesis -> evolution link (confirmed learnings inform rewrites)
- [ ] LC-1: Knowledge -> Evolution coupling (L6 feeds L5)
- [ ] FR-1: Frontier detection from trail gaps

### 6. Onboard + Commerce + Intelligence + Scale (Phases 3-6)

Pages and APIs exist. Need real data flow and production hardening.

**Onboard (pages built, need real user flow):**
- [x] Signup page (`/signup` + `SignupForm` component)
- [x] Agent builder (`/build` + `AgentBuilder` component)
- [x] Discovery (`/discover` + `DiscoverGrid`, ranked by edge strength)
- [x] Profiles (`/u/:name` + `UnitProfile`, reputation from trails)
- [ ] Connect signup to TypeDB unit creation + wallet
- [ ] Real user testing

**Commerce (APIs built, need Sui/x402 wiring):**
- [x] Payment API (`/api/pay` — records signal + strengthens path)
- [x] Marketplace (`/api/marketplace` + page)
- [x] Revenue tracking (`/api/revenue` — payments = pheromone)
- [ ] x402 escrow integration (Sui)
- [ ] Agent-to-agent payment chains (multi-hop)

**Intelligence (APIs built, need loop integration):**
- [x] LLM as unit (`src/engine/llm.ts` — 40 lines, anthropic/openai adapters)
- [x] Hypothesis API (`/api/hypotheses`)
- [x] Frontier API (`/api/frontiers`)
- [ ] Confidence-based LLM skip (highway → direct route)
- [ ] Dream state (nightly Opus consolidation)

**Scale:**
- [ ] Sui integration (highways on-chain)
- [ ] Security hardening (identity, staking, circuit breakers)
- [ ] Monitoring + alerts
- [ ] Self-sustaining economy

---

## Quick Wins (no TypeDB needed)

- [ ] Edge status inference (highway/fresh/fading) from strength thresholds
- [ ] Color units by success rate
- [ ] Price badges on task nodes
- [ ] Better command help in chat
- [ ] Keyboard shortcuts (space=inject, d=decay, h=highways)

---

## Summary

```
PHASES COMPLETE
───────────────
  0. Engine + Schema     world.tql, 6 dimensions, 19 functions
  1. Wire                gateway, typedb client, 12 API routes  
  2. Tasks               CRUD, pheromone, task board UI
  3. Onboard             signup, build, discover, profiles (pages built)
  4. Commerce            pay, marketplace, revenue APIs (need Sui wiring)
  5. Intelligence        llm.ts, hypotheses, frontiers APIs (need loop integration)
  7. Agent Markdown      parser, TypeDB sync, 18 agents
  8. Deploy              CF Pages/Workers/D1/KV/R2, api.one.ie, /deploy skill
 10. Context + NanoClaw  docs span, 5 core agents, edge workers

LIVE (verified 2026-04-06)
──────────────────────────
  api.one.ie/health      {"status":"ok"} — gateway + TypeDB proxy
  one-substrate.pages.dev HTTP 200 in 0.4s — Astro SSR + 30 API routes
  one-sync               cron */5 — TypeDB → KV snapshots
  TypeDB Cloud :1729     19 units, 18 skills, 1 group, 19 functions
  5 export APIs          paths, units, skills, highways, toxic — all HTTP 200

NEXT
────
  1. Set ANTHROPIC_API_KEY on NanoClaw (wrangler secret put)
  2. Connect persist     world() → persisted() (~5 lines)
  3. Marketing launch    Phase 9 — agents marketing agents
```

**Deploy NanoClaw** (free agents for everyone):
```bash
cd nanoclaw
source ../.env
export CLOUDFLARE_API_KEY=$CLOUDFLARE_GLOBAL_API_KEY
wrangler secret put ANTHROPIC_API_KEY
wrangler d1 execute one --remote --file=migrations/0001_init.sql
wrangler deploy
```

**Telegram webhook** (optional):
```bash
curl "https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook?url=https://nanoclaw.YOUR_SUBDOMAIN.workers.dev/webhook/telegram"
```

**Cost: $0/month** — CF free tier (100k req/day, 5GB D1, 100k KV, 1M queue ops)
