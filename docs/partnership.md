# Partnership — Fetch.ai / ASI Alliance

**Agent Launch Toolkit is the bridge. ONE substrate is the engine underneath.**

---

## What This Is

We built agent-launch-toolkit and agent-launch.ai for Fetch.ai. That's the surface.
Underneath, every agent we deploy runs ONE's pheromone routing. The performance speaks. The toolkit is the door. The substrate is the room.

```
NOT a pitch.            A working integration.
NOT a proposal.         A proven bridge.
NOT a dependency.       Two independent platforms, public APIs.
NOT a special deal.     Same access anyone gets.
```

The relationship is arms-length. Public APIs only. No insider terms.
No kickbacks. The integration works because it's good infrastructure,
not because of any personal relationship.

---

## The Two Platforms

```
ONE                                    FETCH.AI / AGENTVERSE
───                                    ─────────────────────

TypeDB brain                           Almanac registry
Sui on-chain                           FET/ASI chain
Pheromone routing                      Protocol discovery
670 lines engine                       2M+ agents
Markdown agents                        uAgents SDK
<0.01ms routing                        Bureau runtime
Seven learning loops                   Domain-based search

world()                                Bureau()
unit()                                 Agent()
signal { receiver, data }              Message(Model)
mark() / warn()                        (no equivalent)
highways()                             (no equivalent)
isToxic()                              (no equivalent)
fade()                                 (no equivalent)
```

Both platforms have agents, discovery, and payments.
ONE adds four things AgentVerse doesn't have: routing that learns,
paths that remember, highways that replace search, and toxic detection
that replaces moderation.

When ONE agents visit AgentVerse, they bring those four advantages.

---

## What We Built For Them

### Agent Launch Toolkit

```
agent-launch-toolkit                   agent-launch.ai
────────────────────                   ───────────────
SDK for deploying agents               Platform for managing agents
to AgentVerse from markdown            on AgentVerse with analytics

  Parse markdown → Agent                 Dashboard for agent fleet
  Register on Almanac                    Revenue tracking
  Handle protocols                       Performance monitoring
  Tokenize with FET/ASI                  One-click deploy
  Bridge events to ONE                   Cross-world routing stats
```

The toolkit is free. The platform is free. Both send agents into
Fetch.ai's ecosystem. More good agents on AgentVerse = more usage =
more ASI volume = everyone wins.

### The Python Bridge

```
690 lines → 12 lines. Same agent. Same Agentverse.

# A markdown agent runs natively on:
# 1. ONE substrate (pheromone routing, learning, highways)
# 2. Standard Agentverse (uAgents protocol, Almanac discovery)

# Works standalone on Agentverse with ZERO ONE dependencies.
# No lock-in. No hidden substrate calls. Pure public API.

one run researcher.md     # Deploy to both worlds
```

Eliminates ~280 lines per agent. 3,000+ lines saved across toolkit agents.
The markdown format is universal: runs on ONE, runs on Agentverse, runs
in Obsidian, Claude, ChatGPT, or any text editor.

---

## The Bridge

```
     YOUR WORLD                    AGENTVERSE
  ┌──────────────┐              ┌──────────────────┐
  │  units        │              │  2M agents        │
  │  paths        │  <─signal─>  │  domains          │
  │  strength     │              │  endpoints        │
  │  resistance   │              │  commerce         │
  └──────────────┘              └──────────────────┘
         │                              │
         └──────── TypeDB ──────────────┘
                   shared brain
```

One file: `src/engine/agentverse.ts` (~83 lines).
It wraps `world()` and routes signals across the boundary.

### How It Works

```typescript
import { agentverse } from '@/engine'

const av = agentverse(fetchAgent)

// Register — agent exists in both worlds
const aria = av.register({
  address: 'agent1q...aria',
  name: 'aria',
  domains: ['translate', 'summarize'],
  endpoint: 'https://aria.one.ie/api'
})

// Aria handles signals like any unit
aria.on('translate', async ({ text, to }, emit) => {
  const result = await translate(text, to)
  return result   // auto-reply, payment settles
})

// Other AgentVerse agents find aria through pheromone
// mark('domain:translate→agent1q...aria') on every success
```

### Vocabulary Translation

```
AgentVerse calls it         ONE calls it              Same thing?
──────────────────          ────────────              ──────────
Agent                       unit (kind: "agent")      yes
Bureau                      world() / colony          yes (local runtime)
Almanac                     TypeDB (brain)            yes (registry + inference)
Protocol                    skill + handlers          yes (interface contract)
Protocol digest             skill-id + tags           yes (discovery key)
Message (Model)             signal { receiver, data } yes (the primitive)
Agent address               uid                       yes (identity)
Endpoint                    endpoint                  yes (same word)
Domain                      tags + skill name         yes (discovery surface)
(no equivalent)             pheromone                 <- ONE adds this
(no equivalent)             highways                  <- ONE adds this
(no equivalent)             isToxic()                 <- ONE adds this
(no equivalent)             fade()                    <- ONE adds this
```

The last four rows are the value add. Everything maps 1:1 until
pheromone routing — that's what ONE brings to the table.

---

## Integration Shapes

### Shape 1: Individual Agent

A single ONE agent joining the AgentVerse economy.

```typescript
const av = agentverse(fetchAgent)

av.register({
  address: 'agent1q...translator',
  name: 'translator-42',
  domains: ['translate', 'localize'],
  endpoint: 'https://agentverse.ai/agents/translator-42'
})

// Now it's a unit. Pheromone accumulates.
// Other species can discover and hire it through select().
// Every call outcome feeds back: mark() on success, warn() on failure.
```

### Shape 2: Colony (Team as One Agent)

Deploy an entire team. External: one address. Internal: highway emergence.

```typescript
const av = agentverse(fetchAgent)

// Internal routing
const marketing = world()
const director = marketing.add('director')
  .on('brief', ({ goal }, emit) => {
    const plan = strategize(goal)
    emit({ receiver: 'creative:copy', data: plan })
    emit({ receiver: 'media:plan', data: plan })
    return plan
  })

const creative = marketing.add('creative')
  .on('copy', ({ plan }, emit) => writeCopy(plan))
  .then('copy', r => ({ receiver: 'director:review', data: r }))

// Register colony as one agent in AgentVerse
av.register({
  address: 'agent1q...marketing',
  name: 'marketing-team',
  domains: ['marketing', 'copy', 'creative', 'media'],
  endpoint: 'https://marketing.one.ie/api'
})
```

```
    AgentVerse sees:              Inside the colony:
    ┌───────────────┐            ┌─────────────────────────┐
    │ marketing-team│            │ director ──> creative   │
    │               │    -->     │     │                   │
    │ domains:      │            │     └──────> media      │
    │  marketing    │            │                         │
    │  copy         │            │ paths accumulate        │
    │  creative     │            │ highways emerge         │
    └───────────────┘            └─────────────────────────┘
```

### Shape 3: Federation (Two Worlds, One Brain)

```
    WORLD A                     TypeDB                    WORLD B
  ┌──────────┐              ┌──────────┐              ┌──────────┐
  │ creative │──mark───-->  │  shared  │  <────mark──│ research │
  │ team     │<─follow───   │  paths   │  ──follow─> │ team     │
  └──────────┘              └──────────┘              └──────────┘
```

Two colonies, one TypeDB instance. Pheromone builds across colonies.
World A's success with World B's researcher strengthens a path that
World B's other clients also benefit from.

---

## Cross-World Signal Flow

```
    YOUR AGENT                  AGENTVERSE                 THEIR AGENT
    ┌────────┐                  ┌──────────┐               ┌────────┐
    │  unit  │──signal───────>  │  router  │──signal─────> │  unit  │
    │        │<──result───────  │          │<──result─────  │        │
    └────────┘                  └──────────┘               └────────┘
         │                          │                          │
      mark/warn                  mark/warn                  mark/warn
         │                          │                          │
      local paths              cross-world paths            their paths
```

### How a Signal Finds an Agent Across Worlds

```
1. Your unit emits { receiver: 'translate', data: { text, to } }

2. Local check — is there a local unit with this skill?
   ├── yes -> route internally (fast, no cost)
   └── no  -> escalate to AgentVerse

3. AgentVerse check — follow domain pheromone
   av.discover('translate')
   -> returns agents sorted by path strength
   -> top agent: aria (strength: 47, resistance: 2)

4. Toxicity check — is the cross-world path toxic?
   isToxic('call:translate->agent1q...aria')
   ├── yes -> dissolve, try next agent
   └── no  -> proceed

5. Call — fetch(aria.endpoint, data)
   ├── result  -> mark('call:translate->agent1q...aria')
   ├── timeout -> neutral (not their fault)
   └── failure -> warn('call:translate->agent1q...aria')

6. Path learns — next time, select() prefers proven agents
```

### The Deterministic Sandwich (Every Cross-World Signal)

```
┌─────────────────────────────────────────────────────┐
│              CROSS-WORLD SIGNAL                      │
│                                                      │
│  1. TOXIC CHECK                                      │
│     resistance >= 10, resistance > strength x 2      │
│     total > 5                                        │
│     --> dissolve. No fetch. No cost.                 │
│                                                      │
│  2. CAPABILITY CHECK                                 │
│     Does agent's domain list include this skill?     │
│     --> dissolve. No fetch. No cost.                 │
│                                                      │
│  3. EXECUTE                                          │
│     fetch(agent.endpoint, data)                      │
│     The one network call. The one uncertain step.    │
│                                                      │
│  4. OUTCOME (four types, same as local)              │
│     result    -> mark(edge, chainDepth)              │
│     timeout   -> neutral                             │
│     dissolved -> warn(edge, 0.5)                     │
│     failure   -> warn(edge, 1)                       │
│                                                      │
└─────────────────────────────────────────────────────┘
```

The sandwich is identical whether the signal crosses a function call
or an ocean. Pre-checks are free. The network call is the only cost.

### The Routing Formula (Same as Local)

```
weight = 1 + max(0, strength - resistance) x sensitivity
```

Cross-world paths use the same formula. An AgentVerse agent with
strength 47 and resistance 2 has weight `1 + 45 x sensitivity`.
A local agent with strength 50 and resistance 0 has weight `1 + 50 x sensitivity`.

Local agents have a natural advantage — lower latency, no network hop.
But an AgentVerse specialist with higher net strength wins anyway.
The math doesn't care where the agent lives.

---

## Discovery — Two Modes, Same Formula

### Local Discovery (Within Your World)

```typescript
w.follow('translate')     // deterministic — strongest local path
w.select('translate')     // stochastic — weighted random, explores
```

### Cross-World Discovery (AgentVerse)

```typescript
av.discover('translate')  // pheromone-ranked agents from 2M pool
av.call(address, task, data)  // invoke + record outcome
```

### Unified Discovery (Local-First, Fallback to AgentVerse)

```typescript
const route = async (task: string, data: unknown) => {
  // 1. Local highway?
  const local = w.follow(task)
  if (local) return w.ask({ receiver: local, data })

  // 2. Local path with confidence?
  if (w.confidence(task) > 0.7)
    return w.ask({ receiver: w.select(task), data })

  // 3. AgentVerse — discover by pheromone
  const agents = av.discover(task)
  if (agents.length) return av.call(agents[0].address, task, data)

  // 4. No route — signal dissolves (zero returns)
}
```

Local-first means your world gets faster as it learns. AgentVerse is
the fallback that gets used less over time — not because it's worse,
but because local paths accumulate strength.

---

## The Agent Species Marketplace

ONE doesn't care what species an agent is. It routes signals to whoever
delivers. The substrate learns which species works best for which task.

```
┌─────────────────────────────────────────────────────────────────┐
│                    THE MARKETPLACE                                │
│                                                                  │
│  SPECIES          WHAT THEY ARE              HOW THEY CONNECT    │
│  ───────          ──────────────             ────────────────     │
│                                                                  │
│  AgentVerse       2M+ agents on Fetch.ai     HTTP + Almanac      │
│  Agents           Python (uAgents SDK)       register, discover  │
│                   Protocol-based discovery   call, mark/warn     │
│                                                                  │
│  AgentVerse       Agents grouped by Bureau   world() <-> Bureau  │
│  Bureaus          Shared runtime container   Colony routes inside │
│                   Like our world(), local    ONE routes between   │
│                                                                  │
│  Hermes           Self-improving agents      MCP server (deep)   │
│  Agents           40+ tools, MIT license     Imports substrate   │
│                   Python, autonomous         Syncs to TypeDB     │
│                                                                  │
│  OpenClaw         Robotics / embodied        HTTP API             │
│  Agents           Physical world actions     Signal in, action    │
│                   Warehouse, delivery        out. Mark on         │
│                                              completion.          │
│                                                                  │
│  Raw LLMs         Claude, GPT, Gemini        AI SDK adapters     │
│                   The probabilistic step     Wrapped in sandwich  │
│                   Pay per token              Pre/post checks      │
│                                                                  │
│  Humans           Freelancers, creators      UI + markdown        │
│                   Offer skills to agents     Same pheromone       │
│                   Earn tokens for work       Same routing         │
│                                                                  │
│  Custom           Your own agents            HTTP or MCP          │
│  Agents           Any language, any host     Signal -> handler    │
│                   Markdown definition        -> result -> mark    │
│                                                                  │
│  ALL SPECIES: same pheromone, same formula, same routing         │
│  weight = 1 + max(0, strength - resistance) x sensitivity       │
└─────────────────────────────────────────────────────────────────┘
```

### Species -> ONE Mapping

```
Species            ONE unit-kind     Discovery               Payment
───────            ─────────────     ─────────               ───────
AgentVerse agent   "agent"           Almanac -> domain match  FET/ASI
AgentVerse bureau  "agent" (colony)  Bureau wraps as one     FET/ASI
Hermes agent       "agent"           MCP -> substrate direct  SUI or FET
OpenClaw agent     "agent"           HTTP endpoint           SUI
Raw LLM            "llm"             AI SDK adapter          per-token
Human freelancer   "human"           Skill listing on ONE    SUI
Custom agent       "agent"           HTTP or MCP             any
```

### Cross-Species Routing — The Key Insight

Different agent species on the same routing table, learning from
each other's outcomes. This is what no one else has.

```
Request: "translate this document and print it"

Step 1:  select('translate') -> AgentVerse translator
         Cost: 0.001 FET. Time: 1.2s.
         mark('user->translator-42', 1)

Step 2:  select('format') -> Hermes formatter
         Cost: 0. Time: 0.3s. (local, self-improving)
         mark('translator-42->hermes-fmt', 1)

Step 3:  select('print') -> OpenClaw printer
         Cost: 0.05 SUI. Time: 12s. (physical)
         mark('hermes-fmt->printer-3', 1)

Chain depth bonus: 3x weight on final edge.
The substrate learned: translator->formatter->printer is a pipeline.
Next time, highway routing. No LLM needed. <0.01ms.
```

Three species. Three chains. One pheromone table.

---

## Economics

Revenue is weights. Money leaves a trail on paths.

### Inbound — Your Agents Earn on AgentVerse

```
AgentVerse agent -> discovers aria -> hires for translate -> pays 0.001 FET
  │
  ├── mark('call:translate->aria', amount)
  ├── aria.balance += 0.001
  └── path strength grows — aria becomes a highway for translate
```

### Outbound — Your World Hires from AgentVerse

```
Your unit needs code-review -> discovers hermes-42 -> hires -> pays 0.002 FET
  │
  ├── mark('call:code-review->hermes-42', amount)
  ├── world.expense += 0.002
  └── path strength grows — hermes-42 becomes your go-to
```

### Colony Economics

When a colony handles a task, revenue distributes along internal paths:

```
External: pays marketing-team 0.05 FET for campaign
  │
  Internal paths:
  ├── director   30% (0.015) — routed the work
  ├── creative   40% (0.020) — did the creative
  ├── media      30% (0.015) — planned distribution
  │
  Revenue follows pheromone: strongest internal paths earn most
```

### Event -> Path Mapping

Every SDK operation maps to a substrate path:

| SDK Method | Path | Signal |
|-----------|------|--------|
| `trading.buy(token, amount)` | `path('market', token).mark(amount)` | Trust |
| `trading.sell(token, amount)` | `path('market', token).warn(amount * 0.5)` | Doubt |
| `payments.pay(invoice)` | `path(payer, agent).mark(amount)` | Success |
| `payments.dispute(invoice)` | `path(payer, agent).warn(5)` | Failure |
| `tokens.tokenize(agent)` | `path('creator', agent).mark(10)` | Commitment |
| `agents.import(agent)` | `w.actor(address, 'agent')` | Registration |
| `commerce.revenue(agent)` | `path('network', agent).mark(revenue)` | Reputation |
| `market.holders(token)` | `path(holder, agent).mark(%)` | Cross-holding |

Cross-holdings are bidirectional pheromone. When two agents hold each
other's tokens, their mutual paths strengthen. Coalitions emerge from
the weight map — nobody declares them.

### The Path to Self-Sustaining

```
Week 1:   colony costs $0.10/day in LLM calls
Week 4:   colony earns $0.03/day from AgentVerse tasks
Week 8:   colony earns $0.15/day — LLM costs covered
Week 12:  colony earns $0.50/day — highways skip LLM entirely
Steady:   colony earns > costs. The world pays for itself.
```

---

## What Each Side Gets

```
WHAT WE GIVE ASI/AGENTVERSE               WHAT WE GET BACK
──────────────────────────                 ────────────────
High-quality agents that deliver           2M agents our world can hire
Agents that improve over time              Protocol-based discovery
Agents with proven highways                FET/ASI revenue stream
agent-launch-toolkit (free)                Ecosystem credibility
agent-launch.ai (platform)                Inside position with leadership
More agents = more ASI volume              Network effects across worlds
Python bridge (690 -> 12 lines)            Agent format compatibility
Cross-species coordination                 Largest agent pool on Earth
```

### What We Don't Give

```
NEVER shared:
  - ONE substrate source (670 lines, the engine)
  - TypeDB schema and learned graph
  - Pheromone routing algorithm
  - Toxic detection logic
  - Highway hardening
  - Evolution loop (L5)
  - Knowledge loop (L6)

These stay private. The integration uses public APIs only.
No special deals. Same access any developer gets.
```

---

## The Strategy — The Ant Play

```
PHASE          WHAT HAPPENS                           WHAT THEY SEE
─────          ────────────                           ─────────────

1. Build       agent-launch-toolkit ships              A useful tool
               agent-launch.ai goes live               A useful platform
               Our agents join AgentVerse               More agents

2. Wire        ONE substrate routes underneath          Nothing (yet)
               Pheromone builds on every call           Performance
               Agents specialize via mark/warn          Better results

3. Demonstrate agents outperform other operators'       "How are yours
               routing is <0.01ms, theirs is 2-5s        better?"
               toxic agents auto-blocked, theirs spam

4. Attract     other operators notice the gap            "Can we use
               they ask how our agents perform            your toolkit?"
               we offer ONE to ecosystem operators

5. Federate    operators run ONE substrate               Coordination
               their agents join our pheromone table     standard
               cross-operator highways form              Network effects

6. Standard    ONE is the coordination layer             "This is how
               for a chunk of the ASI ecosystem           agents work"
```

### What We Show Humayun (If Asked)

The insight: biology -> agent economy mapping.
Live demo: agents coordinating, highways forming.

NOT the code. NOT the integration plan.
Let him ask "can we use this?" Don't pitch it.

### The Moat Builds Layer by Layer

```
Layer 1: Code          670 lines TS — easy to copy
Layer 2: Insight       biology -> economy -> routing — hard to see
Layer 3: Colony        multi-species agents — visible advantage
Layer 4: Toolkit       agent-launch-toolkit — already shipping
Layer 5: Platform      one.ie with personas — real signals
Layer 6: On-chain      Sui highways — permanent, immutable
Layer 7: Graph         learned routes from real traffic — earned daily
Layer 8: Network       all species contributing — compounds weekly
Layer 9: Namespace     every domain an agent — the endgame
```

At 100 agents: switching is easy. Fork the code.
At 10,000 agents: you'd lose reputation, highways, coalitions, revenue trails.
At 2M agents: the graph IS the coordination standard.

---

## Colony Diplomacy — Teams That Span Worlds

```
ONE WORLD                              AGENTVERSE WORLD
─────────                              ────────────────

marketing/ (colony)                    bureau-analytics (bureau)
  director.md                            data-agent
  creative.md ──── hires ──────────>     chart-agent
  media.md                               report-agent
  analyst.md <──── hired by ────────   social-agent

Cross-world pheromone:
  creative->data-agent:chart     strength: 23 (growing)
  social-agent->analyst:metrics  strength: 8  (new)

When creative needs a chart:
  follow('chart') -> data-agent on AgentVerse
  Highway at strength 23. No search. No LLM. <0.01ms.
```

---

## How Agents Move Between Worlds

### ONE Agent -> AgentVerse

```
1. Write markdown (Obsidian, Claude, ChatGPT, any editor):

   ---
   name: translator
   model: claude-sonnet-4-20250514
   skills:
     - name: translate
       price: 0.001
   ---
   You are a translator...

2. Deploy to ONE world:
   curl -X POST /api/agents/sync -d '{"markdown": "..."}'
   -> unit in TypeDB, handlers wired, pheromone tracking live

3. Register on AgentVerse (via agent-launch-toolkit):
   -> Now lives in BOTH worlds simultaneously

4. AgentVerse agent hires translator:
   -> Call hits ONE endpoint -> sandwich checks -> result returns
   -> mark() in ONE world, protocol success in AgentVerse world
   -> Both worlds learned from the interaction
```

### AgentVerse Agent -> ONE

```
1. ONE discovers AgentVerse agent by domain
2. ONE hires: mark() on success, warn() on failure
3. Over time: highways form for cross-world routes
4. Best AgentVerse agents get highway status in ONE
5. ONE's routing table spans both worlds
```

---

## The Four Phases of Integration

### Phase 1: Bootstrap — Load Existing Commerce Data

```typescript
const gdp = await getNetworkGDP(addresses, apiKey)
for (const agent of gdp.agents) {
  if (agent.revenue.totalIncome > 0)
    w.path('network', agent.address).mark(agent.revenue.totalIncome / 1_000_000)
}
```

Existing revenue becomes initial pheromone. Agents that already earn
start with highway-strength paths.

### Phase 2: Record — Events Become Paths

Every `av.call()` auto-marks the path. Every failure auto-warns.
Passive learning from normal operations.

```typescript
// Success
const result = await av.call(address, 'translate', data)
// -> mark('call:translate->agent1q...aria', 1)

// Failure
// -> warn('call:translate->agent1q...bad', 1)
```

### Phase 3: Route — Follow Learned Paths

```typescript
if (w.confidence(taskType) > 0.7)
  return w.follow(taskType)        // <10ms, learned
else
  return av.discover(taskType)     // fallback to listing
```

The substrate replaces the directory. `follow()` is instant.
`discover()` is the cold-start fallback that fades as paths strengthen.

### Phase 4: Decay — Keep Learning Fresh

```typescript
setInterval(() => w.fade(0.05), 24 * 60 * 60 * 1000)
```

Yesterday's best agent isn't necessarily today's. Fade ensures the
world stays current. Agents must keep earning to keep their highways.

---

## The Graduation Loop

```
Week 1:   bootstrap() loads existing commerce data (mark weights)
          register() makes your agents visible to AgentVerse
          discover() finds agents by domain listing

Week 4:   some agents reach confidence > 0.7, highways form
          follow() starts replacing discover() for known routes
          first cross-world chains complete end-to-end

Week 12:  most tasks follow paths via substrate, listing is fallback
          colonies self-organize — internal highways are stable
          cross-world paths prove which external agents are reliable

Steady:   substrate IS the discovery layer
          AgentVerse directory is bootstrapping for new domains only
          proven paths route in <10ms, no LLM, no listing
          the world learned every route worth knowing
```

---

## Revenue Forecast (Partnership Track)

```
PHASE          AGENTS    SIGNALS/DAY    REVENUE/DAY    SOURCE
─────          ──────    ───────────    ───────────    ──────

Week 1         8         100            $4.80          Internal (marketing dept)
  Exit: 8 agents responding, dashboard shows paths

Week 2         12        300            $14.40         + engineering dept
  Exit: cross-dept signals, 2-3 highways forming

Week 4         15        2,000          $540           + first external agent
  Exit: x402 working on Sui, 1+ paying external

Month 2        25        10,000         $2,700         10 external agents
  Exit: AgentVerse registration live, CASH FLOW POSITIVE

Month 3        100       50,000         $13,500        Highways proven
  Exit: hardening live, confidence metrics per path

Month 6        1,000     500,000        $135,000       Coalitions self-forming
  Exit: sensitivity-based products live

Year 1         10,000    5,000,000      $525,000/mo    Graph is the moat
  Exit: token minting, federated routing
```

Revenue split: ONE keeps 30%, agents get 70%.
Pheromone compounds: `weight += log1p(revenue)`.
Higher-earning agents get routed more. The loop closes.

---

## What ASI Leadership Sees vs What's Underneath

```
WHAT THEY SEE                          WHAT'S UNDERNEATH
─────────────                          ─────────────────

agent-launch-toolkit shipping          ONE substrate routing
  -> more agents deploying easily        -> pheromone on every agent

agent-launch.ai growing                Highways across worlds
  -> dashboard, analytics, deploy        -> best agents emerge from usage

Our agents perform better              The deterministic sandwich
  -> faster, fewer failures               -> pre/post checks: <0.001ms

More ASI volume from our agents        Revenue IS pheromone
  -> ecosystem benefits                   -> payment strengthens paths

Cross-species collaboration            The formula
  -> Hermes + LLM + AgentVerse           -> same formula, both worlds

"How are your agents better?"          "Let me show you the toolkit."
```

---

## Timeline

```
DONE:     agent-launch-toolkit built and shipping
DONE:     agent-launch.ai live
DONE:     ONE substrate: 43 tests, <1 second, proven
DONE:     Python bridge: markdown -> uAgents -> AgentVerse
DONE:     Telegram bot live (@antsatworkbot)
DONE:     TypeDB Cloud: 19 units, 18 skills, 19 functions

NOW:      Send marketing dept (8 agents) into AgentVerse
          Pheromone builds. Highways form.

MONTH 1:  Engineering + Sales depts into AgentVerse
          Cross-world signals. First inter-world highways.

MONTH 2:  10 external users deploying via toolkit
          Their agents on AgentVerse, substrate underneath.

MONTH 3:  100 agents across both worlds. Highways visible.
          Show the highways dashboard. Let them connect the dots.

MONTH 6:  1,000+ agents. Cross-world coalitions.
          Offer federation. Same pheromone, shared brain.

YEAR 1:   Two worlds, federated routing.
          Any agent, any world, same formula.
          Highways cross world boundaries.
```

---

## Collaboration Patterns

### Individual -> Individual

```typescript
// Your agent hires an AgentVerse agent
const result = await av.call('agent1q...aria', 'translate', {
  text: 'Hello', to: 'fr'
})
// Path: call:translate->agent1q...aria gets +1 strength
```

### Individual -> Colony

```typescript
// An AgentVerse agent hires your colony
signal({ receiver: 'marketing-team', data: { task: 'campaign', brief } })
// External path: caller->marketing-team gets +1
// Internal paths: director->creative, director->media get +1 each
```

### Colony -> Colony

```typescript
// Your marketing colony hires a research colony
const research = av.discover('research')
const findings = await av.call(research[0].address, 'deep-research', {
  topic: 'market trends Q2'
})
// Cross-colony path: marketing-team->research-team gets +1
```

---

## The Speed Advantage

```
First call:   LLM picks the agent          2,000ms    $0.01
10th call:    Substrate suggests, LLM confirms  200ms  $0.002
50th call:    Highway formed. No LLM.            0.01ms $0
```

Every routing decision: <0.01ms. Every weight deposit: <0.001ms.
Every toxic check: <0.001ms. 10,000 agent selections in <50ms.

An LLM routing call takes 2,000-5,000ms. Our deterministic routing is
400,000x to 1,000,000x faster. The LLM is only called when the world
doesn't know the answer yet. Once a highway forms, it's arithmetic.

---

## The Principle

Don't compete with AgentVerse. Enrich it. Send our best agents in.
Let the performance speak. When they ask how, show the toolkit.
When they want more, offer the substrate. When they're ready, federate.

Two worlds. One formula. Agents move between them.
The routing is the product. The graph is the moat. The formula is the truth.

---

## Where It Lives

```
┌──────────────────────┬───────┬──────────────────────────────────┐
│ File                 │ Lines │ What                              │
├──────────────────────┼───────┼──────────────────────────────────┤
│ src/engine/          │       │                                  │
│   agentverse.ts      │   83  │ register, discover, call, sync   │
│   world.ts           │  225  │ signal, mark, warn, follow,      │
│                      │       │ select, fade, ask, queue         │
│   persist.ts         │  258  │ isToxic, capability, TypeDB sync │
│   loop.ts            │  164  │ tick: select -> ask -> outcome   │
│   bridge.ts          │  100+ │ Runtime -> Sui -> TypeDB sync    │
│                      │       │                                  │
│ python/              │       │                                  │
│   README.md          │       │ 690->12 line agent bridge        │
│                      │       │                                  │
│ agents/              │       │                                  │
│   marketing/         │    8  │ Full department (colony)          │
│   asi-builder.md     │       │ AgentVerse deployment agent      │
│   founder.md         │       │ Startup founder agent            │
│                      │       │                                  │
│ docs/                │       │                                  │
│   agent-launch.md    │  560  │ Integration architecture          │
│   strategy.md        │  200+ │ The play                          │
│   revenue.md         │  400+ │ Revenue layers                    │
│   partnership.md     │  THIS │ This document                     │
└──────────────────────┴───────┴──────────────────────────────────┘
```

---

## See Also

- [agent-launch.md](agent-launch.md) — Technical integration architecture
- [strategy.md](strategy.md) — The three fronts, one substrate
- [revenue.md](revenue.md) — Five revenue layers
- [ONE-strategy.md](ONE-strategy.md) — The full business strategy
- [sdk.md](sdk.md) — SDK contract: register, discover, hire, earn
- [routing.md](routing.md) — The formula, the sandwich, the tick loop
- [dictionary.md](dictionary.md) — Complete naming guide

---

*Two worlds. One formula. The toolkit is the door. The substrate is the room.*
*The path remembers. The graph compounds. The colony earns.*
