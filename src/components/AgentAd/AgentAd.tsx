import { useState } from 'react'
import { emitClick } from '@/lib/ui-signal'
import { type LifecycleStage, useAgentLifecycle } from './useAgentLifecycle'

interface Props {
  agentId: string
  skill: string
  price: number
  headline: string
  description?: string
}

const SUISCAN = 'https://suiscan.xyz/testnet'

const STAGE_ORDER: LifecycleStage[] = [
  'wallet',
  'funding',
  'listing',
  'discovering',
  'signaling',
  'selling',
  'subscribing',
  'browsing',
  'buying',
  'done',
]

const STAGE_LABELS: Record<string, string> = {
  wallet: 'Wallet',
  funding: 'Fund',
  listing: 'List',
  discovering: 'Discover',
  signaling: 'Signal',
  selling: 'Sell',
  subscribing: 'Subscribe',
  browsing: 'Browse',
  buying: 'Buy',
  done: 'Complete',
}

const STAGE_HINTS: Record<string, string> = {
  wallet: 'derive Sui addresses',
  funding: 'testnet faucet → real SUI',
  listing: 'register skill + subscribe',
  discovering: 'signal market → pheromone routes',
  signaling: 'execute via routed agent',
  selling: 'buyer pays seller',
  subscribing: 'subscribe to buy tags',
  browsing: 'signal market → find buyer',
  buying: 'spend earnings',
  done: 'commerce loop closed',
}

function stageIndex(stage: LifecycleStage): number {
  return STAGE_ORDER.indexOf(stage)
}

function isDone(current: LifecycleStage, check: LifecycleStage): boolean {
  if (current === 'done') return true
  return stageIndex(current) > stageIndex(check)
}

function isActive(current: LifecycleStage, check: LifecycleStage): boolean {
  return current === check
}

function StepRow({
  label,
  hint,
  value,
  active,
  done,
  ms,
}: {
  label: string
  hint: string
  value?: string
  active?: boolean
  done?: boolean
  ms?: number
}) {
  return (
    <div className="flex items-center gap-2 text-sm py-0.5">
      <span className="w-3 flex-none text-center">
        {done ? (
          <span className="text-emerald-400">✓</span>
        ) : active ? (
          <span className="text-amber-400 animate-pulse">⟳</span>
        ) : (
          <span className="text-slate-600">·</span>
        )}
      </span>
      <span className={done ? 'text-slate-200 font-medium' : active ? 'text-slate-300' : 'text-slate-600'}>
        {label}
      </span>
      <span className="text-slate-600 text-xs hidden sm:inline">{hint}</span>
      <span className="ml-auto flex items-center gap-2">
        {value && <span className="font-mono text-xs text-slate-500 truncate max-w-[120px]">{value}</span>}
        {ms !== undefined && ms > 0 && <span className="font-mono text-[10px] text-slate-600">{ms.toFixed(0)}ms</span>}
      </span>
    </div>
  )
}

/* ── Copyable row ──────────────────────────────────────────────────────────── */

function CopyRow({ label, value, href }: { label: string; value: string; href?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    emitClick('ui:agent-ad:copy')
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }
  return (
    <div className="flex items-start gap-2 py-1">
      <span className="text-slate-500 text-[10px] uppercase tracking-wider w-16 flex-none pt-0.5">{label}</span>
      <span className="font-mono text-xs text-slate-300 break-all flex-1 select-all">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-400 hover:text-violet-300 underline underline-offset-2"
          >
            {value}
          </a>
        ) : (
          value
        )}
      </span>
      <button type="button" onClick={copy} className="text-[10px] text-slate-600 hover:text-slate-400 flex-none">
        {copied ? '✓' : 'copy'}
      </button>
    </div>
  )
}

/* ── Main ──────────────────────────────────────────────────────────────────── */

export function AgentAd({ agentId, skill, price, headline, description }: Props) {
  const { state, run, reset } = useAgentLifecycle({ agentId, skill })
  const {
    stage,
    buyerUid,
    sellerUid,
    buyerAddress,
    sellerAddress,
    agent,
    result,
    error,
    funded,
    earned,
    spent,
    digests,
    stageTimings,
    totalMs,
    listings,
    buyTarget,
  } = state

  const [showData, setShowData] = useState(false)

  const idle = stage === 'idle'
  const running = !idle && stage !== 'done' && stage !== 'error'
  const done = stage === 'done'
  const errored = stage === 'error'

  const handleRun = () => {
    emitClick('ui:ad:button', { receiver: `${agentId}:${skill}` })
    run()
  }

  return (
    <div className="rounded-lg border border-[#252538] bg-[#161622] p-5 flex flex-col gap-4 w-full max-w-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
            {agentId} · {skill}
          </div>
          <div className="text-base text-white mt-1 font-medium">{headline}</div>
          {description && <div className="text-sm text-slate-400 mt-0.5">{description}</div>}
        </div>
        <div className="text-right flex-none">
          <div className="text-[10px] font-mono tracking-widest text-slate-500">PRICE</div>
          <div className="font-mono text-white text-sm mt-0.5">${price.toFixed(2)}</div>
        </div>
      </div>

      {/* Stage rail — pill badges */}
      {!idle && (
        <div className="flex flex-wrap gap-1">
          {STAGE_ORDER.filter((s) => s !== 'done').map((s) => {
            const d = isDone(stage, s)
            const a = isActive(stage, s)
            return (
              <span
                key={s}
                className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-medium transition-all ${
                  d
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : a
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                      : 'bg-slate-800/50 text-slate-600 border border-slate-700/30'
                }`}
              >
                {STAGE_LABELS[s]}
              </span>
            )
          })}
        </div>
      )}

      {/* Lifecycle steps */}
      {!idle && (
        <div className="flex flex-col gap-0.5 border border-[#252538] rounded bg-[#0a0a0f] px-3 py-2">
          <StepRow
            label={STAGE_LABELS.wallet}
            hint={STAGE_HINTS.wallet}
            value={buyerAddress ? `${buyerAddress.slice(0, 6)}…${buyerAddress.slice(-4)}` : undefined}
            done={isDone(stage, 'wallet')}
            active={isActive(stage, 'wallet')}
            ms={stageTimings.wallet}
          />
          <StepRow
            label={STAGE_LABELS.funding}
            hint={STAGE_HINTS.funding}
            value={funded ? 'funded' : undefined}
            done={isDone(stage, 'funding')}
            active={isActive(stage, 'funding')}
            ms={stageTimings.funding}
          />
          <StepRow
            label={STAGE_LABELS.listing}
            hint={STAGE_HINTS.listing}
            value={sellerUid ?? undefined}
            done={isDone(stage, 'listing')}
            active={isActive(stage, 'listing')}
            ms={stageTimings.listing}
          />
          <StepRow
            label={STAGE_LABELS.discovering}
            hint={STAGE_HINTS.discovering}
            value={agent ? `${agent.uid} · ⬆${agent.strength.toFixed(1)}` : undefined}
            done={isDone(stage, 'discovering')}
            active={isActive(stage, 'discovering')}
            ms={stageTimings.discovering}
          />
          <StepRow
            label={STAGE_LABELS.signaling}
            hint={STAGE_HINTS.signaling}
            done={isDone(stage, 'signaling')}
            active={isActive(stage, 'signaling')}
            ms={stageTimings.signaling}
          />
          <StepRow
            label={STAGE_LABELS.selling}
            hint={STAGE_HINTS.selling}
            value={earned > 0 ? `+${earned} SUI` : undefined}
            done={isDone(stage, 'selling')}
            active={isActive(stage, 'selling')}
            ms={stageTimings.selling}
          />
          <StepRow
            label={STAGE_LABELS.subscribing}
            hint={STAGE_HINTS.subscribing}
            done={isDone(stage, 'subscribing')}
            active={isActive(stage, 'subscribing')}
            ms={stageTimings.subscribing}
          />
          <StepRow
            label={STAGE_LABELS.browsing}
            hint={STAGE_HINTS.browsing}
            value={listings.length > 0 ? `${listings.length} found` : undefined}
            done={isDone(stage, 'browsing')}
            active={isActive(stage, 'browsing')}
            ms={stageTimings.browsing}
          />
          <StepRow
            label={STAGE_LABELS.buying}
            hint={buyTarget ? `→ ${buyTarget}` : STAGE_HINTS.buying}
            value={spent > 0 ? `-${spent} SUI` : undefined}
            done={isDone(stage, 'buying')}
            active={isActive(stage, 'buying')}
            ms={stageTimings.buying}
          />
        </div>
      )}

      {/* Result — only show if it's a real LLM response, not signal metadata */}
      {done && result && !result.startsWith('{') && result !== 'signal delivered' && (
        <div className="rounded border border-emerald-900/50 bg-emerald-950/20 px-3 py-2 text-sm text-emerald-300 leading-relaxed max-h-32 overflow-y-auto">
          {result}
        </div>
      )}

      {/* Commerce summary + View Live Data */}
      {done && (
        <div className="space-y-3">
          {/* Quick summary */}
          <div className="rounded border border-cyan-900/40 bg-cyan-950/10 px-3 py-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono tracking-widest text-cyan-500 uppercase">Commerce Loop</span>
              <span className="font-mono text-xs text-cyan-400">{totalMs}ms</span>
            </div>
            <div className="text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-0.5">
              <span>
                earned <span className="font-mono text-emerald-400">+{earned} SUI</span>
              </span>
              <span>
                spent <span className="font-mono text-amber-400">-{spent} SUI</span>
              </span>
              {agent && (
                <span>
                  routed <span className="font-mono text-violet-400">{agent.uid}</span>
                </span>
              )}
              {buyTarget && (
                <span>
                  buyer <span className="font-mono text-violet-400">{buyTarget}</span>
                </span>
              )}
            </div>
          </div>

          {/* View Live Data button */}
          <button
            type="button"
            onClick={() => {
              emitClick('ui:ad:view-data')
              setShowData((v) => !v)
            }}
            className="w-full px-3 py-2 rounded border border-violet-800/60 bg-violet-950/20 text-sm font-medium text-violet-300 hover:bg-violet-900/30 hover:text-violet-200 transition-colors text-center"
          >
            {showData ? 'hide live data' : 'view live data →'}
          </button>

          {/* ── Live Data Panel ─────────────────────────────────────────── */}
          {showData && (
            <div className="rounded border border-[#252538] bg-[#0a0a0f] p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Wallets */}
              <div>
                <div className="text-[10px] font-mono tracking-widest text-cyan-500 uppercase mb-2">Wallets</div>
                {buyerAddress && (
                  <CopyRow label="buyer" value={buyerAddress} href={`${SUISCAN}/account/${buyerAddress}`} />
                )}
                {sellerAddress && (
                  <CopyRow label="seller" value={sellerAddress} href={`${SUISCAN}/account/${sellerAddress}`} />
                )}
              </div>

              {/* Identity */}
              <div>
                <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-2">Identity</div>
                {buyerUid && <CopyRow label="buyer" value={buyerUid} />}
                {sellerUid && <CopyRow label="seller" value={sellerUid} />}
                {agent && <CopyRow label="routed" value={agent.uid} />}
                {buyTarget && <CopyRow label="target" value={buyTarget} />}
              </div>

              {/* Conversation / Signal Result */}
              {result && (
                <div>
                  <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-2">
                    Signal Response
                  </div>
                  <div className="rounded border border-[#252538] bg-[#161622] px-3 py-2 text-xs text-slate-300 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap font-mono">
                    {result}
                  </div>
                </div>
              )}

              {/* Transactions */}
              <div>
                <div className="text-[10px] font-mono tracking-widest text-emerald-500 uppercase mb-2">
                  Transactions
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>
                      {buyerUid} → {sellerUid}
                    </span>
                    <span className="font-mono text-emerald-400">+{earned} SUI</span>
                  </div>
                  {buyTarget && (
                    <div className="flex items-center justify-between text-slate-300">
                      <span>
                        {sellerUid} → {buyTarget}
                      </span>
                      <span className="font-mono text-amber-400">-{spent} SUI</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-slate-400 border-t border-[#252538] pt-1 mt-1">
                    <span>net</span>
                    <span className="font-mono text-cyan-400">{(earned - spent).toFixed(4)} SUI</span>
                  </div>
                </div>
              </div>

              {/* Chain Digests */}
              {digests.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono tracking-widest text-violet-500 uppercase mb-2">
                    On-Chain Proofs
                  </div>
                  <div className="space-y-1">
                    {digests.map((d) => (
                      <div key={d.digest} className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500 w-12">{d.stage}</span>
                        <a
                          href={`${SUISCAN}/tx/${d.digest}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-violet-400 hover:text-violet-300 underline underline-offset-2 truncate"
                        >
                          {d.digest}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timing breakdown */}
              <div>
                <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-2">Timing</div>
                <div className="grid grid-cols-3 gap-x-3 gap-y-0.5 text-xs">
                  {STAGE_ORDER.filter((s) => s !== 'done' && stageTimings[s] !== undefined).map((s) => (
                    <div key={s} className="flex justify-between">
                      <span className="text-slate-500">{STAGE_LABELS[s]}</span>
                      <span className="font-mono text-slate-400">{stageTimings[s]?.toFixed(0)}ms</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-1 pt-1 border-t border-[#252538] text-xs">
                  <span className="text-cyan-500 font-medium">Total</span>
                  <span className="font-mono text-cyan-400">{totalMs}ms</span>
                </div>
              </div>

              {/* Pheromone paths */}
              <div>
                <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-2">Paths Learned</div>
                <div className="space-y-0.5 text-xs font-mono">
                  <div className="text-slate-300">
                    {buyerUid} → {sellerUid} <span className="text-emerald-400">+strength</span>
                  </div>
                  {buyTarget && (
                    <div className="text-slate-300">
                      {sellerUid} → {buyTarget} <span className="text-emerald-400">+strength</span>
                    </div>
                  )}
                  <div className="text-slate-500 text-[10px] mt-1">
                    each run increases path strength — the substrate learns which sellers deliver
                  </div>
                </div>
              </div>

              {/* Marketplace discovery */}
              {listings.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-2">Marketplace</div>
                  <div className="space-y-1 text-xs">
                    {listings.map((l, i) => (
                      <div key={`${l.provider}-${i}`} className="flex items-center justify-between text-slate-300">
                        <span>
                          {l.name} <span className="text-slate-500">by {l.provider}</span>
                        </span>
                        <span className="font-mono text-slate-400">{l.price} SUI</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {errored && error && (
        <div className="rounded border border-red-900/50 bg-red-950/20 px-3 py-2 text-sm text-red-400">{error}</div>
      )}

      {/* Action button */}
      <button
        type="button"
        onClick={
          done || errored
            ? () => {
                emitClick('ui:ad:reset')
                setShowData(false)
                reset()
              }
            : handleRun
        }
        disabled={running}
        className="w-full px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-40 bg-indigo-600 hover:bg-indigo-500 text-white"
      >
        {running
          ? `${STAGE_LABELS[stage] ?? 'Running'}…`
          : done
            ? 'Run again'
            : errored
              ? 'Retry'
              : `Run · $${price.toFixed(2)}`}
      </button>
    </div>
  )
}
