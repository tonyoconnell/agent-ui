'use client'

import { useCallback, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatMs } from '@/lib/format-ms'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────────────────────

type Status = 'idle' | 'running' | 'done' | 'error'
type StageKey =
  | 'wallet'
  | 'fund'
  | 'list'
  | 'discover'
  | 'message'
  | 'sell'
  | 'subscribe'
  | 'browse'
  | 'buy'
  | 'advocate'

interface StageRow {
  key: StageKey
  idx: number
  label: string
  hint: string
}

const STAGES: StageRow[] = [
  { key: 'wallet', idx: 0, label: 'Create Wallet', hint: 'derive Sui address · zero' },
  { key: 'fund', idx: 1, label: 'Fund Wallet', hint: 'testnet faucet → real SUI · zero' },
  { key: 'list', idx: 2, label: 'List Service', hint: 'register skill · seller' },
  { key: 'discover', idx: 3, label: 'Discover', hint: 'buyer finds seller · seller' },
  { key: 'message', idx: 4, label: 'Message', hint: 'first signal · seller' },
  { key: 'sell', idx: 5, label: 'Sell', hint: 'receive payment · seller' },
  { key: 'subscribe', idx: 6, label: 'Subscribe', hint: 'subscribe to [buy] · buyer' },
  { key: 'browse', idx: 7, label: 'Browse', hint: 'marketplace query · buyer' },
  { key: 'buy', idx: 8, label: 'Buy', hint: 'spend earnings · buyer' },
  { key: 'advocate', idx: 9, label: 'Advocate', hint: 'harden path → hypothesis → referral earnings' },
]

interface StageData {
  ms: number
  ok: boolean
  err?: string
  detail?: Record<string, unknown>
}

interface ChainData {
  sellerUid: string
  buyerUid: string
  sellerAddress: string
  buyerAddress: string
  funded: boolean
  earned: number
  spent: number
  hardened: number
  digests: { stage: string; digest: string }[]
}

const SUISCAN = 'https://suiscan.xyz/testnet'

// ── Helpers ──────────────────────────────────────────────────────────────────

async function postJson<T = any>(url: string, body: unknown, timeoutMs = 15000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })
    const j = (await r.json().catch(() => ({}))) as Record<string, unknown>
    if (!r.ok) throw new Error((j?.error as string | undefined) || `${r.status} ${r.statusText}`)
    return j as T
  } finally {
    clearTimeout(timer)
  }
}

async function getJson<T = any>(url: string, timeoutMs = 15000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const r = await fetch(url, { signal: ctrl.signal })
    const j = (await r.json().catch(() => ({}))) as Record<string, unknown>
    if (!r.ok) throw new Error((j?.error as string | undefined) || `${r.status} ${r.statusText}`)
    return j as T
  } finally {
    clearTimeout(timer)
  }
}

async function timed<T>(fn: () => Promise<T>): Promise<{ ms: number; ok: boolean; data?: T; err?: string }> {
  const t0 = performance.now()
  try {
    const data = await fn()
    return { ms: performance.now() - t0, ok: true, data }
  } catch (e) {
    return { ms: performance.now() - t0, ok: false, err: String(e) }
  }
}

// ── Main Component ───────────────────────────────────────────────────────────

export function LifecycleSpeedrun() {
  const [status, setStatus] = useState<Status>('idle')
  const [stages, setStages] = useState<Partial<Record<StageKey, StageData>>>({})
  const [chain, setChain] = useState<ChainData>({
    sellerUid: '',
    buyerUid: '',
    sellerAddress: '',
    buyerAddress: '',
    funded: false,
    earned: 0,
    spent: 0,
    hardened: 0,
    digests: [],
  })
  const [totalMs, setTotalMs] = useState(0)
  const [activeStage, setActiveStage] = useState<StageKey | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [verifyOpen, setVerifyOpen] = useState(false)
  // Tracks which run() invocation is active; stale background mints check this
  // to avoid writing into state after the user starts a fresh speedrun.
  const currentRunIdRef = useRef<string>('')

  const tick = useCallback(
    (key: StageKey, r: { ms: number; ok: boolean; err?: string; data?: unknown }, detail?: Record<string, unknown>) => {
      setStages((prev) => ({
        ...prev,
        [key]: {
          ms: r.ms,
          ok: r.ok,
          err: r.ok ? undefined : r.err || 'failed',
          detail: detail ?? (r.data as Record<string, unknown>),
        },
      }))
      setActiveStage(key)
      setExpanded((prev) => ({ ...prev, [key]: true }))
    },
    [],
  )

  const run = useCallback(async () => {
    emitClick('ui:speed:run')
    const runId = Math.random().toString(36).slice(2, 8)
    currentRunIdRef.current = runId
    const sellerUid = `seller-${runId}`
    const buyerUid = `buyer-${runId}`
    const skill = `copy-${runId}`
    const tag = 'copy'
    const price = 0.02

    const ch: ChainData = {
      sellerUid,
      buyerUid,
      sellerAddress: '',
      buyerAddress: '',
      funded: false,
      earned: 0,
      spent: 0,
      hardened: 0,
      digests: [],
    }

    setStatus('running')
    setStages({})
    setExpanded({})
    setTotalMs(0)
    setVerifyOpen(false)
    setChain(ch)

    const t0 = performance.now()
    const up = () => setTotalMs(performance.now() - t0)

    // ── 0 WALLET ─────────────────────────────────────────────
    // Register in TypeDB (fast). Sui address comes back in the
    // response — agents use ephemeral keypairs (RAM only, no platform key).
    // We fire the Move object creation in the background below; the card updates when
    // digests arrive without blocking subsequent stages.
    const rW = await timed(async () => {
      const [seller, buyer] = await Promise.all([
        postJson('/api/agents/register', { uid: sellerUid, kind: 'agent', capabilities: [{ skill, price }] }),
        postJson('/api/agents/register', { uid: buyerUid, kind: 'agent' }),
      ])
      return { seller, buyer }
    })
    const wd = rW.data as { seller: Record<string, unknown>; buyer: Record<string, unknown> } | undefined
    ch.sellerAddress = String(wd?.seller?.wallet ?? '')
    ch.buyerAddress = String(wd?.buyer?.wallet ?? '')
    tick('wallet', rW, {
      seller: {
        uid: sellerUid,
        address: ch.sellerAddress,
        capability: `${skill} @ ${price} SUI`,
        objectId: 'minting in background…',
      },
      buyer: {
        uid: buyerUid,
        address: ch.buyerAddress,
        objectId: 'minting in background…',
      },
      onChain: 'addresses ready · Move objects queued (runs async, does not block speedrun)',
      explorer: ch.sellerAddress ? `${SUISCAN}/account/${ch.sellerAddress}` : null,
    })
    up()

    // ── Lazy Sui mint — does not block subsequent stages ─────
    const thisRunId = runId
    Promise.all([
      postJson<{ ok?: boolean; objectId?: string; digest?: string; address?: string }>(
        '/api/agents/create-onchain',
        { uid: sellerUid, name: sellerUid, kind: 'agent' },
        35000,
      ).catch(() => null),
      postJson<{ ok?: boolean; objectId?: string; digest?: string; address?: string }>(
        '/api/agents/create-onchain',
        { uid: buyerUid, name: buyerUid, kind: 'agent' },
        35000,
      ).catch(() => null),
    ]).then(([sellerOnChain, buyerOnChain]) => {
      // Guard: if the user kicked off another run, ignore these results.
      if (currentRunIdRef.current !== thisRunId) return

      const newDigests: { stage: string; digest: string }[] = []
      if (sellerOnChain?.digest) newDigests.push({ stage: 'seller-create', digest: String(sellerOnChain.digest) })
      if (buyerOnChain?.digest) newDigests.push({ stage: 'buyer-create', digest: String(buyerOnChain.digest) })

      if (newDigests.length > 0) {
        setChain((prev) => ({ ...prev, digests: [...prev.digests, ...newDigests] }))
      }

      setStages((prev) => {
        const walletStage = prev.wallet
        if (!walletStage?.detail) return prev
        const detail = walletStage.detail as Record<string, unknown>
        const sellerDetail = detail.seller as Record<string, unknown> | undefined
        const buyerDetail = detail.buyer as Record<string, unknown> | undefined
        return {
          ...prev,
          wallet: {
            ...walletStage,
            detail: {
              ...detail,
              seller: { ...(sellerDetail ?? {}), objectId: sellerOnChain?.objectId ?? 'rate-limited' },
              buyer: { ...(buyerDetail ?? {}), objectId: buyerOnChain?.objectId ?? 'rate-limited' },
              onChain:
                sellerOnChain?.ok && buyerOnChain?.ok
                  ? 'both units minted on Sui testnet'
                  : 'on-chain mint rate-limited — TypeDB addresses are still real and verifiable',
            },
          },
        }
      })
    })

    // ── 1 FUND ───────────────────────────────────────────────
    //    createUnit already calls ensureFunded, but we fund buyer too
    const rF = await timed(() => postJson('/api/faucet', { address: ch.buyerAddress }, 20000))
    const fd = rF.data as Record<string, unknown> | undefined
    ch.funded = rF.ok
    tick('fund', rF, {
      address: ch.buyerAddress,
      funded: rF.ok,
      rateLimited: fd?.rateLimited ?? false,
      note: fd?.rateLimited
        ? 'rate limited — wallet may already have SUI from prior run'
        : 'real SUI tokens delivered on testnet',
      explorer: ch.buyerAddress ? `${SUISCAN}/account/${ch.buyerAddress}` : null,
    })
    up()

    // ── 2 LIST ───────────────────────────────────────────────
    const rL = await timed(async () => {
      const [sigRes, subRes] = await Promise.all([
        postJson('/api/signal', {
          sender: sellerUid,
          receiver: sellerUid,
          data: JSON.stringify({ tags: ['list', 'sell', 'test', tag], content: { skill, price } }),
        }),
        postJson('/api/subscribe', { receiver: sellerUid, tags: ['sell', 'test', tag] }),
      ])
      return { signal: sigRes, subscribe: subRes }
    })
    const ld = rL.data as Record<string, unknown> | undefined
    const lSig = ld?.signal as Record<string, unknown> | undefined
    if (lSig?.sui) ch.digests.push({ stage: 'list', digest: String(lSig.sui) })
    tick('list', rL, {
      skill,
      price: `${price} SUI`,
      tags: ['sell', 'test', tag],
      endpoint: 'POST /api/signal + POST /api/subscribe',
      sui: lSig?.sui ?? 'pending (no on-chain unit yet)',
    })
    up()

    // ── 3 DISCOVER ───────────────────────────────────────────
    const rD = await timed(async () => {
      const [subRes, skillsRes] = await Promise.all([
        postJson('/api/subscribe', { receiver: buyerUid, tags: ['buy', tag] }),
        getJson('/api/export/skills', 8000).catch(() => []),
      ])
      const skills = Array.isArray(skillsRes) ? skillsRes : []
      const matched = skills.filter((s: Record<string, unknown>) => {
        const tags = Array.isArray(s.tags) ? s.tags : []
        return tags.includes(tag) || String(s.name ?? '').includes(tag)
      })
      return { subscribed: subRes, skills: matched, totalSkills: skills.length }
    })
    const dd = rD.data as Record<string, unknown> | undefined
    const fSkills = Array.isArray(dd?.skills) ? dd.skills : []
    tick('discover', rD, {
      buyerSubscribed: ['buy', tag],
      skillsFound: fSkills.length,
      totalInMarket: dd?.totalSkills ?? 0,
      skills: fSkills.slice(0, 5).map((s: Record<string, unknown>) => ({
        id: s.id,
        name: s.name,
        price: s.price,
        providers: s.providers,
      })),
    })
    up()

    // ── 4 MESSAGE ────────────────────────────────────────────
    const rM = await timed(() =>
      postJson('/api/signal', {
        sender: buyerUid,
        receiver: `${sellerUid}:${skill}`,
        data: JSON.stringify({ tags: [tag], content: 'I need copy for my landing page' }),
      }),
    )
    const md = rM.data as Record<string, unknown> | undefined
    if (md?.sui) ch.digests.push({ stage: 'message', digest: String(md.sui) })
    tick('message', rM, {
      from: buyerUid,
      to: `${sellerUid}:${skill}`,
      payload: 'I need copy for my landing page',
      result: md?.result ?? md?.ok ?? '—',
      pathCreated: `${buyerUid} → ${sellerUid}`,
      sui: md?.sui ?? 'pending',
    })
    up()

    // ── 5 SELL (earn) ────────────────────────────────────────
    const rS = await timed(() => postJson('/api/pay', { from: buyerUid, to: sellerUid, amount: price, task: skill }))
    const sd = rS.data as Record<string, unknown> | undefined
    if (sd?.sui) ch.digests.push({ stage: 'sell', digest: String(sd.sui) })
    ch.earned = price
    tick('sell', rS, {
      from: buyerUid,
      to: sellerUid,
      amount: `${price} SUI`,
      task: skill,
      fee: '2%',
      net: `${(price * 0.98).toFixed(4)} SUI`,
      pathMark: `${buyerUid} → ${sellerUid} +strength`,
      sui: sd?.sui ?? 'pending',
      explorer: sd?.sui ? `${SUISCAN}/tx/${sd.sui}` : null,
    })
    up()

    // ── 6 SUBSCRIBE ──────────────────────────────────────────
    const rSub = await timed(() =>
      postJson('/api/subscribe', { receiver: sellerUid, tags: ['buy', 'market', 'tools'] }),
    )
    tick('subscribe', rSub, {
      agent: sellerUid,
      tags: ['buy', 'market', 'tools'],
      note: 'seller now discovers services to buy with earned SUI',
    })
    up()

    // ── 7 BROWSE ─────────────────────────────────────────────
    const rB = await timed(async () => {
      const res = await getJson('/api/market/list', 8000).catch(() => ({ listings: [] }))
      return res
    })
    const bd = rB.data as Record<string, unknown> | undefined
    const listings = Array.isArray(bd?.listings) ? bd.listings : []
    tick('browse', rB, {
      endpoint: 'GET /api/market/list',
      listings: listings.length,
      items: listings.slice(0, 5).map((l: Record<string, unknown>) => ({
        name: l.name ?? l.skill ?? l.id,
        price: l.price,
        provider: l.provider ?? l.uid,
      })),
      note: listings.length === 0 ? 'marketplace empty — spending earned SUI as tip' : `${listings.length} available`,
    })
    up()

    // ── 8 BUY (spend) ────────────────────────────────────────
    const buyAmt = 0.01
    const rBuy = await timed(() => postJson('/api/pay', { from: sellerUid, to: buyerUid, amount: buyAmt, task: 'tip' }))
    const byd = rBuy.data as Record<string, unknown> | undefined
    if (byd?.sui) ch.digests.push({ stage: 'buy', digest: String(byd.sui) })
    ch.spent = buyAmt
    tick('buy', rBuy, {
      from: sellerUid,
      to: buyerUid,
      amount: `${buyAmt} SUI`,
      task: 'tip',
      pathMark: `${sellerUid} → ${buyerUid} +strength`,
      note: 'commerce loop closed — both directions learned',
      sui: byd?.sui ?? 'pending',
      explorer: byd?.sui ? `${SUISCAN}/tx/${byd.sui}` : null,
    })
    up()

    // ── 9 ADVOCATE ───────────────────────────────────────────
    // Agent has now sold AND bought — it has proven a path.
    // Mark the quality of the exchange, then query highways to
    // confirm the path has graduated. The substrate's L6 know()
    // loop promotes highways to permanent hypotheses; advocates
    // earn Layer-2 referral fees on future traffic through their path.
    const rAdv = await timed(async () => {
      const [dimsRes, highwaysRes] = await Promise.all([
        postJson('/api/loop/mark-dims', {
          edge: `${sellerUid}→${buyerUid}`,
          fit: 0.9,
          form: 0.85,
          truth: 0.9,
          taste: 0.85,
          source: 'advocate',
        }).catch(() => ({ ok: false })),
        getJson('/api/loop/highways', 5000).catch(() => ({ highways: [] })),
      ])
      const highways = Array.isArray((highwaysRes as Record<string, unknown>)?.highways)
        ? ((highwaysRes as Record<string, unknown>).highways as unknown[])
        : []
      return { dims: dimsRes, highways, highwayCount: highways.length }
    })
    const advd = rAdv.data as Record<string, unknown> | undefined
    ch.hardened = Number(advd?.highwayCount ?? 0)
    tick('advocate', rAdv, {
      edge: `${sellerUid} → ${buyerUid}`,
      scores: { fit: 0.9, form: 0.85, truth: 0.9, taste: 0.85 },
      highwaysNow: ch.hardened,
      hypothesis:
        ch.hardened > 0
          ? 'path qualified for L6 know() — will harden on next tick'
          : 'path strengthened — more signals needed',
      earns: 'Layer-2 referral fees on future traffic through this path',
      note: 'advocate stage complete — arc: zero → seller → buyer → advocate',
    })
    up()

    // Functional merge so any background-mint digests that already landed
    // (seller-create / buyer-create) are preserved; dedupe by digest hash.
    setChain((prev) => {
      const seen = new Set<string>()
      const merged = [...ch.digests, ...prev.digests].filter((d) => {
        if (seen.has(d.digest)) return false
        seen.add(d.digest)
        return true
      })
      return { ...ch, digests: merged }
    })
    setStatus('done')
    setActiveStage(null)
    setVerifyOpen(true)
  }, [tick])

  const running = status === 'running'

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={run} disabled={running} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-medium">
          {running ? 'Running…' : 'Start speedrun'}
        </Button>
        <Badge variant="outline" className="font-mono text-cyan-300 border-cyan-900/60">
          total: {formatMs(totalMs)}
        </Badge>
        {activeStage && running && (
          <Badge variant="outline" className="font-mono text-amber-300 border-amber-900/60 animate-pulse">
            {activeStage}
          </Badge>
        )}
        {status === 'done' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVerifyOpen(true)}
            className="text-violet-400 border-violet-800 hover:bg-violet-900/30"
          >
            Verify on chain
          </Button>
        )}
      </div>

      {/* Stage rail */}
      {status !== 'idle' && (
        <div className="flex flex-wrap gap-1.5">
          {STAGES.map((s) => {
            const done = stages[s.key]?.ok
            const err = stages[s.key]?.err
            const active = activeStage === s.key && running
            return (
              <span
                key={s.key}
                className={cn(
                  'px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-medium transition-all',
                  err
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : done
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

      {/* Single lane */}
      <Card className="bg-[#111118] border-slate-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-block w-2 h-2 rounded-full',
                status === 'done'
                  ? 'bg-emerald-400'
                  : status === 'error'
                    ? 'bg-rose-400'
                    : status === 'running'
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-slate-600',
              )}
            />
            <h2 className="text-lg font-medium text-slate-100">Zero → Seller → Buyer → Advocate</h2>
          </div>
          <span className="font-mono text-sm text-cyan-400">{formatMs(totalMs)}</span>
        </div>

        {chain.sellerUid && (
          <div className="text-xs text-slate-500 font-mono mb-3 truncate">
            {chain.sellerUid} (seller) ↔ {chain.buyerUid} (buyer)
          </div>
        )}

        <ol className="space-y-1">
          {STAGES.map((s) => {
            const stage = stages[s.key]
            const done = stage?.ok && !stage.err
            const err = stage?.err
            const isExp = expanded[s.key]
            return (
              <li key={s.key} className="rounded bg-slate-900/40 overflow-hidden">
                <button
                  type="button"
                  onClick={() => stage && setExpanded((prev) => ({ ...prev, [s.key]: !prev[s.key] }))}
                  className="flex items-center justify-between text-sm px-2 py-1.5 w-full text-left hover:bg-slate-800/40 transition-colors"
                  disabled={!stage}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[10px] text-slate-600 w-4 inline-block">{s.idx}</span>
                    <span
                      className={`font-mono text-xs w-4 inline-block ${err ? 'text-rose-400' : done ? 'text-emerald-400' : 'text-slate-600'}`}
                    >
                      {err ? '×' : done ? '✓' : '·'}
                    </span>
                    <span className="text-slate-200 font-medium">{s.label}</span>
                    <span className="text-slate-500 text-xs truncate hidden sm:inline">{s.hint}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-xs ${err ? 'text-rose-400' : done ? 'text-slate-300' : 'text-slate-600'}`}
                    >
                      {err ? 'err' : stage ? formatMs(stage.ms) : '—'}
                    </span>
                    {stage && <span className={cn('text-[10px] transition-transform', isExp && 'rotate-180')}>▾</span>}
                  </div>
                </button>
                {isExp && stage?.detail && (
                  <div className="px-3 pb-3 pt-1 border-t border-slate-800/60">
                    <DetailView detail={stage.detail} />
                  </div>
                )}
              </li>
            )
          })}
        </ol>

        {Object.values(stages).some((s) => s?.err) && (
          <div className="mt-3 text-xs text-rose-400/80 font-mono space-y-1">
            {Object.entries(stages).map(([k, v]) =>
              v?.err ? (
                <div key={k}>
                  {k}: {v.err}
                </div>
              ) : null,
            )}
          </div>
        )}
      </Card>

      {/* Verify Dialog */}
      <VerifyDialog open={verifyOpen} onOpenChange={setVerifyOpen} chain={chain} stages={stages} totalMs={totalMs} />
    </div>
  )
}

// ── DetailView ───────────────────────────────────────────────────────────────

function DetailView({ detail }: { detail: Record<string, unknown> }) {
  return (
    <div className="space-y-1.5 text-xs font-mono">
      {Object.entries(detail).map(([key, value]) => {
        if (value === undefined || value === null) return null

        if (key === 'explorer' && typeof value === 'string') {
          return (
            <div key={key}>
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:text-violet-300 underline underline-offset-2"
              >
                view on Suiscan →
              </a>
            </div>
          )
        }

        if (Array.isArray(value)) {
          if (value.length === 0) return null
          if (typeof value[0] === 'object' && value[0] !== null) {
            return (
              <div key={key}>
                <span className="text-slate-500">{key}:</span>
                <div className="ml-3 mt-1 space-y-1">
                  {value.map((item, i) => (
                    <div key={`${key}-${i}`} className="rounded px-2 py-1 border bg-cyan-500/10 border-cyan-500/20">
                      {Object.entries(item as Record<string, unknown>).map(([k, v]) => (
                        <span key={k} className="mr-3">
                          <span className="text-slate-500">{k}:</span>{' '}
                          <span className="text-cyan-400">{String(v)}</span>
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )
          }
          return (
            <div key={key} className="flex flex-wrap gap-1 items-center">
              <span className="text-slate-500">{key}:</span>
              {value.map((v, i) => (
                <span
                  key={`${key}-${i}`}
                  className="px-1.5 py-0.5 rounded border bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                >
                  {String(v)}
                </span>
              ))}
            </div>
          )
        }

        if (typeof value === 'object') {
          return (
            <div key={key}>
              <span className="text-slate-500">{key}:</span>
              <div className="ml-3 mt-0.5">
                {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                  <div key={k}>
                    <span className="text-slate-500">{k}:</span>{' '}
                    <span className="text-cyan-400">{JSON.stringify(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        }

        const isSui = key === 'sui' || key === 'address' || key === 'txHash'
        return (
          <div key={key}>
            <span className="text-slate-500">{key}: </span>
            <span
              className={cn(
                typeof value === 'number' ? 'text-cyan-400' : isSui ? 'text-violet-400' : 'text-slate-300',
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

// ── Verify Dialog ────────────────────────────────────────────────────────────

function VerifyDialog({
  open,
  onOpenChange,
  chain,
  stages,
  totalMs,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  chain: ChainData
  stages: Partial<Record<StageKey, StageData>>
  totalMs: number
}) {
  const [copied, setCopied] = useState('')

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      setTimeout(() => setCopied(''), 2000)
    } catch {
      /* blocked */
    }
  }

  const allJson = JSON.stringify(
    {
      seller: { uid: chain.sellerUid, address: chain.sellerAddress },
      buyer: { uid: chain.buyerUid, address: chain.buyerAddress },
      funded: chain.funded,
      earned: chain.earned,
      spent: chain.spent,
      net: chain.earned - chain.spent,
      hardened: chain.hardened,
      digests: chain.digests,
      stages: Object.fromEntries(Object.entries(stages).map(([k, v]) => [k, { ms: v?.ms, ok: v?.ok }])),
      totalMs: Math.round(totalMs),
      timestamp: new Date().toISOString(),
    },
    null,
    2,
  )

  const passCount = Object.values(stages).filter((s) => s?.ok && !s.err).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#111118] border-slate-800 text-slate-200 max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Chain Verification</DialogTitle>
          <DialogDescription className="text-slate-400">
            {passCount}/{Object.keys(stages).length} stages in {formatMs(totalMs)}. Zero → Seller → Buyer → Advocate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Wallets */}
          <section>
            <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Wallets (Sui Testnet)</h3>
            <div className="space-y-2">
              <ChainRow
                label="Seller"
                uid={chain.sellerUid}
                address={chain.sellerAddress}
                copied={copied}
                onCopy={copyText}
              />
              <ChainRow
                label="Buyer"
                uid={chain.buyerUid}
                address={chain.buyerAddress}
                copied={copied}
                onCopy={copyText}
              />
            </div>
          </section>

          {/* Economics */}
          <section>
            <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Economics</h3>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
                <div className="text-lg font-mono text-emerald-400">{chain.earned}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Earned (SUI)</div>
              </div>
              <div className="text-center rounded-lg bg-rose-500/10 border border-rose-500/20 p-3">
                <div className="text-lg font-mono text-rose-400">{chain.spent}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Spent (SUI)</div>
              </div>
              <div className="text-center rounded-lg bg-violet-500/10 border border-violet-500/20 p-3">
                <div className="text-lg font-mono text-violet-400">{(chain.earned - chain.spent).toFixed(4)}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Net (SUI)</div>
              </div>
              <div className="text-center rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-3">
                <div className="text-lg font-mono text-cyan-400">{chain.hardened}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Highways</div>
              </div>
            </div>
          </section>

          {/* Transactions */}
          <section>
            <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">
              Transactions ({chain.digests.length || 'pending'})
            </h3>
            {chain.digests.length > 0 ? (
              <div className="space-y-1.5">
                {chain.digests.map((d) => (
                  <div
                    key={d.digest}
                    className="flex items-center justify-between text-xs font-mono bg-slate-900/40 rounded px-2 py-1.5"
                  >
                    <span className="text-slate-500 w-16 shrink-0">{d.stage}</span>
                    <a
                      href={`${SUISCAN}/tx/${d.digest}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-400 hover:text-violet-300 truncate mx-2"
                    >
                      {d.digest.slice(0, 20)}…
                    </a>
                    <CopyBtn text={d.digest} label={d.digest} copied={copied} onCopy={copyText} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 bg-slate-900/40 rounded px-3 py-2">
                Sui on-chain units not yet created — wallet addresses are real and verifiable. Digests appear once units
                are mirrored on-chain.
              </div>
            )}
          </section>

          {/* Faucet */}
          {chain.funded && chain.sellerAddress && (
            <section>
              <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Faucet Funding</h3>
              <a
                href={`${SUISCAN}/account/${chain.sellerAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-violet-400 hover:text-violet-300 underline underline-offset-2 bg-slate-900/40 rounded px-3 py-2"
              >
                View {chain.sellerAddress.slice(0, 12)}… balance on Suiscan →
              </a>
            </section>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-slate-300 border-slate-700"
            onClick={() => copyText(allJson, 'json')}
          >
            {copied === 'json' ? 'Copied!' : 'Copy all as JSON'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-violet-400 border-violet-800"
            onClick={() => {
              const blob = new Blob([allJson], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `speed-${chain.sellerUid}.json`
              a.click()
              URL.revokeObjectURL(url)
            }}
          >
            Save as JSON
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ChainRow({
  label,
  uid,
  address,
  copied,
  onCopy,
}: {
  label: string
  uid: string
  address: string
  copied: string
  onCopy: (text: string, label: string) => void
}) {
  return (
    <div className="bg-slate-900/40 rounded-lg px-3 py-2 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
        <span className="text-xs font-mono text-slate-400">{uid}</span>
      </div>
      {address ? (
        <div className="flex items-center gap-2">
          <a
            href={`${SUISCAN}/account/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-violet-400 hover:text-violet-300 truncate"
          >
            {address}
          </a>
          <CopyBtn text={address} label={`addr-${label}`} copied={copied} onCopy={onCopy} />
        </div>
      ) : (
        <span className="text-xs text-slate-500">no address</span>
      )}
    </div>
  )
}

function CopyBtn({
  text,
  label,
  copied,
  onCopy,
}: {
  text: string
  label: string
  copied: string
  onCopy: (text: string, label: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onCopy(text, label)}
      className={cn(
        'shrink-0 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border transition-all',
        copied === label
          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200',
      )}
    >
      {copied === label ? 'copied' : 'copy'}
    </button>
  )
}
