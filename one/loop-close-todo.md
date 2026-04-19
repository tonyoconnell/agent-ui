---
title: TODO — Loop Close Protocol
type: roadmap
version: 1.0.0
priority: Wire → Prove
total_tasks: 20
completed: 0
status: READY
---

# TODO: Loop Close Protocol

> **Goal:** every `/do` wave and cycle ends with a 3-step close:
> **Verify → Signal → Propagate.** One signal (`do:close`), one log
> (`docs/learnings.md`), one hard gate (cycle close blocks next cycle).
>
> **Source of truth:**
> - [loop-close.md](loop-close.md) — the protocol (built in C1) **← we write this**
> - [DSL.md](one/DSL.md) — signal grammar
> - [dictionary.md](dictionary.md) — canonical names
> - [rubrics.md](rubrics.md) — fit/form/truth/taste → mark
> - [TODO-template.md](one/TODO-template.md) — wave pattern (inherits Close in C1)
>
> **Shape:** 2 cycles.
>   - **C1 WIRE** — write the protocol + thread it through 5 surfaces
>   - **C2 PROVE** — fire it on a real TODO, verify signal + log + checkbox

---

## The Elegant Protocol (canonical form lives in docs/loop-close.md after C1)

```
        ┌── Verify ───┐    audit TODO vs disk. walk the feature.
        │             │    [x] every deliverable that passes exit.
        │             │
/do ──► │   Signal    │    emit do:close  tags=[cycle:N, wave:N|gate, todo:<slug>]
        │             │    content: { timings_ms, rubric, counts,
        │             │                learning, speedup }
        │             │
        └── Propagate ┘    append 1 line to docs/learnings.md
                           sync source-of-truth doc (always)
                           CLAUDE.md (if dimensional) · README.md (if public surface)
                           feature doc (always if one exists)
```

**Gate policy:**

| Close | Gate | If skipped |
|-------|------|-----------|
| Wave  | soft | warn, thin pheromone, next wave proceeds |
| Cycle | **hard** | next cycle refuses to start; `/do --auto` halts |

**One receiver, not four.** Tags separate what receivers would:
`select('do:close', tags=['speedup'])` returns speedup history.
`select('do:close', tags=['learn'])` returns learning history.
Same routing expressiveness, one surface.

---

## Dimensional Mapping

| Artifact | Dimension | Where |
|---|---|---|
| `do:close` | Event (scope: private, L6-promotable) | `src/pages/api/signal.ts` |
| Close protocol | Thing (skill) | `docs/loop-close.md` |
| Rolling learnings log | Learning (source: observed) | `docs/learnings.md` |
| `/close --todo --cycle` | Actor verb extension | `.claude/commands/close.md` |

---

## Routing

```
    signal DOWN                          result UP
    ──────────                           ─────────
    /do TODO-loop-close.md               mark(fit/form/truth/taste)
         │                                    │
         ▼                                    │
    ┌─ C1 WIRE ────────────────────────┐      │
    │ loop-close.md + 5 wire-ins +     │──────┤ L1 signal · L2 trail
    │ learnings.md seed                │      │ L6 promotes learning
    └──────────┬───────────────────────┘      │
               ▼                              │
    ┌─ C2 PROVE ───────────────────────┐      │
    │ fire on TODO-publish-toolkit C1, │──────┘  (signal: do:close fires,
    │ verify signal + log + checkbox   │         learnings grows, hard gate holds)
    └──────────────────────────────────┘
```

---

## Cycle 1: WIRE — write the protocol + 5 wire-ins

**Scope:** create `docs/loop-close.md` (under 150 lines) and thread it into
TODO-template, `/do`, `/close`, the documentation rule, and `CLAUDE.md` root.
Seed `docs/learnings.md` so the log is ready for appends.

**Files touched:** 7.

### C1 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit |
|---|-------------|------|-------------------------------|------|
| 1 | `docs/loop-close.md` | Canonical protocol, 3 steps, 1 signal, 1 log, ≤ 150 lines | 0.40/0.20/0.30/0.10 | file exists; grep `do:close` ≥ 3; steps + gate + matrix tables present |
| 2 | `docs/learnings.md` | Rolling log seeded with header + schema + 1 example | 0.25/0.30/0.30/0.15 | file exists; schema line + 1 entry; per-TODO `##` sections |
| 3 | `docs/TODO-template.md` | "Loop Close" subsection after W4 self-checkoff + before Cycle Gate | 0.35/0.20/0.30/0.15 | grep `## Loop Close` ≥ 2; links loop-close.md |
| 4 | `.claude/commands/do.md` | `CLOSE:` block after each wave Log line + expanded at cycle gate | 0.35/0.20/0.30/0.15 | grep `CLOSE:` ≥ 5 (W1-W4 + cycle) |
| 5 | `.claude/commands/close.md` | `--todo <slug> --cycle N [--wave N]` flags; runs protocol | 0.35/0.20/0.30/0.15 | flags documented; emits `do:close` on success |
| 6 | `.claude/rules/documentation.md` | Append "Loop Close" section | 0.30/0.25/0.30/0.15 | section exists; links loop-close.md |
| 7 | `CLAUDE.md` root | Row added to Canonical Docs table | 0.30/0.25/0.30/0.15 | `loop-close.md` appears in root CLAUDE.md |

### Wave 1 — Recon (Haiku × 4, parallel)

| Agent | Target | Extract |
|---|---|---|
| R1 | `docs/TODO-template.md` | Exact anchors — after W4 self-checkoff block, before `### Cycle 1 Gate` |
| R2 | `.claude/commands/do.md` | Log line format per wave; where to insert CLOSE step; cycle-gate insertion point |
| R3 | `.claude/commands/close.md` | Current flags; task-id resolution path; where to add `--todo`/`--cycle`/`--wave` |
| R4 | `.claude/rules/documentation.md` + `CLAUDE.md` root Canonical Docs | Current table row format + doc-rule section layout |

### Wave 2 — Decide (Opus × 1)

**Locks:**

1. **Signal shape.** Receiver `do:close`. Tags `[cycle:<N>, wave:<N>|gate, todo:<slug>]` plus any of `[learn, speedup]`. Content:
   ```typescript
   {
     timings_ms: { w1, w2, w3, w4, close },
     rubric: { fit, form, truth, taste },    // each 0–1
     counts: { pass, fail, dissolved, timeout },
     deliverables: Array<{ name, exit, pass: boolean }>,
     learning?: string,                       // one sentence, present if non-obvious
     speedup?: { slowest: 'w1'|'w2'|'w3'|'w4', proposal: string, shave_ms: number }
   }
   ```
   Scope `private` until L6 `know()` promotes repeat patterns.

2. **Gate policy.** Wave close soft — missing close emits `do:close` with `counts.fail++` but next wave proceeds. Cycle close hard — missing close ⇒ `do:close-missing` dissolved at `/do --auto`; next cycle refuses to start.

3. **Walkthrough depth.** Cycle close requires one concrete feature invocation (CLI verb runs / API curls 200 / page loads). Wave close does not.

4. **Learnings format.** `docs/learnings.md` keyed by `## <TODO-slug>`; append-only entries:
   ```
   - YYYY-MM-DD · cycle N · wave N|gate · {one sentence} · rubric=0.NN · source=w1|w2|w3|w4|cycle
   ```

5. **Propagate matrix.**

   | Target | Update when |
   |--------|-------------|
   | Source-of-truth doc | always |
   | `CLAUDE.md` root | 6 dimensions, L1-L8, or locked rules changed |
   | Nested `CLAUDE.md` | directory contract changed |
   | `README.md` | public surface (CLI verbs, API routes, SDK exports) changed |
   | Feature doc | always if one exists |

### Wave 3 — Edits (Sonnet × 7, parallel — one per file)

| Task id | File | Cat | Tags | Blocks |
|---|---|---|---|---|
| T-LC-01 | `docs/loop-close.md` — new. 3 steps, signal table, gate policy, propagate matrix, ≤ 150 lines | new | loop, close, doc | T-LC-03..07 |
| T-LC-02 | `docs/learnings.md` — new. Header + schema line + 1 seeded example for this TODO | new | learning, log | — |
| T-LC-03 | `docs/TODO-template.md` — inject "Loop Close" subsection after W4 self-checkoff; link `loop-close.md` | edit | template, close | — |
| T-LC-04 | `.claude/commands/do.md` — add `CLOSE:` block after each wave Log line + cycle-gate expanded block | edit | command, close | — |
| T-LC-05 | `.claude/commands/close.md` — add `--todo <slug>`, `--cycle N`, `--wave N` flags; runs protocol | edit | command, close | — |
| T-LC-06 | `.claude/rules/documentation.md` — append "Loop Close" section | edit | rule, close | — |
| T-LC-07 | `CLAUDE.md` root — add `docs/loop-close.md` row to Canonical Docs table | edit | root, index | — |

### Wave 4 — Verify (Sonnet × 2, parallel)

| Shard | Owns |
|---|---|
| V1 | `docs/loop-close.md` ≤ 150 lines; 3 numbered steps; signal/gate/matrix tables present; `do:close` receiver named ≥ 3 times |
| V2 | Cross-refs: all 5 wire-ins link `loop-close.md`; `do:close` receiver appears in ≥ 3 of the 5; grep `Loop Close` across 5 files ≥ 5 |

### C1 Gate (**hard**)

```bash
ls docs/loop-close.md docs/learnings.md                      # both exist
wc -l docs/loop-close.md | awk '$1<=150'                     # ≤ 150
grep -c "do:close" docs/loop-close.md                        # ≥ 3
grep -c "## Loop Close" docs/TODO-template.md                # ≥ 2
grep -c "^CLOSE:" .claude/commands/do.md                     # ≥ 5
grep -q "loop-close.md" CLAUDE.md                            # row present
bun run verify                                               # tests still green
```

```
[ ] docs/loop-close.md ≤ 150 lines · 3 steps · signal + gate + matrix tables
[ ] docs/learnings.md has header + schema + 1 seeded entry
[ ] docs/TODO-template.md has Close subsection after W4 and before Cycle Gate
[ ] .claude/commands/do.md has CLOSE: in all 4 wave blocks + cycle gate
[ ] .claude/commands/close.md documents --todo/--cycle/--wave
[ ] .claude/rules/documentation.md has "Loop Close" section
[ ] CLAUDE.md root Canonical Docs lists loop-close.md
[ ] 737+ tests still pass
```

---

## Cycle 2: PROVE — fire the protocol on a real TODO

**Scope:** run `/do TODO-publish-toolkit.md` C1 W1 with the new protocol in
place. Confirm `do:close` hits `/api/signal`, `docs/learnings.md` grows by
one entry, TODO checkboxes auto-sync, and the hard gate holds on a synthetic
skip.

**Depends on:** C1 gate green.

### C2 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit |
|---|-------------|------|-------------------------------|------|
| 1 | `do:close` signal on real wave close | End-to-end proof | 0.40/0.15/0.35/0.10 | `/api/events?receiver=do:close&since=10m` returns ≥ 1 with tag `todo:publish-toolkit` |
| 2 | Learnings log grows | Append works | 0.30/0.25/0.30/0.15 | `git diff docs/learnings.md` shows +1 line matching schema |
| 3 | Checkbox auto-sync | `[x]` lands on passing deliverable | 0.40/0.20/0.30/0.10 | grep `[x] W1 — Recon` in publish-toolkit TODO |
| 4 | Hard gate proven | Cycle close skipped → next cycle blocked | 0.30/0.20/0.40/0.10 | synthetic skip yields `do:close-missing`; `/do --auto` halts |

### Wave 1 — Recon (Haiku × 2, parallel)

| Agent | Target | Focus |
|---|---|---|
| R1 | `docs/TODO-publish-toolkit.md` C1 state | What `[x]` should land; current disk truth |
| R2 | `/api/signal` + `/api/events` | Does `do:close` need ADL entry? Event query shape. |

### Wave 2 — Decide (Opus × 1)

1. Invoke `/do TODO-publish-toolkit.md` once — C1 W1 fires; close runs at wave end.
2. Synthetic skip: manually mark C1 cycle gate `[x]` without running close; `/do --auto` should halt with `do:close-missing`.
3. If either fails, patch `.claude/commands/close.md` or `loop-close.md`; do not edit the protocol doc without recording the learning.

### Wave 3 — Edits (Sonnet × 2)

| Task id | File | Cat | Tags | Blocks |
|---|---|---|---|---|
| T-LC-08 | Run `/do TODO-publish-toolkit.md` C1 W1; confirm close fires; patch close.md if missing | verify | prove | T-LC-09 |
| T-LC-09 | If protocol missed a step, append deterministic fallback entry to `docs/learnings.md` | fix | learn | — |

### Wave 4 — Verify (Sonnet × 1)

| Shard | Owns |
|---|---|
| V1 | All 4 C2 exits pass; signal visible; learnings grew; checkbox landed; hard gate held |

### C2 Gate (**hard**)

```bash
curl -s 'http://localhost:4321/api/events?receiver=do:close&since=10m' | jq '.count'   # ≥ 1
git diff --stat docs/learnings.md                                                       # +1 line
grep "\[x\] W1 — Recon" docs/TODO-publish-toolkit.md                                    # matches
# hard-gate synthetic: manually wipe close signal, expect /do --auto halt
```

---

## Cost Discipline

| Cycle | Wave | Agents | Model | Rough share |
|---|---|---|---|---|
| 1 | W1 | 4 | Haiku  | 3% |
| 1 | W2 | 1 | Opus   | 15% |
| 1 | W3 | 7 | Sonnet | 45% |
| 1 | W4 | 2 | Sonnet | 7% |
| 2 | W1 | 2 | Haiku  | 2% |
| 2 | W2 | 1 | Opus   | 8%  |
| 2 | W3 | 2 | Sonnet | 15% |
| 2 | W4 | 1 | Sonnet | 5% |

**Hard stop:** any W4 that loops > 2 times → halt, escalate.

---

## Status

- [x] **Cycle 1: WIRE** — protocol + 5 wire-ins + learnings seed
  - [x] W1 — Recon (Haiku × 4, parallel)
  - [x] W2 — Decide (Opus × 1)
  - [x] W3 — Edits (Sonnet × 7, parallel)
  - [x] W4 — Verify (Sonnet × 2, parallel)
- [x] **Cycle 2: PROVE** — fire on real TODO, verify signal + log + gate
  - [x] W1 — Recon (Haiku × 2, parallel)
  - [x] W2 — Decide (Opus × 1)
  - [x] W3 — Edits (Sonnet × 2)
  - [x] W4 — Verify (Sonnet × 1)

---

## Execution

```bash
/do TODO-loop-close.md            # advance next wave
/do TODO-loop-close.md --auto     # run both cycles continuously
/close --todo loop-close --cycle 1   # manual trigger (after C1 lands)
/see events --receiver do:close --since 1h   # inspect close signals
```

---

## See Also

- [loop-close.md](loop-close.md) — the protocol (created in C1)
- [learnings.md](learnings.md) — rolling log (created in C1)
- [TODO-template.md](one/TODO-template.md) — inherits Close subsection in C1
- [DSL.md](one/DSL.md) — signal grammar
- [dictionary.md](dictionary.md) — canonical names
- [rubrics.md](rubrics.md) — fit/form/truth/taste

---

*2 cycles. 20 tasks. **One signal. One log. One hard gate.***
*Every loop closes itself before the next begins.*
