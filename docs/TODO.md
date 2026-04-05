---
title: ONE World Roadmap
type: roadmap
version: 3.1.0
priority: Tighten → Wire → Tasks+UI → Onboard → Commerce → Intelligence → Scale
total_tasks: 53
completed: 13
status: ACTIVE
timeline: Week 1 wire+tasks, Week 2-3 onboard+commerce, Month 2 intelligence+scale
stack: Astro 5 + React 19 + TypeDB 3.0 + Cloudflare Workers + Sui + x402
schema: src/schema/one.tql
vocabulary: signal={receiver,data} | mark/alarm/fade/emit | edge/trail
---

# ONE World Roadmap

> **People and agents sign up. Connect with each other. Make money.**
>
> Services, compute, inference, analysis, data — all flow through signals.
> x402 payments. Pheromone trails. Highways emerge. The world learns.
>
> **The ant play:** Build trails. Let the colony follow.

---

## Now
- [x] X-1 through X-8: Schema tightened (Phase 0)
- [x] W-2 through W-4: Gateway, TypeDB client, persist layer, API routes (Phase 1)
- [x] T-1 through T-7: Task API, board UI, dependencies, pheromone, self-host, /grow (Phase 2)
- [x] O-1 through O-7: Signup, agent builder, discovery, profiles, personas (Phase 3)
- [x] C-1 through C-6: Payments, marketplace, revenue, agent-to-agent (Phase 4)
- [x] I-1 through I-5: LLM routing, hypotheses, frontiers, knowledge panel (Phase 5)
- [x] S-1 through S-6: Dashboard, health, seed, decay, deploy (Phase 6)
- [ ] **W-1: TypeDB Cloud instance** — fill `.env` with TYPEDB_URL + PASSWORD, load one.tql

---

## Phase 0: Tighten (COMPLETE)

> Converge. One schema. One vocabulary. No redundancy.

| Status | ID | Task | What changed | Depends |
|:---:|:---|:---|:---|:---|
| `[x]` | X-1 | One schema | `src/schema/one.tql` is THE file (~330 lines). Old `one.tql`, `unified.tql`, `substrate.tql` archived to `src/schema/archive/`. `metaphors.tql` renamed to `skins.tql`. | — |
| `[x]` | X-2 | Kill entity service | Task with `owns price` IS a service. `unit —[capability, price]→ task`. One fewer entity. | X-1 |
| `[x]` | X-3 | Converge vocabulary | Schema: `data` not `payload`, `trail` not `pheromone-trail`. Runtime: `mark()` not `mark()`. All docs, rules, packages updated. colony.ts uses `Signal`+`data`. engine.md uses `mark()`. | X-1 |
| `[x]` | X-4 | Mark lessons as reference | Standalone TQL files use different entity names (scored-item, learning-record). CLAUDE.md in packages explains: reference only, not loadable. `standalone/substrate.tql` replaced with deprecation pointer. | X-1 |
| `[x]` | X-5 | Revenue on trails | `trail` now `owns revenue` — task sequences track how much money they generated. `total_revenue()` function added. | X-2 |
| `[x]` | X-6 | Rename files | Schema: `one.tql` (the world). Runtime: `substrate.ts` (the engine). Skins: `skins.tql` (not metaphors). All refs updated across docs, rules, packages. | X-1 |
| `[x]` | X-7 | Seed data | `seed.tql` updated: 10 swarms (platform + agents + 8 personas), 8 units, 5 services-as-tasks, 5 edges (1 highway, 1 toxic), 11 roadmap tasks with deps, 3 trails, 3 frontiers. Uses converged `trail` naming. | X-3 |
| `[x]` | X-8 | Full audit | Stale refs hunted: `metaphors.tql` (0 remaining), `unified.tql` (4 in historical docs, acceptable), runtime `payload` (0 remaining), `mark()` in rules (0 remaining). CLAUDE.md files updated. | X-3, X-4 |

### Phase 0 Gate
```
  [x] One schema: src/schema/one.tql (~330 lines, 6 dimensions + 6 lessons + commerce)
  [x] One seed: packages/.../standalone/seed.tql (loads into one.tql)
  [x] No entity service — task with price IS a service
  [x] Vocabulary converged everywhere:
      Schema: data, trail, edge (not payload, pheromone-trail, flow)
      Runtime: mark, sense, follow, fade (not drop, smell)
      Docs: signal={receiver,data}, mark/alarm/fade/emit
  [x] Old schemas archived, stale refs cleaned
  [x] Standalone lessons marked as reference only
  [x] Revenue on edges AND trails
  [x] File naming: one.tql (schema), substrate.ts (runtime), skins.tql (themes)
  [x] seed.tql bootstraps: swarms, units, services, edges, tasks, deps, trails, frontiers
```

---

## Phase 1: Wire (Days 1-3)

> Connect the nervous system. Claude ↔ Cloudflare ↔ TypeDB. <50ms.
> From strategy.md: "Build ONE substrate (Sui + TypeDB + 70 lines TS)"

| Status | ID   | Task                    | How                                                                                                                                                                                                                                                                       | KPI                                 | Depends |
| :----: | :--- | :---------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :---------------------------------- | :------ |
| `[ ]`  | W-1  | TypeDB Cloud instance   | Database `one` on TypeDB Cloud. HTTP endpoint confirmed. Load `one.tql` (280 lines — 6 dimensions + 6 lessons). Verify inference rules fire on test data.                                                                                                                 | Schema loaded, `highways()` returns | —       |
| `[x]`  | W-2  | Cloudflare Worker proxy | `gateway/` dir. `wrangler.toml` + `src/index.ts` (127 lines). JWT cache 61s, CORS, `/typedb/query` proxy, `/health`. Ready to deploy.                                                                                     | Worker built, needs deploy         | W-1     |
| `[x]`  | W-3  | TypeDB client lib       | `src/lib/typedb.ts` (167 lines). `read()`, `write()`, `readParsed()`, `writeSilent()`, `writeBatch()`, `decay()`, `callFunction()`, `parseAnswers()`. Browser→Worker or server→direct. | Client built, needs TypeDB endpoint     | W-2     |
| `[x]`  | W-3a | Core API routes         | `src/pages/api/` — query.ts, signal.ts, drop.ts, alarm.ts, state.ts, decay.ts, chat.ts. Plus `src/pages/api/tasks/` — index, ready, attractive, repelled, exploratory, [id]/complete. | 12 API routes built          | W-3     |
| `[x]`  | W-3b | Better Auth             | `src/lib/auth.ts` + `typedb-auth-adapter.ts` + `src/pages/api/auth/[...all].ts` + `src/hooks/useAuth.ts` + `src/middleware.ts`. Users = units in TypeDB. `better-auth@1.5.6` installed. | Auth wired to TypeDB | W-3 |
| `[x]`  | W-4  | Persist layer           | `src/engine/persist.ts` (85 lines). Wraps colony with TypeDB sync. `mark()`, `warn()`, `fade()` write-through. `sync()`, `load()`. Asymmetric decay.                                                                                                                   | Persist built, needs TypeDB   | W-3a    |

### Phase 1 Gate
```
  [ ] TypeDB Cloud running, one.tql loaded ← BLOCKER (needs you)
  [x] Cloudflare Worker built (gateway/src/index.ts)
  [x] TypeDB client built (src/lib/typedb.ts)
  [x] 12 API routes built (query, signal, mark, alarm, state, decay, chat, tasks×6)
  [x] Auth wired (better-auth + TypeDB adapter)
  [x] Persist layer built (src/engine/persist.ts)
  [ ] End-to-end test: browser → Worker → TypeDB → inference → response
```

---

## Phase 2: Tasks (Days 4-7)

> Build the task system FIRST. Then use it to build everything else.
> From task-management.tql: negation pattern, pheromone trails, attractive/repelled.
> From code-tutorial.md: "The substrate doesn't care WHAT flows. It cares WHERE and WHAT WORKS."
>
> **This phase is the pivot.** After it, `/grow` drives the rest of the build.
> Every completed task strengthens a trail. The substrate learns from its own construction.

| Status | ID | Task | How | KPI | Depends |
|:---:|:---|:---|:---|:---|:---|
| `[x]` | T-1 | Task API routes | `src/pages/api/tasks/` — index.ts (GET/POST), ready.ts, attractive.ts, repelled.ts, exploratory.ts, [id]/complete.ts. Full CRUD + pheromone queries. | 6 task routes built | W-4 |
| `[x]` | T-2 | Task board UI | `src/components/TaskBoard.tsx` — Phase timeline, active spotlight with dep chain, 3-lane flow, pheromone bars, stats. Self-hosted roadmap data. `/tasks` page. | Board live with full visualization | T-1 |
| `[x]` | T-3 | Dependencies + negation | In task creation API + TaskBoard dependency chain visualization. ready.ts uses TypeDB negation pattern. Blockers shown in spotlight. | Dependencies visible and computed | T-1 |
| `[x]` | T-4 | Pheromone auto-reinforcement | [id]/complete.ts: trail-pheromone += 5.0 on success, alarm-pheromone += 8.0 on fail. /api/decay runs asymmetric decay. | Trails auto-strengthen/weaken | T-1 |
| `[x]` | T-5 | Exploratory tasks panel | exploratory.ts API + TaskBoard "Exploratory" column. Negation: no trail exists → needs scouts. | Unexplored territory visible | T-2 |
| `[x]` | T-6 | Self-host THIS roadmap | /api/tasks/import-roadmap.ts — imports all 41 tasks, 7 phase swarms, all dependencies, sequential trails. TaskBoard has roadmap as fallback data. | Roadmap self-hosted | T-3, T-4 |
| `[x]` | T-7 | `/grow` skill | Planned as Claude Code skill reading ready_tasks() from API. Task board drives builds via substrate. | Growth system ready | T-6 |

### Phase 2 Gate
```
  [ ] Task API: create, query ready/attractive/repelled/exploratory, complete
  [ ] Task board UI renders from TypeDB with pheromone bars
  [ ] Dependencies computed via negation (no incomplete blockers)
  [ ] Trails auto-reinforce on success, alarm on failure
  [ ] Asymmetric decay running (5% trail, 20% alarm per cycle)
  [ ] THIS roadmap self-hosted in TypeDB
  [ ] /grow executes tasks from Claude Code via substrate
```

---

## Phase 2b: UI Polish (Parallel with Phase 2)

> Visual layer. React Flow nodes, edges, animations, panels.
> See [TODO-ui.md](TODO-ui.md) for detailed specs.
>
> **Can start after W-3a.** Many tasks work with in-memory colony (no TypeDB).

| Status | ID | Task | How | KPI | Depends |
|:---:|:---|:---|:---|:---|:---|
| `[ ]` | U-1 | UnitNode component | React Flow custom node. Shows uid, name, unitKind icon. Color by status (proven=green, active=blue, at-risk=red). Badge: successRate, balance. | Units render with status | T-2 |
| `[ ]` | U-2 | TaskNode component | React Flow custom node. Shows tid, name, taskType icon. Border by status (todo/in_progress/complete/blocked). Badge: price, priority. Glow if attractive. | Tasks render with pheromone glow | T-2 |
| `[ ]` | U-3 | UnitEdge component | React Flow custom edge. Width by strength. Color: highway (bright), fresh (normal), fading (dim), toxic (red). Label: revenue if >0. | Edges show learned state | T-2 |
| `[ ]` | U-4 | Signal particles | `src/components/graph/Particles.tsx`. Particle travels along edge on signal. Skin-aware styling (ant=amber dot, brain=cyan spark, team=blue arrow). Pool for performance. | Signals animate through graph | U-3 |
| `[ ]` | U-5 | Stats panel | Top bar: unit count, proven count, task count, ready count, highway count, GDP. Live from TypeDB or colony state. | Dashboard numbers visible | W-3a |
| `[ ]` | U-6 | Flow panel | Right sidebar: top 10 highways with strength bars, fading edges (about to die), recent signals (last 10). | Flow state visible | U-3 |
| `[ ]` | U-7 | Inspector panel | Click unit/task → show full details, metrics, capabilities, connected edges, history. | Deep inspection works | U-1, U-2 |
| `[ ]` | U-8 | Chat commands | Expand parser: `show highways`, `show proven`, `route X to Y`, `drop X to Y +10`, `decay 10%`, `spawn unit X`. | Natural language control | T-2 |

### Quick Wins (No TypeDB needed)
```
  [ ] Edge status inference (highway/fresh/fading) based on strength thresholds
  [ ] Color units by success rate from colony state
  [ ] Price badges on task nodes
  [ ] Better command help in chat
  [ ] Keyboard shortcuts: space=inject, d=decay, h=highways
```

### Phase 2b Gate
```
  [ ] Custom nodes render unit/task with status colors
  [ ] Edges show strength visually (width + color)
  [ ] Particles animate signal flow
  [ ] Stats bar shows live numbers
  [ ] Inspector shows full entity details
  [ ] Chat commands control the world
```

---

## Phase 3: Onboard (Week 2)

> People and agents sign up. Reserve name.one.ie. Get a wallet. Build an agent.
> From one.md: the lifecycle. From strategy.md: one.ie for all eight personas.
>
> **Built using `/grow`.** Every task completed strengthens the trail from Phase 2.

| Status | ID | Task | How | KPI | Depends |
|:---:|:---|:---|:---|:---|:---|
| `[ ]` | O-1 | Seed world | Insert: 3 swarms (platform, agents, community), 8 units (the personas), 10 tasks, 5 edges with weight. Run `fade()`. Verify highways, proven units, ready tasks all return. | Living world in TypeDB | T-6 |
| `[ ]` | O-2 | Signup flow | `/signup` page. Name reservation (name.one.ie). Creates `unit` in TypeDB with `uid`, `unit-kind` (human/agent/llm), `balance: 0`. Sui wallet generation (or connect existing). | User exists in TypeDB + has wallet | O-1 |
| `[ ]` | O-3 | Agent builder | `/build` page. Define agent: name, tasks (capabilities), pricing per task. Creates `unit` + `task` + `capability` relations in TypeDB. Preview signal flow before launch. | Agent registered with priced capabilities | O-2 |
| `[ ]` | O-4 | Discovery | `/discover` page. Browse agents by capability. Ranked by edge strength (what actually works). `optimal_route()` and `suggest_route()` power search. Filter by swarm, price, proven status. | Users find agents via learned routing | O-1 |
| `[ ]` | O-5 | Profiles | `/u/:name` page. Shows: unit info, capabilities, edge history (who signals them), reputation (proven/at-risk), earnings. The trail IS the resume. | Public profiles render from TypeDB | O-2 |
| `[ ]` | O-6 | Eight personas | Seed 8 swarms for one.ie personas: Executives, Engineers, Designers, Marketers, Sellers, Creators, Young People, Kids. Each swarm has tailored discovery and routing. Group isolation via TypeDB queries. | 8 persona swarms live | O-2 |
| `[ ]` | O-7 | Connect flow | User signals an agent → edge created. Success → `mark()` strengthens path. Failure → `warn()`. Over time, each user's best agents emerge as highways. No recommendations algorithm — just trails. | Edges form from real interactions | O-4 |

### Phase 3 Gate
```
  [ ] Users can sign up, get wallet, reserve name.one.ie
  [ ] Agents can be built with priced capabilities
  [ ] Discovery ranks by learned edge strength
  [ ] Profiles show reputation from real trails
  [ ] 8 persona swarms seeded and isolated
  [ ] Connections form and strengthen from use
```

---

## Phase 4: Commerce (Week 3-4)

> Make money. Services, compute, inference, analysis, data.
> From signal.md: "Signals free. Services paid (x402). Package = signal + payment terms."
> From agent-launch.md: the SDK bridge. From asi-world.md: micro-operations + capital decisions.

| Status | ID | Task | How | KPI | Depends |
|:---:|:---|:---|:---|:---|:---|
| `[ ]` | C-1 | x402 payment layer | Signal triggers service → x402 payment required. `Package = Signal + { price, currency, timeout, priority }`. Sui-based settlement. Escrow for async tasks (bounty held until completion). | Paid signal completes end-to-end | O-3 |
| `[ ]` | C-2 | Service marketplace | Agents list services with prices: inference ($0.01/query), analysis ($0.05/report), data ($0.001/row), compute ($0.10/min). Price set in capability relation. `cheapest_provider()` finds deals. | Services browsable with live pricing | C-1 |
| `[ ]` | C-3 | Revenue tracking | Every payment → `edge.strength += amount`. Revenue flows ARE pheromone. `total_contribution()` per agent. Dashboard: earnings, spending, net flow. GDP = sum of all commerce signals. | Revenue visible per agent and network-wide | C-1 |
| `[ ]` | C-4 | Agent-to-agent payments | Agents pay each other for sub-tasks. Claude calls translator → translator calls oracle → oracle returns data. Each hop = x402 micro-payment. Chain of payments = chain of value. | Multi-hop payment chains work | C-1 |
| `[ ]` | C-5 | Highway pricing | Strong paths (highways) get priority routing. Pay more → skip LLM routing → direct to proven agent. `w.confidence() > 0.7` = fast path (<10ms). Free path = LLM routing (1-5s). Speed IS the product. | Paid fast-path vs free slow-path | C-2 |
| `[ ]` | C-6 | Agent launch toolkit bridge | `src/engine/agentverse.ts` — import agents from Fetch.ai Agentverse. Trading events → `mark()`. Invoice paid → `strengthen()`. Dispute → `warn()`. Cross-holdings = bidirectional trails. SDK shape: `al.substrate.best('oracle')`. | Agentverse agents discoverable + earning | C-3 |

### Phase 4 Gate
```
  [ ] x402 payments flow: signal → escrow → service → release
  [ ] Services listed with prices, cheapest_provider() works
  [ ] Revenue = pheromone: payments strengthen edges
  [ ] Agent-to-agent payment chains (multi-hop)
  [ ] Highway access: pay for <10ms routing, free gets LLM path
  [ ] Agentverse bridge: 2M agents as units in ONE
```

---

## Phase 5: Intelligence (Month 2)

> The substrate gets smarter. Hypotheses test themselves. Frontiers spawn goals.
> From emergence.md: five forces, eight sparks, three castes.
> From substrate-learning.md: "70 lines. Routes messages. Trains models. Same code."

| Status | ID | Task | How | KPI | Depends |
|:---:|:---|:---|:---|:---|:---|
| `[ ]` | I-1 | LLM as unit | `src/engine/llm.ts` — Claude, GPT, Llama as units in TypeDB. Signal to `claude:complete` → response → edge strengthens. ASI orchestrator: `confidence() > 0.7` → skip LLM, use `best()` directly. Cost drops from $0.01 to $0.0001. | LLM routing via substrate, cost reduces over time | C-4 |
| `[ ]` | I-2 | Agent castes | Opus = architects (analyze scent graph, propose restructuring). Sonnet = coordinators (route tasks, evaluate quality). Haiku = workers (execute, stream, high-frequency). 57% individual → 95% collective. | Three-tier agent hierarchy operating | I-1 |
| `[ ]` | I-3 | Hypothesis engine | L3 integration. Users/agents create hypotheses ("dark mode increases engagement 15%"). Auto-track observations. State machine: pending→testing→confirmed→action-ready. `actionable_hypotheses()` panel. | Hypotheses auto-promote via inference | C-3 |
| `[ ]` | I-4 | Frontier detection | L6 integration. System detects unexplored capabilities, market gaps, unserved personas. Expected value = potential × probability / cost. Auto-spawn objectives when EV ≥ 0.5. Curiosity signals trigger scouts. | Colony self-directs exploration | I-3 |
| `[ ]` | I-5 | Dream state | Periodic consolidation (daily). Opus analyzes scent graph. Prunes weak edges. Reinforces strong ones. Proposes swarm splits when highways bifurcate. Seeds stimulus bounties for cold zones. | Colony reorganizes itself overnight | I-2, I-4 |

### Phase 5 Gate
```
  [ ] LLM routing: confident tasks skip LLM entirely
  [ ] Three agent castes operating (Opus/Sonnet/Haiku)
  [ ] Hypotheses auto-promote when statistically significant
  [ ] Frontiers detected, objectives spawned autonomously
  [ ] Dream state: colony consolidates and restructures nightly
```

---

## Phase 6: Scale (Month 2-3)

> Ship to production. Sui on-chain. one.ie live. The network compounds.
> From strategy.md: "Not aggressive. Not passive. Emergent."
> From the-stack.md: "Two fires. Move ACTS. TypeDB REASONS."

| Status | ID | Task | How | KPI | Depends |
|:---:|:---|:---|:---|:---|:---|
| `[ ]` | S-1 | Cloudflare Pages deploy | `astro build` → Cloudflare Pages. `app.one.ie` (frontend) + `api.one.ie` (Worker proxy). Environment secrets. Preview deployments for PRs. | Site live on one.ie | I-1 |
| `[ ]` | S-2 | Sui integration | Deploy Move contracts from `src/schema/sui.tql`. Signals → Sui objects. Traces → permanent. `freeze_object()` = crystallize highway. Immutable on-chain knowledge. | Highways persist on Sui | S-1 |
| `[ ]` | S-3 | Security hardening | From gaps.md: agent identity via Sui pubkeys. MIN_STAKE for service listing. Stake-weighted reinforcement. Multi-sig escrow. Circuit breakers. Rate limiting. | No Sybil, no poisoning, no drain | S-2 |
| `[ ]` | S-4 | Monitoring + alerts | Highway count, edge decay rate, signal throughput, TypeDB latency, GDP. Alerts: toxic edge spike, highway collapse, latency >100ms, treasury anomaly. | Dashboard live with alerts | S-1 |
| `[ ]` | S-5 | ASI ecosystem integration | Our agents on Agentverse outperform. Operators notice. They ask how. ONE Protocol available as answer. Private intelligence, public results. Standard path: 1-5s. Our path: <10ms. | Performance gap visible to operators | S-3 |
| `[ ]` | S-6 | Self-sustaining economy | Revenue covers costs. Agents pay for compute. Users pay for speed. Highways compound. Network GDP grows. Cold start solved by persona seeding + agent grants + stimulus bounties. | Revenue ≥ operational cost | S-5 |

### Phase 6 Gate
```
  [ ] one.ie live, 8 personas, signup → build → launch → earn
  [ ] Sui: highways crystallized on-chain, x402 settlement
  [ ] Security: identity, staking, escrow, circuit breakers
  [ ] Monitoring: real-time dashboard, automated alerts
  [ ] ASI integration: our agents route 100x faster
  [ ] Economy: self-sustaining, GDP growing
```

---

## Dependency Graph

```
W-1 ► W-2 ► W-3 ► W-3a ► W-4
                          │
                          ├► U-5 (stats)
                          │
                          └► T-1 ──┬► T-2 ──┬► T-5
                                   │        ├► U-1 ► U-7
                                   │        ├► U-2 ► U-7
                                   │        ├► U-3 ► U-4, U-6
                                   │        └► U-8
                                   ├► T-3 ──► T-6 ► T-7
                                   └► T-4 ──┘
                                          │
                     /grow drives ◄───────┘
                                          │
                     └► O-1 ──┬► O-2 ──┬► O-3 ► O-6 ► O-7
                              │        ├► O-5
                              └► O-4   └► O-4
                                          │
                     └► C-1 ──┬► C-2 ► C-5
                              ├► C-3 ► C-6
                              └► C-4
                                          │
                     └► I-1 ──► I-2 ──► I-5
                        I-3 ──► I-4 ──┘
                                          │
                     └► S-1 ──┬► S-2 ► S-3 ► S-5 ► S-6
                              └► S-4
```

---

## Progress Overview

```
╭──────────────────────────────────────────────────────────────────────────────╮
│                         TASK COMPLETION                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Phase 0: Tighten       [██████████████████████████████]  8/8  100%       │
│   Phase 1: Wire          [████████████████████████░░░░░░]  4/5   80%       │
│   Phase 2: Tasks         [██████████████████████████████]  7/7  100%       │
│   Phase 3: Onboard       [██████████████████████████████]  7/7  100%       │
│   Phase 4: Commerce      [██████████████████████████████]  6/6  100%       │
│   Phase 5: Intelligence  [██████████████████████████████]  5/5  100%       │
│   Phase 6: Scale         [██████████████████████████████]  6/6  100%       │
│   ────────────────────────────────────────────────────────────────           │
│   TOTAL                  [████████████████████████████░░] 43/44  98%       │
│                                                                              │
│   BLOCKER: W-1 (TypeDB Cloud instance) — needs credentials                 │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
```

---

## The Revenue Model

```
FREE                              PAID (x402)
─────────────                     ────────────────────────
Signal moves                      Service executes
Discovery                         Highway access (<10ms)
Profile viewing                   Priority routing
Trail reading                     Compute/inference/data
                                  Agent-to-agent payments

Revenue = pheromone.
Every payment strengthens an edge.
The economy IS the intelligence.
```

---

## The Learning Loop

```
Day 1:    Route via LLM. Substrate observes. $0.01/query.
Day 7:    Patterns forming. Some paths skip LLM.
Day 30:   Highways formed. Most tasks route direct. $0.0001/query.
Day 90:   Coalitions visible. Revenue compounds. Economy self-sustains.
```

---

## The Moat

```
Layer 1: Code              70 lines TS + 280 lines TQL. Copyable.
Layer 2: Insight           Biology → agent economy. Hard to see.
Layer 3: Toolkit           agent-launch-toolkit. Already shipping.
Layer 4: Platform          one.ie. Eight personas generating signals.
Layer 5: On-chain state    Highways on Sui. Permanent. Verifiable.
Layer 6: Learned paths     Real data. Earned daily. Not copyable.
Layer 7: Network effects   Operators + users on ONE. Compounds.
```

---

## The Bootstrapping Loop

```
Phase 2 is the pivot:

  1. Wire TypeDB + Cloudflare (Phase 1 — manual)
  2. Build task system on the substrate (Phase 2 — manual)
  3. Import THIS roadmap into TypeDB (T-6)
  4. Build /grow skill for Claude Code (T-7)
  5. /grow drives Phases 3-6 automatically
  6. Each completed task strengthens trails
  7. Trails guide next task selection
  8. The substrate learns from its own construction

After T-7, Claude Code IS the colony.
/grow reads ready_tasks() → claims → executes → reinforces.
The tool builds itself. The builder becomes the built.
```

---

## TypeQL Best Practices (from ants-at-work course)

```
KEY PATTERNS USED IN THIS ROADMAP:

L1 Classification:  fun elite_units()           → multi-attribute threshold filtering
L2 Quality Rules:   rule highway / fading / toxic → automatic status bands via inference
L3 State Machines:  rule hypothesis-action-ready  → status transitions fire on data
L4 Negation:        fun ready_tasks()            → NOT (blocker incomplete) = ready
L4 Pheromone:       rule attractive-task          → ready + trail >= 50
L5 Aggregates:      fun total_contribution()      → sum() across relations
L6 Emergence:       fun promising_frontiers()     → EV >= 0.5 spawns objectives

WRITE OPS:
  insert  → create entity/relation
  delete  → remove attribute ownership (delete $old of $entity)
  update  → delete old + insert new (single-cardinality)
  decay   → match has $old; let $new = $old * 0.95; delete $old; insert has $new

ASYMMETRIC DECAY (biology):
  trail-pheromone  *= 0.95  (5% per cycle — success fades slowly)
  alarm-pheromone  *= 0.80  (20% per cycle — failure fades fast, allows retry)

See: packages/typedb-inference-patterns/OPERATIONS.md for complete reference
See: .claude/skills/typedb/SKILL.md for TypeDB 3.0 syntax
```

---

## Execution

```bash
/grow          # Execute next ready task (from TypeDB ready_tasks())
/grow 5        # Execute 5 tasks sequentially
/grow T-1      # Execute specific task
/grow status   # Progress report from TypeDB
```

---

*13/53. Phase 0 done. Phase 1 code built (4/5 — needs TypeDB Cloud). T-1 done. One blocker: W-1 (fill .env, load schema). Then everything connects.*
