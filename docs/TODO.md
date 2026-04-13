# TODO

> ONE Substrate — self-learning task system.
> Tasks are signals. Waves are loops. The template is a unit.
> 159 open, 71 done. Priority + pheromone adjusts at runtime.
>
> **Sync:** `POST /api/tasks/sync` or `/sync` — writes to KV (10ms), then TypeDB (100ms)
> **Generated:** 2026-04-14T05:25:00
> **Tests:** 178 tests, 174 pass, 4 failing (routing outcome tests), 8 files

---

## Active TODOs

| TODO | Open | Done | Status | Notes |
|------|-----:|-----:|--------|-------|
| [TODO-SUI](TODO-SUI.md) | 30 | 28 | PROVE | Testnet complete, Phase 2 started |
| [TODO-typedb](TODO-typedb.md) | 24 | 4 | PROVE | schema attrs + functions exist |
| [TODO-task-management](TODO-task-management.md) | 26 | 0 | WIRE | contextForSkill exists, wave-runner missing |
| [TODO-rename](TODO-rename.md) | 23 | 0 | WIRE | DSL.md done, no dead names in engine |
| [TODO-testing](TODO-testing.md) | 20 | 14 | PROVE | 178 tests, C2 in progress |
| [TODO-lifecycle](TODO-lifecycle.md) | 18 | 10 | PROVE | register/signal/mark/warn/fade/highway/wallet done |
| [TODO-ONE-strategy](TODO-ONE-strategy.md) | 11 | 3 | PROVE | isToxic + markdown deploy done |
| [TODO-autonomous-orgs](TODO-autonomous-orgs.md) | 7 | 3 | PROVE | Schema + agents + functions exist |
| [TODO-world-page](TODO-world-page.md) | 60+ | 0 | WIRE | Blocked on export API |
| [TODO-deploy](TODO-deploy.md) | 0 | 4 | DONE | All live |
| [TODO-signal](TODO-signal.md) | 0 | 5 | DONE | Complete |
| [TODO-template](TODO-template.md) | — | — | TEMPLATE | |
| [TODO-template 1](TODO-template 1.md) | — | — | TEMPLATE | |

---

## Top 15 by Effective Priority

- [ ] **Build CEO control panel: hire/fire/commend/flag agents** [sonnet] `ui, governance, P0, ceo` ← [TODO-ONE-strategy](TODO-ONE-strategy.md)
  exit: CEO can manage AI agents: delegate tasks, view top performers, flag bad actors
- [ ] **Wire CEO visibility: highways (top 10 performers)** [sonnet] `ui, analytics, P0, ceo` ← [TODO-ONE-strategy](TODO-ONE-strategy.md)
  exit: CEO sees top 10 by net strength (reputation = mark - warn). Arithmetic only.
- [ ] **Implement register(): unit creation with kind and status** [sonnet] `engine, lifecycle, P0` ← [TODO-lifecycle](TODO-lifecycle.md)
  exit: `persist.actor(id, kind, opts)` creates unit with uid, name, unit-kind, status, timestamps. Works for all species.
- [ ] **Implement isToxic() blocking: resistance >= 10 AND resistance > 2× strength** [haiku] `engineering, security, P0, foundation` ← [TODO-ONE-strategy](TODO-ONE-strategy.md)
  exit: Toxic paths auto-blocked, no LLM waste, cost = $0
- [ ] **Build markdown agent deployment: write file, push, live in minutes** [opus] `agent, integration, P0, deployment` ← [TODO-ONE-strategy](TODO-ONE-strategy.md)
  exit: Users write agent.md → /api/agents/sync → live on ONE + AgentVerse
- [ ] **Schema: Add task, task-dependency, task-execution entities to world.tql** [haiku] `typedb, schema, P0, foundation` ← [TODO-autonomous-orgs](TODO-autonomous-orgs.md)
  exit: task, task-dependency, task-execution entities defined in schema
- [ ] **Functions: Write 6 task selection functions (priority, critical-path, bottleneck, etc.)** [sonnet] `typedb, routing, P0, foundation` ← [TODO-autonomous-orgs](TODO-autonomous-orgs.md)
  exit: priority(), critical_path(), bottleneck(), cost(), revenue(), idle() functions in TypeDB
- [ ] **Seed: Insert Phase 1 tasks (marketing, engineering, telegram, dashboard)** [haiku] `typedb, build, P0, foundation` ← [TODO-autonomous-orgs](TODO-autonomous-orgs.md)
  exit: Marketing, engineering, telegram, dashboard tasks seeded in TypeDB
- [ ] **Loop: Modify /api/tick to orchestrate tasks** [sonnet] `api, routing, P0, foundation` ← [TODO-autonomous-orgs](TODO-autonomous-orgs.md)
  exit: /api/tick picks highest-priority task, executes signal, marks outcome
- [ ] **Agents: Create 8 marketing agents (markdown or HTTP)** [sonnet] `agent, marketing, P0, deployment` ← [TODO-autonomous-orgs](TODO-autonomous-orgs.md)
  exit: 8 marketing agents (director, creative, media-buyer, etc.) alive on Telegram
- [ ] **Telegram: Wire signals to @antsatworkbot channel** [sonnet] `agent, telegram, P0, integration` ← [TODO-autonomous-orgs](TODO-autonomous-orgs.md)
  exit: Agents signal @antsatworkbot, channel receives and routes back
- [ ] **Implement capable(): declare unit capabilities** [sonnet] `engine, lifecycle, P0` ← [TODO-lifecycle](TODO-lifecycle.md)
  exit: `persist.capable(unit, skill, price)` creates capability relation. TypeDB function `has_capability(unit, skill)` returns true.
- [ ] **Implement discover(): find units by capability** [sonnet] `engine, lifecycle, P0` ← [TODO-lifecycle](TODO-lifecycle.md)
  exit: `suggest_route(from, skill)` returns units ranked by pheromone. New units appear last. Proven units appear first.
- [ ] **Implement signal lifecycle: route → execute → mark/warn** [opus] `engine, lifecycle, P0` ← [TODO-lifecycle](TODO-lifecycle.md)
  exit: `world.ask()` returns 4 outcomes. Each outcome triggers appropriate mark/warn. Signal logged to TypeDB.
- [ ] **Add DSL + dictionary as base context in every wave** [haiku] `engine, build, P0` ← [TODO-task-management](TODO-task-management.md)
  exit: contextForSkill loads DSL.md + dictionary.md as baseline for all tasks

---

## C1: Foundation

- [ ] **Build CEO control panel: hire/fire/commend/flag agents** — critical=30 + C1=40 + ceo=25 + blocks(1)=5 [sonnet] `ui, governance, P0, ceo` ← [ONE-strategy](TODO-ONE-strategy.md)
  exit: CEO can manage AI agents: delegate tasks, view top performers, flag bad actors
  blocks: ceo-control-live
- [ ] **Wire CEO visibility: highways (top 10 performers)** — critical=30 + C1=40 + ceo=25 + blocks(1)=5 [sonnet] `ui, analytics, P0, ceo` ← [ONE-strategy](TODO-ONE-strategy.md)
  exit: CEO sees top 10 by net strength (reputation = mark - warn). Arithmetic only.
  blocks: ceo-control-live
- [ ] **Implement register(): unit creation with kind and status** — critical=30 + C1=40 + dev=20 + blocks(2)=10 [sonnet] `engine, lifecycle, P0` ← [lifecycle](TODO-lifecycle.md)
  exit: `persist.actor(id, kind, opts)` creates unit with uid, name, unit-kind, status, timestamps. Works for all species.
  blocks: impl-capable, test-lifecycle-gates
- [ ] **Implement isToxic() blocking: resistance >= 10 AND resistance > 2× strength** — critical=30 + C1=40 + dev=20 + blocks(1)=5 [haiku] `engineering, security, P0, foundation` ← [ONE-strategy](TODO-ONE-strategy.md)
  exit: Toxic paths auto-blocked, no LLM waste, cost = $0
  blocks: safety-live
- [ ] **Build markdown agent deployment: write file, push, live in minutes** — critical=30 + C1=40 + dev=20 + blocks(1)=5 [opus] `agent, integration, P0, deployment` ← [ONE-strategy](TODO-ONE-strategy.md)
  exit: Users write agent.md → /api/agents/sync → live on ONE + AgentVerse
  blocks: agent-marketplace-live
- [ ] **Schema: Add task, task-dependency, task-execution entities to world.tql** — critical=30 + C1=40 + dev=20 + blocks(1)=5 [haiku] `typedb, schema, P0, foundation` ← [autonomous-orgs](TODO-autonomous-orgs.md)
  exit: task, task-dependency, task-execution entities defined in schema
  blocks: task-orchestration
- [ ] **Functions: Write 6 task selection functions (priority, critical-path, bottleneck, etc.)** — critical=30 + C1=40 + dev=20 + blocks(1)=5 [sonnet] `typedb, routing, P0, foundation` ← [autonomous-orgs](TODO-autonomous-orgs.md)
  exit: priority(), critical_path(), bottleneck(), cost(), revenue(), idle() functions in TypeDB
  blocks: task-orchestration
- [ ] **Seed: Insert Phase 1 tasks (marketing, engineering, telegram, dashboard)** — critical=30 + C1=40 + dev=20 + blocks(1)=5 [haiku] `typedb, build, P0, foundation` ← [autonomous-orgs](TODO-autonomous-orgs.md)
  exit: Marketing, engineering, telegram, dashboard tasks seeded in TypeDB
  blocks: c1-tasks-live
- [ ] **Loop: Modify /api/tick to orchestrate tasks** — critical=30 + C1=40 + dev=20 + blocks(1)=5 [sonnet] `api, routing, P0, foundation` ← [autonomous-orgs](TODO-autonomous-orgs.md)
  exit: /api/tick picks highest-priority task, executes signal, marks outcome
  blocks: tick-orchestration
- [ ] **Agents: Create 8 marketing agents (markdown or HTTP)** — critical=30 + C1=40 + dev=20 + blocks(1)=5 [sonnet] `agent, marketing, P0, deployment` ← [autonomous-orgs](TODO-autonomous-orgs.md)
  exit: 8 marketing agents (director, creative, media-buyer, etc.) alive on Telegram
  blocks: marketing-dept-live
- [ ] **Telegram: Wire signals to @antsatworkbot channel** — critical=30 + C1=40 + dev=20 + blocks(1)=5 [sonnet] `agent, telegram, P0, integration` ← [autonomous-orgs](TODO-autonomous-orgs.md)
  exit: Agents signal @antsatworkbot, channel receives and routes back
  blocks: marketing-dept-live
- [ ] **Implement capable(): declare unit capabilities** — critical=30 + C1=40 + dev=20 + blocks(1)=5 [sonnet] `engine, lifecycle, P0` ← [lifecycle](TODO-lifecycle.md)
  exit: `persist.capable(unit, skill, price)` creates capability relation. TypeDB function `has_capability(unit, skill)` returns true.
  blocks: impl-discover
- [ ] **Implement discover(): find units by capability** — critical=30 + C1=40 + dev=20 + blocks(1)=5 [sonnet] `engine, lifecycle, P0` ← [lifecycle](TODO-lifecycle.md)
  exit: `suggest_route(from, skill)` returns units ranked by pheromone. New units appear last. Proven units appear first.
  blocks: impl-signal
- [ ] **Add DSL + dictionary as base context in every wave** — critical=30 + C1=40 + dev=20 + blocks(1)=5 [haiku] `engine, build, P0` ← [task-management](TODO-task-management.md)
  exit: contextForSkill loads DSL.md + dictionary.md as baseline for all tasks
  blocks: wave-context-envelope
- [ ] **Create inferDocsFromTags in context.ts** — critical=30 + C1=40 + dev=20 + blocks(1)=5 [haiku] `engine, build, P0` ← [task-management](TODO-task-management.md)
  exit: engine→[dsl,routing], typedb→[dsl], ui→[dictionary], commerce→[sdk], etc.
  blocks: wave-context-envelope
- [ ] **Build resolveContext function** — critical=30 + C1=40 + dev=20 + blocks(1)=5 [sonnet] `engine, build, P0` ← [task-management](TODO-task-management.md)
  exit: resolveContext(task, net) returns {base, domain, learned, highways, model, exit}
  blocks: enrich-task-signal
- [ ] **Enrich task signal in loop.ts with full envelope** — critical=30 + C1=40 + dev=20 + blocks(1)=5 [sonnet] `engine, build, P0` ← [task-management](TODO-task-management.md)
  exit: loop.ts L1b builds full context envelope before routing to builder
  blocks: wave-context-envelope
- [ ] **Wire contextForSkill into task selection** — critical=30 + C1=40 + dev=20 + blocks(1)=5 [haiku] `engine, build, P0` ← [typedb](TODO-typedb.md)
  exit: contextForSkill called with task tags during loop.ts task orchestration
  blocks: resolve-context
- [ ] **Create 7-persona vocabulary layer: CEO/Dev/Investor/Gamer/Kid/Freelancer/Agent** — high=25 + C1=40 + dev=20 + blocks(1)=5 [sonnet] `foundation, design, P1, governance` ← [ONE-strategy](TODO-ONE-strategy.md)
  exit: Every formula maps to 7 vocabulary skins. Same math, different words.
  blocks: persona-translation
- [ ] **API endpoint: POST /api/agents/register** — high=25 + C1=40 + dev=20 + blocks(1)=5 [haiku] `api, lifecycle, P1` ← [lifecycle](TODO-lifecycle.md)
  exit: Endpoint accepts { uid, kind, capabilities[] }, returns { uid, status: "registered" }. Validates input. Creates unit + capabilities.
  blocks: api-discover
- [ ] **Lifecycle gate: REGISTER → CAPABLE requires unit_exists** — high=25 + C1=40 + dev=20 + blocks(1)=5 [haiku] `engine, lifecycle, P1` ← [lifecycle](TODO-lifecycle.md)
  exit: `canDeclareCapability(uid)` returns true only if unit exists with status "active". Gate enforced before capability insert.
  blocks: gate-capable-discover
- [ ] **API endpoint: GET /api/agents/discover** — high=25 + C1=40 + dev=20 [haiku] `api, lifecycle, P1` ← [lifecycle](TODO-lifecycle.md)
  exit: Endpoint accepts ?skill=X&limit=N, returns ranked units with strength scores. Uses suggest_route internally.
- [ ] **TypeDB schema: unit status transitions** — high=25 + C1=40 + dev=20 [haiku] `schema, lifecycle, P1` ← [lifecycle](TODO-lifecycle.md)
  exit: world.tql has unit-kind enum, status tracking, created/updated timestamps. Functions: unit_status(uid), unit_classification(uid).
- [ ] **Lifecycle gate: CAPABLE → DISCOVER requires has_capability** — high=25 + C1=40 + dev=20 [haiku] `engine, lifecycle, P1` ← [lifecycle](TODO-lifecycle.md)
  exit: `canBeDiscovered(uid)` returns true only if at least one capability relation exists. Gate enforced in suggest_route.
- [ ] **Wire recall of prior attempts into context** — high=25 + C1=40 + dev=20 [haiku] `engine, typedb, P1` ← [task-management](TODO-task-management.md)
  exit: net.recall(taskId) included in envelope. Failed attempts inform next try.
- [ ] **Wire blocking context — executor sees what it unblocks** — high=25 + C1=40 + dev=20 [haiku] `engine, typedb, P1` ← [task-management](TODO-task-management.md)
  exit: task_blockers() results in signal. Builder knows its work unblocks N others.
- [ ] **Wire TaskCompleted hook for verify gate** — high=25 + C1=40 + dev=20 [sonnet] `infra, build, P1` ← [testing](TODO-testing.md)
  exit: TaskCompleted hook runs npm run verify. Blocks if tests regress. Gates the mark.
- [ ] **Cycle 1 W1: Recon (parallel Haiku × 4)** — critical=30 + C1=40 + haiku=5 + blocks(1)=5 [haiku] `docs, wire, recon, P0` ← [rename](TODO-rename.md)
  exit: 4 reports in. Each reports dead names with line numbers, metaphor flags.
  blocks: cycle-1-w2
- [ ] **Cycle 1 W2: Decide (Opus)** — critical=30 + C1=40 + opus=5 + blocks(1)=5 [sonnet] `docs, wire, decide, P0` ← [rename](TODO-rename.md)
  exit: Edit specs produced. Replace/Keep/Judgment for each dead name. DSL + names.md loaded.
  blocks: cycle-1-w3
- [ ] **Cycle 1 W3: Edits (parallel Sonnet × 4)** — critical=30 + C1=40 + sonnet=5 + blocks(1)=5 [opus] `docs, wire, edit, P0` ← [rename](TODO-rename.md)
  exit: All 4 files edited. No content loss. Anchors matched or dissolved reported.
  blocks: cycle-1-w4
- [ ] **Cycle 1 W4: Verify (Sonnet × 1)** — critical=30 + C1=40 + sonnet=5 + blocks(1)=5 [sonnet] `docs, wire, verify, P0` ← [rename](TODO-rename.md)
  exit: Zero dead names in prose (except metaphor tables). Rubric >= 0.65. Links resolve.
  blocks: cycle-2-prove-start
- [ ] **Wire Stop hook for session-end verify** — medium=20 + C1=40 + dev=20 [haiku] `infra, build, P2` ← [testing](TODO-testing.md)
  exit: Stop hook runs verify, reports any regressions introduced during session.
- [ ] **Filter highways relevant to task tags** — medium=20 + C1=40 + dev=20 [haiku] `engine, P2` ← [typedb](TODO-typedb.md)
  exit: Only highways involving task-related units included in context

---

## C2: Collaboration

- [ ] **Implement signal lifecycle: route → execute → mark/warn** — critical=30 + C2=35 + dev=20 + blocks(2)=10 [opus] `engine, lifecycle, P0` ← [lifecycle](TODO-lifecycle.md)
  exit: `world.ask()` returns 4 outcomes. Each outcome triggers appropriate mark/warn. Signal logged to TypeDB.
  blocks: impl-drop, impl-alarm
- [ ] **Add task-wave and task-context to world.tql** — critical=30 + C2=35 + dev=20 + blocks(2)=10 [haiku] `typedb, schema, P0` ← [task-management](TODO-task-management.md)
  exit: task owns task-wave (W1-W4) and task-context (doc keys). Attributes defined.
  blocks: wave-runner-unit, wave-context-envelope
- [ ] **Build wave-runner unit with .then() chains** — critical=30 + C2=35 + dev=20 + blocks(2)=10 [opus] `engine, build, P0` ← [task-management](TODO-task-management.md)
  exit: unit('wave-runner').on('recon',...).then('recon',→decide).on('decide',...).then('decide',→edit)...
  blocks: self-checkoff, wave-mark-transitions
- [ ] **Implement drop(): mark on success** — critical=30 + C2=35 + dev=20 + blocks(1)=5 [haiku] `engine, lifecycle, P0` ← [lifecycle](TODO-lifecycle.md)
  exit: `mark(edge, strength)` increases edge.strength. Chain depth scales the mark. Traversals increment.
  blocks: impl-highway
- [ ] **Implement alarm(): warn on failure** — critical=30 + C2=35 + dev=20 + blocks(1)=5 [haiku] `engine, lifecycle, P0` ← [lifecycle](TODO-lifecycle.md)
  exit: `warn(edge, resistance)` increases edge.resistance. isToxic check with cold-start protection.
  blocks: impl-highway
- [ ] **Map waves to core.ts sense→select→act→mark** — critical=30 + C2=35 + dev=20 + blocks(1)=5 [sonnet] `engine, build, P0` ← [task-management](TODO-task-management.md)
  exit: W1=sense, W2=select, W3=act, W4=mark. Each wave is a Loop<T> from core.ts.
  blocks: wave-runner-unit
- [ ] **Build context envelope that accumulates across waves** — critical=30 + C2=35 + dev=20 + blocks(1)=5 [sonnet] `engine, build, P0` ← [task-management](TODO-task-management.md)
  exit: Each .then() carries previous output + new context. W4 has full history of all waves.
  blocks: wave-runner-unit
- [ ] **Create rubric scorer with tagged-edge marks** — critical=30 + C2=35 + dev=20 + blocks(1)=5 [sonnet] `engine, build, P0` ← [task-management](TODO-task-management.md)
  exit: markDims() emits edge:fit, edge:form, edge:truth, edge:taste. Haiku judges.
  blocks: wave-mark-transitions
- [ ] **Route task to model by wave** — critical=30 + C2=35 + dev=20 + blocks(1)=5 [sonnet] `engine, build, P0` ← [typedb](TODO-typedb.md)
  exit: W1→haiku, W2→opus, W3→sonnet, W4→sonnet. Model selected at signal time.
  blocks: wave-builder-unit
- [ ] **Build wave-aware builder unit with .then() chains** — critical=30 + C2=35 + dev=20 + blocks(1)=5 [opus] `engine, build, P0` ← [typedb](TODO-typedb.md)
  exit: builder unit has recon→decide→edit→verify handlers, each .then() carries accumulated context
  blocks: wave-mark-transitions
- [ ] **Create agent self-improvement loop: rewrite prompts when success-rate < 50%** — high=25 + C2=35 + dev=20 + blocks(1)=5 [opus] `intelligence, learning, P1, foundation` ← [ONE-strategy](TODO-ONE-strategy.md)
  exit: Agent prompt auto-rewrites every 10 min if samples >= 20 AND success < 50%
  blocks: evolution-live
- [ ] **Dashboard: Show task graph + pheromone in real-time** — high=25 + C2=35 + dev=20 + blocks(1)=5 [opus] `ui, reactflow, P1, visualization` ← [autonomous-orgs](TODO-autonomous-orgs.md)
  exit: ReactFlow visualization showing tasks, dependencies, pheromone trails
  blocks: task-board-live
- [ ] **4 outcome types fully implemented** — critical=30 + C2=35 + dev=20 [sonnet] `engine, lifecycle, P0` ← [lifecycle](TODO-lifecycle.md)
  exit: { result }, { timeout }, { dissolved }, { failure } all handled distinctly. Tests prove each path.
- [ ] **Test loop.ts: tick cycle, all 7 loops, chain depth** — high=25 + C2=35 + dev=20 + blocks(1)=5 [opus] `engine, test, P0` ← [testing](TODO-testing.md)
  exit: loop.ts test file. Covers: L1 signal, L2 mark/warn, L3 fade interval, L5 evolution trigger, L6 know, L7 frontier detection
  blocks: test-wave-lifecycle
- [ ] **Parse wave position from TODO files** — high=25 + C2=35 + dev=20 + blocks(1)=5 [haiku] `engine, build, P1` ← [typedb](TODO-typedb.md)
  exit: task-parse.ts reads wave: field, defaults W3 (edit) for backwards compat
  blocks: wave-routing
- [ ] **Wire rubric tagged edges into wave builder W4 verify step** — high=25 + C2=35 + dev=20 + blocks(1)=5 [sonnet] `engine, build, P1` ← [typedb](TODO-typedb.md)
  exit: Wave 4 scores each W3 edit. markDims(net, edge, scores, rubric) replaces binary mark(edge, 1). Four tagged paths accumulate per skill.
  blocks: wave-mark-transitions
- [ ] **Implement fade(): asymmetric decay** — high=25 + C2=35 + dev=20 [haiku] `engine, lifecycle, P1` ← [lifecycle](TODO-lifecycle.md)
  exit: `world.fade(rate)` decays strength by rate, resistance by 2*rate. Resistance forgives faster.
- [ ] **Lifecycle gate: SIGNAL → DROP requires { result }** — high=25 + C2=35 + dev=20 [haiku] `engine, lifecycle, P1` ← [lifecycle](TODO-lifecycle.md)
  exit: mark() only called when ask() returns { result: X }. timeout = neutral. dissolved = mild warn. no result = full warn.
- [ ] **Lifecycle gate: SIGNAL → ALARM requires failure** — high=25 + C2=35 + dev=20 [haiku] `engine, lifecycle, P1` ← [lifecycle](TODO-lifecycle.md)
  exit: warn() called with appropriate strength: 0 for timeout, 0.5 for dissolved, 1.0 for failure.
- [ ] **Signal logging to TypeDB** — high=25 + C2=35 + dev=20 [sonnet] `engine, lifecycle, P1` ← [lifecycle](TODO-lifecycle.md)
  exit: Every signal creates signal entity with sender, receiver, data, success, latency, timestamp.
- [ ] **Parse wave and context from TODO files** — high=25 + C2=35 + dev=20 [haiku] `engine, build, P1` ← [task-management](TODO-task-management.md)
  exit: task-parse.ts reads wave: and context: fields. Default W3, context from tags.
- [ ] **Route model by wave position** — high=25 + C2=35 + dev=20 [haiku] `engine, build, P1` ← [task-management](TODO-task-management.md)
  exit: W1→haiku, W2→opus, W3→sonnet, W4→sonnet. EFFORT_MODEL fallback.
- [ ] **Make /work wave-aware** — high=25 + C2=35 + dev=20 [sonnet] `engine, build, P1` ← [task-management](TODO-task-management.md)
  exit: /work detects wave, spawns correct model, advances on success
- [ ] **Make TODO template a /todo skill** — high=25 + C2=35 + dev=20 [haiku] `engine, build, P1` ← [task-management](TODO-task-management.md)
  exit: /todo creates a TODO file from source doc with wave structure, DSL+dict context, schema link
- [ ] **Test task-sync.ts: TypeDB writes, blocks relations** — high=25 + C2=35 + dev=20 [haiku] `engine, test, P1` ← [testing](TODO-testing.md)
  exit: task-sync.ts test file. Covers: insertTask, insertBlocks, markTaskDone. Mocks TypeDB.
- [ ] **Test tag-filtered loop routing: previousTarget → tag join → task selection** — high=25 + C2=35 + dev=20 [sonnet] `engine, test, P1` ← [testing](TODO-testing.md)
  exit: Loop L1b tries tag-filtered query first when previousTarget set. Falls back to global priority. Tag match prefers relevant tasks over highest-priority unrelated ones.
- [ ] **Test subscription via agent markdown: tags in frontmatter → TypeDB → tasksFor** — high=25 + C2=35 + dev=20 [haiku] `engine, test, P1` ← [testing](TODO-testing.md)
  exit: Agent with tags: [engine, build] in markdown → syncAgent writes tags to TypeDB → tasksFor returns matching open tasks
- [ ] **Consume EFFORT_MODEL in loop.ts** — high=25 + C2=35 + dev=20 [haiku] `engine, P1` ← [typedb](TODO-typedb.md)
  exit: EFFORT_MODEL mapping from task-parse.ts used as fallback when no wave set
- [ ] **Docs: Cross-link dictionary.md + one-ontology.md to task execution** — medium=20 + C2=35 + dev=20 [haiku] `docs, integration, P1, knowledge` ← [autonomous-orgs](TODO-autonomous-orgs.md)
  exit: docs/dictionary.md and docs/one-ontology.md link to task system
- [ ] **Test doc-scan.ts: item extraction, verification, gaps→signals** — medium=20 + C2=35 + dev=20 [sonnet] `engine, test, P2` ← [testing](TODO-testing.md)
  exit: doc-scan.ts test file. Covers: extractItems (checkboxes, gaps), inferTags, inferPriority, verify (keyword match), gapsToSignals
- [ ] **Test agent-md.ts: parse, toTypeDB, syncAgent** — medium=20 + C2=35 + dev=20 [sonnet] `engine, test, P2` ← [testing](TODO-testing.md)
  exit: agent-md.ts test file. Covers: parse frontmatter + system prompt, toTypeDB generates valid TQL, skill extraction
- [ ] **Add task-context field to world.tql** — medium=20 + C2=35 + dev=20 [haiku] `typedb, schema, P2` ← [typedb](TODO-typedb.md)
  exit: task entity owns task-context (comma-separated doc keys for context resolution)
- [ ] **Cycle 2 W1: Recon (parallel Haiku × 20)** — high=25 + C2=35 + haiku=5 + blocks(1)=5 [sonnet] `docs, prove, recon, P0` ← [rename](TODO-rename.md)
  exit: 20 reports in. Dead names flagged per file, metaphor exceptions noted.
  blocks: cycle-2-w2
- [ ] **Cycle 2 W2: Decide (Opus)** — high=25 + C2=35 + opus=5 + blocks(1)=5 [opus] `docs, prove, decide, P0` ← [rename](TODO-rename.md)
  exit: Edit specs for ~20 files. Judgment calls for ants.md, game docs, metaphor tables.
  blocks: cycle-2-w3
- [ ] **Cycle 2 W3: Edits (parallel Sonnet × 20)** — high=25 + C2=35 + sonnet=5 + blocks(1)=5 [opus] `docs, prove, edit, P1` ← [rename](TODO-rename.md)
  exit: ~300 total edits applied. No content loss. Anchors matched.
  blocks: cycle-2-w4
- [ ] **Cycle 2 W4: Verify (Sonnet × 1)** — high=25 + C2=35 + sonnet=5 + blocks(1)=5 [sonnet] `docs, prove, verify, P0` ← [rename](TODO-rename.md)
  exit: Zero dead names in high-traffic docs. Tutorial code matches DSL.md. Rubric >= 0.65.
  blocks: cycle-3-grow-start

---

## C3: Commerce

- [ ] **Self-checkoff: W4 verify pass marks task done** — critical=30 + C3=30 + dev=20 + blocks(2)=10 [sonnet] `engine, build, P0` ← [task-management](TODO-task-management.md)
  exit: selfCheckoff() → markTaskDone + update checkbox + mark path + unblock + know
  blocks: learn-wave-patterns, auto-unblock
- [ ] **Implement highway detection: strength ≥ 50, traversals ≥ 50** — critical=30 + C3=30 + dev=20 + blocks(1)=5 [sonnet] `engine, lifecycle, P0` ← [lifecycle](TODO-lifecycle.md)
  exit: `isHighway(edge)` returns true when threshold met. TypeDB function `edge_classification(from, to)` returns "highway".
  blocks: impl-crystallize
- [ ] **Implement crystallize(): freeze highway to Sui** — critical=30 + C3=30 + dev=20 + blocks(1)=5 [opus] `engine, lifecycle, P0` ← [lifecycle](TODO-lifecycle.md)
  exit: `persist.know()` writes proven highways to Sui as ProvenCapability objects. Irreversible. Verifiable.
  blocks: impl-federate
- [ ] **Mark each wave transition as a path** — critical=30 + C3=30 + dev=20 + blocks(1)=5 [sonnet] `engine, build, P0` ← [task-management](TODO-task-management.md)
  exit: recon→decide, decide→edit, edit→verify each get mark/warn per outcome
  blocks: learn-wave-patterns
- [ ] **Test wave lifecycle: W0→W1→W2→W3→W4→selfCheckoff** — critical=30 + C3=30 + dev=20 [opus] `engine, test, P0` ← [testing](TODO-testing.md)
  exit: Wave lifecycle test. Covers: context accumulates across waves, markDims emits 4 tagged edges, selfCheckoff marks done + unblocks + knows
- [ ] **Test agent lifecycle: register → signal → highway in N signals** — critical=30 + C3=30 + dev=20 [opus] `engine, test, P0` ← [testing](TODO-testing.md)
  exit: Integration test. Agent registers, receives 100 signals, edges become highways, unit_classification returns "proven". The full lifecycle.md journey in one test.
- [ ] **Wire Sui on-chain proofs: paths crystallized immutable** — high=25 + C3=30 + investor=15 + blocks(1)=5 [opus] `commerce, sui, blockchain, P1, compliance` ← [ONE-strategy](TODO-ONE-strategy.md)
  exit: Strength, resistance, revenue locked on Sui. Auditable. Compliant.
  blocks: blockchain-live
- [ ] **Build marketplace: humans buy/sell services to agents** — high=25 + C3=30 + investor=15 + blocks(1)=5 [opus] `commerce, payments, P1, revenue` ← [ONE-strategy](TODO-ONE-strategy.md)
  exit: Skill pricing, payment routing, escrow settlement on Sui
  blocks: commerce-live
- [ ] **Revenue: Wire x402 payment routing on Sui (C3)** — high=25 + C3=30 + investor=15 + blocks(1)=5 [opus] `commerce, x402, sui, P0, foundation` ← [autonomous-orgs](TODO-autonomous-orgs.md)
  exit: Payments flow from skills to units on Sui blockchain
  blocks: commerce-live
- [ ] **Implement federate(): cross-group routing** — high=25 + C3=30 + dev=20 [opus] `engine, lifecycle, P1` ← [lifecycle](TODO-lifecycle.md)
  exit: `federate(otherWorld)` creates bridge. Signals cross group boundaries. Cross-group paths accumulate.
- [ ] **Lifecycle gate: DROP → HIGHWAY requires threshold** — high=25 + C3=30 + dev=20 [haiku] `engine, lifecycle, P1` ← [lifecycle](TODO-lifecycle.md)
  exit: Highway status only inferred when strength ≥ 50 AND traversals ≥ 50. Early edges stay "fresh".
- [ ] **Lifecycle gate: HIGHWAY → CRYSTALLIZE requires confirmed** — high=25 + C3=30 + dev=20 [sonnet] `engine, lifecycle, P1` ← [lifecycle](TODO-lifecycle.md)
  exit: know() only writes highways. Requires both TypeDB confirmation AND enough data points. Cold-start protection.
- [ ] **API endpoint: POST /api/crystallize** — high=25 + C3=30 + dev=20 [sonnet] `api, lifecycle, P1` ← [lifecycle](TODO-lifecycle.md)
  exit: Endpoint triggers know() → Sui write. Returns { tx_hash, highways_frozen: N }. Auth required.
- [ ] **Sui wallet derivation: UID → keypair** — high=25 + C3=30 + dev=20 [sonnet] `engine, lifecycle, P1` ← [lifecycle](TODO-lifecycle.md)
  exit: `addressFor(uid)` derives Sui address from SUI_SEED + uid. Same uid = same address. Deterministic.
- [ ] **ProvenCapability on-chain structure** — high=25 + C3=30 + dev=20 [sonnet] `sui, lifecycle, P1` ← [lifecycle](TODO-lifecycle.md)
  exit: Move struct matches lifecycle.md spec. Fields: agent, task, strength, completions, crystallized_at.
- [ ] **Auto-unblock: emit signals to dependent tasks** — high=25 + C3=30 + dev=20 [haiku] `engine, build, P1` ← [task-management](TODO-task-management.md)
  exit: Task done → query blocks → enqueue signals for newly-unblocked tasks
- [ ] **Cycle gate: know() when all tasks in phase complete** — high=25 + C3=30 + dev=20 [haiku] `engine, typedb, P1` ← [task-management](TODO-task-management.md)
  exit: Phase complete → know() promotes wave patterns to hypotheses
- [ ] **Learn which context+tag combos lead to golden W4 scores** — high=25 + C3=30 + dev=20 [sonnet] `engine, typedb, P1` ← [task-management](TODO-task-management.md)
  exit: Hypothesis records: "engine+P0 tasks with routing.md context → 0.9 avg score"
- [ ] **Update /done to trigger selfCheckoff** — high=25 + C3=30 + dev=20 [haiku] `engine, build, P1` ← [task-management](TODO-task-management.md)
  exit: /done calls selfCheckoff() → marks, updates checkbox, unblocks, emits
- [ ] **Test API endpoints: signal, tick, state, tasks** — high=25 + C3=30 + dev=20 [sonnet] `api, test, P1` ← [testing](TODO-testing.md)
  exit: API test file. Covers: POST /api/signal routes correctly, GET /api/tick returns TickResult, GET /api/state returns world snapshot
- [ ] **Test nanoclaw router: webhook auth, persona selection, message flow** — high=25 + C3=30 + dev=20 [sonnet] `agent, test, P1` ← [testing](TODO-testing.md)
  exit: nanoclaw test file. Covers: Telegram webhook parsing, persona selection order (BOT_PERSONA → group prefix → default), API key auth
- [ ] **Test rubric scorer: score(), markDims(), tagged edges** — high=25 + C3=30 + dev=20 [sonnet] `engine, test, P1` ← [testing](TODO-testing.md)
  exit: rubric.ts test file. Covers: score returns {fit,form,truth,taste,violations}, markDims writes 4 tagged paths, violations bypass scoring
- [ ] **Add CI pipeline: biome + tsc + vitest on every push** — high=25 + C3=30 + dev=20 [haiku] `infra, build, P1` ← [testing](TODO-testing.md)
  exit: GitHub Action runs npm run verify on push/PR. Badge in README.
- [ ] **Test human lifecycle: visit → observe → use → their signals join graph** — high=25 + C3=30 + dev=20 [sonnet] `api, test, P1` ← [testing](TODO-testing.md)
  exit: Integration test. Human signal enters via /api/signal, routes through agents, mark compounds, human sees highway form in /api/state response.
- [ ] **Test lifecycle gates: each stage transition requires its test to pass** — high=25 + C3=30 + dev=20 [sonnet] `engine, test, P1` ← [testing](TODO-testing.md)
  exit: Test that REGISTER requires unit_exists, CAPABLE requires capability relation, HIGHWAY requires strength≥50. Gate function returns pass/fail.
- [ ] **Test learning acceleration: system gets faster over time** — high=25 + C3=30 + dev=20 [sonnet] `engine, test, P1` ← [testing](TODO-testing.md)
  exit: Send 200 signals. Measure: routing time decreases, highway count increases, LLM calls decrease. The flywheel from speed.md verified in code.
- [ ] **Record context pattern in hypothesis on task completion** — high=25 + C3=30 + dev=20 [sonnet] `engine, typedb, P1` ← [typedb](TODO-typedb.md)
  exit: When task succeeds, which docs/hypotheses were in context is recorded as hypothesis
- [ ] **Auto-hypothesize from wave failure patterns** — high=25 + C3=30 + dev=20 [sonnet] `engine, typedb, P1` ← [typedb](TODO-typedb.md)
  exit: Repeated W3 failures on same tag cluster → hypothesis. W4 retry count > 2 → hypothesis.
- [ ] **Link task completion to skill capability strength** — high=25 + C3=30 + dev=20 [haiku] `engine, typedb, P1` ← [typedb](TODO-typedb.md)
  exit: Task done → matching skill's capability path gets mark(). Same ID = same path.
- [ ] **Feed rubric tagged-edge strengths into L5 evolution with per-dimension resolution** — high=25 + C3=30 + dev=20 [sonnet] `engine, typedb, P1` ← [typedb](TODO-typedb.md)
  exit: L5 reads per-dim path strength (edge:fit, edge:truth, etc). Low truth strength → evolve for accuracy. Low taste → evolve voice. The graph tells evolution WHAT to fix.
- [ ] **Calibrate rubric judge against golden examples** — high=25 + C3=30 + dev=20 [haiku] `engine, P1` ← [typedb](TODO-typedb.md)
  exit: Hand-score 10 responses, judge-score same 10. Delta < 0.15 per dim. Lock judge version.
- [ ] **Implement dissolve(): graceful exit** — medium=20 + C3=30 + dev=20 [haiku] `engine, lifecycle, P2` ← [lifecycle](TODO-lifecycle.md)
  exit: `world.remove(id)` removes unit. Paths remain and fade naturally. No penalty. Silence.
- [ ] **Detect failing wave patterns as frontiers** — medium=20 + C3=30 + dev=20 [haiku] `engine, P2` ← [task-management](TODO-task-management.md)
  exit: Repeated W3 fails → frontier. W4 retry > 2 → hypothesis "this pattern struggles"
- [ ] **Feed rubric dims into L5 for wave-runner evolution** — medium=20 + C3=30 + dev=20 [sonnet] `engine, typedb, P2` ← [task-management](TODO-task-management.md)
  exit: L5 reads per-dim strength. Low truth → evolve recon. Low form → evolve edit.
- [ ] **Test self-learning: mark compounds, fade decays, know promotes** — medium=20 + C3=30 + dev=20 [sonnet] `engine, test, P2` ← [testing](TODO-testing.md)
  exit: Integration test. 100 signals through a 3-unit chain. Verify: all edges become highways, know() produces hypotheses, fade reduces strength
- [ ] **Coverage target: engine/ ≥ 80%, persist/ ≥ 70%** — medium=20 + C3=30 + dev=20 [haiku] `engine, test, P2` ← [testing](TODO-testing.md)
  exit: npm run test:coverage shows ≥80% line coverage for src/engine/*.ts
- [ ] **Detect wave-specific frontiers** — medium=20 + C3=30 + dev=20 [haiku] `engine, P2` ← [typedb](TODO-typedb.md)
  exit: L7 frontier detection knows which waves are unexplored per tag cluster
- [ ] **Evolve builder prompt from wave outcomes** — medium=20 + C3=30 + dev=20 [sonnet] `engine, P2` ← [typedb](TODO-typedb.md)
  exit: L5 evolution considers per-wave success rates. Builder:recon vs builder:edit evolve separately.
- [ ] **Surface context quality in /highways output** — medium=20 + C3=30 + dev=20 [haiku] `engine, ui, P2` ← [typedb](TODO-typedb.md)
  exit: /highways shows which doc-context patterns appear on proven paths
- [ ] **Cycle 3 W1: Recon (parallel Haiku × 20)** — medium=20 + C3=30 + haiku=5 + blocks(1)=5 [sonnet] `docs, grow, recon, P1` ← [rename](TODO-rename.md)
  exit: 20 reports in. External system vocabulary (AgentVerse, Hermes) flagged separately.
  blocks: cycle-3-w2
- [ ] **Cycle 3 W2: Decide (Opus)** — medium=20 + C3=30 + opus=5 + blocks(1)=5 [opus] `docs, grow, decide, P1` ← [rename](TODO-rename.md)
  exit: Edit specs for ~20 strategy docs. External vocabulary preserved. Judgment recorded.
  blocks: cycle-3-w3
- [ ] **Cycle 3 W3: Edits (parallel Sonnet × 20)** — medium=20 + C3=30 + sonnet=5 + blocks(1)=5 [opus] `docs, grow, edit, P1` ← [rename](TODO-rename.md)
  exit: ~200 total edits applied. External system vocabulary preserved.
  blocks: cycle-3-w4
- [ ] **Cycle 3 W4: Verify (Sonnet × 1)** — medium=20 + C3=30 + sonnet=5 + blocks(1)=5 [sonnet] `docs, grow, verify, P0` ← [rename](TODO-rename.md)
  exit: Zero dead names in ONE-vocabulary context. External systems intact. Rubric >= 0.65. Final sweep complete.
  blocks: consolidation-complete

---

## C4: Expansion

- [ ] **Scale to 2M+ AgentVerse agents: bridge AgentVerse discovery + ONE routing** — high=25 + C4=25 + dev=20 + blocks(1)=5 [opus] `integration, expansion, P1, network-effects` ← [ONE-strategy](TODO-ONE-strategy.md)
  exit: ONE substrate routes through AgentVerse 2M agents. Discovery automatic.
  blocks: agentverse-live
- [ ] **Wire creator domains: mint branded agents on your domain** — high=25 + C4=25 + investor=15 + blocks(1)=5 [sonnet] `integration, branding, P1, expansion` ← [ONE-strategy](TODO-ONE-strategy.md)
  exit: creator.domain → agents live, branded, routing under your control
  blocks: domains-live
- [ ] ****2.1 Keypair derivation** — `deriveAgentKeypair(uid, seed)` in `src/lib/sui.ts` + tests** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [SUI](TODO-SUI.md)
- [ ] ****2.2 Wire to /api/agents/sync** — returns `{ wallet: 0x... }` on agent creation** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [SUI](TODO-SUI.md)
- [ ] ****2.3 Wallet Adapter UI** — `@mysten/dapp-kit` in browser for manual signing** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [SUI](TODO-SUI.md)
- [ ] ****2.4 Read-only Discovery** — follow() + select() read Sui Path weights, weight pheromone by on-chain strength** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [SUI](TODO-SUI.md)
- [ ] ****2.5 Transaction history** — `/api/agent/{id}/transactions` → Sui Explorer links** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [SUI](TODO-SUI.md)
- [ ] ****2.6 Gas sponsorship** — Protocol pays gas for new agent creation (Phase 3 escrow setup)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [SUI](TODO-SUI.md)
- [ ] **Sui Wallet Adapter (`@mysten/dapp-kit`) for browser wallet connect** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [SUI](TODO-SUI.md)
- [ ] **Agent identity = keypair (self-sovereign, not platform-derived)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [SUI](TODO-SUI.md)
- [ ] **Discovery on-chain (`follow()`/`select()` read Sui path weights)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [SUI](TODO-SUI.md)
- [ ] **Transaction history UI (link to Sui Explorer)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [SUI](TODO-SUI.md)
- [ ] **Gas sponsorship (Protocol pays gas for new agents)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [SUI](TODO-SUI.md)
- [ ] **Create escrow on-chain (lock SUI for async tasks)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [SUI](TODO-SUI.md)
- [ ] **Release on success (payment + mark + fee, atomic)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [SUI](TODO-SUI.md)
- [ ] **Cancel on timeout (tokens return, path warned)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [SUI](TODO-SUI.md)
- [ ] **x402 HTTP flow (402 → fund → execute → release)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [SUI](TODO-SUI.md)
- [ ] **Multi-hop payment chains** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [SUI](TODO-SUI.md)
- [ ] **Multi-currency (USDC, FET)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [SUI](TODO-SUI.md)
- [ ] **On-chain fade (CF Worker cron)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [SUI](TODO-SUI.md)
- [ ] **Crystallize highways (`freeze_object()`, $0.50 fee)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [SUI](TODO-SUI.md)
- [ ] **Read frozen highways (on-chain badge in UI)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [SUI](TODO-SUI.md)
- [ ] **Proof of delivery / consumption** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [SUI](TODO-SUI.md)
- [ ] **Colony treasury on-chain** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [SUI](TODO-SUI.md)
- [ ] **Colony splitting** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [SUI](TODO-SUI.md)
- [ ] **Unit dissolve (balance returns to colony)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [SUI](TODO-SUI.md)
- [ ] **Protocol fee management** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [SUI](TODO-SUI.md)
- [ ] **Federation (cross-group signals)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [SUI](TODO-SUI.md)
- [ ] **Security audit** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [SUI](TODO-SUI.md)
- [ ] **Mainnet deployment** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [SUI](TODO-SUI.md)
- [ ] **SDK publish (`@one/sdk`)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [SUI](TODO-SUI.md)
- [ ] **Multi-chain bridge** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [SUI](TODO-SUI.md)
- [ ] ****Cycle 1: WIRE** — Into ONE (Register, Capable, Discover)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [lifecycle](TODO-lifecycle.md)
- [ ] ****Cycle 2: PROVE** — Through ONE (Signal, Drop, Alarm, Fade)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [lifecycle](TODO-lifecycle.md)
- [ ] ****Cycle 3: GROW** — Out of ONE (Highway, Crystallize, Federate, Dissolve)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [lifecycle](TODO-lifecycle.md)
- [ ] ****Cycle 1: WIRE** — Context into tasks** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [task-management](TODO-task-management.md)
- [ ] ****Cycle 2: PROVE** — Waves as core loops** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [task-management](TODO-task-management.md)
- [ ] ****Cycle 3: GROW** — Self-learning** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [task-management](TODO-task-management.md)
- [ ] ****Cycle 1: WIRE** — {scope}** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [template 1](TODO-template 1.md)
- [ ] ****Cycle 2: PROVE** — {scope}** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [template 1](TODO-template 1.md)
- [ ] ****Cycle 3: GROW** — {scope}** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [template 1](TODO-template 1.md)
- [ ] **All baseline tests still pass (no regressions)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [template](TODO-template.md)
- [ ] **New tests cover new functionality** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [template](TODO-template.md)
- [ ] **`biome check .` clean on touched files** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [template](TODO-template.md)
- [ ] **`tsc --noEmit` passes** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [template](TODO-template.md)
- [ ] **W4 rubric score >= 0.65 on all dimensions** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [template](TODO-template.md)
- [ ] ****Cycle 3: GROW** — Test the lifecycle** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [testing](TODO-testing.md)
- [ ] ****Cycle 1: WIRE** — Context resolution + enriched signals** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [typedb](TODO-typedb.md)
- [ ] ****Cycle 2: PROVE** — Wave tracking + model routing** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [typedb](TODO-typedb.md)
- [ ] ****Cycle 3: GROW** — Learning from wave transitions** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [typedb](TODO-typedb.md)

---

## C5: Analytics

- [ ] **Monitoring: Weekly success metrics dashboard** — medium=20 + C5=20 + investor=15 + blocks(1)=5 [sonnet] `analytics, metrics, P2, knowledge` ← [autonomous-orgs](TODO-autonomous-orgs.md)
  exit: Weekly report showing success rates, revenue, top performers, emerging frontiers
  blocks: metrics-live
- [ ] **Create kids learning path: learn pheromone by playing** — medium=20 + C5=20 + kid=10 + blocks(1)=5 [sonnet] `ui, education, gamification, P2, learning` ← [ONE-strategy](TODO-ONE-strategy.md)
  exit: Kids see ant colony, set mood (explore/exploit), watch trails form
  blocks: education-live

---

## C6: Products

- [ ] **Build token minting: creators mint their own tokens on Sui** — medium=20 + C6=15 + investor=15 + blocks(1)=5 [opus] `commerce, sui, tokenomics, P2, scale` ← [ONE-strategy](TODO-ONE-strategy.md)
  exit: Creators mint tokens, agents earn them, marketplace trades them
  blocks: tokenomics-live
- [ ] **Build multi-chain bridge: Sui, Ethereum, Solana native routing** — medium=20 + C6=15 + investor=15 + blocks(1)=5 [opus] `integration, blockchain, P2, scale` ← [ONE-strategy](TODO-ONE-strategy.md)
  exit: Routes work across chains. Payments settle on fastest chain. User chooses.
  blocks: multi-chain-live

---

## Done

- [x] **Prove deterministic routing speed: <0.01ms per decision** `foundation, test, P0, engineering` ← [ONE-strategy](TODO-ONE-strategy.md)
- [x] ****1a. Install Sui CLI** — `sui 1.61.2-homebrew`** `` ← [SUI](TODO-SUI.md)
- [x] ****1b. Create keypair** — `0x90096b9e11cff8f0127a22be75c67f8188ee503add9b4c7ff98978fd04cc765d`** `` ← [SUI](TODO-SUI.md)
- [x] ****1c. Fund from faucet** — ~1.9 SUI across 26 gas coins** `` ← [SUI](TODO-SUI.md)
- [x] ****1d. Build contract** — Clean build (removed pinned framework dep, auto-resolved)** `` ← [SUI](TODO-SUI.md)
- [x] ****1e. Run Move tests** — 6/6 pass (unit, deposit/withdraw, path, mark/warn, pay, fade, highway/toxic)** `` ← [SUI](TODO-SUI.md)
- [x] ****1f. Publish** — Package `0xa5e6bddae833220f58546ea4d2932a2673208af14a52bb25c4a603492078a09e`, tx `5GNhTrAyoaHP8BEd3JgnrvZRTThSwv7xu5tNsGg3a6Q6`** `` ← [SUI](TODO-SUI.md)
- [x] ****1g. Set env vars** — `SUI_PACKAGE_ID`, `SUI_PROTOCOL_ID`, `SUI_NETWORK=testnet` in `.env`** `` ← [SUI](TODO-SUI.md)
- [x] ****1h. Generate platform seed** — `SUI_SEED` in `.env`** `` ← [SUI](TODO-SUI.md)
- [x] ****1i. Verify** — `sui client object $SUI_PROTOCOL_ID` shows Protocol { treasury: 0, fee_bps: 50 }** `` ← [SUI](TODO-SUI.md)
- [x] ****2a. Create scout on-chain** — Unit `0x6fd45656222db69f81dbf61c70873fd466ebd8b157bf6694f81314e3e0c13af8`, wallet `0xb0e2d65f43a080ba09275cf3f1ce89ed35309b5fca38df6ad7e6100e616f6dba`** `` ← [SUI](TODO-SUI.md)
- [x] ****2b. Verify on-chain** — Unit { name: "scout", unit_type: "agent", activity: 0, balance: 0 }** `` ← [SUI](TODO-SUI.md)
- [x] ****2c. TypeDB ↔ Sui link** — `absorb()` writes `sui-unit-id` on unit; `resolve(uid)` reads it back** `` ← [SUI](TODO-SUI.md)
- [x] ****2d. View on explorer** — `https://suiscan.xyz/testnet/object/0x6fd45656222db69f81dbf61c70873fd466ebd8b157bf6694f81314e3e0c13af8`** `` ← [SUI](TODO-SUI.md)
- [x] ****3a. Create analyst** — Unit `0x952fea2b99904aa8a365939c5ebc8079014b7cef7ac1ab2375b5a10e4ec6c47d`, wallet `0xfab3...8104`** `` ← [SUI](TODO-SUI.md)
- [x] ****3b. Send signal** — Signal `0x8a17...da42`, payload "hello from scout", task "research"** `` ← [SUI](TODO-SUI.md)
- [x] ****3c. Verify Signal object** — Signal owned by analyst address, payload + sender + receiver correct** `` ← [SUI](TODO-SUI.md)
- [x] ****3d. Verify Path created** — Path `0x956c...76da` scout→analyst, strength: 1, type: "interaction"** `` ← [SUI](TODO-SUI.md)
- [x] ****3e. Check events** — UnitCreated, SignalSent, Marked events all emitted** `` ← [SUI](TODO-SUI.md)
- [x] ****4a. Deposit SUI to unit** — 100000 MIST deposited into scout Unit balance** `` ← [SUI](TODO-SUI.md)
- [x] ****4b. Pay via withdraw+transfer+mark** — Scout withdrew 1000 MIST → analyst address, path marked. Note: Move `pay()` needs both `&mut Unit` (co-sign required) — use withdraw+transfer+mark or escrow pattern instead** `` ← [SUI](TODO-SUI.md)
- [x] ****4c. Verify balances** — Scout: 99000 (100000 - 1000). 1000 MIST arrived at analyst address** `` ← [SUI](TODO-SUI.md)
- [x] ****4d. Protocol fee design** — withdraw+mark bypasses fee (by design). Escrow flow (Phase 3) collects fees atomically via `release_escrow()`** `` ← [SUI](TODO-SUI.md)
- [x] ****4e. Verify path strength** — Path strength: 2, hits: 2 (signal mark + payment mark)** `` ← [SUI](TODO-SUI.md)
- [x] ****5a. Bridge module** — `src/engine/bridge.ts`: mirror + absorb + resolve** `` ← [SUI](TODO-SUI.md)
- [x] ****5b. Schema updated** — `sui-unit-id` on unit, `sui-path-id` on path** `` ← [SUI](TODO-SUI.md)
- [x] ****5c. persist.ts wired** — mark/warn/actor auto-mirror to Sui** `` ← [SUI](TODO-SUI.md)
- [x] ****5d. Absorb endpoint** — `POST /api/absorb { cursor? }` → polls Sui events → writes to TypeDB** `` ← [SUI](TODO-SUI.md)
- [x] ****5e. Verify events queryable** — 5 events (2 UnitCreated, 1 SignalSent, 2 Marked) returned by `queryEvents()`** `` ← [SUI](TODO-SUI.md)
- [x] ****Critical:** TypeDB credentials in build output → moved to runtime/secrets** `` ← [deploy](TODO-deploy.md)
- [x] ****High:** TQL injection → input validation + escaping added** `` ← [deploy](TODO-deploy.md)
- [x] **Credentials removed from `dist/`** `` ← [deploy](TODO-deploy.md)
- [x] **`docs/SECURE-DEPLOY.md` created** `` ← [deploy](TODO-deploy.md)
- [x] **Wave 1 — Reconnaissance (10 Haiku, parallel)** `` ← [signal](TODO-signal.md)
- [x] **Wave 2 — Synthesis (Opus, main context)** `` ← [signal](TODO-signal.md)
- [x] **Wave 3 — Edits (Sonnet, parallel)** `` ← [signal](TODO-signal.md)
- [x] **Wave 4 — Verify (Sonnet) — 8/8 checks pass after micro-fix (Three→Five address modes)** `` ← [signal](TODO-signal.md)
- [x] **Mark complete** `` ← [signal](TODO-signal.md)
- [x] **Fix one.test.ts: bun:test → vitest import** `engine, fix, P0` ← [testing](TODO-testing.md)
- [x] **Triage 85 type errors — fix or suppress with intent** `engine, fix, P0` ← [testing](TODO-testing.md)
- [x] **Fix 21 biome lint issues or configure intentional exceptions** `engine, fix, P1` ← [testing](TODO-testing.md)
- [x] **Establish green baseline: npm run verify passes** `engine, build, P0` ← [testing](TODO-testing.md)
- [x] **Add vitest config for path aliases and coverage** `engine, build, P1` ← [testing](TODO-testing.md)
- [x] **Wire PostToolUse hook for biome check on edit** `infra, build, P1` ← [testing](TODO-testing.md)
- [x] **Test world.ts: unit creation, signal routing, mark/warn/fade** `engine, test, P0` ← [testing](TODO-testing.md)
- [x] **Test persist.ts: TypeDB sync, toxic check, know/recall, subscribe/tasksFor** `engine, test, P0` ← [testing](TODO-testing.md)
- [x] **Test task-parse.ts: priority formula, TODO parsing** `engine, test, P1` ← [testing](TODO-testing.md)
- [x] **Test context.ts: loadContext, contextForSkill, inferDocsFromTags** `engine, test, P1` ← [testing](TODO-testing.md)
- [x] **Test tag subscription: subscribe, tasksFor, overlap ranking** `engine, test, P0` ← [testing](TODO-testing.md)
- [x] **Speed benchmarks as tests: routing <0.005ms, mark <0.001ms** `engine, test, P1` ← [testing](TODO-testing.md)
- [x] ****Cycle 1: WIRE** — Green baseline** `` ← [testing](TODO-testing.md)
- [x] ****Cycle 2: PROVE** — Test the substrate** `` ← [testing](TODO-testing.md)

---

*This file is generated. Edit the TODO-*.md files, not this. Run `/sync-docs` to regenerate.*
