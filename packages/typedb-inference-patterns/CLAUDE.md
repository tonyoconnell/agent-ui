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
L7 Frontier        → this package IS the L7 classification engine: unexplored tag clusters
                      + unit gaps surface as `frontier` entities that spawn `objective` nodes
```

**This package covers L4–L7.** L1–L3 are present in `world.tql` as runtime classification. L4–L6 are implemented in the standalone reference files. L7 (frontier/classification) is the unique contribution of this package: `autonomous-goals.tql` + `frontier` entity + `spawns` relation compose into the self-directing intelligence tier.

**ECONOMICS.md integration:** `ECONOMICS.md` in this package maps to [revenue.md](../../docs/revenue.md): token issuance = Layer 3 (infra); capability pricing = Layer 4 (marketplace); contribution rewards = Layer 5 (intelligence). When editing economic logic, cross-reference both.

**Context:** [patterns.md](../../docs/patterns.md) — the 10 patterns that emerge from these 6 lessons. [routing.md](../../docs/routing.md) — this package classifies the formula's inputs: `unit_classification()` (L1) determines which units `select()` routes toward (proven/active/at-risk change effective weight); `path_status()` (L2) labels formula output (highway/fresh/fading/toxic feeds `follow()` vs `warn()`); L7 frontier detection creates new paths for the formula to route through, bootstrapping cold-start exploration. [rubrics.md](../../docs/rubrics.md) — quality scoring adds resolution to L2. [DSL.md](../../docs/DSL.md) — signal grammar that all pattern outputs must conform to (`signal = { receiver, data }`). [dictionary.md](../../docs/dictionary.md) — canonical names used in every standalone TQL file (`mark`, `fade`, `warn`, `unit`, `edge`). [lifecycle.md](../../docs/lifecycle.md) — the hypothesis lifecycle (pending→testing→confirmed→rejected) in `hypothesis-lifecycle.tql` IS the agent journey (register→signal→highway→harden) expressed in TQL. [buy-and-sell.md](../../docs/buy-and-sell.md) — `task-management.tql` (L4) models the EXECUTE step; `cheapest_provider()` in one.tql is the DISCOVER step. [revenue.md](../../docs/revenue.md) — L4 task routing = Layer 1 routing revenue; L5 contribution aggregates = Layer 5 intelligence revenue; `ECONOMICS.md` in this package maps to Layers 3–5.

## Canonical Schema

The production schema is `src/schema/one.tql`. These standalone files are REFERENCE ONLY — they use different entity names and cannot be loaded alongside one.tql.

## How Lessons Map to one.tql

| Lesson | Pattern | one.tql Entity | Standalone Reference |
|--------|---------|----------------|---------------------|
| L1 | Classification | `unit` (success-rate, activity-score, sample-count) | `classification.tql` (uses `scored-item`) |
| L2 | Quality Rules | `edge` (highway/fresh/fading/toxic rules) | `quality-rules.tql` (uses `learning-record`) |
| L3 | State Machines | `hypothesis` (pending→confirmed) | `hypothesis-lifecycle.tql` |
| L4 | Negation + Pheromone | `task` + `path` + `dependency` | `task-management.tql` (uses `pheromone-trail` — legacy name, not loadable with one.tql) |
| L5 | Aggregates | `contribution` + `contribution-event` | `contribution-tracking.tql` |
| L6 | Emergence | `frontier` + `objective` + `spawns` | `autonomous-goals.tql` |

## Vocabulary (converged)

```
signal = { receiver, data }    — NOT payload
mark = add weight         — runtime uses mark()
warn = add resistance
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
