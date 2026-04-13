import { authClient } from '@/lib/auth-client'

/**
 * React hook for authentication state and actions.
 * Wraps Better Auth's client-side API.
 */
export function useAuth() {
  const session = authClient.useSession()

  return {
    /** Current user (null if not signed in) */
    user: session.data?.user ?? null,
    /** Whether session is loading */
    loading: session.isPending,
    /** Whether user is authenticated */
    isAuthenticated: !!session.data?.user,

    /** Sign in with email/password */
    signIn: async (email: string, password: string) => {
      const result = await authClient.signIn.email({ email, password })
      if (result.error) throw new Error(result.error.message)
      return result.data
    },

    /** Sign up with email/password/name */
    signUp: async (email: string, password: string, name: string) => {
      const result = await authClient.signUp.email({ email, password, name })
      if (result.error) throw new Error(result.error.message)
      return result.data
    },

    /** Sign out */
    signOut: async () => {
      await authClient.signOut()
      window.location.href = '/signin'
    },
  }
}
