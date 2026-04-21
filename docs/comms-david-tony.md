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
- [ ] Wave 1 VCR cassettes — not done. David will implement in a separate session.
  Full spec + pre-written code at docs/TODO-integration-tests.md.
  Handover brief at docs/TODO-vcr-session.md.

**New code shipped (unaudited at time of push):**
Tony shipped a substantial new surface — Universal Wallet (/u/*), ZKLogin,
vault (AES-256-GCM + HKDF), signer abstraction, auth claim flow, auth plugins.
A Round 3 system audit is running against this surface. Results will be appended
to docs/SYSTEM-HEALTH.md.
