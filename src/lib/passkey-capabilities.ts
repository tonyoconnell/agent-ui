/**
 * Browser WebAuthn capability detection for owner-tier sign-in.
 *
 * The substrate's wallet seed is wrapped under WebAuthn PRF (Pseudorandom
 * Function extension). Without PRF, the user can't unlock their seed —
 * sign-in must surface this BEFORE the user clicks anything, not as a
 * silent failure deep in navigator.credentials.get().
 *
 * Detection strategy:
 *   1. Check the platform-level API exists (WebAuthn level 1+).
 *   2. Probe getClientCapabilities (WebAuthn level 3, supported by recent
 *      browsers). When available, returns {prf: boolean} directly.
 *   3. Fall back to optimistic / feature-flag when getClientCapabilities
 *      is absent — actual ceremony will surface the failure if PRF is
 *      unsupported; we avoid false-positive blocking here.
 *
 * Reference: https://w3c.github.io/webauthn/#sctn-getClientCapabilities
 */

export interface PasskeyCapabilities {
  /** Platform supports WebAuthn at all */
  webAuthn: boolean
  /** PRF extension supported (the load-bearing one for wallet key derivation) */
  prf: boolean
  /** Discoverable credentials in autofill prompt (nice-to-have) */
  conditionalUI: boolean
  /** How we determined these capabilities */
  detected: 'capability-api' | 'feature-flag' | 'fallback'
}

/**
 * Detect browser WebAuthn / PRF capabilities.
 *
 * Safe to call during SSR — returns the `fallback` shape when `window` is
 * absent. Safe to call on every sign-in mount — reads only static browser
 * metadata, never triggers a user prompt.
 */
export async function detectPasskeyCapabilities(): Promise<PasskeyCapabilities> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return { webAuthn: false, prf: false, conditionalUI: false, detected: 'fallback' }
  }

  // Modern path: getClientCapabilities (Chrome 113+, Safari 17.4+, FF 122+)
  const PKC = window.PublicKeyCredential as typeof PublicKeyCredential & {
    getClientCapabilities?: () => Promise<Record<string, boolean>>
  }

  if (typeof PKC.getClientCapabilities === 'function') {
    try {
      const caps = await PKC.getClientCapabilities()
      return {
        webAuthn: true,
        prf: !!caps['extension:prf'],
        conditionalUI: !!caps.conditionalGet,
        detected: 'capability-api',
      }
    } catch {
      // getClientCapabilities threw — fall through to feature-flag path
    }
  }

  // Older browsers: we cannot probe PRF without a full ceremony (which
  // would prompt the user). Return optimistic true so the flow proceeds;
  // the ceremony itself will surface PRF absence if unsupported.
  return {
    webAuthn: true,
    prf: true,
    conditionalUI: false,
    detected: 'feature-flag',
  }
}

/**
 * Human-readable upgrade hint shown when PRF is definitively unsupported.
 * Only display this when `detected === 'capability-api'` to avoid
 * false-positive blocks on browsers that merely lack getClientCapabilities.
 */
export const PRF_UPGRADE_HINT =
  'Your browser does not support the WebAuthn PRF extension required for ONE wallets. ' +
  'Upgrade to Safari 17+, Chrome/Edge 116+, or Firefox 122+. ' +
  'See https://one.ie/docs/passkey-support for details.'

/**
 * Typed error thrown before `navigator.credentials.get()` when PRF is
 * definitively absent (capability-api path only).
 */
export class PrfUnsupportedError extends Error {
  readonly name = 'PrfUnsupportedError'
  constructor() {
    super(PRF_UPGRADE_HINT)
  }
}
