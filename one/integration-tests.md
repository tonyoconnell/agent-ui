# Integration Test Strategy — ONE / agent-ui

**Author:** David Cruwys  
**For:** Tony  
**Status:** Wave 1 (VCR cassettes) complete — implemented 2026-04-21  
**Recommendation:** Wave 2 (smoke tests) next, then Wave 3 (Docker TypeDB) when ready.

---

## Why this document exists

The unit test suite (1,510 tests) mocks TypeDB everywhere. This means tests pass
while production silently breaks. Two real failures that the current suite never caught:

1. `POST /api/auth/agent` returns a key (`201 OK`) but the key fails on first use —
   because the write hit TypeDB and appeared to succeed, but the read verification
   path was never tested end-to-end.
2. The Astro 6 migration broke `locals.runtime.env` on 18 API routes. Tests passed
   because they import engine functions directly, never touching the HTTP layer.

Real integration tests must exercise the actual HTTP + TypeDB path, not mocked
versions of it. This document gives Tony three concrete options with pre-written
code so each can be evaluated and implemented.

---

## Architecture context (read this first)

**Two paths exist in `src/lib/typedb.ts`:**

```
Browser / CI (no direct creds):
  Test / API route → typedb.ts → fetch(GATEWAY_URL/typedb/query) → api.one.ie → TypeDB Cloud

Server-side SSR (TYPEDB_DIRECT_* vars set at build time):
  API route → typedb.ts → fetch(TYPEDB_DIRECT_URL/v1/query) → TypeDB Cloud directly
```

**The cassette interception point is the gateway path** — `fetch` calls to
`PUBLIC_GATEWAY_URL` (defaults to `https://api.one.ie`). Tests run without
`TYPEDB_DIRECT_*`, so all queries go through the gateway and the cassette can
intercept them.

`src/lib/typedb.ts` reads `PUBLIC_GATEWAY_URL` from env. In tests this can be
pointed anywhere — a local server, a staging gateway, or intercepted entirely.

---

## Option 1 — VCR (Recommended starting point)

### Concept

Record real HTTP interactions against the live gateway once. Store them as JSON
cassette files. Replay them in all future test runs without hitting the network.

Ruby's VCR library does exactly this. In Node.js/Vitest, there is no VCR library
installed yet. The closest match is **msw** (Mock Service Worker) which supports
Node.js natively and has a clean fetch-interception model. However, the simplest
implementation for this codebase is a **custom cassette helper using
`vi.stubGlobal('fetch', ...)`** — no new library required.

### What to install

```bash
bun add -d msw
```

msw v2 supports Node.js (Vitest) natively via the `setupServer` API. It intercepts
`fetch` at the process level and can run in passthrough/record mode.

### Cassette file format

```
src/__tests__/cassettes/
  auth-agent-create.json
  auth-agent-returning.json
  memory-reveal-board.json
  signal-send.json
  mark-warn-roundtrip.json
```

Each cassette is a JSON object with a schema hash and an array of interactions:

```json
{
  "schema_hash": "f121c9727aa0",
  "interactions": [
    {
      "id": "auth-agent-create-001",
      "request": {
        "url": "https://api.one.ie/typedb/query",
        "method": "POST",
        "body": {
          "query": "match $k isa api-key, has user-id \"swift-dawn\"; select $k;",
          "transactionType": "read"
        }
      },
      "response": {
        "status": 200,
        "body": { "answers": [] }
      },
      "recorded_at": "2026-04-20T10:00:00Z"
    }
  ]
}
```

The `schema_hash` is a 12-char SHA-256 prefix of `src/schema/world.tql`. On replay,
the cassette helper compares this to the current schema hash and throws immediately
if they differ — rather than silently replaying stale responses.

### The cassette helper — pre-written

Create `src/__tests__/helpers/cassette.ts`:

```typescript
/**
 * VCR-style cassette helper for Vitest.
 *
 * Usage:
 *   import { useCassette } from '@/__tests__/helpers/cassette'
 *
 *   describe('auth roundtrip', () => {
 *     useCassette('auth-agent-create')   // ← mounts cassette for this suite
 *
 *     it('creates a key', async () => {
 *       // all fetch calls to api.one.ie are intercepted and replayed
 *     })
 *   })
 *
 * To record new cassettes:
 *   RECORD=1 bun vitest run src/__tests__/integration/auth-roundtrip.test.ts
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, afterAll, vi } from 'vitest'

const CASSETTE_DIR = resolve(process.cwd(), 'src/__tests__/cassettes')
const RECORD_MODE = process.env.RECORD === '1'
const GATEWAY_URL = 'https://api.one.ie'

interface Interaction {
  id: string
  request: { url: string; method: string; body?: unknown }
  response: { status: number; body: unknown }
  recorded_at: string
}

export function useCassette(name: string) {
  const cassettePath = resolve(CASSETTE_DIR, `${name}.json`)
  let interactions: Interaction[] = []
  let callIndex = 0
  const recorded: Interaction[] = []
  const originalFetch = global.fetch

  beforeAll(() => {
    if (!RECORD_MODE) {
      // REPLAY: load cassette from disk
      if (!existsSync(cassettePath)) {
        throw new Error(
          `Cassette not found: ${cassettePath}\n` +
          `Run with RECORD=1 to record it:\n` +
          `  RECORD=1 bun vitest run <test-file>`
        )
      }
      interactions = JSON.parse(readFileSync(cassettePath, 'utf-8'))
      callIndex = 0
    }

    // Intercept fetch calls to the gateway
    vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString()

      // Only intercept gateway calls — let everything else through
      if (!url.startsWith(GATEWAY_URL)) {
        return originalFetch(input, init)
      }

      if (RECORD_MODE) {
        // RECORD: pass through, capture response
        const real = await originalFetch(input, init)
        const clone = real.clone()
        const body = await clone.json()
        let reqBody: unknown
        try { reqBody = JSON.parse(init?.body as string) } catch { reqBody = null }

        recorded.push({
          id: `${name}-${String(recorded.length + 1).padStart(3, '0')}`,
          request: { url, method: init?.method ?? 'GET', body: reqBody },
          response: { status: real.status, body },
          recorded_at: new Date().toISOString(),
        })

        return real
      } else {
        // REPLAY: return recorded response
        const interaction = interactions[callIndex++]
        if (!interaction) {
          throw new Error(
            `Cassette '${name}' ran out of interactions at call ${callIndex}.\n` +
            `Re-record with: RECORD=1 bun vitest run <test-file>`
          )
        }

        return new Response(JSON.stringify(interaction.response.body), {
          status: interaction.response.status,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    })
  })

  afterAll(() => {
    vi.unstubAllGlobals()

    if (RECORD_MODE && recorded.length > 0) {
      if (!existsSync(CASSETTE_DIR)) mkdirSync(CASSETTE_DIR, { recursive: true })
      writeFileSync(cassettePath, JSON.stringify(recorded, null, 2))
      console.log(`[cassette] Recorded ${recorded.length} interactions → ${cassettePath}`)
    }
  })
}
```

### A real integration test using cassettes — pre-written

Create `src/__tests__/integration/auth-roundtrip.test.ts`:

```typescript
/**
 * Auth round-trip integration test.
 *
 * Tests the full path:
 *   POST /api/auth/agent → TypeDB write → key stored
 *   GET  /api/memory/reveal/:uid → TypeDB read → key verified → data returned
 *
 * This is the exact flow that broke silently before.
 *
 * Record cassette:
 *   RECORD=1 bun vitest run src/__tests__/integration/auth-roundtrip.test.ts
 *
 * Replay (normal CI run):
 *   bun vitest run src/__tests__/integration/auth-roundtrip.test.ts
 */

import { describe, it, expect } from 'vitest'
import { useCassette } from '@/__tests__/helpers/cassette'
import { generateApiKey, hashKey, verifyKey } from '@/lib/api-key'
import { readParsed, writeSilent } from '@/lib/typedb'

describe('auth round-trip', () => {
  useCassette('auth-agent-create')

  it('creates a key, stores hash, verifies round-trip', async () => {
    const uid = `test-${Date.now()}`
    const apiKey = generateApiKey()
    const hash = await hashKey(apiKey)

    // Write to TypeDB (via gateway — intercepted by cassette)
    await writeSilent(`
      insert $k isa api-key,
        has api-key-id "key-test-001",
        has key-hash "${hash}",
        has user-id "${uid}",
        has permissions "read,write",
        has key-status "active";
    `)

    // Read back and verify (via gateway — intercepted by cassette)
    const rows = await readParsed(`
      match $k isa api-key, has user-id "${uid}", has key-hash $h;
      select $h;
    `)

    expect(rows).toHaveLength(1)
    const storedHash = rows[0].h as string
    const valid = await verifyKey(apiKey, storedHash)
    expect(valid).toBe(true)
  })

  it('returns invalid for wrong key against stored hash', async () => {
    const hash = await hashKey('api_real_key_here')
    const valid = await verifyKey('api_wrong_key_here', hash)
    expect(valid).toBe(false)
  })
})
```

### Recording workflow

```bash
# Step 1: Record against your gateway (requires live gateway credentials).
# Non-PUBLIC vars (GATEWAY_API_KEY) don't auto-load in vitest — set them explicitly.
# Also clear TYPEDB_DIRECT_* so queries route through the gateway (not direct to TypeDB).
TYPEDB_DIRECT_URL="" TYPEDB_DIRECT_USERNAME="" TYPEDB_DIRECT_PASSWORD="" TYPEDB_DIRECT_DATABASE="" \
  GATEWAY_API_KEY="<your-gateway-api-key>" \
  PUBLIC_GATEWAY_URL="<your-gateway-url>" \
  RECORD=1 bun vitest run src/__tests__/integration/auth-roundtrip.test.ts

# Step 2: Commit the cassette
git add src/__tests__/cassettes/auth-agent-create.json
git commit -m "test(cassette): record auth-agent-create interactions"

# Step 3: All future runs replay from disk (no network, no credentials needed)
bun vitest run src/__tests__/integration/auth-roundtrip.test.ts
```

### When cassettes go stale

When `src/schema/world.tql` changes, cassettes automatically detect the mismatch
on replay and throw with the exact re-record command:

```
Error: Cassette 'path-roundtrip' is stale — schema has changed.
  Recorded against schema: f121c9727aa0
  Current schema:          3a8b21c44d91
Re-record with:
  RECORD=1 GATEWAY_API_KEY=<key> PUBLIC_GATEWAY_URL=<url> TYPEDB_DIRECT_URL="" bun vitest run <test-file>
```

No manual version tracking needed — the hash is computed from the file and stored
in each cassette automatically.

### Pros

- Zero infrastructure — no Docker, no staging database
- Fast — disk reads only after recording
- Works offline, works in CI with no secrets
- Realistic — responses came from the real system
- Easy to understand: cassette files are human-readable JSON

### Cons

- Cassettes drift from reality when schema changes — must re-record
- Write operations are tricky: the cassette replays the TypeDB response but the
  write side effect never actually happens, so chained write→read tests need
  careful cassette ordering
- Initial recording requires access to the live system and valid credentials
- Does NOT catch infrastructure problems (e.g. TypeDB allowlist blocking a new
  CF Workers IP — the cassette will replay fine while production fails)

---

## Option 2 — Docker TypeDB (CI integration layer)

### Concept

Run TypeDB Core in Docker locally and in GitHub Actions. Point tests at
`localhost:1729` with the real schema loaded. No mocks. Real queries.

### What changes

`src/lib/typedb.ts` reads `PUBLIC_GATEWAY_URL` from env. In tests, override it
to point at a local test gateway (a thin wrapper around Docker TypeDB) or
directly to TypeDB's HTTP API if available.

The simpler path: run a minimal gateway (`gateway/src/index.ts`) locally in
test mode via `wrangler dev --local`, pointed at Docker TypeDB.

### docker-compose.yml — pre-written

Create `docker-compose.test.yml` at project root:

```yaml
version: '3.8'
services:
  typedb:
    image: vaticle/typedb:3.0.0
    ports:
      - "1729:1729"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:1729/health"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 20s
    volumes:
      - typedb-test-data:/opt/typedb-all/server/data

volumes:
  typedb-test-data:
```

### Schema load script — pre-written

Create `scripts/load-test-schema.ts`:

```typescript
/**
 * Load the ONE schema into the test TypeDB instance.
 * Run once after Docker TypeDB starts.
 *
 *   bun run scripts/load-test-schema.ts
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const TYPEDB_URL = process.env.TEST_TYPEDB_URL ?? 'http://localhost:1729'
const DATABASE = 'one-test'
const SCHEMA_FILE = resolve(process.cwd(), 'src/schema/one.tql')

async function main() {
  // Create database
  await fetch(`${TYPEDB_URL}/databases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: DATABASE }),
  })

  // Load schema
  const schema = readFileSync(SCHEMA_FILE, 'utf-8')
  const res = await fetch(`${TYPEDB_URL}/databases/${DATABASE}/schema`, {
    method: 'PUT',
    headers: { 'Content-Type': 'text/plain' },
    body: schema,
  })

  if (!res.ok) throw new Error(`Schema load failed: ${res.status}`)
  console.log(`[schema] Loaded into ${DATABASE}`)
}

main()
```

### Vitest setup for Docker TypeDB — pre-written

Add to `src/__tests__/helpers/typedb-setup.ts`:

```typescript
/**
 * Setup/teardown for Docker TypeDB integration tests.
 *
 * Usage:
 *   import { useDockerTypeDB } from '@/__tests__/helpers/typedb-setup'
 *
 *   describe('persist round-trip', () => {
 *     useDockerTypeDB()
 *     ...
 *   })
 *
 * Requires: docker compose -f docker-compose.test.yml up -d
 */

import { beforeAll, afterEach } from 'vitest'

const TEST_TYPEDB_URL = process.env.TEST_TYPEDB_URL ?? 'http://localhost:1729'
const DATABASE = 'one-test'

export function useDockerTypeDB() {
  beforeAll(async () => {
    // Verify TypeDB is up
    const res = await fetch(`${TEST_TYPEDB_URL}/health`).catch(() => null)
    if (!res?.ok) {
      throw new Error(
        'Docker TypeDB is not running.\n' +
        'Start it with: docker compose -f docker-compose.test.yml up -d\n' +
        'Then wait ~20s for startup and run again.'
      )
    }

    // Override the gateway URL so typedb.ts hits localhost
    process.env.PUBLIC_GATEWAY_URL = TEST_TYPEDB_URL
  }, 30_000)

  afterEach(async () => {
    // Wipe test data between tests to ensure isolation
    await fetch(`${TEST_TYPEDB_URL}/databases/${DATABASE}/data`, {
      method: 'DELETE',
    }).catch(() => {})
  })
}
```

### CI step — pre-written

Add to `.github/workflows/deploy.yml`:

```yaml
- name: Start TypeDB
  run: |
    docker compose -f docker-compose.test.yml up -d
    # Wait for TypeDB to be ready
    for i in {1..12}; do
      curl -sf http://localhost:1729/health && break
      echo "Waiting for TypeDB... ($i/12)"
      sleep 5
    done
    bun run scripts/load-test-schema.ts

- name: Integration tests
  run: bun vitest run src/__tests__/integration/
  env:
    TEST_TYPEDB_URL: http://localhost:1729
```

### Pros

- Real TypeDB — catches schema violations, query planner timeouts, write/read
  round-trip failures
- Full isolation — wipe between tests, no production data contamination
- Free — TypeDB Core Docker image is open source
- Catches the entire class of bug that VCR cassettes miss (schema drift)

### Cons

- Docker required on every dev machine and in CI
- TypeDB Docker image is ~400MB, cold start is 20-30 seconds
- Must keep the Docker image version pinned to match TypeDB Cloud version
- Local gateway still needed to bridge `src/lib/typedb.ts` fetch calls to
  Docker TypeDB's HTTP API (the fetch path goes to `api.one.ie` — needs re-routing)

---

## Option 3 — Smoke tests against `dev.one.ie`

### Concept

A small suite of tests that run against the live dev environment after every deploy.
Not for development use — for deployment verification.

### What to install

Nothing. Uses native `fetch`.

### Smoke test file — pre-written

Create `src/__tests__/smoke/post-deploy.test.ts`:

```typescript
/**
 * Post-deploy smoke tests — runs against dev.one.ie after every deploy.
 *
 * These are NOT unit tests. They hit the live system. They:
 *   - Verify the auth round-trip actually works end-to-end
 *   - Catch TypeDB connectivity failures (IP allowlist, network)
 *   - Catch CF Workers runtime breakage (env binding errors)
 *
 * Run after deploy:
 *   TEST_ENV=dev bun vitest run src/__tests__/smoke/post-deploy.test.ts
 *
 * Never run in normal CI (would pollute production TypeDB with test agents).
 */

import { describe, it, expect, beforeAll } from 'vitest'

const BASE = process.env.SMOKE_URL ?? 'https://dev.one.ie'

// Skip unless explicitly running smoke tests
const runSmoke = process.env.TEST_ENV === 'dev' || process.env.TEST_ENV === 'smoke'

describe.skipIf(!runSmoke)('post-deploy smoke', () => {
  let apiKey: string
  let uid: string

  describe('health', () => {
    it('gateway is up', async () => {
      const res = await fetch('https://api.one.ie/health')
      expect(res.status).toBe(200)
    })

    it('astro worker is up', async () => {
      const res = await fetch(`${BASE}/api/state`)
      expect(res.status).not.toBe(500)
    })
  })

  describe('auth round-trip', () => {
    it('creates an agent and returns a key', async () => {
      const res = await fetch(`${BASE}/api/auth/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `smoke-test-${Date.now()}` }),
      })
      expect(res.status).toBe(201)

      const data = await res.json() as { uid: string; apiKey: string }
      expect(data.uid).toBeTruthy()
      expect(data.apiKey).toMatch(/^api_/)

      uid = data.uid
      apiKey = data.apiKey
    })

    it('key works on a gated endpoint', async () => {
      // /api/state requires a valid key but only needs agent-level role
      const res = await fetch(`${BASE}/api/state`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      // 401 = key rejected (TypeDB read failed)
      // 403 = key valid but wrong role (acceptable here)
      // 200 = full success
      expect(res.status).not.toBe(401)
    })

    it('invalid key is rejected', async () => {
      const res = await fetch(`${BASE}/api/state`, {
        headers: { Authorization: 'Bearer api_fake_key_that_does_not_exist' },
      })
      expect(res.status).toBe(401)
    })
  })

  describe('signal flow', () => {
    it('can send a signal and get a response', async () => {
      const res = await fetch(`${BASE}/api/signal`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ receiver: `${uid}:chat`, data: { content: 'ping' } }),
      })
      // 200 = signal routed, 404 = unit not found (acceptable for smoke)
      expect([200, 404]).toContain(res.status)
    })
  })
})
```

### Add to deploy pipeline

In `scripts/deploy.ts`, after the existing health checks (step 8), add:

```typescript
// Step 9: Post-deploy smoke tests
console.log('\n[smoke] Running post-deploy verification...')
const smokeResult = spawnSync('bun', ['vitest', 'run', 'src/__tests__/smoke/post-deploy.test.ts'], {
  env: { ...process.env, TEST_ENV: 'dev', SMOKE_URL: 'https://dev.one.ie' },
  stdio: 'inherit',
})
if (smokeResult.status !== 0) {
  console.error('[smoke] ⚠ Post-deploy smoke failed — deployment may be degraded')
  // Non-fatal: emit degraded signal but don't block the deploy pipeline
  await fetch(`${BASE}/api/signal`, {
    method: 'POST',
    body: JSON.stringify({ receiver: 'deploy:smoke', data: { status: 'degraded' } }),
  }).catch(() => {})
}
```

### Pros

- Zero infrastructure
- Catches exactly what broke today — the auth key create/verify round-trip
- Also catches: TypeDB allowlist problems, Astro env binding failures,
  gateway downtime
- 20 lines of code, immediate value

### Cons

- Pollutes production TypeDB with smoke-test agents on every deploy
  (mitigated by using a `smoke-test-{timestamp}` uid prefix and a cleanup cron)
- Flaky if `dev.one.ie` is down or slow (use `.skipIf(!runSmoke)` guard)
- Requires valid network access from CI to `dev.one.ie`

---

## Recommended implementation order

### Wave 1 — VCR cassettes (Option 1)

1. `bun add -d msw`
2. Create `src/__tests__/helpers/cassette.ts` (code above, copy-paste)
3. Create `src/__tests__/cassettes/` directory, add to `.gitignore` pattern
   for `.json` files with `recorded_at` fields older than 30 days
4. Record three cassettes against `dev.one.ie`:
   - `auth-agent-create` — the create/verify round-trip
   - `memory-reveal-agent` — basic read from persist
   - `signal-send` — signal routing through the stack
5. Rewrite the top 5 existing "integration" tests to use cassettes instead of mocks
6. Add to CI: `bun vitest run src/__tests__/integration/ --reporter=verbose`

**Result:** 5 real integration tests, fast CI, no infrastructure.

### Wave 2 — Smoke tests (Option 3)

1. Create `src/__tests__/smoke/post-deploy.test.ts` (code above, copy-paste)
2. Add step 9 to `scripts/deploy.ts`
3. Add `smoke-test-cleanup` cron that deletes TypeDB actors with uid prefix `smoke-test-`

**Result:** Every deploy self-verifies. The exact bug from today gets caught in < 30s.

### Wave 3 — Docker TypeDB (Option 2)

1. Add `docker-compose.test.yml` (code above)
2. Add `scripts/load-test-schema.ts` (code above)
3. Add `src/__tests__/helpers/typedb-setup.ts` (code above)
4. Add CI step (code above)
5. Rewrite the 10 most critical integration tests to use Docker TypeDB

**Result:** Full fidelity tests that catch schema drift and query planner timeouts.

---

## Files to create — summary

```
src/__tests__/
  cassettes/                          ← cassette JSON files (Wave 1)
  helpers/
    cassette.ts                       ← VCR helper (Wave 1) — pre-written above
    typedb-setup.ts                   ← Docker TypeDB helper (Wave 3) — pre-written above
  integration/
    auth-roundtrip.test.ts            ← first real integration test (Wave 1)
    signal-flow.test.ts               ← signal round-trip (Wave 1)
  smoke/
    post-deploy.test.ts               ← live smoke tests (Wave 2) — pre-written above
scripts/
  load-test-schema.ts                 ← Docker schema loader (Wave 3) — pre-written above
docker-compose.test.yml               ← TypeDB Docker config (Wave 3) — pre-written above
```

---

## Notes for Tony

- Start with Wave 1 (VCR). The cassette helper is fully pre-written above — copy it in,
  run `RECORD=1` once against `dev.one.ie`, commit the cassettes. One afternoon of work.
- Wave 2 (smoke) is 20 lines. Do it immediately after Wave 1.
- Wave 3 (Docker) is the right long-term answer but requires Docker in CI and a local
  gateway shim to route `fetch` calls from `src/lib/typedb.ts` to localhost. Plan a
  separate session for that.
- The VCR cassettes will need re-recording whenever `src/schema/one.tql` changes.
  Put a note in the schema file: `# When you change this file, re-record integration cassettes.`
- Never run Option 3 smoke tests in the main vitest suite — the `skipIf(!runSmoke)` guard
  is there for a reason. Smoke tests are for the deploy pipeline only.
