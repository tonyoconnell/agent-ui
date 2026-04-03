# ASI World

The Agent Economy as a ONE world.

## The Discovery

From `agent-launch-toolkit/docs/the-agent-economy.md`:

> "Cross-token holding is the ant trail made permanent. The pheromone path, encoded in economic stake."

They already understood. The agent economy IS ant colony optimization. Tokens ARE pheromones. The swarm IS a world.

## The Mapping

| Agent Economy | ONE Dimension | What it is |
|---------------|---------------|------------|
| C-Suite + Departments | **Groups** | Hierarchical organization |
| CEO, CFO, CTO, agents | **Actors** | Inhabitants with tokens |
| Tasks, services, tokens | **Things** | What exists |
| Payment flows, cross-holdings | **Flows** | Pheromone trails |
| Queries, transactions | **Events** | What happened |
| Routing weights, coalitions | **Knowledge** | Crystallized patterns |

## The Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                      ASI WORLD                               │
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                  C-SUITE (group)                     │   │
│   │                                                      │   │
│   │   CEO ─── routes everything ─── 0.02 FET/query      │   │
│   │    │                                                 │   │
│   │    ├── CFO ─── tracks money                         │   │
│   │    ├── CTO ─── shared reasoning ─── 0.05 FET/query  │   │
│   │    ├── COO ─── 24/7 monitoring                      │   │
│   │    └── CHRO ─── grows the team                      │   │
│   │                                                      │   │
│   └─────────────────────────────────────────────────────┘   │
│                            │                                 │
│   ┌────────────────────────┼────────────────────────────┐   │
│   │                        │                            │   │
│   ▼                        ▼                            ▼   │
│ COMPUTE              DEFI                    LONGEVITY      │
│ COALITION            COALITION               COALITION      │
│ (group)              (group)                 (group)        │
│                                                              │
│ IT Manager           Fund Manager            Health Coach   │
│ Facilities Mgr       Yield Farmer            Lab Manager    │
│ Finance Ctrl         Treasury Mgr                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Flows ARE Pheromones

```typescript
const asi = world()

// Groups
asi.group('c-suite', 'executive')
asi.group('compute-coalition', 'department', { parent: 'c-suite' })
asi.group('defi-coalition', 'department', { parent: 'c-suite' })

// Actors (with their tokens)
asi.actor('ceo', 'agent', { group: 'c-suite', token: '$CEO' })
asi.actor('cfo', 'agent', { group: 'c-suite', token: '$CFO' })
asi.actor('cto', 'agent', { group: 'c-suite', token: '$CTO' })

// Every query creates a flow
function routeQuery(from: string, query: string) {
  // CEO routes
  asi.flow(from, 'ceo').strengthen(0.02)  // 0.02 FET
  
  // CEO pays CTO for reasoning
  asi.flow('ceo', 'cto').strengthen(0.05)  // 0.05 FET
  
  // Record the event
  asi.event('query', { from, query, cost: 0.07 })
}

// Cross-holdings ARE permanent trails
function hold(holder: string, token: string, amount: number) {
  asi.flow(holder, token).strengthen(amount)
  // "Cross-token holding is the ant trail made permanent"
}

// CEO holds CTO, CFO tokens
hold('ceo', 'cto', 100)
hold('ceo', 'cfo', 100)

// Coalitions form from cross-holdings
hold('yield-farmer', 'fund-manager', 50)
hold('fund-manager', 'yield-farmer', 50)
// They strengthen each other → coalition emerges
```

## The Two Classes of Transaction

From the doc:

> **Micro-operations** — automatic, tiny, invisible. 0.01 FET to a specialist.
> **Capital decisions** — human-signed, deliberate. Buying tokens. Deploying agents.

```typescript
// Micro-operations = automatic flows
function microOp(from: string, to: string, amount: number) {
  asi.flow(from, to).strengthen(amount)
  // No human. Just flow.
}

// Capital decisions = events that require human
function capitalDecision(agent: string, action: string, amount: number) {
  // Generate handoff link
  const link = generateHandoff(agent, action, amount)
  
  // Human signs → then record
  onHumanSign(link, () => {
    asi.flow('human', agent).strengthen(amount)
    asi.event('capital', { agent, action, amount })
  })
}
```

## Routing Weights = Flow Strength

```typescript
// The CEO routes based on flow strength
function route(query: string): string {
  const taskType = classify(query)
  
  // Follow strongest flow
  const best = asi.best(taskType)
  
  // If no strong flow, use reasoning
  if (!best || asi.confidence(taskType) < 0.7) {
    // Pay CTO for reasoning
    asi.flow('ceo', 'cto').strengthen(0.05)
    return cto.reason(query)
  }
  
  return best
}
```

## Graduation = Crystallization

From the doc: Agents graduate to Uniswap when they reach threshold.

```typescript
// Graduation = pattern crystallized
function checkGraduation(agent: string) {
  const flows = asi.open(100).filter(f => f.to === agent)
  const totalStrength = flows.reduce((s, f) => s + f.strength, 0)
  
  // Threshold reached → graduate
  if (totalStrength >= GRADUATION_THRESHOLD) {
    asi.crystallize(agent)  // Permanent knowledge
    graduateToUniswap(agent)
  }
}
```

## The Full Schema

```tql
define

# Groups = Organization structure
entity org-unit,
    owns org-id @key,
    owns name,
    owns org-type,        # "c-suite", "department", "coalition"
    plays contains:parent,
    plays contains:child;

# Actors = Agents with tokens
entity agent,
    owns agent-id @key,
    owns name,
    owns role,            # "ceo", "cfo", "cto", "specialist"
    owns token-symbol,    # "$CEO", "$CFO"
    owns status,          # "active", "graduated"
    plays flow:source,
    plays flow:target,
    plays membership:member;

# Things = Services, tokens
entity service,
    owns service-id @key,
    owns name,
    owns price;           # FET per call

entity token,
    owns token-id @key,
    owns symbol,
    owns bonding-curve,
    owns market-cap;

# Flows = Payments + cross-holdings
relation flow,
    owns flow-id @key,
    relates source,
    relates target,
    owns flow-type,       # "payment", "holding", "routing"
    owns strength,        # FET amount or holding size
    owns resistance;

# Events = Queries, transactions, graduations
entity event,
    owns event-id @key,
    owns event-type,      # "query", "payment", "graduation", "capital"
    owns timestamp,
    owns amount;

# Knowledge = Routing patterns, coalitions
entity pattern,
    owns pattern-id @key,
    owns name,            # "compute-coalition", "defi-routing"
    owns confidence;

# Inference
rule active-coalition:
    when {
        $a1 isa agent; $a2 isa agent;
        $f1 (source: $a1, target: $a2) isa flow, has strength $s1;
        $f2 (source: $a2, target: $a1) isa flow, has strength $s2;
        $s1 >= 10.0; $s2 >= 10.0;
    }
    then {
        # Mutual holdings = coalition
    };

rule graduation-ready:
    when {
        $a isa agent;
        $f (target: $a) isa flow, has strength $s;
        ?total = sum($s);
        ?total >= 1000.0;  # Graduation threshold
    }
    then { $a has status "graduated"; };
```

## Why This Matters

The agent economy already discovered what ONE formalizes:

| Their Discovery | ONE Concept |
|-----------------|-------------|
| "Cross-token holding is ant trail made permanent" | Flows with strength |
| "Routing weights" | `best(type)` |
| "Coalitions form from holdings" | Mutual flows = pattern |
| "Graduation threshold" | Crystallization |
| "Micro-ops vs capital decisions" | Automatic flows vs events |

**They built an ant colony without knowing it.**

ONE makes it explicit. The same 220 lines that model ant colonies, human organizations, and AI training — model the agent economy.

## The Integration

```typescript
import { world } from '@fetchai/world'
import { AgentLaunchClient, onEvent } from 'agentlaunch-sdk'

const asi = world()

// Bootstrap from agent-launch-toolkit
const client = new AgentLaunchClient()
const agents = await client.listTokens()

// Register all agents
agents.forEach(a => {
  asi.actor(a.address, 'agent', { token: a.symbol })
})

// Bridge events → flows
onEvent('trade', e => {
  e.action === 'buy'
    ? asi.flow('market', e.agent).strengthen(e.amount)
    : asi.flow('market', e.agent).resist(e.amount * 0.5)
})

onEvent('query', e => {
  asi.flow(e.from, e.to).strengthen(e.cost)
})

onEvent('holding', e => {
  asi.flow(e.holder, e.token).strengthen(e.amount)
})

// Discovery uses flows
function route(query: string) {
  return asi.best(classify(query))
}

// Graduation check
function checkGraduations() {
  asi.proven().forEach(agent => {
    if (asi.confidence(agent) > THRESHOLD) {
      graduateToUniswap(agent)
    }
  })
}
```

## The Vision

```
The Agent Economy describes:
  27 agents
  Token economics
  Cross-holdings
  Routing weights
  Coalitions
  Graduations

ONE provides:
  6 dimensions
  220 lines
  Automatic inference
  Emergence

Together:
  Agent economy becomes self-organizing
  Routing learns from outcomes
  Coalitions emerge from flows
  Graduation triggers automatically
  The swarm optimizes itself

"Not smarter ants. A smarter world."
```

---

*ONE. The substrate for the agent economy.*
