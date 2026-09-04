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
import { useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AGENT_TEMPLATES, type AgentTemplate, type TemplateId } from '@/lib/agents/templates'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'

// ─── constants ─────────────────────────────────────────────────────────────────

const TEMPLATE_ORDER: TemplateId[] = ['trader', 'researcher', 'writer', 'concierge', 'blank']

const TEMPLATE_META: Record<TemplateId, { icon: React.ReactNode; color: string; badge: string }> = {
  trader: { icon: <Sparkles className="w-5 h-5" />, color: 'from-cyan-500 to-blue-500', badge: 'Markets' },
  researcher: { icon: <Bot className="w-5 h-5" />, color: 'from-violet-500 to-purple-500', badge: 'Research' },
  writer: { icon: <PenLine className="w-5 h-5" />, color: 'from-amber-500 to-orange-500', badge: 'Content' },
  concierge: { icon: <User className="w-5 h-5" />, color: 'from-emerald-500 to-teal-500', badge: 'Coordination' },
  blank: { icon: <Zap className="w-5 h-5" />, color: 'from-slate-500 to-slate-600', badge: 'Custom' },
}

const STEPS = ['Name & template', 'System prompt', 'Deploy'] as const
type Step = 0 | 1 | 2

// ─── helpers ───────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
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
        <Label className="text-foreground text-sm font-medium">Template</Label>
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
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-primary-bright))]',
                  active
                    ? 'border-[hsl(var(--color-primary-mid))/0.6] bg-card text-font ring-1 ring-[hsl(var(--color-primary-mid))/0.4]'
                    : 'border-border bg-card text-muted-foreground hover:border-border hover:text-foreground',
                )}
                aria-pressed={active}
              >
                <div
                  className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br',
                    meta.color,
                  )}
                >
                  {meta.icon}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm">{t.name}</div>
                  {t.description && <div className="text-xs text-muted-foreground truncate">{t.description}</div>}
                </div>
                <Badge variant="outline" className="ml-auto shrink-0 text-[10px] border-border text-muted-foreground">
                  {meta.badge}
                </Badge>
              </button>
            )
          })}
        </div>
      </div>

      {/* Name input */}
      <div className="space-y-1.5">
        <Label htmlFor="build-name" className="text-foreground text-sm font-medium">
          Agent name
        </Label>
        <Input
          id="build-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. market-watcher"
          autoComplete="off"
          spellCheck={false}
          className="bg-card border-border text-font placeholder:text-muted-foreground focus:border-[hsl(var(--color-primary-mid))] focus:ring-[hsl(var(--color-primary-mid))/0.3]"
        />
        {name && (
          <p className="text-muted-foreground text-xs pl-1">
            slug: <span className="font-mono text-muted-foreground">{slug || '…'}</span>
          </p>
        )}
      </div>

      <Button
        type="button"
        onClick={() => {
          emitClick('ui:build:step-next')
          onNext()
        }}
        disabled={!slug}
        className="w-full bg-[hsl(var(--color-primary-bright))] hover:bg-[hsl(var(--color-primary-bright)/0.8)] text-white disabled:opacity-40"
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
        <Label htmlFor="build-prompt" className="text-foreground text-sm font-medium">
          System prompt
        </Label>
        {defaultPrompt && !prompt && (
          <p className="text-muted-foreground text-xs">Leave blank to use the template default, or customise below.</p>
        )}
        <textarea
          id="build-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={12}
          placeholder={defaultPrompt || 'Describe what this agent does and how it should behave…'}
          className={cn(
            'w-full rounded-md border bg-card px-3 py-2 text-sm text-font',
            'placeholder:text-muted-foreground border-border',
            'focus:border-[hsl(var(--color-primary-mid))] focus:ring-2 focus:ring-[hsl(var(--color-primary-mid))/0.3] focus:outline-none',
            'resize-y min-h-[200px]',
          )}
        />
        {defaultPrompt && !prompt && (
          <button
            type="button"
            onClick={() => setPrompt(defaultPrompt)}
            className="text-xs text-[hsl(var(--color-primary-bright))] hover:text-[hsl(var(--color-primary-bright)/0.8)] underline underline-offset-2"
          >
            Use template default
          </button>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            emitClick('ui:build:step-back')
            onBack()
          }}
          className="flex-1 border-border text-foreground hover:bg-muted"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          type="button"
          onClick={() => {
            emitClick('ui:build:step-next')
            onNext()
          }}
          className="flex-1 bg-[hsl(var(--color-primary-bright))] hover:bg-[hsl(var(--color-primary-bright)/0.8)] text-white"
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
      <div className="rounded-xl border border-border bg-card px-5 py-4 space-y-3">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">Summary</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Name</span>
          <span className="font-mono text-white">{slug}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Template</span>
          <Badge variant="outline" className="text-xs border-border text-muted-foreground">
            {t.name}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Prompt</span>
          <span className="text-muted-foreground text-xs">{finalPrompt ? `${finalPrompt.slice(0, 40)}…` : 'none'}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Endpoint</span>
          <span className="font-mono text-primary-bright text-xs">pay.one.ie/{slug}</span>
        </div>
      </div>

      {/* Live in < 1 min indicator */}
      {isPending && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-primary-bright" />
            Deploying to TypeDB…
          </div>
          <div className="w-full bg-card rounded-full h-1.5 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-[hsl(var(--color-primary-bright))] to-[hsl(var(--color-primary-mid))] rounded-full animate-pulse w-3/4" />
          </div>
          <p className="text-muted-foreground text-xs">Live in &lt;1 min</p>
        </div>
      )}

      {/* Success */}
      {result?.ok && (
        <Card className="border-[hsl(var(--color-tertiary-mid))/0.4] bg-[hsl(var(--color-tertiary-bright))/0.1]">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm text-[hsl(var(--color-tertiary-bright))] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Agent deployed
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {result.uid && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">UID</span>
                <span className="font-mono text-foreground">{result.uid}</span>
              </div>
            )}
            <a
              href={`https://pay.one.ie/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-[hsl(var(--color-primary-bright))] hover:text-[hsl(var(--color-primary-bright)/0.8)] transition-colors"
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
          className="flex items-center gap-2 rounded-lg border border-[hsl(var(--color-destructive))/0.4] bg-[hsl(var(--color-destructive))/0.1] px-4 py-3 text-[hsl(var(--color-destructive))] text-sm"
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
            onClick={() => {
              emitClick('ui:build:step-back')
              onBack()
            }}
            disabled={isPending}
            className="flex-1 border-border text-foreground hover:bg-muted disabled:opacity-40"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            type="button"
            onClick={() => {
              emitClick('ui:build:deploy')
              onDeploy()
            }}
            disabled={isPending}
            className="flex-1 bg-[hsl(var(--color-primary-bright))] hover:bg-[hsl(var(--color-primary-bright)/0.8)] text-white disabled:opacity-40"
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
            className="flex-1 border-border text-foreground hover:bg-muted"
          >
            Create another
          </Button>
          <Button
            type="button"
            onClick={() => emitClick('ui:build:view-fleet')}
            className="flex-1 bg-[hsl(var(--color-primary-bright))] hover:bg-[hsl(var(--color-primary-bright)/0.8)] text-white"
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
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="w-full max-w-xl mx-auto space-y-8">
        {/* ── header ── */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-font mb-2">Build an Agent</h1>
          <p className="text-muted-foreground text-sm">
            Live in &lt;1 minute. Deployed to Cloudflare, remembered in TypeDB.
          </p>
        </div>

        {/* ── step indicator ── */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0',
                  step === i
                    ? 'bg-[hsl(var(--color-primary-bright))] text-white'
                    : step > i
                      ? 'bg-[hsl(var(--color-tertiary-bright))] text-white'
                      : 'bg-muted text-muted-foreground',
                )}
              >
                {step > i ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={cn('text-xs hidden sm:block', step === i ? 'text-font' : 'text-muted-foreground')}>
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={cn('w-8 h-px', step > i ? 'bg-[hsl(var(--color-tertiary-bright))]' : 'bg-muted')} />
              )}
            </div>
          ))}
        </div>

        {/* ── step content ── */}
        <div className="rounded-2xl border border-border bg-card p-6">
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
