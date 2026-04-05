# TODO

> ONE Substrate: Markdown agents, TypeDB brain, Cloudflare edge, weight-based routing.

---

## Done

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

### Deploy Infrastructure (Phase 8 partial)
- [x] wrangler.toml with D1, KV, Queue, R2 bindings
- [x] CF env types, edge helpers, migrations
- [x] Export APIs (paths, units, skills, highways, toxic)
- [x] Sync worker (TypeDB -> KV every 5 min)
- [x] Gateway deployed: one-gateway.oneie.workers.dev
- [x] Pages deployed: one-substrate.pages.dev
- [x] TypeDB Cloud: database `one` created, world.tql loaded, 19 functions
- [x] End-to-end: Gateway -> TypeDB Cloud query works
- [x] Agent caste architecture designed (Haiku/Sonnet/Opus, 7x cost reduction)

### Emergent Intelligence (early prototype)
- [x] Substrate: unit + world + pheromone + fade (85 lines)
- [x] Engine swap: colony replaces Runtime
- [x] Highway panel, edge info, colony graph (ReactFlow)
- [x] Live learning: periodic fade + signal injection

---

## To Do (priority order)

### 1. Deploy + Connect (READY FOR PRODUCTION) -- Phase 8 complete

Infrastructure deployed and verified. Security hardened.
**All Haiku tasks executed, Opus audit complete, critical fixes applied.**

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
  - ⚠️ *Action: Set TYPEDB secrets via `wrangler secret put` before final deploy*
  
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

- [ ] **Archive 7 dead files** -- world.ts (dup), unit.ts (dup), colony-patterns.ts (357 lines TS reimplementing TQL), agent.ts, runtime.ts, envelope.ts, types.ts -> src/engine/archive/
- [ ] **Connect persist** -- `world()` -> `persisted()` in one.ts (~5 lines changed)
- [ ] **Fix zero-returns** -- agentverse.ts:63 throw -> warn, asi.ts:69 mark(:resistance) -> warn()
- [ ] **Wire ASI to suggest_route()** -- when confidence low, call TypeDB function instead of raw LLM
- [ ] **Bootstrap script** -- .env.example + scripts/bootstrap.sh + `npm run bootstrap`

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

These are marked done in the roadmap but are aspirational designs, not shipped code. The real work:

**Onboard:**
- [ ] Signup flow (name.one.ie, wallet, unit in TypeDB)
- [ ] Agent builder (/build page)
- [ ] Discovery (/discover, ranked by edge strength)
- [ ] Profiles (/u/:name, reputation from trails)

**Commerce:**
- [ ] x402 payment layer (signal -> escrow -> service -> release)
- [ ] Service marketplace (prices in capability relation)
- [ ] Revenue tracking (payments = pheromone)
- [ ] Agent-to-agent payment chains

**Intelligence:**
- [ ] LLM as unit (Claude/GPT/Llama in TypeDB, confidence-based skip)
- [ ] Hypothesis engine (auto-track, state machine)
- [ ] Frontier detection (EV >= 0.5 spawns objectives)
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
DONE:  D-1 to D-8 (deploy + connect — all infrastructure live)
       Engine, schema, API, persist, auth, task system, agent markdown
       CF Pages + Workers + D1 + KV deployed
       Marketing team seeded (18 agents, 31 skills)
       E2E tests passing (18/18, latency baselined)
       Security audit complete, critical fixes applied

NEXT:  1. Set TypeDB secrets: npx wrangler secret put TYPEDB_PASSWORD
       2. Final wrangler deploy (gateway + sync)
       3. Production sign-off
       4. Archive dead code (-700 lines)
       5. Marketing launch (Phase 9)

LATER: Loop refinements, onboard, commerce, intelligence, scale
```

**Ready for production.** Critical security vulnerabilities fixed. Follow `docs/SECURE-DEPLOY.md` for final deployment steps.
