# TypeDB Inference Patterns

**Skill: `/typedb` — Use for ALL TQL work. These files are REFERENCE ONLY.**

REFERENCE MATERIAL for the 6 lessons from Deborah Gordon's ant research.

## Substrate Learning

These patterns ARE the learning. The 6 lessons map directly to the runtime:

```
L1 Classification  → unit_classification() in world.tql  → proven/active/at-risk
L2 Quality Rules   → path_status() in world.tql          → highway/fresh/fading/toxic
L3 State Machines  → hypothesis lifecycle                 → pending → testing → confirmed
L4 Negation        → ready = open AND no incomplete blockers
L5 Aggregates      → total_contribution(), highway_count()
L6 Emergence       → frontier detection, autonomous objectives
```

**Context:** [patterns.md](../../docs/patterns.md) — the 10 patterns that emerge from these 6 lessons. [routing.md](../../docs/routing.md) — how the patterns compose in the sandwich. [rubrics.md](../../docs/rubrics.md) — quality scoring adds resolution to L2.

## Canonical Schema

The production schema is `src/schema/one.tql`. These standalone files are REFERENCE ONLY — they use different entity names and cannot be loaded alongside one.tql.

## How Lessons Map to one.tql

| Lesson | Pattern | one.tql Entity | Standalone Reference |
|--------|---------|----------------|---------------------|
| L1 | Classification | `unit` (success-rate, activity-score, sample-count) | `classification.tql` (uses `scored-item`) |
| L2 | Quality Rules | `edge` (highway/fresh/fading/toxic rules) | `quality-rules.tql` (uses `learning-record`) |
| L3 | State Machines | `hypothesis` (pending→confirmed) | `hypothesis-lifecycle.tql` |
| L4 | Negation + Pheromone | `task` + `trail` + `dependency` | `task-management.tql` (uses `pheromone-trail`) |
| L5 | Aggregates | `contribution` + `contribution-event` | `contribution-tracking.tql` |
| L6 | Emergence | `frontier` + `objective` + `spawns` | `autonomous-goals.tql` |

## Vocabulary (converged)

```
signal = { receiver, data }    — NOT payload
mark = add weight         — runtime uses mark()
alarm = add resistance
fade = decay
emit = send from handler
edge = unit↔unit connection
trail = task→task sequence      — NOT pheromone-trail
```

## Files

| File | Purpose | Loadable? |
|------|---------|-----------|
| `standalone/seed.tql` | Bootstrap data for one.tql | YES — load after one.tql |
| `standalone/substrate.tql` | DEPRECATED — pointer to one.tql | NO |
| `standalone/classification.tql` | L1 reference (different entities) | NO — reference only |
| `standalone/quality-rules.tql` | L2 reference | NO — reference only |
| `standalone/hypothesis-lifecycle.tql` | L3 reference | NO — reference only |
| `standalone/task-management.tql` | L4 reference | NO — reference only |
| `standalone/contribution-tracking.tql` | L5 reference | NO — reference only |
| `standalone/autonomous-goals.tql` | L6 reference | NO — reference only |
| `standalone/genesis.tql` | Legacy complete schema | NO — reference only |
| `standalone/launchpad.tql` | Token launch intelligence | NO — reference only |
| `runtime/colony.ts` | 70-line world substrate with all 6 lessons | TS runtime |
| `OPERATIONS.md` | Write operations reference | Documentation |
| `LIFECYCLE.md` | Entity state machines | Documentation |
| `LOOPS.md` | Deterministic + probabilistic | Documentation |
| `SWARMS.md` | Dynamic swarm formation | Documentation |
| `ECONOMICS.md` | Token model | Documentation |
