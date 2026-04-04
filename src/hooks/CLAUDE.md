# Hooks

**Skill: `/react19` — Use for all React hook patterns.**

## Files

| Hook | Purpose |
|------|---------|
| `useAuth.ts` | Better Auth: signIn, signUp, signOut, user state |

## useAuth

```tsx
import { useAuth } from '@/hooks/useAuth'

function Component() {
  const { user, loading, isAuthenticated, signIn, signUp, signOut } = useAuth()
  if (loading) return <Spinner />
  if (!isAuthenticated) return <SignInForm />
  return <Dashboard user={user} />
}
```
