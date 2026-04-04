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
bun install
wrangler dev          # Local development
wrangler deploy       # Production (api.one.ie)
```
