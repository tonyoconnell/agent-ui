/**
 * vault/passkey-cloud.ts — cross-device passkey sign-in + vault restore.
 *
 * Pairs with `src/lib/auth-plugins/passkey-webauthn.ts` on the server.
 *
 * We call `navigator.credentials.create/get` directly rather than going
 * through @simplewebauthn/browser — the SWA helpers can't round-trip the
 * PRF extension's binary inputs and strip `clientExtensionResults` on the
 * way out. Doing the WebAuthn ceremony here (with our own base64url ↔
 * ArrayBuffer conversions) is only a handful of extra lines and matches
 * the existing pattern in `vault/passkey.ts`.
 */

import { masterToUserIdPub, prfToMaster } from './crypto'
import { guessAuthenticatorLabel } from './passkey'
import { masterToRecoveryPhrase } from './recovery'
import { fetchCloudBlob } from './sync'
import { type PasskeyEnrollment, VaultError } from './types'
import * as Vault from './vault'

const DEVICE_HANDLE_KEY = 'one_vault_device_handle'

/**
 * Stable per-device user handle stored in localStorage. Used as the WebAuthn
 * `userID` so that re-registering on the same device replaces the existing
 * passkey in the authenticator (Apple Passwords, Google PM) instead of
 * creating a new one alongside it. Not a secret — it's a public correlation
 * handle, not a cryptographic key.
 */
function getOrCreateDeviceHandle(): string {
  try {
    const stored = localStorage.getItem(DEVICE_HANDLE_KEY)
    if (stored) return stored
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    const handle = arrayBufferToB64url(bytes)
    localStorage.setItem(DEVICE_HANDLE_KEY, handle)
    return handle
  } catch {
    // localStorage unavailable (SSR / private browsing) — generate ephemeral.
    return arrayBufferToB64url(crypto.getRandomValues(new Uint8Array(16)))
  }
}

// ─── base64url helpers ────────────────────────────────────────────────────

function b64urlToArrayBuffer(s: string): ArrayBuffer {
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad)
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes.buffer
}

function arrayBufferToB64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function extractPrfSecret(cred: PublicKeyCredential): Uint8Array | null {
  const ext = cred.getClientExtensionResults() as {
    prf?: { results?: { first?: ArrayBuffer | Uint8Array } }
  }
  const first = ext?.prf?.results?.first
  if (!first) return null
  const bytes = first instanceof Uint8Array ? new Uint8Array(first) : new Uint8Array(first)
  return bytes.byteLength === 32 ? bytes : null
}

// ─── shapes returned by the server plugin ─────────────────────────────────

interface AuthOptionsResponse {
  options: {
    challenge: string
    rpId: string
    timeout?: number
    userVerification?: UserVerificationRequirement
    allowCredentials?: { id: string; type: 'public-key'; transports?: string[] }[]
  }
  challengeToken: string
  prfSalt: string // base64url
}

interface RegOptionsResponse {
  options: {
    challenge: string
    rp: { name: string; id: string }
    user: { id: string; name: string; displayName: string }
    pubKeyCredParams: { type: 'public-key'; alg: number }[]
    timeout?: number
    attestation?: AttestationConveyancePreference
    authenticatorSelection?: AuthenticatorSelectionCriteria
    excludeCredentials?: { id: string; type: 'public-key' }[]
  }
  challengeToken: string
  prfSalt: string // base64url
}

// ─── registration ─────────────────────────────────────────────────────────

/**
 * Register a WebAuthn credential with the server and wrap the vault master
 * under the resulting PRF secret. Requires an unlocked vault and an active
 * Better Auth session.
 */
export async function registerPasskeyForSignin(label?: string): Promise<{ credId: string }> {
  if (Vault.isLocked()) {
    throw new VaultError('vault must be unlocked to register a sign-in passkey', 'locked')
  }

  const optsRes = await fetch('/api/auth/passkey-webauthn/register/options', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  if (!optsRes.ok) {
    throw new VaultError(`register options failed: ${await optsRes.text()}`, 'passkey-unsupported')
  }
  const { options, challengeToken, prfSalt } = (await optsRes.json()) as RegOptionsResponse

  const publicKey: PublicKeyCredentialCreationOptions = {
    rp: options.rp,
    user: {
      id: b64urlToArrayBuffer(options.user.id) as unknown as BufferSource,
      name: options.user.name,
      displayName: options.user.displayName,
    },
    challenge: b64urlToArrayBuffer(options.challenge) as unknown as BufferSource,
    pubKeyCredParams: options.pubKeyCredParams,
    timeout: options.timeout,
    attestation: options.attestation,
    authenticatorSelection: options.authenticatorSelection,
    excludeCredentials: options.excludeCredentials?.map((c) => ({
      id: b64urlToArrayBuffer(c.id) as unknown as BufferSource,
      type: c.type,
    })),
    extensions: {
      prf: { eval: { first: b64urlToArrayBuffer(prfSalt) } },
    } as PublicKeyCredentialCreationOptions['extensions'],
  }

  let credential: PublicKeyCredential
  try {
    const raw = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null
    if (!raw) throw new VaultError('passkey registration returned no credential', 'passkey-unsupported')
    credential = raw
  } catch (e) {
    const name = (e as { name?: string })?.name
    if (name === 'NotAllowedError' || name === 'AbortError') {
      throw new VaultError('passkey registration cancelled', 'passkey-cancelled')
    }
    throw new VaultError(`passkey registration failed: ${(e as Error).message}`, 'passkey-unsupported')
  }

  // Apple Passwords and recent Chromium return PRF directly from .create().
  // Try that first; only fall back to an assertion if the platform didn't.
  let prfSecret = extractPrfSecret(credential)
  if (!prfSecret) {
    const verifyOpts: PublicKeyCredentialRequestOptions = {
      challenge: b64urlToArrayBuffer(options.challenge) as unknown as BufferSource,
      rpId: options.rp.id,
      allowCredentials: [{ id: credential.rawId as unknown as BufferSource, type: 'public-key' }],
      userVerification: 'required',
      timeout: 60_000,
      extensions: {
        prf: { eval: { first: b64urlToArrayBuffer(prfSalt) } },
      } as PublicKeyCredentialRequestOptions['extensions'],
    }
    try {
      const verifyCred = (await navigator.credentials.get({ publicKey: verifyOpts })) as PublicKeyCredential | null
      if (verifyCred) prfSecret = extractPrfSecret(verifyCred)
    } catch (e) {
      const name = (e as { name?: string })?.name
      if (name === 'NotAllowedError' || name === 'AbortError') {
        throw new VaultError('PRF capture cancelled', 'passkey-cancelled')
      }
    }
  }
  if (!prfSecret) throw new VaultError('authenticator did not return PRF output', 'passkey-unsupported')

  // Derive the stable identity key from the same PRF — server uses it to
  // anchor the cred_id to a deterministic user (Gap 4).
  const master = await prfToMaster(prfSecret)
  const user_id_pub = await masterToUserIdPub(master)

  // No wrappedMaster needed — the PRF is the master derivation path.
  // Server stores credential metadata only (pub_key, sign_count) for verification.
  const regRes = await fetch('/api/auth/passkey-webauthn/register', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      challengeToken,
      response: serializeAttestation(credential),
      label,
      user_id_pub,
    }),
  })
  if (!regRes.ok) {
    throw new VaultError(`register verify failed: ${await regRes.text()}`, 'passkey-unsupported')
  }
  const { credId } = (await regRes.json()) as { credId: string }
  return { credId }
}

// ─── sign-in ──────────────────────────────────────────────────────────────

/**
 * Create a brand-new account from a fresh passkey. Used as the auto-pivot
 * when `signInWithPasskey()` discovers that no account matches the chosen
 * credential. Generates a random 32-byte vault master, runs WebAuthn
 * registration with PRF, wraps the master under the PRF-derived key, and
 * posts everything to `/register-anonymous` which creates a user + hint +
 * session in one shot.
 */
export async function createAccountWithPasskey(): Promise<{
  walletsRestored: number
  created: true
  recoveryPhrase: string
}> {
  // Read existing enrolled passkey IDs BEFORE any wipe so we can pass them
  // as excludeCredentials. This prevents the OS from stacking up duplicate
  // passkeys for the same authenticator — if the device already has one of
  // these credentials, navigator.credentials.create throws InvalidStateError
  // and we surface a friendly error instead of creating another passkey.
  const existingCredIds = await Vault.getEnrolledPasskeyCredentialIds()

  const optsRes = await fetch('/api/auth/passkey-webauthn/register-anonymous/options', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    // Pass the stable device handle so the server uses the same WebAuthn
    // userID every time. Authenticators treat same userID + same RP as a
    // replacement (overwrite) rather than a new credential — preventing
    // accumulation in Apple Passwords / Google PM.
    body: JSON.stringify({ deviceHandle: getOrCreateDeviceHandle() }),
  })
  if (!optsRes.ok) {
    const body = await optsRes.text()
    throw new VaultError(
      `register-anonymous options failed [HTTP ${optsRes.status}]: ${body || '(empty body)'}`,
      'passkey-unsupported',
    )
  }
  const { options, challengeToken, prfSalt, userHandle } = (await optsRes.json()) as RegOptionsResponse & {
    userHandle: string
  }

  const publicKey: PublicKeyCredentialCreationOptions = {
    rp: options.rp,
    user: {
      id: b64urlToArrayBuffer(options.user.id) as unknown as BufferSource,
      name: options.user.name,
      displayName: options.user.displayName,
    },
    challenge: b64urlToArrayBuffer(options.challenge) as unknown as BufferSource,
    pubKeyCredParams: options.pubKeyCredParams,
    timeout: options.timeout,
    attestation: options.attestation,
    authenticatorSelection: options.authenticatorSelection,
    excludeCredentials: [
      // Server-side exclusions (existing registered credentials for this user)
      ...(options.excludeCredentials?.map((c) => ({
        id: b64urlToArrayBuffer(c.id) as unknown as BufferSource,
        type: c.type as 'public-key',
      })) ?? []),
      // Client-side: local vault's enrolled passkeys — prevents OS from creating
      // a duplicate passkey on the same authenticator.
      ...existingCredIds.map((id) => ({
        id: id.buffer as unknown as BufferSource,
        type: 'public-key' as const,
      })),
    ],
    extensions: {
      prf: { eval: { first: b64urlToArrayBuffer(prfSalt) } },
    } as PublicKeyCredentialCreationOptions['extensions'],
  }

  let credential: PublicKeyCredential
  try {
    const raw = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null
    if (!raw) throw new VaultError('passkey registration returned no credential', 'passkey-unsupported')
    credential = raw
  } catch (e) {
    const name = (e as { name?: string })?.name
    if (name === 'NotAllowedError' || name === 'AbortError') {
      throw new VaultError('passkey registration cancelled', 'passkey-cancelled')
    }
    // InvalidStateError = this authenticator already has one of the excluded
    // credentials — the user already has a passkey. Surface a clear error.
    if (name === 'InvalidStateError') {
      throw new VaultError(
        'A passkey for this device already exists — use it to sign in instead of creating a new one',
        'passkey-cancelled',
      )
    }
    throw new VaultError(`passkey registration failed: ${(e as Error).message}`, 'passkey-unsupported')
  }

  // PRF on `.create` — Apple Passwords + recent Chromium return the PRF
  // output directly in clientExtensionResults. If we get it here, we're
  // done. If not (older Chrome, some Windows configurations), fall back
  // to a quick `.get` to capture it. Saves one Touch ID on the happy path.
  let prfSecret = extractPrfSecret(credential)
  if (!prfSecret) {
    const verifyOpts: PublicKeyCredentialRequestOptions = {
      challenge: b64urlToArrayBuffer(options.challenge) as unknown as BufferSource,
      rpId: options.rp.id,
      allowCredentials: [{ id: credential.rawId as unknown as BufferSource, type: 'public-key' }],
      userVerification: 'required',
      timeout: 60_000,
      extensions: {
        prf: { eval: { first: b64urlToArrayBuffer(prfSalt) } },
      } as PublicKeyCredentialRequestOptions['extensions'],
    }
    try {
      const verifyCred = (await navigator.credentials.get({ publicKey: verifyOpts })) as PublicKeyCredential | null
      if (verifyCred) prfSecret = extractPrfSecret(verifyCred)
    } catch (e) {
      const name = (e as { name?: string })?.name
      if (name === 'NotAllowedError' || name === 'AbortError') {
        throw new VaultError('PRF capture cancelled', 'passkey-cancelled')
      }
    }
  }
  if (!prfSecret) throw new VaultError('authenticator did not return PRF output', 'passkey-unsupported')

  // Derive master deterministically from PRF — same passkey = same master = same wallets, forever.
  // No random entropy, no server-stored secret. The biometric IS the vault.
  // Computed BEFORE the verify POST so user_id_pub can ride along: server uses it
  // as the stable identity key (replaces deviceHandle as identity, kept for back-compat).
  const master = await prfToMaster(prfSecret)
  const user_id_pub = await masterToUserIdPub(master)

  // The recovery phrase is the master encoded as 24 BIP-39 words.
  // Deterministic: same master → same words. User writes this down as emergency backup.
  const recoveryPhrase = masterToRecoveryPhrase(master)

  const credentialId = new Uint8Array(credential.rawId)
  const enrollment: PasskeyEnrollment = {
    credentialId,
    prfSalt: b64urlToUint8Array(prfSalt),
    authenticatorLabel: guessAuthenticatorLabel(),
    createdAt: Date.now(),
  }

  const regRes = await fetch('/api/auth/passkey-webauthn/register-anonymous', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      challengeToken,
      response: serializeAttestation(credential),
      userHandle,
      user_id_pub,
      deviceHandle: getOrCreateDeviceHandle(),
    }),
  })
  if (!regRes.ok) {
    const body = await regRes.text()
    throw new VaultError(
      `register-anonymous failed [HTTP ${regRes.status}]: ${body || '(empty body)'}`,
      'passkey-unsupported',
    )
  }

  // Try to restore from cloud blob BEFORE touching the local vault.
  // importSyncBlobWithMaster requires hasVault()===false, so this must come first.
  // Works when the device handle maps to an existing account (re-registration
  // on same device, or browser data cleared but passkey survived in iCloud).
  try {
    const cloud = await fetchCloudBlob()
    if (cloud) {
      await Vault.wipeAll() // ensure clean slate so import doesn't throw
      const { walletsRestored } = await Vault.importSyncBlobWithMaster(cloud.blob, master)
      // Blob restored — enroll this credential for offline unlock.
      await Vault.addEnrollmentToExistingVault(enrollment)
      return { walletsRestored, created: true, recoveryPhrase }
    }
  } catch (err) {
    // Re-throw server errors — wrong master / missing backup are expected and
    // fall through to the fresh-vault path, but a real server failure might
    // hide a backup that we'd otherwise overwrite.
    if (err instanceof VaultError && err.code === 'server-error') throw err
    // No cloud backup or import failed (wrong master / new account) — fresh start.
  }

  // Fresh vault path — wipe any orphan state then adopt the new master.
  if (await Vault.hasVault()) {
    await Vault.wipeAll()
  }
  await Vault.adoptMaster(master, enrollment)

  return { walletsRestored: 0, created: true, recoveryPhrase }
}

function b64urlToUint8Array(s: string): Uint8Array {
  return new Uint8Array(b64urlToArrayBuffer(s))
}

/**
 * One-tap sign in + vault restore. Uses a discoverable credential so the user
 * picks the right passkey from the OS picker. On success: Better Auth session
 * cookie set, cloud blob decrypted into IndexedDB, wallets restored.
 *
 * If no account exists for the chosen credential (401), auto-pivots to
 * `createAccountWithPasskey()` — which requires a second WebAuthn ceremony
 * because we need an attestation (not just an assertion) to register.
 */
export async function signInWithPasskey(): Promise<{
  walletsRestored: number
  created?: true
  recoveryPhrase?: string
  blobMismatch?: true
}> {
  const optsRes = await fetch('/api/auth/passkey-webauthn/authenticate/options', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  if (!optsRes.ok) {
    const body = await optsRes.text()
    throw new VaultError(
      `authenticate options failed [HTTP ${optsRes.status}]: ${body || '(empty body)'}`,
      'passkey-unsupported',
    )
  }
  const { options, challengeToken, prfSalt } = (await optsRes.json()) as AuthOptionsResponse

  // If the local vault already has enrolled passkeys, pass them as
  // allowCredentials so the browser uses exactly that credential without
  // showing the "Google PM vs Apple Passwords" picker. Only fall back to
  // discoverable (empty allowCredentials) when there's no local hint.
  const localCredIds = await Vault.getEnrolledPasskeyCredentialIds()
  const allowCredentials =
    localCredIds.length > 0
      ? localCredIds.map((id) => ({
          id: id.buffer as unknown as BufferSource,
          type: 'public-key' as const,
        }))
      : (options.allowCredentials?.map((c) => ({
          id: b64urlToArrayBuffer(c.id) as unknown as BufferSource,
          type: c.type as 'public-key',
        })) ?? [])

  const publicKey: PublicKeyCredentialRequestOptions = {
    challenge: b64urlToArrayBuffer(options.challenge) as unknown as BufferSource,
    rpId: options.rpId,
    allowCredentials,
    userVerification: options.userVerification ?? 'required',
    timeout: options.timeout,
    extensions: {
      prf: { eval: { first: b64urlToArrayBuffer(prfSalt) } },
    } as PublicKeyCredentialRequestOptions['extensions'],
  }

  let credential: PublicKeyCredential | null = null
  try {
    credential = (await navigator.credentials.get({ publicKey })) as PublicKeyCredential | null
  } catch (e) {
    const name = (e as { name?: string })?.name
    // User cancelled OR there's nothing to sign in with on this device. Do
    // NOT auto-pivot — a synced passkey from another device might still be
    // available, just not chosen yet, and creating a duplicate account would
    // be destructive. Bubble up; the caller can offer a "create new" path.
    if (name === 'NotAllowedError' || name === 'AbortError') {
      throw new VaultError('passkey sign-in cancelled', 'passkey-cancelled')
    }
    if (name === 'InvalidStateError' || name === 'NotFoundError') {
      throw new VaultError('no passkey available on this device', 'passkey-cancelled')
    }
    throw new VaultError(`passkey sign-in failed: ${(e as Error).message}`, 'passkey-unsupported')
  }
  if (!credential) {
    throw new VaultError('no passkey selected', 'passkey-cancelled')
  }

  const prfSecret = extractPrfSecret(credential)
  if (!prfSecret) throw new VaultError('authenticator did not return PRF output', 'passkey-unsupported')

  // Derive master + user_id_pub up front. Same biometric → same master → same
  // user_id_pub on every device, forever. Sending user_id_pub on /authenticate
  // lets the server fall back to it if cred_id lookup misses (Gap 4).
  const master = await prfToMaster(prfSecret)
  const user_id_pub = await masterToUserIdPub(master)

  const verifyRes = await fetch('/api/auth/passkey-webauthn/authenticate', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeToken, response: serializeAssertion(credential), user_id_pub }),
  })
  if (!verifyRes.ok) {
    const body = await verifyRes.text()
    // Server doesn't know this credential.
    if (verifyRes.status === 401) {
      // If a local vault exists, the server lost its cred_id row (e.g. dev
      // restart cleared the store, or D1 was reset). Self-heal: re-attest
      // this credential so the server can re-insert the row keyed by the
      // deterministic user_id_pub. Same biometric → same master → same
      // user_id_pub → same vault_blob. The local vault is intact; we just
      // unlock it from the master we already derived.
      if (await Vault.hasVault()) {
        const healed = await healPasskey(user_id_pub, options.rpId)
        if (healed) {
          await Vault.unlockWithMaster(master)
          return { walletsRestored: 0 }
        }
        throw new VaultError(
          'Could not recover the server session for this passkey. Restore from your recovery phrase to continue.',
          'passkey-unsupported',
        )
      }
      // No local vault — server is the only source of truth for this user.
      // Pivot to create flow: a brand-new account tied to a fresh master.
      return createAccountWithPasskey()
    }
    const msg = `passkey verify failed [HTTP ${verifyRes.status}]: ${body || '(empty body)'}`
    console.error('[passkey-cloud]', msg)
    throw new VaultError(msg, 'passkey-unsupported')
  }
  // Server verified the credential and minted a session — that's all it does now.
  // The master is derived client-side from the PRF: same passkey = same master, always.
  await verifyRes.json()

  // Build an enrollment record so this credential can drive local unlock later.
  const enrollment: PasskeyEnrollment = {
    credentialId: new Uint8Array(credential.rawId),
    prfSalt: b64urlToUint8Array(prfSalt),
    authenticatorLabel: guessAuthenticatorLabel(),
    createdAt: Date.now(),
  }

  // Sign-out only clears the session row — IDB meta + wallets are preserved.
  // If a local vault already exists, just re-open the session with the known
  // master rather than trying to re-import the cloud blob (which throws when
  // vault exists) or adoptMaster (which no-ops when vault exists).
  if (await Vault.hasVault()) {
    await Vault.unlockWithMaster(master)
    return { walletsRestored: 0 }
  }

  // fetchCloudBlob throws on 5xx — let that propagate so the caller surfaces
  // "server unavailable, try again" instead of silently creating a blank vault.
  // It returns null only on 404 (no backup for this account yet).
  const cloud = await fetchCloudBlob()
  if (!cloud) {
    await Vault.adoptMaster(master, enrollment)
    return { walletsRestored: 0 }
  }

  try {
    const result = await Vault.importSyncBlobWithMaster(cloud.blob, master)
    // Blob restored — enroll this credential so offline unlock works on this device.
    await Vault.addEnrollmentToExistingVault(enrollment)
    return result
  } catch {
    // Cloud blob exists but can't be decrypted with this credential's master.
    // This happens when the user has multiple passkeys and chose one that
    // doesn't match the vault that was originally set up. Fall back to a
    // fresh local vault — wallets can be restored via the recovery phrase.
    await Vault.adoptMaster(master, enrollment)
    return { walletsRestored: 0, blobMismatch: true }
  }
}

// ─── credential serialization (matches SWA's on-wire shape) ───────────────

function serializeAttestation(credential: PublicKeyCredential): Record<string, unknown> {
  const r = credential.response as AuthenticatorAttestationResponse
  return {
    id: credential.id,
    rawId: arrayBufferToB64url(credential.rawId),
    type: credential.type,
    authenticatorAttachment: credential.authenticatorAttachment ?? undefined,
    response: {
      clientDataJSON: arrayBufferToB64url(r.clientDataJSON),
      attestationObject: arrayBufferToB64url(r.attestationObject),
      transports: typeof r.getTransports === 'function' ? r.getTransports() : undefined,
      publicKeyAlgorithm: typeof r.getPublicKeyAlgorithm === 'function' ? r.getPublicKeyAlgorithm() : undefined,
      publicKey:
        typeof r.getPublicKey === 'function' && r.getPublicKey()
          ? arrayBufferToB64url(r.getPublicKey() as ArrayBuffer)
          : undefined,
      authenticatorData:
        typeof r.getAuthenticatorData === 'function' ? arrayBufferToB64url(r.getAuthenticatorData()) : undefined,
    },
    clientExtensionResults: credential.getClientExtensionResults(),
  }
}

function serializeAssertion(credential: PublicKeyCredential): Record<string, unknown> {
  const r = credential.response as AuthenticatorAssertionResponse
  return {
    id: credential.id,
    rawId: arrayBufferToB64url(credential.rawId),
    type: credential.type,
    authenticatorAttachment: credential.authenticatorAttachment ?? undefined,
    response: {
      clientDataJSON: arrayBufferToB64url(r.clientDataJSON),
      authenticatorData: arrayBufferToB64url(r.authenticatorData),
      signature: arrayBufferToB64url(r.signature),
      userHandle: r.userHandle ? arrayBufferToB64url(r.userHandle) : undefined,
    },
    clientExtensionResults: credential.getClientExtensionResults(),
  }
}

// ─── self-heal ────────────────────────────────────────────────────────────

/**
 * Re-attest an existing credential so the server can re-insert its cred_id row
 * keyed by `user_id_pub`. Used when the server returned 401 on /authenticate
 * but the local vault is intact — the master is already in hand, the only
 * thing missing is the server-side identity record.
 *
 * Same biometric → same master → same `user_id_pub`. The server uses
 * `verifyRegistrationResponse` to validate the attestation, then upserts the
 * cred_id row pointing at the same logical user. No new account is minted.
 *
 * Returns `true` on 200, `false` on any failure. Never throws — the caller
 * decides what to surface to the user when heal can't recover.
 */
async function healPasskey(user_id_pub: string, rpId: string): Promise<boolean> {
  try {
    const optsRes = await fetch('/api/auth/passkey-webauthn/heal/options', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id_pub }),
    })
    if (!optsRes.ok) return false
    const { options, challengeToken } = (await optsRes.json()) as RegOptionsResponse

    const publicKey: PublicKeyCredentialCreationOptions = {
      rp: options.rp ?? { id: rpId, name: rpId },
      user: {
        id: b64urlToArrayBuffer(options.user.id) as unknown as BufferSource,
        name: options.user.name,
        displayName: options.user.displayName,
      },
      challenge: b64urlToArrayBuffer(options.challenge) as unknown as BufferSource,
      pubKeyCredParams: options.pubKeyCredParams,
      timeout: options.timeout,
      attestation: options.attestation,
      authenticatorSelection: options.authenticatorSelection,
      // No excludeCredentials — we WANT the OS to recognise the existing
      // credential and re-attest it. Excluding it would force a duplicate.
    }

    let credential: PublicKeyCredential
    try {
      const raw = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null
      if (!raw) return false
      credential = raw
    } catch {
      return false
    }

    const healRes = await fetch('/api/auth/passkey-webauthn/heal', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challengeToken,
        response: serializeAttestation(credential),
        user_id_pub,
      }),
    })
    return healRes.ok
  } catch {
    return false
  }
}
