# Gateway

Cloudflare Worker proxy: browser → Worker → TypeDB Cloud.

## Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/typedb/query` | POST | Proxy TypeQL queries to TypeDB Cloud |
| `/health` | GET | Status check |

## Config

Secrets (set via `wrangler secret put`):
- `TYPEDB_URL` — TypeDB Cloud endpoint
- `TYPEDB_DATABASE` — Database name ("one")
- `TYPEDB_USERNAME` — "admin"
- `TYPEDB_PASSWORD` — TypeDB Cloud password

## Auth

JWT token cached per-isolate for 61 seconds. Auto-refreshes on expiry.

## CORS

Allowed origins: localhost:4321, localhost:3000, one.ie, app.one.ie

## Deploy

```bash
# Auth (Global API Key — wrangler needs CLOUDFLARE_API_KEY, not _API_TOKEN)
export CLOUDFLARE_API_KEY=$(grep '^CLOUDFLARE_GLOBAL_API_KEY=' .env | cut -d= -f2)
export CLOUDFLARE_EMAIL=$(grep '^CLOUDFLARE_EMAIL=' .env | cut -d= -f2)

bun install
wrangler dev          # Local development
wrangler deploy       # Production (api.one.ie)
```

## Last Deploy (2026-04-06)

```
Worker:    one-gateway
Bundle:    24.47 KiB / gzip: 6.26 KiB
Startup:   14 ms
Version:   a3016ef3-1b90-4f00-938f-39e13b3de2d7
URLs:      https://one-gateway.oneie.workers.dev
           https://api.one.ie (custom domain)
Bindings:  KV, D1 (one), VERSION, TYPEDB_URL, TYPEDB_DATABASE
```
