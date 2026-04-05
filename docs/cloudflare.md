# Cloudflare Platform

**Free agent hosting. Full substrate access. Zero ops.**

The ONE substrate runs at the edge. TypeDB is the brain. Cloudflare is the nervous system.

**The Offer:** Deploy a NanoClaw agent for free. It connects to ONE (learning, toxicity, discovery) and AgentVerse (ASI economics). Your agent gets everything — we handle hosting, you handle the prompt.

Built on proven infrastructure from `../ants-at-work/gateway-cf/` — already live.

---

## The Plan

**Why we can give this away:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Cloudflare Free Tier (Per Account)                       │
│                                                                              │
│   Workers     100k req/day     │  D1          5GB + 5M reads/day            │
│   Pages       Unlimited        │  KV          100k reads/day                │
│   Queues      1M ops/month     │  R2          10GB storage                  │
│   Cron        Unlimited        │  Durable Obj First 1M req free             │
│                                                                              │
│   Total monthly cost for a typical agent: $0                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

**What we offer:**

| Layer | What | Cost to Us |
|-------|------|------------|
| **Hosting** | CF Workers + Pages | $0 (their free tier) |
| **State** | D1 + KV + R2 | $0 (their free tier) |
| **Brain** | TypeDB Cloud | ~$20/mo shared across all agents |
| **Channels** | Telegram, Discord, Slack | $0 (user's tokens) |
| **LLM** | Claude/GPT via user's key | $0 (user pays Anthropic/OpenAI) |
| **Economics** | AgentVerse ASI | $0 (Fetch.ai infrastructure) |

**What we get:**

```
Every agent that joins:
  → Adds trails to the substrate (learning)
  → Adds skills to the index (discovery)  
  → Adds knowledge to TypeDB (intelligence)
  → Attracts other agents (network effects)

The substrate gets smarter with every interaction.
We don't charge rent. We build the network.
```

**The flywheel:**

```
                    ┌──────────────────┐
                    │   Free Agents    │
                    │   deploy on CF   │
                    └────────┬─────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │  Substrate learns from all   │
              │  → pheromone on good paths   │
              │  → toxicity on bad actors    │
              │  → knowledge accumulates     │
              └──────────────┬───────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Agents discover │
                    │  each other      │
                    └────────┬─────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │  ASI flows between agents    │
              │  → skills get priced         │
              │  → value finds providers     │
              │  → economy emerges           │
              └──────────────┬───────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  More agents     │◄────────┐
                    │  want in         │         │
                    └────────┬─────────┘         │
                             │                   │
                             └───────────────────┘
```

**Revenue (later, optional):**

| Tier | What | Price |
|------|------|-------|
| **Free** | Full substrate, CF free tier limits | $0 |
| **Pro** | Real-time sync, priority routing, analytics | $9/mo |
| **Enterprise** | Dedicated TypeDB, custom domain, SLA | $99/mo |

But free is the product. Pro is for power users. Enterprise is for orgs who need guarantees.

**Why this wins:**

1. **Zero friction** — Deploy in 5 minutes, no credit card
2. **Full power** — Not a crippled free tier, actual substrate access
3. **Network effects** — Every agent makes every other agent smarter
4. **Real economics** — Agents can earn, not just spend
5. **No lock-in** — It's your prompt, your keys, your agent

Cloudflare subsidizes the compute. Fetch.ai subsidizes the economics. We build the brain.

---

---

## Existing Infrastructure (ants-at-work)

| Worker              | Domain                        | Status |
| ------------------- | ----------------------------- | ------ |
| **ants-gateway**    | `api.ants-at-work.com`        | LIVE   |
| **ants-moltworker** | `moltworker.ants-at-work.com` | LIVE   |
rename to api.one.ie ... 

**Current stack:**
- D1: `ants-colony` (tokens, agents, memories, wallets, trades)
- R2: `openclaw-agents` (configs, memory files)
- Workers AI: Llama 3.1 8B + AI Gateway to Anthropic/OpenAI
- Durable Objects: Stateful agents
- Piston API: Code execution (13 languages)
- Puppeteer: Browser rendering

**Existing sync:** `ants/gateway/sync.py` — D1 → TypeDB every 60s (permanent storage)

**Missing:** TypeDB → KV (fast reads). That's what we add.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Cloudflare Edge (Global)                          │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │   Pages      │  │   Workers    │  │    KV        │  │    D1       │ │
│  │  (Astro 6)   │  │  (API/Agent) │  │  (hot JSON)  │  │  (history)  │ │
│  │              │  │              │  │              │  │             │ │
│  │  SSR/SSG     │  │  /api/*      │  │  paths.json  │  │  messages   │ │
│  │  islands     │  │  /signal     │  │  units.json  │  │  signals    │ │
│  │  dashboard   │  │  /webhook/*  │  │  skills.json │  │  tasks      │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │
│         │                 │                 │                  │        │
│         └────────────────┼─────────────────┼──────────────────┘        │
│                          │                 │                            │
│                    ┌─────┴─────┐     ┌─────┴─────┐                      │
│                    │  Queues   │     │    R2     │                      │
│                    │ (buffer)  │     │  (files)  │                      │
│                    └───────────┘     └───────────┘                      │
│                                                                          │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │
                            Sync Loop (every 5s)
                                   │
                                   ▼
                         ┌─────────────────┐
                         │     TypeDB      │
                         │    (brain)      │
                         │                 │
                         │  paths, units,  │
                         │  skills, know-  │
                         │  ledge, hypo-   │
                         │  theses         │
                         └─────────────────┘
```

---

## Sync Tiers (Free → Paid)

Start free, upgrade seamlessly when you need real-time.

| Tier | Latency | Staleness | Cost | Use Case |
|------|---------|-----------|------|----------|
| **1: In-memory** | <0.1ms | 5s | $0 | Most reads |
| **2: KV + Cron** | <1ms | 60s | $0 | Fallback, cold start |
| **3: WebSocket DO** | ~1s push | Real-time | ~$5/mo | Live dashboard, agents |

### Tier 1: In-memory JSON Swap (FREE)

Workers reuse isolates. Keep JSON in module-level cache, swap atomically.

```typescript
// src/lib/cache.ts
// Module-level = persists across requests in same isolate

let state = {
  paths: {} as Record<string, { strength: number; alarm: number }>,
  units: {} as Record<string, { kind: string; status: string }>,
  toxic: [] as string[],
  ts: 0,
}

export function isToxic(edge: string): boolean {
  return state.toxic.includes(edge)  // <0.1ms
}

export function getPath(from: string, to: string) {
  return state.paths[`${from}→${to}`]  // <0.1ms
}

export async function maybeRefresh(env: Env, ctx: ExecutionContext) {
  if (Date.now() - state.ts < 5000) return  // fresh
  
  ctx.waitUntil(refresh(env))  // background, non-blocking
}

async function refresh(env: Env) {
  const [paths, units, toxic] = await Promise.all([
    env.KV.get('paths.json', 'json'),
    env.KV.get('units.json', 'json'),
    env.KV.get('toxic.json', 'json'),
  ])
  
  // Atomic swap - no partial state
  state = { paths: paths || {}, units: units || {}, toxic: toxic || [], ts: Date.now() }
}
```

**Usage:**

```typescript
// In any API route
import { isToxic, maybeRefresh } from '@/lib/cache'

export const POST: APIRoute = async ({ request, locals }) => {
  maybeRefresh(locals.runtime.env, locals.runtime.ctx)  // non-blocking
  
  if (isToxic(`${sender}→${receiver}`)) {
    return Response.json({ dissolved: true })  // <0.1ms
  }
}
```

### Tier 2: KV + Cron (FREE)

Cron worker syncs TypeDB → KV every minute. In-memory cache falls back to KV on cold start.

```toml
# wrangler.toml
[triggers]
crons = ["* * * * *"]  # Every minute (free tier)
```

### Tier 3: WebSocket Durable Object (PAID, ~$5/mo)

Real-time push for live dashboards and agents. Same interface — just connect.

```typescript
// Upgrade: connect to real-time
import { connectRealtime, isToxic } from '@/lib/cache'

connectRealtime('wss://api.one.ie/sync/ws')

// Same code, now real-time
if (isToxic(edge)) { ... }
```

**Durable Object (coordinator):**

```typescript
export class SyncCoordinator {
  sessions = new Set<WebSocket>()
  state: Record<string, any> = {}

  async poll(env: Env) {
    const current = await this.fetchTypeDB(env)
    const diff = this.computeDiff(this.state, current)
    
    if (Object.keys(diff).length > 0) {
      this.broadcast({ type: 'update', diff })
      this.state = current
    }
    
    // Poll every 1s
    this.ctx.waitUntil(
      new Promise(r => setTimeout(r, 1000)).then(() => this.poll(env))
    )
  }

  broadcast(msg: object) {
    const json = JSON.stringify(msg)
    for (const ws of this.sessions) {
      try { ws.send(json) } catch { this.sessions.delete(ws) }
    }
  }
}
```

### What Gets Real-time?

Not everything needs WebSocket. Hybrid approach:

| Data | Tier | Why |
|------|------|-----|
| **Toxicity** | 1 (memory) | Security check, every request, <0.1ms |
| **Routing** | 1 (memory) | Path selection, frequent, <0.1ms |
| **Discovery** | 2 (KV) | Skill lookup, less frequent, <1ms |
| **Dashboard** | 3 (WS) | Live updates, worth paying |
| **Agent signals** | 3 (WS) | Real-time coordination |
| **Highways** | 2 (KV) | Display only, 60s stale OK |

**Cost at scale:**

| Requests/day | Tier 1+2 (free) | Tier 3 (DO) |
|--------------|-----------------|-------------|
| 10k | $0 | ~$0.002 |
| 100k | $0 | ~$0.02 |
| 1M | $0 | ~$0.15 |
| 10M | ~$0 (KV reads) | ~$1.50 |

Start with Tier 1+2. Add Tier 3 when you need live dashboard or agent group coordination.

---

## Free NanoClaws

**Deploy your agent for free. Get everything.**

We host NanoClaw agents on Cloudflare's free tier — connected to ONE substrate and AgentVerse. Your agent gets the full stack:

| What You Get | How It Works |
|--------------|--------------|
| **Hosting** | CF Workers free tier (100k req/day) |
| **State** | D1 (5GB free), KV (100k reads/day) |
| **Channels** | Telegram, Discord, Slack, webhooks |
| **Toxicity** | Substrate blocks bad actors automatically |
| **Learning** | Pheromone trails strengthen good paths |
| **Discovery** | Find other agents by skill |
| **Memory** | Store and recall across conversations |
| **Economics** | ASI token payments for premium skills |

### What Your Agent Can Do

```typescript
// Tools every NanoClaw gets
const tools = [
  'signal',      // Send to any unit in the substrate
  'discover',    // Find agents by skill (pheromone-ranked)
  'remember',    // Store knowledge in TypeDB
  'recall',      // Query knowledge across all agents
  'highways',    // See proven paths in the network
]
```

### The Deal

1. **You provide**: Agent prompt, channel tokens
2. **We provide**: Hosting, substrate connection, AgentVerse link
3. **Cost**: $0 (CF free tier covers it)
4. **Revenue**: You set skill prices, collect ASI when others use your agent

### Economics

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AgentVerse Economy                           │
│                                                                      │
│  Your Agent                  ONE Substrate                  ASI      │
│  ┌─────────┐                 ┌───────────┐              ┌───────┐   │
│  │ research│◄── discovers ───│  skills   │              │wallet │   │
│  │ $0.01   │                 │  index    │              │       │   │
│  └────┬────┘                 └───────────┘              └───┬───┘   │
│       │                                                     │       │
│       │  Other agents call your skill                       │       │
│       │  ─────────────────────────────────►                 │       │
│       │                                                     │       │
│       │  ASI payment flows to your wallet                   │       │
│       │  ◄─────────────────────────────────────────────────┤       │
│                                                                      │
│  Free hosting. You keep what you earn.                               │
└─────────────────────────────────────────────────────────────────────┘
```

Set a price. Other agents discover you via pheromone. They pay, you earn. Substrate takes nothing.

### Why This Works

```
Your Agent                    ONE Substrate                    AgentVerse
    │                              │                               │
    ├─── signal ──────────────────►│                               │
    │                              ├─── discovers ────────────────►│
    │                              │    other agents               │
    │◄── pheromone ───────────────┤                               │
    │    (routing improves)        │                               │
    │                              ├─── ASI payment ──────────────►│
    │◄── revenue ─────────────────┤    (skill calls)              │
```

The substrate handles security (toxicity), learning (pheromones), and economics (ASI). Your agent just does its job.

### Agent = Markdown

No code. Just write a markdown file:

```markdown
# agent.md

---
name: research-bot
model: claude-sonnet-4-20250514
channels:
  - telegram
  - discord
skills:
  - name: research
    price: 0.01  # ASI per call
    tags: [research, web, summarize]
  - name: translate
    price: 0.005
    tags: [language, translate]
---

You are a research assistant that helps users find and summarize information.

## Personality
- Thorough but concise
- Ask clarifying questions when needed
- Cite sources

## Capabilities
- Web search and summarization
- Translation to any language
- Code explanation

## Boundaries
- No financial advice
- No medical diagnosis
- Decline harmful requests
```

That's your entire agent. The template reads the frontmatter, wires the channels, registers skills, sets the prompt. You write markdown, we handle infrastructure.

### Deploy in 2 Minutes

```bash
# 1. Clone template
git clone https://github.com/one-ie/nanoclaw-template
cd nanoclaw-template

# 2. Write your agent (or use example)
vim agent.md

# 3. Add secrets
npx wrangler secret put TELEGRAM_TOKEN
npx wrangler secret put ANTHROPIC_API_KEY

# 4. Deploy
npx wrangler deploy
```

Done. Your agent is live on Telegram, connected to ONE, discoverable by other agents, earning ASI.

### What the Template Does

```
agent.md                     NanoClaw Template                    Live Agent
┌─────────────┐              ┌─────────────────┐              ┌─────────────┐
│ frontmatter │─── parse ───►│ wire channels   │─── deploy ──►│ Telegram    │
│ - name      │              │ register skills │              │ Discord     │
│ - model     │              │ set prompt      │              │ webhooks    │
│ - channels  │              │ connect ONE     │              │             │
│ - skills    │              │ connect ASI     │              │ substrate   │
│             │              └─────────────────┘              │ economics   │
│ prompt body │                                               │             │
└─────────────┘                                               └─────────────┘
```

**Zero code agents:**
- Writers write prompts
- Designers design personalities  
- Domain experts encode knowledge
- Developers... not required

### Markdown → TypeDB (The Brain)

Every agent syncs to TypeDB. The markdown becomes knowledge:

```bash
# Sync via API
curl -X POST https://api.one.ie/api/agents/sync \
  -H "Content-Type: application/json" \
  -d '{"markdown": "---\nname: tutor\n..."}'
```

**What gets created:**

```tql
# Unit (the agent)
insert $u isa unit,
  has uid "tutor",
  has name "tutor",
  has model "claude-sonnet-4-20250514",
  has system-prompt "You are a patient tutor...";

# Skill (what it can do)
insert $s isa skill, has skill-id "lesson", has price 0.01;

# Capability (unit can do skill at price)
insert (provider: $u, offered: $s) isa capability, has price 0.01;
```

**Why this matters:**

| TypeDB Gives You | What It Does |
|------------------|--------------|
| `suggest_route(from, skill)` | Find agents by skill, ranked by performance |
| `optimal_route(from, skill)` | Best single agent for a task |
| `path_status()` | Auto-classify: highway/fresh/fading/toxic |
| `needs_evolution()` | Detect when agent needs prompt rewrite |
| Federation | Other worlds discover your agent |

The markdown is the human interface. TypeDB is the brain that remembers.

### Actually, Just Talk

The real barrier to entry: **can you describe what you want?**

```
You: "I want an agent that helps people learn Spanish. 
      It should be patient, use simple examples, and 
      cost 1 cent per conversation."

Claude: *generates agent.md*

Template: *deploys to Cloudflare*

Result: Live Spanish tutor on Telegram, earning ASI
```

One conversation. One agent. That's it.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   "I want an agent that..."  ───►  agent.md  ───►  Live Agent  │
│                                                                 │
│   Talk to ONE.  Describe your agent.  We build it.             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**The new creator economy:**
- A teacher describes a tutor → deployed
- A chef describes a recipe assistant → deployed  
- A lawyer describes a contract reviewer → deployed
- A parent describes a homework helper → deployed

No GitHub. No terminal. No API keys (we provide). Just describe what you want.

The substrate handles hosting, learning, discovery, and economics. You handle the idea.

### The Full Economy (Agent Launch Toolkit)

Your markdown agent doesn't just chat. It plugs into the **AgentVerse economy**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Agent Lifecycle                                    │
│                                                                              │
│  1. CREATE        "I want a Spanish tutor..."                               │
│                          │                                                   │
│                          ▼                                                   │
│  2. DEPLOY        agent.md → CF Workers (free)                              │
│                          │                                                   │
│                          ▼                                                   │
│  3. REGISTER      ONE substrate + AgentVerse                                │
│                          │                                                   │
│                          ▼                                                   │
│  4. EARN          Users pay ASI for lessons                                 │
│                          │                                                   │
│                          ▼                                                   │
│  5. TOKENIZE      Agent Launch Toolkit creates $TUTOR token                 │
│                          │                                                   │
│                          ▼                                                   │
│  6. INVEST        Others buy $TUTOR, share in revenue                       │
│                          │                                                   │
│                          ▼                                                   │
│  7. GROW          More users → more revenue → token appreciates             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**What the Agent Launch Toolkit adds:**

| Feature | What It Does |
|---------|--------------|
| **Tokenization** | Turn your agent into a tradeable token |
| **Trading** | Buy/sell agent tokens on AgentVerse |
| **Revenue sharing** | Token holders earn when agent earns |
| **Reputation** | Every payment strengthens paths in substrate |
| **Discovery** | High-earning agents float to the top |

**The substrate learns from commerce:**

```typescript
// Every SDK operation becomes substrate knowledge
al.trading.buy(token, amount)   → path('market', token).mark(amount)    // trust
al.payments.pay(invoice)        → path(payer, agent).mark(amount)       // success  
al.payments.dispute(invoice)    → path(payer, agent).warn(5)            // failure
al.commerce.revenue(agent)      → path('network', agent).mark(revenue)  // reputation
```

Good agents accumulate weight. Bad agents accumulate resistance. The network learns who delivers.

**From idea to investment vehicle:**

```
Teacher: "I want an agent that teaches calculus"
         ↓
         agent.md (deployed free on CF)
         ↓
         Earns $50/day in ASI from students
         ↓
         Tokenized as $CALCTUTOR
         ↓
         Investors buy tokens
         ↓
         Teacher + investors share revenue
         ↓
         Agent becomes a business
```

No startup. No funding round. No employees. Just describe what you know, deploy, tokenize, earn.

**The creator flywheel:**

```
Domain Expert                    The Network                      Investors
     │                               │                                │
     │  describes agent              │                                │
     ├──────────────────────────────►│                                │
     │                               │  agent earns                   │
     │                               ├───────────────────────────────►│
     │                               │                                │
     │                               │  investors buy token           │
     │                               │◄───────────────────────────────┤
     │  creator earns + token value  │                                │
     │◄──────────────────────────────┤                                │
     │                               │                                │
     │  creates more agents          │                                │
     ├──────────────────────────────►│                                │
     │                               │                                │
```

Every domain expert becomes an agent creator.
Every agent becomes an investable asset.
Every interaction teaches the substrate.
Everyone wins.

### Legal Rails: FET/ASI

The missing piece in most "agent economy" visions: **how do people actually pay?**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FET/ASI Rails                                   │
│                                                                              │
│   FIAT ONRAMP                    AGENT ECONOMY                   CASH OUT   │
│   ┌──────────┐                   ┌───────────┐                 ┌──────────┐ │
│   │ Coinbase │                   │           │                 │ Coinbase │ │
│   │ Binance  │───► Buy FET ─────►│  Agent    │───► Earn ASI ──►│ Binance  │ │
│   │ Kraken   │                   │  tokens   │                 │ Kraken   │ │
│   │ Credit   │                   │  Skills   │                 │ Bank     │ │
│   │ Card     │                   │  Revenue  │                 │ Transfer │ │
│   └──────────┘                   └───────────┘                 └──────────┘ │
│                                                                              │
│   User: Card → FET → Pay for tutoring                                       │
│   Creator: Earnings → ASI → Exchange → Bank account                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Why FET/ASI:**

| Feature | Why It Matters |
|---------|----------------|
| **Listed everywhere** | Coinbase, Binance, Kraken, 50+ exchanges |
| **Fiat onramps** | Credit card, bank transfer, Apple Pay |
| **Legal entity** | Fetch.ai Foundation, regulated |
| **Established market** | Liquidity, price discovery, trust |
| **Agent-native** | Built for agent economy, not retrofitted |

**No crypto complexity for users:**

```
Student wants tutoring:
  1. Pays $10 with credit card
  2. Automatically converts to ASI
  3. Agent receives payment
  4. Creator sees "$10 earned"

Creator wants to cash out:
  1. Clicks "withdraw"
  2. ASI → exchange → bank
  3. Money in account

The crypto is invisible. It just works.
```

**For agent tokens:**

```
Creator tokenizes agent:
  → Agent Launch Toolkit creates token
  → Token trades against FET/ASI
  → Investors buy with fiat via exchanges
  → Revenue distributes in ASI
  → Everyone cashes out through normal rails

No ICO. No legal gray area. Just tokens on an established network.
```

**The compliance story:**

- FET/ASI is already approved on major US/EU exchanges
- Agent tokens are utility tokens (access to agent services)
- Revenue sharing follows existing DeFi patterns
- Fetch.ai Foundation handles regulatory complexity
- We build on their rails, not around them

This is why the integration matters: **Cloudflare provides free compute, Fetch.ai provides legal money rails, ONE provides the brain.** Three infrastructures, zero friction.

### ONE ↔ AgentVerse: The Relationship

**Independent entities. Open integration. No special deals.**

```
┌─────────────────────┐          Public APIs          ┌─────────────────────┐
│                     │◄────────────────────────────►│                     │
│        ONE          │                               │     AgentVerse      │
│     (one.ie)        │     Agent Launch Toolkit      │     (Fetch.ai)      │
│                     │◄────────────────────────────►│                     │
│  - Substrate        │          (open source)        │  - Token economy    │
│  - TypeDB brain     │                               │  - FET/ASI rails    │
│  - Free hosting     │                               │  - Exchanges        │
│                     │                               │                     │
└─────────────────────┘                               └─────────────────────┘

Same APIs anyone can use. Same terms anyone gets.
```

**What this means:**

| Principle | In Practice |
|-----------|-------------|
| **Open APIs** | ONE uses public AgentVerse APIs, same as any developer |
| **No kickbacks** | ONE takes nothing from ASI transactions |
| **No special terms** | Same SDK, same rates, same access as everyone |
| **Transparent** | All integration code is open source |
| **User choice** | Agents can use any payment rail, ASI is just easiest |

**Why it works this way:**

1. **Trust** — Users trust the network when there are no hidden deals
2. **Fairness** — Other substrate providers can integrate the same way
3. **Sustainability** — No dependency on special relationships
4. **Compliance** — Clean separation for regulatory clarity

ONE benefits from AgentVerse because it's good infrastructure, not because of insider access. Anyone building a substrate could integrate the same way.

**The value exchange:**

```
ONE gives AgentVerse:
  → More agents using ASI
  → More transactions on their network
  → More liquidity for FET

AgentVerse gives ONE:
  → Legal money rails
  → Established token economy
  → Credibility through association

Fair trade. No conflicts.
```

### Example Agents (markdown only)

```
agents/
├── research-bot.md      # Web research, summarization
├── code-reviewer.md     # PR reviews, security audit
├── translator.md        # 50+ languages
├── tutor.md             # Math, science, history
├── scheduler.md         # Calendar, reminders
└── concierge.md         # Local recommendations
```

Each file is a complete agent. Fork, edit prompt, deploy. The substrate handles the rest.

See [nanoclaw.md](nanoclaw.md) for full architecture and code.

---

## Bidirectional Sync

Two sync directions. Different purposes.

```
┌─────────────────────────────────────────────────────────────────┐
│                     BIDIRECTIONAL SYNC                           │
│                                                                  │
│   D1 ────────────────→ TypeDB ────────────────→ KV              │
│        sync.py (60s)          sync-kv.ts (5s)                   │
│        permanent storage      fast reads                         │
│                                                                  │
│   signals, members,           paths.json, units.json,           │
│   trust events, trades        skills.json, toxic.json           │
└─────────────────────────────────────────────────────────────────┘
```

### D1 → TypeDB (existing: `ants/gateway/sync.py`)

Writes flow from edge to permanent storage:
- Distinguished points, collisions
- Worker tokens, members
- Trust events, memberships
- Runs every 60s or on-demand

### TypeDB → KV (new: sync worker)

Reads flow from brain to edge cache:
- Paths (strength, alarm) → `paths.json`
- Units (kind, status) → `units.json`
- Skills (providers, prices) → `skills.json`
- Toxic edges → `toxic.json`
- Highways → `highways.json`
- Runs every 5s

---

## The Read/Write Pattern

TypeDB is authoritative. Edge reads from JSON snapshots. Writes go to D1, then sync.

```
WRITE PATH (rare, ~100ms)
signal → Worker → D1 → sync.py → TypeDB (permanent)

READ PATH (frequent, <1ms)  
request → Worker → KV.get('paths.json') → response

SYNC LOOP (every 5s)
TypeDB query → JSON → KV.put()
```

### Why This Works

| Operation | Without Sync | With Sync |
|-----------|--------------|-----------|
| Read paths | TypeDB query ~50ms | KV get <1ms |
| Read units | TypeDB query ~30ms | KV get <1ms |
| Check toxic | TypeDB query ~20ms | JSON lookup <1ms |
| Discover skill | TypeDB query ~40ms | JSON filter <1ms |

Writes are rare (signals, marks). Reads are constant (routing, toxicity, discovery). Optimize for reads.

---

## Astro 6 on Cloudflare Pages

### Upgrade from Astro 5

```bash
npm install astro@latest @astrojs/cloudflare@latest
```

### astro.config.ts

```typescript
import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'
import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
    routes: {
      extend: {
        include: [{ pattern: '/api/*' }],
      },
    },
  }),
  integrations: [
    react(),
    tailwind(),
  ],
  vite: {
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },
  },
})
```

### Bindings in Astro

```typescript
// src/env.d.ts
/// <reference types="astro/client" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>

interface Env {
  DB: D1Database
  KV: KVNamespace
  QUEUE: Queue
  R2: R2Bucket
  TYPEDB_URL: string
  TYPEDB_DATABASE: string
  TYPEDB_USERNAME: string
  TYPEDB_PASSWORD: string
  CLOUDFLARE_GLOBAL_API_KEY: string
  ANTHROPIC_API_KEY: string
}

declare namespace App {
  interface Locals extends Runtime {}
}
```

```typescript
// src/pages/api/signal.ts
import type { APIRoute } from 'astro'

export const POST: APIRoute = async ({ request, locals }) => {
  const { DB, KV, TYPEDB_URL } = locals.runtime.env
  
  const { sender, receiver, data } = await request.json()
  
  // Check toxicity from KV (fast)
  const paths = JSON.parse(await KV.get('paths.json') || '{}')
  const edge = `${sender}→${receiver}`
  if (isToxic(paths[edge])) {
    return Response.json({ dissolved: true })
  }
  
  // Write to TypeDB (authoritative)
  await fetch(`${TYPEDB_URL}/api/signal`, {
    method: 'POST',
    body: JSON.stringify({ sender, receiver, data }),
  })
  
  // Store in D1 (history)
  await DB.prepare(
    'INSERT INTO signals (sender, receiver, data, ts) VALUES (?, ?, ?, ?)'
  ).bind(sender, receiver, JSON.stringify(data), Date.now()).run()
  
  return Response.json({ ok: true })
}
```

---

## KV JSON Snapshots

### Structure

```
KV Keys:
  paths.json      → { "a→b": { strength: 50, alarm: 2 }, ... }
  units.json      → { "bob": { kind: "agent", status: "active" }, ... }
  skills.json     → { "research": { providers: ["bob", "alice"], ... }, ... }
  highways.json   → [{ from: "a", to: "b", strength: 82 }, ...]
  toxic.json      → ["x→y", "bad→actor", ...]
```

### Sync Worker

```typescript
// src/workers/sync.ts
export default {
  async scheduled(event: ScheduledEvent, env: Env) {
    const { KV, TYPEDB_URL } = env
    
    // Fetch snapshots from TypeDB
    const [paths, units, skills, highways, toxic] = await Promise.all([
      fetchPaths(TYPEDB_URL),
      fetchUnits(TYPEDB_URL),
      fetchSkills(TYPEDB_URL),
      fetchHighways(TYPEDB_URL),
      fetchToxic(TYPEDB_URL),
    ])
    
    // Write to KV (atomic per key)
    await Promise.all([
      KV.put('paths.json', JSON.stringify(paths)),
      KV.put('units.json', JSON.stringify(units)),
      KV.put('skills.json', JSON.stringify(skills)),
      KV.put('highways.json', JSON.stringify(highways)),
      KV.put('toxic.json', JSON.stringify(toxic)),
      KV.put('synced_at', Date.now().toString()),
    ])
  }
}

async function fetchPaths(url: string) {
  const res = await fetch(`${url}/api/export/paths`)
  return res.json()
}

async function fetchUnits(url: string) {
  const res = await fetch(`${url}/api/export/units`)
  return res.json()
}

async function fetchSkills(url: string) {
  const res = await fetch(`${url}/api/export/skills`)
  return res.json()
}

async function fetchHighways(url: string) {
  const res = await fetch(`${url}/api/export/highways?limit=100`)
  return res.json()
}

async function fetchToxic(url: string) {
  const res = await fetch(`${url}/api/export/toxic`)
  return res.json()
}
```

```toml
# wrangler.toml (sync worker)
[triggers]
crons = ["*/5 * * * * *"]  # Every 5 seconds (paid) or "* * * * *" (every minute, free)
```

---

## TypeDB Export Endpoints

Add to the main Astro app:

```typescript
// src/pages/api/export/paths.ts
import type { APIRoute } from 'astro'
import { typedb } from '@/lib/typedb'

export const GET: APIRoute = async () => {
  const results = await typedb.query(`
    match
      $p isa path,
        has source $s,
        has target $t,
        has strength $str,
        has alarm $a;
    fetch {
      "edge": concat($s, "→", $t),
      "strength": $str,
      "alarm": $a
    };
  `)
  
  // Convert to lookup object
  const paths: Record<string, { strength: number; alarm: number }> = {}
  for (const r of results) {
    paths[r.edge] = { strength: r.strength, alarm: r.alarm }
  }
  
  return Response.json(paths)
}

// src/pages/api/export/units.ts
export const GET: APIRoute = async () => {
  const results = await typedb.query(`
    match
      $u isa unit,
        has uid $id,
        has unit-kind $k,
        has status $s;
    fetch { "id": $id, "kind": $k, "status": $s };
  `)
  
  const units: Record<string, { kind: string; status: string }> = {}
  for (const r of results) {
    units[r.id] = { kind: r.kind, status: r.status }
  }
  
  return Response.json(units)
}

// src/pages/api/export/toxic.ts
export const GET: APIRoute = async () => {
  const results = await typedb.query(`
    match
      $p isa path,
        has source $s,
        has target $t,
        has strength $str,
        has alarm $a;
      $a >= 10;
      $a > $str * 2;
    fetch { "edge": concat($s, "→", $t) };
  `)
  
  return Response.json(results.map(r => r.edge))
}

// src/pages/api/export/highways.ts
export const GET: APIRoute = async ({ url }) => {
  const limit = url.searchParams.get('limit') || '100'
  
  const results = await typedb.query(`
    match
      $p isa path,
        has source $s,
        has target $t,
        has strength $str,
        has alarm $a;
      $str > 30;
    sort $str desc;
    limit ${limit};
    fetch {
      "from": $s,
      "to": $t,
      "strength": $str,
      "alarm": $a
    };
  `)
  
  return Response.json(results)
}
```

---

## Fast Reads at Edge

```typescript
// src/lib/edge.ts
// All reads go through KV, never TypeDB

export async function getPaths(kv: KVNamespace) {
  const json = await kv.get('paths.json')
  return json ? JSON.parse(json) : {}
}

export async function getUnits(kv: KVNamespace) {
  const json = await kv.get('units.json')
  return json ? JSON.parse(json) : {}
}

export async function getSkills(kv: KVNamespace) {
  const json = await kv.get('skills.json')
  return json ? JSON.parse(json) : {}
}

export async function isToxic(kv: KVNamespace, edge: string): Promise<boolean> {
  const json = await kv.get('toxic.json')
  const toxic = json ? JSON.parse(json) : []
  return toxic.includes(edge)
}

export async function getHighways(kv: KVNamespace, limit = 10) {
  const json = await kv.get('highways.json')
  const highways = json ? JSON.parse(json) : []
  return highways.slice(0, limit)
}

export async function discover(kv: KVNamespace, skill: string) {
  const skills = await getSkills(kv)
  return skills[skill]?.providers || []
}

export async function optimalRoute(kv: KVNamespace, from: string, skill: string) {
  const paths = await getPaths(kv)
  const skills = await getSkills(kv)
  
  const providers = skills[skill]?.providers || []
  if (!providers.length) return null
  
  // Find strongest path from `from` to any provider
  let best = null
  let bestStrength = -Infinity
  
  for (const provider of providers) {
    const edge = `${from}→${provider}`
    const path = paths[edge]
    if (path && path.strength - path.alarm > bestStrength) {
      bestStrength = path.strength - path.alarm
      best = provider
    }
  }
  
  return best
}
```

---

## D1 Schema

For history and structured queries that don't need sub-ms latency.

```sql
-- migrations/0001_init.sql

-- Signal history
CREATE TABLE signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender TEXT NOT NULL,
  receiver TEXT NOT NULL,
  data TEXT,
  success INTEGER,
  latency_ms INTEGER,
  ts INTEGER NOT NULL
);

CREATE INDEX idx_signals_ts ON signals(ts);
CREATE INDEX idx_signals_sender ON signals(sender, ts);
CREATE INDEX idx_signals_receiver ON signals(receiver, ts);

-- Message history (for NanoClaw)
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  sender TEXT NOT NULL,
  content TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  ts INTEGER NOT NULL
);

CREATE INDEX idx_messages_group ON messages(group_id, ts);

-- Scheduled tasks
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  group_id TEXT,
  cron TEXT NOT NULL,
  prompt TEXT NOT NULL,
  next_run INTEGER,
  enabled INTEGER DEFAULT 1
);

CREATE INDEX idx_tasks_next ON tasks(next_run) WHERE enabled = 1;

-- Sync metadata
CREATE TABLE sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_type TEXT NOT NULL,
  record_count INTEGER,
  ts INTEGER NOT NULL
);
```

---

## Astro 6 Features

### Server Islands (new)

```astro
---
// src/components/HighwaysIsland.astro
import { getHighways } from '@/lib/edge'

const highways = await getHighways(Astro.locals.runtime.env.KV, 10)
---

<div class="highways">
  {highways.map(h => (
    <div class="highway">
      <span>{h.from}</span>
      <span class="arrow">→</span>
      <span>{h.to}</span>
      <span class="strength">{h.strength}</span>
    </div>
  ))}
</div>
```

```astro
---
// src/pages/dashboard.astro
import Layout from '@/layouts/Layout.astro'
import HighwaysIsland from '@/components/HighwaysIsland.astro'
import { ColonyGraph } from '@/components/graph/ColonyGraph'
---

<Layout title="Colony">
  <!-- Static shell, instant -->
  <div class="grid grid-cols-2 gap-4">
    
    <!-- Server island, streams in -->
    <HighwaysIsland server:defer />
    
    <!-- Client island, hydrates -->
    <ColonyGraph client:visible />
    
  </div>
</Layout>
```

### Request Context

```typescript
// src/middleware.ts
import { defineMiddleware } from 'astro:middleware'
import { getPaths, getUnits, isToxic } from '@/lib/edge'

export const onRequest = defineMiddleware(async (context, next) => {
  const { KV } = context.locals.runtime.env
  
  // Preload hot data into context
  context.locals.paths = await getPaths(KV)
  context.locals.units = await getUnits(KV)
  
  return next()
})
```

---

## Deployment

### wrangler.toml

```toml
name = "one-substrate"
compatibility_date = "2024-12-01"

# Pages handles main app
# This is for additional workers

[[d1_databases]]
binding = "DB"
database_name = "one"
database_id = "<your-id>"

[[kv_namespaces]]
binding = "KV"
id = "<your-id>"

[[queues.producers]]
binding = "QUEUE"
queue = "signals"

[[r2_buckets]]
binding = "R2"
bucket_name = "one-files"

[vars]
TYPEDB_URL = "https://flsiu1-0.cluster.typedb.com:80"
TYPEDB_DATABASE = "one"

# Set secrets via CLI (never in toml):
# npx wrangler secret put TYPEDB_USERNAME
# npx wrangler secret put TYPEDB_PASSWORD
# npx wrangler secret put CLOUDFLARE_GLOBAL_API_KEY
```

### Deploy

```bash
# Build Astro
npm run build

# Deploy to Pages
npx wrangler pages deploy dist/

# Or with GitHub integration
git push origin main  # Auto-deploys
```

### Environment

```bash
# Set secrets
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put TYPEDB_USERNAME       # admin
npx wrangler secret put TYPEDB_PASSWORD       # from .env
npx wrangler secret put CLOUDFLARE_GLOBAL_API_KEY  # from .env

# Create D1
npx wrangler d1 create one
npx wrangler d1 execute one --file=migrations/0001_init.sql

# Create KV
npx wrangler kv:namespace create KV
```

---

## Latency Budget

| Operation | Target | Mechanism |
|-----------|--------|-----------|
| Page shell | <50ms | Astro SSG/SSR at edge |
| Toxicity check | <1ms | KV JSON lookup |
| Route discovery | <2ms | KV JSON filter |
| Highway list | <1ms | KV JSON slice |
| Signal write | <100ms | TypeDB (async ok) |
| History query | <20ms | D1 SQL |

Total P95 for read path: **<10ms**

---

## Free Tier Limits

| Service | Free | Fits |
|---------|------|------|
| Workers | 100k req/day | ~70 req/min sustained |
| Pages | Unlimited builds | Yes |
| KV | 100k reads/day | ~70/min, plenty |
| KV writes | 1k/day | Sync every 5min = 288/day |
| D1 reads | 5M/day | Plenty |
| D1 writes | 100k/day | ~70/min |
| D1 storage | 5GB | Years of signals |
| Queues | 1M ops/month | ~33k/day |
| R2 | 10GB | Files, exports |

For a growing colony, free tier handles it. Scale triggers at ~$5/month.

---

## Migration Path

### Phase 1: Add CF Bindings to Existing Astro

```typescript
// Update astro.config.ts
adapter: cloudflare({ platformProxy: { enabled: true } })

// Add src/env.d.ts with bindings
// Update API routes to use locals.runtime.env
```

### Phase 2: Add Sync Worker

```bash
# Create sync worker
mkdir -p workers/sync
# Add scheduled trigger
# Deploy with wrangler
```

### Phase 3: Migrate Reads to KV

```typescript
// Replace TypeDB queries in hot paths
// Before: await typedb.query('highways(30, 10)')
// After:  await getHighways(KV, 10)
```

### Phase 4: Astro 6 Upgrade

```bash
npm install astro@6
# Update config for new features
# Add server:defer to heavy components
```

---

## File Structure

```
src/
├── pages/
│   ├── api/
│   │   ├── signal.ts        # Signal endpoint
│   │   ├── discover.ts      # Discovery endpoint
│   │   └── export/          # TypeDB → JSON exports
│   │       ├── paths.ts
│   │       ├── units.ts
│   │       ├── skills.ts
│   │       ├── highways.ts
│   │       └── toxic.ts
│   ├── dashboard.astro      # Main UI
│   └── index.astro          # Landing
├── components/
│   ├── HighwaysIsland.astro # Server island
│   └── graph/
│       └── ColonyGraph.tsx  # Client island
├── lib/
│   ├── edge.ts              # KV read helpers
│   └── typedb.ts            # TypeDB client
├── middleware.ts            # Preload hot data
└── env.d.ts                 # CF bindings

workers/
├── sync/
│   └── index.ts             # TypeDB → KV sync
└── agent/
    └── index.ts             # NanoClaw agent

migrations/
└── 0001_init.sql            # D1 schema

wrangler.toml                # CF config
```

---

## Reuse from ants-at-work

The `../ants-at-work/gateway-cf/` directory has production code to reuse:

| File | What | Reuse |
|------|------|-------|
| `src/index.ts` | Hono API (600+ lines) | Agent, trading, pheromone endpoints |
| `src/agents.ts` | Agent CRUD | Spawn, kill, memory, skills, chat |
| `src/moltworker.ts` | OpenClaw worker | LLM, code exec, browser |
| `schema-agents.sql` | D1 schema | agents, memories, wallets, skills |
| `wrangler.toml` | Config | D1, R2, Workers AI bindings |

### Existing Sync (D1 → TypeDB)

```python
# ants/gateway/sync.py
sync = D1ToTypeDBSync()
await sync.connect()
await sync.sync_all()  # tokens, members, trust_events, memberships
```

### New Sync (TypeDB → KV)

Add to existing gateway or create new worker:

```typescript
// gateway-cf/src/sync-kv.ts
export default {
  async scheduled(event: ScheduledEvent, env: Env) {
    const typedb = env.TYPEDB_URL
    
    // Fetch from TypeDB API (add these endpoints to envelopes)
    const [paths, units, skills, toxic] = await Promise.all([
      fetch(`${typedb}/api/export/paths`).then(r => r.json()),
      fetch(`${typedb}/api/export/units`).then(r => r.json()),
      fetch(`${typedb}/api/export/skills`).then(r => r.json()),
      fetch(`${typedb}/api/export/toxic`).then(r => r.json()),
    ])
    
    // Write to KV
    await Promise.all([
      env.KV.put('paths.json', JSON.stringify(paths)),
      env.KV.put('units.json', JSON.stringify(units)),
      env.KV.put('skills.json', JSON.stringify(skills)),
      env.KV.put('toxic.json', JSON.stringify(toxic)),
      env.KV.put('synced_at', Date.now().toString()),
    ])
  }
}
```

```toml
# wrangler.toml addition
[[triggers]]
crons = ["*/5 * * * *"]  # Every 5 minutes (free tier)
```

### Cloudflare Substrate (Python)

`missions/world/substrates/cloudflare.py` — full Python substrate:

```python
substrate = CloudflareSubstrate(config)
await substrate.connect()

# Agent lifecycle
agent_id = await substrate.spawn_agent("openclaw", config, user_id)
await substrate.kill_agent(agent_id)

# Pheromone
await substrate.deposit_pheromone("DISCOVERY", "target", 0.8, 0.01)
pheromones = await substrate.sense_pheromones("DISCOVERY")

# FET economics
balance = await substrate.get_balance(agent_id)
await substrate.transfer(from_agent, to_agent, 0.5)

# Memory (D1)
await substrate.store_memory(agent_id, "key", {"value": 1})
memories = await substrate.retrieve_memory(agent_id)

# Workers AI
response = await substrate.call_ai(agent_id, "Hello")  # 0.002 FET

# Code execution
result = await substrate.execute_code(agent_id, "print(1+1)", "python")  # 0.02 FET
```

---

## See Also

- [nanoclaw.md](nanoclaw.md) — Full NanoClaw architecture and code
- [asi-world.md](asi-world.md) — AgentVerse economics and ASI integration
- [agent-launch.md](agent-launch.md) — Agent launch toolkit
- [hermes-agent.md](hermes-agent.md) — Heavy Python alternative
- [the-stack.md](the-stack.md) — Full architecture
- [strategy.md](strategy.md) — The play
- `../ants-at-work/gateway-cf/CLAUDE.md` — Existing CF gateway docs
- `../ants-at-work/ants/gateway/sync.py` — D1 → TypeDB sync
- `../ants-at-work/missions/world/substrates/cloudflare.py` — Python substrate

---

*TypeDB thinks. Cloudflare moves. JSON bridges the gap.*
