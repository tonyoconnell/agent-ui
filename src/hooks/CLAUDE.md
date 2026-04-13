# Hooks

**Skill: `/react19` — Use for all React hook patterns.**

## Substrate Learning

Hooks connect React components to the substrate's learning state. Future hooks will expose pheromone data, highway state, and rubric scores as reactive values — the UI learns as the graph learns.

**Context:** [DSL.md](../../docs/DSL.md) — signal grammar hooks will expose. [speed.md](../../docs/speed.md) — why real-time reactivity is possible (`<10ms` KV reads).

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
