import { useCallback, useReducer } from 'react'
import { emitClick } from '@/lib/ui-signal'

/* ── Types ─────────────────────────────────────────────────────────────────── */

export type LifecycleStage =
  | 'idle'
  | 'wallet'
  | 'funding'
  | 'listing'
  | 'discovering'
  | 'signaling'
  | 'selling'
  | 'subscribing'
  | 'browsing'
  | 'buying'
  | 'done'
  | 'error'

export interface ChainDigest {
  stage: string
  digest: string
}

export interface AgentLifecycleState {
  stage: LifecycleStage
  buyerUid: string | null
  sellerUid: string | null
  buyerAddress: string | null
  sellerAddress: string | null
  agent: { uid: string; strength: number; price: number; name?: string } | null
  funded: boolean
  earned: number
  spent: number
  result: string | null
  error: string | null
  digests: ChainDigest[]
  stageTimings: Partial<Record<LifecycleStage, number>>
  totalMs: number
  listings: { name: string; price: number; provider: string }[]
  buyTarget: string | null
}

type Action =
  | { type: 'START'; buyerUid: string; sellerUid: string }
  | { type: 'WALLET'; buyerAddress: string; sellerAddress: string; ms: number; digests?: ChainDigest[] }
  | { type: 'FUNDED'; ms: number }
  | { type: 'LISTED'; ms: number; digest?: string }
  | { type: 'DISCOVERED'; agent: AgentLifecycleState['agent']; ms: number }
  | { type: 'SIGNALED'; result: string; ms: number; digest?: string }
  | { type: 'SOLD'; earned: number; ms: number; digest?: string }
  | { type: 'SUBSCRIBED'; ms: number }
  | { type: 'BROWSED'; listings: AgentLifecycleState['listings']; ms: number }
  | { type: 'BOUGHT'; spent: number; ms: number; digest?: string; buyTarget: string }
  | { type: 'DONE'; totalMs: number }
  | { type: 'ERROR'; error: string }
  | { type: 'RESET' }

const INITIAL: AgentLifecycleState = {
  stage: 'idle',
  buyerUid: null,
  sellerUid: null,
  buyerAddress: null,
  sellerAddress: null,
  agent: null,
  funded: false,
  earned: 0,
  spent: 0,
  result: null,
  error: null,
  digests: [],
  stageTimings: {},
  totalMs: 0,
  listings: [],
  buyTarget: null,
}

function reducer(state: AgentLifecycleState, action: Action): AgentLifecycleState {
  switch (action.type) {
    case 'START':
      return { ...INITIAL, stage: 'wallet', buyerUid: action.buyerUid, sellerUid: action.sellerUid }
    case 'WALLET':
      return {
        ...state,
        stage: 'funding',
        buyerAddress: action.buyerAddress,
        sellerAddress: action.sellerAddress,
        digests: action.digests ? [...state.digests, ...action.digests] : state.digests,
        stageTimings: { ...state.stageTimings, wallet: action.ms },
      }
    case 'FUNDED':
      return {
        ...state,
        stage: 'listing',
        funded: true,
        stageTimings: { ...state.stageTimings, funding: action.ms },
      }
    case 'LISTED':
      return {
        ...state,
        stage: 'discovering',
        digests: action.digest ? [...state.digests, { stage: 'list', digest: action.digest }] : state.digests,
        stageTimings: { ...state.stageTimings, listing: action.ms },
      }
    case 'DISCOVERED':
      return {
        ...state,
        stage: 'signaling',
        agent: action.agent,
        stageTimings: { ...state.stageTimings, discovering: action.ms },
      }
    case 'SIGNALED':
      return {
        ...state,
        stage: 'selling',
        result: action.result,
        digests: action.digest ? [...state.digests, { stage: 'signal', digest: action.digest }] : state.digests,
        stageTimings: { ...state.stageTimings, signaling: action.ms },
      }
    case 'SOLD':
      return {
        ...state,
        stage: 'subscribing',
        earned: action.earned,
        digests: action.digest ? [...state.digests, { stage: 'sell', digest: action.digest }] : state.digests,
        stageTimings: { ...state.stageTimings, selling: action.ms },
      }
    case 'SUBSCRIBED':
      return {
        ...state,
        stage: 'browsing',
        stageTimings: { ...state.stageTimings, subscribing: action.ms },
      }
    case 'BROWSED':
      return {
        ...state,
        stage: 'buying',
        listings: action.listings,
        stageTimings: { ...state.stageTimings, browsing: action.ms },
      }
    case 'BOUGHT':
      return {
        ...state,
        stage: 'done',
        spent: action.spent,
        buyTarget: action.buyTarget,
        digests: action.digest ? [...state.digests, { stage: 'buy', digest: action.digest }] : state.digests,
        stageTimings: { ...state.stageTimings, buying: action.ms },
      }
    case 'DONE':
      return { ...state, stage: 'done', totalMs: action.totalMs }
    case 'ERROR':
      return { ...state, stage: 'error', error: action.error }
    case 'RESET':
      return INITIAL
  }
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */

async function postJson(url: string, body: unknown, timeoutMs = 15000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(j?.error || `${r.status}`)
    return j
  } finally {
    clearTimeout(timer)
  }
}

/* ── Hook ──────────────────────────────────────────────────────────────────── */

export function useAgentLifecycle({ agentId, skill }: { agentId: string; skill: string }) {
  const [state, dispatch] = useReducer(reducer, INITIAL)

  const run = useCallback(async () => {
    emitClick('ui:ad:run', { receiver: `${agentId}:${skill}` })
    const t0 = performance.now()
    const runId = Math.random().toString(36).slice(2, 8)

    // Persist buyer identity across runs
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('one-buyer-uid') : null
    const buyerUid = stored ?? `buyer-${runId}`
    if (!stored && typeof localStorage !== 'undefined') {
      localStorage.setItem('one-buyer-uid', buyerUid)
    }
    const sellerUid = agentId

    dispatch({ type: 'START', buyerUid, sellerUid })

    // ── 0 WALLET — register + create on-chain Unit objects ─────────────
    let buyerAddress = ''
    let sellerAddress = ''
    try {
      const st = performance.now()
      // Register in TypeDB first
      const [buyer, seller] = await Promise.all([
        postJson('/api/agents/register', { uid: buyerUid, kind: 'human', capabilities: [] }),
        postJson('/api/agents/register', {
          uid: sellerUid,
          kind: 'agent',
          capabilities: [{ skill, price: 0.02 }],
        }),
      ])
      buyerAddress = buyer.wallet ?? ''
      sellerAddress = seller.wallet ?? ''

      // Create on-chain Unit objects (funds + mints Move objects)
      // These produce real Sui transactions visible on Suiscan
      const [buyerOnChain, sellerOnChain] = await Promise.all([
        postJson('/api/agents/create-onchain', { uid: buyerUid, name: buyerUid, kind: 'human' }, 30000).catch(
          () => null,
        ),
        postJson('/api/agents/create-onchain', { uid: sellerUid, name: sellerUid, kind: 'agent' }, 30000).catch(
          () => null,
        ),
      ])

      // Use on-chain addresses if available (more accurate — derived from actual keypair)
      if (buyerOnChain?.address) buyerAddress = buyerOnChain.address
      if (sellerOnChain?.address) sellerAddress = sellerOnChain.address

      // Collect on-chain creation digests
      const walletDigests: ChainDigest[] = []
      if (buyerOnChain?.digest) walletDigests.push({ stage: 'buyer-create', digest: buyerOnChain.digest })
      if (sellerOnChain?.digest) walletDigests.push({ stage: 'seller-create', digest: sellerOnChain.digest })

      dispatch({ type: 'WALLET', buyerAddress, sellerAddress, ms: performance.now() - st, digests: walletDigests })

      if (buyerAddress && typeof localStorage !== 'undefined') {
        localStorage.setItem('one-buyer-address', buyerAddress)
      }
    } catch {
      dispatch({ type: 'ERROR', error: 'wallet creation failed' })
      return
    }

    // ── 1 FUND — hit real Sui testnet faucet ─────────────────────────────
    //    createUnit already calls ensureFunded, but we call faucet again
    //    to make sure the buyer has enough for payments
    try {
      const st = performance.now()
      await postJson('/api/faucet', { address: buyerAddress }, 20000)
      dispatch({ type: 'FUNDED', ms: performance.now() - st })
    } catch {
      dispatch({ type: 'FUNDED', ms: 0 })
    }

    // ── 2 LIST — seller registers skill + subscribes to sell tags ────────
    try {
      const st = performance.now()
      const [sigRes] = await Promise.all([
        postJson('/api/signal', {
          sender: sellerUid,
          receiver: sellerUid,
          data: JSON.stringify({ tags: ['list', 'sell', skill], content: { skill, price: 0.02 } }),
        }),
        postJson('/api/subscribe', { receiver: sellerUid, tags: ['sell', skill] }),
      ])
      const digest = sigRes?.sui as string | undefined
      dispatch({ type: 'LISTED', ms: performance.now() - st, digest })
    } catch {
      dispatch({ type: 'ERROR', error: 'listing failed' })
      return
    }

    // ── 3 DISCOVER — signal 'market' with task, pheromone routes to seller ─
    //    The substrate follows strength on paths from 'market' to agents
    //    that provide the matching skill. No direct lookup — pheromone leads.
    let discoverResult: string | null = null
    try {
      const st = performance.now()
      const sigRes = await postJson('/api/signal', {
        sender: buyerUid,
        receiver: 'market',
        task: skill,
        data: JSON.stringify({ tags: [skill, 'discover'], content: `looking for ${skill}` }),
      })
      const routed = sigRes.routed as string | null
      const routedResult = sigRes.result as string | null

      if (routed) {
        // Pheromone found a path — the substrate routed us
        dispatch({
          type: 'DISCOVERED',
          agent: { uid: routed, strength: 5, price: 0.02, name: routed },
          ms: performance.now() - st,
        })
        if (routedResult) discoverResult = routedResult
      } else {
        // No pheromone path yet — fallback to the seller we registered
        dispatch({
          type: 'DISCOVERED',
          agent: { uid: sellerUid, strength: 1, price: 0.02, name: sellerUid },
          ms: performance.now() - st,
        })
      }
    } catch {
      dispatch({
        type: 'DISCOVERED',
        agent: { uid: sellerUid, strength: 1, price: 0.02, name: sellerUid },
        ms: 0,
      })
    }

    // ── 4 SIGNAL — execute the skill (or use result from discover routing) ─
    if (discoverResult) {
      // The pheromone-routed discover already executed the agent
      dispatch({ type: 'SIGNALED', result: discoverResult, ms: 0 })
      emitClick('ui:ad:signal', { receiver: `${agentId}:${skill}` })
    } else {
      try {
        const st = performance.now()
        const sigRes = await postJson('/api/signal', {
          sender: buyerUid,
          receiver: `${agentId}:${skill}`,
          data: JSON.stringify({ tags: [skill], content: `run ${skill}` }),
        })
        const result =
          sigRes.result ??
          sigRes.reply ??
          sigRes.output ??
          (sigRes.routed ? `routed → ${sigRes.routed}` : sigRes.ok ? 'signal delivered' : 'no response')
        const digest = sigRes?.sui as string | undefined
        dispatch({ type: 'SIGNALED', result, ms: performance.now() - st, digest })
        emitClick('ui:ad:signal', { receiver: `${agentId}:${skill}` })
      } catch {
        dispatch({ type: 'ERROR', error: 'signal failed' })
        return
      }
    }

    // ── 5 SELL — buyer pays seller (real /api/pay) ───────────────────────
    const sellPrice = 0.02
    try {
      const st = performance.now()
      const payRes = await postJson('/api/pay', {
        from: buyerUid,
        to: sellerUid,
        amount: sellPrice,
        task: skill,
      })
      const digest = payRes?.sui as string | undefined
      dispatch({ type: 'SOLD', earned: sellPrice, ms: performance.now() - st, digest })
    } catch {
      dispatch({ type: 'ERROR', error: 'payment failed' })
      return
    }

    // ── 6 SUBSCRIBE — seller subscribes to buy/test tags ───────────────
    try {
      const st = performance.now()
      await postJson('/api/subscribe', { receiver: sellerUid, tags: ['buy', 'test', 'market'] })
      dispatch({ type: 'SUBSCRIBED', ms: performance.now() - st })
    } catch {
      dispatch({ type: 'SUBSCRIBED', ms: 0 })
    }

    // ── 7 BROWSE — signal 'market' with task=buy, pheromone finds buyer ──
    //    Same pattern as discover: signal the market entry point,
    //    the substrate follows pheromone to the strongest 'buy' provider.
    let buyTarget = 'market:testnet-buyer'
    try {
      const st = performance.now()
      const sigRes = await postJson('/api/signal', {
        sender: sellerUid,
        receiver: 'market',
        task: 'buy',
        data: JSON.stringify({ tags: ['buy', 'test', 'market'], content: 'looking for services to buy' }),
      })
      const routed = sigRes.routed as string | null
      if (routed) buyTarget = routed
      const listings = routed
        ? [{ name: 'buy', price: 0.01, provider: routed }]
        : [{ name: 'buy', price: 0.01, provider: buyTarget }]
      dispatch({ type: 'BROWSED', listings, ms: performance.now() - st })
    } catch {
      dispatch({ type: 'BROWSED', listings: [{ name: 'buy', price: 0.01, provider: buyTarget }], ms: 0 })
    }

    // ── 8 BUY — seller pays the routed buyer (real commerce loop) ────────
    const buyPrice = 0.01
    try {
      const st = performance.now()
      const payRes = await postJson('/api/pay', {
        from: sellerUid,
        to: buyTarget,
        amount: buyPrice,
        task: 'buy',
      })
      const digest = payRes?.sui as string | undefined
      dispatch({ type: 'BOUGHT', spent: buyPrice, ms: performance.now() - st, digest, buyTarget })
    } catch {
      dispatch({ type: 'BOUGHT', spent: 0, ms: 0, buyTarget })
    }

    // ── DONE ─────────────────────────────────────────────────────────────
    const totalMs = Math.round(performance.now() - t0)
    dispatch({ type: 'DONE', totalMs })
    emitClick('ui:ad:complete', { receiver: `${agentId}:${skill}`, totalMs })

    // Save run data to localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        'one-last-run',
        JSON.stringify({
          buyerUid,
          sellerUid,
          buyerAddress,
          sellerAddress,
          skill,
          totalMs,
          ts: Date.now(),
        }),
      )
    }
  }, [agentId, skill])

  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])

  return { state, run, reset }
}
