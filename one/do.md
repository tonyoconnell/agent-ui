# /do — Planning and Task Management

**The fastest way from intent to done.**

`/do` is ONE's unified planning and execution system. Say what you want in
natural language, and it finds the fastest path — whether that's running an
existing plan, creating a new one, or just doing the work directly.

```
┌─────────────────────────────────────────────────────────────────────┐
│  "/do create a landing page"                                        │
│        │                                                            │
│        ▼                                                            │
│  ┌─ Search: landing-page*.md, TODO-landing*.md, one/*landing*.md    │
│  │                                                                  │
│  ▼                                                                  │
│  Found: one/landing-page.md (spec), plan-landing.md (cycles)        │
│        │                                                            │
│        ▼                                                            │
│  Route: existing plan → run next wave                               │
│        │                                                            │
│        ▼                                                            │
│  W1 (Haiku) → W2 (Opus) → W3 (Sonnet) → W4 (Sonnet) → done         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Two Templates, One Brain

### template-plan.md — Full Plans

Use when: multi-cycle work, capability creation, team coordination.

```yaml
---
title: Landing Page
slug: landing-page
goal: Ship a landing page that converts visitors to users.
group: ONE
cycles: 2
route_hints:
  primary: [ui, landing, conversion]
rubric_weights:
  fit: 0.30
  form: 0.20
  truth: 0.35
  taste: 0.15
downstream:
  capability: landing-page-builder
  price: 0.10
  scope: public
---
```

**What you get:**
- Multiple cycles (W1→W4 per cycle)
- Split tests (A/B variants in W3)
- Escape conditions (auto-pause on rubric < 0.50)
- Downstream capability (plan close → marketplace listing)
- Full TypeDB persistence (tasks, paths, rubric history)

### template-todo.md — Dashboard View

Use when: monitoring all active plans, seeing what's next.

The `todo.md` at each group's root aggregates across all plans:

```
┌─ Active plans ─────────────────────────────────────────────┐
│ landing-page    2/3 cycles    rubric 0.82 ↑    next: W3   │
│ auth-refactor   1/2 cycles    rubric 0.78 =    next: W1   │
└────────────────────────────────────────────────────────────┘

┌─ Tasks by status ───────────┐
│ open: 12   picked: 3        │
│ blocked: 5   verified: 47   │
└─────────────────────────────┘

┌─ Next actions (ranked by priority × pheromone) ───────────┐
│ 1. /do plan-landing.md --wave 3          score: 0.92      │
│ 2. /close auth:1:e2                      score: 0.87      │
└───────────────────────────────────────────────────────────┘
```

**What you get:**
- Live view of all active plans
- Task status rollup
- Rubric trends (7 days)
- Pheromone heatmap
- Ranked next actions

---

## The Modes

| Mode | Input | What happens |
|------|-------|--------------|
| **Intent** | `/do create a landing page` | Search → reflect → route to fastest path |
| **Plan** | `/do plan-landing.md` | Run next wave of that plan |
| **Auto** | `/do plan-landing.md --auto` | Run all cycles W1→W4 continuously |
| **Wave** | `/do plan-landing.md --wave 2` | Run specific wave (override) |
| **Autonomous** | `/do` | Pick → execute → mark → repeat forever |
| **Once** | `/do --once` | Single iteration of autonomous loop |

---

## Intent Mode — Natural Language to Action

When you say `/do <natural language>`, here's what happens:

### Step 1: Extract Topic

```
"create a landing page"     → landing-page
"fix the auth middleware"   → auth-middleware  
"add payment tracking"      → payment-tracking
```

### Step 2: Search for Context

```bash
# Run in parallel
glob "**/plan-{topic}*.md"           # existing plans
glob "**/TODO-{topic}*.md"           # legacy TODOs
glob "**/*{topic}*.md"               # specs, docs
glob "one/**/*{topic}*.md"           # task docs
```

### Step 3: Reflect — What Do We Have?

| Found | State | Fastest Path |
|-------|-------|--------------|
| Plan exists | Execution queued | → Run next wave |
| Spec exists, no plan | Scope defined | → Create plan from spec |
| Sources exist | Code is the spec | → Direct execution OR create plan |
| Nothing exists | Greenfield | → Ask for scope → create plan |

### Step 4: Report and Route

```
┌─ /do intent: "create a landing page"
│
│  Topic:   landing-page
│  Found:   1 plan, 2 specs, 0 sources
│
│  Context:
│    • plan-landing.md — 2 cycles, at C1/W3
│    • one/landing-page.md — full spec with hero, benefits
│
│  Decision: use-existing-plan
│  Rationale: plan exists, W3 ready
│
└─ Proceeding with: /do plan-landing.md
```

---

## Skill Pre-flight Check

**Before executing ANY task**, `/do` verifies required skills exist and are current.

### How Skills Are Inferred

```
Task tags: [ui, landing, astro]     → /astro, /shadcn, /react19
Task tags: [typedb, schema]          → /typedb
Task tags: [sui, wallet]             → /sui
File types: *.astro, *.tsx           → /astro, /react19
Intent: "create a landing page"      → /astro, /shadcn
```

### Skill Status

| Status | Meaning | Action |
|--------|---------|--------|
| `ready` | Exists, updated < 30d | Proceed |
| `stale` | Exists, updated > 30d | Suggest refresh |
| `missing` | Doesn't exist | Create or skip |

### Pre-flight Output

```
┌─ Skill Pre-flight
│
│  Required: /astro, /shadcn, /react19
│
│  Status:
│    ✓ /astro      ready    (updated 2d ago)
│    ✓ /shadcn     ready    (updated 5d ago)
│    ⚠ /react19    stale    (updated 45d ago)
│
│  Action: Proceed with warning
│
└─ Continuing...
```

### Missing Skills

If a required skill is missing:

```
┌─ Skill Pre-flight
│
│  Required: /sui
│  Status:  ✗ /sui  missing
│
│  Options:
│    1. Create skill (scaffold from template)
│    2. Skip task
│    3. Proceed anyway (risky)
│
└─ Choice? [1/2/3]
```

**Why this matters:** A task tagged `[typedb, schema]` without `/typedb` loaded
will use TypeDB 2.x syntax on a 3.x database. The skill check prevents this.

---

## How Tasks Get to TypeDB

Every plan compiles to a `thing` tree in TypeDB:

```
plan-landing (thing-type="plan")
├── landing:1 (thing-type="cycle")
│   ├── landing:1:r1 (thing-type="task", task-wave="W1")
│   ├── landing:1:r2 (thing-type="task", task-wave="W1")
│   ├── landing:1:d1 (thing-type="task", task-wave="W2")
│   ├── landing:1:e1 (thing-type="task", task-wave="W3")
│   └── landing:1:v1 (thing-type="task", task-wave="W4")
└── landing:2 (thing-type="cycle")
    └── ...
```

**The sync command:**

```bash
/plan sync plan-landing.md
```

Writes:
- Plan → `thing` with `thing-type="plan"`
- Cycles → `thing` with `thing-type="cycle"`, `containment` to plan
- Tasks → `thing` with `thing-type="task"`, `containment` to cycle
- Dependencies → `blocks` relations between tasks

**Tasks have attributes:**

```tql
insert $t isa thing,
  has thing-id "landing:1:e1",
  has thing-type "task",
  has task-wave "W3",
  has task-status "open",
  has task-effort 0.5,
  has task-value 0.8,
  has tag "ui",
  has tag "landing",
  has exit-condition "all anchors matched; zero lines outside spec";
```

---

## The Four Waves

Every cycle runs four waves. Each wave has a model, a deliverable, and a rubric.

### W0 — Baseline (before W1)

```bash
bun run verify   # biome + tsc + vitest
```

Don't build on broken ground. If W0 fails, fix before proceeding.

### W1 — Recon (Haiku, parallel)

**Who:** ≥ 4 Haiku agents, one per file
**Rule:** "Report verbatim. Do not propose changes. Under 300 words."
**Deliverable:** File citations with `file:line`

```yaml
tasks:
  - id: landing:1:r1
    reads: [src/pages/index.astro]
    tags: [ui, landing, recon]
    exit: "every finding cites file:line"
```

**Spawn all in one message** — this is how you get parallelism.

### W2 — Decide (Opus, main context)

**Who:** You. Never delegate W2.
**Rule:** Every W1 finding → diff spec OR explicit "keep"
**Deliverable:** Diff specs

```
TARGET:    src/pages/index.astro
ANCHOR:    "<section class=\"hero\">"
ACTION:    replace
NEW:       "<section class=\"hero bg-gradient\">"
RATIONALE: "Add gradient for visual impact"
```

### W3 — Edit (Sonnet, parallel)

**Who:** M Sonnet agents, one per file
**Rule:** Use Edit tool with exact anchor. If anchor doesn't match, report dissolved.
**Deliverable:** Applied edits

```yaml
tasks:
  - id: landing:1:e1
    file: src/pages/index.astro
    depends_on: [landing:1:d1]
    exit: "all anchors matched; zero lines outside spec"
```

### W4 — Verify (Sonnet, parallel by check type)

**Who:** ≥ 2 Sonnet verifiers
**Rule:** Score rubric, run tests, check cross-consistency
**Deliverable:** Rubric scores (fit/form/truth/taste)

```bash
bun run verify   # must pass
```

**Gate:** All four dims ≥ 0.65 AND tests green.

---

## Turn-Taking: The Autonomous Loop

When you run `/do` with no arguments, you enter the autonomous loop:

```
loop:
  SENSE    → GET /api/tasks (sort by priority × pheromone)
  SELECT   → Pick highest unblocked (P0 > P1, attractive > ready)
  EXECUTE  → Do the work (edit files, run scripts)
  VERIFY   → bun tsc --noEmit on touched files
  MARK     → POST /api/tasks/{id}/complete
  DIMS     → POST /api/loop/mark-dims { fit, form, truth, taste }
  FEEDBACK → POST /api/signal { receiver: loop:feedback, ... }
  GROW     → GET /api/highways → report learned paths
  → repeat
```

**What happens at each step:**

| Step | Action | Learning |
|------|--------|----------|
| SENSE | Read task queue from TypeDB | — |
| SELECT | Pick by `(priority × value) × pheromone` | — |
| EXECUTE | Do the actual work | — |
| VERIFY | Run deterministic checks | — |
| MARK | `task-status → verified` | mark(path, rubric×5) |
| DIMS | Score rubric dimensions | mark/warn per dimension |
| FEEDBACK | Emit signal to `loop:feedback` | pheromone on tag paths |
| GROW | Promote highways to knowledge | L6 learning |

**The substrate learns which tasks succeed.** High-rubric completions strengthen
paths; future `select()` follows the strongest trails.

---

## Closing Loops with /close

Every task must close. `/close` is `mark()` made human-readable.

| Command | Outcome | Effect |
|---------|---------|--------|
| `/close landing:1:e1` | result | mark(+5), strength++ |
| `/close landing:1:e1 --fail` | failure | warn(1), resist++ |
| `/close landing:1:e1 --dissolved` | dissolved | warn(0.5), mild |
| `/close landing:1:e1 --timeout` | timeout | neutral |

**On success, /close:**

1. Scores rubric (fit/form/truth/taste)
2. POST `/api/tasks/{id}/complete`
3. POST `/api/loop/mark-dims` (mark/warn per dimension)
4. Updates checkbox in plan file `[ ]` → `[x]`
5. Emits feedback signal (pheromone on tag paths)
6. Reports unlocked tasks

---

## Quick Start

### From natural language

```bash
/do create a landing page
# → Searches for context
# → Finds plan-landing.md
# → Runs next wave (W3)
# → Reports: marked=2, warned=0, dissolved=0
```

### From existing plan

```bash
/do plan-landing.md           # run next wave
/do plan-landing.md --auto    # run all cycles
/do plan-landing.md --wave 2  # force W2
```

### Autonomous mode

```bash
/do           # pick → execute → mark → repeat
/do --once    # single iteration
```

### Create a new plan

```bash
/plan new my-feature
# → Creates plan-my-feature.md from template
# → Opens for editing

/plan sync plan-my-feature.md
# → Writes to TypeDB
# → Tasks now visible in /see tasks
```

### Monitor progress

```bash
/see tasks                    # all open tasks
/see tasks --plan landing     # tasks in this plan
/see highways                 # learned paths
/todo                         # refresh dashboard
```

---

## The Learning Flywheel

Every `/do` cycle deposits pheromone:

```
W1 recon ─► findings cite file:line
              │
              ▼
W2 decide ─► every finding has spec or keep
              │
              ▼
W3 edit ─────► anchors match, zero drift
              │
              ▼
W4 verify ───► rubric ≥ 0.65 all dims
              │
              ▼
/close ──────► mark(path, rubric×5)
              │
              ▼
loop:feedback ► pheromone on tag paths
              │
              ▼
next select() follows strongest trails
```

**Good work compounds.** High-rubric tasks strengthen paths. Future agents
follow the trails that worked. Bad work decays — L3 fade forgives resistance
2× faster than strength.

**Plans open revenue edges.** When a plan closes, its downstream capability
publishes to the marketplace. Users pay to use it. Payments settle on Sui.
Revenue flows back as pheromone on the capability's path.

---

## Commands Reference

| Command | Purpose |
|---------|---------|
| `/do <intent>` | Natural language → fastest path |
| `/do plan-*.md` | Run next wave |
| `/do plan-*.md --auto` | Run all cycles |
| `/do` | Autonomous loop |
| `/plan new <slug>` | Create plan from template |
| `/plan sync <file>` | Write plan to TypeDB |
| `/close <task-id>` | Mark task complete |
| `/see tasks` | View task queue |
| `/see highways` | View learned paths |
| `/todo` | Refresh dashboard |

---

## See Also

- `one/template-plan.md` — full plan template (v2.0)
- `one/template-todo.md` — dashboard template (v4.1)
- `one/task.md` — task entity spec, state machine, ID shape
- `one/rubrics.md` — fit/form/truth/taste scoring
- `one/routing.md` — select() formula, pheromone mechanics
- `one/telemetry.md` — how every surface emits signals to the graph
- `.claude/commands/do.md` — skill implementation
- `.claude/commands/close.md` — close protocol
- `.claude/commands/see.md` — inspection commands

---

*One command. Any input. Fastest path to done.*
