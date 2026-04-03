# Metaphors

Same system. Different languages.

---

## ONE — The Meta-Metaphor

Not ants. Not brains. Not teams. Just ONE.

ONE sits above all metaphors. It captures the six fundamental dimensions that every swarm system exhibits, regardless of domain vocabulary.

### The Six Dimensions

```
┌─────────────────────────────────────────────────────────────┐
│                         ONE                                  │
├─────────────┬───────────────────────────────────────────────┤
│ one         │ a thing that is (the fundamental unit)        │
│ part        │ composition of ones (the container)           │
│ flow        │ movement between ones (the connection)        │
│ strength    │ how reinforced (positive signal)              │
│ resistance  │ how blocked (negative signal)                 │
│ time        │ decay over duration (forgetting)              │
└─────────────┴───────────────────────────────────────────────┘
```

These six dimensions are universal:
- **one** — the atomic entity that receives and processes
- **part** — the whole that contains ones
- **flow** — the directed edge between ones
- **strength** — positive reinforcement on success
- **resistance** — negative reinforcement on failure
- **time** — natural decay that prunes unused paths

### world() — The Universal Interface

```typescript
import { world } from '@anthropic/one'

// Create a world with any vocabulary
const w = world()

// Spawn ones
const a = w.one('a')
const b = w.one('b')

// Define behavior
a.on('process', (payload, emit) => {
  emit({ receiver: 'b', payload: transform(payload) })
})

// Send signal
w.send({ receiver: 'a:process', payload: data })

// The six operations
w.strengthen('a→b', 1)    // Reinforce flow
w.resist('a→b', 1)        // Block flow
w.decay(0.1)              // Time passes
w.open(10)                // Strongest flows
w.blocked()               // Blocked flows
w.best('task')            // Best one for task type
```

### ONE Maps to Everything

| Dimension | ONE | Ant | Brain | Team | Mail | Water | Signal |
|-----------|-----|-----|-------|------|------|-------|--------|
| **one** | one | ant | neuron | agent | mailbox | pool | receiver |
| **part** | part | colony | network | team | office | watershed | network |
| **flow** | flow | trail | synapse | workflow | route | channel | frequency |
| **strength** | strengthen | deposit | potentiate | commend | stamp | carve | boost |
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
envelope → scent
send     → forage
mark     → deposit
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
envelope → impulse
send     → fire
mark     → potentiate
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
envelope → task
send     → delegate
mark     → commend
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
envelope → envelope (!)
send     → deliver
mark     → stamp
alarm    → return to sender
fade     → archive
highways → express routes
```

```typescript
import { mailbox, postOffice } from '@fetchai/world'

const inbox = mailbox('support')
  .on('inquiry', ({ message }, reply, ctx) => {
    const response = handle(message)
    reply({ to: ctx.from, envelope: { response } })
  })

const office = postOffice()
office.open('support', inbox)
office.deliver({ to: 'support:inquiry', envelope: { message } })

// Routing mechanics
office.stamp('customer→support', 1)    // Successful delivery
office.return('customer→support', 1)   // Failed delivery
office.archive(0.1)                     // Old routes fade
office.express(10)                      // Fastest routes
```

**Why this works:** Mail has receivers and payloads. Routing optimizes over time. Simple mental model.

---

### 5. Water / Flow

```
unit     → pool
colony   → watershed
envelope → drop
send     → flow
mark     → carve
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
envelope → signal
send     → transmit
mark     → boost
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

## Comparison Table — All Six Dimensions

| Dimension | Substrate | Ant | Brain | Team | Mail | Water | Signal |
|-----------|-----------|-----|-------|------|------|-------|--------|
| **one** | unit | ant | neuron | agent | mailbox | pool | receiver |
| **part** | colony | nest | network | team | post office | watershed | network |
| **flow** | envelope | scent | impulse | task | envelope | drop | signal |
| **strength** | mark | deposit | potentiate | commend | stamp | carve | boost |
| **resistance** | alarm | alarm | inhibit | flag | return | dam | jam |
| **time** | fade | evaporate | decay | forget | archive | dry | attenuate |

### Operations

| Operation | Substrate | Ant | Brain | Team | Mail | Water | Signal |
|-----------|-----------|-----|-------|------|------|-------|--------|
| create | spawn | hatch | grow | hire | open | dig | tune |
| send | send | forage | fire | delegate | deliver | flow | transmit |
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
- **one** — things that receive
- **part** — things that contain
- **flow** — connections between
- **strength** — positive reinforcement
- **resistance** — negative reinforcement
- **time** — decay

But **humans** care. The right metaphor:
- Makes the system intuitable
- Guides correct usage
- Prevents misuse
- Aids teaching

## Our Choice: world() + Aliases

```typescript
// Universal entry point
import { world } from '@anthropic/one'

// Or use the substrate directly
import { unit, colony } from '@/engine/substrate'

// Aliases: pick your metaphor
export { unit as ant, colony as nest }        // Ant
export { unit as neuron, colony as network }  // Brain
export { unit as agent, colony as team }      // Team
export { unit as atom, colony as swarm }      // Physics

// The six dimensions map to methods:
// one       → spawn/hatch/grow/hire
// part      → colony/nest/network/team
// flow      → send/forage/fire/delegate
// strength  → mark/deposit/potentiate/commend
// resistance → alarm/inhibit/flag/return
// time      → fade/evaporate/decay/forget
```

We use **ONE** as the meta-model (because it's universal) with **world()** as the entry point. Domain-specific aliases let users think in their preferred vocabulary while the substrate handles the six fundamental dimensions.

---

## What Flows

The envelope is a carrier. The payload is anything:

| Domain | Envelope carries | Example |
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
{ receiver: 'nest:store', payload: { food: 'seed', calories: 50 } }

// Agent carrying data
{ receiver: 'analyst:process', payload: { records: [...], format: 'csv' } }

// Neuron carrying signal
{ receiver: 'cortex:integrate', payload: { activation: 0.87, source: 'retina' } }

// Worker carrying task
{ receiver: 'builder:construct', payload: { blueprint: {...}, materials: [...] } }
```

## The Envelope is Content-Agnostic

```typescript
type Envelope = {
  receiver: string    // Where it goes
  payload?: unknown   // What it carries (anything)
}
```

The substrate doesn't know or care what's inside. It just:
1. Routes to the receiver
2. Marks the edge on delivery
3. Lets the handler decide what to do

This is why the same 70 lines can model:
- Ant colonies carrying food
- Neural networks carrying signals
- Data pipelines carrying records
- Agent swarms carrying tasks
- Economies carrying value

**The payload is the domain. The substrate is universal.**

---

*ONE is the territory. The metaphors are maps. `world()` is your compass.*
