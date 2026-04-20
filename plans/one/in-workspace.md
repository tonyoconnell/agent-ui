---
title: ONE Workspace (the /tasks + /in unification)
slug: in-workspace
goal: "/tasks becomes the unified Apple/Things/Asana-grade workspace; every agent + human lives in it; chat + rubric + pheromone + blocks + split-tests in one surface."
group: ONE
cycles: 7
route_hints:
  primary: [ui, workspace, task-mgmt, inbox]
  secondary: [chat, rubric, pheromone, keyboard, reactflow, shadcn]
rubric_weights:
  fit: 0.30
  form: 0.35
  truth: 0.20
  taste: 0.15
split_tests:
  - cycle: 2.4
    wave: W3
    variants: 2
    dimension: "default landing view — Kanban-first vs Timeline-first"
escape:
  condition: "rubric < 0.50 for 2 consecutive cycles OR Lighthouse a11y score < 90 OR initial render > 500ms"
  action: "emit signal → chairman with the failing metric; pause remaining cycles; preserve shipped work"
downstream:
  capability: unified-workspace
  price: 0.00
  scope: public
source_of_truth:
  - one/task.md
  - one/template-plan.md
  - one/template-todo.md
  - one/dictionary.md
  - one/patterns.md
  - one/rubrics.md
  - .claude/rules/react.md
  - .claude/rules/astro.md
  - .claude/rules/ui.md
status: PLAN
---

# Plan: ONE Workspace

## 1 — Vision

`/tasks` today is a single island (TaskBoard, 974 lines, static shape).
`/in` today reads static JSON. Users and agents have four different surfaces
for what is fundamentally one thing — work assigned, in-flight, or closed.
Collapse them. One page, seven sub-cycles, Apple/Things/Asana-grade UX plus
substrate-native primitives (rubric radar, pheromone badges, wave swim-lanes,
split-test rails, per-agent view-as) that no other task manager can do.

## 2 — Closed loop

```
TypeDB (thing-type="task"/"cycle"/"plan")
  │
  │ /api/tasks (read) + WS broadcast (changes)
  ▼
TaskBoard component (React 19 islands on /tasks page)
  │                               │
  user clicks ─► emitClick()      user types ─► signal composer
  │                               │
  ▼                               ▼
  /api/signal                     /api/signal
  │
  ▼
  /do runs waves ─► marks/warns ─► TypeDB updates ─► WS broadcast ─► UI re-renders
```

Every UI interaction emits a signal. Every substrate signal updates the UI
via the same WebSocket pipe TaskBoard already has.

## 3 — Fronts

| Front | Tags | Rubric tilt | Director picks up |
|-------|------|-------------|-------------------|
| Data layer | [api, typedb, websocket, schema] | 0.40/0.10/0.40/0.10 | CTO |
| UI shell | [ui, layout, astro, islands] | 0.25/0.45/0.20/0.10 | CTO (designer specialist) |
| Views | [board, timeline, graph, burndown] | 0.30/0.40/0.20/0.10 | CTO (designer specialist) |
| Interactions | [keyboard, drag, quick-capture, composer] | 0.30/0.40/0.15/0.15 | CTO |
| Chat integration | [chat, threads, activity-feed] | 0.25/0.35/0.20/0.20 | CTO + CMO (voice) |

## 4 — TQL compile (per-plan, standard)

Per `template-plan.md` §4. Plan → thing(type=plan); 7 cycles → thing(type=cycle); tasks per wave → thing(type=task) with containment + production. No surprises.

## 5 — Wave mechanics

Standard from `template-plan.md` §5. W1 ≥4 Haiku parallel, W2 Opus (shard >20 findings), W3 one Sonnet per file, W4 ≥2 Sonnet verifiers sharded by check type.

## 6 — Deterministic sandwich

Per every cycle's W0: `bun run verify` (biome + tsc + vitest). Plus one workspace-specific gate:

```bash
# New: Lighthouse a11y check on /tasks (non-blocking warn, informational for now; gating from Cycle 2.3 onward)
bun run lighthouse --url=http://localhost:4321/tasks --only=accessibility
```

## 7 — Cycles

### Cycle 2.0 — Data wiring

**Deliverable:** TaskBoard reads new `thing`/task shape. `/api/tasks` returns merged schema. WebSocket messages align. Zero regressions on current board render.

**Exit:** `curl /api/tasks | jq '.[0].task_status'` returns `open|blocked|picked|done|verified|failed|dissolved`. Existing TaskBoard Kanban renders with new statuses mapped to current columns (backwards-compatible display).

**Rubric override:** 0.20 / 0.10 / **0.60** / 0.10 (truth-heavy — data correctness matters most)

| Wave | Target | Agents |
|------|--------|--------|
| W1 | `TaskBoard.tsx` + `/api/tasks/*.ts` + `use-task-websocket.ts` + `tasks-store.ts` | 4 Haiku |
| W2 | Diff spec: status value mapping, new attrs on interface, WS message shape | 1 Opus |
| W3 | TaskBoard types + API route rewrites + WS contract | 3-4 Sonnet (one per file) |
| W4 | Verify render, WS roundtrip, type safety, tests | 2 Sonnet (types shard + integration shard) |

### Cycle 2.1 — Views (Board refactor)

**Deliverable:** Board view shows W1-W4 swim-lanes within a selected cycle. Status columns use new 7-state task-status. Plan tab selector at top. Drag tasks between columns emits `mark`/`warn`.

**Exit:** Can select `task-system` plan → see Cycle 2 with W1-W4 lanes and tasks in each lane.

### Cycle 2.2 — Detail pane + rubric radar

**Deliverable:** Slide-in detail pane (right side) when task clicked. Renders all `task-*` + `rubric-*` attributes. Rubric radar component (SVG, 4-axis). Pheromone strength badge. Blocks/blocked-by list clickable.

**Exit:** Click task → pane opens in <100ms; rubric radar animates in; ESC closes pane.

### Cycle 2.3 — Sidebar + smart lists

**Deliverable:** Left sidebar. Smart lists (Inbox / Now / This cycle / Plans / Tags / Highways / Escape). Per-agent "view as" dropdown (chairman sees all; directors see domain; specialists see own paths). Each is one TQL query parameterized by actor-id.

**Exit:** `?as=cmo` query param filters the board to marketing-tagged tasks only. Switching "view as" updates URL + filters live.

### Cycle 2.4 — Extra views (SPLIT-TEST)

**Deliverable:** Timeline view (cycles horizontal, tasks stacked vertical) + Burndown (rubric trend chart) + Graph view (ReactFlow showing blocks relation).

**Split-test declared:** Variant A = Kanban-first default landing; Variant B = Timeline-first default landing. Deploy both to 50% of sessions; measure time-to-first-action and Lighthouse score; winner marks `default-view:<kanban|timeline>`.

**Exit:** All four views accessible via toggle; each fully keyboard-navigable; split-test variant recorded per session.

### Cycle 2.5 — Quick capture + keyboard nav + signal composer

**Deliverable:** ⌘N (Mac) / Ctrl+N (Windows) opens quick-capture modal with natural-language input. j/k navigate tasks; space opens detail; enter picks; C closes; / focuses search. Bottom drawer in detail pane is the signal composer (receiver + data + tags).

**Exit:** Create a task from quick-capture → it appears in the board in <500ms. Close a task via `C` → rubric prompt appears → submit → pheromone deposits.

### Cycle 2.6 — Chat column + activity feed

**Deliverable:** Chat column (4th pane, collapsible) renders threaded conversation scoped to the selected entity. Activity feed shows every substrate signal about this task (state transitions, marks, warns, variant forks). Uses existing chat components (`/chat` infrastructure).

**Exit:** Select a task → chat thread loads its history; new messages broadcast via WebSocket to all viewers of that task; signal composer at bottom posts to the same thread.

## 8 — Split-test detail (Cycle 2.4)

| Variant | Default landing | Rationale |
|---------|-----------------|-----------|
| A — Kanban-first | Board view loads first | Familiar pattern (Asana, Linear); immediate action |
| B — Timeline-first | Timeline view loads first | Cycle-structural time visible upfront; matches substrate's Rule 2 |

Winner: `(time-to-first-action × 0.4) + (tasks-closed-per-session × 0.4) + (user-rating × 0.2)`.
Loser path: `warn(0.5)` on `default-view:<letter>`. After 50 sessions, winner is cemented.

## 9 — Source of truth

Per frontmatter. Notable: `.claude/rules/ui.md` locks every onClick → `emitClick('ui:tasks:<action>')`. Every interactive element in this workspace MUST emit.

## 10 — Escape

Primary: `rubric < 0.50 for 2 consecutive cycles`. Workspace-specific: `Lighthouse a11y < 90` OR `initial render > 500ms` triggers immediate chairman signal — the whole point is an *amazing* task manager; slow + inaccessible defeats the goal.

## 11 — Downstream pitch

```yaml
capability: unified-workspace
price: 0.00
scope: public
pitch:
  headline: "The workspace that learns how your team works."
  body: |
    /tasks is built on the ONE substrate. Every click is a signal, every
    close deposits pheromone, every rubric score teaches which paths win.
    Over time, the board routes work to the right agent before you assign it.
    Open source. Free. Shipped.
  demo_url: /tasks
  transaction_url: /marketplace/workspace-install
```

Free because the workspace IS the product surface for everything else. Revenue rides on top (capabilities, settlements, discovery fees).

## 12 — Status (auto-derived)

- [ ] **Cycle 2.0 — Data wiring** — 4 waves, 4 files
- [ ] **Cycle 2.1 — Views (board refactor)** — 4 waves
- [ ] **Cycle 2.2 — Detail + rubric radar** — 4 waves
- [ ] **Cycle 2.3 — Sidebar + smart lists** — 4 waves
- [ ] **Cycle 2.4 — Extra views (split-test)** — 4 waves, 2 variants in W3
- [ ] **Cycle 2.5 — Quick capture + keyboard + composer** — 4 waves
- [ ] **Cycle 2.6 — Chat + activity** — 4 waves

## 13 — How to run

```bash
/plan sync plans/one/in-workspace.md      # write plan + 7 cycles + ~100 tasks
/do plans/one/in-workspace.md --auto      # ship all 7 cycles
/plan status plans/one/in-workspace.md    # rubric trend + escape risk
/plan pitch plans/one/in-workspace.md     # at close: publish unified-workspace capability
```

## 14 — Cost discipline

| Cycle | W1 Haiku | W2 Opus | W3 Sonnet | W4 Sonnet |
|-------|---------:|--------:|----------:|----------:|
| 2.0 | 4 | 1 | 3 | 2 |
| 2.1 | 4 | 1 | 3 | 2 |
| 2.2 | 3 | 1 | 2 | 2 |
| 2.3 | 4 | 1 | 3 | 2 |
| 2.4 | 4 | 1 | 4 (2 per variant × 2) | 3 |
| 2.5 | 3 | 1 | 2 | 2 |
| 2.6 | 4 | 1 | 3 | 2 |

Total across 7 cycles: ~26 Haiku, 7 Opus, 20 Sonnet-edit, 15 Sonnet-verify. Estimated LLM cost: **<$5**.

---

## See also

- `todo.md` — dashboard this plan updates on each close
- `one/template-plan.md` — shape spec
- `one/task.md` — entity + state machine
- `src/components/TaskBoard.tsx` — starting point for Cycle 2.0
- `src/components/in/Inbox.tsx` — merges into /tasks at Cycle 2.6
- `src/pages/tasks.astro` · `src/pages/in.astro` — page shells
