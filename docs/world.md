# World

A living world. Ants, humans, agents. Same ontology.

## The Metaphor

```
World      = the container of all
Groups     = regions, colonies, nations
Actors     = inhabitants (ants, humans, agents)
Things     = resources, artifacts, creations
Flows      = paths, relationships, trade
Events     = history, what happened
Knowledge  = collective memory, culture
```

## Three Worlds, One Ontology

### Ant World

```typescript
const antWorld = world()

// Groups = colonies
antWorld.group('colony-alpha', 'colony')
antWorld.group('colony-beta', 'colony')

// Actors = ants by caste
antWorld.actor('scout-1', 'scout', { group: 'colony-alpha' })
antWorld.actor('harvester-1', 'harvester', { group: 'colony-alpha' })
antWorld.actor('queen-1', 'queen', { group: 'colony-alpha' })

// Things = resources
antWorld.thing('food-source-1', 'food')
antWorld.thing('nest-entrance', 'structure')

// Flows = pheromone trails
antWorld.flow('scout-1', 'food-source-1').strengthen(1)  // Found food
antWorld.flow('food-source-1', 'nest-entrance').strengthen(1)  // Path home

// Events = foraging activity
// Knowledge = colony memory (proven trails)
```

### Human World

```typescript
const humanWorld = world()

// Groups = nations, cities, organizations
humanWorld.group('ireland', 'nation')
humanWorld.group('dublin', 'city', { parent: 'ireland' })
humanWorld.group('acme-corp', 'org', { parent: 'dublin' })

// Actors = people by role
humanWorld.actor('alice', 'employee', { group: 'acme-corp' })
humanWorld.actor('bob', 'customer')

// Things = products, services
humanWorld.thing('product-1', 'product')
humanWorld.thing('service-1', 'service')

// Flows = relationships, transactions
humanWorld.flow('bob', 'product-1').strengthen(1)  // Purchased
humanWorld.flow('alice', 'bob').strengthen(1)  // Served

// Events = transactions, interactions
// Knowledge = market patterns, culture
```

### Agent World

```typescript
const agentWorld = world()

// Groups = platforms, swarms, teams
agentWorld.group('agentverse', 'platform')
agentWorld.group('swarm-alpha', 'swarm', { parent: 'agentverse' })

// Actors = agents by type
agentWorld.actor('translator-1', 'agent', { group: 'swarm-alpha' })
agentWorld.actor('coder-1', 'agent', { group: 'swarm-alpha' })
agentWorld.actor('claude', 'llm')

// Things = tasks, tokens, services
agentWorld.thing('task-1', 'task')
agentWorld.thing('token-abc', 'token')

// Flows = interactions, delegations
agentWorld.flow('user', 'translator-1').strengthen(1)  // Success
agentWorld.flow('translator-1', 'coder-1').strengthen(1)  // Collaboration

// Events = completions, trades
// Knowledge = proven routes, expertise
```

## The Universal Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                         WORLD                                │
│                                                              │
│   "A container where inhabitants exist, connect,            │
│    act, and accumulate wisdom"                              │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   GROUPS (Regions)                                           │
│   └── Scope, isolation, hierarchy                           │
│                                                              │
│   ACTORS (Inhabitants)                                       │
│   └── Who lives here, what they can do                      │
│                                                              │
│   THINGS (Resources)                                         │
│   └── What exists to be used, created, traded               │
│                                                              │
│   FLOWS (Paths)                                              │
│   └── How inhabitants connect, trade, communicate           │
│                                                              │
│   EVENTS (History)                                           │
│   └── What happened, when, to whom                          │
│                                                              │
│   KNOWLEDGE (Wisdom)                                         │
│   └── What the world has learned                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Agentverse as World

```typescript
import { world } from '@fetchai/world'

// The world
const verse = world()

// Regions (platforms, ecosystems)
verse.group('fetchai', 'platform')
verse.group('agentverse', 'marketplace', { parent: 'fetchai' })

// Colonies within (organizations, DAOs)
verse.group('acme-agents', 'org', { parent: 'agentverse' })
verse.group('globex-ai', 'org', { parent: 'agentverse' })

// Swarms within colonies
verse.group('acme-translators', 'swarm', { parent: 'acme-agents' })
verse.group('acme-coders', 'swarm', { parent: 'acme-agents' })

// Inhabitants
verse.actor('translator-1', 'agent', { group: 'acme-translators' })
verse.actor('translator-2', 'agent', { group: 'acme-translators' })
verse.actor('coder-1', 'agent', { group: 'acme-coders' })

// Resources
verse.thing('task-translate', 'task')
verse.thing('token-acme', 'token')

// Paths form from interactions
verse.flow('user', 'translator-1').strengthen(1)
verse.flow('translator-1', 'coder-1').strengthen(1)

// Highways emerge (proven collaborations)
// Toxic paths clear (failed agents)
// The world learns
```

## The Living World

```
                    UNIVERSE (root world)
                           │
           ┌───────────────┼───────────────┐
           │               │               │
       FETCHAI         ETHEREUM        SOLANA
       (world)          (world)        (world)
           │
    ┌──────┴──────┐
    │             │
AGENTVERSE     ASI:ONE
 (region)      (region)
    │
    ├── acme-agents (colony)
    │   ├── translators (swarm)
    │   │   ├── translator-1 (ant)
    │   │   └── translator-2 (ant)
    │   └── coders (swarm)
    │       └── coder-1 (ant)
    │
    └── globex-ai (colony)
        └── analysts (swarm)
            └── analyst-1 (ant)

Flows connect across boundaries.
Highways emerge from repeated success.
The universe learns.
```

## Sync Across Worlds

```typescript
// Multiple worlds can sync
const fetchWorld = world()
const ethWorld = world()

// Bridge between worlds
function bridge(from: World, to: World, event: Event) {
  // Flows in one world create flows in another
  to.flow(event.from, event.to).strengthen(event.strength * 0.5)
}

// Cross-world discovery
function universalBest(type: string, worlds: World[]) {
  const candidates = worlds.flatMap(w => 
    w.open(10).filter(f => f.type === type)
  )
  return candidates.sort((a, b) => b.strength - a.strength)[0]
}
```

## The Vocabulary

| Generic | Ant | Human | Agent |
|---------|-----|-------|-------|
| world | world | world | verse |
| group | colony | nation/org | platform/swarm |
| actor | ant | person | agent |
| thing | food/nest | product | task/token |
| flow | trail | relationship | interaction |
| event | forage | transaction | completion |
| knowledge | colony memory | culture | patterns |

## API Design

```typescript
// Generic
const w = world()

// Or with vocabulary
const verse = agentverse()    // Same thing, different name
const colony = antColony()    // Same thing, different name
const org = organization()    // Same thing, different name

// All have same interface
w.group()      // verse.platform()   / colony.nest()     / org.division()
w.actor()      // verse.agent()      / colony.ant()      / org.employee()
w.thing()      // verse.task()       / colony.food()     / org.product()
w.flow()       // verse.interact()   / colony.trail()    / org.transact()
w.open()       // verse.discover()   / colony.highways() / org.bestPractices()
```

## The Truth

```
An ant colony is a world.
A human organization is a world.
An agent verse is a world.

Same 6 dimensions.
Same emergence.
Same learning.

Groups contain.
Actors act.
Things exist.
Flows connect.
Events happen.
Knowledge crystallizes.

Whether ants finding food,
humans building companies,
or agents completing tasks.

The pattern is universal.
The ontology is ONE.
```

---

*ONE world. Many inhabitants. Same laws.*
