---
title: TODO — Signal Shape Alignment (tags + weight + content)
type: roadmap
version: 2.0.0
priority: Wire → Grow
total_tasks: 21
completed: 0
status: ACTIVE
---

# TODO: Signal Shape Alignment

> **Time units:** plan in **tasks → waves → cycles** only. Never days, hours,
> weeks, or sprints. Width = tasks-per-wave. Depth = waves-per-cycle.
> (See `.claude/rules/engine.md` → The Two Locked Rules.)
>
> **Goal:** Every signal in ONE has the same shape: `{ receiver, data }` where
> `data = { tags, weight, content }`. Delivery becomes a mark. Subscription
> becomes tag-matched routing. One primitive, three slots, no broken code.
>
> **Source of truth:** [dictionary.md](dictionary.md) — The Seed (line 9), The
> Weight (line 374), tags are first-class throughout. This TODO names what
> dictionary.md already implies but never wrote down as a rule.
>
> **Also canonical:** [DSL.md](one/DSL.md) — signal grammar,
> [one-ontology.md](one-ontology.md) — Events dimension,
> [rubrics.md](rubrics.md) — tagged-edge marks (already `{tag, weight}`-shaped),
> [naming.md](naming.md) — canonical names.
>
> **Shape:** 3 cycles, four waves each. Haiku reads, Opus decides, Sonnet
> writes, Sonnet checks. Same loop as the substrate, different receivers.
>
> **Schema:** No TypeDB migration needed. `signal` relation (dictionary.md:612)
> already has `data` as JSON. Tags are already `@card(0..)` on Skills/Units.
> This TODO formalizes what's there; it does not add new state.

## The Canonical Shape — Convention inside `data`, not a new type

**The Signal type never changes.** It stays exactly as it is today:

```typescript
// src/engine/world.ts:18 — DO NOT MODIFY
type Signal = { receiver: string; data?: unknown; after?: number }
```

What changes is the **convention** for what goes inside `data`. Every signal's
`data` payload is shaped like this (by convention, not by type):

```
data = { tags, weight, content }
```

- **tags** — `string[]` — classification + routing key (plural; signals can have many)
- **weight** — `number` — pheromone strength; `+` marks, `−` warns, `0`/absent is neutral routing
- **content** — anything — the actual payload (rubric scores, task descriptions, API bodies, markdown, whatever)

**The router already reads this shape.** `world.ts:25` has an internal
`SignalData = { marks?, weight?, [k]?: unknown }` type and the router at
`world.ts:207` does `mark(edge, d.weight ?? 1)`. We extend that reader to also
honour `d.tags`, and document `d.content` as the canonical name for "everything
else". No public type change. No breaking change. `data: unknown` remains the
escape hatch; LLM output, JSON from the wire, legacy payloads all still flow.

### Why this is the simplest shape

- **No TypeScript migration.** `Signal` type is untouched. 51 call sites keep working.
- **Already half-shipped.** `weight` and `marks` are already read by the router (DSL.md:301-319 documents them).
- **Rubric scoring fits natively.** `markDims()` emits four signals, each with `data.tags = ['fit'|'form'|'truth'|'taste']` and `data.weight = score`. `content` can carry the score breakdown, violations, notes — anything useful.
- **Tasks fit natively.** A task is a signal: `data.tags = ['engine', 'build', 'P0']`, `data.weight = priority`, `data.content = {name, exit, blocks}`. No task entity gymnastics.
- **Subscription is tag-match.** `unit.subscribe(['engine', 'P0'])` receives every signal whose `data.tags` intersects — existing `world:skill+P0` addressing (DSL.md:289-294) already does this; we just name it.
- **Scheduling stays top-level.** `Signal.after` remains where it is. It's a routing directive, not part of the payload.

### Three roles, not three slots

The shape is a **convention**, not a schema. If a signal carries only `content`
(no tags, no weight), it still works — it's a plain payload delivery with
default weight 1. If it carries only `weight` (no content, no tags), it's a
pure mark. If it carries only `tags`, it's a classification beacon. All
combinations are legal. Missing fields default:

| Field | Default when missing | Meaning |
|-------|---------------------|---------|
| `tags` | `[]` | Untagged — routed by receiver only |
| `weight` | `1` (on delivery) or `0` (on observation) | Normal pheromone mark |
| `content` | `undefined` | No payload (signal is routing/marking, not data transport) |

## Routing

```
    signal DOWN                       mark UP
    ──────────                        ───────
    signal({receiver, data:{          weight on receiver's path
      tags, weight, content           weak dims fan out to coaches
    }})
         │                                 │
         ▼                                 │
    ┌─────────┐                            │
    │  W1     │  Haiku recon ──────────────┤ mark(edge:fit, score)
    │  read   │  read canonical docs       │ mark(edge:form, score)
    └────┬────┘                            │ mark(edge:truth, score)
         │                                 │ mark(edge:taste, score)
         ▼                                 │
    ┌─────────┐                            │
    │  W2     │  Opus decide               │ weak dim?
    │  fold   │  produce diff specs        │   → fan out to specialist
    └────┬────┘                            │
         │                                 │
         ▼                                 │
    ┌─────────┐                            │
    │  W3     │  Sonnet edit               │
    │  apply  │  (docs or code)            │
    └────┬────┘                            │
         │                                 │
         ▼                                 │
    ┌─────────┐                            │
    │  W4     │  Sonnet verify ────────────┘
    │  score  │  bun run verify + consistency
    └─────────┘
```

**The signal itself demonstrates the pattern.** Every edit in this TODO emits a
signal with `tags` (which doc/file it touches), `weight` (rubric score), and
`content` (the diff spec). Self-describing.

## Testing — The Deterministic Sandwich

```
PRE (before W1)                   POST (after W4)
───────────────                   ────────────────
bun run verify                    bun run verify
├── biome check .                 ├── biome check .     (no new lint)
├── tsc --noEmit                  ├── tsc --noEmit      (no new type errors)
└── vitest run                    └── vitest run        (no regressions)

BASELINE = 326/326 green         Cycle gate: still green
```

**Cycle 1 (docs only)** must not change any test count or tsc diagnostic. If
baseline is 326, post-C1 is 326 — docs-only cycles are non-regressable.

**Cycle 2 (type narrowing)** must keep 326/326. New type constraints may
surface latent misuse; fix call sites rather than widening the type back.

**Cycle 3 (subscribe verb)** adds new tests for the subscribe semantics.
Expect `326 → 326 + N_new`, all green.

---

## Source of Truth

**[dictionary.md](dictionary.md)** — The Seed (line 9), The Weight (line 374),
Events (line 612). Already names `receiver`, `data`, `weight`, `tags`.
**[DSL.md](one/DSL.md)** — signal grammar, `{ receiver, data }`, mark/warn/fade.
**[one-ontology.md](one-ontology.md)** — Events dimension (5): signal relation.
**[rubrics.md](rubrics.md)** — already emits `{tag, weight}` pairs via `markDims()`.
**[engine.md](../.claude/rules/engine.md)** — The Three Locked Rules.

| Concept | Canonical name | Where |
|---------|---------------|-------|
| The primitive | Signal | dictionary.md: The Seed |
| Who gets it | receiver | dictionary.md:17 |
| The payload shape | data | dictionary.md:18 |
| Classification | tags | dictionary.md: The Name + `tag @card(0..)` |
| Magnitude | weight | dictionary.md: The Weight (line 374) |
| The payload itself | content | (new — names what was unstructured) |
| Positive deposit | mark / weight > 0 | The Six Verbs (line 298) |
| Negative deposit | warn / weight < 0 | The Six Verbs |
| Tag-matched routing | subscribe | (new — promotes existing tag-match) |

---

## Cycle 1: WIRE — Docs Alignment

**Files:** `docs/dictionary.md`, `docs/DSL.md`, `docs/naming.md`,
`docs/one-ontology.md`, `.claude/rules/engine.md`, `CLAUDE.md`.

**Why first:** Docs are the training data. Teach the shape once in the
canonical docs, every future wave lands aligned. Zero code touched,
zero test risk. This is the docs-first leverage move.

**No code changes in C1.** `bun run verify` before = `bun run verify` after.

### Wave 1 — Recon (parallel Haiku × 5)

Spawn 5 agents in one message. Each reads one canonical doc and reports
how it currently describes `data`, `tags`, `weight`, and whether the
three-slot shape is named anywhere.

**Hard rule:** "Report verbatim. Do not propose changes. Under 300 words."

| Agent | File | What to look for |
|-------|------|-----------------|
| R1 | `docs/dictionary.md` | Sections: The Seed, The Name, The Weight, Events. How is `data` described today? Any shape given? |
| R2 | `docs/DSL.md` | Every mention of `data`, `{ receiver, data }`, mark/warn. Current Signal type examples. |
| R3 | `docs/naming.md` | Current list of canonical names. Are tags/weight/content listed? |
| R4 | `docs/one-ontology.md` | Events dimension. How does the signal relation describe its `data` field? |
| R5 | `.claude/rules/engine.md` + `CLAUDE.md` | Signal type declarations, mark/warn prose, any rule about payload discipline. |

### Wave 2 — Decide (Opus, main context)

Take 5 reports + dictionary.md:1-200 + DSL.md. Produce diff specs for each
doc. Key decisions:

1. **Where to insert the shape rule in dictionary.md.** Right after *The Seed*
   (line 38) seems natural — a new section *The Three Slots of Data* that
   names `tags`, `weight`, `content` as the shape of `data`.
2. **Whether to add `subscribe` to The Six Verbs.** Current six: emit, mark,
   warn, fade, follow, harden. Subscribe fits — it's "receive where marks
   are strongest" filtered by tag. Either rename follow → subscribe, or
   add as a seventh. Decision criterion: fewest broken references.
3. **Keep `mark`/`warn` as verbs.** Don't eliminate them in docs. They're
   the ergonomic names for `weight > 0` / `weight < 0` signal emission.
4. **DSL.md code examples.** Update canonical example to use `{tags, weight, content}` in `data`.
5. **CLAUDE.md Signal section.** Single-line update to name the shape.

### Wave 3 — Edits (parallel Sonnet × 6)

One agent per file. Each gets the diff specs from W2.

| Job | File | Est. edits |
|-----|------|-----------|
| E1 | `docs/dictionary.md` | New "Three Slots of Data" section + update Events |
| E2 | `docs/DSL.md` | ~4 examples updated |
| E3 | `docs/naming.md` | Add `tags`, `weight`, `content` to canonical names |
| E4 | `docs/one-ontology.md` | Events dimension: data shape note |
| E5 | `.claude/rules/engine.md` | Signal block updated |
| E6 | `CLAUDE.md` | Core Concepts → Signal section one-liner |

### Wave 4 — Verify (Sonnet × 1)

1. `bun run verify` — still 326/326 (no code changed)
2. Cross-check: all 6 docs agree on the shape `{receiver, data:{tags, weight, content}}`
3. No dead names introduced (tags/weight/content used consistently, not `labels`/`strength`/`payload`)
4. Links still resolve
5. Rubric ≥ 0.65 on all dims (fit/form/truth/taste)

### Tasks

- [x] **1a. Recon dictionary.md for current Seed/Name/Weight/Events sections**
  id: c1-recon-dictionary
  value: critical
  effort: low
  phase: C1
  persona: haiku
  blocks: c1-decide
  exit: Report lists exact line ranges + current phrasing of data/tags/weight in dictionary.md
  tags: docs, recon, P0

- [x] **1 Recon DSL.md for signal grammar + current examples**
  id: c1-recon-dsl
  value: critical
  effort: low
  phase: C1
  persona: haiku
  blocks: c1-decide
  exit: Report lists every `{ receiver, data }` example and mark/warn usage
  tags: docs, recon, P0

- [x] **1 Recon naming.md for canonical names list**
  id: c1-recon-naming
  value: high
  effort: low
  phase: C1
  persona: haiku
  blocks: c1-decide
  exit: Report confirms whether tags/weight/content are currently canonical names
  tags: docs, recon, P1

- [x] **1 Recon one-ontology.md Events dimension**
  id: c1-recon-ontology
  value: high
  effort: low
  phase: C1
  persona: haiku
  blocks: c1-decide
  exit: Report on signal-relation data field description
  tags: docs, recon, P1

- [x] **1 Recon engine.md + CLAUDE.md Signal blocks**
  id: c1-recon-rules
  value: high
  effort: low
  phase: C1
  persona: haiku
  blocks: c1-decide
  exit: Report all Signal type declarations and mark/warn prose across the two rule docs
  tags: docs, recon, P1

- [x] **1 Decide diff specs for all 6 docs (Opus)**
  id: c1-decide
  value: critical
  effort: medium
  phase: C1
  persona: opus
  blocks: c1-edit-dictionary, c1-edit-dsl, c1-edit-naming, c1-edit-ontology, c1-edit-engine-rule, c1-edit-claude-md
  exit: 6 diff spec sets produced, judgment recorded for subscribe-verb question
  tags: docs, decide, P0

- [x] **1 Edit dictionary.md — add "Three Slots of Data" section**
  id: c1-edit-dictionary
  value: critical
  effort: medium
  phase: C1
  persona: sonnet
  blocks: c1-verify
  exit: New section after line 38; Events section (612) notes the shape
  tags: docs, edit, P0

- [x] **1 Edit DSL.md — canonical examples use {tags, weight, content}**
  id: c1-edit-dsl
  value: critical
  effort: medium
  phase: C1
  persona: sonnet
  blocks: c1-verify
  exit: All Signal examples show the three-slot data shape
  tags: docs, edit, P0

- [x] **1 Edit naming.md — add tags/weight/content as canonical**
  id: c1-edit-naming
  value: high
  effort: low
  phase: C1
  persona: sonnet
  blocks: c1-verify
  exit: Three new entries in the canonical names table
  tags: docs, edit, P1

- [x] **1 Edit one-ontology.md — Events data shape**
  id: c1-edit-ontology
  value: high
  effort: low
  phase: C1
  persona: sonnet
  blocks: c1-verify
  exit: Events dimension documents data = {tags, weight, content}
  tags: docs, edit, P1

- [x] **1 Edit engine.md rule — Signal block**
  id: c1-edit-engine-rule
  value: high
  effort: low
  phase: C1
  persona: sonnet
  blocks: c1-verify
  exit: `.claude/rules/engine.md` Signal section names the three slots
  tags: docs, edit, P1

- [x] **1 Edit CLAUDE.md — Core Concepts → Signal**
  id: c1-edit-claude-md
  value: high
  effort: low
  phase: C1
  persona: sonnet
  blocks: c1-verify
  exit: CLAUDE.md Signal line includes the shape
  tags: docs, edit, P1

- [x] **1 Verify C1 — consistency + green gate**
  id: c1-verify
  value: critical
  effort: low
  phase: C1
  persona: sonnet
  exit: `bun run verify` = 326/326 green; 6 docs cross-consistent; rubric ≥ 0.65
  tags: docs, verify, gate, P0

### Cycle 1 Gate

```bash
bun run verify                           # 326/326 green
grep -c "tags.*weight.*content" docs/dictionary.md  # ≥ 1
grep -c "{ receiver, data: { tags" docs/DSL.md      # ≥ 1
```

---

## Cycle 2: GROW — Router tag-read + Subscribe verb

**Files:** `src/engine/world.ts` (add `subscribe()`), `src/engine/persist.ts`
(persist subscriptions), `src/components/TaskBoard.tsx` (WebSocket tag filter),
new `src/engine/subscribe.test.ts`, new `src/pages/api/subscribe.ts`.

**Depends on:** Cycle 1 complete. Docs have named the shape → the router
can safely read `data.tags` knowing what they mean. Subscribe = "give me
signals where `data.tags` intersects my subscription set."

**Simplicity guardrail:** `Signal` type stays `{ receiver, data?: unknown; after? }`.
The router gains ONE new read: when a signal arrives, if `data.tags` is an array,
the substrate ALSO fan-outs to any unit subscribed on those tags. If it's absent,
behavior is unchanged. Purely additive.

**Why last:** This is the user-facing win. Humans, agents, CI hooks — anything
that wants to listen — just declares tags. The substrate already routes by
tag under the hood; this names and exposes the pattern.

### Wave 1 — Recon (parallel Haiku × 4)

| Agent | File | What to look for |
|-------|------|-----------------|
| R1 | `src/engine/persist.ts` | Current `tasksFor(tags)` impl — reuse as the core of subscribe |
| R2 | `agents/**/*.md` | How agent frontmatter `tags:` is currently parsed and stored |
| R3 | `src/lib/dev-ws-server.ts` | Current broadcast — which clients get which messages |
| R4 | `src/components/TaskBoard.tsx` | Current WebSocket subscribe message shape |

### Wave 2 — Decide (Opus)

Key decisions:
1. **API shape:** `unit.subscribe(tags: string[])` adds tag-match to unit. When `world.signal(sig)` fires, find all units whose subscription intersects `sig.data.tags` and deliver to each. Idempotent.
2. **Persistence:** new `subscription` relation in TypeDB? Or derive from existing Unit.tag attribute? Decide based on R2.
3. **Subscribe endpoint:** `POST /api/subscribe {receiver, tags}` — creates a subscription for a receiver id. For humans: the user's TaskBoard subscribes on connect with tag filter.
4. **WebSocket filter:** extend `type: 'subscribe'` message on `dev-ws-server.ts` to include `tags` — server filters broadcasts to matching clients only.
5. **Follow vs subscribe:** dictionary.md's `follow()` is "go where the trail is strongest" — single best path. `subscribe()` is "listen to all signals matching these tags" — multi-receiver. Distinct concepts, both stay.

### Wave 3 — Edits (parallel Sonnet × 5)

| Job | File | Est. edits |
|-----|------|-----------|
| E1 | `src/engine/world.ts` | Add `subscribe(tags)` method to Unit; wire tag-match in `signal()` |
| E2 | `src/engine/persist.ts` | Persist subscriptions to TypeDB (if decided) |
| E3 | `src/lib/dev-ws-server.ts` | Tag-filtered broadcast |
| E4 | `src/components/TaskBoard.tsx` | Subscribe with tags on WebSocket connect |
| E5 | `src/pages/api/subscribe.ts` (new) | REST endpoint for subscription registration |

### Wave 4 — Verify

1. `bun run verify` — green, now 326 + N_new
2. New tests: `subscribe.test.ts` covers (a) tag-match fan-out, (b) no match = no delivery, (c) WebSocket tag filter
3. Smoke: two TaskBoard clients with different tag filters — each sees only its own slice
4. Rubric ≥ 0.65 on all dims

### Tasks

- [x] **2 Recon tasksFor + agent-md tags + ws broadcast + TaskBoard sub**
  id: c2-recon
  value: critical
  effort: low
  phase: C2
  persona: haiku
  blocks: c2-decide
  exit: 4 reports on existing tag-match + ws plumbing
  tags: engine, recon, P0

- [x] **2 Decide subscribe API + persistence + ws filter + endpoint**
  id: c2-decide
  value: critical
  effort: medium
  phase: C2
  persona: opus
  blocks: c2-edit-world-sub, c2-edit-persist-sub, c2-edit-ws, c2-edit-taskboard, c2-new-endpoint
  exit: API spec + migration plan for 5 edit jobs
  tags: engine, decide, P0

- [x] **2 Add subscribe(tags) to Unit/World in world.ts**
  id: c2-edit-world-sub
  value: critical
  effort: medium
  phase: C2
  persona: sonnet
  blocks: c2-verify
  exit: `unit.subscribe([t1, t2])` installs tag-match; `world.signal()` fan-outs to matching subs
  tags: engine, edit, P0

- [x] **2 Persist subscriptions in persist.ts**
  id: c2-edit-persist-sub
  value: high
  effort: low
  phase: C2
  persona: sonnet
  blocks: c2-verify
  exit: Subscriptions survive restart via TypeDB (or explicit no-persist decision recorded)
  tags: engine, typedb, edit, P1

- [x] **2 Tag-filtered broadcast in dev-ws-server.ts**
  id: c2-edit-ws
  value: high
  effort: low
  phase: C2
  persona: sonnet
  blocks: c2-verify
  exit: Broadcast sends only to clients whose subscribed tags intersect signal.data.tags
  tags: infra, edit, P1

- [x] **2 TaskBoard subscribes with tags on WebSocket connect**
  id: c2-edit-taskboard
  value: high
  effort: low
  phase: C2
  persona: sonnet
  blocks: c2-verify
  exit: TaskBoard sends `{type: 'subscribe', tags: [...]}` on connect
  tags: ui, edit, P1

- [x] **2 New /api/subscribe endpoint**
  id: c2-new-endpoint
  value: medium
  effort: low
  phase: C2
  persona: sonnet
  blocks: c2-verify
  exit: `POST /api/subscribe {receiver, tags}` creates a subscription; GET lists
  tags: api, edit, P1

- [x] **2 Tests + verify C2 gate**
  id: c2-verify
  value: critical
  effort: medium
  phase: C2
  persona: sonnet
  exit: subscribe.test.ts green; 326 + N tests total green; rubric ≥ 0.65; 2-client smoke passes
  tags: engine, test, verify, gate, P0

### Cycle 2 Gate

```bash
bun run verify                                    # (326 + N_new) / same green
grep "subscribe" src/engine/world.ts              # ≥ 1
curl -X POST http://localhost:4321/api/subscribe \
  -H 'Content-Type: application/json' \
  -d '{"receiver":"test","tags":["engine","P0"]}'  # returns 200
```

---

## Cost Discipline

| Cycle | Wave | Agents | Model | Est. cost share |
|-------|------|-------:|-------|----------------:|
| 1 | W1 | 5 | Haiku | ~10% |
| 1 | W2 | 0 | Opus (main) | ~10% |
| 1 | W3 | 6 | Sonnet | ~30% |
| 1 | W4 | 1 | Sonnet | ~10% |
| 2 | W1 | 4 | Haiku | ~5% |
| 2 | W2 | 0 | Opus (main) | ~10% |
| 2 | W3 | 5 | Sonnet | ~20% |
| 2 | W4 | 1 | Sonnet | ~5% |

**Hard stop:** if any Wave 4 loops more than 3 times, halt and escalate.

**Dropped cycle:** the previous v1 of this TODO had a "PROVE — Type narrowing"
cycle with `SignalData<T>` and accessor helpers. Dropped per user direction:
the Signal type stays `{ receiver, data?: unknown }`; the shape `{tags, weight, content}`
is a **convention inside `data`**, enforced by docs and by the router's read
helper — not by TypeScript. Simpler, zero-risk, no call-site migration needed.

---

## Status

- [x] **Cycle 1: WIRE** — Docs alignment (dictionary, DSL, naming, ontology, rules, CLAUDE.md)
  - [x] W1 — Recon (Haiku × 6)
  - [x] W2 — Decide (Opus)
  - [x] W3 — Edits (Sonnet × 6)
  - [x] W4 — Verify (Sonnet × 1) — rubric {fit:0.92, form:0.88, truth:0.95, taste:0.95}
- [x] **Cycle 2: GROW** — Router tag-read + Subscribe verb (ws filter + endpoint)
  - [x] W1 — Recon (Haiku × 4)
  - [x] W2 — Decide (Opus)
  - [x] W3 — Edits (Sonnet × 4, dissolved × 1)
  - [x] W4 — Verify (Sonnet × 1) — rubric {fit:0.95, form:0.95, truth:0.92, taste:0.93}

---

## Execution

```bash
# Start the first wave (Cycle 1, W1)
/do TODO-signal-shape.md

# After each wave completes, rerun /do to advance
/do TODO-signal-shape.md

# Check state
/see highways
/see tasks P0
```

---

## Relation to the Parallel Plan

In `docs/TODO.md`'s curated parallel execution plan, this TODO belongs in
**Wave A** as a new stream **A0 (signal shape)** — it's docs-only in C1,
so it can run in parallel with every other stream without file collision.
C2 (type narrowing) should serialize against A1 (wave context envelope)
since both touch `src/engine/world.ts` + `loop.ts`. C3 adds the subscribe
verb that future Wave-B streams (B1 `/work` wave-aware, B3 testing) can
build on.

Weight rationale: this stream compounds everything — once every signal is
`{receiver, data:{tags, weight, content}}` and every receiver can
`.subscribe(tags)`, task management, rubric scoring, WebSocket push,
AgentVerse bridging, and marketplace routing all collapse into one
primitive. The width is 1, but the blast radius is the whole substrate.

---

## See Also

- [dictionary.md](dictionary.md) — The Seed, The Weight, The Name — already canonical
- [DSL.md](one/DSL.md) — signal grammar
- [naming.md](naming.md) — canonical names (tags/weight/content need entries)
- [one-ontology.md](one-ontology.md) — Events dimension
- [rubrics.md](rubrics.md) — markDims already emits {tag, weight} pairs
- [TODO-task-management.md](TODO-task-management.md) — self-learning tasks (subscribe = how humans/agents listen)
- [TODO-template.md](one/TODO-template.md) — this template
- [TODO.md](one/TODO.md) — parallel execution plan (this TODO = stream A0)
- [.claude/rules/engine.md](../.claude/rules/engine.md) — The Three Locked Rules
- `src/engine/world.ts` — Signal + SignalData types
- `src/engine/persist.ts` — mark/warn implementation

---

*2 cycles. Four waves each. 21 tasks. Docs first, subscribe second.
One primitive: `{receiver, data}`. One convention inside data: `{tags, weight, content}`.
Haiku reads, Opus decides, Sonnet writes, Sonnet checks. Nothing breaks; everything aligns.*
