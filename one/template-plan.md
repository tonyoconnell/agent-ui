---
title: Plan Template
type: plan
version: 2.1.0
status: TEMPLATE
---

# Plan Template

**One file = one plan = contract + execution + pheromone target.**
A plan is the full signal template: what changes, why, how it dies
gracefully, and the wave-by-wave execution that makes it real. Plans
compile to TypeDB via `/plan sync`; every field maps to a `thing`
attribute or a substrate relation.

> **One doc, not two.** v1.0 split contract (plan) from execution (TODO).
> v2.0 merges them. The old `template-todo.md` now redirects here.
>
> **Group-agnostic.** Route hints are tags, never names. Any group's
> chairman → CEO → director → agent chain picks up the plan via its own
> pheromone. Same doc, different paths.

---

## 0 — Pre-flight (classifier — run before writing the plan)

Most plans don't need the full machinery below. Check four priors — if all four
say yes, the plan body is **lean** (5 embedded sections in the spec doc that owns
the deliverable: goal, speed, tasks, verify, close). Any no → use the **full**
template body below.

| Prior | Question | Y/N |
| --- | --- | --- |
| **Spec locked** | Is the "what" decided and cited in a spec doc this plan references? | |
| **Variance known** | Is there one plausible shape, or are we discovering which works? | |
| **Exit scalar** | Is "done" a number / check / pass-fail — not an aggregate judgment? | |
| **Files known** | Is recon already done in the spec (paths identified)? | |

**Rule:** 4 yes → **lean** · ≤ 2 yes → **full**, recon-first · 3 yes (one uncertain)
→ **mixed** — full plan but mark the lean-eligible cycles `mode: lean`, full waves
only on the uncertain cycle.

### Lifecycle → default mode

| Lifecycle | Typical priors | Default mode |
| --- | --- | --- |
| **discovery** | unlocked spec + unknown variance + unmapped files | full, recon-heavy |
| **construction** | locked spec + known variance + scalar exit + known files | **lean** |
| **evolution** | locked spec + *unknown* variance + known files + rubric-scored | full, split-test-heavy |
| **maintenance** | bug fix / small change + scalar exit + known file | **lean** |
| **retirement** | sunset / deprecate, exit is "paths redirect or 404s replaced" | **lean** |

Mode + lifecycle land in frontmatter below. On every `/close`, they tag the emitted
pheromone (`mode:lean`, `lifecycle:construction`), so the substrate learns which
shapes of work succeed in which mode. If lean-mode plans start missing budgets
>20%, the classifier tightens on its own — this is self-correcting.

**If mode: lean** — skip the rest of this template. Write the lean 5-section plan
inline in the spec doc that owns the deliverable (e.g., the "Build plan" section
of `website.md`):

```markdown
### {n} · {slug} — {one-line goal}
- **goal:** {what changes when done}
- **speed:** {metric, target, where measured}
- **tasks:**
  - [ ] {id} — {deliverable} — exit: {exact check}
- **verify gate:** `bun run verify` · speed budget hit on `/speed` · {rule-file compliance} · {threat-model row} still holds
- **close:** `/close --surface {slug}` → `mark(surface-path, score)` + signal
```

Frontmatter (§1 below) still applies for lean plans; `cycles`, `rubric_weights`,
`split_tests`, and all §5-§14 are optional/omitted.

**If mode: full** — continue to §1 below. Recon earns its keep when the priors
don't hold. The Haiku × N → Opus → Sonnet × M → Sonnet × K cascade is designed
precisely for unlocked specs, unknown variance, and unmapped files.

---

## Frontmatter contract

Every plan opens with this YAML. Fields marked 🔒 are enforced by
`/plan sync` — a plan missing them fails to compile.

```yaml
---
title: {Short title, human-readable}
slug: {kebab-case-id}                      # 🔒 drives thing-id + routing
goal: {One sentence. What changes when done.}  # 🔒
group: {org-id or "ONE"}                   # 🔒 which world this runs in
cycles: {N}                                # 🔒 how many W1-W4 cycles
route_hints:                               # 🔒 tags, never names
  primary: [tag, tag, tag]
  secondary: [tag, tag]
rubric_weights:                            # 🔒 sums to 1.0, tilts W4
  fit: 0.30
  form: 0.20
  truth: 0.35
  taste: 0.15
split_tests:                               # optional — explicit variance points
  - cycle: {N}
    wave: {W3|W2}
    variants: {N}
    dimension: "{what varies across variants}"
escape:                                    # 🔒 stop condition
  condition: "{machine-observable trigger}"
  action: "{signal to emit + next step}"
downstream:                                # 🔒 emergent capability
  capability: {skill-id}
  price: {0.00 or null if not sellable}
  scope: {private | group | public}
source_of_truth:                           # 🔒 docs W2 auto-loads
  - one/dictionary.md
  - one/task.md
  - one/patterns.md
  - one/rubrics.md
  - {additional plan-specific docs}
mode: lean | full | mixed                  # 🔒 decided by §0 classifier
lifecycle: discovery|construction|evolution|maintenance|retirement  # 🔒
classifier:                                # 🔒 evidence for the mode choice
  spec_locked: {yes|no — cite doc:section}
  variance_known: {yes|no — if no, name the dimension}
  exit_scalar: {yes|no — name the metric}
  files_known: {yes|no — list paths or "needs W1"}
status: PLAN                               # 🔒 PLAN → SYNCED → RUNNING → CLOSED
---

> **Mode-dependent fields:** `cycles`, `rubric_weights`, `split_tests`, and §5-§14
> below apply only when `mode: full`. Lean plans omit them and embed the 5-section
> body in their owning spec doc (see §0).
```

---

## 1 — Vision (≤ 3 sentences)

Who feels the change. What the change is. Why it compounds. No hedging.
If you can't state it in three sentences, the plan isn't ready.

---

## 2 — Closed loop (ASCII diagram)

Draw the signal flow. Every arrow is a substrate verb (signal/mark/warn/
follow/fade/harden). Every node is a role (chairman/ceo/director/agent)
or a surface (chat/marketplace/sui).

```
chairman ─signal──► ceo ─follow──► director ─follow──► agent
                                                          │
                                                       execute
                                                          │
                                                       4-outcome
                                                   ╱     │    ╲
                                              result  timeout  dissolved/failure
                                                │        │         │
                                              mark()  neutral    warn()
                                                │                   │
                                               back to chairman as pheromone
```

If the plan can't be drawn, it can't be routed.

---

## 3 — Fronts (axes of work)

A front is a tag cluster + rubric tilt. Fronts parallelize across directors;
tasks within a front parallelize across agents. No front assigns a name.

| Front    | Tags                    | Rubric tilt (fit/form/truth/taste) | Director picks up (inferred) |
|----------|-------------------------|-------------------------------------|------------------------------|
| {name}   | [tag, tag, tag]         | 0.40 / 0.10 / 0.40 / 0.10            | whoever has highest pheromone |
| {name}   | [tag, tag]              | 0.20 / 0.50 / 0.10 / 0.20            | — |

---

## 4 — TQL compile (how plans write to TypeDB)

`/plan sync plan-<slug>.md` writes the plan as one `thing` tree. Agents
read from TypeDB (pheromone-routable); humans read from markdown (scannable).
Same content, two surfaces.

```tql
# The plan itself
insert $p isa thing,
  has thing-id "{slug}",
  has thing-type "plan",
  has name "{title}",
  has goal "{goal}",
  has cycles-planned {cycles},
  has status "PLAN",
  has tag "{route_hints.primary[*]}",
  has tag "{route_hints.secondary[*]}";

# Each cycle (thing-type="cycle") — containment relation to plan
insert $c1 isa thing,
  has thing-id "{slug}:1",
  has thing-type "cycle",
  has name "{cycle-1-name}",
  has task-status "open";
insert (container: $p, contained: $c1) isa containment;

# Each task (thing-type="task") — one per row in the wave tables below
insert $t isa thing,
  has thing-id "{slug}:1:r1",              # plan:cycle:role+index
  has thing-type "task",
  has task-wave "W1",
  has task-status "open",
  has task-effort {0..1},
  has task-value {0..1},
  has exit-condition "{condition}",
  has tag "{task-tags}";
insert (container: $c1, contained: $t) isa containment;

# Blocks (dependencies)
match $a isa thing, has thing-id "{slug}:1:r1"; $b isa thing, has thing-id "{slug}:1:d1";
insert (blocker: $a, blocked: $b) isa blocks;

# Downstream capability (created at plan close)
insert $s isa thing,
  has thing-id "{slug}:skill",
  has thing-type "skill",
  has name "{downstream.capability}",
  has price {downstream.price},
  has scope "{downstream.scope}";
```

See `one/task.md` for the full task ID shape + state machine.

---

## 5 — Wave mechanics (universal — every cycle runs this)

Every cycle is four waves. Each wave scores its own deliverable and emits
a feedback signal. Per-wave rubric weights tilt toward what matters at
that wave.

| Wave | Role letter | Model  | Deliverable | Rubric tilt | Exit |
|------|-------------|--------|-------------|-------------|------|
| W1   | r           | Haiku  | Recon report (N parallel) | 0.15 / 0.10 / **0.65** / 0.10 | ≥ (N-1)/N returned `result`; every finding cites file:line |
| W2   | d           | Opus   | Diff spec set             | **0.40** / 0.15 / **0.35** / 0.10 | Every W1 finding has a spec OR explicit "keep" |
| W3   | e           | Sonnet | Applied edits (M parallel)| 0.30 / 0.25 / **0.35** / 0.10 | All anchors matched; zero drift |
| W4   | v           | Sonnet | Verification report       | 0.25 / 0.15 / **0.45** / 0.15 | All 4 rubric dims ≥ 0.65 AND `bun run verify` green |

**Truth dominates early waves.** Recon must match disk; specs must match recon.
**Fit dominates W2.** Right decision beats elegant prose.
**W4 balances.** It judges all four dimensions of downstream work.

### Parallelism

**Maximum parallel within, sequential between.** Every wave spawns all its
agents in a **single message** with multiple tool calls. Defaults:

- W1 ≥ 4 Haiku (one per read target — never batch)
- W2 ≥ 2 Opus shards when findings > ~20 (one shard per domain, main ctx reconciles)
- W3 = one Sonnet per file (never batch files, never split a file across agents — anchor races)
- W4 ≥ 2 Sonnet verifiers (shard by check type: consistency / cross-ref / voice / rubric)

### Self-learning per wave

Every wave closes its own loop. Not just W4.

```
wave N produces deliverable
  → score against wave rubric weights (inline, cheap)
  → mark(`wave:N:path`, score × 5) on pass  OR  warn(`wave:N:path`, 0.5) on fail
  → emit `loop:feedback` signal: { tags:[...task.tags, `wave:${N}`, `model:${m}`], strength, content }
  → next wave's select() picks the path with strongest `wave:N+1` pheromone
```

**Outcome → strength mapping** (the 4-outcome algebra at wave scope):

| Wave outcome | Runtime | Strength | Effect |
|--------------|---------|----------|--------|
| returned + scored ≥ 0.65 | `{ result }` | score × 5 | path strengthens |
| returned + scored 0.50–0.64 | `{ result }` (weak) | score × 2 | mild mark, specialist fan-out |
| returned + scored < 0.50 | `(no result)` | `warn(1)` | path weakens, re-spawn once |
| agent timed out | `{ timeout }` | 0 | neutral |
| anchor missed / file gone | `{ dissolved }` | `warn(0.5)` | drop target |

---

## 6 — Deterministic sandwich (tests wrap every cycle)

```
PRE (W0, before W1)                    POST (after W4)
───────────────────                    ────────────────
bun run verify                         bun run verify
├── biome check .                      ├── biome check .   (no new lint)
├── tsc --noEmit                       ├── tsc --noEmit    (no new type errors)
└── vitest run                         ├── vitest run      (no regressions)
                                       └── new tests pass  (exit condition)
```

**W0 baseline:** run `bun run verify` before the first wave of any new cycle.
Don't start on a broken foundation.

**Cycle gate:** pass only when baseline tests still pass + new tests cover
new functionality + biome clean + tsc clean + W4 rubric ≥ 0.65 on all four
dimensions.

---

## 7 — Cycles (one section per cycle from frontmatter.cycles)

### Cycle 1 — {name}

**Deliverable:** {one concrete artifact}
**Exit:** {machine-observable condition}
**Rubric override (if any):** `{fit}/{form}/{truth}/{taste}` — otherwise use plan default.

#### Wave 1 — Recon (Haiku × N, N ≥ 4, parallel)

Spawn all N in one message. Each reads one file, reports `file:line` citations.
Rule: "Report verbatim. Do not propose changes. Under 300 words."

```yaml
tasks:
  - id: {slug}:1:r1                       # plan:cycle:role+index
    reads: [{file-path}]
    tags: [{tag}, {tag}, recon]
    effort: 0.2
    priority: 0.5
    exit: "every finding cites file:line"
    blocks: [{slug}:1:d1]                 # this task blocks W2 decide task
  - id: {slug}:1:r2
    reads: [{file-path}]
    tags: [{tag}, {tag}, recon]
    ...
```

#### Wave 2 — Decide (Opus, shard when W1 findings > ~20)

Context auto-loaded: every doc in `frontmatter.source_of_truth` + hypotheses
from `recall()` matching `route_hints`. Produce diff specs:

```
TARGET:    {filepath}
ANCHOR:    "<exact unique substring>"
ACTION:    replace | insert-after | insert-before | tombstone
NEW:       "<new text>"
RATIONALE: "<one sentence>"
```

```yaml
tasks:
  - id: {slug}:1:d1
    depends_on: [{slug}:1:r1, {slug}:1:r2]
    tags: [{tag}, {tag}, decide]
    effort: 0.4
    priority: 0.6
    exit: "every W1 finding has a spec OR explicit keep"
    blocks: [{slug}:1:e1]
```

#### Wave 3 — Edit (Sonnet × M, M = files touched, parallel)

One agent per file. All M in one message. Never batch files. Never split a
file. If split-test declared for this wave, M × variants.

```yaml
tasks:
  - id: {slug}:1:e1
    file: {file-path}
    depends_on: [{slug}:1:d1]
    tags: [{tag}, {tag}, edit]
    effort: 0.5
    exit: "all anchors matched; zero lines outside spec"
    blocks: [{slug}:1:v1]
    variant: null                         # or "a"/"b"/"c" if split-test
```

#### Wave 4 — Verify (Sonnet × K, K ≥ 2, parallel by check type)

Shard by dimension. Main ctx folds K reports.

```yaml
tasks:
  - id: {slug}:1:v1
    shard: consistency                    # consistency | xref | voice | rubric
    depends_on: [{slug}:1:e1, {slug}:1:e2, ...]
    tags: [{tag}, verify]
    exit: "rubric ≥ 0.65 on all 4 dims"
  - id: {slug}:1:v2
    shard: rubric
    ...
```

**On clean pass** (atomic, via `/close {task-id}` or `closeTask()`):
1. `update $t has task-status "verified", has rubric-* $scores, has verified-at <now>`
2. `mark(tag-path, rubricAvg × 5)` per tag on the task
3. Unblock dependents: any `blocked` task whose last blocker is now verified → `open`
4. If every task in parent cycle is verified → transition cycle to verified
5. Emit feedback signal `{receiver:"loop:feedback", kind:"result", data:{...}}`
6. Update checkbox in this file: `[ ]` → `[x]` (mirrors TypeDB, not authoritative)

**On dirty pass:** parallel micro-edits (one agent per dirty file), re-verify.
Max 3 loops. Hard stop on 4th.

#### Cycle 1 gate

```bash
# Verifiable commands that prove this cycle closed
{grep/curl/test}
```

```
[ ] Baseline tests still pass
[ ] New tests cover new functionality
[ ] biome check . clean on touched files
[ ] tsc --noEmit passes
[ ] W4 rubric ≥ 0.65 on all four dims
[ ] do:close signal emitted (via /close --plan {slug} --cycle 1)
```

### Cycle 2 — {name}
{repeat the wave structure}

### Cycle N — {name}
{repeat}

---

## 8 — Split-tests (only if frontmatter.split_tests non-empty)

Compile produces N sibling task-things. All run in parallel. Winner picked.

```
Cycle {N}, Wave {W3}
Variants: {3}
Dimension: "{what varies — edit strategy, prompt shape, routing policy}"

Variant a: {description}    → thing-id {slug}:{cycle}:e{index}.a
Variant b: {description}    → thing-id {slug}:{cycle}:e{index}.b
Variant c: {description}    → thing-id {slug}:{cycle}:e{index}.c

Winner:  (rubric × 0.6) + (speed × 0.3) + (cost × 0.1)
         → mark(path, score × 5) + mark('split-test-winner:{dimension}', 1)
Losers:  warn(0.5) on their path tags + variant letter
```

Don't split everything. Split only where **variance in approach** is
genuinely unknown. Plain execution tasks go single-track.

---

## 9 — Source of truth (W2 auto-load)

Every doc here is pulled into W2's context. Cite the **one thing** each locks.

| Doc | Locks |
|-----|-------|
| `one/dictionary.md` | canonical names, 6 verbs, 4 outcomes |
| `one/task.md` | task entity, state machine, ID shape |
| `one/patterns.md` | closed loop, zero returns, deterministic sandwich |
| `one/rubrics.md` | fit/form/truth/taste + gate 0.65 |
| `{plan-specific}` | `{what it locks}` |

---

## 10 — Escape

Plans must say how they die gracefully.

```
IF   rubric < 0.50 for 2 consecutive cycles
THEN emit signal → chairman { plan, trend, reason }
AND  status → PAUSED
AND  pending cycles withdrawn; prior artifacts preserved

IF   any W4 reports signal-loss invariant failure
     (task marked done without mark()/warn() firing)
THEN status → HALTED (Rule 1 violation — no further cycles)
AND  emit signal → chairman + board
```

A plan that can't die wastes pheromone.

---

## 11 — Downstream pitch (auto-fires on plan close)

When the final cycle's W4 passes:

1. Declare capability: `insert (provider: $u, offered: $s) isa capability, has price {price}, has scope {scope}`
2. Emit pitch signal: `{receiver:"marketplace", kind:"pitch", data:{skill, chat_url, transaction_url}}`
3. Marketplace publishes `/chat/{agent-uid}/{skill-id}`
4. Chat route renders the pitch body + RichMessage transaction card
5. Human click → signature → escrow → execute → settle → pheromone flows
   back to this plan's path (capability revenue × successful transactions)

```yaml
# At plan close, this block is rendered into the marketplace listing:
pitch:
  headline: "{one-line hook}"
  body: "{2-3 sentences on the capability}"
  demo_url: /chat/{agent-uid}/{capability}
  transaction_url: /marketplace/pay?skill={capability}
```

**The plan opens a revenue edge. That's the flywheel.**

---

## 12 — Status (auto-derived from TypeDB)

Source of truth is `match $c isa thing, has thing-type "cycle", has thing-id "{slug}:*"; select $c.task-status`.
Markdown mirrors it for human readability.

- [ ] **Cycle 1: {name}** — {scope}
  - [ ] W1 — Recon (Haiku × {N})
  - [ ] W2 — Decide (Opus × {1 or shards})
  - [ ] W3 — Edits (Sonnet × {M})
  - [ ] W4 — Verify (Sonnet × {K})
- [ ] **Cycle 2: {name}** — ...
- [ ] **Cycle N: {name}** — ...

---

## 13 — How to run

```bash
# Plan lifecycle
/plan new {slug}                          # scaffold plan-{slug}.md from this template
/plan sync plan-{slug}.md                 # write plan + cycles + tasks to TypeDB
/plan status plan-{slug}.md               # rubric trend + escape risk
/plan pitch plan-{slug}.md                # publish downstream capability (auto at close)

# Task lifecycle (via /do and /close)
/do plan-{slug}.md                        # advance next wave
/do plan-{slug}.md --auto                 # run all cycles W1→W4 continuously
/do plan-{slug}.md --wave 2               # run a specific wave
/close {task-id}                          # close a single task (atomic)
/close --plan {slug} --cycle {N}          # close a cycle (all tasks must be verified)
/see tasks --plan {slug}                  # all tasks in this plan
/see tasks --status open                  # everything open across all plans
```

---

## 14 — Cost discipline

| Cycle | Wave | Agents | Model | Est. cost share |
|-------|------|--------|-------|-----------------|
| 1 | W1 | N ≥ 4 | Haiku | ~{N}% |
| 1 | W2 | 1 or ≥ 2 shards | Opus | ~{N}% |
| 1 | W3 | M (files) | Sonnet | ~{N}% |
| 1 | W4 | K ≥ 2 | Sonnet | ~{N}% |
| ... | ... | ... | ... | ... |

**Parallelism is cheap, serial is expensive.** Ten Haiku reading one file
each costs the same as one Haiku reading ten files — but finishes in ~1/10
the wall-time and deposits ten parallel marks on ten paths. Prefer more agents.

**Hard stop:** any W4 loops > 3 times → halt + escalate to chairman.

---

## What this template does NOT contain

- Deadlines (calendar time breaks Rule 2)
- Assigned owners (names break group portability)
- Hedging prose ("we might," "probably," "hopefully")
- Sections that don't map to substrate attributes

---

## See also

- `one/task.md` — task entity spec, state machine, ID shape
- `one/dictionary.md` — canonical names (auto-loaded by W2)
- `one/patterns.md` — closed loop, zero returns
- `one/rubrics.md` — fit/form/truth/taste (auto-loaded by W2)
- `one/lifecycle.md` — the arc a capability walks
- `one/routing.md` — follow/select mechanics
- `one/buy-and-sell.md` — trade lifecycle the pitch rides on
- `.claude/commands/plan.md` — slash command for this template
- `.claude/commands/do.md` — wave orchestration
- `.claude/commands/close.md` — atomic close protocol
- `one/template-todo.md` — deprecated; redirects here

---

*One doc. One plan. One thing-tree in TypeDB. Contract on top, execution
below, pitch at the end. Every transition is a signal. Every close is
pheromone. Every plan opens a revenue edge.*
