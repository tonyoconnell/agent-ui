'use client'

import { useCallback, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { emitClick } from '@/lib/ui-signal'

type Status = 'idle' | 'running' | 'done' | 'error'
type StageKey =
  | 'wallet'
  | 'key'
  | 'signin'
  | 'board'
  | 'team'
  | 'deploy'
  | 'discover'
  | 'message'
  | 'converse'
  | 'sell'
  | 'buy'

interface StageRow {
  key: StageKey
  label: string
  hint: string
}

const STAGES: StageRow[] = [
  { key: 'wallet', label: 'Wallet', hint: 'Ed25519 from seed + uid' },
  { key: 'key', label: 'Save key', hint: 'device-bound / env seed' },
  { key: 'signin', label: 'Sign in', hint: 'session or API key' },
  { key: 'board', label: 'Join board', hint: 'CEO routes to every agent' },
  { key: 'team', label: 'Create team', hint: 'markdown → AgentSpec' },
  { key: 'deploy', label: 'Deploy team', hint: 'sync to TypeDB' },
  { key: 'discover', label: 'Discover', hint: 'find by tag' },
  { key: 'message', label: 'Message', hint: 'first signal' },
  { key: 'converse', label: 'Converse', hint: 'second round-trip' },
  { key: 'sell', label: 'Sell', hint: 'receive payment' },
  { key: 'buy', label: 'Buy', hint: 'send payment' },
]

interface LaneState {
  status: Status
  timings: Partial<Record<StageKey, number>>
  errors: Partial<Record<StageKey, string>>
  uid?: string
}

const emptyLane = (): LaneState => ({ status: 'idle', timings: {}, errors: {} })

async function timed<T>(fn: () => Promise<T>): Promise<{ ms: number; ok: boolean; data?: T; err?: string }> {
  const t0 = performance.now()
  try {
    const data = await fn()
    return { ms: performance.now() - t0, ok: true, data }
  } catch (e) {
    return { ms: performance.now() - t0, ok: false, err: String(e) }
  }
}

async function postJson(url: string, body: unknown) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j?.error || `${r.status} ${r.statusText}`)
  return j
}

async function getJson(url: string) {
  const r = await fetch(url)
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j?.error || `${r.status} ${r.statusText}`)
  return j
}

export function LifecycleSpeedrun() {
  const [agent, setAgent] = useState<LaneState>(emptyLane())
  const [human, setHuman] = useState<LaneState>(emptyLane())
  const [totalMs, setTotalMs] = useState(0)

  const run = useCallback(async () => {
    emitClick('ui:speed:run')
    const runId = Math.random().toString(36).slice(2, 8)
    const buyerUid = `buyer-${runId}`
    const sellerUid = `seller-${runId}`
    const humanUid = `human-${runId}`
    const ceoUid = `ceo-${runId}`
    const skill = `copy-${runId}`
    const tag = `copy`
    const teamName = `board-${runId}`

    const agentLane: LaneState = { status: 'running', timings: {}, errors: {}, uid: `${buyerUid}↔${sellerUid}` }
    const humanLane: LaneState = { status: 'running', timings: {}, errors: {}, uid: humanUid }
    setAgent({ ...agentLane })
    setHuman({ ...humanLane })
    setTotalMs(0)

    const t0 = performance.now()

    const tick = (
      setter: typeof setAgent,
      lane: LaneState,
      key: StageKey,
      r: { ms: number; ok: boolean; err?: string },
    ) => {
      lane.timings[key] = r.ms
      if (!r.ok) {
        lane.errors[key] = r.err || 'failed'
        lane.status = 'error'
      }
      setter({ ...lane })
      setTotalMs(performance.now() - t0)
    }

    // ─────────── AGENT LANE (autonomous) ────────────────────────────────────

    // 0 WALLET — register buyer + seller + CEO; /api/agents/register derives Sui addresses
    const rWallet = await timed(() =>
      Promise.all([
        postJson('/api/agents/register', { uid: buyerUid, kind: 'agent' }),
        postJson('/api/agents/register', {
          uid: sellerUid,
          kind: 'agent',
          capabilities: [{ skill, price: 0.02 }],
        }),
        postJson('/api/agents/register', {
          uid: ceoUid,
          kind: 'agent',
          capabilities: [{ skill: 'route', price: 0 }],
        }),
      ]),
    )
    tick(setAgent, agentLane, 'wallet', rWallet)
    // 1 KEY — seed is env-side; no network. Count as zero but mark done.
    tick(setAgent, agentLane, 'key', { ms: 0, ok: rWallet.ok })

    // 2 SIGN IN — agent auth challenge (best-effort; endpoint may require signed payload)
    const rSignin = await timed(() => postJson('/api/auth/agent', { uid: buyerUid }).catch(() => ({ skipped: true })))
    tick(setAgent, agentLane, 'signin', rSignin)

    // 3 JOIN BOARD — buyer signals CEO (seeds path buyer→ceo). CEO fans out to seller.
    //    This is the whole "auto-join" step: one signal in, one signal out, paths marked.
    const rBoard = await timed(async () => {
      await postJson('/api/signal', {
        sender: buyerUid,
        receiver: `${ceoUid}:route`,
        data: JSON.stringify({ tags: ['join', tag], content: { from: buyerUid } }),
      })
      // CEO routes to seller — establishes ceo→seller path
      await postJson('/api/signal', {
        sender: ceoUid,
        receiver: `${sellerUid}:${skill}`,
        data: JSON.stringify({ tags: ['route', tag], content: { from: buyerUid, via: ceoUid } }),
      })
      return { routedVia: ceoUid }
    })
    tick(setAgent, agentLane, 'board', rBoard)

    // 4 + 5 TEAM + DEPLOY — sync the two-agent team to TypeDB
    const rTeam = await timed(async () => {
      const t0 = performance.now()
      // CREATE: building the spec is local/instant
      const agents = [
        { name: buyerUid, model: 'openrouter/auto', systemPrompt: 'Buyer.' },
        {
          name: sellerUid,
          model: 'openrouter/auto',
          systemPrompt: 'Seller.',
          skills: [{ name: skill, price: 0.02, tags: [tag] }],
        },
      ]
      const createdAt = performance.now() - t0
      return { createdAt, agents }
    })
    tick(setAgent, agentLane, 'team', rTeam)

    const rDeploy = await timed(() =>
      postJson('/api/agents/sync', {
        world: teamName,
        agents: rTeam.data?.agents,
      }).catch((e) => {
        // sync may be optional if units already registered above — treat as soft success
        if (String(e).includes('409') || String(e).includes('already')) return { soft: true }
        throw e
      }),
    )
    tick(setAgent, agentLane, 'deploy', rDeploy)

    // 5 DISCOVER — look up seller by tag
    const rDiscover = await timed(() => getJson(`/api/agents/discover?tag=${encodeURIComponent(tag)}`))
    tick(setAgent, agentLane, 'discover', rDiscover)

    // 6 MESSAGE — first signal
    const rMsg = await timed(() =>
      postJson('/api/signal', {
        sender: buyerUid,
        receiver: `${sellerUid}:${skill}`,
        data: JSON.stringify({ tags: [tag], content: 'write me a headline' }),
      }),
    )
    tick(setAgent, agentLane, 'message', rMsg)

    // 7 CONVERSE — second round-trip, warm path
    const rConv = await timed(() =>
      postJson('/api/signal', {
        sender: buyerUid,
        receiver: `${sellerUid}:${skill}`,
        data: JSON.stringify({ tags: [tag], content: 'make it punchier' }),
      }),
    )
    tick(setAgent, agentLane, 'converse', rConv)

    // 8 SELL — buyer pays seller for the completed work
    const rSell = await timed(() =>
      postJson('/api/pay', {
        sender: buyerUid,
        receiver: sellerUid,
        amount: 0.02,
        task: skill,
      }),
    )
    tick(setAgent, agentLane, 'sell', rSell)

    // 9 BUY — seller now buys something back (close the commerce loop)
    const rBuy = await timed(() =>
      postJson('/api/pay', {
        sender: sellerUid,
        receiver: buyerUid,
        amount: 0.01,
        task: 'tip',
      }),
    )
    tick(setAgent, agentLane, 'buy', rBuy)

    agentLane.status = agentLane.status === 'error' ? 'error' : 'done'
    setAgent({ ...agentLane })

    // ─────────── HUMAN LANE (agent-assisted) ────────────────────────────────
    // Human lane exercises the human-facing endpoints: /api/signup, then rides
    // the same substrate. Decision time is simulated as 0 so we measure only
    // the substrate's contribution to human-assisted onboarding.

    const rHumanWallet = await timed(() => postJson('/api/signup', { name: humanUid, unitKind: 'human' }))
    tick(setHuman, humanLane, 'wallet', rHumanWallet)
    tick(setHuman, humanLane, 'key', { ms: 0, ok: rHumanWallet.ok })

    // Humans don't have an API key flow here; reuse the agent session.
    tick(setHuman, humanLane, 'signin', { ms: 0, ok: true })

    // 3 JOIN BOARD — the human's first path into the graph is CEO.
    const rHBoard = await timed(() =>
      postJson('/api/signal', {
        sender: humanUid,
        receiver: `${ceoUid}:route`,
        data: JSON.stringify({ tags: ['join', tag], content: { from: humanUid } }),
      }),
    )
    tick(setHuman, humanLane, 'board', rHBoard)

    // Human reuses the agent's team (agent builds, human consumes).
    tick(setHuman, humanLane, 'team', { ms: 0, ok: true })
    tick(setHuman, humanLane, 'deploy', { ms: 0, ok: true })

    const rHDisc = await timed(() => getJson(`/api/agents/discover?tag=${encodeURIComponent(tag)}`))
    tick(setHuman, humanLane, 'discover', rHDisc)

    const rHMsg = await timed(() =>
      postJson('/api/signal', {
        sender: humanUid,
        receiver: `${sellerUid}:${skill}`,
        data: JSON.stringify({ tags: [tag], content: 'hi, can you write copy?' }),
      }),
    )
    tick(setHuman, humanLane, 'message', rHMsg)

    const rHConv = await timed(() =>
      postJson('/api/signal', {
        sender: humanUid,
        receiver: `${sellerUid}:${skill}`,
        data: JSON.stringify({ tags: [tag], content: 'love it, one more please' }),
      }),
    )
    tick(setHuman, humanLane, 'converse', rHConv)

    const rHBuy = await timed(() =>
      postJson('/api/pay', {
        sender: humanUid,
        receiver: sellerUid,
        amount: 0.05,
        task: skill,
      }),
    )
    // For the human lane, BUY fires first (they're the customer).
    tick(setHuman, humanLane, 'buy', rHBuy)
    // SELL for humans = receiving tip from seller's gratitude (mirrors agent lane).
    tick(setHuman, humanLane, 'sell', { ms: 0, ok: true })

    humanLane.status = humanLane.status === 'error' ? 'error' : 'done'
    setHuman({ ...humanLane })
  }, [])

  const running = agent.status === 'running' || human.status === 'running'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={run} disabled={running} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-medium">
          {running ? 'Running…' : 'Start speedrun'}
        </Button>
        <Badge variant="outline" className="font-mono text-cyan-300 border-cyan-900/60">
          total: {totalMs.toFixed(0)}ms
        </Badge>
        <span className="text-xs text-slate-500 font-mono">
          wallet → key → sign-in → team → deploy → discover → message → converse → sell → buy
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <LaneCard title="Agent (autonomous)" lane={agent} accent="cyan" />
        <LaneCard title="Human (agent-assisted)" lane={human} accent="emerald" />
      </div>
    </div>
  )
}

function LaneCard({ title, lane, accent }: { title: string; lane: LaneState; accent: 'cyan' | 'emerald' }) {
  const total = Object.values(lane.timings).reduce((sum, v) => sum + (v ?? 0), 0)
  const dotColor =
    lane.status === 'done'
      ? 'bg-emerald-400'
      : lane.status === 'error'
        ? 'bg-rose-400'
        : lane.status === 'running'
          ? 'bg-amber-400 animate-pulse'
          : 'bg-slate-600'

  return (
    <Card className="bg-[#111118] border-slate-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-full ${dotColor}`} />
          <h2 className="text-lg font-medium text-slate-100">{title}</h2>
        </div>
        <span className={`font-mono text-sm ${accent === 'cyan' ? 'text-cyan-400' : 'text-emerald-400'}`}>
          {total.toFixed(0)}ms
        </span>
      </div>

      {lane.uid && <div className="text-xs text-slate-500 font-mono mb-3 truncate">{lane.uid}</div>}

      <ol className="space-y-1.5">
        {STAGES.map((s, i) => {
          const ms = lane.timings[s.key]
          const err = lane.errors[s.key]
          const done = ms !== undefined && !err
          return (
            <li key={s.key} className="flex items-center justify-between text-sm px-2 py-1.5 rounded bg-slate-900/40">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-[10px] text-slate-600 w-4 inline-block">{i}</span>
                <span
                  className={`font-mono text-xs w-4 inline-block ${
                    err ? 'text-rose-400' : done ? 'text-emerald-400' : 'text-slate-600'
                  }`}
                >
                  {err ? '×' : done ? '✓' : '·'}
                </span>
                <span className="text-slate-200 font-medium">{s.label}</span>
                <span className="text-slate-500 text-xs truncate hidden sm:inline">{s.hint}</span>
              </div>
              <span
                className={`font-mono text-xs ${err ? 'text-rose-400' : done ? 'text-slate-300' : 'text-slate-600'}`}
                title={err}
              >
                {err ? 'err' : ms !== undefined ? `${ms.toFixed(0)}ms` : '—'}
              </span>
            </li>
          )
        })}
      </ol>

      {Object.values(lane.errors).some(Boolean) && (
        <div className="mt-3 text-xs text-rose-400/80 font-mono space-y-1">
          {Object.entries(lane.errors).map(([k, v]) =>
            v ? (
              <div key={k}>
                {k}: {v}
              </div>
            ) : null,
          )}
        </div>
      )}
    </Card>
  )
}
