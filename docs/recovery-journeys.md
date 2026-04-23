# Recovery Journeys

Six runbooks for recovering your wallet. Each maps to a real scenario.

---

## Journey 1 — Lost phone, same Apple ID (C.j1)

**Trigger:** You got a new iPhone or iPad. Your old device is gone but you use the same Apple ID.

**What survives:** Your wallet. iCloud Keychain carries your passkey across Apple devices automatically.

**What's lost:** Nothing, if you're on the same Apple ID.

**Steps:**
1. Open one.ie on your new device.
2. A prompt appears: "Unlock with Touch ID" (or Face ID).
3. Tap it. Your device asks for biometric confirmation.
4. Your wallet reopens at the same address with the same balance.

Done. The passkey synced via iCloud Keychain. You never needed to type anything.

---

## Journey 2 — Lost all devices: BIP39 break-glass (C.j2)

**Trigger:** You lost every device and have no iCloud access. You have a piece of paper with 12 words.

**What survives:** Your wallet address and all on-chain assets. The 12-word phrase is the root.

**What's lost:** The convenience of Touch ID until you re-enroll on a new device.

**Steps:**
1. On any device, go to `/u/restore`.
2. Type your 12 BIP39 words into the form, one per field.
3. Tap **Restore**.
4. Your wallet appears at the same address.
5. Tap **Save with Touch ID** to re-protect it on this device.

If you mistype a word, the form shows a validation error. All 12 words must be in the BIP39 wordlist. Check for typos and try again.

**Note:** If you never wrote down 12 words, there is no recovery path. The paper phrase is the only break-glass option.

---

## Journey 3 — Never saved, cleared browser (C.j3)

**Trigger:** You used the wallet without tapping "Save with Touch ID", then cleared your browser or got a new computer.

**What survives:** Nothing from the old wallet. On-chain assets at the old address are permanently inaccessible.

**What's lost:** The seed. It was only in your browser's local storage and you did not save it.

**What happens next:**
1. Open one.ie. A fresh wallet is created automatically.
2. No error. No crash. Just a new address.
3. The old address is gone.

**The $25 cap is there for this reason.** An unsaved wallet shows a warning in the Receive flow if you try to receive more than $25. Save your wallet before receiving significant funds.

---

## Journey 4 — Moved to Windows (C.j4)

**Trigger:** You had a Mac wallet saved with Touch ID. You now use a Windows machine. iCloud Keychain does not work on Windows, so your passkey is not available there.

**What survives:** Your wallet, via your BIP39 paper phrase.

**What's lost:** Touch ID access on this machine until you enroll Windows Hello.

**Steps:**
1. On your Windows machine, go to `/u/restore`.
2. Enter your 12 BIP39 words.
3. Tap **Restore**. Your wallet appears at the same address.
4. Tap **Save with Windows Hello** to protect it on this machine.
5. After enrollment, the wallet is protected by Windows Hello going forward.

Your Mac wallet is unchanged. You now have two enrolled devices.

---

## Journey 5 — Compromised passkey: revoke and re-seed (C.j5)

**Trigger:** You believe a passkey credential is compromised — e.g. a device was stolen and not remote-wiped.

**What survives:** Your wallet, via your BIP39 paper phrase.

**What you do:**
1. On a trusted device, go to `/u/devices`.
2. Find the compromised device in the list. Tap **Remove**.
3. Confirm the removal in the dialog.
4. The device's credential is revoked from the list and the server backup.
5. Go to `/u/restore`. Enter your 12 BIP39 words.
6. Tap **Save with Touch ID** to re-enroll on this trusted device.

The old credential no longer works. Your funds are safe because the seed is derived from BIP39, not stored in the passkey.

---

## Journey 6 — Cross-ecosystem: Mac and Windows both enrolled (C.j6)

**Trigger:** You use a Mac at home and a Windows PC at work. You want both to have biometric access to the same wallet.

**What this looks like when done:** Two `passkey-prf` entries in your wallet record — one for Touch ID, one for Windows Hello. Both unlock the same seed and the same address.

**Steps:**
1. Set up on Mac first (Journey 1 or normal first-use).
2. On Windows, go to `/u/restore` and enter your 12 BIP39 words.
3. Tap **Save with Windows Hello**.
4. Windows Hello enrolls a new passkey wrapping for the same seed.

Now either device can unlock the wallet independently. Losing one device does not affect the other.

---

## What survives and what doesn't — summary

| Scenario | Wallet recoverable? | How |
|---|---|---|
| Same Apple ID, new iPhone | Yes | iCloud Keychain passkey sync |
| Lost all devices, have paper phrase | Yes | BIP39 restore at `/u/restore` |
| Never saved, browser cleared | No | No recovery path |
| Moved to Windows, have paper phrase | Yes | BIP39 restore + new passkey |
| Compromised passkey, have paper phrase | Yes | Revoke device + BIP39 restore |
| Two ecosystems, one seed | Yes | BIP39 restore on each, enroll both |

The paper phrase is the root of everything. Write it down, store it offline, never photograph it.
