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

> **Goal:** {One sentence. What changes when this is done.}
>
> **Source of truth:** [{source-doc}]({source-doc}.md) — {what it defines}
>
> **Shape:** {N} cycles, four waves each. Haiku reads, Opus decides, Sonnet
> writes, Sonnet checks. Same loop as the substrate, different receivers.

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

Take N reports + source-of-truth doc. For each finding, decide:
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
fit (0.35), form (0.20), truth (0.30), taste (0.15). Score feeds `mark(edge, score)`.
Below 0.5 → `warn()`. Must-nots bypass scoring entirely.

**If inconsistencies:** spawn micro-edits (Wave 3.5), re-verify. Max 3 loops.

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
- [rubrics.md](rubrics.md) — POST-check scoring: fit/form/truth/taste → mark(edge, score)
- [TODO-signal.md](TODO-signal.md) — first wave-pattern TODO (reference)
- [TODO-rename.md](TODO-rename.md) — first use of this template
- [names.md](names.md) — canonical naming spec

---

*{N} cycles. Four waves each. Haiku reads, Opus decides, Sonnet writes,
Sonnet checks. Same loop as the substrate, different receivers.*
