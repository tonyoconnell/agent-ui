# TODO

> ONE Substrate: Markdown agents, TypeDB brain, Cloudflare edge, weight-based routing.

---

## CRITICAL — Unblock Live Agents

These bridge "deployed" to "running." Do them first.

- [ ] **Set ANTHROPIC_API_KEY on NanoClaw** — agents can't think without it (1 command)
  ```bash
  cd nanoclaw && printf 'sk-ant-YOUR-KEY' | npx wrangler secret put ANTHROPIC_API_KEY && cd ..
  ```
- [ ] **Connect persist** — `world()` → `persisted()` in one.ts (~5 lines changed)
- [ ] **Fix zero-returns** — agentverse.ts:63 throw → warn, asi.ts:69 mark(:resistance) → warn()

---

## HIGH — Make It Real

First campaign, first users, first proof that weights accumulate.

- [ ] **First campaign** — director → creative → media-buyer → ads, track weights end-to-end
- [ ] **Wire ASI to suggest_route()** — TypeDB routing when confidence is low, not raw LLM
- [ ] **Connect signup to TypeDB** — unit creation + wallet on real /signup flow
- [ ] **Real user testing** — 10 users through the onboard flow
- [ ] **Content calendar** — social agent schedules posts, drag & drop UI
- [ ] **SEO content** — 5 blog posts targeting "deploy ai agent free"
- [ ] **Social presence** — Twitter, LinkedIn, Discord, 10 posts/week
- [ ] **First 100 signups** — track conversion from marketing
- [ ] **Weight analysis** — analyst reports on team performance
- [ ] Set TELEGRAM_TOKEN for Telegram channel (optional)

---

## MEDIUM — Engine Quality

Makes everything above work better.

- [ ] **Confidence-based LLM skip** — highway → direct route saves cost & latency
- [ ] **SL-1: Latency-weighted routing** — strength / latency
- [ ] **FL-3: Fade floor** — peak × 0.05, ghost trails recover faster
- [ ] **EV-1: Evolution history** — version prompts, allow rollback
- [ ] **KL-1: Auto-hypotheses** — generate from state changes (L6 loop)
- [ ] **FL-2: Seasonal decay** — modulate by last-used
- [ ] **TL-3: Completion velocity** — prefer faster proven sequences
- [ ] **EV-3: Evolution cooldown** — min time between rewrites
- [ ] **EV-2: Targeted evolution** — per task-type, not blanket
- [ ] **EL-1: Revenue-weighted routing** — strength × log(revenue)
- [ ] **EL-3: Cost-aware evolution** — revenue vs success rate
- [ ] **KL-2: Hypothesis → evolution link** — confirmed learnings inform rewrites
- [ ] **LC-1: Knowledge → Evolution coupling** — L6 feeds L5
- [ ] **FR-1: Frontier detection** — from trail gaps

---

## LOW — Visual Polish & UX

Nice but not blocking. Most work with in-memory colony (no TypeDB needed).

**Quick wins (no TypeDB):**
- [ ] Edge status inference (highway/fresh/fading) from strength thresholds
- [ ] Color units by success rate
- [ ] Price badges on task nodes
- [ ] Better command help in chat
- [ ] Keyboard shortcuts (space=inject, d=decay, h=highways)

**ReactFlow enhancements:**
- [ ] UnitNode — custom node, color by status (proven/active/at-risk)
- [ ] TaskNode — custom node, border by status, glow if attractive
- [ ] UnitEdge — width by strength, color by status (highway/fresh/fading/toxic)
- [ ] Signal particles — animate along edges, skin-aware (ant=amber, brain=cyan, team=blue)

**Panels:**
- [ ] Stats panel — unit count, proven, tasks, highways, GDP
- [ ] Flow panel — top 10 highways, fading edges, recent signals
- [ ] Inspector panel — click unit/task for full details + metrics
- [ ] Chat commands — "show highways", "route X to Y", "decay 10%"

---

## LATER — Scale & Commerce

Need live users and traffic first.

- [ ] x402 escrow integration (Sui)
- [ ] Agent-to-agent payment chains (multi-hop)
- [ ] Sui integration (highways on-chain)
- [ ] Dream state (nightly Opus consolidation)
- [ ] Security hardening (identity, staking, circuit breakers)
- [ ] Monitoring + alerts
- [ ] Self-sustaining economy

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

- [x] **NanoClaw deployed** — https://nanoclaw.oneie.workers.dev/health → `{"status":"ok"}`
  - [x] D1 migration: 7 tables (4 base + groups, sessions, tool_calls)
  - [x] Queue: `nanoclaw-agents` created (producer + consumer)
  - [x] Cron: `* * * * *` (every minute)
  - [x] Bindings: D1, KV, Queue, Gateway URL

### Deploy Infrastructure (Phase 8 — verified 2026-04-06)
- [x] wrangler.toml with D1, KV, Queue, R2 bindings (IDs filled)
- [x] CF env types, edge helpers, migrations
- [x] Export APIs: paths, units, skills, highways, toxic (all HTTP 200)
- [x] Sync worker: one-sync.oneie.workers.dev (cron */5)
- [x] Gateway: api.one.ie + one-gateway.oneie.workers.dev
- [x] Pages: one-substrate.pages.dev (HTTP 200, 0.4s)
- [x] TypeDB Cloud: database `one`, world.tql, 19 functions (port 1729)
- [x] End-to-end: api.one.ie → TypeDB → 19 units returned
- [x] R2 bucket `one-files`, custom domains, SSL, DNS
- [x] Security: credentials moved to runtime/secrets (commit ca8ea62)
- [x] `/deploy` skill, `docs/deploy.md`, `docs/cloudflare.md`
- [x] Agent castes: Haiku 90% / Sonnet 9% / Opus 1%
- [x] 18 units seeded: 8 marketing + 5 example + 5 system

### Agent Markdown (Phase 7)
- [x] Parser: YAML frontmatter + markdown prompt → AgentSpec
- [x] TypeDB generator: AgentSpec → insert queries
- [x] Sync API: POST /api/agents/sync (single or world)
- [x] Marketing team: 8 agents, example agents: 5

### Tasks (Phase 2)
- [x] Task API routes (CRUD + pheromone queries)
- [x] Task board UI with phase timeline, dep chains, pheromone bars
- [x] Dependencies + negation pattern, auto-reinforcement
- [x] /grow skill for Claude Code

### Wire (Phase 1)
- [x] Cloudflare Worker proxy, TypeDB client, 12 API routes
- [x] Better Auth wired to TypeDB
- [x] Persist layer: src/engine/persist.ts

### Engine + Schema (Phase 0)
- [x] One schema: `src/schema/one.tql` (~330 lines, 6 dimensions)
- [x] Vocabulary converged, old schemas archived
- [x] Revenue on edges AND trails
- [x] seed.tql bootstraps worlds, units, services, edges, tasks, trails, frontiers

### Onboard + Commerce + Intelligence (pages/APIs built)
- [x] Signup, agent builder, discovery, profiles pages
- [x] Payment API, marketplace, revenue tracking
- [x] LLM as unit, hypothesis API, frontier API

---

## Summary

```
LIVE (verified 2026-04-06)
──────────────────────────
  api.one.ie/health      {"status":"ok"} — gateway + TypeDB proxy
  one-substrate.pages.dev HTTP 200 in 0.4s — Astro SSR + 30 API routes
  one-sync               cron */5 — TypeDB → KV snapshots
  nanoclaw               edge workers — webhooks + queue + cron
  TypeDB Cloud :1729     19 units, 18 skills, 1 group, 19 functions
  5 export APIs          paths, units, skills, highways, toxic

NEXT
────
  1. ANTHROPIC_API_KEY on NanoClaw  (1 min)
  2. Connect persist                (10 min)
  3. Fix zero-returns               (15 min)
  4. First campaign                 (1 day)
```

**Cost: $0/month** — CF free tier (100k req/day, 5GB D1, 100k KV, 1M queue ops)
