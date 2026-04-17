import { useReducer, useTransition } from 'react'

interface Props {
  groupId: string
  onClose: () => void
}

type Step = 'configure' | 'deploy' | 'done'
interface State {
  step: Step
  result?: { workerUrl: string; apiKey: string; webhookUrl?: string }
  error?: string
}
type Action = { type: 'deploying' } | { type: 'done'; result: State['result'] } | { type: 'error'; error: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'deploying':
      return { step: 'deploy' }
    case 'done':
      return { step: 'done', result: action.result }
    case 'error':
      return { ...state, step: 'deploy', error: action.error }
  }
}

const STEPS: Step[] = ['configure', 'deploy', 'done']
const STEP_LABELS = ['Configure', 'Deploy', 'Done']

function copy(text: string) {
  navigator.clipboard.writeText(text)
}

export function AddClawWizard({ groupId, onClose }: Props) {
  const [state, dispatch] = useReducer(reducer, { step: 'configure' })
  const [isPending, startTransition] = useTransition()

  const stepIdx = STEPS.indexOf(state.step)

  const handleDeploy = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    dispatch({ type: 'deploying' })
    startTransition(async () => {
      try {
        const res = await fetch('/api/claw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.get('name'),
            persona: form.get('persona'),
            telegramToken: form.get('telegramToken') || undefined,
            openrouterKey: form.get('openrouterKey') || undefined,
            groupId,
          }),
        })
        const data = (await res.json()) as {
          ok?: boolean
          error?: string
          workerUrl: string
          apiKey: string
          webhookUrl?: string
        }
        if (!res.ok) throw new Error(data.error ?? 'Deploy failed')
        dispatch({ type: 'done', result: data })
      } catch (err) {
        dispatch({ type: 'error', error: (err as Error).message })
      }
    })
  }

  return (
    <div className="flex flex-col gap-6 p-6 bg-[#0a0a0f] text-slate-100 min-w-[420px]">
      {/* Step progress */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                i <= stepIdx ? 'bg-indigo-600 text-white' : 'bg-[#161622] text-slate-500 border border-[#252538]'
              }`}
            >
              {i + 1}
            </div>
            <span className={`text-sm ${i === stepIdx ? 'text-slate-100' : 'text-slate-500'}`}>{STEP_LABELS[i]}</span>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-[#252538] mx-1" />}
          </div>
        ))}
      </div>

      {/* Step 1: Configure */}
      {state.step === 'configure' && (
        <form onSubmit={handleDeploy} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-xs text-slate-400">
              Worker name
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="my-claw"
              className="bg-[#161622] border border-[#252538] rounded px-3 py-2 text-sm text-slate-100"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="persona" className="text-xs text-slate-400">
              Persona
            </label>
            <select
              id="persona"
              name="persona"
              defaultValue="one"
              className="bg-[#161622] border border-[#252538] rounded px-3 py-2 text-sm text-slate-100"
            >
              {['one', 'donal', 'debby', 'concierge', 'custom'].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="telegramToken" className="text-xs text-slate-400">
              Telegram token <span className="text-slate-600">(optional)</span>
            </label>
            <input
              id="telegramToken"
              name="telegramToken"
              type="password"
              placeholder="123456:ABC…"
              className="bg-[#161622] border border-[#252538] rounded px-3 py-2 text-sm text-slate-100"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="openrouterKey" className="text-xs text-slate-400">
              OpenRouter API key <span className="text-slate-600">(optional)</span>
            </label>
            <input
              id="openrouterKey"
              name="openrouterKey"
              type="password"
              placeholder="sk-or-…"
              className="bg-[#161622] border border-[#252538] rounded px-3 py-2 text-sm text-slate-100"
            />
            <p className="text-xs text-slate-600">Leave blank to use platform key</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-sm text-slate-400 hover:text-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-sm text-white disabled:opacity-50"
            >
              Deploy →
            </button>
          </div>
        </form>
      )}

      {/* Step 2: Deploying */}
      {state.step === 'deploy' && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-sm font-medium">Deploying worker…</p>
          <p className="text-xs text-slate-500">This takes ~30s</p>
          {state.error && (
            <div className="w-full rounded-md bg-red-900/20 border border-red-700/40 px-4 py-3 text-sm text-red-400">
              {state.error}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Done */}
      {state.step === 'done' && state.result && (
        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium text-green-400">Worker deployed</p>
          {(
            [
              ['Worker URL', state.result.workerUrl],
              ['API Key', state.result.apiKey],
              ...(state.result.webhookUrl ? [['Webhook URL', state.result.webhookUrl]] : []),
            ] as [string, string][]
          ).map(([label, val]) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="text-xs text-slate-400">{label}</span>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-[#161622] border border-[#252538] px-3 py-1.5 text-xs text-slate-300 truncate">
                  {val}
                </code>
                <button
                  type="button"
                  onClick={() => copy(val)}
                  className="px-3 py-1.5 rounded border border-[#252538] text-xs text-slate-400 hover:text-slate-100 shrink-0"
                >
                  Copy
                </button>
              </div>
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-sm text-white"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
