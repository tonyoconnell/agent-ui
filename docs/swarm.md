# Agent, Swarm, Coordination

Three levels. Same primitives. ONE ontology.

---

## The ONE Foundation

Swarm is `world()` with multiple actors. The 6 dimensions apply:

```
SWARM = world()
│
├── Groups    → Swarm hierarchy (swarm of swarms)
├── Actors    → Agents (units with tasks)
├── Things    → Resources, tasks, outputs
├── Flows     → Pheromone trails (connections)
├── Events    → Signal history
└── Knowledge → Crystallized patterns (highways)
```

---

## Agent

A unit with tasks:

```typescript
const agent = unit('translator')
  .on('translate', async ({ text, to }, emit, ctx) => {
    const result = await model.translate(text, to)
    emit({ receiver: ctx.from, payload: { result } })
  })
  .on('detect', async ({ text }, emit, ctx) => {
    const lang = await model.detect(text)
    emit({ receiver: ctx.from, payload: { lang } })
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
│   receives: Envelope                 │
│   emits: Envelope                    │
│                                      │
└─────────────────────────────────────┘
```

## Swarm

A `world()` of agents working together. Groups organize. Flows connect. Actors act.

```typescript
import { world } from '@/engine/one'

const swarm = world()

// Groups organize the swarm
swarm.group('research', 'team')
swarm.group('execution', 'team')

// Actors are agents
const scout = swarm.actor('scout', 'explorer', { group: 'research' })
  .on('explore', async ({ url }, emit) => {
    const data = await fetch(url).then(r => r.json())
    emit({ receiver: 'analyst', payload: { data } })
  })

const analyst = swarm.actor('analyst', 'analyzer', { group: 'research' })
  .on('default', async ({ data }, emit) => {
    const insight = analyze(data)
    emit({ receiver: 'writer', payload: { insight } })
  })

const writer = swarm.actor('writer', 'reporter', { group: 'execution' })
  .on('default', async ({ insight }, emit, ctx) => {
    const report = format(insight)
    emit({ receiver: ctx.from, payload: { report } })
  })

// Kick off - signal flows through the world
swarm.send({ receiver: 'scout:explore', payload: { url } }, 'user')
```

**Swarm = world() with Actors**

```
┌─────────────────────────────────────────────────────────────────┐
│                      SWARM (world)                               │
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
│   FLOWS (connections):                                           │
│     scout→analyst: 12.5   (open flow - proven)                  │
│     analyst→writer: 8.3   (strengthening)                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Coordination

Flows emerge from outcomes. This is the Connections dimension in action:

```typescript
// Success: strengthen the flow
swarm.flow('scout', 'analyst').strengthen(1)

// Failure: resist the flow
swarm.flow('scout', 'analyst').resist(1)

// Time passes: decay all
swarm.fade(0.1)

// Query open flows (proven paths)
swarm.open(10)  // → strongest flows

// Query blocked flows (paths to avoid)
swarm.blocked() // → flows with high resistance
```

**Coordination = Emergent Flows**

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


                    AFTER (open flows emerge)
                    
    ┌─────────┐     ┌─────────┐     ┌─────────┐
    │ Scout A │═════│Analyst 1│═════│Writer X │  ← OPEN FLOW
    └────┬────┘     └────┬────┘     └────┬────┘
         │               │               │
    ┌────┴────┐     ┌────┴────┐     ┌────┴────┐
    │ Scout B │─ ─ ─│Analyst 2│     │Writer Y │  ← closing
    └─────────┘     └─────────┘     └─────────┘
    
    ═══  open (proven flow, high strength)
    ─ ─  closing (fading, unused)
    ░░░  blocked (high resistance)
```

## The Three Levels (ONE Mapping)

```
AGENT (actor)
│
│  .on(task, handler)     Define capability
│  .then(task, template)  Define continuation
│  emit(envelope)         Send signal
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
│  .flow(from, to)        Define connection
│  .send(envelope)        Route signal
│  .fade(rate)            Decay all flows
│  .open(n)               Get proven flows
│  .blocked()             Get resisted flows
│
│  ONE: World = Groups + Actors + Things + Flows
│
├──────────────────────────────────────────────
│
COORDINATION (emergent)
│
│  open flows form        From repeated success
│  blocked flows clear    From repeated failure
│  specialization emerges Actors cluster by task
│  resilience emerges     Alternatives ready
│
│  ONE: Events → Knowledge crystallization
```

## Coordination Patterns as Flow Patterns

The 6 coordination patterns map to flow patterns in the ONE ontology:

| Pattern | Flow Signature | Biological Analog |
|---------|----------------|-------------------|
| Broadcast | 1 → N (fan-out) | Alarm pheromone |
| Gather | N → 1 (fan-in) | Food collection |
| Pipeline | A → B → C (chain) | Foraging trail |
| Compete | N → ? (race) | Recruitment |
| Consensus | N → tally (vote) | Quorum sensing |
| Stigmergy | A → env ← B (indirect) | Trail laying |

---

### 1. Broadcast (one to many) — Fan-out Flow

```typescript
agent.on('broadcast', ({ message }, emit) => {
  swarm.list().forEach(id => 
    emit({ receiver: id, payload: { message } })
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

### 2. Gather (many to one) — Fan-in Flow

```typescript
const collector = swarm.spawn('collector')
  .on('default', ({ data, from }, emit, ctx) => {
    results[from] = data
    if (Object.keys(results).length === expected) {
      emit({ receiver: ctx.from, payload: { results } })
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

### 3. Pipeline (chain) — Sequential Flow

```typescript
scout
  .on('explore', handler)
  .then('explore', r => ({ receiver: 'analyst', payload: r }))

analyst
  .on('default', handler)
  .then('default', r => ({ receiver: 'writer', payload: r }))
```

```
┌───────┐    ┌──────────┐    ┌────────┐
│ Scout │ ─→ │ Analyst  │ ─→ │ Writer │
└───────┘    └──────────┘    └────────┘
```

### 4. Compete (race) — Racing Flow

```typescript
agent.on('race', async ({ task }, emit, ctx) => {
  const candidates = swarm.highways(3)
    .map(h => h.edge.split('→')[1])
  
  // Send to all, first response wins
  candidates.forEach(id =>
    emit({ receiver: id, payload: { task, replyTo: ctx.self } })
  )
})

agent.on('result', ({ data, from }, emit, ctx) => {
  if (!winner) {
    winner = from
    swarm.mark(`race→${from}`, 1)  // Winner gets stronger
    emit({ receiver: ctx.from, payload: { data } })
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

### 5. Consensus (vote) — Weighted Flow

```typescript
agent.on('vote', async ({ question }, emit) => {
  const voters = swarm.highways(5).map(h => h.edge.split('→')[1])
  
  voters.forEach(id =>
    emit({ receiver: id, payload: { question, replyTo: 'tally' } })
  )
})

tally.on('default', ({ answer, from }) => {
  votes[answer] = (votes[answer] || 0) + swarm.smell(`vote→${from}`)
  // Weighted by trail strength
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

### 6. Stigmergy (indirect coordination) — Environmental Flow

```typescript
// No direct communication
// Agents just modify the environment (trails)

scout.on('found', ({ resource }, emit) => {
  // Don't tell anyone directly
  // Just mark the trail
  swarm.mark(`resource:${resource.type}→${resource.location}`, resource.quality)
})

harvester.on('seek', ({ type }, emit) => {
  // Follow strongest trail
  const trail = swarm.highways(10)
    .find(h => h.edge.startsWith(`resource:${type}→`))
  
  if (trail) {
    const location = trail.edge.split('→')[1]
    emit({ receiver: 'self:harvest', payload: { location } })
  }
})
```

```
┌───────┐                          ┌───────────┐
│ Scout │─── mark trail ──────────→│           │
└───────┘                          │  TRAILS   │
                                   │  (scent)  │
┌───────────┐                      │           │
│ Harvester │←── follow trail ─────│           │
└───────────┘                      └───────────┘

No messages between Scout and Harvester.
Coordination through environment.
```

## Swarm of Swarms (Groups)

Groups create hierarchy. Swarms nest inside swarms. This is the Groups dimension.

```typescript
import { world } from '@/engine/one'

const verse = world()

// Top-level groups (swarms of swarms)
verse.group('research', 'swarm')
verse.group('execution', 'swarm')

// Nested groups (sub-swarms)
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

// Flows cross group boundaries
verse.flow('scholar-1', 'critic-1').strengthen(1)   // Within research
verse.flow('critic-1', 'planner-1').strengthen(1)   // Research → Execution

// Query flows scoped to a group
verse.open(10, { group: 'research' })  // Only research flows
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
│   FLOWS:                                                        │
│     research:scholar-1→critic-1: 12.5                          │
│     critic-1→planner-1: 34.5  (cross-group highway)            │
│     execution:planner-1→builder-1: 8.3                         │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## The Biological Truth (ONE Mapping)

The ant colony maps directly to the 6 dimensions:

```
ANT COLONY                          SWARM (world)              ONE DIMENSION
───────────────────────────────────────────────────────────────────────────────

Colony structure                    Groups                     GROUPS
  - nest chambers                     - swarm hierarchy
  - satellite nests                   - nested groups
  
Individual ant                      Actor                      ACTORS
  - simple behaviors                  - simple handlers
  - no global knowledge               - no global state
  
Food, nest material                 Things                     THINGS
  - resources found                   - tasks, tokens
  - artifacts created                 - outputs produced

Pheromone trails                    Flows                      CONNECTIONS
  - deposited on success              - strengthen() on success
  - evaporate over time               - fade() over time
  - alarm/attract types               - resist() on failure
  
Foraging activity                   Signal history             EVENTS
  - who went where                    - what flowed when
  - what succeeded                    - success/failure log
  
Colony memory                       Crystallized patterns      KNOWLEDGE
  - proven trails                     - open flows
  - seasonal patterns                 - highways
```

### The Emergence

```
ANT COLONY                          SWARM                      QUERY

Best foragers emerge                Best agents emerge          best('agent')
  - scouts find fastest               - actors with open flows
  - harvesters most efficient         - proven() returns them

Blocked paths avoided               Blocked flows avoided       blocked()
  - dead ends marked                  - high resistance
  - predator warnings                 - failures accumulate

Colony intelligence                 Swarm intelligence          crystallize()
  - no ant knows the plan             - no actor knows the goal
  - but highways form                 - but patterns emerge
```

> "No ant knows the colony's goal. No actor knows the swarm's objective. But open flows form. The world learns."

---

## The ONE Truth

```
SWARM is world() with multiple actors.

Groups organize the hierarchy (colonies, teams, swarms).
Actors act (agents with simple handlers).
Things exist (tasks, tokens, resources).
Flows connect (pheromone trails with strength/resistance).
Events accumulate (signal history).
Knowledge crystallizes (proven patterns).

Same 6 dimensions.
Whether ants or agents.
The ontology is ONE.
```

---

*Actors act. Flows connect. Worlds learn.*
