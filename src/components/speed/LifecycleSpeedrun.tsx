'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'

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
  idx: number
}

const STAGES: StageRow[] = [
  { key: 'wallet', label: 'Wallet', hint: 'Ed25519 from seed + uid', idx: 0 },
  { key: 'key', label: 'Save key', hint: 'device-bound / env seed', idx: 1 },
  { key: 'signin', label: 'Sign in', hint: 'session or API key', idx: 2 },
  { key: 'board', label: 'Join board', hint: 'CEO routes to every agent', idx: 3 },
  { key: 'team', label: 'Create team', hint: 'markdown → AgentSpec', idx: 4 },
  { key: 'deploy', label: 'Deploy team', hint: 'sync to TypeDB', idx: 5 },
  { key: 'discover', label: 'Discover', hint: 'subscribe + find + follow', idx: 6 },
  { key: 'message', label: 'Message', hint: 'first signal', idx: 7 },
  { key: 'converse', label: 'Converse', hint: 'second round-trip', idx: 8 },
  { key: 'sell', label: 'Sell', hint: 'receive payment', idx: 9 },
  { key: 'buy', label: 'Buy', hint: 'send payment', idx: 10 },
]

interface StageData {
  ms: number
  ok: boolean
  err?: string
  detail?: Record<string, unknown>
}

interface LaneState {
  status: Status
  stages: Partial<Record<StageKey, StageData>>
  uid?: string
}

interface SubstrateSnapshot {
  paths: { from: string; to: string; strength: number; resistance: number }[]
  highways: { from: string; to: string; strength: number }[]
  agents: number
}

const emptyLane = (): LaneState => ({ status: 'idle', stages: {} })

async function timed<T>(fn: () => Promise<T>): Promise<{ ms: number; ok: boolean; data?: T; err?: string }> {
  const t0 = performance.now()
  try {
    const data = await fn()
    return { ms: performance.now() - t0, ok: true, data }
  } catch (e) {
    return { ms: performance.now() - t0, ok: false, err: String(e) }
  }
}

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
    if (!r.ok) throw new Error(j?.error || `${r.status} ${r.statusText}`)
    return j
  } finally {
    clearTimeout(timer)
  }
}

async function getJson(url: string, timeoutMs = 15000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const r = await fetch(url, { signal: ctrl.signal })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(j?.error || `${r.status} ${r.statusText}`)
    return j
  } finally {
    clearTimeout(timer)
  }
}

export function LifecycleSpeedrun() {
  const [agent, setAgent] = useState<LaneState>(emptyLane())
  const [human, setHuman] = useState<LaneState>(emptyLane())
  const [totalMs, setTotalMs] = useState(0)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [substrate, setSubstrate] = useState<SubstrateSnapshot | null>(null)
  const [activeStage, setActiveStage] = useState<StageKey | null>(null)
  const stageRefs = useRef<Record<string, HTMLLIElement | null>>({})

  const toggleExpand = (lane: string, key: StageKey) => {
    const id = `${lane}:${key}`
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const fetchSubstrate = useCallback(async () => {
    try {
      const [pathsRes, hwRes] = await Promise.all([
        getJson('/api/export/paths').catch(() => []),
        getJson('/api/export/highways?limit=5').catch(() => []),
      ])
      const paths = Array.isArray(pathsRes) ? pathsRes : []
      const highways = Array.isArray(hwRes) ? hwRes : []
      setSubstrate({
        paths,
        highways,
        agents: new Set(paths.flatMap((p: { from: string; to: string }) => [p.from, p.to])).size,
      })
    } catch {
      /* offline */
    }
  }, [])

  useEffect(() => {
    fetchSubstrate()
  }, [fetchSubstrate])

  const run = useCallback(async () => {
    emitClick('ui:speed:run')
    const runId = Math.random().toString(36).slice(2, 8)
    const buyerUid = `buyer-${runId}`
    const sellerUid = `seller-${runId}`
    const humanUid = `human-${runId}`
    const ceoUid = `ceo-${runId}`
    const skill = `copy-${runId}`
    const tag = 'copy'
    const teamName = `board-${runId}`

    const agentLane: LaneState = { status: 'running', stages: {}, uid: `${buyerUid} ↔ ${sellerUid}` }
    const humanLane: LaneState = { status: 'running', stages: {}, uid: humanUid }
    setAgent({ ...agentLane })
    setHuman({ ...humanLane })
    setTotalMs(0)
    setExpanded({})

    const t0 = performance.now()

    const tick = (
      setter: typeof setAgent,
      lane: LaneState,
      key: StageKey,
      r: { ms: number; ok: boolean; err?: string; data?: unknown },
      detail?: Record<string, unknown>,
    ) => {
      lane.stages[key] = { ms: r.ms, ok: r.ok, err: r.err, detail: detail ?? (r.data as Record<string, unknown>) }
      if (!r.ok) {
        lane.stages[key]!.err = r.err || 'failed'
      }
      setter({ ...lane })
      setTotalMs(performance.now() - t0)
      setActiveStage(key)
      // auto-expand newly completed stage
      const laneId = setter === setAgent ? 'agent' : 'human'
      setExpanded((prev) => ({ ...prev, [`${laneId}:${key}`]: true }))
    }

    // ─────────── AGENT LANE ────────────────────────────────────
    // 0 WALLET — register 3 agents via /api/agents/register
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
    const walletResults = rWallet.data as Record<string, unknown>[] | undefined
    tick(setAgent, agentLane, 'wallet', rWallet, {
      registered: [buyerUid, sellerUid, ceoUid],
      addresses: walletResults?.map((w) => w?.address ?? w?.wallet ?? '—') ?? [],
      capabilities: { [sellerUid]: [{ skill, price: 0.02 }], [ceoUid]: [{ skill: 'route', price: 0 }] },
    })

    // 1 KEY — env-side seed; zero network
    tick(
      setAgent,
      agentLane,
      'key',
      { ms: 0, ok: rWallet.ok },
      {
        method: 'env seed (SUI_SEED)',
        note: 'same uid → same keypair → same address. deterministic.',
      },
    )

    // 2 SIGN IN — agent auth challenge
    const rSignin = await timed(() =>
      postJson('/api/auth/agent', { uid: buyerUid }).catch((e) => ({ skipped: true, reason: String(e) })),
    )
    tick(setAgent, agentLane, 'signin', rSignin, {
      uid: buyerUid,
      method: 'POST /api/auth/agent',
      session:
        ((rSignin.data as Record<string, unknown>)?.session ?? (rSignin.data as Record<string, unknown>)?.skipped)
          ? 'skipped'
          : 'active',
    })

    // 3 JOIN BOARD — buyer→CEO→seller fan-out
    const rBoard = await timed(async () => {
      const r1 = await postJson('/api/signal', {
        sender: buyerUid,
        receiver: `${ceoUid}:route`,
        data: JSON.stringify({ tags: ['join', tag], content: { from: buyerUid } }),
      })
      const r2 = await postJson('/api/signal', {
        sender: ceoUid,
        receiver: `${sellerUid}:${skill}`,
        data: JSON.stringify({ tags: ['route', tag], content: { from: buyerUid, via: ceoUid } }),
      })
      return { signal1: r1, signal2: r2 }
    })
    tick(setAgent, agentLane, 'board', rBoard, {
      paths: [`${buyerUid} → ${ceoUid}:route`, `${ceoUid} → ${sellerUid}:${skill}`],
      signals: 2,
      routedVia: ceoUid,
    })

    // 4 TEAM — local spec creation (instant)
    const buyerMd = `---\nname: ${buyerUid}\nmodel: openrouter/auto\nchannels: [web]\ngroup: ${teamName}\n---\nBuyer agent.`
    const sellerMd = `---\nname: ${sellerUid}\nmodel: openrouter/auto\nchannels: [web]\ngroup: ${teamName}\nskills:\n  - name: ${skill}\n    price: 0.02\n    tags: [${tag}]\n---\nSeller agent.`
    const agentSpecs = [
      { name: buyerUid, content: buyerMd },
      { name: sellerUid, content: sellerMd },
    ]
    tick(
      setAgent,
      agentLane,
      'team',
      { ms: 0, ok: true },
      {
        agents: agentSpecs.map((a) => a.name),
        skills: [skill],
        model: 'openrouter/auto',
        world: teamName,
      },
    )

    // 5 DEPLOY — sync to TypeDB via /api/agents/sync
    const rDeploy = await timed(() =>
      postJson('/api/agents/sync', {
        world: teamName,
        agents: agentSpecs,
      }).catch((e) => {
        if (String(e).includes('409') || String(e).includes('already')) return { soft: true }
        throw e
      }),
    )
    tick(setAgent, agentLane, 'deploy', rDeploy, {
      world: teamName,
      endpoint: 'POST /api/agents/sync',
      synced: agentSpecs.map((a) => a.name),
      typedb: (rDeploy.data as Record<string, unknown>)?.soft ? 'soft (already exists)' : 'written',
    })

    // 6 DISCOVER — subscribe (fast write) + find skills + follow paths
    const rDiscover = await timed(async () => {
      const subRes = await postJson('/api/subscribe', { receiver: buyerUid, tags: [tag, 'buyer'] })
      const skillsRes = await getJson('/api/export/skills', 8000).catch(() => [])
      const pathsRes = await getJson('/api/export/paths', 8000).catch(() => [])
      const skills = Array.isArray(skillsRes) ? skillsRes : []
      const paths = Array.isArray(pathsRes) ? pathsRes : []
      const matched = skills.filter((s: Record<string, unknown>) => {
        const tags = Array.isArray(s.tags) ? s.tags : []
        return tags.includes(tag) || String(s.name ?? '').includes(tag)
      })
      const myPaths = paths.filter((p: Record<string, unknown>) => p.from === buyerUid || p.to === sellerUid)
      return {
        subscribed: subRes,
        skills: matched,
        paths: myPaths,
        totalSkills: skills.length,
        totalPaths: paths.length,
      }
    })
    const discData = rDiscover.data as Record<string, unknown> | undefined
    const foundSkills = Array.isArray(discData?.skills) ? discData.skills : []
    const foundPaths = Array.isArray(discData?.paths) ? discData.paths : []
    tick(setAgent, agentLane, 'discover', rDiscover, {
      subscribed: [tag, 'buyer'],
      endpoint: 'POST /api/subscribe → GET /api/export/skills → paths',
      skillsFound: foundSkills.length,
      totalSkills: discData?.totalSkills ?? 0,
      skills: foundSkills.slice(0, 5).map((s: Record<string, unknown>) => ({
        id: s.id,
        name: s.name,
        price: s.price,
        providers: s.providers,
      })),
      pathsVisible: foundPaths.length,
      totalPaths: discData?.totalPaths ?? 0,
      paths: foundPaths.slice(0, 4).map((p: Record<string, unknown>) => ({
        from: p.from,
        to: p.to,
        strength: p.strength,
      })),
    })

    // 7 MESSAGE — first signal into graph
    const rMsg = await timed(() =>
      postJson('/api/signal', {
        sender: buyerUid,
        receiver: `${sellerUid}:${skill}`,
        data: JSON.stringify({ tags: [tag], content: 'write me a headline' }),
      }),
    )
    const msgData = rMsg.data as Record<string, unknown> | undefined
    tick(setAgent, agentLane, 'message', rMsg, {
      sender: buyerUid,
      receiver: `${sellerUid}:${skill}`,
      payload: 'write me a headline',
      result: msgData?.result ?? msgData?.ok ?? '—',
      pathMarked: `${buyerUid} → ${sellerUid}`,
    })

    // 8 CONVERSE — second round-trip, warm path
    const rConv = await timed(() =>
      postJson('/api/signal', {
        sender: buyerUid,
        receiver: `${sellerUid}:${skill}`,
        data: JSON.stringify({ tags: [tag], content: 'make it punchier' }),
      }),
    )
    const convData = rConv.data as Record<string, unknown> | undefined
    tick(setAgent, agentLane, 'converse', rConv, {
      sender: buyerUid,
      receiver: `${sellerUid}:${skill}`,
      payload: 'make it punchier',
      result: convData?.result ?? convData?.ok ?? '—',
      pathStrengthened: true,
      note: 'warm path — second mark() on same edge compounds',
    })

    // 9 SELL — buyer pays seller
    const rSell = await timed(() =>
      postJson('/api/pay', {
        from: buyerUid,
        to: sellerUid,
        amount: 0.02,
        task: skill,
      }),
    )
    const sellData = rSell.data as Record<string, unknown> | undefined
    tick(setAgent, agentLane, 'sell', rSell, {
      from: buyerUid,
      to: sellerUid,
      amount: 0.02,
      skill,
      txHash: sellData?.txHash ?? sellData?.tx ?? '—',
      pathMark: `${buyerUid} → ${sellerUid} +strength`,
      fee: '2%',
      net: 0.0196,
    })

    // 10 BUY — seller pays buyer back (commerce loop)
    const rBuy = await timed(() =>
      postJson('/api/pay', {
        from: sellerUid,
        to: buyerUid,
        amount: 0.01,
        task: 'tip',
      }),
    )
    const buyData = rBuy.data as Record<string, unknown> | undefined
    tick(setAgent, agentLane, 'buy', rBuy, {
      from: sellerUid,
      to: buyerUid,
      amount: 0.01,
      task: 'tip',
      txHash: buyData?.txHash ?? buyData?.tx ?? '—',
      pathMark: `${sellerUid} → ${buyerUid} +strength`,
      note: 'commerce loop closed — both directions learned',
    })

    const agentHasErrors = Object.values(agentLane.stages).some((s) => s?.err)
    agentLane.status = agentHasErrors ? 'error' : 'done'
    setAgent({ ...agentLane })

    // ─────────── HUMAN LANE ────────────────────────────────────
    const rHumanWallet = await timed(() => postJson('/api/signup', { name: humanUid, unitKind: 'human' }))
    const hWalletData = rHumanWallet.data as Record<string, unknown> | undefined
    tick(setHuman, humanLane, 'wallet', rHumanWallet, {
      uid: humanUid,
      kind: 'human',
      endpoint: 'POST /api/signup',
      address: hWalletData?.address ?? hWalletData?.wallet ?? '—',
    })
    tick(
      setHuman,
      humanLane,
      'key',
      { ms: 0, ok: rHumanWallet.ok },
      {
        method: 'passkey (human) — agent builds, human consumes',
      },
    )
    tick(
      setHuman,
      humanLane,
      'signin',
      { ms: 0, ok: true },
      {
        note: 'reuses agent session — human onboarding IS sign-in',
      },
    )

    // 3 BOARD — human joins via CEO
    const rHBoard = await timed(() =>
      postJson('/api/signal', {
        sender: humanUid,
        receiver: `${ceoUid}:route`,
        data: JSON.stringify({ tags: ['join', tag], content: { from: humanUid } }),
      }),
    )
    tick(setHuman, humanLane, 'board', rHBoard, {
      path: `${humanUid} → ${ceoUid}:route`,
      note: 'human enters same graph — CEO is the router',
    })

    tick(setHuman, humanLane, 'team', { ms: 0, ok: true }, { note: 'reuses agent team' })
    tick(setHuman, humanLane, 'deploy', { ms: 0, ok: true }, { note: 'already deployed' })

    const rHDisc = await timed(async () => {
      const subRes = await postJson('/api/subscribe', { receiver: humanUid, tags: [tag, 'human'] })
      const pathsRes = await getJson('/api/export/paths', 8000).catch(() => [])
      const paths = Array.isArray(pathsRes) ? pathsRes : []
      const myPaths = paths.filter((p: Record<string, unknown>) => p.from === humanUid || p.to === sellerUid)
      return { subscribed: subRes, paths: myPaths, totalPaths: paths.length }
    })
    const hDiscPaths = Array.isArray((rHDisc.data as Record<string, unknown>)?.paths)
      ? ((rHDisc.data as Record<string, unknown>).paths as Record<string, unknown>[])
      : []
    tick(setHuman, humanLane, 'discover', rHDisc, {
      subscribed: [tag, 'human'],
      note: 'human subscribes to same tags — sees agent paths',
      pathsVisible: hDiscPaths.length,
      totalPaths: (rHDisc.data as Record<string, unknown>)?.totalPaths ?? 0,
      paths: hDiscPaths.slice(0, 4).map((p: Record<string, unknown>) => ({
        from: p.from,
        to: p.to,
        strength: p.strength,
      })),
    })

    const rHMsg = await timed(() =>
      postJson('/api/signal', {
        sender: humanUid,
        receiver: `${sellerUid}:${skill}`,
        data: JSON.stringify({ tags: [tag], content: 'hi, can you write copy?' }),
      }),
    )
    tick(setHuman, humanLane, 'message', rHMsg, {
      sender: humanUid,
      receiver: `${sellerUid}:${skill}`,
      payload: 'hi, can you write copy?',
    })

    const rHConv = await timed(() =>
      postJson('/api/signal', {
        sender: humanUid,
        receiver: `${sellerUid}:${skill}`,
        data: JSON.stringify({ tags: [tag], content: 'love it, one more please' }),
      }),
    )
    tick(setHuman, humanLane, 'converse', rHConv, {
      sender: humanUid,
      payload: 'love it, one more please',
      note: 'third signal on same path — strength compounds',
    })

    const rHBuy = await timed(() =>
      postJson('/api/pay', {
        from: humanUid,
        to: sellerUid,
        amount: 0.05,
        task: skill,
      }),
    )
    tick(setHuman, humanLane, 'buy', rHBuy, {
      from: humanUid,
      to: sellerUid,
      amount: 0.05,
    })
    tick(
      setHuman,
      humanLane,
      'sell',
      { ms: 0, ok: true },
      {
        note: 'human as customer — receiving gratitude tip from seller',
      },
    )

    const humanHasErrors = Object.values(humanLane.stages).some((s) => s?.err)
    humanLane.status = humanHasErrors ? 'error' : 'done'
    setHuman({ ...humanLane })
    setActiveStage(null)

    // Refresh substrate snapshot after run
    await fetchSubstrate()
  }, [fetchSubstrate])

  const running = agent.status === 'running' || human.status === 'running'

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={run} disabled={running} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-medium">
          {running ? 'Running…' : 'Start speedrun'}
        </Button>
        <Badge variant="outline" className="font-mono text-cyan-300 border-cyan-900/60">
          total: {totalMs.toFixed(0)}ms
        </Badge>
        {activeStage && running && (
          <Badge variant="outline" className="font-mono text-amber-300 border-amber-900/60 animate-pulse">
            {activeStage}
          </Badge>
        )}
      </div>

      {/* Stage rail — progress indicator */}
      {(agent.status !== 'idle' || human.status !== 'idle') && (
        <div className="flex flex-wrap gap-1.5">
          {STAGES.map((s) => {
            const agentDone = agent.stages[s.key]?.ok
            const agentErr = agent.stages[s.key]?.err
            const active = activeStage === s.key && running
            return (
              <span
                key={s.key}
                className={cn(
                  'px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-medium transition-all',
                  agentErr
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : agentDone
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : active
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                        : 'bg-slate-800/50 text-slate-500 border border-slate-700/40',
                )}
              >
                {s.label}
              </span>
            )
          })}
        </div>
      )}

      {/* Lanes */}
      <div className="grid md:grid-cols-2 gap-4">
        <LaneCard
          title="Agent (autonomous)"
          lane={agent}
          accent="cyan"
          expanded={expanded}
          onToggle={(key) => toggleExpand('agent', key)}
          laneId="agent"
          stageRefs={stageRefs}
        />
        <LaneCard
          title="Human (agent-assisted)"
          lane={human}
          accent="emerald"
          expanded={expanded}
          onToggle={(key) => toggleExpand('human', key)}
          laneId="human"
          stageRefs={stageRefs}
        />
      </div>

      {/* Substrate snapshot */}
      {substrate && agent.status !== 'idle' && agent.status !== 'running' && (
        <SubstratePanel substrate={substrate} onRefresh={fetchSubstrate} />
      )}
    </div>
  )
}

function LaneCard({
  title,
  lane,
  accent,
  expanded,
  onToggle,
  laneId,
  stageRefs,
}: {
  title: string
  lane: LaneState
  accent: 'cyan' | 'emerald'
  expanded: Record<string, boolean>
  onToggle: (key: StageKey) => void
  laneId: string
  stageRefs: React.MutableRefObject<Record<string, HTMLLIElement | null>>
}) {
  const total = Object.values(lane.stages).reduce((sum, v) => sum + (v?.ms ?? 0), 0)
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

      <ol className="space-y-1">
        {STAGES.map((s) => {
          const stage = lane.stages[s.key]
          const done = stage?.ok && !stage.err
          const err = stage?.err
          const isExpanded = expanded[`${laneId}:${s.key}`]

          return (
            <li
              key={s.key}
              ref={(el) => {
                stageRefs.current[`${laneId}:${s.key}`] = el
              }}
              className="rounded bg-slate-900/40 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => stage && onToggle(s.key)}
                className="flex items-center justify-between text-sm px-2 py-1.5 w-full text-left hover:bg-slate-800/40 transition-colors"
                disabled={!stage}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-[10px] text-slate-600 w-4 inline-block">{s.idx}</span>
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
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-xs ${err ? 'text-rose-400' : done ? 'text-slate-300' : 'text-slate-600'}`}
                    title={err}
                  >
                    {err ? 'err' : stage ? `${stage.ms.toFixed(0)}ms` : '—'}
                  </span>
                  {stage && (
                    <span className={cn('text-[10px] transition-transform', isExpanded && 'rotate-180')}>▾</span>
                  )}
                </div>
              </button>

              {/* Expanded detail panel with real data */}
              {isExpanded && stage?.detail && (
                <div className="px-3 pb-3 pt-1 border-t border-slate-800/60">
                  <DetailView detail={stage.detail} accent={accent} />
                </div>
              )}
            </li>
          )
        })}
      </ol>

      {Object.values(lane.stages).some((s) => s?.err) && (
        <div className="mt-3 text-xs text-rose-400/80 font-mono space-y-1">
          {Object.entries(lane.stages).map(([k, v]) =>
            v?.err ? (
              <div key={k}>
                {k}: {v.err}
              </div>
            ) : null,
          )}
        </div>
      )}
    </Card>
  )
}

function DetailView({ detail, accent }: { detail: Record<string, unknown>; accent: 'cyan' | 'emerald' }) {
  const accentColor = accent === 'cyan' ? 'text-cyan-400' : 'text-emerald-400'
  const accentBg = accent === 'cyan' ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-emerald-500/10 border-emerald-500/20'

  return (
    <div className="space-y-1.5 text-xs font-mono">
      {Object.entries(detail).map(([key, value]) => {
        if (value === undefined || value === null) return null

        // Arrays get special rendering
        if (Array.isArray(value)) {
          if (value.length === 0) return null
          // Array of objects — render as mini-table
          if (typeof value[0] === 'object' && value[0] !== null) {
            return (
              <div key={key}>
                <span className="text-slate-500">{key}:</span>
                <div className="ml-3 mt-1 space-y-1">
                  {value.map((item, i) => (
                    <div key={`${key}-${i}`} className={cn('rounded px-2 py-1 border', accentBg)}>
                      {Object.entries(item as Record<string, unknown>).map(([k, v]) => (
                        <span key={k} className="mr-3">
                          <span className="text-slate-500">{k}:</span> <span className={accentColor}>{String(v)}</span>
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )
          }
          // Simple array
          return (
            <div key={key} className="flex flex-wrap gap-1 items-center">
              <span className="text-slate-500">{key}:</span>
              {value.map((v, i) => (
                <span key={`${key}-${i}`} className={cn('px-1.5 py-0.5 rounded border', accentBg, accentColor)}>
                  {String(v)}
                </span>
              ))}
            </div>
          )
        }

        // Objects — nested render
        if (typeof value === 'object') {
          return (
            <div key={key}>
              <span className="text-slate-500">{key}:</span>
              <div className="ml-3 mt-0.5">
                {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                  <div key={k}>
                    <span className="text-slate-500">{k}:</span>{' '}
                    <span className={accentColor}>{JSON.stringify(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        }

        // Scalars
        return (
          <div key={key}>
            <span className="text-slate-500">{key}: </span>
            <span
              className={cn(
                typeof value === 'number' ? accentColor : 'text-slate-300',
                key === 'endpoint' && 'text-slate-400 italic',
              )}
            >
              {String(value)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function SubstratePanel({ substrate, onRefresh }: { substrate: SubstrateSnapshot; onRefresh: () => void }) {
  return (
    <Card className="bg-[#111118] border-slate-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-violet-400" />
          <h2 className="text-lg font-medium text-slate-100">Substrate State</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onRefresh} className="text-xs text-slate-400 hover:text-slate-200">
          refresh
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-mono text-violet-400">{substrate.paths.length}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wider">paths</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-mono text-violet-400">{substrate.highways.length}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wider">highways</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-mono text-violet-400">{substrate.agents}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wider">agents</div>
        </div>
      </div>

      {substrate.highways.length > 0 && (
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">top highways (proven paths)</div>
          <div className="space-y-1.5">
            {substrate.highways.slice(0, 5).map((h, i) => (
              <div
                key={`hw-${i}`}
                className="flex items-center justify-between text-xs font-mono bg-slate-900/40 rounded px-2 py-1.5"
              >
                <span className="text-slate-300 truncate">
                  {h.from} → {h.to}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-400 rounded-full"
                      style={{ width: `${Math.min(100, (h.strength / 100) * 100)}%` }}
                    />
                  </div>
                  <span className="text-violet-400 w-8 text-right">{h.strength}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {substrate.paths.length > 0 && (
        <div className="mt-4">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
            recent paths ({substrate.paths.length} total)
          </div>
          <div className="space-y-1">
            {substrate.paths.slice(0, 8).map((p, i) => {
              const effective = p.strength - p.resistance
              const toxic = p.resistance >= 10 && p.resistance > p.strength * 2
              return (
                <div
                  key={`path-${i}`}
                  className={cn(
                    'flex items-center justify-between text-xs font-mono rounded px-2 py-1',
                    toxic ? 'bg-rose-500/10 text-rose-300' : 'bg-slate-900/30 text-slate-400',
                  )}
                >
                  <span className="truncate max-w-[60%]">
                    {p.from} → {p.to}
                  </span>
                  <span>
                    s={p.strength} r={p.resistance}{' '}
                    <span className={effective > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      eff={effective.toFixed(1)}
                    </span>
                    {toxic && ' ☠'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  )
}
