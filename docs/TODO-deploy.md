# Deploy to Cloudflare + TypeDB

**Priority one. Secure. Fast Haiku workers, Opus when needed.**

---

## Infrastructure Status

### Cloudflare Bindings
- [x] `wrangler.toml` — D1, KV, Queue, R2 bindings configured
- [x] `astro.config.mjs` — Cloudflare adapter with `platformProxy` enabled
- [x] `src/env.d.ts` — Full type definitions for all CF bindings
- [x] `src/lib/edge.ts` — KV read helpers (<1ms): paths, units, skills, toxic, highways, discover, optimalRoute
- [x] `migrations/0001_init.sql` — D1 schema: signals, messages, tasks, sync_log
- [x] `src/pages/api/export/` — 5 endpoints: paths, units, skills, highways, toxic
- [x] `workers/sync/` — TypeDB → KV sync worker (every 5min free, 5s paid)
- [x] `gateway/` — TypeDB proxy worker (JWT cached, CORS, /typedb/query)
- [x] Production build passes — chunk splitting, edge compat
- [x] **Create CF resources** — D1 `one` (APAC), KV namespace, IDs in wrangler.toml
- [x] **D1 migration** — 4 tables: signals, messages, tasks, sync_log (remote)
- [x] **Deploy gateway** — https://one-gateway.oneie.workers.dev (/health OK)
- [x] **Deploy sync worker** — https://one-sync.oneie.workers.dev (cron */5)
- [x] **Deploy Pages** — https://one-substrate.pages.dev (200 OK)
- [x] **Gateway secrets** — TYPEDB_URL (port 1729), DATABASE, USERNAME, PASSWORD
- [x] **TypeDB Cloud** — Database `one` created, world.tql schema loaded, 19 functions defined
- [x] **End-to-end** — Gateway → TypeDB Cloud query works (empty results, no data yet)
- [ ] **Custom domain** — one.ie / app.one.ie / api.one.ie
- [ ] **Seed data** — Marketing team + example agents
- [ ] **Update sync worker** — Point APP_URL at live Pages URL

---

## Deploy Commands

```bash
# 1. Create Cloudflare resources
npx wrangler d1 create one
npx wrangler kv namespace create KV
# → Copy IDs into wrangler.toml and workers/sync/wrangler.toml

# 2. Run D1 migration
npx wrangler d1 execute one --file=migrations/0001_init.sql

# 3. Set secrets (main app)
npx wrangler secret put TYPEDB_USERNAME    # admin
npx wrangler secret put TYPEDB_PASSWORD
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put CLOUDFLARE_GLOBAL_API_KEY

# 4. Deploy gateway worker
cd gateway && npx wrangler deploy && cd ..

# 5. Deploy sync worker
cd workers/sync && npx wrangler deploy && cd ../..

# 6. Deploy main app (Pages)
NODE_ENV=production npm run build
npx wrangler pages deploy dist/

# 7. Seed data
curl -X POST https://one.ie/api/agents/sync \
  -H "Content-Type: application/json" \
  -d '{"world": "marketing", "agents": [...]}'
```

---

## Agent Caste Architecture (Haiku Workers + Opus Escalation)

**The substrate routes by cost and confidence. Haiku handles volume. Opus handles depth.**

```
┌──────────────────────────────────────────────────────────────────────┐
│                     Agent Caste Routing                               │
│                                                                       │
│   INCOMING SIGNAL                                                    │
│        │                                                              │
│        ▼                                                              │
│   ┌─────────────┐                                                    │
│   │ Edge Check   │  KV lookup <1ms                                   │
│   │ (toxic?)     │  No LLM cost                                      │
│   └──────┬──────┘                                                    │
│          │                                                            │
│          ▼                                                            │
│   ┌─────────────┐     confidence > 0.7?                              │
│   │ Highway      │────── YES ──→ Direct route (no LLM) ──→ $0       │
│   │ Check        │                                                    │
│   └──────┬──────┘                                                    │
│          │ NO                                                         │
│          ▼                                                            │
│   ┌─────────────┐                                                    │
│   │  HAIKU       │  Fast workers. $0.001/call.                       │
│   │  (L1-L3)     │  Route, classify, triage, filter.                 │
│   │              │  90% of signals stop here.                         │
│   └──────┬──────┘                                                    │
│          │ needs depth?                                                │
│          ▼                                                            │
│   ┌─────────────┐                                                    │
│   │  SONNET      │  Coordinators. $0.01/call.                        │
│   │  (L4-L5)     │  Multi-step reasoning, code gen, analysis.        │
│   │              │  9% of signals escalate here.                      │
│   └──────┬──────┘                                                    │
│          │ architectural decision?                                     │
│          ▼                                                            │
│   ┌─────────────┐                                                    │
│   │  OPUS        │  Architects. $0.05/call.                          │
│   │  (L6-L7)     │  Strategy, restructuring, evolution, knowledge.   │
│   │              │  1% of signals. High value decisions.              │
│   └─────────────┘                                                    │
│                                                                       │
│   Cost: 90% × $0.001 + 9% × $0.01 + 1% × $0.05 = $0.0014/signal   │
│   vs flat Sonnet: $0.01/signal (7x cheaper with castes)              │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### Escalation Rules

```typescript
// In agent markdown frontmatter
model: claude-haiku-4-5-20251001           // Default: fast worker
escalate_to: claude-sonnet-4-6             // When confidence < 0.5
architect: claude-opus-4-6                 // For evolution, knowledge, restructuring

// The substrate decides escalation, not the agent
// Based on: confidence, chain depth, error rate, cost budget
```

### Which Model Handles What

| Loop | Model | Cost | Trigger |
|------|-------|------|---------|
| L1 Signal | Haiku | $0.001 | Every signal |
| L2 Trail | — | $0 | Automatic (mark/warn) |
| L3 Fade | — | $0 | Cron (5 min) |
| L4 Economic | Haiku | $0.001 | Per payment |
| L5 Evolution | Sonnet | $0.01 | 10 min, poor agents only |
| L6 Knowledge | Opus | $0.05 | Hourly, highways only |
| L7 Frontier | Opus | $0.05 | Hourly, exploration |

### Escalation in Practice

```typescript
// Haiku handles the signal
const result = await ask({ receiver: 'haiku:classify', data: signal })

// Haiku says "needs depth"
if (result.escalate) {
  // Sonnet takes over
  const deep = await ask({ receiver: 'sonnet:analyze', data: { ...signal, context: result } })
  
  // Sonnet says "architectural decision needed"
  if (deep.architect) {
    // Opus decides
    await ask({ receiver: 'opus:restructure', data: { ...signal, analysis: deep } })
  }
}

// The substrate tracks which escalations were worth it
// mark() on successful escalation, warn() on unnecessary ones
// Over time, escalation paths optimize themselves
```

---

## Security Checklist

- [ ] All secrets via `wrangler secret put` (never in toml/env files)
- [ ] Gateway CORS locked to one.ie + localhost
- [ ] TypeDB JWT token cached per-isolate (61s TTL)
- [ ] Toxicity check on every signal (<1ms, from KV)
- [ ] D1 prepared statements (SQL injection safe)
- [ ] Rate limiting on API routes (CF free tier: 100k req/day)
- [ ] No API keys in client bundles (`import.meta.env` server-only)
- [ ] R2 bucket private (no public access)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge (Global)                           │
│                                                                      │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌──────────┐          │
│  │  Pages   │  │  Gateway   │  │   Sync   │  │    KV    │          │
│  │  (Astro) │  │  Worker    │  │  Worker  │  │  (JSON)  │          │
│  │          │  │            │  │          │  │          │          │
│  │  SSR +   │  │  /typedb/  │  │  TypeDB  │  │  paths   │          │
│  │  islands │  │  query     │  │  → KV    │  │  units   │          │
│  │  /api/*  │  │  /health   │  │  5 min   │  │  skills  │          │
│  └────┬─────┘  └─────┬──────┘  └────┬─────┘  │  toxic   │          │
│       │              │              │         │  highways │          │
│       │         ┌────┴──────┐       │         └────┬─────┘          │
│       │         │   D1      │       │              │                │
│       │         │  signals  │       │              │                │
│       │         │  messages │       │         ┌────┴─────┐          │
│       │         └───────────┘       │         │   R2     │          │
│       │                             │         │  files   │          │
│       └─────────────────────────────┘         └──────────┘          │
│                         │                                            │
└─────────────────────────┼────────────────────────────────────────────┘
                          │
                    JWT (cached 61s)
                          │
                          ▼
                ┌─────────────────┐
                │   TypeDB Cloud  │
                │   (the brain)   │
                │                 │
                │   paths, units  │
                │   skills, know- │
                │   ledge, hypo-  │
                │   theses        │
                └─────────────────┘
```

---

## Read vs Write Paths

```
WRITE (rare, ~100ms):
  signal → Pages API → TypeDB (via gateway) → D1 (history)

READ (frequent, <1ms):
  request → Pages API → KV.get('paths.json') → response

SYNC (every 5 min):
  TypeDB → export API → JSON → KV.put()
```

---

## Files Created

| File | Purpose |
|------|---------|
| `wrangler.toml` | D1, KV, Queue, R2 bindings |
| `src/env.d.ts` | CF binding types |
| `src/lib/edge.ts` | KV read helpers |
| `migrations/0001_init.sql` | D1 schema |
| `src/pages/api/export/paths.ts` | Path snapshots |
| `src/pages/api/export/units.ts` | Unit snapshots |
| `src/pages/api/export/skills.ts` | Skill snapshots |
| `src/pages/api/export/highways.ts` | Highway snapshots |
| `src/pages/api/export/toxic.ts` | Toxic edge snapshots |
| `workers/sync/index.ts` | TypeDB → KV sync worker |
| `workers/sync/wrangler.toml` | Sync worker config |
| `gateway/src/index.ts` | TypeDB proxy (existing) |
| `gateway/wrangler.toml` | Gateway config (existing) |

---

## Cost

| Component | Free Tier | Paid (~$5/mo) |
|-----------|-----------|---------------|
| Pages | Unlimited | — |
| Workers | 100k req/day | $5/10M req |
| KV reads | 100k/day | $0.50/M |
| KV writes | 1k/day | $5/M |
| D1 | 5GB, 5M reads | $0.75/M reads |
| R2 | 10GB | $0.015/GB |
| TypeDB Cloud | — | ~$20/mo shared |
| Haiku calls | — | ~$0.001/signal |

**Total for launch: ~$20/mo (TypeDB). Everything else fits free tier.**

---

*TypeDB thinks. Cloudflare moves. Haiku executes. Opus architects. JSON bridges the gap.*
