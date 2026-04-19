# `/do` Loop Integration — Quick Reference

**One-page guide to how `/do` feeds pheromone into substrate routing.**

---

## The Flow

```
User: /do TODO-rich-messages --auto
        ↓
   W0: Baseline (bun run verify)
        ↓
   W1: Recon (read 4 files in parallel)
   └─ POST /api/tasks/claim → execute → POST /api/tasks/:id/complete
        ↓
   W2: Decide (Opus reads reports, decides changes)
   └─ Tasks marked "ready" (decisions solidify)
        ↓
   W3: Edit (5 Sonnet agents, parallel edits)
   └─ POST /api/tasks/claim → edit file → POST /api/tasks/:id/complete
        ↓
   W4: Verify (tests, rubric scoring)
   ├─ POST /api/loop/mark-dims { fit, form, truth, taste }
   │  └─ marks 4 tagged edges in pheromone
   ├─ POST /api/loop/close { session, outcome, rubric }
   │  └─ closes loop, unblocks cycle 2
   └─ /tasks page updates in real-time (WebSocket)
        ↓
   L4-L7 Growth Loops (substrate, every 10min)
   ├─ L5: Rewrite struggling agent prompts
   ├─ L6: Promote highways to permanent learning
   └─ L7: Detect unexplored tag clusters
        ↓
   Next TODO starts with higher baseline
   (pheromone guides W1 agent selection)
```

---

## Pheromone Tagging

**Each `/do` outcome marks tagged edges:**

```
W1 Recon:
  loop→w1:recon:speed          (how fast?)
  loop→w1:recon:accuracy       (how thorough?)

W2 Decide:
  loop→w2:decide:accuracy      (right decision?)

W3 Edit:
  loop→w3:edit:speed           (how fast?)
  loop→w3:edit:quality         (compiles? tests pass?)

W4 Verify (rubric dimensions):
  loop→w4:fit    (+0.90)       (solved problem?)
  loop→w4:form   (+0.85)       (code clean?)
  loop→w4:truth  (-0.25)       (factually correct?)
  loop→w4:taste  (+0.85)       (style consistent?)
```

**Mark rule:** score ≥ 0.5 → `mark()` | score < 0.5 → `warn()`

---

## Task States

```
TODO created
  ↓
[pending] → claimTask() → [in_progress]
              ↓
           execute()
              ↓
          completeTask() → [complete]
              ↓
       {result|timeout|dissolved|failure}
              ↓
       pheromone updated
       next task unblocked
```

---

## API Calls During `/do`

| When | Call | Purpose |
|------|------|---------|
| W1 start | `POST /api/tasks` (batch) | Create W1 tasks |
| W1 execute | `POST /api/tasks/:id/claim` | Lease task |
| W1 done | `POST /api/tasks/:id/complete` | Mark outcome |
| W2 start | (auto-unblock W2 task) | — |
| W2 decide | (no API calls) | Opus context only |
| W3 start | `POST /api/tasks` (batch) | Create W3 tasks |
| W3 execute | `POST /api/tasks/:id/claim` | Lease task |
| W3 done | `POST /api/tasks/:id/complete` | Mark outcome |
| W4 start | (auto-unblock W4 task) | — |
| W4 verify | `POST /api/loop/mark-dims` | Record rubric |
| W4 close | `POST /api/loop/close` | End loop, unblock next cycle |

---

## Pages Integration

### `/tasks` Page

```
Shows:
  · Task list (priority-sorted)
  · Pheromone categories (attractive/repelled/ready/exploratory)
  · Highways panel (right side, top 10 proven paths)
  · Real-time updates (WebSocket)

Interacts:
  · Click "Claim" → POST /api/tasks/:id/claim
  · Mark "Complete" → POST /api/tasks/:id/complete
```

### Real-Time Updates

```
As /do executes:
  W1 task → [pending] → [in_progress] → [complete]
     ↓ (on complete)
  ws.send({ type: 'task-complete', tid, outcome })
     ↓
  Browser: updateTask() → re-render
  Next task: unblock → moved up priority list
```

---

## Pheromone Learning

**Example: Cycle 1 → Cycle 2**

```
Cycle 1 W4 results:
  fit=0.90 ✓
  form=0.85 ✓
  truth=0.75 ⚠️  (weak)
  taste=0.85 ✓

Pheromone edges marked:
  loop→w4:fit    +0.90   (strong path, repeat)
  loop→w4:form   +0.85
  loop→w4:truth  -0.25   (warn: improve here)
  loop→w4:taste  +0.85

Cycle 2 W1 starts:
  substrate.select() routes to paths where truth dimension weak
  W1 agents get richer context files
  More thorough recon → stronger ground truth for W2
  
Loop learns: "truth improves with richer context in W1"
```

---

## Rubric Dimensions

| Dimension | Measures | Target | Gate |
|-----------|----------|--------|------|
| **fit** | Solves stated problem? | ≥0.70 | ✓ |
| **form** | Code/doc quality? | ≥0.70 | ✓ |
| **truth** | Factually correct? | ≥0.70 | ✓ |
| **taste** | Consistent style? | ≥0.70 | ✓ |

**Cycle gate:** All dims ≥ 0.65, mean ≥ 0.70 to advance.

---

## Outcomes (Rule 1: Closed Loop)

| Outcome | Meaning | Mark/Warn |
|---------|---------|-----------|
| `result` | Success. ✓ | mark(+depth) |
| `timeout` | Slow, not bad. ⏱️ | neutral |
| `dissolved` | Missing capability. ◌ | warn(0.5) |
| `failure` | Agent produced nothing. ✗ | warn(1) |

Every signal closes its loop. No orphans.

---

## `/do` Pseudo-Code

```typescript
async function doTodo(filename: string) {
  // W0
  await verify()  // tests, biome, typecheck

  // W1 (parallel)
  const w1tasks = await createTasks(w1spec)
  for (const t of w1tasks) {
    await claim(t)
    const result = await spawnHaiku(t.context)
    await complete(t, result ? 'result' : 'dissolved')
  }

  // W2 (serial)
  const w2reports = await readW1Reports()
  const decisions = decideChanges(w2reports)
  
  // W3 (parallel)
  const w3tasks = await createTasks(w3spec)
  for (const t of w3tasks) {
    await claim(t)
    await spawnSonnet(t.file, t.anchor, t.new)
    await complete(t, 'result')
  }

  // W4 (parallel)
  const rubric = await verify()  // tests again
  await markDims('loop→builder:cycle:w4', rubric)
  await closeLoop('TODO-name:cycle', 'result', rubric.mean)

  // Cycle gates & unblocks next
  const nextCycleTasks = await createTasks(nextCycleSpec)
}
```

---

## Speed Contract

```
GET  /api/tasks          <10ms   (KV cached)
POST /api/tasks          <5ms    (memory, async TypeDB)
POST /api/tasks/:id/...  <3ms    (fast path)
Task priority recalc     <1ms    (on GET)
```

---

## Remember

1. **Every `/do` cycle creates tasks** in `/api/tasks`
2. **Every task outcome** feeds pheromone (mark/warn)
3. **W4 rubric scores** tag 4 edges (fit/form/truth/taste)
4. **Substrate learns** which paths produce quality work
5. **Next TODO** starts with higher baseline pheromone

**The system teaches itself how to do the next feature better.**

---

*See `/DO-LOOP-INTEGRATION.md` for full details.*
