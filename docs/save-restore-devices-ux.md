# Save, Restore, and Devices UX

The three security pages of the `/u/*` surface. Together they cover the full lifecycle of protecting and recovering a wallet.

---

## Save prompt (`/u/save`)

**Component:** `SavePromptIsland` → `SavePrompt`

**When it fires:**

The save prompt is shown after the user's first transaction while in State 1 (wallet exists in IDB but has no passkey wrapping). It is a soft prompt — one tap to protect, or dismiss to skip.

It can also be surfaced directly by navigating to `/u/save`.

**What it does:**

1. Presents a card: "Save this wallet with Touch ID?"
2. Lists three benefits: biometric security, BIP39 phrase shown once, no account needed.
3. Primary button: **Save with Touch ID** (label adapts to the platform — Face ID on iPhone, Windows Hello on Windows).
4. Secondary link: **Not now** (dismissable version only).

**What happens on save:**

- The WebAuthn PRF enrollment dialog opens (platform-native biometric prompt).
- The vault derives an encryption key from the passkey PRF output.
- The seed is wrapped (AES-256-GCM) under that key and written to the `one-vault` IDB store.
- A BIP39 phrase is shown once. The user is expected to write it down.
- The wallet transitions from State 1 (ephemeral seed) to State 2 (passkey-prf wrapped).

**What happens on dismiss:**

- Navigation returns to `/u`.
- The wallet remains in State 1. The seed is still only in-memory/IDB with no passkey protection.
- The $25 receive cap remains in effect.

---

## BIP39 restore (`/u/restore`)

**Component:** `RestoreIsland`

**When to use it:**

- Lost all devices and only have the paper phrase (Journey 2).
- Moving to a new ecosystem where the existing passkey is unavailable (Journey 4, 6).
- Revoking a compromised passkey and re-enrolling (Journey 5).

This is the only page in the product that accepts a seed phrase. Do not enter a seed phrase anywhere else.

**How the flow works:**

1. Navigate to `/u/restore`.
2. The form shows 12 input fields (one per word).
3. Type each word. Tab advances to the next field.
4. Each word is validated against the BIP39 wordlist inline as you type.
5. Tap **Restore**.
6. The seed is derived from the phrase using BIP39 (Ed25519 from first 32 bytes).
7. The restored address appears on screen (`data-testid="restore-address"`).
8. A **Save with Touch ID** button appears immediately.

**What's validated:**

- Every word must be in the BIP39 English wordlist. Invalid words produce a "not in wordlist" error.
- The 12-word mnemonic checksum is verified. A checksum failure is shown as an error.
- The form stays on `/u/restore` on any validation failure — it does not navigate away.

**After restore:**

The wallet is in a State-1-equivalent: the address is recovered and in memory, but no passkey wrapping exists yet. The **Save with Touch ID** / **Save with Windows Hello** CTA must be tapped to persist it. If the user closes the tab without saving, the next visit starts fresh.

---

## Devices page (`/u/devices`)

**Component:** `DevicesIsland`

**What it shows:**

A list of enrolled passkey credentials (`passkey-prf` wrappings) from the `one-vault` IDB. Each credential corresponds to a device — a Touch ID Mac, a Face ID iPhone, a Windows Hello PC, etc.

The credential ID is displayed (truncated hex). The platform label is inferred from the user agent at the time of enrollment (e.g. "Touch ID", "Windows Hello").

**What you can do:**

**Enroll a new device:** Go through `/u/restore` (BIP39 path) or `/u/save` (from an existing session) on the new device. A new `passkey-prf` wrapping is appended to the wallet record.

**Revoke a device:**
1. Find the device card on `/u/devices`.
2. Tap the **Remove** button on the card.
3. An alert dialog asks for confirmation.
4. On confirm:
   - The `passkey-prf` wrapping for that credential is removed from `one-vault` IDB.
   - A best-effort `DELETE /api/wallet/wrap/:credId` is fired to remove the server-side backup entry.
   - The device card disappears from the list.

**After all passkeys are revoked:**

The wallet still has the `bip39-shown` wrapping entry as a marker that a paper phrase exists. The wallet can only be accessed via `/u/restore` until a new passkey is enrolled.

**Data source:**

All data is local — `one-vault` IndexedDB in the browser. The devices list reflects what is stored locally, not a server record. Server-side backups are best-effort and exist to support sync; the IDB is authoritative.
