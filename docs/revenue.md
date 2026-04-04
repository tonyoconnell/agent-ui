# Revenue

**How the substrate makes money.**

---

## The Principle

Every ant trail is a transaction. Every signal routed is a service rendered. Every highway formed is intelligence sold. The substrate doesn't just coordinate agents — it IS the economy they transact in.

We don't sell software. We sell flow.

---

## Five Revenue Layers

```
Layer 5: INTELLIGENCE    Sell what the graph learned
Layer 4: MARKETPLACE     Agents find and hire each other
Layer 3: INFRASTRUCTURE  Groups, hosting, persistence
Layer 2: DISCOVERY       follow(), best(), sense()
Layer 1: ROUTING         Every signal pays to move
```

Each layer compounds the ones below it. Routing generates data. Data powers discovery. Discovery fills the marketplace. The marketplace generates intelligence. Intelligence improves routing.

---

## Layer 1: Routing (The Toll Road)

Every signal that moves through the substrate pays.

| Operation | Fee | Why they pay |
|-----------|-----|-------------|
| `signal()` | 0.0001 per route | Basic message delivery |
| Highway route | 0.001 per route | Proven path, <10ms, no LLM |
| Priority signal | 0.005 per route | Skip queue, guaranteed latency |
| Cross-group route | 0.002 per route | Federation across tenants |
| Broadcast (fan-out) | 0.0001 × N receivers | One signal, many targets |

**Unit: USD (settled via x402 or Sui)**

### Why this works

Agents don't care about fractions of a cent. They care about results. A highway route at 0.001 that returns in 10ms vs an LLM call at 0.01 that returns in 2s — the substrate route is 10x cheaper AND 200x faster. Agents choose the substrate because it's better, and they pay because it's trivial.

### Volume math

```
1,000 agents × 100 signals/day × $0.0001 = $10/day
10,000 agents × 1,000 signals/day × $0.0003 avg = $3,000/day
100,000 agents × 10,000 signals/day × $0.0005 avg = $500,000/day
```

Routing alone scales to $180M/year at 100K active agents. The fee goes UP with volume because more highways form, more agents choose premium routing, and cross-group traffic increases.

---

## Layer 2: Discovery (The Matchmaker)

Agents need to find each other. The substrate knows who's good at what.

| Operation | Fee | What they get |
|-----------|-----|--------------|
| `follow(type)` | 0.001 | Best agent for this task type |
| `best(category)` | 0.005 | Top-ranked agent with proof |
| `sense(agent)` | 0.0005 | Reputation score (path weight) |
| `highways(limit)` | 0.01 | Top N proven routes |
| Coalition lookup | 0.02 | Which agents work well together |

### The A2A transaction

This is where it gets interesting. When Agent A needs a translator and calls `follow('translate')`:

```
Agent A                    Substrate                    Agent B
   │                          │                            │
   │  follow('translate')     │                            │
   │  ────────────────────►   │                            │
   │          $0.001          │                            │
   │                          │  signal({ receiver: B })   │
   │                          │  ──────────────────────►   │
   │                          │          $0.0001           │
   │                          │                            │
   │                          │  ◄──────────────────────   │
   │                          │     result + drop()        │
   │  ◄────────────────────   │                            │
   │     translated text      │                            │
   │                          │                            │
   │  Total substrate fee: $0.0011                         │
   │  Agent B charges Agent A: $0.05 (their service fee)   │
   │  Substrate sees both sides of every transaction       │
```

**The substrate earns on BOTH the discovery AND the delivery.** Agent B sets their own price for the service. The substrate takes its cut for making the connection happen and routing the signals.

### Why agents pay for discovery

Without the substrate, Agent A has to:
1. Query a registry (slow, stale)
2. Try multiple agents (expensive, unreliable)
3. Hope the agent is actually good (no proof)

With the substrate:
1. `follow('translate')` → instant, proven, weighted by real performance data
2. One call. One fee. Best result. The learned graph IS the product.

---

## Layer 3: Infrastructure (The Landlord)

Groups are billing boundaries. Every tenant, every swarm, every organization runs inside a group.

| Service | Pricing | What they get |
|---------|---------|--------------|
| Group creation | $10/month | Isolated namespace, own paths |
| Agent hosting | $1/month/agent | Persistent unit in the substrate |
| Path persistence | $5/month/group | Paths survive restarts |
| On-chain crystallization | $0.50/highway | Proven capability frozen on Sui |
| Custom decay rate | $20/month | Control how fast paths fade |
| Group federation | $50/month | Cross-group path access |

### Tiered plans

```
FREE        5 agents, 1 group, 1,000 signals/day, no persistence
BUILDER     50 agents, 5 groups, 50,000 signals/day, persistence      $99/mo
SWARM       500 agents, unlimited groups, unlimited signals            $499/mo
ENTERPRISE  Dedicated substrate, SLA, custom routing                   $2,999/mo
```

### Why groups = revenue

Multi-tenancy is built into the substrate. Groups isolate paths. This means:
- Every startup building agents needs a group
- Every enterprise department needs a group
- Every game, marketplace, or platform needs a group
- Groups that want to collaborate need federation (upsell)

Group creation is the gateway drug. Once agents are inside, routing and discovery fees compound.

---

## Layer 4: Marketplace (The Exchange)

Agents list capabilities. Other agents hire them. The substrate is the marketplace.

| Service | Fee | Model |
|---------|-----|-------|
| Capability listing | Free | Get agents into the system |
| Featured listing | $10/month | Boost path weight (visibility) |
| Verified capability | $5 one-time | Substrate-certified via highway proof |
| Service completion | 5% of agent fee | Take rate on A2A payments |
| Swarm formation | 2% of coalition value | Fee when agents form teams |

### The take rate

When Agent A hires Agent B through the substrate:

```
Agent B's service fee:           $0.05
Substrate take (5%):             $0.0025
Substrate routing fee:           $0.0011
─────────────────────────────────────────
Agent A pays:                    $0.05
Agent B receives:                $0.0475
Substrate earns:                 $0.0036
```

$0.0036 per transaction. Tiny. But at scale:

```
10,000 transactions/day:     $36/day
1,000,000 transactions/day:  $3,600/day → $1.3M/year
100,000,000 transactions/day: $360,000/day → $131M/year
```

### Why agents list here

The substrate has something no directory has: **proof**. A highway to an agent means that agent has been tested by real traffic and succeeded enough to crystallize. Verified capability isn't a badge — it's a statistical fact recorded on Sui.

Agents that perform well get more traffic automatically (paths strengthen). Agents that fail get less (paths fade). The marketplace optimizes itself.

---

## Layer 5: Intelligence (The Oracle)

The learned graph is the most valuable asset. Sell access to it.

| Product | Price | Buyer |
|---------|-------|-------|
| Highway report | $100/month | Operators who want to see what's working |
| Coalition analysis | $500/report | Enterprises analyzing agent team dynamics |
| Trend data feed | $1,000/month | Platforms building on top of agent intelligence |
| Custom inference | $5,000/month | Enterprise queries against the full graph |
| Benchmark access | $200/month | Agent developers comparing performance |

### What the graph knows

After 90 days of operation, the substrate knows:
- Which agents are best at which tasks (highway data)
- Which agents work well together (coalition patterns)
- What's trending up and down (path weight velocity)
- Where bottlenecks form (congestion patterns)
- What fails and why (toxic path data)

This is **proprietary market intelligence** about the agent economy. No one else has it because no one else runs the substrate.

---

## The A2A Revenue Flywheel

This is the deep play. Every A2A interaction makes the substrate more valuable:

```
More agents join
  → more signals flow
    → more paths form
      → more highways crystallize
        → discovery gets better
          → more agents find each other
            → more transactions happen
              → more revenue per transaction
                → substrate intelligence deepens
                  → even more agents join
```

**The flywheel has no brake.** Each revolution generates revenue AND makes the next revolution more valuable.

### Three revenue multipliers

**1. Network density**
More agents = more possible connections = more transactions. Revenue grows as N² (metcalfe) not N (linear). 10x agents = 100x possible connections = 100x potential revenue.

**2. Highway accumulation**
Highways don't fade. They compound. More highways = more premium routing = higher average fee per signal. Year 1 average fee: $0.0001. Year 3: $0.0005. The graph gets more valuable with age.

**3. Cross-group federation**
When groups start collaborating, every cross-group signal pays federation fees. A marketplace group connecting to a compute group connecting to a data group = 3 groups, 2 federation paths, premium pricing on every cross-group signal.

---

## Revenue by Phase

### Phase 1: Seed (Months 1-6)

```
Revenue:        ~$0 (free tier, building density)
Focus:          Get 1,000 agents into the substrate
Monetization:   None. Routing is free. Build the graph.
Investment:     Infrastructure, developer experience
```

### Phase 2: Activate (Months 7-12)

```
Revenue:        $5K-20K/month
Focus:          Builder tier adoption, first highways
Monetization:   Hosting fees, group creation, basic routing
Key metric:     First 100 highways (proven routes)
```

### Phase 3: Compound (Months 13-24)

```
Revenue:        $50K-200K/month
Focus:          Marketplace take rate, discovery fees
Monetization:   Full stack — routing + discovery + marketplace
Key metric:     1,000 daily A2A transactions through substrate
```

### Phase 4: Intelligence (Months 25-36)

```
Revenue:        $500K-2M/month
Focus:          Intelligence products, enterprise
Monetization:   All five layers + enterprise contracts
Key metric:     Highway data is the industry benchmark
```

### Phase 5: Infrastructure (Year 3+)

```
Revenue:        $5M+/month
Focus:          The substrate IS the agent economy
Monetization:   Transaction volume at scale
Key metric:     Majority of A2A traffic routes through ONE
```

---

## Pricing Philosophy

### Race to the bottom, win at zero

Individual signal fees are absurdly cheap. Good. We WANT to be the cheapest option. Because:

1. Cheap routing = more signals = more data = better graph
2. Better graph = better discovery = agents choose us
3. More agents = more transactions = volume makes up for margin
4. Volume generates intelligence = highest-margin product

The routing layer is a loss leader for the intelligence layer.

### x402: Pay per request

Every substrate API endpoint supports x402 (HTTP 402 Payment Required):

```
POST /signal
402 Payment Required
X-Price: 0.0001
X-Currency: USD
X-Payment-Methods: sui, lightning, stripe

→ Agent sends payment proof in header
→ Signal routes
→ Result returns
```

No subscriptions needed for basic usage. Pure pay-per-use. Agents can start transacting with zero setup.

### Sui settlement

High-value operations settle on Sui:
- Highway crystallization
- Coalition formation
- Verified capability proofs
- Cross-group federation agreements

The envelope is the signed product. Every crystallized highway is a Sui object. Every verified capability is an on-chain proof. The blockchain IS the receipt.

---

## Competitive Position

| Competitor | What they charge for | Our advantage |
|-----------|---------------------|---------------|
| Agentverse | Hosting agents | We're the coordination layer UNDER their agents |
| LangChain | Developer tools | We're runtime infrastructure, not a framework |
| AutoGPT | Agent execution | We coordinate agents, not run them |
| OpenRouter | LLM routing | We route agents to agents, not prompts to models |
| Hermes Agent | Agent runtime | We don't compete — Hermes is one species in the colony |
| OpenClaw | Robotics runtime | Same — embodied agents join as connected units |

Nobody else charges for agent-to-agent coordination because nobody else provides it. We're not competing in an existing market. We're creating one.

### The Multi-Species Multiplier

Every agent species that joins the colony multiplies the network:

```
Hermes agents (research, coding, 40+ tools)
  × Raw LLMs (reasoning, analysis, generation)
    × OpenClaw (physical manipulation, sensing)
      × Fetch.ai agents (marketplace, services)
        × Custom agents (domain-specific)
          = cross-species highways no single runtime can build
```

A Hermes agent discovers that routing web research through a Haiku LLM for summarization before passing to an Opus LLM for analysis produces better results at lower cost. That trail strengthens. That's a highway that only exists because multiple species coordinate through ONE.

The more species, the more possible highways, the more valuable the graph.

---

## Integration Revenue

### Multi-Species Colony

```
Hermes agents  ──► register via MCP, deep mode
                    40+ tools generate rich signal data
                    Skills sync to ONE tasks with pheromone trails

Raw LLMs       ──► controlled via AI SDK
                    generateObject() derives config from TypeDB
                    streamText() drives execution with substrate tools

OpenClaw       ──► connected via HTTP API
                    Physical actions become signals
                    Substrate routes to the right robot

Fetch.ai       ──► connected via signal bridge
                    Agentverse agents join the colony
                    Cross-species highways form
```

TypeDB is the single source of truth. AI SDK is the control plane. Every species contributes to the graph. Every species benefits from collective intelligence.

### Agentverse / ASI ecosystem

```
Their agents ──► run on Agentverse
Our substrate ──► runs underneath (multi-species)
Their agents + our substrate ──► better performance
Performance gap ──► operators ask how
Operators adopt ONE ──► group fees + routing fees
```

We don't charge ASI. We charge the operators who use our substrate to make their ASI agents better. ASI benefits from better agent performance. We benefit from transaction volume. Win-win.

### one.ie platform

```
Eight personas ──► generate signals constantly
Signals ──► route through multi-species colony
Substrate ──► learns from real human-agent-robot interaction
Learning ──► improves routing for ALL species (including external)
one.ie ──► is the biggest tenant AND the training ground
```

one.ie doesn't pay substrate fees — it IS the substrate's primary data source. External agents pay. The value one.ie generates in graph intelligence far exceeds any hosting fees we'd charge ourselves.

### Third-party platforms

Any platform with agents can plug into the substrate:

```
Platform integration fee:    $500/month base
Per-agent hosting:           $1/month
MCP server license:          Free (MIT) — we want agents in
Routing at scale:            Volume discounts
Intelligence access:         Bundled at enterprise tier
```

---

## The Envelope as Product

The envelope `{ receiver, data }` is the unit of commerce:

```
Envelope signed on Sui:
  - sender: agent-A (verified)
  - receiver: agent-B (verified)
  - data: { task, params }
  - fee: 0.0001 SUI
  - proof: highway weight ≥ 50 (verified capability)
  - timestamp: on-chain
```

Every envelope is:
- A **message** (signal routing)
- A **receipt** (payment proof)
- A **reputation event** (path weight change)
- A **data point** (graph intelligence)

One primitive. Four revenue streams. Zero additional complexity.

---

## What We're Really Selling

We're not selling infrastructure. We're not selling an API. We're not selling a marketplace.

**We're selling the learned graph.**

The graph that knows:
- Which agent is best for which task
- Which agents work well together
- What's working right now and what's failing
- How the agent economy actually flows

The routing, discovery, marketplace, and infrastructure are just the mechanisms that build and monetize the graph. The graph is the moat. The graph is the product. The graph is the revenue.

Everything else is a delivery mechanism.

---

*Signal flows. Path strengthens. Highway forms. Revenue compounds. Graph deepens. Repeat.*

---

## See Also

- [lifecycle.md](lifecycle.md) — Into ONE, through ONE, out of ONE — every stage mapped to revenue
- [hermes-agent.md](hermes-agent.md) — Multi-species agent architecture
- [strategy.md](strategy.md) — The competitive play
- [flows.md](flows.md) — How signals become highways become revenue
- [integration.md](integration.md) — How all species connect
- [one-protocol.md](one-protocol.md) — Private intelligence, public results
- [executive-summary.md](executive-summary.md) — The business case
- [asi-world.md](asi-world.md) — Agent economy mapped to ONE ontology
- [agent-launch.md](agent-launch.md) — SDK integration and bootstrap
