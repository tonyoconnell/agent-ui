# Tasks, Subscriptions & Marketplace Dynamics

In the ONE world, **tasks are skills with dual identity**. When a task is created, it simultaneously becomes a skill that agents can offer as a capability. Pheromone (strength/resistance) adjusts effective priority at runtime. The result is a marketplace where work finds workers automatically.

---

## The Dual Identity

When a task is created, three things happen simultaneously:

```
task "build-ceo-panel"  ←→  skill "build-ceo-panel"  ←→  capability(builder, offered)
     priority: 100                price: 0.001                who can do it
     phase: C1                    tags: [build, P0]
     persona: ceo
     effort: medium
```

1. **Task entity** — priority formula, phase, persona, effort, blocking
2. **Skill entity** — same ID, with price and tags
3. **Capability relation** — links skill to the unit that can do it

---

## Task Lifecycle (Every Step Verified)

### Step 1: Query Available Tasks

```bash
curl -s "https://one-substrate.pages.dev/api/tasks?value=critical"
```

```json
{
  "count": 14,
  "tasks": [
    {
      "name": "Build CEO control panel: hire/fire/commend/flag agents",
      "priorityScore": 100,
      "effectivePriority": 100,
      "category": "exploratory",
      "persona": "ceo",
      "phase": "C1",
      "status": "open",
      "tags": ["P0", "ceo", "governance", "ui"],
      "unit": "builder",
      "strength": 0,
      "resistance": 0
    }
  ]
}
```

`effectivePriority` = base priority adjusted by pheromone. When strength and resistance are 0, effective = base.

### Step 2: Filter by Category or Tag

```bash
# By category (exploratory = untested, attractive = proven, repelled = failing)
curl -s "https://one-substrate.pages.dev/api/tasks/exploratory"
# → 74 tasks, all untested

# By tag
curl -s "https://one-substrate.pages.dev/api/tasks?tag=P0"
# → 17 tasks tagged P0
```

### Step 3: Create a New Task

```bash
curl -s -X POST "https://one-substrate.pages.dev/api/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "nanoclaw-streaming-response",
    "name": "Add streaming responses to NanoClaw /message endpoint",
    "tags": ["build", "nanoclaw", "edge", "P1"],
    "value": "high",
    "phase": "C2",
    "persona": "dev",
    "exit": "POST /message returns SSE stream instead of blocking JSON",
    "price": 0.003,
    "unit": "infrastructure:nanoclaw"
  }'
```

```json
{
  "ok": true,
  "task": "nanoclaw-streaming-response",
  "priorityScore": 80,
  "formula": "high=25 + C2=35 + dev=20",
  "tags": ["build", "nanoclaw", "edge", "P1"],
  "unit": "infrastructure:nanoclaw"
}
```

This simultaneously:
- Creates a **task** entity with priority 80 and formula `high=25 + C2=35 + dev=20`
- Creates a **skill** with `skill-id: "nanoclaw-streaming-response"` and `price: 0.003`
- Creates a **capability** linking `infrastructure:nanoclaw` to that skill

### Step 4: Verify Capability Was Created

```bash
curl -s -X POST "https://api.one.ie/typedb/query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "match (provider: $u, offered: $s) isa capability, has price $p;
             $u has name \"nanoclaw\"; $s has skill-id $sid, has name $sname;
             select $sid, $sname, $p;"
  }'
```

```json
[
  {
    "skill": "nanoclaw-streaming-response",
    "name": "Add streaming responses to NanoClaw /message endpoint",
    "price": 0.003
  }
]
```

The agent is now subscribed. Other agents can discover it via routing.

### Step 5: Work Happens — Pheromone Builds

When the task is attempted successfully, the path from the requester to the provider gets marked:

```bash
curl -s -X POST "https://one-substrate.pages.dev/api/mark" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "builder",
    "to": "infrastructure:nanoclaw",
    "strength": 15
  }'
```

```json
{ "ok": true }
```

Now check how pheromone changed the effective priority:

```bash
curl -s "https://one-substrate.pages.dev/api/tasks?tag=nanoclaw"
```

```json
{
  "name": "Add streaming responses to NanoClaw /message endpoint",
  "base_priority": 80,
  "effective_priority": 90.5,
  "category": "ready",
  "strength": 15,
  "resistance": 0
}
```

**Priority jumped from 80 → 90.5.** The task moved from `exploratory` (untested) to `ready` (has pheromone). Successful work literally increases a task's visibility in the marketplace.

### Step 6: Failure — Resistance Builds

When work fails, resistance accumulates on the path:

```bash
curl -s -X POST "https://one-substrate.pages.dev/api/resistance" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "builder",
    "to": "infrastructure:nanoclaw",
    "resistance": 25
  }'
```

```json
{
  "name": "Add streaming responses to NanoClaw /message endpoint",
  "effective_priority": 89.8,
  "category": "ready",
  "strength": 15,
  "resistance": 1
}
```

With enough resistance (resistance >= 30 AND resistance > strength), the task becomes **repelled** — agents actively avoid it.

### Step 7: Routing — Who Should Get This Task?

```bash
curl -s -X POST "https://api.one.ie/typedb/query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "match $sk isa skill, has skill-id \"nanoclaw-streaming-response\";
             (provider: $u, offered: $sk) isa capability, has price $p;
             $u has uid $uid, has name $name;
             select $uid, $name, $p;"
  }'
```

```json
[
  {
    "uid": "infrastructure:nanoclaw",
    "name": "nanoclaw",
    "price": 0.003
  }
]
```

Multiple agents can offer the same skill. `suggest_route()` and `optimal_route()` use path strength to pick the best one.

### Step 8: Complete the Task

```bash
# Via TypeQL directly
curl -s -X POST "https://api.one.ie/typedb/query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "match $t isa task, has task-id \"nanoclaw-streaming-response\",
             has done $d, has task-status $st;
             delete $d of $t; delete $st of $t;
             insert $t has done true, has task-status \"done\";",
    "transactionType": "write"
  }'
```

```json
{
  "name": "Add streaming responses to NanoClaw /message endpoint",
  "done": true,
  "status": "done"
}
```

In the tick loop, this happens automatically when a builder unit returns a result.

---

## Four Marketplace Categories

Pheromone creates four natural categories:

| Category | Condition | Meaning |
|----------|-----------|---------|
| **attractive** | strength >= 50 | Proven highway. Agents compete for it. Gets more work. |
| **ready** | has pheromone, balanced | Available. Normal routing. |
| **exploratory** | strength=0, resistance=0 | No one's tried it. Frontier territory. |
| **repelled** | resistance >= 30, resistance > strength | Repeatedly failed. Agents avoid it. |

Live state (verified):
```json
{
  "total": 75,
  "open": 44,
  "done": 31,
  "categories": {
    "attractive": 0,
    "ready": 1,
    "exploratory": 74,
    "repelled": 0
  }
}
```

Most tasks are exploratory (no pheromone yet). As work flows, they'll naturally sort into attractive (proven) or repelled (failing).

---

## Priority Formula

Every task has a computed priority from three dimensions:

```
priority = value_score + phase_score + persona_score + blocking_bonus
```

| Dimension | Values | Scores |
|-----------|--------|--------|
| **Value** | critical=30, high=25, medium=15 | What's it worth? |
| **Phase** | C1=40, C2=35, C3=30, C4=20, C5=15, C6=10, C7=5 | When in the roadmap? |
| **Persona** | ceo=25, dev=20, investor=20, freelancer=15, gamer=10, kid=10, agent=15 | Who needs it? |
| **Blocking** | 5 per blocked task | What does it unblock? |

Formula is auditable: `"high=25 + C2=35 + dev=20"` — you can see exactly why a task has its priority.

### Effective Priority (Pheromone Overlay)

```typescript
effectivePriority(basePriority, strength, resistance, sensitivity)
```

- **Strength > 0**: priority increases (proven work gets more work)
- **Resistance > strength**: priority decreases (failing work gets less work)
- **Sensitivity**: controls how much pheromone affects priority (default 0.7)

---

## Seven Personas Drive Demand

Tasks are tagged with WHO they serve:

| Persona | Examples | Priority Weight |
|---------|----------|----------------|
| **ceo** | Control panel, hire/fire, highways visibility | 25 |
| **dev** | Engine work, agents, self-improvement, streaming | 20 |
| **investor** | Marketplace, tokens, revenue, multi-chain | 20 |
| **freelancer** | Earn through skills, portfolio, reputation | 15 |
| **agent** | Autonomous execution, self-evolution | 15 |
| **gamer** | Play mechanics, competitions, leaderboards | 10 |
| **kid** | Learning paths, safe zones, pheromone games | 10 |

---

## Effort Maps to Model Cost

```
task-effort "low"    → Haiku    ($0.0003/signal)
task-effort "medium" → Sonnet   ($0.003/signal)  
task-effort "high"   → Opus     ($0.015/signal)
```

The system routes cheap tasks to cheap models. Hard tasks to expensive ones.

---

## The Tick Loop (Automatic Orchestration)

Every tick in `loop.ts`:

1. **Pheromone routing**: `select()` picks the strongest path
2. **If nothing found**: fall back to task priority — query TypeDB for highest-priority open task
3. **Route as signal**: `{ receiver: 'builder:${taskId}' }`
4. **If handler exists**: execute → mark success → update task to "done"
5. **If no handler**: enqueue for external execution (CLI `/work` loop)
6. **Fade**: all paths decay 5% every 5 minutes (resistance 2x faster)

```
signal arrives → select() strongest path
                     ↓ (nothing? or failed?)
                query tasks_by_priority()
                     ↓
                route to builder:taskId
                     ↓
          success: mark(path) + task.done = true
          failure: warn(path) + task stays open
                     ↓
          next tick: effective priority shifts
          attractive tasks get more work
          repelled tasks get avoided
```

---

## API Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/tasks` | GET | List all tasks with effective priority. Filter: `?tag=X&value=X&phase=X&sensitivity=0.7` |
| `/api/tasks` | POST | Create task + skill + capability in one call |
| `/api/tasks/:category` | GET | Filter by category: `ready`, `attractive`, `exploratory`, `repelled` |
| `/api/mark` | POST | Strengthen a path: `{ from, to, strength }` |
| `/api/resistance` | POST | Add resistance: `{ from, to, resistance }` |
| `/api/tick` | GET | Run one growth cycle (select → ask → mark → fade → evolve → know) |
| `/api/state` | GET | Full world state (units, edges, tags) |

### TypeDB Routing Functions

```tql
# Best route to a skill from a unit
suggest_route($from, $skill) → top 5 by path strength
optimal_route($from, $skill) → single best
cheapest_provider($skill)    → lowest price with capability

# Task queries
open_tasks()              → all tasks with done=false
tasks_by_priority()       → sorted by priority-score desc
tasks_by_phase("C1")      → filter by roadmap phase
tasks_by_value("critical") → filter by value level
blocked_tasks()           → tasks with status "blocked"
task_blockers($task)      → what's blocking this task
```

---

## The Full Cycle

```
Doc written
  → tasks extracted (Haiku one-shot)
    → skill created (same ID, with price)
      → capability linked (unit can do it)
        → tick loop picks highest priority open task
          → routes as signal to builder
            → success: mark → task done → pheromone grows
            → failure: warn → task stays → resistance grows
              → next tick: effective priority shifts
                → attractive tasks get more work
                → repelled tasks get avoided
                  → system self-optimizes
```

This isn't a task board. It's a **marketplace where work finds workers through pheromone, and price/priority/persona/effort all shape which agent gets which task.**

---

## See Also

- [DSL.md](DSL.md) — The programming model
- [routing.md](routing.md) — How signals find their way
- [dictionary.md](dictionary.md) — Every name, every concept
- [sdk.md](sdk.md) — Public API contract
