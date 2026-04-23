# Wallet Lifecycle

Five-state wallet from ephemeral seed to full hardware passkey protection.

Source files: `src/components/u/lib/seed.ts`, `wrap.ts`, `signer.ts`, `send.ts`, `idb.ts`, `errors.ts`.

---

## State 1 — Ephemeral (no wrappings)

**What exists:** A fresh `WalletRecord` with `wrappings: []` and `plaintextSeed: null`.
The raw 32-byte Ed25519 seed exists only in memory (from `generateSeed()`).

**Seed storage:** Caller holds the seed in a `Uint8Array`; it is NOT written to IDB yet.
`initWalletRecord(seed)` returns the record with the address only.

**Signing:** `signTx(txBytes, seed)` — seed imported as non-extractable CryptoKey,
raw bytes wiped immediately after import, signature returned.

**Constraint:** `POST /api/sponsor/build` enforces a $25 USD cap on cumulative balance
for wallets reporting `walletState: 1`. Checked via on-chain balance + oracle price.

**IDB:** `putWallet(record)` persists the address-only record in `one-wallet` DB.
The `plaintextSeed` field stays null (seed lives in the call stack only).

---

## State 2 — Passkey-wrapped (one or more `passkey-prf` wrappings)

**What exists:** `wrappings: [PasskeyPrfWrapping, ...]` in IDB. No plaintext seed anywhere.

**Envelope encryption path:**

```
Touch ID / Face ID
    ↓
WebAuthn PRF extension (credId + PRF_SALT = "one.ie-wallet-v1")
    ↓ 32-byte PRF output
HKDF-SHA256 (empty salt, info = "one.ie-wallet-v1")
    ↓ AES-256-GCM key (non-extractable)
AES-GCM encrypt Ed25519 seed
    ↓ { iv: 12 bytes, ciphertext: 48 bytes }
Stored in IDB as PasskeyPrfWrapping
```

**Key derivation details (wrap.ts):**
- PRF salt: `TextEncoder("one.ie-wallet-v1")` — constant, deterministic
- HKDF: empty RFC-5869 salt (PRF output is already uniformly random), SHA-256 hash
- AES-GCM: 256-bit key, 12-byte random IV per wrap, 16-byte auth tag appended to ciphertext

**Wrapping flow (wrapWithPasskey):**
1. `getPrfOutput(credId, PRF_SALT)` — WebAuthn ceremony, `userVerification: "required"`
2. `prfToAesKey(prf)` — HKDF → AES-256-GCM key
3. `wrapSeed(seed, key)` — AES-GCM encrypt → `{ iv, ciphertext }`
4. Returns `PasskeyPrfWrapping` with type, credId, iv, ciphertext

**Signing flow (signTxWithWrapping):**
1. PRF ceremony with `credId` from wrapping
2. `prfToAesKey(prf)` — same derivation
3. `unwrapSeed(wrapping, key)` — AES-GCM decrypt → Ed25519 seed
4. Derive public key bytes from seed (needed for Sui signature format)
5. `signWithSeed(txBytes, seed)` — import as non-extractable CryptoKey, wipe seed bytes, sign
6. Return 97-byte Sui signature: `flag(0x00) | sig(64) | pubkey(32)`

**IDB operations:**
- `addWrapping(wrapping)` — appends to `wrappings[]` without touching other fields
- `wipePlaintextSeed()` — sets `plaintextSeed: null` after State 1→2 transition

---

## State 3 — Linked to Google / Better Auth identity

Same as State 2 cryptographically. The wallet address is additionally written
to TypeDB via `linkWallet(userId, address, credId?)` in `wallet-link.ts`:
- `wallet-address` attribute on the `auth-user` entity
- `passkey-cred-ids` JSON array of hex credIds for multi-device hints (max 20)

No seed material crosses to the server. The link is a capability assertion only.

---

## State 4 — Hardware key (scoped wallet on-chain)

Scoped wallet object deployed on Sui via `scoped-spend` txKind.
The sponsor `build.ts` supports this path. Not yet wired to a UI flow.

---

## State 5 — Full hardware (external hardware key)

Not yet implemented. Placeholder in the `WalletState` type.

---

## IDB Layout

Database: `one-wallet` (separate from `one-vault`).
Store: `wallet`, keyPath `id` = constant `"wallet"`.
Record shape: `WalletRecord & { id: "wallet" }`.

```typescript
interface WalletRecord {
  version: 1
  address: string          // Sui address (0x...)
  wrappings: Wrapping[]    // PasskeyPrfWrapping entries
  plaintextSeed: null      // always null after State 1 transition
}
```

---

## send.ts — Build → Sign → Submit

`sendTx(txBytes, signature, opts?)` submits a pre-signed transaction:

1. POST `{ txBytes: number[], senderSig: number[] }` to `/api/sponsor/execute`
2. On epoch-expiry responses, retries up to `maxRetries` (default 3) with `retryDelayMs` delay
3. Returns `{ digest, confirmedAt }` on success
4. Throws `WalletError` with kind `epoch-expired`, `network-error`, or `rate-limited`

The caller builds the transaction via `POST /api/sponsor/build` first, then signs it
with `signTxWithWrapping()`, then submits with `sendTx()`.

---

## Error Types (errors.ts)

14 discriminant kinds in `WalletErrorKind`. Relevant to the crypto path:

| Kind | When |
|------|------|
| `passkey-cancelled` | User dismissed Touch ID / Face ID (silent — no UI message) |
| `passkey-unsupported` | PRF extension not available (Safari < 17, Chrome < 118) |
| `tamper-detected` | AES-GCM auth tag failure — ciphertext corrupted |
| `crypto-error` | WebCrypto API failure or unexpected condition |
| `epoch-expired` | Sponsored tx epoch expired between sign and submit |
| `network-error` | Sponsor Worker 5xx or no connectivity |
| `cap-exceeded` | Deposit would push State-1 wallet above $25 USD |

`isWalletError(err)` type guard. `makeWalletError(kind, cause?)` factory.
`err.userMessage` is always safe to render in UI (null = show nothing).
