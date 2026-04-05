---
name: deploy
description: Deploy ONE substrate to Cloudflare + TypeDB. Uses Global API Key from .env. Gateway, sync, Pages.
user-invocable: true
allowed-tools: Bash(*), Read(*), Edit(*), Write(*), Glob(*), Grep(*)
---

# /deploy — Deploy ONE Substrate

Deploys gateway worker, sync worker, and Pages to Cloudflare using the Global API Key from `.env`.

## What It Deploys

| Worker | URL | Purpose |
|--------|-----|---------|
| Gateway | api.one.ie | TypeDB proxy, JWT cache, CORS |
| Sync | one-sync.oneie.workers.dev | TypeDB → KV every 5 min |
| Pages | one-substrate.pages.dev | Astro SSR + React 19 + 30 API routes |

## Deploy All

Set auth from `.env` and deploy all three:

```bash
cd /Users/toc/Server/envelopes

# Auth (Global API Key — always use this, not scoped tokens)
export CLOUDFLARE_API_KEY=$(grep '^CLOUDFLARE_GLOBAL_API_KEY=' .env | cut -d= -f2)
export CLOUDFLARE_EMAIL=$(grep '^CLOUDFLARE_EMAIL=' .env | cut -d= -f2)
export CLOUDFLARE_ACCOUNT_ID=$(grep '^CLOUDFLARE_ACCOUNT_ID=' .env | cut -d= -f2)

# Build
NODE_ENV=production npm run build

# Deploy all three
cd gateway && npx wrangler deploy && cd ../workers/sync && npx wrangler deploy && cd ../..
npx wrangler pages deploy dist/ --project-name=one-substrate --commit-dirty=true
```

## Deploy Single Component

```bash
# Set auth first (same export block above)

# Gateway only
cd /Users/toc/Server/envelopes/gateway && npx wrangler deploy && cd ..

# Sync worker only
cd /Users/toc/Server/envelopes/workers/sync && npx wrangler deploy && cd ../..

# Pages only
cd /Users/toc/Server/envelopes && NODE_ENV=production npm run build && npx wrangler pages deploy dist/ --project-name=one-substrate --commit-dirty=true
```

## Verify

```bash
echo "Gateway:" && curl -s https://api.one.ie/health
echo ""
echo "Pages:" && curl -sL https://one-substrate.pages.dev/ -o /dev/null -w 'HTTP %{http_code} in %{time_total}s'
echo ""
echo "Sync:" && curl -s https://one-sync.oneie.workers.dev/
echo ""
echo "TypeDB units:" && curl -s -X POST https://api.one.ie/typedb/query \
  -H 'Content-Type: application/json' \
  -d '{"query":"match $u isa unit, has uid $id; select $id;","transactionType":"read"}' \
  | python3 -c "import sys,json; print(len(json.loads(sys.stdin.read()).get('answers',[])))"
```

## Seed Agents

```bash
cd /Users/toc/Server/envelopes
python3 -c "
import json, glob, os
agents = []
for f in sorted(glob.glob('agents/marketing/*.md')):
    if os.path.basename(f) == 'README.md': continue
    with open(f) as fh: agents.append({'name': os.path.basename(f).replace('.md',''), 'content': fh.read()})
payload = {'world': 'marketing', 'description': 'Marketing team', 'agents': agents}
with open('/tmp/sync.json', 'w') as f: json.dump(payload, f)
print(f'{len(agents)} agents')
" && curl -s -X POST https://one-substrate.pages.dev/api/agents/sync \
  -H 'Content-Type: application/json' -d @/tmp/sync.json \
  | python3 -c "import sys,json; d=json.loads(sys.stdin.read()); print(f'Synced {len(d.get(\"agents\",[]))} agents')"
```

## First-Time Setup

Only needed once — see `docs/deploy.md` for full walkthrough:

```bash
# Create resources
npx wrangler d1 create one
npx wrangler kv namespace create KV
# → Paste IDs into wrangler.toml + workers/sync/wrangler.toml

# Run migration
npx wrangler d1 execute one --remote --file=migrations/0001_init.sql

# Gateway secrets
cd gateway
printf 'admin' | npx wrangler secret put TYPEDB_USERNAME
printf 'YOUR-PASSWORD' | npx wrangler secret put TYPEDB_PASSWORD
cd ..

# Pages project
npx wrangler pages project create one-substrate --production-branch=main
```

## Rollback

```bash
npx wrangler pages deployment list --project-name=one-substrate
npx wrangler pages deployments rollback --project-name=one-substrate
```

## Monitoring

```bash
# Live logs
npx wrangler pages tail --project-name=one-substrate

# Gateway logs
cd gateway && npx wrangler tail && cd ..

# Deployment list
npx wrangler pages deployment list --project-name=one-substrate | head -10
```

## Gotchas

- TypeDB Cloud port is **1729** (not 80 or 443)
- TypeDB HTTP API prefix is `/v1/` (signin, query, databases)
- Always `CLOUDFLARE_API_KEY` (Global) — scoped tokens lack permissions
- Pages `import.meta.env` is build-time — gateway URL baked at build
- Custom domains: `[[routes]]` double bracket, no wildcards, add `workers_dev = true`
- Worker bundle limit: 3 MiB free / 10 MiB paid — use `export const prerender = true` on static pages

## Reference

- `docs/deploy.md` — Full step-by-step tutorial, all commands proven
- `docs/cloudflare.md` — Platform architecture, NanoClaw, economics, castes
- `docs/TODO-deploy.md` — Status tracking
