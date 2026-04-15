import { useCallback, useReducer } from 'react'
import { emitClick } from '@/lib/ui-signal'

export type LifecycleStage = 'idle' | 'deriving' | 'registering' | 'discovering' | 'signaling' | 'done' | 'error'

export interface AgentLifecycleState {
  stage: LifecycleStage
  buyerUid: string | null
  wallet: string | null
  agent: { uid: string; strength: number; price: number; name?: string } | null
  result: string | null
  error: string | null
}

type Action =
  | { type: 'START'; buyerUid: string }
  | { type: 'REGISTERED'; wallet: string | null }
  | { type: 'DISCOVERED'; agent: AgentLifecycleState['agent'] }
  | { type: 'SIGNALING' }
  | { type: 'DONE'; result: string }
  | { type: 'ERROR'; error: string }
  | { type: 'RESET' }

const INITIAL: AgentLifecycleState = {
  stage: 'idle',
  buyerUid: null,
  wallet: null,
  agent: null,
  result: null,
  error: null,
}

function reducer(state: AgentLifecycleState, action: Action): AgentLifecycleState {
  switch (action.type) {
    case 'START':
      return { ...INITIAL, stage: 'deriving', buyerUid: action.buyerUid }
    case 'REGISTERED':
      return { ...state, stage: 'discovering', wallet: action.wallet }
    case 'DISCOVERED':
      return { ...state, stage: 'signaling', agent: action.agent }
    case 'SIGNALING':
      return { ...state, stage: 'signaling' }
    case 'DONE':
      return { ...state, stage: 'done', result: action.result }
    case 'ERROR':
      return { ...state, stage: 'error', error: action.error }
    case 'RESET':
      return INITIAL
  }
}

export function useAgentLifecycle({ agentId, skill }: { agentId: string; skill: string }) {
  const [state, dispatch] = useReducer(reducer, INITIAL)

  const run = useCallback(async () => {
    emitClick('ui:ad:run', { receiver: `${agentId}:${skill}` })

    // ── 1. Derive or recall buyer UID from localStorage ──────────────────────
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('one-buyer-uid') : null
    const buyerUid = stored ?? `buyer-${crypto.randomUUID().slice(0, 8)}`
    if (!stored && typeof localStorage !== 'undefined') {
      localStorage.setItem('one-buyer-uid', buyerUid)
    }
    dispatch({ type: 'START', buyerUid })

    // ── 2. Register buyer + derive Sui wallet ─────────────────────────────────
    let wallet: string | null = null
    try {
      const regRes = await fetch('/api/agents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: buyerUid, kind: 'human', capabilities: [] }),
      })
      const reg = await regRes.json()
      wallet = reg.wallet ?? null
      dispatch({ type: 'REGISTERED', wallet })
    } catch {
      dispatch({ type: 'ERROR', error: 'registration failed' })
      return
    }

    // ── 3. Discover the seller agent ──────────────────────────────────────────
    try {
      const discRes = await fetch(`/api/agents/discover?skill=${encodeURIComponent(skill)}&limit=1`)
      const disc = await discRes.json()
      const top = disc.agents?.[0]
      if (!top) {
        dispatch({ type: 'ERROR', error: `no agent found for skill: ${skill}` })
        return
      }
      dispatch({
        type: 'DISCOVERED',
        agent: { uid: top.uid, strength: top.strength, price: top.price, name: top.name },
      })
    } catch {
      dispatch({ type: 'ERROR', error: 'discovery failed' })
      return
    }

    // ── 4. Signal the seller agent ────────────────────────────────────────────
    dispatch({ type: 'SIGNALING' })
    try {
      const sigRes = await fetch('/api/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: buyerUid,
          receiver: `${agentId}:${skill}`,
          data: JSON.stringify({ tags: [skill], content: `run ${skill}` }),
        }),
      })
      const sig = await sigRes.json()
      const result = sig.result ?? sig.reply ?? sig.output ?? JSON.stringify(sig)
      dispatch({ type: 'DONE', result })
      emitClick('ui:ad:complete', { receiver: `${agentId}:${skill}` })
    } catch {
      dispatch({ type: 'ERROR', error: 'signal failed' })
    }
  }, [agentId, skill])

  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])

  return { state, run, reset }
}
