# David ↔ Tony — Working Log

Running log of handoffs, decisions, and outstanding work between David and Tony.
Append new entries at the bottom. Never edit existing entries.

---

## 2026-04-20 — Test stability + integration test spec

### Done ✅

- [x] Fixed 3 persistently flaky chairman-chain tests — root cause was
      `ceo-classifier.ts` module-level `_override` variable leaking between
      suites; fixed with `resetClassifierForTests()` in `beforeEach`
- [x] Removed those 3 tests from the deploy allowlist in `scripts/deploy.ts`
- [x] Added `src/engine/boot.test.ts` — 25 new tests for the boot pipeline
      (was completely untested): hydration, wiring order, TypeDB failure
      handling, tick start/stop, consecutive failure backoff
- [x] Confirmed `loop.ts` already has 81 tests — no work needed there
- [x] Written `docs/TODO-integration-tests.md` — full integration test spec
      with three options (VCR, Docker TypeDB, smoke tests) and pre-written
      code for all three

### Tony to do ❌

- [ ] Implement Wave 1 (VCR cassettes) from `docs/TODO-integration-tests.md`
      — code is pre-written, one afternoon of work
- [ ] Implement Wave 2 (smoke tests) from same doc — also pre-written, ~1 hour
- [ ] Wave 3 (Docker TypeDB) — discuss with David first, more infrastructure

### Notes

- The existing `src/__tests__/integration/` tests all mock TypeDB — they are
  unit tests in disguise. The VCR work replaces/upgrades the top 5 of these.
- David's starting recommendation is VCR (Option 1). Read the doc top to bottom
  before starting — the Architecture Context section explains why `fetch` to
  `api.one.ie` is the single interception point.

---

## 2026-04-21 — Sign-off audit of Tony's 2026-04-20 push

### David's sign-off ✅

Reviewed Tony's push (47d824b ← 425fa06, 162 files, 12,275 insertions).

**Health findings fixed (from docs/SYSTEM-HEALTH.md):**
- [x] C-3: scope-group / scope-skill added to world.tql — scope enforcement now functional
- [x] C-4: tenant-kek entity added to world.tql — private signal encryption no longer throws
- [x] C-8: /api/query now requires validateApiKey — arbitrary TypeQL no longer public
- [x] C-10: Gateway SSE proxy now validates upstream against allowlist, strips auth headers
- [x] C-12: /api/decay and /api/resistance now require validateApiKey
- [x] H-10: Stale gateway fallback URL fixed — now points to api.one.ie
- [x] C-19/C-20 (partial): Sui Move mark/warn now assert owner — likely sufficient for testnet

**Health findings NOT yet addressed:**
- [ ] H-27: Broadcast secret still compared with `!==` — timing attack remains
- [ ] H-8: process.env still used in ceo-classifier.ts, auth.ts — broken in CF Workers
- [ ] H-11: one.tql has no disclaimer — still claims to be authoritative schema

**VCR cassette work (the original Tony to-do):**
- [x] Wave 1 VCR cassettes — DONE by David 2026-04-21. See entry below.

**New code shipped (unaudited at time of push):**
Tony shipped a substantial new surface — Universal Wallet (/u/*), ZKLogin,
vault (AES-256-GCM + HKDF), signer abstraction, auth claim flow, auth plugins.
A Round 3 system audit is running against this surface. Results will be appended
to docs/SYSTEM-HEALTH.md.

---

## 2026-04-21 — VCR cassettes implemented (Wave 1 done)

### Why VCR? What problem it solves

The existing `src/__tests__/integration/` tests all mock TypeDB. That means they
test our code's logic but never touch the real database. Two real bugs that the
current suite never caught:

1. `POST /api/auth/agent` returned a key (`201 OK`) but the key failed on first
   use — the write hit TypeDB and appeared to succeed, but the read verification
   path was never tested end-to-end.
2. The Astro 6 migration broke `locals.runtime.env` on 18 API routes. Tests
   passed because they imported engine functions directly, never touching the HTTP
   layer.

VCR cassettes fix this by testing against the real system — once.

### How it works

Two modes: **RECORD** and **REPLAY**.

**RECORD mode** (`RECORD=1`): the test runs for real. Every `fetch` call to the
TypeDB gateway passes through to the live database. The cassette helper intercepts
each request and response and saves them to a JSON file on disk — a "cassette".
This is a real round-trip: real TypeQL query, real TypeDB response, real data.

**REPLAY mode** (default, no flag): the test runs from disk. The cassette helper
intercepts the same `fetch` calls but returns the saved response instead of hitting
the network. TypeDB is never contacted. The test runs in ~50ms instead of ~500ms.

```
RECORD (once, against live gateway):
  test → fetch → gateway → TypeDB → response
                    ↓
              cassette.json (saved to disk)

REPLAY (every CI run, no network):
  test → fetch → cassette.json → response
```

The cassette files are committed to the repo. CI replays them. No credentials
needed in CI. No TypeDB access needed. No gateway needed.

### Pros

- **Fast.** Replay runs in ~377ms for all 3 tests. No network round-trips.
- **Real-world.** The cassette was recorded against the actual TypeDB schema and
  real gateway responses. You're not asserting against hand-crafted fake data —
  you're asserting against what TypeDB actually returns.
- **No infrastructure in CI.** No Docker, no staging database, no secrets
  in GitHub Actions. Just the cassette JSON files.
- **Offline.** Works on a plane. Works when TypeDB Cloud is down.
- **Schema-safe.** Each cassette stores a hash of `world.tql`. If you change
  the schema and forget to re-record, the test fails immediately with a clear
  error — not a mysterious wrong-value assertion.

### Cons

- **Cassettes drift when the API changes.** If you add a required field to a
  TypeDB entity, or change a query shape, the cassette is replaying stale
  responses. The schema hash catches `world.tql` changes automatically, but it
  won't catch changes to how a route builds its query. Rule: any time you change
  a query in a tested route, re-record the relevant cassette.
- **Writes don't actually persist.** In replay, the `insert` queries return
  a saved success response but nothing is written to TypeDB. Chained
  write→read tests must be recorded as a unit — the read response in the
  cassette must reflect what the write actually stored (which it does, because
  it was recorded from a real run).
- **Recording requires live credentials.** Someone (David or Tony) needs gateway
  access to re-record. Can't be automated in CI without exposing credentials.
- **Doesn't catch infrastructure problems.** If TypeDB Cloud blocks a new CF
  Workers IP, or the gateway goes down, cassettes will replay fine while
  production fails. That's what the Wave 2 smoke tests are for.

### Done ✅

- [x] Implemented VCR cassette system — `src/__tests__/helpers/cassette.ts`
- [x] Schema hash detection — cassettes store a 12-char SHA-256 of `world.tql`
      at record time; replay throws immediately if schema has changed
- [x] Recorded 3 cassettes against David's gateway (`david-gateway.david-0b1.workers.dev`):
      - `auth-agent-create.json` — 2 interactions (key write + read)
      - `memory-reveal-agent.json` — 3 interactions (unit write + read + nonexistent)
      - `path-roundtrip.json` — 5 interactions (two units + path write + read + nonexistent)
- [x] All 3 tests pass in replay: 6/6, 377ms, zero network, zero credentials
- [x] Updated `docs/TODO-integration-tests.md` — status, cassette format, record command,
      schema staleness section
- [x] Updated `one/testing.md` — added VCR cassette section to Integration / E2E

### What changed in `src/lib/typedb.ts`

Server-side Astro routes now have a direct TypeDB path (bypasses the gateway).
When `TYPEDB_DIRECT_URL` + `TYPEDB_DIRECT_USERNAME` + `TYPEDB_DIRECT_PASSWORD` are
baked at build time, SSR queries go straight to TypeDB Cloud. Browser queries and
vitest (no direct creds) still go through the gateway. This fixes the silent failure
where CF Worker-to-Worker fetch was unreliable.

### What Tony needs to know

**Replay works on your machine with no changes.** Pull, run tests, cassettes play back.

**To re-record** (only needed when `world.tql` changes — the stale error tells you):

```bash
# From the repo root — requires your gateway credentials
TYPEDB_DIRECT_URL="" TYPEDB_DIRECT_USERNAME="" TYPEDB_DIRECT_PASSWORD="" TYPEDB_DIRECT_DATABASE="" \
  GATEWAY_API_KEY="<your-gateway-api-key>" \
  PUBLIC_GATEWAY_URL="https://api.one.ie" \
  RECORD=1 bun vitest run \
    src/__tests__/integration/signal-flow.test.ts \
    src/__tests__/integration/auth-roundtrip.test.ts \
    src/__tests__/integration/memory-reveal.test.ts
```

Non-PUBLIC vars (`GATEWAY_API_KEY`) don't auto-load in vitest — must be set
explicitly in the shell. Setting to `""` overrides `.env` file values (Vite rule:
process env beats .env).

### Outstanding

- [ ] Wave 2 (smoke tests) — still to do, pre-written in `docs/TODO-integration-tests.md`
- [ ] Wave 3 (Docker TypeDB) — discuss with David first
- [ ] H-27: Broadcast secret timing attack — `!==` comparison (from 2026-04-21 audit)
- [ ] H-8: `process.env` in `ceo-classifier.ts`, `auth.ts` — broken in CF Workers
- [ ] H-11: `one.tql` disclaimer missing
