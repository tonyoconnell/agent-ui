# Agent, Group, Coordination

Three levels. Same primitives. ONE ontology.

---

## The Primitive

```typescript
type Signal = {
  receiver: string
  data?: unknown
}
```

## Biological Grounding

From Deborah Gordon's research on ant colonies:

- **No ant sends messages** — they DROP signals (pheromones)
- **Others FOLLOW the weighted paths** — sensing, not receiving
- **Return rate activates** — more foraging (positive feedback)
- **Absence of signal IS a signal** — paths fade without reinforcement
- **Intelligence lives in paths, not nodes** — the network learns

---

## The ONE Foundation

Group is `world()` with multiple actors. The 6 dimensions apply:

```
GROUP = world()
│
├── Groups    → Group hierarchy (group of groups)
├── Actors    → Agents (units with tasks)
├── Things    → Resources, tasks, outputs
├── Paths     → Strength trails (weighted paths)
├── Events    → Signal history
└── Knowledge → Known patterns (highways)
```

---

## Agent

A unit with tasks:

```typescript
const agent = unit('translator')
  .on('translate', async ({ text, to }, emit, ctx) => {
    const result = await model.translate(text, to)
    emit({ receiver: ctx.from, data: { result } })
  })
  .on('detect', async ({ text }, emit, ctx) => {
    const lang = await model.detect(text)
    emit({ receiver: ctx.from, data: { lang } })
  })
```

**Agent = Unit + Capabilities**

```
┌─────────────────────────────────────┐
│            AGENT                     │
│                                      │
│   id: "translator"                   │
│                                      │
│   tasks:                             │
│     translate(text, to) → result     │
│     detect(text) → lang              │
│                                      │
│   receives: Signal                   │
│   emits: Signal                      │
│                                      │
└─────────────────────────────────────┘
```

## Group

A `world()` of agents working together. Groups organize. Paths connect. Actors act.

```typescript
import { world } from '@/engine/one'

const group = world()

// Groups organize the group
group.group('research', 'team')
group.group('execution', 'team')

// Actors are agents
const scout = group.actor('scout', 'explorer', { group: 'research' })
  .on('explore', async ({ url }, emit) => {
    const data = await fetch(url).then(r => r.json())
    emit({ receiver: 'analyst', data: { data } })
  })

const analyst = group.actor('analyst', 'analyzer', { group: 'research' })
  .on('default', async ({ data }, emit) => {
    const insight = analyze(data)
    emit({ receiver: 'writer', data: { insight } })
  })

const writer = group.actor('writer', 'reporter', { group: 'execution' })
  .on('default', async ({ insight }, emit, ctx) => {
    const report = format(insight)
    emit({ receiver: ctx.from, data: { report } })
  })

// Kick off - signal traverses through the world
group.signal({ receiver: 'scout:explore', data: { url } }, 'user')
```

**Group = world() with Actors**

```
┌─────────────────────────────────────────────────────────────────┐
│                      GROUP (world)                               │
│                                                                  │
│   GROUPS:                                                        │
│   ├── research                     ├── execution                │
│   │                                │                            │
│   │   ┌─────────┐  ┌──────────┐   │   ┌────────┐               │
│   │   │  SCOUT  │→→│ ANALYST  │───┼──→│ WRITER │               │
│   │   │         │  │          │   │   │        │               │
│   │   │ explore │  │ analyze  │   │   │ format │               │
│   │   └─────────┘  └──────────┘   │   └────────┘               │
│   │                               │                             │
│   └───────────────────────────────┴─────────────────────────────│
│                                                                  │
│   PATHS (weighted):                                              │
│     scout→analyst: 12.5   (open path - proven)                  │
│     analyst→writer: 8.3   (strengthening)                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Group Naming

Groups have a canonical `name` (e.g., `"marketing"`) that can be edited. Per-skin type-suffixes, hull-colors, and rendering change by metaphor, but the group id never changes and routing always uses it. The name serves humans; the id serves signals.

**Ant Skin:**
```
group id: "marketing"
group name: "Marketing Colony"
type: "colony"
hull-color: #FFB347  (orange)
```

**Team Skin:**
```
group id: "marketing"
group name: "Marketing Team"
type: "team"
hull-color: #4A90E2  (blue)
```

Signal flow: same `"marketing"` id. Visual rendering: different "colony" vs "team" labels, different colors. Name editable by owner. Id immutable. That's the contract.

---

## Coordination

Paths emerge from outcomes. This is the Paths dimension in action:

```typescript
// Success: mark weight on the path (leave strength)
group.path('scout', 'analyst').mark(1)

// Failure: resist the path
group.path('scout', 'analyst').warn(1)

// Time passes: fade all paths (strength evaporates)
group.fade(0.1)

// Follow the strongest paths (proven routes)
group.open(10)  // → strongest paths

// Sense blocked paths (routes to avoid)
group.blocked() // → paths with high resistance
```

**Coordination = Emergent Paths**

```
                    BEFORE (random routing)
                    
    ┌─────────┐     ┌─────────┐     ┌─────────┐
    │ Scout A │     │Analyst 1│     │Writer X │
    └────┬────┘     └────┬────┘     └────┬────┘
         │               │               │
    ┌────┴────┐     ┌────┴────┐     ┌────┴────┐
    │ Scout B │     │Analyst 2│     │Writer Y │
    └─────────┘     └─────────┘     └─────────┘
    
         ?───────────────?───────────────?


                    AFTER (open paths emerge)
                    
    ┌─────────┐     ┌─────────┐     ┌─────────┐
    │ Scout A │═════│Analyst 1│═════│Writer X │  ← OPEN PATH
    └────┬────┘     └────┬────┘     └────┬────┘
         │               │               │
    ┌────┴────┐     ┌────┴────┐     ┌────┴────┐
    │ Scout B │─ ─ ─│Analyst 2│     │Writer Y │  ← fading
    └─────────┘     └─────────┘     └─────────┘
    
    ═══  open (proven path, high weight)
    ─ ─  fading (unused, decaying)
    ░░░  blocked (high resistance)
```

## The Three Levels (ONE Mapping)

```
AGENT (actor)
│
│  .on(task, handler)     Define capability
│  .then(task, template)  Define continuation
│  emit(signal)           Emit signal
│
│  ONE: Actor dimension - who can act
│
├──────────────────────────────────────────────
│
SWARM (world)
│
│  .group(id, type)       Create hierarchy
│  .actor(id, type)       Create agent
│  .thing(id, type)       Create resource
│  .path(from, to)        Define path
│  .signal(signal)        Signal through the colony
│  .mark(path, weight)    Leave weight on path
│  .follow(n)             Follow strongest paths
│  .sense(path)           Perceive path weight
│  .fade(rate)            Decay all paths
│  .open(n)               Get proven paths
│  .blocked()             Get resisted paths
│
│  ONE: World = Groups + Actors + Things + Paths
│
├──────────────────────────────────────────────
│
COORDINATION (emergent)
│
│  open paths form        From repeated success (mark)
│  blocked paths clear    From repeated failure
│  specialization emerges Actors cluster by task
│  resilience emerges     Alternatives ready
│
│  ONE: Events → Knowledge hardening
```

## Coordination Patterns as Path Patterns

The 6 coordination patterns map to path patterns in the ONE ontology:

| Pattern | Path Signature | Biological Analog | Verb |
|---------|----------------|-------------------|------|
| Broadcast | 1 → N (fan-out) | Alarm pheromone | signal |
| Gather | N → 1 (fan-in) | Food collection | mark |
| Pipeline | A → B → C (chain) | Foraging trail | follow |
| Compete | N → ? (race) | Recruitment | sense |
| Consensus | N → tally (vote) | Quorum sensing | sense |
| Stigmergy | A → env ← B (indirect) | Trail laying | mark + sense |

---

### 1. Broadcast (one to many) — Fan-out Path

```typescript
agent.on('broadcast', ({ message }, emit) => {
  swarm.list().forEach(id => 
    emit({ receiver: id, data: { message } })
  )
})
```

```
         ┌─────────┐
         │ Sender  │
         └────┬────┘
              │
    ┌─────────┼─────────┐
    ▼         ▼         ▼
┌───────┐ ┌───────┐ ┌───────┐
│Agent A│ │Agent B│ │Agent C│
└───────┘ └───────┘ └───────┘
```

### 2. Gather (many to one) — Fan-in Path

```typescript
const collector = group.add('collector')
  .on('default', ({ data, from }, emit, ctx) => {
    results[from] = data
    if (Object.keys(results).length === expected) {
      emit({ receiver: ctx.from, data: { results } })
    }
  })
```

```
┌───────┐ ┌───────┐ ┌───────┐
│Agent A│ │Agent B│ │Agent C│
└───┬───┘ └───┬───┘ └───┬───┘
    │         │         │
    └─────────┼─────────┘
              ▼
        ┌───────────┐
        │ Collector │
        └───────────┘
```

### 3. Pipeline (chain) — Sequential Path

```typescript
scout
  .on('explore', handler)
  .then('explore', r => ({ receiver: 'analyst', data: r }))

analyst
  .on('default', handler)
  .then('default', r => ({ receiver: 'writer', data: r }))
```

```
┌───────┐    ┌──────────┐    ┌────────┐
│ Scout │ ─→ │ Analyst  │ ─→ │ Writer │
└───────┘    └──────────┘    └────────┘
```

### 4. Compete (race) — Racing Path

```typescript
agent.on('race', async ({ task }, emit, ctx) => {
  const candidates = group.highways(3)
    .map(h => h.edge.split('→')[1])
  
  // Signal to all, first response wins
  candidates.forEach(id =>
    emit({ receiver: id, data: { task, replyTo: ctx.self } })
  )
})

agent.on('result', ({ data, from }, emit, ctx) => {
  if (!winner) {
    winner = from
    group.mark(`race→${from}`, 1)  // Winner path gets weight
    emit({ receiver: ctx.from, data: { data } })
  }
})
```

```
              ┌───────┐
         ┌───→│Agent A│───┐
         │    └───────┘   │
┌───────┐│    ┌───────┐   │┌───────┐
│ Race  │├───→│Agent B│───┼│ First │
└───────┘│    └───────┘   │└───────┘
         │    ┌───────┐   │
         └───→│Agent C│───┘
              └───────┘
              (compete)
```

### 5. Consensus (vote) — Weighted Path

```typescript
agent.on('vote', async ({ question }, emit) => {
  const voters = group.highways(5).map(h => h.edge.split('→')[1])
  
  voters.forEach(id =>
    emit({ receiver: id, data: { question, replyTo: 'tally' } })
  )
})

tally.on('default', ({ answer, from }) => {
  votes[answer] = (votes[answer] || 0) + group.sense(`vote→${from}`)
  // Weighted by path weight
})
```

```
              ┌───────┐
         ┌───→│Agent A│───┐
         │    └───────┘   │
┌───────┐│    ┌───────┐   │┌───────┐
│ Vote  │├───→│Agent B│───┼│ Tally │
└───────┘│    └───────┘   │└───────┘
         │    ┌───────┐   │
         └───→│Agent C│───┘
              └───────┘
          (weighted votes)
```

### 6. Stigmergy (indirect coordination) — Environmental Path

```typescript
// No direct communication
// Agents just modify the environment (paths)

scout.on('found', ({ resource }, emit) => {
  // Don't signal anyone directly
  // Just mark weight on the path (leave strength)
  group.mark(`resource:${resource.type}→${resource.location}`, resource.quality)
})

harvester.on('seek', ({ type }, emit) => {
  // Sense and follow the strongest path
  const path = group.highways(10)
    .find(h => h.edge.startsWith(`resource:${type}→`))
  
  if (path) {
    const location = path.edge.split('→')[1]
    emit({ receiver: 'self:harvest', data: { location } })
  }
})
```

```
┌───────┐                          ┌───────────┐
│ Scout │─── mark on path ────────→│           │
└───────┘                          │   PATHS   │
                                   │(strength) │
┌───────────┐                      │           │
│ Harvester │←── follow path ──────│           │
└───────────┘                      └───────────┘

No signals between Scout and Harvester.
Coordination through environment.
DROP to leave weight. FOLLOW to traverse. SENSE to perceive.
```

## Group of Groups (Hierarchy)

Groups create hierarchy. Groups nest inside groups. This is the Groups dimension.

```typescript
import { world } from '@/engine/one'

const verse = world()

// Top-level groups (groups of groups)
verse.group('research', 'group')
verse.group('execution', 'group')

// Nested groups (sub-groups)
verse.group('scholars', 'team', { parent: 'research' })
verse.group('critics', 'team', { parent: 'research' })
verse.group('planners', 'team', { parent: 'execution' })
verse.group('builders', 'team', { parent: 'execution' })

// Actors in nested groups
verse.actor('scholar-1', 'agent', { group: 'scholars' })
  .on('read', async ({ paper }, emit) => { ... })
verse.actor('critic-1', 'agent', { group: 'critics' })
  .on('review', async ({ draft }, emit) => { ... })
verse.actor('planner-1', 'agent', { group: 'planners' })
  .on('plan', async ({ spec }, emit) => { ... })
verse.actor('builder-1', 'agent', { group: 'builders' })
  .on('build', async ({ plan }, emit) => { ... })

// Paths cross group boundaries
verse.path('scholar-1', 'critic-1').mark(1)   // Within research
verse.path('critic-1', 'planner-1').mark(1)   // Research → Execution

// Query paths scoped to a group
verse.open(10, { group: 'research' })  // Only research paths
verse.proven({ group: 'execution' })   // Only execution actors
```

```
┌────────────────────────────────────────────────────────────────┐
│                        WORLD (verse)                            │
│                                                                 │
│   GROUP: research                GROUP: execution               │
│   ┌─────────────────────┐       ┌─────────────────────┐        │
│   │                     │       │                     │        │
│   │  GROUP: scholars    │       │  GROUP: planners    │        │
│   │  ┌───────────┐      │       │  ┌───────────┐      │        │
│   │  │ scholar-1 │──┐   │       │  │ planner-1 │──┐   │        │
│   │  └───────────┘  │   │       │  └───────────┘  │   │        │
│   │                 │   │       │                 │   │        │
│   │  GROUP: critics │   │       │  GROUP: builders│   │        │
│   │  ┌───────────┐  │   │       │  ┌───────────┐  │   │        │
│   │  │ critic-1  │←─┘   │══════▶│  │ builder-1 │←─┘   │        │
│   │  └───────────┘      │       │  └───────────┘      │        │
│   │                     │       │                     │        │
│   └─────────────────────┘       └─────────────────────┘        │
│                                                                 │
│   PATHS:                                                        │
│     research:scholar-1→critic-1: 12.5                          │
│     critic-1→planner-1: 34.5  (cross-group highway)            │
│     execution:planner-1→builder-1: 8.3                         │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## The Biological Truth (ONE Mapping)

The ant colony maps directly to the 6 dimensions:

```
ANT COLONY                          GROUP (world)              ONE DIMENSION
───────────────────────────────────────────────────────────────────────────────

Colony structure                    Groups                     GROUPS
  - nest chambers                     - group hierarchy
  - satellite nests                   - nested groups
  
Individual ant                      Actor                      ACTORS
  - simple behaviors                  - simple handlers
  - no global knowledge               - no global state
  
Food, nest material                 Things                     THINGS
  - resources found                   - tasks, tokens
  - artifacts created                 - outputs produced

Strength trails                     Paths                      PATHS
  - deposited on success              - mark() on success
  - evaporate over time               - fade() over time
  - others follow them                - follow() to traverse
  - sensed by nearby ants             - sense() to perceive
  
Foraging activity                   Signal history             EVENTS
  - who went where                    - what flowed when
  - what succeeded                    - success/failure log
  
Colony memory                       Known patterns             KNOWLEDGE
  - proven trails                     - open flows
  - seasonal patterns                 - highways
```

### The Emergence

```
ANT COLONY                          GROUP                      QUERY

Best foragers emerge                Best agents emerge          best('agent')
  - scouts find fastest               - actors with open flows
  - harvesters most efficient         - proven() returns them

Blocked paths avoided               Blocked flows avoided       blocked()
  - dead ends marked                  - high resistance
  - predator warnings                 - failures accumulate

Colony intelligence                 Group intelligence          know()
  - no ant knows the plan             - no actor knows the goal
  - but highways form                 - but patterns emerge
```

> "No ant knows the colony's goal. No actor knows the group's objective. But open flows form. The world learns."

---

## The ONE Truth

```
GROUP is world() with multiple actors.

Groups organize the hierarchy (colonies, teams, groups).
Actors act (agents with simple handlers).
Things exist (tasks, tokens, resources).
Paths connect (strength trails with strength/resistance).
Events accumulate (signal history).
Knowledge is known (proven patterns).

THE VERBS:
  signal — move through the world
  mark — leave weight on a path
  follow — traverse weighted path
  sense — perceive environment
  fade — decay over time

Same 6 dimensions.
Whether ants or agents.
The ontology is ONE.
```

---

*Actors signal. Paths connect. Groups learn.*

---

## See Also

- [flows.md](flows.md) — Flow patterns: fan-out, fan-in, pipeline, compete, stigmergy
- [people.md](docs/agents.md) — Individual unit anatomy
- [ants.md](ants.md) — Biological colony mechanisms
- [knowledge.md](knowledge.md) — Five forces driving group intelligence
- [one-ontology.md](one-ontology.md) — Six dimensions governing all scales
- [PLAN-emerge.md](PLAN-emerge.md) — Implementation status
