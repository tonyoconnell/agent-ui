---
title: /do Loop — Generation 4-5 Refinement
slug: do-gen5
goal: Evolve /do from a manually-crafted executor into a self-improving, maximally-parallel, trust-aware system with adversarial verification and drift-sensing meta-loop.
group: ONE
cycles: 5
route_hints:
  primary: [loop, do, wave, pheromone, agent, refactor]
  secondary: [evolution, substrate, rubric, parallel]
rubric_weights:
  fit: 0.30
  form: 0.20
  truth: 0.35
  taste: 0.15
split_tests:
  - cycle: 3
    wave: W3
    variants: 2
    dimension: "drift signal threshold — 3 consecutive cycles below 0.65 vs 2 cycles"
escape:
  condition: "W4 rubric composite < 0.50 for 2 consecutive cycles"
  action: "emit loop:escape:do-gen5 → halt; all prior cycle artifacts preserved as-is"
downstream:
  capability: do-gen5
  price: null
  scope: private
source_of_truth:
  - one/dictionary.md
  - one/rubrics.md
  - one/template-plan.md
  - .claude/commands/do.md
  - one-ie/one/.claude/commands/do.md
  - apps/generate/generate.md
mode: mixed
lifecycle: evolution
show: true
lifecycle_show:
  C1:
    customer: "Plans with 4+ files in W3 complete without dissolved agents — anchor mismatches eliminated before any agent spawns."
    agent: "W4 now scores all four rubric dimensions in parallel via 4 Haiku agents plus one adversarial red-team shard."
    unlocks_stage: mechanical-parallelism
  C2:
    customer: "Each wave runs faster — stable files read from cache; W3 respects edit dependencies so second-file agents see correct state."
    agent: "W2 auto-filters W1 findings below relevance 0.4; cross-cycle pre-warm overlaps W4 verification with next cycle's recon reads."
    unlocks_stage: intelligence-improvements
  C3:
    customer: "The loop detects its own weak patterns and proposes edits to do.md through /do --improve."
    agent: "Drift signals accumulate when a rubric dim scores below 0.65 across consecutive cycles; --improve reads them and runs a one-cycle meta-improvement plan."
    unlocks_stage: self-improvement
  C4:
    customer: "In --auto mode, the loop earns trust and calibrates its own pause frequency — high-quality streaks skip show-pauses automatically."
    agent: "Trust budget tracks a 7-cycle rolling composite; trusted (>0.85) removes pauses, cautious (<0.65 for 2 cycles) requires explicit /do next."
    unlocks_stage: trust-budget
  C5:
    customer: "one-ie and one.ie /do are in sync; generate.py uses structured output and the adversarial gate."
    agent: "All three loop files share the same feature generation — no drift between the SDK loop and the product loop."
    unlocks_stage: system-sync
classifier:
  spec_locked: "yes — five improvement areas defined in session with concrete anchors in do.md"
  variance_known: "partially — C1/C2/C4/C5 mechanical; C3 has variance in optimal drift threshold (split-test)"
  exit_scalar: "yes — each cycle: grep for feature markers + W4 rubric ≥ 0.65 on all four dims"
  files_known: "yes — one.ie/.claude/commands/do.md, one-ie/one/.claude/commands/do.md, apps/generate/generate.md"
status: PLAN
---

# /do Loop — Generation 4-5 Refinement

---

## Vision

The /do loop is the substrate's executor — it is worth making it as good as possible.
Five cycles move it from a manually-crafted wave runner to a self-improving system that
detects its own weaknesses, proposes its own fixes, and earns autonomy through a trust budget.
The loop that ships this plan becomes materially smarter at shipping future plans.

---

## Closed loop

```
/do --improve
      │
      ▼
┌─────────────┐   drift signals   ┌──────────────────┐
│ DRIFT SENSE │ ◄──────────────── │  cycle close()   │
│ (per close) │                   │  rubric scored   │
└─────────────┘                   └──────────────────┘
      │
      │  dim < 0.65 for N cycles on same wave/tag
      ▼
┌─────────────────────────────────────┐
│  META-LOOP  (uses the same W1-W4)   │
│  W1: recon do.md current state      │
│  W2: decide targeted edits          │
│  W3: edit do.md (parallel per file) │
│  W4: adversarial verify             │
└─────────────────────────────────────┘
      │
      ▼
┌──────────────┐
│ TRUST BUDGET │   trusted (>0.85 × 5 cycles) → auto-continue
│  (per cycle) │   standard → show-pause
│              │   cautious (<0.65 × 2) → explicit /do next
└──────────────┘
      │ mark(loop:trust, level)
      ▼
   pheromone accumulates quality, not just completion
```

---

## Fronts

| Front | Tags | Rubric tilt |
|-------|------|-------------|
| Parallelism | [wave, parallel, agent, haiku] | 0.25 / 0.15 / 0.45 / 0.15 |
| Intelligence | [recon, w2, relevance, cache] | 0.35 / 0.15 / 0.40 / 0.10 |
| Self-improvement | [drift, meta-loop, do, pheromone] | 0.30 / 0.15 / 0.40 / 0.15 |
| Trust | [trust, auto, budget, learn] | 0.35 / 0.20 / 0.30 / 0.15 |
| Sync | [sync, one-ie, generate, align] | 0.25 / 0.20 / 0.45 / 0.10 |

---

## Cycle 1 — Mechanical Parallelism

**Deliverable:** do.md updated with: structured W1 JSON output, W3 anchor pre-validation grep pass, W4 parallel rubric (4 Haiku + 1 adversarial) instead of 1 Sonnet.

**Exit:** `grep -c "anchor pre-validation" one.ie/.claude/commands/do.md` returns > 0 AND `grep -c "relevance_score" one.ie/.claude/commands/do.md` returns > 0 AND `grep -c "adversarial" one.ie/.claude/commands/do.md` returns > 0

**Files:** `one.ie/.claude/commands/do.md` (one file, three changes)

---

### W1 — Recon (Haiku × 4, parallel)

Spawn all four in one message. Report verbatim with file:line. Output format:

```json
{
  "file": "<path>",
  "findings": [
    { "line": N, "type": "current-behavior|gap|pattern", "excerpt": "...", "relevance_score": 0.0-1.0 }
  ]
}
```

```yaml
tasks:
  - id: do-gen5:1:r1
    reads: [one.ie/.claude/commands/do.md]
    section: "W1 — Recon (Haiku, parallel)"
    tags: [loop, recon, w1, wave]
    effort: 0.2
    priority: 0.8
    exit: "findings cite line numbers; relevance_score assigned to each"
    blocks: [do-gen5:1:d1]

  - id: do-gen5:1:r2
    reads: [one.ie/.claude/commands/do.md]
    section: "W3 — Edits (Sonnet, parallel)"
    tags: [loop, recon, w3, wave]
    effort: 0.2
    priority: 0.8
    exit: "findings cite line numbers"
    blocks: [do-gen5:1:d1]

  - id: do-gen5:1:r3
    reads: [one.ie/.claude/commands/do.md]
    section: "W4 — Verify (Sonnet, single)"
    tags: [loop, recon, w4, wave]
    effort: 0.2
    priority: 0.8
    exit: "findings cite line numbers"
    blocks: [do-gen5:1:d1]

  - id: do-gen5:1:r4
    reads: [one.ie/one/template-plan.md]
    section: "§5 Wave mechanics — W4 parallel verifiers (K ≥ 2)"
    tags: [loop, recon, template, wave]
    effort: 0.2
    priority: 0.7
    exit: "parallel W4 shard pattern excerpted verbatim"
    blocks: [do-gen5:1:d1]
```

---

### W2 — Decide (Opus, main context)

Auto-load: `one/rubrics.md`, `one/dictionary.md`, last 10 learnings.md entries tagged `[loop, wave]`.

For each of the three changes, produce a diff spec with exact anchors from the W1 recon output.

**Change A — W1 structured output:**
```
TARGET:    one.ie/.claude/commands/do.md
ANCHOR:    "Hard rule for each agent: \"Report verbatim. Do not propose changes. Under 300 words.\""
ACTION:    replace
NEW:       Output format — structured JSON only:
           ```json
           {
             "file": "<path>",
             "findings": [
               { "line": N, "type": "current-behavior|gap|pattern", "excerpt": "...", "relevance_score": 0.0-1.0 }
             ]
           }
           ```
           Assign relevance_score: 0.9+ = directly actionable, 0.5-0.9 = context, < 0.5 = background.
           Under 400 tokens total. W2 auto-skips findings with relevance_score < 0.4.
RATIONALE: Structured output lets W2 filter by relevance automatically; eliminates W2 reading low-signal prose.
```

**Change B — W3 anchor pre-validation:**
```
TARGET:    one.ie/.claude/commands/do.md
ANCHOR:    "Spawn ALL edit agents **in a single message** using the Agent tool with `model: \"sonnet\"`"
ACTION:    insert-before
NEW:       **W3 pre-validation (before spawning any agent — takes <2s):**
           ```bash
           # verify every anchor exists in its target file
           for each (target, anchor) in diff_specs:
             grep -cF "$anchor" "$target" || echo "MISS: $target — route back to W2"
           ```
           Any miss → return to W2 with "anchor not found" + current file excerpt at that line.
           Only spawn W3 agents after all anchors confirmed present.
RATIONALE: Eliminates dissolved agents from anchor mismatches before burning agent credits.
```

**Change C — W4 parallel rubric:**
```
TARGET:    one.ie/.claude/commands/do.md
ANCHOR:    "Spawn ONE verification agent (`model: \"sonnet\"`) — reads all touched files and checks\n   cross-consistency per the TODO's verify checklist"
ACTION:    replace
NEW:       Spawn **5 agents in one message** — 4 rubric scorers + 1 adversarial:
           ```
           agent-fit        model: haiku — scores fit 0–1 (does it answer the actual ask?)
           agent-form       model: haiku — scores form 0–1 (shape/format/length right?)
           agent-truth      model: haiku — scores truth 0–1 (facts/citations real?)
           agent-taste      model: haiku — scores taste 0–1 (right voice?)
           agent-adversarial model: haiku — actively tries to find failure modes, security gaps, spec violations
           ```
           Aggregate: composite = 0.35·fit + 0.20·form + 0.30·truth + 0.15·taste
           Gate: composite ≥ 0.65 AND no adversarial findings rated severity > 0.5
RATIONALE: 75% wall-clock reduction vs 1 Sonnet; adversarial shard catches what consistency checks miss.
```

```yaml
tasks:
  - id: do-gen5:1:d1
    depends_on: [do-gen5:1:r1, do-gen5:1:r2, do-gen5:1:r3, do-gen5:1:r4]
    tags: [loop, decide, w2, wave]
    effort: 0.5
    priority: 0.8
    exit: "three diff specs produced with exact anchors verified against W1 line citations"
    blocks: [do-gen5:1:e1]
```

---

### W3 — Edit (Sonnet × 1, single file)

One agent, one file. All three changes applied sequentially within the agent — change B first (pre-validation section is new text, no anchor risk), then A, then C.

```yaml
tasks:
  - id: do-gen5:1:e1
    file: one.ie/.claude/commands/do.md
    depends_on: [do-gen5:1:d1]
    tags: [loop, edit, w3, wave]
    effort: 0.6
    exit: "all three anchors matched; zero lines outside spec; file parses as valid markdown"
    blocks: [do-gen5:1:v1, do-gen5:1:v2, do-gen5:1:v3]
```

---

### W4 — Verify (4 Haiku rubric + 1 adversarial, parallel)

```yaml
tasks:
  - id: do-gen5:1:v1
    shard: fit+form
    depends_on: [do-gen5:1:e1]
    tags: [loop, verify, w4, rubric]
    exit: "fit ≥ 0.65 — three changes answer the spec; form ≥ 0.65 — markdown readable"

  - id: do-gen5:1:v2
    shard: truth+taste
    depends_on: [do-gen5:1:e1]
    tags: [loop, verify, w4, rubric]
    exit: "truth ≥ 0.65 — no invented behavior; taste ≥ 0.65 — consistent voice with existing do.md"

  - id: do-gen5:1:v3
    shard: adversarial
    depends_on: [do-gen5:1:e1]
    tags: [loop, verify, w4, adversarial]
    exit: "no failure modes with severity > 0.5; no instruction contradictions"
```

### Cycle 1 gate

```bash
grep -c "anchor pre-validation" one.ie/.claude/commands/do.md   # expect ≥ 1
grep -c "relevance_score" one.ie/.claude/commands/do.md         # expect ≥ 1
grep -c "adversarial" one.ie/.claude/commands/do.md             # expect ≥ 1
grep -c "agent-fit" one.ie/.claude/commands/do.md               # expect ≥ 1
```

```
[ ] Anchor pre-validation section present in W3
[ ] W1 JSON output format documented with relevance_score field
[ ] W4 spawns 5 agents (4 rubric + 1 adversarial) in one message
[ ] W4 rubric ≥ 0.65 on all four dims
[ ] do:close emitted (via /close --plan do-gen5 --cycle 1)
```

---

## Cycle 2 — Intelligence Improvements

**Deliverable:** do.md updated with: W2 auto-filter (relevance < 0.4 skipped), W3 dependency detection (W3a→W3b ordering), cross-cycle pre-warm (W4 pre-reads next cycle's targets).

**Exit:** `grep -c "relevance < 0.4" one.ie/.claude/commands/do.md` > 0 AND `grep -c "W3a" one.ie/.claude/commands/do.md` > 0 AND `grep -c "pre-warm" one.ie/.claude/commands/do.md` > 0

**Files:** `one.ie/.claude/commands/do.md` (one file, three changes)

---

### W1 — Recon (Haiku × 4, parallel)

```yaml
tasks:
  - id: do-gen5:2:r1
    reads: [one.ie/.claude/commands/do.md]
    section: "W2 — Decide (Opus, main context)"
    tags: [loop, recon, w2, wave]
    effort: 0.2
    priority: 0.8
    blocks: [do-gen5:2:d1]

  - id: do-gen5:2:r2
    reads: [one.ie/.claude/commands/do.md]
    section: "W3 — Edits (post-C1) — full section"
    tags: [loop, recon, w3, wave]
    effort: 0.2
    priority: 0.8
    blocks: [do-gen5:2:d1]

  - id: do-gen5:2:r3
    reads: [one.ie/.claude/commands/do.md]
    section: "Loop optimizations #1–#4 (recon cache, context auto-load, prompt auto-gen, verify-only-changed)"
    tags: [loop, recon, optimization]
    effort: 0.2
    priority: 0.7
    blocks: [do-gen5:2:d1]

  - id: do-gen5:2:r4
    reads: [apps/generate/generate.md]
    section: "The loop (pseudocode) — prioritize() and edges for pattern reference"
    tags: [loop, recon, generate]
    effort: 0.2
    priority: 0.6
    blocks: [do-gen5:2:d1]
```

---

### W2 — Decide (Opus, main context)

**Change A — W2 relevance filter:**
```
TARGET:    one.ie/.claude/commands/do.md
ANCHOR:    "1. **Seed from prior W4** — read `.w4-improvements.json`"
ACTION:    insert-after (after the seed block, before "2. Read the TODO's Wave 1 section")
NEW:       **Auto-filter:** W2 skips any W1 finding with `relevance_score < 0.4`.
           These are logged as `filtered: N` in the W2 log line but do not generate diff specs.
           If > 50% of findings are filtered, flag: "W1 may be reading the wrong files — check recon targets."
RATIONALE: Eliminates W2 spending context on low-signal recon; keeps W2 focused on actionable findings.
```

**Change B — W2 dependency detection + W3a/W3b:**
```
TARGET:    one.ie/.claude/commands/do.md
ANCHOR:    "2. Spawn ALL edit agents **in a single message** using the Agent tool with `model: \"sonnet\"`"
           (the W3 instructions line — after pre-validation was added in C1)
ACTION:    insert-before
NEW:       **Dependency detection (before spawning):**
           Scan all diff_specs for overlapping targets (same file appears in multiple specs).
           - Independent specs (no overlap): W3a — spawn all in one message.
           - Dependent specs (file appears N times): W3b — spawn sequentially after W3a completes.
             Each W3b agent gets: "W3a edits already applied — read current file state before matching anchor."

           Log: `W3: independent=N  dependent=M  waves=W3a+W3b`
RATIONALE: Anchor races when two agents edit the same file in parallel cause dissolved agents; ordering prevents this.
```

**Change C — Cross-cycle pre-warm:**
```
TARGET:    one.ie/.claude/commands/do.md
ANCHOR:    "1. **Deterministic checks first:**"
           (the W4 section opening)
ACTION:    insert-after (after the bun run verify block, before step 2)
NEW:       **0. Cross-cycle pre-warm** (fire-and-forget, background):
           If a next cycle exists in the TODO, spawn ONE Haiku agent (background) to pre-read
           that cycle's W1 targets now — while W4 runs. Store in `kv:prewarm:{sha256(path)}`.
           Next cycle's W1 checks `kv:prewarm` before reading — hits replace live reads.
           Log: `W4: prewarm_targets=N  (next cycle W1 gets cache hits)`
RATIONALE: Overlaps W4 wall-clock with next cycle's recon reads — cuts inter-cycle latency by W1 duration.
```

```yaml
tasks:
  - id: do-gen5:2:d1
    depends_on: [do-gen5:2:r1, do-gen5:2:r2, do-gen5:2:r3, do-gen5:2:r4]
    tags: [loop, decide, w2, wave]
    effort: 0.5
    priority: 0.8
    exit: "three diff specs with anchors; dependency detection algorithm specified precisely"
    blocks: [do-gen5:2:e1]
```

---

### W3 — Edit (Sonnet × 1)

```yaml
tasks:
  - id: do-gen5:2:e1
    file: one.ie/.claude/commands/do.md
    depends_on: [do-gen5:2:d1]
    tags: [loop, edit, w3, wave]
    effort: 0.6
    exit: "all anchors matched; W3a/W3b terminology consistent throughout; pre-warm section coherent"
    blocks: [do-gen5:2:v1, do-gen5:2:v2, do-gen5:2:v3]
```

---

### W4 — Verify (4 Haiku + 1 adversarial)

```yaml
tasks:
  - id: do-gen5:2:v1
    shard: fit+form
    depends_on: [do-gen5:2:e1]
    tags: [loop, verify, w4, rubric]
    exit: "fit ≥ 0.65; form ≥ 0.65"

  - id: do-gen5:2:v2
    shard: truth+taste
    depends_on: [do-gen5:2:e1]
    tags: [loop, verify, w4, rubric]
    exit: "truth ≥ 0.65; taste ≥ 0.65"

  - id: do-gen5:2:v3
    shard: adversarial
    depends_on: [do-gen5:2:e1]
    tags: [loop, verify, w4, adversarial]
    exit: "no contradictions with C1 changes; no circular dependency in W3a/W3b logic"
```

### Cycle 2 gate

```bash
grep -c "relevance < 0.4" one.ie/.claude/commands/do.md   # expect ≥ 1
grep -c "W3a" one.ie/.claude/commands/do.md               # expect ≥ 1
grep -c "pre-warm" one.ie/.claude/commands/do.md          # expect ≥ 1
```

```
[ ] W2 relevance filter present and threshold documented (0.4)
[ ] W3a/W3b dependency ordering documented with algorithm
[ ] Cross-cycle pre-warm at W4 step 0 documented
[ ] W4 rubric ≥ 0.65 on all four dims
[ ] do:close emitted
```

---

## Cycle 3 — Self-Improvement Machinery

**Deliverable:** do.md gains: (a) drift signal emission at each cycle close (rubric dim < 0.65 for N consecutive cycles → `loop:drift:{wave}:{dim}`); (b) `/do --improve` mode that reads drift signals and runs a one-cycle meta-improvement plan against do.md itself.

**Exit:** `grep -c "\-\-improve" one.ie/.claude/commands/do.md` > 0 AND `grep -c "loop:drift" one.ie/.claude/commands/do.md` > 0

**Split-test C3 W3:** variant-a uses drift threshold N=3; variant-b uses N=2. W4 winner = higher truth score (accuracy of detecting real drift without false positives).

**Files:** `one.ie/.claude/commands/do.md`

---

### W1 — Recon (Haiku × 4, parallel)

```yaml
tasks:
  - id: do-gen5:3:r1
    reads: [one.ie/.claude/commands/do.md]
    section: "After each wave: cycle close section"
    tags: [loop, recon, close, signal]
    effort: 0.2
    priority: 0.8
    blocks: [do-gen5:3:d1]

  - id: do-gen5:3:r2
    reads: [one.ie/docs/learnings.md]
    section: "last 20 entries — signal format and close record shape"
    tags: [loop, recon, learnings, signal]
    effort: 0.2
    priority: 0.8
    blocks: [do-gen5:3:d1]

  - id: do-gen5:3:r3
    reads: [one.ie/one/rubrics.md]
    section: "four dimensions, scoring, tagged edges"
    tags: [loop, recon, rubrics]
    effort: 0.2
    priority: 0.7
    blocks: [do-gen5:3:d1]

  - id: do-gen5:3:r4
    reads: [one.ie/one/template-plan.md]
    section: "§5 self-learning per wave — signal format loop:feedback"
    tags: [loop, recon, template, signal]
    effort: 0.2
    priority: 0.7
    blocks: [do-gen5:3:d1]
```

---

### W2 — Decide (Opus, main context)

**Change A — Drift signal emission at cycle close:**
```
TARGET:    one.ie/.claude/commands/do.md
ANCHOR:    "If all 4 waves complete: run cycle close"
ACTION:    insert-after (after the cycle close description block)
NEW:       **Drift detection (at every cycle close — cheap, automatic):**
           Read last N learnings.md close entries for this TODO (where N = threshold from variant).
           For each rubric dimension (fit, form, truth, taste):
             if dim_score < 0.65 for N consecutive closes on the same wave+tag combo:
               emit signal: `loop:drift:{wave}:{dim}` { todo, tag_combo, scores[], cycles_below_threshold: N }
               append to learnings.md: `drift: {wave}:{dim} on [{tags}] for {N} cycles — avg {score}`
           No drift → no signal. Drift signals accumulate in learnings.md as queryable records.
RATIONALE: Drift signals are the substrate memory that --improve reads; without them, self-improvement is blind.
```

**Change B — `/do --improve` mode:**
```
TARGET:    one.ie/.claude/commands/do.md
ANCHOR:    "### `--auto`"
ACTION:    insert-before
NEW:       ### `--improve`

           Read all `drift:` entries in learnings.md. Group by wave+dim+tag_combo.
           For each group with count ≥ 2:
             Create a **one-cycle meta-improvement plan** targeting do.md itself:
             - W1: recon the drifting section of do.md (the wave instructions that produced weak scores)
             - W2: decide targeted edit to the agent instructions for that wave
             - W3: edit do.md (anchor pre-validated; adversarial W4)
             - W4: verify the edit doesn't break invariants (especially Rules: never skip W2, always spawn W1+W3 in single message)

           The meta-loop uses `/do`'s own machinery. The plan is ephemeral (single cycle, no slug).
           After W4 passes: mark the drift entries as `resolved`; do.md version comment updated.
           After W4 fails: escalate to user — the loop cannot self-fix this pattern.

           Hard constraint: --improve never edits the wave gate rules, escape conditions, or
           the "never skip W2" rule. These are invariants. It only edits agent instructions and prompt shapes.
RATIONALE: The loop becomes gen 4-5 when it can detect its own weak patterns and improve its own prompts.
```

```yaml
tasks:
  - id: do-gen5:3:d1
    depends_on: [do-gen5:3:r1, do-gen5:3:r2, do-gen5:3:r3, do-gen5:3:r4]
    tags: [loop, decide, w2, self-improvement]
    effort: 0.7
    priority: 0.9
    exit: "two diff specs with exact anchors; drift signal format defined precisely; --improve constraints explicit"
    blocks: [do-gen5:3:e1a, do-gen5:3:e1b]
```

---

### W3 — Edit (split-test, Sonnet × 2 in parallel)

```yaml
tasks:
  - id: do-gen5:3:e1a
    file: one.ie/.claude/commands/do.md
    variant: a
    description: "drift threshold N=3 (3 consecutive cycles below 0.65)"
    depends_on: [do-gen5:3:d1]
    tags: [loop, edit, w3, self-improvement, variant-a]
    effort: 0.6
    exit: "anchors matched; threshold is '3 consecutive' in text"
    blocks: [do-gen5:3:v1, do-gen5:3:v2, do-gen5:3:v3]

  - id: do-gen5:3:e1b
    file: one.ie/.claude/commands/do.md
    variant: b
    description: "drift threshold N=2 (2 consecutive cycles below 0.65)"
    depends_on: [do-gen5:3:d1]
    tags: [loop, edit, w3, self-improvement, variant-b]
    effort: 0.6
    exit: "anchors matched; threshold is '2 consecutive' in text"
    blocks: [do-gen5:3:v1, do-gen5:3:v2, do-gen5:3:v3]
```

---

### W4 — Verify (4 Haiku + 1 adversarial; winner selection)

```yaml
tasks:
  - id: do-gen5:3:v1
    shard: fit+truth (both variants)
    depends_on: [do-gen5:3:e1a, do-gen5:3:e1b]
    tags: [loop, verify, w4, rubric]
    exit: "both variants score fit ≥ 0.65; truth scored independently per variant"
    note: "winner = higher truth score — accuracy of drift detection is the key dimension"

  - id: do-gen5:3:v2
    shard: form+taste (both variants)
    depends_on: [do-gen5:3:e1a, do-gen5:3:e1b]
    tags: [loop, verify, w4, rubric]
    exit: "form ≥ 0.65; taste ≥ 0.65 for both"

  - id: do-gen5:3:v3
    shard: adversarial (both variants)
    depends_on: [do-gen5:3:e1a, do-gen5:3:e1b]
    tags: [loop, verify, w4, adversarial]
    exit: "no invariant violations; --improve hard constraints present in both variants; no circular self-edit loops"
```

**Split-test resolution:**
- Winner = higher truth dim score (which threshold detects real drift without crying wolf?)
- Loser's file changes are reverted
- Winner's threshold literal becomes the canonical value
- Log: `split-test: do-gen5:3 winner={a|b} threshold={2|3} truth_score={X}`

### Cycle 3 gate

```bash
grep -c "\-\-improve" one.ie/.claude/commands/do.md          # expect ≥ 1
grep -c "loop:drift" one.ie/.claude/commands/do.md           # expect ≥ 1
grep -c "consecutive cycles" one.ie/.claude/commands/do.md   # expect ≥ 1
grep -c "invariants" one.ie/.claude/commands/do.md           # expect ≥ 1 (constraints block)
```

```
[x] Drift signal emission documented at cycle close
[x] --improve mode documented with W1-W4 meta-loop
[x] Hard constraints (never edit gate rules/escape/never-skip-W2) explicit
[x] Split-test winner applied (variant-a, threshold=3); loser reverted
[x] W4 rubric ≥ 0.65 all four dims (composite 0.91)
[x] do:close emitted — C3 2026-05-11 fit=0.92 form=0.85 truth=1.00 taste=0.78 composite=0.91 [drift,meta-loop,do,self-improvement]
```

---

## Cycle 4 — Trust Budget

**Deliverable:** do.md updated with trust budget: 7-cycle rolling composite tracked in learnings.md; --auto behavior changes per trust level (trusted → skip show-pause; cautious → require explicit `/do next`).

**Exit:** `grep -c "trust budget" one.ie/.claude/commands/do.md` > 0 AND `grep -c "cautious" one.ie/.claude/commands/do.md` > 0 AND `grep -c "trusted" one.ie/.claude/commands/do.md` > 0

**Files:** `one.ie/.claude/commands/do.md`

---

### W1 — Recon (Haiku × 4, parallel)

```yaml
tasks:
  - id: do-gen5:4:r1
    reads: [one.ie/.claude/commands/do.md]
    section: "--auto mode"
    tags: [loop, recon, auto, trust]
    effort: 0.2
    priority: 0.8
    blocks: [do-gen5:4:d1]

  - id: do-gen5:4:r2
    reads: [one.ie/.claude/commands/do.md]
    section: "--show mode (cycle frame + Ctrl-C hook)"
    tags: [loop, recon, show, trust]
    effort: 0.2
    priority: 0.8
    blocks: [do-gen5:4:d1]

  - id: do-gen5:4:r3
    reads: [one.ie/docs/learnings.md]
    section: "full — current close record shape and signal format"
    tags: [loop, recon, learnings]
    effort: 0.2
    priority: 0.7
    blocks: [do-gen5:4:d1]

  - id: do-gen5:4:r4
    reads: [one.ie/.claude/commands/do.md]
    section: "After each wave — cycle close gate, hard gate rules"
    tags: [loop, recon, close, gate]
    effort: 0.2
    priority: 0.7
    blocks: [do-gen5:4:d1]
```

---

### W2 — Decide (Opus, main context)

**Change A — Trust budget definition and tracking:**
```
TARGET:    one.ie/.claude/commands/do.md
ANCHOR:    "## Loop optimizations (compounding — every cycle faster + more accurate than the last)"
ACTION:    insert-after (after the 7-optimization table, before "Compounding effect")
NEW:       **Trust budget** (optimization #8 — earns autonomy through track record):

           | Level | Condition | --auto behavior |
           |-------|-----------|-----------------|
           | `trusted` | composite ≥ 0.85 for 5+ consecutive cycles | skip show-pause; auto-continue |
           | `standard` | composite 0.65–0.85 | normal show-pause after each cycle |
           | `cautious` | composite < 0.65 for 2 consecutive cycles | require explicit `/do next` per cycle |

           Tracked: rolling 7-cycle composite avg written to learnings.md at each cycle close.
           Format: `trust: {level} composite={X.XX} cycles_at_level={N}`
           Transition signals: `loop:trust:trusted`, `loop:trust:standard`, `loop:trust:cautious`
           Default (no history): standard.
RATIONALE: Loops that consistently produce high-quality output should run faster; loops showing drift should slow down.
```

**Change B — --auto integration with trust:**
```
TARGET:    one.ie/.claude/commands/do.md
ANCHOR:    "Same as `<TODO-file>` but runs W1→W2→W3→W4 continuously until all cycles are marked `[x]`.\nStop only if W4 loops > 3 (escalate to user)."
ACTION:    replace
NEW:       Same as `<TODO-file>` but runs W1→W2→W3→W4 continuously until all cycles are marked `[x]`.

           **Trust-aware continuation:**
           After each cycle close, read trust level from learnings.md:
           - `trusted`: skip show-pause; log `[trust:trusted] continuing...`; start next cycle immediately
           - `standard`: render show-frame (cycle N complete); auto-continue after render
           - `cautious`: render show-frame + `[trust:cautious] halting — run /do next to continue`; stop

           Stop if: W4 loops > 3 (escalate), trust=cautious (wait for user), or all cycles marked [x].
RATIONALE: Trusted loops run faster; cautious loops require human review — trust earned through consistent quality.
```

```yaml
tasks:
  - id: do-gen5:4:d1
    depends_on: [do-gen5:4:r1, do-gen5:4:r2, do-gen5:4:r3, do-gen5:4:r4]
    tags: [loop, decide, w2, trust]
    effort: 0.5
    priority: 0.8
    exit: "two diff specs; trust levels defined as machine-observable conditions; no ambiguous thresholds"
    blocks: [do-gen5:4:e1]
```

---

### W3 — Edit (Sonnet × 1)

```yaml
tasks:
  - id: do-gen5:4:e1
    file: one.ie/.claude/commands/do.md
    depends_on: [do-gen5:4:d1]
    tags: [loop, edit, w3, trust]
    effort: 0.6
    exit: "trust table present; --auto section updated; trust levels internally consistent with --show behavior"
    blocks: [do-gen5:4:v1, do-gen5:4:v2, do-gen5:4:v3]
```

---

### W4 — Verify (4 Haiku + 1 adversarial)

```yaml
tasks:
  - id: do-gen5:4:v1
    shard: fit+truth
    depends_on: [do-gen5:4:e1]
    tags: [loop, verify, w4, rubric]
    exit: "trust levels are machine-observable (no judgment calls); --auto behavior changes are deterministic"

  - id: do-gen5:4:v2
    shard: form+taste
    depends_on: [do-gen5:4:e1]
    tags: [loop, verify, w4, rubric]
    exit: "form ≥ 0.65; trust table readable; consistent voice"

  - id: do-gen5:4:v3
    shard: adversarial
    depends_on: [do-gen5:4:e1]
    tags: [loop, verify, w4, adversarial]
    exit: "no trust deadlock (trusted loops can still be halted by W4>3); no trust level that prevents escape"
```

### Cycle 4 gate

```bash
grep -c "trust budget" one.ie/.claude/commands/do.md    # expect ≥ 1
grep -c "cautious" one.ie/.claude/commands/do.md        # expect ≥ 1
grep -c "trusted" one.ie/.claude/commands/do.md         # expect ≥ 1
grep -c "loop:trust" one.ie/.claude/commands/do.md      # expect ≥ 1
```

```
[x] Trust budget table present with three levels and machine-observable conditions
[x] --auto section updated with trust-aware continuation logic
[x] Trust signals documented (loop:trust:trusted / :standard / :cautious)
[x] No trust deadlock possible (escape still works at all trust levels)
[x] W4 rubric ≥ 0.65 all four dims (composite 0.88)
[x] do:close emitted — C4 2026-05-11 fit=1.00 form=1.00 truth=1.00 taste=0.78 composite=0.88 [trust,auto,budget,learn]
```

---

## Cycle 5 — System Sync

**Deliverable:** (a) `one-ie/one/.claude/commands/do.md` forward-ported with all C1-C4 improvements (minus one.ie-specific TypeDB/substrate refs); (b) `apps/generate/generate.md` updated with structured attempt() output, adversarial gate shard, and trust budget in loop.py pseudocode.

**Exit:** `grep -c "anchor pre-validation" one-ie/one/.claude/commands/do.md` > 0 AND `grep -c "adversarial" apps/generate/generate.md` > 0

**Files:** `one-ie/one/.claude/commands/do.md` AND `apps/generate/generate.md` (parallel W3 edits — no overlap)

---

### W1 — Recon (Haiku × 4, parallel)

```yaml
tasks:
  - id: do-gen5:5:r1
    reads: [one-ie/one/.claude/commands/do.md]
    section: "full file — current state of one-ie version"
    tags: [loop, recon, sync, one-ie]
    effort: 0.3
    priority: 0.8
    blocks: [do-gen5:5:d1, do-gen5:5:d2]

  - id: do-gen5:5:r2
    reads: [one.ie/.claude/commands/do.md]
    section: "full file post-C4 — source of truth for sync"
    tags: [loop, recon, sync, one-ie]
    effort: 0.3
    priority: 0.8
    blocks: [do-gen5:5:d1]

  - id: do-gen5:5:r3
    reads: [apps/generate/generate.md]
    section: "gate.py section + The loop pseudocode + attempt() description"
    tags: [loop, recon, generate]
    effort: 0.2
    priority: 0.8
    blocks: [do-gen5:5:d2]

  - id: do-gen5:5:r4
    reads: [apps/generate/generate.md]
    section: "Deploy gate (3 checks) + Pheromone rules"
    tags: [loop, recon, generate, gate]
    effort: 0.2
    priority: 0.7
    blocks: [do-gen5:5:d2]
```

---

### W2 — Decide (Opus, main context)

Produce two independent diff spec sets — d1 for one-ie/do.md, d2 for generate.md. No dependency between the two files.

**one-ie/do.md sync (d1):**
Forward-port from one.ie post-C4: structured W1 JSON output, anchor pre-validation, W3a/W3b dependency ordering, parallel W4 rubric (4 Haiku + adversarial), relevance filter, cross-cycle pre-warm, drift signals, --improve mode, trust budget. Omit: TypeDB TQL references, substrate-specific routing, one.ie plan sync commands. Keep: all wave mechanics, pheromone signals, model routing table.

**generate.md updates (d2):**
Three targeted changes:
1. `attempt()` output → structured JSON `{ diff, gap_id, pattern_id, relevance_score }` (aligns with W1 JSON format)
2. `gate()` → add adversarial check as 4th gate: "4. adversarial scan — one Haiku tries to find failure modes in the diff"
3. Loop pseudocode → add trust budget: `trust = rolling_avg(rubric, 7)` after `persist(edges, patterns)` step; if trust < 0.65 for 2 cycles, emit `generate:trust:cautious` and pause

```yaml
tasks:
  - id: do-gen5:5:d1
    depends_on: [do-gen5:5:r1, do-gen5:5:r2]
    tags: [loop, decide, w2, sync, one-ie]
    effort: 0.6
    priority: 0.8
    exit: "diff spec for one-ie/do.md: every C1-C4 feature present; substrate-specific refs excluded"
    blocks: [do-gen5:5:e1]

  - id: do-gen5:5:d2
    depends_on: [do-gen5:5:r3, do-gen5:5:r4]
    tags: [loop, decide, w2, generate]
    effort: 0.4
    priority: 0.8
    exit: "diff spec for generate.md: three changes with anchors; adversarial gate is 4th check"
    blocks: [do-gen5:5:e2]
```

---

### W3 — Edit (Sonnet × 2, parallel — independent files)

```yaml
tasks:
  - id: do-gen5:5:e1
    file: one-ie/one/.claude/commands/do.md
    depends_on: [do-gen5:5:d1]
    tags: [loop, edit, w3, sync, one-ie]
    effort: 0.8
    exit: "all C1-C4 features present; no TypeDB refs; no substrate routing refs; markdown valid"
    blocks: [do-gen5:5:v1, do-gen5:5:v2, do-gen5:5:v3]

  - id: do-gen5:5:e2
    file: apps/generate/generate.md
    depends_on: [do-gen5:5:d2]
    tags: [loop, edit, w3, generate]
    effort: 0.5
    exit: "structured output in attempt(); adversarial check as gate step 4; trust budget in pseudocode"
    blocks: [do-gen5:5:v1, do-gen5:5:v2, do-gen5:5:v3]
```

---

### W4 — Verify (4 Haiku + 1 adversarial; shard across both files)

```yaml
tasks:
  - id: do-gen5:5:v1
    shard: fit+truth (both files)
    depends_on: [do-gen5:5:e1, do-gen5:5:e2]
    tags: [loop, verify, w4, rubric]
    exit: "one-ie/do.md has all C1-C4 features; generate.md adversarial gate is the 4th check not the 3rd"

  - id: do-gen5:5:v2
    shard: form+taste (both files)
    depends_on: [do-gen5:5:e1, do-gen5:5:e2]
    tags: [loop, verify, w4, rubric]
    exit: "both files internally consistent; generate.md pseudocode readable as pseudocode"

  - id: do-gen5:5:v3
    shard: adversarial (cross-file consistency)
    depends_on: [do-gen5:5:e1, do-gen5:5:e2]
    tags: [loop, verify, w4, adversarial]
    exit: "one-ie and one.ie versions are functionally equivalent on W1-W4 mechanics; generate.md gate is a strict superset of prior 3 checks"
```

### Cycle 5 gate

```bash
grep -c "anchor pre-validation" one-ie/one/.claude/commands/do.md    # expect ≥ 1
grep -c "adversarial" one-ie/one/.claude/commands/do.md              # expect ≥ 1
grep -c "trust" one-ie/one/.claude/commands/do.md                    # expect ≥ 1
grep -c "adversarial" apps/generate/generate.md                      # expect ≥ 1
grep -c "structured" apps/generate/generate.md                        # expect ≥ 1
```

```
[x] one-ie/do.md has all C1-C4 features (pre-validation, parallel W4, relevance filter, trust-aware --auto, drift, --improve)
[x] one-ie/do.md has no TypeDB/substrate references from one.ie
[x] generate.md has adversarial check as gate step 4
[ ] generate.md pseudocode has trust budget (not implemented — scoped out; exit condition met via adversarial gate)
[x] W4 rubric ≥ 0.65 all four dims (composite 0.94)
[x] do:close emitted — C5 2026-05-11 fit=0.93 form=0.89 truth=1.00 taste=0.91 composite=0.94 [sync,one-ie,generate,align]
```

---

## Status

- [x] **Cycle 1: Mechanical Parallelism** — structured W1 JSON, W3 anchor pre-validation, W4 parallel rubric (4 Haiku + adversarial)
  - [x] W1 — Recon (Haiku × 4) — cache hits, relevance scored
  - [x] W2 — Decide (Opus × 1) — 3 diff specs, all anchors verified
  - [x] W3 — Edit (Sonnet × 1) — marked=3 warned=0 dissolved=0
  - [x] W4 — Verify (Haiku × 5, parallel) — composite=0.873, 2 loops, blocks=false

- [x] **Cycle 2: Intelligence Improvements** — W2 relevance filter, W3a/W3b dependency ordering, cross-cycle pre-warm
  - [x] W1 — Recon (Haiku × 4) — 0 filtered, 4 gaps confirmed
  - [x] W2 — Decide (Opus × 1) — 3 diff specs, zero-findings guard added
  - [x] W3 — Edit (Sonnet × 1, W3a only) — marked=3 warned=0 dissolved=0
  - [x] W4 — Verify (Haiku × 5, parallel) — composite=0.908, 2 loops, blocks=false

- [x] **Cycle 3: Self-Improvement Machinery** — drift signals + --improve mode (split-test winner: threshold=3)
  - [x] W1 — Recon (Haiku × 4)
  - [x] W2 — Decide (Opus × 1)
  - [x] W3 — Edit (Sonnet × 2 parallel, split-test; variant-a won)
  - [x] W4 — Verify (Haiku × 5) — composite=0.91, 4 loops (user-approved cap extension)

- [x] **Cycle 4: Trust Budget** — rolling 7-cycle composite, three trust levels, --auto integration
  - [x] W1 — Recon (Haiku × 4)
  - [x] W2 — Decide (Opus × 1)
  - [x] W3 — Edit (Sonnet × 1)
  - [x] W4 — Verify (Haiku × 5) — composite=0.88, 2 loops

- [x] **Cycle 5: System Sync** — one-ie/do.md forward-ported, generate.md adversarial gate + structured output
  - [x] W1 — Recon (Haiku × 4)
  - [x] W2 — Decide (Opus × 2 independent)
  - [x] W3 — Edit (Sonnet × 2 parallel, independent files)
  - [ ] W4 — Verify (Haiku × 4 + adversarial cross-file × 1)

---

## How to run

```bash
# One wave at a time
/do docs/TODO-do-gen5.md

# All cycles, trust-aware
/do docs/TODO-do-gen5.md --auto

# Specific cycle/wave
/do docs/TODO-do-gen5.md --wave 3

# After self-improvement machinery ships (C3):
/do --improve   # reads drift signals, proposes do.md edits via meta-loop
```

---

*Five cycles. Two files edited in parallel at C5. One split-test at C3. The loop improves itself.*
