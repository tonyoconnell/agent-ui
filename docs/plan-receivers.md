# Plan: Receivers

**Goal:** Implement all 20 receiver examples from `docs/receivers.md`.  
**Status:** ✅ Complete. All 20 examples work. See [gaps-receivers.md](gaps-receivers.md) for what was built.

---

## Dependency Graph

```
Gap 3: apiUnit()          → unblocks examples 2, 3, 8, 10, 12, 14, 15
Gap 4: delayed queue      → unblocks examples 10, 12
Gap 1: durable ask()      → required for Gap 2
Gap 2: human unit         → unblocks examples 1, 4, 6, 7, 11, 13, 18, 19
Gap 5: AgentVerse bridge  → unblocks example 9
Gap 6: federation         → unblocks example 17

Build order: 3 → 4 → 1 → 2 → 5 → 6
```

---

## Plan A — Week 1

**`apiUnit()` factory + delayed queue signal.**
Unblocks 9 examples. No new infrastructure. Pure engine additions.

### A1: `src/engine/api.ts` (new file, ~80 lines)

```typescript
import { unit, type Unit } from './world'

export interface ApiOpts {
  base: string
  auth?: string                          // 'Bearer TOKEN' or 'Basic ...'
  headers?: Record<string, string>
  timeout?: number                       // ms, default 10_000
}

const buildHeaders = (opts: ApiOpts): Record<string, string> => ({
  'Content-Type': 'application/json',
  ...(opts.auth ? { Authorization: opts.auth } : {}),
  ...(opts.headers || {}),
})

/**
 * Wrap any HTTP endpoint as a substrate unit.
 * null return → warn() fires automatically (no result = failure).
 *
 * Tasks:
 *   get  — GET {base}{path}?{params}
 *   post — POST {base}{path} with JSON body
 *   put  — PUT  {base}{path} with JSON body
 *   del  — DELETE {base}{path}
 *
 * Usage:
 *   net.units['github'] = apiUnit('github', {
 *     base: 'https://api.github.com',
 *     auth: `Bearer ${GITHUB_TOKEN}`
 *   })
 *   net.signal({ receiver: 'github:post',
 *     data: { path: '/repos/o/r/pulls', body: { title: 'PR', head: 'feat', base: 'main' } }
 *   }, 'scout')
 */
export const apiUnit = (id: string, opts: ApiOpts): Unit => {
  const h = buildHeaders(opts)
  const base = opts.base.replace(/\/$/, '')
  const ctrl = () => {
    const ac = new AbortController()
    setTimeout(() => ac.abort(), opts.timeout ?? 10_000)
    return ac
  }

  return unit(id)
    .on('get', async (data) => {
      const { path, params } = data as { path: string; params?: Record<string, string> }
      const url = new URL(base + path)
      if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
      const res = await fetch(url.toString(), { headers: h, signal: ctrl().signal }).catch(() => null)
      return res?.ok ? await res.json() : null
    })
    .on('post', async (data) => {
      const { path, body } = data as { path: string; body: unknown }
      const res = await fetch(base + path, {
        method: 'POST', headers: h, body: JSON.stringify(body), signal: ctrl().signal
      }).catch(() => null)
      return res?.ok ? await res.json() : null
    })
    .on('put', async (data) => {
      const { path, body } = data as { path: string; body: unknown }
      const res = await fetch(base + path, {
        method: 'PUT', headers: h, body: JSON.stringify(body), signal: ctrl().signal
      }).catch(() => null)
      return res?.ok ? await res.json() : null
    })
    .on('del', async (data) => {
      const { path } = data as { path: string }
      const res = await fetch(base + path, {
        method: 'DELETE', headers: h, signal: ctrl().signal
      }).catch(() => null)
      return res?.ok ? { deleted: true } : null
    })
}
```

**Export:** add to `src/engine/index.ts`:
```typescript
export { apiUnit } from './api'
export type { ApiOpts } from './api'
```

---

### A2: Delayed Queue — `src/engine/world.ts` (~10 line change)

**Signal type gets optional `after` field:**

```typescript
// world.ts line 18 — add after?: number
export type Signal = { receiver: string; data?: unknown; after?: number }
```

**drain() skips future signals:**

```typescript
// world.ts drain() — add ready filter before priority sort
const drain = (): Signal | null => {
  if (!queue.length) return null
  const now = Date.now()
  const ready = queue.filter(s => !s.after || s.after <= now)  // ← ADD THIS LINE
  if (!ready.length) return null

  let best = 0
  for (let i = 1; i < ready.length; i++) {
    const pi = (ready[i].data as any)?.priority || 'P9'
    const pb = (ready[best].data as any)?.priority || 'P9'
    if (pi < pb) best = i
  }
  const s = ready[best]
  queue.splice(queue.indexOf(s), 1)
  signal(s)
  return s
}
```

**Usage:**
```typescript
// Schedule social post for 9am Friday
net.enqueue({
  receiver: 'twitter:post',
  data: { text: 'New feature launched!' },
  after: new Date('2026-04-11T09:00:00Z').getTime()
})
// drain() skips this until that timestamp
```

---

### A3: Pre-built API units for common services

**`src/engine/apis/index.ts`** (new, ~60 lines)

```typescript
import { apiUnit } from '../api'

// GitHub
export const github = (token: string) => apiUnit('github', {
  base: 'https://api.github.com',
  auth: `Bearer ${token}`,
  headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }
})

// Slack
export const slack = (token: string) => apiUnit('slack', {
  base: 'https://slack.com/api',
  auth: `Bearer ${token}`
})

// Notion
export const notion = (token: string) => apiUnit('notion', {
  base: 'https://api.notion.com/v1',
  auth: `Bearer ${token}`,
  headers: { 'Notion-Version': '2022-06-28' }
})

// Linear
export const linear = (token: string) => apiUnit('linear', {
  base: 'https://api.linear.app/graphql',
  auth: token
})

// PagerDuty
export const pagerduty = (token: string) => apiUnit('pagerduty', {
  base: 'https://api.pagerduty.com',
  auth: `Token token=${token}`
})

// Mailchimp
export const mailchimp = (token: string, dc: string) => apiUnit('mailchimp', {
  base: `https://${dc}.api.mailchimp.com/3.0`,
  auth: `Bearer ${token}`
})
```

**Export:** add to `src/engine/index.ts`:
```typescript
export { github, slack, notion, linear, pagerduty, mailchimp } from './apis'
```

---

### A4: Examples unlocked by Plan A

```typescript
// Example 2: GitHub PR
net.units['github'] = github(GITHUB_TOKEN)
net.signal({ receiver: 'github:post',
  data: { path: '/repos/owner/repo/pulls', body: { title: 'Auto PR', head: 'feat', base: 'main' } }
}, 'loop')

// Example 10: Daily standup at 9am
net.enqueue({
  receiver: 'agent:summarise',
  data: { prompt: 'Summarise yesterday stand-up' },
  after: nextNineAM()
})

// Example 14: Podcast → Newsletter
net.units['mailchimp'] = mailchimp(MC_TOKEN, 'us1')
// transcribe → summarise → write_email → mailchimp:post → done
```

---

## Plan B — Week 2

**Durable ask() + human unit factory.**
The most important week. Puts humans in the loop.

### B1: D1 Migration — `migrations/0003_pending_asks.sql`

```sql
-- Durable ask() state — survives worker restarts
CREATE TABLE IF NOT EXISTS pending_asks (
  id          TEXT PRIMARY KEY,           -- 'ask:uuid'
  signal_json TEXT NOT NULL,              -- Signal serialised
  from_unit   TEXT NOT NULL,
  expires_at  INTEGER NOT NULL,           -- Unix ms
  resolved    INTEGER DEFAULT 0,          -- 0 = pending, 1 = resolved
  result_json TEXT,                       -- null until resolved
  channel     TEXT,                       -- 'telegram' | 'discord' | 'webhook'
  channel_id  TEXT,                       -- Telegram chat_id or Discord channel ID
  created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_asks_expires ON pending_asks(expires_at) WHERE resolved = 0;
CREATE INDEX IF NOT EXISTS idx_asks_channel ON pending_asks(channel, channel_id) WHERE resolved = 0;
```

---

### B2: `src/engine/durable-ask.ts` (new file, ~120 lines)

```typescript
import type { Signal } from './world'

export interface DurableAskEnv {
  DB: D1Database     // Cloudflare D1 binding
}

export interface DurableAskResult {
  result?: unknown
  timeout?: boolean
  dissolved?: boolean
}

/**
 * Durable ask: persists the pending reply in D1.
 * Survives worker restarts. Resolves when POST /api/ask/reply is called
 * with the ask ID, or when expires_at is exceeded.
 *
 * Usage:
 *   const { result } = await durableAsk(env, signal, 'entry', 3_600_000)
 */
export const durableAsk = async (
  env: DurableAskEnv,
  s: Signal,
  from = 'entry',
  timeoutMs = 86_400_000,   // 24h default for human-in-loop
  channel?: { type: 'telegram' | 'discord'; id: string }
): Promise<DurableAskResult> => {
  const id = `ask:${crypto.randomUUID()}`
  const expiresAt = Date.now() + timeoutMs

  // 1. Write pending state
  await env.DB.prepare(
    'INSERT INTO pending_asks (id, signal_json, from_unit, expires_at, channel, channel_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, JSON.stringify(s), from, expiresAt, channel?.type ?? null, channel?.id ?? null, Date.now()).run()

  // 2. Signal the receiver (they'll POST to /api/ask/reply with id + result)
  const signalWithReply = { ...s, data: { ...(s.data as object || {}), replyTo: id } }

  // 3. Poll D1 for resolution (short-poll within isolate lifetime, durable across restarts)
  const POLL_INTERVAL = 1000  // 1s
  const MAX_SYNC_WAIT = 25_000  // 25s — within CF isolate lifetime

  return new Promise((resolve) => {
    const deadline = Math.min(Date.now() + MAX_SYNC_WAIT, expiresAt)
    const poll = setInterval(async () => {
      if (Date.now() > deadline) {
        clearInterval(poll)
        // Check if it resolved in D1 across a restart
        const row = await env.DB.prepare(
          'SELECT resolved, result_json FROM pending_asks WHERE id = ?'
        ).bind(id).first<{ resolved: number; result_json: string | null }>()
        if (row?.resolved) {
          resolve({ result: row.result_json ? JSON.parse(row.result_json) : true })
        } else if (Date.now() >= expiresAt) {
          resolve({ timeout: true })
        }
        return
      }
      const row = await env.DB.prepare(
        'SELECT resolved, result_json FROM pending_asks WHERE id = ?'
      ).bind(id).first<{ resolved: number; result_json: string | null }>()
      if (row?.resolved) {
        clearInterval(poll)
        resolve({ result: row.result_json ? JSON.parse(row.result_json) : true })
      }
    }, POLL_INTERVAL)
  })
}

/**
 * Resolve a pending ask. Called by:
 *   - POST /api/ask/reply (webhook from Telegram/Discord/email)
 *   - Any handler that knows the ask ID
 */
export const resolveAsk = async (
  env: DurableAskEnv,
  id: string,
  result: unknown
): Promise<boolean> => {
  const r = await env.DB.prepare(
    'UPDATE pending_asks SET resolved = 1, result_json = ? WHERE id = ? AND resolved = 0'
  ).bind(JSON.stringify(result), id).run()
  return r.meta.changes > 0
}

/**
 * Expire stale asks. Run from cron worker.
 */
export const expireAsks = async (env: DurableAskEnv): Promise<number> => {
  const r = await env.DB.prepare(
    'UPDATE pending_asks SET resolved = 1 WHERE expires_at < ? AND resolved = 0'
  ).bind(Date.now()).run()
  return r.meta.changes
}
```

---

### B3: `POST /api/ask/reply` — `src/pages/api/ask/reply.ts`

```typescript
// Resolves a pending durable ask. Called by:
//   - NanoClaw when Telegram user replies to a bot message
//   - Any external system that holds a replyTo ask ID
//   - Human approval UI

import type { APIRoute } from 'astro'
import { resolveAsk } from '@/engine/durable-ask'

export const POST: APIRoute = async ({ request, locals }) => {
  const { id, result } = await request.json() as { id: string; result: unknown }
  if (!id) return new Response('missing id', { status: 400 })

  const env = locals.runtime?.env as { DB: D1Database }
  const resolved = await resolveAsk(env, id, result)
  return Response.json({ ok: resolved })
}
```

**Wire into NanoClaw:** when a Telegram reply arrives with text matching a pending ask,
extract the `replyTo` from message context and call `resolveAsk()`.

---

### B4: `src/engine/human.ts` (new file, ~100 lines)

```typescript
import { unit, type Unit } from './world'
import { durableAsk, type DurableAskEnv } from './durable-ask'

export interface HumanOpts {
  env: DurableAskEnv
  telegram?: number          // Telegram user ID
  discord?: string           // Discord user ID
  timeout?: number           // default 24h
  telegramBotToken?: string  // override if not in env
}

/**
 * A human as a substrate unit.
 * Routes signals to Telegram/Discord and waits for reply.
 * Slow humans accumulate resistance. Fast, accurate humans become highways.
 *
 * Tasks:
 *   approve   — yes/no decision with optional feedback
 *   review    — open-ended review, returns text
 *   choose    — pick from options [ ] [ ] [ ]
 *
 * Usage:
 *   net.units['anthony'] = human('anthony', {
 *     env, telegram: 123456789, timeout: 3_600_000
 *   })
 *   const { result } = await net.ask(
 *     { receiver: 'anthony:approve', data: { draft: '...' } }, 'writer'
 *   )
 */
export const human = (id: string, opts: HumanOpts): Unit => {
  const timeout = opts.timeout ?? 86_400_000  // 24h

  const sendTelegram = async (text: string, replyToId: string) => {
    if (!opts.telegram || !opts.telegramBotToken) return
    await fetch(`https://api.telegram.org/bot${opts.telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: opts.telegram,
        text: `${text}\n\n_Reply to this message to respond. Ask ID: ${replyToId}_`,
        parse_mode: 'Markdown'
      })
    }).catch(() => {})
  }

  return unit(id)
    .on('approve', async (data) => {
      const { draft, question, replyTo } = data as { draft?: string; question?: string; replyTo: string }
      const msg = question ?? `Please approve:\n\n${draft ?? '(no content)'}\n\nReply: yes / no / [feedback]`
      await sendTelegram(msg, replyTo)

      return await durableAsk(opts.env,
        { receiver: id, data },
        id,
        timeout,
        opts.telegram ? { type: 'telegram', id: String(opts.telegram) } : undefined
      )
    })
    .on('review', async (data) => {
      const { content, question, replyTo } = data as { content?: string; question?: string; replyTo: string }
      const msg = question ?? `Please review:\n\n${content ?? ''}`
      await sendTelegram(msg, replyTo)

      return await durableAsk(opts.env,
        { receiver: id, data },
        id,
        timeout,
        opts.telegram ? { type: 'telegram', id: String(opts.telegram) } : undefined
      )
    })
    .on('choose', async (data) => {
      const { options, question, replyTo } = data as { options: string[]; question?: string; replyTo: string }
      const numbered = options.map((o, i) => `${i + 1}. ${o}`).join('\n')
      const msg = `${question ?? 'Choose one:'}\n\n${numbered}\n\nReply with a number.`
      await sendTelegram(msg, replyTo)

      return await durableAsk(opts.env,
        { receiver: id, data },
        id,
        timeout,
        opts.telegram ? { type: 'telegram', id: String(opts.telegram) } : undefined
      )
    })
}
```

**Export:** add to `src/engine/index.ts`:
```typescript
export { human } from './human'
export type { HumanOpts } from './human'
export { durableAsk, resolveAsk, expireAsks } from './durable-ask'
export type { DurableAskEnv, DurableAskResult } from './durable-ask'
```

---

### B5: NanoClaw — wire reply → resolveAsk

In `nanoclaw/src/index.ts` (or wherever Telegram webhook is handled), add:

```typescript
// When a message arrives that is a reply to a bot message:
if (update.message?.reply_to_message) {
  const askId = extractAskId(update.message.reply_to_message.text)
  if (askId) {
    await resolveAsk(env, askId, { text: update.message.text, from: update.message.from })
    await sendTelegram(chatId, '✓ Received')
    return  // Don't route to LLM — this was an ask resolution
  }
}
```

`extractAskId` parses `Ask ID: ask:uuid` from the bot message text.

---

### B6: Examples unlocked by Plan B

```typescript
// Example 1: Slack message approval
net.units['anthony'] = human('anthony', { env, telegram: ANTHONY_TELEGRAM_ID })
net.units['slack']   = slack(SLACK_TOKEN)

net.add('writer')
  .on('draft', async (data, emit) => {
    const draft = await complete((data as any).brief)
    emit({ receiver: 'anthony:approve', data: { draft } })
    return { draft }
  })

// When anthony approves via Telegram → resolveAsk fires → signal continues to slack:post

// Example 7: Legal contract signing
net.units['partner'] = human('partner', {
  env, telegram: PARTNER_TELEGRAM_ID, timeout: 7_200_000  // 2h
})
// Chain: drafter → review → compliance → partner:approve → docusign:post
// Worker can restart freely. Ask survives in D1.
```

---

## Plan C — Week 3

**AgentVerse bridge + basic federation.**

### C1: AgentVerse Proxy — `src/engine/agentverse-bridge.ts` (~60 lines)

```typescript
import { unit, type World } from './world'
import { agentverse, sync, type Agentverse } from './agentverse'

/**
 * Bridge AgentVerse into the main substrate world.
 * Creates proxy units: net.units['av:agent-address'] = forwardToAV
 * Pheromone in the main world tracks which AV agents are reliable.
 *
 * Usage:
 *   const av = await bridgeAgentverse(net, fetchFn, AGENTVERSE_API_KEY)
 *   net.signal({ receiver: 'av:agent1abc:translate',
 *     data: { text: 'Hello', to: 'fr' } }, 'writer')
 */
export const bridgeAgentverse = async (
  net: World,
  fetchFn: (address: string, data: unknown) => Promise<unknown>,
  apiKey: string
): Promise<Agentverse> => {
  const av = agentverse(fetchFn)
  await sync(av, apiKey)

  // Create proxy unit for each AV agent
  for (const id of av.list()) {
    net.add(`av:${id}`)
      .on('default', async (data, emit, ctx) => {
        // Forward to AgentVerse
        const result = await av.call(id, 'default', data)
        return result  // null → warn() in MAIN world
      })
  }

  // Discovery proxy: av:discover discovers by domain, routes to best
  net.add('av')
    .on('discover', async (data) => {
      const { domain, task } = data as { domain: string; task: unknown }
      const agents = av.discover(domain, 5)
      if (!agents.length) return null
      // STAN in main world picks — but for first call, try the best by AV pheromone
      const best = agents[0]
      return await av.call(best.address, domain, task)
    })

  return av
}
```

**Export:**
```typescript
export { bridgeAgentverse } from './agentverse-bridge'
```

---

### C2: Basic Federation — outbound signal to another world

A federated unit is just an `apiUnit` pointed at another substrate's `/api/signal`:

```typescript
// src/engine/federation.ts (~40 lines)
import { apiUnit } from './api'
import type { Signal } from './world'

/**
 * Mount another ONE substrate as a unit in this world.
 * Signals forwarded to world-b appear as normal signals in this world.
 * Pheromone tracks cross-world reliability.
 *
 * Usage:
 *   net.units['world-b'] = federate('world-b', 'https://world-b.one.ie', API_KEY)
 *   net.signal({ receiver: 'world-b:scout', data: { task: 'research' } }, 'entry')
 */
export const federate = (id: string, baseUrl: string, apiKey: string) => {
  const base = apiUnit(id, {
    base: baseUrl,
    auth: `Bearer ${apiKey}`
  })

  // Override: default handler forwards the whole signal to /api/signal
  return unit(id)
    .on('default', async (data) => {
      const { receiver, ...rest } = data as Signal & { receiver: string }
      const res = await fetch(`${baseUrl}/api/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ sender: id, receiver, data: rest })
      }).catch(() => null)
      return res?.ok ? await res.json() : null
    })
}
```

**Export:**
```typescript
export { federate } from './federation'
```

---

### C3: Examples unlocked by Plan C

```typescript
// Example 9: Translation via AgentVerse
const av = await bridgeAgentverse(net, myFetch, AV_API_KEY)
// All 2M agents now routable as av:address
// STAN learns which translator is best over time
net.signal({ receiver: 'av:discover', data: { domain: 'translate', task: { text: 'Hello', to: 'fr' } } }, 'writer')

// Example 17: Tender response with federated legal + pricing
net.units['world-legal']   = federate('world-legal',   'https://legal.one.ie',   LEGAL_KEY)
net.units['world-finance'] = federate('world-finance', 'https://finance.one.ie', FINANCE_KEY)
// Signal chain crosses world boundaries transparently
```

---

## Summary

| Plan | Lines | New files | Examples unblocked |
|------|-------|-----------|-------------------|
| A: apiUnit + delayed queue | ~150 | `api.ts`, `apis/index.ts` | 2, 3, 8, 10, 12, 14, 15 |
| B: durable ask + human unit | ~370 | `durable-ask.ts`, `human.ts`, migration, API route | 1, 4, 6, 7, 11, 13, 18, 19 |
| C: AV bridge + federation | ~100 | `agentverse-bridge.ts`, `federation.ts` | 9, 17 |
| **Total** | **~620 lines** | **6 new files** | **17 more examples** |

Three work today. Twenty work after Plan C.

---

## What Doesn't Change

The substrate core is correct. `world.ts`, `persist.ts`, `loop.ts` need no architectural
changes. Every gap is a surface addition:

- `apiUnit()` is a new factory using the existing `unit()` primitive
- Delayed queue is 10 lines in existing `drain()`
- Durable ask wraps the existing ask/reply pattern with D1 persistence
- Human unit uses the existing NanoClaw channel adapters
- AV bridge and federation are unit factories using the existing routing

**The pheromone system learns all of these without knowing what type they are.**
A human who approves in 3 minutes. A Slack API that starts rate-limiting. A federated
world that goes down. All accumulate strength and resistance identically. All can become
highways or get dissolved. The formula is the same.

---

*See also: [gaps-receivers.md](gaps-receivers.md) — the audit that produced this plan*  
*[receivers.md](receivers.md) — the six receiver types*  
*[routing.md](routing.md) — STAN formula*
