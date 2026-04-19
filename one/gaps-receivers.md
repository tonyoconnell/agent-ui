# Gaps: Receiver Examples

**Can the substrate implement all 20 examples?**

All 20 work. Five structural gaps were identified and closed. This doc records what was wrong and what fixed it.

---

## Scorecard

| # | Example | Status |
|---|---------|--------|
| 5 | Multi-model cost routing | ✅ Works |
| 20 | Self-improving agent | ✅ Works |
| 16 | Code review assistant | ✅ Works |
| 2 | GitHub PR on merge | ✅ `github(token)` from `src/engine/apis/index.ts` |
| 10 | Daily standup summary | ✅ `apiUnit()` + `after:` field on Signal |
| 12 | Social media scheduling | ✅ `after: timestamp` in `enqueue()` |
| 14 | Podcast → newsletter | ✅ `mailchimp(token, dc)` |
| 15 | Vendor onboarding | ✅ `apiUnit()` for credit check |
| 3 | Customer support triage | ✅ `apiUnit()` for CRM |
| 8 | Bug triage → fix → deploy | ✅ `github(token)` for CI |
| 9 | Translation at scale | ✅ `bridgeAgentverse()` — AV agents in main world |
| 17 | Tender response | ✅ `federate()` — world-to-world routing |
| 1 | Slack approval | ✅ `human()` + `durableAsk()` |
| 4 | Invoice processing | ✅ `human()` + `durableAsk()` |
| 6 | Content moderation | ✅ `human()` + `durableAsk()` |
| 7 | Legal contract signing | ✅ `human()` + `durableAsk()` |
| 11 | Lead scoring | ✅ `human()` + `durableAsk()` |
| 13 | Fraud detection | ✅ `human()` + `durableAsk()` |
| 18 | Incident response | ✅ `human()` + `durableAsk()` |
| 19 | E-commerce returns | ✅ `human()` + `durableAsk()` |

---

## The 5 Gaps That Were Closed

### Gap 1: Durable ask() → `src/engine/durable-ask.ts`

**Was:** `ask()` stored the Promise and setTimeout in memory. Cloudflare Worker isolates recycle after ~30 seconds of inactivity. Human-in-loop flows waiting minutes or hours lost their reply channel.

**Fix:** `durableAsk()` writes the pending ask to D1 before waiting. Polls D1 for resolution. The isolate can die and restart; the ask survives. `POST /api/ask/reply` resolves from any external system (Telegram webhook, approval UI, etc).

```typescript
const { result, timeout } = await durableAsk(env, signal, 'entry', 3_600_000)
```

Migration: `migrations/0003_pending_asks.sql`  
Reply endpoint: `src/pages/api/ask/reply.ts`

---

### Gap 2: Human Inbox Unit → `src/engine/human.ts`

**Was:** No unit factory that routes a signal to a Telegram/Discord message and waits for the human's reply.

**Fix:** `human(id, opts)` creates a substrate unit with `approve`, `review`, and `choose` tasks. Each sends a Telegram message and calls `durableAsk()`. Pheromone on the path reflects how fast and reliably the human responds — same formula as any LLM unit.

```typescript
net.units['anthony'] = human('anthony', { env, telegram: 123456789, botToken: TOKEN })
const { result } = await net.ask({ receiver: 'anthony:approve', data: { draft } }, 'writer')
```

---

### Gap 3: HTTP API Factory → `src/engine/api.ts`

**Was:** Every external API required manual boilerplate — fetch, auth headers, error handling repeated per service.

**Fix:** `apiUnit(id, opts)` wraps any HTTP endpoint as a substrate unit with `get`, `post`, `put`, and `del` tasks. `null` return → `warn()` fires automatically. Pre-built wrappers in `src/engine/apis/index.ts`:

```typescript
net.units['github']    = github(GITHUB_TOKEN)
net.units['slack']     = slack(SLACK_TOKEN)
net.units['mailchimp'] = mailchimp(MC_TOKEN, 'us1')
net.units['pagerduty'] = pagerduty(PD_TOKEN)
net.units['notion']    = notion(NOTION_TOKEN)
net.units['discord']   = discord(BOT_TOKEN)
net.units['stripe']    = stripe(STRIPE_KEY)
```

---

### Gap 4: Scheduled / Delayed Signals → `src/engine/world.ts`

**Was:** `drain()` processed all queued signals immediately. No way to say "send this at 9am".

**Fix:** `Signal` now has an optional `after?: number` (Unix ms). `drain()` skips signals whose `after > Date.now()`. Ten lines in `world.ts`.

```typescript
net.enqueue({
  receiver: 'slack:post',
  data: { channel: '#standup', text: summary },
  after: new Date('2026-04-11T09:00:00Z').getTime()
})
// drain() ignores this until Friday 9am
```

---

### Gap 5: AgentVerse ↔ Persist Bridge → `src/engine/agentverse-bridge.ts`

**Was:** `agentverse.ts` and `persist.ts` each created their own `world()` instance. You couldn't signal an AV agent from the main world. Pheromone stayed separate.

**Fix:** `bridgeAgentverse(net, fetchFn, apiKey)` creates proxy units `av:address` in the main world that forward to AgentVerse. Main world pheromone tracks which AV agents are reliable. An `av:discover` unit finds agents by domain.

```typescript
const av = await bridgeAgentverse(net, myFetch, AV_API_KEY)
net.signal({ receiver: 'av:discover', data: { domain: 'translate', task: { text: 'Hello' } } }, 'writer')
```

---

### Gap 6 (Bonus): Federation → `src/engine/federation.ts`

**Was:** No way to route signals to another ONE substrate world.

**Fix:** `federate(id, baseUrl, apiKey)` creates a unit that POSTs any signal to another world's `/api/signal`. Cross-world pheromone tracks which worlds are fast and reliable. Slow or failing worlds accumulate resistance identically to slow LLMs.

```typescript
net.units['world-legal']   = federate('world-legal',   'https://legal.one.ie',   LEGAL_KEY)
net.units['world-finance'] = federate('world-finance', 'https://finance.one.ie', FINANCE_KEY)
net.signal({ receiver: 'world-legal:review', data: { contract } }, 'drafter')
```

---

## What Didn't Change

The substrate core is unchanged. `world.ts`, `persist.ts`, `loop.ts` — untouched architecturally.
Every gap was a surface addition using the existing `unit()` primitive.

The pheromone system learns all six receiver types without knowing what type they are.
A human who approves in 3 minutes. A Slack API that starts rate-limiting. A federated world that goes down.
All accumulate strength and resistance identically. All can become highways or get dissolved.
The formula is the same.

---

## Files Added

| File | Lines | Closes |
|------|------:|--------|
| `src/engine/api.ts` | 70 | Gap 3 |
| `src/engine/apis/index.ts` | 45 | Gap 3 |
| `src/engine/durable-ask.ts` | 120 | Gap 1 |
| `src/engine/human.ts` | 90 | Gap 2 |
| `src/engine/agentverse-bridge.ts` | 50 | Gap 5 |
| `src/engine/federation.ts` | 55 | Gap 6 |
| `src/engine/intent.ts` | 130 | Intent cache |
| `migrations/0003_pending_asks.sql` | 15 | Gap 1 |
| `migrations/0005_intents.sql` | 22 | Intent cache |
| `src/pages/api/ask/reply.ts` | 20 | Gap 1 |
| `src/pages/api/intents/seed.ts` | 20 | Intent cache |
| `src/pages/api/intents/learn.ts` | 20 | Intent cache |
| `src/pages/api/intents/stats.ts` | 30 | Intent cache |
| `world.ts` — `after?:` + drain() | 10 | Gap 4 |
| **Total** | **~700** | **20/20** |

---

*See also: [receivers.md](receivers.md) — the six receiver types*  
*[plan-receivers.md](plan-receivers.md) — the original implementation plan*  
*[routing.md](routing.md) — STAN formula*
