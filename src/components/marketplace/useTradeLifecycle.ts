import { useCallback, useReducer } from 'react'
import { emitClick } from '@/lib/ui-signal'

export type TradeStage =
  | 'LIST'
  | 'DISCOVER'
  | 'OFFER'
  | 'ESCROW'
  | 'EXECUTE'
  | 'VERIFY'
  | 'SETTLE'
  | 'RECEIPT'
  | 'DISPUTE'
  | 'FADE'

export const STAGES: TradeStage[] = [
  'LIST',
  'DISCOVER',
  'OFFER',
  'ESCROW',
  'EXECUTE',
  'VERIFY',
  'SETTLE',
  'RECEIPT',
  'DISPUTE',
  'FADE',
]

export interface TradeState {
  stage: TradeStage
  provider: string | null
  task: string | null
  price: number
  receiptId: string | null
  txHash: string | null
}

export type TradeAction =
  | { type: 'DISCOVER'; filter?: string }
  | { type: 'OFFER'; provider: string; task: string; price: number }
  | { type: 'ESCROW'; receiptId: string }
  | { type: 'EXECUTE' }
  | { type: 'VERIFY' }
  | { type: 'SETTLE'; txHash: string }
  | { type: 'RECEIPT' }
  | { type: 'DISPUTE' }
  | { type: 'FADE' }
  | { type: 'RESET' }

export const INITIAL: TradeState = {
  stage: 'LIST',
  provider: null,
  task: null,
  price: 0,
  receiptId: null,
  txHash: null,
}

export const VALID: Record<TradeStage, TradeAction['type'][]> = {
  LIST: ['DISCOVER'],
  DISCOVER: ['OFFER', 'DISCOVER'],
  OFFER: ['ESCROW', 'DISCOVER'],
  ESCROW: ['EXECUTE', 'DISPUTE'],
  EXECUTE: ['VERIFY', 'DISPUTE'],
  VERIFY: ['SETTLE', 'DISPUTE'],
  SETTLE: ['RECEIPT'],
  RECEIPT: ['DISPUTE', 'FADE', 'RESET'],
  DISPUTE: ['FADE', 'RESET'],
  FADE: ['RESET'],
}

export function reducer(state: TradeState, action: TradeAction): TradeState {
  if (action.type === 'RESET') return INITIAL
  const allowed = VALID[state.stage]
  if (!allowed.includes(action.type)) {
    throw new Error(`invalid transition: ${state.stage} → ${action.type}`)
  }
  switch (action.type) {
    case 'DISCOVER':
      return { ...state, stage: 'DISCOVER' }
    case 'OFFER':
      return {
        ...state,
        stage: 'OFFER',
        provider: action.provider,
        task: action.task,
        price: action.price,
      }
    case 'ESCROW':
      return { ...state, stage: 'ESCROW', receiptId: action.receiptId }
    case 'EXECUTE':
      return { ...state, stage: 'EXECUTE' }
    case 'VERIFY':
      return { ...state, stage: 'VERIFY' }
    case 'SETTLE':
      return { ...state, stage: 'SETTLE', txHash: action.txHash }
    case 'RECEIPT':
      return { ...state, stage: 'RECEIPT' }
    case 'DISPUTE':
      return { ...state, stage: 'DISPUTE' }
    case 'FADE':
      return { ...state, stage: 'FADE' }
  }
}

export type VisibleStage = 'BROWSE' | 'TRADE' | 'DONE' | 'DISPUTE'

export function visibleStage(stage: TradeStage): VisibleStage {
  if (stage === 'LIST' || stage === 'DISCOVER') return 'BROWSE'
  if (stage === 'DISPUTE') return 'DISPUTE'
  if (stage === 'SETTLE' || stage === 'RECEIPT' || stage === 'FADE') return 'DONE'
  return 'TRADE'
}

export function useTradeLifecycle() {
  const [state, dispatch] = useReducer(reducer, INITIAL)

  const go = useCallback((action: TradeAction) => {
    dispatch(action)
    if (action.type !== 'RESET') {
      const receiver = `ui:marketplace:transition:${action.type.toLowerCase()}`
      emitClick(receiver)
    }
  }, [])

  return { state, go }
}
