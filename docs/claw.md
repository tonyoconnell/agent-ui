# Claw

**Autonomous edge agent. Smart, fast, capable. Bridges external channels to substrate intelligence.**

**Role:** Claw is a full agent living on Cloudflare Workers. It handles simple conversations locally (3s round-trip), knows when to ask the substrate for help, and syncs learning both directions.

Live:
- **claw** (edge agent): https://claw.oneie.workers.dev/health
- **claw-donal** (marketing agent): https://claw-donal.oneie.workers.dev/health
- **claw-debby** (agency agent): https://debby-claw.oneie.workers.dev/health
- Telegram (@onedotbot): connects via claw edge agent

## Local Development with Tunnels

Test webhooks against localhost without deploying:

```bash
# Terminal 1: Start dev server
bun run dev

# Terminal 2: Expose via Cloudflare Tunnel
bun run tunnel:local   # → https://local.one.ie

# Register Telegram webhook to your tunnel
curl "https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook?url=https://local.one.ie/webhook/telegram"

# Now: Telegram → local.one.ie → CF Tunnel → localhost:4321 → debug locally
```

| Tunnel | URL | Command |
|--------|-----|---------|
| Quick | random-slug.trycloudflare.com | `bun run tunnel` |
| Local | local.one.ie | `bun run tunnel:local` |
| Dev | dev.one.ie | `bun run tunnel:dev` |

No ngrok. Stable URLs. Free. See [PLAN-tunnels.md](PLAN-tunnels.md).

---

## Architecture: Claw as Autonomous Edge Agent

Claw is **smart and autonomous** but knows when to ask for help:

```
Telegram/Discord/Web
        │
        ▼
    CLAW (Edge Agent)
    ├─ W1. Outcome: detect sentiment from last turn
    ├─ W2. Ingest: classify tags, resolve stable UID
    ├─ W3. Recall: episodic (D1) + associative (KV) + semantic (highways)
    ├─ W4. Respond: LLM call (Haiku, fast, local)
    ├─ W5. Tools: web browse, social media, search, brand signals
    │
    ├─ SIMPLE (confident): mark locally → reply in 3s
    │
    └─ COMPLEX (uncertain): signal(substrate, task) → wait → mark globally → reply in 10s
                                        ↓
                                   SUBSTRATE
                                   (deep learning, evolution, global patterns)
                                        ↓
                                   Reply back to Claw
        │
        ▼
    Telegram/Discord/Web (reply)
```

**Two paths, one agent.** Claw chooses the path based on confidence.

---

## Admin Dashboard

Every claw gets a conversation admin panel at `/chat-debby-admin` (or any custom page).

Uses `ClawAdmin` component — configurable for any claw:

```astro
<ClawAdmin
  client:only="react"
  clawUrl="https://debby-claw.oneie.workers.dev"
  adminName="debby"
/>
```

Or via URL params: `/chat-debby-admin?claw=https://nanoclaw.oneie.workers.dev&adminName=tony`

### API Endpoints (shared, all claws)

| Route | Method | Purpose |
|-------|--------|---------|
| `/conversations` | GET | List active conversations with metadata |
| `/conversations/:group/reply` | POST | Admin injects message + pushes to student |
| `/messages/:group` | GET | Full conversation history |

Admin messages are stored with `sender: adminName` and `role: assistant` so the LLM sees them as part of the conversation context.

---

## Completed

### Claw Core (Edge Agent)
- [x] Router worker live (Hono, webhooks)
- [x] Outcome unit: detect sentiment from prior turn
- [x] Ingest unit: classify tags, resolve stable UID
- [x] Recall unit: episodic (D1) + associative (KV) + semantic (highways)
- [x] Respond unit: LLM call (Haiku via OpenRouter)
- [x] Brand signals: visual/tone identity injected into prompts
- [x] Tools: signal, discover, remember, recall, highways, mark, warn
- [x] D1: groups, messages, sessions, tool_calls, turn_meta
- [x] KV: context cache, registered groups, toxic check, knowledge

### Channels
- [x] Telegram adapter: normalize → ingest
- [x] Discord adapter: normalize → ingest
- [x] Web adapter: normalize → ingest
- [x] Reply dispatcher: send via Telegram API, Discord API, HTTP JSON
- [x] Identity linking: `/link <nonce>` cross-channel (web ↔ Telegram)

### Persona Workers
- [x] **claw** (main) — open edge agent
- [x] **claw-donal** (isolated) — marketing specialist
- [x] **claw-debby** (isolated) — agency specialist
- [x] Persona config: name, model, system prompt, channels

### Pheromone (Local + Global)
- [x] Local mark/warn: D1 paths strengthen/weaken immediately
- [x] Global signal: queue mark/warn to substrate (deferred, 5 min batch)
- [x] Bidirectional learning: edge learns from center (highways), center learns from edge (marks)

### Security
- [x] V8 isolates (CF per-request)
- [x] Group isolation (separate D1 rows + KV keys)
- [x] Tool boundaries (7 defined tools only)
- [x] API key auth on persona workers (optional, per wrangler.PERSONA.toml)
- [x] Queue retry limit (max 3)
- [x] No API keys in code — all via wrangler secrets

---

## TODO: Smart Edge Integration

**Claw keeps all features. Adds routing to substrate. Syncs learning both directions.**

See [TODO-claw.md](TODO-claw.md) for detailed 3-cycle roadmap (32 tasks).

### Cycle 1: Wire (Keep Features, Add Routing)
- [ ] Confidence detection: when to handle locally vs delegate to substrate
- [ ] Routing threshold: simple (confident) vs complex (uncertain)
- [ ] Substrate delegation: call world.ask() for complex tasks
- [ ] Timing budget: simple <3s, complex <10s

### Cycle 2: Prove (Dual Path Learning)
- [ ] Local mark: D1 paths strengthen immediately (fast feedback)
- [ ] Global signal: queue mark to substrate (slow, global learning)
- [ ] Highway refresh: KV cache syncs with TypeDB every 1 min
- [ ] Bidirectional: Claw learns from substrate patterns, substrate learns from Claw marks

### Cycle 3: Grow (Features)
- [ ] **Web browse:** fetch(url) → summarize → extract facts
- [ ] **Social media:** context(twitter_handle) → recent posts, sentiment
- [ ] **Search:** search(query) → relevant results
- [ ] **Rich messaging:** Discord threads, Web reactions, Telegram mentions
- [ ] **Tool chaining:** LLM calls tool1 → tool2 using tool1's result

---

## Architecture: Signal Flow

```
EXTERNAL (Telegram/Discord/Web)
          │
          ├─ webhook payload
          │
          ▼
    ┌──────────────┐
    │  NanoClaw    │  normalize(channel, payload)
    │  (Translator)│  ↓ signal { receiver, data }
    └──────┬───────┘
           │
           ├─ D1: store message (for history)
           │
           ▼
    ┌──────────────────────────────────────────┐
    │  SUBSTRATE WORLD (THE INTELLIGENCE)      │
    │                                          │
    │  world.signal(signal)                    │
    │    ↓                                      │
    │  (agent unit receives signal)            │
    │    ↓                                      │
    │  agent.on('receive', async (data, emit)→{
    │    ├─ recall(highways, hypotheses)       │
    │    ├─ call LLM (with brand + memory)     │
    │    ├─ mark/warn/signal (pheromone)       │
    │    └─ emit({ receiver: 'nanoclaw', ... })
    │  })                                      │
    │    ↓                                      │
    │  TypeDB: path strength accumulates       │
    │  L1-L7: loops mark/fade/evolve/know      │
    └──────┬───────────────────────────────────┘
           │
           ├─ signal { receiver: 'nanoclaw', data: reply }
           │
           ▼
    ┌──────────────┐
    │  NanoClaw    │  route to channel
    │  (Dispatcher)│  ↓ Telegram.send / Discord.send / HTTP.json
    └──────────────┘
           │
           ▼
    EXTERNAL (Telegram/Discord/Web)
```

**Pattern:** NanoClaw is stateless. World is stateful. NanoClaw = I/O. World = Intelligence.

---

## Routes (Translator Only)

| Route | Method | Purpose |
|-------|--------|---------|
| `/health` | GET | Status check (isAlive) |
| `/webhook/telegram` | POST | Telegram update → signal(world, sender, content) |
| `/webhook/discord` | POST | Discord message → signal(world, sender, content) |
| `/webhook/web` | POST | Web form → signal(world, sender, content) |
| `/signal` | POST | Receive from world agent, dispatch to channel |
| `/highways` | GET | Cache lookup (for pre-checks, optional) |

**Pattern:**
- **Inbound:** `/webhook/*` receives, normalizes, signals the world
- **Outbound:** `/signal` receives replies from world agents, sends to channel
- **No intelligence in NanoClaw.** Gateway/TypeDB queries only for read-only cache (highways, toxicity)

---

## Signal Flow: Edge-Aware

**Reception (NanoClaw):**
```
1. Webhook arrives (signed)
2. normalize(channel, payload) → Signal { id, sender, content, ts }
3. D1: INSERT message (for history only)
4. world.signal(signal)  ← HAND OFF TO SUBSTRATE
```

**Processing (Substrate Agent):**
```
5. agent unit receives signal
6. agent.on('receive', async (data, emit) => {
     ├─ recall(): get highways + hypotheses + conversation
     ├─ LLM call (inside world agent)
     │  - brand: what's our tone/style?
     │  - memory: what did we learn?
     │  - highways: what paths worked?
     ├─ mark/warn: deposit pheromone
     ├─ signal/tool: ask other agents in world
     └─ emit({ receiver: 'nanoclaw', data: reply })
   })
7. TypeDB: paths strengthen (mark) or weaken (warn)
8. L1-L7 loops: fade, evolve, know, frontier (automatic)
```

**Reply (NanoClaw):**
```
9. NanoClaw receives signal { receiver: 'nanoclaw', data: reply }
10. Channel.send(channel, reply)
11. D1: INSERT message (role='assistant', content=reply)
```

**Key:** Substrate agents call LLM INSIDE the world. NanoClaw never touches LLM. NanoClaw is input/output only.

---

## Tools (7 substrate tools)

| Tool | Input | What it does |
|------|-------|--------------|
| `signal` | `receiver`, `data` | Send signal to any unit via queue |
| `discover` | `skill` | Find units by capability via `suggest_route()` |
| `remember` | `key`, `value` | Store in KV: `knowledge:{group}:{key}` |
| `recall` | `query` | Check KV first, then TypeDB hypotheses |
| `highways` | `limit` | Proven paths (strength >= 10) via gateway |
| `mark` | `target`, `strength` | Strengthen path (insert or update) |
| `warn` | `target`, `strength` | Add resistance to path |

---

## Channel Adapters

All channels normalize to one Signal type:

```typescript
interface Signal {
  id: string        // tg-123, dc-456, web-789
  group: string     // tg-{chat_id}, dc-{channel_id}, {custom}
  channel: string   // 'telegram' | 'discord' | 'web'
  sender: string    // username or user ID
  content: string   // message text
  replyTo?: string  // reference to previous message
  ts: number        // timestamp
}
```

### Telegram

```bash
# Set token
printf 'YOUR-BOT-TOKEN' | bun wrangler secret put TELEGRAM_TOKEN

# Set webhook
curl "https://api.telegram.org/bot${TOKEN}/setWebhook?url=https://nanoclaw.oneie.workers.dev/webhook/telegram"
```

### Discord

```bash
printf 'YOUR-BOT-TOKEN' | bun wrangler secret put DISCORD_TOKEN
# Configure webhook URL in Discord Developer Portal
```

### Web (direct HTTP)

```bash
curl -X POST https://nanoclaw.oneie.workers.dev/webhook/web \
  -H 'Content-Type: application/json' \
  -d '{"group":"my-group","sender":"user","content":"Hello agent"}'
```

---

## Substrate Integration

All TypeDB access goes through the gateway. NanoClaw agents are units in the ONE substrate.

### Auto-Registration

On first message from a group:

```tql
insert $u isa unit,
  has uid "nanoclaw:{groupId}",
  has name "{groupId}",
  has unit-kind "agent",
  has status "active",
  has success-rate 0.5,
  has sample-count 0,
  has generation 0;
```

KV cached (`registered:{groupId}`) for 30 days.

### Toxicity Check (pre-LLM)

```typescript
// Before every LLM call
const toxic = r >= 10 && r > s * 2 && (r + s) > 5
// KV cached (toxic:{source}→{target}) for 5 min
// If toxic: silently drop — no LLM call, no cost
```

### Trail Marking (post-LLM)

```typescript
// Success: mark('entry', 'nanoclaw:{group}')
// → insert/update path with strength + traversals

// Failure: warn('entry', 'nanoclaw:{group}', 0.5)
// → update path resistance
```

### Routing

`discover(skill)` queries via gateway:

```tql
match
  (source: $from, target: $to) isa path, has strength $s;
  (provider: $to, offered: $sk) isa capability;
  $sk has skill-id "{skill}";
sort $s desc; limit 5;
```

---

## Storage

### D1 Tables

| Table | Columns | Purpose |
|-------|---------|---------|
| `groups` | id, channel, name, system_prompt, model, sensitivity | Per-channel config |
| `messages` | id, group_id, channel, sender, content, role, ts | History (last 20 per context) |
| `sessions` | group_id, last_message_id, context_window, updated_at | Compressed context |
| `tasks` | id, group_id, cron, prompt, next_run, enabled | Scheduled tasks |
| `tool_calls` | id, group_id, message_id, tool_name, input, output, ts | Audit trail |

### KV Cache

| Key Pattern | TTL | Purpose |
|-------------|-----|---------|
| `context:{groupId}` | 5 min | GroupContext JSON |
| `registered:{groupId}` | 30 days | Skip re-registration |
| `toxic:{source}→{target}` | 5 min | Toxicity result |
| `knowledge:{group}:{key}` | none | Agent memory |

---

## Group Context

Each group gets isolated context:

```typescript
interface GroupContext {
  id: string
  name?: string
  systemPrompt: string   // D1 or default
  model: string          // D1 or google/gemma-4-26b-a4b-it
  sensitivity: number    // 0.0-1.0
}
```

Default prompt: "You are a helpful AI assistant connected to the ONE substrate."

Last 20 messages loaded as conversation history.

---

## Security

| Layer | How |
|-------|-----|
| V8 Isolates | CF per-request runtime isolation |
| Toxicity | High-resistance paths blocked pre-LLM (no cost) |
| Tool boundaries | 7 defined tools only, no shell/filesystem |
| Group isolation | Separate D1 rows + KV keys per group |
| Rate limits | CF free tier = natural throttle |
| Queue retry | Max 3, then dead letter |

---

## Deploy

```bash
cd nanoclaw

# Auth (Global API Key)
export CLOUDFLARE_API_KEY=$(grep '^CLOUDFLARE_GLOBAL_API_KEY=' ../.env | cut -d= -f2)
export CLOUDFLARE_EMAIL=$(grep '^CLOUDFLARE_EMAIL=' ../.env | cut -d= -f2)
export CLOUDFLARE_ACCOUNT_ID=$(grep '^CLOUDFLARE_ACCOUNT_ID=' ../.env | cut -d= -f2)

# First time
bun wrangler queues create nanoclaw-agents
bun wrangler d1 execute one --remote --file=migrations/0001_init.sql

# Deploy
bun wrangler deploy

# Secrets
printf 'sk-or-YOUR-KEY' | bun wrangler secret put OPENROUTER_API_KEY
printf 'YOUR-BOT-TOKEN' | bun wrangler secret put TELEGRAM_TOKEN

# Verify
curl -s https://nanoclaw.oneie.workers.dev/health
```

---

## Personas

Four personas live in `src/personas.ts`. Each is an isolated worker deployment (`wrangler.PERSONA.toml`).

| Persona | Worker | Model | Purpose |
|---------|--------|-------|---------|
| **donal** | `donal-claw` | `anthropic/claude-haiku-4-5` | OO Marketing CMO — routes briefs to 11-agent marketing pod |
| **one** | nanoclaw (default) | `anthropic/claude-haiku-4-5` | ONE Assistant — substrate front door |
| **debby** | `debby-claw` ✅ live | `anthropic/claude-haiku-4-5` | Debby's Marketing CMO — alternative pod |
| **concierge** | optional | `google/gemma-4-26b-a4b-it` | Local Concierge — city recommendations |

**Persona selection order:**
1. `BOT_PERSONA` env var (set in `wrangler.PERSONA.toml`)
2. Group ID prefix match (e.g., `tg-donal-*` → donal persona)
3. Fallback default (one for main nanoclaw, donal for donal-claw)

**Add a new persona:**
```typescript
// src/personas.ts
export const personas: Record<string, Persona> = {
  alice: {
    name: 'Alice Bot',
    description: 'Custom persona',
    model: 'anthropic/claude-haiku-4-5',
    systemPrompt: 'You are Alice...',
  },
  // ... existing personas
}
```

Then: `bun run scripts/setup-nanoclaw.ts --name alice --persona one` (or use `/claw` skill in CLI).

---

## Bindings

```toml
name = "nanoclaw"
main = "src/workers/router.ts"
workers_dev = true
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

[vars]
GATEWAY_URL = "https://one-gateway.oneie.workers.dev"

[[d1_databases]]
binding = "DB"
database_name = "one"
database_id = "0aa5fceb-667a-470e-b08c-40ead2f4525d"

[[kv_namespaces]]
binding = "KV"
id = "1c1dac4766e54a2c85425022a3b1e9da"

[[queues.producers]]
binding = "AGENT_QUEUE"
queue = "nanoclaw-agents"

[[queues.consumers]]
queue = "nanoclaw-agents"
max_batch_size = 10
max_batch_timeout = 30
max_retries = 3

[triggers]
crons = ["* * * * *"]
```

---

## Files (NanoClaw as Signal Adapter)

```
nanoclaw/                           ~800 lines, minimal (just I/O)
├── src/
│   ├── workers/router.ts           ~250 lines — Hono routes:
│   │                                 POST /webhook/:channel → normalize + signal
│   │                                 POST /signal → receive from world agents
│   │                                 GET /status, /highways (cache lookup)
│   │
│   ├── channels/index.ts           ~120 lines — Channel adapters:
│   │                                 normalize: Telegram/Discord/Web → Signal
│   │                                 send: Signal → Telegram/Discord/Web
│   │
│   ├── lib/
│   │   ├── substrate.ts            ~80 lines — Gateway queries (read-only):
│   │                                 • highways (cache lookup)
│   │                                 • isToxic (pre-check)
│   │                                 • query (passthrough to /typedb/query)
│   │   └── identity.ts             ~60 lines — cross-channel uid linking
│   │
│   └── types.ts                    ~60 lines — Signal, GroupContext, Env
│
├── migrations/
│   └── 0001_init.sql               ~50 lines — groups, messages (logging only)
│
├── wrangler.toml                   — config (Gateway URL, D1 binding)
└── package.json                    — hono + wrangler@4 (minimal deps)
```

**Deleted:** No LLM calls, no recall units, no respond unit, no tools execution in NanoClaw.
Those all move INSIDE the world agents (substrate).
Only gateway queries (read highways, check toxicity) stay in NanoClaw for speed.

---

## Cost

**$0/month on Cloudflare free tier.** LLM costs on OpenRouter (in world agents, not NanoClaw).

| Resource | Free Tier | Usage |
|----------|-----------|-------|
| Workers | 100k req/day | NanoClaw webhooks + signal dispatch (minimal, stateless) |
| D1 | 5GB, 5M reads | Message logging only (async) |
| KV | 100k reads/day | Highway cache (read-only, from world) |
| Gateway | TypeDB Cloud | World agents query for recall, mark/warn |

**LLM:** Cost incurred by world agents calling OpenRouter (inside substrate), not by NanoClaw.
Per-agent, per-call pricing. NanoClaw is free (pure I/O adapter).

---

## How It Works: Stateless Edge, Stateful Core

1. **NanoClaw (stateless translator)** — 0ms to 1s
   - Webhook in → normalize → signal world
   - D1 logging only (async, fire-and-forget)
   - Listen for signal from world → dispatch to channel
   - No reasoning, no memory, no LLM

2. **World Agent (stateful, in substrate)** — 1s to 3s
   - Receives signal: { sender, content }
   - Recalls: highways (proven paths), hypotheses (patterns), context (episodic)
   - Calls LLM with brand + memory
   - Marks/warns: deposits pheromone
   - Emits: { receiver: 'nanoclaw', data: reply }

3. **Substrate Learning (L1-L7, TypeDB)** — seconds to weeks
   - L1-L3: mark/fade/select (immediate)
   - L4-L7: evolve/know/frontier (periodic tick)
   - Paths strengthen, agents improve, learning compounds

**Pattern:** NanoClaw = I/O adapter. World = Intelligence. TypeDB = Memory.

---

## How It Works: The Two Paths

**Simple conversation (3s):**
```
Telegram → Claw (outcome + ingest + recall + LLM + mark) → Telegram
          (all local, fast, confident)
```

**Complex reasoning (10s):**
```
Telegram → Claw (outcome + ingest + recall) + world.ask()
          → Substrate Agent (deep reasoning, evolution, global learning)
          → Reply back to Claw
          → Claw (mark globally + send) → Telegram
```

**Learning (bidirectional):**
```
Claw marks locally (D1): immediate, affects next recall
Claw signals globally (queue): substrate learns patterns
Substrate evolves: rewrites failing agent prompts
Claw recalls fresh highways: sees substrate improvements
```

---

## See Also

- [TODO-claw.md](TODO-claw.md) — 3-cycle integration roadmap (32 tasks)
- [src/engine/persist.ts](../src/engine/persist.ts) — Substrate intelligence
- [src/engine/world.ts](../src/engine/world.ts) — Signal routing, pheromone
- [cloudflare.md](cloudflare.md) — Workers platform
- [DSL.md](DSL.md) — Signal language

---

*Claw: Smart, autonomous, fast. Knows when to ask for help. Learns from substrate. Teaches substrate. Edge agent that thinks.*
