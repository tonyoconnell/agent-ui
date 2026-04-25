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

import { base64ToBytes, bytesToBase64, encryptUnderMaster, importMasterSecret } from './crypto'
import { guessAuthenticatorLabel } from './passkey'
import { generateRecoveryPhrase, recoveryToVaultSecret } from './recovery'
import { fetchCloudBlob } from './sync'
import { type EncryptedRecord, HKDF_DOMAINS, type PasskeyEnrollment, VaultError } from './types'
import * as Vault from './vault'

const WRAP_INFO = 'vault.passkey-cloud.wrap.v1'

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

  // Capture PRF via an immediate assertion — registration may not surface PRF
  // results on all platforms, but assertion always does.
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
  let prfSecret: Uint8Array | null = null
  try {
    const verifyCred = (await navigator.credentials.get({ publicKey: verifyOpts })) as PublicKeyCredential | null
    if (verifyCred) prfSecret = extractPrfSecret(verifyCred)
  } catch (e) {
    const name = (e as { name?: string })?.name
    if (name === 'NotAllowedError' || name === 'AbortError') {
      throw new VaultError('PRF capture cancelled', 'passkey-cancelled')
    }
  }
  if (!prfSecret) throw new VaultError('authenticator did not return PRF output', 'passkey-unsupported')

  const master = await Vault.exportRawMaster()
  const wrapKey = await importMasterSecret(prfSecret)
  const record = await encryptUnderMaster(bytesToBase64(master), wrapKey, WRAP_INFO)
  const wrappedMaster = serializeRecord(record)

  const regRes = await fetch('/api/auth/passkey-webauthn/register', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      challengeToken,
      response: serializeAttestation(credential),
      wrappedMaster,
      label,
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
  const optsRes = await fetch('/api/auth/passkey-webauthn/register-anonymous/options', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
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

  // Derive the master from a fresh BIP-39 recovery phrase (the one secret
  // the user MUST write down — it's the only way back if both the passkey
  // and every synced copy of the vault disappear). Then wrap it TWICE under
  // two different HKDF info strings — one for the cloud envelope, one for
  // the local vault's enrollment record. Same PRF secret drives both; HKDF's
  // `info` domain separates them.
  const recoveryPhrase = generateRecoveryPhrase()
  const master = await recoveryToVaultSecret(recoveryPhrase)
  const wrapKey = await importMasterSecret(prfSecret)

  const cloudRecord = await encryptUnderMaster(bytesToBase64(master), wrapKey, WRAP_INFO)
  const cloudWrapped = serializeRecord(cloudRecord)

  const credentialId = new Uint8Array(credential.rawId)
  const credIdB64 = arrayBufferToB64url(credentialId)
  // Local vault's unlock path decrypts under info `<masterCheck>.passkey.<credId>`
  // (see vault/vault.ts unlockWithPasskey). Reuse exactly the same info string
  // so the same PRF secret unlocks locally too.
  const localInfo = `${HKDF_DOMAINS.masterCheck()}.passkey.${credIdB64}`
  const localWrapped = await encryptUnderMaster(bytesToBase64(master), wrapKey, localInfo)

  const enrollment: PasskeyEnrollment & { wrappedMaster: typeof localWrapped } = {
    credentialId,
    // Store the global PRF salt as bytes so unlockWithPasskey can re-derive
    // the same PRF output on future unlocks.
    prfSalt: b64urlToUint8Array(prfSalt),
    authenticatorLabel: guessAuthenticatorLabel(),
    createdAt: Date.now(),
    wrappedMaster: localWrapped,
  }

  const regRes = await fetch('/api/auth/passkey-webauthn/register-anonymous', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      challengeToken,
      response: serializeAttestation(credential),
      wrappedMaster: cloudWrapped,
      userHandle,
    }),
  })
  if (!regRes.ok) {
    const body = await regRes.text()
    throw new VaultError(
      `register-anonymous failed [HTTP ${regRes.status}]: ${body || '(empty body)'}`,
      'passkey-unsupported',
    )
  }

  // A brand-new identity implies any existing local vault is orphan state
  // from a previous account. Wipe before adopting so `adoptMaster` doesn't
  // short-circuit on `hasVault()` and leave the user stuck on the old keys.
  if (await Vault.hasVault()) {
    await Vault.wipeAll()
  }

  // Adopt master locally AND record the enrollment so offline unlock works.
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

  const publicKey: PublicKeyCredentialRequestOptions = {
    challenge: b64urlToArrayBuffer(options.challenge) as unknown as BufferSource,
    rpId: options.rpId,
    allowCredentials:
      options.allowCredentials?.map((c) => ({
        id: b64urlToArrayBuffer(c.id) as unknown as BufferSource,
        type: c.type,
      })) ?? [],
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

  const verifyRes = await fetch('/api/auth/passkey-webauthn/authenticate', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeToken, response: serializeAssertion(credential) }),
  })
  if (!verifyRes.ok) {
    const body = await verifyRes.text()
    // Server doesn't know this credential — pivot to create flow. The user
    // will be prompted once more (WebAuthn.create) and land in a brand-new
    // account tied to a freshly-generated vault master.
    if (verifyRes.status === 401) {
      return createAccountWithPasskey()
    }
    const msg = `passkey verify failed [HTTP ${verifyRes.status}]: ${body || '(empty body)'}`
    console.error('[passkey-cloud]', msg)
    throw new VaultError(msg, 'passkey-unsupported')
  }
  const { wrappedMaster } = (await verifyRes.json()) as { wrappedMaster: string }

  const wrapKey = await importMasterSecret(prfSecret)
  const record = deserializeRecord(wrappedMaster)
  const { decryptUnderMaster } = await import('./crypto')
  const masterB64 = await decryptUnderMaster(record, wrapKey)
  const master = base64ToBytes(masterB64)

  // Sign-out only clears the session row — IDB meta + wallets are preserved.
  // If a local vault already exists, just re-open the session with the known
  // master rather than trying to re-import the cloud blob (which throws when
  // vault exists) or adoptMaster (which no-ops when vault exists).
  if (await Vault.hasVault()) {
    await Vault.unlockWithMaster(master)
    return { walletsRestored: 0 }
  }

  const cloud = await fetchCloudBlob()
  if (!cloud) {
    await Vault.adoptMaster(master)
    return { walletsRestored: 0 }
  }
  return Vault.importSyncBlobWithMaster(cloud.blob, master)
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

function serializeRecord(record: EncryptedRecord): string {
  return JSON.stringify({
    info: record.info,
    iv: bytesToBase64(record.iv),
    ciphertext: bytesToBase64(record.ciphertext),
    version: record.version,
  })
}

function deserializeRecord(s: string): EncryptedRecord {
  const o = JSON.parse(s) as { info: string; iv: string; ciphertext: string; version: number }
  return {
    info: o.info,
    iv: base64ToBytes(o.iv),
    ciphertext: base64ToBytes(o.ciphertext),
    version: o.version,
  }
}
