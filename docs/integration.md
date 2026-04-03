# Integration

How everything connects. One ontology. One interface.

## ONE Ontology: The Foundation

Everything maps to 6 dimensions. No exceptions.

```
+-----------------------------------------------------------------------------+
|                           ONE ONTOLOGY                                       |
|                         (The Universal Base)                                 |
+-----------------------------------------------------------------------------+
|                                                                              |
|   1. GROUPS       Containers (platforms, colonies, orgs, DAOs)              |
|                                                                              |
|   2. ACTORS       Who acts (humans, agents, LLMs, systems)                  |
|                                                                              |
|   3. THINGS       What exists (tasks, tokens, services, resources)          |
|                                                                              |
|   4. CONNECTIONS  How they relate (flows with strength/resistance)          |
|                                                                              |
|   5. EVENTS       What happened (traversals, successes, failures)           |
|                                                                              |
|   6. KNOWLEDGE    What emerged (proven paths, patterns, intelligence)       |
|                                                                              |
+-----------------------------------------------------------------------------+
```

## world(): The Unified Interface

```typescript
import { world } from '@fetchai/world'

const w = world()

// All systems use the same 6 operations
w.group(id, type)                    // 1. Create containers
w.actor(id, type)                    // 2. Create agents
w.thing(id, type)                    // 3. Create entities
w.flow(from, to).strengthen(n)       // 4. Success signal
w.flow(from, to).resist(n)           // 5. Failure signal
w.crystallize()                      // 6. Extract patterns

// Query the world
w.open(n)                            // Best paths
w.blocked()                          // Paths to avoid
w.best(type)                         // Best actor for task
w.proven()                           // Proven actors
w.confidence(type)                   // How well we know
```

## How Everything Maps to 6 Dimensions

| System | Groups | Actors | Things | Connections | Events | Knowledge |
|--------|--------|--------|--------|-------------|--------|-----------|
| **ASI** | platforms | LLMs, orchestrator | tasks, decisions | user->task->llm | routing decisions | highways |
| **Agentverse** | namespaces, orgs | 2M+ agents | services, endpoints | agent interactions | calls, completions | proven agents |
| **Agent Launch** | ecosystems | traders, holders | tokens, invoices | economic flows | trades, payments | trust scores |
| **Substrate** | colonies | units | signals | pheromone trails | traversals | emergent paths |
| **TypeDB** | schemas | entities | attributes | relations | events | inferred facts |

## The Complete System

```
+-----------------------------------------------------------------------------+
|                           ONE ONTOLOGY (6 dimensions)                        |
|       Groups | Actors | Things | Connections | Events | Knowledge           |
+-----------------------------------------------------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------------+
|                              USER / CLIENT                                   |
+-----------------------------------------------------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------------+
|                           ASI ORCHESTRATOR                                   |
|                                                                              |
|   Dimension mapping:                                                         |
|   +-- GROUPS:      platforms, swarms                                        |
|   +-- ACTORS:      LLMs (Claude, GPT), orchestrator                         |
|   +-- THINGS:      tasks, decisions                                         |
|   +-- CONNECTIONS: user->task->llm flows                                    |
|   +-- EVENTS:      routing decisions                                        |
|   +-- KNOWLEDGE:   learned routes (highways)                                |
|                                                                              |
|   +------------------+    +------------------+    +------------------+       |
|   | w.confidence()   |--->|  FAST PATH       |    |   LLM ACTORS     |       |
|   |   > 0.7?         | Y  |  w.best(task)    |    |                  |       |
|   +--------+---------+    +--------+---------+    |  w.actor(        |       |
|            | N                     |              |    'claude',     |       |
|            v                       |              |    'llm')        |       |
|   +------------------+             |              |                  |       |
|   |  ASK LLM         |-------------+------------->|                  |       |
|   |  w.flow().       |             |              +------------------+       |
|   |  strengthen()    |             |                                         |
|   +--------+---------+             |                                         |
|            +----------+------------+                                         |
|                       v                                                      |
+-----------------------------------------------------------------------------+
                        |
                        v
+-----------------------------------------------------------------------------+
|                            AGENTVERSE                                        |
|                                                                              |
|   Dimension mapping:                                                         |
|   +-- GROUPS:      namespaces, organizations                                |
|   +-- ACTORS:      2M+ agents                                               |
|   +-- THINGS:      services, endpoints                                      |
|   +-- CONNECTIONS: agent interactions                                       |
|   +-- EVENTS:      calls, completions                                       |
|   +-- KNOWLEDGE:   proven agents, expertise                                 |
|                                                                              |
|   +-----------+   +-----------+   +-----------+   +-----------+             |
|   |  Agent A  |   |  Agent B  |   |  Agent C  |   |  Agent ...|             |
|   | translator|   |  coder    |   |  analyst  |   |           |             |
|   +-----+-----+   +-----+-----+   +-----+-----+   +-----------+             |
|         |               |               |                                    |
|         +---------------+---------------+                                    |
|                         v                                                    |
|              +---------------------+                                         |
|              |  w.best('agent')    |  <- w.proven() returns best            |
|              |  w.flow().strengthen|  <- success recorded                   |
|              |  w.open(10)         |  <- discover agents                    |
|              +---------------------+                                         |
|                                                                              |
+-----------------------------------------------------------------------------+
                        |
                        v
+-----------------------------------------------------------------------------+
|                        AGENT LAUNCH TOOLKIT                                  |
|                                                                              |
|   Dimension mapping:                                                         |
|   +-- GROUPS:      token ecosystems, communities                            |
|   +-- ACTORS:      traders, holders, agents                                 |
|   +-- THINGS:      tokens, invoices, bounties                               |
|   +-- CONNECTIONS: economic relationships                                   |
|   +-- EVENTS:      trades, payments, disputes                               |
|   +-- KNOWLEDGE:   market patterns, trust scores                            |
|                                                                              |
|   Events -> world():                                                         |
|   +---------------------------------------------------------------------+   |
|   |  trade:buy       ->  w.flow(buyer, token).strengthen(amount)        |   |
|   |  trade:sell      ->  w.flow(seller, token).resist(amount * 0.5)     |   |
|   |  invoice:paid    ->  w.flow(payer, agent).strengthen(amount)        |   |
|   |  invoice:dispute ->  w.flow(payer, agent).resist(amount * 2)        |   |
|   |  holder:change   ->  w.flow(holder, token).strengthen(1)            |   |
|   +---------------------------------------------------------------------+   |
|                                                                              |
+-----------------------------------------------------------------------------+
                        |
                        v
+-----------------------------------------------------------------------------+
|                          SUBSTRATE (70 ln)                                   |
|                                                                              |
|   The runtime for ONE ontology.                                             |
|   Implements CONNECTIONS (dimension 4) with pheromone semantics.            |
|                                                                              |
|      flow.strengthen()             flow.resist()                            |
|              |                              |                                |
|              v                              v                                |
|   +---------------------------------------------------------------------+   |
|   |                    CONNECTION MAP                                    |   |
|   |                                                                      |   |
|   |   user->translation->agent-A: 45.2  ############    (open)          |   |
|   |   user->translation->agent-B: 12.1  ####            (closing)       |   |
|   |   user->coding->agent-C: 67.8       #############   (highway)       |   |
|   |   user->coding->agent-D: 3.2        #               (fading)        |   |
|   |   user->analysis->agent-E: 8.5:alarm ...            (blocked)       |   |
|   |                                                                      |   |
|   +---------------------------------------------------------------------+   |
|              |                              |                                |
|              v                              v                                |
|        w.open(limit)                  w.blocked()                           |
|                                                                              |
+-----------------------------------------------------------------------------+
                        |
                        v
+-----------------------------------------------------------------------------+
|                         TYPEDB + ONE SCHEMA                                  |
|                                                                              |
|   The persistent KNOWLEDGE layer (dimension 6).                             |
|   Inference derives intelligence from raw data.                             |
|                                                                              |
|   +---------------------------------------------------------------------+   |
|   |                      INFERENCE ENGINE                                |   |
|   |                                                                      |   |
|   |   strength >= 50    -->  flow-status = "open"                       |   |
|   |   strength < 5      -->  flow-status = "fading"                     |   |
|   |   resist > strength -->  flow-status = "blocked"                    |   |
|   |   strength > 20     -->  actor status = "proven"                    |   |
|   |                                                                      |   |
|   +---------------------------------------------------------------------+   |
|                                                                              |
|   +---------------------------------------------------------------------+   |
|   |                      FUNCTIONS (via world())                         |   |
|   |                                                                      |   |
|   |   w.best(type)       -->  top proven actor                          |   |
|   |   w.open(n)          -->  strongest paths                           |   |
|   |   w.blocked()        -->  paths to avoid                            |   |
|   |   w.confidence(type) -->  how sure we are                           |   |
|   |   w.proven()         -->  all proven actors                         |   |
|   |                                                                      |   |
|   +---------------------------------------------------------------------+   |
|                                                                              |
+-----------------------------------------------------------------------------+
```

## Data Flow: One Request

```
1. USER: "translate 'hello' to Spanish"
         |
         v
2. ASI:  w.confidence('translation') = 0.45  (< 0.7)
         -> No highway, ask LLM
         -> LLM says: "agent-translator-1"
         -> w.flow('asi', 'agent-translator-1').strengthen(0.5)
         |
         v
3. AGENTVERSE: call('agent-translator-1', payload)
               -> Forward to real agent endpoint
               -> Wait for response
         |
         v
4. AGENT: Executes translation
          Returns: { result: "hola" }
         |
         v
5. AGENTVERSE: Success!
               -> w.flow('user', 'agent-translator-1').strengthen(1)
         |
         v
6. SUBSTRATE: Trail strength increases
              45.2 + 1 = 46.2
         |
         v
7. PERSIST: sync() -> TypeDB updated
         |
         v
8. TYPEDB: Inference runs
           46.2 < 50 -> still not highway
           (4 more successes -> becomes highway)
         |
         v
9. USER: Gets response: "hola"

-------------------------------------------------------------------

NEXT REQUEST (same task):

1. USER: "translate 'goodbye' to Spanish"
         |
         v
2. ASI:  w.confidence('translation') = 0.85  (> 0.7)
         -> Highway exists! Skip LLM entirely
         -> w.best('translation') -> 'agent-translator-1'
         |
         v
3-9: Same flow, but NO LLM CALL

Cost:    First request ~$0.01, subsequent ~$0.0001
Latency: First request ~2s, subsequent ~50ms
```

## Event Integration: Agent Launch Toolkit

```
+-----------------------------------------------------------------------------+
|                      AGENT LAUNCH TOOLKIT                                    |
|                                                                              |
|   Events emitted (dimension 5: EVENTS):                                      |
|   -------------------------------------                                      |
|   trade:buy       ->  Economic confidence signal                            |
|   trade:sell      ->  Economic doubt signal                                 |
|   holder:change   ->  Trust signal                                          |
|   invoice:paid    ->  Task success signal                                   |
|   invoice:dispute ->  Task failure signal                                   |
|                                                                              |
+-----------------------------------------------------------------------------+
                        |
                        v
+-----------------------------------------------------------------------------+
|                         EVENT BRIDGE                                         |
|                                                                              |
|   // All events flow through world() interface                              |
|                                                                              |
|   onEvent('trade', (e) => {                                                 |
|     e.action === 'buy'                                                      |
|       ? w.flow(`market`, e.token).strengthen(e.amount)                      |
|       : w.flow(`market`, e.token).resist(e.amount * 0.5)                    |
|   })                                                                         |
|                                                                              |
|   onEvent('invoice:paid', (e) => {                                          |
|     w.flow(e.payer, e.agent).strengthen(e.amount)                           |
|   })                                                                         |
|                                                                              |
+-----------------------------------------------------------------------------+
                        |
                        v
                   SUBSTRATE
                   (same flow)
```

## Multi-Colony Architecture

```
+-----------------------------------------------------------------------------+
|                           ROOT WORLD                                         |
|                                                                              |
|   const root = world()                                                       |
|   root.group('fetchai', 'platform')                                         |
|                                                                              |
|   +---------------------------------------------------------------------+   |
|   |                         ASI (router)                                 |   |
|   +---------------------------------------------------------------------+   |
|                                   |                                          |
|       +--------------+------------+------------+--------------+             |
|       v              v                         v              v             |
|   +----------+  +----------+             +----------+  +----------+         |
|   |AGENTVERSE|  | LLM POOL |             |  TOOLS   |  |  AGENT   |         |
|   | (group)  |  | (group)  |             | (group)  |  |  LAUNCH  |         |
|   +----+-----+  +----+-----+             +----+-----+  +----+-----+         |
|        |             |                        |             |               |
|   +----+----+   +----+----+             +----+----+   +----+----+           |
|   | agent-1 |   | claude  |             | search  |   | trader-1|           |
|   | agent-2 |   | gpt-4   |             | browse  |   | holder-1|           |
|   | agent-n |   | llama   |             | code    |   | agent-1 |           |
|   +---------+   +---------+             +---------+   +---------+           |
|                                                                              |
+-----------------------------------------------------------------------------+

Each sub-group:
- Has its own scent map (CONNECTIONS)
- Learns independently (KNOWLEDGE)
- Reports highways to parent
- Can be replaced without affecting others
```

## The Integration Points

| System | Integrates Via | Dimension Mapping |
|--------|----------------|-------------------|
| User | HTTP/WebSocket | Request -> world() -> Response |
| ASI | world() wrapper | All 6 dimensions |
| Agentverse | world() wrapper | Groups=namespaces, Actors=agents |
| Agent Launch | Event bridge -> world() | Events=trades, Knowledge=trust |
| TypeDB | persist layer | Stores all 6 dimensions |
| LLMs | world().actor() | Actors with capabilities |
| Tools | world().thing() | Things with affordances |

## The Files

```
src/engine/
+-- substrate.ts   (70)  -- The runtime (CONNECTIONS layer)
+-- persist.ts     (40)  -- TypeDB layer (KNOWLEDGE layer)
+-- llm.ts         (30)  -- Models as actors
+-- agentverse.ts  (70)  -- Agents as actors
+-- asi.ts         (70)  -- Orchestrator (routes through world)
+-- world.ts       (50)  -- The unified interface
+-- index.ts       (20)  -- Exports

src/schema/
+-- one.tql       (150)  -- ONE ontology (6 dimensions)

docs/
+-- one-ontology.md      -- The 6 dimensions
+-- world.md             -- The world() interface
+-- substrate.md         -- How CONNECTIONS work
+-- agent-launch.md      -- Toolkit integration
+-- the-stack.md         -- All modules
+-- integration.md       -- This file

Total: ~500 lines of code + ~150 lines of schema
```

## One Import

```typescript
import { world } from '@fetchai/world'

// Everything through world()
const w = world()

// Groups (dimension 1)
w.group('agentverse', 'platform')
w.group('acme-agents', 'org', { parent: 'agentverse' })

// Actors (dimension 2)
w.actor('claude', 'llm')
w.actor('translator-1', 'agent', { group: 'acme-agents' })

// Things (dimension 3)
w.thing('task-translate', 'task')
w.thing('token-acme', 'token')

// Connections (dimension 4)
w.flow('user', 'translator-1').strengthen(1)  // Success
w.flow('user', 'agent-bad').resist(1)         // Failure

// Events (dimension 5) - automatic from flows

// Knowledge (dimension 6) - inferred
w.best('agent')       // Returns best agent
w.proven()            // Returns proven actors
w.open(10)            // Returns open flows
w.confidence('task')  // Returns certainty

// Persistence
await w.sync()        // Save to TypeDB
await w.load()        // Load from TypeDB
```

## The Universal Pattern

```
+----------------------------------+
|           world()                |
|                                  |
|   +---------------------------+  |
|   |  1. Groups   (containers) |  |
|   +---------------------------+  |
|              |                   |
|   +---------------------------+  |
|   |  2. Actors   (who acts)   |  |
|   +---------------------------+  |
|              |                   |
|   +---------------------------+  |
|   |  3. Things   (what exists)|  |
|   +---------------------------+  |
|              |                   |
|   +---------------------------+  |
|   |  4. Connections (flows)   |  |
|   +---------------------------+  |
|              |                   |
|   +---------------------------+  |
|   |  5. Events   (history)    |  |
|   +---------------------------+  |
|              |                   |
|   +---------------------------+  |
|   |  6. Knowledge (emerged)   |  |
|   +---------------------------+  |
|                                  |
+----------------------------------+

Whether modeling:
- Agentverse (2M+ agents)
- Agent Launch (economic signals)
- ASI (LLM routing)
- Any system

Same 6 dimensions. Same world() interface.
ONE ontology. Universal integration.
```

---

*ONE ontology. world() interface. Universal integration.*
