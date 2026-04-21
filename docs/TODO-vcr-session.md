# Session Brief — Implement VCR Integration Tests

**For:** David (self-implementation session)
**Status:** Ready to execute — all code pre-written
**Estimated work:** ~1 hour (mostly copy-paste + one live recording run)
**Spec:** `docs/TODO-integration-tests.md` — read this first, everything is pre-written there

---

## Context

Tony was asked to implement VCR cassette integration tests from `docs/TODO-integration-tests.md`
but built the Universal Wallet surface instead. The spec is complete and the code is pre-written.
This session implements Wave 1 (VCR) and Wave 2 (smoke tests) ourselves.

The existing `src/__tests__/integration/` tests all mock TypeDB — they are unit tests in
disguise. Real integration tests must exercise the actual HTTP + TypeDB path. VCR cassettes
are the lowest-friction way to get there: record once against the live gateway, replay forever.

**The single interception point:** everything goes through `fetch` to `api.one.ie/typedb/query`.
`src/lib/typedb.ts` reads `PUBLIC_GATEWAY_URL` from env — point it anywhere in tests.

---

## What to build

### Wave 1 — VCR cassettes

**Step 1: Install msw**
```bash
bun add -d msw
```

**Step 2: Create the cassette helper**
Copy the pre-written `cassette.ts` from `docs/TODO-integration-tests.md` (Option 1 section)
into `src/__tests__/helpers/cassette.ts`. It is 100% ready — no edits needed.

**Step 3: Create the cassettes directory**
```bash
mkdir -p src/__tests__/cassettes
```

Add to `.gitignore` if cassettes should not be committed (they should be committed — they
are the source of truth for replay). No .gitignore change needed by default.

**Step 4: Create the first integration test**
Copy the pre-written `auth-roundtrip.test.ts` from the same doc into
`src/__tests__/integration/auth-roundtrip.test.ts`. Ready to use as-is.

**Step 5: Record the cassette**
```bash
# Requires: bun run dev is running OR dev.one.ie is accessible
# Requires: valid .env with PUBLIC_GATEWAY_URL=https://api.one.ie

RECORD=1 bun vitest run src/__tests__/integration/auth-roundtrip.test.ts
```

This hits the live gateway once, writes `src/__tests__/cassettes/auth-agent-create.json`.

**Step 6: Verify replay works**
```bash
bun vitest run src/__tests__/integration/auth-roundtrip.test.ts
# Should pass without any network calls
```

**Step 7: Record two more cassettes**
Create these two additional test files (write them fresh — 20-30 lines each):

- `src/__tests__/integration/signal-flow.test.ts` — cassette: `signal-send`
  Tests: send a signal via `POST /api/signal`, verify pheromone edge exists after
  
- `src/__tests__/integration/memory-reveal.test.ts` — cassette: `memory-reveal-agent`
  Tests: `GET /api/memory/reveal/:uid` returns actor + hypotheses + highways

Record each with `RECORD=1 bun vitest run <file>`.

**Step 8: Add to CI**
In `vitest.config.ts` or `package.json`, ensure integration tests run in CI:
```bash
bun vitest run src/__tests__/integration/
```
This already runs as part of `bun run verify` — nothing to change.

---

### Wave 2 — Smoke tests

**Step 1: Create smoke test file**
Copy the pre-written `post-deploy.test.ts` from `docs/TODO-integration-tests.md` (Option 3 section)
into `src/__tests__/smoke/post-deploy.test.ts`. Ready to use as-is.

**Step 2: Hook into deploy pipeline**
Add the Step 9 snippet from the same doc to `scripts/deploy.ts` after the existing
health checks (around line 350+, after the `[health]` step).

**Step 3: Verify smoke guard works**
```bash
# Should skip (no TEST_ENV set)
bun vitest run src/__tests__/smoke/post-deploy.test.ts

# Should run against live system
TEST_ENV=dev bun vitest run src/__tests__/smoke/post-deploy.test.ts
```

---

## Files to create — full list

```
bun add -d msw                                    ← package change

src/__tests__/
  helpers/
    cassette.ts                                   ← copy from TODO-integration-tests.md
  cassettes/
    auth-agent-create.json                        ← auto-generated on RECORD=1
    signal-send.json                              ← auto-generated on RECORD=1
    memory-reveal-agent.json                      ← auto-generated on RECORD=1
  integration/
    auth-roundtrip.test.ts                        ← copy from TODO-integration-tests.md
    signal-flow.test.ts                           ← write fresh (~25 lines)
    memory-reveal.test.ts                         ← write fresh (~25 lines)
  smoke/
    post-deploy.test.ts                           ← copy from TODO-integration-tests.md

scripts/deploy.ts                                 ← add Step 9 smoke hook (~15 lines)
```

---

## Key facts for the session

- **No new library needed for smoke tests** — native fetch only
- **msw is only needed for the cassette helper** — if you want to skip msw, the
  cassette helper can be rewritten using `vi.stubGlobal('fetch', ...)` directly
  (the doc shows this approach in the cassette helper itself — msw is optional)
- **cassette.ts works without msw** — it uses `vi.stubGlobal` internally, not msw
  (re-read the pre-written code — `bun add -d msw` is only needed if you want the
  msw server API for more complex scenarios)
- **Cassettes go stale when schema changes** — add a comment in each test file:
  `// Cassette recorded: 2026-04-21 · schema: world.tql (post-KEK-fix)`
- **Recording requires live gateway access** — `dev.one.ie` must be up, or run
  `bun run dev` locally with a valid TypeDB connection

---

## What success looks like

```
bun vitest run src/__tests__/integration/
✓ auth round-trip › creates a key, stores hash, verifies round-trip
✓ auth round-trip › returns invalid for wrong key against stored hash
✓ signal flow › can send a signal and get 200 or 404
✓ memory reveal › returns actor with uid
(all passing, no network calls, < 500ms total)

TEST_ENV=dev bun vitest run src/__tests__/smoke/post-deploy.test.ts
✓ health › gateway is up
✓ health › astro worker is up
✓ auth round-trip › creates an agent and returns a key
✓ auth round-trip › key works on a gated endpoint
✓ auth round-trip › invalid key is rejected
✓ signal flow › can send a signal and get a response
(all passing, hitting live dev.one.ie)
```

---

## Why this matters

The two bugs that prompted this work:
1. `POST /api/auth/agent` returned 201 but the key failed on first use — because the
   write→read round-trip was never tested end-to-end.
2. The Astro 6 migration broke `locals.runtime.env` on 18 API routes. Tests passed
   because they imported engine functions directly, never touching the HTTP layer.

VCR cassettes catch both. Smoke tests catch both in production after every deploy.
