# Wallet Wrap Backup (Server-Held Ciphertext)

A server-held duplicate of the passkey-PRF ciphertext for wallets where the
WebAuthn `largeBlob` extension is unavailable (currently Firefox).

Source files: `src/pages/api/wallet/wrap.ts`, `src/pages/api/wallet/wrap/[credId].ts`,
`src/components/u/lib/wrap.ts`.

---

## Why it exists

The canonical ciphertext copy lives in the passkey `largeBlob` extension — bound
to the credential, stored by the authenticator, zero server involvement.
Firefox does not support `largeBlob` as of this writing.

Without a fallback, Firefox users would lose their wrapped seed when they clear
IDB or switch devices. The server backup is that fallback: same `{ iv, ciphertext }`
tuple written to D1, keyed by `(user_id, cred_id)`.

No seed material crosses to the server. The server stores only the AES-GCM
ciphertext — it is useless without the passkey PRF output, which never leaves
the authenticator.

---

## Atomic write contract

When `largeBlob` is unavailable the client must write to both destinations
atomically (or roll back if either fails):

1. Attempt `largeBlob` write during the WebAuthn ceremony
2. If `largeBlob` is unsupported, POST the same `{ credId, iv, ciphertext, version }` to
   `POST /api/wallet/wrap`
3. If the server POST fails, the passkey ceremony is rolled back and the user
   is shown an error

This ensures the IDB wrapping record and the server backup are always in sync.
A wrapping record in IDB without a server backup (or vice versa) is an inconsistent
state that would leave the user unable to restore on Firefox.

---

## API routes

### POST /api/wallet/wrap — store backup

Auth: Better Auth session (cookie or Bearer).

```
Body:   { credId: string, iv: string, ciphertext: string, version: 1 }
200:    { ok: true }
400:    { error: string }   malformed body or version != 1
401:    Unauthorized        no session
503:    { error: string }   D1 not available (dev without binding)
500:    { error: string }   D1 write failure
```

D1 table: `wallet_backups` (migration `0021_wallet_backups.sql`).
Schema: `(user_id, cred_id)` composite primary key, `INSERT OR REPLACE` semantics.
A re-wrap after key rotation overwrites the previous row cleanly.

### GET /api/wallet/wrap/:credId — fetch backup (restore flow)

Auth: Better Auth session, Sui session, or Bearer API key.

```
200:    { credId, iv, ciphertext, version }
401:    Unauthorized
404:    Not found
503:    Storage unavailable
```

Ownership enforced: session uid must match the stored `user_id`.

### DELETE /api/wallet/wrap/:credId — remove backup (revoke flow)

Auth: same as GET.

```
204:    (no body)
401:    Unauthorized
503:    Storage unavailable
```

Called when a passkey credential is revoked. The IDB wrapping record is
removed by `removeWrapping(credId)` client-side; this endpoint removes the
corresponding server copy.

---

## Recovery path (Firefox)

When a Firefox user needs to restore their wallet on a new device:

1. User authenticates via Better Auth (email/password or Google)
2. Client calls `GET /api/wallet/wrap/:credId` to retrieve `{ iv, ciphertext }`
3. User taps the passkey on the original device (or a synced authenticator)
4. `unwrapWithPasskey(wrapping)` decrypts the seed locally
5. Seed is immediately re-wrapped with the new device's passkey and saved to IDB
6. Server backup updated with the new wrapping via `POST /api/wallet/wrap`
