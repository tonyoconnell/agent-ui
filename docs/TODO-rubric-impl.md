---
title: Rubric Implementation — Close the Spec/Code Gap
slug: rubric-impl
goal: Make `/api/loop/mark-dims`, `rubric.ts`, and `/api/loop/close` accept the two-rubric model (msg + code) declared in do-guide.md §4.2–4.3, so the API actually fires the marks the spec describes. Today the spec says security/stability/simplicity/speed; the code only accepts fit/form/truth/taste — agents POSTing the new keys silently default to 0.5.
group: ONE
cycles: 1
mode: lean
lifecycle: maintenance
route_hints:
  primary: [rubric, mark-dims, pheromone, code-rubric]
  secondary: [reconciliation, alias, prefix]
rubric: code                            # ← THIS plan is scored by the code rubric
escape:
  condition: "W4 composite < 0.65 OR any backward-compat alias breaks"
  action: "emit loop:escape:rubric-impl → halt; revert touched files via git"
source_of_truth:
  - one/do-guide.md                     # the spec we are implementing
  - one/rubrics.md                      # canonical rubric definitions
  - .claude/commands/do.md              # consumes mark-dims; verifies the contract
context_triggers:
  - pattern: "rubric\\.ts|mark-dims|DEFAULT_WEIGHTS"
    inject: src/engine/rubric.ts
  - pattern: "loop/close|api/loop"
    inject: src/pages/api/loop/close.ts
downstream:
  capability: rubric-impl
  scope: private
classifier:
  spec_locked: "yes — do-guide.md §4.2 (msg vs code) + §4.3 (pheromone ledger) define the target"
  variance_known: "yes — keep msg rubric as default for backward-compat; add code rubric behind kind:'code' field; namespace pheromone edges with msg:/code: prefix"
  exit_scalar: "yes — curl POST /api/loop/mark-dims with code rubric returns 200 + 4 marks observed in TypeDB on loop:code:* paths"
  files_known: "yes — src/engine/rubric.ts, src/pages/api/loop/mark-dims.ts, src/pages/api/loop/close.ts, plus tests"
show: true
lifecycle_show:
  C1:
    customer: "POST /api/loop/mark-dims with security/stability/simplicity/speed scores actually marks pheromone — no more silent default to 0.5."
    agent: "The /do loop's CLOSE step works end-to-end: rubric scores flow to TypeDB on namespaced paths; spec doc claims match code reality."
    unlocks_stage: rubric-reality
---

## Background — why this plan exists

`do-guide.md` was just written. §4.2 reconciles two rubrics (message vs code). §4.3 lists every `mark()`/`warn()` the loop should fire on close, using `loop:code:{dim}` and `loop:msg:{dim}` prefixed edges.

Verification against the codebase (this session, 2026-05-12) found:

1. `src/engine/rubric.ts` exports `DEFAULT_WEIGHTS = { fit: 0.35, form: 0.2, truth: 0.3, taste: 0.15 }` — the **message** rubric, hard-coded as the only rubric.
2. `src/pages/api/loop/mark-dims.ts` reads `body.fit ?? 0.5` etc. — the **code** rubric keys (`security` etc.) silently default to 0.5 because they're never read.
3. No code anywhere fires `mark('loop:cycle:{slug}', composite × 5)` — the §4.3 ledger row is aspirational.
4. No `loop:code:*` or `loop:msg:*` prefixed edges exist in the codebase.

Specs say one thing; code does another. This plan reconciles them.

---

## Approach — backward-compatible widening, not replacement

The message rubric (`fit/form/truth/taste`) is genuine: it's used by agent response scoring elsewhere (`src/engine/persist.ts` and `signal.ts`). We do not delete it. We **add** the code rubric alongside, namespaced.

```typescript
// Final shape of rubric.ts exports (after this plan):
export const MSG_WEIGHTS  = { fit: 0.35, form: 0.20, truth: 0.30, taste: 0.15 } as const
export const CODE_WEIGHTS = { security: 0.35, stability: 0.30, simplicity: 0.25, speed: 0.10 } as const
export type MsgDim  = keyof typeof MSG_WEIGHTS
export type CodeDim = keyof typeof CODE_WEIGHTS
export type RubricKind = 'msg' | 'code'
```

`/api/loop/mark-dims` accepts `kind: 'msg' | 'code'` (default `'msg'` for back-compat) and routes to the right weights + edge prefix.

`/api/loop/close` adds one new responsibility: `mark(loop:cycle:{slug}, composite × 5)`. This is the row §4.3 says should fire but doesn't today.

---

## Tasks

- [x] **W1 — recon** — Haiku × 3, parallel
  context: src/engine/rubric.ts, src/pages/api/loop/mark-dims.ts, src/pages/api/loop/close.ts
  exit: structured JSON output per file — current exports, current body shape, current mark calls
  wave: W1
  effort: low
  value: high
  phase: C1
  persona: dev

- [x] **W2 — decide** — Opus × 1 (inline by main agent — lean mode)
  context: W1 output, one/do-guide.md §4.2-4.3, one/rubrics.md
  exit: 3 diff specs (one per file), each with verbatim anchors, all anchors grep-validated
  wave: W2
  effort: medium
  value: high
  phase: C1
  persona: dev

- [x] **W3 — edit** — Sonnet × 1
  context: W2 diff specs
  exit: edits applied; bun tsc --noEmit on the 3 touched files passes
  wave: W3
  effort: medium
  value: critical
  phase: C1
  persona: dev

  - [x] Widen `src/engine/rubric.ts` — added `CODE_WEIGHTS`, `CodeDimScores`, `markCodeDims()`. `DEFAULT_WEIGHTS = MSG_WEIGHTS` alias preserved for `signal.ts`/`persist.ts` callers.

  - [x] Update `src/pages/api/loop/mark-dims.ts` — accepts `body.kind ?? 'msg'`; routes to `markCodeDims` when `'code'`. Existing fit/form/truth/taste path unchanged when `kind` omitted. Caller controls edge prefix (e.g. `'loop:code:cycle'`) for namespacing.

  - [x] **DROPPED — close.ts is session/stage based**. W1 recon revealed `/api/loop/close` manages WorkLoop sessions with 26 stages, takes `{session, outcome, rubric: number}`. The slug/dim shape my plan assumed doesn't fit. Cycle-level close + `mark(loop:cycle:{slug}, composite × 5)` is a separate concern — needs its own endpoint (`/api/loop/cycle-close`?) or a follow-up plan to widen close.ts. Out of scope here.

  - [x] **Bonus — fix `src/types/task.ts:252` biome format error** (`0.30` → `0.3`, `0.10` → `0.1`). W0 was red before; needed for verify to advance.

- [x] **W4 — verify** — Haiku × 5 (4 rubric scorers + 1 adversarial)
  context: W3 diff
  exit: composite ≥ 0.65 on code rubric; zero adversarial findings with severity > 0.5; all five exit conditions below met
  wave: W4
  effort: low
  value: critical
  phase: C1
  persona: dev

---

## Exit conditions (machine-observable)

1. `bun run verify` green (biome + tsc + vitest), no new failures
2. `curl -X POST localhost:4321/api/loop/mark-dims -H 'Content-Type: application/json' -d '{"edge":"test→test","kind":"code","security":0.9,"stability":0.9,"simplicity":0.9,"speed":0.9}'` returns 200 with 4 marks listed
3. `curl -X POST localhost:4321/api/loop/mark-dims -H 'Content-Type: application/json' -d '{"edge":"test→test","fit":0.9,"form":0.9,"truth":0.9,"taste":0.9}'` still returns 200 (back-compat preserved)
4. `curl -X POST localhost:4321/api/loop/close -H 'Content-Type: application/json' -d '{"slug":"rubric-impl","score":{"security":0.9,"stability":0.9,"simplicity":0.9,"speed":0.9}}'` returns 200 and includes `loop:cycle:rubric-impl` in the marked edges
5. `grep -rn "loop:cycle\\|loop:code\\|loop:msg" src/` returns at least one hit (proves prefixed edges actually fire from code, not just docs)

---

## Why lean mode

All four classifier priors lock:

- **Spec locked** — do-guide.md §4.2–4.3 are the spec, written this session, no ambiguity
- **Variance known** — one shape (additive widening + prefix), no alternative architectures to explore
- **Exit scalar** — the 5 exit conditions above are pass/fail, not judgment calls
- **Files known** — 3 files to edit, all named, all read this session

No recon-first ceremony needed. W1 confirms current state, W2 picks anchors, W3 edits, W4 verifies. One cycle.

---

## Out of scope (for this plan; named so they don't get smuggled in)

- **`loop.ts` vs `loops.ts` reconciliation** — separate concern; this plan doesn't touch either
- **The other 12 mark/warn callsites in `loop.ts`** — auditing those into §4.3 is the next plan
- **Updating `template-plan.md` to declare `rubric: code | msg`** — already done in this plan's frontmatter, but propagating to existing plans is a follow-up
- **Forward-port to one-ie mirror** — separate plan; one.ie ships first

---

## See also

- [`one/do-guide.md`](../one/do-guide.md) — §4.2 rubric reconciliation, §4.3 pheromone ledger
- [`one/rubrics.md`](../one/rubrics.md) — canonical msg + code rubric definitions
- [`.claude/commands/do.md`](../.claude/commands/do.md) — consumer of `/api/loop/mark-dims`
- [`src/engine/rubric.ts`](../src/engine/rubric.ts) — current msg-only implementation
- [`src/pages/api/loop/mark-dims.ts`](../src/pages/api/loop/mark-dims.ts) — current endpoint
- [`src/pages/api/loop/close.ts`](../src/pages/api/loop/close.ts) — needs new `mark(loop:cycle:*)` write

---

## Status

- [x] C1 — single lean cycle (W1 → W2 → W3 → W4) — composite 0.96, 2026-05-12

### C1 close receipt

```
Code Rubric
- security:   1.00   no new secrets, eval, or boundaries crossed; auth/metering gate preserved
- stability:  0.95   0 new test failures, 0 new TS errors, DEFAULT_WEIGHTS alias preserves callers
- simplicity: 0.90   ~50 LOC additive; markCodeDims mirrors markDims; minor DRY opportunity in mark-dims branches
- speed:      1.00   server-only, no bundle/deps/Lighthouse impact
- composite:  0.96   pass ✓

Adversarial: 0 findings with severity > 0.5
  (severity 0.3) two near-duplicate Response branches in mark-dims.ts — leave for now
  (severity 0.2) no unit test for markCodeDims — pre-existing pattern (no test for markDims either)
```

### Spec-change emitted (W1 reconciliation)

Exit condition 4 (close.ts slug-based mark) was based on a misread of close.ts. W1 recon revealed it's the WorkLoop session/stage endpoint. Plan scope tightened to rubric.ts + mark-dims.ts only. Cycle-level close deferred to a follow-up.

### Follow-ups identified

1. **Cycle-close endpoint** — separate plan to add `/api/loop/cycle-close { slug, kind, scores }` that fires `mark(loop:cycle:{slug}, composite × 5)` per do-guide.md §4.3
2. **Test coverage for `markCodeDims`** — small W3 add when next cycle touches rubric.ts
3. **Forward-port to `one-ie/one/`** — opensource mirror needs the same widening
4. **`loop.ts` vs `loops.ts` audit** — figure out which engine file is canonical; the §4.3 ledger needs to reflect actual mark sites
5. **`template-plan.md` rubric_weights field** — currently declares `fit/form/truth/taste` weights; should declare `rubric: code | msg` and let engine pick weights
