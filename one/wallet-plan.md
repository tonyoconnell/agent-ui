---
title: Wallet build — passkey PRF lifecycle on /u
slug: wallet-passkey-build
goal: Ship the 5-state wallet lifecycle from passkeys.md on /u; delete zkLogin/Enoki; wire sponsored tx. Team infra (dotenvx) in parallel.
group: ONE
mode: lean
lifecycle: construction
classifier:
  spec_locked: yes      # passkeys.md §lifecycle, wallet.md §Phases, secrets.md
  variance_known: yes   # one shape: Ed25519 seed + passkey PRF wrap + largeBlob + BIP39
  exit_scalar: yes      # each deliverable has pass/fail checks
  files_known: yes      # wallet.md §Map to existing code names specific paths
  result: 4/4 yes → lean
source_of_truth:
  - /Users/toc/Server/passkeys.md
  - /Users/toc/Server/wallet.md
  - /Users/toc/Server/secrets.md
  - /Users/toc/Server/agents.md
---

# Wallet build plan — passkey PRF on /u

**One doc, 12 lean deliverables, 4 spawn batches.** Every deliverable cites its spec slice and has a scalar exit.

> Wallet architecture is `passkeys.md`. This plan is the *execution* — which files, which spawn batch, which verify gate. If a prior trips mid-build, **stop**, emit `spec-change`, reconcile `passkeys.md` / `wallet.md`, resume. No silent drift.

---

## Four batches, gated

```
Batch A (5 primitives, parallel)  ─► verify
     │
     ▼
Batch B (3 user surfaces, sequential)  ─► verify per surface
     │
     ▼
Batch C (3 integration, sequential)  ─► verify per piece
     │
(Batch D runs parallel with B/C — team infra, no dependency)
```

**Parallel with A/B/C:** Batch D (dotenvx wiring) — no dependency on wallet code; can spawn alongside anything.

---

## Batch A — primitives (5 files, parallel spawn)

All pure, all unit-testable. No cross-dependencies. Five Sonnets, five files, parallel.

### A.1 · `crypto-rng` — seed generation + secure compare
- **goal:** typed wrappers over `crypto.getRandomValues(32)` and `crypto.subtle.timingSafeEqual`
- **speed:** <1ms per call, measured in unit tests
- **tasks:**
  - [ ] `src/components/u/lib/crypto/rng.ts` — `getSeed32(): Uint8Array`, `secureCompare(a, b): boolean`
  - [ ] `src/components/u/lib/crypto/rng.test.ts` — statistical smoke test (entropy ≥ 7.9 bits/byte over 10K calls)
- **verify gate:** `bun run verify` · unit tests green · `rng.ts` is ≤ 40 LOC
- **close:** `/close --surface wallet-primitive-rng`
- **spec:** `passkeys.md` §State 1

### A.2 · `crypto-ed25519` — seed → keypair → Sui address
- **goal:** deterministic Ed25519 derivation using `@mysten/sui/keypairs/ed25519`; `toSuiAddress()` returns the canonical address
- **speed:** <5ms per derive
- **tasks:**
  - [ ] `src/components/u/lib/crypto/ed25519.ts` — `seedToKeypair(seed)`, `keypairToAddress(kp)`, `seedToAddress(seed)` convenience
  - [ ] `src/components/u/lib/crypto/ed25519.test.ts` — fixed-seed test vectors (same seed → same address always)
- **verify gate:** `bun run verify` · round-trip test passes · no key bytes logged/thrown
- **close:** `/close --surface wallet-primitive-ed25519`
- **spec:** `passkeys.md` §State 1, `wallet.md` §Phase 1

### A.3 · `crypto-bip39` — seed ↔ 12-word mnemonic
- **goal:** thin wrapper over `@scure/bip39` + `@scure/bip39/wordlists/english` for entropy-to-mnemonic round-trip
- **speed:** <10ms per conversion
- **tasks:**
  - [ ] `src/components/u/lib/crypto/bip39.ts` — `seedToMnemonic(seed)`, `mnemonicToSeed(words)`, `validateMnemonic(words)`
  - [ ] `src/components/u/lib/crypto/bip39.test.ts` — BIP39 test vectors + malformed input rejected
- **verify gate:** `bun run verify` · passes the official BIP39 test vector file
- **close:** `/close --surface wallet-primitive-bip39`
- **spec:** `passkeys.md` §State 2

### A.4 · `crypto-passkey` — WebAuthn create/get with PRF + largeBlob
- **goal:** the WebAuthn bindings; `enrollPasskey()`, `getPasskey()`, `unwrapViaPasskey(prfOut, ciphertext)`
- **speed:** browser-gated (Touch ID is what it is); unwrap-after-PRF <50ms
- **tasks:**
  - [ ] `src/components/u/lib/crypto/passkey.ts` — create/get with `prf` + `largeBlob` extensions; HKDF-SHA256 + AES-256-GCM wrap/unwrap
  - [ ] `src/components/u/lib/crypto/passkey.test.ts` — mock `navigator.credentials` for unit-level; manual browser smoke test documented inline
  - [ ] Document PRF salt constant: `"one.ie-wallet-v1"`
- **verify gate:** `bun run verify` · constants match `passkeys.md` §Envelope encryption · no plaintext seed persists in test vectors
- **close:** `/close --surface wallet-primitive-passkey`
- **spec:** `passkeys.md` §Envelope encryption + §Passkey's role

### A.5 · `wallet-store` — versioned IndexedDB
- **goal:** typed accessor over `idb-keyval` for the `wallet` record; forward-compatible schema (`version: 1`)
- **speed:** <5ms read/write
- **tasks:**
  - [ ] `src/components/u/lib/wallet-store.ts` — `readWallet()`, `writeWallet(w)`, `migrateV0toV1()`; schema type matches `passkeys.md` §State 2 example
  - [ ] `src/components/u/lib/wallet-store.test.ts` — write/read round-trip + migration stub
- **verify gate:** `bun run verify` · schema shape matches spec literally · no plaintext_seed persisted after State 2
- **close:** `/close --surface wallet-primitive-store`
- **spec:** `passkeys.md` §State 1-2

**Batch A close criteria (all five):** unit suite green, total LOC ≤ 350, no primitive imports from another primitive except through explicit types.

---

## Batch B — user surfaces (3 deliverables, sequential)

Each state transition must be demonstrable end-to-end in a fresh browser before closing.

### B.1 · `/u` arrive — State 1 (ephemeral wallet)
- **goal:** visit `/u` → wallet exists immediately; address shown; zero prompts; Receive works
- **speed:** first-paint wallet ≤ 100ms after page interactive; visible first paint ≤ 400ms
- **tasks:**
  - [ ] Swap existing zkLogin wallet-creation in `/u` for primitives (A.1 + A.2 + A.5)
  - [ ] Delete: `src/lib/auth-plugins/zklogin.ts` (~295 lines) and `src/components/u/lib/signer/zklogin-*` per `wallet.md` §Phase 6
  - [ ] Delete duplicate `SuiClientProvider` in `ChairmanPanel.tsx`, `CryptoAuthPanel.tsx`, `PayPage.tsx` (per `wallet.md` §Phase 1)
  - [ ] Add `src/components/u/providers.tsx` (~40 lines) — single `SuiClientProvider` + `WalletProvider`
- **verify gate:** `bun run verify` · Playwright: cold visit → balance queryable in <400ms · line-count ledger: -300 net · no Enoki imports anywhere
- **close:** `/close --surface wallet-state-1-arrive`
- **spec:** `passkeys.md` §State 1 + `wallet.md` §Phase 1

### B.2 · `/wallet` Save — State 1 → 2 (passkey + BIP39)
- **goal:** tap "Save" → Touch ID → passkey wraps seed → largeBlob written → BIP39 shown + one-word confirmation → plaintext seed wiped from IndexedDB; same address
- **speed:** from tap to BIP39 reveal ≤ 2s on a fresh passkey
- **tasks:**
  - [ ] `src/components/u/SavePrompt.tsx` (~50 lines) — soft prompt + enrollment + BIP39 reveal
  - [ ] `src/pages/u/save.astro` — host page for the flow
  - [ ] `src/pages/api/wallet/wrap.ts` (~30 lines) — server endpoint for largeBlob duplicate ciphertext (Firefox fallback per `wallet.md` decision §3)
  - [ ] Confirm-one-word UI per `passkeys.md` §State 2 copy
- **verify gate:** `bun run verify` · post-Save: IndexedDB `plaintext_seed === null` · address identical pre/post · largeBlob readable on reload
- **close:** `/close --surface wallet-state-2-save`
- **spec:** `passkeys.md` §State 2 + `wallet.md` §Phase 2

### B.3 · `/u/restore` Recover — State → 5 (BIP39 → same address)
- **goal:** paste 12 words → validate → reconstruct seed → new passkey wrap on this device → same address reappears with balance intact
- **speed:** words-to-address ≤ 1s
- **tasks:**
  - [ ] `src/pages/u/restore.astro` + React island (~80 lines)
  - [ ] Validation UX: invalid word count / checksum / wrong wordlist → clear error
  - [ ] Flow: mnemonic → seed → derive address → show "this is wallet 0x…" for confirmation → one Touch ID → new largeBlob → redirect to `/wallet`
- **verify gate:** `bun run verify` · fixed test vector words → fixed expected address · wrong checksum rejected with specific error
- **close:** `/close --surface wallet-state-5-restore`
- **spec:** `passkeys.md` §State 5 Recovered + `wallet.md` §Phase 4 (`/u/restore` row)

---

## Batch C — integration (3 deliverables, sequential)

### C.1 · `signer` — unwrap → sign → wipe
- **goal:** unified `sign(txBytes)` at `src/components/u/lib/signer.ts` (~60 lines) used by every `/u/*` page; lifetime of raw seed bytes ≤ 10ms
- **speed:** p95 Touch-ID-to-signed-bytes ≤ 1.5s (Touch ID itself dominates)
- **tasks:**
  - [ ] `src/components/u/lib/signer.ts` — read wrapping → prompt Touch ID → unwrap → `crypto.subtle.importKey(seed, Ed25519, extractable: false)` → sign → wipe raw
  - [ ] Rewire `SignPage.tsx` + `SendPage.tsx` to use it (per `wallet.md` §Phase 4 table)
  - [ ] Delete mock signatures, localStorage reads (per `wallet.md` §Phase 6)
- **verify gate:** `bun run verify` · raw seed wiped within budget (instrumented test with `performance.now()`) · signatures verify on-chain
- **close:** `/close --surface wallet-signer`
- **spec:** `passkeys.md` §Signing flow + `wallet.md` §Phase 3 signer

### C.2 · `sponsor-tx` — build + execute Workers
- **goal:** sponsored transactions via our own Worker; shape reused verbatim from `apps/enoki-play/src/routes/sponsored/sponsored.remote.ts`, `EnokiClient` swapped for our sponsor Worker
- **speed:** tap-to-landed ≤ 3s on testnet (per `website.md` §6 deliverable)
- **tasks:**
  - [ ] `src/pages/api/sponsor/build.ts` (~40 lines) — receive txKindBytes + user addr → wrap with hot-key gas → return `{ bytes, digest }`; enforce `allowedMoveCallTargets` + rate limit
  - [ ] `src/pages/api/sponsor/execute.ts` (~30 lines) — receive `{ digest, signature }` → add sponsor signature → submit
  - [ ] `src/components/u/lib/send.ts` (~80 lines) — client state machine (build → sponsor → sign → execute), epoch-expiry retry
  - [ ] **Must read first:** `apps/enoki-play/src/routes/sponsored/sponsored.remote.ts` (per CLAUDE.md "Reference before greenfield")
- **verify gate:** `bun run verify` · testnet sponsored tx lands in ≤ 3s wall-clock · denied Move target → 403 not 500
- **close:** `/close --surface wallet-sponsor`
- **spec:** `wallet.md` §Phase 3 + `website.md` §6 sponsored-buy

### C.3 · `auth-link` — Better Auth Google → wallet unit (State 3)
- **goal:** on Google OAuth success, link `walletAddress` to the user's TypeDB unit; no seed/ciphertext leaves the browser
- **speed:** OAuth callback + link ≤ 800ms
- **tasks:**
  - [ ] `src/lib/auth-plugins/wallet-link.ts` (~40 lines) — reads `walletAddress` + `credId` from client header, calls `ensureHumanUnit(uid, { id: walletAddress, email, name })`, writes `identity-link(subject: unit, front-door: "google")`
  - [ ] Delete (per `wallet.md` §Phase 5): `src/lib/auth-plugins/zklogin.ts` (295 lines), Enoki plugin scaffolding
  - [ ] Client sends header during OAuth start, not after
- **verify gate:** `bun run verify` · server logs carry no seed/ciphertext/PRF bytes · TypeDB unit has `wallet_address` + `credId` after OAuth · State 3 reachable per lifecycle
- **close:** `/close --surface wallet-auth-link`
- **spec:** `passkeys.md` §State 3 + `wallet.md` §Phase 5

---

## Batch D — team infrastructure (parallel with A/B/C)

### D.1 · `dotenvx-one-ie` — encrypt team env, wire Cloudflare + CI
- **goal:** `one.ie` repo uses dotenvx for team env; `.env.keys` gitignored per dev; CI+Cloudflare read via `wrangler secret bulk` at deploy; scoped `.env.agent` for future LLM workloads
- **speed:** added deploy step ≤ 10s on `wrangler deploy`
- **tasks:**
  - [ ] `dotenvx encrypt` current `.env` → `.env.production` committed
  - [ ] `.env.keys` added to `.gitignore` + `chmod 600`; teammates get copy out-of-band
  - [ ] CI: `DOTENV_PRIVATE_KEY_PRODUCTION` + `CLOUDFLARE_API_TOKEN` in GitHub Actions secrets
  - [ ] Deploy script: `dotenvx run -- wrangler secret bulk && wrangler deploy`
  - [ ] Stub `.env.agent` + `DOTENV_PRIVATE_KEY_AGENT` (no LLM workloads yet — document and park)
- **verify gate:** fresh clone + paste `.env.keys` + `dotenvx run -- pnpm dev` works · `git log --all -S 'sk-ant-'` empty · CI deploy green
- **close:** `/close --surface team-dotenvx`
- **spec:** `secrets.md` §dotenvx + `agents.md` §Pattern C off-chain mirror

---

## Exit criteria for the whole plan

- All 12 deliverables closed (pheromone tagged `mode:lean`, `lifecycle:construction`)
- `one.ie` line-count net ≤ **-350** (per `wallet.md` §Line-count ledger)
- Full 5-state lifecycle demonstrable end-to-end in a fresh browser
- Zero references to `zkLogin`, `Enoki`, `jwtToAddress`, `salt server` in `src/`
- `bun run verify` green
- Testnet sponsored tx lands in ≤ 3s (p95)
- `secrets.md` self-audit passes (no secret in two stores; `.env.keys` gitignored; `rg -i 'api[_-]?key' src/` in code returns zero hits)

## Rollback criterion

Any W1 deliverable takes >2× its speed budget OR uncovers a spec gap → halt batch, emit `spec-change` against the relevant root doc, reconcile, resume. No catch-up commits under deadline pressure — classifier integrity depends on honest close tags.

---

## Spawn prompt template (for each Sonnet)

```
You are implementing {A.N / B.N / C.N / D.N} from /Users/toc/Server/one.ie/one/wallet-plan.md.

Spec slice: read {spec doc}:{section} — that is authoritative.
This plan entry: the {tasks} list above.
Exit gate: {verify gate} line above.

Rules:
- `.claude/rules/engine.md` — closed loop, structural time, deterministic results
- `.claude/rules/ui.md` — emitClick('ui:<surface>:<action>') on every onClick (if UI)
- Path aliases: @/engine, @/components/… (per one.ie/CLAUDE.md)

When done:
- `bun run verify` passes
- All exit-gate checks pass
- Line count within spec's estimate
- Report: what files changed, how you verified, any spec gaps found (don't fix specs yourself — emit spec-change)
```

---

## Batch A, ready to spawn

Five parallel Sonnets, same prompt template, each with its own {A.N} reference. Spawn when the user says go.
