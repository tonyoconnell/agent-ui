/**
 * vault/sync.ts — cloud sync wiring for the vault.
 *
 * - `syncToCloud()` — fire-and-forget PUT of the current vault as an
 *   encrypted envelope. Requires unlocked session + signed-in Better Auth.
 *   Called after every wallet mutation.
 * - `fetchCloudBlob()` — GET the server's envelope (200 / 404 / 401).
 * - `restoreFromCloud(phrase)` — fetch + decrypt + seed IndexedDB.
 *
 * The server never holds plaintext. Decryption needs the recovery phrase
 * (cold restore) or the in-memory master key (hot re-sync).
 */

import { VaultError } from './types'
import * as Vault from './vault'
import { onMutation } from './vault'

export interface CloudBlob {
  blob: string
  version: number
  updated_at: number
}

/**
 * Push the current vault to the server. No-op if the vault is locked or
 * the user isn't signed in. Swallows network errors — callers treat this
 * as best-effort background work.
 */
export async function syncToCloud(): Promise<{ ok: boolean; reason?: string }> {
  if (Vault.isLocked()) return { ok: false, reason: 'locked' }

  Vault.notifySyncStart()

  let blob: string
  try {
    blob = await Vault.exportSyncBlob()
  } catch (err) {
    Vault.notifySyncEnd()
    return { ok: false, reason: `export: ${(err as Error).message}` }
  }

  try {
    const res = await fetch('/api/vault/sync', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ blob, version: 1 }),
    })
    Vault.notifySyncEnd()
    if (res.status === 401) return { ok: false, reason: 'unauthenticated' }
    if (!res.ok) return { ok: false, reason: `http ${res.status}` }
    return { ok: true }
  } catch (err) {
    Vault.notifySyncEnd()
    return { ok: false, reason: `network: ${(err as Error).message}` }
  }
}

/**
 * Fetch the cloud envelope for the signed-in user. Returns null on 404
 * (signed in but never synced). Throws on 401 so callers can redirect
 * to sign-in; returns null on other errors.
 */
export async function fetchCloudBlob(): Promise<CloudBlob | null> {
  const res = await fetch('/api/vault/fetch', {
    method: 'GET',
    credentials: 'same-origin',
  })
  if (res.status === 401) throw new Error('unauthenticated')
  if (res.status === 404) return null
  if (!res.ok) throw new VaultError('Your backup is temporarily unavailable — try again in a moment', 'server-error')
  return (await res.json()) as CloudBlob
}

/**
 * Full cold restore: fetch the envelope, decrypt with the recovery phrase,
 * seed IndexedDB, open a session. Caller should prompt for passkey
 * enrollment after this resolves.
 */
export async function restoreFromCloud(recoveryPhrase: string): Promise<{ walletsRestored: number }> {
  const cloud = await fetchCloudBlob()
  if (!cloud) throw new Error('no cloud backup found for this account')
  return Vault.importSyncBlob(cloud.blob, recoveryPhrase)
}

/**
 * True if the signed-in user has a cloud backup on the server. Cheap HEAD-
 * equivalent; used to decide whether to offer a restore flow on sign-in.
 */
export async function hasCloudBlob(): Promise<boolean> {
  try {
    const blob = await fetchCloudBlob()
    return blob !== null
  } catch {
    return false
  }
}

// Auto-register: every vault mutation triggers a fire-and-forget upload.
// Re-entry is safe — syncToCloud short-circuits on locked / 401.
let registered = false
function ensureRegistered(): void {
  if (registered) return
  registered = true
  onMutation(() => {
    void syncToCloud()
  })
}
ensureRegistered()
