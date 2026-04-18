# Connecting to Agentverse

How to reach any of Fetch.ai Agentverse's 2M+ agents without installing their
SDK, running a Python runtime, or maintaining a bridge process.

**The whole connection is two HTTP hops:** one `fetch()` out, one webhook in.

---

## Skip the SDK

Instead of installing the Python `uagents` package and spinning up a long-polling
runtime, hit the HTTPS endpoint directly:

```ts
await fetch(`https://agentverse.ai/v1/agents/${address}/submit`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.AGENTVERSE_API_KEY}`,
  },
  body: JSON.stringify({ payload: { text: 'Hello' } }),
})
```

That's it. No SDK, no gRPC, no envelope format, no sidecar process. Plain REST
with a Bearer token. Works from any runtime that can call `fetch()` —
Cloudflare Workers, Node, Bun, the browser.

For the reply direction, Agentverse posts back to a webhook URL you expose:

```ts
// POST /api/av/in  { from, to, data }
net.signal({ receiver: to, data }, `av:${from}`)
```

Two stateless hops. That's the connection.

---

## Measured Speed

Hitting `/submit` 20 times in a row from a developer laptop:

| Metric | Latency |
|--------|---------|
| min | 474ms |
| **p50** | **521ms** ← median |
| p95 | 598ms |
| avg | 515ms |

```
Breakdown per call:
  TLS handshake:  ~100ms   (one-time — reused via keepalive)
  TTFB:           ~470ms   ← AV origin processing (floor)
  Response read:   ~50ms   (small JSON)
  ────────────────────
  Total:          ~520ms p50
```

**TTFB is the floor.** ~470ms is Agentverse's origin processing. You cannot
optimize it — it's their backend. The wire is nearly free.

---

## Agentverse Is on Cloudflare

Confirmed via three independent signals:

```
server: cloudflare              ← response header
cf-ray: 9ee04a458e345f6f-SIN    ← CF routing ID (Singapore PoP)
/cdn-cgi/trace responds         ← CF-exclusive diagnostic endpoint
  colo=SIN loc=SG               ← origin region: Singapore
```

This matters: if your code also runs on Cloudflare (Workers, Pages), you're
calling a neighbor over CF's backbone. The CF-to-CF hop adds ~10-50ms over
Argo — negligible compared to AV's ~470ms origin processing.

```toml
# wrangler.toml — pin placement close to AV origin
[placement]
mode = "smart"
```

Smart placement automatically runs your Worker in the PoP closest to AV's
origin. Zero code change.

---

## The Connection, Visualized

```
┌──── your code (CF Worker/Page) ────┐       ┌── Agentverse ──┐
│                                     │       │                │
│  send:   fetch('/v1/agents/..       │──────►│  /submit       │
│          /submit', { body, auth })  │       │  (origin, ~470ms) 
│                                     │       │                │
│  recv:   POST /api/av/in ◄──────────┤───────┤  webhook push  │
│          net.signal(to, data,       │       │                │
│                     'av:' + from)   │       └────────────────┘
│                                     │
└─────────────────────────────────────┘
```

Two directions. Two HTTP calls. No runtime in between.

---

## Speed Up: Make AV Async

The ~520ms floor is fixed at Agentverse's origin. You can't make their
backend faster. But you can stop making users wait for it.

### Synchronous (bad): user blocked on AV

```
user types → POST /api/chat → fetch AV (520ms) → reply
                                   ↑ user stares at spinner for 520ms
```

### Asynchronous (good): user sees their message instantly

```
user types → POST /api/chat → fire-and-forget to AV → "thinking..." (~30ms)
                                     │
                                     ▼
            (~520ms later)     POST /api/av/in ──► WebSocket push ──► UI updates
```

Perceived latency drops from **520ms → ~30ms** for the "sent" step. The real
reply still takes 520ms, but the user isn't blocked on a spinner — they see
their own message instantly, see a "thinking…" placeholder, and the reply
streams in when AV's webhook fires.

The webhook route (`/api/av/in`) + a WebSocket push is the actual cold-start fix.

---

## Extra Levers

Beyond the async flip, these shave further ms:

| Lever | Saves | Cost |
|-------|-------|------|
| **Warm TLS on page load** — fire a HEAD to agentverse.ai on mount | ~100ms first call | 1 line |
| **Smart placement** — run Worker in AV's region (SIN) | 10-80ms | wrangler.toml flag |
| **Race candidates** — `Promise.race()` across 2-3 AV agents | p50 drops | proportional calls |
| **Stream** — if agent supports chunked response, pipe to SSE | Perceived ~50ms | SSE plumbing |

```tsx
// Warm the pipe when the chat page mounts
useEffect(() => {
  fetch('https://agentverse.ai/', { method: 'HEAD' }).catch(() => {})
}, [])
```

---

## Auth

```bash
# .env
AGENTVERSE_API_KEY=          # Bearer token — get at agentverse.ai
AGENTVERSE_API_URL=          # optional override (default: https://agentverse.ai/v1)
AGENTVERSE_WEBHOOK_SECRET=   # optional — X-Agentverse-Secret on /api/av/in
```

No key? The connection simply doesn't initialize. Everything else keeps working.

---

## Why This Is Clever

| Traditional integration | This |
|-------------------------|------|
| Install `uagents` Python package | Nothing to install |
| Run long-poll loop | One `fetch()` call |
| Maintain sidecar process | Serverless — no process |
| Translate JSON-RPC envelopes | Plain JSON POST |
| Custom reconnect/retry logic | Cloudflare's built-in fetch keepalive |
| Separate deploy & health checks | Runs inside your existing code |

One `fetch()` out, one webhook in. ~520ms per call, dominated by Agentverse's
own backend. Neighbor-to-neighbor on Cloudflare's backbone. No new runtime.

---

## See Also

- [agentverse-bridge.md](agentverse-bridge.md) — how this connects to ONE's substrate (send/receive verbs, pheromone, proxy units)
- [speed.md](speed.md) — full latency budget for the ONE stack

**Code:**
- `src/engine/agentverse-connect.ts` — `connectAgentverse(world)`
- `src/pages/api/av/in.ts` — inbound webhook
- `.env.example` — required env vars

---

*Two hops. No runtime. ~520ms per call — and that's the floor, not the ceiling.*
