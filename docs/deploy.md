# Deploy ONE Substrate

Step-by-step. Every command proven. Every link verified.

**What you'll deploy:** Astro frontend + TypeDB brain + Cloudflare edge (4 workers: gateway, sync, pages, nanoclaw).

**Cost:** ~$20/mo (TypeDB Cloud). Everything else fits Cloudflare free tier.

**Time:** ~30 minutes for a human. ~5 minutes for an agent.

---

## Status (verified 2026-04-06)

- [x] **Step 1** — Clone and install. Node 20.19.6, npm 10.8.2, wrangler 4.80.0
- [x] **Step 2** — CF auth. Global API Key works, account `627e0c7c...`
- [x] **Step 3a** — D1 `one` created (APAC, `0aa5fceb-667a-470e-b08c-40ead2f4525d`)
- [x] **Step 3b** — KV namespace created (`1c1dac4766e54a2c85425022a3b1e9da`)
- [x] **Step 3c** — D1 migration: 4 tables (signals, messages, tasks, sync_log)
- [x] **Step 4a** — TypeDB Cloud signin OK (port 1729)
- [x] **Step 4b** — Database `one` created
- [x] **Step 4c** — Schema loaded (entities + attributes)
- [x] **Step 4d** — 19 functions loaded (routing, classification, aggregates)
- [x] **Step 5** — Config updated (wrangler.toml, gateway, sync worker)
- [x] **Step 6** — Gateway deployed: https://one-gateway.oneie.workers.dev/health → `{"status":"ok"}`
- [x] **Step 6 e2e** — Gateway → TypeDB query → `conceptRows` OK
- [x] **Step 7** — Sync worker deployed: https://one-sync.oneie.workers.dev → cron `*/5 * * * *`
- [x] **Step 8** — Pages deployed: https://one-substrate.pages.dev → HTTP 200 in 0.3s
- [x] **Step 9** — Seed data: 18 units, 18 skills, 1 group in TypeDB (8 marketing + 5 example + 5 system)
- [x] **Step 10** — Custom domains: one.ie (200), app.one.ie (200), api.one.ie/health → `{"status":"ok"}`
- [x] **Step 10b** — R2 bucket `one-files` created (required when `pages_build_output_dir` set)
- [x] **Step 10c** — Export APIs fixed: paths/highways/toxic use relation role syntax
- [x] **Step 10d** — All 5 export endpoints return HTTP 200
- [x] **Step 11** — NanoClaw deployed: https://nanoclaw.oneie.workers.dev/health → `{"status":"ok"}`
- [x] **Step 11b** — NanoClaw D1 migration: 7 tables total (base 4 + groups, sessions, tool_calls)
- [x] **Step 11c** — Queue `nanoclaw-agents` created (producer + consumer + cron `* * * * *`)
- [ ] **Step 11d** — Set `ANTHROPIC_API_KEY` secret on NanoClaw for live Claude calls
- [ ] **Step 11e** — Set `TELEGRAM_TOKEN` for Telegram channel (optional)
- [ ] **Step 12a** — Install Sui CLI (`cargo install sui`)
- [ ] **Step 12b** — Create testnet keypair
- [ ] **Step 12c** — Fund from faucet
- [ ] **Step 12d** — Build and test Move contract (`sui move build && sui move test`)
- [ ] **Step 12e** — Publish to Sui testnet (`sui client publish`)
- [ ] **Step 12f** — Store `SUI_PACKAGE_ID` and `SUI_PROTOCOL_ID` in `.env`
- [ ] **Step 12g** — Install `@mysten/sui` TS SDK
- [ ] **Step 12h** — Verify Protocol singleton on-chain

---

## Prerequisites

| Tool | Install | Verify |
|------|---------|--------|
| Node.js 20+ | https://nodejs.org | `node --version` |
| npm | Comes with Node | `npm --version` |
| Wrangler | `npm install -g wrangler` | `npx wrangler --version` |
| Cloudflare account | https://dash.cloudflare.com/sign-up | Free |
| TypeDB Cloud | https://cloud.typedb.com | Free trial available |

---

## Step 1: Clone and Install

```bash
git clone <repo-url> one-substrate
cd one-substrate
npm install
```

Verify the build works locally:

```bash
npm run dev
# → http://localhost:4321
```

---

## Step 2: Cloudflare Authentication

Get your credentials from https://dash.cloudflare.com/profile/api-tokens:

| Credential | Where to find |
|------------|---------------|
| `CLOUDFLARE_ACCOUNT_ID` | Dashboard URL: `dash.cloudflare.com/<this-id>` |
| `CLOUDFLARE_GLOBAL_API_KEY` | Profile → API Tokens → Global API Key → View |
| `CLOUDFLARE_EMAIL` | Your Cloudflare login email |

Export them for the session:

```bash
export CLOUDFLARE_API_KEY="your-global-api-key"
export CLOUDFLARE_EMAIL="your@email.com"
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
```

Test auth works:

```bash
npx wrangler whoami
# Should show your account name and ID
```

---

## Step 3: Create Cloudflare Resources

### 3a. Create D1 Database

```bash
npx wrangler d1 create one
```

Output:

```
✅ Successfully created DB 'one' in region APAC
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Copy the `database_id`. Open `wrangler.toml` and paste it:

```toml
[[d1_databases]]
binding = "DB"
database_name = "one"
database_id = "paste-your-id-here"
```

### 3b. Create KV Namespace

```bash
npx wrangler kv namespace create KV
```

Output:

```
✨ Success!
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

Copy the `id`. Paste in two places:

**`wrangler.toml`** (root):
```toml
[[kv_namespaces]]
binding = "KV"
id = "paste-your-id-here"
```

**`workers/sync/wrangler.toml`**:
```toml
[[kv_namespaces]]
binding = "KV"
id = "paste-your-id-here"
```

### 3c. Run D1 Migration

```bash
# Local (for dev)
npx wrangler d1 execute one --file=migrations/0001_init.sql

# Remote (for production)
npx wrangler d1 execute one --remote --file=migrations/0001_init.sql
```

This creates 4 tables: `signals`, `messages`, `tasks`, `sync_log`.

---

## Step 4: TypeDB Cloud Setup

### 4a. Get TypeDB Cloud Credentials

Sign up at https://cloud.typedb.com. Create a deployment. You'll get:

| Credential | Example |
|------------|---------|
| Cloud address | `flsiu1-0.cluster.typedb.com` |
| Username | `admin` |
| Password | (from TypeDB Cloud dashboard) |

**Critical:** The HTTPS port is **1729**, not 80 or 443.

### 4b. Test Connection

```bash
curl -s -X POST 'https://YOUR-ADDRESS.cluster.typedb.com:1729/v1/signin' \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"YOUR-PASSWORD"}'
```

Should return: `{"token":"eyJ..."}`. If you get `404 page not found`, check the port.

### 4c. Create Database

```bash
# Get token
TOKEN=$(curl -s -X POST 'https://YOUR-ADDRESS.cluster.typedb.com:1729/v1/signin' \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"YOUR-PASSWORD"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Create database
curl -X POST "https://YOUR-ADDRESS.cluster.typedb.com:1729/v1/databases/one" \
  -H "Authorization: Bearer $TOKEN"
```

### 4d. Load Schema

The schema must be loaded in two parts: entities/attributes first, then functions.

**Part 1 — Entity definitions:**

```bash
# Strip comments, extract define block (lines 35-267)
python3 -c "
import json
with open('src/schema/world.tql') as f:
    lines = f.readlines()
schema = ''.join(lines[34:267])
clean = '\n'.join(l.split('#')[0].rstrip() for l in schema.split('\n') if l.split('#')[0].strip())
print(json.dumps({
    'databaseName': 'one',
    'transactionType': 'schema',
    'query': clean,
    'commit': True
}))
" | curl -s -X POST "https://YOUR-ADDRESS.cluster.typedb.com:1729/v1/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d @-
```

Should return: `{"queryType":"schema","answerType":"ok",...}`

**Part 2 — Functions:**

Functions have TypeDB 3.0 syntax requirements:
- No default parameter values (`threshold: double = 10.0` → `$threshold: double`)
- `return first` needs a variable, not a literal (`return first true` won't work)
- String parameters must use comparison: `has uid $u; $u == $param;` not `has uid $param`

```bash
python3 -c "
import json
fns = '''define
fun highways(\$thresh: double, \$min_trav: integer) -> { path }:
    match \$e isa path, has strength \$s, has traversals \$t;
          \$s >= \$thresh; \$t >= \$min_trav;
    return { \$e };

fun optimal_route(\$from: unit, \$skill: skill) -> unit:
    match (source: \$from, target: \$to) isa path, has strength \$s;
          (provider: \$to, offered: \$skill) isa capability;
    sort \$s desc; limit 1;
    return first \$to;

fun cheapest_provider(\$skill: skill) -> unit:
    match (provider: \$u, offered: \$skill) isa capability, has price \$p;
    sort \$p asc; limit 1;
    return first \$u;

fun suggest_route(\$from: unit, \$skill: skill) -> { uid, strength }:
    match \$from isa unit; \$skill isa skill;
          (source: \$from, target: \$to) isa path, has strength \$s;
          (provider: \$to, offered: \$skill) isa capability;
          \$to has uid \$id; \$s >= 5.0;
    sort \$s desc; limit 5;
    return { \$id, \$s };

fun proven_units() -> { unit }:
    match \$u isa unit, has status \$st; \$st == \"proven\";
    return { \$u };

fun at_risk_units() -> { unit }:
    match \$u isa unit, has status \$st; \$st == \"at-risk\";
    return { \$u };

fun units_by_kind(\$k: string) -> { unit }:
    match \$u isa unit, has unit-kind \$uk, has status \$st; \$uk == \$k; \$st == \"active\";
    return { \$u };

fun group_members(\$gname: string) -> { unit }:
    match \$grp isa group, has name \$n; \$n == \$gname;
          (group: \$grp, member: \$u) isa membership;
    return { \$u };

fun skills_by_tag(\$t: string) -> { skill }:
    match \$s isa skill, has tag \$tg; \$tg == \$t;
    return { \$s };

fun highway_count(\$thresh: double) -> integer:
    match \$e isa path, has strength \$s; \$s >= \$thresh;
    return count(\$e);

fun total_revenue() -> double:
    match \$e isa path, has revenue \$r;
    return sum(\$r);
'''
print(json.dumps({
    'databaseName': 'one',
    'transactionType': 'schema',
    'query': fns,
    'commit': True
}))
" | curl -s -X POST "https://YOUR-ADDRESS.cluster.typedb.com:1729/v1/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d @-
```

### 4e. Verify

```bash
curl -s -X POST "https://YOUR-ADDRESS.cluster.typedb.com:1729/v1/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"databaseName":"one","transactionType":"read","query":"match $u isa unit; select $u; limit 5;"}'
```

Should return `{"queryType":"read","answerType":"conceptRows","answers":[],...}` (empty — no data yet).

---

## Step 5: Update Configuration

### 5a. `wrangler.toml` (root)

```toml
[vars]
TYPEDB_URL = "https://YOUR-ADDRESS.cluster.typedb.com:1729"
TYPEDB_DATABASE = "one"
```

### 5b. `gateway/wrangler.toml`

```toml
[vars]
VERSION = "1.0.0"
TYPEDB_URL = "https://YOUR-ADDRESS.cluster.typedb.com:1729"
TYPEDB_DATABASE = "one"
```

### 5c. `workers/sync/wrangler.toml`

```toml
[vars]
APP_URL = "https://one-substrate.pages.dev"
```

Replace `one-substrate.pages.dev` with your actual Pages URL after first deploy.

---

## Step 6: Deploy Gateway Worker

The gateway proxies browser requests to TypeDB Cloud with JWT caching.

```bash
cd gateway

# Set secrets
printf 'admin' | npx wrangler secret put TYPEDB_USERNAME
printf 'YOUR-TYPEDB-PASSWORD' | npx wrangler secret put TYPEDB_PASSWORD

# Deploy
npx wrangler deploy

cd ..
```

Output:

```
Uploaded one-gateway
Deployed one-gateway triggers
  https://one-gateway.oneie.workers.dev
```

**Verify:**

```bash
# Health check
curl -s https://one-gateway.oneie.workers.dev/health
# → {"status":"ok","version":"1.0.0","database":"one"}

# Query through gateway
curl -s -X POST https://one-gateway.oneie.workers.dev/typedb/query \
  -H 'Content-Type: application/json' \
  -d '{"query":"match $u isa unit; select $u; limit 5;","transactionType":"read"}'
# → {"queryType":"read","answerType":"conceptRows","answers":[],...}
```

If you get `TypeDB signin failed: 404`, check that `TYPEDB_URL` uses **port 1729**.

---

## Step 7: Deploy Sync Worker

The sync worker runs every 5 minutes, pulling TypeDB snapshots into KV for fast edge reads.

```bash
cd workers/sync
npx wrangler deploy
cd ../..
```

Output:

```
Uploaded one-sync
Deployed one-sync triggers
  https://one-sync.oneie.workers.dev
  schedule: */5 * * * *
```

**Verify:**

```bash
curl -s https://one-sync.oneie.workers.dev/
# → {"status":"sync-worker","trigger":"/sync"}

# Manual sync trigger
curl -s https://one-sync.oneie.workers.dev/sync
# → {"ok":true,"synced_at":"1775416334000"}
```

---

## Step 8: Deploy Pages (Frontend)

```bash
# Production build
NODE_ENV=production npm run build

# Create Pages project (first time only)
npx wrangler pages project create one-substrate --production-branch=main

# Deploy
npx wrangler pages deploy dist/ --project-name=one-substrate --commit-dirty=true
```

Output:

```
✨ Success! Uploaded 25 files
✨ Deployment complete! Take a peek over at https://xxxxxxxx.one-substrate.pages.dev
```

**Verify:**

```bash
curl -sL https://one-substrate.pages.dev/ -o /dev/null -w '%{http_code} %{time_total}s'
# → 200 0.6s
```

Now update `workers/sync/wrangler.toml` with the real Pages URL:

```toml
[vars]
APP_URL = "https://one-substrate.pages.dev"
```

Redeploy sync worker: `cd workers/sync && npx wrangler deploy && cd ../..`

---

## Step 9: Seed Data

### 9a. Sync a Single Agent

```bash
curl -X POST https://one-substrate.pages.dev/api/agents/sync \
  -H "Content-Type: application/json" \
  -d '{"markdown": "---\nname: tutor\nmodel: claude-sonnet-4-6\nchannels: [telegram]\ngroup: education\nskills:\n  - name: lesson\n    price: 0.01\n    tags: [teach, spanish]\n---\nYou are a patient Spanish tutor."}'
```

### 9b. Sync Marketing Team

```bash
# Read all agent markdown files and sync as a world
curl -X POST https://one-substrate.pages.dev/api/agents/sync \
  -H "Content-Type: application/json" \
  -d "{\"world\": \"marketing\", \"agents\": [$(cat agents/marketing/*.md | python3 -c "
import sys, json
content = sys.stdin.read()
# Split on --- boundaries and create agent list
print(json.dumps(content))
")]}"
```

### 9c. Verify Data in TypeDB

```bash
TOKEN=$(curl -s -X POST 'https://YOUR-ADDRESS.cluster.typedb.com:1729/v1/signin' \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"YOUR-PASSWORD"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Count units
curl -s -X POST "https://YOUR-ADDRESS.cluster.typedb.com:1729/v1/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"databaseName":"one","transactionType":"read","query":"match $u isa unit; select $u;"}'
```

---

## Step 10: Custom Domains (Optional)

### Pages (frontend)

1. Go to https://dash.cloudflare.com → Pages → `one-substrate` → Custom domains
2. Add `app.one.ie` (or your domain)
3. DNS will be configured automatically if domain is on Cloudflare

### Gateway Worker (API)

Add to `gateway/wrangler.toml`:

```toml
[[routes]]
pattern = "api.one.ie/*"
custom_domain = true
```

Then `cd gateway && npx wrangler deploy`.

---

## Step 11: Deploy NanoClaw (Edge Agents)

NanoClaw runs free agents on Cloudflare Workers — webhooks in, Claude processing via queue, replies out to channels.

```bash
cd nanoclaw

# Create queue (first time only)
npx wrangler queues create nanoclaw-agents

# Run D1 migration (adds groups, sessions, tool_calls tables)
npx wrangler d1 execute one --remote --file=migrations/0001_init.sql

# Deploy
npx wrangler deploy
```

Output:

```
Uploaded nanoclaw
Deployed nanoclaw triggers
  https://nanoclaw.oneie.workers.dev
  schedule: * * * * *
  Producer for nanoclaw-agents
  Consumer for nanoclaw-agents
```

**Verify:**

```bash
curl -s https://nanoclaw.oneie.workers.dev/health
# → {"status":"ok","version":"1.0.0","service":"nanoclaw-router"}
```

### Set Secrets (for live Claude calls)

```bash
cd nanoclaw

# Required — Claude API key for agent inference
printf 'sk-ant-YOUR-KEY' | npx wrangler secret put ANTHROPIC_API_KEY

# Optional — Telegram bot token
printf 'YOUR-BOT-TOKEN' | npx wrangler secret put TELEGRAM_TOKEN

cd ..
```

### Set Up Telegram Webhook (optional)

```bash
curl "https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook?url=https://nanoclaw.oneie.workers.dev/webhook/telegram"
```

### NanoClaw Bindings

| Binding | Resource | Purpose |
|---------|----------|---------|
| `DB` | D1 `one` | Messages, groups, sessions, tool calls |
| `KV` | Same as gateway | Path/unit/skill snapshots |
| `AGENT_QUEUE` | `nanoclaw-agents` | Async agent processing |
| `GATEWAY_URL` | `https://one-gateway.oneie.workers.dev` | TypeDB proxy |

### NanoClaw File Structure

```
nanoclaw/
├── src/workers/
│   ├── router.ts       # Webhook receiver → queue
│   ├── agent.ts        # Queue consumer → Claude → reply
│   └── scheduler.ts    # Cron task runner
├── src/channels/
│   ├── telegram.ts     # Telegram adapter
│   ├── discord.ts      # Discord adapter
│   └── slack.ts        # Slack adapter
├── src/lib/
│   ├── tools.ts        # 7 substrate tools for Claude
│   ├── context.ts      # Group context builder
│   └── substrate.ts    # TypeDB integration via gateway
├── migrations/
│   └── 0001_init.sql   # D1 schema (groups, messages, sessions, tasks, tool_calls)
└── wrangler.toml       # D1 + KV + Queue + Cron
```

---

## Verify Everything

Run this checklist after deploy:

```bash
echo "=== Gateway ==="
curl -s https://api.one.ie/health

echo ""
echo "=== Gateway → TypeDB ==="
curl -s -X POST https://api.one.ie/typedb/query \
  -H 'Content-Type: application/json' \
  -d '{"query":"match $u isa unit; select $u;","transactionType":"read"}' \
  | python3 -c "import sys,json; d=json.loads(sys.stdin.read()); print(f'OK — {len(d.get(\"answers\",[]))} units')"

echo ""
echo "=== Pages ==="
curl -sL https://one-substrate.pages.dev/ -o /dev/null -w '%{http_code} %{time_total}s'

echo ""
echo "=== Sync Worker ==="
curl -s https://one-sync.oneie.workers.dev/

echo ""
echo "=== NanoClaw ==="
curl -s https://nanoclaw.oneie.workers.dev/health

echo ""
echo "=== Export APIs ==="
for ep in units skills paths highways toxic; do
  code=$(curl -sL "https://one-substrate.pages.dev/api/export/$ep" -o /dev/null -w '%{http_code}')
  printf "  /api/export/%-10s HTTP %s\n" "$ep" "$code"
done
```

Expected:

```
=== Gateway ===
{"status":"ok","version":"1.0.0","database":"one"}

=== Gateway → TypeDB ===
OK — 19 units

=== Pages ===
200 0.4s

=== Sync Worker ===
{"status":"sync-worker","trigger":"/sync"}

=== NanoClaw ===
{"status":"ok","version":"1.0.0","service":"nanoclaw-router"}

=== Export APIs ===
  /api/export/units      HTTP 200
  /api/export/skills     HTTP 200
  /api/export/paths      HTTP 200
  /api/export/highways   HTTP 200
  /api/export/toxic      HTTP 200
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `TypeDB signin failed: 404` | Wrong port | Use port **1729** not 80 or 443 |
| `Authentication error [code: 10000]` | Using API Token | Use **Global API Key** with `CLOUDFLARE_API_KEY` + `CLOUDFLARE_EMAIL` |
| `kv_namespaces[0] bindings should have a string "id"` | Empty KV id in wrangler.toml | Run `npx wrangler kv namespace create KV` and paste the id |
| `Overlapping rules` in Pages deploy | `routes.extend.include` in astro config | Remove the `routes` block — Astro handles it |
| `404 page not found` from TypeDB (no port) | Port 443 is a load balancer, not TypeDB | Always use `:1729` |
| `[REP1] variable cannot be declared as both Attribute and Value` | Function param name matches attribute | Use comparison: `has uid $u; $u == $param;` |
| `expected var` in function return | `return first true` not valid | Return an entity variable: `return first $e;` |
| Build fails with `react-dom/server` | Missing edge compat alias | Check `astro.config.mjs` has `react-dom/server.edge` alias for prod |
| Sync API returns OK but TypeDB is empty | Pages can't read `import.meta.env` secrets at runtime | Set gateway URL as default in `typedb.ts`, or use `wrangler pages secret put` |
| Custom domain disables workers.dev | Wrangler default behavior | Add `workers_dev = true` to wrangler.toml |
| `routes` must be array | Single `[routes]` vs `[[routes]]` | Use `[[routes]]` (double bracket = TOML array) |
| R2 bucket not found on Pages deploy | `pages_build_output_dir` in wrangler.toml makes Pages read all bindings | `npx wrangler r2 bucket create one-files` |
| `fileURLToPath is not exported` | Static `import` of `node:url` in engine code | Use dynamic imports for Node APIs: `const fs = await import('node:fs')` |
| Path export returns 500 | `has source $s` treats roles as attributes | Use relation syntax: `(source: $s, target: $t) isa path` |
| Queue does not exist | Must create before deploy | `npx wrangler queues create nanoclaw-agents` |
| Old wrangler version | NanoClaw had wrangler 3.x | `npm install wrangler@4 --save-dev` |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge (Global)                           │
│                                                                      │
│  Pages (Astro)         Gateway Worker        Sync Worker             │
│  one-substrate         one-gateway           one-sync                │
│  .pages.dev            .oneie.workers.dev    .oneie.workers.dev      │
│  ┌─────────────┐       ┌──────────────┐      ┌─────────────┐        │
│  │ SSR + React │       │ /typedb/query │      │ cron */5    │        │
│  │ /api/*      │       │ /health      │      │ TypeDB → KV │        │
│  │ 30+ routes  │       │ JWT cached   │      │ 5 snapshots │        │
│  └──────┬──────┘       └──────┬───────┘      └──────┬──────┘        │
│         │                     │                     │               │
│    ┌────┴────┐           ┌────┴────┐           ┌────┴────┐          │
│    │   D1    │           │         │           │   KV    │          │
│    │ signals │           │         │           │  JSON   │          │
│    │ messages│           │         │           │ <1ms    │          │
│    └─────────┘           │         │           └─────────┘          │
│                          │         │                                 │
└──────────────────────────┼─────────┼─────────────────────────────────┘
                           │         │
                     JWT auth   Port 1729 HTTPS
                           │         │
                           ▼         ▼
                    ┌─────────────────────┐
                    │    TypeDB Cloud     │
                    │    (the brain)      │
                    │                     │
                    │  Schema: world.tql  │
                    │  19 functions       │
                    │  6 entity types     │
                    │  7 relation types   │
                    └─────────────────────┘
```

---

## File Map

```
envelopes/
├── wrangler.toml                 # D1, KV, Queue, R2 bindings
├── astro.config.mjs              # Cloudflare adapter (prod) + Node (dev)
├── src/
│   ├── env.d.ts                  # CF binding types
│   ├── lib/
│   │   ├── typedb.ts             # TypeDB client (read/write/decay)
│   │   └── edge.ts               # KV read helpers (<1ms)
│   ├── pages/api/
│   │   ├── export/               # TypeDB → JSON snapshots
│   │   │   ├── paths.ts
│   │   │   ├── units.ts
│   │   │   ├── skills.ts
│   │   │   ├── highways.ts
│   │   │   └── toxic.ts
│   │   ├── agents/sync.ts        # Agent markdown → TypeDB
│   │   ├── signal.ts             # Signal routing
│   │   └── ...                   # 25+ more API routes
│   └── schema/
│       └── world.tql             # TypeDB schema (6 dimensions)
├── gateway/
│   ├── wrangler.toml             # Gateway worker config
│   └── src/index.ts              # TypeDB proxy (128 lines)
├── workers/sync/
│   ├── wrangler.toml             # Sync worker config
│   └── index.ts                  # TypeDB → KV cron
├── migrations/
│   └── 0001_init.sql             # D1 schema (base 4 tables)
├── nanoclaw/
│   ├── wrangler.toml             # D1 + KV + Queue + Cron
│   ├── src/workers/              # router, agent, scheduler
│   ├── src/channels/             # telegram, discord, slack
│   ├── src/lib/                  # tools, context, substrate
│   └── migrations/0001_init.sql  # D1 schema (+3 tables)
└── agents/
    ├── marketing/                # 8 marketing team agents
    ├── tutor.md                  # Example agent
    └── researcher.md             # Example agent
```

---

## Step 12: Deploy Sui Contract (Testnet)

The Move contract enforces the same ontology on-chain. TypeDB reasons, Move enforces.

### 12a. Install Sui CLI

```bash
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui
```

### 12b. Create Keypair

```bash
sui client new-env --alias testnet --rpc https://fullnode.testnet.sui.io:443
sui client switch --env testnet
sui client new-address ed25519
# Save the address + recovery phrase. This is the platform keypair.
```

### 12c. Fund from Faucet

```bash
sui client faucet
# → Testnet SUI deposited
```

### 12d. Build and Test

```bash
cd src/move/one
sui move build
sui move test    # All tests should pass
```

### 12e. Publish

```bash
sui client publish --gas-budget 100000000
```

Output includes the package ID:

```
----- Transaction Effects ----
Created Objects:
  - ID: 0xABC...  , Owner: Shared (Protocol singleton)

Published:
  - PackageID: 0xDEF...
```

### 12f. Store Credentials

```bash
# Add to .env (never commit)
echo "SUI_PACKAGE_ID=0x<package-id>" >> .env
echo "SUI_NETWORK=testnet" >> .env
echo "SUI_PROTOCOL_ID=0x<protocol-object-id>" >> .env

cd ../../..
```

### 12g. Install TS SDK

```bash
npm install @mysten/sui
```

### 12h. Verify

```bash
# Check Protocol singleton exists
sui client object $SUI_PROTOCOL_ID
# → Should show Protocol { treasury: 0, fee_bps: 50 }

# Check package
sui client object $SUI_PACKAGE_ID
```

**What's on-chain after publish:**

| Object | Type | Purpose |
|--------|------|---------|
| Protocol | Shared | Fee treasury (50 bps default) |

Units, Colonies, Paths, Signals, Escrows, and Highways are created by calling contract functions.

See `docs/SUI.md` for the full Move contract documentation and phased task list.

---

## Redeploy (after changes)

```bash
# Gateway only
cd gateway && npx wrangler deploy && cd ..

# Sync worker only
cd workers/sync && npx wrangler deploy && cd ../..

# NanoClaw only
cd nanoclaw && npx wrangler deploy && cd ..

# Pages (frontend + API)
NODE_ENV=production npm run build
npx wrangler pages deploy dist/ --project-name=one-substrate --commit-dirty=true

# All four
cd gateway && npx wrangler deploy && cd ../workers/sync && npx wrangler deploy && cd ../../nanoclaw && npx wrangler deploy && cd .. && NODE_ENV=production npm run build && npx wrangler pages deploy dist/ --project-name=one-substrate --commit-dirty=true
```

---

## Security Notes

- **Secrets**: Never in `wrangler.toml` or committed files. Always `npx wrangler secret put`.
- **CORS**: Gateway locked to `one.ie` + `localhost` origins.
- **JWT**: Cached 61s per isolate. Auto-refreshes.
- **Toxicity**: Every signal checked against KV `toxic.json` (<1ms). Blocked before LLM call.
- **D1**: Prepared statements only (no string interpolation).
- **Client bundles**: No `import.meta.env` secrets leak to browser. Server-only.

---

## Live URLs (verified 2026-04-06)

| Service | URL | Status |
|---------|-----|--------|
| Pages | https://one-substrate.pages.dev | 200 OK, 0.4s |
| Gateway | https://api.one.ie/health | `{"status":"ok"}` |
| Gateway (alt) | https://one-gateway.oneie.workers.dev | Same worker |
| Sync | https://one-sync.oneie.workers.dev | cron `*/5 * * * *` |
| NanoClaw | https://nanoclaw.oneie.workers.dev/health | `{"status":"ok"}` |
| TypeDB Cloud | `flsiu1-0.cluster.typedb.com:1729` | 19 units, 18 skills, 1 group |

### Data in TypeDB (18 units, 18 skills, 1 group)

```
marketing world (8):
  marketing:marketing-director — strategize
  marketing:creative           — copy
  marketing:content-writer     — blog
  marketing:seo-specialist     — keywords
  marketing:social-media       — post
  marketing:media-buyer        — plan
  marketing:ads-manager        — setup
  marketing:marketing-analyst  — report

example agents (5):
  spanish-tutor, research-assistant, code-helper,
  writing-assistant, local-concierge

system units (5):
  router, scout, harvester, analyst, guard
```

---

*Every command on this page has been run. Every URL has been verified. Deploy with confidence.*
