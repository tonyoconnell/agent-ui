# Metaphors

Same system. Different languages. **Same words.**

---

## The Universal Vocabulary

The breakthrough: **the same core words work across ALL metaphors**.

| Concept | Word | Ants | Neurons | Markets | Agents |
|---------|------|------|---------|---------|--------|
| The thing | **Signal** | pheromone | spike | price | request |
| What it carries | **Data** | chemical | pattern | volume | payload |
| Who acts | **Unit** | ant | neuron | trader | agent |
| The container | **World** | nest | network | market | swarm |
| Connection | **Path** | trail | synapse | flow | route |
| Positive weight | **Strength** | intensity | potentiation | volume | score |
| Negative weight | **Resistance** | alarm | inhibition | crash | penalty |
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

| Verb       | Meaning                | Ants        | Neurons       | Markets    | Agents      |
| ---------- | ---------------------- | ----------- | ------------- | ---------- | ----------- |
| **signal** | move through world     | forage      | fire          | trade      | request     |
| **mark**   | leave weight on path   | deposit     | potentiate    | volume     | score       |
| **follow** | traverse weighted path | smell trail | sense synapse | track flow | query route |
| **fade**   | decay over time        | evaporate   | decay         | cool       | forget      |
| **sense**  | perceive environment   | antennae    | receptors     | indicators | sensors     |

```typescript
// The five operations
w.signal({ receiver: 'x', data })  // Move
w.mark('a→b', 1)                   // Strengthen
w.follow('a→b')                    // Query
w.fade(0.1)                        // Decay
w.sense('x')                       // Perceive
```

The verbs are universal because the dynamics are universal.

---

## The Weight — What Accumulates on Paths

Every metaphor has its own word for the substance that builds up on connections.
This is the deepest symmetry in the system.

| | The substance | Depositing it | It builds into | It fades by |
|---|---|---|---|---|
| **ONE** | weight | mark / warn | highway | fade |
| **Ant** | pheromone | deposit / alarm | trail | evaporation |
| **Brain** | synaptic weight | potentiate / inhibit | pathway | decay |
| **Team** | reputation | commend / flag | go-to person | forgetting |
| **Mail** | stamps | stamp / return | express route | archiving |
| **Water** | sediment | carve / dam | river | drying |
| **Radio** | signal power | boost / jam | clear channel | attenuation |

The pattern is always the same:

```
something accumulates on a connection over time
  → positive: the connection gets used more
  → negative: the connection gets avoided
  → without use: it fades
  → survivors become the proven paths
```

Ants call it pheromone. Neuroscience calls it synaptic weight. Organizations
call it reputation. Hydrology calls it erosion. Radio engineering calls it
signal strength.

The substrate doesn't pick a metaphor. It just says **strength** and
**resistance**. That's why it skins to everything — the dynamic is universal.

---

## ONE — The Meta-Metaphor

Not ants. Not brains. Not teams. Just ONE.

ONE sits above all metaphors. It captures the fundamental dimensions that every
system exhibits, regardless of domain vocabulary.

### The Dimensions

```
┌─────────────────────────────────────────────────────────────┐
│                         ONE                                  │
├─────────────┬───────────────────────────────────────────────┤
│ unit        │ a thing that acts (the fundamental receiver)  │
│ world       │ composition of units (the container)          │
│ signal      │ what flows between units (the message)        │
│ path        │ connection between units (the edge)           │
│ strength    │ how reinforced (positive signal)              │
│ resistance  │ how blocked (negative signal)                 │
│ time        │ decay over duration (forgetting)              │
└─────────────┴───────────────────────────────────────────────┘
```

These dimensions are universal:
- **unit** — the atomic entity that receives and processes
- **world** — the whole that contains units
- **signal** — what moves between units
- **path** — the connection that signals travel
- **strength** — positive reinforcement on success
- **resistance** — negative reinforcement on failure
- **time** — natural decay that prunes unused paths

### world() — The Universal Interface

```typescript
import { world } from '@one-ie/world'

// Create a world
const w = world()

// Add units
const a = w.add('a')
const b = w.add('b')

// Define behavior
a.on('process', (data, emit) => {
  emit({ receiver: 'b', data: transform(data) })
})

// Send signal
w.signal({ receiver: 'a:process', data: data })

// The six operations
w.mark('a→b', 1)          // Reinforce path
w.warn('a→b', 1)          // Resist path
w.fade(0.1)               // Time passes
w.open(10)                 // Strongest flows
w.blocked()                // Blocked flows
w.best('task')             // Best unit for task type
```

### ONE Maps to Everything

| Dimension | ONE | Ant | Brain | Team | Mail | Water | Radio |
|-----------|-----|-----|-------|------|------|-------|-------|
| **actor** | unit | ant | neuron | agent | mailbox | pool | receiver |
| **container** | world | nest | network | team | office | watershed | network |
| **signal** | signal | pheromone | spike | task | letter | drop | signal |
| **path** | path | trail | synapse | workflow | route | channel | frequency |
| **reinforce** | mark | deposit | potentiate | commend | stamp | carve | boost |
| **resist** | warn | alarm | inhibit | flag | return | dam | jam |
| **decay** | fade | evaporate | decay | forget | archive | dry | attenuate |

### Derived Concepts

From the seven dimensions, we derive:

| Concept | Definition | ONE | Ant | Brain | Team |
|---------|------------|-----|-----|-------|------|
| **highway** | high strength, low resistance | open | trail | pathway | go-to |
| **blocked** | high resistance | blocked | toxic | dead | flagged |
| **best** | optimal unit for task | best | scout | expert | specialist |

ONE is the abstraction above all metaphors. Use it when you don't want to commit
to a domain. Use `world()` as your universal entry point.

---

## The Core (metaphor-free)

```
thing    → thing    (with data)
mark connection on success
weaken connection over time
best paths emerge
```

That's the substrate. Everything else is naming.

## The Metaphors

### 1. Ant Colony

```
unit     → ant
world    → nest
signal   → scent
signal() → forage
mark     → deposit
warn     → alarm
fade     → evaporate
highways → trails
add      → hatch
remove   → die
know     → imprint
recall   → recognize
```

```typescript
import { ant, nest } from '@one-ie/world/ant'

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
colony.trails(10)                  // Strongest paths
colony.imprint()                   // Promote trails to memory
colony.recognize()                 // Recall what was learned
```

**Why this works:** Ants coordinate without central control. Pheromones are literally how they do it. The metaphor is the mechanism.

---

### 2. Brain / Neural

```
unit     → neuron
world    → network
signal   → impulse
signal() → fire
mark     → potentiate
warn     → inhibit
fade     → decay
highways → pathways
add      → grow
remove   → apoptosis
know     → consolidate
recall   → remember
```

```typescript
import { neuron, network } from '@one-ie/world/brain'

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
brain.consolidate()                       // Promote to long-term memory
brain.remember()                          // Recall memory
```

**Why this works:** Neurons fire, connections strengthen with use (Hebbian learning), unused connections fade. The metaphor maps to neuroscience.

---

### 3. Team / Organization

```
unit     → agent
world    → team
signal   → task
signal() → delegate
mark     → commend
warn     → flag
fade     → forget
highways → go-to people
add      → hire
remove   → fire
know     → document
recall   → consult
```

```typescript
import { agent, team } from '@one-ie/world/team'

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
org.document()                       // Promote patterns to knowledge
org.consult()                        // Recall institutional knowledge
```

**Why this works:** Teams delegate work, good performers get more work, poor performers get flagged, old performance fades. Org behavior.

---

### 4. Mail / Postal

```
unit     → mailbox
world    → post office
signal   → letter
data     → contents
signal() → deliver
mark     → stamp
warn     → return to sender
fade     → archive
highways → express routes
add      → open
remove   → close
know     → stamp (permanent record)
recall   → resurface
```

```typescript
import { mailbox, postOffice } from '@one-ie/world/mail'

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
world    → watershed
signal   → drop
signal() → flow
mark()   → carve
warn     → dam
fade     → dry
highways → rivers
add      → dig
remove   → dry up
know     → settle
recall   → resurface
```

```typescript
import { pool, watershed } from '@one-ie/world/water'

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
system.settle()                      // Sediment becomes bedrock
system.resurface()                   // Old channels reappear
```

**Why this works:** Water finds paths, repeated flow carves deeper channels, unused channels dry up. Natural.

---

### 6. Signal / Radio

```
unit     → receiver
world    → network
signal   → signal
signal() → transmit
mark     → boost
warn     → jam
fade     → attenuate
highways → clear channels
add      → tune
remove   → deregister
know     → lock
recall   → replay
```

```typescript
import { receiver, network } from '@one-ie/world/radio'

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
radio.lock()                           // Frequency becomes permanent
radio.replay()                         // Recall locked frequencies
```

**Why this works:** Signals need receivers, frequencies that work get boosted, interference jams, unused frequencies attenuate.

---

## Comparison Table — All Dimensions

| Dimension | ONE | Ant | Brain | Team | Mail | Water | Radio |
|-----------|-----|-----|-------|------|------|-------|-------|
| **actor** | unit | ant | neuron | agent | mailbox | pool | receiver |
| **container** | world | nest | network | team | post office | watershed | network |
| **signal** | signal | pheromone | spike | task | letter | drop | signal |
| **data** | data | chemical | pattern | payload | contents | volume | data |
| **path** | path | trail | synapse | workflow | route | channel | frequency |
| **reinforce** | mark | deposit | potentiate | commend | stamp | carve | boost |
| **resist** | warn | alarm | inhibit | flag | return | dam | jam |
| **decay** | fade | evaporate | decay | forget | archive | dry | attenuate |

### Operations (The Five Verbs)

| Verb | ONE | Ant | Brain | Team | Mail | Water | Signal |
|------|-----|-----|-------|------|------|-------|--------|
| **signal** | signal | forage | fire | delegate | deliver | flow | transmit |
| **mark** | mark | deposit | potentiate | commend | stamp | carve | boost |
| **follow** | follow | smell | sense | query | track | trace | scan |
| **fade** | fade | evaporate | decay | forget | archive | dry | attenuate |
| **sense** | sense | antennae | perceive | check | inspect | measure | receive |

### Lifecycle

| Operation | ONE | Ant | Brain | Team | Mail | Water | Signal |
|-----------|-----|-----|-------|------|------|-------|--------|
| create | add | hatch | grow | hire | open | dig | tune |
| destroy | remove | die | apoptosis | fire | close | dry up | deregister |
| query best | highways | trails | pathways | go-tos | express | rivers | channels |
| learn | know | imprint | consolidate | document | stamp | settle | lock |
| remember | recall | recognize | remember | consult | resurface | resurface | replay |

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
// All of these are the same seven dimensions:

world().add('x').on('y', fn)            // ONE (meta)
nest().hatch('x').on('y', fn)           // Ant
network().grow('x').on('y', fn)         // Brain
team().hire('x').on('y', fn)            // Team
postOffice().open('x').on('y', fn)      // Mail
watershed().dig('x').on('y', fn)        // Water
radio().tune('x').on('y', fn)           // Signal
```

The world doesn't care what you call it. It only knows:

**Nouns** (what exists):
- **unit** — things that receive
- **world** — things that contain
- **signal** — what flows
- **data** — what signals carry
- **path** — connections between

**Verbs** (what happens):
- **signal** — move through world
- **mark** — leave weight on path
- **follow** — traverse weighted path
- **fade** — decay over time
- **sense** — perceive environment

**Memory** (what persists):
- **know** — promote patterns to durable knowledge
- **recall** — query what was learned

But **humans** care. The right metaphor:
- Makes the system intuitable
- Guides correct usage
- Prevents misuse
- Aids teaching

## Our Choice: world() + Aliases

```typescript
// Universal entry point
import { world } from '@one-ie/world'

// Or use skins
import { nest } from '@one-ie/world/ant'
import { network } from '@one-ie/world/brain'
import { team } from '@one-ie/world/team'

// Aliases: pick your metaphor
export { unit as ant, world as nest }          // Ant
export { unit as neuron, world as network }    // Brain
export { unit as agent, world as team }        // Team
export { unit as actor }                       // Actor model

// The nouns map to aliases:
// unit      → ant/neuron/agent/mailbox/pool/receiver
// world     → nest/network/team/office/watershed/network
// signal    → scent/spike/task/letter/drop/signal
// strength  → intensity/potentiation/trust/depth/power
// resistance→ alarm/inhibition/distrust/blockage/interference

// The verbs map to methods:
// signal    → forage/fire/delegate/deliver/flow/transmit
// mark      → deposit/potentiate/commend/stamp/carve/boost
// follow    → smell/sense/query/track/trace/scan
// fade      → evaporate/decay/forget/archive/dry/attenuate
// know      → imprint/consolidate/document/stamp/settle/lock
// recall    → recognize/remember/consult/resurface/resurface/replay
```

We use **ONE** as the meta-model (because it's universal) with **world()** as
the entry point. Domain-specific skins let users think in their preferred
vocabulary while the world handles the fundamental operations.

The beauty: **Signal**, **Data**, and the verbs work in every domain. You never
need to translate the primitive or the operations.

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

The world doesn't know or care what's inside. It just:
1. Routes to the receiver
2. Marks the path on delivery
3. Lets the handler decide what to do

This is why the same code can model:
- Ant colonies carrying food
- Neural networks carrying signals
- Data pipelines carrying records
- Agent swarms carrying tasks
- Economies carrying value

**The data is the domain. The world is universal.**

---

*ONE is the territory. The metaphors are maps. Signal, mark, follow, fade, sense — the verbs are universal. `world()` is your compass.*

---

## See Also

- [dictionary.md](dictionary.md) — Complete naming guide across all dimensions
- [DSL.md](DSL.md) — The programming model the metaphors skin
- [routing.md](routing.md) — How signals route through the weight landscape
- [flows.md](flows.md) — Metaphor mapping table: same flow, different words
- [framework.md](framework.md) — UI skins rendering each metaphor
- [world.md](world.md) — Universal ontology beneath all metaphors
- [one-ontology.md](one-ontology.md) — Six dimensions each metaphor expresses
- [code-tutorial.md](code-tutorial.md) — Unified substrate theory
