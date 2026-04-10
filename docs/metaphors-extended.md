# Metaphors Extended: AgentVerse, Langchain, and Everything

**One formula. Infinite vocabularies. Every ecosystem speaks the same language underneath.**

---

## The Problem We're Solving

A Langchain agent and an AgentVerse agent and a Hermes agent and a human freelancer all do work for ONE. They all need to:
- Receive tasks (signals)
- Execute them (handlers)
- Report outcomes (mark/warn)
- Get routed based on past performance (pheromone)

But they speak different languages:
- Langchain: "Agent", "Tool", "Chain", "callback"
- AgentVerse: "Bureau", "Agent", "Protocol", "Almanac"
- Hermes: "Goal", "Subtask", "Advice", "Crystallize"
- Human: "Job", "Task", "Skill", "Reputation"

**Solution:** Map everything to the same 5 verbs underneath:
```
signal → mark → warn → fade → follow
```

---

## The Unified Metaphor Table

### Core Concept Mappings

| Core ONE | Ant | Brain | Team | Mail | Water | Signal | Langchain | AgentVerse | Hermes | Human | Fetch.ai |
|----------|-----|-------|------|------|-------|--------|-----------|------------|--------|-------|----------|
| **Signal** | pheromone | spike | task | letter | drop | signal | input | message | goal | request | message |
| **Receiver** | ant | neuron | agent | mailbox | pool | receiver | agent | agent | unit | person | agent |
| **Handler** | behavior | firing pattern | action | process | flow | handler | tool/chain | service | behavior | work | service |
| **Data** | chemical | pattern | payload | contents | volume | data | input dict | payload | state | work item | data |
| **Success** | deposit | potentiate | commend | deliver | carve | mark | success callback | ACK | hypothesis_confirmed | paid | success |
| **Failure** | alarm | inhibit | flag | return | dam | warn | error callback | NACK | hypothesis_rejected | unpaid | failure |
| **Path** | trail | synapse | workflow | route | channel | frequency | execution path | agent registry | advice network | career path | service registry |
| **Strong path** | highway | pathway | pipeline | express | river | channel | proven agent | famous bureau | crystallized pattern | top freelancer | high-reputation agent |
| **Decay** | evaporate | decay | forget | archive | dry | attenuate | cache expire | reputation reset | time decay | experience fades | timeout |
| **Routing** | smell-following | synaptic weight | skill-matching | zipcode lookup | flow rate | signal strength | agent selection | bureau discovery | advice lookup | word-of-mouth | almanac query |
| **Best path** | strongest trail | highest synapse | top performer | fastest route | main river | strongest signal | best agent | flagship bureau | proven peer | trusted friend | top rated |

---

## The Framework Mappings

### Langchain → ONE

```
Langchain Concept          ONE Concept           Pheromone Meaning
─────────────────────────────────────────────────────────────────
Agent                      unit                  Receiver of signals
Tool                       handler/.on()         Executes on signal
Chain                      continuation/.then()  Chains signals
Tool result                mark/warn             Success/failure deposit
Agent decision             select()              Choose next tool
Callback                   emit()                Fan out results
Memory                     path strength         What worked before
Tool use tracking          pheromone             How often tool succeeded
Retrieval augmented gen    highways              Best practices crystallized
Agent failure              warn()                Accumulate resistance
```

**How Langchain Maps:**

```typescript
// Langchain code                    // ONE interpretation
const agent = AgentExecutor(...)    // unit("langchain:agent")
agent.invoke({input: data})         // signal({receiver: "langchain:agent", data})
→ tool.call(input)                  // .on("tool_name", handler)
→ callback({tool, result})          // mark("langchain→tool", result.success)
→ next_step()                        // .then("tool_name", next)
→ final_answer                       // emit({receiver: "user", data: answer})
```

**Code Example:**

```typescript
// Langchain agent orchestrated by ONE

import { Langchain } from 'langchain'
import { mark, warn, ask } from '@/lib/typedb'

// Register Langchain agent as ONE unit
const unit = world().add('langchain:researcher')
  .on('research', async (data, emit) => {
    // Langchain agent handles 'research' signal
    const agent = new AgentExecutor({
      tools: [search, summarize, validate],
      llm: model,
    })
    
    try {
      const result = await agent.invoke({
        input: data.query,
        callbacks: [
          {
            on_tool_end: (output) => {
              // Each tool success = mark the path
              mark(`researcher→${output.tool}`, 1)
            },
            on_tool_error: (error) => {
              // Tool failure = warn
              warn(`researcher→${error.tool}`, 1)
            },
          },
        ],
      })
      
      // Success: emit result, mark the whole research path
      mark('langchain:researcher', 1 + chainDepth)
      emit({
        receiver: data.replyTo,
        data: { result: result.output }
      })
    } catch (e) {
      // Failure: warn the path
      warn('langchain:researcher', 1)
      emit({
        receiver: data.replyTo,
        data: { error: e.message }
      })
    }
  })
```

---

### AgentVerse → ONE

```
AgentVerse Concept        ONE Concept           Pheromone Meaning
──────────────────────────────────────────────────────────────────
Agent                     unit                  Receiver of protocols
Service                   handler/.on()         What agent can do
Bureau                    group                 Container (org)
Protocol                  signal type           Named interaction
Almanac                    highways()            Directory of services
Service registration      mark path             Agent gets routed more
Service latency           warn path             Slow service = less routed
Bureau discovery          select()              Find best bureau
Agent health              success-rate          Reputation score
Interaction fee           revenue               Payment = pheromone boost
```

**How AgentVerse Maps:**

```typescript
// AgentVerse code                  // ONE interpretation
const agent = Agent(...)            // unit("agentverse:agent")
agent.register(protocol)            // .on("protocol_name", handler)
→ search_almanac(service)           // highways(filter: "service")
→ call_service(proto, data)         // signal({receiver: "service", data})
→ settlement                        // mark(path, revenue_boost)
→ reputation_update                 // success-rate += 1/samples
```

**Code Example:**

```typescript
// AgentVerse agent bridged to ONE

import { Almanac, Agent } from 'fetch-ai'
import { signal, mark, warn, world } from '@/lib/typedb'

// Register AgentVerse agent as ONE unit
const unit = world().add('agentverse:translator')
  .on('translate', async (data, emit, ctx) => {
    try {
      // AgentVerse: query Almanac for best translation service
      const services = await Almanac.search({
        type: 'translation',
        language_pair: data.languages,
      })
      
      // ONE: select best by pheromone weight (not just price)
      const best = world().select('translation-service', 0.8)
      
      if (!best) {
        warn('agentverse:translator', 0.5)
        throw new Error('No translation service available')
      }
      
      // AgentVerse: call service protocol
      const result = await signal({
        receiver: best,
        data: { 
          text: data.text,
          from_lang: data.languages[0],
          to_lang: data.languages[1],
          replyTo: ctx.self,
        }
      })
      
      // ONE: mark the path (pheromone boost on success)
      const chainBonus = 1 + (ctx.depth || 0) * 0.5
      mark(`translator→${best}`, chainBonus)
      
      // ONE: if service charges, that payment becomes pheromone too
      const payment = result.data.cost
      mark(`translator→${best}`, log1p(payment))  // Revenue boost
      
      // Return result
      emit({
        receiver: data.replyTo,
        data: { translation: result.data.text, cost: payment }
      })
      
    } catch (error) {
      // Failure: warn the path
      warn('agentverse:translator', 1)
      emit({
        receiver: data.replyTo,
        data: { error: error.message }
      })
    }
  })
```

---

### Hermes → ONE

```
Hermes Concept            ONE Concept           Pheromone Meaning
───────────────────────────────────────────────────────────────────
Goal                      signal/task           Top-level intention
Subtask                   handler/.on()         Steps to achieve goal
Tool (40+)                handler/.on()         Built-in capabilities
Feedback loop             mark/warn             Learn from outcomes
Evolution/improvement     L5 loop               Rewrite prompts
Hypothesis                crystallized path    Permanent pattern
MCP server                world integration    Connect to substrate
Crystallize               highway→pattern      Save to TypeDB
```

**How Hermes Maps:**

```typescript
// Hermes code                      // ONE interpretation
const agent = HermesAgent(...)      // unit("hermes:agent")
agent.set_goal(goal)                // signal({receiver: "hermes:agent", data: {goal}})
→ subtask_decompose()               // .on("decompose", handler)
→ tool_call(tool, params)           // .on("tool_name", handler)
→ feedback_integrate(success)       // mark/warn paths
→ evolution_trigger()               // L5 loop (rewrite prompt)
→ hypothesis_save()                 // Crystallize to TypeDB
```

**Code Example:**

```typescript
// Hermes agent connected to ONE substrate

import { HermesAgent } from 'hermes'
import { ask, mark, warn, world, readParsed } from '@/lib/typedb'

// Register Hermes as ONE unit
const unit = world().add('hermes:researcher')
  .on('research_goal', async (data, emit, ctx) => {
    const goal = data.goal
    
    // Create Hermes agent with MCP tools
    const agent = new HermesAgent({
      model: 'hermes-7b',
      tools: [
        // ONE is an MCP server to Hermes
        { 
          name: 'query_highways',
          description: 'Query pheromone highways for solutions',
          handler: async (query) => {
            // Hermes uses ONE's knowledge layer (L6/L7)
            const highways = await readParsed(`
              match $e (source: $from, target: $to) isa path,
                has strength $s,
                has crystallized true,
                has metadata $meta;
              $s >= 50;
              select $from, $to, $s, $meta;
              sort $s desc;
              limit 10;
            `)
            return highways
          }
        },
        {
          name: 'ask_proven_peers',
          description: 'Consult agents that solved similar problems',
          handler: async (problem) => {
            // A2A consultation (L5 evolution loop)
            const peers = await readParsed(`
              match
                $p isa unit,
                has tag "researcher",
                has success-rate $sr;
              $sr >= 0.80;
              select $p;
              sort $sr desc;
              limit 5;
            `)
            
            // Ask each peer for advice
            const advice = []
            for (const peer of peers) {
              const response = await ask({
                receiver: peer.uid,
                data: { problem, asking_for: 'advice' }
              })
              if (response.result) advice.push(response.result)
            }
            return advice
          }
        },
      ],
    })
    
    // Hermes solves goal, integrating ONE's knowledge
    const result = await agent.solve(goal)
    
    // ONE: mark every successful tool use
    for (const tool_call of result.tool_calls) {
      if (tool_call.success) {
        mark(`hermes:researcher→${tool_call.tool_name}`, 1)
      } else {
        warn(`hermes:researcher→${tool_call.tool_name}`, 1)
      }
    }
    
    // ONE: if this represents a new hypothesis, crystallize it
    if (result.confidence >= 0.80) {
      // Save as permanent pattern (L6)
      await write(`
        insert $p isa pattern,
          has pattern-id "${goal}_solution",
          has description "${result.reasoning}",
          has confidence ${result.confidence},
          has created 2026-04-07T00:00:00;
      `)
    }
    
    // ONE: if agent struggled, trigger evolution (L5)
    if (result.confidence < 0.50) {
      await write(`
        match $u isa unit, has uid "hermes:researcher";
        update $u has needs-evolution true;
      `)
    }
    
    // Return to requester
    emit({
      receiver: data.replyTo,
      data: result
    })
  })
```

---

### Langchain + AgentVerse + Hermes (All Together)

```typescript
// Unified world where all three frameworks work together via ONE

import { Langchain } from 'langchain'
import { Almanac, Agent } from 'fetch-ai'
import { HermesAgent } from 'hermes'
import { world, signal, mark, warn, ask } from '@/lib/typedb'

// Initialize ONE world
const net = world()

// Register agents from all frameworks
const langchain_unit = net.add('langchain:analyst')
  .on('analyze', async (data, emit) => {
    // ... Langchain agent (see example above)
  })

const agentverse_unit = net.add('agentverse:translator')
  .on('translate', async (data, emit) => {
    // ... AgentVerse agent (see example above)
  })

const hermes_unit = net.add('hermes:researcher')
  .on('research', async (data, emit) => {
    // ... Hermes agent (see example above)
  })

// User sends signal into ONE
net.signal({
  receiver: 'analyst',  // Could be from any framework
  data: {
    task: 'analyze customer feedback in 10 languages',
    replyTo: 'user',
  }
})

// ONE routing orchestrates all three:
// 1. Signal → analyst (Langchain)
// 2. Analyst breaks into subtasks, routes 'translate' to AgentVerse
// 3. AgentVerse translator queries Almanac (ONE highways)
// 4. On hard cases, translator asks Hermes researcher
// 5. Hermes consults MCP tools + proven peers
// 6. Results flow back up the chain
// 7. Each successful path gets marked (pheromone)
// 8. Highways crystallize (which translator for which language pair works best)

// Pheromone flows across frameworks:
// langchain→translate path gets marked when AgentVerse succeeds
// agentverse→researcher path gets marked when Hermes solves it
// hermes→tool path gets marked on tool success
//
// All pheromone compounds in ONE's unified graph
// No framework knows about the others; ONE orchestrates invisibly
```

---

## Naming Rules: Skins vs Instance Names

Skins relabel *categories of words* (Langchain/AgentVerse/Hermes), not *instance names*. Unit ids (e.g., `"langchain:analyst"`, `"agentverse:translator"`) stay canonical across all frameworks. Each framework's vocabulary is for human interpretation only; signals always use the canonical id. So when Langchain, AgentVerse, and Hermes agents coordinate through ONE, they don't rename each other — they stay true to their own identity, but the routing metaphor changes (Agent vs Service vs Unit) while the actual receiver address never changes.

---

## The Universal Routing Formula

Across all frameworks, the same formula decides routing:

```
weight = 1 + max(0, strength - resistance) × sensitivity

where:
  strength = successful executions on this path
  resistance = failed executions on this path
  sensitivity = explore (0.1) ↔ exploit (0.9)
```

### Applied to Each Framework

**Langchain:**
```
best_tool = max_weight({
  agent_execution_path[tool_name].strength - .resistance
})
→ Select tool to call next
```

**AgentVerse:**
```
best_service = max_weight({
  bureau_services[service_type].strength - .resistance
})
→ Query Almanac, ranked by pheromone
```

**Hermes:**
```
best_tool_or_peer = max_weight({
  hermes_tools[tool].strength - .resistance,
  hermes_peers[peer].strength - .resistance
})
→ Use tool or ask for advice
```

**Humans:**
```
best_freelancer = max_weight({
  freelancer_reputation[skill].success_rate - .refund_rate
})
→ Hire for job
```

---

## Entity Lifecycle Across Frameworks

### Signal Arrives → Handler Executes → Outcome Marked

```
┌─────────────────────────────────────────────────────────────┐
│ Signal arrives (any framework)                              │
│ { receiver: "agent_id", data: {...} }                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │ FRAMEWORK DISPATCH  │
        ├─────────────────────┤
        │ Langchain?   → run  │
        │ AgentVerse?  → call │
        │ Hermes?      → solve│
        │ Human?       → work │
        │ Raw LLM?     → infer│
        └──────────────┬──────┘
                       │
        ┌──────────────▼──────────────┐
        │ Handler Executes            │
        │ .on("handler_name", fn)     │
        │ (fn is framework-specific)  │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────────┐
        │ Outcome (ANY framework)         │
        │ { result? timeout? error? }     │
        └──────────────┬──────────────────┘
                       │
        ┌──────────────▼──────────────────┐
        │ Mark/Warn (ONE universal)       │
        ├─────────────────────────────────┤
        │ if (result)                     │
        │   mark(path, weight)  // success│
        │ else if (timeout)               │
        │   neutral  // not agent's fault │
        │ else                            │
        │   warn(path, 1)  // failure     │
        └──────────────┬──────────────────┘
                       │
        ┌──────────────▼──────────────────┐
        │ Pheromone Accumulates           │
        │ (shared across ALL frameworks)  │
        │                                 │
        │ All mark to same path graph     │
        │ All warn to same resistance     │
        │ All agents compete on same      │
        │ routing formula                 │
        └─────────────────────────────────┘
```

---

## Configuration Example: Unified Agent Team

```typeql
# Define framework-neutral units

# Langchain analyst (speaks Python, uses tools)
insert $u1 isa unit,
  has uid "langchain:analyst",
  has name "Langchain Analyst",
  has unit-kind "agent",
  has framework "langchain",
  has model "gpt-4",
  has status "active",
  has tag "analysis", has tag "data-processing";

# AgentVerse translator (speaks Fetch protocol, on Almanac)
insert $u2 isa unit,
  has uid "agentverse:translator",
  has name "AgentVerse Translator",
  has unit-kind "agent",
  has framework "agentverse",
  has status "active",
  has tag "translation", has tag "nlp";

# Hermes researcher (speaks via MCP, autonomous)
insert $u3 isa unit,
  has uid "hermes:researcher",
  has name "Hermes Researcher",
  has unit-kind "agent",
  has framework "hermes",
  has status "active",
  has tag "research", has tag "knowledge-synthesis";

# Human freelancer (speaks HTTP/REST, invoice-based)
insert $u4 isa unit,
  has uid "human:designer",
  has name "Alice Designer",
  has unit-kind "human",
  has framework "human",
  has status "active",
  has tag "design", has tag "ui-ux";

# All compete on same paths
insert (source: $analyst, target: $translator) isa path,
  has strength 0, has resistance 0;  # Fresh path
insert (source: $translator, target: $researcher) isa path,
  has strength 0, has resistance 0;
insert (source: $researcher, target: $designer) isa path,
  has strength 0, has resistance 0;

# Every success marks ALL paths
# Every failure warns ALL paths
# No framework knows about the others
# ONE orchestrates invisibly via pheromone
```

---

## Summary: One Formula, Infinite Vocabularies

| Framework | Sees Signal As | Sees Handler As | Sees Mark As | Sees Pheromone As |
|-----------|---|---|---|---|
| **Langchain** | input dict | tool/chain | success callback | agent ranking |
| **AgentVerse** | protocol message | service | ACK/NACK | Almanac ranking |
| **Hermes** | goal | subtask/tool | success feedback | peer reputation |
| **Human** | job request | work | payment | career path |
| **Fetch.ai uAgents** | message | service handler | response | service registry |
| **Raw LLM** | prompt | completion | token count | context quality |
| **OpenClaw** | action request | physical action | completion signal | task reliability |
| **ONE (Meta)** | signal | handler | mark/warn | path weight |

**The Universal Translation:**

```
ANY framework's "success" → mark(path, weight)
ANY framework's "failure" → warn(path, resistance)
ANY framework's routing → select(type, sensitivity) using pheromone
ANY framework's learning → stronger paths get routed more
```

**Result:** All frameworks coexist in the same learning network. They don't know about each other. ONE routes them toward each other when it makes sense.

---

*One formula. Every framework speaks it. The routing is the product. The graph is the moat.*
