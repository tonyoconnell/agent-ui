# Task Management

The heartbeat of ONE. A task is a signal. A dependency is a continuation. Tags classify. Pheromone ranks.

---

## The Biology

> *"The task an ant performs depends not on any property of the individual, but on what it has experienced recently."*
> -- Deborah Gordon, *Ants at Work*

No task is assigned. Every task is discovered through pheromone signals.

---

## Architecture

```
NERVOUS SYSTEM (runtime)              BRAIN (TypeDB)
────────────────────────              ──────────────
unit.on('build', fn)                  unit persists (model, prompt, gen)
unit.then('build', next)              path persists (strength, alarm)
colony.signal({ receiver })           signal recorded (event log)
colony.scent / colony.alarm           skill registered (capability)
colony.queue                          classification inferred
                    ↕
              Growth Loop
        select → signal → drain → fade → evolve → crystallize
                    ↕
              TaskBoard (what you see)
```

---

## What Is a Task?

A task is a `.on()` handler on a unit:

```typescript
const bob = net.spawn('bob')
  .on('build', async (data, emit) => {
    const result = await buildAPI(data)
    emit({ receiver: 'tester:verify', data: result })
    return result
  })
```

When a signal arrives at `bob:build`, the handler runs. That's a task executing.

## What Is a Dependency?

A dependency is a `.then()` continuation:

```typescript
bob
  .on('schema', async (data) => buildSchema(data))
  .then('schema', result => ({ receiver: 'bob:api', data: result }))
  .on('api', async (data) => buildAPI(data))
  .then('api', result => ({ receiver: 'bob:test', data: result }))
```

`api` can't run until `schema` completes. The continuation chains them. No dependency relation needed.

## What Is a Trail?

Pheromone on the scent map. Every signal delivery auto-marks the edge:

```
signal({ receiver: 'bob:api' }, from = 'bob:schema')
  → mark('bob:schema→bob:api')
  → scent['bob:schema→bob:api'] += 1
```

Success accumulates strength. Failure deposits alarm. Decay forgets over time. No trail entity needed.

## What Are Tags?

Flat labels on skills and units. No hierarchy, no schema change needed to add new ones.

```typeql
insert $s isa skill, has skill-id "api", has name "Build API",
  has tag "build", has tag "wire", has tag "P0";
```

Tags answer **"what is this?"** — pheromone answers **"how well does it work?"**

```
Tags:       build, wire, P0, frontend, infra, payments
Pheromone:  strength 45, alarm 3, traversals 12
```

Together: "Show me all P0 commerce tasks, sorted by trail strength."

```
GET /api/tasks?tag=P0&tag=commerce
```

Units can be tagged too — castes, teams, roles:

```typeql
insert $u isa unit, has uid "scout-1",
  has tag "scout", has tag "team-alpha";
```

### Conventions (not enforced)

| Prefix | Examples | Meaning |
|--------|----------|---------|
| Phase | `wire`, `onboard`, `commerce`, `scale` | Where in the roadmap |
| Priority | `P0`, `P1`, `P2`, `P3` | How urgent |
| Type | `build`, `test`, `review`, `deploy` | What kind of work |
| Domain | `frontend`, `infra`, `payments`, `integration` | Technical area |
| Team | `team-alpha`, `tony`, `david` | Who owns it |

No enforcement. No validation. Just strings. Convention emerges from use.

---

## What Is the Queue?

Signals that can't be delivered yet (receiver doesn't exist). They wait:

```typescript
net.enqueue({ receiver: 'future-agent:task', data: {} })
// Later...
net.spawn('future-agent')  // queued signals auto-deliver
```

The queue replaces "todo" status. A queued signal IS a pending task.

---

## The Four Categories

Every task falls into one category based on pheromone state:

```
ATTRACTIVE       strength >= 50 on inbound edges
                 Colony says: "follow this, it works"

READY            has inbound edges, but below threshold
                 Colony says: "available, no strong signal"

EXPLORATORY      no inbound edges at all
                 Colony says: "unknown — needs a scout"

REPELLED         alarm >= 30 AND alarm > strength
                 Colony says: "avoid — this failed before"
```

Categories are computed at query time from the scent/alarm maps. No inference rules needed.

### API Routes

| Route | Method | What |
|-------|--------|------|
| `/api/tasks` | GET | All tasks with tags, category, pheromone. Filter: `?tag=build&tag=P0` |
| `/api/tasks` | POST | Create task (skill + tags + capability) |
| `/api/tasks/ready` | GET | Category = ready. Supports `?tag=` filter |
| `/api/tasks/attractive` | GET | Category = attractive. Supports `?tag=` filter |
| `/api/tasks/repelled` | GET | Category = repelled. Supports `?tag=` filter |
| `/api/tasks/exploratory` | GET | Category = exploratory. Supports `?tag=` filter |
| `/api/tasks/:id/complete` | POST | Mark outcome (reinforces or alarms path) |

---

## The Growth Loop

`src/engine/loop.ts` — the colony's heartbeat. One tick per interval.

```
select → signal → drain → fade → evolve → crystallize
```

| Phase | What | Interval |
|-------|------|----------|
| SELECT | Probabilistic pick from pheromone-weighted edges | Every tick |
| SIGNAL | Send to the selected receiver | Every tick |
| DRAIN | Process one queued signal | Every tick |
| FADE | Asymmetric decay (trail 5%, alarm 10%) | 5 min |
| EVOLVE | Rewrite prompts of struggling agents | 10 min |
| CRYSTALLIZE | Promote strong paths to permanent (low fade-rate) | 1 hour |

### Selection

`colony.select()` does weighted random with exploration bias:

```
exploration% chance: pick random from any viable edge
otherwise: pick proportional to (scent - alarm)
```

Scouts call `select(type, 0.7)` — 70% exploration.
Harvesters call `select(type, 0.1)` — follow the highway.

### Sequence Learning

The loop tracks `previousTask`. When B executes after A:

```
Success: path(A→B).strength += 5
Failure: path(A→B).alarm += 8, chain breaks
```

The colony learns SEQUENCES. Not "B is good" but "B is good AFTER A."

---

## Pheromone Dynamics

### Accumulation

```
mark('a→b', 5)     strength += 5      (success)
warn('a→b', 8)     alarm += 8         (failure)
```

Alarm is stronger per-event than trail. Two failures can repel a task.

### Decay

```
Every 5 minutes:
  strength *= 0.95    (lose 5% — remember successes)
  alarm *= 0.90       (lose 10% — forgive failures)
```

Asymmetric: failures forgive faster. A task that failed last week may succeed now.

### Crystallization

Every hour, strong paths get near-permanent fade-rate:

```
strength >= 50  →  fade-rate = 0.01  (1% instead of 5%)
```

The colony's long-term memory. These are proven sequences.

---

## Adding Tasks

### Via Chat (primary)

Users ask in natural language. The chat agent interprets and enqueues a signal:

```
User: "Build the signup flow"
Agent: enqueue({ receiver: 'builder:signup', data: { description: '...' } })
```

If the builder unit has a `signup` handler, it executes. If not, the signal waits in the queue until someone spawns a handler for it.

### Via API

```bash
curl -X POST /api/tasks -H 'Content-Type: application/json' \
  -d '{ "id": "signup", "name": "Signup flow", "tags": ["build", "onboard", "P0", "frontend"] }'
```

### Via Continuation

A task that completes can spawn the next task:

```typescript
.on('design', async (data, emit) => {
  const spec = await design(data)
  emit({ receiver: 'builder:implement', data: spec })
  return spec
})
```

### Via Import

`POST /api/tasks/import-roadmap` creates skills, capabilities, and initial paths from the project roadmap.

---

## Boot Sequence

`src/engine/boot.ts` — start the heartbeat:

```typescript
const { world, signal, enqueue, stop } = await boot(complete, 10_000)

// Hydrates pheromone from TypeDB paths
// Spawns units from TypeDB
// Drains queued signals from TypeDB (pending signals)
// Starts the tick loop
```

On restart, nothing is lost:
- Pheromone → loaded from `path` relations
- Queue → loaded from `signal` relations with `success = false`
- Units → spawned from TypeDB unit entities
- Knowledge → crystallized paths have low fade-rate, persist for months

---

## Persistence

### What's in TypeDB (survives restart)

| Entity/Relation | What it stores |
|-----------------|---------------|
| `unit` | Actors: model, system-prompt, generation, success-rate |
| `path` | Pheromone: strength, alarm, traversals, revenue, fade-rate |
| `signal` | Event log: who sent what, success, latency |
| `skill` | What units can do |
| `capability` | Unit + skill + price |
| `hypothesis` | Confirmed beliefs (knowledge loop) |

### What's in runtime (rebuilt on boot)

| Structure | What it stores |
|-----------|---------------|
| `units` | Spawned units with `.on()` handlers |
| `scent` | Pheromone map (hydrated from `path.strength`) |
| `alarm` | Alarm map (hydrated from `path.alarm`) |
| `queue` | Pending signals (hydrated from `signal.success = false`) |

---

## The TaskBoard

The TaskBoard reads from `/api/tasks` which computes categories from TypeDB path data:

```
For each skill with a capability:
  1. Find the provider unit
  2. Sum inbound path strength → total strength
  3. Sum inbound path alarm → total alarm
  4. Classify: attractive / ready / exploratory / repelled
  5. Include unit success-rate, sample-count
```

### What it shows

- **Tasks by category** — color-coded columns (attractive=green, exploratory=blue, repelled=red)
- **Pheromone bars** — strength (green) and alarm (red) per task
- **Unit info** — who handles this, their success rate, generation
- **Queue** — pending signals waiting for handlers
- **Highways** — proven paths between units

---

## Evolution

Every 10 minutes, the loop queries TypeDB for struggling agents:

```
success-rate < 0.50 AND sample-count >= 20
```

For each, the LLM rewrites the system-prompt. `generation++`. The new prompt starts accumulating samples immediately. The substrate measures; the agent evolves.

---

## The Collapse

The old system had task entities, trail relations, dependency relations, 9 TypeDB functions, and 3 separate classification attributes (skill-type, phase, priority). 434 lines of schema.

The new system:

| Old | New |
|-----|-----|
| Task entity | `.on()` handler |
| Trail relation | `scent` map entry |
| Dependency relation | `.then()` continuation |
| `skill-type` attribute | `tag "build"` |
| `phase` attribute | `tag "wire"` |
| `priority` attribute | `tag "P0"` |
| `is_attractive()` function | `strength >= 50` |
| `is_repelled()` function | `alarm >= 30 && alarm > strength` |
| `ready_tasks()` function | `strength > 0 && strength < 50` |
| `exploratory_tasks()` function | No inbound edges |
| Task status lifecycle | Signal delivered or queued |

Tags for what it IS. Pheromone for how well it WORKS.

---

## Claude Code as a Unit

Claude Code is a unit in the colony. Slash commands are the interface:

```
/work              # Autonomous loop: sense → select → execute → mark → repeat
/next              # Pick one task and do it
/tasks             # See what's available (filter: /tasks P0 build)
/add-task ...      # Create a tagged skill
/done skill-id     # Mark complete, reinforce trail
/grow              # Run one growth tick
/highways          # See proven paths and frontiers
/report            # Record this session's outcomes to the substrate
```

### The Autonomous Loop (`/work`)

```
SENSE:   GET /api/tasks → group by category
SELECT:  attractive first, then ready, then exploratory. Never repelled.
EXECUTE: read code, edit files, run tests, fix issues
VERIFY:  tsc --noEmit (no new errors)
MARK:    POST /api/tasks/:id/complete → reinforce trail
GROW:    GET /api/tick?interval=0 → see what the colony learned
LOOP:    go to SENSE
```

Each `/done` teaches the colony. Each `/work` cycle makes it smarter. Multiple Claude Code instances sharing one TypeDB = shared intelligence.

---

## Files

| File | Purpose |
|------|---------|
| `src/engine/substrate.ts` | Colony: signal, mark, warn, fade, queue, select, ask |
| `src/engine/loop.ts` | Tick: 7 loops (signal through frontier) |
| `src/engine/one.ts` | World: colony + TypeDB persistence |
| `src/engine/boot.ts` | Hydrate + spawn + breathe |
| ~~asi.ts~~ | deleted — routing is in the loop (select → ask → mark/warn) |
| `src/pages/api/tasks/` | Task visibility + creation + completion |
| `src/pages/api/tick.ts` | Growth loop endpoint |
| `src/schema/one.tql` | TypeDB schema: units, paths, skills, tags, knowledge |
| `.claude/commands/` | Slash commands: work, next, tasks, done, grow, highways, report |

---

## See Also

- [claude-code-integration.md](claude-code-integration.md) -- Full guide for Claude Code as a substrate agent
- [loops.md](loops.md) -- The seven nested feedback loops
- [substrate-learning.md](substrate-learning.md) -- How routing IS learning
- [signal.md](signal.md) -- The universal primitive
- [emergence.md](emergence.md) -- How intelligence emerges from simple rules

---

*A task is a signal. A dependency is a continuation. The colony learns what works.*
