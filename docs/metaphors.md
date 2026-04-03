# Metaphors

Same system. Different languages. **Same words.**

---

## The Universal Vocabulary

The breakthrough: **the same core words work across ALL metaphors**.

| Concept | Word | Ants | Neurons | Markets | Agents |
|---------|------|------|---------|---------|--------|
| The thing | **Signal** | pheromone | spike | price | request |
| What it carries | **Data** | chemical | pattern | volume | payload |
| Who acts | **Actor** | ant | neuron | trader | agent |
| Connection | **Path** | trail | synapse | flow | route |
| Accumulated | **Weight** | intensity | strength | volume | score |
| Strong path | **Highway** | foraging trail | memory | trend | proven |

This is the primitive:

```typescript
type Signal = {
  receiver: string
  data?: unknown
}
```

**Signal** works everywhere. **Data** carries anything. The vocabulary is universal.

---

## The Universal Verbs

Five verbs. Every metaphor. Same meaning.

| Verb | Meaning | Ants | Neurons | Markets | Agents |
|------|---------|------|---------|---------|--------|
| **signal** | move through world | forage | fire | trade | request |
| **drop** | leave weight on path | deposit | potentiate | volume | score |
| **follow** | traverse weighted path | smell trail | sense synapse | track flow | query route |
| **fade** | decay over time | evaporate | decay | cool | forget |
| **sense** | perceive environment | antennae | receptors | indicators | sensors |

```typescript
// The five operations
w.signal({ receiver: 'x', data })  // Move
w.drop('a→b', 1)                   // Weight
w.follow('a→b')                    // Query
w.fade(0.1)                        // Decay
w.sense('x')                       // Perceive
```

The verbs are universal because the dynamics are universal.

---

## ONE — The Meta-Metaphor

Not ants. Not brains. Not teams. Just ONE.

ONE sits above all metaphors. It captures the fundamental dimensions that every swarm system exhibits, regardless of domain vocabulary.

### The Dimensions

```
┌─────────────────────────────────────────────────────────────┐
│                         ONE                                  │
├─────────────┬───────────────────────────────────────────────┤
│ actor       │ a thing that acts (the fundamental unit)      │
│ part        │ composition of actors (the container)         │
│ signal      │ what flows between actors (the message)       │
│ path        │ connection between actors (the edge)          │
│ weight      │ how reinforced (positive signal)              │
│ resistance  │ how blocked (negative signal)                 │
│ time        │ decay over duration (forgetting)              │
└─────────────┴───────────────────────────────────────────────┘
```

These dimensions are universal:
- **actor** — the atomic entity that receives and processes
- **part** — the whole that contains actors
- **signal** — what moves between actors
- **path** — the connection that signals travel
- **weight** — positive reinforcement on success
- **resistance** — negative reinforcement on failure
- **time** — natural decay that prunes unused paths

### world() — The Universal Interface

```typescript
import { world } from '@one-ie/world'

// Create a world with any vocabulary
const w = world()

// Spawn ones
const a = w.one('a')
const b = w.one('b')

// Define behavior
a.on('process', (data, emit) => {
  emit({ receiver: 'b', data: transform(data) })
})

// Send signal
w.signal({ receiver: 'a:process', data: data })

// The six operations
w.strengthen('a→b', 1)    // Reinforce flow
w.resist('a→b', 1)        // Block flow
w.decay(0.1)              // Time passes
w.open(10)                // Strongest flows
w.blocked()               // Blocked flows
w.best('task')            // Best one for task type
```

### ONE Maps to Everything

| Dimension | ONE | Ant | Brain | Team | Mail | Water | Radio |
|-----------|-----|-----|-------|------|------|-------|-------|
| **actor** | actor | ant | neuron | agent | mailbox | pool | receiver |
| **part** | part | colony | network | team | office | watershed | network |
| **signal** | signal | pheromone | spike | task | letter | drop | signal |
| **path** | path | trail | synapse | workflow | route | channel | frequency |
| **weight** | strengthen | deposit | potentiate | commend | stamp | carve | boost |
| **resistance** | resist | alarm | inhibit | flag | return | dam | jam |
| **time** | decay | evaporate | decay | forget | archive | dry | attenuate |

### Derived Concepts

From the six dimensions, we derive:

| Concept | Definition | ONE | Ant | Brain | Team |
|---------|------------|-----|-----|-------|------|
| **highway** | high strength, low resistance | open | trail | pathway | go-to |
| **blocked** | high resistance | blocked | toxic | dead | flagged |
| **best** | optimal one for task | best | scout | expert | specialist |

ONE is the abstraction above all metaphors. Use it when you don't want to commit to a domain. Use `world()` as your universal entry point.

---

## The Core (metaphor-free)

```
thing    → thing    (with data)
strengthen connection on success
weaken connection over time
best paths emerge
```

That's the substrate. Everything else is naming.

## The Metaphors

### 1. Ant Colony

```
unit     → ant
colony   → nest
signal   → scent
signal() → forage
drop     → deposit
alarm    → alarm pheromone
fade     → evaporate
highways → trails
```

```typescript
import { ant, nest } from '@fetchai/world'

const scout = ant('scout')
  .on('forage', ({ location }, release, ctx) => {
    const food = search(location)
    release({ to: 'harvester', scent: { food, trail: ctx.self } })
  })

const colony = nest()
colony.hatch('scout', scout)
colony.forage({ to: 'scout:forage', scent: { location } })

// Pheromone mechanics
colony.deposit('scout→food', 1)    // Found food
colony.alarm('scout→danger', 1)    // Found threat
colony.evaporate(0.1)              // Time passes
colony.trails(10)                   // Strongest paths
```

**Why this works:** Ants coordinate without central control. Pheromones are literally how they do it. The metaphor is the mechanism.

---

### 2. Brain / Neural

```
unit     → neuron
colony   → network
signal   → impulse
signal() → fire
drop     → potentiate
alarm    → inhibit
fade     → decay
highways → pathways
```

```typescript
import { neuron, network } from '@fetchai/world'

const sensor = neuron('sensor')
  .on('perceive', ({ stimulus }, fire, ctx) => {
    const signal = encode(stimulus)
    fire({ to: 'processor', impulse: { signal } })
  })

const brain = network()
brain.grow('sensor', sensor)
brain.fire({ to: 'sensor:perceive', impulse: { stimulus } })

// Synaptic mechanics
brain.potentiate('sensor→processor', 1)  // Learning
brain.inhibit('sensor→processor', 1)     // Unlearning
brain.decay(0.1)                          // Forgetting
brain.pathways(10)                        // Strongest connections
```

**Why this works:** Neurons fire, connections strengthen with use (Hebbian learning), unused connections fade. The metaphor maps to neuroscience.

---

### 3. Team / Organization

```
unit     → agent
colony   → team
signal   → task
signal() → delegate
drop     → commend
alarm    → flag
fade     → forget
highways → go-to people
```

```typescript
import { agent, team } from '@fetchai/world'

const analyst = agent('analyst')
  .on('research', ({ topic }, delegate, ctx) => {
    const findings = analyze(topic)
    delegate({ to: ctx.from, task: { findings } })
  })

const org = team()
org.hire('analyst', analyst)
org.delegate({ to: 'analyst:research', task: { topic } })

// Reputation mechanics
org.commend('manager→analyst', 1)   // Good work
org.flag('manager→analyst', 1)      // Problem
org.forget(0.1)                      // Old history fades
org.goto(10)                         // Best people for tasks
```

**Why this works:** Teams delegate work, good performers get more work, poor performers get flagged, old performance fades. Org behavior.

---

### 4. Mail / Postal

```
unit     → mailbox
colony   → post office
signal   → letter
data     → contents
signal() → deliver
drop     → stamp
alarm    → return to sender
fade     → archive
highways → express routes
```

```typescript
import { mailbox, postOffice } from '@fetchai/world'

const inbox = mailbox('support')
  .on('inquiry', ({ message }, reply, ctx) => {
    const response = handle(message)
    reply({ to: ctx.from, data: { response } })
  })

const office = postOffice()
office.open('support', inbox)
office.deliver({ to: 'support:inquiry', data: { message } })

// Routing mechanics
office.stamp('customer→support', 1)    // Successful delivery
office.return('customer→support', 1)   // Failed delivery
office.archive(0.1)                     // Old routes fade
office.express(10)                      // Fastest routes
```

**Why this works:** Mail has receivers and data. Routing optimizes over time. Simple mental model.

---

### 5. Water / Flow

```
unit     → pool
colony   → watershed
signal   → drop
signal() → flow
drop()   → carve
alarm    → dam
fade     → dry
highways → rivers
```

```typescript
import { pool, watershed } from '@fetchai/world'

const filter = pool('filter')
  .on('receive', ({ drop }, flow, ctx) => {
    const clean = purify(drop)
    flow({ to: 'reservoir', drop: { clean } })
  })

const system = watershed()
system.dig('filter', filter)
system.flow({ to: 'filter:receive', drop: { water } })

// Erosion mechanics
system.carve('source→filter', 1)    // Path deepens
system.dam('source→filter', 1)      // Block path
system.dry(0.1)                      // Unused paths dry up
system.rivers(10)                    // Deepest channels
```

**Why this works:** Water finds paths, repeated flow carves deeper channels, unused channels dry up. Natural.

---

### 6. Signal / Radio

```
unit     → receiver
colony   → network
signal   → signal
signal() → transmit
drop     → boost
alarm    → jam
fade     → attenuate
highways → clear channels
```

```typescript
import { receiver, network } from '@fetchai/world'

const antenna = receiver('antenna')
  .on('receive', ({ signal }, transmit, ctx) => {
    const amplified = boost(signal)
    transmit({ to: 'decoder', signal: { amplified } })
  })

const radio = network()
radio.tune('antenna', antenna)
radio.transmit({ to: 'antenna:receive', signal: { data } })

// Signal mechanics
radio.boost('source→antenna', 1)      // Strengthen
radio.jam('source→antenna', 1)        // Interference
radio.attenuate(0.1)                   // Signal decay
radio.clear(10)                        // Best frequencies
```

**Why this works:** Signals need receivers, frequencies that work get boosted, interference jams, unused frequencies attenuate.

---

## Comparison Table — All Dimensions

| Dimension | Substrate | Ant | Brain | Team | Mail | Water | Radio |
|-----------|-----------|-----|-------|------|------|-------|-------|
| **actor** | unit | ant | neuron | agent | mailbox | pool | receiver |
| **part** | colony | nest | network | team | post office | watershed | network |
| **signal** | signal | pheromone | spike | task | letter | drop | signal |
| **data** | data | chemical | pattern | payload | contents | volume | data |
| **path** | path | trail | synapse | workflow | route | channel | frequency |
| **weight** | drop | deposit | potentiate | commend | stamp | carve | boost |
| **resistance** | alarm | alarm | inhibit | flag | return | dam | jam |
| **time** | fade | evaporate | decay | forget | archive | dry | attenuate |

### Operations (The Five Verbs)

| Verb | Substrate | Ant | Brain | Team | Mail | Water | Signal |
|------|-----------|-----|-------|------|------|-------|--------|
| **signal** | signal | forage | fire | delegate | deliver | flow | transmit |
| **drop** | drop | deposit | potentiate | commend | stamp | carve | boost |
| **follow** | follow | smell | sense | query | track | trace | scan |
| **fade** | fade | evaporate | decay | forget | archive | dry | attenuate |
| **sense** | sense | antennae | perceive | check | inspect | measure | receive |

### Creation

| Operation | Substrate | Ant | Brain | Team | Mail | Water | Signal |
|-----------|-----------|-----|-------|------|------|-------|--------|
| create | spawn | hatch | grow | hire | open | dig | tune |
| query best | highways | trails | pathways | go-tos | express | rivers | clear |

## Choosing a Metaphor

**Use Ant Colony when:**
- Building self-organizing systems
- No central control
- Emergence is the goal
- Biologically-inspired AI

**Use Brain when:**
- Building learning systems
- Neural network adjacent
- Cognitive computing
- Memory and recall focus

**Use Team when:**
- Business audience
- Workflow automation
- Human-agent collaboration
- Org design

**Use Mail when:**
- Simple mental model needed
- Message-passing focus
- Routing problems
- API/microservices

**Use Water when:**
- Data pipelines
- ETL systems
- Natural flow metaphors
- Resource distribution

**Use Signal when:**
- Real-time systems
- IoT / sensor networks
- Broadcast patterns
- Frequency/channel concepts

## The Truth

The metaphor doesn't change the code:

```typescript
// All of these are the same six dimensions:

world().one('x').on('y', fn)        // ONE (meta)
colony().spawn('x').on('y', fn)     // Substrate
nest().hatch('x').on('y', fn)       // Ant
network().grow('x').on('y', fn)     // Brain
team().hire('x').on('y', fn)        // Team
postOffice().open('x').on('y', fn)  // Mail
watershed().dig('x').on('y', fn)    // Water
radio().tune('x').on('y', fn)       // Signal
```

The substrate doesn't care what you call it. It only knows:

**Nouns** (what exists):
- **actor** — things that receive
- **part** — things that contain
- **signal** — what flows
- **data** — what signals carry
- **path** — connections between

**Verbs** (what happens):
- **signal** — move through world
- **drop** — leave weight on path
- **follow** — traverse weighted path
- **fade** — decay over time
- **sense** — perceive environment

But **humans** care. The right metaphor:
- Makes the system intuitable
- Guides correct usage
- Prevents misuse
- Aids teaching

## Our Choice: world() + Aliases

```typescript
// Universal entry point
import { world } from '@one-ie/world'

// Or use the substrate directly
import { unit, colony } from '@/engine/substrate'

// Aliases: pick your metaphor
export { unit as ant, colony as nest }        // Ant
export { unit as neuron, colony as network }  // Brain
export { unit as agent, colony as team }      // Team
export { unit as actor, colony as world }      // Actor model

// The nouns map to aliases:
// actor      → unit/ant/neuron/agent
// part       → colony/nest/network/team
// signal     → signal/pheromone/spike/task
// data       → data/chemical/pattern/payload
// path       → path/trail/synapse/route

// The verbs map to methods:
// signal     → signal/forage/fire/delegate
// drop       → drop/deposit/potentiate/commend
// follow     → follow/smell/sense/query
// fade       → fade/evaporate/decay/forget
// sense      → sense/antennae/perceive/check
```

We use **ONE** as the meta-model (because it's universal) with **world()** as the entry point. Domain-specific aliases let users think in their preferred vocabulary while the substrate handles the fundamental operations.

The beauty: **Signal**, **Data**, and the five verbs work in every domain. You never need to translate the primitive or the operations.

---

## What Flows

The signal is a carrier. The data is anything:

| Domain | Signal carries | Example |
|--------|------------------|---------|
| Ants | Food | `{ food: 'sugar', quantity: 10 }` |
| Data | Records | `{ rows: [...], schema: {...} }` |
| AI | Prompts/Responses | `{ prompt: '...', context: [...] }` |
| Commerce | Orders | `{ item: 'widget', qty: 5 }` |
| Finance | Transactions | `{ from, to, amount }` |
| IoT | Sensor readings | `{ temp: 22.5, humidity: 45 }` |
| Games | Actions | `{ move: 'e2e4', player: 'white' }` |
| Chat | Messages | `{ text: 'hello', user: 'alice' }` |

```typescript
// Same structure, different meaning:

// Ant carrying food
{ receiver: 'nest:store', data: { food: 'seed', calories: 50 } }

// Agent carrying data
{ receiver: 'analyst:process', data: { records: [...], format: 'csv' } }

// Neuron carrying signal
{ receiver: 'cortex:integrate', data: { activation: 0.87, source: 'retina' } }

// Worker carrying task
{ receiver: 'builder:construct', data: { blueprint: {...}, materials: [...] } }
```

## The Signal is Content-Agnostic

```typescript
type Signal = {
  receiver: string    // Where it goes
  data?: unknown      // What it carries (anything)
}
```

The substrate doesn't know or care what's inside. It just:
1. Routes to the receiver
2. Drops on the edge on delivery
3. Lets the handler decide what to do

This is why the same 70 lines can model:
- Ant colonies carrying food
- Neural networks carrying signals
- Data pipelines carrying records
- Agent swarms carrying tasks
- Economies carrying value

**The data is the domain. The substrate is universal.**

---

*ONE is the territory. The metaphors are maps. Signal, drop, follow, fade, sense — the verbs are universal. `world()` is your compass.*

---

## See Also

- [flows.md](flows.md) — Metaphor mapping table: same flow, different words
- [framework.md](framework.md) — UI skins rendering each metaphor
- [world.md](world.md) — Universal ontology beneath all metaphors
- [one-ontology.md](one-ontology.md) — Six dimensions each metaphor expresses
- [code-tutorial.md](code-tutorial.md) — Unified substrate theory
- [ai-training.md](ai-training.md) — ML metaphor: training as path strengthening
