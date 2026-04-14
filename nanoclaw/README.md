# NanoClaw

Edge-native AI agents on Cloudflare Workers. Instant Telegram/Discord responses. Zero cold start.

## Live Workers

| Worker | URL | Persona | Auth |
|--------|-----|---------|------|
| nanoclaw | [nanoclaw.oneie.workers.dev](https://nanoclaw.oneie.workers.dev/health) | Default (Gemma 4) | Open |
| donal-claw | [donal-claw.oneie.workers.dev](https://donal-claw.oneie.workers.dev/health) | OO Marketing CMO | API key |

**@onedotbot** on Telegram → `nanoclaw.oneie.workers.dev/webhook/telegram-one`

---

## Quick Start

```bash
# See available personas
bun run scripts/setup-nanoclaw.ts

# Full deploy with Telegram bot
bun run scripts/setup-nanoclaw.ts --name mybot --persona one --token 1234:ABC...
```

One command: generates API key → CF queue → deploy → secrets → webhook → credentials printed.

---

## Local Development with Tunnels

Test webhooks against your local dev server without deploying:

```bash
# Terminal 1: Start dev server
bun run dev

# Terminal 2: Expose localhost via Cloudflare Tunnel
bun run tunnel:local   # → https://local.one.ie

# Register Telegram webhook to your tunnel
curl "https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook?url=https://local.one.ie/webhook/telegram"
```

Now Telegram messages flow: `Telegram → local.one.ie → CF Tunnel → localhost:4321 → your debugger`

### Available Tunnels

| Command | URL | Purpose |
|---------|-----|---------|
| `bun run tunnel` | random-slug.trycloudflare.com | Quick, no config |
| `bun run tunnel:local` | local.one.ie | Personal dev |
| `bun run tunnel:dev` | dev.one.ie | Dev branch preview |
| `bun run tunnel:main` | main.one.ie | Main branch preview |

No ngrok. No bandwidth limits. Free via Cloudflare.

---

## Add a Persona

```typescript
// src/personas.ts
personas['myagent'] = {
  name: 'My Agent',
  description: 'Does X',
  model: 'anthropic/claude-haiku-4-5',
  systemPrompt: `You are...`,
}
```

Then deploy: `bun run scripts/setup-nanoclaw.ts --name myagent --persona myagent`

---

## Routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/health` | GET | Public | Status check |
| `/webhook/:channel` | POST | Public | Telegram/Discord webhooks |
| `/message` | POST | API key* | Send message, get response |
| `/messages/:group` | GET | API key* | Conversation history |
| `/highways` | GET | API key* | Proven substrate paths |

*Auth only required when `API_KEY` secret is set on the worker.

---

## Web API

```bash
# Open worker (no auth)
curl -X POST https://nanoclaw.oneie.workers.dev/message \
  -H "Content-Type: application/json" \
  -d '{"group": "chat", "text": "What is ONE?"}'

# Auth-gated worker
curl -X POST https://donal-claw.oneie.workers.dev/message \
  -H "Authorization: Bearer <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"group": "donal", "text": "SEO audit for example.com"}'
```

---

## Architecture

```
Telegram/Discord webhook
       │
       ▼
  CF Worker (sync processing, ~3s)
       │
       ├── normalize message
       ├── load conversation from D1
       ├── check substrate (toxicity, highways)
       ├── call LLM via OpenRouter
       ├── save to D1
       └── reply to channel
```

No queue latency for webhooks. Queue only used for substrate signals.

---

## Files

```
src/
  personas.ts       # Bot personas (single source of truth)
  workers/router.ts # Hono routes + middleware
  channels/         # Telegram, Discord, Web adapters
  lib/
    substrate.ts    # TypeDB via gateway
    tools.ts        # 7 Claude tools
  types.ts          # Env types

wrangler.toml       # Main instance (open)
wrangler.donal.toml # Donal's CMO (auth required)
```

---

## Secrets

Set with `wrangler secret put`:

| Secret | Required | Description |
|--------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes | LLM calls |
| `TELEGRAM_TOKEN` | Optional | Default bot reply |
| `TELEGRAM_TOKEN_ONE` | Optional | @onedotbot |
| `TELEGRAM_TOKEN_DONAL` | Optional | Multi-bot routing |
| `DISCORD_TOKEN` | Optional | Discord reply |
| `API_KEY` | Optional | Enables auth on non-webhook routes |

---

## See Also

- [docs/nanoclaw.md](../docs/nanoclaw.md) — Full documentation
- [docs/PLAN-tunnels.md](../docs/PLAN-tunnels.md) — Tunnel setup
- [scripts/setup-nanoclaw.ts](../scripts/setup-nanoclaw.ts) — Deployment script
