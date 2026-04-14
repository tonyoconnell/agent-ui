# NanoClaw

**Edge-native agents on Cloudflare free tier. Zero servers. Substrate-connected.**

Live: https://nanoclaw.oneie.workers.dev/health → `{"status":"ok"}`

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

## Completed

### Infrastructure
- [x] Router worker live (Hono, webhooks + queue + cron)
- [x] D1: 7 tables (groups, messages, sessions, tasks, tool_calls + base 4)
- [x] Queue: `nanoclaw-agents` (producer + consumer, batch 10, retry 3)
- [x] KV: shared with gateway (paths, units, skills, toxic caches)
- [x] Cron: `* * * * *` (scheduled task runner)
- [x] Gateway: `https://one-gateway.oneie.workers.dev` (TypeDB proxy)

### LLM
- [x] `OPENROUTER_API_KEY` secret set
- [x] Switched from Anthropic API to OpenRouter (OpenAI-compatible format)
- [x] Default model: `google/gemma-4-26b-a4b-it`
- [x] Model fallback: any cached `claude-*` or `gpt-*` model IDs auto-corrected to Gemma 4
- [x] LLM verified: Gemma 4 responding via OpenRouter (provider: Parasail)
- [x] Response parsing: OpenAI format (`choices[0].message.content` + `tool_calls`)
- [x] Error handling: text-based response parsing with fallback logging

### Channels
- [x] Telegram adapter: normalize incoming, send replies via Bot API
- [x] Discord adapter: normalize incoming, send replies via Discord API
- [x] Web adapter: normalize incoming (no push — client polls)
- [x] `TELEGRAM_TOKEN` secret set (`@antsatworkbot`)
- [x] Telegram webhook live → `nanoclaw.oneie.workers.dev/webhook/telegram`
- [x] Test message accepted: `{"ok":true,"id":"tg-1001","group":"tg-631201674"}`

### Substrate Integration
- [x] 7 substrate tools (signal, discover, remember, recall, highways, mark, warn)
- [x] Tools converted to OpenAI function-calling format at call time
- [x] Auto-registration: first message creates unit in TypeDB (KV cached 30 days)
- [x] Toxicity check: pre-LLM, blocks toxic paths (no cost)
- [x] Trail marking: mark on success, warn on failure
- [x] Routing: `discover(skill)` queries via gateway

### Security
- [x] V8 isolates (CF per-request)
- [x] Group isolation (separate D1 rows + KV keys)
- [x] Tool boundaries (7 defined tools only)
- [x] Queue retry limit (max 3)
- [x] No API keys in code — all via wrangler secrets

---

## TODO

### Reply Delivery
- [ ] Verify Telegram replies actually arrive in chat (send + parse_mode working)
- [ ] Test full round-trip: user message → queue → Gemma → reply in Telegram
- [ ] Handle Telegram markdown escaping (Gemma output may break `parse_mode: 'Markdown'`)

### Tool Calling
- [ ] Verify Gemma 4 actually triggers tool_calls (not all models support OpenAI function-calling)
- [ ] Handle tool results: currently tools execute but results aren't sent back to the model for a second turn
- [ ] Multi-turn tool loop: call model → get tool_calls → execute → send results back → get final reply

### Discord
- [ ] Set `DISCORD_TOKEN` secret
- [ ] Configure Discord bot + webhook URL in Developer Portal
- [ ] Test Discord round-trip

### Scheduled Tasks
- [ ] Test cron task execution (D1 `tasks` table → queue → process)
- [ ] Add API route to create/list/delete scheduled tasks

### Observability
- [ ] Remove debug `/debug/llm` route before production
- [ ] Remove verbose `console.log` statements (or gate behind a DEBUG flag)
- [ ] Add `/status` route showing: model, queue depth, message count, last activity

### Resilience
- [ ] Handle OpenRouter rate limits (429 → exponential backoff or queue retry)
- [ ] Handle OpenRouter outages (fallback model or graceful degradation)
- [ ] Dead letter handling: what happens after 3 queue retries?

### Agent Quality
- [ ] Tune system prompt for Gemma 4 (current prompt was written for Claude)
- [ ] Test tool descriptions with Gemma — may need simpler/shorter descriptions
- [ ] Per-group model override via D1 `groups.model` column
- [ ] Context window management: Gemma 4 context limit vs 20-message history

### Substrate Growth
- [ ] Wire `know()` — promote proven highways to permanent TypeDB knowledge
- [ ] Wire `evolve()` — rewrite struggling agent prompts after enough samples
- [ ] Cross-group routing: agent in group A signals agent in group B

---

## Architecture

```
Telegram ──┐
Discord  ──┤  POST /webhook/:channel
Web      ──┘         │
                     ▼
              ┌────────────┐
              │   Router   │  normalize → D1 → queue
              │   (Hono)   │
              └──────┬─────┘
                     │
              ┌──────▼─────┐
              │   Queue    │  nanoclaw-agents
              │  batch 10  │  max 3 retries
              └──────┬─────┘
                     │
              ┌──────▼─────┐
              │   Agent    │  context → Gemma 4 → tools → reply
              │ (consumer) │
              └──────┬─────┘
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
     ┌───────┐  ┌────────┐  ┌──────────┐
     │  D1   │  │  KV    │  │ Gateway  │
     │ msgs  │  │ cache  │  │→ TypeDB  │
     └───────┘  └────────┘  └──────────┘
```

---

## Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/health` | GET | `{"status":"ok","version":"1.0.0","service":"nanoclaw-router"}` |
| `/highways` | GET | Proven paths (`?limit=10`) |
| `/webhook/telegram` | POST | Telegram updates |
| `/webhook/discord` | POST | Discord messages |
| `/webhook/web` | POST | Direct HTTP `{"group","sender","content"}` |
| `/signal` | POST | Substrate signals `{"sender","receiver","data"}` |

---

## Signal Flow

```
1. Webhook arrives
2. normalize(channel, payload) → Signal { id, group, channel, sender, content, ts }
3. ensureRegistered(group) → unit created in TypeDB (KV cached 30 days)
4. D1: INSERT group + message
5. Queue: AGENT_QUEUE.send({ type: 'message', signal, group })
6. Consumer: loadContext(group) → last 20 messages → OpenRouter (Gemma 4)
7. Agent uses tools (signal, discover, mark, warn, remember, recall, highways)
8. Reply stored in D1, sent to channel via adapter
9. mark('entry', 'nanoclaw:{group}') → trail strengthens
```

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

## Files

```
nanoclaw/                              816 lines total
├── src/
│   ├── workers/router.ts              261 lines — Hono routes + queue consumer + cron
│   ├── channels/index.ts              117 lines — Telegram, Discord, Web adapters
│   ├── lib/substrate.ts               165 lines — query, register, toxic, mark, warn, route
│   ├── lib/tools.ts                   159 lines — 7 Claude tools + execution
│   └── types.ts                        50 lines — Env, Signal, QueueMessage, GroupContext
├── migrations/0001_init.sql            64 lines — D1 schema
├── wrangler.toml
└── package.json                        hono + wrangler@4
```

---

## Cost

$0/month on Cloudflare free tier. Gemma 4 via OpenRouter on operator's key.

| Resource | Free | Usage |
|----------|------|-------|
| Workers | 100k req/day | Webhooks + processing |
| D1 | 5GB, 5M reads | Messages, groups |
| KV | 100k reads/day | Context + toxic cache |
| Queues | 1M ops/month | Agent processing |

---

## See Also

- [cloudflare.md](cloudflare.md) — Platform architecture, 4 workers, agent castes
- [PLAN-tunnels.md](PLAN-tunnels.md) — Dev tunnels for webhook testing
- [deploy.md](deploy.md) — Step 11: NanoClaw deployment
- [routing.md](routing.md) — Substrate signal routing
- [Original NanoClaw](https://github.com/qwibitai/nanoclaw) — Container-based inspiration

---

*816 lines. Webhooks in. Gemma thinks. Tools act. Channels reply. The substrate learns.*
