# Work Loop

The engineering loop for context-engineered tasks. Mirrors the deterministic sandwich:
each stage has a cheap PRE gate, an expensive LOAD/DO step, and a POST mark/warn.

**Not to be confused with:** [`loop.md`](loop.md) — that's the runtime substrate tick.
This doc is the *developer's* loop when working a task.

---

## The Order

```
┌──────────────── INGEST ─────────────────┐  ┌────── ACT ───────┐  ┌──── CLOSE ────┐
sync → recall → dictionary → schema →       plan → relevant-      code → test →
types → dsl → patterns → skills → frame     files → story →       optimise →
                                             design → rubric →    document →
                                             prune                commit → ship →
                                                                  observe → mark →
                                                                  report → know →
                                                                  frontier
└─────── vocabulary + grounding ──────────┘  └── scope + shape ─┘  └─ execute + learn ┘
```

---

## The Deterministic Gate

Every stage answers one question before loading:

```
PRE check (deterministic, cheap)
    │
    ├── miss → skip stage, continue
    │
    └── hit  → LOAD (expensive)
               │
               └── POST: mark(edge) if used · warn(edge) if noise
```

Same shape as `workers/sync/index.ts` FNV-1a hash gate: if the hash matches cache,
no KV write. Here: if the gate misses, no context load.

---

## Stages

| # | Stage | PRE gate | What loads | Why |
|---|-------|----------|-----------|-----|
| 1 | **sync** | always | current branch, status, recent commits | know where you are |
| 2 | **recall** | always | memory (`MEMORY.md`), highways, prior hypotheses | blind plans = wasted plans |
| 3 | **dictionary** | always (small, canonical) | `docs/naming.md`, `docs/dictionary.md` | names before anything |
| 4 | **schema** | task touches schema/engine/api OR `hash(one.tql) != cached` | `src/schema/*.tql` | what *can* exist |
| 5 | **types** | task touches engine/api/schema | `src/engine/*.ts` interfaces | signatures ground the DSL |
| 6 | **dsl** | task touches engine or routing | `docs/DSL.md` | substrate primitives |
| 7 | **patterns** | glob match: `engine/*` → `engine.md`, `*.tsx` → `react.md`, `*.astro` → `astro.md` | `.claude/rules/*.md` | proven shapes |
| 8 | **skills** | keyword match: "deploy"→`/deploy`, "tql"→`/typedb`, etc. | skill file | specialized capability |
| 9 | **frame** | always | canonical intent (via `intent.ts` cache) | dedupe, align |
| 10 | **plan** | always | — (produced, not loaded) | step-by-step |
| 11 | **relevant-files** | always (produced here) | paths + line ranges + one-line why | the highest-leverage artifact |
| 12 | **story** | always | — (produced) | user-visible intent restated |
| 13 | **design** | always | — | shape the solution |
| 14 | **rubric** | always | `docs/rubrics.md` (once per session) | fit / form / truth / taste |
| 15 | **prune** | stale file detected OR dead name detected OR `relevant-files` has noise | — (produced: removals) | don't grow context monotonically |
| 16 | **code** | always | — | the actual work |
| 17 | **test** | always | `bun run verify` | no regressions |
| 18 | **optimise** | test passes AND rubric ≥ 0.65 | — | only tune green code |
| 19 | **document** | code touches public API or docs | — | surface stays honest |
| 20 | **commit** | user-authorized | — | checkpoint |
| 21 | **ship** | user-authorized | — | deploy |
| 22 | **observe** | shipped | logs, traces | close the loop outside the repo |
| 23 | **mark/warn** | always | — | record outcome as pheromone |
| 24 | **report** | always | — | session → substrate |
| 25 | **know** | highway emerged (strength ≥ threshold) | — | promote to hypothesis |
| 26 | **frontier** | unexplored tag cluster detected | — | seed next `sync` |

---

## What Always Loads vs What's Gated

**Always** (cheap, universal):
- `sync`, `recall`, `dictionary`, `rubric`, `frame`, `plan`, `relevant-files`,
  `story`, `design`, `code`, `test`, `mark/warn`, `report`

**Gated** (expensive or task-specific):
- `schema`, `types`, `dsl`, `patterns`, `skills`, `prune`, `optimise`,
  `document`, `commit`, `ship`, `observe`, `know`, `frontier`

Rule of thumb: *if loading it always wouldn't hurt context budget, load it always.*
`dictionary` is 2KB and changes semantics of every downstream stage — always load.
`patterns` × 3 rules files + `dsl` + full type surface is token-heavy — gate it.

---

## The Artifact: `relevant-files`

The single highest-leverage product of the loop. Format:

```
src/engine/world.ts:48-112       Signal routing — where .ask() lives
src/engine/persist.ts:180-220    mark/warn wrapper with toxicity pre-check
src/pages/api/tasks/index.ts     Endpoint under edit
```

Produced at `plan`. Pinned through `design` → `code` → `test`.
Regenerate only if scope changes. Stale lists are worse than none.

**Generation shortcut:** delegate to `Explore` agent with `thoroughness: medium`,
ask for "paths + line ranges + one-line why each matters."

---

## POST: Mark and Warn the Stages Themselves

Each stage is a path in the loop. After the task closes:

```
sync → recall       mark if recall surfaced something used
recall → dictionary mark if names kept downstream stages coherent
plan → patterns     warn if patterns weren't consulted at code time
code → test         mark always (closed loop)
test → optimise     warn if optimise fired on red tests
```

Over time, rarely-used gates fade. Always-useful stages strengthen.
The loop itself learns which stages are worth running.

---

## See Also

- [loop.md](loop.md) — the runtime substrate tick (different loop)
- [DSL.md](DSL.md) — the programming model loaded at stage 6
- [dictionary.md](dictionary.md) — loaded at stage 3
- [rubrics.md](rubrics.md) — loaded at stage 14
- [TODO-template.md](TODO-template.md) — wave-based task execution
- `.claude/commands/work.md` — the `/work` skill implements this loop

---

*Gate cheap. Load once. Mark outcomes. Let the loop learn itself.*
