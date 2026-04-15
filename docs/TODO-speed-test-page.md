---
title: TODO Speed Test Page
type: roadmap
version: 1.0.0
priority: Wire → Prove → Grow
total_tasks: 24
completed: 0
status: ACTIVE
---

# TODO: Speed Test Page — `/speed`

> **Time units:** plan in **tasks → waves → cycles** only. Never days, hours,
> weeks, or sprints. Width = tasks-per-wave. Depth = waves-per-cycle. Learning
> = cycles-per-path. (See `.claude/rules/engine.md` → The Three Locked Rules.)
>
> **Parallelism directive (read first):** **Maximize agents per wave.** W1 ≥ 4
> Haiku in a single message, one per read target. W2 ≥ 2 Opus shards when
> findings > ~20. W3 = one Sonnet per file. W4 ≥ 2 Sonnet verifiers by check type.
>
> **Goal:** A visitor clicks "Send a signal" and watches one real signal travel
> through 9 stops — click → edge → route → sandwich → LLM → mark → loops →
> highway → harden — with live timings at every step, teaching how ONE works
> by showing it happen.
>
> **Source of truth:** [speed-page.md](speed-page.md) — build spec, component
> inventory, 9-stop journey script, data wiring, rubric targets,
> [speed.md](speed.md) — every timing budget,
> [dictionary.md](dictionary.md) — every word shown on screen (closed set),
> [routing.md](routing.md) — deterministic sandwich shown in stop 3,
> [lifecycle.md](lifecycle.md) — stage ordering the journey follows,
> [metaphors.md](metaphors.md) — skin switcher vocabulary mapping,
> [DSL.md](DSL.md) — signal grammar,
> [rubrics.md](rubrics.md) — quality scoring (fit/form/truth/taste → mark)
>
> **Shape:** 3 cycles. Cycle 1 wires the shell + API. Cycle 2 proves content
> and live data. Cycle 3 grows personas, skin switcher, speed modes, bundle audit.
>
> **Schema:** Tasks map to `world.tql` dimension 3b — `task` entity.
> Each task creates a matching `skill` for capability routing.

## Deliverables

### Wave Deliverables (universal — every cycle emits these four)

| Wave | Deliverable | Goal | Rubric weights (fit/form/truth/taste) | Exit condition |
|------|-------------|------|--------------------------------------|----------------|
| **W1** | Recon report (N parallel) | Inventory truth on disk — findings with line numbers, verbatim | 0.15 / 0.10 / **0.65** / 0.10 | ≥ (N-1)/N agents returned `result`; every finding cites file:line |
| **W2** | Diff spec set | Decide every finding → `{anchor, action, new, rationale}`; resolve shard conflicts | **0.40** / 0.15 / **0.35** / 0.10 | Every W1 finding has a spec OR an explicit "keep" rationale |
| **W3** | Applied edits (M parallel) | Transform diff specs into real file changes without collateral drift | 0.30 / 0.25 / **0.35** / 0.10 | All anchors matched; zero files modified outside the spec set |
| **W4** | Verification report | Prove cycle is clean: rubric ≥ 0.65, tests green, lint clean, types clean | 0.25 / 0.15 / **0.45** / 0.15 | All 4 rubric dims ≥ 0.65 AND `bun run verify` green |

### Cycle Deliverables

```
DELIVERABLE: speed page shell
PATH:        src/pages/speed.astro + src/components/speed/*.tsx
GOAL:        Renders the 9-stop SignalStrip structure statically; no 404
CONSUMERS:   Visitors, CI smoke test
RUBRIC:      fit=0.35 form=0.25 truth=0.25 taste=0.15
EXIT:        curl localhost:4321/speed → 200; SignalStrip renders
SKILL:       ui:speed:shell

DELIVERABLE: journey API endpoint
PATH:        src/pages/api/speed/journey.ts
GOAL:        POST nonce → streams WS events for each sandwich layer with timings
CONSUMERS:   Stop 0 button, SignalStrip subscriber
RUBRIC:      fit=0.30 form=0.20 truth=0.40 taste=0.10
EXIT:        curl -X POST localhost:4321/api/speed/journey → SSE events received
SKILL:       api:speed:journey

DELIVERABLE: 9 live stops
PATH:        src/components/speed/Stop*.tsx
GOAL:        Each stop shows live number + code block + copy button + vocab
CONSUMERS:   builder, CEO, skeptic visitors
RUBRIC:      fit=0.35 form=0.25 truth=0.30 taste=0.10
EXIT:        all 9 stops render without errors; every word ∈ dictionary.md (grep check)
SKILL:       ui:speed:stops

DELIVERABLE: skin switcher + speed modes
PATH:        src/components/speed/SkinSwitcher.tsx
GOAL:        ?skin=ant|brain|team|signal relabels without changing mechanics
CONSUMERS:   ant (children), brain (CTOs), team (CEOs), signal (builders)
RUBRIC:      fit=0.30 form=0.25 truth=0.30 taste=0.15
EXIT:        ?skin=ant renders "trail" not "path"; ?speed=0.1 slows animation 10×
SKILL:       ui:speed:skin
```

## Routing

```
    signal DOWN                     result UP            feedback UP
    ──────────                      ─────────            ───────────
    /do TODO-speed-test-page.md     result + 4 tagged    tagged strength
         │                          marks                signal → substrate
         ▼                               │                    ▲
    ┌─────────┐                          │                    │
    │  W1     │  Haiku recon ────────────┤ mark(edge:fit)     │
    │  read   │  → report verbatim       │ mark(edge:form)    │
    └────┬────┘                          │ mark(edge:truth)   │
         │ context grows                 │ mark(edge:taste)   │
         ▼                               │ weak dim?          │
    ┌─────────┐                          │   → specialist     │
    │  W2     │  Opus decide             │   signal           │
    │  fold   │  → diff specs            │                    │
    └────┬────┘                          │                    │
         │ context grows                 │                    │
         ▼                               │                    │
    ┌─────────┐                          │                    │
    │  W3     │  Sonnet edit             │                    │
    │  apply  │  → code changes          │                    │
    └────┬────┘                          │                    │
         │                               │                    │
         ▼                               │                    │
    ┌─────────┐                          │                    │
    │  W4     │  Sonnet verify ──────────┘                    │
    │  score  │  → rubric: fit/form/truth/taste               │
    │         │  → feedback signal ─────────────────────────►─┘
    └─────────┘
```

## Testing — The Deterministic Sandwich Around Waves

```
    PRE (before W1)                    POST (after W4)
    ───────────────                    ────────────────
    bun run verify                     bun run verify
    ├── biome check .                  ├── biome check .
    ├── tsc --noEmit                   ├── tsc --noEmit
    └── vitest run                     └── vitest run + new tests
```

### W0 — Baseline (before every cycle)

```bash
bun run verify
```

Record: tests pass/total, known flaky list, bundle size at `dist/_worker.js`.

---

```
   CYCLE 1: WIRE           CYCLE 2: PROVE          CYCLE 3: GROW
   Shell + API             Live data + 9 stops     Personas + polish
   ─────────────────       ──────────────────       ─────────────────
   ~6 files, ~8 edits      ~9 files, ~18 edits      ~5 files, ~10 edits
        │                        │                        │
        ▼                        ▼                        ▼
   ┌─W1─W2─W3─W4─┐        ┌─W1─W2─W3─W4─┐        ┌─W1─W2─W3─W4─┐
   │ H   O  S  S  │  ──►   │ H   O  S  S  │  ──►   │ H   O  S  S  │
   └──────────────┘        └──────────────┘        └──────────────┘
```

---

## How Loops Drive This Roadmap

| Cycle | What changes | Loops activated |
|-------|-------------|-----------------|
| **WIRE** | Astro page + API shell + component stubs render | L1 (signal), L2 (path marking), L3 (fade) |
| **PROVE** | Live data flows: sandwich timings, mark() before/after, loops panel | L4 (economic) joins L1-L3 |
| **GROW** | Skin switcher, speed modes, 3-persona complete journey | L5-L7 (evolution, learning, frontier) join L1-L4 |

---

## The Wave Pattern (every cycle runs this)

```
WAVE 1 (Haiku x N ≥ 4, parallel)   read — one target per agent
WAVE 2 (Opus, sharded if > 20)      decide — diff specs per finding
WAVE 3 (Sonnet x M, parallel)       edit — one agent per file
WAVE 4 (Sonnet x K ≥ 2, parallel)   verify — sharded by check type
```

---

## Cycle 1: WIRE — Shell + API

**Goal:** `/speed` loads without 404, `SignalStrip` renders all 9 stop labels,
`/api/speed/journey` endpoint exists and returns SSE events, `SpeedtestDashboard`
at `/speedtest` still works (no regression).

**Files:**
- `src/pages/speed.astro` (new)
- `src/components/speed/SignalStrip.tsx` (new)
- `src/components/speed/Stop.tsx` (new — generic stop shell)
- `src/components/speed/SpeedJourney.tsx` (new — orchestrator)
- `src/pages/api/speed/journey.ts` (new)
- `src/pages/speedtest.astro` (existing — keep, add nav link to /speed)

**Why first:** Shell must exist before content can be layered in. API endpoint
must be wired before stops can show live data.

### Cycle 1 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit | Skill |
|---|-------------|------|-------------------------------|------|-------|
| 1 | `/speed` page | Renders 9-stop SignalStrip with stop labels | 0.35/0.25/0.25/0.15 | `curl localhost:4321/speed → 200` | `ui:speed:shell` |
| 2 | `POST /api/speed/journey` | Accepts nonce, streams SSE events with layer names | 0.30/0.20/0.40/0.10 | `curl -X POST localhost:4321/api/speed/journey → events stream` | `api:speed:journey` |
| 3 | `SignalStrip` component | Renders outbound + return stops, advances on events | 0.30/0.30/0.25/0.15 | Strip renders; step 0 active by default | `ui:speed:strip` |

**Wave-level deliverables this cycle:**
- W1 recon covers: existing `/speedtest` page, `SpeedtestDashboard`, existing API endpoints, WS hook pattern, and `speed-page.md` component inventory
- W2 diff specs must reference `speed-page.md` for component names and `routing.md` for sandwich logic
- W3 touches exactly the 6 files in the table above
- W4 verification includes: `bun run verify` + curl `/speed` + curl `/api/speed/journey`

---

### Wave 1 — Recon (parallel Haiku x 5)

Spawn **all 5 agents in a single message** — never loop.

| Agent | File/Target | What to look for |
|-------|-------------|-----------------|
| R1 | `src/pages/speedtest.astro` + `SpeedtestDashboard.tsx` | Existing page structure, imports, component API |
| R2 | `src/hooks/useTaskWebSocket.ts` | WS pattern to reuse for live signal events |
| R3 | `src/pages/api/` (list all) | Existing endpoints that stops 1–8 need; flag missing ones |
| R4 | `docs/speed-page.md` §Component Inventory + §Data Wiring | Reuse vs new decision inputs |
| R5 | `src/pages/CLAUDE.md` + `src/components/CLAUDE.md` | Pattern rules for new page + components |

**Outcome model:** `result` = report in. `timeout` = re-spawn once. `dissolved` = file missing, drop.

---

### Wave 2 — Decide (Opus)

**Context loaded:** DSL.md + dictionary.md + speed-page.md + routing.md.

For each W1 finding, decide act/keep/skip. Key decisions for Cycle 1:

1. Does `SpeedtestDashboard` survive unchanged at `/speedtest`, or is it migrated into `/speed`? (Answer from spec: keep both — `/speedtest` is raw benchmarks, `/speed` is the journey)
2. Which WS hook pattern from `useTaskWebSocket.ts` carries into the journey subscribe?
3. Does `POST /api/speed/journey` use SSE or WS? (Spec says SSE stream of events)
4. Component file structure: `src/components/speed/` (new dir) or `src/components/speedtest/`?

**Output format:** TARGET / ANCHOR / ACTION / NEW / RATIONALE per edit.

---

### Wave 3 — Edits (parallel Sonnet x 6, one per file)

| Job | File | Est. edits |
|-----|------|-----------|
| E1 | `src/pages/speed.astro` (create) | ~30 lines — Astro shell, import SpeedJourney, prerender=true |
| E2 | `src/components/speed/SignalStrip.tsx` (create) | ~90 lines — stop labels, progress indicator, outbound + return |
| E3 | `src/components/speed/Stop.tsx` (create) | ~60 lines — generic stop shell: title, vocab[], liveNumber, code, children |
| E4 | `src/components/speed/SpeedJourney.tsx` (create) | ~80 lines — orchestrates stops, subscribes to journey SSE |
| E5 | `src/pages/api/speed/journey.ts` (create) | ~60 lines — POST handler, routes demo signal, streams layer events |
| E6 | `src/pages/speedtest.astro` (edit) | ~3 lines — add nav link to /speed |

---

### Wave 4 — Verify (parallel Sonnet x 3)

| Shard | Owns | Reads |
|-------|------|-------|
| V1 | Consistency (imports, types, TypeScript) | all 6 touched files |
| V2 | Integration (does journey POST actually emit events the strip consumes?) | journey.ts + SpeedJourney.tsx + SignalStrip.tsx |
| V3 | Rubric + test gate | `bun run verify`, curl /speed, curl /api/speed/journey |

**Self-checkoff:** If W4 clean → mark Cycle 1 done, update checkbox, emit loop:feedback.

### Cycle 1 Gate

```bash
bun run verify
curl localhost:4321/speed              # → 200, SignalStrip renders
curl -X POST localhost:4321/api/speed/journey -d '{"nonce":"test-1"}' # → SSE events
```

```
  [ ] /speed returns 200 with SignalStrip
  [ ] /api/speed/journey POST returns SSE event stream
  [ ] /speedtest still works (no regression)
  [ ] bun run verify green
```

---

## Cycle 2: PROVE — Live Data + 9 Stops

**Goal:** All 9 stops render with live numbers from real endpoints. Every
on-screen number is either from a live API call or cites a `speed.md` entry.
Every on-screen word is in `dictionary.md`. `SandwichStack` and `PathAnimator`
components built and wired. Stop 5 shows mark() before/after for the demo signal.

**Depends on:** Cycle 1 complete (shell + API exist).

**Files:**
- `src/components/speed/SandwichStack.tsx` (new)
- `src/components/speed/PathAnimator.tsx` (new)
- `src/components/speed/LoopsPanel.tsx` (new)
- `src/components/speed/RunItBlock.tsx` (new)
- `src/pages/api/speed/journey.ts` (edit — add per-layer timings)
- `src/components/speed/Stop*.tsx` (edit — fill in all 9 stops with real content)
- `src/engine/loop.ts` (edit if needed — emit loop:L1:tick..L7:tick ws events)

**Why second:** Content requires the shell from Cycle 1. Live data requires
knowing which endpoints exist (inventory from Cycle 1 W1).

### Cycle 2 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit | Skill |
|---|-------------|------|-------------------------------|------|-------|
| 1 | 9 filled stops | Every stop: live number, copy block, vocab list | 0.35/0.25/0.30/0.10 | dictionary grep: 0 non-canonical words on /speed | `ui:speed:stops` |
| 2 | `SandwichStack` | 5-layer animated stack, signal drops through | 0.30/0.30/0.30/0.10 | Stop 3 renders sandwich layers with measured p50 per layer | `ui:speed:sandwich` |
| 3 | `PathAnimator` | Forward + return trip animation, mark/warn polarity | 0.25/0.30/0.35/0.10 | Stop 5 shows strength before/after for the demo signal's edge | `ui:speed:path` |
| 4 | `LoopsPanel` | 7 rows, per-loop cadence, countdown to next tick | 0.30/0.25/0.30/0.15 | Stop 6 panel: L1+L2 show "fired this session"; L3-L7 show countdowns | `ui:speed:loops` |

---

### Wave 1 — Recon (parallel Haiku x 6)

| Agent | Target | What to look for |
|-------|--------|-----------------|
| R1 | `src/pages/api/tick.ts` | loop lastAtMs/nextAtMs schema for LoopsPanel |
| R2 | `src/pages/api/export/highways.ts` | highways JSON shape for Stop 7 |
| R3 | `gateway/` WS broadcast code | how to add loop:L1:tick events (if missing) |
| R4 | `docs/speed-test-page-text.md` | exact copy + numbers per stop (authoritative) |
| R5 | `docs/speed.md` §Verified Benchmarks | budget table — every live number must cite here |
| R6 | `src/components/speed/` (all files from Cycle 1) | existing shells to fill in |

---

### Wave 2 — Decide (Opus, shard if findings > 20)

**Context loaded:** DSL.md + dictionary.md + speed-page.md + speed.md + speed-test-page-text.md.

Key decisions for Cycle 2:
1. Does `loop.ts` already emit WS tick events, or does W3 add them? (Check gateway broadcast)
2. Does Stop 4 (LLM) actually fire a real LLM call, or use a stub for demo purposes?
3. Which stops need `client:visible` vs `client:load`? (Bundle budget: /speed adds ≤200 KiB gzip)
4. PathAnimator: CSS animation or requestAnimationFrame? (Spec: no heavy libs — CSS preferred)

Lock the 9-stop copy per `speed-test-page-text.md`. Every word must be in `dictionary.md`.

---

### Wave 3 — Edits (parallel Sonnet x 7)

| Job | File | Est. edits |
|-----|------|-----------|
| E1 | `src/components/speed/SandwichStack.tsx` (create) | ~120 lines — 5-layer stack, drop animation, per-layer timing |
| E2 | `src/components/speed/PathAnimator.tsx` (create) | ~100 lines — forward + return pulse, mark/warn polarity |
| E3 | `src/components/speed/LoopsPanel.tsx` (create) | ~150 lines — 7 rows, countdown, WS subscribe to loop ticks |
| E4 | `src/components/speed/RunItBlock.tsx` (create) | ~50 lines — command + copy button + optional live output |
| E5 | `src/pages/api/speed/journey.ts` (edit) | ~30 lines — per-layer timing instrumentation |
| E6 | `src/components/speed/SpeedJourney.tsx` (edit) | ~50 lines — wire 9 stops with real components |
| E7 | `src/engine/loop.ts` (edit, conditional) | ~10 lines — emit loop tick WS events if not present |

---

### Wave 4 — Verify (parallel Sonnet x 4)

| Shard | Owns | Reads |
|-------|------|-------|
| V1 | Dictionary compliance | grep every text string on /speed against docs/dictionary.md |
| V2 | Number provenance | every live number traces to speed.md §Verified Benchmarks or live endpoint |
| V3 | Performance | Lighthouse run, bundle delta check (≤200 KiB gzip added), TTFB <200ms |
| V4 | Rubric scoring | fit/form/truth/taste per rubrics.md, mark via /api/loop/mark-dims |

### Cycle 2 Gate

```bash
bun run verify
# Dictionary compliance:
grep -r "signal\|mark\|warn\|fade\|highway\|strength\|resistance" src/components/speed/ \
  | grep -v "dictionary.md"   # zero unknowns
# Bundle:
du -sh dist/_worker.js        # must not exceed Cycle 1 baseline + 200KiB
```

```
  [ ] All 9 stops render with live numbers
  [ ] Every on-screen word passes dictionary grep
  [ ] Every number traces to speed.md or live endpoint
  [ ] Stop 5 shows mark() before/after delta for demo signal's edge
  [ ] LoopsPanel shows L1+L2 fired; L3-L7 countdown to next tick
  [ ] bun run verify green
  [ ] Bundle delta ≤ 200 KiB gzip
```

---

## Cycle 3: GROW — Personas + Polish

**Goal:** Three visitor paths work end-to-end (builder/CEO/skeptic each complete
their intent in < 30s). `SkinSwitcher` maps `?skin=ant|brain|team|signal`.
Speed modes (`?speed=0.1|50`) compress or slow animation. Deep-link `?step=N`
renders correct stop. Page passes W4 user-test rubric ≥ 0.85 on taste dimension.

**Depends on:** Cycle 2 complete (all 9 stops live).

**Files:**
- `src/components/speed/SkinSwitcher.tsx` (new)
- `src/components/speed/SpeedJourney.tsx` (edit — add speed modes, deep link)
- `src/pages/speed.astro` (edit — SEO meta, og:image, canonical)
- `docs/speed-page.md` (edit — cross-link from speed.md; record final component paths)
- `docs/speed.md` (edit — link to /speed page)

**Why third:** Personas and polish require the content from Cycle 2 to exist first.

### Cycle 3 Deliverables

| # | Deliverable | Goal | Rubric (fit/form/truth/taste) | Exit | Skill |
|---|-------------|------|-------------------------------|------|-------|
| 1 | `SkinSwitcher` | `?skin=ant` renders "trail" not "path"; mechanics identical | 0.35/0.25/0.25/0.15 | `?skin=ant`: "trail", "mark", "dissolve" on screen; `?skin=team`: "workflow", "signal", "route" | `ui:speed:skin` |
| 2 | Speed modes | `?speed=0.1` slows 10×; `?speed=50` compresses to 40ms | 0.25/0.30/0.25/0.20 | CEO watches full journey in < 60s at `?speed=50` | `ui:speed:modes` |
| 3 | Deep link + SEO | `?step=3` opens stop 3; og:image + canonical set | 0.30/0.25/0.25/0.20 | curl /speed?step=3 → stop 3 active; og:image renders | `ui:speed:seo` |
| 4 | Doc cross-links | speed.md links to /speed; speed-page.md updated with final paths | 0.35/0.20/0.35/0.10 | grep "speed" docs/speed.md → "/speed" appears | `docs:speed:xref` |

---

### Wave 1 — Recon (parallel Haiku x 4)

| Agent | Target | What to look for |
|-------|--------|-----------------|
| R1 | `docs/metaphors.md` §skin mapping table | exact label substitutions per skin |
| R2 | `src/components/controls/SkinSwitcher.tsx` (if exists) | reuse pattern for speed page |
| R3 | `src/pages/speed.astro` (from Cycle 2) | what meta/SEO is already set |
| R4 | `docs/speed.md` + `docs/speed-page.md` | gaps in cross-linking, missing /speed refs |

---

### Wave 2 — Decide (Opus)

Key decisions for Cycle 3:
1. Is there an existing `SkinSwitcher` component to reuse, or build fresh? (`>100 LOC saved` rule from spec)
2. Speed mode implementation: CSS `animation-duration` override vs React state + effect?
3. Which og:image to generate — a static PNG of the full stack diagram or dynamic?
4. What doc edits are needed in speed.md to link to /speed page?

---

### Wave 3 — Edits (parallel Sonnet x 5)

| Job | File | Est. edits |
|-----|------|-----------|
| E1 | `src/components/speed/SkinSwitcher.tsx` (create) | ~40 lines — reads ?skin, exports `useLabels()` hook |
| E2 | `src/components/speed/SpeedJourney.tsx` (edit) | ~30 lines — ?speed param → animation-duration, ?step=N → scroll to stop |
| E3 | `src/pages/speed.astro` (edit) | ~10 lines — og:image, canonical, description meta |
| E4 | `docs/speed.md` (edit) | ~5 lines — add /speed link in §Frontend + §Verification Commands |
| E5 | `docs/speed-page.md` (edit) | ~10 lines — update with final component paths + status |

---

### Wave 4 — Verify (parallel Sonnet x 3)

| Shard | Owns | Reads |
|-------|------|-------|
| V1 | 3-persona user test | Builder/CEO/skeptic paths: each completes intent in <30s |
| V2 | Skin + speed modes correctness | ?skin=ant: "trail" visible; ?speed=50: journey <60s |
| V3 | Final rubric + test gate | bun run verify + Lighthouse + markDims(fit,form,truth,taste) |

**Self-checkoff:** all cycles done → POST /api/signal `{receiver:'loop:feedback', data:{tags:['ui','speed','page']}}`.

### Cycle 3 Gate

```bash
bun run verify
# Persona: builder completes stops 0→outro
# Persona: CEO lands at ?step=4 (cost) in <30s
# Persona: skeptic clicks "run it yourself" → copy block
curl localhost:4321/speed?skin=ant      # "trail" visible, not "path"
curl localhost:4321/speed?speed=50      # journey plays fast
curl localhost:4321/speed?step=3        # stop 3 (sandwich) active
```

```
  [ ] Builder persona: stops 0→outro without consulting other pages
  [ ] CEO persona: ?step=4 (cost panel) accessible via deep link
  [ ] Skeptic persona: "run it yourself" curls work
  [ ] ?skin=ant: "trail" label, not "path"
  [ ] ?speed=50: full journey < 60s
  [ ] og:image + canonical set on /speed
  [ ] docs/speed.md links to /speed
  [ ] bun run verify green
  [ ] Lighthouse performance ≥ 85
```

---

## Cost Discipline

| Cycle | Wave | Agents | Model | Est. cost share |
|-------|------|--------|-------|-----------------|
| 1 | W1 | 5 | Haiku | ~5% |
| 1 | W2 | 1 | Opus | ~15% |
| 1 | W3 | 6 | Sonnet | ~20% |
| 1 | W4 | 3 | Sonnet | ~10% |
| 2 | W1 | 6 | Haiku | ~5% |
| 2 | W2 | 1–2 shards | Opus | ~15% |
| 2 | W3 | 7 | Sonnet | ~20% |
| 2 | W4 | 4 | Sonnet | ~5% |
| 3 | W1–W4 | ... | ... | ~5% |

**Hard stop:** if any Wave 4 loops more than 3 times, halt and escalate.

---

## Status

- [ ] **Cycle 1: WIRE** — Shell + API
  - [ ] W0 — Baseline (`bun run verify` green before any edit)
  - [ ] W1 — Recon (Haiku x 5, parallel)
  - [ ] W2 — Decide (Opus)
  - [ ] W3 — Edits (Sonnet x 6, parallel)
  - [ ] W4 — Verify (Sonnet x 3, parallel by check type)
- [ ] **Cycle 2: PROVE** — Live Data + 9 Stops
  - [ ] W0 — Baseline
  - [ ] W1 — Recon (Haiku x 6, parallel)
  - [ ] W2 — Decide (Opus x 1–2 shards)
  - [ ] W3 — Edits (Sonnet x 7, parallel)
  - [ ] W4 — Verify (Sonnet x 4, parallel by check type)
- [ ] **Cycle 3: GROW** — Personas + Polish
  - [ ] W0 — Baseline
  - [ ] W1 — Recon (Haiku x 4, parallel)
  - [ ] W2 — Decide (Opus)
  - [ ] W3 — Edits (Sonnet x 5, parallel)
  - [ ] W4 — Verify (Sonnet x 3, parallel by check type)

---

## Execution

```bash
# Run the next wave of the current cycle
/do TODO-speed-test-page.md

# Check state
/see tasks
/see highways
```

---

## See Also

- [speed-page.md](speed-page.md) — **primary source of truth** — 9-stop journey script, component inventory, data wiring, rubric targets
- [speed-test-page-text.md](speed-test-page-text.md) — ASCII wireframes for every stop (copy-exact text)
- [speed.md](speed.md) — verified benchmark budgets (all live numbers sourced here)
- [dictionary.md](dictionary.md) — canonical names; every word on /speed must pass grep
- [routing.md](routing.md) — deterministic sandwich logic for stop 3
- [lifecycle.md](lifecycle.md) — stage ordering the journey follows
- [metaphors.md](metaphors.md) — skin switcher vocabulary mapping
- [DSL.md](DSL.md) — signal grammar (always loaded in W2)
- [rubrics.md](rubrics.md) — quality scoring: fit/form/truth/taste as tagged edges
- [TODO-template.md](TODO-template.md) — template shape
- [world-map-page.md](world-map-page.md) — sibling build spec (/world page)

---

*3 cycles. Four waves each. Haiku reads, Opus decides, Sonnet writes, Sonnet checks.
Shell first, content second, personas third. One signal, nine stops, two halves —
outbound in milliseconds, return trip across seven loops.*
