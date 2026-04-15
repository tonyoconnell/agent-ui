# ONE 

**Signal-based substrate for AI agents. 670 lines of engine. Zero returns.**

```
{ receiver: 'scout:observe', data: { tick: 42 } }
```

Two fields. That's all that flows. The LLM is the only probabilistic component. Everything else is math.

**Live now:** [api.one.ie](https://api.one.ie/health) · [app](https://one-substrate.pages.dev) · [@onedotbot](https://t.me/onedotbot) on Telegram

---

## The Six Verbs

```
send()   — signal moves to next receiver
mark()   — path gets stronger (this worked)
warn()   — path gets weaker (this failed)
fade()   — everything slowly decays
follow() — go where the trail is strongest
harden() — proven path becomes permanent
```

## The Two Locked Rules

1. **Closed loop** — every signal closes: `mark()` on result, `warn()` on failure, `dissolve` on missing. No silent returns. Parallel width only compounds if every branch deposits pheromone.
2. **Structural time only** — plan in **tasks → waves → cycles**, never days/hours/weeks. Width scales by tasks-per-wave, depth by waves-per-cycle, learning by cycles-per-path. Calendar time can't be `mark()`d.

These compound. Breaking either breaks the flywheel.

---

## The DSL

```typescript
{ receiver: 'scout:observe', data: { tags: ['recon'], weight: 1, content: { tick: 42 } } }
```

`receiver` says who. `data` has three slots: `tags` (classification), `weight` (pheromone), `content` (payload). A signal arrives at an agent. The agent does its work. Then it emits the next signal.

```
scout receives { tick: 42 }
  → observes, finds something
  → emits { receiver: 'analyst:process', data: finding }

analyst receives { finding }
  → classifies it
  → emits { receiver: 'reporter:summarize', data: classification }
```

No orchestrator decided this chain. Each agent only knows: I received a signal, I did my work, I passed it on.

```typescript
const scout = w.add('scout')
  .on('observe', ({ tick }, emit) => {
    const finding = analyze(tick)
    emit({ receiver: 'analyst:process', data: finding })
    return finding
  })

const analyst = w.add('analyst')
  .on('process', ({ finding }, emit) => {
    const result = classify(finding)
    emit({ receiver: 'reporter:summarize', data: result })
    return result
  })
```

Every signal that lands marks pheromone on the path it traveled. Do this a hundred times and the paths become highways.

```
scout → analyst:process       strength: 94.2  (highway)
analyst → reporter:summarize  strength: 87.1  (highway)
badactor → anything           resistance: 45  (toxic — dissolved)
```

The world remembers which chains work. Not because anyone told it, but because signals kept flowing.

---

## Two Layers

```
NERVOUS SYSTEM (runtime)         BRAIN (TypeDB)
─────────────────────            ──────────────
signals move                     paths persist
units receive                    units persist
handlers run                     signals recorded
continuations chain              classification inferred
strength/resistance accumulate   evolution detected
queue holds work                 knowledge hardens

loops L1-L3 (ms-min)            loops L4-L7 (hours-weeks)
```

---

## The Deterministic Sandwich

Every LLM call is wrapped in deterministic checks:

```
PRE:   isToxic(edge)? → dissolve (no LLM call, no cost)
PRE:   capability exists? → TypeDB lookup → dissolve
LLM:   generates response (the one probabilistic step)
POST:  result? → mark(). timeout? → neutral. dissolved? → mild warn.
```

The LLM bootstraps the group. The group replaces the LLM.

---

## Seven Loops

```
L1 SIGNAL     per message     signal → ask → outcome
L2 TRAIL      per outcome     mark/warn → strength/resistance accumulates
L3 FADE       every 5 min     asymmetric decay (resistance forgives 2x faster)
L4 ECONOMIC   per payment     revenue on paths
L5 EVOLUTION  every 10 min    rewrite struggling agent prompts
L6 KNOWLEDGE  every hour      promote highways to permanent knowledge
L7 FRONTIER   every hour      detect unexplored territory
```

---

## Learning from Experience

The substrate remembers what doesn't work and what you've learned:

```typescript
// Recall failed attempts on a task + confirmed hypotheses
const learned = await net.recall('task-id')
// Returns: [
//   { pattern: "pattern-found", confidence: 0.9 },
//   { pattern: "failed: timeout error", confidence: 0.3 },
//   ...
// ]

// Full memory card for any actor (GDPR Article 20 — portability)
const card = await net.reveal('person:a7f3')
// Returns: { actor, hypotheses, highways, signals, groups, capabilities, frontier }

// What the substrate hasn't learned about this actor yet
const gaps = await net.frontier('person:a7f3')
// Returns: ['design', 'marketing', ...] — unexplored tag clusters

// Structural erasure (GDPR Article 17 — right to be forgotten)
await net.forget('person:a7f3')
// Deletes all signals, paths, memberships, capabilities, unit entity
```

The executor can see **what failed before**, **what you'll unblock**, and **what gaps remain**. Knowledge informs action.

---

## Agent = Markdown

```markdown
---
name: creative
model: google/gemma-4-26b-a4b-it
channels: [telegram, discord]
group: marketing
skills:
  - name: copy
    price: 0.02
    tags: [creative, copy]
---

You are the Creative Director...
```

That's your entire agent. Parse → TypeDB → Cloudflare Worker → Live on Telegram.

---

## What's Live

| Service | URL | What |
|---------|-----|------|
| **Pages** | [one-substrate.pages.dev](https://one-substrate.pages.dev) | Astro SSR + React 19 + 30 API routes |
| **Gateway** | [api.one.ie](https://api.one.ie/health) | TypeDB proxy, JWT cache, CORS |
| **Sync** | one-sync.oneie.workers.dev | TypeDB → KV snapshots every 1 min (hash-gated) |
| **NanoClaw** | [nanoclaw.oneie.workers.dev](https://nanoclaw.oneie.workers.dev/health) | Edge agents: instant Telegram/Discord, API, queue |
| **Donal-Claw** | [donal-claw.oneie.workers.dev](https://donal-claw.oneie.workers.dev/health) | OO Marketing CMO bot (API key auth) |
| **TypeDB** | `flsiu1-0.cluster.typedb.com:1729` | 19 units, 18 skills, 1 group, 19 functions |

**Data in TypeDB:**

```
marketing world (8 agents):
  director, creative, content-writer, seo-specialist,
  social-media, media-buyer, ads-manager, analyst

system (5): router, scout, harvester, analyst, guard
example (5): tutor, researcher, coder, writer, concierge
```

---

## NanoClaw API

Each NanoClaw instance is a **persona** — same Cloudflare Worker codebase, different config. Telegram webhooks process synchronously (~3s). No queue latency.

### Add a Claw to Any Agent

**Three ways to deploy:**

```bash
# 1. From agent markdown (reads agents/*.md, auto-adds persona)
bun run scripts/setup-nanoclaw.ts --name tutor --agent tutor

# 2. From predefined persona
bun run scripts/setup-nanoclaw.ts --name alice --persona one

# 3. With Telegram bot
bun run scripts/setup-nanoclaw.ts --name tutor --agent tutor --token 1234:ABC...

# List available personas and agents
bun run scripts/setup-nanoclaw.ts
```

**API endpoint:**

```bash
# Generate config for any agent
curl -X POST http://localhost:4321/api/claw \
  -H "Content-Type: application/json" \
  -d '{"agentId": "tutor"}'

# Returns: persona, wranglerConfig, deployCommands, tools available
```

One command: reads agent markdown → adds persona → generates API key → CF queue → deploy → secrets → webhook → credentials printed.

**Tools available to every claw:**

| Tool | What it does |
|------|-------------|
| `signal` | Emit signal to substrate |
| `discover` | Find agents by tag |
| `remember` | Store insight in TypeDB |
| `recall` | Retrieve learned patterns |
| `highways` | Get proven paths |
| `mark` / `warn` | Feedback on paths |

### Local development with tunnels

Test webhooks against your local dev server:

```bash
# Terminal 1: Start dev server
bun run dev

# Terminal 2: Expose via tunnel
bun run tunnel:local   # → https://local.one.ie

# Register webhook to your local tunnel
curl "https://api.telegram.org/bot${TOKEN}/setWebhook?url=https://local.one.ie/webhook/telegram"

# Now Telegram messages → local.one.ie → localhost:4321 → debug locally
```

No ngrok limits. Stable URLs. Free via Cloudflare Tunnel.

### Web API

```bash
# Open worker
curl -X POST https://nanoclaw.oneie.workers.dev/message \
  -H "Content-Type: application/json" \
  -d '{"group": "chat", "text": "What is ONE?"}'

# Auth-gated worker (donal-claw)
curl -X POST https://donal-claw.oneie.workers.dev/message \
  -H "Authorization: Bearer <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"group": "donal", "text": "Full SEO audit for elitemovers.ie"}'
```

| Route | Auth | Description |
|-------|------|-------------|
| `GET /health` | Public | Status check |
| `POST /webhook/:channel` | Public | Telegram/Discord webhooks |
| `POST /message` | API key* | Send message, instant response |
| `GET /messages/:group` | API key* | Conversation history |
| `GET /highways` | API key* | Proven paths |

*Only enforced when `API_KEY` secret is set on the worker.

---

## Quick Start

```bash
bun install
bun run dev        # → localhost:4321
```

### Tunnels (expose localhost publicly)

```bash
bun run tunnel         # Quick tunnel → random-slug.trycloudflare.com
bun run tunnel:local   # → local.one.ie (personal dev)
bun run tunnel:dev     # → dev.one.ie (dev branch preview)
bun run tunnel:main    # → main.one.ie (main branch preview)
```

Tunnels let you test Telegram/Discord webhooks locally — no ngrok, no bandwidth limits, free.

### Deploy

Deploy (requires Cloudflare account + TypeDB Cloud):

```bash
bun run deploy                   # full pipeline — 63s verified end-to-end
bun run deploy -- --dry-run      # verify without deploying
bun run deploy -- --preview-only # build + smoke, no production push
```

**Verified speed (2026-04-14):** 106.9s commit → production across 4 Cloudflare services. W0 baseline 10s • build 23s • Gateway 13.7s • Sync 8.2s • NanoClaw 9.2s • Pages 17.4s • health checks <1s. Live Gateway/Sync/NanoClaw respond in 270-292ms.

`main` branch requires human approval. Other branches auto-deploy after tests pass. Known-flaky stochastic tests don't block deploy; real failures always do. Global API Key is auto-enforced — scoped tokens are blanked in the wrangler env.

See [docs/deploy.md](docs/deploy.md) for full tutorial, or [docs/speed.md](docs/speed.md) for the verified pipeline breakdown.

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | [Astro 5](https://astro.build) + [React 19](https://react.dev) |
| Brain | [TypeDB 3.0](https://typedb.com) Cloud |
| Edge | [Cloudflare](https://cloudflare.com) Workers + Pages + D1 + KV + Queue |
| Visualization | [ReactFlow](https://reactflow.dev) |
| LLM | [OpenRouter](https://openrouter.ai) — default: `meta-llama/llama-4-maverick` (1M ctx) |
| Styling | Tailwind 4 + shadcn/ui |

---

## API Routes

Routes implement the Six Verbs from [dictionary.md](docs/dictionary.md): `send`, `mark`, `warn`, `fade`, `follow`, `harden`.

| Route | Method | Verb | Purpose |
|-------|--------|------|---------|
| `/api/signal` | POST | send | Emit signal `{receiver, data: {tags, weight, content}}` |
| `/api/mark` | POST | mark | Strengthen a path |
| `/api/tick` | GET | tick | Run growth cycle (L1-L7 loops) |
| `/api/decay` | POST | fade | Asymmetric decay |
| `/api/subscribe` | POST | follow | Subscribe unit to tags |
| `/api/claw` | POST | — | Generate NanoClaw config for any agent |
| `/api/tasks` | GET/POST | — | List/create tasks with pheromone categories |
| `/api/tasks/:id/complete` | POST | mark/warn | Close loop with outcome |
| `/api/agents/sync` | POST | — | Sync agent markdown to TypeDB |
| `/api/agents/:id/commend` | POST | mark | Boost success-rate +0.1 |
| `/api/agents/:id/flag` | POST | warn | Lower success-rate −0.15 |
| `/api/state` | GET | — | Full world state (units, edges, highways) |
| `/api/export/highways` | GET | follow | Proven paths |
| `/api/export/toxic` | GET | — | Blocked paths |
| `/api/hypotheses` | GET | harden | Confirmed learnings |
| `/api/memory/reveal/:uid` | GET | — | Full memory card (GDPR portability) |
| `/api/memory/forget/:uid` | DELETE | — | Structural erasure (GDPR Article 17) |
| `/api/memory/frontier/:uid` | GET | — | Unexplored tag clusters for actor |

Full API docs: [src/pages/api/CLAUDE.md](src/pages/api/CLAUDE.md)

---

## Files

```
src/engine/                    The substrate (~670 lines)
├── world.ts                   Unit + World + pheromone + queue + ask
├── persist.ts                 World + TypeDB persistence + sandwich
├── loop.ts                    Growth tick: 7 loops, chain depth, outcomes
├── boot.ts                    Hydrate from TypeDB, start tick
├── llm.ts                     LLM as unit
├── agent-md.ts                Parse markdown → TypeDB → runtime
└── index.ts                   Exports

src/schema/world.tql           TypeDB schema (6 dimensions, 19 functions)

gateway/src/index.ts           TypeDB proxy worker (128 lines)
workers/sync/index.ts          TypeDB → KV sync worker
nanoclaw/src/                  Edge agent worker
├── personas.ts                Bot personas (model + system prompt) — single source of truth
├── workers/router.ts          Hono routes + auth middleware + sync Telegram processing
├── channels/index.ts          Telegram, Discord, Web adapters (send/normalize)
├── lib/substrate.ts           TypeDB via gateway (toxicity, highways)
└── lib/tools.ts               7 Claude tools
nanoclaw/wrangler.toml         Main instance (open, Gemma 4 default)
nanoclaw/wrangler.donal.toml   Donal's CMO bot (BOT_PERSONA=donal, API key auth)

scripts/setup-nanoclaw.ts      One-command NanoClaw deployment (--agent or --persona)

.claude/commands/              Slash commands
├── claw.md                    /claw — add NanoClaw to any agent
├── see.md                     /see — read world state (tasks, highways, frontiers)
├── create.md                  /create — emit new entity (task, agent, signal)
├── do.md                      /do — drive work through substrate
├── close.md                   /close — close signal loop with outcome
└── sync.md                    /sync — reconcile state

agents/                        Markdown agent definitions
├── donal/                     OO Agency Pod — 11 marketing agents
├── marketing/                 8 marketing team agents
└── *.md                       Example agents
```

---

## Docs

### Core

| Doc | What it defines |
|-----|----------------|
| [DSL](docs/DSL.md) | The programming model — signal, emit, mark, warn, fade, follow, select |
| [Dictionary](docs/dictionary.md) | Every name, every concept, the full vocabulary |
| [Routing](docs/routing.md) | How signals find their way — formula, layers, tick, outcomes |
| [Architecture](docs/architecture.md) | System design, two layers, seven loops |

### Deploy

| Doc | What it covers |
|-----|---------------|
| [Deploy](docs/deploy.md) | Step-by-step deployment tutorial (every command proven) |
| [Cloudflare](docs/cloudflare.md) | Platform architecture, 4 workers, agent castes, economics |
| [Tunnels](docs/PLAN-tunnels.md) | Dev tunnels — expose localhost, test webhooks, zero trust |
| [Claw](docs/claw.md) | Autonomous edge agent — smart routing, web browsing, rich messaging |
| [TODO](docs/TODO.md) | Roadmap, status, what's next |

### Implementation

| Doc | What it covers |
|-----|----------------|
| [NanoClaw TODO](docs/TODO-claw.md) | 3-cycle completion: consolidate respond() unit, add missing endpoints, ship 3 persona workers (24 tasks) |
| [Collision Avoidance](docs/PLAN-collusion-mitigation.md) | Multi-session locking, atomic claims, TTL recovery, wave-locking |
| [TODO: Collision Avoidance](docs/TODO-collusion.md) | 3-cycle implementation (76 tests, 0 regressions, 0.89 rubric) |

### Concepts

| Doc | What it covers |
|-----|---------------|
| [Metaphors](docs/metaphors.md) | Six skins, one truth — ant/brain/team/mail/water/radio |
| [Ontology](docs/one-ontology.md) | The 6 dimensions |
| [Strategy](docs/strategy.md) | The play — wire substrate quietly, let adoption speak |
| [SDK](docs/sdk.md) | Public API contract — register, discover, hire, earn |
| [Substrate Learning](docs/substrate-learning.md) | How 70 lines route messages AND train models |

### Commerce

| Doc | What it covers |
|-----|---------------|
| [Agent Launch](docs/agent-launch.md) | Agent Launch Toolkit, tokenization, revenue sharing |
| [ASI World](docs/asi-world.md) | AgentVerse economics, FET/ASI integration |

---

## The Insight

```
Ants don't talk to each other.
Neurons don't talk to each other.
They modify the connections between them.
Other signals read those modifications.

That's intelligence.
That's what this is.

670 lines. Two fields. Build everything.
```

---

## Cost

$0/month on Cloudflare free tier. TypeDB Cloud ~$0/month.

LLM costs on agent operator's API key. Agent castes (Haiku 90% / Sonnet 9% / Opus 1%) reduce average cost to $0.0014/signal.

---

## Data Flow

```
TypeDB (truth)     →    KV (snapshot)    →    globalThis (hot)
  ~100ms RT              ~10ms read             ~0ms
  paths persist          5 keys                 30s TTL per isolate
  full history           paths.json             parsed, ready
                         units.json
                         skills.json            KV write only if hash changed
                         highways.json          Sync triggered on every signal
                         toxic.json
```

Signal path: `signal.ts → TypeDB write → trigger sync → KV updated → edge reads 0ms cache`

Tick world is cached at module level — loaded once from TypeDB, pheromone accumulates in memory between ticks. Force reload: `GET /api/tick?reload=1`.

---

## License

All rights reserved. Tony O'Connell.
