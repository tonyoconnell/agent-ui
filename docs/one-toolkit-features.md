---
title: ONE Toolkit — Features inventory + upgrade plan
type: product-spec
version: 1.0.0
updated: 2026-04-17
---

# ONE Toolkit Features

> **Packages:** `oneie` (CLI) · `@oneie/sdk` · `@oneie/mcp` · `@oneie/templates`
> **Live version:** `oneie@3.6.40` · `@oneie/*@0.1.0` (first publish pending)
> **Boundary:** substrate → learning. Minting → [agent-launch](https://agent-launch.ai) via `oneie launch`.

---

## What developers get

Four packages. One substrate. Zero lock-in.

```
npx oneie init                      # scaffold a project in 10 seconds
npm install @oneie/sdk              # call the substrate from code
npm install @oneie/mcp              # give Claude / Cursor substrate access
npm install @oneie/templates        # 30 agent presets, ready to deploy
```

### Scaffold + deploy agents

- **`oneie init`** — bootstrap a project with the 6-dimension folder structure
- **`oneie agent`** — non-interactive agent setup (CI-friendly)
- **`oneie deploy`** — deploy agents to the substrate (BaaS, CF Pages, or Managed — developer chooses)
- **`oneie claw <agentId>`** — generate NanoClaw edge config, deploy agent to Telegram/Discord
- **30 presets** (C-suite, marketing, edu, creative, support, edge) → agent markdown in one call
- **`buildWorld(name, presets[])`** — scaffold a full agent team at once
- **`buildTeam(cluster, size)`** — `buildTeam('marketing', 5)` → 5 ready-to-deploy agents

### Route signals

- **`oneie signal <receiver>`** — emit a signal into the substrate from the terminal
- **`oneie ask <receiver>`** — emit + wait, displays all 4 outcomes (result / timeout / dissolved / failure)
- **`SubstrateClient`** (v0.2.0) — same 12 verbs from code, fully typed, no raw HTTP

### Teach the substrate

- **`oneie mark <edge>`** — strengthen a path (reward good routing)
- **`oneie warn <edge>`** — raise resistance (penalise bad routing)
- **`oneie fade`** — asymmetric decay: resistance fades 2× faster than strength
- **`oneie highways`** — top weighted paths (what the substrate learned)

### Observe + remember

- **`oneie recall`** — query hypotheses from TypeDB (what patterns emerged)
- **`oneie reveal <uid>`** — full memory card: agent + signals + highways + groups + capabilities
- **`oneie frontier <uid>`** — unexplored tag clusters (what hasn't been tried yet)
- **`oneie know`** — promote proven highways to permanent learning (L6 loop)
- **`oneie forget <uid>`** — GDPR erase: delete all TypeDB records + cascade

### Sync the brain

- **`oneie sync`** — fire all loops: tick → fade → evolve → know → frontier
- **`oneie select`** — probabilistic next hop (pheromone-weighted, for debugging routing)

### Use from AI assistants (MCP)

- **15 MCP tools** — all 12 substrate verbs + 3 discovery tools available to Claude / Cursor / any MCP client
- **`scaffold_agent`**, **`list_agents`**, **`get_agent`** — preset discovery without leaving the IDE
- **HTTP adapter** at `api.one.ie/mcp/:tool` — call any tool over HTTP, no stdio required

### Launch to market

- **`oneie launch <uid>`** — one command to agent-launch: POST → get `token_id` + `tx_digest`, emit `token-launched` signal
- **`launchToken(uid, opts)`** from `@oneie/sdk` — same handoff from code
- **`generateDeployLink(uid)`** — shareable URL to the agent's deploy page
- Dry-run mode on every launch verb — test the handoff without spending

### Store agent state

- **`sdk.storage.*`** — CRUD key-value store per uid, proxied via `/api/storage/:uid`
- Survives worker restarts. Scoped per agent. Auth-gated with `ONEIE_API_KEY`.

### Configure anywhere

- `ONEIE_API_URL` → any ONE substrate (default: `api.one.ie`)
- `ONEIE_API_KEY` → auth for private routes
- `ONEIE_FRONTEND_URL` → your frontend (default: `one.ie`)
- `~/.config/oneie/config.json` → persistent local config, overridden by env

---

## Practical examples

### 1. Define an agent as markdown

Every agent is a `.md` file. One file is the complete definition — model, channels, priced skills, system prompt.

```markdown
---
name: tutor
model: meta-llama/llama-4-maverick
channels: [telegram, discord]
skills:
  - name: lesson
    price: 0.01
    tags: [education, language, beginner]
  - name: quiz
    price: 0.005
    tags: [education, assessment]
sensitivity: 0.6
---

You are a patient Spanish tutor. Start every session by asking what the
student wants to work on. Celebrate small wins. Never make them feel bad
for mistakes.
```

That file becomes a TypeDB unit, a deployed agent, a Telegram bot, and a priced capability in the marketplace — all from one `oneie deploy`. Deploy via BaaS (call `api.one.ie` from anywhere), CF Pages (free compute), or Managed (ONE hosts everything).

---

### 2. Scaffold and deploy an agent in under a minute

```bash
# Pick a preset, scaffold the markdown
npx @oneie/templates scaffold tutor my-tutor

# Sync to TypeDB + deploy (BaaS, CF Pages, or Managed)
oneie deploy

# Wire to Telegram (generates webhook config, deploys NanoClaw worker)
oneie claw my-tutor --token $TELEGRAM_BOT_TOKEN
```

The claw command gives back a live Telegram bot URL. Students message it; the substrate routes, records, and learns from every interaction.

---

### 3. Build a full agent team

```typescript
import { buildTeam, buildWorld } from '@oneie/templates'

// Predefined cluster: cmo + writer + social + analytics + strategy
const agents = buildTeam('marketing', 5)

// Or compose your own world
const world = buildWorld('startup', [
  { preset: 'ceo', name: 'alice' },
  { preset: 'cto', name: 'bob' },
  { preset: 'writer', name: 'carol', group: 'content' },
])

// world.agents → array of { markdown, filename }
// write each to agents/ and oneie deploy
for (const agent of world.agents) {
  await fs.writeFile(`agents/${agent.filename}`, agent.markdown)
}
```

Then `oneie deploy` pushes all of them. Each agent gets its own Sui wallet address derived from your platform seed + its uid — no private keys stored.

---

### 4. Send signals and read outcomes from code

```typescript
import { SubstrateClient } from '@oneie/sdk'   // v0.2.0

const one = new SubstrateClient({ apiKey: process.env.ONEIE_API_KEY })

// Route a message to an agent
const outcome = await one.ask({
  receiver: 'my-tutor:lesson',
  data: { content: 'Teach me to order coffee in Spanish' }
})

// Four outcomes — all typed, none silently swallowed
if ('result' in outcome)    console.log('Answer:', outcome.result)
if ('timeout' in outcome)   console.log('Slow — retry or route elsewhere')
if ('dissolved' in outcome) console.log('Agent not found or skill missing')
if ('failure' in outcome)   console.log('Agent produced nothing — path warned')
```

The substrate records every outcome. Paths that produce results grow stronger. Paths that fail accumulate resistance. No config file — the routing learns from traffic.

---

### 5. Reward good routing, penalise bad

```bash
# Student got a great lesson → strengthen the path
oneie mark my-tutor→my-tutor:lesson --strength 2

# Agent timed out twice → raise resistance
oneie warn my-tutor→my-tutor:quiz --strength 1

# Show what the substrate has learned
oneie highways --limit 10
# → [ { from: 'entry', to: 'my-tutor', strength: 14.2, resistance: 1.1 }, ... ]
```

From code:

```typescript
await one.mark('my-tutor→my-tutor:lesson', 2)
await one.warn('my-tutor→my-tutor:quiz', 1)
const edges = await one.highways({ limit: 10 })
```

Marks accumulate across sessions, workers, and machines — pheromone is global, stored in TypeDB.

---

### 6. Read an agent's memory

```bash
# Full memory card: signals sent/received, capabilities, group memberships,
# hypotheses learned, strongest highways, unexplored tag clusters
oneie reveal my-tutor

# What patterns has the substrate learned about this agent?
oneie recall --subject my-tutor

# What tag clusters haven't been explored yet?
oneie frontier my-tutor
```

From code:

```typescript
const card = await one.reveal('my-tutor')
// card.actor, card.signals[], card.hypotheses[], card.highways[], card.frontier[]

const insights = await one.recall({ subject: 'my-tutor' })
// [{ statement: 'agent my-tutor lesson produces result 87% of asks', confidence: 0.91 }]
```

---

### 7. Launch an agent to the market

```bash
# Handoff to agent-launch: mints a token for the agent on Sui
oneie launch my-tutor --dry-run          # sandbox — no real transaction
oneie launch my-tutor --chain sui        # real launch on Sui testnet/mainnet
```

What happens:
1. ONE sends agent uid + Sui wallet address to agent-launch
2. agent-launch mints the token, returns `token_id` + `tx_digest`
3. ONE emits a `token-launched` signal into the substrate
4. Pheromone accumulates on the `agent → token-launched` path
5. The substrate learns which agent personas convert to launches

Buy, sell, holders, bonding curves — all handled by [agent-launch](https://agent-launch.ai). ONE routes to it; it owns the economics.

From code:

```typescript
import { launchToken } from '@oneie/sdk'

const { tokenId, address, chain } = await launchToken('my-tutor', {
  chain: 'sui',
  dryRun: false,
  apiKey: process.env.AGENT_LAUNCH_KEY,
})
console.log(`Token ${tokenId} at ${address} on ${chain}`)
```

---

### 8. Give Claude access to your substrate

One config block and Claude can scaffold agents, route signals, and read memory — without leaving the conversation.

```json
{
  "mcpServers": {
    "oneie": {
      "command": "oneie-mcp",
      "env": {
        "ONEIE_API_KEY": "...",
        "ONEIE_API_URL": "https://api.one.ie"
      }
    }
  }
}
```

Claude can now:
```
scaffold_agent  → "Give me a tutor agent for French beginners"
ask             → "Ask my-tutor:lesson about greetings, show outcome"
highways        → "What are the strongest routing paths right now?"
reveal          → "Show the memory card for user:abc123"
recall          → "What has the substrate learned about my-tutor?"
forget          → "GDPR erase user:abc123 from all records"
```

Or over HTTP — no stdio required:

```bash
curl https://api.one.ie/mcp/scaffold_agent \
  -d '{"preset":"tutor","name":"french-tutor","group":"education"}'
```

---

### 9. Store agent-specific state

```typescript
import { storage } from '@oneie/sdk'

// Remember a student's progress
await storage.putStorage('student:alice', 'level', 'intermediate')
await storage.putStorage('student:alice', 'last_topic', 'past_tense')

// Read it back in any handler, any worker, any request
const level = await storage.getStorage('student:alice', 'level')  // → 'intermediate'

// List everything stored for an agent
const entries = await storage.listStorage('student:alice')
// → [{ key: 'level', value: 'intermediate' }, { key: 'last_topic', value: 'past_tense' }]
```

Scoped per uid, auth-gated, survives worker restarts. Backed by Cloudflare KV.

---

### 10. Promote learning + run loops

```bash
# L6: highways above threshold → permanent TypeDB hypotheses
oneie know

# L3: asymmetric decay — resistance fades 2× faster than strength
oneie fade --rate 0.05

# L7: which tag clusters haven't been explored yet?
oneie frontier my-tutor

# Fire all loops at once (what the tick does every 5 min in production)
oneie sync
```

After `oneie know`, the substrate has promoted proven paths to durable hypotheses. Future routing decisions can query them — "agents with `education` + `beginner` tags converge on `my-tutor`" becomes a fact in TypeDB, not just accumulated pheromone.

---

## What it provides today

### `oneie` CLI — 17 verbs

The human-facing entry point. Wraps substrate API calls as a terminal tool.

**Substrate (12) — map 1:1 to engine primitives:**

| Verb | What | Engine |
|---|---|---|
| `signal` | Emit into substrate | `world.signal()` |
| `ask` | Emit + wait, 4 outcomes displayed | `world.ask()` |
| `mark` | Strengthen a path | `persist.mark()` |
| `warn` | Raise resistance on a path | `persist.warn()` |
| `fade` | Asymmetric path decay | `world.fade()` |
| `select` | Probabilistic next hop | `world.select()` |
| `recall` | Query hypotheses from brain | `persist.recall()` |
| `reveal` | Full memory card for a uid | `persist.reveal()` |
| `forget` | GDPR erase a uid | `persist.forget()` |
| `frontier` | Unexplored tag clusters for uid | `persist.frontier()` |
| `know` | Promote highways → hypotheses | `persist.know()` |
| `highways` | Top weighted paths | `world.highways()` |

**Deploy (4+sync):**

| Verb | What |
|---|---|
| `init` | Bootstrap a project (copy scaffold folders) |
| `agent` | Non-interactive setup for AI agents |
| `deploy` | Run full 8-step pipeline |
| `claw` | Generate NanoClaw config from `/api/claw` |
| `sync` | Tick substrate loops (tick/fade/evolve/know/frontier) |

**Handoff (1):** `launch` → HTTP POST to agent-launch, emits `token-launched` signal.

---

### `@oneie/sdk` — HTTP utilities + launch

Thin, zero-dependency utility layer. **Not a local runtime** — calls `api.one.ie`.

| Surface | Exports | What |
|---|---|---|
| URLs | `getApiUrl`, `getFrontendUrl`, `getEnvironment`, `resolveApiKey`, `resolveBaseUrl`, 4 constants | Env-aware base URL resolution |
| Storage | `storage.listStorage`, `.getStorage`, `.putStorage`, `.deleteStorage` | Key-value store proxied via `/api/storage/:uid` |
| Handoff | `validateEthAddress`, `generateDeployLink` | Deploy link generation, address validation |
| Launch | `launchToken(uid, opts)` | POST to agent-launch + emit `token-launched` signal |
| Types | `OneSdkError`, `SdkConfig`, `Outcome` | Typed error, config shape, outcome union |

**Boundary:** SDK exports utilities; it does not re-export `world()`, `unit()`, `persist()` — those live in the Astro engine. Programmatic substrate calls require direct HTTP or the MCP.

---

### `@oneie/mcp` — 15 MCP tools

Substrate verbs + discovery as an MCP server. Works over stdio (Claude Code, Cursor) and HTTP (`api.one.ie/mcp/:tool`).

**Tier 1 — Substrate (12):** signal, ask, mark, warn, fade, select, recall, reveal, forget, frontier, know, highways — each wraps one API endpoint.

**Tier 2 — Discovery (3):** `scaffold_agent` (preset → markdown), `list_agents`, `get_agent`.

Setup: one JSON block in Claude Code config → `oneie-mcp` binary is the server.

---

### `@oneie/templates` — 16 presets + generator

Agent archetypes as typed data. Each preset is: `name, role, description, skills[], tags[], defaultPrice`.

**C-suite (5):** ceo, cto, cfo, coo, cro

**Marketing (7):** writer, social, community, analytics, outreach, ads, strategy

**Service (4):** payment-processor, booking-agent, subscription-manager, escrow-service

**Generator:** `generate(opts)` → `{ markdown, filename }` — produces a ready-to-deploy agent.md. Takes preset + instance name + optional model/group overrides.

**Registry:** `registry()` → `AgentTemplate[]` — all presets with their variable slots.

**People:** `buildCSuite()` → `Executive[]` — typed C-suite builder.

---

## What's missing

Grouped by the gap type.

### SDK: no substrate API client (biggest gap)

The SDK has storage + launch. It does not expose a typed client for the 12 substrate verbs. External developers who want to call `signal` or `ask` from code have to build their own HTTP calls against `api.one.ie`. That's the job of the SDK.

**Missing:**
```ts
// None of this exists yet
import { SubstrateClient } from '@oneie/sdk'

const client = new SubstrateClient({ apiKey, baseUrl })
await client.signal({ receiver: 'tutor', data: { content: 'hello' } })
const { result } = await client.ask({ receiver: 'tutor:explain', data: { topic: 'signals' } })
await client.mark('tutor→tutor:explain', 2)
const edges = await client.highways({ limit: 10 })
const card = await client.reveal('user:abc123')
```

This is the gap that makes `@oneie/sdk` feel incomplete. The MCP fills it for AI assistants. The CLI fills it for humans. Nothing fills it for code.

### Templates: missing agent categories

Current 16 presets cover C-suite, marketing, and service bots. Missing:

- **Education agents** — tutor, researcher, coach, mentor (Debby-style, live in the system but not in templates)
- **Edge/messaging agents** — telegram-bot, discord-bot, webhook-handler (nanoclaw patterns)
- **Creative agents** — designer, copywriter, creative-director (live in agents/ but not in templates)
- **Support agents** — concierge, classifier, triage (common ONE patterns)
- **Team builder** — `buildTeam(presets[])` → `WorldSpec` — scaffolds a whole agent team at once

### CLI: missing observability + management verbs

| Missing verb | What it would do |
|---|---|
| `oneie status` | Health check: substrate alive, agent count, top 3 highways |
| `oneie list` | List all active units in the world (by tag filter) |
| `oneie logs [--since]` | Tail signal history / four-outcomes audit |
| `oneie pay <receiver> <amount>` | Emit L4 economic payment signal |
| `oneie world` | ASCII world map: top agents + path strengths |

These exist as slash commands (`/see`, `/see events`) but are not on the CLI.

### MCP: no agent lifecycle tools

MCP Tier 2 only does static preset queries. Missing tools that would make the MCP genuinely useful for AI assistants managing a live substrate:

| Missing tool | What |
|---|---|
| `deploy_agent` | Deploy a markdown agent → TypeDB + NanoClaw |
| `list_active` | List live units by tag |
| `get_outcomes` | Signal history with four-outcome breakdown |
| `pay` | L4 payment signal (revenue loop entry) |

### DX: no programmatic world builder

No API for creating a full agent team without the Astro app. The `WorldSpec` type and `syncWorld()` exist in the engine but aren't exported. External developers can't build a team programmatically.

```ts
// Doesn't exist in any npm package
const world = buildWorld({
  name: 'marketing',
  agents: [template('cmo'), template('writer'), template('social')]
})
await world.deploy()
```

### DX: no local dev runtime

You can't run a local substrate without the full Astro/TypeDB stack. There's no lightweight in-memory substrate for testing that consumers of `@oneie/sdk` can use.

---

## What it should provide

Three upgrade tiers, ordered by impact.

---

### Tier 1: Complete the SDK (highest impact)

**`SubstrateClient`** — typed HTTP client for all 12 substrate verbs. Makes the SDK a real programmatic entry point, not just utilities.

```ts
// @oneie/sdk after upgrade
import { SubstrateClient } from '@oneie/sdk'

const one = new SubstrateClient({ apiKey: process.env.ONEIE_API_KEY })

// Substrate verbs
await one.signal({ receiver: 'tutor', data: { content: 'hello' } })
const outcome = await one.ask({ receiver: 'tutor:explain', data })
await one.mark('entry→tutor', 2)
await one.warn('entry→tutor', 1)
const edges = await one.highways({ limit: 10 })
const card = await one.reveal('user:abc')
const hyps = await one.recall({ subject: 'tutor' })
await one.know()
await one.fade({ rate: 0.05 })
```

Every method returns a typed result. Four-outcome algebra typed:

```ts
type Outcome =
  | { result: unknown; latency: number }
  | { timeout: true; latency: number }
  | { dissolved: true; latency: number }
  | { failure: true; latency: number }
```

**Why this first:** every other gap is tooling. This gap means you can't build a real integration without writing raw HTTP. It's the difference between SDK and wrapper.

---

### Tier 2: Expand templates + world builder

**More presets (target: 30+):**

```ts
// Education cluster
'tutor', 'researcher', 'coach', 'mentor', 'quiz-master'

// Edge/messaging cluster
'telegram-bot', 'discord-bot', 'webhook-handler', 'notifier'

// Creative cluster
'creative-director', 'copywriter', 'designer', 'video-strategist'

// Support cluster
'concierge', 'classifier', 'triage', 'escalation'
```

**`buildWorld(spec)`** — typed world scaffold:

```ts
import { buildWorld, template } from '@oneie/templates'

const marketing = buildWorld('marketing', [
  template('cmo'),
  template('writer', { name: 'alice' }),
  template('social', { group: 'content' })
])
// → { worldSpec, agentMarkdowns, deployInstructions }
```

**`buildTeam(role, size)`** — shortcut for common patterns:

```ts
buildTeam('marketing', 5)   // cmo + writer + social + analytics + strategy
buildTeam('support', 3)     // concierge + classifier + escalation
buildTeam('csuite', 5)      // ceo + cto + cfo + coo + cro
```

---

### Tier 3: MCP agent lifecycle + CLI observability

**MCP Tier 3 — agent lifecycle tools:**

| Tool | Input | Output |
|---|---|---|
| `deploy_agent` | `{markdown, name}` | `{uid, sui_address, deployed}` |
| `list_active` | `{tag?}` | `Unit[]` |
| `get_outcomes` | `{uid?, since?}` | `SignalEvent[]` |
| `pay` | `{receiver, amount, currency?}` | `{signal_id, emitted}` |

**CLI Tier 2 — observability:**

```bash
oneie status                    # substrate health + agent count + top 3 highways
oneie list [--tag marketing]    # active units by tag
oneie logs [--since 1h]         # signal history, four-outcome breakdown
oneie pay tutor 0.02            # L4 economic signal
oneie world                     # ASCII world map
```

---

## Priority matrix

| Feature | Impact | Effort | Priority |
|---|---|---|---|
| `SubstrateClient` in SDK | High — unlocks programmatic integrations | Medium — ~8 new functions, typed | **P0** |
| Education + edge presets (+14) | High — covers real Debby/nanoclaw use cases | Low — add entries to presets.ts | **P0** |
| `buildWorld` / `buildTeam` in templates | High — removes need for Astro app to scaffold teams | Medium — new module | **P1** |
| CLI: status + list + logs | Medium — observability for CLI users | Low — 3 new commands | **P1** |
| MCP Tier 3: deploy + list + pay | Medium — makes MCP useful for live agent management | Medium — 4 new tools | **P1** |
| CLI: pay + world | Low — power user commands | Low — 2 new commands | **P2** |
| Local in-memory test substrate | High long-term — enables external unit tests | High — extract world.ts from Astro | **P3** |

---

## The gap in one sentence

The toolkit gets agents **defined** and **launched**. It doesn't yet get them **managed** or **observed** from code. `SubstrateClient` closes the code gap. The preset expansion closes the template gap. Those two together make the toolkit genuinely useful to external developers, not just internal tooling.

---

## What the toolkit is NOT

These stay in agent-launch, always:

```
tokenize, buy, sell, holders, bonding curve
ERC-20, ethers, cosmjs, delegation
Agentverse HTTP auth shapes
```

`oneie launch` is the one crossing verb. Everything else runs on pheromone.

---

## Surface map (current → target)

```
oneie CLI
  today:   17 verbs (12 substrate + 4 deploy + 1 handoff)
  target:  22 verbs (+status, +list, +logs, +pay, +world)

@oneie/sdk
  today:   storage + launch + url utils (no substrate calls)
  target:  + SubstrateClient (12 methods, typed Outcome, chainable config)

@oneie/mcp
  today:   15 tools (T1 substrate + T2 discovery)
  target:  19 tools (+T3: deploy_agent, list_active, get_outcomes, pay)

@oneie/templates
  today:   16 presets (C-suite/marketing/service) + generator
  target:  30+ presets + buildWorld() + buildTeam() + WorldSpec export
```

---

## See Also

- [cli-reference.md](cli-reference.md) — 17 verb reference (current)
- [sdk-reference.md](sdk-reference.md) — SDK surface (current) + design boundary
- [mcp-tools.md](mcp-tools.md) — 15 MCP tools (current)
- [TODO-publish-toolkit.md](TODO-publish-toolkit.md) — pre-publish cleanup (2 cycles)
- [DSL.md](DSL.md) — signal grammar
- [dictionary.md](dictionary.md) — canonical names
- [routing.md](routing.md) — four-outcome algebra, the model SubstrateClient must surface
- [launch-handoff.md](launch-handoff.md) — the agent-launch contract
