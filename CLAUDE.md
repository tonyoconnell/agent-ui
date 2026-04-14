# ONE

Signal-based world for AI agents. 670 lines of engine. Zero returns.
The LLM is the only probabilistic component. Everything else is math.

**Ontology:** `src/schema/one.tql` — 100 lines, 6 dimensions, stable forever.
**Naming:** `docs/naming.md` — canonical names, retired names, never rename again.

**Live:** api.one.ie + one-substrate.pages.dev + nanoclaw.oneie.workers.dev
**Brain:** TypeDB Cloud (19 units, 18 skills, 19 functions)
**LLM:** All models via [OpenRouter](https://openrouter.ai) — default: `meta-llama/llama-4-maverick` (1M ctx, $0.15/M tokens)
**Bots:** @onedotbot (ONE assistant) · donal-claw (OO Marketing CMO) · @antsatworkbot (substrate)

## The 6 Dimensions (LOCKED)

| # | Dimension | Ontology | Runtime | What |
|---|-----------|----------|---------|------|
| 1 | **Groups** | `group` | `group` | Containers — worlds, teams, orgs |
| 2 | **Actors** | `actor` | `unit` | Who acts — humans, agents, animals, worlds |
| 3 | **Things** | `thing` | `skill` | What exists — skills, tasks, tokens |
| 4 | **Paths** | `path` | `path` | Weighted connections — strength, resistance |
| 5 | **Events** | `signal` | `signal` | What happened — signals, payments |
| 6 | **Learning** | `hypothesis` | `hypothesis` | What was discovered — patterns |

**Dead names (never use):** knowledge, connections, people, node, scent, alarm, trail, colony (as dimension)

## Quick Start

```bash
npm run dev      # Start dev server (localhost:4321)
npm run build    # Production build
/deploy          # Deploy all 4 workers to Cloudflare
```

## Architecture

Two dictionaries. Arithmetic. One probabilistic step.

```
NERVOUS SYSTEM (runtime 670 lines)     BRAIN (TypeDB ~300 lines)

signal → unit → handler → result       paths persist (strength, resistance)
  → auto-reply → mark/warn             units persist (model, prompt, gen)
  → .then() → continuation             signals logged (event history)
  → fade → select → drain              skills + tags (classification)
  → ask → { result | timeout | dissolved }  learning (hypotheses, frontiers)

loops L1-L3 (ms to min)               loops L4-L7 (hours to weeks)
```

### The Deterministic Sandwich

Every LLM call is wrapped in deterministic checks:

```
PRE:   isToxic(edge)? → dissolve (no LLM call, no cost)
PRE:   capability exists? → TypeDB lookup → dissolve
LLM:   generates response (the one probabilistic step)
POST:  result? → mark(). timeout? → neutral. dissolved? → mild warn.
```

The LLM bootstraps the group. The group replaces the LLM. Security and
learning are the same mechanism: warn() is simultaneously a firewall and a lesson.

### Seven Loops

```
L1 SIGNAL     per message     signal → ask → outcome
L2 TRAIL      per outcome     mark/warn → strength/resistance accumulates
L3 FADE       every 5 min     asymmetric decay (resistance forgives 2x faster)
L4 ECONOMIC   per payment     revenue on paths (capability price)
L5 EVOLUTION  every 10 min    rewrite struggling agent prompts (24h cooldown)
L6 KNOWLEDGE  every hour      know highways + auto-hypothesize
L7 FRONTIER   every hour      detect unexplored tag clusters
```

### Four Outcome Types

```
{ result: X }        Success. mark(). Chain strengthens with depth.
{ timeout: true }    Slow, not bad. Neutral. Chain continues.
{ dissolved: true }  Missing unit/capability. Mild warn(0.5). Chain breaks.
(no result)          Failure. Full warn(1). Chain breaks.
```

## Core Concepts

### Signal
```typescript
type Signal = { receiver: string; data?: unknown; after?: number }
```
The universal primitive. Receiver is `"unit"` or `"unit:skill"`.

### Unit
```typescript
unit(id, route?)
  .on(name, fn)           // define handler (task)
  .then(name, template)   // define continuation (dependency)
  .role(name, task, ctx)  // context-bound handler
```
Task signature: `(data, emit, ctx) => result`
Auto-reply: if signal has `replyTo`, result goes back automatically.

### World
```typescript
world()
  .add(id)                // create unit (drains queued signals)
  .remove(id)             // remove unit (paths remain, fade naturally)
  .signal(signal, from?)  // route signal, auto-mark pheromone
  .ask(signal, from?)     // signal + wait → { result | timeout | dissolved }
  .enqueue(signal)        // queue for later (priority-ordered drain)
  .drain()                // process highest-priority queued signal
  .mark(edge, strength?)  // strengthen path
  .warn(edge, strength?)  // weaken path
  .select(type?, explore?) // probabilistic routing (weighted by strength - resistance)
  .follow(type)           // deterministic routing (strongest path)
  .fade(rate?)            // asymmetric decay
  .highways(limit?)       // top weighted paths
```

### Persist
```typescript
persist()
  .actor(id, kind?, opts?)  // add + persist to TypeDB
  .flow(from, to)           // mark/warn wrapper
  .signal(s, from?)         // pre-checked: toxic → dissolve
  .ask(s, from?)            // pre-checked: toxic + capability → dissolve
  .open(n?)                 // top paths as {from, to, strength}
  .blocked()                // toxic paths
  .know()                   // promote highways to permanent learning
  .recall(match?)           // query hypotheses from TypeDB
  .load()                   // hydrate pheromone + queue from TypeDB
  .sync()                   // write all state to TypeDB
```

### Tags
Flat labels on skills and units. No hierarchy. Filter with `?tag=build&tag=P0`.
```typeql
insert $s isa skill, has skill-id "api", has name "Build API",
  has tag "build", has tag "wire", has tag "P0";
```

## Agent Markdown → TypeDB

**Agents are markdown files. TypeDB is the brain. The template deploys to Cloudflare free.**

### The Format

```markdown
---
name: creative
model: claude-sonnet-4-20250514
channels: [telegram, discord]
group: marketing
skills:
  - name: copy
    price: 0.02
    tags: [creative, copy, headlines]
  - name: iterate
    price: 0.02
    tags: [creative, iteration]
sensitivity: 0.6
---

You are the Creative Director...
```

### Markdown → TypeDB

```typescript
import { parse, syncAgent, toTypeDB } from '@/engine'

// Parse markdown
const spec = parse(markdown)

// Generate TypeDB queries
const queries = toTypeDB(spec)  // Returns insert statements

// Sync to TypeDB
await syncAgent(spec)  // Executes inserts
```

### What Gets Created in TypeDB

```tql
# Unit
insert $u isa unit,
  has uid "marketing:creative",
  has name "creative",
  has model "claude-sonnet-4-20250514",
  has system-prompt "You are the Creative Director...",
  has tag "marketing";

# Skills
insert $s isa skill, has skill-id "marketing:copy", has price 0.02, has tag "creative";

# Capability (unit can do skill)
insert (provider: $u, offered: $s) isa capability, has price 0.02;

# Group membership
insert (group: $g, member: $u) isa membership;
```

### Worlds (Agent Teams)

```typescript
import { syncWorld, wireWorld, type WorldSpec } from '@/engine'

const world: WorldSpec = {
  name: 'marketing',
  description: 'Marketing team',
  agents: [directorSpec, creativeSpec, mediaSpec, ...]
}

// Sync all to TypeDB
await syncWorld(world)

// Wire into runtime
const units = wireWorld(world, net, complete)
```

### API Endpoint

```bash
# Sync single agent
curl -X POST /api/agents/sync \
  -d '{"markdown": "---\nname: tutor\n..."}'

# Sync world
curl -X POST /api/agents/sync \
  -d '{"world": "marketing", "agents": [...]}'

# Dry run (just get TypeDB queries)
curl "/api/agents/sync?markdown=..."
```

### The Full Flow

```
agents/marketing/creative.md
        │
        ├── parse() ──────────► AgentSpec
        │                           │
        │                           ├── toTypeDB() ──► TQL inserts
        │                           │
        │                           ├── syncAgent() ──► TypeDB Cloud
        │                           │
        │                           └── wireAgent() ──► Runtime unit
        │
        └── CF Worker reads ──────► Live on Telegram/Discord
                                       │
                                       └── Substrate routes via weights
```

## Directory Structure

```
src/
  engine/       # Core: world.ts, persist.ts, loop.ts, boot.ts, llm.ts, agent-md.ts
  components/   # React 19 + shadcn/ui
  pages/        # Astro routes + 30 API endpoints
  pages/api/export/  # TypeDB → JSON snapshots (paths, units, skills, highways, toxic)
  layouts/      # Astro layouts
  schema/       # TypeDB schema (world.tql)
  lib/          # TypeDB client, auth, edge helpers, utils
docs/           # Architecture, deploy, cloudflare, nanoclaw, strategy
gateway/        # CF Worker: TypeDB proxy (api.one.ie)
workers/sync/   # CF Worker: TypeDB → KV cron (every 1 min, hash-gated writes)
nanoclaw/       # CF Worker: Edge agents (webhooks → queue → LLM → channels)
  src/
    personas.ts       # All bot personas (model + system prompt). Add here, auto-discovered everywhere.
    workers/router.ts # Hono router: auth middleware, sync Telegram processing, queue for substrate
    channels/         # normalize/send per channel (telegram, discord, web)
    lib/              # substrate.ts, tools.ts
  wrangler.toml        # Main nanoclaw (no API key, Gemma 4 default)
  wrangler.donal.toml  # Donal's CMO bot (BOT_PERSONA=donal, API key auth)
agents/         # Markdown agent definitions
  donal/        # OO Agency Pod — 11 marketing agents (cmo, full, citation, etc.)
  marketing/    # Marketing team (8 agents)
  *.md          # Example agents (tutor, researcher, coder, writer, concierge)
migrations/     # D1 schema (signals, messages, tasks, sync_log)
.claude/
  commands/     # Slash commands: /work, /tasks, /done, /grow, /highways
  skills/       # /sui, /deploy, /typedb, /astro, /react19, /reactflow, /shadcn
  rules/        # Auto-loaded rules for engine, react, astro
```

## Engine Files

| File | Lines | Purpose |
|------|------:|---------|
| `world.ts` | 225 | Unit + World + strength/resistance + queue + ask (4 outcomes) |
| `persist.ts` | 258 | PersistentWorld = World + TypeDB sync + sandwich + know/recall |
| `loop.ts` | 164 | Growth tick: all 7 loops, chain depth, outcome handling |
| `boot.ts` | 40 | Hydrate from TypeDB, add units, start tick |
| `llm.ts` | 50 | LLM as unit: openrouter adapter (+ legacy anthropic/openai) |
| `agent-md.ts` | 280 | Parse markdown agents, sync to TypeDB, wire to runtime |
| `api.ts` | 70 | `apiUnit()` — any HTTP endpoint as a substrate unit |
| `apis/index.ts` | 45 | Pre-built: github, slack, notion, mailchimp, pagerduty, discord, stripe |
| `bridge.ts` | 150 | Sui ↔ TypeDB: mirror/absorb/resolve paths on-chain |
| `durable-ask.ts` | 120 | `durableAsk()` — pending asks in D1, survive worker restarts |
| `human.ts` | 90 | `human()` — a person as a substrate unit (Telegram, Discord) |
| `agentverse-bridge.ts` | 50 | `bridgeAgentverse()` — 2M AV agents as proxy units in main world |
| `federation.ts` | 55 | `federate()` — another ONE world as a unit in this one |
| `intent.ts` | 130 | Intent cache — typed text → canonical intent → shared D1 cache entry |
| `index.ts` | 29 | Exports |

## Sui Integration (Testnet ✅)

| Component | What |
|-----------|------|
| `src/move/one/sources/one.move` | Move contract: Unit, Signal, Path, payment, fade (680 lines, 7 objects, 6 verbs) |
| `src/lib/sui.ts` | Sui client: all contract functions, keypair derivation, faucet |
| `src/engine/bridge.ts` | Mirror/absorb: Runtime ↔ Sui ↔ TypeDB (mark/warn auto-propagate) |
| `src/schema/world.tql` | TypeQL schema: `sui-unit-id`, `sui-path-id` attributes on unit/path |
| Testnet Package | `0xa5e6bddae833220f58546ea4d2932a2673208af14a52bb25c4a603492078a09e` |
| Status | Phase 1-5 done (on testnet). Phase 2 in flight (wallets). See `/sui` skill + `docs/TODO-SUI.md` |

## Key Patterns

### Zero Returns
Missing handler? Signal dissolves. Swarm continues.
```typescript
target && target(sig)    // Good: silence is valid
if (!target) throw ...   // Bad: never throw for missing
```

### Tasks as Handlers
```typescript
const bob = net.add('bob')
  .on('schema', async (data, emit) => buildSchema(data))
  .then('schema', r => ({ receiver: 'bob:api', data: r }))
  .on('api', async (data, emit) => buildAPI(data))

net.signal({ receiver: 'bob:schema', data: { spec: '...' } })
// Pheromone accumulates automatically on delivery
```

### The Closed Loop
```typescript
const { result, timeout, dissolved } = await net.ask({ receiver: next })
if (result)        net.mark(edge, chainDepth)   // success scales with chain
else if (timeout)  /* neutral — not the agent's fault */
else if (dissolved) net.warn(edge, 0.5)          // mild — path doesn't exist
else               net.warn(edge, 1)             // failure — agent produced nothing
```

### Toxicity (with cold-start protection)
```typescript
// Requires: resistance >= 10 (enough data), resistance > 2x strength (clearly bad),
// total samples > 5 (don't block new paths)
const isToxic = (edge) => r >= 10 && r > s * 2 && (r + s) > 5
```

### Agent Identity (Sui Wallets)
```
SUI_SEED (env, 32 bytes base64) + agent UID → SHA-256 → Ed25519 keypair
```
No private keys stored. Every agent derives its keypair on-the-fly from the
platform seed + its UID. Same UID always produces the same address.
`addressFor(uid)` returns the public address. `deriveKeypair(uid)` returns
the full keypair for signing. Lose the seed, lose all wallets.

## Data Flow (Three Layers)

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

- **`src/lib/edge.ts`** — in-process cache (`globalThis._edgeKvCache`). All KV reads are 0ms within TTL. Use `kvInvalidate(key)` after a direct KV write.
- **`workers/sync/index.ts`** — FNV-1a hash per key; skips KV write if data unchanged. Runs every 1 min via cron. Also triggered by `POST /sync` (called from `signal.ts` after every mark/warn).
- **`src/pages/api/tick.ts`** — `PersistentWorld` is module-level cached. Loaded from TypeDB once; pheromone accumulates in memory between ticks. Force reload: `?reload=1`.

## Slash Commands

```
/work       Autonomous loop: sense → select → execute → mark → repeat
/next       Pick one task and do it
/tasks      See tasks by category + tags (/tasks P0 build)
/add-task   Create tagged skill
/done       Mark outcome, reinforce path
/grow       Run one growth tick
/highways   Proven paths, toxic paths, frontiers
/report     Record session outcomes to substrate
/todo       Create a TODO from a source doc (uses TODO-template.md)
/wave       Run the next wave of a cycle-based TODO
```

## The Two Locked Rules

These compound. Breaking either breaks the flywheel.

**Rule 1 — Closed Loop.** Every signal closes its loop: `mark()` on result,
`warn()` on failure, `dissolve` on missing unit/capability. No silent returns,
no orphan signals, no handler that produces nothing without emitting a warn.
Width only compounds if every parallel branch deposits pheromone on the path
it used.

**Rule 2 — Structural Time Only.** Plan in **tasks → waves → cycles**. Never
days, hours, weeks, sprints, or any wall-clock unit. The substrate measures
width by tasks-per-wave, depth by waves-per-cycle, learning by cycles-per-path.
Calendar time can't be `mark()`d, so it doesn't compound. Only exception:
genuine external deadlines (merge freezes, release cuts, legal dates).

```
task   = atomic unit of work        (one .on() handler, one file edit, one recon query)
wave   = phase within a cycle       (W1 recon → W2 decide → W3 edit → W4 verify)
cycle  = full W0-W4 sandwich         exits at rubric >= 0.65
path   = what remembers across cycles (strength / resistance)
```

See `.claude/rules/engine.md` for code-level enforcement.

## TODO Rules

**ALWAYS use `docs/TODO-template.md` when creating any new TODO file.** Use `/todo` to create them.

Every TODO MUST have:
1. **Source of truth** referencing DSL.md, dictionary.md, rubrics.md
2. **Routing diagram** — signal flow down, quality marks up, fan-out sideways
3. **Schema reference** — tasks map to `world.tql` dimension 3b
4. **Wave structure** — W1 (Haiku recon), W2 (Opus decide), W3 (Sonnet edit), W4 (Sonnet verify)
5. **Task metadata** — id, value, effort, phase, persona, blocks, exit, tags
6. **Rubric scoring in W4** — fit/form/truth/taste as tagged edges via `markDims()`
7. **Self-checkoff** — W4 verify pass → mark done → update checkbox → unblock dependents
8. **See Also** linking DSL.md, dictionary.md, rubrics.md, TODO-template.md, TODO-task-management.md

DSL.md and dictionary.md are loaded as base context in every Wave 2 decision. Non-negotiable.

**Testing wraps every cycle** (the deterministic sandwich):
- **W0 (baseline):** `npm run verify` before starting any cycle — biome + typecheck + vitest
- **W4 (verify):** `npm run verify` after edits — no regressions, new tests for new code
- **Cycle gate:** all tests green, biome clean, types clean, rubric >= 0.65

## Tech Stack

- **Astro 5**: Islands architecture, SSR
- **React 19**: Actions, use(), transitions
- **TypeDB 3.0**: Brain — paths, classification, evolution, learning
- **Tailwind 4**: Styling
- **shadcn/ui**: Component library
- **ReactFlow**: Graph visualization

## Path Aliases

```typescript
import { world } from "@/engine"
import { group, unit } from "@/engine/world"
import { Card } from "@/components/ui/card"
```

## Deploy

**Use `/deploy` skill or see `docs/deploy.md` for full tutorial.**

```bash
# Auth from .env (Global API Key — never scoped tokens)
export CLOUDFLARE_API_KEY=$(grep '^CLOUDFLARE_GLOBAL_API_KEY=' .env | cut -d= -f2)
export CLOUDFLARE_EMAIL=$(grep '^CLOUDFLARE_EMAIL=' .env | cut -d= -f2)
export CLOUDFLARE_ACCOUNT_ID=$(grep '^CLOUDFLARE_ACCOUNT_ID=' .env | cut -d= -f2)

# Build + deploy all 4 workers
NODE_ENV=production npm run build
cd gateway && npx wrangler deploy && cd ../workers/sync && npx wrangler deploy && cd ../../nanoclaw && npx wrangler deploy && cd ..
npx wrangler pages deploy dist/ --project-name=one-substrate --commit-dirty=true
```

**Live URLs:**

| Service | URL |
|---------|-----|
| Pages | https://one-substrate.pages.dev |
| Gateway | https://api.one.ie/health |
| Sync | https://one-sync.oneie.workers.dev |
| NanoClaw | https://nanoclaw.oneie.workers.dev/health |
| Donal-Claw | https://donal-claw.oneie.workers.dev/health |
| TypeDB | `flsiu1-0.cluster.typedb.com:1729` |

**Key facts:**
- TypeDB Cloud port is **1729** (not 80 or 443)
- TypeDB API prefix is `/v1/` (signin, query, databases)
- Always use `CLOUDFLARE_GLOBAL_API_KEY`, never scoped tokens
- Credentials in `.env` only — never hardcode in CLAUDE.md or wrangler.toml
- `SYNC_WORKER_URL` — sync worker base URL (default: `https://one-sync.oneie.workers.dev`). Set in `.env` to trigger KV refresh from signal.ts after path changes.

## NanoClaw API

Edge agents on Cloudflare. Each worker is a persona — same codebase, different config.
Telegram webhooks process **synchronously** (~3s). Queue used only for substrate signals.

### Live Workers

| Worker | URL | Persona | Auth |
|--------|-----|---------|------|
| nanoclaw | `nanoclaw.oneie.workers.dev` | Default (Gemma 4) | Open |
| donal-claw | `donal-claw.oneie.workers.dev` | OO Marketing CMO | API key |

**@onedotbot** on Telegram → `nanoclaw.oneie.workers.dev/webhook/telegram-one` (ONE assistant persona)

### Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/health` | GET | Public | Status check |
| `/webhook/:channel` | POST | Public | Telegram/Discord webhooks |
| `/message` | POST | API key* | Send message, instant response |
| `/messages/:group` | GET | API key* | Conversation history |
| `/highways` | GET | API key* | Proven paths |

*Auth only required when `API_KEY` secret is set on the worker.

### Personas

Defined in `nanoclaw/src/personas.ts`. Add an entry → auto-discovered by router + setup script.

```typescript
// nanoclaw/src/personas.ts
personas = {
  donal: { name: 'OO Marketing CMO', model: 'anthropic/claude-haiku-4-5', systemPrompt: '...' },
  one:   { name: 'ONE Assistant',     model: 'anthropic/claude-haiku-4-5', systemPrompt: '...' },
  // add new personas here
}
```

Persona selection order: `BOT_PERSONA` env var → group ID prefix (`tg-donal-*`) → default.

### Spin up a new NanoClaw in one command

```bash
# List available personas
bun run scripts/setup-nanoclaw.ts

# Deploy with Telegram bot
bun run scripts/setup-nanoclaw.ts --name alice --persona one --token 1234:ABC...

# Deploy without bot (wire Telegram later)
bun run scripts/setup-nanoclaw.ts --name alice --persona one
```

The script: generates API key → creates CF queue → deploys worker → sets secrets → registers webhook → prints credentials.

### Web Message API

```bash
# Open worker (no auth)
curl -X POST https://nanoclaw.oneie.workers.dev/message \
  -H "Content-Type: application/json" \
  -d '{"group": "my-conversation", "text": "What is ONE?"}'

# Auth-gated worker (donal-claw)
curl -X POST https://donal-claw.oneie.workers.dev/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <API_KEY>" \
  -d '{"group": "donal", "text": "Full SEO audit for elitemovers.ie"}'
```

### Secrets

| Secret | Required | Purpose |
|--------|----------|---------|
| `OPENROUTER_API_KEY` | Yes | LLM calls |
| `TELEGRAM_TOKEN` | Optional | Default Telegram bot reply |
| `TELEGRAM_TOKEN_ONE` | Optional | @onedotbot reply token |
| `TELEGRAM_TOKEN_DONAL` | Optional | Multi-bot routing on main nanoclaw |
| `API_KEY` | Optional | Enables auth on non-webhook routes |
| `DISCORD_TOKEN` | Optional | Discord reply token |

## Skills (USE THESE)

| Skill | Trigger | What it provides |
|-------|---------|-----------------|
| `/sui` | Move contracts, wallets, Sui integration | Build Move contracts, agent wallets, mirror/absorb bridge, escrow patterns, TypeDB ↔ Sui sync |
| `/deploy` | Deploy to Cloudflare | Gateway + sync + Pages. Uses CLOUDFLARE_GLOBAL_API_KEY |
| `/typedb` | Any TQL, schema, query work | TypeDB 3.0 syntax, functions (NOT rules) |
| `/reactflow` | Graph visualization | Custom nodes, dark theme |
| `/react19` | React components, hooks | React 19 patterns, use(), transitions |
| `/astro` | Pages, layouts, islands | Astro 5 hydration, SSR |
| `/shadcn` | UI components | shadcn/ui dark theme |

**CRITICAL: TypeDB 3.x removed `rule` syntax. Use `fun` (functions) only.**
**NEW: `/sui` skill for Sui Move contracts, agent wallets, bridge (testnet ✅, Phase 2 in flight).**

## Canonical Docs (READ THESE)

These docs define the system's vocabulary, routing, metaphors, and SDK contract.
**Always consult them when working on engine, schema, or docs changes.**
They must stay in sync with `src/engine/loop.ts`, `src/schema/*.tql`, and each other.

| Doc | What it defines | Syncs with |
|-----|----------------|------------|
| `src/schema/one.tql` | **THE ONTOLOGY** — 100 lines, 6 dimensions, stable forever | Everything |
| `docs/naming.md` | **THE NAMES** — canonical names, dead names, dimension→runtime map | All docs, schemas, APIs |
| `docs/one-ontology.md` | **THE SPEC** — 6 dimensions explained, actor/group/thing types, universal mapping | `one.tql`, `naming.md` |
| `docs/AUTONOMOUS_ORG.md` | **THE BLUEPRINT** — ONE-strategy as executable task graph with pheromone routing, 7 personas, revenue forecast | `world.tql`, `tick.ts`, revenue loops |
| `docs/metaphors-extended.md` | **THE ROSETTA STONE** — Langchain, AgentVerse, Hermes, all frameworks speak ONE pheromone | Framework integrations, all routing |
| `docs/dictionary.md` | Concept reference — detailed descriptions of every primitive | `naming.md` (naming.md is authoritative) |
| `docs/DSL.md` | The programming model — signal, emit, mark, warn, fade, follow, select | `world.ts`, `persist.ts` |
| `docs/routing.md` | How signals find their way — formula, layers, tick, outcomes | `loop.ts`, `persist.ts` |
| `docs/metaphors.md` | Six skins, one truth — ant/brain/team/mail/water/radio | `src/skins/index.ts`, `skins.tql` |
| `docs/sdk.md` | SDK contract — register, discover, hire, earn | Public API surface |
| `docs/world-map-page.md` | BUILD SPEC — /world page design, direct manipulation, personas, visitor mode, 12-component limit | `src/pages/world.astro`, `src/components/WorldMap/*` |

**Sync rules:**
- File references in docs must match actual engine filenames
- Terminology must match post-migration vocabulary (strength/resistance, not scent/alarm)
- Metaphor-specific words (ant: alarm, brain: inhibit) stay as metaphor aliases only
- `skins.tql` and `skins/index.ts` must agree with `metaphors.md` mapping tables
- `loop.ts` must implement the 7 loops described in `dictionary.md` and `routing.md`
- `world.tql` functions must match the classification/routing tables in `DSL.md`

## Rules

See `.claude/rules/` for framework-specific patterns:
- `engine.md` — Substrate patterns, zero returns, signal flow
- `react.md` — React 19 patterns, typed props, hooks
- `astro.md` — Astro 5 islands, hydration, SSR
