/**
 * tests/setup/webauthn.ts — Virtual WebAuthn authenticator fixture.
 *
 * Provides a deterministic fake navigator.credentials implementation that
 * covers the PRF extension calls made by vault/passkey.ts:
 *   - navigator.credentials.create()  → enrollPasskey()
 *   - navigator.credentials.get()     → unlockWithPasskey() + PRF verify
 *
 * PRF output is deterministic: same credId + same prfSalt → same 32 bytes.
 * Derivation: HKDF-SHA-256( ikm=DETERMINISTIC_SEED, salt=credId, info=prfSalt )
 *
 * Usage:
 *   import { setupWebAuthn, teardownWebAuthn } from '@tests/setup/webauthn'
 *   beforeAll(setupWebAuthn)
 *   afterAll(teardownWebAuthn)
 */

// ─── Deterministic base key ────────────────────────────────────────────────

/** Fixed 32-byte IKM — the "virtual authenticator's master secret". */
export const DETERMINISTIC_SEED: Uint8Array = new Uint8Array([
  0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
  0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10,
  0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18,
  0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20,
])

/** Default credential ID used when none is supplied. */
const DEFAULT_CRED_ID: Uint8Array = new Uint8Array([
  0xab, 0xcd, 0xef, 0x01, 0x23, 0x45, 0x67, 0x89,
  0xab, 0xcd, 0xef, 0x01, 0x23, 0x45, 0x67, 0x89,
])

// ─── PRF derivation ────────────────────────────────────────────────────────

/**
 * Derive a deterministic 32-byte PRF output using HKDF-SHA-256.
 *
 *   IKM  = DETERMINISTIC_SEED
 *   salt = credId  (binds output to credential)
 *   info = prfSalt (binds output to the specific PRF evaluation salt)
 */
async function derivePrfOutput(
  credId: Uint8Array,
  prfSalt: Uint8Array,
): Promise<Uint8Array> {
  // Copy into fixed ArrayBuffers to satisfy strict lib DOM typings.
  const seedBuf = DETERMINISTIC_SEED.buffer.slice(
    DETERMINISTIC_SEED.byteOffset,
    DETERMINISTIC_SEED.byteOffset + DETERMINISTIC_SEED.byteLength,
  ) as ArrayBuffer
  const credBuf = credId.buffer.slice(
    credId.byteOffset,
    credId.byteOffset + credId.byteLength,
  ) as ArrayBuffer
  const saltBuf = prfSalt.buffer.slice(
    prfSalt.byteOffset,
    prfSalt.byteOffset + prfSalt.byteLength,
  ) as ArrayBuffer

  const ikm = await crypto.subtle.importKey(
    'raw',
    seedBuf,
    { name: 'HKDF' },
    false,
    ['deriveBits'],
  )

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: credBuf,
      info: saltBuf,
    } as HkdfParams,
    ikm,
    256,
  )

  return new Uint8Array(bits)
}

// ─── Fixture ───────────────────────────────────────────────────────────────

export interface VirtualAuthenticator {
  /** The credential ID this fixture is bound to. */
  credId: Uint8Array
  /**
   * Install mock for navigator.credentials.create().
   * Returns a fabricated PublicKeyCredential with a PRF extension result
   * derived from the prfSalt embedded in the creation options.
   */
  mockCreate(): void
  /**
   * Install mock for navigator.credentials.get().
   * The PRF output is derived from the prfSalt in the request options,
   * so the same salt always produces the same 32-byte result.
   */
  mockGet(): void
  /** Restore original navigator.credentials. */
  restore(): void
}

/**
 * Create a virtual WebAuthn authenticator fixture.
 *
 * @param credId - Optional credential ID. Defaults to DEFAULT_CRED_ID.
 */
export function createVirtualAuthenticator(
  credId: Uint8Array = DEFAULT_CRED_ID,
): VirtualAuthenticator {
  // Capture original so restore() works even when called multiple times.
  const originalCredentials =
    typeof globalThis.navigator !== 'undefined'
      ? (Object.getOwnPropertyDescriptor(globalThis.navigator, 'credentials')
          ?.value ?? null)
      : null

  // ── build fake PublicKeyCredential ────────────────────────────────────
  function makeCredential(
    rawIdBytes: Uint8Array,
    prfFirst: Uint8Array,
  ): PublicKeyCredential {
    return {
      id: Buffer.from(rawIdBytes).toString('base64url'),
      type: 'public-key',
      rawId: rawIdBytes.buffer as ArrayBuffer,
      response: {
        // Minimal AuthenticatorAttestationResponse shape
        attestationObject: new ArrayBuffer(0),
        clientDataJSON: new ArrayBuffer(0),
        getTransports: () => ['internal'],
        getPublicKeyAlgorithm: () => -7,
        getPublicKey: () => null,
        getAuthenticatorData: () => new ArrayBuffer(0),
      } as unknown as AuthenticatorAttestationResponse,
      authenticatorAttachment: 'platform',
      getClientExtensionResults: () => ({
        prf: {
          results: {
            first: prfFirst.buffer as ArrayBuffer,
          },
        },
      }),
    } as unknown as PublicKeyCredential
  }

  // ── build fake assertion (get response) ───────────────────────────────
  function makeAssertion(
    rawIdBytes: Uint8Array,
    prfFirst: Uint8Array,
  ): PublicKeyCredential {
    return {
      id: Buffer.from(rawIdBytes).toString('base64url'),
      type: 'public-key',
      rawId: rawIdBytes.buffer as ArrayBuffer,
      response: {
        // Minimal AuthenticatorAssertionResponse shape
        authenticatorData: new ArrayBuffer(37),
        clientDataJSON: new ArrayBuffer(0),
        signature: new ArrayBuffer(64),
        userHandle: null,
      } as unknown as AuthenticatorAssertionResponse,
      authenticatorAttachment: 'platform',
      getClientExtensionResults: () => ({
        prf: {
          results: {
            first: prfFirst.buffer as ArrayBuffer,
          },
        },
      }),
    } as unknown as PublicKeyCredential
  }

  // ── ensure navigator.credentials exists ───────────────────────────────
  function ensureCredentialsShim(): void {
    if (typeof globalThis.navigator === 'undefined') {
      Object.defineProperty(globalThis, 'navigator', {
        value: {},
        writable: true,
        configurable: true,
      })
    }
    if (!globalThis.navigator.credentials) {
      Object.defineProperty(globalThis.navigator, 'credentials', {
        value: {
          create: async () => null,
          get: async () => null,
          store: async () => undefined,
          preventSilentAccess: async () => undefined,
        },
        writable: true,
        configurable: true,
      })
    }
  }

  return {
    credId,

    mockCreate() {
      ensureCredentialsShim()
      const fixture_credId = credId

      globalThis.navigator.credentials.create = async (
        options?: CredentialCreationOptions,
      ): Promise<Credential | null> => {
        // Extract the PRF salt from the creation options
        const pk = (options as PublicKeyCredentialCreationOptions & {
          publicKey?: PublicKeyCredentialCreationOptions
        })?.publicKey ?? (options as { publicKey?: PublicKeyCredentialCreationOptions })?.publicKey

        const prfExtension = (pk?.extensions as {
          prf?: { eval?: { first?: Uint8Array | ArrayBuffer } }
        } | undefined)?.prf

        const rawFirst = prfExtension?.eval?.first
        const prfSalt: Uint8Array = rawFirst
          ? rawFirst instanceof Uint8Array
            ? rawFirst
            : new Uint8Array(rawFirst as ArrayBuffer)
          : new Uint8Array(32)

        const prfOutput = await derivePrfOutput(fixture_credId, prfSalt)
        return makeCredential(fixture_credId, prfOutput)
      }
    },

    mockGet() {
      ensureCredentialsShim()
      const fixture_credId = credId

      globalThis.navigator.credentials.get = async (
        options?: CredentialRequestOptions,
      ): Promise<Credential | null> => {
        // Extract the PRF salt from the request options
        const pk = (options as { publicKey?: PublicKeyCredentialRequestOptions })?.publicKey

        const prfExtension = (pk?.extensions as {
          prf?: { eval?: { first?: Uint8Array | ArrayBuffer } }
        } | undefined)?.prf

        const rawFirst = prfExtension?.eval?.first
        const prfSalt: Uint8Array = rawFirst
          ? rawFirst instanceof Uint8Array
            ? rawFirst
            : new Uint8Array(rawFirst as ArrayBuffer)
          : new Uint8Array(32)

        const prfOutput = await derivePrfOutput(fixture_credId, prfSalt)
        return makeAssertion(fixture_credId, prfOutput)
      }
    },

    restore() {
      if (typeof globalThis.navigator === 'undefined') return
      if (originalCredentials !== null) {
        Object.defineProperty(globalThis.navigator, 'credentials', {
          value: originalCredentials,
          writable: true,
          configurable: true,
        })
      }
    },
  }
}

// ─── Convenience lifecycle helpers ────────────────────────────────────────

let _activeAuthenticator: VirtualAuthenticator | null = null

/**
 * Call in `beforeAll` / `beforeEach`.
 * Installs a default virtual authenticator and shims secure context.
 */
export function setupWebAuthn(credId?: Uint8Array): void {
  // Shim window + secure context so passkey.ts guards pass.
  if (typeof globalThis.window === 'undefined') {
    Object.defineProperty(globalThis, 'window', {
      value: globalThis,
      writable: true,
      configurable: true,
    })
  }
  if (typeof globalThis.window.isSecureContext === 'undefined') {
    Object.defineProperty(globalThis.window, 'isSecureContext', {
      value: true,
      writable: true,
      configurable: true,
    })
  }
  if (typeof globalThis.window.location === 'undefined') {
    Object.defineProperty(globalThis.window, 'location', {
      value: { hostname: 'localhost' },
      writable: true,
      configurable: true,
    })
  }
  if (typeof globalThis.window.PublicKeyCredential === 'undefined') {
    Object.defineProperty(globalThis.window, 'PublicKeyCredential', {
      value: class PublicKeyCredential {},
      writable: true,
      configurable: true,
    })
  }

  const auth = createVirtualAuthenticator(credId)
  auth.mockCreate()
  auth.mockGet()
  _activeAuthenticator = auth
}

/**
 * Call in `afterAll` / `afterEach`.
 * Restores original navigator.credentials.
 */
export function teardownWebAuthn(): void {
  _activeAuthenticator?.restore()
  _activeAuthenticator = null
}
