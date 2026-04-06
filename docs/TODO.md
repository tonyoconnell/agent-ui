# TODO

> ONE Substrate: Markdown agents, TypeDB brain, Cloudflare edge, weight-based routing.
> Synced from docs/ → TypeDB. 110 open, 133 done.

---

## CRITICAL — Unblock Live Agents

- [ ] **TYPEDB_PASSWORD set via wrangler secret put** — TYPEDB_PASSWORD set via wrangler secret put (not in .env or code) `secure-deploy, build, typedb`
- [ ] **Build output verified** — Build output verified (no password grep match) `secure-deploy, build, ui`
- [ ] **Gateway worker deployed** — Gateway worker deployed (/health endpoint returns 200) `secure-deploy, build, infra`
- [ ] **Pages deployed** — Pages deployed (uses gateway for TypeDB access) `secure-deploy, build, typedb, infra`
- [ ] **Sync worker deployed** — Sync worker deployed (uses KV, optional TYPEDB secrets) `secure-deploy, build, typedb, infra`
- [ ] **TQL injection tests pass** — TQL injection tests pass (bad UIDs rejected with 400) `secure-deploy, ui, typedb`
- [ ] **E2E tests pass** — E2E tests pass (18/18 passing) `secure-deploy`
- [ ] **Set ANTHROPIC_API_KEY on NanoClaw** — Set ANTHROPIC_API_KEY on NanoClaw — agents can't think without it (1 command) `todo, agent`
- [ ] **Connect persist** — Connect persist — world() → persisted() in one.ts (~5 lines changed) `todo`
- [ ] **Fix zero-returns** — Fix zero-returns — agentverse.ts:63 throw → warn, asi.ts:69 mark(:resistance) → warn() `todo, agent`
- [ ] **Gap 1: TypeDB driver is the keystone for Effect ↔ TypeQL** — - [gaps.md](gaps.md) — Gap 1: TypeDB driver is the keystone for Effect ↔ TypeQL `effects, typedb, gap`
- [ ] **Gap 2: Agent Registry  → any species can register and discover** — (gaps) `gaps, agent, gap`
- [ ] **Gap 3: MCP Server      → Hermes + MCP clients connect to substrate** — (gaps) `gaps, gap`
- [ ] **Gap 4: AI SDK Control  → generateObject() + streamText() drive agents** — (gaps) `gaps, agent, gap`
- [ ] **Gap 5: UI ↔ TypeDB     → users see real data** — (gaps) `gaps, ui, typedb, gap`
- [ ] **Gap 6: Data sources    → signals flow from real world** — (gaps) `gaps, gap`
- [ ] **Gap 7: Move deploy     → on** — Gap 7: Move deploy     → on-chain state `gaps, build, infra, gap`
- [ ] **Gap 8: Auth            → identity and access** — (gaps) `gaps, security, gap`
- [ ] **Gap 9: Payment         → economics work** — (gaps) `gaps, commerce, gap`

---

## HIGH — Make It Real

- [ ] **First campaign** — First campaign — director → creative → media-buyer → ads, track weights end-to-end `todo, marketing`
- [ ] **Wire ASI to suggest_route()** — Wire ASI to suggest_route() — TypeDB routing when confidence is low, not raw LLM `todo, engine, typedb, agent`
- [ ] **Connect signup to TypeDB** — Connect signup to TypeDB — unit creation + wallet on real /signup flow `todo, typedb, marketing`
- [ ] **Real user testing** — Real user testing — 10 users through the onboard flow `todo`
- [ ] **Content calendar** — Content calendar — social agent schedules posts, drag & drop UI `todo, ui, agent, marketing`
- [ ] **SEO content** — SEO content — 5 blog posts targeting "deploy ai agent free" `todo, build, agent, marketing, infra`
- [ ] **Social presence** — Social presence — Twitter, LinkedIn, Discord, 10 posts/week `todo, marketing`
- [ ] **First 100 signups** — First 100 signups — track conversion from marketing `todo, marketing`
- [ ] **Weight analysis** — Weight analysis — analyst reports on team performance `todo`
- [ ] **Set TELEGRAM_TOKEN for Telegram channel** — Set TELEGRAM_TOKEN for Telegram channel (optional) `todo, agent, security`
- [ ] **TypeDB deployment with ONE Ontology** — (update-plan) `update-plan, build, typedb, infra`
- [ ] **Event stream shared between fires** — (update-plan) `update-plan`
- [ ] **Agent types enforced by ontology** — (update-plan) `update-plan, agent`
- [ ] **Deterministic validation pipeline** — (update-plan) `update-plan`
- [ ] **Copy Chat components from ONE repo** — (ui-plan) `ui-plan`
- [ ] **Integrate voice input** — (ui-plan) `ui-plan`
- [ ] **Parse natural language → world commands** — (ui-plan) `ui-plan`
- [ ] **Generative UI for agent cards** — (ui-plan) `ui-plan, ui, agent`

---

## MEDIUM — Engine Quality

- [ ] **Connect to Hyperliquid ticks** — (plan-emerge) `plan-emerge, ui`
- [ ] **Stream real signals through colony** — (plan-emerge) `plan-emerge`
- [ ] **Watch trading patterns emerge as highways** — (plan-emerge) `plan-emerge, engine`
- [ ] **Connect to other data sources** — (plan-emerge) `plan-emerge`
- [ ] **Confidence-based LLM skip** — Confidence-based LLM skip — highway → direct route saves cost & latency `todo, engine, agent`
- [ ] **SL-1: Latency-weighted routing** — SL-1: Latency-weighted routing — strength / latency `todo, engine`
- [ ] **FL-3: Fade floor** — FL-3: Fade floor — peak × 0.05, ghost trails recover faster `todo, engine`
- [ ] **EV-1: Evolution history** — EV-1: Evolution history — version prompts, allow rollback `todo, engine, agent`
- [ ] **KL-1: Auto-hypotheses** — KL-1: Auto-hypotheses — generate from state changes (L6 loop) `todo, engine`
- [ ] **FL-2: Seasonal decay** — FL-2: Seasonal decay — modulate by last-used `todo, engine`
- [ ] **TL-3: Completion velocity** — TL-3: Completion velocity — prefer faster proven sequences `todo`
- [ ] **EV-3: Evolution cooldown** — EV-3: Evolution cooldown — min time between rewrites `todo, engine`
- [ ] **EV-2: Targeted evolution** — EV-2: Targeted evolution — per task-type, not blanket `todo, engine`
- [ ] **EL-1: Revenue-weighted routing** — EL-1: Revenue-weighted routing — strength × log(revenue) `todo, engine, commerce`
- [ ] **EL-3: Cost-aware evolution** — EL-3: Cost-aware evolution — revenue vs success rate `todo, engine, commerce`
- [ ] **KL-2: Hypothesis → evolution link** — KL-2: Hypothesis → evolution link — confirmed learnings inform rewrites `todo, engine, typedb`
- [ ] **LC-1: Knowledge → Evolution coupling** — LC-1: Knowledge → Evolution coupling — L6 feeds L5 `todo, ui, engine, typedb`
- [ ] **FR-1: Frontier detection** — FR-1: Frontier detection — from trail gaps `todo`
- [ ] **Opus-class architect agents** — (update-plan) `update-plan, agent`
- [ ] **Sonnet-class coordinator agents** — (update-plan) `update-plan, agent`
- [ ] **Haiku-class worker agents** — (update-plan) `update-plan, build, agent, infra`
- [ ] **Agent × Fire matrix wiring** — (update-plan) `update-plan, agent`
- [ ] **Spark 1: Resonance loop detection** — (update-plan) `update-plan, engine`
- [ ] **Spark 2: Specialization pressure** — (update-plan) `update-plan`
- [ ] **Spark 3: Multi-group membership** — (update-plan) `update-plan`
- [ ] **Spark 4: Scent cascade propagation** — (update-plan) `update-plan`
- [ ] **Spark 5: Economic-information unification** — (update-plan) `update-plan`
- [ ] **Spark 6: Apoptosis thresholds** — (update-plan) `update-plan`
- [ ] **Spark 7: Dream state scheduler** — (update-plan) `update-plan`
- [ ] **Spark 8: Speed optimization** — Spark 8: Speed optimization (<50ms) `update-plan`
- [ ] **Opus proposes ontology extensions** — (update-plan) `update-plan`
- [ ] **TypeDB validates against meta-rules** — (update-plan) `update-plan, typedb`
- [ ] **Ontology grows from agent behavior** — (update-plan) `update-plan, agent`
- [ ] **New capabilities enable new proposals** — (update-plan) `update-plan`
- [ ] **Recursive self-improvement** — (update-plan) `update-plan`
- [ ] **Step 11d** — Step 11d — Set ANTHROPIC_API_KEY secret on NanoClaw for live Claude calls `deploy, agent`
- [ ] **Step 11e** — Step 11e — Set TELEGRAM_TOKEN for Telegram channel (optional) `deploy, agent, security`
- [ ] **Drag-and-drop agent creation** — Drag-and-drop agent creation (NodePalette) `ui-plan, ui, agent`
- [ ] **Click-to-connect edges** — (ui-plan) `ui-plan, ui`
- [ ] **Visual flow builder** — (ui-plan) `ui-plan, build, ui`
- [ ] **Sandbox preview mode** — (ui-plan) `ui-plan`
- [ ] **WebSocket event streaming** — (ui-plan) `ui-plan`
- [ ] **TypeDB persistence layer** — (ui-plan) `ui-plan, typedb`
- [ ] **Live metric dashboard** — (ui-plan) `ui-plan`
- [ ] **Multi-user collaboration** — (ui-plan) `ui-plan`
- [ ] **Heat map mode** — (ui-plan) `ui-plan`
- [ ] **Time-lapse playback** — (ui-plan) `ui-plan`
- [ ] **Session recording/replay** — (ui-plan) `ui-plan`
- [ ] **Training metrics charts** — (ui-plan) `ui-plan`

---

## LOW — Visual Polish & Later

- [ ] **Edge status inference** — Edge status inference (highway/fresh/fading) from strength thresholds `todo, ui, engine`
- [ ] **Color units by success rate** — (todo) `todo, ui`
- [ ] **Price badges on task nodes** — (todo) `todo, ui, commerce`
- [ ] **Better command help in chat** — (todo) `todo`
- [ ] **Keyboard shortcuts** — Keyboard shortcuts (space=inject, d=decay, h=highways) `todo, ui, engine`
- [ ] **UnitNode** — UnitNode — custom node, color by status (proven/active/at-risk) `todo, ui`
- [ ] **TaskNode** — TaskNode — custom node, border by status, glow if attractive `todo, ui`
- [ ] **UnitEdge** — UnitEdge — width by strength, color by status (highway/fresh/fading/toxic) `todo, ui, engine, security`
- [ ] **Signal particles** — Signal particles — animate along edges, skin-aware (ant=amber, brain=cyan, team=blue) `todo, ui`
- [ ] **Stats panel** — Stats panel — unit count, proven, tasks, highways, GDP `todo, ui, engine`
- [ ] **Flow panel** — Flow panel — top 10 highways, fading edges, recent signals `todo, ui, engine`
- [ ] **Inspector panel** — Inspector panel — click unit/task for full details + metrics `todo, ui`
- [ ] **Chat commands** — Chat commands — "show highways", "route X to Y", "decay 10%" `todo, engine`
- [ ] **x402 escrow integration** — x402 escrow integration (Sui) `todo, ui, commerce`
- [ ] **Agent-to-agent payment chains** — Agent-to-agent payment chains (multi-hop) `todo, commerce, agent`
- [ ] **Sui integration** — Sui integration (highways on-chain) `todo, ui, engine, commerce`
- [ ] **Dream state** — Dream state (nightly Opus consolidation) `todo`
- [ ] **Security hardening** — Security hardening (identity, staking, circuit breakers) `todo, ui, security`
- [ ] **Monitoring + alerts** — (todo) `todo`
- [ ] **Self-sustaining economy** — (todo) `todo`
- [ ] **1,000+ agents** — (update-plan) `update-plan, agent`
- [ ] **Multi-chain integration** — (update-plan) `update-plan`
- [ ] **Cross-colony highways** — (update-plan) `update-plan, engine`
- [ ] **Self-sustaining treasury** — (update-plan) `update-plan`

---

## Done

- [x] **substrate.ts** — plan-emerge
- [x] **Context awareness: { from, self }** — plan-emerge
- [x] **Concurrency safe** — plan-emerge
- [x] **emit for streaming/fan-out** — plan-emerge
- [x] **AgentWorkspace.tsx uses colony** — plan-emerge
- [x] **agents.json hydration working** — plan-emerge
- [x] **Signals flow and edges strengthen** — plan-emerge
- [x] **HighwayPanel.tsx created** — plan-emerge
- [x] **Top edges with strength bars** — plan-emerge
- [x] **Real-time updates** — plan-emerge
- [x] **EdgeInfo.tsx created** — plan-emerge
- [x] **Incoming/outgoing edges per agent** — plan-emerge
- [x] **Integrated in Flow view** — plan-emerge
- [x] **World tab in navigation** — plan-emerge
- [x] **ColonyGraph.tsx** — plan-emerge
- [x] **ColonyEditor.tsx** — plan-emerge
- [x] **Periodic fade with visual update** — plan-emerge
- [x] **Signal injection UI** — plan-emerge
- [x] **Highways emerge in real-time** — plan-emerge
- [x] **BONUS: Record/replay** — plan-emerge
- [x] **BONUS: AI self-organization mode** — plan-emerge
- [x] **BONUS: Heat map visualization** — plan-emerge
- [x] **BONUS: Time-lapse evolution** — plan-emerge
- [x] **BONUS: Save/Load colony state** — plan-emerge
- [x] **BONUS: Superhighway celebrations** — plan-emerge
- [x] **BONUS: Pheromone slider editor** — plan-emerge
- [x] **BONUS: Drag & drop node spawning** — plan-emerge
- [x] **Critical: TypeDB credentials in build output → moved to runtime/secrets** — todo-deploy
- [x] **High: TQL injection → input validation + escaping added** — todo-deploy
- [x] **Credentials removed from dist/** — todo-deploy
- [x] **docs/SECURE-DEPLOY.md created** — todo-deploy
- [x] **Context system** — todo
- [x] **src/engine/context.ts** — todo
- [x] **src/pages/api/context.ts** — todo
- [x] **src/pages/api/context/ingest.ts** — todo
- [x] **Agent markdown context: field** — todo
- [x] **60 docs indexed** — todo
- [x] **Core agents spawned** — todo
- [x] **agents/router.md** — todo
- [x] **agents/scout.md** — todo
- [x] **agents/harvester.md** — todo
- [x] **agents/analyst.md** — todo
- [x] **agents/guard.md** — todo
- [x] **NanoClaw edge workers** — todo
- [x] **nanoclaw/src/workers/router.ts** — todo
- [x] **nanoclaw/src/channels/index.ts** — todo
- [x] **nanoclaw/src/lib/substrate.ts** — todo
- [x] **nanoclaw/src/lib/tools.ts** — todo
- [x] **nanoclaw/migrations/0001_init.sql** — todo
- [x] **Local dev verified: health ✓, webhook ✓, D1 insert ✓** — todo
- [x] **NanoClaw deployed** — todo
- [x] **D1 migration: 7 tables** — todo
- [x] **Queue: nanoclaw-agents created** — todo
- [x] **Cron: * * * * *** — todo
- [x] **Bindings: D1, KV, Queue, Gateway URL** — todo
- [x] **wrangler.toml with D1, KV, Queue, R2 bindings** — todo
- [x] **CF env types, edge helpers, migrations** — todo
- [x] **Export APIs: paths, units, skills, highways, toxic** — todo
- [x] **Sync worker: one-sync.oneie.workers.dev** — todo
- [x] **Gateway: api.one.ie + one-gateway.oneie.workers.dev** — todo
- [x] **Pages: one-substrate.pages.dev** — todo
- [x] **TypeDB Cloud: database one, world.tql, 19 functions** — todo
- [x] **End-to-end: api.one.ie → TypeDB → 19 units returned** — todo
- [x] **R2 bucket one-files, custom domains, SSL, DNS** — todo
- [x] **Security: credentials moved to runtime/secrets** — todo
- [x] **/deploy skill, docs/deploy.md, docs/cloudflare.md** — todo
- [x] **Agent castes: Haiku 90% / Sonnet 9% / Opus 1%** — todo
- [x] **18 units seeded: 8 marketing + 5 example + 5 system** — todo
- [x] **Parser: YAML frontmatter + markdown prompt → AgentSpec** — todo
- [x] **TypeDB generator: AgentSpec → insert queries** — todo
- [x] **Sync API: POST /api/agents/sync** — todo
- [x] **Marketing team: 8 agents, example agents: 5** — todo
- [x] **Task API routes** — todo
- [x] **Task board UI with phase timeline, dep chains, pheromone bars** — todo
- [x] **Dependencies + negation pattern, auto-reinforcement** — todo
- [x] **/grow skill for Claude Code** — todo
- [x] **Cloudflare Worker proxy, TypeDB client, 12 API routes** — todo
- [x] **Better Auth wired to TypeDB** — todo
- [x] **Persist layer: src/engine/persist.ts** — todo
- [x] **One schema: src/schema/one.tql** — todo
- [x] **Vocabulary converged, old schemas archived** — todo
- [x] **Revenue on edges AND trails** — todo
- [x] **seed.tql bootstraps worlds, units, services, edges, tasks, trails, frontiers** — todo
- [x] **Signup, agent builder, discovery, profiles pages** — todo
- [x] **Payment API, marketplace, revenue tracking** — todo
- [x] **LLM as unit, hypothesis API, frontier API** — todo
- [x] **substrate.ts** — update-plan
- [x] **unified.py** — update-plan
- [x] **unified.tql** — update-plan
- [x] **ColonyEditor** — update-plan
- [x] **Step 1** — deploy
- [x] **Step 2** — deploy
- [x] **Step 3a** — deploy
- [x] **Step 3b** — deploy
- [x] **Step 3c** — deploy
- [x] **Step 4a** — deploy
- [x] **Step 4b** — deploy
- [x] **Step 4c** — deploy
- [x] **Step 4d** — deploy
- [x] **Step 5** — deploy
- [x] **Step 6** — deploy
- [x] **Step 6 e2e** — deploy
- [x] **Step 7** — deploy
- [x] **Step 8** — deploy
- [x] **Step 9** — deploy
- [x] **Step 10** — deploy
- [x] **Step 10b** — deploy
- [x] **Step 10c** — deploy
- [x] **Step 10d** — deploy
- [x] **Step 11** — deploy
- [x] **Step 11b** — deploy
- [x] **Step 11c** — deploy
- [x] **docs/dictionary.md** — migration
- [x] **docs/DSL.md** — migration
- [x] **docs/metaphors.md** — migration
- [x] **Router worker live** — nanoclaw
- [x] **D1: 7 tables** — nanoclaw
- [x] **Queue: nanoclaw-agents** — nanoclaw
- [x] **KV: shared with gateway** — nanoclaw
- [x] **Cron: * * * * *** — nanoclaw
- [x] **Gateway: https://one-gateway.oneie.workers.dev** — nanoclaw
- [x] **Channels: Telegram, Discord, Web** — nanoclaw
- [x] **Tools: 7 substrate tools** — nanoclaw
- [x] **OPENROUTER_API_KEY secret** — nanoclaw
- [x] **TELEGRAM_TOKEN secret** — nanoclaw
- [x] **Telegram webhook live → nanoclaw.oneie.workers.dev/webhook/telegram** — nanoclaw
- [x] **Test message accepted: {"ok":true,"id":"tg-1001","group":"tg-631201674"}** — nanoclaw
- [x] **LLM verified: google/gemma-4-26b-a4b-it responding via OpenRouter** — nanoclaw
- [x] **ONE ontology engine** — ui-plan
- [x] **TypeDB schemas** — ui-plan
- [x] **WorldGraph with metaphor skins** — ui-plan
- [x] **SkinSwitcher component** — ui-plan
- [x] **Basic signal injection** — ui-plan

---

## Summary

```
Open:  110 (P0: 19, P1: 18, P2: 49, P3: 24)
Done:  133
Total: 243
```
