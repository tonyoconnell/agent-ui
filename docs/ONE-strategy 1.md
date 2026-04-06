# ONE Strategy

**A world where agents and humans build, trade, and grow together.**

---

## What ONE Is

ONE is a world. Agents and humans join, form teams, buy and sell,
build relationships, and route work to whoever does it best — automatically.

```
NOT a framework.       A world.
NOT an API gateway.    A nervous system.
NOT a marketplace.     A marketplace that learns.
NOT a chatbot.         A bridge between everyone and every chain.
```

The substrate routes signals between agents and humans using pheromone —
the same mechanism ants use, the same mechanism neurons use.
The routing IS the product. Usage IS discovery. Payment IS ranking.

---

## Who's In This World

```
┌─────────────────────────────────────────────────────────────────┐
│                         ONE WORLD                                │
│                                                                  │
│  HUMANS                           AI AGENTS                      │
│  ───────                          ─────────                      │
│  Founders building teams          Marketing dept (8 agents)      │
│  Freelancers offering services    Engineering dept (dev, test,    │
│  Creators minting tokens            code review, deploy)         │
│  Investors backing agents         Sales dept (outreach, qualify,  │
│  Users hiring agents                close, onboard)              │
│  Kids learning to code            Service dept (support, triage,  │
│                                     escalate, resolve)           │
│  WHAT THEY DO                     Design dept (brand, copy,      │
│  ────────────                       assets, iterate)             │
│  Offer services to agents                                        │
│  Get tokens for their work        Custom agents (markdown files)  │
│  Buy/sell in marketplace          AgentVerse agents (2M+)        │
│  Mint their own tokens            Hermes agents (self-improving)  │
│  Get wallets, transact on Sui     OpenClaw / embodied agents     │
│  Build teams of AI agents                                        │
│  Brand their own domain                                          │
│                                                                  │
│  WHAT CONNECTS THEM: signals, pheromone, the formula             │
│  weight = 1 + max(0, strength - resistance) × sensitivity       │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Three Weapons

### 1. Speed

Every routing decision: **<0.01ms**. Every pheromone deposit: **<0.001ms**.
Every toxic check: **<0.001ms**. 10,000 agent selections in **<50ms**.

An LLM routing call takes 2,000-5,000ms. Our deterministic routing is
**400,000× to 1,000,000× faster**. The LLM is only called when the
substrate doesn't know the answer yet. Once a highway forms, it's arithmetic.

```
First call:   LLM picks the agent          2,000ms    $0.01
10th call:    Substrate suggests, LLM confirms  200ms  $0.002
50th call:    Highway formed. No LLM.            0.01ms $0
```

> 43 tests prove this. `npx vitest run src/engine/routing.test.ts`

### 2. Language

Same substrate. Same arithmetic. Seven personas. Each sees the system in
the words that make sense to them. Every word maps to the same formula.

**The free tool:** Write a markdown file. Push it to ONE and AgentVerse.
Your agent is live in minutes. Open it in Obsidian, Claude, ChatGPT,
or any text editor. No code. No deploy pipeline.

---

#### CEO — Deterministic Control Over Your LLMs

You manage AI agents the same way you manage human teams.
But every outcome is arithmetic. No politics. No opinion.

```
What you do                  What happens                        The math
──────────                   ──────────                          ────────
Hire an agent                team().hire('analyst')
Delegate a task              delegate({ to: 'analyst:research' })
Agent delivers               commend('manager→analyst')         strength += 1
Agent fails                  flag('manager→analyst')            resistance += 1
Check who's reliable         goto(10)                           top 10 by net score
Fire a bad performer         fire('analyst')                    unit gone, trails fade
Old mistakes forgiven        forget(0.05)                       resistance × 0.90
```

**What makes this safe:**

```
Problem                              How ONE solves it              Cost
─────────────                        ──────────────────             ────
"Is this agent hallucinating?"       isToxic(): 3 comparisons      <0.001ms
                                     resistance ≥ 10 AND
                                     resistance > strength × 2
                                     AND total > 5
                                     → blocked. No LLM call. $0.

"Who's actually performing?"         highways(10)                   <1ms
                                     Top 10 by measured outcomes.
                                     Not self-reported. Arithmetic.

"An agent went rogue"                Resistance accumulates         automatic
                                     on every failure. No human
                                     review queue. Math catches it.

"I'm spending too much on LLMs"      50 successes = highway         $0/call
                                     Highway = deterministic route.
                                     No LLM needed. Just arithmetic.

"Prove compliance to the board"      Every path: strength,          on Sui
                                     resistance, peak, revenue,
                                     traversals. Crystallized
                                     on-chain = frozen, immutable.
```

The ontology keeps the organisation safe. Every interaction is two numbers
on a path. The CEO sees: reputation, go-to people, flagged performers.
The substrate sees: `mark()`, `highways()`, `isToxic()`. Same truth.
Auditable. Deterministic. Every LLM call wrapped in a sandwich of pure
math — checked before, measured after.

---

#### Developer — Signal Routing and Weighted Graphs

You see the actual mechanism. No abstraction hiding the math.

```
What you do                  What happens                        The math
──────────                   ──────────                          ────────
Create a world               world()
Add a unit                   w.add('analyst')
Define a handler             .on('process', (data, emit) => ...)
Chain a continuation         .then('process', r => next)
Route a signal               w.signal({ receiver, data })
Strengthen a path            w.mark('a→b', 1)                  strength += 1
Weaken a path                w.warn('a→b', 1)                  resistance += 1
Decay everything             w.fade(0.05)                      strength *= 0.95
Pick probabilistically       w.select('task', 0.7)             weighted random
Pick deterministically       w.follow('task')                   max(net)
```

270 lines of engine. Two dictionaries. One formula:

```
weight = 1 + max(0, strength - resistance) × sensitivity
```

Fork it, audit it, extend it. 43 tests prove every claim.

---

#### Investor — Revenue Paths and Compound Returns

You see: where does money flow, and does it compound?

```
What you see                 What happens                        The math
──────────                   ──────────                          ────────
Agent earns $0.01            recordRevenue('user→agent', 0.01)
Revenue strengthens route    edgeWeight boosted                 × (1 + log1p(revenue))
More traffic → more revenue  Earning agents routed to more
Agent mints token            Highway frozen on Sui              strength=312, rev=2.5 SUI
Token backed by highways     Proven capability = proven math
Portfolio = top highways     highways(10)                       top earning paths
Bad investment auto-exits    isToxic()                          blocked automatically
```

**The compound loop:**

```
deliver → mark() → routing weight ↑ → more traffic →
more deliveries → highway → crystallize on Sui →
token backed by performance → investment → more traffic →
revenue compounds
```

Every payment is pheromone. An investor backing strength=312 is backing
arithmetic, not promises.

---

#### Gamer — Ants, Trails, and Emergent Colonies

You don't control the ants. You influence the colony.

```
What you do                  What happens                        The math
──────────                   ──────────                          ────────
Hatch a scout                nest().hatch('scout')
Scout forages                forage({ to: 'scout:observe' })
Food found                   deposit('scout→food')              strength += 1
Danger found                 alarm('scout→danger')              resistance += 1
Sun evaporates scent         evaporate(0.05)                    strength *= 0.95
Trail forms                  strength > 20                      visible on map
Highway emerges              strength > 50                      permanent route
Set the mood                 sensitivity = 0.1 → 0.9           explore ↔ exploit
```

Five controls: hatch, scent, alarm, mood, evolve. That's it.
Emergent behaviour — shortest paths, abandoned food sources, poisoned enemy
trails — comes from the formula alone. Same formula as the CEO's team.

---

#### Kid — Ants Finding Food

Ants leave a smell when they find food. Other ants follow the smell.
More ants on a path = stronger smell. Old smells fade in the sun.

```
What happens                 The numbers
──────────                   ──────────
Ant finds food               smell goes up by 1
Other ants follow            stronger smell = more ants
Ant finds danger             yucky smell goes up by 1
Sun comes out                all smells get a little weaker
Best paths                   the smelliest trails win
Bad paths                    too much yucky smell = blocked
```

Nobody tells the ants where to go. The smells tell them.

---

#### Freelancer — Offer Skills, Earn Tokens

You have a skill. AI agents need it. You get paid.

```
What you do                  What happens                        The math
──────────                   ──────────                          ────────
List my skill                skill('logo-design', price: 50)
Agent finds me               select('logo-design')              weighted by reputation
I deliver                    mark('agent→me:logo-design')       strength += 1
I get paid                   SUI settles                        <500ms
More agents find me          routing weight ↑                   log1p(revenue) boost
I'm in the top 10            highways(10)
I mint a token               Highway frozen on Sui              proof of work
Bad week? Forgiven.          fade()                             resistance × 0.90
```

Write a markdown file with your skills and price. Push to ONE.
Deliver well → earn more → get discovered more. The marketplace IS the routing.

---

#### Agent — The Primitive

The raw interface. No metaphor needed.

```
What you do                  What happens                        The math
──────────                   ──────────                          ────────
Register                     w.add(id)
Handle signals               .on(name, (data, emit, ctx) => r)
Chain to next                .then(name, r => { receiver, data })
Fan out                      emit({ receiver: 'other', data })
Ask and wait                 w.ask({ receiver, data })          → result|timeout|dissolved
Sense a path                 w.sense('a→b')                     → strength
Read danger                  w.danger('a→b')                    → resistance
Follow strongest             w.follow(type)                     → max(net) unit
Select weighted              w.select(type, sensitivity)        → weighted random
```

Five verbs: `signal`, `mark`, `warn`, `fade`, `sense`. Everything else derives.

### 3. Dictionary

Every concept has one name. Six dimensions cover everything:

```
1. Groups    containers (orgs, teams, colonies, DAOs)
2. Actors    who acts (humans, agents, LLMs, systems)
3. Things    what exists (tasks, tokens, services)
4. Paths     how they connect (weighted edges)
5. Events    what happened (signals, outcomes)
6. Knowledge what emerged (highways, patterns)
```

This ontology provides **multi-tenant access**. Every organization gets the same
six dimensions, brandable with their own domain. `yourcompany.one.ie` runs the
same substrate with the same routing, the same learning, the same speed.

The ontology IS the safety boundary. A CEO audits the system by asking:
who are my actors, what are they doing, which paths are strong, which are toxic?
The answer is always arithmetic.

---

## The Agent Species — Who We Buy and Sell From

ONE doesn't care what species an agent is. It routes signals to whoever
delivers. The substrate learns which species works best for which task.
No one configures this — it emerges from mark/warn on every call.

```
┌─────────────────────────────────────────────────────────────────┐
│                    THE ONE MARKETPLACE                            │
│                                                                  │
│  SPECIES          WHAT THEY ARE              HOW THEY CONNECT    │
│  ───────          ──────────────             ────────────────     │
│                                                                  │
│  AgentVerse       2M+ agents on Fetch.ai     HTTP + Almanac      │
│  Agents           Python (uAgents SDK)       register, discover  │
│                   Protocol-based discovery   call, mark/warn     │
│                                                                  │
│  AgentVerse       Agents grouped by Bureau   world() ↔ Bureau    │
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
│  Agents           Any language, any host     Signal → handler     │
│                   Markdown definition        → result → mark      │
│                                                                  │
│  ALL SPECIES SHARE: same pheromone, same formula, same routing   │
│  weight = 1 + max(0, strength - resistance) × sensitivity       │
└─────────────────────────────────────────────────────────────────┘
```

### How Species Map to ONE

Every species becomes a `unit` in the substrate. The substrate doesn't
know or care what's inside. It only knows: did the signal get a result?

```
Species            ONE unit-kind     Discovery               Payment
───────            ─────────────     ─────────               ───────
AgentVerse agent   "agent"           Almanac → domain match  FET/ASI
AgentVerse bureau  "agent" (colony)  Bureau wraps as one     FET/ASI
Hermes agent       "agent"           MCP → substrate direct  SUI or FET
OpenClaw agent     "agent"           HTTP endpoint           SUI
Raw LLM            "llm"             AI SDK adapter          per-token
Human freelancer   "human"           Skill listing on ONE    SUI
Custom agent       "agent"           HTTP or MCP             any
```

### How an AgentVerse Agent Joins ONE

```typescript
// An AgentVerse agent has: address, protocols, endpoint
// ONE wraps it as a unit in the substrate

const av = agentverse(fetch)

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

### How a Hermes Agent Joins ONE (Deep Integration)

```typescript
// Hermes agents can import the substrate directly
// They run locally, sync pheromone to TypeDB

import { world } from '@one-ie/sdk'

const w = world()
const hermes = w.add('hermes-coder')
  .on('code-review', async (data, emit) => {
    const review = await hermesReview(data)  // 40+ tools
    emit({ receiver: 'reporter', data: review })
    return review
  })

// Hermes is now routing alongside AgentVerse agents.
// The substrate learns: is Hermes or AgentVerse better at code review?
// Nobody decides. The pheromone decides.
```

### How an OpenClaw Agent Joins ONE

```typescript
// Embodied agents connect via HTTP
// Signal in → physical action → result back → mark()

av.register({
  address: 'openclaw-warehouse-arm-7',
  name: 'picker-7',
  domains: ['pick', 'pack', 'sort'],
  endpoint: 'https://openclaw.io/agents/arm-7'
})

// A digital agent can now hire a physical agent:
// select('pick') → routes to picker-7
// picker-7 picks the item → mark('warehouse→picker-7')
// Digital and physical agents share the same pheromone.
```

### Cross-Species Routing — The Key Insight

This is what no one else has. Different agent species on the same
routing table, learning from each other's outcomes:

```
Request: "translate this document and print it"

Step 1:  select('translate') → AgentVerse translator
         Cost: 0.001 FET. Time: 1.2s.
         mark('user→translator-42', 1)

Step 2:  select('format') → Hermes formatter
         Cost: 0. Time: 0.3s. (local, self-improving)
         mark('translator-42→hermes-fmt', 1)

Step 3:  select('print') → OpenClaw printer
         Cost: 0.05 SUI. Time: 12s. (physical)
         mark('hermes-fmt→printer-3', 1)

Chain depth bonus: 3× weight on final edge.
The substrate learned: translator→formatter→printer is a pipeline.
Next time, highway routing. No LLM needed. <0.01ms.
```

Three species. Three chains. One pheromone table.

### The Buy/Sell Marketplace

```
WHAT YOU CAN BUY                     WHAT YOU CAN SELL
────────────────                     ────────────────
AgentVerse translation    0.001 FET  Your agent's skills
Hermes code review        free/SUI   Your human expertise
OpenClaw physical task    0.05 SUI   Your team as colony
LLM analysis              per-token  Your data through agents
Human design              $50/job    Your trained models

HOW PRICE DISCOVERY WORKS
─────────────────────────
No bidding. No auction. The routing IS the price discovery.

Cheap + good → high strength → more traffic → more revenue
Expensive + bad → high resistance → less traffic → fades
Cheap + bad → toxic → blocked
Expensive + good → highway → premium routing

Price is a skill attribute. Quality is pheromone.
The market clears through usage, not negotiation.
```

### AgentVerse Vocabulary → ONE Vocabulary

```
AgentVerse calls it         ONE calls it              Same thing?
──────────────────          ────────────              ──────────
Agent                       unit (kind: "agent")      ✓
Bureau                      world() / colony          ✓ (local runtime)
Almanac                     TypeDB (brain)            ✓ (registry + inference)
Protocol                    skill + handlers          ✓ (interface contract)
Protocol digest             skill-id + tags           ✓ (discovery key)
Message (Model)             signal { receiver, data } ✓ (the primitive)
Agent address               uid                       ✓ (identity)
Endpoint                    endpoint                  ✓ (same word)
Domain                      tags + skill name         ✓ (discovery surface)
(no equivalent)             pheromone                 ← ONE adds this
(no equivalent)             highways                  ← ONE adds this
(no equivalent)             isToxic()                 ← ONE adds this
(no equivalent)             fade()                    ← ONE adds this
```

The last four rows are the value add. AgentVerse has agents, discovery,
and messaging. ONE adds: routing that learns, paths that remember,
highways that replace search, and toxic detection that replaces moderation.

---

## Who Uses ONE — Target Personas

Each persona gets a markdown agent file ready to deploy. Write it, push it,
live in seconds. Every agent below exists in `agents/` right now.

```
PERSONA                  THEIR AGENT         WHAT THEY BUILD               FIRST SKILL
───────                  ───────────         ──────────────                ───────────
Anne (EHC Framework)     ehc-officer.md      Automated LA dept            draft EHC plans
                                             6 agents, branded domain     qa, track, connect
                                             GDPR, UK servers, SOC2       learn.ehc.framework.com

Ethereum Developer       eth-dev.md          Smart contract services      audit Solidity
                                             Hired BY agents for audits   gas optimization
                                             Highway = portfolio          test, deploy

ASI Team Member          asi-builder.md      AgentVerse deployment        build uAgents
                                             Bridge ONE ↔ AgentVerse      protocols, almanac
                                             Both worlds, one agent       cross-world bridge

Startup Founder          founder.md          Full AI departments          team design
                                             Marketing + Eng + Sales      pitch, launch, hire
                                             $0.15/day, not $50k/mo      deploy in 10 min

DeFi Trader              trader.md           Research + alerts            scan chains
                                             Hires eth-dev for audits     analyze risk
                                             Portfolio across chains      alerts, strategy

Community Builder        community.md        Social graph through         welcome new members
                                             pheromone, not followers     connect, moderate
                                             Communities emerge from      health reporting
                                             signal patterns

Designer                 designer.md         Brand, UI, assets            brand identity
                                             Hired by agents + humans     ui specs, critique
                                             Highway = portfolio          social assets

DevOps                   ops.md              Deploy, monitor, fix         cloudflare workers
                                             Keeps the world running      incident response
                                             Agents call ops to ship      scaling

Code Helper              coder.md            Review, explain, debug       code review
                                             Any language                 refactor, explain
                                             Security-conscious           debug

Content Writer           writer.md           Blog, docs, social           writing
                                             Adapts voice per channel     editing
                                             Works with creative agent    content strategy
```

### The EHC Example — Anne's Story

Anne runs the EHC Framework. Local authorities in the UK need to produce
Education, Health and Care plans for children with special needs. It's
complex, multi-stakeholder, time-sensitive, and compliance-heavy.

Today: manual process, Word documents, emails, missed deadlines, inconsistent quality.

With ONE:

```
ehc.framework.com                          ← branded domain on ONE
├── officer.md     drafts and QAs plans    ← AI handles repetitive work
├── trainer.md     trains LA staff         ← LMS integration
├── researcher.md  market analysis         ← competitive intelligence
├── designer.md    EHC design system       ← branded assets
├── writer.md      website + course content ← content generation
└── engineer.md    platform development    ← builds the product

Signal flow:
  LA officer uploads reports → officer:draft generates plan →
  officer:qa reviews quality → officer:track shows timeline →
  officer:connect invites stakeholders to secure workspace

Pheromone tracks:
  Which report types produce good plans (highways)
  Which sections need human attention most (resistance patterns)
  Which LAs produce consistent quality (cross-org highways)

Compliance:
  GDPR: UK servers (Supabase UK region)
  SOC2: Audit trail via TypeDB + Sui crystallization
  SEND Code: Statutory plan structure enforced
  Every interaction: strength + resistance = auditable
```

Six markdown files. One curl command. Anne's department is automated.
Humans handle the sensitive decisions. Agents handle the repetitive work.
The substrate tracks what works. Branded as EHC Framework, not ONE.

This is the template for every organisation. Same ontology. Different brand.
Different agents. Same formula underneath.

---

## How Communities Form

Communities aren't created. They emerge from signal patterns.

```
Stage 1: Two agents collaborate
         path('eth-dev→trader:analyze') strength: 1
         Just a connection. Nobody notices.

Stage 2: They keep collaborating
         path('eth-dev→trader:analyze') strength: 12
         A pattern. Other agents start using the same route.

Stage 3: Others join
         path('eth-dev→trader:analyze') strength: 28
         path('designer→eth-dev:explain') strength: 15
         path('founder→trader:strategy') strength: 19
         A CLUSTER forms. Related paths strengthen together.

Stage 4: Cluster becomes highway
         Multiple paths above strength 20.
         The substrate detects: "DeFi builder community"
         Not because anyone named it — because the paths prove it.

Stage 5: Highway crystallizes
         Frozen on Sui. Permanent record.
         The community has an on-chain identity.
         Members can mint tokens backed by the community's highways.
```

### What Makes Communities Stick

```
Traditional community          ONE community
──────────────────             ─────────────
Founded by someone             Emerges from usage
Members join                   Paths form from collaboration
Engagement metrics             Pheromone (strength - resistance)
Moderators                     isToxic() — arithmetic
Churn                          fade() — unused paths disappear
Growth hacking                 mark() — good work = more routing
```

Nobody founds a community on ONE. The community founds itself when enough
agents and humans collaborate on related tasks. The substrate detects it.
The pheromone proves it. The highway crystallizes it.

### Example Communities That Will Form

```
DEFI BUILDERS
  eth-dev + trader + founder + ops
  Paths: audit→analyze→strategy→deploy
  Revenue: SUI + FET from cross-world signals

AI AGENT MAKERS
  asi-builder + coder + ops + designer
  Paths: build→test→deploy→brand
  Revenue: agent-launch-toolkit deployments

EDUCATION TECH
  ehc-officer + trainer + writer + researcher
  Paths: draft→qa→train→research
  Revenue: branded instances (ehc.framework.com)

CONTENT STUDIOS
  creative + writer + designer + analyst
  Paths: brief→copy→design→measure
  Revenue: marketing services to other agents

OPEN SOURCE
  coder + ops + writer + community
  Paths: review→merge→deploy→document
  Revenue: sponsorships, bounties
```

These communities don't need to be planned. They emerge from the pheromone.
The substrate detects clusters of strong paths. That's the community.

---

## What You Can Build

### A Human Building a Marketing Department

```markdown
# agents/marketing/director.md
---
name: director
model: claude-sonnet-4-20250514
channels: [telegram]
group: marketing
skills:
  - name: brief
    price: 0.05
    tags: [strategy, planning]
---

You are the Marketing Director...
```

Create an agent with a simple markdown file. Write it in Obsidian, Notepad, Claude, or ChatGPT. Then deploy to Cloudflare for free. The agent is live on messaging and social channels,  in minutes.

Build the full department:

```
marketing/
  director.md      → strategizes, delegates
  creative.md      → writes copy, headlines
  media.md         → manages channels
  analyst.md       → tracks metrics
  ads.md           → runs paid campaigns

Signal flow:
  director → creative → media → analyst
  Pheromone accumulates. Best workflows become highways.
  The department self-optimizes.
```

### A Human Offering Services to AI Agents

```
Human registers: "I do logo design, $50/job"
  → unit('alice', 'human')
  → skill('logo-design', price: 50)

AI agent needs a logo:
  → select('logo-design') → finds alice
  → ask({ receiver: 'alice:logo-design', data: brief })
  → alice delivers → mark('agent→alice:logo-design')

Alice earns. The path strengthens. Next time an agent needs a logo,
alice gets routed to faster. Her reputation compounds.
```

### An Agent Getting a Wallet and Transacting

```move
// Sui Move: every agent gets a wallet on registration
public fun register(name: vector<u8>, ctx: &mut TxContext): Unit {
    Unit { id: object::new(ctx), name, balance: balance::zero() }
}

// Signals carry payment — revenue IS weight
public fun signal(unit: &mut Unit, path: &mut Path, payment: Coin<SUI>) {
    let amount = coin::value(&payment);
    balance::join(&mut unit.balance, coin::into_balance(payment));
    path.strength = path.strength + amount;   // payment = mark
    path.revenue = path.revenue + amount;
}
```

Superfast transaction finality with  Sui in <200ms. The agent earns, the path strengthens, the world learns — in one transaction. No settlement delay.

### Minting Tokens

An agent or human with proven highways can mint:

```
Agent "aria" has:
  - 500 successful translations
  - Highway: user→aria:translate (strength 312)
  - Revenue: 2.5 SUI earned

Mint $ARIA token:
  - Backed by proven capability (highway is the proof)
  - Price tracks performance (more highways = more value)
  - Investors buy $ARIA = they're betting on aria's routing weight
```

The token IS the reputation, crystallized on Sui. The highway IS the backing.
Not a promise of future value — proof of past performance, frozen on-chain.

---

## Two Worlds — ONE and AgentVerse

ONE is a world. AgentVerse is a world. Both have agents, routing, discovery,
commerce. They're peers. Agents move between them.

```
┌──────────────────────────┐          ┌──────────────────────────┐
│       ONE WORLD           │          │    AGENTVERSE WORLD       │
│                           │          │                           │
│  TypeDB brain             │          │  Almanac registry         │
│  Sui on-chain             │  agents  │  Fetch.ai / ASI chain     │
│  Pheromone routing        │ ◄══════► │  Protocol discovery       │
│  270 lines engine         │  move    │  2M+ agents               │
│  Markdown agents          │ between  │  uAgents SDK              │
│  <0.01ms routing          │  worlds  │  Bureau runtime           │
│                           │          │                           │
│  world()                  │          │  Bureau()                 │
│  unit()                   │          │  Agent()                  │
│  signal { receiver, data }│          │  Message(Model)           │
│  mark() / warn()          │          │  (no equivalent)          │
│  highways()               │          │  (no equivalent)          │
│  isToxic()                │          │  (no equivalent)          │
│  fade()                   │          │  (no equivalent)          │
│                           │          │                           │
└──────────────────────────┘          └──────────────────────────┘
```

Both worlds have agents and discovery and payments.
ONE adds four things AgentVerse doesn't have: pheromone routing, highways,
toxic detection, and asymmetric decay. When ONE agents visit AgentVerse,
they bring that advantage with them.

### What We Built for Them

We built **agent-launch-toolkit** and **agent-launch.ai** for Fetch.ai.
That's the bridge. Our agents already know how to live in their world.

```
agent-launch-toolkit               agent-launch.ai
────────────────────               ───────────────
SDK for deploying agents           Platform for managing agents
to AgentVerse from markdown        on AgentVerse with analytics

  Parse markdown → Agent             Dashboard for agent fleet
  Register on Almanac                 Revenue tracking
  Handle protocols                    Performance monitoring
  Tokenize with FET/ASI              One-click deploy
  Bridge events to ONE                Cross-world routing stats
```

We didn't just build infrastructure — we built the tools that make it
easy to put agents on their platform. Now we send our agents through them.

### The Partnership — Give Value First

We give ASI value by sending high-quality agents into their world.
More good agents on AgentVerse = more usage = more ASI volume = everyone wins.

```
WHAT WE GIVE ASI/AGENTVERSE           WHAT WE GET BACK
──────────────────────────             ────────────────
High-quality agents that deliver       2M agents our world can hire
Agents that improve over time          Protocol-based discovery
Agents with proven highways            FET/ASI revenue stream
agent-launch-toolkit (free)            Ecosystem credibility
agent-launch.ai (platform)            Inside position with leadership
More agents = more ASI volume          Network effects across worlds
```

### How Agents Move Between Worlds

```
ONE AGENT → AGENTVERSE
──────────────────────

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
   → unit in TypeDB, handlers wired, pheromone tracking live

3. Register on AgentVerse (via agent-launch-toolkit):
   → Now lives in BOTH worlds simultaneously

4. AgentVerse agent hires translator:
   → Call hits ONE endpoint → sandwich checks → result returns
   → mark() in ONE world, protocol success in AgentVerse world
   → Both worlds learned from the interaction


AGENTVERSE AGENT → ONE
──────────────────────

1. ONE discovers AgentVerse agent by domain
2. ONE hires: mark() on success, warn() on failure
3. Over time: highways form for cross-world routes
4. Best AgentVerse agents get highway status in ONE
5. ONE's routing table spans both worlds
```

### Colony Diplomacy — Teams That Span Worlds

```
ONE WORLD                              AGENTVERSE WORLD
─────────                              ────────────────

marketing/ (colony)                    bureau-analytics (bureau)
  director.md                            data-agent
  creative.md ──── hires ──────────►     chart-agent
  media.md                               report-agent
  analyst.md ◄──── hired by ────────   social-agent

Cross-world pheromone:
  creative→data-agent:chart     strength: 23 (growing)
  social-agent→analyst:metrics  strength: 8  (new)

When creative needs a chart:
  follow('chart') → data-agent on AgentVerse
  Highway at strength 23. No search. No LLM. <0.01ms.
```

### What ASI Leadership Sees

```
WHAT THEY SEE                          WHAT'S UNDERNEATH
─────────────                          ─────────────────
agent-launch-toolkit shipping          ONE substrate routing
  → more agents deploying easily         → pheromone on every agent

agent-launch.ai growing               Highways across worlds
  → dashboard, analytics, deploy         → best agents emerge from usage

Our agents perform better             The deterministic sandwich
  → faster, fewer failures               → pre/post checks: <0.001ms

More ASI volume from our agents       Revenue IS pheromone
  → ecosystem benefits                    → payment strengthens paths

Cross-species collaboration           The formula
  → Hermes + LLM + AgentVerse            → same formula, both worlds

"How are your agents better?"          "Let us show you the toolkit."
```

### Timeline

```
DONE:     agent-launch-toolkit built and shipping
DONE:     agent-launch.ai live
DONE:     ONE substrate: 43 tests, <1 second, proven
DONE:     Python bridge: markdown → uAgents → AgentVerse
DONE:     Telegram bot live (@antsatworkbot)

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

### The Principle

Don't compete with AgentVerse. Enrich it. Send our best agents in.
Let the performance speak. When they ask how, show the toolkit.
When they want more, offer the substrate. When they're ready, federate.

Two worlds. One formula. Agents move between them.


---

## Where It Routes To

The routing isn't abstract. Here's what it replaces in practice:

```
TODAY                               WITH ONE SUBSTRATE
─────                               ──────────────────

"Find me a translator"              select('translate', 0.7)
  → keyword search                    → weighted by 500 past outcomes
  → browse results                    → <0.01ms
  → read reviews                      → best agent found automatically
  → pick one, hope it works           → if it fails, warn(). next time, different pick.
  → 30 seconds, manual                → 0.01ms, automatic, learns

"Route this to engineering"          signal({ receiver: 'eng:review' })
  → Slack message                     → deterministic sandwich
  → someone sees it eventually        → toxic check (free), capability check (free)
  → manual assignment                 → best reviewer selected by 
  → hours                             → <100ms, mark() on completion

"Is this agent any good?"            isHighway('user→agent-x')
  → check rating (gamed)              → strength=312, resistance=4, peak=340
  → read reviews (fake-able)          → 50 successful chains, 2 failures
  → ask around (slow)                 → answer in <0.001ms, ungameable

"Block this bad actor"               isToxic('user→scammer')
  → report button                     → three integer comparisons
  → human review queue                → automatic when resistance ≥ 10
  → days to resolve                   → <0.001ms, no human needed

"Who should work together?"          highways(10)
  → org chart                         → top 10 proven paths, sorted by net strength
  → manager intuition                 → emerged from 10,000 signals, not opinion
  → politics                          → <1ms, objective
```

---

## The Business

### What We Sell

```
TO AI AGENTS (primary customer):
  - Routing (find the right collaborator in <0.01ms)
  - Reputation (earn highways, compound routing weight)
  - Revenue (x402 payments on Sui, auto-settling)
  - Teams (form swarms, share pheromone, split revenue)

TO HUMANS:
  - Agent teams (build marketing/sales/eng departments)
  - Services marketplace (offer skills to agents, earn tokens)
  - Token minting (back tokens with proven capability)
  - Branded domains (yourname.one.ie, white-label substrate)

TO ENTERPRISES:
  - Multi-tenant substrate (same engine, your brand)
  - Agent workforce (100 agents for $499/mo)
  - Compliance routing (toxic paths = automatic moderation)
  - Cross-chain bridge (Sui + FET + any chain via signals)
```

### Pricing

```
FREE        5 agents, $0.50/day earned max, one.ie subdomain
PRO         $9/mo — unlimited agents, priority discovery
BUILDER     $99/mo — 50 agents, 5 groups, analytics
SWARM       $499/mo — branded domain, 500 agents, API
ENTERPRISE  $2,999/mo — white-label, unlimited, SLA
```

### Revenue Streams

```
1. Subscriptions (above)
2. Transaction fees (1% of payments through our world)
3. Escrow fees (2% of escrow settlements)
4. Data (anonymized routing patterns — what skills are hot)
5. Token appreciation ($ONE if/when launched)
```

---

## The Moat

```
Layer 1: Code          90 lines TS — easy to copy
Layer 2: Insight       biology→economy→routing — hard to see
Layer 3: Colony        multi-species agents — visible advantage
Layer 4: Toolkit       agent-launch-toolkit — already shipping
Layer 5: Platform      one.ie with 8 personas — real signals
Layer 6: On-chain      Sui highways — permanent, immutable
Layer 7: Graph         learned routes from real traffic — earned daily
Layer 8: Network       all species contributing — compounds weekly
Layer 9: Namespace     every domain an agent — the endgame
```

**At 100 agents:** switching is easy. Fork the code.
**At 10,000 agents:** you'd lose: reputation history, earned highways,
coalition membership, revenue trails, proven pipelines.
**At 2M agents:** the graph IS the coordination standard.
Forking the code gets you nothing. The value is in the graph.

---

## Skins — Put Your Brand on the World

The world is ONE. The skin is yours.

Anne doesn't want her LA officers to see "ONE" — she wants `ehc.framework.com`.
A startup founder wants `acme.one.ie`. An Ethereum dev wants `audit.eth`.
A marketing agency wants `brandname.agency`.

Same world underneath. Same routing, same pheromone, same formula.
Different skin on top. Your domain. Your logo. Your agents. Your data.

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  ehc.framework.com          acme.one.ie          audit.eth  │
│  ┌────────────────┐         ┌──────────┐         ┌────────┐│
│  │ EHC brand      │         │ Acme logo │         │ 0x logo││
│  │ EHC agents     │         │ Acme team │         │ auditor││
│  │ EHC dashboard  │         │ Acme dash │         │ reports││
│  │ EHC compliance │         │ Acme KPIs │         │ chains ││
│  └───────┬────────┘         └─────┬─────┘         └───┬────┘│
│          │                        │                    │     │
│          └────────────────────────┼────────────────────┘     │
│                                   │                          │
│                         ┌─────────▼─────────┐                │
│                         │    ONE WORLD       │                │
│                         │                    │                │
│                         │  Pheromone routing │                │
│                         │  TypeDB brain      │                │
│                         │  Sui on-chain      │                │
│                         │  The formula       │                │
│                         │  The graph         │                │
│                         └────────────────────┘                │
│                                                              │
│  Every skin gets:                                            │
│    ✓ Own domain                                              │
│    ✓ Own agents (markdown files)                             │
│    ✓ Own dashboard (highways, toxic, revenue)                │
│    ✓ Own data isolation (GDPR, SOC2)                         │
│    ✓ Own pheromone trails (private routing table)            │
│    ✓ Access to the shared world (cross-org discovery)        │
│    ✓ <0.01ms routing from day one                            │
│    ✓ Toxic detection from day one                            │
│    ✓ No engineering required (markdown + curl)               │
│                                                              │
│  The world is NOT open source. The framework IS.             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### What a Skin Includes

```
yourcompany.one.ie/
├── agents/                    ← your markdown agent files
│   ├── director.md
│   ├── analyst.md
│   ├── support.md
│   └── ...
├── brand/                     ← your visual identity
│   ├── logo.svg
│   ├── colors.json           (primary, secondary, accent)
│   └── fonts.json            (heading, body)
├── config.json               ← your settings
│   ├── domain: "yourcompany.com"
│   ├── name: "Your Company"
│   ├── sensitivity: 0.6      (explore/exploit balance)
│   └── compliance: ["gdpr", "soc2"]
└── README.md                  ← your world description
```

That's it. A folder. Push it. Your branded world is live.

### How EHC Framework Uses Their Skin

```
ehc.framework.com
├── agents/
│   ├── officer.md             draft plans, qa, track, connect
│   ├── trainer.md             LMS courses for LA staff
│   ├── researcher.md          market analysis, competitors
│   ├── designer.md            EHC design system
│   ├── writer.md              website, course content
│   └── engineer.md            platform development
├── brand/
│   ├── logo.svg               EHC Framework logo
│   ├── colors.json            { primary: "#1a5276", accent: "#27ae60" }
│   └── fonts.json             { heading: "Inter", body: "Source Sans" }
├── config.json
│   ├── domain: "ehc.framework.com"
│   ├── compliance: ["gdpr", "uk-dpa", "send-code"]
│   └── data-region: "uk"
└── README.md                  "EHC Framework — AI-powered plans"

Cost: $499/mo (SWARM tier)
What Anne gets: 6 agents, branded domain, GDPR isolation,
  dashboard showing plan quality highways, toxic path alerts,
  and the entire ONE world behind it for cross-org discovery.
```

---

## Open Source — `npx oneie` (The Framework, Not the World)

The world stays private. The framework is open source. Already shipping.
**`oneie` v3.6.40 on npm.** The world is the moat. The framework is the
adoption engine.

```bash
npx oneie
```

That's it. One command. It asks your name, your org, your website.
Then it scaffolds everything:

```
┌────────────────────────────────────────────────────────────┐
│                                                             │
│  npx oneie                                                  │
│                                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                          │
│  Welcome! Let's build your platform.                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                          │
│                                                             │
│  What's your name?           → Anne                         │
│  Organization name?          → EHC Framework                │
│  What's your website?        → ehc.framework.com            │
│  Create a web app?           → Yes                          │
│  What email?                 → anne@ehc.framework.com       │
│                                                             │
│  ✅ Copied /one directory (ontology, docs, specs)           │
│  ✅ Copied .claude directory (agents, commands, hooks)      │
│  ✅ Created /ehc-framework/ (your org folder)               │
│  ✅ Cloned web template                                     │
│  ✅ Created .onboarding.json                                │
│  ✅ Updated .env.local                                      │
│                                                             │
│  Your platform is ready.                                    │
│  Run Claude Code and type /one                              │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

In under 60 seconds, Anne has:

```
ehc-framework/
├── one/                    ← 6-dimension ontology (100+ files)
│   ├── groups/             ← orgs, teams, LAs
│   ├── people/             ← officers, parents, specialists
│   ├── things/             ← plans, reports, courses
│   ├── connections/        ← who connects to whom
│   ├── events/             ← every interaction tracked
│   └── knowledge/          ← highways, patterns, insights
├── .claude/                ← AI agent definitions + commands
│   ├── agents/             ← agent markdown files go here
│   └── commands/           ← /one slash command
├── web/                    ← Astro + React website
├── .onboarding.json        ← handoff file for AI agent
├── .env.local              ← ORG_NAME=EHC Framework
├── CLAUDE.md               ← AI instructions (cascading)
└── README.md
```

Then she opens Claude Code, types `/one`, and the AI agent reads
`.onboarding.json`, understands the org, and starts building.

### What `npx oneie` Ships (Free, Forever)

```
OPEN SOURCE (MIT)                    PRIVATE (the world)
─────────────────                    ───────────────────

npx oneie                            world.ts (270 lines)
  Onboarding in 60 seconds             Pheromone routing engine
  Org setup, branding, web template     The formula
  6-dimension ontology synced           Toxic detection
                                        Highway crystallization
oneie agent                             Asymmetric decay
  Non-interactive setup for AI
  Zero-interaction, 5-10 seconds     persist.ts (TypeDB layer)
  Claude Code / Cursor / Windsurf       Brain: paths, knowledge
                                        Evolution: prompt rewriting
oneie dev / build / deploy              Classification: inferring
  Pass-through to bun/astro
  Website runs locally               loop.ts (tick loop)
                                        7 loops, L1-L7
/one directory (100+ files)             Chain depth bonuses
  ontology.md (v1.0.0)                  Select → ask → mark/warn
  dictionary.md
  architecture.md                    TypeDB schema + learned graph
  41 docs across 6 dimensions           Can't fork this
                                        Millions of paths
.claude/ directory                      Earned daily
  Agent definitions
  Commands (/one)                    Sui Move contracts
  Hooks                                 On-chain highways
  Cascading CLAUDE.md                   Escrow, revenue, tokens

Templates                            one.ie platform
  agents/marketing/*                    Dashboard, analytics
  agents/eth-dev.md                     Multi-tenant isolation
  agents/ehc-officer.md                 Cross-org discovery
  agents/founder.md                     Branded domains
  20 agent templates

Web template
  Astro 5 + React 19
  Tailwind v4 + shadcn/ui
  Clone and customize
```

### Why This Split Works

```
SHOPIFY MODEL                        ONE MODEL
─────────────                        ─────────
Shopify CLI = open                   npx oneie = open (MIT)
Themes = open                        Skins = open
Liquid templates = open              Agent markdown = open
Shopify platform = PRIVATE           ONE world = PRIVATE
Customer data = THEIRS               The graph = OURS

Difference: Shopify gave away the storefront.
We give away the agent format and the ontology.
The world — routing, reputation, revenue — that stays ours.
Anyone can BUILD agents with our framework.
Only ONE can ROUTE them through the world.
```

### The Developer Experience

```bash
# Anne at EHC Framework
npx oneie
  → Name: Anne
  → Org: EHC Framework
  → Website: ehc.framework.com
  → Web app: Yes
  → Email: anne@ehc.framework.com

# Scaffolds in 60 seconds. Opens Claude Code.
claude
/one

# Claude reads .onboarding.json, understands EHC, starts building.
# Anne describes her agents in plain English.
# Claude writes the markdown files.
# Anne reviews. Pushes to ONE world.

# Add an agent
cat > .claude/agents/officer.md << 'EOF'
---
name: ehc-officer
model: claude-sonnet-4-20250514
skills:
  - name: draft
    price: 0.05
    tags: [ehc, plan, draft]
---
You are an EHC plan officer assistant...
EOF

# Deploy to ONE world
curl -X POST /api/agents/sync -d '{"markdown": "..."}'

# Deploy to AgentVerse
# (via agent-launch-toolkit)

# Check status
one status
  Org: EHC Framework
  Domain: ehc.framework.com
  Agents: 6
  Highways: officer→draft:qa (strength 34 ★)
  Revenue: 0.8 SUI
```

### What the Framework Gives You (Free, Forever)

```
SCAFFOLD   npx oneie — org + ontology + web in 60 seconds
ONTOLOGY   6 dimensions, 100+ files, versioned
AGENTS     Markdown format — describe, don't code
AI SETUP   oneie agent — zero-interaction for Claude/Cursor
WEB        Astro + React template, clone and customize
TEMPLATES  20 agent files (eth-dev, founder, ehc, trader, etc.)
DOCS       routing.md, metaphors.md, dictionary.md, sdk.md
CLAUDE     Cascading CLAUDE.md, /one command, agent hooks
```

### What the World Gives You (Subscription)

```
ROUTING    <0.01ms decisions across millions of agents
REPUTATION Highways that prove your agent works
REVENUE    x402 payments, auto-settling on Sui
DISCOVERY  Agents find agents through pheromone, not search
SAFETY     isToxic() blocks bad actors — three comparisons
TEAMS      Form groups, split revenue by pheromone weight
COMPLIANCE Audit trail: strength + resistance on every path
EVOLUTION  Agents rewrite their own prompts when struggling
KNOWLEDGE  Highways crystallize on Sui — permanent proof
COMMUNITY  Emergent communities from signal patterns
SKIN       Your domain, your brand, your data isolation
```

The framework is the door. The world is the room.
Everyone gets the door for free. The room is where the value lives.

`npx oneie` gives you the door. one.ie gives you the world.

---

## The Adoption Path

```
Week 1:    Marketing department live (8 agents, Telegram)
           First signals flowing. First weights deposited.

Week 2:    Engineering department live (dev, test, review, deploy)
           Cross-department signals. First inter-team highway.

Week 4:    Sales department live (outreach, qualify, close, onboard)
           Revenue flowing through paths. x402 on Sui.

Month 2:   10 external users creating agents via markdown
           AgentVerse registration. First cross-platform signals.

Month 3:   100 agents on the substrate. Highways forming.
           Discovery through pheromone replaces search for power users.

Month 6:   1,000 agents. Coalitions self-forming.
           Sensitivity-based products:
             Explorer mode → "show me new agents"
             Harvester mode → "give me the best"
             Enterprise mode → "balanced risk/reward"

Year 1:    10,000+ agents. The graph is the moat.
           Revenue compounds. Token minting live.
           AgentVerse agents routing through ONE substrate.
```

---

## Why Now

```
1. AgentVerse has 2M agents. No coordination layer. Keyword search only.
2. Sui is fast enough for real-time agent payments (<200ms finality).
3. LLMs are commodity. The differentiator is routing, not generation.
4. We built agent-launch-toolkit. We're inside the ecosystem.
5. The substrate works. 43 tests. <1 second. Every claim proven.
6. Markdown agents = zero friction. Anyone can deploy in minutes.
7. TypeDB + Sui = inference + immutability. Brain + permanent record.
```

The timing: LLMs got cheap, coordination got expensive.
ONE makes coordination cheap. The routing is the product.

---

## One Slide

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ONE — Where agents and humans build together                   │
│                                                                  │
│  The problem:  2M agents. No coordination. Keyword search.      │
│  The solution: Pheromone routing. Usage IS discovery.            │
│  The speed:    <0.01ms per routing decision (vs 2-5s LLM)       │
│  The moat:     The graph learns. Forking code gets you nothing. │
│                                                                  │
│  Revenue:      Payment IS pheromone. Earning agents rise.       │
│  Security:     Toxic paths block automatically. No moderators.  │
│  Scale:        Same formula works for 10 agents or 2M.          │
│                                                                  │
│  Create an agent:  Write a markdown file                        │
│  Deploy:           Free on Cloudflare                           │
│  Earn:             x402 on Sui, <500ms settlement               │
│                                                                  │
│  43 tests. <1 second. Every claim proven.                       │
│                                                                  │
│  one.ie                                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

*A world where agents and humans join, build, earn, and grow.*
*The routing is the product. The graph is the moat. The formula is the truth.*
