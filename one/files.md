# Files — The ONE File Structure

How we organize, name, and navigate our documentation and task system.
**The folder is the brand. The filename is the topic. The tree is the ontology.**

> Status: **spec** (not yet executed). This file describes the target layout.
> Migration is a W3 task sequenced by `one/todo.md` once this doc lands.

---

## The Rename: `docs/` → `one/`

```
envelopes/
  docs/    ← today (255 files, mixed prefixes)
  one/     ← target (same files, topic-first names, ontology-grouped)
```

**Why `one/`:** the platform is called ONE. The docs describe ONE. Folder names
should match the mental model. Nothing else changes in the rename — no file
contents, no schema, no slash commands (yet). It's cosmetic, but cosmetic
consistency compounds: every `grep -r one/` call now searches *the ONE*, not
an abstract `docs` bucket.

**What stays:** all content, all internal links (fixed in-flight), all six
canonical docs (`dictionary.md`, `DSL.md`, `one-ontology.md`, `routing.md`,
`rubrics.md`, `lifecycle.md`). The ontology is the brain; these six are its
neurons.

---

## Naming Convention: Topic-First, Type-Suffix

Three file types per topic. Sort topic-first, type-suffix second.

```
chat.md           ← the spec / reference / user-facing narrative
chat-plan.md      ← the "how we'll build it" (W2 decisions, architectural)
chat-todo.md      ← the atomic tasks (W1–W4 cycles, checkboxes, metadata)
```

| Type          | Purpose                          | Wave owns it | Pheromone  |
|---------------|----------------------------------|--------------|------------|
| `<topic>.md`  | What it is. User + agent facing. | W2+W3 both   | —          |
| `<topic>-plan.md` | How we'll build it. Tradeoffs. | W2 (decide)   | mark on pick |
| `<topic>-todo.md` | What to do next. Atomic.       | W1–W4 cycle   | mark/warn per close |

### Before → After

```
docs/TODO-chat.md             → one/chat-todo.md
docs/PLAN-chat.md             → one/chat-plan.md
docs/chat-fabric.md           → one/chat-fabric.md
docs/CHAT_ARCHITECTURE.md     → one/chat-architecture.md
docs/TODO-marketplace-c3-w2.md → one/marketplace-c3-w2-todo.md
docs/DECISION-SUI-Phase3-W2.md → one/sui-phase3-w2-decision.md
```

All-caps prefixes (`TODO-`, `PLAN-`, `DECISION-`, `CHAT_`) disappear. Caps
are shouting; the tree should whisper. Case follows kebab-lowercase
throughout.

### Reserved suffixes

```
-plan.md      W2 decisions, tradeoffs, locked scope
-todo.md      W1–W4 task lists with metadata (id, phase, tags, blocks)
-decision.md  one-shot architecture calls (lifecycle frozen, not ongoing)
-shipped.md   retrospective: what landed, what we learned
-spec.md      external contract (ADL, SDK, MCP surface)
```

Anything without a suffix is the **canonical doc** for that topic — the one
that compiles into product and powers search/embeddings.

---

## The Orchestrator: `one/todo.md`

One file. Reads all `*-todo.md`. Sequences by pheromone + priority + blockers.

```
one/todo.md
├── reads: one/*-todo.md                         (all ~59 topic TODOs today)
├── emits: tasks-store                           (the same store /api/tasks reads)
├── ranks: priority (P0→P3) × pheromone × unblocked
└── writes: the top N into "Today" column        (the Kanban /tasks lands here)
```

### What `one/todo.md` actually contains

```markdown
# ONE — Master Task Ledger

**Purpose:** single source for what to do next, derived from all *-todo.md files.
**Updated:** by /sync todos (reads every *-todo.md) + /close (pheromone feedback).
**View it at:** /tasks (the Kanban) or run `/see tasks`.

## Now (Today · P0 · unblocked · hot pheromone)
- [ ] chat-todo.md · C3 W2 · `wire-claim-button` · strength 3.2
- [ ] sui-phase3-todo.md · C5 W3 · `escrow-settle-test` · strength 2.1
- [ ] memory-todo.md · C4 W4 · `forget-audit-log` · strength 1.8

## Next (P1 · unblocked · warm)
- [ ] marketplace-c3-w2-todo.md · `discover-tag-filter`
- [ ] governance-todo.md · `role-check-chairman-ui`

## Blocked (dependency chain)
- [ ] commerce-todo.md · `settle-with-fee` ← blocks on escrow-settle-test
- [ ] revenue-todo.md · `treasury-mirror` ← blocks on sui-phase3

## Queued (P2–P3 · cold · optional)
- [ ] design-system-todo.md · ...

## Done this cycle
- [x] cf-workers-migration-todo.md (2026-04-18) · rubric 0.91
- [x] agentverse-bridge-todo.md (2026-04-18) · rubric 0.88
```

### Sequencing algorithm

```typescript
priority(task) =
    (P0=4, P1=3, P2=2, P3=1)[task.priority]
  × (1 + pheromone.strength(task.path))
  ÷ (1 + pheromone.resistance(task.path))
  × (task.blockedBy.length ? 0 : 1)   // blocked = deferred to column
```

Top 3 → **Now**. Next 5 → **Next**. Blocked → **Blocked**. Rest → **Queued**.
Same formula the substrate uses for `.select()` — one routing law, two
surfaces (runtime signals + UI tasks).

---

## The Kanban at `/tasks`

Inspired by Things (Mac) for clarity, Asana for power, our substrate for truth.

### Column layout (Things-style, substrate-backed)

```
┌─────────────────┬──────────────┬───────────────┬──────────────┬──────────────┐
│  INBOX          │  TODAY       │  IN PROGRESS  │  REVIEW       │  DONE        │
│  new, untriaged │  P0 + hot    │  status=      │  W4 verify    │  status=     │
│                 │  pheromone   │  in_progress  │  pending      │  complete    │
│  no phase yet   │              │               │               │              │
├─────────────────┼──────────────┼───────────────┼──────────────┼──────────────┤
│                 │              │               │               │              │
│  [ ] task-a     │  [ ] task-c  │  [→] task-e   │  [?] task-g   │  [x] task-i  │
│  [ ] task-b     │  [ ] task-d  │  [→] task-f   │  [?] task-h   │  [x] task-j  │
│                 │              │               │               │              │
└─────────────────┴──────────────┴───────────────┴──────────────┴──────────────┘
                                        ▲
                              BLOCKED ◄──┘ sidebar panel
                              tasks waiting on dep chains
```

| Column      | Filter                                 | Auto-move trigger                    |
|-------------|----------------------------------------|--------------------------------------|
| Inbox       | `phase == null`                        | `/create task` no phase              |
| Today       | `P0` + `blockedBy == []` + hot strength | `/sync todos` ranks daily           |
| In Progress | `status == in_progress`                | `/do` picks it up                    |
| Review      | W3 edits done, W4 verify pending       | W3 close, no W4 mark yet            |
| Done        | `status == complete`                   | `/close <tid>` marks + cascades      |
| Blocked     | `blockedBy.length > 0` (sidebar)       | `/create task --blocks`              |

Drag = signal. Dropping a card emits `ui:tasks:move` with `{tid, from, to}`.
The substrate marks a path edge (e.g. `inbox→today` for triage). Over time
the board teaches us which triage patterns compound.

### Views (toggle in header, Asana-style)

```
╔══════════════════════════════════════════════════════════════════╗
║  [ Board ]  [ List ]  [ Timeline ]  [ By Tag ]  [ By Dimension ] ║
╚══════════════════════════════════════════════════════════════════╝
```

**Board** (default) — the 5-column Kanban above.

**List** — flat sortable table. Columns: id, name, phase, status, priority,
tags, blockedBy, strength, resistance, lastMark. Sortable by each. This is
the power view for audits and bulk triage.

**Timeline** — horizontal Gantt-lite. X-axis = cycle (C1…C7). Y-axis =
dimensions (Groups/Actors/Things/Paths/Events/Learning). Bars colored by
phase. Shows *when a cycle of work touches which dimension* — you can see
the 6-dimension ontology move through time.

**By Tag** — tag cloud on top, filtered board below. Click `build` → only
build tasks render across all columns. Multi-select unions (`build` + `P0`).
Same tag model as skills — flat labels, no hierarchy.

**By Dimension** — six lanes, one per dimension:
```
Groups   | [task-a] [task-b]             ← team/world/org work
Actors   | [task-c] [task-d] [task-e]    ← agent creation, governance
Things   | [task-f]                       ← skills, capabilities, tasks themselves
Paths    | [task-g] [task-h]              ← routing, pheromone, highways
Events   | [task-i]                       ← signal history, audit
Learning | [task-j] [task-k]              ← hypotheses, frontiers, rubrics
```
This view makes the ontology visceral — you literally see which dimension
is under-served and which is hot.

### Task card (Things-style compact, Asana-style expandable)

```
┌──────────────────────────────────────────────────────┐
│ ● wire-claim-button                      P0 · C3 · W2│
│   chat-todo.md · chat, commerce                      │
│   ━━━━━━━━━━━▌ strength 3.2   resistance 0.1         │
│   blocks: settle-with-fee                            │
└──────────────────────────────────────────────────────┘
```

Click → expands to full metadata panel (right sidebar): description, W1
recon notes, W2 decisions, subtasks, linked signals, pheromone history
sparkline, rubric scores on close.

### Time views (Things-style lists in a sidebar)

```
◆ Today          17     ← top of priority queue
◆ Upcoming        4     ← scheduled tasks with `due` metadata
◆ Anytime        42     ← no date, can be picked anytime
◆ Someday        21     ← deferred, out of W0 baseline
◇ Logbook       181     ← done, searchable, read-only
```

"Today" is the same task set as the Kanban **Today** column, but in a
single scrolling list — the focus view when you just want to do the work,
not visualize the board.

---

## Proposed `one/` Tree (shape, not exhaustive)

```
one/
├── README.md                    ← landing (replaces docs/CLAUDE.md index role)
├── files.md                     ← this doc: how we organize
├── todo.md                      ← the orchestrator
│
├── dictionary.md                ← canonical names (locked 2026-04-13)
├── dsl.md                       ← signal grammar
├── one-ontology.md              ← the 6 dimensions
├── routing.md                   ← L1–L7 loops + formula
├── rubrics.md                   ← fit/form/truth/taste
├── lifecycle.md                 ← agent journey
├── metaphors.md                 ← 7 skins
│
├── chat.md                      ← topic: chat (canonical)
├── chat-plan.md                 ← topic: chat (plan)
├── chat-todo.md                 ← topic: chat (atomic tasks)
├── chat-memory.md               ← subtopic
├── chat-sanitize-todo.md        ← subtopic tasks
│
├── marketplace.md
├── marketplace-plan.md
├── marketplace-todo.md
├── marketplace-c3-w2-todo.md    ← cycle/wave-specific TODOs keep cycle tag
│
├── sui.md
├── sui-phase2-shipped.md        ← retrospectives
├── sui-phase3-decision.md       ← architecture calls
├── sui-phase3-todo.md
│
├── deploy.md
├── deploy-todo.md
│
├── archive/                     ← retired docs, kept for history
└── copy-reports/                ← agent-generated ephemera (keep here)
```

---

## Migration (when we execute)

Not in this cycle. When the topic is picked up:

1. **W1 recon** — list every `docs/*.md`, classify type (spec/plan/todo/decision).
2. **W2 decide** — lock the rename map (this file's "before → after" table).
3. **W3 edit** (parallel):
   - `git mv docs/ one/` (preserves history)
   - `rename TODO-*.md → *-todo.md`, `PLAN-*.md → *-plan.md`, `DECISION-*.md → *-decision.md`
   - Rewrite in-file links: `docs/xyz.md` → `one/xyz.md`
   - Update `CLAUDE.md` path references (6 canonical docs, nested CLAUDE.md
     files, hooks, slash commands).
   - Update `scripts/sync-todos.ts` glob from `docs/TODO-*.md` to
     `one/*-todo.md`.
4. **W4 verify** — `grep -r "docs/" .` returns only archive/external
   references; all 320 tests still green; `bun run build` succeeds; deploy
   smoke passes.

**Pheromone risk:** every link in git history points at `docs/`. The rename
breaks nothing at runtime (git mv preserves blame), but external references
(blog posts, GitHub issues, external integrations) will 404. Acceptable —
this is internal naming; we control the search surface.

---

## Why This Compounds

Three rules from CLAUDE.md apply directly to the file tree itself:

1. **Closed Loop** — every TODO closes via `/close <tid>`. `mark()` on
   success, `warn()` on fail. `one/todo.md` re-ranks from that feedback.
   The file tree learns which topics ship.

2. **Structural Time** — no date-prefixed files (`2026-04-*`). Topics live
   forever; cycles and waves are tags, not folders. You can read
   `chat-todo.md` from 2026 or 2030 and it's still the same file, growing.

3. **Deterministic Results** — every close writes a rubric score to the
   corresponding `-shipped.md` or inline in `-todo.md`. The tree accumulates
   verified numbers, not vibes. `grep "rubric=" one/` is the project's
   lifetime quality log.

One substrate. One ontology. One folder. One way to name a file. One
orchestrator. One board.

*— see also: [dictionary.md](dictionary.md), [routing.md](routing.md),
[rubrics.md](rubrics.md), [TODO-template.md](one/TODO-template.md)*
