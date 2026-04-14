You are an autonomous agent working through the ONE substrate. Your job: pick a task, do it, mark it done, pick the next one.

SESSION_ID="claude-$$-$(date +%s)"

**Canonical loop:** [`docs/work-loop.md`](../../docs/work-loop.md) — 26 stages with deterministic PRE gates. This skill implements the ACT+CLOSE halves (SENSE→SELECT→EXECUTE→VERIFY→MARK→GROW). The INGEST half below runs once at session start; gated context loads run as the task demands.

**GATED: W0 baseline must pass before starting work.**

## INGEST — Context load (once per session, gated)

Before SENSE, walk the gates from `docs/work-loop.md`:

**Always load (cheap, universal):**
- `sync` — `git status`, `git log -5`, current branch
- `recall` — `MEMORY.md` (auto-loaded), `curl /api/state | jq '.highways'`
- `dictionary` — `docs/naming.md` (2KB, changes semantics of everything)
- `rubric` — `docs/rubrics.md` (scoring applied at VERIFY)

**Gate, load only on match:**

| Gate | Condition | Load |
|------|-----------|------|
| schema | task tags include `schema`/`engine`/`api` OR touches `.tql` | `src/schema/one.tql` |
| types  | task touches `src/engine/*` or `src/pages/api/*` | relevant `.ts` interfaces |
| dsl    | task touches engine or routing | `docs/DSL.md` |
| patterns | file glob match | `.claude/rules/{engine,react,astro}.md` |
| skills | keyword match: "tql"→`/typedb`, "deploy"→`/deploy`, "sui"→`/sui` | skill file |

**Produce at plan (highest-leverage artifact):**
- `relevant-files` — pinned list of `path:line-range — why` through code→test

Skip gated loads whose condition misses. Loading everything always burns context for no gain — same principle as `workers/sync/index.ts` hash-gated KV writes.

**Emit a stage signal at each load so the substrate measures the loop itself:**

```bash
# helper — call after loading each stage's context
stage() {
  curl -s -X POST http://localhost:4321/api/loop/stage \
    -H 'Content-Type: application/json' \
    -d "{\"session\":\"$SESSION_ID\",\"stage\":\"$1\"}" > /dev/null
}

stage sync
stage recall
stage dictionary
# gated — only if the PRE condition matched:
# stage schema; stage types; stage dsl; stage patterns; stage skills
stage frame
```

Skipped stages leave no trail (zero returns). Over 100+ sessions, `/api/loop/highways` shows which stage order actually pays off — the loop becomes a learned highway, and `docs/work-loop.md` gets rewritten from data.

## W0 Gate — Baseline (before first task)

Before picking any task, verify the codebase is healthy:

```bash
bun run verify     # biome check . && tsc --noEmit && vitest run
```

**If baseline fails:** Fix it first. Do not build on broken ground. The deterministic sandwich PRE check ensures the substrate starts clean.

Record the result: which tests passed, any known failures. This baseline is the reference for W4 verification later.

**Rubric context:** Read `docs/rubrics.md` — you will score your work against fit/form/truth/taste before marking done.

## The Loop

Run this loop until the user stops you or all tasks are done:

### 1. SENSE — Read what's available

```bash
curl -s http://localhost:4321/api/tasks | jq '.tasks | map(select(.status == "open")) | sort_by(-.priority) | map({tid, name, priority, category, blockedBy, blocks: (.blocks | length), tags})'
```

If the server isn't running, start it with `bun run dev` and wait for it.

### 2. SELECT — Pick the best task

Scan the task list top-to-bottom (highest priority first). **Skip any task where `blockedBy` is non-empty** — those tasks have open dependencies that must complete first.

Report: `Working on: {task name} (priority: {score}, category: {category}, wave: {wave}, blocks: {n} others)`

If all open tasks are blocked, report the deadlock and fall back to pheromone-based routing:
```bash
curl -s http://localhost:4321/api/state | jq '.highways | sort_by(-.strength) | .[0:5]'
```

Within unblocked tasks, prefer:
- **P0** over P1 over P2
- Higher priority-score (formula already computed)
- Tags matching current context (if you just did "build", keep building)

Tell the user what you picked and why.

### Wave detection and model routing

After selecting a task, read its `wave` field and route to the matching unit:

```
Wave → unit         → model
W1   → builder:W1   → haiku   (recon — cheap, fast, broad)
W2   → builder:W2   → opus    (decide — expensive, thorough)
W3   → builder:W3   → sonnet  (edit — balanced)
W4   → builder:W4   → sonnet  (verify — balanced)
```

```bash
WAVE=$(echo "$TASK" | jq -r '.wave // "W3"')   # default W3 if absent
UNIT="builder:$WAVE"
# Use this UNIT as the signal receiver when routing work through the substrate.
# The model selection follows automatically from modelForWave(task.wave) in the engine.
```

# CLAIM: atomic transition to active
while true; do
  RESULT=$(curl -s -X POST http://localhost:4321/api/tasks/$TASK_ID/claim \
    -H 'Content-Type: application/json' \
    -d '{"sessionId":"'$SESSION_ID'"}')
  if echo "$RESULT" | grep -q '"ok"'; then break; fi
  TASK=$(curl -s http://localhost:4321/api/tasks | jq '.[] | select(.status=="open")' | head -1)
done

### 3. EXECUTE — Do the work

Actually implement the task. This means:
- Read relevant code
- Write/edit files
- Run tests if applicable
- Fix any issues

This is the real work. Take your time. Get it right.

### 4. VERIFY — Make sure it works

```bash
bun tsc --noEmit 2>&1 | grep -v archive | grep "error TS" | head -10
```

If there are errors in files you touched, fix them before marking done.

### 5. MARK — Report the outcome

On success:
```bash
curl -s -X POST http://localhost:4321/api/tasks/$TASK_ID/complete \
  -H 'Content-Type: application/json' \
  -d '{"from":"'$SESSION_ID'"}'
```

On failure (couldn't complete, blocked, needs human input):
```bash
curl -s -X POST http://localhost:4321/api/tasks/SKILL_ID/complete \
  -H 'Content-Type: application/json' \
  -d '{"failed": true, "from": "claude"}'
```

### 5b. CLOSE THE WORK LOOP — propagate outcome as pheromone

Score the task (fit/form/truth/taste → 0..1) and close the stage chain:

```bash
# on success — rubric scales chain bonus
curl -s -X POST http://localhost:4321/api/loop/close \
  -H 'Content-Type: application/json' \
  -d "{\"session\":\"$SESSION_ID\",\"outcome\":{\"result\":true},\"rubric\":0.8}"

# on failure
curl -s -X POST http://localhost:4321/api/loop/close \
  -H 'Content-Type: application/json' \
  -d "{\"session\":\"$SESSION_ID\",\"outcome\":{\"failure\":true}}"
```

This marks/warns every stage edge in the chain. Good-taste sessions reinforce their order more; failed sessions leave resistance on the last stage that produced nothing.

### 5c. markDims — per-dimension pheromone (W4 tasks with rubric scores)

If the completed task has rubric scores (fit/form/truth/taste), emit four tagged-edge marks so the graph learns which quality dimensions are strong or weak per skill path.

```bash
# Only when the task has rubric scores — skip if absent
EDGE="$SESSION_ID→$TASK_ID"
curl -s -X POST http://localhost:4321/api/loop/mark-dims \
  -H 'Content-Type: application/json' \
  -d "{\"edge\":\"$EDGE\",\"fit\":0.8,\"form\":0.75,\"truth\":0.9,\"taste\":0.7}"
```

This writes four separate paths — `edge:fit`, `edge:form`, `edge:truth`, `edge:taste` — rather than a single binary mark. Over many cycles the graph accumulates dimensional signal: which skills consistently hit truth but miss taste, which waves tend to slip on form. The `markDims()` threshold is 0.65 to mark and <0.5 to warn; 0.5–0.64 is neutral (no deposit either way).

### 6. GROW — Check what changed

```bash
curl -s http://localhost:4321/api/tick?interval=0 | jq .
curl -s http://localhost:4321/api/loop/highways?limit=10 | jq .
```

Report: what highways formed, what evolved, what frontiers were detected, and which stage transitions are accumulating pheromone. Compare `loop:*` highways to the canonical order in `docs/work-loop.md` — divergence is what the substrate learned.

### 7. CONTINUE — Go to step 1

Pick the next task. The pheromone landscape has shifted — your success strengthened a path. New tasks may have become attractive. Follow the path.

## Creating Tasks Along the Way

If you discover work that needs doing while implementing a task (a missing utility, a broken import, a needed refactor), create it:

```bash
curl -s -X POST http://localhost:4321/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"id": "fix-auth-import", "name": "Fix broken auth import", "tags": ["fix", "P0", "infra"]}'
```

Tag it accurately. The world needs good signal.

## Rules

- **One task at a time.** Complete or fail before moving on.
- **Honest outcomes.** If it failed, mark it failed. Resistance is how the world learns what doesn't work. False positives poison the data.
- **Follow the pheromone.** If the world says a path is attractive, trust it — previous work proved it.
- **Scout sparingly.** Exploratory tasks are high-risk. Don't spend all your time on unknowns.
- **Create tasks for surprises.** Found a bug? Create a task. Need a dependency? Create a task. The world sees everything you teach it.
