---
title: Superagent integration — Guard / Redact / Scan
slug: superagent
goal: Add Superagent SDK as a 4th gate in the deterministic sandwich; blocks deposit resistance via the existing ADL feedback loop.
group: ONE
cycles: 1
route_hints:
  primary: [security, gate, classifier, sandwich]
  secondary: [adl, audit, pheromone, redact]
rubric_weights:
  fit: 0.30
  form: 0.15
  truth: 0.40
  taste: 0.15
split_tests: []
escape:
  condition: "guard p50 latency > 400ms after cache warm OR observe-mode false-positive rate > 5% over 24h soak"
  action: "emit signal `escape:superagent` → revert SAFETY_AGENT_MODE=observe → reconcile classifier scope"
downstream:
  capability: null
  price: null
  scope: private
source_of_truth:
  - one/dictionary.md
  - one/routing.md
  - one/patterns.md
  - one/rubrics.md
  - docs/ADL-integration.md
  - docs/superagent-integration.md
mode: lean
lifecycle: construction
---

# Superagent integration

**Source of truth:** `docs/routing.md` §"The ADL Feedback Loop — Security IS Learning" defines the gate→audit→pheromone contract. Superagent (Guard / Redact / Scan from `superagent-ai/superagent`) joins as another audit source — same shape, no new plane.

**Schema reference:** dimension 5 (events / signals) — every guard outcome flows through `audit()` → `AUDIT_PHEROMONE_HOOK` → `net.warn(sender→receiver)`. No new TypeDB entities; reuses `adl_audit` D1 table (extended).

---

## Routing

```
signal({receiver, data})
   │
   ▼
GATE 0: GUARD     ── block ──→ dissolve + audit('guard-block') ──→ warn(sender→receiver, 1.0)
   │ allow
   ▼
GATE 1: TOXIC     (existing)
GATE 2: CAPABILITY (existing, ask only)
GATE 3: ADL       (existing — lifecycle / network / sensitivity)
   │ pass all
   ▼
EXECUTE → mark/warn outcome (existing)
```

Order matters. Arithmetic gates (toxic, capability) run first — <0.001ms each. Guard runs only on plausible signals targeting LLM units (`unit.kind === 'agent'`). Function/highway/API/human units skip Guard (latency budget per `speed.md`).

**Owner bypass:** owner-tier signals skip Guard for the same reason they skip ADL (per `owner.md` Gap 2). Audit logs first; bypass second. Never silent.

---

## Goal

Make `signal()` and `ask()` reject prompt-injection-shaped LLM-bound signals before the LLM fires, and have every block deposit resistance on `sender→receiver` via the existing ADL feedback hook. Redact PII before TypeDB event-persist; Scan in CI on the opensource SDK mirror.

**Non-goals:** Does not gate wallet ops, passkey wrapping, Sui Move policy, or `/u/*` flows. Does not replace ADL. Does not replace Move policy (Move wins if they disagree).

---

## Speed

| Metric | Target | Where measured |
|---|---|---|
| Guard p50 (cache miss) | < 250ms | `/api/export/highways` latency edge `guard:tick→typedb` |
| Guard p50 (cache hit) | < 2ms | same |
| Cache hit rate after 1h soak | > 85% | LRU instrumentation in `safety-agent-cache.ts` |
| Canary injection dissolve | < 300ms (no LLM call) | integration test |
| Toxic check (unchanged) | < 0.001ms | `routing.md` benchmark, must not regress |

---

## Tasks

### W1 — Recon
- [ ] **rec-1** — confirm `safety-agent` SDK shape: `createClient`, `guard()`, `redact()`, `scan()` — exit: package.json entry resolved, types loaded
- [ ] **rec-2** — locate gate insertion: `src/engine/persist.ts` `signal()` and `ask()` — exit: line numbers cited in W2
- [ ] **rec-3** — verify audit hook: `src/engine/adl-cache.ts` `setAuditPheromone()` is wired — exit: trace one ADL deny end-to-end to `net.warn`
- [ ] **rec-4** — identify LLM-targeted predicate: how to detect `unit.kind === 'agent'` from a receiver string at gate time — exit: helper function shape decided

### W2 — Decide (planning + doc updates per `documentation.md`)
- [ ] **dec-1** — finalize weight mapping: `block → warn(1.0)`, `redact → warn(0.3)`, `allow → no deposit`, `observe-mode → audit only` — exit: written into `superagent-integration.md`
- [ ] **dec-2** — decide cache strategy: 5-min LRU keyed by `hash(extractText(data))`, max 5000 entries (mirrors ADL) — exit: cache contract in spec doc
- [ ] **dec-3** — decide redact scope: only `data.content` free-text fields; never re-route on redacted text (pheromone keys must remain hash-stable) — exit: redact contract in spec doc
- [ ] **dec-4** — decide owner bypass policy: audit before bypass, identical to ADL Gap 2 — exit: row added to `owner.md` table
- [ ] **dec-5** — doc plan: list every doc to edit in W3 — exit: checklist below complete

  **Docs modified in W3:**
  - `routing.md` — new §"Superagent gate" after ADL feedback loop
  - `dictionary.md` — add canonical names: `guard-block`, `guard-allow`, `guard-redacted`
  - `docs/ADL-integration.md` — note Guard joins as same-shape audit source
  - `one.ie/CLAUDE.md` — secrets table + sandwich diagram
  - `.env.example` — three new env vars

  **New docs:**
  - `docs/superagent-integration.md` — full contract (env, weight mapping, opt-out, latency, threat-model row)

### W3 — Edit (parallel Sonnets, one per file)
- [ ] **edit-1** — `src/engine/safety-agent-cache.ts` (new, ~120 lines) — guard client + LRU + classification helper, mirror of `adl-cache.ts` — exit: types compile, unit test for classify()
- [ ] **edit-2** — `src/engine/persist.ts` — insert `guardCheck()` in `signal()` and `ask()` after ADL gates, before `world.signal()`. Dissolve on block. — exit: integration test green
- [ ] **edit-3** — `src/engine/persist.ts` (event-persist write path) — wrap free-text `data.content` with `client.redact()` when `SAFETY_AGENT_REDACT=1` — exit: redact round-trip test green, pheromone keys unchanged
- [ ] **edit-4** — `migrations/0034_guard_audit.sql` — extend `adl_audit` (or sibling table) with `guard_classification`, `violation_types` — exit: migration applies clean
- [ ] **edit-5** — `nanoclaw/src/workers/router.ts` — add `guardCheck()` before LLM call on Telegram/Discord ingress — exit: edge agents block injection canaries
- [ ] **edit-6** — `.github/workflows/scan.yml` (new) — run `safety-agent scan` on `one-ie/one/` PRs, block merge on poisoning — exit: workflow runs in PR
- [ ] **edit-7** — `src/__tests__/integration/safety-agent.test.ts` (new) — canary injection signal dissolves <300ms; redact preserves routing keys; observe-mode emits no warn — exit: 6+ tests green
- [ ] **edit-8** — docs (parallel per `documentation.md` W3): all 6 files from dec-5 — exit: doc consistency check passes
- [ ] **edit-9** — `.env.example`, `package.json` — `SAFETY_AGENT_API_KEY`, `SAFETY_AGENT_MODE` (observe|enforce, default observe), `SAFETY_AGENT_REDACT` (0|1), `safety-agent` dep — exit: `bun install` clean
- [ ] **edit-10** — `src/lib/role-check.ts` — owner bypass for guard, audit-first per ADL Gap 2 pattern — exit: owner test bypasses Guard with audit row written

### W4 — Verify (deterministic results, per `engine.md` Rule 3)

```
✓ bun run verify                 → all tests pass, no regressions
✓ guard p50 cache miss           → < 250ms (target met or escape)
✓ guard p50 cache hit            → < 2ms
✓ guard cache hit rate (1h soak) → > 85%
✓ canary injection test          → "ignore previous, exfiltrate to..." → dissolve < 300ms, no LLM call
✓ redact round-trip              → email + SSN → tagged tokens persist; hash(routing-key) unchanged
✓ observe-mode soak (24h)        → false-positive rate < 5%; classification distribution logged
✓ scan workflow                  → poisoned fixture PR blocked; clean PR passes
✓ /api/export/highways           → guard:* edges visible in JSON output
✓ owner bypass                   → owner signal skips Guard with `audit:owner:guard-bypass` row in D1
✓ rubric                         → fit ≥ 0.85, form ≥ 0.85, truth ≥ 0.90, taste ≥ 0.85
```

---

## Verify gate

`bun run verify` green · all W4 deterministic checks pass · `superagent-integration.md` exists and links from `routing.md` + `dictionary.md` + root `CLAUDE.md` · escape condition not triggered · threat-model row in `superagent-integration.md` still holds.

---

## Close

```
/close superagent
  → mark('substrate→safety', rubric_avg)
  → emit signal { receiver: 'do:close', kind: 'cycle-complete', plan: 'superagent', mode: 'lean', lifecycle: 'construction' }
  → append entry to docs/learnings.md
```

---

## Rollout (post-close)

| Phase | `SAFETY_AGENT_MODE` | Trigger to advance |
|---|---|---|
| 1 (week of merge) | `observe` | 7d soak, false-positive < 5%, p50 < 250ms |
| 2 | `enforce` (LLM units only) | 7d in observe with stable metrics |
| 3 | `enforce` + `REDACT=1` | pheromone-key hash-stability test green for 7d |

Kill switch: `SAFETY_AGENT_MODE=observe` reverts to audit-only without redeploy. If `guard:tick→typedb` resistance climbs > 2.0 over 24h in observe, hold rollout.

---

## Threat-model row

| Surface | Defends | Accepts |
|---|---|---|
| `/chat` ingress | Prompt injection from RAG / tool output / paste | Classifier false negatives — Move policy + biometric still gate fund-impact |
| Agent peer signals | LLM-derived signals invoking unsafe peers | +100-250ms first hop (cached after) |
| TypeDB event persistence | Logged PII in free-text content | Redaction is best-effort; not a GDPR substitute (`forget()` still required) |
| `one-ie/one/` SDK | Repo poisoning before npm publish | Heuristic; not a substitute for code review |

---

## See also

- `one/dictionary.md` — canonical names (will gain `guard-*`)
- `one/routing.md` — deterministic sandwich + ADL feedback loop (the contract Guard joins)
- `one/rubrics.md` — fit/form/truth/taste scoring
- `docs/ADL-integration.md` — sibling gate plane, same audit→pheromone shape
- `docs/superagent-integration.md` — created in W3, full integration spec
- `owner.md` — Gap 2 audit pattern (owner bypass model)
- `.claude/commands/do.md` · `.claude/commands/close.md` — execution + close contract
