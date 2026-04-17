# TODO

> ONE Substrate — self-learning task system.
> Tasks are signals. Waves are loops. The template is a unit.
> 250 open, 357 done. Priority + pheromone adjusts at runtime.
>
> **Sync:** `POST /api/tasks/sync` or `/sync` — writes to KV (10ms), then TypeDB (100ms)
> **Generated:** 2026-04-16T12:22:46

---

## Active TODOs

| TODO | Open | Done | Status |
|------|-----:|-----:|--------|
| [TODO-commands](TODO-commands.md) | 34 | 3 | PROVE |
| [TODO-SUI](TODO-SUI.md) | 30 | 28 | PROVE |
| [TODO-collusion](TODO-collusion.md) | 30 | 24 | PROVE |
| [TODO-claw](TODO-claw.md) | 23 | 23 | PROVE |
| [TODO-rename](TODO-rename.md) | 23 | 1 | PROVE |
| [TODO-task-management](TODO-task-management.md) | 16 | 10 | PROVE |
| [TODO-debby](TODO-debby.md) | 13 | 35 | PROVE |
| [TODO-marketplace](TODO-marketplace.md) | 13 | 8 | PROVE |
| [TODO-ONE-strategy](TODO-ONE-strategy.md) | 11 | 3 | PROVE |
| [TODO-ui-signals](TODO-ui-signals.md) | 9 | 7 | PROVE |
| [TODO-CLAUDE](TODO-CLAUDE.md) | 8 | 0 | WIRE |
| [TODO-testing](TODO-testing.md) | 7 | 33 | PROVE |
| [TODO-client-ui](TODO-client-ui.md) | 6 | 3 | PROVE |
| [TODO-design-system-hardening](TODO-design-system-hardening.md) | 5 | 1 | PROVE |
| [TODO-rich-messages](TODO-rich-messages.md) | 5 | 23 | PROVE |
| [TODO-security](TODO-security.md) | 5 | 0 | WIRE |
| [TODO-autonomous-orgs](TODO-autonomous-orgs.md) | 4 | 6 | PROVE |
| [TODO-design-system](TODO-design-system.md) | 3 | 3 | PROVE |
| [TODO-speed-test-page](TODO-speed-test-page.md) | 3 | 0 | WIRE |
| [TODO-lifecycle](TODO-lifecycle.md) | 1 | 27 | PROVE |
| [TODO-one-big-group](TODO-one-big-group.md) | 1 | 0 | WIRE |
| [TODO-ad](TODO-ad.md) | 0 | 2 | DONE |
| [TODO-adl](TODO-adl.md) | 0 | 29 | DONE |
| [TODO-chat-memory](TODO-chat-memory.md) | 0 | 17 | DONE |
| [TODO-chat](TODO-chat.md) | 0 | 9 | DONE |
| [TODO-copy-toolkit](TODO-copy-toolkit.md) | 0 | 3 | DONE |
| [TODO-deploy](TODO-deploy.md) | 0 | 4 | DONE |
| [TODO-marketplace-experience](TODO-marketplace-experience.md) | 0 | 3 | DONE |
| [TODO-memory](TODO-memory.md) | 0 | 12 | DONE |
| [TODO-signal-shape](TODO-signal-shape.md) | 0 | 16 | DONE |
| [TODO-signal](TODO-signal.md) | 0 | 5 | DONE |
| [TODO-typedb](TODO-typedb.md) | 0 | 19 | DONE |

---

## Top 15 by Effective Priority

- [ ] **Build CEO control panel: hire/fire/commend/flag agents** [sonnet] `ui, governance, P0, ceo` ← [TODO-ONE-strategy](TODO-ONE-strategy.md)
  exit: CEO can manage AI agents: delegate tasks, view top performers, flag bad actors
- [ ] **Wire CEO visibility: highways (top 10 performers)** [sonnet] `ui, analytics, P0, ceo` ← [TODO-ONE-strategy](TODO-ONE-strategy.md)
  exit: CEO sees top 10 by net strength (reputation = mark - warn). Arithmetic only.
- [ ] ****1f. Decide diff specs for all 5 docs**** [sonnet] `docs, decide, P0` ← [TODO-commands](TODO-commands.md)
  exit: 5 diff spec sets + Command Set section draft + placement decision (dictionary.md vs new commands.md)
- [ ] **Add task-wave and task-context to world.tql** [haiku] `typedb, schema, P0` ← [TODO-task-management](TODO-task-management.md)
  exit: task owns task-wave (W1-W4) and task-context (doc keys). Attributes defined.
- [ ] **Create 7-persona vocabulary layer: CEO/Dev/Investor/Gamer/Kid/Freelancer/Agent** [sonnet] `foundation, design, P1, governance` ← [TODO-ONE-strategy](TODO-ONE-strategy.md)
  exit: Every formula maps to 7 vocabulary skins. Same math, different words.
- [ ] ****2f. Decide 5 file bodies + delete list + routing blocks**** [opus] `commands, decide, P0` ← [TODO-commands](TODO-commands.md)
  exit: 5 file bodies drafted + explicit delete list for 11 old files
- [ ] **Map waves to core.ts sense→select→act→mark** [sonnet] `engine, build, P0` ← [TODO-task-management](TODO-task-management.md)
  exit: W1=sense, W2=select, W3=act, W4=mark. Each wave is a Loop<T> from core.ts.
- [ ] **Build context envelope that accumulates across waves** [sonnet] `engine, build, P0` ← [TODO-task-management](TODO-task-management.md)
  exit: Each .then() carries previous output + new context. W4 has full history of all waves.
- [ ] **Create rubric scorer with tagged-edge marks** [sonnet] `engine, build, P0` ← [TODO-task-management](TODO-task-management.md)
  exit: markDims() emits edge:fit, edge:form, edge:truth, edge:taste. Haiku judges.
- [ ] **Self-checkoff: W4 verify pass marks task done** [sonnet] `engine, build, P0` ← [TODO-task-management](TODO-task-management.md)
  exit: selfCheckoff() → markTaskDone + update checkbox + mark path + unblock + know
- [ ] **Create agent self-improvement loop: rewrite prompts when success-rate < 50%** [opus] `intelligence, learning, P1, foundation` ← [TODO-ONE-strategy](TODO-ONE-strategy.md)
  exit: Agent prompt auto-rewrites every 10 min if samples >= 20 AND success < 50%
- [ ] **Dashboard: Show task graph + pheromone in real-time** [opus] `ui, reactflow, P1, visualization` ← [TODO-autonomous-orgs](TODO-autonomous-orgs.md)
  exit: ReactFlow visualization showing tasks, dependencies, pheromone trails
- [ ] ****1a. Update world.tql**** [haiku] `schema, foundation, P0` ← [TODO-collusion](TODO-collusion.md)
  exit: `grep "owns owner" src/schema/world.tql` returns true; wave-lock entity defined
- [ ] **Mark each wave transition as a path** [sonnet] `engine, build, P0` ← [TODO-task-management](TODO-task-management.md)
  exit: recon→decide, decide→edit, edit→verify each get mark/warn per outcome
- [ ] **Wire TaskCompleted hook for verify gate** [sonnet] `infra, build, P1` ← [TODO-testing](TODO-testing.md)
  exit: TaskCompleted hook runs bun run verify. Blocks if tests regress. Gates the mark.

---

## C1: Foundation

- [ ] **Build CEO control panel: hire/fire/commend/flag agents** — critical=30 + C1=40 + ceo=25 + blocks(1)=5 [sonnet] `ui, governance, P0, ceo` ← [ONE-strategy](TODO-ONE-strategy.md)
  exit: CEO can manage AI agents: delegate tasks, view top performers, flag bad actors
  blocks: ceo-control-live
- [ ] **Wire CEO visibility: highways (top 10 performers)** — critical=30 + C1=40 + ceo=25 + blocks(1)=5 [sonnet] `ui, analytics, P0, ceo` ← [ONE-strategy](TODO-ONE-strategy.md)
  exit: CEO sees top 10 by net strength (reputation = mark - warn). Arithmetic only.
  blocks: ceo-control-live
- [ ] ****1f. Decide diff specs for all 5 docs**** — critical=30 + C1=40 + opus=5 + blocks(5)=20 [sonnet] `docs, decide, P0` ← [commands](TODO-commands.md)
  exit: 5 diff spec sets + Command Set section draft + placement decision (dictionary.md vs new commands.md)
  blocks: c1-edit-dict, c1-edit-dsl, c1-edit-routing, c1-edit-claude, c1-edit-engine-rule
- [ ] **Create 7-persona vocabulary layer: CEO/Dev/Investor/Gamer/Kid/Freelancer/Agent** — high=25 + C1=40 + dev=20 + blocks(1)=5 [sonnet] `foundation, design, P1, governance` ← [ONE-strategy](TODO-ONE-strategy.md)
  exit: Every formula maps to 7 vocabulary skins. Same math, different words.
  blocks: persona-translation
- [ ] ****1a. Update world.tql**** — critical=30 + C1=40 + haiku=5 + blocks(2)=10 [haiku] `schema, foundation, P0` ← [collusion](TODO-collusion.md)
  exit: `grep "owns owner" src/schema/world.tql` returns true; wave-lock entity defined
  blocks: c1-schema-attribute, c2-filter-tasks
- [ ] **Wire TaskCompleted hook for verify gate** — high=25 + C1=40 + dev=20 [sonnet] `infra, build, P1` ← [testing](TODO-testing.md)
  exit: TaskCompleted hook runs bun run verify. Blocks if tests regress. Gates the mark.
- [ ] ****1b. Update world.tql attributes**** — critical=30 + C1=40 + haiku=5 + blocks(1)=5 [haiku] `schema, foundation, P0` ← [collusion](TODO-collusion.md)
  exit: `grep "attribute owner, value string" src/schema/world.tql` returns true
  blocks: c2-filter-tasks
- [ ] ****2a. Create src/pages/api/tasks/[id]/claim.ts**** — critical=30 + C1=40 + sonnet=5 + blocks(1)=5 [sonnet] `endpoint, atomicity, P0` ← [collusion](TODO-collusion.md)
  exit: `curl POST /api/tasks/{id}/claim` returns 200 with owner; 409 if already claimed
  blocks: c1-claim-test
- [ ] ****2b. Write atomic TypeQL query for claim**** — critical=30 + C1=40 + sonnet=5 + blocks(1)=5 [haiku] `typedb, atomicity, P0` ← [collusion](TODO-collusion.md)
  exit: Query has `match ... has task-status $s; $s = "open"; delete ... insert active + owner`
  blocks: c1-claim-create
- [ ] ****4a. Create src/pages/api/tasks/expire.ts**** — high=25 + C1=40 + sonnet=5 + blocks(2)=10 [sonnet] `endpoint, recovery, P0` ← [collusion](TODO-collusion.md)
  exit: `curl GET /api/tasks/expire` returns `{ expired: [...], count: N }`
  blocks: c1-expire-test, c2-tick-integration
- [ ] ****4f. W0 baseline (before C1)**** — critical=30 + C1=40 + haiku=5 + blocks(1)=5 [haiku] `gate, baseline, P0` ← [collusion](TODO-collusion.md)
  exit: `bun run verify` passes; all baseline tests green
  blocks: c1-schema-task
- [ ] ****1a. Recon dictionary.md for emit/commands/tick**** — critical=30 + C1=40 + haiku=5 + blocks(1)=5 [haiku] `docs, recon, P0` ← [commands](TODO-commands.md)
  exit: Report lists every mention of `emit`, command names, and The Tick section, with line numbers
  blocks: c1-decide
- [ ] ****1b. Recon DSL.md for send vs emit + command refs**** — critical=30 + C1=40 + haiku=5 + blocks(1)=5 [haiku] `docs, recon, P0` ← [commands](TODO-commands.md)
  exit: Report on send/emit usage and any command cross-references
  blocks: c1-decide
- [ ] ****1c. Recon routing.md for router vs command vocabulary**** — critical=30 + C1=40 + haiku=5 + blocks(1)=5 [haiku] `docs, recon, P0` ← [commands](TODO-commands.md)
  exit: Report on Formula, Two Routing Modes, any command references, terminology drift
  blocks: c1-decide
- [ ] ****1d. Recon CLAUDE.md Slash Commands block**** — critical=30 + C1=40 + haiku=5 + blocks(1)=5 [haiku] `docs, recon, P0` ← [commands](TODO-commands.md)
  exit: Report current Slash Commands section with exact line ranges + all cross-refs
  blocks: c1-decide
- [ ] ****1g. Edit dictionary.md — send-rename + Command Set section**** — critical=30 + C1=40 + sonnet=5 + blocks(1)=5 [sonnet] `docs, edit, P0` ← [commands](TODO-commands.md)
  exit: Six Verbs uses `send`; new "The Command Set" section lists 5 verbs with router-primitive mapping
  blocks: c1-verify
- [ ] ****1j. Edit CLAUDE.md — replace Slash Commands with 5-verb sheet**** — critical=30 + C1=40 + sonnet=5 + blocks(1)=5 [sonnet] `docs, edit, P0` ← [commands](TODO-commands.md)
  exit: Slash Commands block is the 5-verb cheat sheet; no `/grow`, `/next`, `/report`, `/extract-tasks` references
  blocks: c1-verify
- [ ] **Phase 0: Execute file renames** — critical=30 + C1=40 + operator (human)=5 + blocks(1)=5 [haiku] `migration, sequential, P0` ← [rename](TODO-rename.md)
  exit: All Phase 0 renames complete (git mv), commit, no compile errors
  blocks: phase-1-start
- [ ] **Phase 1: Migrate engine files (5 files × parallel)** — critical=30 + C1=40 + sonnet=5 + blocks(1)=5 [opus] `migration, engine, P0` ← [rename](TODO-rename.md)
  exit: All 5 engine files converted. Import paths fixed. tsc passes.
  blocks: phase-2-start
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
- [ ] ****2c. Re-read confirmation pattern (claim verify)**** — high=25 + C1=40 + sonnet=5 + blocks(1)=5 [haiku] `typedb, verification, P0` ← [collusion](TODO-collusion.md)
  exit: Second TypeQL query confirms match or rejects claim
  blocks: c1-claim-test
- [ ] ****3a. Create src/pages/api/tasks/[id]/release.ts**** — high=25 + C1=40 + sonnet=5 + blocks(1)=5 [sonnet] `endpoint, ownership, P0` ← [collusion](TODO-collusion.md)
  exit: `curl POST /api/tasks/{id}/release {sessionId}` returns 200; 403 if wrong owner
  blocks: c1-release-test
- [ ] ****3b. Owner-checked release query**** — high=25 + C1=40 + sonnet=5 + blocks(1)=5 [haiku] `typedb, safety, P0` ← [collusion](TODO-collusion.md)
  exit: TypeQL matches owner before deleting; non-owner gets empty result
  blocks: c1-release-create
- [ ] ****4b. TTL check logic (30 minutes)**** — high=25 + C1=40 + sonnet=5 + blocks(1)=5 [haiku] `ttl, recovery, P0` ← [collusion](TODO-collusion.md)
  exit: `const CLAIM_TTL_MS = 30 * 60 * 1000` defined; tasks older than TTL are released
  blocks: c1-expire-create
- [ ] ****4g. W4 verify (after C1)**** — critical=30 + C1=40 + sonnet=5 [haiku] `gate, verify, P0` ← [collusion](TODO-collusion.md)
  exit: `bun run verify` passes; claim/release/expire tests pass; rubric ≥ 0.65 all dims
- [ ] ****1e. Recon engine.md rule for emit vs send**** — high=25 + C1=40 + haiku=5 + blocks(1)=5 [haiku] `docs, recon, P1` ← [commands](TODO-commands.md)
  exit: Report every `emit`/`send`/command reference in `.claude/rules/engine.md`
  blocks: c1-decide
- [ ] ****1h. Edit DSL.md — cross-link to Command Set**** — high=25 + C1=40 + sonnet=5 + blocks(1)=5 [haiku] `docs, edit, P1` ← [commands](TODO-commands.md)
  exit: One-line note in DSL.md cross-linking dictionary's Command Set
  blocks: c1-verify
- [ ] ****1i. Edit routing.md — router↔command mapping paragraph**** — high=25 + C1=40 + sonnet=5 + blocks(1)=5 [haiku] `docs, edit, P1` ← [commands](TODO-commands.md)
  exit: One paragraph explaining /see↔follow, /do↔select, /close↔mark/warn, /sync↔tick+know
  blocks: c1-verify
- [ ] ****1k. Edit engine.md rule — send-rename**** — high=25 + C1=40 + sonnet=5 + blocks(1)=5 [haiku] `docs, edit, P1` ← [commands](TODO-commands.md)
  exit: `.claude/rules/engine.md` uses `send` for the public verb
  blocks: c1-verify
- [ ] ****1l. Verify C1 — 326/326 green, 5 docs cross-consistent**** — critical=30 + C1=40 + sonnet=5 [haiku] `docs, verify, gate, P0` ← [commands](TODO-commands.md)
  exit: `bun run verify` green; dictionary + DSL + routing + CLAUDE.md + engine.md agree on 5 verbs + send; rubric ≥ 0.65

---

## C2: Collaboration

- [ ] **Add task-wave and task-context to world.tql** — critical=30 + C2=35 + dev=20 + blocks(2)=10 [haiku] `typedb, schema, P0` ← [task-management](TODO-task-management.md)
  exit: task owns task-wave (W1-W4) and task-context (doc keys). Attributes defined.
  blocks: wave-runner-unit, wave-context-envelope
- [ ] ****2f. Decide 5 file bodies + delete list + routing blocks**** — critical=30 + C2=35 + opus=5 + blocks(6)=20 [opus] `commands, decide, P0` ← [commands](TODO-commands.md)
  exit: 5 file bodies drafted + explicit delete list for 11 old files
  blocks: c2-write-see, c2-write-create, c2-write-do, c2-write-close, c2-write-sync, c2-cleanup
- [ ] **Map waves to core.ts sense→select→act→mark** — critical=30 + C2=35 + dev=20 + blocks(1)=5 [sonnet] `engine, build, P0` ← [task-management](TODO-task-management.md)
  exit: W1=sense, W2=select, W3=act, W4=mark. Each wave is a Loop<T> from core.ts.
  blocks: wave-runner-unit
- [ ] **Build context envelope that accumulates across waves** — critical=30 + C2=35 + dev=20 + blocks(1)=5 [sonnet] `engine, build, P0` ← [task-management](TODO-task-management.md)
  exit: Each .then() carries previous output + new context. W4 has full history of all waves.
  blocks: wave-runner-unit
- [ ] **Create rubric scorer with tagged-edge marks** — critical=30 + C2=35 + dev=20 + blocks(1)=5 [sonnet] `engine, build, P0` ← [task-management](TODO-task-management.md)
  exit: markDims() emits edge:fit, edge:form, edge:truth, edge:taste. Haiku judges.
  blocks: wave-mark-transitions
- [ ] **Create agent self-improvement loop: rewrite prompts when success-rate < 50%** — high=25 + C2=35 + dev=20 + blocks(1)=5 [opus] `intelligence, learning, P1, foundation` ← [ONE-strategy](TODO-ONE-strategy.md)
  exit: Agent prompt auto-rewrites every 10 min if samples >= 20 AND success < 50%
  blocks: evolution-live
- [ ] **Dashboard: Show task graph + pheromone in real-time** — high=25 + C2=35 + dev=20 + blocks(1)=5 [opus] `ui, reactflow, P1, visualization` ← [autonomous-orgs](TODO-autonomous-orgs.md)
  exit: ReactFlow visualization showing tasks, dependencies, pheromone trails
  blocks: task-board-live
- [ ] **Parse wave and context from TODO files** — high=25 + C2=35 + dev=20 [haiku] `engine, build, P1` ← [task-management](TODO-task-management.md)
  exit: task-parse.ts reads wave: and context: fields. Default W3, context from tags.
- [ ] **Route model by wave position** — high=25 + C2=35 + dev=20 [haiku] `engine, build, P1` ← [task-management](TODO-task-management.md)
  exit: W1→haiku, W2→opus, W3→sonnet, W4→sonnet. EFFORT_MODEL fallback.
- [ ] **Make /work wave-aware** — high=25 + C2=35 + dev=20 [sonnet] `engine, build, P1` ← [task-management](TODO-task-management.md)
  exit: /work detects wave, spawns correct model, advances on success
- [ ] **Make TODO template a /todo skill** — high=25 + C2=35 + dev=20 [haiku] `engine, build, P1` ← [task-management](TODO-task-management.md)
  exit: /todo creates a TODO file from source doc with wave structure, DSL+dict context, schema link
- [ ] **Test tag-filtered loop routing: previousTarget → tag join → task selection** — high=25 + C2=35 + dev=20 [sonnet] `engine, test, P1` ← [testing](TODO-testing.md)
  exit: Loop L1b tries tag-filtered query first when previousTarget set. Falls back to global priority. Tag match prefers relevant tasks over highest-priority unrelated ones.
- [ ] **Docs: Cross-link dictionary.md + one-ontology.md to task execution** — medium=20 + C2=35 + dev=20 [haiku] `docs, integration, P1, knowledge` ← [autonomous-orgs](TODO-autonomous-orgs.md)
  exit: docs/dictionary.md and docs/one-ontology.md link to task system
- [ ] ****2a. Recon /tasks + /highways → /see absorption**** — critical=30 + C2=35 + haiku=5 + blocks(1)=5 [haiku] `commands, recon, P0` ← [commands](TODO-commands.md)
  exit: Report of current steps + noun surface for /see
  blocks: c2-decide
- [ ] ****2b. Recon /todo + /add-task + /extract-tasks → /create absorption**** — critical=30 + C2=35 + haiku=5 + blocks(1)=5 [haiku] `commands, recon, P0` ← [commands](TODO-commands.md)
  exit: Report of creation flows + noun surface for /create
  blocks: c2-decide
- [ ] ****2c. Recon /wave + /work + /next → /do absorption**** — critical=30 + C2=35 + haiku=5 + blocks(1)=5 [haiku] `commands, recon, P0` ← [commands](TODO-commands.md)
  exit: Report of orchestration logic + --once semantics
  blocks: c2-decide
- [ ] ****2d. Recon /done + /report → /close absorption**** — critical=30 + C2=35 + haiku=5 + blocks(1)=5 [haiku] `commands, recon, P0` ← [commands](TODO-commands.md)
  exit: Report of close + session-record flows
  blocks: c2-decide
- [ ] ****2e. Recon /sync + /grow → /sync absorption**** — critical=30 + C2=35 + haiku=5 + blocks(1)=5 [haiku] `commands, recon, P0` ← [commands](TODO-commands.md)
  exit: Report of tick + doc-scan + noun surface for any-markdown
  blocks: c2-decide
- [ ] ****2g. Write .claude/commands/see.md — full noun surface incl. L4-L6 views**** — critical=30 + C2=35 + sonnet=5 + blocks(1)=5 [sonnet] `commands, edit, P0` ← [commands](TODO-commands.md)
  exit: /see handles tasks/highways/frontiers/toxic/paths + hypotheses/evolved/revenue/events nouns; each maps to a TypeDB read or follow() call; loop-coverage table at top
  blocks: c2-verify
- [ ] ****2h. Write .claude/commands/create.md — task/todo/agent/signal**** — critical=30 + C2=35 + sonnet=5 + blocks(1)=5 [sonnet] `commands, edit, P0` ← [commands](TODO-commands.md)
  exit: /create handles task/todo/agent/signal nouns; all emit via send(); signal is the ad-hoc testing verb
  blocks: c2-verify
- [ ] ****2i. Write .claude/commands/do.md — wave / auto / once / autonomous**** — critical=30 + C2=35 + sonnet=5 + blocks(1)=5 [sonnet] `commands, edit, P0` ← [commands](TODO-commands.md)
  exit: /do handles {TODO}/{TODO} --auto/{TODO} --wave N/(empty)/--once modes; maps to select() + wave routing
  blocks: c2-verify
- [ ] ****2j. Write .claude/commands/close.md — Four Outcomes (mark + warn variants)**** — critical=30 + C2=35 + sonnet=5 + blocks(1)=5 [sonnet] `commands, edit, P0` ← [commands](TODO-commands.md)
  exit: /close handles {id}/(empty)/--fail/--dissolved/--timeout; each maps to the Four Outcomes; Rule 1 closed-loop fully covered
  blocks: c2-verify
- [ ] ****2k. Rewrite .claude/commands/sync.md — absorb tick + L3-L7 sub-invocations + pay + any-markdown**** — critical=30 + C2=35 + sonnet=5 + blocks(1)=5 [opus] `commands, edit, P0` ← [commands](TODO-commands.md)
  exit: /sync handles default/tick/fade/evolve/know/frontier/pay/docs/todos/agents/{path} nouns; each nounable loop L3-L7 exposed; L4 pay emits payment signal with content+weight
  blocks: c2-verify
- [ ] ****2m-extra. Four-Outcomes smoke test script**** — critical=30 + C2=35 + sonnet=5 + blocks(1)=5 [sonnet] `commands, test, P0` ← [commands](TODO-commands.md)
  exit: `.claude/commands/` has a tiny smoke doc showing all 4 /close modes emit the correct mark/warn/neutral; verified by inspection or new vitest
  blocks: c2-verify
- [ ] **Phase 2: Migrate schema files (8 files × parallel)** — critical=30 + C2=35 + sonnet=5 + blocks(1)=5 [opus] `migration, schema, P0` ← [rename](TODO-rename.md)
  exit: All 8 schema files converted. world.tql compiles. No broken TypeQL.
  blocks: phase-3-start
- [ ] **Test doc-scan.ts: item extraction, verification, gaps→signals** — medium=20 + C2=35 + dev=20 [sonnet] `engine, test, P2` ← [testing](TODO-testing.md)
  exit: doc-scan.ts test file. Covers: extractItems (checkboxes, gaps), inferTags, inferPriority, verify (keyword match), gapsToSignals
- [ ] ****5a. Modify src/pages/api/tasks/index.ts (local store path)**** — high=25 + C2=35 + sonnet=5 + blocks(1)=5 [haiku] `api, filtering, P0` ← [collusion](TODO-collusion.md)
  exit: `filtered = filtered.filter(t => t.status !== 'in_progress')` added
  blocks: c2-filter-test
- [ ] ****5b. Modify src/pages/api/tasks/index.ts (TypeDB path)**** — high=25 + C2=35 + sonnet=5 + blocks(1)=5 [haiku] `api, filtering, typedb, P0` ← [collusion](TODO-collusion.md)
  exit: TypeQL has `not { $t has task-status "active"; };` in match clause
  blocks: c2-filter-test
- [ ] ****6a. Modify src/engine/task-sync.ts**** — high=25 + C2=35 + sonnet=5 + blocks(1)=5 [sonnet] `sync, safety, P0` ← [collusion](TODO-collusion.md)
  exit: `syncTasks()` reads active task IDs before batch; skips them during insert
  blocks: c2-sync-test
- [ ] ****6b. Active ID set pattern**** — high=25 + C2=35 + sonnet=5 + blocks(1)=5 [haiku] `sync, safety, P0` ← [collusion](TODO-collusion.md)
  exit: `const activeIds = new Set(...)` populated from TypeDB match
  blocks: c2-sync-guard
- [ ] ****7a. Modify src/pages/api/tasks/[id]/complete.ts**** — high=25 + C2=35 + sonnet=5 + blocks(1)=5 [haiku] `api, cleanup, P0` ← [collusion](TODO-collusion.md)
  exit: After `task-status = "done"`, fire `delete owner of $t; delete claimed-at of $t`
  blocks: c2-complete-test
- [ ] ****8f. W4 verify (after C2)**** — critical=30 + C2=35 + sonnet=5 [haiku] `gate, verify, P0` ← [collusion](TODO-collusion.md)
  exit: All C2 tests pass; no regressions; rubric ≥ 0.65 all dims
- [ ] ****2l-extra. Update CLAUDE.md Skills section to the expanded noun grid**** — high=25 + C2=35 + sonnet=5 + blocks(1)=5 [haiku] `docs, edit, P1` ← [commands](TODO-commands.md)
  exit: CLAUDE.md lists 5 verbs with full noun grid; no stale command names
  blocks: c2-verify
- [ ] ****2n-extra. Verify loop-coverage table consistency**** — high=25 + C2=35 + sonnet=5 + blocks(1)=5 [haiku] `docs, verify, P1` ← [commands](TODO-commands.md)
  exit: Loop-coverage table in TODO-commands.md matches table in each command file (cross-doc consistency)
  blocks: c2-verify
- [ ] ****2o. Cleanup — delete 11 old command files**** — high=25 + C2=35 + sonnet=5 + blocks(1)=5 [haiku] `commands, edit, P0` ← [commands](TODO-commands.md)
  exit: 11 files deleted (tasks, highways, todo, add-task, extract-tasks, wave, work, next, done, report, grow); 5 remain (see/create/do/close/sync)
  blocks: c2-verify
- [ ] ****2p. Verify C2 — 5 commands live, full noun coverage, green gate**** — critical=30 + C2=35 + sonnet=5 [haiku] `commands, verify, gate, P0` ← [commands](TODO-commands.md)
  exit: `ls .claude/commands/*.md | wc -l` = 5; every loop L1-L7 has at least one invokable noun; Four Outcomes covered by /close flags; `bun run verify` green; rubric ≥ 0.65
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
- [ ] ****8a. Modify src/pages/api/tick.ts or create dedicated endpoint**** — medium=20 + C2=35 + sonnet=5 + blocks(1)=5 [sonnet] `tick, recovery, P0` ← [collusion](TODO-collusion.md)
  exit: `/api/tick` calls `expire()` or `/api/tick/expire` exists and runs on cycle
  blocks: c2-tick-test

---

## C3: Commerce

- [ ] **Self-checkoff: W4 verify pass marks task done** — critical=30 + C3=30 + dev=20 + blocks(2)=10 [sonnet] `engine, build, P0` ← [task-management](TODO-task-management.md)
  exit: selfCheckoff() → markTaskDone + update checkbox + mark path + unblock + know
  blocks: learn-wave-patterns, auto-unblock
- [ ] **Mark each wave transition as a path** — critical=30 + C3=30 + dev=20 + blocks(1)=5 [sonnet] `engine, build, P0` ← [task-management](TODO-task-management.md)
  exit: recon→decide, decide→edit, edit→verify each get mark/warn per outcome
  blocks: learn-wave-patterns
- [ ] **Wire Sui on-chain proofs: paths hardened immutable** — high=25 + C3=30 + investor=15 + blocks(1)=5 [opus] `commerce, sui, blockchain, P1, compliance` ← [ONE-strategy](TODO-ONE-strategy.md)
  exit: Strength, resistance, revenue locked on Sui. Auditable. Compliant.
  blocks: blockchain-live
- [ ] **Build marketplace: humans buy/sell services to agents** — high=25 + C3=30 + investor=15 + blocks(1)=5 [opus] `commerce, payments, P1, revenue` ← [ONE-strategy](TODO-ONE-strategy.md)
  exit: Skill pricing, payment routing, escrow settlement on Sui
  blocks: commerce-live
- [ ] **Revenue: Wire x402 payment routing on Sui (C3)** — high=25 + C3=30 + investor=15 + blocks(1)=5 [opus] `commerce, x402, sui, P0, foundation` ← [autonomous-orgs](TODO-autonomous-orgs.md)
  exit: Payments flow from skills to units on Sui blockchain
  blocks: commerce-live
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
- [ ] **Add CI pipeline: biome + tsc + vitest on every push** — high=25 + C3=30 + dev=20 [haiku] `infra, build, P1` ← [testing](TODO-testing.md)
  exit: GitHub Action runs bun run verify on push/PR. Badge in README.
- [ ] ****12f. Two-session parallel work test**** — critical=30 + C3=30 + sonnet=5 + blocks(1)=5 [opus] `test, integration, P0` ← [collusion](TODO-collusion.md)
  exit: Two /work sessions simultaneously → each picks different task, both complete successfully
  blocks: c3-grow-baseline
- [ ] ****3c. Decide sweep-diff spec**** — high=25 + C3=30 + opus=5 + blocks(2)=10 [sonnet] `docs, decide, P1` ← [commands](TODO-commands.md)
  exit: Sweep diff + index refresh spec
  blocks: c3-sweep-todos, c3-refresh-index
- [ ] **Detect failing wave patterns as frontiers** — medium=20 + C3=30 + dev=20 [haiku] `engine, P2` ← [task-management](TODO-task-management.md)
  exit: Repeated W3 fails → frontier. W4 retry > 2 → hypothesis "this pattern struggles"
- [ ] **Feed rubric dims into L5 for wave-runner evolution** — medium=20 + C3=30 + dev=20 [sonnet] `engine, typedb, P2` ← [task-management](TODO-task-management.md)
  exit: L5 reads per-dim strength. Low truth → evolve recon. Low form → evolve edit.
- [ ] **Coverage target: engine/ ≥ 80%, persist/ ≥ 70%** — medium=20 + C3=30 + dev=20 [haiku] `engine, test, P2` ← [testing](TODO-testing.md)
  exit: bun run test:coverage shows ≥80% line coverage for src/engine/*.ts
- [ ] ****9a. Create src/pages/api/waves/[docname]/claim.ts**** — high=25 + C3=30 + sonnet=5 + blocks(1)=5 [sonnet] `endpoint, wave-lock, P1` ← [collusion](TODO-collusion.md)
  exit: `curl POST /api/waves/TODO-rename.md/claim` returns 200; 409 if locked
  blocks: c3-wave-test
- [ ] ****9b. Create src/pages/api/waves/[docname]/release.ts**** — high=25 + C3=30 + sonnet=5 + blocks(1)=5 [sonnet] `endpoint, wave-lock, P1` ← [collusion](TODO-collusion.md)
  exit: `curl POST /api/waves/TODO-rename.md/release` releases lock (owner-checked)
  blocks: c3-wave-test
- [ ] ****10a. Modify .claude/commands/do.md (add SESSION_ID generation)**** — high=25 + C3=30 + sonnet=5 + blocks(1)=5 [haiku] `command, session, P0` ← [collusion](TODO-collusion.md)
  exit: `SESSION_ID="claude-$$-$(date +%s)"` added at top
  blocks: c3-work-test
- [ ] ****10b. Add claim step after SELECT**** — high=25 + C3=30 + sonnet=5 + blocks(1)=5 [sonnet] `command, claim, P0` ← [collusion](TODO-collusion.md)
  exit: POST /api/tasks/{id}/claim with SESSION_ID; retry on 409
  blocks: c3-work-test
- [ ] ****10c. Pass SESSION_ID to complete**** — high=25 + C3=30 + sonnet=5 + blocks(1)=5 [haiku] `command, integration, P0` ← [collusion](TODO-collusion.md)
  exit: POST /api/tasks/{id}/complete includes `"from": "$SESSION_ID"`
  blocks: c3-work-test
- [ ] ****11a. Modify .claude/commands/done.md (pass SESSION_ID)**** — high=25 + C3=30 + sonnet=5 + blocks(1)=5 [haiku] `command, release, P0` ← [collusion](TODO-collusion.md)
  exit: POST /api/tasks/{id}/complete includes `"sessionId": "$SESSION_ID"`
  blocks: c3-done-test
- [ ] ****12c. Session ID generation test**** — high=25 + C3=30 + sonnet=5 + blocks(1)=5 [haiku] `test, session, P0` ← [collusion](TODO-collusion.md)
  exit: Two `/work` invocations generate unique SESSION_IDs
  blocks: c3-grow-baseline
- [ ] ****12d. /done release test**** — high=25 + C3=30 + sonnet=5 + blocks(1)=5 [haiku] `test, release, P0` ← [collusion](TODO-collusion.md)
  exit: After `/done`, task owner is cleared; task back to open
  blocks: c3-grow-baseline
- [ ] ****12g. W4 verify (after C3)**** — critical=30 + C3=30 + sonnet=5 [haiku] `gate, verify, P0` ← [collusion](TODO-collusion.md)
  exit: All C3 tests pass; parallel session test succeeds; rubric ≥ 0.65 all dims
- [ ] ****3a. Recon all TODO-*.md for old command refs**** — high=25 + C3=30 + haiku=5 + blocks(1)=5 [haiku] `docs, recon, P1` ← [commands](TODO-commands.md)
  exit: Report: every line in `docs/TODO-*.md` mentioning an old command name
  blocks: c3-decide
- [ ] ****3b. Recon docs/TODO.md + top-level docs for cross-refs**** — high=25 + C3=30 + haiku=5 + blocks(1)=5 [haiku] `docs, recon, P1` ← [commands](TODO-commands.md)
  exit: Report cross-refs in docs/TODO.md and other index docs
  blocks: c3-decide
- [ ] ****3d. Sweep docs/TODO-*.md for old commands**** — high=25 + C3=30 + sonnet=5 + blocks(1)=5 [haiku] `docs, edit, P1` ← [commands](TODO-commands.md)
  exit: Zero active references to old commands in any TODO file
  blocks: c3-verify
- [ ] ****3e. Refresh docs/TODO.md index**** — high=25 + C3=30 + sonnet=5 + blocks(1)=5 [haiku] `docs, edit, P1` ← [commands](TODO-commands.md)
  exit: Active TODOs + Execution sections use 5-verb commands
  blocks: c3-verify
- [ ] ****3f. Verify C3 — sweep clean, green gate**** — critical=30 + C3=30 + sonnet=5 [haiku] `docs, verify, gate, P0` ← [commands](TODO-commands.md)
  exit: zero stale refs; `bun run verify` green; rubric ≥ 0.65
- [ ] **Phase 3: Migrate types/lib/skins (5 files × parallel)** — high=25 + C3=30 + sonnet=5 + blocks(1)=5 [opus] `migration, types, P1` ← [rename](TODO-rename.md)
  exit: All 5 files converted. tsc --noEmit clean.
  blocks: phase-4-start
- [ ] ****12a. Modify .claude/commands/wave.md (add wave claim)**** — medium=20 + C3=30 + sonnet=5 + blocks(1)=5 [sonnet] `command, wave-lock, P1` ← [collusion](TODO-collusion.md)
  exit: Before wave execution, POST /api/waves/{docname}/claim; abort if 409
  blocks: c3-wave-test
- [ ] ****12b. Release wave lock after completion**** — medium=20 + C3=30 + sonnet=5 + blocks(1)=5 [haiku] `command, wave-lock, P1` ← [collusion](TODO-collusion.md)
  exit: After final wave step, POST /api/waves/{docname}/release
  blocks: c3-wave-test
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
- [ ] **Phase 4: Migrate API endpoints (11 files × parallel)** — high=25 + C4=25 + sonnet=5 + blocks(1)=5 [opus] `migration, api, P1` ← [rename](TODO-rename.md)
  exit: All 11 files converted. API routes typed. tsc clean.
  blocks: phase-5-start
- [ ] **All 12 W1 gap reports returned with file:line citations** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [CLAUDE](TODO-CLAUDE.md)
- [ ] **All W2 diff specs cover every gap OR have explicit "keep" rationale** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [CLAUDE](TODO-CLAUDE.md)
- [ ] **`cli/CLAUDE.md` full rewrite spec exists** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [CLAUDE](TODO-CLAUDE.md)
- [ ] **All 12 CLAUDE.md files edited per spec** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [CLAUDE](TODO-CLAUDE.md)
- [ ] **Every required (file, doc) pair in the C1 matrix passes grep** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [CLAUDE](TODO-CLAUDE.md)
- [ ] **`cli/CLAUDE.md` describes the ONE substrate CLI, not Convex/web** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [CLAUDE](TODO-CLAUDE.md)
- [ ] **No broken relative doc paths (`../../docs/X.md` exists for each)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [CLAUDE](TODO-CLAUDE.md)
- [ ] **`npm run verify` still green (820/820 — CLAUDE.md edits can't break tests)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [CLAUDE](TODO-CLAUDE.md)
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
- [ ] **Harden highways (`freeze_object()`, $0.50 fee)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [SUI](TODO-SUI.md)
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
- [ ] **Routing logic works (confidence scoring)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [claw](TODO-claw.md)
- [ ] **Simple path faster than complex path** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [claw](TODO-claw.md)
- [ ] **Substrate.ask() integration works** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [claw](TODO-claw.md)
- [ ] **Mark happens in both paths** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [claw](TODO-claw.md)
- [ ] **Rubric ≥ 0.75 (fit: routing works, form: clean, truth: tested)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [claw](TODO-claw.md)
- [ ] **Local marks work (D1 updated)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [claw](TODO-claw.md)
- [ ] **Global marks work (queue delivered)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [claw](TODO-claw.md)
- [ ] **Highway refresh syncs learning** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [claw](TODO-claw.md)
- [ ] **Rubric ≥ 0.75 (fit: dual path works, form: clean signals, truth: tested)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [claw](TODO-claw.md)
- [ ] **Browser fetch works, returns clean summary** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [claw](TODO-claw.md)
- [ ] **Search returns relevant results** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [claw](TODO-claw.md)
- [ ] **Social context enriches understanding** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [claw](TODO-claw.md)
- [ ] **Discord threads work, Web reactions work** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [claw](TODO-claw.md)
- [ ] **LLM handles multi-tool sequences** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [claw](TODO-claw.md)
- [ ] **Rubric ≥ 0.70 (fit: all tools work, form: clean integration, truth: tested)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [claw](TODO-claw.md)
- [ ] ****W1** Recon social media APIs (Twitter, LinkedIn, Reddit)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [claw](TODO-claw.md)
- [ ] ****W2** Decide: free APIs only (Reddit) vs paid integration** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [claw](TODO-claw.md)
- [ ] ****W3** Sonnet edit: social.context(handle), rich message encoders** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [claw](TODO-claw.md)
- [ ] ****W4** Verify social + rich messaging works** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [claw](TODO-claw.md)
- [ ] ****W1** Recon tool chaining patterns** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [claw](TODO-claw.md)
- [ ] ****W2** Decide: single-call vs multi-turn tool loops** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [claw](TODO-claw.md)
- [ ] ****W3** Sonnet edit: LLM loop to capture tool results** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [claw](TODO-claw.md)
- [ ] ****W4** Verify multi-step sequences (fetch → search → summarize)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [claw](TODO-claw.md)
- [ ] **All baseline tests still pass (no regressions)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [client-ui](TODO-client-ui.md)
- [ ] **New tests cover new islands/routes** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [client-ui](TODO-client-ui.md)
- [ ] **`biome check .` clean** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [client-ui](TODO-client-ui.md)
- [ ] **`tsc --noEmit` clean** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [client-ui](TODO-client-ui.md)
- [ ] **W4 rubric score ≥ 0.65 on all dimensions** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [client-ui](TODO-client-ui.md)
- [ ] **Performance budgets verified with Lighthouse + perf traces** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [client-ui](TODO-client-ui.md)
- [ ] **Weekly summary signal to `debby:edu` (Director of Education) — needs cron** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [debby](TODO-debby.md)
- [ ] **Support: "We noticed you haven't been back in 5 days" — needs cron for churn detection** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [debby](TODO-debby.md)
- [ ] **`GET /student/:uid` — read student profile (for Debby's admin view)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [debby](TODO-debby.md)
- [ ] **`GET /students` — list all students with session counts + stages** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [debby](TODO-debby.md)
- [ ] **`GET /sidecar/:uid` — recent Amara session data for a student** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [debby](TODO-debby.md)
- [ ] **`POST /student/:uid/update` — manually update student goals, level, pillar** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [debby](TODO-debby.md)
- [ ] **Auth on admin endpoints (currently open)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [debby](TODO-debby.md)
- [ ] **Voice sample (5 min clean audio) → voice clone training** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [debby](TODO-debby.md)
- [ ] **Whop account signup → payment rail** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [debby](TODO-debby.md)
- [ ] **Site honesty fixes (WhatsApp number, Team page, Rise copy)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [debby](TODO-debby.md)
- [ ] **`elevare.work` DNS confirmation → Donal configures** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [debby](TODO-debby.md)
- [ ] **Meta ad account creation (Donal's is banned)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [debby](TODO-debby.md)
- [ ] **20 warm contacts list → outreach messages** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [debby](TODO-debby.md)
- [ ] **`bun run verify` passes** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [design-system-hardening](TODO-design-system-hardening.md)
- [ ] **≥ 6 new tests added (brandKey + API routes)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [design-system-hardening](TODO-design-system-hardening.md)
- [ ] **No regression on existing 12 brand tests** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [design-system-hardening](TODO-design-system-hardening.md)
- [ ] **Audit ≤ 333** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [design-system-hardening](TODO-design-system-hardening.md)
- [ ] **Rubric ≥ 0.65 (fit / form / truth / taste)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [design-system-hardening](TODO-design-system-hardening.md)
- [ ] **`scripts/audit-design-tokens.ts` reports findings ≤ baseline** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [design-system](TODO-design-system.md)
- [ ] **`/design?brand=purple` visibly reskins (M3 < 500ms repaint)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [design-system](TODO-design-system.md)
- [ ] **Rubric ≥ 0.65 on fit / form / truth / taste** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [design-system](TODO-design-system.md)
- [ ] ****Cycle 3: GROW** — Out of ONE (Highway, Harden, Federate, Dissolve) — 8/9 tasks closed 2026-04-16 (impl-proven-capability deferred to TODO-SUI.md)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [lifecycle](TODO-lifecycle.md)
- [ ] **New tests cover new SKU classes** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [marketplace](TODO-marketplace.md)
- [ ] **`biome check .` clean on touched files** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [marketplace](TODO-marketplace.md)
- [ ] **`tsc --noEmit` passes** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [marketplace](TODO-marketplace.md)
- [ ] **A real Sui testnet tx confirms the closing payment (cycles 2 & 3)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [marketplace](TODO-marketplace.md)
- [ ] **`bun run verify` green** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [marketplace](TODO-marketplace.md)
- [ ] **At least one SKU from Donal's pod visible without edits to his markdown** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [marketplace](TODO-marketplace.md)
- [ ] **Testnet tx confirms: post bounty → escrow locked (read `Bounty.status == locked`)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [marketplace](TODO-marketplace.md)
- [ ] **Testnet tx confirms: `mark()` → release fires → claimant balance increases** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [marketplace](TODO-marketplace.md)
- [ ] **Testnet tx confirms: `warn()` or timeout → refund fires → creator balance restored** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [marketplace](TODO-marketplace.md)
- [ ] **`bun run verify` green · `bun run scripts/test-ws-integration.ts` green** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [marketplace](TODO-marketplace.md)
- [ ] **OO Agency branded world live on `donal.one.ie` (or equivalent) with isolated pheromone** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [marketplace](TODO-marketplace.md)
- [ ] **First real invoice (even if $1 test charge on Donal's card) — proves rails** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [marketplace](TODO-marketplace.md)
- [ ] **`bun run verify` green · deploy pipeline green · health 4/4** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [marketplace](TODO-marketplace.md)
- [ ] ****Cycle 1: ONE BIG GROUP**** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [one-big-group](TODO-one-big-group.md)
- [ ] **RichMessage interface is exported and typed** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [rich-messages](TODO-rich-messages.md)
- [ ] **Discord sends embeds with title, description, fields, color** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [rich-messages](TODO-rich-messages.md)
- [ ] **Telegram/Web fallback to plain content** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [rich-messages](TODO-rich-messages.md)
- [ ] **Signal type unchanged (frozen)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [rich-messages](TODO-rich-messages.md)
- [ ] **D1 schema can store rich_type + rich_data JSON** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [rich-messages](TODO-rich-messages.md)
- [ ] ****Cycle 1: WIRE-DELETE** — remove XOR helpers, relocate utilities, fix ChatShell** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [security](TODO-security.md)
- [ ] ****Cycle 2: SCOPE-KEYS** — scope-group, scope-skill, default read, 24h TTL** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [security](TODO-security.md)
- [ ] ****Cycle 3: LOCK-PEP** — canonical PEP order + nonce + lint rule** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [security](TODO-security.md)
- [ ] ****Cycle 4: LEARN-SIGNALS** — security events → substrate signals + warn(0.3)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [security](TODO-security.md)
- [ ] ****Cycle 5: SHIELD-DATA** — HKDF wallet, tenant KEK, audit Merkle, worker JWT** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [security](TODO-security.md)
- [ ] ****Cycle 1: WIRE** — Shell + API** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [speed-test-page](TODO-speed-test-page.md)
- [ ] ****Cycle 2: PROVE** — Live Data + 9 Stops** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [speed-test-page](TODO-speed-test-page.md)
- [ ] ****Cycle 3: GROW** — Personas + Polish** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [speed-test-page](TODO-speed-test-page.md)
- [ ] **helper exists, typed, tested** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [ui-signals](TODO-ui-signals.md)
- [ ] **rule file exists, linked from CLAUDE.md** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [ui-signals](TODO-ui-signals.md)
- [ ] **ConversationView onClicks all call `emitClick` before local handler** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [ui-signals](TODO-ui-signals.md)
- [ ] **`/api/signal` accepts `ui:*` receivers, returns < 10ms p50** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [ui-signals](TODO-ui-signals.md)
- [ ] **rubric ≥ 0.65 on all dimensions** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [ui-signals](TODO-ui-signals.md)
- [ ] **prefetch hit rate ≥ 50% after 100 clicks** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [ui-signals](TODO-ui-signals.md)
- [ ] **click → TypeDB p50 latency drops measurably vs Cycle 2** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [ui-signals](TODO-ui-signals.md)
- [ ] **`/api/tick` reports `prefetchMs` alongside other loop timings** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [ui-signals](TODO-ui-signals.md)
- [ ] **rubric ≥ 0.75 on truth (measurements are real, not synthetic)** — medium=20 + C4=25 + agent=5 [sonnet] `` ← [ui-signals](TODO-ui-signals.md)

---

## C5: Analytics

- [ ] **Monitoring: Weekly success metrics dashboard** — medium=20 + C5=20 + investor=15 + blocks(1)=5 [sonnet] `analytics, metrics, P2, knowledge` ← [autonomous-orgs](TODO-autonomous-orgs.md)
  exit: Weekly report showing success rates, revenue, top performers, emerging frontiers
  blocks: metrics-live
- [ ] **Create kids learning path: learn pheromone by playing** — medium=20 + C5=20 + kid=10 + blocks(1)=5 [sonnet] `ui, education, gamification, P2, learning` ← [ONE-strategy](TODO-ONE-strategy.md)
  exit: Kids see ant colony, set mood (explore/exploit), watch trails form
  blocks: education-live
- [ ] **Phase 5: Migrate components (7 files × parallel)** — high=25 + C5=20 + sonnet=5 + blocks(1)=5 [opus] `migration, components, P1` ← [rename](TODO-rename.md)
  exit: All 7 component files converted. React types clean.
  blocks: phase-6-start

---

## C6: Products

- [ ] **Build token minting: creators mint their own tokens on Sui** — medium=20 + C6=15 + investor=15 + blocks(1)=5 [opus] `commerce, sui, tokenomics, P2, scale` ← [ONE-strategy](TODO-ONE-strategy.md)
  exit: Creators mint tokens, agents earn them, marketplace trades them
  blocks: tokenomics-live
- [ ] **Build multi-chain bridge: Sui, Ethereum, Solana native routing** — medium=20 + C6=15 + investor=15 + blocks(1)=5 [opus] `integration, blockchain, P2, scale` ← [ONE-strategy](TODO-ONE-strategy.md)
  exit: Routes work across chains. Payments settle on fastest chain. User chooses.
  blocks: multi-chain-live
- [ ] **Phase 6: Migrate Claude config (9 files × parallel)** — high=25 + C6=15 + sonnet=5 + blocks(1)=5 [sonnet] `migration, config, P1` ← [rename](TODO-rename.md)
  exit: All 9 config files converted. CLAUDE.md, rules, commands all updated.
  blocks: phase-7-start

---

## C7: Scale

- [ ] **Phase 7: Migrate docs (59 files × parallel Haiku)** — high=25 + C7=10 + haiku=5 + blocks(2)=10 [opus] `migration, docs, P1` ← [rename](TODO-rename.md)
  exit: All 59 doc files converted. No dead names in prose (except metaphor tables).
  blocks: phase-8-start, cycle-1-wire-start
- [ ] **Migration complete verification** — critical=30 + C7=10 + operator=5 + blocks(1)=5 [haiku] `migration, gate, P0` ← [rename](TODO-rename.md)
  exit: `bun run build` succeeds. Grep verification clean (no old vocab in engine/schema/types/api/components). All tests green.
  blocks: cycle-1-wire-start
- [ ] **Phase 8: Migrate packages/scripts (12 files × parallel)** — medium=20 + C7=10 + sonnet=5 + blocks(1)=5 [opus] `migration, packages, P2` ← [rename](TODO-rename.md)
  exit: All 12 files converted. Build succeeds.
  blocks: phase-9-start
- [ ] **Phase 9: Migrate archive (4 files × parallel, optional)** — low=20 + C7=10 + sonnet=5 + blocks(1)=5 [sonnet] `migration, archive, P3` ← [rename](TODO-rename.md)
  exit: Archive files converted (or skipped if not deploying)
  blocks: cycle-1-wire-start

---

## Done

- [x] **Prove deterministic routing speed: <0.01ms per decision** `foundation, test, P0, engineering` ← [ONE-strategy](TODO-ONE-strategy.md)
- [x] **Implement isToxic() blocking: resistance >= 10 AND resistance > 2× strength** `engineering, security, P0, foundation` ← [ONE-strategy](TODO-ONE-strategy.md)
- [x] **Build markdown agent deployment: write file, push, live in minutes** `agent, integration, P0, deployment` ← [ONE-strategy](TODO-ONE-strategy.md)
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
- [x] ****Cycle 1: WIRE — ship /ad**** `` ← [ad](TODO-ad.md)
- [x] ****Cycle 2: PROVE — instrument + speed flex**** `` ← [ad](TODO-ad.md)
- [x] **Retired unit receives signal → `warn(edge, 0.5)`, no execution ✓ evidence: src/engine/persist.ts:703-717 — 2026-04-16** `` ← [adl](TODO-adl.md)
- [x] **Past-sunset unit → same ✓ evidence: src/engine/persist.ts:719-733 — 2026-04-16** `` ← [adl](TODO-adl.md)
- [x] **Active unit → normal ask/outcome ✓ evidence: src/__tests__/integration/adl-lifecycle.test.ts:74-89 — 2026-04-16** `` ← [adl](TODO-adl.md)
- [x] **Bridge: allowed sender → `suiMark` fires; blocked sender → returns, no Sui call ✓ evidence: src/engine/bridge.ts:56-74 (canCallSui returns bool check) — 2026-04-16** `` ← [adl](TODO-adl.md)
- [x] **Bridge error path → **fails closed** (no Sui call) ✓ evidence: src/engine/bridge.ts:82-93 — 2026-04-16** `` ← [adl](TODO-adl.md)
- [x] **`invalidateAdlCache(uid)` flushes all four maps; post-sunset update visible in <100ms ✓ evidence: src/engine/adl-cache.ts:45-77 — 2026-04-16** `` ← [adl](TODO-adl.md)
- [x] **`ADL_ENFORCEMENT_MODE=audit` → denials logged but NOT blocked (regression guard) ✓ evidence: src/engine/adl-cache.ts:149-152, src/__tests__/integration/adl-cache.test.ts:159-170 — 2026-04-16** `` ← [adl](TODO-adl.md)
- [x] **W4 rubric ≥ 0.65 all dimensions ✓ evidence: Status §Cycle 1 — fit:0.85 form:0.90 truth:0.95 taste:0.80 avg=0.875 — 2026-04-16** `` ← [adl](TODO-adl.md)
- [x] **LLM call without `perm-env` → typed error, no OpenRouter hit ✓ evidence: src/engine/llm.ts:24-71 (canCallLLM returns bool, caller checks line 78 dissolved) — 2026-04-16** `` ← [adl](TODO-adl.md)
- [x] **LLM call with wildcard or correct key → succeeds ✓ evidence: src/__tests__/integration/adl-llm.test.ts:62-71 (wildcard and OPENROUTER key tests) — 2026-04-16** `` ← [adl](TODO-adl.md)
- [x] **API call to disallowed host → typed error ✓ evidence: src/engine/api.ts:32-60 (canCallAPI checks allowedHosts) — 2026-04-16** `` ← [adl](TODO-adl.md)
- [x] **API call to wildcard / allowed host → succeeds ✓ evidence: src/__tests__/integration/adl-api.test.ts:59-69 (wildcard and matching hostname tests) — 2026-04-16** `` ← [adl](TODO-adl.md)
- [x] **Valid skill input → passes; invalid → typed error ✓ evidence: src/engine/persist.ts:736-767 (SKILL_SCHEMA_CACHE validation, fail-open) — 2026-04-16** `` ← [adl](TODO-adl.md)
- [x] **Missing / malformed input-schema → fail-open (allows) ✓ evidence: src/__tests__/integration/adl-schema.test.ts:56-75 (missing and malformed schema tests) — 2026-04-16** `` ← [adl](TODO-adl.md)
- [x] **`world.ts` diff is empty (guardrail held) ✓ evidence: docs/TODO-adl.md:330 (Cycle 2 W3 spec: world.ts NOT touched) + Cycle 1.5/2/3 logs confirm zero-changes policy — 2026-04-16** `` ← [adl](TODO-adl.md)
- [x] **`ADL_ENFORCEMENT_MODE=audit` → denials logged, all three gates pass-through ✓ evidence: src/engine/adl-cache.ts:149-152, src/__tests__/integration/adl-llm.test.ts and adl-api.test.ts audit mode tests — 2026-04-16** `` ← [adl](TODO-adl.md)
- [x] **W4 rubric ≥ 0.65 all dimensions ✓ evidence: Status §Cycle 2 — fit:0.95 form:0.95 truth:1.00 taste:0.90 avg=0.95 — 2026-04-16** `` ← [adl](TODO-adl.md)
- [x] **NanoClaw deploy produces prompt with constraint block ✓ evidence: scripts/setup-nanoclaw.ts:92 ([OPERATIONAL CONSTRAINTS] appended) — 2026-04-16** `` ← [adl](TODO-adl.md)
- [x] **Worker env exposes `ADL_ALLOWED_HOSTS` / `ADL_DATA_SENSITIVITY` ✓ evidence: scripts/setup-nanoclaw.ts:237-238 (vars section with ADL_DATA_SENSITIVITY and ADL_ALLOWED_HOSTS) — 2026-04-16** `` ← [adl](TODO-adl.md)
- [x] **Evolved prompt appends `[OPERATIONAL CONSTRAINTS]` when ADL present ✓ evidence: src/engine/loop.ts:10,468 (augmentPromptWithADL called during evolution) — 2026-04-16** `` ← [adl](TODO-adl.md)
- [x] **Federated register → ADL fetched + synced ✓ evidence: src/engine/agentverse.ts:33-39 (fetch /.well-known/agents.json, syncAdl call) — 2026-04-16; missing ADL → warning, not failure** `` ← [adl](TODO-adl.md)
- [x] **`/.well-known/agents.json` now lists all units from all three cycles ✓ evidence: src/pages/.well-known/agents.json.ts:15-45 (queries all active units, reconstructs ADL docs) — 2026-04-16** `` ← [adl](TODO-adl.md)
- [x] **MCP surface either inherits gates OR has a documented decision + follow-up TODO ✓ evidence: docs/adl-mcp.md documents MCP decision: direct signal routing inherits all gates — 2026-04-16** `` ← [adl](TODO-adl.md)
- [x] ****Legacy agent (no ADL attrs) passes every gate in cycles 1–3** ✓ evidence: src/__tests__/integration/adl-lifecycle.test.ts:91-100 (fail-open when no adl-status rows) — 2026-04-16** `` ← [adl](TODO-adl.md)
- [x] **W4 rubric ≥ 0.65 all dimensions ✓ evidence: Status §Cycle 3 — fit:0.95 form:0.92 truth:1.00 taste:0.90 avg=0.94 — 2026-04-16** `` ← [adl](TODO-adl.md)
- [x] ****Cycle 1: WIRE** — Lifecycle + bridge gates (HIGH) ✓ 2026-04-15** `` ← [adl](TODO-adl.md)
- [x] ****Cycle 1.5: RETROFIT** — cache invalidation + deferred decisions ✓ 2026-04-15** `` ← [adl](TODO-adl.md)
- [x] ****Cycle 2: PROVE** — LLM / API / schema enforcement (MEDIUM) ✓ 2026-04-15** `` ← [adl](TODO-adl.md)
- [x] ****Cycle 3: GROW** — NanoClaw inject + evolution + federation + MCP audit (MEDIUM/LOW) ✓ 2026-04-15** `` ← [adl](TODO-adl.md)
- [x] **Schema: Add task, task-dependency, task-execution entities to world.tql** `typedb, schema, P0, foundation` ← [autonomous-orgs](TODO-autonomous-orgs.md)
- [x] **Functions: Write 6 task selection functions (priority, critical-path, bottleneck, etc.)** `typedb, routing, P0, foundation` ← [autonomous-orgs](TODO-autonomous-orgs.md)
- [x] **Seed: Insert Phase 1 tasks (marketing, engineering, telegram, dashboard) ✓ scripts/seed-org.ts · 4 tasks parsed with blocks wired · 2026-04-16** `typedb, build, P0, foundation` ← [autonomous-orgs](TODO-autonomous-orgs.md)
- [x] **Loop: Modify /api/tick to orchestrate tasks ✓ src/pages/api/tick.ts L1b block (+39 lines, env-gated TICK_ORCHESTRATE=1) · 2026-04-16** `api, routing, P0, foundation` ← [autonomous-orgs](TODO-autonomous-orgs.md)
- [x] **Agents: Create 8 marketing agents (markdown or HTTP)** `agent, marketing, P0, deployment` ← [autonomous-orgs](TODO-autonomous-orgs.md)
- [x] **Telegram: Wire signals to @onedotbot channel** `agent, telegram, P0, integration` ← [autonomous-orgs](TODO-autonomous-orgs.md)
- [x] **W0 Baseline — 332/332 tokens, biome+tsc+vitest green** `` ← [chat-memory](TODO-chat-memory.md)
- [x] **W1 Recon — router.ts, sui.ts, channels/index.ts, persist.ts actor()** `` ← [chat-memory](TODO-chat-memory.md)
- [x] **W2 Decide — nonce claim ceremony, D1 identity_links, no Sui deps in nanoclaw** `` ← [chat-memory](TODO-chat-memory.md)
- [x] **W3 Edit — `identity.ts`, `0006_identity_links.sql`, `/claim` + `/link` routes in router.ts, `identity.test.ts`** `` ← [chat-memory](TODO-chat-memory.md)
- [x] **W4 Verify — 7/7 identity tests pass, biome clean** `` ← [chat-memory](TODO-chat-memory.md)
- [x] **W1 Recon — agent-md.ts, agents/**/*.md shapes, personas.ts, no agents/core/ yet** `` ← [chat-memory](TODO-chat-memory.md)
- [x] **W2 Decide — classify + valence as Gemma 4 markdown agents, keyword fallback in classify-fallback.ts** `` ← [chat-memory](TODO-chat-memory.md)
- [x] **W3 Edit — `agents/core/classify.md`, `agents/core/valence.md`, `classify-fallback.ts`, `classify-fallback.test.ts`** `` ← [chat-memory](TODO-chat-memory.md)
- [x] **W4 Verify — 12/12 fallback tests pass, biome clean** `` ← [chat-memory](TODO-chat-memory.md)
- [x] **W1 Recon — chat-memory.md spec, persist.ts (open() only n, recall({subject}) ✓), edge.ts (no cached open/recall), llm.ts (Effect — not CF-safe)** `` ← [chat-memory](TODO-chat-memory.md)
- [x] **W2 Decide — 3-parallel D1+TypeDB, outcome at turn-start, ContextPack, substrate HTTP boundary** `` ← [chat-memory](TODO-chat-memory.md)
- [x] **W3 Edit — `units/types.ts`, `units/ingest.ts`, `units/recall.ts`, `units/respond.ts`, `units/outcome.ts`, `lib/prompt.ts`, `lib/substrate.ts` (+actorHighways +recallHypotheses), `0007_turn_meta.sql`, router.ts wired** `` ← [chat-memory](TODO-chat-memory.md)
- [x] **W4 Verify — 577/577 tests pass (recall.test.ts + prompt.test.ts), biome clean** `` ← [chat-memory](TODO-chat-memory.md)
- [x] **W1 Recon — no commands/ dir; /link pattern; memory API exists on Pages (not callable from nanoclaw); reveal/forget/frontier in persist.ts** `` ← [chat-memory](TODO-chat-memory.md)
- [x] **W2 Decide — commands use substrate.ts TypeDB queries directly; /forget two-step KV gate; /explore frontier tags; verbalize 0.85 threshold** `` ← [chat-memory](TODO-chat-memory.md)
- [x] **W3 Edit — `commands/memory.ts`, `commands/forget.ts`, `commands/explore.ts`, prompt.ts verbalize update, router.ts command dispatch wired** `` ← [chat-memory](TODO-chat-memory.md)
- [x] **W4 Verify — 585/585 tests pass (8 new V8/V9 command tests), biome clean** `` ← [chat-memory](TODO-chat-memory.md)
- [x] ****Cycle 1: WIRE** — Packages, UI atoms, lib, config** `` ← [chat](TODO-chat.md)
- [x] ****Cycle 2: PROVE** — AI elements, generative-ui, hooks** `` ← [chat](TODO-chat.md)
- [x] ****Cycle 3: GROW** — Top-level components + pages + API** `` ← [chat](TODO-chat.md)
- [x] ****Cycle 4: REFACTOR** — Shrink the god component** `` ← [chat](TODO-chat.md)
- [x] ****Cycle 5: REMEMBER** — Substrate memory (ingest/recall/outcome/promote)** `` ← [chat](TODO-chat.md)
- [x] ****Cycle 6: IDENTIFY** — Sui claim ceremony** `` ← [chat](TODO-chat.md)
- [x] ****Cycle 7: UNIVERSALIZE** — Four mount modes** `` ← [chat](TODO-chat.md)
- [x] ****Cycle 8: EMBED** — Third-party SDK** `` ← [chat](TODO-chat.md)
- [x] ****Cycle 9: EXPOSE** — Memory commands everywhere** `` ← [chat](TODO-chat.md)
- [x] ****W1-R1** Recon router.ts current flow** `` ← [claw](TODO-claw.md)
- [x] ****W1-R2** Recon respond.ts confidence detection** `` ← [claw](TODO-claw.md)
- [x] ****W1-R3** Recon substrate.ts ask() interface** `` ← [claw](TODO-claw.md)
- [x] ****W2** Opus decide: simple vs complex, routing threshold, AGENT_QUEUE delegation** `` ← [claw](TODO-claw.md)
- [x] ****W3** Sonnet edit: add routing logic to router.ts + update types.ts** `` ← [claw](TODO-claw.md)
- [x] ****W4-V1** Verify simple path: local reply in <3s → routing logic implemented** `` ← [claw](TODO-claw.md)
- [x] ****W4-V2** Verify complex path: substrate delegation works → AGENT_QUEUE integration** `` ← [claw](TODO-claw.md)
- [x] ****W4** Rubric 0.81/1.0 (fit 0.80, form 0.85, truth 0.75, taste 0.85) ✓ PASS** `` ← [claw](TODO-claw.md)
- [x] ****W1-R1** Recon substrate.ts mark/warn local interface** `` ← [claw](TODO-claw.md)
- [x] ****W1-R2** Recon loop.ts learning loops consume marks** `` ← [claw](TODO-claw.md)
- [x] ****W2** Opus decide: local mark + global signal async** `` ← [claw](TODO-claw.md)
- [x] ****W3** Sonnet edit: dual-path mark/warn in Claw + substrate** `` ← [claw](TODO-claw.md)
- [x] ****W4-V1** Verify local mark updates D1 (<100ms)** `` ← [claw](TODO-claw.md)
- [x] ****W4-V2** Verify global mark signals substrate, syncs highways** `` ← [claw](TODO-claw.md)
- [x] ****W4** Rubric 0.81/1.0 (fit 0.82, form 0.78, truth 0.80, taste 0.85) ✓ PASS** `` ← [claw](TODO-claw.md)
- [x] ****W1-R1** Recon web browsing use cases** `` ← [claw](TODO-claw.md)
- [x] ****W1-R2** Recon social media signals (deferred to 3.2)** `` ← [claw](TODO-claw.md)
- [x] ****W1-R3** Recon rich messaging (deferred to 3.2)** `` ← [claw](TODO-claw.md)
- [x] ****W1-R4** Recon tool composition (deferred to 3.2)** `` ← [claw](TODO-claw.md)
- [x] ****W1-R5** Recon error handling (deferred to 3.2)** `` ← [claw](TODO-claw.md)
- [x] ****W2** Opus scoped: web browsing only, defer social/rich/chaining** `` ← [claw](TODO-claw.md)
- [x] ****W3-E1** Sonnet edit: browser.fetch(url) ✓** `` ← [claw](TODO-claw.md)
- [x] ****W4** Rubric 0.875/1.0 (fit 0.90, form 0.88, truth 0.82, taste 0.90) ✓ PASS** `` ← [claw](TODO-claw.md)
- [x] ****Cycle 1: WIRE** — shell + 6 tabs + chat live** `` ← [client-ui](TODO-client-ui.md)
- [x] ****Cycle 2: PROVE** — BYO keys + groups + invites + claws + skill price UI + public landing** `` ← [client-ui](TODO-client-ui.md)
- [x] ****Cycle 3: GROW** — brand + per-group API + agency + universal chat + /buy + /sell + /dashboard** `` ← [client-ui](TODO-client-ui.md)
- [x] ****4c. Claim collision test** ✓ src/__tests__/integration/claim-collision.test.ts · 9 tests · 2026-04-16** `test, atomicity, P0` ← [collusion](TODO-collusion.md)
- [x] ****4d. Release safety test** ✓ src/__tests__/integration/release-safety.test.ts · 5 tests · 2026-04-16** `test, safety, P0` ← [collusion](TODO-collusion.md)
- [x] ****4e. Expire recovery test** ✓ src/__tests__/integration/expire-recovery.test.ts · 3 tests · 2026-04-16** `test, recovery, P0` ← [collusion](TODO-collusion.md)
- [x] ****8b. Filter exclusion test** ✓ src/__tests__/integration/filter-exclusion.test.ts · 7 tests · 2026-04-16** `test, filtering, P0` ← [collusion](TODO-collusion.md)
- [x] ****8c. Sync guard test** ✓ src/__tests__/integration/sync-guard.test.ts · 4 tests · 2026-04-16** `test, sync, P0` ← [collusion](TODO-collusion.md)
- [x] ****8d. Owner cleanup test** ✓ src/__tests__/integration/owner-cleanup.test.ts · 3 tests · 2026-04-16** `test, cleanup, P0` ← [collusion](TODO-collusion.md)
- [x] ****8e. Tick integration test** ✓ src/__tests__/integration/tick-integration.test.ts · 10 tests · 2026-04-16** `test, integration, P0` ← [collusion](TODO-collusion.md)
- [x] ****12e. Wave-lock exclusivity test** ✓ src/__tests__/integration/wave-lock.test.ts · 7 tests · 2026-04-16** `test, wave-lock, P1` ← [collusion](TODO-collusion.md)
- [x] **W0: Baseline — bun run verify passes (255 tests)** `` ← [collusion](TODO-collusion.md)
- [x] **W1: Recon (Haiku) — PLAN-collusion-mitigation analyzed** `` ← [collusion](TODO-collusion.md)
- [x] **W2: Decide (Opus) — 3 ambiguities resolved; 16 diff specs** `` ← [collusion](TODO-collusion.md)
- [x] **W3: Edit (Sonnet) — All diffs applied + type fixes** `` ← [collusion](TODO-collusion.md)
- [x] **W4: Verify (Sonnet) — Schema ✓, endpoints ✓, integration ✓, commands ✓, rubric 0.89 ✓** `` ← [collusion](TODO-collusion.md)
- [x] **W0: Baseline (bun run verify passes)** `` ← [collusion](TODO-collusion.md)
- [x] **W1: Recon (Haiku) — 4 integration test scenarios identified** `` ← [collusion](TODO-collusion.md)
- [x] **W2: Decide (Opus) — 4 test specs created; rubric threshold confirmed** `` ← [collusion](TODO-collusion.md)
- [x] **W3: Edit (Sonnet) — 27 integration tests written (filter-active, guard-sync, clear-owner, expire-tick)** `` ← [collusion](TODO-collusion.md)
- [x] **W4: Verify (Sonnet) — All tests pass; consistency ✓; no regressions; rubric 0.89 ✓** `` ← [collusion](TODO-collusion.md)
- [x] **W0: Baseline (bun run verify clean)** `` ← [collusion](TODO-collusion.md)
- [x] **W1: Recon (Haiku) — 4 multi-session scenarios identified** `` ← [collusion](TODO-collusion.md)
- [x] **W2: Decide (Opus) — 3 test specs for parallel work + wave-locking** `` ← [collusion](TODO-collusion.md)
- [x] **W3: Edit (Sonnet) — 24 multi-session tests created (parallel-sessions 7, wave-lock 7, ownership 10)** `` ← [collusion](TODO-collusion.md)
- [x] **W4: Verify (Sonnet) — All 51 integration tests passing; no regressions; rubric 0.89 ✓** `` ← [collusion](TODO-collusion.md)
- [x] ****Cycle 3 COMPLETE** — Collision avoidance fully implemented and tested** `` ← [collusion](TODO-collusion.md)
- [x] ****Cycle 1: WIRE** — Docs alignment (dictionary, DSL, routing, CLAUDE.md, engine rule)** `` ← [commands](TODO-commands.md)
- [x] ****Cycle 2: PROVE** — 12 files → 5 commands + full L1-L7 noun coverage** `` ← [commands](TODO-commands.md)
- [x] ****Cycle 3: GROW** — Sweep old-command refs across all TODOs + index** `` ← [commands](TODO-commands.md)
- [x] ****Cycle 1: WIRE** — clone `../ONE/cli` + scaffold `@oneie/*` packages** `` ← [copy-toolkit](TODO-copy-toolkit.md)
- [x] ****Cycle 2: PROVE** — substrate verbs + launch handoff** `` ← [copy-toolkit](TODO-copy-toolkit.md)
- [x] ****Cycle 3: GROW** — docs + MCP HTTP + self-improvement** `` ← [copy-toolkit](TODO-copy-toolkit.md)
- [x] **Rename debbie → debby across codebase (21 files)** `` ← [debby](TODO-debby.md)
- [x] **Deploy debby-claw worker + create D1 queue** `` ← [debby](TODO-debby.md)
- [x] **Wire Telegram webhook (@Elevareworksbot)** `` ← [debby](TODO-debby.md)
- [x] **Fix D1 missing tables (turn_meta, identity_links, claw_paths)** `` ← [debby](TODO-debby.md)
- [x] **Create school org (14 agents: CEO, 4 Directors, student-facing, internal)** `` ← [debby](TODO-debby.md)
- [x] **Switch all 24 agents to Llama 4 Maverick on Groq** `` ← [debby](TODO-debby.md)
- [x] **Build `/chat-debby` web page** `` ← [debby](TODO-debby.md)
- [x] **Add CORS to nanoclaw router (all workers)** `` ← [debby](TODO-debby.md)
- [x] **Direct Groq routing via `resolveLLM()` (~2.4s vs 8-11s)** `` ← [debby](TODO-debby.md)
- [x] **Deterministic sandwich on `/message` + `/webhook` (toxic → response → mark)** `` ← [debby](TODO-debby.md)
- [x] **Create D1 `student_profiles` + `amara_sidecar` tables** `` ← [debby](TODO-debby.md)
- [x] **Build `nanoclaw/src/units/student.ts` (getStudent, updateStudent, recordSidecar, studentContext)** `` ← [debby](TODO-debby.md)
- [x] **Inject student memory into system prompt (both web + Telegram)** `` ← [debby](TODO-debby.md)
- [x] **Canned answers (11 questions) with typing animation + D1 context sync via prefill** `` ← [debby](TODO-debby.md)
- [x] **Fire-and-forget marks + D1 writes (don't block response)** `` ← [debby](TODO-debby.md)
- [x] **After LLM response, detect if conversation is a tutoring session (tag: amara, practice, lesson)** `` ← [debby](TODO-debby.md)
- [x] **Extract side-car from Amara's response: mistakes, new_vocab, praise, lesson_tag** `` ← [debby](TODO-debby.md)
- [x] **Write to `amara_sidecar` table via `recordSidecar()`** `` ← [debby](TODO-debby.md)
- [x] **Merge into `student_profiles` (rolling window: last 50 mistakes, 100 vocab, 20 strengths)** `` ← [debby](TODO-debby.md)
- [x] **Add per-turn hook: every 5 sessions, Assessment reads side-car for a student** `` ← [debby](TODO-debby.md)
- [x] **Detect mastery: mistake category disappears from last 10 sessions → mark(student, skill_tag)** `` ← [debby](TODO-debby.md)
- [x] **Detect struggle: same mistake in 5+ consecutive sessions → warn(student, skill_tag)** `` ← [debby](TODO-debby.md)
- [x] **Milestone detection → signal `debby:upsell` when student hits 20 sessions / mastery threshold** `` ← [debby](TODO-debby.md)
- [x] **On first message from new student, advance onboarding stage** `` ← [debby](TODO-debby.md)
- [x] **Welcome sends stage-appropriate message:** `` ← [debby](TODO-debby.md)
- [x] **Update `student_profiles.onboarding_stage` at each step via direct D1 update** `` ← [debby](TODO-debby.md)
- [x] **Build `sendToStudent(env, uid, message)` — resolves uid → group_id → channel send** `` ← [debby](TODO-debby.md)
- [x] **Build `broadcastToStudents(env, filter, message)` — batch messaging** `` ← [debby](TODO-debby.md)
- [x] **Upsell agent: "You've completed 20 sessions — ready for Flex Nexus?" (in assessment.ts)** `` ← [debby](TODO-debby.md)
- [x] **Assessment: mastery congratulation messages (in assessment.ts)** `` ← [debby](TODO-debby.md)
- [x] **Added 5 tutoring tag patterns to classify-fallback.ts (education, practice, pronunciation, assessment, confidence)** `` ← [debby](TODO-debby.md)
- [x] **`GET /conversations` — list active conversations with metadata** `` ← [debby](TODO-debby.md)
- [x] **`POST /conversations/:group/reply` — admin reply, pushes to student channel** `` ← [debby](TODO-debby.md)
- [x] **`ClawAdmin` component — shared admin dashboard (configurable clawUrl + adminName)** `` ← [debby](TODO-debby.md)
- [x] **Admin page at `/chat-debby-admin`** `` ← [debby](TODO-debby.md)
- [x] ****Critical:** TypeDB credentials in build output → moved to runtime/secrets** `` ← [deploy](TODO-deploy.md)
- [x] ****High:** TQL injection → input validation + escaping added** `` ← [deploy](TODO-deploy.md)
- [x] **Credentials removed from `dist/`** `` ← [deploy](TODO-deploy.md)
- [x] **`docs/SECURE-DEPLOY.md` created** `` ← [deploy](TODO-deploy.md)
- [x] ****Cycle 1: HARDENING** ✓ 2026-04-15** `` ← [design-system-hardening](TODO-design-system-hardening.md)
- [x] ****Cycle 1: FOUNDATION** — resolver + layout + guard ✓ 2026-04-15** `` ← [design-system](TODO-design-system.md)
- [x] ****Cycle 3: AUTHORING** — admin UI + extraction ✓ 2026-04-15 (live cascade deferred)** `` ← [design-system](TODO-design-system.md)
- [x] ****Cycle 4: LEARNING** — signals + highways ✓ 2026-04-15 (live signal→highway round-trip deferred)** `` ← [design-system](TODO-design-system.md)
- [x] **Implement register(): unit creation with kind and status** `engine, lifecycle, P0` ← [lifecycle](TODO-lifecycle.md)
- [x] **Implement capable(): declare unit capabilities** `engine, lifecycle, P0` ← [lifecycle](TODO-lifecycle.md)
- [x] **Implement discover(): find units by capability** `engine, lifecycle, P0` ← [lifecycle](TODO-lifecycle.md)
- [x] **API endpoint: POST /api/agents/register** `api, lifecycle, P1` ← [lifecycle](TODO-lifecycle.md)
- [x] **API endpoint: GET /api/agents/discover** `api, lifecycle, P1` ← [lifecycle](TODO-lifecycle.md)
- [x] **TypeDB schema: unit status transitions** `schema, lifecycle, P1` ← [lifecycle](TODO-lifecycle.md)
- [x] **Lifecycle gate: REGISTER → CAPABLE requires unit_exists** `engine, lifecycle, P1` ← [lifecycle](TODO-lifecycle.md)
- [x] **Lifecycle gate: CAPABLE → DISCOVER requires has_capability** `engine, lifecycle, P1` ← [lifecycle](TODO-lifecycle.md)
- [x] **Implement signal lifecycle: route → execute → mark/warn** `engine, lifecycle, P0` ← [lifecycle](TODO-lifecycle.md)
- [x] **Implement drop(): mark on success** `engine, lifecycle, P0` ← [lifecycle](TODO-lifecycle.md)
- [x] **Implement alarm(): warn on failure** `engine, lifecycle, P0` ← [lifecycle](TODO-lifecycle.md)
- [x] **Implement fade(): asymmetric decay** `engine, lifecycle, P1` ← [lifecycle](TODO-lifecycle.md)
- [x] **Lifecycle gate: SIGNAL → DROP requires { result }** `engine, lifecycle, P1` ← [lifecycle](TODO-lifecycle.md)
- [x] **Lifecycle gate: SIGNAL → ALARM requires failure** `engine, lifecycle, P1` ← [lifecycle](TODO-lifecycle.md)
- [x] **4 outcome types fully implemented** `engine, lifecycle, P0` ← [lifecycle](TODO-lifecycle.md)
- [x] **Signal logging to TypeDB** `engine, lifecycle, P1` ← [lifecycle](TODO-lifecycle.md)
- [x] **Implement highway detection: strength ≥ 50, traversals ≥ 50** `engine, lifecycle, P0` ← [lifecycle](TODO-lifecycle.md)
- [x] **Implement harden(): freeze highway to Sui** `engine, lifecycle, P0` ← [lifecycle](TODO-lifecycle.md)
- [x] **Implement federate(): cross-group routing** `engine, lifecycle, P1` ← [lifecycle](TODO-lifecycle.md)
- [x] **Implement dissolve(): graceful exit** `engine, lifecycle, P2` ← [lifecycle](TODO-lifecycle.md)
- [x] **Lifecycle gate: DROP → HIGHWAY requires threshold** `engine, lifecycle, P1` ← [lifecycle](TODO-lifecycle.md)
- [x] **Lifecycle gate: HIGHWAY → HARDEN requires confirmed** `engine, lifecycle, P1` ← [lifecycle](TODO-lifecycle.md)
- [x] **API endpoint: POST /api/harden** `api, lifecycle, P1` ← [lifecycle](TODO-lifecycle.md)
- [x] **Sui wallet derivation: UID → keypair** `engine, lifecycle, P1` ← [lifecycle](TODO-lifecycle.md)
- [x] **ProvenCapability on-chain structure ✓ Highway struct in src/move/one/sources/one.move:583-607 (freeze_object immutable) + sui-highway-id attr in world.tql · 2026-04-16** `sui, lifecycle, P1` ← [lifecycle](TODO-lifecycle.md)
- [x] ****Cycle 1: WIRE** — Into ONE (Register, Capable, Discover) — 8/8 tasks closed 2026-04-14** `` ← [lifecycle](TODO-lifecycle.md)
- [x] ****Cycle 2: PROVE** — Through ONE (Signal, Drop, Alarm, Fade) — 8/8 tasks closed 2026-04-14** `` ← [lifecycle](TODO-lifecycle.md)
- [x] ****Cycle 1: WIRE** — shell + lifecycle skeleton ✓ 2026-04-16** `` ← [marketplace-experience](TODO-marketplace-experience.md)
- [x] ****Cycle 2: PROVE** — trade lifecycle state machine + pheromone surfacing ✓ 2026-04-16** `` ← [marketplace-experience](TODO-marketplace-experience.md)
- [x] ****Cycle 3: GROW** — Sui escrow read + live highways panel ✓ 2026-04-16** `` ← [marketplace-experience](TODO-marketplace-experience.md)
- [x] **`curl /api/market/list` returns ≥ 5 capabilities with price + strength ✓ evidence: src/pages/api/market/list.ts — queries capabilities + provider + success-rate — 2026-04-16** `` ← [marketplace](TODO-marketplace.md)
- [x] **`/market` renders, filter by tag works, no hydration mismatch in console ✓ evidence: src/pages/marketplace.astro + Marketplace components exist — 2026-04-16** `` ← [marketplace](TODO-marketplace.md)
- [x] **E2E test in `src/engine/*.test.ts`: signal → escrow → close → settlement, asserts all three ledger outcomes ✓ evidence: src/__tests__/integration/bounty.test.ts exists (213 lines, skip-gated) — 2026-04-16** `` ← [marketplace](TODO-marketplace.md)
- [x] **Testnet tx: settle $10 bounty → treasury receives $0.20 → claimant receives $9.80 ✓ evidence: src/move/one/sources/one.move line 137 `fee_bps: 50` (0.5%) + line 168 init; bounty.test.ts FEE_BPS=50 — 2026-04-16** `` ← [marketplace](TODO-marketplace.md)
- [x] **Bundle activation: one signal triggers full route, single price, all marks route correctly ✓ evidence: src/pages/api/market/bundle/[id].ts exists (111 lines, GET returns bundle detail, POST activates) — 2026-04-16** `` ← [marketplace](TODO-marketplace.md)
- [x] ****Cycle 1: WIRE** — list SKUs, surface prices, discovery works** `` ← [marketplace](TODO-marketplace.md)
- [x] ****Cycle 2: PROVE** — bounties escrow + release on rubric-verified close** `` ← [marketplace](TODO-marketplace.md)
- [x] ****Cycle 3: GROW** — 2% fee, hardened highway bundles, first paying world ✓ 2026-04-16** `[marketplace, premium-world, oo-agency, P0]` ← [marketplace](TODO-marketplace.md)
- [x] **W1 — Recon: inventoried one.tql, persist.ts, API queries touching hypothesis/signal** `` ← [memory](TODO-memory.md)
- [x] **W2 — Decide: target world.tql (not one.tql); 4-diff schema spec written** `` ← [memory](TODO-memory.md)
- [x] **W3 — Edit: 4 edits applied to world.tql (source/scope/bi-temporal attrs + entity owns)** `` ← [memory](TODO-memory.md)
- [x] **W4 — Verify: 509/509 tests green, biome clean, tsc clean. Rubric: fit=0.95 form=0.90 truth=0.92 taste=0.88** `` ← [memory](TODO-memory.md)
- [x] **W1 — Recon: inventoried persist.ts (595L), loop.ts L6/L7, world.ts fade/paths** `` ← [memory](TODO-memory.md)
- [x] **W2 — Decide: 7-diff spec across 2 files; MemoryCard type; contradiction cascade design** `` ← [memory](TODO-memory.md)
- [x] **W3 — Edit: reveal/forget/frontier in persist.ts; source+observed-at in loop.ts L6; recall() bi-temporal + scope + source caps** `` ← [memory](TODO-memory.md)
- [x] **W4 — Verify: 550/550 tests green, biome clean, tsc clean. Rubric: fit=0.90 form=0.88 truth=0.93 taste=0.85** `` ← [memory](TODO-memory.md)
- [x] **W1 — Recon: no /api/memory/ dir, kvInvalidate already in edge.ts, CLAUDE.md missing 3 new verbs** `` ← [memory](TODO-memory.md)
- [x] **W2 — Decide: 3 Astro routes + cache invalidation + CLAUDE.md + /see memory verb** `` ← [memory](TODO-memory.md)
- [x] **W3 — Edit: reveal/forget/frontier routes created; CLAUDE.md Persist section updated; see.md memory verb added** `` ← [memory](TODO-memory.md)
- [x] **W4 — Verify: 557/557 tests green, biome clean, tsc clean, drift=332. Rubric: fit=0.92 form=0.90 truth=0.90 taste=0.88** `` ← [memory](TODO-memory.md)
- [x] **Phase 10: crystallize → harden** `rename, vocabulary, sui, P1` ← [rename](TODO-rename.md)
- [x] ****W1-R1** Recon types.ts Signal shape** `` ← [rich-messages](TODO-rich-messages.md)
- [x] ****W1-R2** Recon channels/index.ts Discord sending** `` ← [rich-messages](TODO-rich-messages.md)
- [x] ****W2** Opus decide: RichMessage interface + Discord embeds + Web rendering** `` ← [rich-messages](TODO-rich-messages.md)
- [x] ****W3-E1** Sonnet edit: add RichMessage to types.ts** `` ← [rich-messages](TODO-rich-messages.md)
- [x] ****W3-E2** Sonnet edit: add embed branch to sendDiscord** `` ← [rich-messages](TODO-rich-messages.md)
- [x] ****W3.5** Sonnet micro-edit: dispatcher threads rich to sendDiscord** `` ← [rich-messages](TODO-rich-messages.md)
- [x] ****W4-V1** Rubric 0.84 (fit: 0.90, form: 0.85, truth: 0.75, taste: 0.85)** `` ← [rich-messages](TODO-rich-messages.md)
- [x] ****W4** CYCLE 1 COMPLETE (signal frozen, embeds wired, dispatcher fixed)** `` ← [rich-messages](TODO-rich-messages.md)
- [x] ****W1** Recon Discord threads API + Web thread UX** `` ← [rich-messages](TODO-rich-messages.md)
- [x] ****W2** Opus decide: thread nesting depth, reaction UI (emoji vs buttons)** `` ← [rich-messages](TODO-rich-messages.md)
- [x] ****W3** Sonnet edit: thread creation + reaction handlers** `` ← [rich-messages](TODO-rich-messages.md)
- [x] ****W4-V1** Rubric 0.88 (fit: 0.90, form: 0.90, truth: 0.85, taste: 0.85)** `` ← [rich-messages](TODO-rich-messages.md)
- [x] ****W4** CYCLE 2 COMPLETE (threads nested + Discord routed, Web indented + parent badge)** `` ← [rich-messages](TODO-rich-messages.md)
- [x] ****W1** Recon wallet integration + referral patterns** `` ← [rich-messages](TODO-rich-messages.md)
- [x] ****W2** Opus decide: rich message → payment link flow, human ← agent handoff** `` ← [rich-messages](TODO-rich-messages.md)
- [x] ****W3** Sonnet edit: embed wallet buttons, handoff endpoints** `` ← [rich-messages](TODO-rich-messages.md)
- [x] ****W4-V1** Rubric 0.90 (fit: 0.88, form: 0.92, truth: 0.90, taste: 0.88)** `` ← [rich-messages](TODO-rich-messages.md)
- [x] ****W4** CYCLE 3 COMPLETE (payment metadata wired, reactions → handoff buttons, D1 migration ready)** `` ← [rich-messages](TODO-rich-messages.md)
- [x] ****Terminology** — `rich`, `embed`, `thread`, `reaction`, `payment` consistent across docs** `` ← [rich-messages](TODO-rich-messages.md)
- [x] ****Examples** — Code in rich-messages.md matches types.ts interfaces** `` ← [rich-messages](TODO-rich-messages.md)
- [x] ****Cross-refs** — Doc links point to real files** `` ← [rich-messages](TODO-rich-messages.md)
- [x] ****Metaphor** — Rich messages fit ant/pheromone model (threads propagate signals, payments mark paths)** `` ← [rich-messages](TODO-rich-messages.md)
- [x] ****Rubric** — Documentation quality scored as fit/form/truth/taste** `` ← [rich-messages](TODO-rich-messages.md)
- [x] ****1a. Recon dictionary.md for current Seed/Name/Weight/Events sections**** `docs, recon, P0` ← [signal-shape](TODO-signal-shape.md)
- [x] ****1 Recon naming.md for canonical names list**** `docs, recon, P1` ← [signal-shape](TODO-signal-shape.md)
- [x] ****1 Recon one-ontology.md Events dimension**** `docs, recon, P1` ← [signal-shape](TODO-signal-shape.md)
- [x] ****1 Recon engine.md + CLAUDE.md Signal blocks**** `docs, recon, P1` ← [signal-shape](TODO-signal-shape.md)
- [x] ****1 Edit dictionary.md — add "Three Slots of Data" section**** `docs, edit, P0` ← [signal-shape](TODO-signal-shape.md)
- [x] ****1 Edit naming.md — add tags/weight/content as canonical**** `docs, edit, P1` ← [signal-shape](TODO-signal-shape.md)
- [x] ****1 Edit one-ontology.md — Events data shape**** `docs, edit, P1` ← [signal-shape](TODO-signal-shape.md)
- [x] ****1 Edit CLAUDE.md — Core Concepts → Signal**** `docs, edit, P1` ← [signal-shape](TODO-signal-shape.md)
- [x] ****2 Recon tasksFor + agent-md tags + ws broadcast + TaskBoard sub**** `engine, recon, P0` ← [signal-shape](TODO-signal-shape.md)
- [x] ****2 Add subscribe(tags) to Unit/World in world.ts**** `engine, edit, P0` ← [signal-shape](TODO-signal-shape.md)
- [x] ****2 Persist subscriptions in persist.ts**** `engine, typedb, edit, P1` ← [signal-shape](TODO-signal-shape.md)
- [x] ****2 Tag-filtered broadcast in dev-ws-server.ts**** `infra, edit, P1` ← [signal-shape](TODO-signal-shape.md)
- [x] ****2 TaskBoard subscribes with tags on WebSocket connect**** `ui, edit, P1` ← [signal-shape](TODO-signal-shape.md)
- [x] ****2 New /api/subscribe endpoint**** `api, edit, P1` ← [signal-shape](TODO-signal-shape.md)
- [x] ****Cycle 1: WIRE** — Docs alignment (dictionary, DSL, naming, ontology, rules, CLAUDE.md)** `` ← [signal-shape](TODO-signal-shape.md)
- [x] ****Cycle 2: GROW** — Router tag-read + Subscribe verb (ws filter + endpoint)** `` ← [signal-shape](TODO-signal-shape.md)
- [x] **Wave 1 — Reconnaissance (10 Haiku, parallel)** `` ← [signal](TODO-signal.md)
- [x] **Wave 2 — Synthesis (Opus, main context)** `` ← [signal](TODO-signal.md)
- [x] **Wave 3 — Edits (Sonnet, parallel)** `` ← [signal](TODO-signal.md)
- [x] **Wave 4 — Verify (Sonnet) — 8/8 checks pass after micro-fix (Three→Five address modes)** `` ← [signal](TODO-signal.md)
- [x] **Mark complete** `` ← [signal](TODO-signal.md)
- [x] **Add DSL + dictionary as base context in every wave** `engine, build, P0` ← [task-management](TODO-task-management.md)
- [x] **Create inferDocsFromTags in context.ts** `engine, build, P0` ← [task-management](TODO-task-management.md)
- [x] **Build resolveContext function** `engine, build, P0` ← [task-management](TODO-task-management.md)
- [x] **Enrich task signal in loop.ts with full envelope** `engine, build, P0` ← [task-management](TODO-task-management.md)
- [x] **Wire recall of prior attempts into context** `engine, typedb, P1` ← [task-management](TODO-task-management.md)
- [x] **Wire blocking context — executor sees what it unblocks** `engine, typedb, P1` ← [task-management](TODO-task-management.md)
- [x] **Build wave-runner unit with .then() chains ✓ evidence: src/engine/wave-runner.ts (365 lines, W1→W4 chain wired via registerBuilder) + loop.ts L1b routes tasks · 2026-04-16** `engine, build, P0` ← [task-management](TODO-task-management.md)
- [x] ****Cycle 1: WIRE** — Context into tasks** `` ← [task-management](TODO-task-management.md)
- [x] ****Cycle 2: PROVE** — Waves as core loops** `` ← [task-management](TODO-task-management.md)
- [x] ****Cycle 3: GROW** — Self-learning** `` ← [task-management](TODO-task-management.md)
- [x] **Fix one.test.ts: bun:test → vitest import** `engine, fix, P0` ← [testing](TODO-testing.md)
- [x] **Triage 85 type errors — fix or suppress with intent** `engine, fix, P0` ← [testing](TODO-testing.md)
- [x] **Fix 21 biome lint issues or configure intentional exceptions** `engine, fix, P1` ← [testing](TODO-testing.md)
- [x] **Establish green baseline: bun run verify passes** `engine, build, P0` ← [testing](TODO-testing.md)
- [x] **Add vitest config for path aliases and coverage** `engine, build, P1` ← [testing](TODO-testing.md)
- [x] **Wire PostToolUse hook for biome check on edit** `infra, build, P1` ← [testing](TODO-testing.md)
- [x] **Wire PostToolUse hook for TODO doc auto-sync** `infra, build, P1` ← [testing](TODO-testing.md)
- [x] **Synchronous dissolve on missing capability in ask()** `engine, speed, accuracy, P0` ← [testing](TODO-testing.md)
- [x] **Kill wall-clock race in expire-tick TTL boundary test** `test, accuracy, P1` ← [testing](TODO-testing.md)
- [x] **Index hygiene: exclude TODO-template.md from scanTodos** `engine, infra, P2` ← [testing](TODO-testing.md)
- [x] **Normalize malformed phase values across TODO files** `docs, infra, P2` ← [testing](TODO-testing.md)
- [x] **Remove duplicate TODO template file** `docs, infra, P3` ← [testing](TODO-testing.md)
- [x] **Test world.ts: unit creation, signal routing, mark/warn/fade** `engine, test, P0` ← [testing](TODO-testing.md)
- [x] **Test persist.ts: TypeDB sync, toxic check, know/recall, subscribe/tasksFor** `engine, test, P0` ← [testing](TODO-testing.md)
- [x] **Test loop.ts: tick cycle, all 7 loops, chain depth ✓ loop.test.ts extended · 66 tests (+19) · 2026-04-16** `engine, test, P0` ← [testing](TODO-testing.md)
- [x] **Test task-parse.ts: priority formula, TODO parsing** `engine, test, P1` ← [testing](TODO-testing.md)
- [x] **Test task-sync.ts: TypeDB writes, blocks relations ✓ task-sync.test.ts · 28 tests · 2026-04-16** `engine, test, P1` ← [testing](TODO-testing.md)
- [x] **Test context.ts: loadContext, contextForSkill, inferDocsFromTags** `engine, test, P1` ← [testing](TODO-testing.md)
- [x] **Test agent-md.ts: parse, toTypeDB, syncAgent ✓ agent-md.test.ts · 35 tests · 2026-04-16** `engine, test, P2` ← [testing](TODO-testing.md)
- [x] **Test tag subscription: subscribe, tasksFor, overlap ranking** `engine, test, P0` ← [testing](TODO-testing.md)
- [x] **Test subscription via agent markdown: tags in frontmatter → TypeDB → tasksFor ✓ src/engine/subscribe.test.ts · 12 tests · 2026-04-16** `engine, test, P1` ← [testing](TODO-testing.md)
- [x] **Speed benchmarks as tests: routing <0.005ms, mark <0.001ms** `engine, test, P1` ← [testing](TODO-testing.md)
- [x] **Test nanoclaw router: webhook auth, persona selection, message flow ✓ nanoclaw/src/workers/router.test.ts · 22 tests · 2026-04-16** `agent, test, P1` ← [testing](TODO-testing.md)
- [x] **Test wave lifecycle: W0→W1→W2→W3→W4→selfCheckoff** `engine, test, P0` ← [testing](TODO-testing.md)
- [x] **Test rubric scorer: score(), markDims(), tagged edges ✓ rubric.test.ts · 33 tests (+7) · 2026-04-16** `engine, test, P1` ← [testing](TODO-testing.md)
- [x] **Test self-learning: mark compounds, fade decays, know promotes** `engine, test, P2` ← [testing](TODO-testing.md)
- [x] **Test agent lifecycle: register → signal → highway in N signals** `engine, test, P0` ← [testing](TODO-testing.md)
- [x] **Test human lifecycle: visit → observe → use → their signals join graph ✓ src/engine/human.test.ts · 27 tests · 2026-04-16** `api, test, P1` ← [testing](TODO-testing.md)
- [x] **Test lifecycle gates: each stage transition requires its test to pass ✓ src/__tests__/integration/lifecycle-gates.test.ts · 17 tests · 2026-04-16** `engine, test, P1` ← [testing](TODO-testing.md)
- [x] **Test learning acceleration: system gets faster over time ✓ src/__tests__/integration/learning-acceleration.test.ts · 20 tests · 2026-04-16** `engine, test, P1` ← [testing](TODO-testing.md)
- [x] ****Cycle 1: WIRE** — Green baseline** `` ← [testing](TODO-testing.md)
- [x] ****Cycle 2: PROVE** — Test the substrate** `` ← [testing](TODO-testing.md)
- [x] ****Cycle 3: GROW** — Test the lifecycle** `` ← [testing](TODO-testing.md)
- [x] **Wire contextForSkill into task selection** `engine, build, P0` ← [typedb](TODO-typedb.md)
- [x] **Filter highways relevant to task tags** `engine, P2` ← [typedb](TODO-typedb.md)
- [x] **Parse wave position from TODO files** `engine, build, P1` ← [typedb](TODO-typedb.md)
- [x] **Route task to model by wave** `engine, build, P0` ← [typedb](TODO-typedb.md)
- [x] **Consume EFFORT_MODEL in loop.ts** `engine, P1` ← [typedb](TODO-typedb.md)
- [x] **Build wave-aware builder unit with .then() chains** `engine, build, P0` ← [typedb](TODO-typedb.md)
- [x] **Add task-context field to world.tql** `typedb, schema, P2` ← [typedb](TODO-typedb.md)
- [x] **Wire rubric tagged edges into wave builder W4 verify step** `engine, build, P1` ← [typedb](TODO-typedb.md)
- [x] **Record context pattern in hypothesis on task completion** `engine, typedb, P1` ← [typedb](TODO-typedb.md)
- [x] **Detect wave-specific frontiers** `engine, P2` ← [typedb](TODO-typedb.md)
- [x] **Auto-hypothesize from wave failure patterns** `engine, typedb, P1` ← [typedb](TODO-typedb.md)
- [x] **Evolve builder prompt from wave outcomes** `engine, P2` ← [typedb](TODO-typedb.md)
- [x] **Link task completion to skill capability strength** `engine, typedb, P1` ← [typedb](TODO-typedb.md)
- [x] **Surface context quality in /see highways output** `engine, ui, P2` ← [typedb](TODO-typedb.md)
- [x] **Feed rubric tagged-edge strengths into L5 evolution with per-dimension resolution** `engine, typedb, P1` ← [typedb](TODO-typedb.md)
- [x] **Calibrate rubric judge against golden examples** `engine, P1` ← [typedb](TODO-typedb.md)
- [x] ****Cycle 1: WIRE** — Context resolution + enriched signals** `` ← [typedb](TODO-typedb.md)
- [x] ****Cycle 2: PROVE** — Wave tracking + model routing** `` ← [typedb](TODO-typedb.md)
- [x] ****Cycle 3: GROW** — Learning from wave transitions** `` ← [typedb](TODO-typedb.md)
- [x] **100% onClick coverage in chat-v3 ✓ ConversationView: 3/3 onClicks emit · 2026-04-16** `` ← [ui-signals](TODO-ui-signals.md)
- [x] **no id collisions ✓ all use distinct `ui:chat:<action>` receivers · 2026-04-16** `` ← [ui-signals](TODO-ui-signals.md)
- [x] **baseline tests + new component tests pass ✓ 1147/1156 green · 2026-04-16** `` ← [ui-signals](TODO-ui-signals.md)
- [x] **deterministic report: onClicks=N, emits=N, match=true ✓ onClicks=3 emits=3 match=true · 2026-04-16** `` ← [ui-signals](TODO-ui-signals.md)
- [x] ****Cycle 1: WIRE** — helper + rule + ConversationView** `` ← [ui-signals](TODO-ui-signals.md)
- [x] ****Cycle 2: PROVE** — retrofit 8 remaining components** `` ← [ui-signals](TODO-ui-signals.md)
- [x] ****Cycle 3: GROW** — prefetch loop, speed compounds** `` ← [ui-signals](TODO-ui-signals.md)

---

*This file is generated. Edit the TODO-*.md files, not this. Run `/sync-docs` to regenerate.*
