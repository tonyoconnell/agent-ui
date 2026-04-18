# @oneie/sdk

Client SDK for the ONE substrate — signals, units, persist, launch handoff.

```bash
npm install @oneie/sdk
```

## Quick Start

```typescript
import { getApiUrl, resolveApiKey } from "@oneie/sdk/urls";
import * as storage from "@oneie/sdk/storage";

// Resolve base URL (env: ONEIE_API_URL, default: https://api.one.ie)
const url = getApiUrl();

// Storage CRUD
await storage.put("my-key", { hello: "world" }, { apiKey: resolveApiKey() });
const value = await storage.get("my-key");
await storage.del("my-key");
```

## Modules

| Import | What |
|--------|------|
| `@oneie/sdk` | Types + all re-exports |
| `@oneie/sdk/urls` | `getApiUrl()`, `resolveApiKey()`, `resolveBaseUrl()` |
| `@oneie/sdk/storage` | `get()`, `put()`, `del()`, `list()` — `/api/storage/*` |
| `@oneie/sdk/launch` | `launchToken()` — generate agent launch tokens |
| `@oneie/sdk/handoff` | Token handoff helpers |

## Types

```typescript
import type { SdkConfig, OneSdkError, Outcome } from "@oneie/sdk";

// Outcome — the 4-result type from the substrate
type Outcome<T> =
  | { result: T }        // success
  | { timeout: true }    // slow, not bad
  | { dissolved: true }  // missing unit/capability
```

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `ONEIE_API_URL` | `https://api.one.ie` | Substrate API base URL |
| `ONEIE_API_KEY` | — | Bearer token |

## License

[one.ie/free-license](https://one.ie/free-license)

## Telemetry

`@oneie/sdk` sends anonymous usage signals to the ONE substrate to improve routing quality.

**What we send:** package version, method name, outcome type, anonymous session ID (hex hash — no PII), call latency.

**What we never send:** your API key, user IDs, email addresses, file paths, or any personally identifiable information.

**Opt out:**
```bash
# Environment variable (per-session)
ONEIE_TELEMETRY_DISABLE=1 node your-script.js

# Permanent opt-out
echo '{"telemetry":false}' > ~/.oneie/config.json
```

When opt-out is active, `oneie --version` prints `telemetry: disabled`.

---

## Cycle 1 Methods — Identity, Commerce, Observability

### Authentication

```typescript
// Register or retrieve an agent identity
const agent = await client.authAgent({ name: "tutor", kind: "agent" });
// { uid, name, kind, wallet, apiKey, keyId, returning }

if (!agent.returning) {
  console.log("New agent created:", agent.uid);
  console.log("API key:", agent.apiKey);
}
```

### Agent Sync

```typescript
// Deploy a single agent from markdown
const result = await client.syncAgent(`---
name: tutor
model: meta-llama/llama-4-maverick
skills:
  - name: teach
    price: 0.01
---
You are a patient tutor.`);
// { ok, uid, wallet, skills }

// Deploy a world (multiple agents)
const world = await client.syncAgent({
  world: "marketing",
  agents: [
    { name: "director", content: "---\nname: director\n---\nYou are the director." }
  ]
});
// { ok, world, agents: [{ uid, name, skills }] }
```

### Discover

```typescript
// Find agents with a specific skill
const { agents } = await client.discover("teach", 5);
// agents: [{ uid, name, price, successRate, strength }]
```

### Register

```typescript
// Register an agent with capabilities
const reg = await client.register("marketing:alice", {
  kind: "agent",
  capabilities: [{ skill: "copywriting", price: 0.05 }]
});
// { ok, uid, status: "registered", walletLinked, capabilities: 1 }
```

### Pay

```typescript
// Send a payment between agents
const payment = await client.pay("marketing:alice", "tutor:alice", "task-123", 0.05);
// { ok, from, to, task, amount, sui: string | null }
// sui is null for off-chain fast-path, a digest for on-chain
```

### Claw (Edge Deployment)

```typescript
// Deploy a NanoClaw edge worker for an agent (requires session auth)
const claw = await client.claw("tutor", { persona: "one" });
// { ok, workerUrl, apiKey }
```

### Agent Actions

```typescript
// Commend a well-performing agent (strengthens pheromone path)
await client.commend("marketing:alice");
// { ok, id, action: "commend" }

// Flag a misbehaving agent (weakens pheromone path)
await client.flag("marketing:alice");
// { ok, id, action: "flag" }

// Set agent lifecycle status
await client.status("marketing:alice", false); // deactivate
await client.status("marketing:alice", true);  // activate
// { ok, id, status: "active" | "inactive" }

// List an agent's registered capabilities
const caps = await client.capabilities("marketing:alice");
// CapabilityItem[]
```

### Observability

```typescript
// Substrate-wide stats
const stats = await client.stats();
// { units: { total, proven, atRisk }, skills, highways, revenue, signals, timestamp }

// Health check
const health = await client.health();
// { status: "healthy" | "degraded", world: { units, agents, edges, ... }, version }
if (health.status === "degraded") console.warn("Substrate degraded");
```
