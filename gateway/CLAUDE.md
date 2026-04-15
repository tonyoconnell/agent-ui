# Gateway

Cloudflare Worker proxy: browser → Worker → TypeDB Cloud.

## Substrate Learning

The gateway is the bridge between the edge (fast, volatile) and the brain (slow, persistent). Every TypeDB query flows through here:

```
browser → gateway (<10ms) → TypeDB Cloud (~100ms)
                    │
                    └── JWT cached per-isolate (61s TTL)
                        No cold-start penalty on repeat queries
```

The gateway doesn't learn — it relays. But its speed determines how fast the brain can be queried. At `<10ms` gateway latency, TypeDB's `~300ms` query time dominates. The nervous system (`src/engine/`) avoids this by running in-memory and syncing to TypeDB asynchronously.

**Context:** [speed.md](../../docs/speed.md) — gateway `<10ms` p50, why it matters for learning rate. [routing.md](../../docs/routing.md) — the sandwich that determines when TypeDB is queried vs skipped; gateway enforces the PRE checks before every proxied query. [revenue.md](../../docs/revenue.md) — every signal relayed here is a Layer 1 routing fee event; gateway latency directly determines the max transaction rate. [DSL.md](../../docs/DSL.md) — signal grammar that the gateway relays without parsing; receiver/data shape is opaque to the proxy layer. [dictionary.md](../../docs/dictionary.md) — canonical names used in the `/broadcast` message type allowlist (`complete`, `unblock`, `mark`, `warn`, `task-update`, `sync`). [lifecycle.md](../../docs/lifecycle.md) — gateway is the infra layer; register/signal/highway/harden all pass through here as HTTP or WebSocket traffic. [buy-and-sell.md](../../docs/buy-and-sell.md) — EXECUTE and SETTLE steps transit the gateway via `/typedb/query` relay; `/api/pay` is proxied here. [patterns.md](../../docs/patterns.md) — gateway implements the deterministic sandwich pre-check for every proxied TypeDB query (toxic → dissolve before reaching the brain). [rubrics.md](../../docs/rubrics.md) — integration tests score against fit/form/truth/taste; 11/11 deterministic passes are the rubric baseline for this layer.

## Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/` | GET | — | Service info |
| `/health` | GET | — | Status check |
| `/ws` | GET (upgrade) | Origin | WebSocket upgrade → WsHub DO |
| `/tasks` | GET | — | Task list (KV fast path, TypeDB fallback) |
| `/broadcast` | POST | `X-Broadcast-Secret` | Relay WsMessage to all WS clients via DO |
| `/typedb/query` | POST | — | Proxy TypeQL queries to TypeDB Cloud |
| `/messages` | GET | — | D1 conversation history |

### Security on /ws and /broadcast

- `/ws`: rejects requests without Origin ∈ CORS_ORIGINS (403); enforces 100-connection cap per DO (503).
- `/broadcast`: requires `X-Broadcast-Secret` header matching `env.BROADCAST_SECRET` (403 otherwise); validates `message.type` against allowlist `[complete, unblock, mark, warn, task-update, sync]` (400 otherwise).

### WsHub Durable Object

The `/ws` and `/broadcast` routes forward to a single DO instance (named `"global"`) so every CF isolate shares the same connected-clients set. Uses hibernation API (`state.acceptWebSocket`) — DO sleeps between messages, sockets persist across evictions.

- Deploy requires migration in `wrangler.toml`: `new_sqlite_classes = ["WsHub"]`
- Binding: `env.WS_HUB: DurableObjectNamespace`
- `connectedClients.size` check goes through `DO.fetch('/count')` to enforce global cap

## Config

Secrets (set via `wrangler secret put`):
- `TYPEDB_URL` — TypeDB Cloud endpoint
- `TYPEDB_DATABASE` — Database name ("one")
- `TYPEDB_USERNAME` — "admin"
- `TYPEDB_PASSWORD` — TypeDB Cloud password
- `BROADCAST_SECRET` — Shared secret for `/broadcast` auth (also in repo `.env` for server-side relay from `ws-server.ts`)

## Auth

JWT token cached per-isolate for 61 seconds. Auto-refreshes on expiry.

## CORS

Allowed origins: localhost:4321, localhost:3000, one.ie, app.one.ie

## Deploy

**Use `/deploy` skill (deploys all 4 services in parallel) or deploy gateway alone:**

```bash
# From repo root — full pipeline including gateway (65s total)
bun run deploy

# Gateway only (manual, for debugging)
cd gateway && wrangler deploy
```

Auth is auto-handled by `scripts/deploy.ts` — Global API Key from `.env`, scoped token blanked. Don't set `CLOUDFLARE_API_TOKEN` manually.

## Last Deploy (2026-04-14)

```
Worker:    one-gateway
Bundle:    30.05 KiB / gzip: 7.48 KiB
Startup:   14 ms
Version:   bfe40a7d-195d-41bd-892b-908c394057c8
Health:    200 in 52ms
URLs:      https://one-gateway.oneie.workers.dev
           https://api.one.ie (custom domain)
Bindings:  WS_HUB (Durable Object), KV, D1 (one), VERSION,
           TYPEDB_URL, TYPEDB_DATABASE
Secrets:   BROADCAST_SECRET, TYPEDB_USERNAME, TYPEDB_PASSWORD
```

### Integration Test

```bash
BROADCAST_SECRET=$(grep '^BROADCAST_SECRET=' .env | cut -d= -f2) \
  bun run scripts/test-ws-integration.ts
```

Exercises: WS connect with Origin, ping/pong keepalive, auth on `/broadcast`,
type validation, DO-routed broadcast delivery, origin rejection, reconnect,
latency. 11/11 pass deterministically.
