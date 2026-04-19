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
|   4. PATHS        How they relate (connections with weight)                 |
|                                                                              |
|   5. EVENTS       What happened (traversals, successes, failures)           |
|                                                                              |
|   6. KNOWLEDGE    What emerged (highways, patterns, intelligence)           |
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
w.mark(from, to, n)                  // 4. Leave weight on path
w.fade(rate)                         // 5. Decay paths
w.know()                      // 6. Extract patterns

// Query the world
w.open(n)                            // Best paths
w.blocked()                          // Paths to avoid
w.best(type)                         // Best actor for task
w.proven()                           // Proven actors
w.confidence(type)                   // How well we know
```

## How Everything Maps to 6 Dimensions

| System | Groups | Actors | Things | Paths | Events | Knowledge |
|--------|--------|--------|--------|-------|--------|-----------|
| **ASI** | platforms | LLMs, orchestrator | tasks, decisions | user->task->llm | routing decisions | highways |
| **Agentverse** | namespaces, orgs | 2M+ agents | services, endpoints | agent interactions | calls, completions | proven agents |
| **Agent Launch** | ecosystems | traders, holders | tokens, invoices | economic flows | trades, payments | trust scores |
| **Substrate** | colonies | units | signals, data | pheromone trails | traversals | highways |
| **TypeDB** | schemas | entities | attributes | relations | events | inferred facts |

## The Complete System

```
+-----------------------------------------------------------------------------+
|                           ONE ONTOLOGY (6 dimensions)                        |
|         Groups | Actors | Things | Paths | Events | Knowledge               |
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
|   +-- PATHS:       user->task->llm paths                                    |
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
|   |  w.signal().     |             |              +------------------+       |
|   |  mark()          |             |                                         |
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
|   +-- PATHS:       agent interactions (weighted)                            |
|   +-- EVENTS:      calls, completions                                       |
|   +-- KNOWLEDGE:   highways, proven agents                                  |
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
|              |  w.mark()           |  <- success recorded                   |
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
|   +-- PATHS:       economic relationships (weighted)                        |
|   +-- EVENTS:      trades, payments, disputes                               |
|   +-- KNOWLEDGE:   highways, trust scores                                   |
|                                                                              |
|   Events -> world():                                                         |
|   +---------------------------------------------------------------------+   |
|   |  trade:buy       ->  w.mark(buyer, token, amount)                   |   |
|   |  trade:sell      ->  w.mark(seller, token, amount * 0.5)            |   |
|   |  invoice:paid    ->  w.mark(payer, agent, amount)                   |   |
|   |  invoice:dispute ->  (no mark - failure signals via event)          |   |
|   |  holder:change   ->  w.mark(holder, token, 1)                       |   |
|   +---------------------------------------------------------------------+   |
|                                                                              |
+-----------------------------------------------------------------------------+
                        |
                        v
+-----------------------------------------------------------------------------+
|                          SUBSTRATE (70 ln)                                   |
|                                                                              |
|   The runtime for ONE ontology.                                             |
|   Implements PATHS (dimension 4) with weight semantics.                     |
|                                                                              |
|      mark()                        fade()                                   |
|              |                              |                                |
|              v                              v                                |
|   +---------------------------------------------------------------------+   |
|   |                        PATH MAP                                      |   |
|   |                                                                      |   |
|   |   user->translation->agent-A: 45.2  ############    (open)          |   |
|   |   user->translation->agent-B: 12.1  ####            (fading)        |   |
|   |   user->coding->agent-C: 67.8       #############   (highway)       |   |
|   |   user->coding->agent-D: 3.2        #               (fading)        |   |
|   |   user->analysis->agent-E: 8.5      ...             (blocked)       |   |
|   |                                                                      |   |
|   +---------------------------------------------------------------------+   |
|              |                              |                                |
|              v                              v                                |
|        w.open(limit)                  w.sense()                             |
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
|   |   strength >= 50    -->  path-status = "open"                        |   |
|   |   strength < 5      -->  path-status = "fading"                     |   |
|   |   resist > strength -->  path-status = "blocked"                    |   |
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
         -> w.mark('asi', 'agent-translator-1', 0.5)
         |
         v
3. AGENTVERSE: call('agent-translator-1', data)
               -> Forward to real agent endpoint
               -> Wait for response
         |
         v
4. AGENT: Executes translation
          Returns: { result: "hola" }
         |
         v
5. AGENTVERSE: Success!
               -> w.mark('user', 'agent-translator-1', 1)
         |
         v
6. SUBSTRATE: Path weight increases
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
|       ? w.mark(`market`, e.token, e.amount)                                 |
|       : w.mark(`market`, e.token, e.amount * 0.5)                           |
|   })                                                                         |
|                                                                              |
|   onEvent('invoice:paid', (e) => {                                          |
|     w.mark(e.payer, e.agent, e.amount)                                      |
|   })                                                                         |
|                                                                              |
+-----------------------------------------------------------------------------+
                        |
                        v
                   SUBSTRATE
                   (same flow)
```

## Multi-World Architecture

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
- Has its own path map (PATHS)
- Learns independently (KNOWLEDGE)
- Reports highways to parent
- Can be replaced without affecting others
```

## The Integration Points

| System | Integrates Via | Mode | Dimension Mapping |
|--------|----------------|------|-------------------|
| Hermes Agent | MCP server + deep import | Deep | All 6 — runs colony locally, syncs to TypeDB |
| Raw LLM (Claude, GPT) | AI SDK streamText() | Controlled | Actors + Events — AI SDK IS the runtime |
| OpenClaw / Robots | HTTP API | Connected | Actors + Events — signals via REST |
| Fetch.ai / Agentverse | world() wrapper | Connected | Groups=namespaces, Actors=agents |
| Agent Launch | Event bridge -> world() | Connected | Events=trades, Knowledge=trust |
| Custom Agent | MCP or HTTP (your choice) | Either | Whatever dimensions you touch |
| Human / User | HTTP/WebSocket + UI | Connected | Request -> world() -> Response |
| TypeDB | persist layer | — | Single source of truth. All 6 dimensions |
| AI SDK | generateObject + streamText | — | Control plane. Generates + drives agents |
| Sui | Move contracts | — | Crystallization. Permanent state + payments |

### Two Integration Modes

**Deep** — Agent imports substrate logic, runs colony locally, syncs to TypeDB:
```typescript
import { colony, unit } from "@/engine/substrate"
const net = world()
const me = net.add("hermes-01").on("research", handler)
```

**Connected** — Agent calls HTTP API, substrate handles everything:
```
POST /api/signal  { sender: "claw-01", receiver: "coord", data: {...} }
POST /api/agents  { uid: "claw-01", kind: "agent", capabilities: ["pick"] }
GET  /api/discover?task=pick
```

Both produce the same result in TypeDB: signals, edges, trails, inference.

## The Files

```
src/engine/
+-- substrate.ts   (70)  -- The runtime (Paths layer)
+-- persist.ts     (40)  -- TypeDB layer (Knowledge layer)
+-- llm.ts         (30)  -- Models as actors
+-- agentverse.ts  (70)  -- Agents as actors
+-- asi.ts         (70)  -- Orchestrator (routes through world)
+-- world.ts       (50)  -- The unified interface
+-- index.ts       (20)  -- Exports

src/pages/api/
+-- agents.ts             -- Registration + discovery
+-- signal.ts             -- Signal recording
+-- discover.ts           -- Pheromone-ranked search
+-- chat.ts               -- AI SDK streaming

src/lib/
+-- substrate-tools.ts    -- AI SDK tool definitions
+-- agent-registry.ts     -- TypeDB unit + capability CRUD

gateway/
+-- mcp-one/server.py     -- MCP server (Hermes + any MCP client)
+-- src/index.ts           -- Cloudflare Worker proxy

src/schema/
+-- one.tql       (548)   -- THE schema: 6 dimensions + 6 lessons + commerce

scripts/
+-- generate_agents_md.py  -- AGENTS.md from live TypeDB state
+-- world.py              -- Multi-species colony orchestrator
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

// Paths (dimension 4)
w.mark('user', 'translator-1', 1)             // Leave weight on path
w.fade(0.1)                                   // Decay paths

// Events (dimension 5) - automatic from signals

// Knowledge (dimension 6) - inferred
w.best('agent')       // Returns best agent
w.proven()            // Returns proven actors
w.open(10)            // Returns open paths
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
|   |  4. Paths    (weighted)   |  |
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

*ONE ontology. Any species. Universal integration.*

---

## See Also

- [hermes-agent.md](hermes-agent.md) — Multi-species agent architecture (Hermes, LLM, OpenClaw)
- [flows.md](flows.md) — Signal flow from user request to learned highway
- [revenue.md](one/revenue.md) — How multi-species traffic monetizes
- [the-stack.md](the-stack.md) — Technical layers being integrated
- [agent-launch.md](agent-launch.md) — AgentLaunch SDK bridge
- [one-protocol.md](one-protocol.md) — Protocol the substrate serves
- [substrate-learning.md](substrate-learning.md) — How integration produces learning
- [typedb.md](typedb.md) — Persistence layer for integrated state
