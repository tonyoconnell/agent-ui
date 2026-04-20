# `/do` Loop Integration: Tasks × Pheromone × Waves

**Status:** Design pattern (Shipped core, integration ready)

---

## The Integration

The `/do TODO-{name}` workflow connects to the substrate's L1-L7 loops via:

1. **Tasks API** — `/api/tasks` tracks work in progress, pheromone categories
2. **Loop API** — `/api/loop/mark-dims`, `/api/loop/close` record rubric scores
3. **Pheromone** — W4 rubric scores (fit/form/truth/taste) mark paths for future routing
4. **WebSocket** — Real-time updates to `/tasks` page as work progresses

---

## How It Works

### **Phase 1: Plan Todo (W0-W2)**

```
User creates TODO-rich-messages.md
    ↓
/do TODO-rich-messages --auto
    ├─ POST /api/tasks (create 18 tasks: 3 cycles × 6 tasks each)
    │   Task metadata: cycle, wave, persona, tags, blocks
    │   Each task maps to a TODO checklist item
    │
    ├─ W1 Recon (Haiku agents read code)
    │   → Tasks marked "attractive" (known path, <10 completions)
    │
    ├─ W2 Decide (Opus decides changes)
    │   → Tasks transition to "ready" as decisions solidify
    │
    └─ POST /api/loop/stage ('planning') — record planning phase
```

### **Phase 2: Execute Edits (W3)**

```
W3 spawns Sonnet agents → edit code + docs in parallel
    ↓
Each agent:
    ├─ POST /api/tasks/:id/claim (lease task for 30min)
    ├─ Edit file (code or doc)
    ├─ POST /api/tasks/:id/complete (outcome: result | dissolved)
    └─ Path strength/resistance accumulates
        example: loop→builder:cycle1:w3 → mark or warn
```

### **Phase 3: Verify & Mark (W4)**

```
W4 verification agent runs checks
    ├─ Tests pass? → gather rubric scores
    ├─ Docs consistent? → measure documentation quality
    ├─ Types clean? → integrity dimension
    │
    ├─ POST /api/loop/mark-dims {
    │     edge: 'loop→builder:cycle1:w4',
    │     fit: 0.90,
    │     form: 0.85,
    │     truth: 0.75,
    │     taste: 0.85
    │   }
    │   → marks 4 tagged edges: fit, form, truth, taste
    │
    └─ POST /api/loop/close {
          session: 'TODO-rich-messages:cycle1',
          outcome: 'result',
          rubric: 0.84
        }
        → propagates mark back through all stages
        → unblocks cycle 2 tasks
```

### **Phase 4: Learn & Route (L4-L7 Growth Loops)**

```
Substrate growth loops (automatically, every 10min)
    ├─ L4 Economic: Payment paths strengthened
    ├─ L5 Evolution: Struggling agent prompts rewritten
    ├─ L6 Knowledge: Known highways → permanent learning
    └─ L7 Frontier: Unexplored tag clusters detected
    
    All feed pheromone into future /do routing decisions:
    next TODO's W1 recon tasks → selected by substrate.select()
    highest-strength paths prioritized → what succeeded before, do again
```

---

## Task Mapping

Each TODO cycle creates tasks in `/api/tasks`:

```typescript
// Example: TODO-rich-messages Cycle 1
{
  tid: 'TODO-rich-messages:cycle1:w1-r1',
  name: 'Recon types.ts Signal shape',
  status: 'pending',
  phase: 'W1',      // W1, W2, W3, W4
  value: 'research',
  persona: 'haiku',
  tags: ['recon', 'signal', 'types'],
  blockedBy: [],
  blocks: ['TODO-rich-messages:cycle1:w2'],
  wave: 'W1',
  context: ['nanoclaw/src/types.ts', 'dictionary.md'],
  trailPheromone: 0,
  alarmPheromone: 0,
  priority: computePriority({ value, phase, weight: trailPheromone }),
}
```

**Priority formula:** `value + trailPheromone − alarmPheromone`

**Categories (from `/api/tasks`):**
- `attractive` — trailPheromone ≥ 50 (proven path)
- `repelled` — alarmPheromone > strength (toxic path, avoid)
- `exploratory` — both = 0 (first time)
- `ready` — everything else

---

## Pheromone Tagging

Each `/do` outcome marks tagged edges that feed future decisions:

```
Loop edge format: 'loop→{phase}:{component}:{dimension}'

Examples:
  'loop→w1:recon:speed'        — how fast W1 reads code
  'loop→w2:decide:accuracy'    — how often W2 decisions are correct
  'loop→w3:edit:quality'       — how often W3 edits compile cleanly
  'loop→w4:verify:completeness' — how thorough W4 verification is

Dimensions (from rubrics.md):
  :fit    — solved stated problem?
  :form   — code/doc quality?
  :truth  — factually correct?
  :taste  — consistent style?
```

**Learning pattern:**

```
W4 scores { fit: 0.90, form: 0.85, truth: 0.75, taste: 0.85 }
    ↓
Mark these edges:
  loop→w4:cycle1:fit    +0.90     (strong mark)
  loop→w4:cycle1:form   +0.85
  loop→w4:cycle1:truth  −0.25     (warn: room for improvement)
  loop→w4:cycle1:taste  +0.85
    ↓
Next TODO's W4 will route to units/agents known to improve truth dimension
(because loop learned: "truth scoring was weak here last time")
```

---

## API Contract

### **1. Create Tasks from TODO**

```bash
POST /api/tasks
{
  "name": "W1 Recon types.ts",
  "phase": "W1",
  "value": "research",
  "persona": "haiku",
  "tags": ["recon", "types", "signal"],
  "context": ["nanoclaw/src/types.ts"],
  "blockedBy": [],
  "blocks": ["TODO-rich-messages:cycle1:w2"]
}
→ { tid, priority, category }
```

### **2. Claim Task (during agent execution)**

```bash
POST /api/tasks/:id/claim
→ { leased: true, expiresAt: ... }
```

### **3. Complete Task**

```bash
POST /api/tasks/:id/complete
{
  "outcome": "result",  // result | timeout | dissolved | failure
  "duration": 5432      // milliseconds
}
→ path strengthens: loop→builder:w1:recon → mark or warn
```

### **4. Mark Rubric Dimensions**

```bash
POST /api/loop/mark-dims
{
  "edge": "loop→builder:cycle1:w4",
  "fit": 0.90,
  "form": 0.85,
  "truth": 0.75,
  "taste": 0.85
}
→ marks 4 tagged edges: edge:fit, edge:form, edge:truth, edge:taste
```

### **5. Close Loop**

```bash
POST /api/loop/close
{
  "session": "TODO-rich-messages:cycle1",
  "outcome": "result",
  "rubric": 0.84,
  "reason": "All waves passed, cycle complete"
}
→ propagates mark back through all stages
→ highways visible at /api/loop/highways
```

---

## Pages Integration

### **/tasks Page**

```astro
---
// pages/tasks.astro
import TaskBoard from '@/components/TaskBoard'
const tasks = await fetch('/api/tasks').then(r => r.json())
---
<TaskBoard
  tasks={tasks.tasks}      {/* priority-sorted, pheromone-categorized */}
  highways={highways}      {/* proven paths visible at right */}
  onClaim={handleClaim}    {/* POST /api/tasks/:id/claim */}
  onComplete={handleComplete}  {/* POST /api/tasks/:id/complete */}
/>
```

**Real-time:** WebSocket updates as `/do` waves progress. React islands re-render to show:
- Task status changes (pending → in_progress → complete)
- Pheromone updates (trail/alarm bars grow)
- Priority recalculation (as scores change)
- Highways forming (top paths after W4 mark-dims)

### **/dashboard Page**

```
Shows /api/loop/highways + learn rate:
  - Strongest paths (loop→w3:edit:speed, loop→w4:verify:accuracy)
  - Revenue by path (if x402 wired)
  - Rubric dimension trends (are we improving fit? truth?)
```

---

## Workflow: `/do` + Task API

**Pseudocode for `/do TODO-rich-messages --auto`:**

```typescript
// W0: Baseline
await verifyBaseline()  // tests pass, biome clean

// W1: Recon (parallel)
const tasks = await createTasks('TODO-rich-messages:cycle1:w1', [
  { name: 'W1-R1 types.ts', persona: 'haiku', tags: [...] },
  { name: 'W1-R2 channels.ts', persona: 'haiku', tags: [...] },
])

for (const task of tasks) {
  await claimTask(task.id)
  const report = await spawnHaiku(task.context)
  await completeTask(task.id, report.success ? 'result' : 'dissolved')
}

// W2: Decide (serial)
const decisions = decideChanges(w1Reports)
await createTasks('TODO-rich-messages:cycle1:w2', [
  { name: 'W2 Decide', persona: 'opus', blockedBy: [w1Tasks] }
])

// W3: Edit (parallel)
const editTasks = await createTasks('TODO-rich-messages:cycle1:w3', [
  { name: 'W3-E1 types.ts', persona: 'sonnet', blockedBy: [w2Task] },
  { name: 'W3-E2 channels.ts', persona: 'sonnet', blockedBy: [w2Task] },
])

for (const task of editTasks) {
  await claimTask(task.id)
  await spawnSonnet(task.context)  // edit file
  await completeTask(task.id, 'result')
}

// W4: Verify (parallel)
const verifyTasks = await createTasks('TODO-rich-messages:cycle1:w4', [
  { name: 'W4-V1 Rubric', persona: 'sonnet', blockedBy: [w3Tasks] },
])

const rubric = await verifyCode()  // { fit, form, truth, taste }
await markDims('loop→builder:cycle1:w4', rubric)
await closeLoop('TODO-rich-messages:cycle1', 'result', 0.84)

// Cycle completes
// Next cycle unblocked
```

---

## Pheromone Flow

```
Cycle 1 W4 scoring:
  fit=0.90 → mark loop→w4:fit (+0.90)    [strong]
  form=0.85 → mark loop→w4:form (+0.85) [strong]
  truth=0.75 → warn loop→w4:truth (-0.25) [weak]
  taste=0.85 → mark loop→w4:taste (+0.85) [strong]
    ↓
Pheromone accumulates for 10 min (L5-L7 loops run)
    ↓
Cycle 2 starts:
  /api/tasks?tag=w2&tag=decide
  → prioritizes paths where truth dimension needs work
  → substrate.select() → pick task known to improve accuracy
  → W1 agents read *different* sections to build stronger ground truth
    ↓
Substrate learns: "truth dimension gets better when W1 reads docs + code together"
    ↓
Cycle 3:
  W1 agents get richer context
  Loop strength on truth edge increases
  Next TODO starts with higher baseline
```

---

## What Happens Next

**Integration checklist:**

- [ ] **Cmd: `/do`** — Hook into `/api/tasks` create/claim/complete
- [ ] **Cmd: `/close`** — POST `/api/loop/close` with rubric scores
- [ ] **Pages: `/tasks`** — Show task priority + pheromone + unblock graph
- [ ] **WebSocket** — Real-time task status pushes to browser
- [ ] **Hook: Pre-W2** — Load relevant tasks from `/api/tasks` as context
- [ ] **Hook: Post-W4** — Auto-POST `/api/loop/mark-dims` from rubric scores
- [ ] **Dashboard** — Visualize loop highways + learning rate

---

## Speed Contract

| Operation | Latency | Notes |
|-----------|---------|-------|
| `GET /api/tasks` | <10ms | KV cached |
| `POST /api/tasks` | <5ms | Memory store, async TypeDB write |
| `POST /api/tasks/:id/claim` | <2ms | Lease in memory |
| `POST /api/loop/mark-dims` | <3ms | Mark edges + async sync |
| `POST /api/loop/close` | <5ms | Propagate + unblock next tasks |
| Task priority recalc | <1ms | Done on `GET /api/tasks` |

---

## See Also

- [TODO-template.md](one/TODO-template.md) — The `/do` workflow structure
- [DOCS-FIRST-WORKFLOW.md](DOCS-FIRST-WORKFLOW.md) — Documentation integration
- [routing.md](routing.md) — L1-L7 loops, how pheromone is used
- [rubrics.md](rubrics.md) — Dimension scoring (fit/form/truth/taste)
- [dictionary.md](dictionary.md) — Six Verbs (mark/warn/fade/follow)

---

*The `/do` workflow IS the substrate's work loop. Every TODO cycle teaches the system how to do the next one better.*
