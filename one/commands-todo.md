---
title: TODO — Command Surface Refinement (5 verbs, L1-L7 coverage)
type: roadmap
version: 3.0.0
priority: Wire → Prove → Grow
total_tasks: 22
completed: 0
status: ACTIVE
---

# TODO: Command Surface Refinement

> **Time units:** tasks → waves → cycles. Never days, hours, weeks.
> (See `.claude/rules/engine.md` → The Two Locked Rules.)
>
> **Goal:** 12 commands → **5 commands**. Each is a single verb that takes a
> noun argument. The command grammar mirrors the substrate's grammar — signal
> is `{receiver, data}` (verb via receiver + noun via data); command is
> `/verb noun`. One level of indirection instead of two.
>
> **Source of truth:** [dictionary.md](dictionary.md) — The Six Verbs (line
> 298), The Tick (line 852); [DSL.md](one/DSL.md) — the public `send()` API;
> [routing.md](routing.md) — The Formula, Two Routing Modes, The Layers,
> Signal Lifecycle; [TODO-template.md](one/TODO-template.md) — the wave pattern.
>
> **Shape:** 3 cycles, four waves each. Docs first (C1: dictionary + DSL +
> routing + CLAUDE), then artifacts (C2: 12 command files → 5), then verify
> sweep (C3: TODO cross-refs + self-documenting check).

## The 5 Verbs

```
/see     read the world          follow()-style query    (dictionary: follow)
/create  emit a signal into it   send()-style emit       (dictionary: send, was emit)
/do      drive work through      select() + route        (dictionary: follow/select)
/close   mark a result           mark() / warn()         (dictionary: mark/warn)
/sync    reconcile state         markdown → memory → TypeDB (dictionary: The Tick + learn)
```

Each verb takes a **noun** that specifies what to act on. The verb is the
intent; the noun is the scope. Five verbs × 2-5 nouns each = clean surface.

### The Target Surface

```
/see     tasks [--tag X --status Y]     open work (optional filter)             L1
/see     highways [--limit N]           proven paths (top by strength)          L2
/see     frontiers                      unexplored tag clusters                 L7
/see     toxic                          blocked paths (resistance dominates)    L3
/see     paths [--from X --to Y]        any path query                          L2
/see     hypotheses                     what the substrate has learned          L6
/see     evolved                        agents that rewrote their prompts       L5
/see     revenue                        per-path earnings                       L4
/see     events [--since T]             signal history / Four Outcomes audit    L1

/create  task <name> [--tags T --weight W]    atomic task into TypeDB           L1
/create  todo <source-doc?>                   TODO from template or extract     L1
/create  agent <markdown-file>                agent.md → TypeDB unit            L1
/create  signal <receiver> <data>             ad-hoc signal emission (testing)  L1

/do      <TODO-file>            advance next wave of the TODO                   L1
/do      <TODO> --auto          run W1→W2→W3→W4 continuously until done        L1
/do      <TODO> --wave N        run a specific wave (override auto-detect)     L1
/do                             autonomous loop: pick + execute + mark          L1
/do      --once                 single iteration of autonomous loop             L1

/close   <task-id>              mark() success, self-checkoff, unblock          L2
/close   <task-id> --fail       warn(1) — deterministic failure                 L2
/close   <task-id> --dissolved  warn(0.5) — missing unit/capability             L2
/close   <task-id> --timeout    neutral — slow, not bad                         L2
/close                          no-arg: record whole session outcomes           L2

/sync                           default: tick + scan docs + todos + agents      L3-L7
/sync    tick                   fire /api/tick (all L1-L7 loops)                L1-L7
/sync    docs                   scan docs/*.md → memory → TypeDB                L6
/sync    todos                  scan docs/TODO-*.md → tasks → TypeDB            L1
/sync    agents                 scan agents/**/*.md → units → TypeDB            L1
/sync    fade                   fire L3 only (asymmetric decay)                 L3
/sync    evolve                 fire L5 only (rewrite struggling agents)        L5
/sync    know                   fire L6 only (harden highways + hypothesize)    L6
/sync    frontier               fire L7 only (detect unexplored clusters)       L7
/sync    pay <receiver> <amt>   emit payment signal                             L4
/sync    <path>                 any markdown file or directory                  L6
```

**Coverage:** every loop L1-L7 has at least one explicit command/noun — no
loop hides behind a black-box `/sync tick`. Users can read L6 hypotheses,
force an L5 evolution sweep, emit an L4 payment, inspect L1 signal history.
The full substrate surfaces through 5 verbs.

### Why 5 not 9

Under the 9-command proposal users had to learn group-membership: "`/highways`
is in SEE, `/todo` is in CREATE". Two levels (which group, which command).
Under 5 verbs the verb IS the group, and the noun is the specific action.
One level. Less to memorize, faster to type, more discoverable (typing `/see`
alone can suggest valid nouns).

## Alignment with routing.md and the 7 Loops

Each command corresponds to specific routing primitives and loop handlers:

| Command | routing.md primitive | Loops hit | What it reads/writes |
|---------|---------------------|-----------|----------------------|
| `/see tasks/highways/paths/toxic/frontiers` | `follow()` — deterministic query of strongest paths (line 113) | L1 queue, L2 paths, L3 decayed, L7 gaps | Reads `strength`/`resistance`/`queue` state |
| `/see hypotheses/evolved/revenue/events` | TypeDB reads — knowledge/evolution/economic history | L4, L5, L6 outputs | Reads learning + economic state |
| `/create task/todo/agent/signal` | `send()` — emit signal into world (DSL.md:42) | L1 signal | Writes new signal/entity into queue+TypeDB |
| `/do {TODO}` / `/do --auto` | `select()` + The Tick Loop (line 300) | L1 signal, L2 mark | Drives signals through 3-layer sandwich (line 161) |
| `/close {id}` | `mark()` (line 495) | L2 trail (strength++) | Positive weight onto receiver's path |
| `/close --fail` | `warn(1)` (line 517) | L2 trail (resistance++) | Negative weight — full failure |
| `/close --dissolved` | `warn(0.5)` (line 517) | L2 trail (resistance + 0.5) | Mild warn — missing unit/capability |
| `/close --timeout` | no-op (neutral) | L2 neutral | No mark, no warn — slow not bad |
| `/sync fade` | `fade()` (line 538) | L3 fade | Asymmetric decay, resistance 2× strength |
| `/sync evolve` | prompt rewrite | L5 evolution | Struggling agent self-rewrites |
| `/sync know` | `know()` + `hypothesize()` | L6 knowledge | Harden highways to permanent, write hypotheses |
| `/sync frontier` | frontier detection | L7 frontier | Detect unexplored tag clusters |
| `/sync pay` | `send()` with payment content | L4 economic | Emit payment signal, record revenue on path |
| `/sync tick` | all of the above | L1-L7 all | Full substrate tick |
| `/sync docs/todos/agents/{path}` | parse → writeSilent → TypeDB | L6 absorption | Markdown → memory → TypeDB |

**The command grammar IS the router's grammar.** Every command invocation is
equivalent to an explicit substrate operation. Every loop L1-L7 has at least
one directly-invokable noun — no loop is hidden behind a black-box `/sync
tick`. A user typing `/do TODO-foo` is asking the substrate to `select()` the
next wave-handler and route the wave signal through the deterministic sandwich.
`/close --fail` is the human's way of emitting warn(1) — the crucial failure
path that Rule 1 (closed loop) requires.

### Rule 1 Closed-Loop preserved

Four Outcomes from routing.md:419 map 1:1 to `/close` flags:

```
result     → /close <id>              mark()  chain strengthens
timeout    → /close <id> --timeout    neutral chain continues
dissolved  → /close <id> --dissolved  warn(0.5) mild — chain breaks
failure    → /close <id> --fail       warn(1.0) full — chain breaks
```

Without these flags, today's `/done` marks every closed task as success —
the substrate learns that failures succeed. Shipping all four /close modes
closes that hole.

## /sync — Any markdown → memory → TypeDB

`/sync` is the universal absorption verb. It takes any markdown file or
directory and brings its content into the substrate:

```
┌────────────────────┐     parse      ┌──────────┐     writeSilent   ┌─────────┐
│  markdown file(s)  │ ─────────────►│  memory  │ ────────────────►│  TypeDB │
│  docs/*.md         │                │  KV +    │                   │  (cloud) │
│  TODO-*.md         │                │  global  │                   │          │
│  agents/**/*.md    │                │   this   │                   │          │
│  any .md you want  │                │  ~0ms    │                   │  ~100ms  │
└────────────────────┘                └──────────┘                   └─────────┘
```

What already exists in `src/engine/`:
- `task-parse.ts` — TODO checkbox → Task[]
- `task-sync.ts` — Task[] → TypeDB
- `task-extract.ts` — Haiku extracts tasks from any doc
- `doc-scan.ts` — scan docs/, verify vs code, emit gap-signals
- `agent-md.ts` — parse `agent.md` frontmatter → TypeDB unit

`/sync` becomes the single entry point that calls the right parser based on
the target. Default (`/sync` with no argument) runs all of them, plus fires
`/api/tick`. This absorbs today's `/grow`, `/sync`, and `/extract-tasks`.

## Routing

```
    signal DOWN                       mark UP
    ──────────                        ───────
    /wave TODO-commands.md            rubric per wave
         │                                 │
         ▼                                 │
    ┌─────────┐                            │
    │  W1     │  Haiku recon ──────────────┤ mark(edge:fit, score)
    │  read   │  read dict + DSL + routing │ mark(edge:form, score)
    └────┬────┘                            │ mark(edge:truth, score)
         │                                 │ mark(edge:taste, score)
         ▼                                 │
    ┌─────────┐                            │
    │  W2     │  Opus decide               │
    │  fold   │  5-verb diff specs         │
    └────┬────┘                            │
         │                                 │
         ▼                                 │
    ┌─────────┐                            │
    │  W3     │  Sonnet edit               │
    │  apply  │  docs or command files     │
    └────┬────┘                            │
         │                                 │
         ▼                                 │
    ┌─────────┐                            │
    │  W4     │  Sonnet verify ────────────┘
    │  score  │  bun run verify + consistency
    └─────────┘
```

## Testing — The Deterministic Sandwich

```
PRE (before W1)                    POST (after W4)
───────────────                    ────────────────
bun run verify                     bun run verify
├── biome check .                  ├── biome check .
├── tsc --noEmit                   ├── tsc --noEmit
└── vitest run  (326/326)          └── vitest run  (326/326)
```

No source-code changes are required. All three cycles touch docs and
`.claude/commands/*.md` files only. 326/326 stays green by construction.

---

## Source of Truth

| Doc | What it locks | Current drift |
|-----|---------------|---------------|
| [dictionary.md](dictionary.md) | The Six Verbs, The Tick | Says `emit` not `send`; no Command Set section |
| [DSL.md](one/DSL.md) | Public signal API | Already uses `send()`; no mention of command surface |
| [routing.md](routing.md) | follow/select/mark/warn semantics | No mention of commands; OK as-is |
| [CLAUDE.md](/CLAUDE.md) | Slash Commands block | 12-command list; `/grow` named |
| `.claude/commands/*.md` | Actual command definitions | 12 files; duplicates `/next`, `/report`, `/extract-tasks`; name `/grow` collides with GROW cycle |

---

## Cycle 1: WIRE — Docs alignment (5 verbs named in canonical docs)

**Files:** `docs/dictionary.md`, `docs/DSL.md`, `docs/routing.md`,
`CLAUDE.md`, `.claude/rules/engine.md`.

**Why first:** The canonical docs teach the 5-verb surface before any
`.claude/commands/*.md` file is renamed or deleted. Anyone reading mid-cycle
sees the target shape in prose first. Zero test risk — docs only.

### Wave 1 — Recon (parallel Haiku × 5)

Spawn 5 agents in one message. Each reads one canonical doc and reports:
- All mentions of the old command names (`/grow`, `/next`, `/report`, `/extract-tasks`, `/tasks`, `/highways`, `/work`, `/wave`, `/done`, `/todo`, `/add-task`, `/sync`)
- All `emit` vs `send` usage
- Current vocabulary about routing/verbs/tick

**Hard rule:** "Report verbatim. Do not propose changes. Under 300 words."

| Agent | File | Focus |
|-------|------|-------|
| R1 | `docs/dictionary.md` | The Six Verbs (line 298); emit/send; The Tick; any Command Set section |
| R2 | `docs/DSL.md` | `send()` usage; command references |
| R3 | `docs/routing.md` | The Formula, Two Routing Modes; any command names |
| R4 | `CLAUDE.md` | Slash Commands block; Skills table |
| R5 | `.claude/rules/engine.md` | Any command references; emit/send usage |

### Wave 2 — Decide (Opus, main context)

Key decisions:
1. **`emit` → `send`** in dictionary.md Six Verbs list. DSL.md wins because it's what developers actually type.
2. **Add "The Command Set" section** to dictionary.md (or a new `docs/commands.md`, decide per scope) — 5 verbs, noun conventions, routing.md alignment table.
3. **CLAUDE.md** Slash Commands block: replace 12-command list with 5 verbs + noun cheat-sheet.
4. **routing.md** needs a small addition: one paragraph noting the user-facing command surface mirrors the router's verbs (follow/select/mark).
5. **engine.md rule**: update any `emit` references to `send`.
6. **Leave `.claude/commands/*.md` files alone in C1.** C2 consolidates them.

### Wave 3 — Edits (parallel Sonnet × 5)

| Job | File | Edit |
|-----|------|------|
| E1 | `docs/dictionary.md` | Rename `emit` → `send` in Six Verbs; add "The Command Set" section (5 verbs, each mapped to a dictionary primitive) |
| E2 | `docs/DSL.md` | One-line cross-link note: "see dictionary.md Command Set for the user-facing verbs" |
| E3 | `docs/routing.md` | One paragraph: "Commands mirror the router: /see ↔ follow(), /do ↔ select(), /close ↔ mark()/warn(), /sync ↔ tick + knowledge." |
| E4 | `CLAUDE.md` | Replace Slash Commands block with 5-verb cheat sheet + noun grammar |
| E5 | `.claude/rules/engine.md` | Update any `emit` → `send` for the public verb |

### Wave 4 — Verify (Sonnet × 1)

1. `bun run verify` — 326/326 still green (docs only)
2. `grep -c "/grow\|/next\|/report\|/extract-tasks" CLAUDE.md docs/dictionary.md docs/DSL.md docs/routing.md` → 0 (except in historical/migration notes)
3. Cross-check: all 5 docs agree on 5-verb surface + `send` rename
4. Rubric ≥ 0.65 on all dims

### Tasks

- [ ] **1a. Recon dictionary.md for emit/commands/tick**
  id: c1-recon-dict
  value: critical
  effort: low
  phase: C1
  persona: haiku
  blocks: c1-decide
  exit: Report lists every mention of `emit`, command names, and The Tick section, with line numbers
  tags: docs, recon, P0

- [ ] **1b. Recon DSL.md for send vs emit + command refs**
  id: c1-recon-dsl
  value: critical
  effort: low
  phase: C1
  persona: haiku
  blocks: c1-decide
  exit: Report on send/emit usage and any command cross-references
  tags: docs, recon, P0

- [ ] **1c. Recon routing.md for router vs command vocabulary**
  id: c1-recon-routing
  value: critical
  effort: low
  phase: C1
  persona: haiku
  blocks: c1-decide
  exit: Report on Formula, Two Routing Modes, any command references, terminology drift
  tags: docs, recon, P0

- [ ] **1d. Recon CLAUDE.md Slash Commands block**
  id: c1-recon-claude
  value: critical
  effort: low
  phase: C1
  persona: haiku
  blocks: c1-decide
  exit: Report current Slash Commands section with exact line ranges + all cross-refs
  tags: docs, recon, P0

- [ ] **1e. Recon engine.md rule for emit vs send**
  id: c1-recon-engine-rule
  value: high
  effort: low
  phase: C1
  persona: haiku
  blocks: c1-decide
  exit: Report every `emit`/`send`/command reference in `.claude/rules/engine.md`
  tags: docs, recon, P1

- [ ] **1f. Decide diff specs for all 5 docs**
  id: c1-decide
  value: critical
  effort: medium
  phase: C1
  persona: opus
  blocks: c1-edit-dict, c1-edit-dsl, c1-edit-routing, c1-edit-claude, c1-edit-engine-rule
  exit: 5 diff spec sets + Command Set section draft + placement decision (dictionary.md vs new commands.md)
  tags: docs, decide, P0

- [ ] **1g. Edit dictionary.md — send-rename + Command Set section**
  id: c1-edit-dict
  value: critical
  effort: medium
  phase: C1
  persona: sonnet
  blocks: c1-verify
  exit: Six Verbs uses `send`; new "The Command Set" section lists 5 verbs with router-primitive mapping
  tags: docs, edit, P0

- [ ] **1h. Edit DSL.md — cross-link to Command Set**
  id: c1-edit-dsl
  value: high
  effort: low
  phase: C1
  persona: sonnet
  blocks: c1-verify
  exit: One-line note in DSL.md cross-linking dictionary's Command Set
  tags: docs, edit, P1

- [ ] **1i. Edit routing.md — router↔command mapping paragraph**
  id: c1-edit-routing
  value: high
  effort: low
  phase: C1
  persona: sonnet
  blocks: c1-verify
  exit: One paragraph explaining /see↔follow, /do↔select, /close↔mark/warn, /sync↔tick+know
  tags: docs, edit, P1

- [ ] **1j. Edit CLAUDE.md — replace Slash Commands with 5-verb sheet**
  id: c1-edit-claude
  value: critical
  effort: medium
  phase: C1
  persona: sonnet
  blocks: c1-verify
  exit: Slash Commands block is the 5-verb cheat sheet; no `/grow`, `/next`, `/report`, `/extract-tasks` references
  tags: docs, edit, P0

- [ ] **1k. Edit engine.md rule — send-rename**
  id: c1-edit-engine-rule
  value: high
  effort: low
  phase: C1
  persona: sonnet
  blocks: c1-verify
  exit: `.claude/rules/engine.md` uses `send` for the public verb
  tags: docs, edit, P1

- [ ] **1l. Verify C1 — 326/326 green, 5 docs cross-consistent**
  id: c1-verify
  value: critical
  effort: low
  phase: C1
  persona: sonnet
  exit: `bun run verify` green; dictionary + DSL + routing + CLAUDE.md + engine.md agree on 5 verbs + send; rubric ≥ 0.65
  tags: docs, verify, gate, P0

### Cycle 1 Gate

```bash
bun run verify                                         # 326/326
grep -c "send(" docs/dictionary.md                     # ≥ 1 (was 0 in Six Verbs)
grep -c "/see\|/create\|/do\|/close\|/sync" CLAUDE.md  # ≥ 5
grep -c "/grow\|/next\|/report\|/extract-tasks" CLAUDE.md  # 0
```

---

## Cycle 2: PROVE — Collapse 12 command files into 5

**Files in scope:**
- **Delete:** `grow.md`, `next.md`, `report.md`, `extract-tasks.md`, `tasks.md`, `highways.md`, `work.md`, `wave.md`, `done.md`, `todo.md`, `add-task.md`
- **Create:** `see.md`, `create.md`, `do.md`, `close.md`, `sync.md`
- **Keep existing `/sync` file** but rewrite to absorb `/grow` (tick) and `/extract-tasks` (doc→task)

**Depends on:** Cycle 1 complete. Docs already teach the 5-verb surface, so a
reader arriving at `.claude/commands/` during C2 sees either the new 5 files
or still finds canonical guidance in CLAUDE.md.

**Why PROVE:** This is where the artifact reality catches up with the docs.
The new 5 files each handle noun arguments via a routing block at the top.

### Command file structure (all 5 follow this shape)

```markdown
# /{verb}

{one-sentence purpose}

## Nouns

- `{noun1}` — what it does
- `{noun2}` — what it does
- `{default noun}` — what happens with no argument

## Routing

Which noun triggers which substrate primitive. Maps to routing.md.

## Steps

{the actual procedure per noun, as today's files have}
```

### Wave 1 — Recon (parallel Haiku × 5)

| Agent | Files | What to extract |
|-------|-------|-----------------|
| R1 | `tasks.md` + `highways.md` | Current step lists; any state-query logic → goes into `see.md` |
| R2 | `todo.md` + `add-task.md` + `extract-tasks.md` | Current creation flows → go into `create.md` |
| R3 | `wave.md` + `work.md` + `next.md` | Orchestration logic; `--once` semantics → go into `do.md` |
| R4 | `done.md` + `report.md` | Mark + session-report logic → go into `close.md` |
| R5 | `sync.md` + `grow.md` | Current sync + tick behavior → go into new `sync.md` (absorbs tick) |

### Wave 2 — Decide (Opus)

Write the 5 new file bodies. Each has a Nouns section, a Routing section
(loop-coverage table mapping nouns to L1-L7), and Steps per noun. Preserve
all behavior; extend with the L4-L7 gap nouns. Key calls:

1. **/see** — nouns: `tasks, highways, frontiers, toxic, paths, hypotheses, evolved, revenue, events`. All read-only. Each hits a different TypeDB query or in-memory state snapshot. Events noun supports `--since T` for signal history.
2. **/create** — nouns: `task, todo, agent, signal`. All emit new entities/signals. `create signal <receiver> <data>` is the ad-hoc testing verb.
3. **/do** — modes: `{TODO}` wave-at-a-time, `{TODO} --auto` all-waves-until-done, `{TODO} --wave N` explicit wave, `(empty)` autonomous loop, `--once` single iteration.
4. **/close** — flags map 1:1 to Four Outcomes: default = mark(); `--fail` = warn(1); `--dissolved` = warn(0.5); `--timeout` = neutral. No-arg = session report.
5. **/sync** — nouns: `tick, fade, evolve, know, frontier, pay, docs, todos, agents, <path>`. Each can be invoked individually; default (no arg) runs the whole tick + all markdown scans.

Also: write a one-page `Routing` block at the top of each file showing the
loop-coverage table for that verb's nouns. This is how the file itself
becomes a reference — reading `.claude/commands/close.md` teaches you the
Four Outcomes.

### Wave 3 — Edits (parallel Sonnet × 6)

| Job | Files | Action |
|-----|-------|--------|
| E1 | `.claude/commands/see.md` (new) | Write from R1 consolidation |
| E2 | `.claude/commands/create.md` (new) | Write from R2 consolidation |
| E3 | `.claude/commands/do.md` (new) | Write from R3 consolidation |
| E4 | `.claude/commands/close.md` (new) | Write from R4 consolidation |
| E5 | `.claude/commands/sync.md` (rewrite existing) | Absorb tick + extract-tasks |
| E6 | `.claude/commands/` cleanup | Delete the 11 old files |

### Wave 4 — Verify

1. `ls .claude/commands/*.md | wc -l` → 5 (plus any meta)
2. `bun run verify` — 326/326 (no source code changed)
3. Each new file documents its nouns and routes correctly
4. `/sync` defaults run without error (manually tested)
5. Rubric ≥ 0.65

### Tasks

- [ ] **2a. Recon /tasks + /highways → /see absorption**
  id: c2-recon-see
  value: critical
  effort: low
  phase: C2
  persona: haiku
  blocks: c2-decide
  exit: Report of current steps + noun surface for /see
  tags: commands, recon, P0

- [ ] **2b. Recon /todo + /add-task + /extract-tasks → /create absorption**
  id: c2-recon-create
  value: critical
  effort: low
  phase: C2
  persona: haiku
  blocks: c2-decide
  exit: Report of creation flows + noun surface for /create
  tags: commands, recon, P0

- [ ] **2c. Recon /wave + /work + /next → /do absorption**
  id: c2-recon-do
  value: critical
  effort: low
  phase: C2
  persona: haiku
  blocks: c2-decide
  exit: Report of orchestration logic + --once semantics
  tags: commands, recon, P0

- [ ] **2d. Recon /done + /report → /close absorption**
  id: c2-recon-close
  value: critical
  effort: low
  phase: C2
  persona: haiku
  blocks: c2-decide
  exit: Report of close + session-record flows
  tags: commands, recon, P0

- [ ] **2e. Recon /sync + /grow → /sync absorption**
  id: c2-recon-sync
  value: critical
  effort: low
  phase: C2
  persona: haiku
  blocks: c2-decide
  exit: Report of tick + doc-scan + noun surface for any-markdown
  tags: commands, recon, P0

- [ ] **2f. Decide 5 file bodies + delete list + routing blocks**
  id: c2-decide
  value: critical
  effort: high
  phase: C2
  persona: opus
  blocks: c2-write-see, c2-write-create, c2-write-do, c2-write-close, c2-write-sync, c2-cleanup
  exit: 5 file bodies drafted + explicit delete list for 11 old files
  tags: commands, decide, P0

- [ ] **2g. Write .claude/commands/see.md — full noun surface incl. L4-L6 views**
  id: c2-write-see
  value: critical
  effort: medium
  phase: C2
  persona: sonnet
  blocks: c2-verify
  exit: /see handles tasks/highways/frontiers/toxic/paths + hypotheses/evolved/revenue/events nouns; each maps to a TypeDB read or follow() call; loop-coverage table at top
  tags: commands, edit, P0

- [ ] **2h. Write .claude/commands/create.md — task/todo/agent/signal**
  id: c2-write-create
  value: critical
  effort: medium
  phase: C2
  persona: sonnet
  blocks: c2-verify
  exit: /create handles task/todo/agent/signal nouns; all emit via send(); signal is the ad-hoc testing verb
  tags: commands, edit, P0

- [ ] **2i. Write .claude/commands/do.md — wave / auto / once / autonomous**
  id: c2-write-do
  value: critical
  effort: medium
  phase: C2
  persona: sonnet
  blocks: c2-verify
  exit: /do handles {TODO}/{TODO} --auto/{TODO} --wave N/(empty)/--once modes; maps to select() + wave routing
  tags: commands, edit, P0

- [ ] **2j. Write .claude/commands/close.md — Four Outcomes (mark + warn variants)**
  id: c2-write-close
  value: critical
  effort: medium
  phase: C2
  persona: sonnet
  blocks: c2-verify
  exit: /close handles {id}/(empty)/--fail/--dissolved/--timeout; each maps to the Four Outcomes; Rule 1 closed-loop fully covered
  tags: commands, edit, P0

- [ ] **2k. Rewrite .claude/commands/sync.md — absorb tick + L3-L7 sub-invocations + pay + any-markdown**
  id: c2-write-sync
  value: critical
  effort: high
  phase: C2
  persona: sonnet
  blocks: c2-verify
  exit: /sync handles default/tick/fade/evolve/know/frontier/pay/docs/todos/agents/{path} nouns; each nounable loop L3-L7 exposed; L4 pay emits payment signal with content+weight
  tags: commands, edit, P0

- [ ] **2l-extra. Update CLAUDE.md Skills section to the expanded noun grid**
  id: c2-update-claude-skills
  value: high
  effort: low
  phase: C2
  persona: sonnet
  blocks: c2-verify
  exit: CLAUDE.md lists 5 verbs with full noun grid; no stale command names
  tags: docs, edit, P1

- [ ] **2m-extra. Four-Outcomes smoke test script**
  id: c2-smoke-four-outcomes
  value: critical
  effort: medium
  phase: C2
  persona: sonnet
  blocks: c2-verify
  exit: `.claude/commands/` has a tiny smoke doc showing all 4 /close modes emit the correct mark/warn/neutral; verified by inspection or new vitest
  tags: commands, test, P0

- [ ] **2n-extra. Verify loop-coverage table consistency**
  id: c2-verify-coverage
  value: high
  effort: low
  phase: C2
  persona: sonnet
  blocks: c2-verify
  exit: Loop-coverage table in TODO-commands.md matches table in each command file (cross-doc consistency)
  tags: docs, verify, P1

- [ ] **2o. Cleanup — delete 11 old command files**
  id: c2-cleanup
  value: high
  effort: low
  phase: C2
  persona: sonnet
  blocks: c2-verify
  exit: 11 files deleted (tasks, highways, todo, add-task, extract-tasks, wave, work, next, done, report, grow); 5 remain (see/create/do/close/sync)
  tags: commands, edit, P0

- [ ] **2p. Verify C2 — 5 commands live, full noun coverage, green gate**
  id: c2-verify
  value: critical
  effort: low
  phase: C2
  persona: sonnet
  exit: `ls .claude/commands/*.md | wc -l` = 5; every loop L1-L7 has at least one invokable noun; Four Outcomes covered by /close flags; `bun run verify` green; rubric ≥ 0.65
  tags: commands, verify, gate, P0

### Cycle 2 Gate

```bash
ls .claude/commands/*.md | wc -l             # 5
ls .claude/commands/{see,create,do,close,sync}.md  # all present
ls .claude/commands/{grow,next,report,extract-tasks,wave,work,done,todo,tasks,highways,add-task}.md 2>&1 | grep -c "No such"  # 11
bun run verify                               # 326/326
```

---

## Cycle 3: GROW — Sweep + self-documenting verify

**Files:** every `docs/TODO-*.md`, any doc that references old command names,
the root `docs/TODO.md`.

**Depends on:** Cycle 2 complete. Artifacts now match docs.

**Why last:** Clean up stale references. No README cycle — the 5 verbs are
self-documenting (`/see` suggests `/see {noun}`, users figure out the nouns
from the command file itself). The verb names carry their own discoverability.

### Wave 1 — Recon (parallel Haiku × 2)

| Agent | Target | What to look for |
|-------|--------|-----------------|
| R1 | `docs/TODO-*.md` (all TODO files) | Every reference to `/grow`, `/next`, `/report`, `/extract-tasks`, `/wave`, `/work`, `/tasks`, `/highways`, `/done`, `/todo`, `/add-task` |
| R2 | `docs/TODO.md` + other top-level docs | References needing update |

### Wave 2 — Decide (Opus)

Produce a sweep-diff spec. Keep old command names ONLY where they're
historical context (e.g., "the old `/grow` command was renamed to `/sync tick`
as part of 2026-04-14 refinement" in a migration note). Otherwise rewrite.

### Wave 3 — Edits (parallel Sonnet × 2)

| Job | Target | Edit |
|-----|--------|------|
| E1 | `docs/TODO-*.md` sweep | Apply sweep-diff spec |
| E2 | `docs/TODO.md` index refresh | Update Active TODOs + Execution sections |

### Wave 4 — Verify

1. `grep -rn "/grow\|/next\|/report\|/extract-tasks" docs/ | grep -v "migration\|historical"` → 0
2. `bun run verify` — 326/326
3. Rubric ≥ 0.65

### Tasks

- [ ] **3a. Recon all TODO-*.md for old command refs**
  id: c3-recon-todos
  value: high
  effort: low
  phase: C3
  persona: haiku
  blocks: c3-decide
  exit: Report: every line in `docs/TODO-*.md` mentioning an old command name
  tags: docs, recon, P1

- [ ] **3b. Recon docs/TODO.md + top-level docs for cross-refs**
  id: c3-recon-toplevel
  value: high
  effort: low
  phase: C3
  persona: haiku
  blocks: c3-decide
  exit: Report cross-refs in docs/TODO.md and other index docs
  tags: docs, recon, P1

- [ ] **3c. Decide sweep-diff spec**
  id: c3-decide
  value: high
  effort: medium
  phase: C3
  persona: opus
  blocks: c3-sweep-todos, c3-refresh-index
  exit: Sweep diff + index refresh spec
  tags: docs, decide, P1

- [ ] **3d. Sweep docs/TODO-*.md for old commands**
  id: c3-sweep-todos
  value: high
  effort: low
  phase: C3
  persona: sonnet
  blocks: c3-verify
  exit: Zero active references to old commands in any TODO file
  tags: docs, edit, P1

- [ ] **3e. Refresh docs/TODO.md index**
  id: c3-refresh-index
  value: high
  effort: low
  phase: C3
  persona: sonnet
  blocks: c3-verify
  exit: Active TODOs + Execution sections use 5-verb commands
  tags: docs, edit, P1

- [ ] **3f. Verify C3 — sweep clean, green gate**
  id: c3-verify
  value: critical
  effort: low
  phase: C3
  persona: sonnet
  exit: zero stale refs; `bun run verify` green; rubric ≥ 0.65
  tags: docs, verify, gate, P0

### Cycle 3 Gate

```bash
grep -rn "/grow\|/next\|/report\|/extract-tasks" docs/ | grep -vE "migration|historical|archive" | wc -l  # 0
bun run verify                               # 326/326
```

---

## Cost Discipline

| Cycle | Wave | Agents | Model | Est. cost share |
|-------|------|-------:|-------|----------------:|
| 1 | W1 | 5 | Haiku | ~5% |
| 1 | W2 | 0 | Opus (main) | ~10% |
| 1 | W3 | 5 | Sonnet | ~15% |
| 1 | W4 | 1 | Sonnet | ~5% |
| 2 | W1 | 5 | Haiku | ~5% |
| 2 | W2 | 0 | Opus (main) | ~15% |
| 2 | W3 | 6 | Sonnet | ~25% |
| 2 | W4 | 1 | Sonnet | ~5% |
| 3 | W1 | 2 | Haiku | ~5% |
| 3 | W2 | 0 | Opus (main) | ~5% |
| 3 | W3 | 2 | Sonnet | ~5% |
| 3 | W4 | 1 | Sonnet | ~5% |

**Hard stop:** if any Wave 4 loops more than 3 times, halt and escalate.

---

## Status

- [x] **Cycle 1: WIRE** — Docs alignment (dictionary, DSL, routing, CLAUDE.md, engine rule)
  - [x] W1 — Recon (Haiku × 5)
  - [x] W2 — Decide (Opus)
  - [x] W3 — Edits (Sonnet × 5)
  - [x] W4 — Verify (Sonnet × 1)
- [x] **Cycle 2: PROVE** — 12 files → 5 commands + full L1-L7 noun coverage
  - [x] W1 — Recon (Haiku × 5)
  - [x] W2 — Decide (Opus)
  - [x] W3 — Edits (Sonnet × 6) — 5 file writes + cleanup
  - [x] W4 — Verify (Sonnet × 1)
- [x] **Cycle 3: GROW** — Sweep old-command refs across all TODOs + index
  - [x] W1 — Recon (Haiku × 2)
  - [x] W2 — Decide (Opus)
  - [x] W3 — Edits (Sonnet × 7) + W3.5 micro-edits (Sonnet × 5)
  - [x] W4 — Verify (Sonnet × 1) — loop 1 caught 6 additional docs; W3.5 fixed them

---

## Execution

```bash
# Start Cycle 1, Wave 1
/wave TODO-commands.md

# (After C2, this becomes:)
/do TODO-commands.md
```

The migration plan is self-referential: the last invocation of this TODO uses
the old name `/wave`, but after Cycle 2 lands, `/do` takes over. You'll feel
the refactor working when you reach for `/wave` and realize `/do` is better.

---

## The Final Reference Card

```
/see     tasks [--tag T --status S]  open work                               L1
         highways [--limit N]        proven paths                            L2
         frontiers                   unexplored tag clusters                 L7
         toxic                       blocked paths (resistance dominates)    L3
         paths [--from X --to Y]     any path query                          L2
         hypotheses                  what the substrate has learned          L6
         evolved                     agents that rewrote their prompts       L5
         revenue                     per-path earnings                       L4
         events [--since T]          signal history / Four Outcomes audit    L1

         → router: follow() + TypeDB reads

/create  task <name> [--tags --weight]   atomic task into TypeDB             L1
         todo [<source-doc>]             TODO from template or doc extract   L1
         agent <markdown-file>           agent.md → TypeDB unit              L1
         signal <receiver> <data>        ad-hoc signal emission              L1

         → router: send({receiver, data:{tags, weight, content}})

/do      <TODO-file>              advance next wave of that TODO            L1
         <TODO> --auto            run W1→W2→W3→W4 until done                L1
         <TODO> --wave N          run a specific wave                        L1
         (no args)                autonomous loop: select + route + mark     L1
         --once                   single iteration                           L1

         → router: select() + deterministic sandwich

/close   <task-id>               mark() success, self-checkoff               L2
         <task-id> --fail        warn(1) deterministic failure               L2
         <task-id> --dissolved   warn(0.5) missing unit/capability           L2
         <task-id> --timeout     neutral — slow, not bad                     L2
         (no args)               record whole session to substrate           L2

         → router: mark()/warn() — Four Outcomes from routing.md:419

/sync    (no args)               default: tick + scan all markdown           L1-L7
         tick                    fire /api/tick (all L1-L7)                  L1-L7
         fade                    fire L3 only (asymmetric decay)             L3
         evolve                  fire L5 only (rewrite struggling agents)    L5
         know                    fire L6 only (harden + hypothesize)         L6
         frontier                fire L7 only (detect unexplored)            L7
         pay <receiver> <amt>    L4 economic — emit payment signal           L4
         docs                    scan docs/*.md → memory → TypeDB            L6
         todos                   scan TODO-*.md → tasks → TypeDB             L1
         agents                  scan agents/**/*.md → units → TypeDB        L1
         <path>                  any markdown file or directory              L6

         → router: The Tick + knowledge absorption
```

5 verbs. Every loop L1-L7 directly invokable. Four Outcomes fully covered.
Every command is an explicit substrate operation. Nothing hides.

---

## See Also

- [dictionary.md](dictionary.md) — The Six Verbs, The Tick, canonical vocabulary
- [DSL.md](one/DSL.md) — `send()` is the public verb
- [routing.md](routing.md) — The Formula, Two Routing Modes, The Layers (what commands map to)
- [CLAUDE.md](/CLAUDE.md) — Slash Commands block
- [TODO-template.md](one/TODO-template.md) — this template
- [TODO.md](one/TODO.md) — parallel execution plan
- [TODO-signal-shape.md](TODO-signal-shape.md) — sibling: align the `data` payload convention
- [.claude/commands/](../.claude/commands/) — the 12 current → 5 target command files
- [.claude/rules/engine.md](../.claude/rules/engine.md) — The Three Locked Rules

---

*3 cycles. Four waves each. 22 tasks. Docs first, 12-→-5 collapse second, sweep third.
Five verbs: /see /create /do /close /sync. Every loop L1-L7 directly invokable.
Four Outcomes (result/timeout/dissolved/failure) covered by /close flags.
L4 economic exposed via /sync pay. L5/L6/L7 no longer hidden in /sync tick.
Haiku reads, Opus decides, Sonnet writes, Sonnet checks. Rule 1 closed-loop preserved.
Five verbs align the UI with the router. That's perfect alignment.*
