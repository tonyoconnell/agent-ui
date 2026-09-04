import { useReducer, useTransition } from 'react'
import { emitClick } from '@/lib/ui-signal'

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
    <div className="flex flex-col gap-6 p-6 bg-background text-font min-w-[420px]">
      {/* Step progress */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                i <= stepIdx
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground border border-border'
              }`}
            >
              {i + 1}
            </div>
            <span className={`text-sm ${i === stepIdx ? 'text-font' : 'text-muted-foreground'}`}>{STEP_LABELS[i]}</span>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-border mx-1" />}
          </div>
        ))}
      </div>

      {/* Step 1: Configure */}
      {state.step === 'configure' && (
        <form onSubmit={handleDeploy} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-xs text-muted-foreground">
              Worker name
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="my-claw"
              className="bg-card border border-border rounded px-3 py-2 text-sm text-font"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="persona" className="text-xs text-muted-foreground">
              Persona
            </label>
            <select
              id="persona"
              name="persona"
              defaultValue="one"
              className="bg-card border border-border rounded px-3 py-2 text-sm text-font"
            >
              {['one', 'donal', 'debby', 'concierge', 'custom'].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="telegramToken" className="text-xs text-muted-foreground">
              Telegram token <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="telegramToken"
              name="telegramToken"
              type="password"
              placeholder="123456:ABC…"
              className="bg-card border border-border rounded px-3 py-2 text-sm text-font"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="openrouterKey" className="text-xs text-muted-foreground">
              OpenRouter API key <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="openrouterKey"
              name="openrouterKey"
              type="password"
              placeholder="sk-or-…"
              className="bg-card border border-border rounded px-3 py-2 text-sm text-font"
            />
            <p className="text-xs text-muted-foreground">Leave blank to use platform key</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-sm text-muted-foreground hover:text-font"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-1.5 rounded bg-primary hover:bg-primary/80 text-sm text-primary-foreground disabled:opacity-50"
            >
              Deploy →
            </button>
          </div>
        </form>
      )}

      {/* Step 2: Deploying */}
      {state.step === 'deploy' && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm font-medium">Deploying worker…</p>
          <p className="text-xs text-muted-foreground">This takes ~30s</p>
          {state.error && (
            <div className="w-full rounded-md bg-destructive/20 border border-destructive/40 px-4 py-3 text-sm text-destructive">
              {state.error}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Done */}
      {state.step === 'done' && state.result && (
        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium text-tertiary-bright">Worker deployed</p>
          {(
            [
              ['Worker URL', state.result.workerUrl],
              ['API Key', state.result.apiKey],
              ...(state.result.webhookUrl ? [['Webhook URL', state.result.webhookUrl]] : []),
            ] as [string, string][]
          ).map(([label, val]) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{label}</span>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-card border border-border px-3 py-1.5 text-xs text-foreground truncate">
                  {val}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    emitClick('ui:add-claw:copy')
                    copy(val)
                  }}
                  className="px-3 py-1.5 rounded border border-border text-xs text-muted-foreground hover:text-font shrink-0"
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
              className="px-4 py-1.5 rounded bg-primary hover:bg-primary/80 text-sm text-primary-foreground"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
