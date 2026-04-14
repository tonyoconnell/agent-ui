# TODO: autonomous-orgs

> **Source of truth:** [DSL.md](DSL.md) — signal language,
> [dictionary.md](dictionary.md) — canonical names,
> [rubrics.md](rubrics.md) — quality scoring,
> [patterns.md](patterns.md) — 10 emergent patterns,
> [routing.md](routing.md) — the deterministic sandwich
>
> **Schema:** Tasks map to `world.tql` dimension 3b. Execute with `/do`. Create with `/create todo`.

- [x] Schema: Add task, task-dependency, task-execution entities to world.tql
  value: critical
  effort: low
  phase: C1
  persona: dev
  blocks: task-orchestration
  exit: task, task-dependency, task-execution entities defined in schema
  tags: typedb, schema, P0, foundation
  done: world.tql has task entity (task-id, status, value, effort, wave, phase, persona, priority-score, exit-condition) + blocks relation

- [x] Functions: Write 6 task selection functions (priority, critical-path, bottleneck, etc.)
  value: critical
  effort: medium
  phase: C1
  persona: dev
  blocks: task-orchestration
  exit: priority(), critical_path(), bottleneck(), cost(), revenue(), idle() functions in TypeDB
  tags: typedb, routing, P0, foundation
  done: world.tql has open_tasks, tasks_by_priority, blocked_tasks, task_blockers, best_unit_for_task, tasks_for_unit (names differ but coverage matches)

- [ ] Seed: Insert Phase 1 tasks (marketing, engineering, telegram, dashboard)
  value: critical
  effort: low
  phase: C1
  persona: dev
  blocks: c1-tasks-live
  exit: Marketing, engineering, telegram, dashboard tasks seeded in TypeDB
  tags: typedb, build, P0, foundation

- [ ] Loop: Modify /api/tick to orchestrate tasks
  value: critical
  effort: medium
  phase: C1
  persona: dev
  blocks: tick-orchestration
  exit: /api/tick picks highest-priority task, executes signal, marks outcome
  tags: api, routing, P0, foundation

- [ ] Revenue: Wire x402 payment routing on Sui (C3)
  value: high
  effort: high
  phase: C3
  persona: investor
  blocks: commerce-live
  exit: Payments flow from skills to units on Sui blockchain
  tags: commerce, x402, sui, P0, foundation

- [ ] Docs: Cross-link dictionary.md + one-ontology.md to task execution
  value: medium
  effort: low
  phase: C2
  persona: dev
  exit: docs/dictionary.md and docs/one-ontology.md link to task system
  tags: docs, integration, P1, knowledge

- [ ] Dashboard: Show task graph + pheromone in real-time
  value: high
  effort: high
  phase: C2
  persona: dev
  blocks: task-board-live
  exit: ReactFlow visualization showing tasks, dependencies, pheromone trails
  tags: ui, reactflow, P1, visualization

- [x] Agents: Create 8 marketing agents (markdown or HTTP)
  value: critical
  effort: medium
  phase: C1
  persona: dev
  blocks: marketing-dept-live
  exit: 8 marketing agents (director, creative, media-buyer, etc.) alive on Telegram
  tags: agent, marketing, P0, deployment
  done: agents/marketing/ has 8 agent .md files: director, creative, media-buyer, seo, content, analyst, ads, social

- [x] Telegram: Wire signals to @onedotbot channel
  value: critical
  effort: medium
  phase: C1
  persona: dev
  blocks: marketing-dept-live
  exit: Agents signal @onedotbot, channel receives and routes back
  tags: agent, telegram, P0, integration
  done: TELEGRAM_TOKEN_ONE set, webhook live at /webhook/telegram-one

- [ ] Monitoring: Weekly success metrics dashboard
  value: medium
  effort: medium
  phase: C5
  persona: investor
  blocks: metrics-live
  exit: Weekly report showing success rates, revenue, top performers, emerging frontiers
  tags: analytics, metrics, P2, knowledge

---

## See Also

- [DSL.md](DSL.md) — the signal language (always loaded)
- [dictionary.md](dictionary.md) — everything named (always loaded)
- [rubrics.md](rubrics.md) — quality scoring as tagged edges
- [patterns.md](patterns.md) — 10 emergent patterns
- [routing.md](routing.md) — the deterministic sandwich
- [TODO-template.md](TODO-template.md) — the wave pattern
- [TODO-task-management.md](TODO-task-management.md) — self-learning task system
