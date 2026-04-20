---
title: Task
type: spec
version: 1.0.0
status: CANONICAL
locks:
  - task entity shape (merged into `thing`)
  - task-id format (`{plan}:{cycle}:{role+index}`)
  - task state machine (4-outcome algebra)
  - task → skill production rule
---

# Task

**An atomic unit of work.** One `.on()` handler, one file edit, one recon
query, one verification shard. Tasks are how plans move. Pheromone routes them.
Rubric verifies them. `mark()` remembers them.

> **One entity, not two.** Task is `thing` with `thing-type="task"`. The old
> separate `task` entity is deprecated. See `one/one-ontology.md § dim 3`.

---

## 1 — The ID

```
{plan-slug} : {cycle} : {role}{index}
─────────   ─────   ────────
   plan      cycle      role letter + 1-based index
```

**Examples**

| ID                   | Meaning                                     |
|----------------------|---------------------------------------------|
| `loop-close`         | the plan (thing-type="plan")                |
| `loop-close:1`       | cycle 1 of the plan                         |
| `loop-close:1:r1`    | cycle 1, recon task #1 (W1, Haiku)          |
| `loop-close:1:d3`    | cycle 1, decide task #3 (W2, Opus)          |
| `loop-close:1:e5`    | cycle 1, edit task #5 (W3, Sonnet)          |
| `loop-close:1:v2`    | cycle 1, verify task #2 (W4, Sonnet)        |
| `loop-close:3:e2.b`  | cycle 3, edit task #2, **variant B** (split-test) |

**Role → Wave → Model** (wave is implied by the role letter; no `w{N}` segment):

| Role | Wave | Model  | Purpose  |
|------|------|--------|----------|
| `r`  | W1   | Haiku  | recon    |
| `d`  | W2   | Opus   | decide   |
| `e`  | W3   | Sonnet | edit     |
| `v`  | W4   | Sonnet | verify   |

One separator (`:`) everywhere. Same convention as the substrate's
`unit:skill` receiver format. Copy-paste friendly, grep-friendly, TQL-friendly.

---

## 2 — The schema

```tql
# ONE entity for everything — plan, cycle, task, skill, service, token
entity thing,
  owns thing-id @key,
  owns thing-type,              # "plan" | "cycle" | "task" | "skill" | "service" | "token"
  owns name,
  owns price,
  owns tag @card(0..),

  # Task-only (meaningful when thing-type="task")
  owns task-wave,               # W1 | W2 | W3 | W4
  owns task-context @card(0..), # doc keys auto-loaded in context
  owns task-status,             # open | blocked | picked | done | verified | failed | dissolved
  owns task-effort,             # 0..1
  owns task-value,              # 0..1
  owns task-priority,           # 0..1
  owns task-variant,            # null | "a" | "b" | "c" (split-test letter)
  owns exit-condition,

  # Rubric (post-verify, any thing-type)
  owns rubric-fit, owns rubric-form, owns rubric-truth, owns rubric-taste,

  # Plan-only (meaningful when thing-type="plan")
  owns goal, owns cycles-planned,
  owns escape-condition, owns escape-action,

  # Governance + timing
  owns scope, owns brand, owns owner,
  owns started-at, owns closed-at, owns verified-at,

  plays capability:offered,
  plays blocks:blocker,         plays blocks:blocked,
  plays containment:container,  plays containment:contained,
  plays production:producer,    plays production:produced;

relation blocks,       relates blocker,   relates blocked;
relation containment,  relates container, relates contained;  # plan→cycle, cycle→task
relation production,   relates producer,  relates produced;   # task→skill
```

**Containment** is the parent-child relation. `plan contains cycle`,
`cycle contains task`. **Production** is task → skill: a verified task
promotes a skill onto its owning unit's capability surface.

---

## 3 — The state machine

Every task transitions through exactly these states. Each transition is a
signal; each close deposits pheromone. The 4-outcome algebra is the core.

```
    OPEN ──pick()──► PICKED ──execute()──► ╔══════════════════════╗
      ▲                 │                    ║   4-outcome branch   ║
      │              timeout?                ╚══════════════════════╝
      │                 │                       │     │      │      │
      │                 ▼                   result timeout dissolved failure
      │              TIMEOUT                    │     │      │      │
      │                 │                    mark(+d) 0    warn(0.5) warn(1)
      │                 │                       │     │      │      │
      │                 ▼                       ▼     ▼      ▼      ▼
      │            (re-enqueue)              DONE  TIMEOUT DISSOLVED FAILED
      │                                          │                      │
      │                                      verify()            re-spawn once
      │                                          │                      │
      │                                          ▼                      ▼
      │                                       VERIFIED           FAILED (2nd time)
      │                                          │                      │
      │                                      production()            escalate
      │                                          │              to ceo/chairman
      │                                          ▼
      │                                       skill in
      │                                    capability relation
      │
      └── BLOCKED ──unblocker-verified──► OPEN
```

**Status transitions (authoritative):**

| From       | To          | Trigger                              | Signal emitted                    |
|------------|-------------|--------------------------------------|-----------------------------------|
| open       | picked      | agent accepts task                   | `{receiver:"loop:tasks", kind:"pick"}` |
| open       | blocked     | any `blocks:blocker` is not verified | `{kind:"block"}`                  |
| picked     | done        | `{result}` returned                  | `{kind:"result"}` + `mark(+depth)` |
| picked     | timeout     | `{timeout}`                          | `{kind:"timeout"}` (neutral)      |
| picked     | dissolved   | `{dissolved}` — missing unit/cap    | `{kind:"dissolved"}` + `warn(0.5)` |
| picked     | failed      | no result + no timeout               | `{kind:"failure"}` + `warn(1)`    |
| done       | verified    | W4 rubric ≥ 0.65                     | `{kind:"verify"}` + `mark(score×5)` |
| done       | failed      | W4 rubric < 0.50                     | `{kind:"verify-fail"}` + `warn(1)` |
| timeout    | picked      | re-enqueue (automatic)               | —                                 |
| blocked    | open        | last blocker enters `verified`       | `{kind:"unblock"}`                |
| failed     | open        | first failure only (one retry)       | `{kind:"retry"}`                  |
| (any)      | dissolved   | unit/capability removed              | `{kind:"dissolved"}` + `warn(0.5)` |

**Invariants** (enforced by tests):

- A task with `thing-type="task"` MUST have `task-wave` set.
- A task cannot enter `verified` without `rubric-{fit,form,truth,taste}` values.
- A cycle cannot transition to `verified` until every contained task is `verified`.
- A plan cannot transition to `verified` until every contained cycle is `verified`.
- A task with `task-variant` set MUST have a sibling task with same `task-wave` and different variant letter.

---

## 4 — How tasks compose

```
plan (thing, type=plan)
  │ containment
  ▼
cycle (thing, type=cycle)           × N cycles (plan.cycles-planned)
  │ containment
  ▼
task (thing, type=task)             × 4 waves × M parallelism
  │
  ├── task-wave:  W1 | W2 | W3 | W4
  ├── task-status: open → picked → done → verified
  ├── tag: [...plan.route-hints, wave-specific]
  ├── blocks: [other task-id, ...]
  ├── task-variant: null | "a" | "b" | "c"  (only if parent cycle declares split-test)
  │
  production
  ▼
skill (thing, type=skill)           only created when task-status="verified" and rubric ≥ 0.65
  │
  (listed on)
  ▼
capability (relation)               provider: unit, offered: skill, price: X, scope: Y
```

Every relation is a first-class edge. Every edge is pheromone-markable.

---

## 5 — Routing (how a task finds its agent)

No task ever names an agent. Routing is emergent.

```
task has tags [substrate, routing, recon]
     │
     ▼
ceo runs select() with those tags
     │
     ├── finds director D with highest pheromone on [substrate, routing]
     │
     ▼
director D fans out to their team
     │
     ├── runs select() with task's tags + wave (W1→Haiku, W3→Sonnet, …)
     │
     ▼
agent A picks up — sets task-status = "picked"
     │
     ▼
agent A executes → 4-outcome → state transition → pheromone deposit
     │
     ▼
next task with similar tags routes faster (pheromone compounds)
```

`select()` uses: `weight = 1 + max(0, strength - resistance) × sensitivity`.
See `one/routing.md` for the full formula.

---

## 6 — Split-testing (when a task has variants)

Parent task declares in its frontmatter: `variants: 3, dimension: "<what varies>"`.
Compile produces N sibling task-things, each with `task-variant: "a"|"b"|"c"`.

```
parent task           (thing-id: loop-close:2:e5, task-variant: null)
  ├── variant a       (thing-id: loop-close:2:e5.a)
  ├── variant b       (thing-id: loop-close:2:e5.b)
  └── variant c       (thing-id: loop-close:2:e5.c)
```

All variants run in parallel. On completion:
- Winner: highest `(rubric × 0.6) + (speed × 0.3) + (cost × 0.1)` → `mark(score × 5)`
- Losers: `warn(0.5)` on their path tags + `task-variant:{letter}`

The substrate learns which **strategy** wins, not just which run. Future
tasks with similar tag clusters route toward the winning variant's path.

---

## 7 — Task → skill promotion

When a task reaches `verified` with rubric ≥ 0.65, a skill is created:

```tql
insert $s isa thing,
  has thing-id "{task-id}:skill",
  has thing-type "skill",
  has name "{deliverable-name}",
  has price "{plan.downstream.price or 0}",
  has scope "{plan.downstream.scope or 'private'}",
  has tag "{task.tags}";

match $t isa thing, has thing-id "{task-id}";
insert (producer: $t, produced: $s) isa production;

# And listed as a capability of the owning unit (the agent who picked it)
match $u isa actor, has aid "{agent-uid}"; $s isa thing, has thing-id "{task-id}:skill";
insert (provider: $u, offered: $s) isa capability,
  has price "{price}",
  has scope "{scope}";
```

After a skill exists, the agent appears in `discover` queries for its tag
cluster. After 5 successful invocations, path hardens → highway. After the
first settlement, capability pays revenue.

---

## 8 — Closing a task (the atomic write)

`/close <task-id>` (or programmatic `closeTask(id, outcome, rubric)`):

1. Update status atomically: `match $t has thing-id $id; update $t has task-status "verified", has closed-at <now>, has verified-at <now>, has rubric-fit $f, has rubric-form $fm, has rubric-truth $tr, has rubric-taste $ta;`
2. Deposit pheromone: `mark(tag-path, rubricAvg × 5)` for each tag on the task.
3. Unblock dependents: `match (blocker: $t, blocked: $b) isa blocks, $b has task-status "blocked"; update $b has task-status "open";`
4. Emit feedback signal: `{receiver:"loop:feedback", kind:"result", data:{task-id, rubric, outcome}}`.
5. If every task in parent cycle is verified, transition cycle to verified (cascades to plan-close checks).

**Never skip any step.** Partial closes corrupt pheromone and blocking.
Wrap in a single transaction if possible.

---

## 9 — Querying tasks (a pure TQL surface)

All task queries use the merged `thing` entity. Common patterns:

```tql
# All open tasks in current plan
match
  $p isa thing, has thing-id "loop-close", has thing-type "plan";
  $c isa thing, has thing-type "cycle";
  $t isa thing, has thing-type "task", has task-status "open";
  (container: $p, contained: $c) isa containment;
  (container: $c, contained: $t) isa containment;
select $t;

# Next task I should pick (highest priority × pheromone)
match
  $t isa thing, has thing-type "task", has task-status "open",
    has tag $tag, has task-priority $p;
  ?strength := sum { ... };    # pheromone sum across tag cluster
select $t order by $p * ?strength desc limit 1;

# Tasks I'm blocked on
match
  (blocker: $a, blocked: $b) isa blocks;
  $b has thing-id "loop-close:2:e5", has task-status "blocked";
  $a has task-status $s;
select $a, $s;

# Verified tasks that produced a skill (the capability surface)
match
  $t isa thing, has thing-type "task", has task-status "verified";
  (producer: $t, produced: $s) isa production;
  $s isa thing, has thing-type "skill";
select $t, $s;
```

Every question about tasks is a TQL query. No bespoke API needed. No shadow state.

---

## 10 — Migration from the old `task` entity

One-time cleanup (run in a migration, drop after):

```tql
# Migrate existing task rows → thing with thing-type="task"
match $old isa task,
  has task-id $id, has task-name $name, has status $s,
  has value $v, has effort $e, has phase $ph, has priority-score $pr,
  has exit-condition $ex;
insert $new isa thing,
  has thing-id $id,
  has thing-type "task",
  has name $name,
  has task-status $s,
  has task-value $v,
  has task-effort $e,
  has task-wave $ph,
  has task-priority $pr,
  has exit-condition $ex;

# Re-create blocks relations on the new things
match (blocker: $ob, blocked: $oc) isa blocks;
  $ob has task-id $bid; $oc has task-id $cid;
  $nb isa thing, has thing-id $bid, has thing-type "task";
  $nc isa thing, has thing-id $cid, has thing-type "task";
insert (blocker: $nb, blocked: $nc) isa blocks;

# After verification, drop the old entity + redundant attributes
undefine entity task;
undefine attribute task-name;        # redundant with 'name'
undefine attribute phase;            # redundant with 'task-wave'
undefine attribute priority-score;   # redundant with 'task-priority'
```

---

## See also

- `src/schema/one.tql` — the live schema
- `one/one-ontology.md` — dim 3: `thing` with `thing-type` selector
- `one/dictionary.md` — `task*` vocabulary
- `one/template-plan.md` — how plans declare tasks
- `one/routing.md` — `select()` formula that picks a task's agent
- `one/rubrics.md` — fit/form/truth/taste dimensions on every task
- `one/lifecycle.md` — how task-verified drives HIGHWAY and HARDEN stages
- `.claude/commands/do.md` — orchestration (reads task-status, respects wave)
- `.claude/commands/close.md` — the atomic close protocol

---

*One entity. One ID shape. One state machine. Every transition is a signal.
Every close is a pheromone deposit. Tasks are how the substrate moves.*
