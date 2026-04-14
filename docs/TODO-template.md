---
title: TODO Template
type: roadmap
version: 3.0.0
priority: Wire → Prove → Grow → Sustain → Graduate
total_tasks: 0
completed: 0
status: TEMPLATE
---

# TODO: {Title}

> **Time units:** plan in **tasks → waves → cycles** only. Never days, hours,
> weeks, or sprints. Width = tasks-per-wave. Depth = waves-per-cycle. Learning
> = cycles-per-path. (See `.claude/rules/engine.md` → The Two Locked Rules.)
>
> **Goal:** {One sentence. What changes when this is done.}
>
> **Source of truth:** [{source-doc}]({source-doc}.md) — {what it defines},
> [DSL.md](DSL.md) — the signal language,
> [dictionary.md](dictionary.md) — everything named,
> [rubrics.md](rubrics.md) — quality scoring (fit/form/truth/taste → mark)
>
> **Shape:** {N} cycles, four waves each. Haiku reads, Opus decides, Sonnet
> writes, Sonnet checks. Same loop as the substrate, different receivers.
>
> **Schema:** Tasks map to `world.tql` dimension 3b — `task` entity with
> `task-wave` (W1-W4), `task-context` (doc keys), `blocks` relation.
> Each task creates a matching `skill` for capability routing.

## Routing

Signals flow down through waves. Results flow up, marking paths with
tagged weights. Each tag:weight pair points to a different next hop.

```
    signal DOWN                     result UP
    ──────────                      ─────────
    /wave TODO-{name}.md            result + 4 tagged marks
         │                               │
         ▼                               │
    ┌─────────┐                          │
    │  W1     │  Haiku recon ────────────┤ mark(edge:fit, score)
    │  read   │  → report verbatim       │ mark(edge:form, score)
    └────┬────┘                          │ mark(edge:truth, score)
         │ context grows                 │ mark(edge:taste, score)
         ▼                               │
    ┌─────────┐                          │
    │  W2     │  Opus decide             │ weak dim?
    │  fold   │  → diff specs            │   → signal to specialist
    └────┬────┘                          │   → mark specialist path
         │ context grows                 │
         ▼                               │
    ┌─────────┐                          │
    │  W3     │  Sonnet edit             │
    │  apply  │  → code changes          │
    └────┬────┘                          │
         │                               │
         ▼                               │
    ┌─────────┐                          │
    │  W4     │  Sonnet verify ──────────┘
    │  score  │  → rubric: fit/form/truth/taste
    └─────────┘    each dim marks a tagged edge
                   weak dims fan out to coaches
```

**The signal is the routing.** Each wave's output becomes the next wave's
input via `.then()`. Each result marks four tagged edges via `markDims()`.
Weak dimensions (`< 0.65`) emit fan-out signals to specialists.
The graph learns what kind of work succeeds on which paths, by dimension.

**Context accumulates down. Quality marks flow up. Weights route sideways.**

## Testing — The Deterministic Sandwich Around Waves

Every cycle is wrapped in deterministic checks. Tests are the PRE and POST
of the TODO lifecycle — the same sandwich that wraps every LLM call.

```
    PRE (before W1)                    POST (after W4)
    ───────────────                    ────────────────
    bun run verify                     bun run verify
    ├── biome check .                  ├── biome check .     (no new lint)
    ├── tsc --noEmit                   ├── tsc --noEmit      (no new type errors)
    └── vitest run                     ├── vitest run        (no regressions)
                                       └── new tests pass    (exit condition verified)

    BASELINE                           VERIFICATION
    "what passes now"                  "what still passes + what's new"
```

### W0 — Baseline (before every cycle)

Run `bun run verify` and record the result. This is the PRE check.

```bash
# The three deterministic checks
bun biome check .                    # lint + format
bun tsc --noEmit                     # type safety
bun vitest run                       # all tests pass

# Combined (fails fast)
bun run verify
```

If baseline fails, **fix it first**. Don't start a cycle on a broken foundation.
Record: which tests pass, how many, any known failures.

### W4+ — Verification (after every cycle)

W4 already does rubric scoring. Testing is the deterministic half:

1. **`biome check .`** — no new lint errors in touched files
2. **`tsc --noEmit`** — no new type errors
3. **`vitest run`** — no regressions (all baseline tests still pass)
4. **New tests** — if the cycle added functionality, tests exist for it
5. **Exit condition** — the task's `exit:` field is verifiable

```
W4 verify = rubric scoring (quality, probabilistic)
          + test suite    (correctness, deterministic)
          + biome         (style, deterministic)
          + typecheck     (safety, deterministic)
```

**If tests fail after W3 edits:** re-enter W3 with the test failure as context.
The failure IS the signal. Route it back to the editor. Max 3 loops.

### Cycle Gate = Tests Green

A cycle is complete when:
- [ ] All baseline tests still pass (no regressions)
- [ ] New tests cover new functionality
- [ ] `biome check .` clean on touched files
- [ ] `tsc --noEmit` passes
- [ ] W4 rubric score >= 0.65 on all dimensions

---

```
   CYCLE 1: WIRE           CYCLE 2: PROVE          CYCLE 3: GROW
   {scope description}     {scope description}      {scope description}
   ─────────────────       ──────────────────       ─────────────────
   {N} files, ~{N} edits   {N} files, ~{N} edits    {N} files, ~{N} edits
        │                        │                        │
        ▼                        ▼                        ▼
   ┌─W1─W2─W3─W4─┐        ┌─W1─W2─W3─W4─┐        ┌─W1─W2─W3─W4─┐
   │ H   O  S  S  │  ──►   │ H   O  S  S  │  ──►   │ H   O  S  S  │
   └──────────────┘        └──────────────┘        └──────────────┘

   H = Haiku (recon)    O = Opus (decide)    S = Sonnet (edit + verify)
```

```mermaid
graph LR
    subgraph "Cycle 1: WIRE"
        W1_1["W1 Haiku recon"]
        W1_2["W2 Opus decide"]
        W1_3["W3 Sonnet edit"]
        W1_4["W4 Sonnet verify"]
        W1_1 -->|mark| W1_2 -->|mark| W1_3 -->|mark| W1_4
    end
    subgraph "Cycle 2: PROVE"
        W2_1["W1 Haiku recon"]
        W2_2["W2 Opus decide"]
        W2_3["W3 Sonnet edit"]
        W2_4["W4 Sonnet verify"]
        W2_1 -->|mark| W2_2 -->|mark| W2_3 -->|mark| W2_4
    end
    subgraph "Cycle 3: GROW"
        W3_1["W1 Haiku recon"]
        W3_2["W2 Opus decide"]
        W3_3["W3 Sonnet edit"]
        W3_4["W4 Sonnet verify"]
        W3_1 -->|mark| W3_2 -->|mark| W3_3 -->|mark| W3_4
    end
    W1_4 -->|gate| W2_1
    W2_4 -->|gate| W3_1
```

---

## How Loops Drive This Roadmap

Each cycle activates deeper substrate loops:

| Cycle | What changes | Loops activated |
|-------|-------------|-----------------|
| **WIRE** | {foundation laid, signals flow} | L1 (signal), L2 (path marking), L3 (fade) |
| **PROVE** | {data accumulates, paths differentiate} | L4 (economic) joins L1-L3 |
| **GROW** | {full coverage, system self-improves} | L5-L7 (evolution, learning, frontier) join L1-L4 |

The cycle gate is the substrate's `know()` — don't advance until the
cycle's patterns are verified and promoted to durable learning.

---

## The Wave Pattern (every cycle runs this)

```
     ┌──────────────────────────────────────────────────────────┐
     │                                                          │
     │  WAVE 1 (Haiku x N, parallel)                            │
     │    select: N read jobs                                   │
     │    ask:    spawn all in one message                      │
     │    outcome: { result | timeout | dissolved }             │
     │    mark:   each return                                   │
     │    drain:  collect into Wave 2 inputs                    │
     │                                                          │
     │  WAVE 2 (Opus, in main context)                          │
     │    fold:   N reports + source-of-truth → diff specs      │
     │    decide: judgment calls, exceptions                    │
     │    send:   M edit prompts                                │
     │                                                          │
     │  WAVE 3 (Sonnet x M, parallel)                           │
     │    select: M edit jobs                                   │
     │    ask:    spawn all in one message                      │
     │    outcome: { result | dissolved | failure }             │
     │    mark:   successful edits                              │
     │    warn:   anchor mismatches → re-spawn once             │
     │    drain:  all edits applied                             │
     │                                                          │
     │  WAVE 4 (Sonnet x 1, sequential)                         │
     │    sense:  read all updated files                        │
     │    check:  cross-file consistency                        │
     │    if clean → mark, advance to next cycle                │
     │    if dirty → spawn micro-edits → re-check (max 3)      │
     │                                                          │
     └──────────────────────────────────────────────────────────┘
```

| Wave | Model | Pattern | Why this model |
|------|-------|---------|----------------|
| 1 | **Haiku** | Parallel reads, report verbatim | Pure I/O, no judgment, cost ~ free |
| 2 | **Opus** (main) | Sequential synthesis + decisions | Never delegate understanding |
| 3 | **Sonnet** | Parallel writes from specs | Prose fit matters, decisions already made |
| 4 | **Sonnet** | Single cross-check pass | Holds multiple files, no decisions left |

**The rule:** Haiku reads, Opus decides, Sonnet writes, Sonnet checks.
Parallelism within waves. Sequential between waves.

---

## Source of Truth

**[{source-doc}]({source-doc}.md)** — {what it locks down}
**[DSL.md](DSL.md)** — signal grammar, `{ receiver, data }`, mark/warn/fade
**[dictionary.md](dictionary.md)** — canonical names, unit/signal/path definitions
**[rubrics.md](rubrics.md)** — quality scoring: fit/form/truth/taste as tagged edges

| Item | Canonical | Exceptions |
|------|-----------|------------|
| {name} | {replacement} | {when to keep old name} |
| ... | ... | ... |

---

## Cycle 1: WIRE — {scope}

**Files:** [{file1}]({file1}), [{file2}]({file2}), ...

**Why first:** {These are the source. Fix here, downstream becomes mechanical.}

---

### Wave 1 — Recon (parallel Haiku x N)

Spawn N agents in one message. Each reads one file, reports findings
with line numbers and context.

**Hard rule:** "Report verbatim. Do not propose changes. Under 300 words."

| Agent | File | What to look for |
|-------|------|-----------------|
| R1 | `{file}` | {specific items} |
| R2 | `{file}` | {specific items} |

**Outcome model:** `result` = report in. `timeout` = re-spawn once.
`dissolved` = file missing, drop. Advance when N-1/N reports are in.

---

### Wave 2 — Decide (Opus, in main context)

**Context loaded:** DSL.md + dictionary.md (always) + source-of-truth doc +
domain docs from task tags. Hypotheses from `recall()`. This is the
non-negotiable baseline — every W2 decision speaks the DSL vocabulary.

Take N reports + source-of-truth doc + DSL + dictionary. For each finding, decide:
- **Act** → produce anchor (exact old text) + new text
- **Keep** → it's an exception
- **Judgment** → explain reasoning

**Output format (one per edit):**
```
TARGET:    {filepath}
ANCHOR:    "<exact unique substring>"
ACTION:    replace | insert-after | insert-before | tombstone
NEW:       "<new text>"
RATIONALE: "<one sentence>"
```

**Key decisions for Cycle 1:**
1. {judgment call}
2. {judgment call}

---

### Wave 3 — Edits (parallel Sonnet x M)

One agent per file. Each gets: file path, list of anchors + replacements.
Rule: "Use `Edit` with exact anchor. Do not modify anything else.
If anchor doesn't match, return dissolved."

| Job | File | Est. edits |
|-----|------|-----------|
| E1 | `{file}` | ~{N} |
| E2 | `{file}` | ~{N} |

---

### Wave 4 — Verify (Sonnet x 1)

Read all files in this cycle. Check:
1. {consistency check}
2. {consistency check}
3. Cross-references between files still work
4. Voice is consistent

**Rubric scoring:** Each edit is scored against `[rubrics.md](rubrics.md)` —
fit (0.35), form (0.20), truth (0.30), taste (0.15). Four tagged-edge marks:
`mark(edge:fit, s)`, `mark(edge:form, s)`, `mark(edge:truth, s)`, `mark(edge:taste, s)`.
Below 0.5 → `warn()`. Must-nots bypass scoring entirely.
Weak dims (`< 0.65`) fan out as signals to specialist coaches.

**If inconsistencies:** spawn micro-edits (Wave 3.5), re-verify. Max 3 loops.

**Self-checkoff:** If all edits verify clean and exit conditions pass:
1. Mark task done in TypeDB (`markTaskDone(task.id)`)
2. Update this file's checkbox (`- [ ]` → `- [x]`)
3. Strengthen the path (`mark('loop→builder:taskId', 5)`)
4. Unblock dependents (query `blocks` relation → enqueue signals)
5. If all tasks in phase complete → `know()` (promote to learning)

### Cycle 1 Gate

```bash
# Verification commands
{grep/curl commands that prove the cycle is complete}
```

```
  [ ] {verifiable condition}
  [ ] {verifiable condition}
```

---

## Cycle 2: PROVE — {scope}

{Same wave structure. Copy the four waves, fill in different files.}

**Depends on:** Cycle 1 complete. {Why this ordering matters.}

---

## Cycle 3: GROW — {scope}

{Same wave structure. Copy the four waves, fill in different files.}

**Depends on:** Cycle 2 complete. {Why this ordering matters.}

---

## Cost Discipline

| Cycle | Wave | Agents | Model | Est. cost share |
|-------|------|--------|-------|-----------------|
| 1 | W1 | {N} | Haiku | ~{N}% |
| 1 | W2 | 0 | Opus | ~0% |
| 1 | W3 | {M} | Sonnet | ~{N}% |
| 1 | W4 | 1 | Sonnet | ~{N}% |
| 2 | W1-W4 | ... | ... | ... |
| 3 | W1-W4 | ... | ... | ... |

**Hard stop:** if any Wave 4 loops more than 3 times, halt and escalate.

---

## Status

- [ ] **Cycle 1: WIRE** — {scope}
  - [ ] W1 — Recon (Haiku x {N})
  - [ ] W2 — Decide (Opus)
  - [ ] W3 — Edits (Sonnet x {M})
  - [ ] W4 — Verify (Sonnet x 1)
- [ ] **Cycle 2: PROVE** — {scope}
  - [ ] W1 — Recon (Haiku x {N})
  - [ ] W2 — Decide (Opus)
  - [ ] W3 — Edits (Sonnet x {M})
  - [ ] W4 — Verify (Sonnet x 1)
- [ ] **Cycle 3: GROW** — {scope}
  - [ ] W1 — Recon (Haiku x {N})
  - [ ] W2 — Decide (Opus)
  - [ ] W3 — Edits (Sonnet x {M})
  - [ ] W4 — Verify (Sonnet x 1)

---

## Execution

```bash
# Run the next wave of the current cycle
/wave TODO-{name}.md

# Or manually — autonomous sequential loop
/work

# Check state
/highways                   # proven paths
/tasks                      # open tasks by priority
```

### How `/wave` Orchestrates

```
/wave TODO-rename.md
  │
  ├── reads TODO, finds current cycle + wave
  │
  ├── Wave 1? → spawn N Haiku agents (parallel, model: haiku)
  │              collect reports, mark wave complete
  │
  ├── Wave 2? → synthesize in main context (Opus decides)
  │              produce diff specs, mark wave complete
  │
  ├── Wave 3? → spawn M Sonnet agents (parallel, model: sonnet)
  │              collect results, mark/warn, mark wave complete
  │
  └── Wave 4? → spawn 1 Sonnet verifier
                 if clean → mark cycle complete, advance
                 if dirty → micro-edits → re-verify (max 3)
```

---

## Reuse

This template works for any doc-tree sweep:
- Vocabulary migrations (rename dead names)
- Link audits (fix broken cross-references)
- Schema syncs (align docs with code changes)
- API updates (propagate new endpoints)

To convert to substrate tasks: each Wave 3 job becomes a `skill`
with the edit prompt as body. `/work` picks highest-pheromone skill.

---

## See Also

- [{source-doc}]({source-doc}.md) — source of truth
- [DSL.md](DSL.md) — signal grammar (always loaded in W2)
- [dictionary.md](dictionary.md) — canonical names (always loaded in W2)
- [rubrics.md](rubrics.md) — quality scoring: fit/form/truth/taste as tagged edges
- [TODO-task-management.md](TODO-task-management.md) — self-learning task system
- [TODO-typedb.md](TODO-typedb.md) — context flows along the graph
- [TODO-signal.md](TODO-signal.md) — first wave-pattern TODO (reference)
- [TODO-rename.md](TODO-rename.md) — first use of this template

---

*{N} cycles. Four waves each. Haiku reads, Opus decides, Sonnet writes,
Sonnet checks. Same loop as the substrate, different receivers.*
