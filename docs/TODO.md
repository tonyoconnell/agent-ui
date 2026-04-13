# TODO

> ONE Substrate — self-learning task system.
> Tasks are signals. Waves are loops. The template is a unit.
> Priority = value + phase + persona + blocking. Pheromone adjusts at runtime.
>
> **Sync:** `POST /api/tasks/sync` or `/sync` — scans all TODO-*.md,
> writes to KV (10ms hot), syncs to TypeDB (100ms durable), writes `todo.json`,
> regenerates this file ranked by pheromone.

---

## Active TODOs

| TODO | Focus | Open | Done | Phase | Status |
|------|-------|-----:|-----:|-------|--------|
| [TODO-testing](TODO-testing.md) | Deterministic sandwich — biome, vitest, hooks, lifecycle gates | 31 | 0 | C1-C3 | WIRE |
| [TODO-task-management](TODO-task-management.md) | Self-learning tasks — context, waves, self-checkoff | 24 | 0 | C1-C3 | WIRE |
| [TODO-typedb](TODO-typedb.md) | Context flows along the graph — resolveContext, rubric dims | 25 | 0 | C1-C3 | WIRE |
| [TODO-SUI](TODO-SUI.md) | On-chain proofs — testnet deployed, escrow + crystallize next | 24 | 28 | C1-C4 | PROVE |
| [TODO-rename](TODO-rename.md) | Kill dead names across docs — wave pattern, 10 names | 15 | 1 | C1-C3 | WIRE |
| [TODO-autonomous-orgs](TODO-autonomous-orgs.md) | Executable task graph with pheromone routing | 10 | 0 | C1-C3 | WIRE |
| [TODO-ONE-strategy](TODO-ONE-strategy.md) | Strategy tasks — routing, agents, commerce | 13 | 1 | C1-C7 | WIRE |

## Completed TODOs

| TODO | Focus | Tasks |
|------|-------|------:|
| [TODO-signal](TODO-signal.md) | Three-mode addressing grammar | 24 |
| [TODO-deploy](TODO-deploy.md) | Cloudflare deployment | 4 |

---

## The Template

Every TODO follows [TODO-template.md](TODO-template.md):

```
ROUTING DIAGRAM       signal down, marks up, fan-out sideways
SCHEMA REFERENCE      tasks → world.tql dimension 3b
DEPENDENCY GRAPH      waves acquire context via .then()
TESTING               W0 baseline (npm run verify), W4 verify + rubric
CYCLES (W1-W4)        Haiku reads, Opus decides, Sonnet writes, Sonnet checks
SELF-CHECKOFF         W4 pass → mark done → update checkbox → unblock → know()
```

Create new TODOs: `/todo source-doc.md`
Run next wave: `/wave TODO-name.md`
Autonomous: `/work`

---

## Source of Truth Chain

```
TODO-*.md (markdown)
    │
    ├── task-parse.ts ─── deterministic parser ─── Task[]
    │                                                │
    ├── task-sync.ts ──── write to TypeDB ──── task entity + skill + capability + blocks
    │                                                │
    ├── sync-docs.ts ──── read pheromone back ─── effective priority
    │                                                │
    ├── todo.json ─────── snapshot ─── all tasks + pheromone + status
    │                                                │
    └── TODO.md ───────── this file ─── master index ranked by priority
```

**Three sources, one truth:**
- `TODO-*.md` — the human-readable source (edit here)
- TypeDB — the brain (tasks + pheromone + learning)
- `todo.json` — the snapshot (for CI, dashboards, sync checks)

**Sync command:** `/sync-docs` or `POST /api/tasks/sync-docs`

---

## Context Always Loaded

Every Wave 2 decision loads:
- [DSL.md](DSL.md) — signal grammar
- [dictionary.md](dictionary.md) — canonical names

Every Wave 4 verify uses:
- [rubrics.md](rubrics.md) — quality scoring as tagged edges
- `npm run verify` — biome + tsc + vitest

---

## The Lifecycle Loop

```
PLAN ──→ STORY ──→ TASK ──→ TEST ──→ LEARN ──→ OPTIMIZE
  │         │         │        │         │          │
/todo     context   /wave    verify    mark()     evolve
creates   loads     executes  gates    compounds   rewrites
TODO      DSL+dict  W1-W4    W0+W4    pheromone   prompts
  │         │         │        │         │          │
  └─────────┴─────────┴────────┴─────────┴──────────┘
                          ▲
                          │ repeat — each cycle gets smarter
```

---

## See Also

- [DSL.md](DSL.md) — the signal language
- [dictionary.md](dictionary.md) — everything named
- [rubrics.md](rubrics.md) — quality scoring as tagged edges
- [speed.md](speed.md) — the benchmarks
- [routing.md](routing.md) — the deterministic sandwich
- [patterns.md](patterns.md) — 10 emergent patterns
- [lifecycle.md](lifecycle.md) — into/through/out
- [TODO-template.md](TODO-template.md) — the wave pattern

---

*Tasks are signals. Waves are loops. The template is a unit.
Context flows down. Quality flows up. The graph learns.
This file regenerates from TypeDB state. Edit the TODO-*.md files, not this.*
