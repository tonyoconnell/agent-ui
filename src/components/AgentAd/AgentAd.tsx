import { emitClick } from '@/lib/ui-signal'
import { type LifecycleStage, useAgentLifecycle } from './useAgentLifecycle'

interface Props {
  agentId: string
  skill: string
  price: number
  headline: string
  description?: string
}

const STEP_LABELS: Record<LifecycleStage, string> = {
  idle: '',
  deriving: 'Deriving wallet…',
  registering: 'Registering…',
  discovering: 'Discovering agent…',
  signaling: 'Signalling…',
  done: 'Complete',
  error: 'Error',
}

function StepRow({ label, value, active, done }: { label: string; value?: string; active?: boolean; done?: boolean }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="mt-0.5 w-3 flex-none">
        {done ? (
          <span className="text-emerald-400">✓</span>
        ) : active ? (
          <span className="text-indigo-400 animate-pulse">⟳</span>
        ) : (
          <span className="text-slate-600">·</span>
        )}
      </span>
      <span className={done ? 'text-slate-300' : active ? 'text-slate-400' : 'text-slate-600'}>{label}</span>
      {value && <span className="ml-auto font-mono text-xs text-slate-500 truncate max-w-[140px]">{value}</span>}
    </div>
  )
}

export function AgentAd({ agentId, skill, price, headline, description }: Props) {
  const { state, run, reset } = useAgentLifecycle({ agentId, skill })
  const { stage, buyerUid, wallet, agent, result, error } = state

  const idle = stage === 'idle'
  const running = !idle && stage !== 'done' && stage !== 'error'
  const done = stage === 'done'
  const errored = stage === 'error'

  const handleRun = () => {
    emitClick('ui:ad:button', { receiver: `${agentId}:${skill}` })
    run()
  }

  return (
    <div className="rounded-lg border border-[#252538] bg-[#161622] p-5 flex flex-col gap-4 w-full max-w-sm">
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

      {/* Lifecycle steps — only shown after first click */}
      {!idle && (
        <div className="flex flex-col gap-2 border border-[#252538] rounded bg-[#0a0a0f] px-4 py-3">
          <StepRow
            label="Wallet"
            value={wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : (buyerUid ?? undefined)}
            done={!!wallet}
            active={stage === 'deriving'}
          />
          <StepRow
            label="Registered"
            value={buyerUid ?? undefined}
            done={['discovering', 'signaling', 'done', 'error'].includes(stage)}
            active={stage === 'registering'}
          />
          <StepRow
            label="Discovered"
            value={agent ? `${agent.uid} · ⬆ ${agent.strength.toFixed(1)}` : undefined}
            done={!!agent && stage !== 'discovering'}
            active={stage === 'discovering'}
          />
          <StepRow label="Signalled" done={done} active={stage === 'signaling'} />
          {agent && <StepRow label="Path" value={`entry→${agentId} +1`} done={done} active={false} />}
        </div>
      )}

      {/* Result */}
      {done && result && (
        <div className="rounded border border-emerald-900/50 bg-emerald-950/20 px-3 py-2 text-sm text-emerald-300 leading-relaxed max-h-40 overflow-y-auto">
          {result}
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
                reset()
              }
            : handleRun
        }
        disabled={running}
        className="w-full px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-40 bg-indigo-600 hover:bg-indigo-500 text-white"
      >
        {running ? STEP_LABELS[stage] : done ? 'Run again' : errored ? 'Retry' : `Run · $${price.toFixed(2)}`}
      </button>
    </div>
  )
}
