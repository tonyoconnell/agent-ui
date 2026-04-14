# TODO — Deploy

> Deployment tasks and results. Extracted from TODO.md + deploy.md.
> All verified 2026-04-06 unless noted.

---

## Infrastructure (COMPLETE)

| Step | What | Status | Verified |
|------|------|--------|----------|
| 1 | Clone + install (Node 20, npm 10, wrangler 4) | Done | ✓ |
| 2 | CF auth (Global API Key, account `627e0c7c…`) | Done | ✓ |
| 3a | D1 `one` created (APAC, `0aa5fceb…`) | Done | ✓ |
| 3b | KV namespace (`1c1dac47…`) | Done | ✓ |
| 3c | D1 migration: 4 tables (signals, messages, tasks, sync_log) | Done | ✓ |
| 4a | TypeDB Cloud signin (port 1729) | Done | ✓ |
| 4b | Database `one` created | Done | ✓ |
| 4c | Schema loaded (entities + attributes) | Done | ✓ |
| 4d | 19 functions loaded | Done | ✓ |
| 5 | Config updated (wrangler.toml, gateway, sync) | Done | ✓ |
| 6 | Gateway deployed | Done | ✓ |
| 7 | Sync worker deployed (cron `*/5`) | Done | ✓ |
| 8 | Pages deployed (HTTP 200, 0.4s) | Done | ✓ |
| 9 | Seed data: 18 units, 18 skills, 1 group | Done | ✓ |
| 10 | Custom domains: one.ie, app.one.ie, api.one.ie | Done | ✓ |
| 10b | R2 bucket `one-files` created | Done | ✓ |
| 10c | Export APIs: relation role syntax fix | Done | ✓ |
| 10d | All 5 export endpoints HTTP 200 | Done | ✓ |
| 11 | NanoClaw deployed | Done | ✓ |
| 11b | NanoClaw D1 migration (7 tables) | Done | ✓ |
| 11c | Queue `nanoclaw-agents` created | Done | ✓ |

## NanoClaw Live (COMPLETE)

| Step | What | Status | Verified |
|------|------|--------|----------|
| 11d | `OPENROUTER_API_KEY` secret set | Done | ✓ |
| 11e | `TELEGRAM_TOKEN` secret set (`@antsatworkbot`) | Done | ✓ |
| 11f | Telegram webhook live | Done | ✓ |
| 11g | LLM call verified (Gemma 4 via OpenRouter) | Done | ✓ |
| 11h | Test message accepted (`tg-631201674`) | Done | ✓ |

- **Model**: `google/gemma-4-26b-a4b-it` via OpenRouter (provider: Parasail)
- **No Anthropic API key needed** — all NanoClaw inference runs through OpenRouter

## Sui Contract (TODO — Step 12)

| Step | What | Status | Verified |
|------|------|--------|----------|
| 12a | Install Sui CLI (`cargo install sui`) | TODO | |
| 12b | Create testnet keypair (`sui client new-address ed25519`) | TODO | |
| 12c | Fund from faucet (`sui client faucet`) | TODO | |
| 12d | Build + test Move contract (`sui move build && sui move test`) | TODO | |
| 12e | Publish to Sui testnet (`sui client publish`) | TODO | |
| 12f | Store `SUI_PACKAGE_ID` + `SUI_PROTOCOL_ID` in `.env` | TODO | |
| 12g | Install `@mysten/sui` TS SDK | TODO | |
| 12h | Verify Protocol singleton on-chain | TODO | |

**After deploy:** Protocol singleton (shared object) created on `init()`. Units, Colonies, Paths, Signals, Escrows, Highways created by calling contract functions.

**Full task list:** See [TODO-SUI.md](TODO-SUI.md) for all 7 phases (39 open tasks).

---

## Security Audit (COMPLETE — commit ca8ea62)

- [x] **Critical:** TypeDB credentials in build output → moved to runtime/secrets
- [x] **High:** TQL injection → input validation + escaping added
- [x] Credentials removed from `dist/`
- [x] `docs/SECURE-DEPLOY.md` created

---

## Live URLs

| Service | URL | Status |
|---------|-----|--------|
| Pages | https://one-substrate.pages.dev | 200 OK, 0.4s |
| Gateway | https://api.one.ie/health | `{"status":"ok"}` |
| Gateway (alt) | https://one-gateway.oneie.workers.dev | same worker |
| Sync | https://one-sync.oneie.workers.dev | cron `*/5` |
| NanoClaw | https://nanoclaw.oneie.workers.dev/health | `{"status":"ok"}` |
| TypeDB Cloud | `flsiu1-0.cluster.typedb.com:1729` | 19 units, 18 skills |

## Live Data (TypeDB)

```
marketing world (8):
  marketing:marketing-director, marketing:creative,
  marketing:content-writer, marketing:seo-specialist,
  marketing:social-media, marketing:media-buyer,
  marketing:ads-manager, marketing:marketing-analyst

example agents (5):
  spanish-tutor, research-assistant, code-helper,
  writing-assistant, local-concierge

system units (5):
  router, scout, harvester, analyst, guard
```

## CF Resources

| Resource | Type | ID |
|----------|------|----|
| `one` | D1 | `0aa5fceb-667a-470e-b08c-40ead2f4525d` |
| KV | KV | `1c1dac4766e54a2c85425022a3b1e9da` |
| `one-files` | R2 | — |
| `nanoclaw-agents` | Queue | — |

## Redeploy Commands

```bash
# Gateway only
cd gateway && bun wrangler deploy && cd ..

# Sync worker only
cd workers/sync && bun wrangler deploy && cd ../..

# Pages (frontend + API)
NODE_ENV=production bun run build && bun wrangler pages deploy dist/ --project-name=one-substrate --commit-dirty=true

# NanoClaw
cd nanoclaw && bun wrangler deploy && cd ..

# Everything
cd gateway && bun wrangler deploy && cd ../workers/sync && bun wrangler deploy && cd ../.. && NODE_ENV=production bun run build && bun wrangler pages deploy dist/ --project-name=one-substrate --commit-dirty=true && cd nanoclaw && bun wrangler deploy && cd ..
```

## Verify Checklist

```bash
curl -s https://api.one.ie/health
curl -s https://one-sync.oneie.workers.dev/
curl -s https://nanoclaw.oneie.workers.dev/health
curl -sL https://one-substrate.pages.dev/ -o /dev/null -w '%{http_code} %{time_total}s'
for ep in units skills paths highways toxic; do
  code=$(curl -sL "https://one-substrate.pages.dev/api/export/$ep" -o /dev/null -w '%{http_code}')
  printf "  /api/export/%-10s HTTP %s\n" "$ep" "$code"
done
```

---

*Full deploy tutorial: `docs/deploy.md`. Troubleshooting: same file, bottom section.*
