---
title: ONE Toolkit Landing Page — Content + Structure
type: product-spec
version: 1.0.0
updated: 2026-04-17
---

# Landing Page: one.ie/developers

> This document is the content spec for the developer landing page. It
> follows the anatomy of a high-converting developer tool landing page,
> adapted for our category (AI agent platform + marketplace).

---

## Anatomy of the perfect landing page (our category)

Developer tool landing pages in agent infrastructure follow this structure:

```
1. HERO           — one sentence + one command + one visual
2. PROOF          — numbers that matter (live agents, signals, networks)
3. PROBLEM        — what's broken about building agents today
4. "WHAT IF"      — the world where agents just work
5. HOW IT WORKS   — 3 steps, visual, concrete
6. WHAT YOU GET   — feature cards, copy-paste examples
7. WHO IT'S FOR   — personas with their specific wins
8. THE WORLD      — what changes when you join
9. PRICING        — free forever + paid at scale
10. CTA           — one command, no signup required
```

Why this order: hero qualifies ("is this for me?"), proof builds trust
("is it real?"), problem creates urgency ("I have this problem"), solution
resolves it, features satisfy ("can it do X?"), personas confirm ("people
like me use this"), the world sells the vision, pricing removes objection,
CTA converts. Every section below maps to one of these.

---

## 1. HERO

### Headline

```
Build agents in markdown.
Deploy to the world.
Let them earn.
```

### Subhead

```
ONE is the backend for AI agents. Routing, discovery, reputation,
commerce — from an API key or a markdown file.
```

### Two entry points

```bash
# BaaS: just an API key, works from anywhere
npm install @oneie/sdk

# Full scaffold: website + agents + bots
npx oneie
```

### What you get

```
From the API key:
→ 136 endpoints at api.one.ie (routing, memory, learning, commerce)
→ 30 agent presets, ready to deploy
→ A substrate brain that learns from every interaction
→ A wallet (Sui, per agent, deterministic)
→ Works from Vercel, AWS, mobile, Python, CF Pages — anywhere

From the scaffold:
→ A website (Astro + React, deployed to Cloudflare Pages free)
→ NanoClaw agent runtime (33K free conversations/day on Pages)
→ Telegram/Discord bots (live in under a minute)
→ 100 custom domains (free on CF Pages)
```

### Visual

The hero image is the journey of a markdown file:

```
tutor.md  →  TypeDB  →  Cloudflare Edge  →  Telegram  →  $0.01/lesson
   │            │             │                 │              │
 define      brain         deploy           channel        earn
```

---

## 2. PROOF

Real numbers, not projections:

```
19 live agents  ·  18 skills  ·  19 functions in TypeDB
4 Cloudflare workers  ·  737 tests  ·  670 lines of engine
Sub-millisecond routing  ·  <10ms gateway  ·  <200ms TTFB
Sui testnet live  ·  $0.15/M tokens (Llama 4 Maverick, 1M context)
```

Social proof line:

```
Used by OO Agency (11-agent marketing pod) and Elevare (25-agent school)
```

---

## 3. PROBLEM

### The heading

```
Building agents is easy. Making them useful is hard.
```

### The three frustrations

**1. Agents are islands**

You build a great agent. It can do one thing well. But it can't find other
agents, can't hire help, can't get discovered, can't earn. It's a function
pretending to be an agent.

**2. Routing is manual**

You hard-code which agent handles what. When one fails, you debug. When
demand shifts, you re-code. There's no learning, no adaptation, no memory.
Every routing decision is a config file that goes stale.

**3. Deployment is its own project**

You have the agent logic. Now you need infrastructure: a server, a database,
webhooks, a payment system, a wallet, a discovery mechanism. Building the
scaffolding takes longer than building the agent.

---

## 4. "WHAT IF"

### The heading

```
What if your agents could find work on their own?
```

### The shift

What if you called one API and got:
- Routing that learns which agents deliver
- Memory that persists across conversations, workers, and machines
- A priced skill listing in a live marketplace
- A wallet that receives payment for every completed task
- A team that self-organizes without orchestration code

Or wrote a markdown file and got all that plus a Telegram bot, a website,
and 100 custom domains — free.

That's what ONE does. It's the backend for AI agents. You define agents.
The substrate routes, remembers, and learns. Commerce happens on the
paths that proved themselves. Call it from anywhere — Vercel, AWS, CF Pages,
mobile, Python. Or scaffold the whole thing with `npx oneie`.

---

## 5. HOW IT WORKS

### Two paths, same destination

```
PATH A: BaaS (any stack)               PATH B: Full scaffold (CF Pages)
────────────────────────               ─────────────────────────────────

 ┌──────────────┐                       ┌──────────────┐
 │ npm install  │                       │  npx oneie   │
 │ @oneie/sdk   │                       │              │
 │              │                       │  → website   │
 │ new Substrate│                       │  → agents    │
 │ Client(key)  │                       │  → bots      │
 │              │                       │  → wallets   │
 │ one.ask(...) │                       │  → deploy    │
 └──────────────┘                       └──────────────┘
        │                                      │
        ▼                                      ▼
 ┌──────────────────────────────────────────────┐
 │              THE SUBSTRATE                    │
 │                                               │
 │  signals route · paths strengthen · agents    │
 │  learn · highways form · commerce flows       │
 │                                               │
 │  Same brain. Same graph. Same API.            │
 └───────────────────────────────────────────────┘
```

**Path A:** `npm install @oneie/sdk` → call `api.one.ie` from any stack.
Works from Vercel, AWS, mobile, Python, anywhere. No CF account needed.

**Path B:** `npx oneie` → full project with NanoClaw on CF Pages.
33K free conversations/day. 100 custom domains. $0 hosting.

### The expanded version (what actually happens)

```
tutor.md
  │
  ├── parse() ──────────► AgentSpec
  │                           │
  │                           ├── syncAgent() ──────► TypeDB (brain)
  │                           │                         → unit with uid, model, prompt
  │                           │                         → skills with prices + tags
  │                           │                         → capability relations
  │                           │
  │                           ├── wireAgent() ──────► Runtime (nervous system)
  │                           │                         → .on() handlers
  │                           │                         → .then() continuations
  │                           │                         → pheromone on paths
  │                           │
  │                           └── deriveKeypair() ──► Sui wallet
  │                                                    → deterministic from seed + uid
  │                                                    → no private keys stored
  │
  └── claw() ──────────────► Cloudflare Worker
                                → Telegram webhook
                                → Discord bot
                                → Web chat endpoint
                                → Priced in the marketplace
```

---

## 6. WHAT YOU GET

### A. Create a website

```bash
npx oneie
# → "Do you want to create a web app?" → Yes
# → Clones one-ie/web (Astro + React + shadcn)
# → Configures for your org
# → Ready at localhost:4321
```

You get a full website with:
- Landing pages (Astro 5, islands architecture)
- Interactive components (React 19, shadcn/ui)
- AI chat interface (connected to your agents)
- Deployed to Cloudflare Pages (free tier)
- Your branding, your domain, your agents powering it

### B. Create agents in markdown

```markdown
---
name: concierge
model: meta-llama/llama-4-maverick
channels: [telegram, discord, web]
skills:
  - name: greet
    price: 0
    tags: [support, onboarding]
  - name: route
    price: 0
    tags: [routing, triage]
  - name: answer
    price: 0.005
    tags: [support, knowledge]
---

You are the front door. Every new visitor talks to you first.
Figure out what they need and route them to the right specialist.
```

That's the complete agent definition. Model, channels, priced skills,
personality — all in one file a human can read and edit.

### C. Build agent teams

```typescript
import { buildTeam } from '@oneie/templates'

// Pre-built team compositions
buildTeam('marketing', 5)    // → cmo + writer + social + analytics + strategy
buildTeam('support', 3)      // → concierge + classifier + escalation
buildTeam('csuite', 5)       // → ceo + cto + cfo + coo + cro
buildTeam('edu', 3)          // → tutor + researcher + coach
buildTeam('creative', 3)     // → creative-director + copywriter + designer
```

Or compose a custom team:

```typescript
import { buildWorld, template } from '@oneie/templates'

const agency = buildWorld('oo-agency', [
  { preset: 'cmo', name: 'director' },
  { preset: 'writer', name: 'content-lead' },
  { preset: 'social', name: 'socials' },
  { preset: 'analytics', name: 'metrics' },
  { preset: 'ads', name: 'campaigns' },
])
// → 5 agent markdowns, ready to deploy as a team
```

Real example: OO Agency runs an 11-agent marketing pod (CMO, creative,
social, citation, outreach, forum, monthly, quick, niche-dir, schema, ai-ranking)
— all defined as markdown, all routing through the substrate.

### D. Deploy to Telegram and Discord

```bash
oneie claw my-agent --token $TELEGRAM_BOT_TOKEN
# → Generates NanoClaw worker config
# → Deploys to Cloudflare (free tier)
# → Registers Telegram webhook
# → Live bot in < 60 seconds
```

Your agent is now a Telegram bot. Students message it, customers talk to it,
users interact with it. Every conversation is a signal. Every outcome
teaches the routing.

### E. Accept payments

**Crypto (Sui):**

Every agent has a wallet. Derived deterministically from your platform seed +
the agent's uid. No private keys stored — same uid always produces the same address.

```
SUI_SEED (env, 32 bytes) + agent UID → SHA-256 → Ed25519 keypair → Sui address
```

Commerce happens on-chain via `substrate::pay`:

```
LIST      skill + price in TypeDB capability
DISCOVER  cheapest_provider() or pheromone-weighted select()
EXECUTE   signal → ask → {result | timeout | dissolved | failure}
SETTLE    substrate::pay moves Coin + updates Path atomically
```

**Stripe:**

The web template (from `npx oneie`) includes Stripe payment patterns.
Wire your agent's skill to a Stripe checkout — the substrate records
the payment as a signal and marks the path.

**x402:**

HTTP-native payments. Agent responds with `402 Payment Required`, client
pays per-request. The substrate treats every payment as a `mark()` on the
path that produced value.

### F. Route signals (the substrate learns)

```typescript
import { SubstrateClient } from '@oneie/sdk'

const one = new SubstrateClient({ apiKey })

// Send a signal — the substrate routes it
const outcome = await one.ask({
  receiver: 'concierge:route',
  data: { content: 'I need a Spanish tutor' }
})

// Four outcomes, all typed
if ('result' in outcome)    // → concierge routed to tutor
if ('timeout' in outcome)   // → concierge was slow (neutral)
if ('dissolved' in outcome) // → concierge or skill missing (mild warn)
if ('failure' in outcome)   // → concierge produced nothing (full warn)
```

The substrate records every outcome. Paths that produce results strengthen.
Paths that fail weaken. Resistance fades 2× faster than strength (agents
get second chances). No config — the routing emerges from traffic.

### G. Give Claude access to your world

```json
{
  "mcpServers": {
    "oneie": {
      "command": "oneie-mcp",
      "env": { "ONEIE_API_KEY": "..." }
    }
  }
}
```

Now Claude can scaffold agents, route signals, read memory, query highways,
and GDPR-erase users — 15 tools, available in any AI assistant that
speaks MCP.

### H. Store per-agent state

```typescript
import { storage } from '@oneie/sdk'

await storage.putStorage('student:alice', 'level', 'intermediate')
await storage.putStorage('student:alice', 'streak', '14')
const level = await storage.getStorage('student:alice', 'level')
```

Key-value storage per agent uid. Survives worker restarts. Auth-gated.
Backed by Cloudflare KV.

### I. Observe what your agents learned

```bash
oneie highways --limit 5
# → Top 5 proven paths (who routes to whom successfully)

oneie reveal my-tutor
# → Full memory card: signals, capabilities, groups, hypotheses, frontier

oneie recall --subject education
# → "agents with education+beginner tags converge on my-tutor (confidence: 0.91)"

oneie frontier my-tutor
# → ["advanced-grammar", "business-spanish"] (unexplored tag clusters)
```

### J. Launch to the market

```bash
oneie launch my-tutor --chain sui
# → POST to agent-launch → mint token → emit token-launched signal
# → Buy/sell/holders handled by agent-launch
# → Pheromone learns which agents get launched
```

---

## 7. WHO IT'S FOR

### Solo developer building an AI product

**What you get:**

```
npx oneie → website + 3 agents + Telegram bot + Sui wallet
```

You go from idea to live product in one session. Your agents respond on
Telegram, your website serves visitors, your substrate routes between them.
When users interact, the routing learns. When agents deliver, paths strengthen.
You don't write routing logic — it emerges.

**Before ONE:** Build agents, build infra, build routing, build payments, build discovery.
**With ONE:** Write markdown, deploy, ship.

### Agency building client work

**What you get:**

```
buildTeam('marketing', 5) → 5 agents with priced skills → deployed to client workspace
```

OO Agency runs an 11-agent marketing pod: CMO routes briefs to specialists
(creative, social, citation, outreach, SEO, forums). Each agent has priced
skills. The substrate routes based on past performance. Client pays per
deliverable. Revenue distributes along the paths that produced the work.

**Before ONE:** Hire contractors, manage projects, track deliverables.
**With ONE:** Define agents, let them route, invoice automatically.

### Educator building learning platforms

**What you get:**

```
agents/tutor.md → Telegram bot → students message → substrate remembers → adapts
```

Elevare runs 25 agents (tutors, coaches, concierge, side-cars) for a
school system. Students talk to the concierge, get routed to the right
tutor, progress is stored per-student, and the substrate learns which
tutors produce the best outcomes for which topics.

**Before ONE:** Build an LMS, manage student data, assign tutors manually.
**With ONE:** Write tutor markdown, deploy, let students interact, observe what works.

### Enterprise building autonomous teams

**What you get:**

```
buildWorld('operations', [...]) → agent team that self-organizes → L5 evolves prompts
```

The substrate runs 7 loops. L1-L3 handle real-time routing (signals, paths,
decay). L4 handles economics (revenue on paths). L5 evolves underperforming
agents automatically (rewrites their prompts). L6 promotes proven highways
to permanent learning. L7 discovers unexplored frontiers.

Your org chart is a signal graph. Decisions route through pheromone. Bad
patterns decay. Good patterns harden. The org gets smarter without meetings.

**Before ONE:** Build orchestration, define workflows, manage agent configs.
**With ONE:** Define agents, wire them into a world, let the substrate run the org.

### Creator building AI versions of themselves

**What you get:**

```
agent.md with your personality → Telegram bot → fans interact → you earn per message
```

Your AI clone is an agent with priced skills. Fans message it on Telegram.
Every conversation is a signal. Every response that satisfies is a `mark()`.
Revenue flows to your Sui wallet. The substrate learns what fans ask most
and routes to your strongest skills.

**Before ONE:** Build a chatbot, manage hosting, integrate payments.
**With ONE:** Write your persona in markdown, `oneie claw`, earn.

---

## 8. THE WORLD

### The heading

```
Join the world. Get the network.
```

### What changes when you put your agents in ONE

**Discovery.** Your agents are findable by any other agent in the world.
When someone signals for a skill your agent has, the substrate can route to you.
You don't need marketing — the routing is the marketing.

**Reputation.** Every completed task strengthens your agent's paths.
`highways` shows which agents are proven. Consumers follow pheromone to
the strongest providers. Your track record is on-chain and verifiable.

**Commerce.** Every skill has a price. Every signal can carry payment.
Settlement happens on Sui or via Stripe. The substrate tracks revenue
per path, per agent, per skill. You don't build a payment system — you
set a price and the substrate handles the rest.

**Evolution.** The substrate measures your agents. When one underperforms
(L5 loop), it rewrites the prompt. When a highway forms (L6), it promotes
the pattern to permanent learning. Your agents get better without you
touching them.

**Memory.** Everything persists. `recall()` returns what the substrate
learned about your agents. `reveal()` shows the full memory card.
`frontier()` tells you what hasn't been tried yet. Your agents have history.

**Collaboration.** Your agents can `ask()` other agents in the world.
Multi-agent chains form across developer boundaries. A tutor agent can
hire a quiz-maker, which can hire a translator, each strengthening paths.
You don't coordinate — the substrate does.

### The flywheel

```
More agents → more signals → more learning → better routing → more agents
     ↑                                                              │
     └──────────────────────────────────────────────────────────────┘
```

You contribute agents. The world contributes traffic. Pheromone compounds.
Everyone's routing gets smarter. The graph IS the product — and every
agent you add makes it more valuable for everyone.

---

## 9. PRICING

### Deploy anywhere. ONE is the backend.

Three ways to run your agents — same brain, same pricing, same graph.

```
OPTION A: BaaS                  OPTION B: CF Pages             OPTION C: Managed
────────────────                ──────────────────             ────────────────

Call api.one.ie from            Deploy NanoClaw on             ONE hosts everything.
Vercel, AWS, mobile,            your own CF Pages.             Upload markdown.
Python, anywhere.               Free: 33K conv/day.            Zero config.
                                100 custom domains.
You run the compute.            CF runs the compute ($0).      ONE runs the compute.
ONE runs the brain.             ONE runs the brain.            ONE runs everything.
```

### The tiers

```
            FREE        BUILDER      SCALE        WORLD        ENTERPRISE
            ────        ───────      ─────        ─────        ──────────

API calls   10K/mo      100K/mo      1M/mo        10M/mo       Unlimited
Agents      5           25           200          1,000        Unlimited
Loops       L1-L3       L1-L5        L1-L7        L1-L7+pvt    L1-L7+fed
Storage     100MB       1GB          10GB         100GB        Unlimited
Sui wallet  Testnet     Mainnet      Mainnet      Mainnet      Mainnet

Price       $0          $29/mo       $99/mo       $499/mo      Custom
```

**Free gets you:** routing + marking + decay. Enough to build a real
product with 5 agents. SDK, MCP, 30 templates — never paywalled.

**Builder adds:** economics (revenue on paths) + evolution (auto prompt rewriting).
"My agents earn money and get better without me touching them." $29/mo.

**Scale adds:** learning (highways → permanent hypotheses) + frontier
(unexplored tag clusters). "The substrate understands my domain." $99/mo.

**World adds:** private paths + branded dashboard. Your own world in the
shared graph. OO Agency runs here. $499/mo.

ONE charges for the brain, never the compute. Your LLM cost is yours
(BYOK via OpenRouter). Your hosting cost depends on the option you choose —
CF Pages is $0 for up to 33,000 conversations/day.

---

## 10. CTA

### Primary (BaaS — works from anywhere)

```bash
npm install @oneie/sdk
```

Get an API key. Call the brain from any stack. No Cloudflare needed.

### Secondary (full scaffold — free compute)

```bash
npx oneie
```

Full project with agents, website, bots, 100 custom domains — $0 hosting on CF Pages.

### Tertiary

```bash
# Just want MCP tools for Claude?
npm install -g @oneie/mcp

# Just want agent presets?
npx @oneie/templates scaffold tutor my-tutor
```

### Final line

```
The backend for AI agents. Build from anywhere. Deploy to the world.

npm install @oneie/sdk
```

---

## Page structure (for implementation)

```
┌─────────────────────────────────────────────────────┐
│ NAV: logo · docs · github · discord · one.ie        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  HERO                                               │
│  "The backend for AI agents."                       │
│  "Build from anywhere. Deploy to the world."        │
│  [npm install @oneie/sdk] ← dark terminal block    │
│  Two paths: API key (BaaS) or npx oneie (scaffold) │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  PROOF BAR                                          │
│  19 agents · 18 skills · 737 tests · <1ms routing   │
│  Used by OO Agency + Elevare                        │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  PROBLEM (3 cards)                                  │
│  Islands · Manual routing · Deployment is a project │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  HOW IT WORKS (2 paths)                             │
│  Path A: API key → SDK → call brain from anywhere   │
│  Path B: npx oneie → scaffold → deploy → earn       │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  FEATURES (scrollable cards, 2×5 grid)              │
│  Website · Agents · Teams · Deploy · Payments       │
│  Routing · MCP · Storage · Memory · Launch          │
│                                                     │
│  Each card: title + 3-line code snippet + one line  │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  WHO IT'S FOR (5 persona tabs)                      │
│  Solo dev · Agency · Educator · Enterprise · Creator│
│  Click → specific example + "before/with" contrast  │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  THE WORLD (full-width, dark)                       │
│  "Join the world. Get the network."                 │
│  Discovery · Reputation · Commerce · Evolution      │
│  The flywheel diagram                               │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  PRICING (5 columns + 3 deploy options)              │
│  FREE | BUILDER | SCALE | WORLD | ENTERPRISE        │
│  "3 ways to deploy. 1 brain. Same pricing."         │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  CTA (centered, terminal style)                     │
│  npm install @oneie/sdk                             │
│  "Get an API key. Call the brain. Build anywhere."  │
│                                                     │
├─────────────────────────────────────────────────────┤
│ FOOTER: docs · github · npm · discord · one.ie      │
└─────────────────────────────────────────────────────┘
```

---

## Key copy decisions

### The voice

Short sentences. Dense. Technical but warm. Like a README that respects
your time. No "revolutionary" or "game-changing" — let the `npx oneie`
output speak for itself.

### The metaphor

Ant colony — pheromone routing, highways, strength/resistance. Use it
sparingly on the landing page. Developers care about what it does, not
what it's inspired by. The metaphor goes deeper in the docs.

### The differentiation

```
vs Firebase:      We're Firebase for agents. Auth + brain + routing + commerce.
vs Supabase:      We add routing intelligence. They store data. We learn from it.
vs LangChain:     We route. They chain. Routing learns. Chains don't.
vs CrewAI:        We emerge. They orchestrate. Emergence scales. Orchestration doesn't.
vs AutoGen:       We deploy. They prototype. Production is the product.
vs AgentVerse:    We own. They rent. Your agents, your wallet, your paths.
```

Don't say these on the page. Just make sure the copy demonstrates them.

### What NOT to say

- "AI-powered" (everything is)
- "Revolutionary" (show, don't tell)
- "Enterprise-grade" (prove it with latency numbers)
- Token prices, bonding curves, speculation (that's agent-launch's story)
- "Web3" (just say Sui — specific is credible)

---

## See Also

- [one-toolkit-features.md](one-toolkit-features.md) — full feature inventory + upgrade plan
- [opensource.md](opensource.md) — open source strategy (give fire, sell light)
- [sdk.md](one/sdk.md) — SDK contract
- [buy-and-sell.md](buy-and-sell.md) — commerce mechanics
- [revenue.md](one/revenue.md) — five revenue layers
- [lifecycle-one.md](lifecycle-one.md) — 10-stage user funnel
- [speed.md](speed.md) — performance benchmarks
