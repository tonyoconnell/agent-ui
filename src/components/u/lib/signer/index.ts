export { resolveSigner } from './resolve'
export type { Signer, SignerChain, SignerKind } from './types'
export { createVaultSigner } from './vault-signer'

// useSigner hook — composes all adapters
// Import in a React component to get the current signer
import { useCallback, useEffect, useState } from 'react'
import { resolveSigner } from './resolve'
import type { Signer } from './types'

export function useSigner(): Signer | null {
  const [signer, setSigner] = useState<Signer | null>(null)

  useEffect(() => {
    // Resolve from available session/wallet state
    // In a real component, these come from context/hooks
    // This hook is a composition point — individual pages may pass explicit options
    const resolved = resolveSigner(
      typeof window !== 'undefined'
        ? ((window as { __session?: { frontDoor?: string; address?: string } }).__session ?? null)
        : null,
      null,
      null,
    )
    setSigner(resolved)
  }, [])

  return signer
}
