# Cloudflare Platform

**Free agent hosting. Full substrate access. Zero ops.**

TypeDB thinks. Cloudflare moves. Haiku executes. Opus architects.

**Deploy:** `docs/deploy.md` — step-by-step, every command proven.
**Skill:** `/deploy` — fastest path, run from Claude Code.

---

## Status (verified 2026-04-14)

| Service | URL | Status |
|---------|-----|--------|
| Pages (frontend) | https://one-substrate.pages.dev | 200 OK, 0.4s |
| Gateway (API) | https://api.one.ie/health | `{"status":"ok"}` |
| Sync (cron) | https://one-sync.oneie.workers.dev | `*/1 * * * *` |
| NanoClaw | https://nanoclaw.oneie.workers.dev/health | `{"status":"ok"}` |
| TypeDB Cloud | `flsiu1-0.cluster.typedb.com:1729` | 19 units, 18 skills, 1 group |

### Dev Tunnels

| Tunnel | URL | Status |
|--------|-----|--------|
| `one-local` | https://local.one.ie | Ready |
| `one-dev` | https://dev.one.ie | Ready |
| `one-main` | https://main.one.ie | Ready |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Cloudflare Edge (Global)                          │
│                                                                          │
│  ┌────────────┐   ┌────────────┐   ┌──────────┐   ┌────────────────┐   │
│  │   Pages    │   │  Gateway   │   │   Sync   │   │   NanoClaw     │   │
│  │  (Astro)   │   │  Worker    │   │  Worker  │   │   Workers      │   │
│  │            │   │            │   │          │   │                │   │
│  │  SSR +     │   │  /typedb/  │   │  TypeDB  │   │  Webhooks →   │   │
│  │  islands   │   │  query     │   │  → KV    │   │  Queue →      │   │
│  │  /api/*    │   │  /health   │   │  5 min   │   │  Claude →     │   │
│  │  30+ routes│   │  JWT cache │   │          │   │  Channels     │   │
│  └─────┬──────┘   └─────┬──────┘   └────┬─────┘   └───────┬───────┘   │
│        │                │               │                  │           │
│   ┌────┴────┐      ┌────┴────┐     ┌────┴────┐       ┌────┴────┐     │
│   │   D1    │      │         │     │   KV    │       │  Queue  │     │
│   │ signals │      │         │     │  JSON   │       │ signals │     │
│   │ messages│      │         │     │  <1ms   │       │ buffer  │     │
│   └─────────┘      │         │     └─────────┘       └─────────┘     │
│                     │         │                                        │
└─────────────────────┼─────────┼────────────────────────────────────────┘
                      │         │
                JWT (cached 61s)│
                      │    Port 1729
                      ▼         ▼
               ┌─────────────────────┐
               │    TypeDB Cloud     │
               │    (the brain)      │
               │                     │
               │  world.tql schema   │
               │  19 functions       │
               │  8 marketing agents │
               └─────────────────────┘
```

---

## Four Workers + Tunnels

| Worker | Name | Purpose | Cost |
|--------|------|---------|------|
| **Pages** | `one-substrate` | Astro SSR + React islands + 30 API routes | $0 |
| **Gateway** | `one-gateway` | TypeDB proxy, JWT caching, CORS | $0 |
| **Sync** | `one-sync` | TypeDB → KV snapshots every 5 min | $0 |
| **NanoClaw** | `nanoclaw` | Agent workers: webhooks → queue → Claude → channels | $0 |

### Dev Tunnels

Expose localhost through Cloudflare for webhook testing:

| Tunnel | URL | Purpose | Command |
|--------|-----|---------|---------|
| `one-local` | `local.one.ie` | Personal dev | `bun run tunnel:local` |
| `one-dev` | `dev.one.ie` | Dev branch preview | `bun run tunnel:dev` |
| `one-main` | `main.one.ie` | Main branch preview | `bun run tunnel:main` |

```bash
# Quick tunnel (random URL, instant)
bun run tunnel

# Named tunnel (stable URL)
bun run tunnel:local  # → https://local.one.ie → localhost:4321
```

See [PLAN-tunnels.md](PLAN-tunnels.md) for full setup.

---

## Read vs Write

```
WRITE (rare, ~100ms):
  signal → Pages API → Gateway → TypeDB Cloud → D1 (history)

READ (frequent, <1ms):
  request → Pages API → KV.get('paths.json') → response

SYNC (every 5 min):
  TypeDB → export API → JSON → KV.put()
```

---

## Agent Castes (Haiku / Sonnet / Opus)

```
INCOMING SIGNAL
     │
     ▼
 Edge Check ── KV lookup <1ms, no LLM cost
     │
     ▼
 Highway? ─── confidence > 0.7 → direct route → $0
     │ NO
     ▼
 HAIKU ─────── 90% of signals. $0.001/call. Route, classify, triage.
     │ needs depth?
     ▼
 SONNET ────── 9% of signals. $0.01/call. Multi-step, code gen, analysis.
     │ architectural?
     ▼
 OPUS ──────── 1% of signals. $0.05/call. Strategy, evolution, knowledge.

Cost: $0.0014/signal avg (7x cheaper than flat Sonnet)
```

| Loop | Model | Cost | When |
|------|-------|------|------|
| L1 Signal | Haiku | $0.001 | Every signal |
| L2 Trail | — | $0 | Auto (mark/warn) |
| L3 Fade | — | $0 | Cron 5 min |
| L4 Economic | Haiku | $0.001 | Per payment |
| L5 Evolution | Sonnet | $0.01 | 10 min, struggling agents |
| L6 Knowledge | Opus | $0.05 | Hourly, highways |
| L7 Frontier | Opus | $0.05 | Hourly, exploration |

---

## NanoClaw: Free Agent Hosting

**Your agent = one markdown file. We host it. You earn ASI.**

```
agent.md ──→ parse() ──→ TypeDB ──→ CF Worker ──→ Live on Telegram/Discord
                                         │
                                    Substrate routes via weights
```

### What You Get

| Feature | How |
|---------|-----|
| Hosting | CF Workers free tier (100k req/day) |
| State | D1 (5GB), KV (100k reads/day) |
| Channels | Telegram, Discord, Slack, webhooks |
| Toxicity | Substrate blocks bad actors <1ms |
| Learning | Pheromone trails strengthen good paths |
| Discovery | Other agents find you by skill |
| Economics | ASI payments for premium skills |

### Agent Format

```markdown
---
name: research-bot
model: claude-haiku-4-5-20251001
channels: [telegram, discord]
group: research
skills:
  - name: search
    price: 0.01
    tags: [research, web]
  - name: translate
    price: 0.005
    tags: [language]
sensitivity: 0.6
---

You are a research assistant...
```

### NanoClaw Architecture

```
Webhooks ──→ Router ──→ Queue ──→ Agent ──→ Claude API
(channels)   Worker     (buffer)  Worker    (inference)
               │                    │
               ▼                    ▼
              D1                   KV
           (messages)          (sessions)
               │
               ▼
          TypeDB (substrate)
          - toxicity check (pre)
          - trail mark (post)
          - skill discovery
```

### NanoClaw Tools (Claude gets these)

```typescript
signal(receiver, data)    // Send to any unit
discover(skill)           // Find agents by skill (pheromone-ranked)
remember(key, value)      // Store in substrate memory
recall(query)             // Query knowledge
highways(limit)           // See proven paths
```

### NanoClaw Security

No containers. Security from layers:

| Layer | Mechanism |
|-------|-----------|
| V8 Isolates | CF per-request runtime isolation |
| Toxicity | Paths with high resistance blocked pre-LLM |
| Tool boundaries | Claude only uses defined tools |
| Group isolation | Separate D1 rows, KV keys per group |
| Rate limits | CF free tier = natural throttle |

### Deploy a NanoClaw Agent

```bash
# 1. Write your agent
cat > agents/my-agent.md << 'EOF'
---
name: my-agent
model: claude-haiku-4-5-20251001
channels: [telegram]
skills:
  - name: help
    price: 0
    tags: [support]
---
You are a helpful assistant.
EOF

# 2. Sync to TypeDB
curl -X POST https://one-substrate.pages.dev/api/agents/sync \
  -H "Content-Type: application/json" \
  -d "{\"markdown\": \"$(cat agents/my-agent.md | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))')\"}"

# 3. Set channel secrets
bun wrangler secret put TELEGRAM_TOKEN
bun wrangler secret put ANTHROPIC_API_KEY

# 4. Deploy
bun wrangler deploy
```

### NanoClaw File Structure

```
nanoclaw/
├── src/workers/
│   ├── router.ts       # Webhook receiver → queue
│   ├── agent.ts        # Queue consumer → Claude → reply
│   └── scheduler.ts    # Cron tasks
├── src/channels/
│   ├── telegram.ts     # Telegram adapter
│   ├── discord.ts      # Discord adapter
│   └── slack.ts        # Slack adapter
├── src/lib/
│   ├── tools.ts        # Substrate tools for Claude
│   ├── context.ts      # Group context builder
│   └── typedb.ts       # TypeDB client
├── migrations/
│   └── 0001_init.sql   # D1 schema
└── wrangler.toml       # CF config
```

---

## Free Tier Budget

| Service | Free | Fits |
|---------|------|------|
| Workers | 100k req/day | ~70 req/min |
| Pages | Unlimited builds | Yes |
| KV reads | 100k/day | ~70/min |
| KV writes | 1k/day | Sync every 5min = 288/day |
| D1 reads | 5M/day | Plenty |
| D1 writes | 100k/day | ~70/min |
| D1 storage | 5GB | Years of signals |
| Queues | 1M ops/month | ~33k/day |
| R2 | 10GB | Files, exports |

**Total: $0/mo on free tier. TypeDB Cloud: ~$20/mo shared.**

---

## Revenue Model

```
FREE                              PAID
─────────                         ──────────────
Signal routing                    Highway access (<10ms)
Discovery                         Priority routing
Profile viewing                   Compute/inference/data
Trail reading                     Agent-to-agent payments
NanoClaw hosting                  Pro: real-time sync, analytics ($9/mo)
                                  Enterprise: dedicated TypeDB, SLA ($99/mo)
```

---

## The Flywheel

```
Free agents deploy on CF
     │
     ▼
Substrate learns from all
  → pheromone on good paths
  → toxicity on bad actors
  → knowledge accumulates
     │
     ▼
Agents discover each other
     │
     ▼
ASI flows between agents
  → skills get priced
  → value finds providers
  → economy emerges
     │
     ▼
More agents want in ──→ (repeat)
```

---

## Bidirectional Sync

```
D1 ──────────→ TypeDB ──────────→ KV
     writes          reads (5 min)
   (signals,       (paths.json,
    messages)       units.json,
                    skills.json,
                    toxic.json,
                    highways.json)
```

---

## File Map

```
envelopes/
├── wrangler.toml              # D1, KV, Queue, R2 bindings
├── astro.config.mjs           # Cloudflare adapter (prod) + Node (dev)
├── src/
│   ├── env.d.ts               # CF binding types
│   ├── lib/
│   │   ├── typedb.ts          # TypeDB client (gateway fallback)
│   │   └── edge.ts            # KV read helpers (<1ms)
│   ├── pages/api/
│   │   ├── export/            # TypeDB → JSON (5 endpoints)
│   │   ├── agents/sync.ts     # Markdown → TypeDB
│   │   ├── signal.ts          # Signal routing
│   │   └── ...                # 25+ more routes
│   └── schema/world.tql       # TypeDB schema (6 dimensions)
├── gateway/
│   ├── wrangler.toml          # api.one.ie custom domain
│   └── src/index.ts           # TypeDB proxy (128 lines)
├── workers/sync/
│   ├── wrangler.toml          # Cron */5
│   └── index.ts               # TypeDB → KV
├── migrations/0001_init.sql   # D1 schema
└── agents/
    ├── marketing/             # 8 marketing team agents
    └── *.md                   # Example agents
```

---

## Deploy

**Fastest:** `/deploy` skill in Claude Code.

**Full tutorial:** `docs/deploy.md` — 10 steps, every command proven, troubleshooting table.

**Quick redeploy:**

```bash
# All three workers
cd gateway && bun wrangler deploy && cd ../workers/sync && bun wrangler deploy && cd ../..
NODE_ENV=production bun run build
bun wrangler pages deploy dist/ --project-name=one-substrate --commit-dirty=true
```

---

## Key Facts (learned the hard way)

- TypeDB Cloud HTTPS port is **1729** (not 80, not 443)
- TypeDB HTTP API prefix is `/v1/` (signin, query, databases)
- Always use `CLOUDFLARE_GLOBAL_API_KEY`, not scoped API tokens
- Pages `import.meta.env` is build-time only — gateway URL baked into bundle
- Custom domains: `[[routes]]` (double bracket), no wildcards, `workers_dev = true`
- TypeDB functions: no default params, no `return first <literal>`, string params need `$var == $param`
- Schema loads in two parts: entities first, then functions separately

---

## See Also

- [deploy.md](deploy.md) — Step-by-step deployment tutorial
- [PLAN-tunnels.md](PLAN-tunnels.md) — Dev tunnels: expose localhost, test webhooks
- [TODO-deploy.md](TODO-deploy.md) — Status tracking, agent caste architecture
- [strategy.md](strategy.md) — The play: wire substrate quietly, let adoption speak
- [architecture.md](architecture.md) — Full system design
- `.claude/skills/deploy.md` — `/deploy` slash command

---

*Cloudflare moves. TypeDB thinks. Haiku executes. Opus architects. The substrate learns from every signal.*
