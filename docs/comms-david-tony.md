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
