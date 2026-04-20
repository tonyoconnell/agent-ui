# U — The Universal Wallet

**`/u/*` is the envelopes wallet surface. One vault, many chains, zero servers.
Keys live in the browser, encrypted under a passkey (WebAuthn PRF) or password.
This doc is the plan to harden, test, and verify every path end-to-end.**

> Every wallet action is a signal. Every unlock, reveal, sign, export emits
> `ui:u:<action>` to the substrate. The graph learns which flows convert and
> which flows fail. Keys never leave the device; pheromone never leaves the
> graph.

**Status:** PORTED + LIVE. This doc is the hardening plan (see [u-todo.md](u-todo.md)).
Builds on [auth.md](auth.md) (session/API-key identity), [pay.md](pay.md) (the
wallet is the buyer UI for Stripe/Sui rails), [SUI.md](SUI.md) (deterministic
agent wallets; the `/u` flow is the *human* equivalent — non-deterministic,
user-held keys), and [adl-integration.md](adl-integration.md) (sensitivity +
network gates on any `/u` route that posts outbound).

---

## The Claim

Envelopes already has a mobile-first, six-chain, passkey-gated wallet. What it
lacks is **provable correctness**. No integration tests drive the vault.
No page emits pheromone. Recovery paths are never exercised in CI.
This plan closes the gap — same code, new receipts.

| What `/u` already has (keep) | What's missing (this plan adds) |
|---|---|
| Vault schema v2 (AES-256-GCM + HKDF domains) — `lib/vault/types.ts` | End-to-end passkey unlock test (real WebAuthn PRF mock) |
| Passkey + password + recovery-phrase unlock — `lib/vault/vault.ts` | Recovery-phrase round-trip test (enroll → lock → unlock via phrase) |
| Mobile-first responsive UI (428/1024 breakpoints) — `hooks/useResponsive.ts` | `ui:u:*` click signals per `.claude/rules/ui.md` (every onClick) |
| 6-chain wallet support (ETH/BTC/SOL/SUI/USDC/ONE) — `lib/BlockchainService.ts` | Chain-specific balance + tx integration tests (one per chain, stubbed RPC) |
| `pay.one.ie` client — `lib/PayService.ts` | `substrate:u:*` lifecycle signals (generate/import/export/delete) |
| Wallet detail / Send / Receive / Swap pages | Visual audit: a11y, touch targets, dark theme drift, bundle size |
| Escrow hook for in-wallet escrow flows — `hooks/useEscrow.ts` | Escrow lifecycle test through the wallet surface |
| Vault migration tools — `lib/vault/migration.ts` | v1 → v2 migration test with a real legacy blob |

The substrate contract is unchanged. The wallet becomes a **sensor** for the
graph: every onClick adds a mark; every failed unlock adds a warn; toxic paths
(repeated wrong passwords, cancelled passkey prompts) surface in `/ceo`.

---

## Surface Map

### Pages (Astro routes, all `prerender = true` + `client:only="react"`)

```
src/pages/u/
  index.astro             → UDashboard              — landing, total balance + wallet list
  wallets.astro           → WalletsPage             — all wallets across chains
  wallet/[id].astro       → WalletDetailPage        — chain detail, balances, tx history
  send.astro              → SendPage                — send crypto, form + review + submit
  receive/index.astro     → ReceivePage             — list receive addresses (QR)
  receive/[id].astro      → ReceiveDetailPage       — single-address QR + amount request
  swap.astro              → SwapPage                — on-chain swap (Sui/EVM)
  tokens.astro            → TokensPage              — all tokens across wallets
  testnet-tokens.astro    → TestnetTokensPage       — faucet + testnet balances
  transactions.astro      → TransactionsPage        — cross-chain tx history
  keys.astro              → KeysPage                — key management (reveal/export, step-up)
  people.astro            → PeoplePage              — address book (recipients)
  contracts.astro         → ContractsPage           — deployed contracts + templates
  products.astro          → ProductsPage            — tokenized products
  product/[id].astro      → ProductDetailPage       — single product detail
  cat-sale.astro          → CatSaleSetup            — category-based sale setup
  [name].astro            → dynamic resolver         — named entity (alias / short link)
```

**Route contract:** every page SSR is a shell; every component is `client:only`
because the vault (IndexedDB + WebAuthn + SubtleCrypto) can't exist server-side.

### Components (`src/components/u/*`)

```
Core:
  UDashboard.tsx              (901 lines)  — main dashboard island
  UHeader.tsx / UNav.tsx / MobileNav.tsx   — chrome
  MobileBottomNav.tsx                      — iOS tab bar
  BottomSheet.tsx                          — responsive modal primitive

Wallet UI:
  WalletCard.tsx              (585)   — base wallet card
  EnhancedWalletCard.tsx      (702)   — desktop variant
  MobileWalletCard.tsx        (275)   — mobile variant (44pt touch targets)
  NewWalletSecurityDialog.tsx (372)   — post-generate security prompt
  GenerateWalletDialog.tsx    (181)   — new wallet form
  WalletOnboardingCarousel.tsx (387)  — first-run education
  MobileOnboarding.tsx        (335)   — mobile onboarding

Vault dialogs:
  VaultSetupWizard.tsx        (436)   — passkey + password + recovery setup
  VaultDialogs.tsx            (896)   — unlock + change password + rotate keys
  VaultUnlockChip.tsx         (115)   — header unlock indicator
  SecureStorageDialogs.tsx    (784)   — reveal key, backup, export
  NetworkStatus.tsx / TransactionFinality.tsx — chain health chips

Pages (island components):
  pages/WalletsPage.tsx · WalletDetailPage.tsx · TransactionsPage.tsx
  pages/SendPage.tsx · ReceivePage.tsx · ReceiveDetailPage.tsx · SwapPage.tsx
  pages/KeysPage.tsx · PeoplePage.tsx · ContractsPage.tsx
  pages/TokensPage.tsx · TestnetTokensPage.tsx
  pages/ProductsPage.tsx · ProductDetailPage.tsx · CatSaleSetup.tsx
  pages/index.ts                      — barrel

Sheets (step-by-step mobile flows):
  sheets/SendSheet.tsx · ReceiveSheet.tsx · SwapSheet.tsx

Hooks:
  hooks/useResponsive.ts           — 428/1024 breakpoints + isMobile/Tablet/Desktop
  hooks/useWallets.ts              — vault → wallet list adapter
  hooks/useNetwork.ts              — chain health + RPC selection
  hooks/useEscrow.ts               — in-wallet escrow (create/release/cancel)
  hooks/useCurrencyConversion.ts   — USD/EUR/crypto FX
  hooks/useShortlink.ts            — pay.one.ie shortlink lifecycle

Libs:
  lib/BlockchainService.ts         — multi-chain RPC abstraction
  lib/NetworkConfig.ts             — chain registry (RPC URLs, explorers)
  lib/PayService.ts                — pay.one.ie client (Effect-based)
  lib/PaymentStatusTracker.ts      — poll + reconcile payment state
  lib/SecureKeyStorage.ts          — legacy v1 storage (pre-vault)
  lib/WalletProtocol.ts            — one-protocol SDK integration
  lib/adapters/WalletAdapter.ts    — unified interface
  lib/vault/
    types.ts         — schema v2, HKDF domains, audit events, errors
    vault.ts         — open/close/unlock; session lifecycle; auto-lock
    crypto.ts        — AES-GCM + HKDF + PBKDF2 primitives
    passkey.ts       — WebAuthn PRF enrollment + unlock
    recovery.ts      — BIP-39-style recovery phrase verification
    storage.ts       — IndexedDB persistence (binary-native Uint8Array)
    migration.ts     — v1 → v2 migration
    useVault.ts      — React hook (status + unlock/lock actions)
    index.ts         — barrel
```

**Total:** ~10.2k lines across 48 files. Single source of truth: `lib/vault/types.ts`
(imported everywhere; never redefine types in siblings).

---

## The Vault (Security Model)

```
  PASSKEY UNLOCK                  PASSWORD UNLOCK              RECOVERY UNLOCK
  ─────────────────                ─────────────────             ─────────────────
  WebAuthn PRF eval                PBKDF2(password, salt)        BIP-39 phrase → seed
    → 32-byte secret                 → 32-byte secret              → 32-byte secret
    → HKDF("master")                 → HKDF("master")              → HKDF("master")
    → masterKey (CryptoKey)          → masterKey                   → masterKey
                       │             │             │
                       └─────────────┼─────────────┘
                                     ▼
                         VaultSession { masterKey, method, unlockedAt }
                                     │
                                     ▼ HKDF.info = vault.v2.wallet.<id>.pk
                         per-wallet subkey (non-reusable across wallets)
                                     │
                                     ▼ AES-256-GCM decrypt
                         private key / mnemonic (never persisted in cleartext)
                                     │
                                     ▼
                         in-memory signing / export (step-up re-auth for reveal)
```

**Invariants (must stay true forever):**

| Invariant | Where enforced | Test that proves it |
|---|---|---|
| No plaintext key ever written to disk | `storage.ts` — only `EncryptedRecord` shape | grep test: `storage.ts` never calls `JSON.stringify` on a `privateKey` string |
| HKDF `info` is unique per record | `types.ts:HKDF_DOMAINS` | Unit test: domains don't collide across `(walletId, kind)` pairs |
| `masterKey` is non-extractable | `crypto.ts` `generateKey({ extractable: false })` | Unit test: `crypto.subtle.exportKey('raw', masterKey)` throws |
| `VaultSession` never persisted | `vault.ts` — module-level ref, not in IndexedDB | Integration test: after page reload, `status.isLocked === true` |
| Auto-lock fires on idle | `vault.ts` — `autoLockMs` timer | Fake timer test: advance clock past `autoLockMs`, session dropped |
| Tab close locks (if enabled) | `vault.ts` — `beforeunload` handler | JSDOM event test |
| Audit log records every security verb | `storage.ts` — `AuditEvent` append | Integration: 10 actions → 10 audit rows |
| Sentinel (`ONE_VAULT_CHECK`) detects wrong password | `vault.ts:verifyPassword` | Wrong-password test: throws `VaultError('wrong-password')` |
| Recovery phrase re-derives same master | `recovery.ts` | Round-trip: enroll → lock → unlock via phrase → decrypt existing wallet |
| No secret crosses HKDF domain | `types.ts` — enforced by `info` string | Cross-decrypt test: wallet-A subkey fails to decrypt wallet-B record |

**Threat model (explicit):**

- **In scope:** device theft (vault locked), XSS (cannot exfiltrate non-extractable `CryptoKey`), browser extension reading IndexedDB (gets only ciphertext), phishing (origin-bound passkey), shoulder-surfing (auto-lock).
- **Out of scope:** malware with ring-0 access, compromised browser build, user writing their recovery phrase on a Post-it.

---

## Signal Contract

Every `/u/*` interaction emits a signal. Three tiers:

### Tier 1 — UI clicks (per `.claude/rules/ui.md`)

```typescript
emitClick('ui:u:<action>')
// e.g. 'ui:u:unlock', 'ui:u:reveal-key', 'ui:u:send-review', 'ui:u:copy-address'
```

**Every interactive onClick in `src/components/u/**` MUST call `emitClick` first.**
A dashboard today without `emitClick` is a bug; the graph is blind.

### Tier 2 — Lifecycle signals (vault + wallet state changes)

```typescript
// POST /api/signal from within the component after the action confirms
{
  receiver: "substrate:u:<verb>",       // generate | import | export | delete | unlock | lock | reveal | sign
  data: {
    weight: 1,                           // most are unit-weight
    tags: ["u", "vault", "<chain?>"],
    content: {
      verb: "unlock",
      method?: "passkey" | "password" | "recovery",
      chain?: "eth" | "btc" | "sol" | "sui" | "usdc" | "one",
      outcome: "ok" | "fail" | "cancelled",
      reason?: "wrong-password" | "passkey-cancelled" | "locked" | ...  // VaultErrorCode
    }
  }
}
```

### Tier 3 — Payment signals (unchanged, see [pay.md](pay.md))

Wallet-initiated pay flows emit `substrate:pay` per `pay.md` § Unified Signal
Shape. `/u/send` → `substrate:pay` with `rail: "crypto"`. No new shape.

---

## Governance + ADL

Most `/u` surface is fully client-side — no server call, no ADL gate needed.
The gates apply only to routes that post outbound:

| Route / action | ADL gates applied |
|---|---|
| `POST /api/signal` from wallet | lifecycle + network + schema (already live) |
| `POST /api/pay/*` from SendPage | pay.md § Three ADL gates |
| `POST /api/auth/*` (session create) | lifecycle + schema |
| Outbound to `pay.one.ie` / Stripe / Sui RPC | `perm-network.allowedHosts` on the calling unit |

**Sensitivity:** `confidential` for any signal carrying `chain`, `address`, or
payment `ref`. Never include mnemonics, private keys, or unlock secrets in
signal `data.content`. The audit log stays in IndexedDB, never in TypeDB.

**`data-retention-days` ≥ 90** for wallet-origin payment signals (chargeback
window — see pay.md).

---

## Performance Budget

| Metric | Budget | Today | How measured |
|---|---|---|---|
| First paint `/u` | < 400ms | ? | Lighthouse CI on preview URL |
| Vault unlock (passkey) | < 1500ms | ? | Perf mark `u.unlock.start` → `u.unlock.ok` |
| Vault unlock (password) | < 500ms | ? | PBKDF2 iterations tuned per device |
| Decrypt wallet | < 50ms | ? | AES-GCM is hardware-accelerated |
| Bundle size `/u` (gz) | < 200kB | ? | `wrangler deploy --dry-run` + `gzip -c` |
| IndexedDB read (status) | < 10ms | ? | `performance.now()` wrap |

Unknown entries are the target of the **verify** cycles below.

---

## Wave Plan

### Cycle 1 — RECON (Haiku, parallel)

**Goal:** inventory what exists, cross-check this doc, find the gaps.

| Task ID | Target | Output |
|---|---|---|
| `recon/u-pages` | `src/pages/u/**/*.astro` | every route, its component, prerender flag, hydration mode |
| `recon/u-components` | `src/components/u/**/*.tsx` | component graph (who imports whom), LOC, `emitClick` coverage |
| `recon/u-vault` | `src/components/u/lib/vault/**` | public API, invariants, what's tested, what isn't |
| `recon/u-lib` | `src/components/u/lib/**` (non-vault) | BlockchainService / PayService / WalletProtocol API surface |
| `recon/u-tests` | `src/__tests__/**` + co-located `*.test.tsx` | every test that touches `u/*`; coverage gaps per component |
| `recon/u-signals` | grep `emitClick` / `api/signal` within `src/components/u/**` | coverage % per file; missing emission sites |
| `recon/u-adl` | `adlFromAgentSpec` callers + `perm-network` for wallet origin | which outbound routes pass ADL, which bypass |
| `recon/u-bundle` | `bun run build` + analyze `dist/client/u/` | per-route JS size, heaviest dep |

**W1 exit:** `one/u-recon.md` committed. Verbatim findings. No decisions.

### Cycle 2 — DECIDE (Opus)

Read `u-recon.md`. Lock `u-plan.md`:

1. **Test list** — which integration tests are missing (pick from § Invariants table)
2. **Signal list** — every onClick + lifecycle that needs `emitClick` / `substrate:u:*`
3. **Bundle trims** — any dep > 50kB gz that can be lazy-loaded
4. **A11y fixes** — from audit; keyboard traps, missing labels, contrast
5. **Deprecations** — `SecureKeyStorage.ts` (legacy v1) — schedule deletion once migration tested
6. **Dead code** — any component not reachable from a live route → delete

### Cycle 3 — HARDEN (Sonnet, parallel fronts)

| Front | What | Files |
|---|---|---|
| **vault-tests** | Write the 10 invariant tests from § The Vault table | `src/__tests__/integration/u-vault-*.test.ts` |
| **signal-wiring** | Add `emitClick('ui:u:<action>')` to every interactive onClick | `src/components/u/**/*.tsx` |
| **lifecycle-signals** | Emit `substrate:u:<verb>` on generate/import/export/delete/unlock/lock/reveal/sign | `hooks/useWallets.ts`, `lib/vault/vault.ts` |
| **chain-tests** | One integration test per chain (stubbed RPC) for balance + tx | `src/__tests__/integration/u-chain-*.test.ts` |
| **migration-test** | v1 blob → v2 vault round-trip | `src/__tests__/integration/u-vault-migration.test.ts` |
| **pay-link** | Confirm `/u/send` emits `substrate:pay` with the right shape | `src/__tests__/integration/u-send-pay.test.ts` |
| **a11y + audit** | Fix items from W1 audit report | component-level edits |
| **docs** | Update `src/components/u/CLAUDE.md`, this file, `one/auth.md` cross-link | docs-only |

### Cycle 4 — VERIFY (Sonnet)

Deterministic sandwich closes.

```
tests        : <N/N passing>  including all 10 vault invariant tests
biome        : clean
tsc          : clean
coverage     : u/* ≥ 70% lines, ≥ 80% for vault/*
perf         : unlock p95 < budgets above
bundle       : /u p95 < 200kB gz
signals      : ui:u:* emitted on every interactive click (coverage script)
                substrate:u:* emitted on every lifecycle verb
signatures   : every invariant from § The Vault table has a green test
a11y         : axe-core 0 critical violations on /u, /u/wallets, /u/send, /u/receive
rubric       : { fit: 0.XX, form: 0.XX, truth: 0.XX, taste: 0.XX }
```

**Rubric gate:**
```
fit   ≥ 0.75  — wallet works end-to-end across 6 chains; unlock methods all green
form  ≥ 0.70  — no duplicate crypto primitives; vault types imported, never redefined
truth ≥ 0.85  — invariants have tests; no optimistic emissions; no secret in signal data
taste ≥ 0.70  — one signal shape family; one vault API; pages are shells
```

---

## Exit Criteria (all cycles)

- Every `/u/*` route loads, hydrates, renders on mobile (428px) and desktop
- Vault unlock via passkey, password, and recovery phrase all pass integration tests
- v1 → v2 migration tested with a real legacy blob
- All 10 invariants have green tests
- 6 chains pass balance + tx integration (stubbed RPC)
- Every interactive onClick emits `ui:u:<action>`
- Every lifecycle verb emits `substrate:u:<verb>`
- `/u/send` emits `substrate:pay` with pay.md-compliant shape
- ADL gates enforced on outbound routes from `/u`
- Bundle < 200kB gz per route; unlock p95 < budgets
- a11y clean on the four top-traffic pages
- Docs updated: this doc, `src/components/u/CLAUDE.md`, `src/pages/CLAUDE.md`, `one/auth.md`
- Rubric ≥ 0.65 all four dimensions
- `bun run verify` green

---

## Anti-Goals (out of scope)

- **No new chains.** ETH/BTC/SOL/SUI/USDC/ONE is the supported set. Adding chains is a separate proposal.
- **No server-side keystore.** The entire design rests on device-local secrets. Never add a "sync my keys" path that ships private material to a server — recovery phrase IS the sync mechanism.
- **No KYC.** `/u` is identity-free. Pay flows that need KYC (Stripe high-risk) get it via Stripe's own surface, not envelopes.
- **No custom BIP-39 or crypto primitives.** Wrap WebCrypto + vetted libs only.
- **No session "remember me" longer than auto-lock.** Even with the box checked, `autoLockMs` is the ceiling.
- **No telemetry of mnemonic / private-key reveal content.** The signal records the *event*, never the *material*.
- **No parallel vault paths.** One vault, one schema (v2), one migration (v1 → v2). When v3 happens, v1 is deleted, not kept.

---

## Risks + escapes

| Risk | Detection | Escape |
|---|---|---|
| Passkey PRF unsupported on device | capability detect at setup | fall back to password; show clear UX |
| User loses passkey AND password | recovery-phrase prompt during setup | force recovery enrollment before first save |
| IndexedDB quota exceeded | `storage.ts` error code | auto-prune audit log > 1000 rows; emit warn |
| Vault migration v1→v2 corrupts | migration runs read-only first; writes atomic | `migration.ts` keeps v1 blob until v2 verified |
| CryptoKey exfil via compromised page | non-extractable + CSP | — structural defence; only works if CSP holds |
| `emitClick` adds latency on mobile | debounce + `requestIdleCallback` | signals are fire-and-forget; never await |
| Bundle regression | CI bundle-size gate | deploy.ts already records per-service; extend to `/u` |
| SecureKeyStorage v1 re-read by mistake | grep + delete post-migration | C3 front deletes the file once migration test green |

---

## See Also

- [auth.md](auth.md) — session + API-key identity; `/u` is the *wallet* layer, `/auth` is the *session* layer
- [pay.md](pay.md) — Stripe / Sui / weight rails; `/u/send` is the crypto-rail buyer UI
- [SUI.md](SUI.md) — deterministic agent wallets (seed + uid → keypair). `/u` is the *human* counterpart (device-held keys)
- [adl-integration.md](adl-integration.md) — sensitivity + network gates on `/u`-originated outbound calls
- [ingestion.md](ingestion.md) — wallet lifecycle signals feed `ui:u:*` + `substrate:u:*` into the pheromone taxonomy
- [buy-and-sell.md](buy-and-sell.md) — `/u/swap` and `/u/send` are buyer surfaces for the EXECUTE / SETTLE steps
- `src/components/u/CLAUDE.md` — component-level design rules (mobile-first, 44pt touch, breakpoints)
- `.claude/rules/ui.md` — `emitClick('ui:u:<action>')` contract
- `.claude/rules/engine.md` — closed-loop rule applied to every wallet action

---

*Your keys. Your device. Your signal. The graph learns what you trust.*
