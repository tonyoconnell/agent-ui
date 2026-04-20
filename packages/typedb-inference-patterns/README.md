# typedb-inference-patterns

Learn TypeDB 3.0 inference by building. 7 merged lessons. Production-tested.

**These aren't just patterns. This is the DNA of a self-organizing colony.**

The 6 lessons form a complete loop that bootstraps emergent intelligence. Each lesson answers one fundamental question every agent must ask. Together, they create a system that learns, adapts, and evolves without central control.

> **Why TypeDB?** TypeDB is the *fourth category of database* (alongside relational, graph, and document). Its defining idea — "Queries as Types", from Dorn & Pribadi's [PACMMOD 2024 paper](https://dl.acm.org/doi/10.1145/3651611) (*Best Newcomer Award*, SIGMOD/PODS 2024) — means a TypeQL query pattern **is** a type. You don't describe an execution plan; you describe the domain of data. The planner then runs whatever strategy preserves the type. This is exactly why polymorphic inference (classification, hypothesis chains, pheromone-weighted routing) stays concise as schemas grow — a pattern that matches `$x isa agent` matches every subtype of `agent` without rewriting the query.
>
> **On syntax:** TypeDB 3.x was rewritten in Rust and introduces pipelines, functions (replacing 2.x `rule`), struct/list value types, role aliasing, and more. If you see `rule name: when { } then { };` anywhere in this package's `standalone/` or `examples/` TQL, that is **pre-3.x pedagogy** — the concept is correct but the keyword is gone. Translate to `fun` before loading into a 3.x server. The `runtime/colony.ts` file and all README code blocks use current 3.x syntax.

> *"The task an ant is performing depends not on any property of the individual ant, but on what the ant has experienced recently."* — Deborah Gordon

---

## The Colony Loop

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                          │
│                           THE COLONY LOOP                                               │
│                                                                                          │
│   ┌──────────────┐                                                                      │
│   │              │                                                                      │
│   │   GENESIS    │  ← You start here. One agent. One schema.                           │
│   │              │                                                                      │
│   └──────┬───────┘                                                                      │
│          │                                                                              │
│          ▼                                                                              │
│   ┌──────────────┐                                                                      │
│   │              │                                                                      │
│   │  PERCEPTION  │  Agent has attributes → Functions classify it                       │
│   │   (L1)       │  "What am I? What tier? What caste?"                                │
│   │              │  elite_items(), at_risk_items(), identify_elites()                  │
│   └──────┬───────┘                                                                      │
│          │                                                                              │
│          ▼                                                                              │
│   ┌──────────────┐                                                                      │
│   │              │                                                                      │
│   │ HOMEOSTASIS  │  Rules reject invalid states                                        │
│   │   (L2)       │  "Am I allowed to exist like this?"                                 │
│   │              │  prevent_zombie_agents, physics_conservation                        │
│   └──────┬───────┘                                                                      │
│          │                                                                              │
│          ▼                                                                              │
│   ┌──────────────┐                                                                      │
│   │              │                                                                      │
│   │  HYPOTHESIS  │  Agent accumulates observations → State transitions                 │
│   │   (L3)       │  "What do I believe? Is it confirmed?"                              │
│   │              │  pending → testing → confirmed (via inference)                      │
│   └──────┬───────┘                                                                      │
│          │                                                                              │
│          ▼                                                                              │
│   ┌──────────────┐                                                                      │
│   │              │                                                                      │
│   │    TASK      │  Agent senses available work (negation)                             │
│   │ ALLOCATION   │  Follows pheromone trails to attractive tasks                       │
│   │   (L4)       │  ready_tasks(), attractive_tasks(), exploratory_tasks()             │
│   │              │                                                                      │
│   └──────┬───────┘                                                                      │
│          │                                                                              │
│          ▼                                                                              │
│   ┌──────────────┐                                                                      │
│   │              │                                                                      │
│   │CONTRIBUTION  │  Agent completes work → Impact measured                             │
│   │   (L5)       │  "How much did I contribute?"                                       │
│   │              │  total_contribution(), elite_contributors()                         │
│   └──────┬───────┘                                                                      │
│          │                                                                              │
│          ▼                                                                              │
│   ┌──────────────┐                                                                      │
│   │              │                                                                      │
│   │  EMERGENCE   │  Curiosity signals fire → New frontiers detected                    │
│   │   (L6)       │  Objectives spawn AUTONOMOUSLY                                      │
│   │              │  promising_frontiers() → spawn objective                            │
│   └──────┬───────┘                                                                      │
│          │                                                                              │
│          │         ╔════════════════════════════════════════════╗                       │
│          └────────▶║  NEW OBJECTIVE = NEW ENTITY                ║                       │
│                    ║  ...which needs to be CLASSIFIED (L1)      ║                       │
│                    ╚════════════════════════════════════════════╝                       │
│                              │                                                          │
│                              ▼                                                          │
│                    ┌──────────────┐                                                     │
│                    │              │                                                     │
│                    │  PERCEPTION  │  ← THE LOOP CLOSES                                 │
│                    │   (L1)       │                                                     │
│                    │              │                                                     │
│                    └──────────────┘                                                     │
│                                                                                          │
│   EACH CYCLE:                                                                           │
│   • Pheromone trails get reinforced (success) or alarmed (failure)                     │
│   • Contribution ranks update                                                           │
│   • New hypotheses spawn from observations                                              │
│   • Frontiers get exhausted or spawn new objectives                                     │
│   • THE COLONY LEARNS                                                                   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## The Six Laws of the Colony

| Lesson | Law | Question | What It Provides |
|--------|-----|----------|------------------|
| **L1** | Perception | "What am I?" | **IDENTITY** |
| **L2** | Homeostasis | "Am I allowed to exist?" | **VALIDITY** |
| **L3** | Hypothesis | "What do I believe?" | **LEARNING** |
| **L4** | Task Allocation | "What should I do?" | **WORK** |
| **L5** | Contribution | "What have I done?" | **VALUE** |
| **L6** | Emergence | "What should we do next?" | **PURPOSE** |

**That's it.** Those six questions, answered by inference, create a complete self-organizing system.

Every agent asks these questions. Every tick. The answers come from the graph. The graph is modified by agents. **The loop is the intelligence.**

---

## The Concrete Sequence

```
TICK 0: Genesis
────────────────
INSERT agent-001 (energy: 50, contribution: 0, reliability: 0.5)

TICK 1: Perception (L1)
────────────────────────
QUERY: match let $a in identify_elites(); ...
RESULT: agent-001 NOT elite (doesn't meet thresholds)
INFERRED: agent-001 is "worker" caste

TICK 2: Homeostasis (L2)
─────────────────────────
RULE: prevent_zombie_agents
CHECK: energy=50 > 0, reliability=0.5 > 0.5? NO
RESULT: agent-001 is VALID (not a zombie)

TICK 3: Hypothesis (L3)
────────────────────────
agent-001 has hypothesis: "Task X will succeed"
observations_count: 5 → status: "pending"
observations_count: 15 → CLASSIFIER matches → pipeline updates status: "testing"

TICK 4: Task Allocation (L4)
─────────────────────────────
QUERY: match let $t in ready_tasks(); ...
RESULT: [task-A, task-B, task-C]

QUERY: match let $t in attractive_tasks(); ...
RESULT: [task-A] (has strong pheromone trail)

agent-001 SELECTS task-A (following the trail)

TICK 5: Execution
──────────────────
agent-001 PERFORMS task-A
OUTCOME: SUCCESS
→ energy -= 10 (work costs energy)
→ contribution += 1
→ trail A→B reinforced (+5.0 pheromone)

TICK 6: Contribution (L5)
──────────────────────────
QUERY: match let $total = total_contribution("agent-001"); ...
RESULT: 1.0

RULE: contribution >= 100 → rank = "elite"
agent-001 rank: "occasional" (only 1 contribution so far)

TICK 7: Emergence (L6)
───────────────────────
CURIOSITY SIGNAL: "gap_detected" (task-D has no trail)
→ exploratory_tasks() returns [task-D]

FRONTIER: "task-D area" detected
→ expected_value = 0.6 (high potential, low cost)
→ PIPELINE FIRES: spawn exploration objective (classifier-guarded match ... insert)

NEW OBJECTIVE SPAWNED: "explore-task-D"

TICK 8: LOOP CLOSES → Perception (L1)
──────────────────────────────────────
NEW ENTITY: objective "explore-task-D"
→ Needs classification
→ What priority? What status?
→ Functions run...

TICK 9+: The Colony Grows
──────────────────────────
• More agents spawn
• More tasks get discovered
• Pheromone network densifies
• Superhighways emerge
• Contribution ranks stratify
• Hypotheses confirm/reject
• Frontiers exhaust → new frontiers spawn
• INTELLIGENCE EMERGES
```

---

## What Makes This Different

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                          │
│   TRADITIONAL SYSTEM                    │    THIS COLONY                                │
│   ──────────────────                    │    ───────────                                │
│                                         │                                               │
│   Human writes rules                    │    Rules ARE the physics                     │
│   Human assigns tasks                   │    Tasks attract via pheromones              │
│   Human measures contribution           │    Contribution auto-aggregates              │
│   Human decides next goal               │    Goals SPAWN from curiosity                │
│   Human updates status                  │    Status INFERRED from state                │
│   Human scales manually                 │    Colony scales infinitely                  │
│                                         │                                               │
│   Central control                       │    NO CONTROL                                │
│   Single point of failure               │    Resilient (any agent can die)            │
│   Requires orchestration                │    Self-organizing                           │
│   Knowledge in code                     │    Knowledge in the GRAPH                    │
│                                         │                                               │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Installation

```bash
pip install typedb-inference-patterns
```

Or clone directly:

```bash
git clone https://github.com/ants-at-work/typedb-inference-patterns
```

---

## The Lessons

Each lesson contains **biology + concepts + TypeQL code** in one self-contained file.

| # | Lesson | Theme | Pattern | Difficulty |
|---|--------|-------|---------|------------|
| 0 | [Philosophy](00-philosophy.md) | The Emergence Thesis | — | — |
| 1 | [Perception](01-perception.md) | Chemical Signaling | Classification | Beginner |
| 2 | [Homeostasis](02-homeostasis.md) | Immune System | Quality Rules | Beginner+ |
| 3 | [Hypothesis](03-hypothesis.md) | Task Switching | State Machines | Intermediate |
| 4 | [Task Allocation](04-task-allocation.md) | Pheromone Logic | Negation | Intermediate |
| 5 | [Contribution](05-contribution.md) | Interaction Rates | Aggregates | Intermediate+ |
| 6 | [Emergence](06-emergence.md) | Superorganism | Autonomous Goals | Advanced |

---

## Quick Start

### Read a lesson (concepts + code together)

```bash
cat lessons/01-perception.md
```

### Load standalone TypeQL

```bash
typedb console --cloud your-cluster.typedb.com:80
> transaction my-db schema write
> source standalone/classification.tql
> commit
```

### Query inferred facts

```typeql
# Functions are called explicitly:
match let $e in elite_items(); $e has item-name $n; select $n;

# Rules fire automatically:
match $item isa scored-item, has item-tier "elite"; select $item;
```

---

## Key Patterns

### 1. Multi-Attribute Classification (Lesson 1)

```typeql
fun elite_items() -> { scored-item }:
    match
        $e isa scored-item,
            has success-rate $sr,
            has activity-score $as;
        $sr >= 0.75;
        $as >= 70.0;
    return { $e };
```

### 2. Quality Rules with Chaining (Lesson 2)

```typeql
# TypeDB 3.x: rules are replaced by functions (`fun`).
# Classification that was historically expressed as `rule high-quality:`
# now becomes a function returning the labelled stream.

fun high_quality_records() -> { record } :
    match
        $r isa record, has effectiveness $e;
        $e >= 0.7;
    return { $r };

fun cascade_sources() -> { record } :
    match
        let $hq = high_quality_records();
        $source isa record;
        $source == $hq;                                # $source is high-quality
        ($source, $derived) isa learning-chain;
        $derived == high_quality_records();            # $derived is also high-quality
    return { $source };

# Store the derived label by writing it via an `insert` stage,
# not by declaring a rule.
match
    let $src = cascade_sources();
insert
    $src has cascade-potential true;
```

### 3. Negation — "Ready" Detection (Lesson 4)

```typeql
fun ready_tasks() -> { task }:
    match
        $t isa task, has status "todo";
        not {
            $dep(dependent: $t, blocker: $b) isa dependency;
            $b isa task, has status $bs;
            not { $bs == "complete"; };
        };
    return { $t };
```

### 4. Pheromone-Weighted Selection (Lesson 4)

```typeql
# 3.x: functions replace rules. The "attractive" label is derived
# by a function, then written into the graph via an insert stage.

fun attractive_tasks() -> { task } :
    match
        $t isa task, has status "todo";
        $trail (destination-task: $t) isa pheromone-trail,
            has trail-pheromone $tp;
        $tp >= 50.0;
    return { $t };

# Persist the label (if you want it materialised)
match
    let $t = attractive_tasks();
insert
    $t has attractive true;
```

### 5. Parameterized Aggregates (Lesson 5)

```typeql
fun total_contribution($name: string) -> double:
    match
        $c isa contributor, has contributor-name $name;
        $rel (contributor-role: $c, contribution-item: $contrib) isa contribution;
        $contrib has impact-score $i;
    return sum($i);
```

---

## Domain Examples

Apply the patterns to real problems:

| Domain | File | Patterns Used |
|--------|------|--------------|
| E-Commerce | `examples/ecommerce.tql` | Classification + Quality Rules |
| IoT Monitoring | `examples/iot-monitoring.tql` | Classification + Hypothesis |
| Social Network | `examples/social-network.tql` | Quality Rules + Contribution |
| Supply Chain | `examples/supply-chain.tql` | Negation + Classification |

---

## The Biology

These patterns implement actual ant colony mechanisms from Deborah Gordon's research:

```
Individual ant encounters nestmates performing tasks
    → Chemical signature identifies the task type        (Lesson 1)
    → Encounter rate crosses individual threshold        (Lesson 2)
    → Probabilistic state transition occurs              (Lesson 3)
    → Ant finds available work (no blockers)             (Lesson 4)
    → Colony measures demand by interaction frequency    (Lesson 5)
    → Collective behavior emerges without instructions   (Lesson 6)
```

**Reference:** [ants-at-work.com/book/2/](https://ants-at-work.com/book/2/)

---

## Directory Structure

```
typedb-inference-patterns/
├── README.md                   # This file
├── CLAUDE.md                   # Project instructions for Claude Code
├── LIFECYCLE.md                # Entity state machines, agent journey
├── LOOPS.md                    # Deterministic + probabilistic loops
├── SWARMS.md                   # Dynamic swarm formation patterns
├── OPERATIONS.md               # Write-operations reference
├── ECONOMICS.md                # Token / contribution economic model
├── SUBSTRATE-MAPPING.md        # Mapping lessons → one.tql production schema
│
├── standalone/                 # 3.x lesson TQL (migrated 2026-04-20)
│   ├── quality-rules.tql           # L2 — classifier functions, derived-on-demand vs materialized
│   ├── hypothesis-lifecycle.tql    # L3 — state machine via is_action_ready(), update-based transitions
│   ├── task-management.tql         # L4 — NEGATION pattern (ready_tasks), pheromone trail_status
│   ├── classification.tql          # L1 reference
│   ├── contribution-tracking.tql   # L5 reference
│   ├── autonomous-goals.tql        # L6 reference — the L7 frontier engine
│   ├── substrate.tql               # DEPRECATED — pointer to src/schema/one.tql
│   ├── seed.tql                    # Bootstrap data, loadable AFTER one.tql
│   └── archive/                    # Pre-3.x files (genesis, launchpad) + README
│
├── examples/                   # Domain applications (pre-3.x rule syntax)
│   ├── ecommerce.tql
│   ├── iot-monitoring.tql
│   ├── social-network.tql
│   └── supply-chain.tql
│
├── runtime/
│   └── colony.ts               # 70-line TS substrate — 3.x-compliant
│
└── docs/
    └── extended-mind-ai.md     # Architecture essay
```

> There is no `lessons/` directory in this package. The 6 lessons are distributed across `standalone/*.tql` (mechanical form) and the top-level `.md` reference docs (conceptual form). A `lessons/` tutorial tree was planned but the merged-doc format shipped instead — the top-level design docs serve that purpose.

---

## TypeDB 3.0 Syntax

| Feature | 3.0 Syntax | Retired in 2.x |
|---------|-----------|---------|
| Functions replace rules | `fun name() -> type : match ... return ...;` | ~~`rule name: when { } then { };`~~ (gone) |
| Integers | `value integer` | ~~`value long`~~ |
| Delete | `delete $attr;` (deletes ownership via variable) | ~~`delete $entity has attr $attr;`~~ |
| Sessions | **removed** — transactions are opened directly on the driver | ~~`session.transaction(...)`~~ |
| Concept API | **removed** — all reads/writes go through TypeQL | ~~`thing.asAttribute().getValue()`~~ |
| Role aliasing | `relates group as owned` — subrelation renames inherited role | (new in 3.x) |
| List attribute values | `attribute tags, value string[];` | (new in 3.x) |
| Struct value types | `struct address { street: string, city: string };` | (new in 3.x) |
| Compound keys | `owns part @subkey("composite")` + role `@key` | (new in 3.x) |
| Cascading delete | `relates owner @cascade;` | (new in 3.x) |

> **The rule→function transition is not a rename.** Functions are typed, composable, callable from pipelines, and return streams/scalars/structs. Rules were untyped forward-chaining.
>
> **Status (2026-04-20):** All live `standalone/*.tql` and `examples/*.tql` files are TypeDB 3.x — zero `rule` keywords remain. The only pre-3.x files are in `standalone/archive/` (`genesis-pre-3x.tql`, `launchpad-pre-3x.tql`) — kept as historical reference with a `README.md` in that directory explaining why.

---

## See Also

These patterns don't live in isolation. They cross-reference the ONE substrate's production code:

| Resource | What it provides |
|----------|------------------|
| [`.claude/skills/typedb/SKILL.md`](../../.claude/skills/typedb/SKILL.md) | **Canonical TypeDB 3.x syntax reference.** Queries-as-Types framing, pipeline semantics, 3.x feature deep-dive (cascade / structs / list attrs / `@index` / MVCC), and the *Production Patterns* section that distills classifier-function / thing-collapse / symmetric-routing idioms used in world.tql. |
| [`.claude/skills/typedb/reference/research-notes-2026-04.md`](../../.claude/skills/typedb/reference/research-notes-2026-04.md) | Source corpus: the PACMMOD 2024 paper, 3.0 roadmap extract, Vaticle lecture notes, "Inside TypeDB" all-hands Dec 2025 highlights. |
| [`src/schema/one.tql`](../../src/schema/one.tql) | The canonical **6-dimension ontology** — 272 lines, stable. Demonstrates the `thing` collapse pattern (one entity type absorbs plan/task/cycle/skill via `thing-type` discriminator). |
| [`src/schema/world.tql`](../../src/schema/world.tql) | The **live runtime schema** — 787 lines. Where the deterministic sandwich (`can_receive`, `is_safe`, `within_budget`, `preflight`) lives as typed functions, and the symmetric-routing pair (`tasks_for_unit` / `units_for_task`) demonstrates shared-variable unification. |
| [`src/schema/sui.tql`](../../src/schema/sui.tql) | **On-chain mirror.** Proves the ontology bridges cleanly to a deterministic, value-bearing substrate (Move). Same names, two fires. |
| `/typedb` skill via the Skill tool | Canonical 3.x patterns for every TQL task. Use whenever you write or refactor TypeQL in this repo. |
| `/sui` skill via the Skill tool | When editing either Move contracts or their TypeDB mirrors — names must agree. |

**Reading order suggestion:**
1. This README → `SKILL.md` (for the theoretical backbone + 3.x syntax)
2. `standalone/*.tql` lesson files (for the 6-lessons pedagogy, with banner noting they're pre-3.x)
3. `src/schema/world.tql` (to see the lessons landed in production, with modern `fun` syntax)
4. `SUBSTRATE-MAPPING.md` (this package) to see the lesson-to-production translation table

---

## The Core Insight

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   Everyone has agents. No one has emergence.                                │
│                                                                              │
│   We're not building intelligence.                                          │
│   We're building the CONDITIONS where intelligence evolves.                  │
│                                                                              │
│   The substrate is our habitat.                                             │
│   Intelligence is our harvest.                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Requirements

- TypeDB Cloud or Community 3.0+
- TypeDB Console or any TypeDB driver (Python, Java, Node.js, Rust)

---

## License

MIT — see [LICENSE](LICENSE)

---

## Contributing

Built by [Ants at Work](https://antsatwork.io). Issues, PRs, and new domain examples welcome.

---

## Further Reading

- [Chapter 2: Task Allocation Without Instructions](https://ants-at-work.com/book/2/)
- `docs/extended-mind-ai.md` — How TypeDB serves as the colony's externalized mind
- `lessons/00-philosophy.md` — The emergence thesis
