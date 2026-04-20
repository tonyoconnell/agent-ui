---
title: TODO U — Verify + harden the Universal Wallet
type: roadmap
version: 1.0.0
priority: Recon → Decide → Harden → Verify
total_cycles: 4
completed_cycles: 4
current_cycle: complete
status: DONE
---

# TODO: U — Verify + harden the Universal Wallet

> **Goal.** Prove the `/u/*` wallet is correct, secure, and instrumented.
> The code exists (~10.2k lines, 48 files). What's missing is deterministic
> receipts: no vault-invariant integration tests, no `ui:u:*` click signals,
> no `substrate:u:*` lifecycle signals, no chain-specific RPC tests, no
> bundle-size gate, no a11y audit.
>
> This is a **harden** TODO, not a port. No components get added. Gaps get
> instrumented, tested, or deleted.
>
> **For humans first.** Unlike `/sui` wallets (deterministic, seed-derived
> for agents), `/u` holds *human* keys under passkey + password + recovery
> phrase. Every invariant matters — lose a key and the user is done.
>
> **Sui at the core.** Every signer path — vault, zkLogin, dapp-kit, MetaMask
> Snap — produces a Sui address and signs Sui transactions. Non-Sui chains
> (BTC/ETH/SOL/USDC) are **vault-only extensions**. Sui-path tests gate the
> rubric; extension-chain tests are additive, not blocking.
>
> **Time units:** tasks → waves → cycles. Never days/hours/weeks.

---

## Status

### Cycle 1 — RECON
- [x] W1 — recon (8 Haiku agents, parallel) — findings → `one/u-recon.md`

### Cycle 2 — DECIDE
- [x] W2 — decide (Opus) — decisions → `one/u-plan.md`

### Cycle 3 — HARDEN
- [x] W3 — harden (7 Sonnet fronts, parallel) — tests + signals + a11y

### Cycle 4 — VERIFY
- [x] W4 — verify (Sonnet) — rubric gate, deterministic receipt

---

## What we already have (do not duplicate)

| Piece | Where | What it does |
|---|---|---|
| Vault schema v2 | `src/components/u/lib/vault/types.ts` | AES-256-GCM + HKDF domains, self-describing records |
| Vault core | `src/components/u/lib/vault/vault.ts` | open/close/unlock, auto-lock, session lifecycle |
| Crypto primitives | `src/components/u/lib/vault/crypto.ts` | AES-GCM, HKDF, PBKDF2 wrappers around SubtleCrypto |
| Passkey flow | `src/components/u/lib/vault/passkey.ts` | WebAuthn PRF enrollment + unlock |
| Recovery flow | `src/components/u/lib/vault/recovery.ts` | BIP-39-style phrase verification |
| Storage | `src/components/u/lib/vault/storage.ts` | IndexedDB, binary-native Uint8Array |
| Migration | `src/components/u/lib/vault/migration.ts` | v1 → v2 upgrade |
| React hook | `src/components/u/lib/vault/useVault.ts` | status + unlock actions |
| 6 chains | `src/components/u/lib/BlockchainService.ts` | ETH / BTC / SOL / SUI / USDC / ONE |
| 17 pages | `src/pages/u/**` | index, wallets, wallet/[id], send, receive, swap, … |
| 48 components | `src/components/u/**` | dashboard + wallet UI + dialogs + sheets + pages + hooks |

**What's missing** (this TODO fills):

- Integration tests for the 10 vault invariants in [u.md](u.md) § The Vault
- `emitClick('ui:u:<action>')` on every interactive onClick
- `substrate:u:<verb>` lifecycle signals on generate/import/export/delete/unlock/lock/reveal/sign
- Chain-specific balance + tx integration tests (6 chains, stubbed RPC)
- Vault v1 → v2 migration test with a real legacy blob
- Bundle-size gate per route
- Unlock perf gates (passkey < 1500ms, password < 500ms p95)
- a11y axe-core gate on top-4 pages
- Page-level smoke (Astro render + hydrate) per route
- **Signer abstraction layer** (`src/components/u/lib/signer/`) — one interface, four adapters (vault / zkLogin / dapp-kit / MetaMask Snap); `/u` pages take a signer prop instead of `useVault()`
- **Universal signing** — arbitrary message signing (auth challenges, capability claims) works via any signer
- **Universal pay** — `/u/send`, `/u/swap`, `/pay/crypto/[skillId]` work with any signer (Sui-first); vault-only for non-Sui chains
- **Payment-link producer** — `CryptoPaymentLink.tsx` (already ported per pay.md) wired to `PayService.createShortlink`; producer can be any signer

---

## Source of truth (W2 auto-loads)

| Doc | What it anchors |
|---|---|
| [DSL.md](DSL.md) | signal grammar — `{receiver, data}`, mark/warn |
| [dictionary.md](dictionary.md) | canonical names — `ui:u:*`, `substrate:u:*` |
| [rubrics.md](rubrics.md) | fit/form/truth/taste scoring for W4 |
| [u.md](u.md) | the verification plan this TODO operationalizes |
| [auth.md](auth.md) | session + API-key identity (vault is separate from session) |
| [pay.md](pay.md) | `/u/send` emits `substrate:pay` — same contract as the other rails |
| [SUI.md](SUI.md) | agent wallets (for contrast — `/u` is the human counterpart) |
| [adl-integration.md](adl-integration.md) | 3 PEP gates on outbound routes from `/u` |
| [ingestion.md](ingestion.md) | wallet lifecycle signals join the pheromone taxonomy |

---

## Schema reference

No schema changes. Reuses existing dimensions:

- **Dim 2 (actor → unit):** the user's unit UID owns the wallet signals (agent + chairman roles)
- **Dim 4 (path):** `ui:u:click → substrate:u:<verb>` paths strengthen on success, weaken on fail
- **Dim 5 (signal):** two new receiver prefixes, `ui:u:*` + `substrate:u:*` — no TypeDB entries needed (pass through ADL)
- **Dim 6 (hypothesis):** repeated wrong-password / cancelled-passkey patterns promote to `hypothesis` via L6 → L4 fires `warn`

---

## Routing

```
  /do u-todo.md (signal)
        │
        ▼
  ┌─ C1 RECON (8 Haiku, parallel) ───────────────────────┐
  │  • src/pages/u/**/*.astro   → routes + hydration      │
  │  • src/components/u/**      → component graph + LOC   │
  │  • lib/vault/**             → public API + invariants │
  │  • lib/*                    → BlockchainService etc   │
  │  • __tests__/**             → coverage gaps           │
  │  • grep emitClick / signal  → signal coverage         │
  │  • adl + perm-network for /u outbound                 │
  │  • bun run build + analyze  → bundle per route        │
  │  OUTPUT: one/u-recon.md                               │
  └───────────────────────────┬──────────────────────────┘
                              │ verbatim findings
  ┌─ C2 DECIDE (Opus) ▼──────────────────────────────────┐
  │  • test list (10 invariants + 6 chain tests)          │
  │  • signal list (every onClick + lifecycle)            │
  │  • bundle trims + a11y fixes                          │
  │  • deprecations (SecureKeyStorage v1 deletion plan)   │
  │  • dead code to remove                                │
  │  OUTPUT: one/u-plan.md                                │
  └───────────────────────────┬──────────────────────────┘
                              │ diff spec
  ┌─ C3 HARDEN (7 Sonnet fronts, parallel) ▼────────────┐
  │  vault-tests · signal-wiring · lifecycle-signals     │
  │  chain-tests · migration-test · pay-link · a11y+docs │
  └───────────────────────────┬──────────────────────────┘
                              │ code + docs
  ┌─ C4 VERIFY (Sonnet) ▼────────────────────────────────┐
  │  • biome + tsc + vitest green                         │
  │  • 10 vault invariants — all green                    │
  │  • 6 chain tests — all green                          │
  │  • signal coverage ≥ 95% interactive onClick          │
  │  • bundle < 200kB gz per /u route                     │
  │  • a11y axe 0 critical on top-4 pages                 │
  │  • perf: unlock p95 within budget                     │
  │  • rubric ≥ 0.65 all four dims                        │
  └───────────────────────────────────────────────────────┘
                              │
                              ▼
              mark(substrate:u:verified, 4)  — path hardens
```

---

## Cycle 1 — RECON (Haiku)

**One job: inventory `/u` and find the gaps. No decisions. No edits.**

### W1 — recon tasks (all parallel, one Haiku per task)

| Task ID | Agent | Target | Output |
|---|---|---|---|
| `recon/u-pages` | Haiku-a | `src/pages/u/**/*.astro` | every route, component imported, `prerender`, hydration mode |
| `recon/u-components` | Haiku-b | `src/components/u/**/*.tsx` (excl. `lib/`) | file → LOC → imports → `emitClick` count |
| `recon/u-vault` | Haiku-c | `src/components/u/lib/vault/**` | exported API per file, invariants enforced, tests that exist |
| `recon/u-lib` | Haiku-d | `src/components/u/lib/{BlockchainService,NetworkConfig,PayService,PaymentStatusTracker,SecureKeyStorage,WalletProtocol,adapters}.ts` | public API, outbound hosts, legacy code flags |
| `recon/u-tests` | Haiku-e | `src/__tests__/**` + any `*.test.{ts,tsx}` co-located in `src/components/u/**` | every test that touches `/u`; gap list per component |
| `recon/u-signals` | Haiku-f | grep `emitClick\|/api/signal\|substrate:u\|ui:u` within `src/components/u/**` | signal-emission coverage per file; missing sites |
| `recon/u-adl` | Haiku-g | `src/engine/adl.ts` callers + `perm-network` attrs on units that originate `/u` calls + `/api/pay/*` + `/api/signal` | which `/u` outbound routes go through `persist.signal()` vs bypass |
| `recon/u-bundle` | Haiku-h | run `bun run build` (if cheap) then analyze `dist/client/u/` by gzipped size | per-route JS size, heaviest dep, unused imports |
| `recon/u-zklogin-touchpoints` | Haiku-i | grep `src/components/u/**` + `src/pages/u/**` for any import from `@/pages/api/auth/zklogin`, `@mysten/sui/zklogin`, `@mysten/enoki`, `frontDoor`, `zklogin` | list of every `/u` file that references zkLogin; confirm coupling is zero or surface-only (read `session.frontDoor` display), never a hard dependency |
| `recon/u-signers` | Haiku-j | grep `useSignTransaction\|useSignPersonalMessage\|wallet_invokeSnap\|getZkLoginSignature\|useVault` across `src/components/u/**` + `src/components/pay/**` + `src/components/auth/**` | map of which pages already do which signing; callsites that hard-code vault where a `Signer` abstraction would cover all four doors |
| `recon/u-paylinks` | Haiku-k | `CryptoPaymentLink.tsx`, `CryptoAcceptAddress.tsx`, `lib/PayService.ts`, `hooks/useShortlink.ts`, `/api/pay/link`, `/api/pay/create-link` + any `/pay/crypto/*.astro` | producer surface (who creates links) + consumer surface (who pays links) + the shortlink lifecycle today |
| `recon/u-sui-core` | Haiku-l | grep `@mysten/dapp-kit`, `@mysten/sui`, `SuiClient`, `TransactionBlock`, `Ed25519Keypair` across `src/components/u/**` + `src/components/pay/crypto/**` + `src/components/auth/**` | confirm Sui is the default code path; flag any place non-Sui chain logic leaks into a Sui-core flow (should be clean isolation) |

### Ask each Haiku for this shape

```markdown
## <task-id>

### Files (path + LOC + one-line purpose)
- `<abs-path>` — <LOC> — <≤15 words>

### API surface / props (per file if relevant)
- `<file>`: <interface shape, one line>

### Signal emission coverage (task `recon/u-signals` only)
- `<file>`: emitClick count=N · `/api/signal` count=M · interactive-handler count=K · coverage=N/K

### Gap list (what should exist but doesn't)
- <one bullet per missing test / missing signal / dead import / legacy artifact>

### One-paragraph summary (≤80 words)
```

### W1 exit

All 8 reports appended to `one/u-recon.md`. Verbatim findings. No decisions.

### W1 rubric (only **truth** scored)

- **truth ≥ 0.85** — paths exist, props match, no hallucination.
- fit / form / taste deferred to C2 and C3.

---

## Cycle 2 — DECIDE (Opus)

One Opus pass reads `u-recon.md` and produces `one/u-plan.md`:

1. **Test list (locked):**
   - 10 vault-invariant tests (from [u.md](u.md) § The Vault table)
   - 6 chain tests (ETH/BTC/SOL/SUI/USDC/ONE — stubbed RPC)
   - 1 v1 → v2 migration test
   - 1 send → `substrate:pay` round-trip test
   - 4 page-smoke tests (index, wallets, send, receive — Astro render + island hydrate)
2. **Signal list (locked):** enumerate every interactive onClick in `/u` components + every lifecycle verb (generate/import/export/delete/unlock/lock/reveal/sign). Each gets a `ui:u:<action>` + the lifecycle verbs get a `substrate:u:<verb>` signal.
3. **Bundle plan:** any dep > 50kB gz → lazy-load / split / remove. Target: each route < 200kB gz.
4. **A11y fixes:** from W1 audit — keyboard traps, missing labels, contrast.
5. **Deletions:** dead code + `SecureKeyStorage.ts` (legacy v1) once migration test green.
6. **Perf gates:** passkey unlock < 1500ms p95, password unlock < 500ms p95 (PBKDF2 tuned).
6a. **Signer abstraction (locked):**

```typescript
// src/components/u/lib/signer/types.ts
export interface Signer {
  readonly kind: 'vault' | 'zklogin' | 'dapp-kit' | 'metamask-snap'
  readonly chain: 'sui' | 'eth' | 'btc' | 'sol' | 'usdc' | 'one'
  readonly address: string
  readonly frontDoor: 'wallet' | 'zklogin'
  signMessage(bytes: Uint8Array): Promise<Uint8Array>
  signTransaction(tx: unknown): Promise<{ bytes: Uint8Array; signature: string }>
  canSign(chain: string): boolean
}
export function resolveSigner(session, dappKit, vault): Signer | null
export function useSigner(): Signer | null   // React hook; reads context
```

Four adapter files, each ≤ 80 LOC:
- `src/components/u/lib/signer/vault-signer.ts` — the only multi-chain signer
- `src/components/u/lib/signer/zklogin-signer.ts` — Sui-only; caches proof per `(addressSeed, maxEpoch)` in IndexedDB
- `src/components/u/lib/signer/dapp-kit-signer.ts` — Sui-only; wraps `@mysten/dapp-kit` hooks
- `src/components/u/lib/signer/snap-signer.ts` — Sui-only; wraps MetaMask Sui Snap

Pages (`SendPage`, `SwapPage`, `CryptoPaymentLink`, `/pay/crypto/[skillId]`) take `const signer = useSigner()` instead of `useVault()`. If `signer === null`, render a "Sign in" prompt.

**Chain guard:** `signer.canSign('btc')` returns false for all non-vault signers. UI shows "BTC requires the vault — set it up?". **No silent fallback.**

6b. **Payment links (locked):**

Producer (in `/u` or `/pay/crypto/*`):
- Any signer can create a link via `POST /api/pay/link` — body includes `to: signer.address`, `amount`, `unit`, optional `memo`, `rail`, `expiresIn`
- Response: `{ linkUrl, ref, qr }` where `ref` is the `pay.one.ie` shortlink id
- Emit `substrate:u:paylink-created` signal with `content.ref` (never the full URL)

Consumer (anyone with the link):
- `/pay/crypto/[skillId]?rail=crypto` resolves shortlink → shows pay UI → calls `signer.signTransaction(txb)` with consumer's signer
- On confirm, submit to Sui fullnode directly (not via backend) — `pay.one.ie` observes via event, we emit `substrate:pay` per pay.md

**No server-signed transactions.** Producer proves ownership by signing a challenge; consumer signs their own outgoing tx. Backend never holds keys.

6c. **zkLogin isolation contract (locked):**
   - `/u` code MUST NOT import from `src/pages/api/auth/zklogin/**`, `@mysten/sui/zklogin`, or `@mysten/enoki`.
   - `/u` MAY read `session.frontDoor` (`"wallet" | "zklogin"`) purely to render a "gas sponsored" badge or mask the "add recovery phrase" CTA for zkLogin users (OAuth = their recovery).
   - If a zkLogin user has NO vault, `/u` shows a read-only view of their Sui wallet (balance + tx history) with a "Set up vault to add chains" CTA. No blocking.
   - If a zkLogin user opts into the vault, the flow is identical to native wallet users — the OAuth identity is untouched; the vault becomes *additive* storage for non-Sui chains.
   - Deleting `src/pages/api/auth/zklogin/**` must leave every C4 test green. Grep enforcement in W4.
7. **Signal contract (locked):**

```typescript
// Tier 1 — UI clicks (.claude/rules/ui.md)
emitClick('ui:u:<action>')
// actions: unlock | lock | reveal-key | copy-address | generate-wallet |
//          send-review | send-submit | swap-review | swap-submit | …

// Tier 2 — Lifecycle (after action confirms)
{
  receiver: "substrate:u:<verb>",  // generate | import | export | delete | unlock | lock | reveal | sign
  data: {
    weight: 1,
    tags: ["u", "vault", "<chain?>"],
    content: {
      verb: "unlock",
      method?: "passkey" | "password" | "recovery",
      chain?: "eth" | "btc" | "sol" | "sui" | "usdc" | "one",
      outcome: "ok" | "fail" | "cancelled",
      reason?: VaultErrorCode
    }
  }
}
```

### C2 exit

- `u-plan.md` written with seven sections locked
- Per-file diff spec for C3 (which signals, which tests, which deletions)
- Rubric ≥ 0.70 (fit + truth)

---

## Cycle 3 — HARDEN (Sonnet, parallel)

Seven fronts. All read `u-plan.md`.

| Front | What | Files |
|---|---|---|
| **vault-tests** | 10 invariant integration tests | `src/__tests__/integration/u-vault-{no-plaintext,hkdf-unique,non-extractable,session-memory,auto-lock,tab-close,audit-log,sentinel,recovery-roundtrip,cross-domain}.test.ts` |
| **signal-wiring** | Add `emitClick('ui:u:<action>')` per onClick | `src/components/u/**/*.tsx` |
| **lifecycle-signals** | Emit `substrate:u:<verb>` after every vault/wallet state change | `hooks/useWallets.ts`, `lib/vault/vault.ts`, `lib/vault/useVault.ts` |
| **chain-tests** | 6 chain balance + tx tests, stubbed RPC | `src/__tests__/integration/u-chain-{eth,btc,sol,sui,usdc,one}.test.ts` |
| **migration-test** | v1 blob → v2 round-trip | `src/__tests__/integration/u-vault-migration.test.ts` + a small legacy fixture in `__tests__/fixtures/vault-v1.json` |
| **pay-link + smoke** | `/u/send` → `substrate:pay` + 4 page-smoke tests | `src/__tests__/integration/u-send-pay.test.ts`, `u-pages-smoke.test.ts` |
| **zklogin-isolation** | Prove zkLogin is optional: (a) grep assertion that `/u/**` has zero hard imports of zkLogin modules, (b) test `/u/wallets` renders for a zkLogin-only user (no vault), (c) test vault unlock works identically for `frontDoor='wallet'` and `frontDoor='zklogin'` sessions | `src/__tests__/integration/u-zklogin-optional.test.ts` |
| **signer-iface** | Land `src/components/u/lib/signer/{types,resolve,vault-signer,zklogin-signer,dapp-kit-signer,snap-signer,index}.ts`; `useSigner()` hook + `SignerProvider` context | 7 files new; `SendPage`/`SwapPage`/`CryptoPaymentLink`/`CryptoAcceptAddress` switched from `useVault()` → `useSigner()` |
| **universal-sign** | Add `/u/sign` flow (sign arbitrary message — auth challenge, capability claim) that works across all four signers; wire into `SignInWithAnything` challenge flow | `src/components/u/pages/SignPage.tsx`, `src/pages/u/sign.astro`, `src/__tests__/integration/u-sign-universal.test.ts` |
| **universal-pay** | Confirm `/u/send` + `/pay/crypto/[skillId]` take `signer` and settle through Sui regardless of signer kind; generate `CryptoPaymentLink` with any signer; emit unified `substrate:pay` | `src/__tests__/integration/u-pay-universal.test.ts` (4 signer × create-link × pay-link matrix) |
| **a11y + docs** | Axe-core runs + fixes on top-4 pages; update docs | component tweaks; `src/components/u/CLAUDE.md`; `one/u.md`; `src/pages/CLAUDE.md` |

### C3 conventions

- **Every onClick emits first, handles second.** `onClick={() => { emitClick('ui:u:<a>'); handle() }}`.
- **Lifecycle signal fires AFTER the action confirms.** No optimistic emissions.
- **No secrets in signal `data.content`.** `reason` is a `VaultErrorCode`, never the mnemonic or password.
- **Invariants have assertions, not log lines.** `expect(extractKey).rejects.toThrow()`, not `console.log`.
- **Fake timers for auto-lock tests.** Real timers flake; `vi.useFakeTimers()` + advance.
- **WebAuthn mocked via `@simplewebauthn/browser` test harness** — no real PRF eval in CI.
- **Bundle check runs in W4**, not C3 (C3 avoids deploy).
- **Delete `SecureKeyStorage.ts` ONLY after migration test is green** — otherwise preserved.
- **Docs update in same PR as code** (docs-first rule from `.claude/rules/documentation.md`).

### C3 exit

- `bun run verify` green
- Every test in the C2 locked list exists and passes
- Signal coverage script shows ≥ 95% of interactive onClicks emit `ui:u:*`
- No dead import; if a file is unreachable, delete it
- Docs updated

---

## Cycle 4 — VERIFY (Sonnet)

Deterministic sandwich closes. Numbers only.

### Integration tests (must pass)

| Test | What it proves |
|---|---|
| `u-vault-no-plaintext.test.ts` | `storage.ts` never persists a non-encrypted key |
| `u-vault-hkdf-unique.test.ts` | HKDF info strings don't collide across `(walletId, kind)` |
| `u-vault-non-extractable.test.ts` | `crypto.subtle.exportKey('raw', masterKey)` throws |
| `u-vault-session-memory.test.ts` | After page reload, status is `isLocked: true` |
| `u-vault-auto-lock.test.ts` | Advance fake timer past `autoLockMs` → session dropped |
| `u-vault-tab-close.test.ts` | `beforeunload` → session dropped (if `lockOnTabClose`) |
| `u-vault-audit-log.test.ts` | 10 security actions → 10 audit rows |
| `u-vault-sentinel.test.ts` | Wrong password → `VaultError('wrong-password')` |
| `u-vault-recovery-roundtrip.test.ts` | Enroll → lock → unlock via recovery phrase → decrypt existing wallet |
| `u-vault-cross-domain.test.ts` | Wallet-A subkey fails to decrypt wallet-B record |
| `u-vault-migration.test.ts` | Real v1 blob → v2 vault, all wallets decrypt |
| `u-chain-{eth,btc,sol,sui,usdc,one}.test.ts` | Balance + tx via stubbed RPC per chain |
| `u-send-pay.test.ts` | `/u/send` emits `substrate:pay` with pay.md-compliant shape |
| `u-pages-smoke.test.ts` | `/u`, `/u/wallets`, `/u/send`, `/u/receive` render + hydrate |
| `u-zklogin-optional.test.ts` | Vault works with `frontDoor='wallet'` AND `frontDoor='zklogin'`; grep proves zero hard imports of zkLogin modules from `/u`; `/u/wallets` renders for zkLogin-only user with "Set up vault" CTA |
| `u-signer-iface.test.ts` | All four adapters conform to `Signer` interface; `resolveSigner()` returns the right adapter per session + dapp-kit state; `useSigner()` hook returns null when no identity, never throws |
| `u-sign-universal.test.ts` | `signer.signMessage(challenge)` produces a verifiable Ed25519 signature across vault / zkLogin (mocked proof) / dapp-kit (mocked) / Snap (mocked); `/u/sign` page renders and submits across all four kinds |
| `u-pay-universal.test.ts` | Matrix: {vault, zkLogin, dapp-kit, Snap} × {create link, pay link, send directly}. Every cell lands a `substrate:pay` with correct `content.ref` and `content.rail="crypto"`. Non-Sui cell (vault × BTC) also green. |
| `u-paylink-lifecycle.test.ts` | Create link → `/api/pay/link` returns `linkUrl` + `ref` → consumer opens `/pay/crypto/[skillId]?ref=<ref>` → signs + submits → `substrate:pay {status:"captured"}` → `path.revenue` increments |
| `u-sui-core.test.ts` | Disabling all non-Sui chains in `NetworkConfig` leaves `/u` fully functional (Sui-only mode ships); adding them back is additive and touches only `BlockchainService.ts` + vault-signer |

### Rubric (W4)

```
fit   ≥ 0.75  — 6 chains + 3 unlock methods + migration all green
form  ≥ 0.70  — one vault API; no duplicate crypto primitives; signal shape is one family
truth ≥ 0.85  — invariants have tests, not hopes; no optimistic emissions; no secret in signal
taste ≥ 0.70  — pages are shells; `emitClick` first, handle second; one `VaultError` taxonomy
```

Gate: **all four ≥ 0.65**, average ≥ 0.73.

### Numeric report (what C4 must return)

```
tests        : <N/N passing>  (+22 for vault invariants, +6 chain, +1 migration, +1 pay, +4 smoke)
biome        : clean
tsc          : clean
coverage     : u/* lines ≥ 70% · u/lib/vault/* lines ≥ 80%
signals      : ui:u:* coverage = XX/YY interactive onClicks (target ≥ 95%)
                substrate:u:* emitted on every lifecycle verb (8/8)
perf         : passkey unlock p95 = <t>ms · password unlock p95 = <t>ms (budgets < 1500 / < 500)
bundle       : /u=<kB> · /u/wallets=<kB> · /u/send=<kB> · /u/receive=<kB> (all gz, budget < 200kB)
a11y         : axe-core critical=0 on /u, /u/wallets, /u/send, /u/receive
migration    : v1 fixture → v2 ok, all wallets decrypt
rubric       : { fit: 0.XX, form: 0.XX, truth: 0.XX, taste: 0.XX }
gate         : PASS | FAIL
```

---

## Testing — Deterministic Sandwich (Rule 3)

```
PRE (before C1)              POST (after C4)
bun run verify               bun run verify + targeted probes
├── biome check .            ├── biome check .
├── tsc --noEmit             ├── tsc --noEmit
└── vitest run               └── vitest run + all new integration tests
                              + axe-core on 4 pages (dev server or JSDOM)
                              + bundle-size script on dist/client/u/
                              + signal-coverage grep script
```

---

## Task metadata (for `/plan sync`)

```yaml
id: u-todo
value: 0.85         # wallet holds real money; correctness = trust
effort: 0.55        # tests + wiring, no new features
phase: harden
persona: director-of-security
blocks: [u-public-launch, ingestion-wallet-lifecycle]
exit: rubric ≥ 0.65 all dims; all vault invariants green; signal coverage ≥ 95%
tags: [u, wallet, vault, passkey, webauthn, harden, verify, test]
```

---

## Anti-goals (explicit)

- **No new chains.** 6-chain set is locked for this cycle.
- **No new crypto primitives.** Wrap WebCrypto + `@simplewebauthn/*` only.
- **No "sync my wallet" backend.** Recovery phrase IS the sync; never ship keys to a server.
- **No cross-origin vault.** Every `/u` tab is its own island; passkey is origin-bound.
- **No telemetry of secret material.** Signals record events, never plaintext.
- **No lock-bypass session extension.** Even with "remember me", `autoLockMs` caps everything.
- **No parallel vault schemas.** v2 is it. Once migration is green, `SecureKeyStorage` v1 is deleted, not kept.
- **No "warn the user and continue" on tamper detection.** Hard fail + audit row.
- **No zkLogin coupling.** `/u` ships without zkLogin. zkLogin hardening (JWKS, nonce replay, salt TEE, Enoki) lives in a separate cycle; bugs there don't block this cycle. `/u` reads `session.frontDoor` as a display hint only — never as a code-path branch that can fail.
- **No Sui fallback to non-Sui.** If a user tries to pay BTC via zkLogin, UI says "BTC requires the vault — set it up?". We do NOT silently route through a server-held key. Sui is core; other chains are vault-only extensions.
- **No server-held signing keys.** Payment link producers sign with their own signer; consumers sign with theirs. `pay.one.ie` creates the shortlink, never the signature. Backend observes, never authors.
- **No wallet-adapter soup.** One `Signer` interface, four adapters (≤ 80 LOC each). New door = new adapter, not a new code path in `/u` pages.
- **No automatic signer election mid-flow.** `resolveSigner` returns one signer per session. UI may offer a picker ("Sign with: __Vault / zkLogin / dapp-kit / Snap"), but never auto-swap during a flow.

---

## Risks + escapes

| Risk | Detection | Escape |
|---|---|---|
| WebAuthn PRF unsupported in CI JSDOM | `capabilities.prf === false` in test env | Mock at `passkey.ts` boundary via `@simplewebauthn/browser` harness |
| Real Stripe/Sui calls in tests | Test runtime network I/O > 0ms | Stub at `BlockchainService` + `PayService` boundary (Effect-testable by design) |
| Bundle regression after signal wiring | C4 bundle gate > 200kB gz | `ui-signal.ts` is fire-and-forget, tiny; if wiring somehow adds > 1kB, investigate |
| Migration test needs sensitive fixture | keys in repo | Fixture uses a synthetic mnemonic + test-only password; flagged `test-only-fixture` |
| v1 → v2 migration corrupts on edge case | migration test only covers happy path | Add fuzz fixtures (empty vault / single wallet / 20 wallets) |
| a11y regressions after dialog wiring | axe-core fails | Fix as part of `a11y + docs` front; block gate if critical |
| Flaky auto-lock test | real timers used | Enforce `vi.useFakeTimers()` in all vault tests via a setup file |
| Passkey ceremony UX broken on desktop Chrome stable | manual QA in C4 | Add a `VaultSetupWizard` E2E on Playwright in a follow-up cycle |

---

## See also

- [u.md](u.md) — the verification plan this TODO operationalizes
- [auth.md](auth.md) — session + API-key identity (separate from vault)
- [pay.md](pay.md) — `/u/send` is the crypto-rail buyer UI
- [SUI.md](SUI.md) — deterministic agent wallets (`/u` is the human counterpart)
- [zklogin.md](zklogin.md) — OAuth → Sui address, the optional sibling front door; not a `/u` dependency
- `.claude/skills/zklogin/` — production checklist for the zkLogin path (JWKS, nonce, salt, Enoki)
- [adl-integration.md](adl-integration.md) — PEP gates on outbound routes
- [ingestion.md](ingestion.md) — wallet signals join the pheromone taxonomy
- [rubrics.md](rubrics.md) — fit/form/truth/taste scoring
- [DSL.md](DSL.md) — signal grammar
- [dictionary.md](dictionary.md) — receiver naming
- `src/components/u/CLAUDE.md` — component-level rules (breakpoints, 44pt touch)
- `.claude/rules/ui.md` — `emitClick` contract
- `.claude/rules/engine.md` — closed-loop rule

---

*Haiku finds. Opus decides. Sonnet hardens. The substrate marks.
Your keys stay on your device. The graph learns what you trust.*
