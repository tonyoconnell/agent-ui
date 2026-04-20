# Hooks

**Skill: `/react19` — Use for all React hook patterns.**

## Substrate Learning

Hooks connect React components to the substrate's learning state. Future hooks will expose pheromone data, highway state, and rubric scores as reactive values — the UI learns as the graph learns.

**Context:**
- [DSL.md](one/DSL.md) — signal grammar hooks will expose
- [speed.md](one/speed.md) — why real-time reactivity is possible (`<10ms` KV reads)
- [dictionary.md](dictionary.md) — canonical names for signal, unit, path, and strength used in hook return types
- [routing.md](routing.md) — hooks sit at the L1 boundary (signal delivery) and L2 boundary (trail observation)
- [rubrics.md](rubrics.md) — future hooks will expose rubric scores (fit/form/truth/taste) as reactive values per agent response
- [lifecycle.md](one/lifecycle.md) — `use-task-websocket.ts` surfaces agent lifecycle events (register→signal→highway→harden) that hooks consume
- [patterns.md](one/patterns.md) — hook state machines (pending→streaming→settled) mirror substrate state machines from patterns.md
- [buy-and-sell.md](buy-and-sell.md) — payment signal events (x402 receipts at SETTLE step) will be observable via hooks
- [revenue.md](one/revenue.md) — Layer 2 discovery signals flow through `streamSignals.ts` and are consumed by `useChat`-family hooks

## Files

| Hook | Purpose |
|------|---------|
| `useAuth.ts` | Better Auth: signIn, signUp, signOut, user state |
| `use-toast.ts` | Toast notification state: queue, dismiss, timeouts |
| `use-voice-input.ts` | Voice input hook: microphone access, transcript streaming |
| `ai/useChat.ts` | Core chat hook: streaming messages, tool calls, history — **L1 signal boundary** |
| `ai/useAIChat.ts` | Thin adapter: selects client/backend chat based on auth state |
| `ai/useIdentity.ts` | Agent identity hook: resolves current user's substrate unit — **L2 trail read** |
| `ai/basic/useClientChat.ts` | Client-side chat: direct AI SDK streaming, no auth required |
| `ai/basic/useGenerativeUI.ts` | Generative UI hook: renders tool-call output as React components |
| `ai/premium/useBackendChat.ts` | Backend-routed chat: proxies through `/api/chat`, requires auth |
| `ai/premium/useAgentContext.ts` | Injects substrate context pack into agent system-prompt — **L2 trail read** |
| `ai/premium/useAgentActions.ts` | Exposes agent action signals as callable React callbacks |
| `ai/premium/useCompleteChatFlow.ts` | Composes backend chat + identity + context into one hook |
| `ai/premium/useTokenUsage.ts` | Tracks token consumption per session for billing display |

## Loop Participation

Hooks sit at the L1/L2 boundary of the substrate loop:

```
L1  signal delivery   →  useChat / useAIChat emit signals on user input
L2  trail observation →  useIdentity / useAgentContext read path strength + classification
L4  settlement        →  useTokenUsage will observe x402 SETTLE events (roadmap)
```

**L1 boundary:** `useChat.ts` is the primary React entry point for signal delivery. User message submission emits a `{ receiver, data }` signal to the engine and streams the response.

**L2 observation:** `useIdentity.ts` and `useAgentContext.ts` read TypeDB-persisted path state (strength, unit_classification, capabilities) to shape context injection. These are read-only trail observations — they do not write strength or resistance.

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
