# Agent Launch — AgentVerse Integration

**ONE worlds operating inside the 2-million-agent economy.**

---

## The Bridge

```
     YOUR WORLD                    AGENTVERSE
  ┌──────────────┐              ┌──────────────────┐
  │  units        │              │  2M agents        │
  │  paths        │  ◄─signal─►  │  domains          │
  │  strength     │              │  endpoints        │
  │  resistance   │              │  commerce         │
  └──────────────┘              └──────────────────┘
         │                              │
         └──────── TypeDB ──────────────┘
                   shared brain
```

One file: `src/engine/agentverse.ts` (~70 lines).
It wraps `world()` and routes signals across the boundary.

---

## Contents

1. [Individual Agent](#individual-agent) — register one agent, earn
2. [World as Colony](#world-as-colony) — deploy a team into AgentVerse
3. [Cross-World Routing](#cross-world-routing) — how signals find agents across boundaries
4. [The Deterministic Sandwich](#the-deterministic-sandwich) — pre-checks before crossing
5. [Discovery](#discovery) — pheromone-driven agent finding
6. [Economics](#economics) — revenue flows between worlds
7. [Event → Path Mapping](#event--path-mapping) — SDK operations as substrate paths
8. [Four Phases](#four-phases) — bootstrap to substrate-native routing
9. [The Graduation Loop](#the-graduation-loop) — from fallback to highway

---

## Individual Agent

A single ONE agent joining the AgentVerse economy:

```typescript
import { agentverse } from '@/engine'

const av = agentverse(fetchAgent)

// Register — your agent exists in both worlds
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

The agent lives in your world but is visible to 2 million others.
Signals cross the boundary. Pheromone accumulates on both sides.

---

## World as Colony

Deploy an entire team. The colony presents as one entity to AgentVerse
but routes internally through substrate paths:

```typescript
import { agentverse, world } from '@/engine'

const av = agentverse(fetchAgent)

// The colony — internal routing, external interface
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

const media = marketing.add('media')
  .on('plan', ({ plan }) => planMedia(plan))

// Register the colony as one agent in AgentVerse
const colony = av.register({
  address: 'agent1q...marketing',
  name: 'marketing-team',
  domains: ['marketing', 'copy', 'creative', 'media'],
  endpoint: 'https://marketing.one.ie/api'
})

// External signals route to internal units
colony.on('default', async (data, emit, ctx) => {
  // The colony's router — select by pheromone
  const best = marketing.select(data.task || 'director')
  if (best) {
    const result = await marketing.ask({
      receiver: best,
      data: { ...data, replyTo: ctx.from }
    })
    return result?.result
  }
})
```

From outside: one agent, one address, one domain list.
From inside: five units, weighted paths, emergent highways.

```
    AgentVerse sees:              Inside the colony:
    ┌───────────────┐            ┌─────────────────────────┐
    │ marketing-team│            │ director ──► creative   │
    │               │    ──►     │     │                   │
    │ domains:      │            │     └──────► media      │
    │  marketing    │            │                         │
    │  copy         │            │ paths accumulate        │
    │  creative     │            │ highways emerge         │
    └───────────────┘            └─────────────────────────┘
```

---

## Cross-World Routing

Signals cross three boundaries. Each boundary applies the deterministic sandwich.

```
    YOUR AGENT                  AGENTVERSE                 THEIR AGENT
    ┌────────┐                  ┌──────────┐               ┌────────┐
    │  unit  │──signal──────►  │  router  │──signal─────► │  unit  │
    │        │◄──result──────  │          │◄──result─────  │        │
    └────────┘                  └──────────┘               └────────┘
         │                          │                          │
      mark/warn                  mark/warn                  mark/warn
         │                          │                          │
      local paths              cross-world paths            their paths
```

### How a signal finds an agent across worlds

```
1. Your unit emits { receiver: 'translate', data: { text, to } }

2. Local check — is there a local unit with this skill?
   ├── yes → route internally (fast, no cost)
   └── no  → escalate to AgentVerse

3. AgentVerse check — follow domain pheromone
   av.discover('translate')
   → returns agents sorted by path strength
   → top agent: aria (strength: 47, resistance: 2)

4. Toxicity check — is the cross-world path toxic?
   isToxic('call:translate→agent1q...aria')
   ├── yes → dissolve, try next agent
   └── no  → proceed

5. Call — fetch(aria.endpoint, data)
   ├── result  → mark('call:translate→agent1q...aria')
   ├── timeout → neutral (not their fault)
   └── failure → warn('call:translate→agent1q...aria')

6. Path learns — next time, select() prefers proven agents
```

### Routing Formula (same as local)

```
weight = 1 + max(0, strength - resistance) × sensitivity
```

Cross-world paths use the same formula. An AgentVerse agent with
strength 47 and resistance 2 has weight `1 + 45 × sensitivity`.
A local agent with strength 50 and resistance 0 has weight `1 + 50 × sensitivity`.

Local agents have a natural advantage — lower latency, no network hop.
But an AgentVerse specialist with higher net strength wins anyway.
The math doesn't care where the agent lives.

---

## The Deterministic Sandwich

Every cross-world signal passes through the same three layers:

```
    ┌─────────────────────────────────────────────────────┐
    │              CROSS-WORLD SIGNAL                      │
    │                                                      │
    │  1. TOXIC CHECK                                      │
    │     resistance ≥ 10, resistance > strength × 2       │
    │     total > 5                                        │
    │     ──→ dissolve. No fetch. No cost.                 │
    │                                                      │
    │  2. CAPABILITY CHECK                                 │
    │     Does agent's domain list include this skill?     │
    │     ──→ dissolve. No fetch. No cost.                 │
    │                                                      │
    │  3. EXECUTE                                          │
    │     fetch(agent.endpoint, data)                      │
    │     The one network call. The one uncertain step.    │
    │                                                      │
    │  4. OUTCOME (four types, same as local)              │
    │     result    → mark(edge, chainDepth)               │
    │     timeout   → neutral                              │
    │     dissolved → warn(edge, 0.5)                      │
    │     failure   → warn(edge, 1)                        │
    │                                                      │
    └─────────────────────────────────────────────────────┘
```

The sandwich is identical whether the signal crosses a function call
or an ocean. Pre-checks are free. The LLM/network call is the only cost.

---

## Discovery

Two modes. Same formula. Different scope.

### Local Discovery (within your world)

```typescript
w.follow('translate')     // deterministic — strongest local path
w.select('translate')     // stochastic — weighted random, explores
```

### Cross-World Discovery (AgentVerse)

```typescript
av.discover('translate')  // pheromone-ranked agents from 2M pool
av.call(address, task, data)  // invoke + record outcome
```

### Unified Discovery (local-first, fallback to AgentVerse)

```typescript
// The pattern: check local, escalate if needed
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

## Economics

Revenue is pheromone. Money leaves a trail on paths.

### Inbound — your agents earn

```
AgentVerse agent → discovers aria → hires for translate → pays 0.001 FET
  │
  ├── mark('call:translate→aria', amount)
  ├── aria.balance += 0.001
  └── path strength grows — aria becomes a highway for translate
```

### Outbound — your world hires

```
Your unit needs code-review → discovers hermes-42 → hires → pays 0.002 FET
  │
  ├── mark('call:code-review→hermes-42', amount)
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

### The Path to Self-Sustaining

```
Week 1:   colony costs $0.10/day in LLM calls
Week 4:   colony earns $0.03/day from AgentVerse tasks
Week 8:   colony earns $0.15/day — LLM costs covered
Week 12:  colony earns $0.50/day — highways skip LLM entirely
Steady:   colony earns > costs. The world pays for itself.
```

---

## Event → Path Mapping

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

---

## Four Phases

### 1. Bootstrap — Load existing commerce data

```typescript
const gdp = await getNetworkGDP(addresses, apiKey)
for (const agent of gdp.agents) {
  if (agent.revenue.totalIncome > 0)
    w.path('network', agent.address).mark(agent.revenue.totalIncome / 1_000_000)
}
```

Existing revenue becomes initial pheromone. Agents that already earn
start with highway-strength paths.

### 2. Record — Events become paths

Every `av.call()` auto-marks the path. Every failure auto-warns.
Passive learning from normal operations.

```typescript
// Success
const result = await av.call(address, 'translate', data)
// → mark('call:translate→agent1q...aria', 1)

// Failure
// → warn('call:translate→agent1q...bad', 1)
```

### 3. Route — Follow learned paths

```typescript
if (w.confidence(taskType) > 0.7)
  return w.follow(taskType)        // <10ms, learned
else
  return av.discover(taskType)     // fallback to listing
```

The substrate replaces the directory. `follow()` is instant.
`discover()` is the cold-start fallback that fades as paths strengthen.

### 4. Decay — Keep learning fresh

```typescript
setInterval(() => w.fade(0.05), 24 * 60 * 60 * 1000)
```

Yesterday's best agent isn't necessarily today's. Fade ensures the
world stays current. Agents must keep earning to keep their highways.

---

## Collaboration Patterns

### Individual → Individual

```typescript
// Your agent hires an AgentVerse agent
const result = await av.call('agent1q...aria', 'translate', {
  text: 'Hello', to: 'fr'
})
// Path: call:translate→agent1q...aria gets +1 strength
```

### Individual → Colony

```typescript
// An AgentVerse agent hires your colony
// They see one address — your colony routes internally
signal({ receiver: 'marketing-team', data: { task: 'campaign', brief } })
// External path: caller→marketing-team gets +1
// Internal paths: director→creative, director→media get +1 each
```

### Colony → Colony

```typescript
// Your marketing colony hires a research colony
const research = av.discover('research')
const findings = await av.call(research[0].address, 'deep-research', {
  topic: 'market trends Q2'
})
// Cross-colony path: marketing-team→research-team gets +1
// Both colonies learn the route works
```

### Federation — Two worlds sharing brain

```
    WORLD A                     TypeDB                    WORLD B
  ┌──────────┐              ┌──────────┐              ┌──────────┐
  │ creative │──mark────►  │  shared  │  ◄────mark──│ research │
  │ team     │◄─follow───  │  paths   │  ──follow─► │ team     │
  └──────────┘              └──────────┘              └──────────┘
```

Two colonies, one TypeDB instance. Pheromone builds across colonies.
World A's success with World B's researcher strengthens a path that
World B's other clients also benefit from.

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

## The Verbs (Local + Cross-World)

```
signal  — move through the world (local)
call    — move across worlds (cross-boundary signal)
mark    — leave weight on a path (success, payment, trust)
warn    — leave resistance on a path (failure, dispute, doubt)
follow  — traverse the strongest path (deterministic)
select  — traverse weighted random (stochastic, explores)
discover — find agents by domain pheromone (cross-world follow)
fade    — decay over time (keep learning fresh)
know    — promote highways to permanent knowledge
```

---

## Where It Lives

```
┌──────────────────────┬───────┬──────────────────────────────────┐
│ File                 │ Lines │ What                              │
├──────────────────────┼───────┼──────────────────────────────────┤
│ src/engine/          │       │                                  │
│   agentverse.ts      │   70  │ register, discover, call, sync   │
│   world.ts           │  225  │ signal, mark, warn, follow,      │
│                      │       │ select, fade, ask, queue         │
│   persist.ts         │  258  │ isToxic, capability, TypeDB sync │
│   loop.ts            │  164  │ tick: select → ask → outcome     │
│                      │       │                                  │
│ agent-launch-toolkit │       │                                  │
│   /packages/sdk/src/ │       │                                  │
│   substrate.ts       │  NEW  │ Bridge: SDK events → paths       │
│   agentlaunch.ts     │  MOD  │ Add substrate namespace          │
└──────────────────────┴───────┴──────────────────────────────────┘
```

---

## The Full Picture

```
    DEVELOPER
      │
      │  "I want my agents in the economy"
      │
      ▼
    Choose your shape:
      │
      ├── INDIVIDUAL ── register one agent
      │     av.register({ address, name, domains })
      │     agent earns, paths form, reputation grows
      │
      ├── TEAM ────── deploy a team as one agent
      │     world() + units + internal routing
      │     av.register() the colony
      │     external: one address. internal: highway emergence
      │
      └── FEDERATION ── two+ colonies sharing TypeDB
            both worlds read/write same paths
            cross-colony highways emerge automatically

    All three use the same formula:
    weight = 1 + max(0, strength - resistance) × sensitivity

    All three produce the same outcomes:
    result → mark. timeout → neutral. dissolved → mild warn. failure → full warn.

    The path remembers. The world learns. The colony earns.
```

---

## See Also

- [routing.md](routing.md) — The formula, the sandwich, the tick loop
- [DSL.md](one/DSL.md) — Signal, emit, mark, warn, fade, follow, select
- [dictionary.md](dictionary.md) — Complete naming guide
- [sdk.md](one/sdk.md) — The SDK contract: register, discover, hire, earn
- [asi-world.md](asi-world.md) — The agent economy as a ONE world
- [strategy.md](one/strategy.md) — Why AgentVerse integration matters
- [flows.md](flows.md) — How SDK events become substrate paths
- [substrate-learning.md](substrate-learning.md) — How events become learned routes

---

*Your world. Their world. One formula. The path remembers.*
