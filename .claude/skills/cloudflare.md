---
name: cloudflare
description: Cloudflare account management. Credentials, secrets, monitoring, debugging, rollback.
user-invocable: true
allowed-tools: Bash(*), Read(*), Write(*)
---

# /cloudflare — Cloudflare Operations

Manage ONE's Cloudflare deployment: credentials, secrets, KV namespaces, D1 database, monitoring, logs, rollback.

## Credentials — GLOBAL API KEY ONLY

**⚠ NON-NEGOTIABLE: Every wrangler/curl invocation in this project uses the Global API Key.**

Scoped API tokens (`CLOUDFLARE_API_TOKEN`) are **forbidden** — they lack permissions for:
- Workers deploy + custom domains
- KV namespace management
- D1 database creation
- Pages project creation
- Secrets management

**The ONE wrangler auth mode:**
```bash
CLOUDFLARE_API_KEY=<global-api-key>      # wrangler reads this
CLOUDFLARE_EMAIL=<account-email>         # wrangler reads this
CLOUDFLARE_ACCOUNT_ID=<32-char-hex>      # wrangler reads this
CLOUDFLARE_API_TOKEN=                    # MUST be unset/empty
```

**`.env` stores it as `CLOUDFLARE_GLOBAL_API_KEY`** (to avoid conflict with wrangler's env var name):
```bash
# .env (gitignored)
CLOUDFLARE_GLOBAL_API_KEY=your-global-api-key
CLOUDFLARE_EMAIL=tony@one.ie
CLOUDFLARE_ACCOUNT_ID=627e0c7ccbe735a4a7cabf91e377bbad
```

Scripts map `CLOUDFLARE_GLOBAL_API_KEY` → `CLOUDFLARE_API_KEY` at runtime, and explicitly blank out `CLOUDFLARE_API_TOKEN` to force Global Key auth. See `scripts/deploy.ts:loadCredentials()`.

**Detecting misconfiguration:**
- Error "Authentication failed [code: 9106]" → Global Key not being used
- Error "Invalid access token [code: 9109]" → `CLOUDFLARE_API_TOKEN` is set and invalid
- Fix: unset `CLOUDFLARE_API_TOKEN`, reload `.env`, retry

**Getting the Global API Key:**

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Under **Global API Key** → "View"
3. Re-enter password, copy key (40 chars)
4. Paste into `.env` as `CLOUDFLARE_GLOBAL_API_KEY=...`

Email and Account ID visible on same profile page.

### Manual auth (debugging only)

If running wrangler directly, you must export these three and unset the token:

```bash
export CLOUDFLARE_API_KEY=$(grep '^CLOUDFLARE_GLOBAL_API_KEY=' .env | cut -d= -f2-)
export CLOUDFLARE_EMAIL=$(grep '^CLOUDFLARE_EMAIL=' .env | cut -d= -f2-)
export CLOUDFLARE_ACCOUNT_ID=$(grep '^CLOUDFLARE_ACCOUNT_ID=' .env | cut -d= -f2-)
unset CLOUDFLARE_API_TOKEN   # MUST unset, or wrangler prefers it
```

**Always prefer `bun run deploy` over manual wrangler** — the script handles this automatically.

## Secrets

Secrets are per-worker. Set via wrangler:

```bash
# Gateway secrets (TypeDB auth)
cd gateway
printf 'admin' | bun wrangler secret put TYPEDB_USERNAME
printf 'your-typedb-password' | bun wrangler secret put TYPEDB_PASSWORD
cd ..

# NanoClaw secrets (LLM + channels)
cd nanoclaw
printf 'your-openrouter-key' | bun wrangler secret put OPENROUTER_API_KEY
printf 'your-telegram-token' | bun wrangler secret put TELEGRAM_TOKEN
printf 'your-discord-token' | bun wrangler secret put DISCORD_TOKEN
cd ..

# Sync worker secrets (none — uses gateway for TypeDB)
```

**List secrets:**
```bash
cd gateway && bun wrangler secret list && cd ..
```

**Delete secret:**
```bash
cd gateway && bun wrangler secret delete TYPEDB_PASSWORD && cd ..
```

## KV Namespaces

KV is shared across all workers (same namespace ID in all `wrangler.toml`).

Binding name: `KV` (in all workers)
Namespace ID: `1c1dac4766e54a2c85425022a3b1e9da`

**View KV contents (via gateway):**
```bash
curl -X POST https://api.one.ie/typedb/query \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "SELECT * FROM kv_namespace LIMIT 10",
    "transactionType": "read"
  }' | jq .
```

**Delete KV key:**
```bash
bun wrangler kv:key delete --binding=KV --namespace-id=1c1dac4766e54a2c85425022a3b1e9da "key-name"
```

**Clear entire namespace (risky):**
```bash
bun wrangler kv:namespace delete --binding=KV --namespace-id=1c1dac4766e54a2c85425022a3b1e9da
# Then recreate it
```

## D1 Database

D1 database "one" stores signals, messages, and sync logs (not the main brain — TypeDB is).

Database ID: `0aa5fceb-667a-470e-b08c-40ead2f4525d`

**Execute query:**
```bash
bun wrangler d1 execute one --remote --command="SELECT COUNT(*) FROM signals LIMIT 1"
```

**Run migration:**
```bash
bun wrangler d1 execute one --remote --file=migrations/0001_init.sql
```

**Backup (export):**
```bash
bun wrangler d1 export one --output=/tmp/one-backup.sql
```

**Restore (import):**
```bash
bun wrangler d1 execute one --remote --file=/tmp/one-backup.sql
```

## Monitoring

### Live Logs

```bash
# Gateway logs (real-time)
cd gateway && bun wrangler tail && cd ..

# Pages logs
bun wrangler pages tail --project-name=one-substrate

# Sync worker logs
cd workers/sync && bun wrangler tail && cd ..

# NanoClaw logs
cd nanoclaw && bun wrangler tail && cd ..
```

### Deployment History

```bash
# List all Pages deployments
bun wrangler pages deployment list --project-name=one-substrate | head -20

# List gateway deployments
cd gateway && bun wrangler deployments list && cd ..

# Inspect specific deployment
bun wrangler pages deployment view --project-name=one-substrate <DEPLOYMENT_ID>
```

### Performance

```bash
# Test Gateway latency
time curl -s https://api.one.ie/health -o /dev/null

# Test Pages latency
time curl -s https://one-substrate.pages.dev/ -o /dev/null

# Test TypeDB via gateway (includes network + database roundtrip)
time curl -X POST https://api.one.ie/typedb/query \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "match $u isa unit; limit 1; select $u;",
    "transactionType": "read"
  }' -o /dev/null
```

Expected:
- Gateway: <10ms
- Pages: <500ms
- TypeDB query: <100ms

## Rollback

### Pages

```bash
# List deployments
bun wrangler pages deployment list --project-name=one-substrate

# Rollback to specific deployment
bun wrangler pages deployments rollback --project-name=one-substrate
# Follow prompts to select deployment

# Or rollback to production (auto-selects last main branch deploy)
bun wrangler pages deployments rollback --project-name=one-substrate --production
```

### Workers

```bash
# List gateway versions
cd gateway && bun wrangler deployments list && cd ..

# View specific version details
bun wrangler deployments view <VERSION_ID> --name=one-gateway

# Rollback (wrangler auto-reverts to previous)
cd gateway && bun wrangler rollback && cd ..
```

**Note:** Wrangler doesn't have automatic rollback for workers. Instead:
1. Find the previous commit with `git log`
2. Build and deploy that version
3. Or use Cloudflare Dashboard → Workers → one-gateway → Deployments → Rollback

## Custom Domains

### Gateway (api.one.ie)

Custom domain configured in `gateway/wrangler.toml`:
```toml
[[routes]]
pattern = "api.one.ie"
custom_domain = true
```

Deployed to: `one-gateway.oneie.workers.dev` (auto), plus custom domain `api.one.ie`.

**Update custom domain:**
1. Go to https://dash.cloudflare.com/domains/one.ie
2. DNS → Workers → one-gateway
3. Route `api.one.ie` to `one-gateway.oneie.workers.dev`

### Pages (one-substrate.pages.dev)

Auto-deployed to `one-substrate.pages.dev`.

**Add custom domain:**
1. Pages project settings → Custom domains
2. Add domain `app.one.ie`
3. Add CNAME record `app.one.ie` → `one-substrate.pages.dev`

## Troubleshooting

### "Authentication failed (status: 400)"

```bash
# Check credentials
echo $CLOUDFLARE_GLOBAL_API_KEY  # Should be 40 chars
echo $CLOUDFLARE_EMAIL
echo $CLOUDFLARE_ACCOUNT_ID      # Should be 32 chars
```

If empty or wrong, reload `.env`:
```bash
set -a && source .env && set +a && echo "✓ Credentials loaded"
```

### "Worker startup time: 400ms" (slow)

Bundle might be too large. Check:
```bash
cd gateway && bun wrangler publish --dry-run | grep "Total Upload"
```

If >3 MiB, need to optimize.

### "Queue backed up" (NanoClaw)

Queue might have pending jobs. Clear it:
```bash
# View queue status
bun wrangler queues consumers list nanoclaw-agents

# Purge queue (destructive)
# No built-in command; contact Cloudflare support or use Dashboard
```

### Gateway returning 502

TypeDB might be down or credentials invalid.

```bash
# Test TypeDB directly (use gateway creds in secret)
curl -X POST https://flsiu1-0.cluster.typedb.com:1729/v1/query \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "match $u isa unit; limit 1;",
    "transactionType": "read"
  }' -H 'Authorization: Bearer <token>' 2>&1 | head -20
```

If 401, update `TYPEDB_PASSWORD` secret:
```bash
cd gateway && printf 'new-password' | bun wrangler secret put TYPEDB_PASSWORD && cd ..
```

## GitHub Actions CI Setup

The repo includes `.github/workflows/deploy.yml` which auto-deploys feature branches and gates main behind a reviewer.

### Required GitHub Repository Secrets

Go to Settings → Secrets and variables → Actions → New repository secret:

| Secret | Value |
|--------|-------|
| `CLOUDFLARE_GLOBAL_API_KEY` | The 40-char Global API Key from `.env` |
| `CLOUDFLARE_EMAIL` | `tony@one.ie` |
| `CLOUDFLARE_ACCOUNT_ID` | `627e0c7ccbe735a4a7cabf91e377bbad` |

**Do NOT set `CLOUDFLARE_API_TOKEN`** — the workflow explicitly blanks it to force Global API Key auth.

### Production Environment Gate (main branch)

Go to Settings → Environments → New environment:

1. Name: `production`
2. Deployment branches: `main` only
3. Required reviewers: add yourself (or team)
4. Wait timer: optional (e.g., 1 minute)

Now every push to main triggers CI → verify → build → waits for your approval → deploys.

### Workflow Behavior

```
push feature/**  →  verify → auto-deploy Pages preview (no gate)
push main        →  verify → build → 🚦 wait for reviewer → parallel deploy
workflow_dispatch →  manual trigger from Actions tab
```

Feature branches deploy only to Pages preview (not workers) — faster iteration without touching production workers.

## Integration with /deploy

The `/deploy` skill (deterministic deployment) uses these credentials and operations:

1. Loads `CLOUDFLARE_GLOBAL_API_KEY` from `.env`
2. Runs `bun wrangler deploy` on each worker
3. Deploys Pages with `bun wrangler pages deploy`
4. Runs health checks via `curl` to verify

See `/deploy` skill for full automation.

## Reference

- `docs/cloudflare.md` — Full Cloudflare architecture, castes, economics
- `docs/deploy.md` — Full deployment tutorial
- Cloudflare Dashboard: https://dash.cloudflare.com/627e0c7ccbe735a4a7cabf91e377bbad
- Wrangler docs: https://developers.cloudflare.com/workers/cli-wrangler/
