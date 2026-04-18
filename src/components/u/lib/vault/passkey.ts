// vault/passkey.ts — WebAuthn + PRF extension wrapper.
// Touch ID/Face ID/Windows Hello → deterministic 32-byte secret per enrollment.
// Caller never sees the credential — only the PRF output.

import type {
  PasskeyEnrollment,
  PasskeyUnlockResult,
  PasskeyCapabilities,
} from './types'
import { VaultError } from './types'

// ===== CONFIG =====

export const RP_NAME = 'ONE Vault'

// rpId MUST come from the live origin — a credential is bound to its rpId,
// so hardcoding would break dev/preview/prod parity.
function getRpId(): string {
  if (typeof window === 'undefined') {
    throw new VaultError('WebAuthn requires a browser window', 'passkey-unsupported')
  }
  return window.location.hostname
}

function assertSecureContext(): void {
  if (typeof window === 'undefined' || !window.isSecureContext) {
    throw new VaultError(
      'WebAuthn requires secure context (HTTPS or localhost)',
      'passkey-unsupported',
    )
  }
}

function assertWebAuthn(): void {
  if (
    typeof window === 'undefined' ||
    typeof window.PublicKeyCredential === 'undefined' ||
    !navigator.credentials
  ) {
    throw new VaultError('WebAuthn API not available', 'passkey-unsupported')
  }
}

// ===== CAPABILITY DETECTION =====

export async function detectCapabilities(): Promise<PasskeyCapabilities> {
  const webauthn =
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    !!navigator.credentials
  const secure = typeof window !== 'undefined' && !!window.isSecureContext

  let platformAuthenticator = false
  if (webauthn) {
    try {
      platformAuthenticator =
        await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    } catch {
      platformAuthenticator = false
    }
  }

  // No synchronous PRF flag exists. Treat webauthn + secure + platform
  // authenticator as a strong proxy; the enrollment flow verifies for real.
  const prf = webauthn && secure && platformAuthenticator

  return { webauthn, platformAuthenticator, prf }
}

// ===== HELPERS =====

function randomBytes(n: number): Uint8Array {
  const out = new Uint8Array(n)
  crypto.getRandomValues(out)
  return out
}

async function deriveUserHandle(userIdentifier: string): Promise<Uint8Array> {
  const bytes = new TextEncoder().encode(userIdentifier)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return new Uint8Array(digest) // 32 bytes, well under the 64-byte limit
}

export function isUserCancellation(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const name = (err as { name?: string }).name
  return name === 'NotAllowedError' || name === 'AbortError'
}

export function guessAuthenticatorLabel(): string {
  if (typeof navigator === 'undefined') return 'Platform authenticator'
  const ua = navigator.userAgent || ''
  const platform = (navigator as { platform?: string }).platform || ''

  // iOS — Face ID on modern devices, Touch ID on older
  if (/iPhone|iPad|iPod/.test(ua) || /iPhone|iPad|iPod/.test(platform)) {
    return /iPhone1[0-9]|iPad1[0-9]|iPhone X/.test(ua) ? 'Face ID' : 'Touch ID'
  }
  // macOS
  if (/Mac/.test(platform) || /Macintosh/.test(ua)) return 'Touch ID'
  // Windows
  if (/Windows/.test(ua) || /Win/.test(platform)) return 'Windows Hello'
  // Android
  if (/Android/.test(ua)) return 'Android Biometrics'
  return 'Platform authenticator'
}

function extractPrfSecret(cred: PublicKeyCredential): Uint8Array | null {
  const ext = cred.getClientExtensionResults() as {
    prf?: { results?: { first?: ArrayBuffer | Uint8Array } }
  }
  const first = ext?.prf?.results?.first
  if (!first) return null
  const bytes =
    first instanceof Uint8Array ? new Uint8Array(first) : new Uint8Array(first)
  return bytes.byteLength === 32 ? bytes : null
}

// ===== ENROLLMENT =====

export async function enrollPasskey(
  userIdentifier: string,
  userDisplayName: string,
): Promise<PasskeyEnrollment> {
  assertSecureContext()
  assertWebAuthn()

  const rpId = getRpId()
  const prfSalt = randomBytes(32)
  const challenge = randomBytes(32)
  const userHandle = await deriveUserHandle(userIdentifier)

  const publicKey: PublicKeyCredentialCreationOptions = {
    rp: { name: RP_NAME, id: rpId },
    user: {
      id: userHandle,
      name: userIdentifier,
      displayName: userDisplayName,
    },
    challenge,
    // ES256 + RS256 — the universally supported pair.
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 },
      { type: 'public-key', alg: -257 },
    ],
    authenticatorSelection: {
      // 'platform' → Touch ID / Face ID / Windows Hello first.
      authenticatorAttachment: 'platform',
      // 'preferred' → discoverable, backs up via iCloud/Google/Windows sync.
      residentKey: 'preferred',
      requireResidentKey: false,
      userVerification: 'required',
    },
    // 'none' → skip privacy-leaking attestation statements.
    attestation: 'none',
    timeout: 60_000,
    extensions: {
      // biome-ignore lint/suspicious/noExplicitAny: PRF extension not yet in lib.dom
      prf: { eval: { first: prfSalt } } as any,
    },
  }

  let credential: PublicKeyCredential
  try {
    const raw = await navigator.credentials.create({ publicKey })
    if (!raw) {
      throw new VaultError('Passkey creation returned no credential', 'passkey-unsupported')
    }
    credential = raw as PublicKeyCredential
  } catch (err) {
    if (isUserCancellation(err)) {
      throw new VaultError('Passkey creation cancelled', 'passkey-cancelled')
    }
    if (err instanceof VaultError) throw err
    throw new VaultError(
      `Passkey creation failed: ${(err as Error)?.message ?? String(err)}`,
      'passkey-unsupported',
    )
  }

  const credentialId = new Uint8Array(credential.rawId)

  // Verify PRF actually works by performing an immediate get() with the
  // enrollment salt. Some platforms report support but never return PRF
  // results — treat that as "unsupported" so the caller routes to password.
  let verifySecret: Uint8Array | null = null
  try {
    const verifyChallenge = randomBytes(32)
    const verifyOptions: PublicKeyCredentialRequestOptions = {
      challenge: verifyChallenge,
      rpId,
      allowCredentials: [{ id: credentialId, type: 'public-key' }],
      userVerification: 'required',
      timeout: 60_000,
      extensions: {
        // biome-ignore lint/suspicious/noExplicitAny: PRF extension not yet in lib.dom
        prf: { eval: { first: prfSalt } } as any,
      },
    }
    const assertion = (await navigator.credentials.get({
      publicKey: verifyOptions,
    })) as PublicKeyCredential | null
    if (assertion) verifySecret = extractPrfSecret(assertion)
  } catch (err) {
    if (isUserCancellation(err)) {
      throw new VaultError('Passkey verification cancelled', 'passkey-cancelled')
    }
    // fall through — verifySecret stays null → unsupported
  }

  if (!verifySecret) {
    throw new VaultError('PRF not supported by authenticator', 'passkey-unsupported')
  }

  return {
    credentialId,
    prfSalt,
    authenticatorLabel: guessAuthenticatorLabel(),
    createdAt: Date.now(),
  }
}

// ===== UNLOCK =====

export async function unlockWithPasskey(
  enrollment: PasskeyEnrollment,
): Promise<PasskeyUnlockResult> {
  try {
    if (typeof window === 'undefined' || !window.isSecureContext) {
      return { ok: false, reason: 'unsupported' }
    }
    if (typeof window.PublicKeyCredential === 'undefined' || !navigator.credentials) {
      return { ok: false, reason: 'unsupported' }
    }

    const rpId = getRpId()
    const challenge = randomBytes(32)

    const options: PublicKeyCredentialRequestOptions = {
      challenge,
      rpId,
      allowCredentials: [{ id: enrollment.credentialId, type: 'public-key' }],
      userVerification: 'required',
      timeout: 60_000,
      extensions: {
        // biome-ignore lint/suspicious/noExplicitAny: PRF extension not yet in lib.dom
        prf: { eval: { first: enrollment.prfSalt } } as any,
      },
    }

    let assertion: PublicKeyCredential | null
    try {
      assertion = (await navigator.credentials.get({
        publicKey: options,
      })) as PublicKeyCredential | null
    } catch (err) {
      if (isUserCancellation(err)) return { ok: false, reason: 'cancelled' }
      const name = (err as { name?: string })?.name
      if (name === 'InvalidStateError' || name === 'NotFoundError') {
        return { ok: false, reason: 'no-credential' }
      }
      return {
        ok: false,
        reason: 'error',
        detail: (err as Error)?.message ?? String(err),
      }
    }

    if (!assertion) return { ok: false, reason: 'no-credential' }

    const secret = extractPrfSecret(assertion)
    if (!secret) return { ok: false, reason: 'no-prf' }

    return { ok: true, secret }
  } catch (err) {
    return {
      ok: false,
      reason: 'error',
      detail: (err as Error)?.message ?? String(err),
    }
  }
}
