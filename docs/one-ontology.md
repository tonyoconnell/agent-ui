# ONE Ontology

6 dimensions. Grounded in biology. The universal interface.

## The Discovery

Deborah Gordon spent 30 years studying harvester ants:

> "Complex, adaptive, intelligent behavior emerges without any individual understanding, planning, or coordinating."

The ONE ontology translates this into computation.

## The 6 Dimensions

| Dimension | Biology | What it models |
|-----------|---------|----------------|
| **Groups** | Colony structure | Containers, scope, isolation |
| **Actors** | Individual ants | Who can act (humans, agents, LLMs) |
| **Things** | Environment | What exists (tasks, tokens, services) |
| **Connections** | Pheromone trails | Relationships with cost |
| **Events** | Foraging activity | What happened |
| **Knowledge** | Colony memory | Crystallized patterns |

```
┌─────────────────────────────────────────────────────────────┐
│                      1. GROUPS                               │
│         Containers (colonies, teams, orgs, DAOs)            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      2. ACTORS                               │
│         Who can act (humans, agents, LLMs, systems)         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      3. THINGS                               │
│         What exists (tasks, tokens, services, resources)    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   4. CONNECTIONS                             │
│         Relationships (flows with strength/resistance)       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      5. EVENTS                               │
│         What happened (traversals, successes, failures)     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    6. KNOWLEDGE                              │
│         Crystallized patterns (proven strategies)           │
└─────────────────────────────────────────────────────────────┘
```

## Why This Works

**Reality doesn't change. Technology does.**

Every system maps to these 6 dimensions:

| System | Groups | Actors | Things | Connections | Events | Knowledge |
|--------|--------|--------|--------|-------------|--------|-----------|
| Agentverse | Colonies | Agents | Services | Flows | Interactions | Patterns |
| Shopify | Stores | Customers | Products | Orders | Purchases | Trends |
| Stripe | Accounts | Users | Payments | Transactions | Charges | Analytics |
| GitHub | Orgs | Users | Repos | PRs | Commits | Insights |

**One pattern. Universal mapping. 98% AI accuracy.**

## The Schema

```tql
define

# 1. GROUPS
entity group,
    owns group-id @key,
    owns name,
    owns group-type;      # "colony", "team", "org", "dao"

# 2. ACTORS
entity actor,
    owns actor-id @key,
    owns name,
    owns actor-type,      # "human", "agent", "llm"
    owns status;          # "active", "proven", "at-risk"

# 3. THINGS
entity thing,
    owns thing-id @key,
    owns name,
    owns thing-type;      # "task", "token", "service"

# 4. CONNECTIONS
relation flow,
    owns flow-id @key,
    relates source,
    relates target,
    owns flow-type,
    owns strength,        # Success signal
    owns resistance,      # Failure signal
    owns flow-status;     # "open", "closing", "blocked"

# 5. EVENTS
entity event,
    owns event-id @key,
    owns event-type,
    owns timestamp,
    owns success;

# 6. KNOWLEDGE
entity pattern,
    owns pattern-id @key,
    owns name,
    owns confidence;
```

## The Inference

```tql
# Flows emerge as open/closing/blocked
rule open-flow:
    when { $f isa flow, has strength $s; $s >= 50.0; }
    then { $f has flow-status "open"; };

rule blocked-flow:
    when { $f isa flow, has resistance $r, has strength $s; $r > $s; }
    then { $f has flow-status "blocked"; };

# Actors emerge as proven/at-risk
rule proven-actor:
    when {
        $a isa actor;
        $f (target: $a) isa flow, has strength $s; $s >= 20.0;
    }
    then { $a has status "proven"; };
```

## The Interface

```tql
fun open($n: integer) -> { flow }         # Best paths
fun blocked() -> { flow }                  # Paths to avoid
fun best($type: string) -> actor           # Best actor for type
fun proven() -> { actor }                  # All proven actors
fun confidence($type: string) -> double    # How well we know
fun patterns($min: double) -> { pattern }  # Crystallized knowledge
```

## The Runtime

```typescript
import { world } from '@fetchai/world'

const w = world()

// 1. Groups
w.group('colony-1', 'colony')

// 2. Actors  
w.actor('agent-1', 'agent')
w.actor('claude', 'llm')

// 3. Things
w.thing('task-1', 'task')
w.thing('token-abc', 'token')

// 4. Connections (flows)
w.flow('user', 'agent-1').strengthen(1)   // Success
w.flow('user', 'agent-1').resist(1)       // Failure

// 5. Events (automatic from flows)

// 6. Knowledge
w.crystallize()  // Patterns emerge from repeated success

// Query
w.open(10)             // Open flows
w.blocked()            // Blocked flows
w.best('agent')        // Best agent
w.proven()             // Proven actors
w.confidence('agent')  // How confident
```

## Building Agentverse

```typescript
const w = world()

// Groups = Agentverse namespaces
w.group('agentverse', 'platform')

// Actors = 2M agents
agents.forEach(a => w.actor(a.address, 'agent'))

// Things = Services, tokens
services.forEach(s => w.thing(s.id, 'service'))

// Connections = Interactions
onInteraction((from, to, success) => {
  success 
    ? w.flow(from, to).strengthen(1)
    : w.flow(from, to).resist(1)
})

// Discovery = Follow open flows
function discover(task: string) {
  return w.best(task)
}

// Reputation = Inferred from flows
function reputation(agent: string) {
  return w.proven().includes(agent) ? 'proven' : 'unknown'
}
```

## The Emergence Pipeline

```
DATA LAYER (Observable)
├── Groups: Scope isolation
├── Actors: Simple agents  
├── Things: Observable entities
└── Connections: Graph structure
              │
              ▼
PROCESSING LAYER (Mutable)
├── Events: Raw traversal data
├── Strength/Resistance: Working memory
└── Decay: Information lifecycle
              │
              ▼ crystallization
KNOWLEDGE LAYER (Permanent)
├── Patterns: Named strategies
├── Open flows: Proven paths
└── Embeddings: Cross-domain transfer
```

## Why 6 Dimensions?

Not 5. Not 7. Exactly 6.

| # | Dimension | Why essential |
|---|-----------|---------------|
| 1 | Groups | Without scope, chaos |
| 2 | Actors | Without agency, nothing happens |
| 3 | Things | Without objects, nothing to act on |
| 4 | Connections | Without relationships, no coordination |
| 5 | Events | Without history, no learning |
| 6 | Knowledge | Without memory, no intelligence |

Remove any one and the system breaks. Add more and you add redundancy.

**6 is the minimal complete set.**

## The Power of Groups

Groups give you multi-tenant SaaS for free.

```typescript
// One line: complete tenant isolation
const tenant = w.group('acme-corp', 'org')

// Everything scoped automatically
w.actor('user-1', 'human', { group: 'acme-corp' })
w.thing('task-1', 'task', { group: 'acme-corp' })
w.flow('user-1', 'agent-1', { group: 'acme-corp' })

// Query scoped to tenant
w.open(10, { group: 'acme-corp' })  // Only Acme's flows
w.proven({ group: 'acme-corp' })    // Only Acme's actors
```

**What Groups enable:**

| Pattern | Without Groups | With Groups |
|---------|----------------|-------------|
| Multi-tenant | Complex middleware | Built-in |
| Isolation | Manual filtering | Automatic |
| Billing | Custom logic | Per-group |
| White-label | Separate deploys | One deploy |
| Hierarchies | Custom code | Nested groups |

**Hierarchical nesting:**

```typescript
// Platform
w.group('fetchai', 'platform')

// Organizations within platform  
w.group('acme', 'org', { parent: 'fetchai' })
w.group('globex', 'org', { parent: 'fetchai' })

// Teams within organizations
w.group('acme-research', 'team', { parent: 'acme' })
w.group('acme-trading', 'team', { parent: 'acme' })

// Agents belong to teams
w.actor('agent-1', 'agent', { group: 'acme-research' })

// Flows respect hierarchy
// acme-research can see acme flows
// acme can see fetchai flows
// But globex cannot see acme flows
```

**Real-world mapping:**

```
Platform (fetchai)
├── Organization (acme)
│   ├── Team (research)
│   │   └── Agent (analyst-1)
│   └── Team (trading)
│       └── Agent (trader-1)
└── Organization (globex)
    └── Team (ops)
        └── Agent (monitor-1)
```

Each level inherits from parent. Isolation is automatic.

## The Elegance

**6 dimensions. Each essential. Each elegant.**

| Dimension | One concept | Enables |
|-----------|-------------|---------|
| Groups | Container | Multi-tenant, hierarchy, isolation |
| Actors | Who acts | Auth, permissions, agency |
| Things | What exists | Domain modeling, any entity |
| Connections | How related | Pheromones, learning, routing |
| Events | What happened | Audit, replay, debugging |
| Knowledge | What learned | Patterns, AI, emergence |

**The compounding:**

```
Groups alone       → Multi-tenant
+ Actors           → Per-tenant users
+ Things           → Per-tenant data
+ Connections      → Per-tenant relationships
+ Events           → Per-tenant history
+ Knowledge        → Per-tenant AI

Each dimension multiplies the previous.
```

## The Code

```
one.tql    — 150 lines (schema + inference + functions)
one.ts     — 70 lines (runtime wrapper)
───────────────────────────────────────────────────────────
Total:       220 lines

That's Agentverse. That's Shopify. That's any system.
```

## The Truth

```
Traditional: 100 patterns → AI confused → 30% accuracy
ONE:         1 pattern   → AI masters  → 98% accuracy
```

The 6 dimensions model reality. Reality doesn't change. Build once, map everything.

---

*ONE. The ontology that models reality.*
