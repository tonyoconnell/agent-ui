# NanoClaw on Cloudflare

**Pure edge. Claude SDK. TypeDB brain. Zero servers.**

Inspired by [qwibitai/nanoclaw](https://github.com/qwibitai/nanoclaw) — security by isolation, small enough to understand. But instead of containers, we use Cloudflare's edge platform and the ONE substrate's toxicity checks.

---

## Architecture

```
                         Cloudflare Edge
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Webhooks ──→ Worker ──→ Queue ──→ Worker ──→ Claude API   │
│  (channels)   (router)   (buffer)  (agent)    (inference)  │
│                  │                    │                     │
│                  ▼                    ▼                     │
│                 D1                   KV                     │
│              (state)            (sessions)                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │     TypeDB      │
                    │   (substrate)   │
                    │                 │
                    │  paths, units,  │
                    │  skills, know-  │
                    │  ledge, trails  │
                    └─────────────────┘
```

---

## Cloudflare Free Tier

| Service | Free Limit | Use |
|---------|------------|-----|
| Workers | 100k req/day | Router, agent execution |
| D1 | 5GB, 5M reads/day | Message history, group state |
| KV | 100k reads/day | Session cache, fast lookups |
| Queues | 1M ops/month | Message buffer, retries |
| R2 | 10GB | File attachments, exports |
| Pages | Unlimited | Dashboard UI |

No containers. No VPS. No ops. Just deploy.

---

## Core Components

### 1. Router Worker

Receives webhooks from all channels, normalizes to signal format, queues for processing.

```typescript
// src/workers/router.ts
import { Hono } from 'hono'

const app = new Hono<{ Bindings: Env }>()

// Channel webhooks
app.post('/webhook/:channel', async (c) => {
  const channel = c.req.param('channel')
  const payload = await c.req.json()
  
  // Normalize to signal
  const signal = normalize(channel, payload)
  
  // Store message
  await c.env.DB.prepare(
    'INSERT INTO messages (id, group_id, channel, sender, content, ts) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(signal.id, signal.group, channel, signal.sender, signal.content, Date.now()).run()
  
  // Queue for agent processing
  await c.env.AGENT_QUEUE.send({
    type: 'message',
    signal,
    group: signal.group,
  })
  
  return c.json({ ok: true })
})

// Substrate signals (from other units)
app.post('/signal', async (c) => {
  const { sender, receiver, data } = await c.req.json()
  
  await c.env.AGENT_QUEUE.send({
    type: 'substrate',
    sender,
    receiver,
    data,
  })
  
  return c.json({ ok: true })
})

export default app
```

### 2. Agent Worker (Queue Consumer)

Processes queued messages, calls Claude, signals substrate.

```typescript
// src/workers/agent.ts
import Anthropic from '@anthropic-ai/sdk'

interface Env {
  DB: D1Database
  KV: KVNamespace
  ANTHROPIC_API_KEY: string
  TYPEDB_URL: string
}

export default {
  async queue(batch: MessageBatch<QueueMessage>, env: Env) {
    const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
    
    for (const msg of batch.messages) {
      const { type, signal, group } = msg.body
      
      // Load group context
      const context = await loadContext(env, group)
      
      // Check toxicity via substrate
      const edge = `${signal.sender}→${group}`
      const toxic = await checkToxic(env.TYPEDB_URL, edge)
      if (toxic) {
        await msg.ack()
        continue // Silently drop toxic signals
      }
      
      // Build messages
      const messages = await buildMessages(env, group, signal)
      
      // Call Claude
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: context.systemPrompt,
        tools: substrateTools(env),
        messages,
      })
      
      // Process response
      const result = await processResponse(env, group, response)
      
      // Mark trail (success)
      await markTrail(env.TYPEDB_URL, edge, 1.0)
      
      // Send reply to channel
      if (result.reply) {
        await sendToChannel(env, group, result.reply)
      }
      
      msg.ack()
    }
  }
}
```

### 3. Substrate Tools

Claude gets tools to interact with the ONE substrate.

```typescript
// src/lib/tools.ts
export function substrateTools(env: Env): Anthropic.Tool[] {
  return [
    {
      name: 'signal',
      description: 'Send signal to another unit in the substrate',
      input_schema: {
        type: 'object',
        properties: {
          receiver: { type: 'string', description: 'Unit ID or unit:skill' },
          data: { type: 'object', description: 'Signal payload' },
        },
        required: ['receiver'],
      },
    },
    {
      name: 'discover',
      description: 'Find units with a capability (pheromone-ranked)',
      input_schema: {
        type: 'object',
        properties: {
          skill: { type: 'string', description: 'Skill to find' },
        },
        required: ['skill'],
      },
    },
    {
      name: 'remember',
      description: 'Store knowledge in substrate memory',
      input_schema: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          value: { type: 'string' },
        },
        required: ['key', 'value'],
      },
    },
    {
      name: 'recall',
      description: 'Retrieve knowledge from substrate',
      input_schema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'What to recall' },
        },
        required: ['query'],
      },
    },
    {
      name: 'highways',
      description: 'Get proven paths in the colony',
      input_schema: {
        type: 'object',
        properties: {
          limit: { type: 'number', default: 5 },
        },
      },
    },
  ]
}

// Tool execution
export async function executeTool(
  env: Env,
  group: string,
  tool: string,
  input: Record<string, unknown>
): Promise<unknown> {
  switch (tool) {
    case 'signal':
      return fetch(`${env.TYPEDB_URL}/api/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: `nanoclaw:${group}`,
          receiver: input.receiver,
          data: input.data,
        }),
      }).then(r => r.json())
      
    case 'discover':
      return fetch(`${env.TYPEDB_URL}/api/discover?skill=${input.skill}`)
        .then(r => r.json())
      
    case 'remember':
      return fetch(`${env.TYPEDB_URL}/api/knowledge`, {
        method: 'POST',
        body: JSON.stringify({ key: input.key, value: input.value, source: group }),
      }).then(r => r.json())
      
    case 'recall':
      return fetch(`${env.TYPEDB_URL}/api/recall?q=${encodeURIComponent(input.query as string)}`)
        .then(r => r.json())
      
    case 'highways':
      return fetch(`${env.TYPEDB_URL}/api/highways?limit=${input.limit || 5}`)
        .then(r => r.json())
      
    default:
      return { error: 'Unknown tool' }
  }
}
```

### 4. D1 Schema

```sql
-- migrations/0001_init.sql

-- Groups (per-channel isolation)
CREATE TABLE groups (
  id TEXT PRIMARY KEY,
  channel TEXT NOT NULL,
  name TEXT,
  system_prompt TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Messages (conversation history)
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  sender TEXT NOT NULL,
  content TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  ts INTEGER NOT NULL,
  FOREIGN KEY (group_id) REFERENCES groups(id)
);

CREATE INDEX idx_messages_group ON messages(group_id, ts);

-- Sessions (active conversations)
CREATE TABLE sessions (
  group_id TEXT PRIMARY KEY,
  last_message_id TEXT,
  context_window TEXT, -- compressed context
  updated_at INTEGER,
  FOREIGN KEY (group_id) REFERENCES groups(id)
);

-- Scheduled tasks
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  cron TEXT NOT NULL,
  prompt TEXT NOT NULL,
  next_run INTEGER,
  enabled INTEGER DEFAULT 1,
  FOREIGN KEY (group_id) REFERENCES groups(id)
);

CREATE INDEX idx_tasks_next ON tasks(next_run) WHERE enabled = 1;
```

### 5. Channel Adapters

```typescript
// src/channels/telegram.ts
export function normalizeTelegram(payload: TelegramUpdate): Signal {
  const msg = payload.message
  return {
    id: `tg-${msg.message_id}`,
    group: `tg-${msg.chat.id}`,
    channel: 'telegram',
    sender: msg.from?.username || msg.from?.id.toString() || 'unknown',
    content: msg.text || '',
    replyTo: msg.reply_to_message?.message_id?.toString(),
  }
}

export async function sendTelegram(env: Env, groupId: string, text: string) {
  const chatId = groupId.replace('tg-', '')
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
}

// src/channels/discord.ts
export function normalizeDiscord(payload: DiscordMessage): Signal {
  return {
    id: `dc-${payload.id}`,
    group: `dc-${payload.channel_id}`,
    channel: 'discord',
    sender: payload.author.username,
    content: payload.content,
  }
}

// src/channels/slack.ts
export function normalizeSlack(payload: SlackEvent): Signal {
  return {
    id: `sl-${payload.event.ts}`,
    group: `sl-${payload.event.channel}`,
    channel: 'slack',
    sender: payload.event.user,
    content: payload.event.text,
  }
}

// src/channels/index.ts
export function normalize(channel: string, payload: unknown): Signal {
  switch (channel) {
    case 'telegram': return normalizeTelegram(payload as TelegramUpdate)
    case 'discord': return normalizeDiscord(payload as DiscordMessage)
    case 'slack': return normalizeSlack(payload as SlackEvent)
    default: throw new Error(`Unknown channel: ${channel}`)
  }
}
```

---

## TypeDB Integration

NanoClaw agents are units in the ONE substrate. They don't run TypeDB — they query it.

### Registration

```typescript
// On first message from a group, register as unit
async function ensureRegistered(env: Env, groupId: string) {
  const exists = await env.KV.get(`registered:${groupId}`)
  if (exists) return
  
  await fetch(`${env.TYPEDB_URL}/api/agents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uid: `nanoclaw:${groupId}`,
      kind: 'agent',
      capabilities: ['chat', 'task', 'coordinate'],
    }),
  })
  
  await env.KV.put(`registered:${groupId}`, '1')
}
```

### Toxicity Check

Before processing any signal, check if the path is toxic.

```typescript
async function checkToxic(typedbUrl: string, edge: string): Promise<boolean> {
  const [source, target] = edge.split('→')
  const res = await fetch(
    `${typedbUrl}/api/toxic?source=${source}&target=${target}`
  )
  const { toxic } = await res.json()
  return toxic
}
```

### Trail Marking

After successful processing, strengthen the path.

```typescript
async function markTrail(typedbUrl: string, edge: string, strength: number) {
  const [source, target] = edge.split('→')
  await fetch(`${typedbUrl}/api/mark`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, target, strength }),
  })
}
```

---

## Security Model

No containers. Security comes from:

| Layer | Mechanism |
|-------|-----------|
| V8 Isolates | Cloudflare's runtime isolation per request |
| Substrate Toxicity | Paths with high alarm get blocked before LLM call |
| Tool Boundaries | Claude can only use defined tools, no shell access |
| Group Isolation | Each group has separate D1 rows, KV keys, context |
| Rate Limits | CF free tier limits are natural rate limiting |

The substrate learns. Bad actors accumulate alarm. Their signals dissolve.

---

## Scheduled Tasks

Cron Triggers for recurring work.

```typescript
// src/workers/scheduler.ts
export default {
  async scheduled(event: ScheduledEvent, env: Env) {
    const now = Math.floor(Date.now() / 1000)
    
    // Find due tasks
    const tasks = await env.DB.prepare(
      'SELECT * FROM tasks WHERE enabled = 1 AND next_run <= ?'
    ).bind(now).all()
    
    for (const task of tasks.results) {
      // Queue task execution
      await env.AGENT_QUEUE.send({
        type: 'scheduled',
        group: task.group_id,
        prompt: task.prompt,
        taskId: task.id,
      })
      
      // Update next run
      const next = getNextCron(task.cron, now)
      await env.DB.prepare(
        'UPDATE tasks SET next_run = ? WHERE id = ?'
      ).bind(next, task.id).run()
    }
  }
}
```

```toml
# wrangler.toml
[triggers]
crons = ["* * * * *"]  # Every minute
```

---

## Deployment

### 1. Create Project

```bash
npm create cloudflare@latest nanoclaw -- --template worker-typescript
cd nanoclaw
```

### 2. Configure

```toml
# wrangler.toml
name = "nanoclaw"
main = "src/workers/router.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "nanoclaw"
database_id = "<your-d1-id>"

[[kv_namespaces]]
binding = "KV"
id = "<your-kv-id>"

[[queues.producers]]
binding = "AGENT_QUEUE"
queue = "agent-queue"

[[queues.consumers]]
queue = "agent-queue"
max_batch_size = 10
max_retries = 3

[vars]
TYPEDB_URL = "https://your-typedb-instance.com"

# Secrets (set via wrangler secret put)
# ANTHROPIC_API_KEY
# TELEGRAM_TOKEN
# DISCORD_TOKEN
# SLACK_TOKEN
```

### 3. Initialize D1

```bash
wrangler d1 create nanoclaw
wrangler d1 execute nanoclaw --file=migrations/0001_init.sql
```

### 4. Set Secrets

```bash
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put TELEGRAM_TOKEN
```

### 5. Deploy

```bash
wrangler deploy
```

### 6. Set Webhooks

```bash
# Telegram
curl "https://api.telegram.org/bot${TOKEN}/setWebhook?url=https://nanoclaw.your-account.workers.dev/webhook/telegram"

# Discord - configure in Discord Developer Portal
# Slack - configure in Slack App settings
```

---

## File Structure

```
nanoclaw/
├── src/
│   ├── workers/
│   │   ├── router.ts       # Webhook receiver, queue producer
│   │   ├── agent.ts        # Queue consumer, Claude calls
│   │   └── scheduler.ts    # Cron trigger handler
│   ├── channels/
│   │   ├── index.ts        # Normalize dispatcher
│   │   ├── telegram.ts     # Telegram adapter
│   │   ├── discord.ts      # Discord adapter
│   │   └── slack.ts        # Slack adapter
│   ├── lib/
│   │   ├── tools.ts        # Substrate tools for Claude
│   │   ├── context.ts      # Group context builder
│   │   └── typedb.ts       # TypeDB client
│   └── types.ts            # Type definitions
├── migrations/
│   └── 0001_init.sql       # D1 schema
├── wrangler.toml           # Cloudflare config
└── package.json
```

---

## Comparison

| | NanoClaw (containers) | NanoClaw (CF) |
|-|----------------------|---------------|
| Runtime | Node.js + Docker | CF Workers |
| Isolation | OS containers | V8 isolates + substrate |
| State | SQLite file | D1 (distributed) |
| Queuing | In-process | CF Queues |
| Scheduling | Node cron | CF Cron Triggers |
| Cost | VPS ($5-20/mo) | Free tier |
| Latency | Single region | Global edge |
| Scaling | Manual | Automatic |
| Security | Container sandbox | Substrate toxicity |

---

## Why This Works

1. **Claude SDK is stateless** — perfect for serverless
2. **TypeDB is the brain** — Workers don't need local state
3. **Substrate handles learning** — no self-improving skills needed
4. **Toxicity replaces sandboxing** — bad paths dissolve
5. **CF free tier is generous** — 100k requests/day covers most use cases

The agent doesn't need to be smart about security. The substrate learns what's dangerous.

---

## See Also

- [hermes-agent.md](hermes-agent.md) — Heavy Python alternative
- [strategy.md](strategy.md) — The ONE substrate play
- [one-ontology.md](one-ontology.md) — Six dimensions
- [Original NanoClaw](https://github.com/qwibitai/nanoclaw) — Container-based inspiration

---

*Edge-native. Substrate-connected. Beautiful and fast and free.*
