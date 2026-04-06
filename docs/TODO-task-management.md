# TODO: task-management

- [ ] Implement task entity in TypeDB with priority formula
  value: critical
  effort: low
  phase: C1
  persona: dev
  blocks: task-api-live, doc-sync
  exit: task-id, name, value/phase/persona, priority-score, priority-formula in schema
  tags: typedb, build, P0, foundation

- [ ] Create blocks relation for task dependencies
  value: critical
  effort: low
  phase: C1
  persona: dev
  blocks: task-api-live
  exit: Task A can block Task B. Relation stores transitive dependencies
  tags: typedb, build, P0, foundation

- [ ] Build task priority formula: value + phase + persona + blocking
  value: critical
  effort: low
  phase: C1
  persona: dev
  blocks: effective-priority
  exit: Formula: critical=30, high=25, medium=20, C1=40...C7=10, ceo=25...agent=5, +5 per block
  tags: foundation, build, P0, dev

- [x] Implement effective priority runtime calculation
  value: high
  effort: low
  phase: C1
  persona: dev
  blocks: task-api-live
  exit: effective = priority + (strength - resistance) × sensitivity
  tags: foundation, build, P0, dev

- [x] Parse TODO-*.md files deterministically
  value: critical
  effort: low
  phase: C1
  persona: dev
  blocks: doc-sync
  exit: Regex parser handles: - [ ] name, value/phase/persona/blocks/exit/tags indented below
  tags: foundation, build, P0, dev

- [x] Scan docs/ for TODO-*.md and extract all tasks
  value: high
  effort: low
  phase: C1
  persona: dev
  blocks: doc-sync
  exit: scanTodos(docsDir) returns all Task objects from all TODO files
  tags: foundation, build, P0, dev

- [x] Sync parsed tasks to TypeDB (task + skill + capability + blocks)
  value: critical
  effort: low
  phase: C1
  persona: dev
  blocks: task-api-live
  exit: Each task becomes: task entity + skill entity + capability + blocks relations
  tags: typedb, build, P0, dev

- [ ] Build task API GET with effective priority
  value: high
  effort: low
  phase: C1
  persona: dev
  blocks: task-board-live
  exit: GET /api/tasks returns tasks sorted by effective priority. Filter by tag/phase
  tags: api, build, P0, dev

- [ ] Build task API POST with priority computation
  value: high
  effort: medium
  phase: C1
  persona: dev
  exit: POST /api/tasks creates task entity with computed priority formula
  tags: api, build, P1, dev

- [ ] Implement Haiku one-shot extraction from prose docs
  value: high
  effort: medium
  phase: C1
  persona: dev
  blocks: doc-sync
  exit: Haiku reads doc once, outputs TODO-{docname}.md with structured format (~$0.004/doc)
  tags: integration, build, P1, dev

- [ ] Create /extract-tasks slash command
  value: high
  effort: low
  phase: C1
  persona: dev
  exit: /extract-tasks ONE-strategy.md → generates TODO-ONE-strategy.md
  tags: commands, build, P1, dev

- [ ] Create /sync-docs slash command
  value: high
  effort: low
  phase: C1
  persona: dev
  blocks: task-api-live
  exit: /sync-docs scans TODO-*.md → syncs to TypeDB → regenerates TODO.md
  tags: commands, build, P1, dev

- [ ] Update /add-task command with value/phase/persona/blocks fields
  value: high
  effort: low
  phase: C1
  persona: dev
  exit: /add-task "fix auth" value=high phase=C1 persona=dev blocks=login-flow
  tags: commands, build, P1, dev

- [ ] Update /tasks command to show priority formula + effective priority
  value: high
  effort: low
  phase: C1
  persona: dev
  exit: /tasks shows: name, priority=90 (formula), phase, value, persona, tags
  tags: commands, build, P1, dev

- [x] Mark task complete via POST /api/tasks/:id/complete
  value: high
  effort: low
  phase: C1
  persona: dev
  exit: Mark task done, update task-status to "done", reinforce path pheromone
  tags: api, build, P1, dev

- [ ] Build task board UI showing priority + pheromone
  value: high
  effort: medium
  phase: C2
  persona: dev
  blocks: task-board-live
  exit: TaskBoard component shows: priority score, effective priority, formula, blocks
  tags: ui, build, P1, dev

- [ ] Group tasks by phase (C1-C7) in board view
  value: medium
  effort: low
  phase: C2
  persona: dev
  exit: Board shows: Foundation | Collaboration | Commerce | ... | Scale sections
  tags: ui, build, P2, dev

- [ ] Show task blocking graph in UI
  value: medium
  effort: medium
  phase: C2
  persona: dev
  exit: Visualize: Task A → blocks → Task B. Helps prioritization
  tags: ui, build, P2, dev

- [ ] Implement doc-scan integration with task system
  value: high
  effort: high
  phase: C2
  persona: dev
  blocks: task-api-live
  exit: doc-scan extracts checkboxes/gaps as tasks. Syncs to TypeDB
  tags: integration, build, P1, dev

- [ ] Build task exit condition tracking
  value: medium
  effort: medium
  phase: C2
  persona: dev
  exit: Task.exit = "what done looks like". Loop verifies on completion
  tags: foundation, build, P2, dev

- [ ] Create /work loop that respects task blocking
  value: high
  effort: high
  phase: C2
  persona: dev
  blocks: autonomous-loop
  exit: /work picks highest priority. Skips blocked tasks
  tags: commands, build, P1, dev

- [ ] Enable task tagging with domain/action/priority/phase
  value: high
  effort: low
  phase: C1
  persona: dev
  exit: Tasks tagged: marketing, build, P0, C1. Can filter by any combo
  tags: foundation, build, P0, dev

- [ ] Build task success-rate tracking per unit
  value: high
  effort: medium
  phase: C2
  persona: dev
  blocks: evolution
  exit: Agent success-rate = completed_tasks / total_tasks. Updated per completion
  tags: analytics, build, P1, dev

- [ ] Implement agent evolution when success-rate < 50%
  value: high
  effort: high
  phase: C3
  persona: dev
  blocks: intelligence
  exit: Agent with <50% success over 20 tasks gets rewritten prompt
  tags: intelligence, build, P1, dev

- [ ] Generate TODO.md sorted by effective priority
  value: high
  effort: low
  phase: C1
  persona: dev
  exit: TODO.md shows tasks grouped by phase, sorted by effective_priority within
  tags: build, P1, dev
