---
title: PLAN — Cloudflare Tunnels Architecture
type: plan
version: 1.0.0
status: ANALYSIS
---

# PLAN: Cloudflare Tunnels Architecture

> **Context:** Full system analysis of where CF Tunnels add value.
> TypeDB Cloud stays managed. Looking for hardening + latency + security wins.

## System Map

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ONE SUBSTRATE SYSTEM                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────────────────── CLOUDFLARE EDGE ─────────────────────────────┐   │
│   │                                                                          │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │   │
│   │  │    Pages     │  │   Gateway    │  │    Sync      │  │  NanoClaw   │  │   │
│   │  │  30+ routes  │  │  TypeDB      │  │  TypeDB→KV   │  │  Webhooks   │  │   │
│   │  │  SSR+islands │  │  proxy       │  │  every 1min  │  │  3 bots     │  │   │
│   │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘  │   │
│   │         │                 │                 │                 │         │   │
│   │    ┌────┴────┐       ┌────┴────┐       ┌────┴────┐       ┌────┴────┐    │   │
│   │    │   D1    │       │         │       │   KV    │       │  Queue  │    │   │
│   │    │ signals │       │         │       │ <1ms    │       │ agents  │    │   │
│   │    └─────────┘       │         │       └─────────┘       └─────────┘    │   │
│   │                       │         │                                        │   │
│   └───────────────────────┼─────────┼────────────────────────────────────────┘   │
│                           │         │                                            │
│                      OUTBOUND CALLS │                                            │
│                           │         │                                            │
├───────────────────────────┼─────────┼────────────────────────────────────────────┤
│                           ▼         ▼                                            │
│   ┌─────────────────── EXTERNAL SERVICES ───────────────────────────────────┐   │
│   │                                                                          │   │
│   │  BRAIN              LLM                 CHANNELS           DATA          │   │
│   │  ──────             ───                 ────────           ────          │   │
│   │  TypeDB Cloud       OpenRouter          Telegram API       Sui           │   │
│   │  :1729              :443                :443               :443          │   │
│   │                     Anthropic           Discord API        CoinGecko     │   │
│   │                     OpenAI              Slack API          CoinMarketCap │   │
│   │                                         GitHub API         Open-Meteo    │   │
│   │                     AgentVerse          Linear API                       │   │
│   │                     :443                Notion API                       │   │
│   │                                         PagerDuty                        │   │
│   │                                         Mailchimp                        │   │
│   │                                         Stripe                           │   │
│   │                                                                          │   │
│   └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│                           ▲         ▲                                            │
│                      INBOUND WEBHOOKS                                            │
│                           │         │                                            │
│   ┌─────────────────── WEBHOOK SOURCES ─────────────────────────────────────┐   │
│   │                                                                          │   │
│   │  Telegram           Discord            Future                            │   │
│   │  ─────────          ───────            ──────                            │   │
│   │  /webhook/telegram  /webhook/discord   /webhook/github                   │   │
│   │  /webhook/telegram-one                 /webhook/stripe                   │   │
│   │  /webhook/telegram-donal               /webhook/linear                   │   │
│   │                                                                          │   │
│   └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────────── FEDERATION (future) ─────────────────────────────────┐   │
│   │                                                                          │   │
│   │  legal.one.ie       finance.one.ie     world-b.one.ie                   │   │
│   │  (separate world)   (separate world)   (separate world)                 │   │
│   │                                                                          │   │
│   │  Each world can run on:                                                  │   │
│   │  - CF Workers (public)                                                   │   │
│   │  - Private server + Tunnel (private)                                     │   │
│   │  - Hybrid (public API, private brain)                                    │   │
│   │                                                                          │   │
│   └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────────── DEV ENVIRONMENT ─────────────────────────────────────┐   │
│   │                                                                          │   │
│   │  localhost:4321     localhost:1729     localhost:???                     │   │
│   │  (Astro dev)        (TypeDB local)     (other services)                 │   │
│   │                                                                          │   │
│   │  Problems:                                                               │   │
│   │  - Telegram webhooks need public URL                                     │   │
│   │  - Can't test prod CF workers → local services                          │   │
│   │  - ngrok has bandwidth limits                                            │   │
│   │                                                                          │   │
│   └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## Where Tunnels Add Value

### 1. Dev Environment Tunnels (HIGH VALUE)

**Problem:** Telegram/Discord webhooks need public URLs. Testing locally requires exposing localhost.

**Solution:** Quick tunnel for dev testing.

```bash
# Install once
brew install cloudflare/cloudflare/cloudflared

# Run when needed (no config, instant)
cloudflared tunnel --url http://localhost:4321
# → https://random-slug.trycloudflare.com

# Register webhook to tunnel URL
curl "https://api.telegram.org/bot${TOKEN}/setWebhook?url=https://random-slug.trycloudflare.com/webhook/telegram"
```

**Benefits:**
- Test Telegram/Discord bots locally
- Debug webhook payloads in real-time
- No ngrok bandwidth limits
- Free, no account needed for quick tunnels

**When to use:** Every time you develop webhook handlers.

---

### 2. Named Persistent Tunnel (MEDIUM VALUE)

**Problem:** Quick tunnels get random URLs. Webhook registration needs updating each time.

**Solution:** Named tunnel with stable hostname.

```bash
# One-time setup
cloudflared tunnel login
cloudflared tunnel create one-dev
cloudflared tunnel route dns one-dev dev.one.ie

# Create config
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: one-dev
credentials-file: ~/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: dev.one.ie
    service: http://localhost:4321
  - hostname: dev-api.one.ie
    service: http://localhost:4322
  - service: http_status:404
EOF

# Run (can be a background service)
cloudflared tunnel run one-dev
```

**Benefits:**
- Stable URL: `https://dev.one.ie`
- Register webhook once, works forever
- Multiple services on different subdomains
- CF SSL/DDoS protection on dev

**Cost:** Free (tunnels are free on all CF plans)

---

### 3. Zero Trust Admin Access (HIGH VALUE for security)

**Problem:** Admin dashboards (TypeDB console, internal tools) exposed to internet.

**Solution:** CF Tunnel + Access for authenticated-only access.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ZERO TRUST ADMIN ACCESS                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Admin (you)                                                             │
│      │                                                                   │
│      ▼                                                                   │
│  admin.one.ie ───→ CF Access (email/GitHub auth)                        │
│      │                     │                                             │
│      │                     ▼                                             │
│      │              ┌──────────────┐                                    │
│      │              │ CF Tunnel    │                                    │
│      │              │ (encrypted)  │                                    │
│      │              └──────┬───────┘                                    │
│      │                     │                                             │
│      ▼                     ▼                                             │
│  ┌─────────────────────────────────────────┐                            │
│  │  Private Server (no public IP)          │                            │
│  │                                          │                            │
│  │  localhost:8080 ── Internal dashboard   │                            │
│  │  localhost:3000 ── Monitoring           │                            │
│  │  localhost:9090 ── Prometheus           │                            │
│  │                                          │                            │
│  └─────────────────────────────────────────┘                            │
│                                                                          │
│  Benefits:                                                               │
│  - No public IP on admin server                                         │
│  - Auth before connection (not after)                                   │
│  - Full audit log in CF dashboard                                       │
│  - Revoke access instantly                                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Setup:**
```bash
# 1. Create tunnel
cloudflared tunnel create one-admin

# 2. Route to hostname
cloudflared tunnel route dns one-admin admin.one.ie

# 3. Configure ingress
cat > /etc/cloudflared/config.yml << 'EOF'
tunnel: one-admin
credentials-file: /etc/cloudflared/<tunnel-id>.json

ingress:
  - hostname: admin.one.ie
    service: http://localhost:8080
    originRequest:
      noTLSVerify: true
  - service: http_status:404
EOF

# 4. Install as service
cloudflared service install

# 5. Configure CF Access (in dashboard)
# - Create Access Application for admin.one.ie
# - Add policy: allow if email in [your-email@domain.com]
# - Or: allow if GitHub org member
```

---

### 4. Federation Tunnel (FUTURE VALUE)

**Problem:** Running `legal.one.ie` on private infrastructure but need it accessible from main substrate.

**Solution:** Tunnel exposes federated world without public IP.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  FEDERATED WORLD VIA TUNNEL                                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Main Substrate                      Legal World (private)               │
│  ─────────────                       ────────────────────                │
│                                                                          │
│  one.ie                              legal.one.ie                        │
│     │                                     ▲                              │
│     │  federate('legal', 'https://legal.one.ie', KEY)                   │
│     │                                     │                              │
│     ▼                                     │                              │
│  net.signal({ receiver: 'legal:review' })                               │
│     │                                     │                              │
│     └─────────────────────────────────────┤                              │
│                                           │                              │
│                               ┌───────────┴───────────┐                 │
│                               │     CF Tunnel         │                 │
│                               │  (outbound from VPS)  │                 │
│                               └───────────┬───────────┘                 │
│                                           │                              │
│                               ┌───────────▼───────────┐                 │
│                               │   Legal VPS           │                 │
│                               │   (no public IP)      │                 │
│                               │                       │                 │
│                               │   TypeDB (local)      │                 │
│                               │   Legal agents        │                 │
│                               │   Confidential data   │                 │
│                               └───────────────────────┘                 │
│                                                                          │
│  Benefits:                                                               │
│  - Legal data never on shared infra                                     │
│  - No public ports, no firewall rules                                   │
│  - Main substrate routes signals normally                               │
│  - Encryption in transit (CF tunnel)                                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 5. CI/CD Tunnel (MEDIUM VALUE)

**Problem:** GitHub Actions needs to hit internal API during deploy verification.

**Solution:** Short-lived tunnel from CI.

```yaml
# .github/workflows/deploy.yml
jobs:
  deploy:
    steps:
      - name: Setup Cloudflare Tunnel
        run: |
          # Download cloudflared
          curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
          chmod +x cloudflared
          
          # Start tunnel in background (quick tunnel, no auth needed)
          ./cloudflared tunnel --url http://localhost:4321 &
          TUNNEL_PID=$!
          
          # Wait for tunnel to be ready
          sleep 5
          
          # Run tests against tunnel URL
          TUNNEL_URL=$(./cloudflared tunnel info | grep -o 'https://[^[:space:]]*')
          curl -f $TUNNEL_URL/health
          
          # Cleanup
          kill $TUNNEL_PID
```

---

### 6. Local TypeDB Development Tunnel (SPECIALIZED)

**Problem:** Want to test CF workers against local TypeDB (not cloud).

**Solution:** Tunnel local TypeDB, point gateway to tunnel.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  LOCAL TYPEDB DEV                                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  CF Worker (production)              Your Laptop                         │
│  ──────────────────────              ───────────                         │
│                                                                          │
│  Gateway Worker                      localhost:1729                      │
│      │                                    ▲                              │
│      │  TYPEDB_URL=https://typedb-dev.one.ie                            │
│      │                                    │                              │
│      ▼                                    │                              │
│  fetch('https://typedb-dev.one.ie/v1/query')                            │
│      │                                    │                              │
│      └────────────────────────────────────┤                              │
│                                           │                              │
│                               ┌───────────┴───────────┐                 │
│                               │     CF Tunnel         │                 │
│                               │  typedb-dev.one.ie    │                 │
│                               └───────────┬───────────┘                 │
│                                           │                              │
│                               ┌───────────▼───────────┐                 │
│                               │   TypeDB Server       │                 │
│                               │   (local Docker)      │                 │
│                               └───────────────────────┘                 │
│                                                                          │
│  Use case:                                                               │
│  - Test schema changes before deploying to TypeDB Cloud                 │
│  - Debug query issues with local TypeDB logs                            │
│  - Faster iteration (no network latency to cloud)                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## What Tunnels DON'T Help (Given TypeDB Cloud)

| Scenario | Why Tunnel Doesn't Help |
|----------|------------------------|
| TypeDB Cloud latency | Can't install cloudflared on managed service |
| OpenRouter latency | Public API, no tunnel target |
| Telegram/Discord latency | Public APIs, no tunnel target |
| CF Worker ↔ Worker | Already on same edge, ~0ms |
| KV reads | Already on CF edge, <1ms |

---

## Recommended Implementation Order

| Priority | Tunnel Use Case | Effort | Value |
|----------|----------------|--------|-------|
| 1 | **Dev quick tunnel** | 5 min | High — test webhooks locally |
| 2 | **Named dev tunnel** | 30 min | Medium — stable dev URL |
| 3 | **Zero Trust admin** | 2 hours | High — secure internal tools |
| 4 | **Federation tunnel** | 4 hours | Future — when you run private worlds |
| 5 | **Local TypeDB tunnel** | 1 hour | Specialized — schema development |

---

## Quick Start: Dev Tunnel

```bash
# Install (already done)
brew install cloudflare/cloudflare/cloudflared

# Quick tunnel (random URL, no config)
bun run tunnel
# → https://random-slug.trycloudflare.com

# Named tunnels (stable URLs, configured)
bun run tunnel:local   # → https://local.one.ie → localhost:4321
bun run tunnel:main    # → https://main.one.ie → localhost:4321

# List all tunnels
bun run tunnel:list
```

## Configured Tunnels (as of 2026-04-14)

| Tunnel | Hostname | Purpose | Config |
|--------|----------|---------|--------|
| `one-local` | `local.one.ie` | Personal dev, webhook testing | `~/.cloudflared/one-local.yml` |
| `one-dev` | `dev.one.ie` | Dev branch preview | `~/.cloudflared/one-dev.yml` |
| `one-main` | `main.one.ie` | Main branch (until one.ie migrates) | `~/.cloudflared/one-main.yml` |

**Migration note:** `dev.one.ie` was previously a CNAME to `one-ie.pages.dev`. Now it routes
through a tunnel so you can run the dev branch locally and expose it publicly.

## NPM Scripts

```json
{
  "tunnel": "cloudflared tunnel --url http://localhost:4321",
  "tunnel:local": "cloudflared tunnel --config ~/.cloudflared/one-local.yml run",
  "tunnel:dev": "cloudflared tunnel --config ~/.cloudflared/one-dev.yml run",
  "tunnel:main": "cloudflared tunnel --config ~/.cloudflared/one-main.yml run",
  "tunnel:list": "cloudflared tunnel list"
}
```

## Register Telegram Webhook

```bash
# Start tunnel first
bun run tunnel:local &

# Register webhook to stable URL
curl "https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook?url=https://local.one.ie/webhook/telegram"

# Now Telegram messages → local.one.ie → localhost:4321 → debug locally
```

---

## See Also

- [cloudflare.md](cloudflare.md) — Platform overview
- [deploy.md](deploy.md) — Production deployment
- [PLAN-task-page.md](PLAN-task-page.md) — WebSocket integration (uses same CF infra)
- [Cloudflare Tunnel Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)

---

*Tunnels are free. Use them for dev, admin access, and federation.
TypeDB Cloud stays managed — optimize with caching instead.*
