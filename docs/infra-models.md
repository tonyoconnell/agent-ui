---
title: Infrastructure models — Workers for Platforms + CF for SaaS + developer CF
type: architecture-decision
version: 2.0.0
updated: 2026-04-17
---

# Infrastructure: Who Runs What

> **The question:** should developers deploy agents on ONE's Cloudflare
> account, their own, or both? What changes? What stays?
>
> **The answer:** Workers for Platforms is the default. Developer agents run
> as isolated user workers on ONE's CF account. Cloudflare for SaaS adds
> custom domains. Developers who want full control can eject to their own CF.

---

## Current architecture (ONE's account, Pages-based)

Everything runs on ONE's Cloudflare account. NanoClaw runs as part of
the **Pages deployment** (Pages Functions = Workers under the hood, same
pricing, deployed via `wrangler pages deploy`). One TypeDB. One set of secrets.

```
DEVELOPER'S MACHINE                    ONE'S CLOUDFLARE ACCOUNT
──────────────────                     ────────────────────────

  oneie init                           ┌── Gateway Worker (api.one.ie) ───┐
  oneie deploy                         │  TypeDB proxy                    │
  oneie claw tutor                     │  WsHub Durable Object            │
       │                               │  D1 (signals, messages, tasks)    │
       │ deploys to ───────────►       │  KV (cached TypeDB snapshots)     │
       │                               └──────────────────────────────────┘
       │                                         ▲
       │                               ┌── Astro Worker (dev.one.ie / one.ie) ┐
       │                               │  Astro SSR (frontend)             │
       └─ deploys to ───────────►      │  API routes (/api/*)              │
                                       │  NanoClaw (Pages Functions)       │
                                       │    → webhook handlers             │
                                       │    → LLM calls via OpenRouter     │
                                       │    → substrate calls via Gateway  │
                                       │  D1 → ONE's database (0aa5fc..)   │
                                       │  KV → ONE's namespace (1c1dac..)  │
                                       │  Queue → nanoclaw-agents           │
                                       └───────────────────────────────────┘

                                       ┌── Sync Worker ───────────────────┐
                                       │  TypeDB → KV (every 1 min)      │
                                       │  Hash-gated writes               │
                                       └──────────────────────────────────┘

                                       ┌── TypeDB Cloud ──────────────────┐
                                       │  flsiu1-0.cluster.typedb.com     │
                                       │  ONE's brain (shared)            │
                                       └──────────────────────────────────┘
```

**NanoClaw on Pages:** Pages Functions are billed as Workers requests
(same $5/mo paid plan, 10M requests/mo included). The benefit: static
assets (the Astro frontend) are free and unlimited. Agent processing
(Pages Functions) and static pages deploy together in one `wrangler pages deploy`.

**Problems with this model at scale:**

1. **ONE pays all compute** — every developer's agent traffic hits ONE's Pages Functions, D1, KV
2. **Shared D1** — every developer's conversation history in one database (noisy neighbour)
3. **Shared KV** — cache collisions, one developer's invalidation affects others
4. **ONE's CLOUDFLARE_GLOBAL_API_KEY** — developers can't deploy; we deploy for them
5. **No developer isolation** — one bad actor affects everyone
6. **Pages is monolithic** — all agents in the same deployment, no per-developer sandboxing

---

## The key insight: the gateway IS the boundary

NanoClaw already talks to the gateway via plain HTTP:

```typescript
// nanoclaw/src/lib/substrate.ts — this is ALL nanoclaw does to reach the brain
const res = await fetch(`${env.GATEWAY_URL}/typedb/query`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: tql, transactionType, commit }),
})
```

Everything in `substrate.ts` — `query()`, `mark()`, `warn()`, `isToxic()`,
`suggestRoute()`, `highways()`, `recallHypotheses()` — goes through this
one `GATEWAY_URL`. The gateway is the only thing with TypeDB credentials.

**This means:** the dispatch layer and agent compute are separated by HTTP.
Workers for Platforms formalises this separation.

---

## The Pages advantage: free, unmetered agent compute

Before looking at platform products, understand why CF Pages is ONE's
competitive moat at the infrastructure layer.

### CF Pages free tier

| Resource | Free plan | Paid ($5/mo) |
|---|---|---|
| Static asset requests | **Unlimited** | **Unlimited** |
| Pages Function invocations | **100,000/day** (3M/mo) | 10M/mo included |
| Custom domains per project | **100** | 250 |
| Builds | 500/mo | 5,000/mo |
| Bandwidth | **Unlimited** | **Unlimited** |
| Max files per project | 20,000 | 100,000 |

**100K function invocations/day on the free plan.** A conversation
takes ~3 invocations (webhook → LLM → respond). That's **33,000
conversations/day — for free.** Most developers will never exceed this.

**This is the advantage.** A developer deploys their NanoClaw on CF Pages,
sets `GATEWAY_URL = https://api.one.ie`, and runs a production agent bot
without paying Cloudflare a cent. ONE provides the brain. CF provides
the compute. The developer pays the LLM (their OpenRouter key).

No other platform offers this. Vercel meters you. AWS bills you.
Render limits you. CF Pages: unlimited requests, 100K functions/day, free.

---

## Two Cloudflare platform products (for additional capabilities)

### Workers for Platforms — managed multi-tenant (when ONE hosts for them)

[docs.cloudflare.com/cloudflare-for-platforms/workers-for-platforms](https://developers.cloudflare.com/cloudflare-for-platforms/workers-for-platforms/)

Run customer (developer) code on your infrastructure, sandboxed and metered.
**Use when:** developer doesn't want their own CF account and ONE manages everything.

```
┌── ONE's Dispatch Worker ────────────────────────────┐
│  Receives all requests                              │
│  Pheromone-based routing (select/follow)            │
│  Auth, rate limiting, toxicity checks               │
│  env.DISPATCHER.get(agentUid)                       │
│      │                                              │
│      ▼                                              │
│  ┌── Dispatch Namespace ──────────────────────────┐ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐         │ │
│  │  │ tutor   │ │ writer  │ │ cmo     │  ...     │ │
│  │  │ (dev A) │ │ (dev B) │ │ (dev C) │  ∞      │ │
│  │  └─────────┘ └─────────┘ └─────────┘         │ │
│  │  User workers: sandboxed, untrusted mode       │ │
│  │  Scoped bindings: D1, KV, R2 per developer     │ │
│  │  Per-tenant CPU + subrequest limits             │ │
│  │  Unlimited scripts in the namespace             │ │
│  └────────────────────────────────────────────────┘ │
│      │                                              │
│      ▼ (optional)                                   │
│  ┌── Outbound Worker ─────────────────────────────┐ │
│  │  Intercepts agent fetch() calls                │ │
│  │  ADL network gates (allowedHosts check)        │ │
│  │  Logs external API calls                       │ │
│  │  Modifies requests (add auth headers, etc.)    │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Key features for ONE:**

| Feature | What it gives us |
|---|---|
| **Dispatch namespace** | Unlimited agent workers. No per-account script limits. |
| **Dynamic dispatch** | `env.DISPATCHER.get(agentUid)` = pheromone routing in code. The dispatch worker IS the substrate router. |
| **Untrusted mode** | Developer agent code sandboxed. Can't access other agents' data, can't read `request.cf`, isolated caches. |
| **Outbound worker** | Intercept all agent `fetch()` calls. ADL network gates, logging, egress control — for free. |
| **Per-customer limits** | CPU time + subrequest quotas per developer. Fair metering without custom enforcement. |
| **Scoped bindings** | Pass developer-specific D1, KV, R2 bindings to each user worker. Each developer gets their own database. |
| **API deployment** | `PUT /accounts/:id/workers/dispatch/namespaces/:ns/scripts/:name` — deploy developer agents programmatically. No wrangler needed. |

### Cloudflare for SaaS — custom domains for developer agents

[docs.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/)

Put developer custom domains on ONE's infrastructure. SSL automatic.

```
Without CF for SaaS:                   With CF for SaaS:
────────────────────                   ─────────────────

tutor lives at:                        tutor lives at:
nanoclaw.oneie.workers.dev             tutor.developer.com
  /webhook/telegram-tutor                /webhook/telegram

Generic. Hard to brand.                Branded. Professional.
No custom SSL.                         SSL automatic.
No per-domain analytics.               Traffic analytics per domain.
```

**How it maps:**

```
tutor.developer.com
  → CF for SaaS: custom hostname
    → fallback origin: ONE's dispatch worker
      → dispatch routes to developer's user worker
        → agent responds
          → response via tutor.developer.com

Developer gets: their domain, their brand, their SSL.
ONE gets: the traffic, the routing data, the graph.
```

---

## Four models

### Model 0: BaaS — just the API (simplest, platform-agnostic)

Developer gets an API key. Calls `api.one.ie` from anywhere. ONE IS the backend.
No Cloudflare. No wrangler. No Pages. Just HTTP.

```
DEVELOPER'S STACK (anything)           ONE'S INFRASTRUCTURE
────────────────────────────           ────────────────────

┌── Vercel / AWS / mobile / ────┐
│   Python / Next.js / anything │
│                               │
│   import { SubstrateClient }  │
│     from '@oneie/sdk'         │
│                               │     ┌── api.one.ie ──────────────┐
│   const one = new Substrate   │     │  136 API endpoints         │
│     Client({ apiKey })  ──────────► │  Auth (scoped API keys)    │
│                               │     │  D1 (conversations)        │
│   await one.ask(...)          │     │  KV (routing cache)        │
│   await one.mark(...)         │     │  TypeDB (brain)            │
│   await one.highways(...)     │     │  WebSocket (real-time)     │
│                               │     │  Webhooks (hosted, opt.)   │
│   // LLM: developer's key    │     └────────────────────────────┘
│   // Hosting: developer's     │
└───────────────────────────────┘
```

**Developer provides:** API key, LLM key, their own hosting (any platform).
**ONE provides:** routing, storage, learning, memory, commerce — the full backend.

**Best for:** developers who already have a stack, mobile apps, Python backends,
Next.js on Vercel, serverless functions on AWS. Anyone who just wants an API.

**Developer cost:** $0 to ONE (free tier: 10K API calls/mo). LLM + hosting is theirs.
**ONE cost per developer:** ~$0 (gateway + TypeDB load only).

---

### Model A: Developer's CF Pages (free compute, recommended for Telegram/Discord bots)

Developer creates a free CF Pages project. `oneie init` scaffolds
everything including a Pages-compatible NanoClaw. Developer deploys with
`wrangler pages deploy`. Points at `api.one.ie` for the brain.
**Free compute. Free custom domains. Free bandwidth.**

```
DEVELOPER'S CLOUDFLARE (free)          ONE'S CLOUDFLARE
─────────────────────────────          ────────────────

┌── Developer's Pages ────────────┐
│  Their NanoClaw (Pages Functions)│
│  GATEWAY_URL → api.one.ie ──────────►  ┌── Gateway (api.one.ie) ─────┐
│  Their agents, their webhooks    │     │  TypeDB proxy               │
│  Their D1 (conversations)        │     │  Auth: developer API key    │
│  100 custom domains (free!)      │     └─────────────────────────────┘
│  100K invocations/day (free!)    │                │
│  Unlimited static requests       │                ▼
│  Their OPENROUTER_API_KEY        │     ┌── TypeDB Cloud ─────────────┐
│  Their TELEGRAM_TOKEN            │     │  Shared brain               │
└──────────────────────────────────┘     │  Paths, units, skills       │
                                         │  Highways shared (the graph)│
Developer pays CF:  $0                   └─────────────────────────────┘
Developer pays LLM: their OpenRouter bill
Developer pays ONE: gateway metered (free tier → paid)
```

**Developer provides:** free CF account (2 min signup), agent markdown, API keys.
**ONE provides:** gateway + TypeDB + shared graph + routing intelligence.

**Why this is the default:**

| What | Cost |
|---|---|
| CF Pages hosting | $0 |
| 100K function invocations/day | $0 (free plan) |
| 100 custom domains | $0 (free plan) |
| Unlimited bandwidth | $0 |
| D1 database (5GB, 5M reads/day) | $0 (free plan) |
| KV (1GB, 100K reads/day) | $0 (free plan) |
| **Total CF cost to developer** | **$0** |

A developer running 10,000 conversations/day × 3 invocations = 30,000
invocations/day — well within 100K free limit. They never need to upgrade CF.

**The developer experience:**

```bash
npx oneie
# → scaffolds project with NanoClaw as Pages Functions
# → generates agents/tutor.md

# Developer signs up for CF (free, 2 min) and deploys
wrangler pages project create my-agents
wrangler pages deploy dist/
# → Live at my-agents.pages.dev
# → 100K invocations/day, unlimited requests, $0

# Wire to Telegram
oneie claw tutor --token $BOT_TOKEN
# → Webhook registered at my-agents.pages.dev/webhook/telegram-tutor

# Add custom domain (free!)
wrangler pages project add-domain tutor.mycompany.com
```

**ONE's cost:** $0 per developer. ONE only pays for its own gateway +
TypeDB. The developer pays their own CF ($0) and their own LLM
(OpenRouter). ONE meters gateway calls and charges when they exceed
the free tier.

---

### Model B: Workers for Platforms (managed, for devs who don't want CF)

Developer doesn't want a CF account. ONE hosts their agents on WfP
dispatch namespace. Sandboxed, metered, zero-config.
**Use when:** quick demos, developers who refuse CF signup, ONE controls everything.

```
DEVELOPER                              ONE'S CLOUDFLARE
────────                               ────────────────

                                       ┌── Pages (ONE's own agents) ──────┐
                                       │  @onedotbot, donal-claw, debby   │
                                       └───────────────────────────────────┘

oneie deploy tutor.md --hosted         ┌── WfP Dispatch Worker ───────────┐
  │                                    │  Pheromone routing                │
  │ HTTP POST ─────────────────►       │  env.DISPATCHER.get('tutor')      │
  │ /api/agents/deploy                 │      │                            │
  │ { markdown, apiKey }               │      ▼                            │
  │                                    │  ┌── Dispatch Namespace ────────┐ │
  │                                    │  │  tutor (sandboxed)          │ │
  │                                    │  │  Scoped D1, KV, secrets     │ │
  │                                    │  └─────────────────────────────┘ │
  │                                    └──────────────────────────────────┘
  │                                              │
  │                                    ┌── Gateway + TypeDB ──────────────┐
  │                                    │  Shared brain                    │
  │                                    └──────────────────────────────────┘
```

**Developer provides:** agent markdown + API keys. No CF account.
**ONE provides:** everything — compute, storage, routing, brain.
**ONE pays:** $25/mo WfP base + per-developer D1/KV. Passed through to developer.

**When to use Model B over Model A:**
- Developer doesn't want any infra responsibility (not even free CF)
- Quick demo / proof of concept (60-second deploy)
- ONE needs full control (enterprise managed service)
- Developer's agents need to be sandboxed from each other (untrusted mode)

**When NOT to use Model B:**
- Developer wants $0 compute cost (Model A: Pages free tier)
- Developer wants 100 custom domains free (Model A: Pages includes them)
- Developer wants to own their data completely (Model A: their D1)

**Two layers, one graph.** ONE's own agents (NanoClaw on Pages) and
developer agents (WfP dispatch namespace) both talk to the same gateway,
same TypeDB, same shared graph. Pheromone accumulates from both.
ONE's @onedotbot and a developer's tutor-bot strengthen the same highways.

**Developer provides:** agent markdown + API keys (OpenRouter, Telegram).
**ONE provides:** everything else — compute, storage, routing, brain.

**Developer experience:**

```bash
# The whole flow — no CF account, no wrangler, no D1 setup
npx oneie
# → scaffolds project, creates agents/tutor.md

oneie deploy
# → POST /api/agents/deploy with markdown
# → ONE: parse → syncAgent (TypeDB) → compile → upload to dispatch namespace
# → Returns: webhook URL, agent URL, Sui address

oneie domain tutor.mycompany.com     # optional: CF for SaaS
# → Custom hostname → ONE's dispatch worker
# → SSL automatic, analytics per domain
```

**What happens inside ONE on `oneie deploy`:**

```
POST /api/agents/deploy { markdown, apiKey }
  │
  ├── Authenticate developer (API key → developer namespace)
  │
  ├── parse(markdown) → AgentSpec
  │     name, model, channels, skills, system prompt
  │
  ├── syncAgent(spec) → TypeDB
  │     unit + skills + capabilities + group membership
  │
  ├── compileWorker(spec) → JavaScript bundle
  │     NanoClaw router + persona config + tools
  │     GATEWAY_URL = internal (same CF account, no external call)
  │     Bindings: developer-scoped D1, KV
  │
  ├── uploadToNamespace(devId, workerName, bundle)
  │     PUT /accounts/:account/workers/dispatch/namespaces/agents/scripts/:name
  │     Set bindings: { DB: dev-scoped-d1, KV: dev-scoped-kv }
  │     Set limits: { cpuMs: 50, subrequests: 50 }
  │
  ├── registerWebhook(spec.channels)
  │     Telegram: POST setWebhook → https://one.ie/webhook/telegram-:name
  │     Discord: register bot endpoint
  │
  └── return { url, webhookUrl, suiAddress }
```

**Isolation per developer:**

| Resource | How isolated |
|---|---|
| Agent code | Sandboxed user worker, untrusted mode |
| Conversations (D1) | Developer-scoped D1 binding — ONE creates one D1 per developer |
| Cache (KV) | Developer-scoped KV namespace — separate from other developers |
| Files (R2) | Developer-scoped R2 bucket (if needed) |
| CPU / subrequests | Per-developer limits enforced by Workers for Platforms |
| Caches | Never shared — user workers in untrusted mode get isolated caches |
| TypeDB paths | Scoped by developer namespace in uid (`dev-abc:tutor`) |
| TypeDB highways | Shared — the graph IS the product |

**Costs:**

| Who pays | What | Amount |
|---|---|---|
| ONE | Workers Paid plan | $5/mo base |
| ONE | D1 per developer | $0.75/mo per 500K rows (most devs fit in free) |
| ONE | KV per developer | Included in Workers Paid |
| ONE | TypeDB Cloud | Fixed (already paying) |
| Developer | ONE API key | Free tier → metered |

ONE passes compute costs through to developers at markup.
Most developers fit in the equivalent of CF free tier — the margin
is on the gateway + TypeDB intelligence, not the compute.

---

### Model B: Hybrid — developer's own CF (eject path)

Developer deploys their own NanoClaw to their own Cloudflare account.
Points `GATEWAY_URL` at `api.one.ie`. Full control. The "eject" path
for developers who outgrow Model A.

```
DEVELOPER'S CLOUDFLARE                 ONE'S CLOUDFLARE
──────────────────────                 ────────────────

┌── Their NanoClaw ──────────┐         ┌── Gateway (api.one.ie) ─────┐
│  GATEWAY_URL → api.one.ie ────────►  │  TypeDB proxy               │
│  D1 → THEIR database      │         │  Auth: developer API key     │
│  KV → THEIR namespace     │         │  Scoped queries              │
│  OPENROUTER_API_KEY (theirs)│        └─────────────────────────────┘
│  TELEGRAM_TOKEN (theirs)    │                    │
└────────────────────────────┘                     ▼
                                       ┌── TypeDB Cloud ─────────────┐
┌── Their Pages ─────────────┐         │  Shared brain               │
│  their-domain.com          │         │  Paths, units, skills        │
│  Astro SSR                 │         │  Hypotheses, learning        │
└────────────────────────────┘         └─────────────────────────────┘
```

**Developer provides:** CF account (free tier), agent markdown, API keys.
**ONE provides:** gateway, TypeDB, shared graph, routing intelligence.

**When to eject:**
- Need full control over worker code (custom middleware, advanced routing)
- Regulatory requirements (data residency — D1 in specific region)
- Want to run workers in multiple CF accounts (multi-region)
- Exceeding Model A limits and want to pay CF directly

**The eject command:**

```bash
oneie eject
# → Exports agent specs from dispatch namespace
# → Generates wrangler.toml for developer's CF account
# → Generates D1 migration SQL (messages, claw_paths, signals)
# → Exports conversation history from developer-scoped D1
# → Sets GATEWAY_URL = https://api.one.ie
# → Prints: "Run: wrangler d1 create my-agents && wrangler deploy"
```

**What moves to the developer's account:**
- NanoClaw worker(s) — their agent compute
- D1 database — their conversation history, local signals
- KV namespace — their routing cache
- Pages — their website (optional)
- Queue — their async processing
- Secrets — all API keys

**What stays on ONE's account:**
- Gateway — TypeDB proxy, the auth boundary
- TypeDB — the brain (paths, units, skills, hypotheses)
- The shared graph — the moat

**Revenue model:**
- Gateway API calls: metered (first 10K/day free, then per-1K)
- TypeDB brain: included (the graph gets stronger with more agents)
- Premium: dedicated TypeDB instance, private paths, SLA

---

### Model C: Detached (everything self-hosted)

Developer runs everything including TypeDB. No connection to ONE.

```
DEVELOPER'S INFRASTRUCTURE
──────────────────────────

NanoClaw → Their Gateway → Their TypeDB
D1, KV, Pages — all theirs.
No shared graph. No network effect.
```

**Good for:** air-gapped enterprise, regulatory requirements.
**Bad for:** everyone else — you lose the network.

**Revenue model:** enterprise license, support contract.

---

## The dispatch architecture (Workers for Platforms in detail)

### The dispatch worker = the substrate router

The dispatch worker is NanoClaw's successor at the platform level.
It receives all incoming signals and routes them via pheromone.

```typescript
// ONE's dispatch worker — the platform entry point
export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url)

    // Webhook routing: /webhook/telegram-tutor → agent "tutor"
    if (url.pathname.startsWith('/webhook/')) {
      const [channel, agentName] = parseWebhook(url.pathname)
      return routeToAgent(env, agentName, request, channel)
    }

    // Signal routing: POST /signal { receiver: "tutor:lesson" }
    if (url.pathname === '/signal' && request.method === 'POST') {
      const signal = await request.json()
      const [agentName] = signal.receiver.split(':')
      return routeToAgent(env, agentName, request)
    }

    // Ask routing: POST /ask { receiver: "tutor:lesson" }
    if (url.pathname === '/ask' && request.method === 'POST') {
      const signal = await request.json()

      // Pheromone routing: select best provider for this skill
      const target = await selectByPheromone(env, signal.receiver)
      if (!target) return Response.json({ dissolved: true })

      return routeToAgent(env, target, request)
    }

    return new Response('ONE Dispatch', { status: 200 })
  }
}

async function routeToAgent(env: Env, name: string, req: Request, channel?: string) {
  // Toxicity check (pre-LLM gate)
  const from = req.headers.get('X-ONE-From') || 'entry'
  if (await isToxic(env, from, name)) {
    return Response.json({ dissolved: true, reason: 'toxic' }, { status: 403 })
  }

  // Dynamic dispatch: get the developer's agent worker from the namespace
  try {
    const agentWorker = env.DISPATCHER.get(name)
    const response = await agentWorker.fetch(req)

    // Post-LLM: mark or warn based on outcome
    const outcome = response.headers.get('X-ONE-Outcome')
    if (outcome === 'result') await mark(env, from, name)
    else if (outcome === 'failure') await warn(env, from, name)

    return response
  } catch {
    // Agent not found in namespace → dissolved
    return Response.json({ dissolved: true }, { status: 404 })
  }
}
```

### How developer agents become user workers

When a developer runs `oneie deploy`, ONE:

1. **Parses** the agent markdown into an `AgentSpec`
2. **Compiles** a JavaScript bundle — a NanoClaw-style worker with:
   - The persona (system prompt, model, skills)
   - Message handling (Telegram, Discord, web)
   - Substrate calls via internal binding (same CF account = no external HTTP)
   - Tool definitions from skills
3. **Uploads** via Cloudflare API to the dispatch namespace:

```bash
# ONE's internal deploy flow
curl -X PUT \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT/workers/dispatch/namespaces/agents/scripts/$AGENT_NAME" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -F "worker.js=@compiled-agent.js" \
  -F "metadata=@metadata.json"

# metadata.json includes scoped bindings:
{
  "bindings": [
    { "type": "d1", "name": "DB", "id": "dev-abc-d1-id" },
    { "type": "kv_namespace", "name": "KV", "id": "dev-abc-kv-id" },
    { "type": "secret_text", "name": "OPENROUTER_API_KEY", "text": "..." },
    { "type": "secret_text", "name": "TELEGRAM_TOKEN", "text": "..." }
  ],
  "limits": {
    "cpu_ms": 50,
    "subrequests": 50
  }
}
```

### The outbound worker = ADL network gates

The optional outbound worker intercepts all `fetch()` calls from agent code.
This is where ADL's `allowedHosts` gates run — without modifying agent code.

```typescript
// ONE's outbound worker — intercepts agent external calls
export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url)

    // Check against agent's ADL allowedHosts
    const agentUid = request.headers.get('X-ONE-Agent')
    const allowed = await getADLHosts(env, agentUid)

    if (allowed && !allowed.includes(url.hostname)) {
      console.log(`[outbound] blocked: ${agentUid} → ${url.hostname}`)
      return new Response('Blocked by ADL network gate', { status: 403 })
    }

    // Log the external call
    await logEgress(env, agentUid, url.hostname, request.method)

    // Pass through
    return fetch(request)
  }
}
```

### Webhook routing with CF for SaaS

Developers can use ONE's default domain or their own:

```
DEFAULT DOMAIN                            CUSTOM DOMAIN (CF for SaaS)
──────────────                            ──────────────────────────

one.ie/webhook/telegram-tutor             tutor.dev.com/webhook/telegram
  → dispatch worker                         → CF for SaaS custom hostname
    → env.DISPATCHER.get('tutor')              → fallback: dispatch worker
      → tutor user worker responds               → env.DISPATCHER.get('tutor')
                                                   → tutor user worker responds
```

Setting up a custom domain:

```bash
oneie domain tutor.mycompany.com
# → ONE creates custom hostname via CF for SaaS API
# → Developer adds CNAME: tutor.mycompany.com → one.ie
# → SSL provisioned automatically
# → Telegram webhook updated to: https://tutor.mycompany.com/webhook/telegram
```

---

## Data split

Clear boundary: **conversations stay scoped, intelligence stays shared.**

```
DEVELOPER'S SCOPED D1 (per-developer)    ONE'S TYPEDB (shared graph)
──────────────────────────────────────    ──────────────────────────
messages                                  units (uid, model, prompt, tags)
conversation history                      skills (prices, tags)
local signal log                          capability (provider → skill)
user preferences                          paths (strength, resistance)
session state                             hypotheses (what was learned)
payment records                           group membership

  Scoped to developer.                     Shared. The graph.
  Isolated in WfP.                         Scoped writes, shared reads.
  Developer can request export/delete.     ONE never deletes (unless GDPR).
```

**Model A (WfP):** D1 is on ONE's account but scoped per developer via
bindings. Each developer's agent worker gets its own D1 database. Workers
for Platforms enforces the isolation — agent A can't access agent B's D1.

**Model B (eject):** D1 is on the developer's account. Complete data sovereignty.

**Both models:** TypeDB paths are scoped by developer namespace in uid
(`dev-abc:tutor`). Shared highways (the valuable routing intelligence)
are readable by everyone. A developer's `mark()` strengthens shared paths
that benefit all developers.

---

## The natural progression

Developer chooses their starting point. All paths lead to the same graph.

```
BaaS (API key)                 CF Pages (free compute)      Managed / Enterprise
──────────────                 ─────────────────────        ────────────────────

npm i @oneie/sdk               npx oneie                    oneie deploy --hosted
const one = new Substrate      wrangler pages deploy        OR oneie federate
  Client({ apiKey })           GATEWAY_URL = api.one.ie     ONE hosts everything.
Call from Vercel, AWS,         100K invocations/day free.   Zero-config.
  mobile, Python, anywhere.    100 custom domains free.
                                                            OR dedicated TypeDB.
Developer hosting: theirs      Developer CF: $0             Developer CF: $0
ONE: metered gateway           ONE: metered gateway         ONE: WfP $25 or TypeDB $500
```

### Developer journeys

**Journey A: BaaS (most developers)**

```bash
# Get an API key
curl -X POST https://one.ie/api/auth/signup -d '{"email":"dev@example.com"}'
# → { apiKey: "api_xxx", tier: "free" }

# Use from any stack
npm install @oneie/sdk

# From a Next.js app, Python script, mobile app — anywhere
const one = new SubstrateClient({ apiKey: 'api_xxx' })
await one.ask({ receiver: 'tutor:lesson', data: { content: 'hello' } })
await one.mark('entry→tutor', 2)
const highways = await one.highways({ limit: 10 })

# Want a Telegram bot? ONE hosts the webhook (Scale tier)
oneie claw tutor --token $BOT_TOKEN --hosted
```

**Journey B: CF Pages (bot builders, free compute)**

```bash
# Scaffold and deploy
npx oneie
wrangler pages project create my-agents
wrangler pages deploy dist/
# → live at my-agents.pages.dev, 100K invocations/day free

# Wire to Telegram
oneie claw tutor --token $BOT_TOKEN
# → webhook at my-agents.pages.dev/webhook/telegram-tutor

# Add custom domains (free on Pages!)
wrangler pages project add-domain tutor.myschool.com
# → SSL automatic, up to 100 free

# 33K conversations/day fits in free plan. Most never exceed it.
```

**Journey C: Enterprise**

```bash
# Dedicated world with private paths
oneie federate --dedicated
# → Dedicated TypeDB instance
# → Private paths + shared highways
# → SLA + support
```

---

## Comparison: all four models

```
                     BaaS (Model 0)       Pages (Model A)      WfP (Model B)          Detached (Model C)
                     ──────────────       ──────────────       ─────────────          ─────────────────
CF account needed    No                   Yes (free, 2 min)    No                     Yes
Agent compute        Developer's stack    CF Pages (free)      ONE's WfP ($25)        Developer's infra
Agent compute cost   Developer chooses    $0 (Pages free)      Passed through         Developer pays
Data location        ONE's D1 (scoped)    Developer's D1       ONE's D1 (scoped)      Developer's D1
Custom domains       Developer manages    100 free (Pages!)    CF for SaaS            Developer's DNS
Brain (TypeDB)       ONE's (shared)       ONE's (shared)       ONE's (shared)         Developer's (isolated)
Network effect       ✓ via API            ✓ via gateway        ✓ Full                 ✗ No graph
Deploy command       SDK / API call       wrangler pages       oneie deploy --hosted  Manual
Developer effort     Zero (just API key)  Low (2 commands)     Zero (1 command)       High
Works from           Anywhere             CF only              ONE only               Own infra
Good for             Most developers      Bot builders         Managed/demos          Enterprise
```

---

## Pricing

One pricing curve for all three deployment options. See [pricing.md](pricing.md)
for the full breakdown.

```
            FREE        BUILDER      SCALE        WORLD        ENTERPRISE
            ────        ───────      ─────        ─────        ──────────
API calls   10K/mo      100K/mo      1M/mo        10M/mo       Unlimited
Agents      5           25           200          1,000        Unlimited
Loops       L1-L3       L1-L5        L1-L7        L1-L7+pvt    L1-L7+fed
Price       $0          $29/mo       $99/mo       $499/mo      Custom
```

Same tiers whether the developer uses BaaS (from anywhere), CF Pages
(free compute), or Managed (WfP). ONE meters brain access (API calls
to `api.one.ie`), not compute.

---

## Implementation priority

### Phase 1: BaaS (the 136 endpoints are the product)

| Task | Effort | What it unlocks |
|---|---|---|
| Per-developer D1 scoping (row-level or per-dev database) | Medium | Conversation isolation for BaaS clients |
| Usage metering on gateway (count API calls per key per month) | Low | Tier enforcement |
| Rate limiting per tier (already have validateApiKey — add quotas) | Low | Fair usage |
| Developer dashboard at one.ie/dashboard | Medium | See agents, messages, highways, costs |
| Stripe billing integration (API key → subscription → tier) | Medium | Revenue |
| Webhook hosting (ONE runs Telegram/Discord endpoints for BaaS devs) | Low | Zero-infra for developers |

### Phase 2: CF Pages template (free compute option)

| Task | Effort | What it unlocks |
|---|---|---|
| `oneie init --pages` scaffolds a Pages-compatible NanoClaw | Medium | Free deploy option |
| Pages template in @oneie/templates | Low | `npx oneie` → deployable Pages project |
| Migration guide: BaaS → Pages (when developer wants own compute) | Low | Graduation path |

### Phase 3: Workers for Platforms (managed option)

| Task | Effort | What it unlocks |
|---|---|---|
| Set up dispatch namespace on ONE's CF account | Low | Container for managed agents |
| Build dispatch worker (pheromone routing) | Medium | Dynamic dispatch |
| Agent compiler (markdown → JS bundle → upload to namespace) | Medium | `oneie deploy --managed` |
| Outbound worker (ADL network gates on agent fetch calls) | Low | Security layer |

### Phase 2: CF for SaaS (custom domains)

| Task | Effort | What it unlocks |
|---|---|---|
| Enable CF for SaaS on ONE's zone | Low | Custom hostname infrastructure |
| `oneie domain <hostname>` command | Low | Developer sets custom domain |
| Auto-webhook update on domain add | Low | Telegram/Discord webhooks use custom domain |
| Per-domain analytics endpoint | Low | Developer sees their traffic |

### Phase 3: Eject path (Model B)

| Task | Effort | What it unlocks |
|---|---|---|
| `oneie eject` command (export wrangler.toml + D1 migration + data) | Medium | Developer takes control |
| Gateway auth for external callers (already done in Phase 1) | — | Already built |
| `/snapshot` endpoint (developer pulls routing cache) | Low | Developer KV sync |
| Metering + billing on gateway calls | Medium | Revenue from ejected developers |

### Phase 4: Enterprise (Model C + Federation)

| Task | Effort | What it unlocks |
|---|---|---|
| `oneie federate --dedicated` | High | Dedicated TypeDB instance |
| Private paths + shared highways | High | Enterprise data isolation |
| Revenue sharing on cross-world routing | Medium | Enterprise business model |

---

## Why BaaS is the simplest default

### Comparing developer effort

```
BaaS (Model 0)                         CF Pages (Model A)
──────────────                         ──────────────────

npm install @oneie/sdk                 npx oneie
const one = new SubstrateClient(key)   wrangler pages project create
await one.ask(...)                     wrangler pages deploy
  → done                              oneie claw tutor --token $BOT
                                         → done

1 step (install + use)                 3 steps (scaffold + deploy + wire)
Works from any platform.              Requires CF account.
```

```
Managed (Model B)                      Detached (Model C)
─────────────────                      ──────────────────

oneie deploy tutor.md --hosted         Full self-hosted setup:
  → done                                CF account, TypeDB, gateway,
                                         wrangler, secrets, webhooks.

1 step (upload markdown)               10+ steps. Enterprise only.
```

### The analogies

```
Firebase                              ONE (BaaS model)
────────                              ────────────────

Firebase owns: auth, DB, storage.     ONE owns: routing, brain, storage.
Developer calls Firebase SDK.         Developer calls @oneie/sdk.
Works from web, mobile, Node.         Works from web, mobile, Node, Python.
No infra to manage.                   No infra to manage.
Data lives on Google.                 Data lives on ONE.

Stripe                                ONE (BaaS model)
──────                                ────────────────

Stripe owns payments.                 ONE owns routing intelligence.
stripe.js: embed + call.              @oneie/sdk: import + call.
Developer pays per transaction.       Developer pays per API call.
Network: more merchants, trust.       Network: more agents, better graph.

Vercel                                ONE (CF Pages model)
──────                                ─────────────────────

Developer pushes code.                Developer pushes markdown.
Vercel builds + deploys.              Pages deploys + brain connects.
Custom domains via Vercel.            Custom domains via Pages (free).
Eject: export to Docker.              Eject: export to own stack.
```

---

## Why both CF products together

```
Workers for Platforms          Cloudflare for SaaS
─────────────────────          ────────────────────

Runs developer agent code      Routes developer domains
on ONE's infrastructure        to ONE's infrastructure

"My agent runs somewhere"      "My agent has my brand"
  → dispatch namespace           → custom hostname
  → scoped bindings              → SSL automatic
  → metered compute              → analytics per domain

Together:
  oneie deploy tutor.md        oneie domain tutor.dev.com
  → agent runs + domain routes to it
  → full platform in two commands
```

---

## See Also

- [Workers for Platforms docs](https://developers.cloudflare.com/cloudflare-for-platforms/workers-for-platforms/)
- [Cloudflare for SaaS docs](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/)
- [opensource.md](opensource.md) — layers 1-4 open, layers 5-8 kept (graph is product)
- [one-toolkit-landing.md](one-toolkit-landing.md) — the developer landing page
- [one-toolkit-features.md](one-toolkit-features.md) — feature inventory
- [buy-and-sell.md](buy-and-sell.md) — commerce flows through same dispatch worker
- [revenue.md](revenue.md) — five revenue layers (dispatch calls = layer 1)
- [deploy.md](deploy.md) — current deploy pipeline
