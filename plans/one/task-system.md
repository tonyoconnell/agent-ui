---
title: Task System
slug: task-system
goal: Merge task/plan/thing; ship /in workspace; best task manager for agents and humans.
group: ONE
cycles: 5
route_hints:
  primary: [substrate, schema, task-mgmt, typedb]
  secondary: [ui, workspace, api, docs]
rubric_weights:
  fit: 0.35
  form: 0.20
  truth: 0.35
  taste: 0.10
split_tests: []
escape:
  condition: "rubric < 0.50 for 2 consecutive cycles OR W4 reports schema regression"
  action: "emit signal → chairman with trend + pause remaining cycles"
downstream:
  capability: task-routing
  price: 0.03
  scope: public
source_of_truth:
  - one/dictionary.md
  - one/dsl.md
  - one/task.md
  - one/rubrics.md
  - one/template-plan.md
  - src/schema/one.tql
status: RUNNING
---

# Plan: Task System

## 1 — Vision

Tasks are the substrate's unit of work. When they're first-class in TypeDB — not
just markdown checkboxes — every `/do` run deposits pheromone on real paths, every
W4 close unblocks real dependents, and every verified task can promote a skill.

The `/in` workspace is the human surface for this: a four-column view (nav / list
/ detail / chat) where agents and humans see the same task queue, filtered by
pheromone. No separate task tracker. The substrate IS the tracker.

## 2 — The closed loop

```
plan-task-system.md
     │
     │  /plan compile
     ▼
Cycle N tasks → TypeDB as thing entities
     │
     ├── CEO select() with [substrate, schema] tags → CTO director
     │
     ├── Director fans out to agents (W1 Haiku / W2 Opus / W3 Sonnet / W4 Sonnet)
     │
     ├── Agent executes → 4-outcome → task-status transition
     │
     ├── W4 verify → rubric ≥ 0.65 → mark(tag-path, score×5)
     │
     ├── containment cascade → cycle verified → plan verified
     │
     └── pheromone feeds next cycle's select()
```

## 3 — Fronts

| Front | Tags | Rubric tilt | Who |
|-------|------|------------|-----|
| Schema | [substrate, schema, typedb] | 0.40/0.10/0.40/0.10 | CTO → engineering |
| Vocab | [docs, dictionary, dsl] | 0.20/0.25/0.40/0.15 | CTO → docs agent |
| API | [api, tasks, substrate] | 0.35/0.15/0.40/0.10 | CTO → engineering |
| UI | [ui, workspace, in-page] | 0.40/0.20/0.30/0.10 | CMO → design |

## 4 — Cycles

### Cycle 1 — Schema merge ✅ VERIFIED (rubric 0.88, 2026-04-20)

**Deliverable:** `src/schema/one.tql` v2.0 — `thing` absorbs plan/cycle/task/skill.
17 new attributes. `containment` + `production` relations added. Old `task` entity
deprecated but kept for one migration cycle. `one/task.md` spec published.

**Exit:** ✅ Schema defines `thing` with `thing-type`, all task-* attrs, `blocks`/`containment`/`production`. `one/task.md` canonical. 5 edits verified at avg rubric 0.88.

| Wave | Delivered | Rubric |
|------|-----------|--------|
| W3-e1 | Absorb task attrs onto `thing` | 0.92 |
| W3-e2 | Deprecate old `task` entity | 0.85 |
| W3-e3 | Add containment + production | 0.90 |
| W3-e4 | Declare new attributes | 0.88 |
| W3-e5 | Footer summary | 0.86 |

---

### Cycle 2 — Vocab propagation (RUNNING)

**Deliverable:** `one/dictionary.md` + `one/dsl.md` absorb v2.0 vocabulary:
task-status 7 values, task-id shape, thing-type selector, containment/production
relation names, deprecated names list. W4 adds a dead-name grep check.

**Rubric weights:** `0.20 / 0.25 / 0.40 / 0.15` (truth + form dominate — accuracy of names)

**Exit:** grep for dead names (tid as task key, task-type, "in_progress", assignment, dependency) returns 0 in `one/dictionary.md` and `one/dsl.md`.

| Wave | What | Model | Closes with |
|------|------|-------|------------|
| W1 | Recon dictionary.md, dsl.md, one.tql, template-plan.md | 4× Haiku | findings with line numbers |
| W2 | Spec: exact anchors + replacement text for each doc | Opus | anchored diff specs |
| W3 | Edit: dictionary.md + dsl.md + backfill task-system.md | 3× Sonnet | files modified |
| W4 | Verify: dead-name grep + rubric | 1× Sonnet | rubric ≥ 0.65 |

---

### Cycle 3 — `/in` live-data wire

**Deliverable:** `/in` page swaps static `@/data/in.json` for live `/api/tasks` +
WebSocket. Task list shows pheromone categories (attractive/ready/exploratory/repelled).
First working unified workspace.

**Rubric weights:** `0.40 / 0.10 / 0.40 / 0.10` (fit + truth — it has to work)

**Exit:** Loading `/in` in browser shows real tasks from TypeDB. WebSocket updates
a task's status live when another tab closes it.

| Wave | What | Model | Closes with |
|------|------|-------|------------|
| W1 | Recon src/pages/in.astro, /api/tasks route, useTaskWebSocket hook | 3× Haiku | findings |
| W2 | Spec: swap static → live, pheromone category filter, WS hook | Opus | diff spec |
| W3 | Edit: in.astro + TaskList component + useTaskWebSocket wiring | 1× Sonnet per file | files modified |
| W4 | Verify: curl /api/tasks returns tasks + browser WS update works | 1× Sonnet | rubric ≥ 0.65 |

---

### Cycle 4 — README/CLAUDE/AGENTS doc integration

**Deliverable:** Root `CLAUDE.md`, `README.md`, and `agents/README.md` absorb the
merged task model. `scripts/release-templates/*` reflect the public API. Dead name
grep extended to cover all root docs.

**Rubric weights:** `0.25 / 0.40 / 0.20 / 0.15` (form + fit — doc quality)

**Exit:** grep for dead names across all docs returns 0 (excluding intentional
historical references in this plan's Cycle 1 section).

| Wave | What | Model | Closes with |
|------|------|-------|------------|
| W1 | Recon CLAUDE.md task sections, README.md, agents/README.md | 3× Haiku | findings |
| W2 | Spec: which sections need updating, anchors | Opus | diff spec |
| W3 | Edit: root docs + release templates | 1× Sonnet per file | files modified |
| W4 | Verify: dead-name grep + rubric | 1× Sonnet | rubric ≥ 0.65 |

---

### Cycle 5 — `/plan` command + task system self-hosting

**Deliverable:** `.claude/commands/plan.md` slash command exists. `plans/one/*.md`
files sync to TypeDB as thing entities on `/plan sync`. The task system manages
its own remaining cycles as TypeDB tasks — self-hosting.

**Rubric weights:** `0.35 / 0.15 / 0.40 / 0.10` (fit + truth — command must work)

**Exit:** `/plan sync plans/one/task-system.md` creates TypeDB things for C5 tasks.
`/do` can pick and execute a task-system:5:* task by uid alone.

| Wave | What | Model | Closes with |
|------|------|-------|------------|
| W1 | Recon .claude/commands/ structure, existing commands for pattern | 2× Haiku | findings |
| W2 | Spec: plan.md command contract + TypeDB sync logic | Opus | diff spec |
| W3 | Edit: create .claude/commands/plan.md + sync script | 1× Sonnet per file | files modified |
| W4 | Verify: /plan sync works + tasks appear in /do queue | 1× Sonnet | rubric ≥ 0.65 |

## 5 — Source of truth

| Doc | Locks |
|-----|-------|
| `src/schema/one.tql` | The live schema — authoritative for all attribute names |
| `one/task.md` | Task entity spec — state machine, ID format, production rule |
| `one/dictionary.md` | Canonical names — must stay in sync with schema |
| `one/dsl.md` | Signal grammar — wave phases live here |
| `one/rubrics.md` | Quality scoring — all W4 gates use this |
| `one/template-plan.md` | This doc's shape |

## 6 — Escape clause

```
IF  rubric < 0.50 for 2 consecutive cycles
THEN emit { receiver: "chairman", data: { plan: "task-system", trend: [...] } }
AND  status → PAUSED

IF  W4 detects dead names still present after grep
THEN warn(1) on vocab-propagation path
AND  re-run W3 (max 3 loops)

IF  /in page shows stale data after WebSocket wiring (Cycle 3)
THEN status → PAUSED (loop is not actually closing)
```

## 7 — Downstream pitch

```yaml
capability: task-routing
price: 0.03
scope: public
pitch:
  headline: "Tasks that route themselves."
  body: |
    Drop a plan. Tasks become signals. Agents compete by pheromone.
    W4 verifies. Skills promote. The substrate learns what works.
    Built on ONE.
  demo_url: /in
  transaction_url: /marketplace/pay?skill=task-routing
```

## 8 — How to run

```bash
/do plans/one/task-system.md             # advance next wave
/do plans/one/task-system.md --auto      # run all remaining cycles
/plan status plans/one/task-system.md    # rubric trend + escape risk
```

---

## See also

- `one/task.md` — canonical task spec
- `one/template-plan.md` — this doc's shape
- `one/dictionary.md` — names this plan enforces
- `one/dsl.md` — wave phases this plan adds
- `src/schema/one.tql` — schema this plan relies on
- `plans/one/loop-close.md` — downstream plan (depends on task routing)
