---
name: deploy
description: Deploy ONE substrate to Cloudflare + TypeDB. Deterministic, fast, tested. Auto on feature branches, human approval on main.
user-invocable: true
allowed-tools: Bash(*), Read(*), Edit(*), Write(*), Glob(*), Grep(*)
---

# /deploy — Deterministic Deploy

Deploys all 4 Cloudflare services (gateway, sync, nanoclaw, pages) with full W0 baseline, build testing, and approval gates.

**Auth: Global API Key only.** The script explicitly unsets `CLOUDFLARE_API_TOKEN` and uses `CLOUDFLARE_API_KEY` + `CLOUDFLARE_EMAIL` + `CLOUDFLARE_ACCOUNT_ID` (loaded from `.env` as `CLOUDFLARE_GLOBAL_API_KEY`). Scoped tokens are forbidden — they lack permissions for workers + custom domains. See `/cloudflare` skill.

## Deterministic Deploy Flow — 65.0s verified

```
┌─────────────────────────────────────┐
│ 1. W0 Baseline                      │  bun run verify (~10s)
│    biome + tsc + vitest (326 tests) │  MUST PASS
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ 2. Changes                          │  git diff summary
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ 3. Build                            │  NODE_ENV=production (~23s)
│    astro build → dist/ 5.7 MiB      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ 4. Credentials                      │  Global API Key only
│    auto-blank CLOUDFLARE_API_TOKEN  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ 5. Smoke check                      │  dist/ + 3 wrangler.toml
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       │                │
  branch=main     branch!=main
  prompt "yes"     auto
       │                │
       └───────┬────────┘
               │
┌──────────────▼──────────────────────┐
│ 6. Deploy (parallel workers)        │
│    Gateway  ┐                       │
│    Sync     ├─ async, ~24s total    │
│    NanoClaw ┘  (vs 64s sequential)  │
│    Pages     — after workers, ~16s  │
│    📎 Preview URL captured          │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ 7. Health (3 retries, backoff)      │
│    parallel fetch 4 URLs            │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ 8. Substrate record                 │
│    POST /api/signal                 │
│    deploy:success | deploy:degraded │
└─────────────────────────────────────┘
```

## Two Deploy Paths

### Path A: Local CLI
Run from your machine. Uses `.env` credentials. Human-approved on main.

### Path B: GitHub Actions (`.github/workflows/deploy.yml`)
- Push to `feature/**` → auto-deploy Pages preview after W0
- Push to `main` → waits for GitHub `environment: production` reviewer, then parallel deploy
- Secrets needed: `CLOUDFLARE_GLOBAL_API_KEY`, `CLOUDFLARE_EMAIL`, `CLOUDFLARE_ACCOUNT_ID`
- See `/cloudflare` skill for secret setup

## Usage

### Full pipeline
```bash
bun run deploy
```
Runs all 8 steps. Auto-deploys if branch ≠ main; asks approval if branch = main.
Set `DEPLOY_CONFIRM=yes` in the env to skip the TTY prompt (used by CI behind the GitHub `environment: production` gate).

All variants are now flags on the same script:

```bash
bun run deploy -- --dry-run        # steps 1-5, no deploy
bun run deploy -- --strict         # no flaky allowance
bun run deploy -- --skip-tests     # skip W0 (risky — only when verified elsewhere)
bun run deploy -- --preview-only   # build + smoke, stop before push
```

## Known-Flaky Test Allowlist

Located in `scripts/deploy.ts`:

```typescript
const KNOWN_FLAKY = [
  'Act 15: Speed Benchmarks',  // hardware-dependent
  'STAN distribution',          // stochastic
  'explorer mode',              // stochastic
]
```

These failures don't block deploy. Real failures (type errors, broken logic) always block. Use `--strict` to require full green.

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
