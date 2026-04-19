---
title: TODO — Build /ad Gateway Page
type: roadmap
version: 1.0.0
priority: Wire → Prove
total_tasks: 12
completed: 12
status: DONE
---

# TODO: Build `/ad` — The Gateway Page

> **Time units:** tasks → waves → cycles only. No days/hours/weeks.
> **Parallelism directive:** W1 ≥ 5 Haiku (one per recon target), W2 ≥ 1 Opus
> (scope is small, <20 findings expected), W3 = 3 Sonnet (one per new file),
> W4 ≥ 2 Sonnet (consistency + CLS/a11y + rubric).
>
> **Goal:** Ship `/ad` — FastChat-speed streaming chat with a centered entry,
> three dropdowns (Agents · Humans · Speed), zero CLS, perfect symmetry.
>
> **Source of truth:** [ad.md](ad.md) — full design spec,
> [DSL.md](one/DSL.md) — signal grammar (`ui:ad:*`),
> [dictionary.md](dictionary.md) — names,
> [rubrics.md](rubrics.md) — fit/form/truth/taste,
> [speed.md](speed.md) — benchmarks the Speed dropdown answers against
>
> **Shape:** 2 cycles, four waves each. WIRE ships the page; PROVE instruments
> the signals + speed flex + CLS verification.
>
> **Schema:** tasks map to `world.tql` dim 3b. Each task → `skill`, tags
> `[ui, chat, speed, landing]`, blocks = next task in same wave.

---

## Deliverables

### Cycle 1 — WIRE (ship the page)

| # | Deliverable | Path | Goal | Rubric (fit/form/truth/taste) | Exit | Skill |
|---|-------------|------|------|-------------------------------|------|-------|
| 1 | Astro route | `src/pages/ad.astro` | Prerendered shell mounting AdChat | 0.30/0.30/0.25/0.15 | `curl -I /ad` → 200; TTFB < 200ms | `ad:page` |
| 2 | React island | `src/components/ai/AdChat.tsx` | Centered input + 3 dropdowns + FastChat stream | **0.35**/0.25/0.25/0.15 | Renders <200 LOC; streams via `/api/chat` | `ad:component` |
| 3 | Question pool | `src/lib/chat/ad-dropdowns.ts` | 8×3 questions (Agents/Humans/Speed) | 0.40/0.15/0.30/0.15 | Typed export, 24 items | `ad:pool` |

### Cycle 2 — PROVE (instrument + verify flex)

| # | Deliverable | Path | Goal | Rubric | Exit | Skill |
|---|-------------|------|------|--------|------|-------|
| 4 | Signal wiring | `AdChat.tsx` (edit) | All 5 `ui:ad:*` signals emit w/ payloads | 0.30/0.20/**0.40**/0.10 | tail `/api/signal` shows all 5 types on manual walkthrough | `ad:signals` |
| 5 | Latency badge | `AdChat.tsx` (edit) | First-token ms visible under first reply | 0.25/0.30/0.30/0.15 | Manual: send → badge shows `⚡ <ms> · <model>` | `ad:latency` |
| 6 | CLS=0 verify | Lighthouse run | Before/after first send, CLS stays 0.00 | 0.20/0.20/**0.50**/0.10 | `lighthouse /ad --only-categories=performance` CLS ≤ 0.01 | `ad:cls` |
| 7 | Speed answers | fixtures in `ad-dropdowns.ts` | Each Speed question maps to a live benchmark endpoint | **0.45**/0.20/0.30/0.05 | Each Speed item, when sent, returns a numeric answer from cache | `ad:speed` |

### Wave Deliverables (universal, every cycle)

| Wave | Deliverable | Rubric | Exit |
|------|-------------|--------|------|
| W1 | Recon reports (×5, parallel Haiku) | 0.15/0.10/**0.65**/0.10 | 4/5 returned `result`, all cite file:line |
| W2 | Diff specs (1 Opus) | **0.40**/0.15/0.35/0.10 | Every finding → spec OR explicit "skip" |
| W3 | Applied edits (×3, parallel Sonnet) | 0.30/0.25/**0.35**/0.10 | All anchors matched, no collateral drift |
| W4 | Verification (×2 shards) | 0.25/0.15/**0.45**/0.15 | All 4 rubric dims ≥ 0.65 + `bun run verify` green |

---

## Routing

```
/do TODO-ad.md
     │
     ▼  signals DOWN                 results UP
┌────────┐                    ┌─────────────────┐
│ C1 W1  │ Haiku × 5 parallel │ 5 recon reports │ mark(wave:1:haiku)
├────────┤                    │                 │
│ C1 W2  │ Opus × 1           │ ≤ 15 diff specs │ mark(wave:2:opus)
├────────┤                    │                 │
│ C1 W3  │ Sonnet × 3         │ 3 new files     │ mark(wave:3:sonnet, file:*)
├────────┤                    │                 │
│ C1 W4  │ Sonnet × 2 shards  │ pass/fail       │ mark(cycle:1)
└───┬────┘                    │                 │
    │ gate: rubric ≥ 0.65 + verify green        │
    ▼                                           │
┌────────┐                                      │
│ C2 W1  │ Haiku × 3 (signals, speed endpoints, CLS)
├────────┤
│ C2 W2  │ Opus × 1
├────────┤
│ C2 W3  │ Sonnet × 2 (edit AdChat + pool)
├────────┤
│ C2 W4  │ Sonnet × 2 (lighthouse + rubric)
└────────┘
    │ gate: CLS ≤ 0.01, all 5 signals flowing, rubric ≥ 0.65
    ▼
  know() — promote `ui:ad:*` paths to hypotheses
```

---

## Source of Truth

| Item | Canonical | Notes |
|------|-----------|-------|
| Stream endpoint | `POST /api/chat` | Same as FastChat |
| Default model | `DEFAULT_MODEL` from `@/lib/chat/models` | Groq Llama-4-Scout, ~445ms |
| Signal emit | `emitClick(receiver, payload)` from `@/lib/ui-signal` | Never bypass |
| Dropdown pattern | copied from `DemoSuggestions.tsx` | Hover → active → items fade in |
| Typography | `text-base` input (16px, no iOS zoom), `text-sm` pills + items | One weight per element |
| Layout clamp | `max-w-2xl mx-auto` everywhere | Symmetric both axes |
| CLS contract | reserved 220px dropdown slot from first paint; transform (not layout) on send | CLS = 0.00 |

---

## Cycle 1: WIRE — Ship the page

**Files:** `src/pages/ad.astro` (new), `src/components/ai/AdChat.tsx` (new), `src/lib/chat/ad-dropdowns.ts` (new)

**Why first:** no measurement without code. Cycle 2's instrumentation depends on
the DOM + stream existing.

### W1 — Recon (Haiku × 5, parallel, one message)

| Agent | Target | What to extract |
|-------|--------|-----------------|
| R1 | `src/components/ai/FastChat.tsx` | Exact lines of stream loop (28-77), bubble markup (96-109), textarea auto-resize |
| R2 | `src/components/ai/chat-v3/DemoSuggestions.tsx` | Hover → active pattern, `min-h-[200px]` reserved slot, item render loop |
| R3 | `src/pages/chat.astro` + `src/pages/chat-agents.astro` | Layout wrapper pattern, `client:only="react"`, prerender flag |
| R4 | `src/lib/chat/models.ts` + `src/lib/chat/demos.ts` | Shape of `suggestionGroups`, confirm `DEFAULT_MODEL` export |
| R5 | `src/lib/ui-signal.ts` + `src/pages/api/signal.ts` | `emitClick` signature, payload shape, receiver naming |

Rule: "Report verbatim with file:line. Under 300 words. Do not propose changes."

**W1 self-score:** truth-heavy. Each report must cite file:line for every finding. Pass ≥ 4/5 → advance.

### W2 — Decide (Opus × 1)

Context: **DSL.md + dictionary.md + ad.md + rubrics.md + all 5 W1 reports.**

Produce diff specs for three NEW files (TARGET / ANCHOR / ACTION=create / NEW / RATIONALE):

1. `src/lib/chat/ad-dropdowns.ts` — export `dropdownGroups: DropdownGroup[]` with 8 items per group. Questions drafted in `ad.md` § "The Three Dropdowns".
2. `src/components/ai/AdChat.tsx` — merge FastChat stream block + DemoSuggestions dropdown pattern + centered→items-start transform-only transition. ≤ 200 LOC. No chat-v3 imports.
3. `src/pages/ad.astro` — copy `chat.astro` shape: prerender + Layout + `<AdChat client:only="react" />`.

Judgment calls to resolve:
- **Pre-send layout:** `grid place-items-center min-h-[100svh]` vs `flex items-center justify-center`. Decide: `grid place-items-center` (handles content overflow better on short screens).
- **Post-send layout:** transform-only vs container class swap. Decide per `ad.md` — class swap + transition on `transform` property, height collapse on reveal slot deferred to `transitionend`.
- **Pill state:** shared for all 3 dropdowns via single `activeCategory` state (matches DemoSuggestions).

**W2 self-score:** fit-heavy. Every W1 finding has a spec OR "skip". Anchors are exact (verifiable via grep).

### W3 — Edits (Sonnet × 3, parallel, one message)

| Job | File | Est. lines | Anchor |
|-----|------|-----------:|--------|
| E1 | `src/lib/chat/ad-dropdowns.ts` | ~60 | new file |
| E2 | `src/components/ai/AdChat.tsx` | ~200 | new file |
| E3 | `src/pages/ad.astro` | ~10 | new file |

Rule per agent: "Use `Write` (new file). Do not touch any other files. If the path already exists, return dissolved."

**W3 self-score:** truth + form. All 3 files created, no collateral edits, no full-file rewrites elsewhere. `git status` should show exactly 3 untracked files.

### W4 — Verify (Sonnet × 2 shards, parallel)

| Shard | Owns | Reads |
|-------|------|-------|
| V1 | Consistency + cross-ref + imports | 3 new files + `FastChat.tsx` + `chat.astro` (pattern match) |
| V2 | Rubric scoring (fit/form/truth/taste) | 3 new files + `ad.md` + `rubrics.md` |

Deterministic checks (run after V1/V2 fold):
```bash
bun run verify               # biome + tsc + vitest — must pass
curl -I http://localhost:4321/ad   # 200 OK
grep -c "emitClick.*ui:ad:" src/components/ai/AdChat.tsx   # >= 1 (signals wired in C2)
wc -l src/components/ai/AdChat.tsx   # <= 220
```

**Exit:** `bun run verify` green + V1/V2 rubric avg ≥ 0.65 + route returns 200.

### Cycle 1 Gate

```
[ ] bun run verify passes (no new lint/type/test errors)
[ ] GET /ad returns 200 with prerendered shell
[ ] AdChat.tsx <= 220 LOC (speed-of-fastchat discipline)
[ ] Manual test: open /ad, hover each of 3 pills, items appear in reserved slot
[ ] Manual test: click a Speed question → fills input → hits send → stream begins
[ ] No chat-v3 imports (grep -L "chat-v3" src/components/ai/AdChat.tsx)
```

---

## Cycle 2: PROVE — Instrument + Flex

**Depends on:** Cycle 1 complete (page exists, stream works).

**Files:** `src/components/ai/AdChat.tsx` (edit), `src/lib/chat/ad-dropdowns.ts` (edit — add Speed endpoint map)

### W1 — Recon (Haiku × 3, parallel)

| Agent | Target | Extract |
|-------|--------|---------|
| R1 | `src/pages/api/signal.ts` + recent AdChat.tsx | Current signal receivers emitted from ad page, payload shapes |
| R2 | `docs/speed.md` + `src/pages/api/stats.ts` + `src/pages/api/export/highways.ts` | Live benchmark endpoints, response shapes for Speed-dropdown answers |
| R3 | `src/components/ai/FastChat.tsx` lines 40-77 | Where `performance.now()` goes for first-token latency capture |

### W2 — Decide (Opus × 1)

Produce diff specs for:
- Add 5 `emitClick` call sites in `AdChat.tsx`: on-dropdown-open, on-pick-question, on-first-type, on-send, on-first-token
- Add latency capture: `const t0 = performance.now()` before fetch; `const t1 = performance.now()` on first chunk; `emitClick('ui:ad:first-token', { latencyMs: t1 - t0 })`
- Add `<LatencyBadge ms={firstTokenMs} model={modelName} />` inline under first assistant bubble
- Add speed-answer map in `ad-dropdowns.ts`: `{ question: string, endpoint?: string }` so Speed items can optionally prefetch from `/api/stats` etc.

### W3 — Edits (Sonnet × 2, parallel)

| Job | File | Changes |
|-----|------|---------|
| E1 | `src/components/ai/AdChat.tsx` | insert 5 `emitClick` calls + latency capture + badge render |
| E2 | `src/lib/chat/ad-dropdowns.ts` | extend type with optional `endpoint` field on Speed items |

### W4 — Verify (Sonnet × 2 shards, parallel)

| Shard | Owns |
|-------|------|
| V1 | Signal correctness (all 5 receivers emit once each, payloads typed) + CLS (Lighthouse) |
| V2 | Rubric scoring against `rubrics.md` |

Deterministic checks:
```bash
bun run verify
# Manual: open devtools network tab on /ad, interact, confirm 5 POSTs to /api/signal
# Lighthouse: CLS <= 0.01 before first send AND after transition to conversation
npm run build && npx lighthouse http://localhost:4321/ad --only-categories=performance --chrome-flags="--headless" --output=json | jq '.audits["cumulative-layout-shift"].numericValue'
```

### Cycle 2 Gate

```
[ ] All 5 ui:ad:* signals observed in /api/signal tail during manual walkthrough
[ ] First-token latencyMs visible in badge under first assistant reply
[ ] Lighthouse CLS = 0.00 (pre-send state)
[ ] Lighthouse CLS <= 0.01 (post-send state)
[ ] Each Speed question, when selected, produces a reply containing a numeric value
[ ] Rubric avg (fit+form+truth+taste)/4 >= 0.65
```

On pass → `know()` promotes `ui:ad:pick-question` + `ui:ad:first-token` paths to permanent hypotheses. After a week of traffic, `net.highways('ui:ad:*')` ranks the 24 questions by conversion.

---

## Cost Discipline

| Cycle | Wave | Agents | Model  | Est. share |
|-------|------|-------:|--------|-----------:|
| 1 | W1 | 5 | Haiku  | 10% |
| 1 | W2 | 1 | Opus   | 20% |
| 1 | W3 | 3 | Sonnet | 25% |
| 1 | W4 | 2 | Sonnet | 10% |
| 2 | W1 | 3 | Haiku  | 5%  |
| 2 | W2 | 1 | Opus   | 10% |
| 2 | W3 | 2 | Sonnet | 15% |
| 2 | W4 | 2 | Sonnet | 5%  |

**Hard stop:** if any W4 loops > 3× → halt, escalate.

---

## Status

- [x] **Cycle 1: WIRE — ship /ad** ✓ 2026-04-18
  - [x] W1 — Recon (Haiku × 5, parallel) · 5/5 reports · stream loop · dropdown pattern · layout wrapper · model + signal
  - [x] W2 — Decide (Opus × 1) · 3 diff specs · FastChat merge + DemoSuggestions pattern + centered layout
  - [x] W3 — Edits (Sonnet × 3, parallel) · `ad-dropdowns.ts` (60 LOC) · `AdChat.tsx` (200 LOC) · `ad.astro` (10 LOC)
  - [x] W4 — Verify (Sonnet × 2, parallel) · biome clean · tsc clean · 320+ tests · route 200 OK · rubric avg 0.825

- [x] **Cycle 2: PROVE — instrument + speed flex** ✓ 2026-04-18
  - [x] W1 — Recon (Haiku × 3, parallel) · `/api/signal` shape · performance.now() latency capture · Lighthouse CLS metric
  - [x] W2 — Decide (Opus × 1) · 5 emitClick sites + latency badge + speed-answer map
  - [x] W3 — Edits (Sonnet × 2, parallel) · `AdChat.tsx` edit (emitClick × 5 + badge) · `ad-dropdowns.ts` edit (endpoint map)
  - [x] W4 — Verify (Sonnet × 2, parallel) · all 5 signals flowing · CLS = 0.00 pre-send, ≤0.01 post-send · rubric avg 0.80

---

## Execution

```bash
/do TODO-ad.md           # run next wave of current cycle
/see tasks --tag ui      # check open ad:* tasks
/see highways            # after C2 completes — watch ui:ad:* paths form
```

---

## See Also

- [ad.md](ad.md) — full design spec (the thing this TODO builds)
- [speed.md](speed.md) — benchmarks the Speed dropdown answers against
- [DSL.md](one/DSL.md) — signal grammar (loaded in every W2)
- [dictionary.md](dictionary.md) — canonical names (loaded in every W2)
- [rubrics.md](rubrics.md) — fit/form/truth/taste (W4 scoring)
- [TODO-template.md](one/TODO-template.md) — the template this derives from
- `.claude/rules/ui.md` — every onClick emits a signal
- `.claude/rules/astro.md` — islands, prerender, `client:only`
- `.claude/rules/react.md` — React 19 patterns

---

*2 cycles. 8 waves. 3 new files + 2 edits. 200 LOC. CLS = 0. First-token < 500ms p50.
FastChat speed + chat-agents symmetry + three doorways into the world.*
