import { useCallback, useState } from 'react'
import { emitClick } from '@/lib/ui-signal'

export type Door = 'passkey' | 'google' | 'magic-link' | 'wallet' | 'password'

export type DoorErrorCode =
  | 'passkey-cancelled'
  | 'passkey-unsupported'
  | 'google-cancelled'
  | 'google-network'
  | 'magic-link-expired'
  | 'magic-link-used'
  | 'magic-link-rate-limited'
  | 'password-wrong'
  | 'password-locked'
  | 'wallet-rejected'
  | 'wallet-wrong-network'
  | 'email-invalid'
  | 'network-offline'

export const errorCopy: Record<DoorErrorCode, string> = {
  'passkey-cancelled': 'Passkey cancelled. Try again or use a different door.',
  'passkey-unsupported': "Touch ID / Face ID isn't available on this browser yet.",
  'google-cancelled': 'Google sign-in cancelled.',
  'google-network': "Couldn't reach Google. Try again.",
  'magic-link-expired': 'This link expired. Get a new one.',
  'magic-link-used': "This link was already used. If that wasn't you, secure your inbox.",
  'magic-link-rate-limited': 'Too many requests — wait a few minutes.',
  'password-wrong': 'Email or password incorrect.',
  'password-locked': 'Too many attempts. Try again in 15 minutes, or use a magic link.',
  'wallet-rejected': 'Sign request rejected.',
  'wallet-wrong-network': 'Switch to Sui Mainnet to continue.',
  'email-invalid': 'Please enter a valid email address.',
  'network-offline': "You're offline. Reconnect to sign in.",
}

export const pendingCopy: Record<Door, string> = {
  passkey: 'Waiting for biometric…',
  google: 'Redirecting to Google…',
  'magic-link': 'Sending…',
  wallet: 'Signing message in wallet…',
  password: 'Signing in…',
}

export interface AuthState {
  state: 'idle' | 'pending' | 'error'
  error: string | null
}

export function useAuthState(door: Door) {
  const [authState, setAuthState] = useState<AuthState>({ state: 'idle', error: null })

  const setError = useCallback(
    (code: DoorErrorCode | string) => {
      emitClick(`ui:auth:${door}:fail`)
      const msg = (errorCopy as Record<string, string>)[code] ?? code
      setAuthState({ state: 'error', error: msg })
    },
    [door],
  )

  const setPending = useCallback(() => {
    setAuthState({ state: 'pending', error: null })
  }, [])

  const reset = useCallback(() => {
    setAuthState({ state: 'idle', error: null })
  }, [])

  return { state: authState.state, error: authState.error, setError, setPending, reset }
}
