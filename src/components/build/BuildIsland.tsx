/**
 * src/components/build/BuildIsland.tsx
 *
 * Three-step agent deploy wizard for /build.
 *
 * Step 1: Name + template selection
 * Step 2: Custom system prompt
 * Step 3: Deploy → POST /api/agents/sync → live in CF Worker
 *
 * Signals: ui:build:step-next, ui:build:step-back, ui:build:deploy
 */

import { useState, useTransition } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  ExternalLink,
  Loader2,
  PenLine,
  Rocket,
  Sparkles,
  User,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { emitClick } from '@/lib/ui-signal'
import {
  AGENT_TEMPLATES,
  type AgentTemplate,
  type TemplateId,
} from '@/lib/agents/templates'

// ─── constants ─────────────────────────────────────────────────────────────────

const TEMPLATE_ORDER: TemplateId[] = ['trader', 'researcher', 'writer', 'concierge', 'blank']

const TEMPLATE_META: Record<TemplateId, { icon: React.ReactNode; color: string; badge: string }> = {
  trader:     { icon: <Sparkles className="w-5 h-5" />, color: 'from-cyan-500 to-blue-500',    badge: 'Markets' },
  researcher: { icon: <Bot className="w-5 h-5" />,      color: 'from-violet-500 to-purple-500', badge: 'Research' },
  writer:     { icon: <PenLine className="w-5 h-5" />,  color: 'from-amber-500 to-orange-500',  badge: 'Content' },
  concierge:  { icon: <User className="w-5 h-5" />,     color: 'from-emerald-500 to-teal-500',  badge: 'Coordination' },
  blank:      { icon: <Zap className="w-5 h-5" />,      color: 'from-slate-500 to-slate-600',   badge: 'Custom' },
}

const STEPS = ['Name & template', 'System prompt', 'Deploy'] as const
type Step = 0 | 1 | 2

// ─── helpers ───────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function buildMarkdown(name: string, template: AgentTemplate, prompt: string): string {
  const finalPrompt = prompt.trim() || template.systemPrompt || `You are ${name}.`
  return [
    '---',
    `name: ${slugify(name)}`,
    'model: meta-llama/llama-4-maverick',
    'sensitivity: 0.6',
    '---',
    '',
    finalPrompt,
  ].join('\n')
}

// ─── types ─────────────────────────────────────────────────────────────────────

interface DeployResult {
  ok: boolean
  uid?: string
  wallet?: string | null
  error?: string
}

// ─── step components ───────────────────────────────────────────────────────────

interface Step1Props {
  name: string
  setName: (v: string) => void
  template: TemplateId
  setTemplate: (v: TemplateId) => void
  onNext: () => void
}

function Step1({ name, setName, template, setTemplate, onNext }: Step1Props) {
  const slug = slugify(name)

  return (
    <div className="space-y-6">
      {/* Template grid */}
      <div className="space-y-2">
        <Label className="text-slate-300 text-sm font-medium">Template</Label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TEMPLATE_ORDER.map((id) => {
            const t = AGENT_TEMPLATES[id]
            const meta = TEMPLATE_META[id]
            const active = template === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  emitClick('ui:build:select-template')
                  setTemplate(id)
                }}
                className={cn(
                  'flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500',
                  active
                    ? 'border-cyan-700/60 bg-[#1a2535] text-white ring-1 ring-cyan-700/40'
                    : 'border-[#252538] bg-[#161622] text-slate-400 hover:border-[#353550] hover:text-slate-300',
                )}
                aria-pressed={active}
              >
                <div className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br',
                  meta.color,
                )}>
                  {meta.icon}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm">{t.name}</div>
                  {t.description && (
                    <div className="text-xs text-slate-500 truncate">{t.description}</div>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className="ml-auto shrink-0 text-[10px] border-[#353550] text-slate-500"
                >
                  {meta.badge}
                </Badge>
              </button>
            )
          })}
        </div>
      </div>

      {/* Name input */}
      <div className="space-y-1.5">
        <Label htmlFor="build-name" className="text-slate-300 text-sm font-medium">
          Agent name
        </Label>
        <Input
          id="build-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. market-watcher"
          autoComplete="off"
          spellCheck={false}
          className="bg-[#161622] border-[#252538] text-white placeholder:text-slate-600 focus:border-cyan-700 focus:ring-cyan-700/30"
        />
        {name && (
          <p className="text-slate-600 text-xs pl-1">
            slug: <span className="font-mono text-slate-500">{slug || '…'}</span>
          </p>
        )}
      </div>

      <Button
        type="button"
        onClick={() => { emitClick('ui:build:step-next'); onNext() }}
        disabled={!slug}
        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-40"
      >
        Next
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  )
}

interface Step2Props {
  template: TemplateId
  prompt: string
  setPrompt: (v: string) => void
  onBack: () => void
  onNext: () => void
}

function Step2({ template, prompt, setPrompt, onBack, onNext }: Step2Props) {
  const defaultPrompt = AGENT_TEMPLATES[template].systemPrompt

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="build-prompt" className="text-slate-300 text-sm font-medium">
          System prompt
        </Label>
        {defaultPrompt && !prompt && (
          <p className="text-slate-500 text-xs">
            Leave blank to use the template default, or customise below.
          </p>
        )}
        <textarea
          id="build-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={12}
          placeholder={defaultPrompt || 'Describe what this agent does and how it should behave…'}
          className={cn(
            'w-full rounded-md border bg-[#161622] px-3 py-2 text-sm text-white',
            'placeholder:text-slate-600 border-[#252538]',
            'focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/30 focus:outline-none',
            'resize-y min-h-[200px]',
          )}
        />
        {defaultPrompt && !prompt && (
          <button
            type="button"
            onClick={() => setPrompt(defaultPrompt)}
            className="text-xs text-cyan-500 hover:text-cyan-400 underline underline-offset-2"
          >
            Use template default
          </button>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => { emitClick('ui:build:step-back'); onBack() }}
          className="flex-1 border-[#252538] text-slate-300 hover:bg-[#1e1e2a]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          type="button"
          onClick={() => { emitClick('ui:build:step-next'); onNext() }}
          className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white"
        >
          Next
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

interface Step3Props {
  name: string
  template: TemplateId
  prompt: string
  isPending: boolean
  result: DeployResult | null
  onBack: () => void
  onDeploy: () => void
}

function Step3({ name, template, prompt, isPending, result, onBack, onDeploy }: Step3Props) {
  const slug = slugify(name)
  const t = AGENT_TEMPLATES[template]
  const finalPrompt = prompt.trim() || t.systemPrompt

  return (
    <div className="space-y-5">
      {/* Summary card */}
      <div className="rounded-xl border border-[#252538] bg-[#161622] px-5 py-4 space-y-3">
        <p className="text-xs text-slate-500 uppercase tracking-widest">Summary</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Name</span>
          <span className="font-mono text-white">{slug}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Template</span>
          <Badge variant="outline" className="text-xs border-[#353550] text-slate-400">
            {t.name}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Prompt</span>
          <span className="text-slate-500 text-xs">
            {finalPrompt ? `${finalPrompt.slice(0, 40)}…` : 'none'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Endpoint</span>
          <span className="font-mono text-cyan-400 text-xs">pay.one.ie/{slug}</span>
        </div>
      </div>

      {/* Live in < 1 min indicator */}
      {isPending && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            Deploying to TypeDB…
          </div>
          <div className="w-full bg-[#161622] rounded-full h-1.5 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-cyan-600 to-blue-500 rounded-full animate-pulse w-3/4" />
          </div>
          <p className="text-slate-600 text-xs">Live in &lt;1 min</p>
        </div>
      )}

      {/* Success */}
      {result?.ok && (
        <Card className="border-emerald-800/40 bg-emerald-950/20">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Agent deployed
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {result.uid && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">UID</span>
                <span className="font-mono text-slate-300">{result.uid}</span>
              </div>
            )}
            <a
              href={`https://pay.one.ie/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              onClick={() => emitClick('ui:build:open-paylink')}
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              pay.one.ie/{slug}
            </a>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {result && !result.ok && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-red-800/40 bg-red-950/30 px-4 py-3 text-red-400 text-sm"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          {result.error ?? 'Deploy failed'}
        </div>
      )}

      {/* Actions */}
      {!result?.ok && (
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => { emitClick('ui:build:step-back'); onBack() }}
            disabled={isPending}
            className="flex-1 border-[#252538] text-slate-300 hover:bg-[#1e1e2a] disabled:opacity-40"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            type="button"
            onClick={() => { emitClick('ui:build:deploy'); onDeploy() }}
            disabled={isPending}
            className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-40"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Deploying…
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 mr-2" />
                Deploy
              </>
            )}
          </Button>
        </div>
      )}

      {result?.ok && (
        <div className="flex gap-3">
          <Button
            type="button"
            onClick={() => window.location.assign('/u/agents/new')}
            variant="outline"
            className="flex-1 border-[#252538] text-slate-300 hover:bg-[#1e1e2a]"
          >
            Create another
          </Button>
          <Button
            type="button"
            onClick={() => emitClick('ui:build:view-fleet')}
            className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white"
            asChild
          >
            <a href="/u/fleet">View fleet</a>
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── main island ───────────────────────────────────────────────────────────────

export function BuildIsland() {
  const [step, setStep] = useState<Step>(0)
  const [name, setName] = useState('')
  const [template, setTemplate] = useState<TemplateId>('blank')
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState<DeployResult | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDeploy() {
    const slug = slugify(name)
    if (!slug) return

    setResult(null)
    startTransition(async () => {
      try {
        const markdown = buildMarkdown(name, AGENT_TEMPLATES[template], prompt)
        const res = await fetch('/api/agents/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markdown }),
        })
        const data = (await res.json()) as DeployResult
        setResult(data)
      } catch (err) {
        setResult({
          ok: false,
          error: err instanceof Error ? err.message : 'Network error',
        })
      }
    })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 py-12">
      <div className="w-full max-w-xl mx-auto space-y-8">

        {/* ── header ── */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Build an Agent
          </h1>
          <p className="text-slate-400 text-sm">
            Live in &lt;1 minute. Deployed to Cloudflare, remembered in TypeDB.
          </p>
        </div>

        {/* ── step indicator ── */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0',
                step === i
                  ? 'bg-cyan-600 text-white'
                  : step > i
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#252538] text-slate-500',
              )}>
                {step > i ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={cn(
                'text-xs hidden sm:block',
                step === i ? 'text-white' : 'text-slate-500',
              )}>
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={cn('w-8 h-px', step > i ? 'bg-emerald-600' : 'bg-[#252538]')} />
              )}
            </div>
          ))}
        </div>

        {/* ── step content ── */}
        <div className="rounded-2xl border border-[#252538] bg-[#0f0f17] p-6">
          {step === 0 && (
            <Step1
              name={name}
              setName={setName}
              template={template}
              setTemplate={setTemplate}
              onNext={() => setStep(1)}
            />
          )}
          {step === 1 && (
            <Step2
              template={template}
              prompt={prompt}
              setPrompt={setPrompt}
              onBack={() => setStep(0)}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <Step3
              name={name}
              template={template}
              prompt={prompt}
              isPending={isPending}
              result={result}
              onBack={() => setStep(1)}
              onDeploy={handleDeploy}
            />
          )}
        </div>

      </div>
    </div>
  )
}
