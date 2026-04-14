---
name: deploy
description: Deploy ONE substrate to Cloudflare + TypeDB. Deterministic, fast, tested. Auto on feature branches, human approval on main.
user-invocable: true
allowed-tools: Bash(*), Read(*), Edit(*), Write(*), Glob(*), Grep(*)
---

# /deploy — Deterministic Deploy

Deploys all 4 Cloudflare services (gateway, sync, nanoclaw, pages) with full W0 baseline, build testing, and approval gates.

## Deterministic Deploy Flow

```
┌─────────────────────────────────────┐
│ 1. W0 Baseline                      │  bun run verify
│    (biome + typecheck + vitest)     │  MUST PASS
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ 2. Show Changes                     │  staged + uncommitted
│    (what will deploy)               │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ 3. Build                            │  NODE_ENV=production
│    (production bundle)              │  Shows timing + size
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ 4. Load Cloudflare Credentials      │  From .env
│    (Global API Key)                 │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ 5. Test Preview                     │  Verify dist/ + configs
│    (dry-run checks)                 │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       │                │
  branch=main     branch!=main
  HUMAN            AUTO
  APPROVAL         DEPLOY
       │                │
       ▼                ▼
┌─────────────────────────────────────┐
│ 6. Deploy                           │
│    • Gateway (api.one.ie)           │
│    • Sync (one-sync.oneie.workers)  │
│    • NanoClaw (nanoclaw.oneie...)   │
│    • Pages (one-substrate.pages.dev)│
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ 7. Health Check                     │
│    (verify all 4 responding)        │
└─────────────────────────────────────┘
```

## Usage

### Automatic (feature branch)
```bash
bun run deploy
```
Runs full pipeline, deploys automatically if branch ≠ main.

### Manual approval (main branch)
```bash
bun run deploy
```
Runs full pipeline, **asks for confirmation** if branch = main.

### Skip tests (risky)
```bash
bun run deploy:skip-tests
```
Skips W0 baseline. Use only if you know baseline passes elsewhere.

### Dry run (test without deploying)
```bash
bun run deploy:dry-run
```
Runs steps 1-5, stops before deploy.

### List changes
```bash
bun run deploy:list
```
Show all files that will deploy.

## Advanced

### Credentials

The script loads from `.env`:
- `CLOUDFLARE_GLOBAL_API_KEY` — Global API Key (not scoped tokens)
- `CLOUDFLARE_EMAIL` — Account email
- `CLOUDFLARE_ACCOUNT_ID` — Account ID

Always use Global API Key, not scoped tokens. See `/cloudflare` skill for credential management.

### Logs

Deployment logs saved to `.deploy.log`. Each worker deployment appends to the same log.
Build logs saved to `.deploy-build.log` (separate, for W0 baseline diagnostics).

### Custom Domains

- Gateway: `api.one.ie` (custom domain via Cloudflare)
- Pages: `one-substrate.pages.dev` (auto, plus custom domain via dashboard)
- Sync & NanoClaw: `*.oneie.workers.dev` (auto)

## First-Time Setup

Only needed once — see `docs/deploy.md` for full walkthrough:

```bash
# Create resources
bun wrangler d1 create one
bun wrangler kv namespace create KV
# → Paste IDs into wrangler.toml + workers/sync/wrangler.toml

# Run migration
bun wrangler d1 execute one --remote --file=migrations/0001_init.sql

# Gateway secrets
cd gateway
printf 'admin' | bun wrangler secret put TYPEDB_USERNAME
printf 'YOUR-PASSWORD' | bun wrangler secret put TYPEDB_PASSWORD
cd ..

# Pages project
bun wrangler pages project create one-substrate --production-branch=main
```

## Rollback

```bash
bun wrangler pages deployment list --project-name=one-substrate
bun wrangler pages deployments rollback --project-name=one-substrate
```

## Monitoring

```bash
# Live logs
bun wrangler pages tail --project-name=one-substrate

# Gateway logs
cd gateway && bun wrangler tail && cd ..

# Deployment list
bun wrangler pages deployment list --project-name=one-substrate | head -10
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
