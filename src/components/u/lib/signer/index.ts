export { resolveSigner } from './resolve'
export type { Signer, SignerChain, SignerKind } from './types'
export { createVaultSigner } from './vault-signer'

// useSigner hook — composes all adapters
// Import in a React component to get the current signer
import { useEffect, useState } from 'react'
import { resolveSigner } from './resolve'
import type { Signer } from './types'

// ===== PASSKEY SIGN =====
// Trigger Touch ID → sign txBytes with the PRF-derived vault key.
// Returns the base64url-encoded WebAuthn assertion signature bytes.
// Caller passes credId (base64url) from the stored passkey enrollment.
export async function signWithPasskey(txBytes: Uint8Array, credId: Uint8Array): Promise<string> {
  if (typeof window === 'undefined' || !window.isSecureContext) {
    throw new Error('signWithPasskey: requires secure context (HTTPS or localhost)')
  }
  if (typeof window.PublicKeyCredential === 'undefined' || !navigator.credentials) {
    throw new Error('signWithPasskey: WebAuthn API not available')
  }

  const rpId = window.location.hostname
  // Use the tx hash (SHA-256) as the challenge so the signature commits to the tx.
  const challenge = await crypto.subtle.digest('SHA-256', txBytes.buffer as ArrayBuffer)

  const options: PublicKeyCredentialRequestOptions = {
    challenge,
    rpId,
    allowCredentials: [{ id: credId as unknown as BufferSource, type: 'public-key' }],
    userVerification: 'required',
    timeout: 60_000,
  }

  let assertion: PublicKeyCredential | null
  try {
    assertion = (await navigator.credentials.get({ publicKey: options })) as PublicKeyCredential | null
  } catch (err) {
    const name = (err as { name?: string })?.name
    if (name === 'NotAllowedError' || name === 'AbortError') {
      throw new Error('signWithPasskey: cancelled by user')
    }
    throw new Error(`signWithPasskey: WebAuthn error — ${(err as Error)?.message ?? String(err)}`)
  }

  if (!assertion) {
    throw new Error('signWithPasskey: no assertion returned')
  }

  const response = assertion.response as AuthenticatorAssertionResponse
  const sig = new Uint8Array(response.signature)
  // Return as base64url for transport to sponsor/execute
  return btoa(String.fromCharCode(...sig))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export function useSigner(): Signer | null {
  const [signer, setSigner] = useState<Signer | null>(null)

  useEffect(() => {
    // Resolve from available session/wallet state
    // In a real component, these come from context/hooks
    // This hook is a composition point — individual pages may pass explicit options
    const resolved = resolveSigner(
      typeof window !== 'undefined'
        ? ((window as { __session?: { frontDoor?: 'wallet' | 'zklogin'; address?: string } }).__session ?? null)
        : null,
      null,
      null,
    )
    setSigner(resolved)
  }, [])

  return signer
}
