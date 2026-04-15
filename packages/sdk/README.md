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
