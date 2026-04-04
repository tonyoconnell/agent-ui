# Deploy to Cloudflare

Everything needed. Proven patterns from `../ants-at-work`.

---

## Status

- [x] `wrangler.toml` — CF Pages config
- [x] `astro.config.mjs` — Cloudflare adapter (prod) + Node adapter (dev)
- [x] `@astrojs/cloudflare@12.6.9` — installed, compatible with Astro 5
- [x] `@astrojs/node@9.4.4` — installed, local dev
- [x] `wrangler` — installed
- [x] `.env` — all CF keys present
- [x] `scripts/deploy.sh` — one command deploy
- [x] `Makefile` — `make deploy` / `make deploy-preview`
- [x] Production build passes — chunk splitting active
- [ ] `wrangler pages project create envelopes` — create CF Pages project
- [ ] `make deploy` — first deploy
- [ ] Custom domain — point one.ie subdomain

---

## Quick Deploy

```bash
# First time: create the project
wrangler pages project create envelopes

# Deploy
make deploy

# Or manually
NODE_ENV=production npm run build
./scripts/deploy.sh
```

---

## What's Here

| File | From | Purpose |
|------|------|---------|
| `wrangler.toml` | `ants/website/wrangler.toml` | CF Pages config |
| `astro.config.mjs` | `ants/website/astro.config.mjs` | Dual adapter, chunk splitting, edge compat |
| `scripts/deploy.sh` | `ants/scripts/cloudflare-deploy.sh` | Deploy automation |
| `Makefile` | `ants/Makefile` | Dev workflow |
| `.env` | `ants/.env` | Same CF account, all keys |

---

## What's Available in ../ants-at-work

When you need more, it's all there:

### API Gateway (Hono on CF Workers)
```
../ants-at-work/gateway-cf/
  src/index.ts          — Hono router, CORS, rate limiting, auth middleware
  src/agents.ts         — Agent CRUD endpoints
  src/realtime.ts       — Durable Object WebSocket hub
  src/secure-dp.ts      — AES-256-GCM encryption
  schema.sql            — D1 database schema (tokens, edges, signals, trades)
  wrangler.toml         — Worker config with D1 + Durable Objects
  package.json          — hono + wrangler deps
```

### CI/CD Pipeline (GitHub Actions)
```
../ants-at-work/.github/workflows/
  website.yml           — Lint → Build → Deploy to CF Pages (+ preview deploys)
  security.yml          — pip-audit, bandit, gitleaks, npm audit
```

### Production Infrastructure
```
../ants-at-work/scripts/
  deploy-to-aws.sh      — Git-pull deploy to Tokyo (systemd restart)
  cloudflare-deploy.sh  — CF Pages deploy with branch targeting
```

### TypeDB Integration
```
../ants-at-work/gateway-cf/
  D1 for hot cache (edge, <1ms)
  TypeDB Cloud for cold storage (persist.ts already wired)
  Tokyo proxy bridges Workers → TypeDB Cloud
```

### Moltworker (AI Agents on Edge)
```
../ants-at-work/gateway-cf/
  wrangler.moltworker.toml  — Separate worker deployment
  src/moltworker.ts         — Workers AI + code execution + browser rendering
```

---

## Next Steps

### 1. CF Pages (done — just deploy)
```bash
make deploy
```

### 2. CF Worker API (when you need persistence)
Copy `gateway-cf/` pattern. Create `api/` directory:
```
api/
  wrangler.toml         — Worker config
  src/index.ts          — Hono router
  src/colony.ts         — Colony state endpoints
  schema.sql            — D1 schema for edges/signals
```

### 3. Durable Objects (when you need real-time)
Copy `gateway-cf/src/realtime.ts` for WebSocket hub.
Watch highways form across multiple browser clients simultaneously.

### 4. D1 + TypeDB (when you need memory)
```
D1 (edge, <1ms)    → hot pheromone cache
TypeDB (cloud)     → cold knowledge store
persist.ts         → already bridges both
```

### 5. R2 (when you need storage)
Colony snapshots, pattern embeddings, agent genomes.
Keys already in `.env`:
```
CLOUDFLARE_R2_TOKEN
CLOUDFLARE_R2_S3_ACCESS_KEY_ID
CLOUDFLARE_R2_S3_SECRET_KEY
```

---

## Keys Reference

All in `.env` (gitignored):

```
CLOUDFLARE_ACCOUNT_ID          — account
CLOUDFLARE_GLOBAL_API_KEY       — full access
CLOUDFLARE_API_TOKEN            — scoped token
CLOUDFLARE_EMAIL                — tony@one.ie
CLOUDFLARE_R2_*                 — object storage
```

---

*One command. Proven pattern. Same account.*
