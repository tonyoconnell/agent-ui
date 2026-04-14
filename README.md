# ONE 

**Signal-based substrate for AI agents. 670 lines of engine. Zero returns.**

```
{ receiver: 'scout:observe', data: { tick: 42 } }
```

Two fields. That's all that flows. The LLM is the only probabilistic component. Everything else is math.

**Live now:** [api.one.ie](https://api.one.ie/health) · [app](https://one-substrate.pages.dev) · [@onedotbot](https://t.me/onedotbot) on Telegram

---

## The Two Locked Rules

1. **Closed loop** — every signal closes: `mark()` on result, `warn()` on failure, `dissolve` on missing. No silent returns. Parallel width only compounds if every branch deposits pheromone.
2. **Structural time only** — plan in **tasks → waves → cycles**, never days/hours/weeks. Width scales by tasks-per-wave, depth by waves-per-cycle, learning by cycles-per-path. Calendar time can't be `mark()`d.

These compound. Breaking either breaks the flywheel.

---

## The DSL

```typescript
{ receiver: 'scout:observe', data: { tick: 42 } }
```

`receiver` says who. `data` says what. A signal arrives at an agent. The agent does its work. Then it emits the next signal.

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

// See what tasks you're unblocking by completing this one
const blockers = await net.taskBlockers('task-id')
// Returns: [{ id: 'task-2', name: 'Next task' }, ...]
```

The executor can see **what failed before** and **what you'll unblock**. Knowledge informs action.

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

### Spin up a new agent

```bash
# See available personas
bun run scripts/setup-nanoclaw.ts

# Full deploy with Telegram bot
bun run scripts/setup-nanoclaw.ts --name alice --persona one --token 1234:ABC...
```

One command: generates API key → CF queue → deploy → secrets → webhook → credentials printed.

### Add a persona

```typescript
// nanoclaw/src/personas.ts
personas['myagent'] = {
  name: 'My Agent',
  description: 'Does X',
  model: 'anthropic/claude-haiku-4-5',
  systemPrompt: `You are...`,
}
```

Then: `bun run scripts/setup-nanoclaw.ts --name myagent --persona myagent`

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

Deploy (requires Cloudflare account + TypeDB Cloud):

```bash
bun run deploy              # full pipeline — 106.9s verified end-to-end
bun run deploy:dry-run      # verify without deploying
bun run deploy:preview      # build + smoke, no production push
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

scripts/setup-nanoclaw.ts      One-command NanoClaw deployment script

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
| [NanoClaw](docs/nanoclaw.md) | Edge agent workers — webhooks, queue, LLM, channels |
| [TODO](docs/TODO.md) | Roadmap, status, what's next |

### Implementation

| Doc | What it covers |
|-----|----------------|
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
