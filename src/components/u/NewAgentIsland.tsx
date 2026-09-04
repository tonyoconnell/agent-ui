/**
 * src/components/u/NewAgentIsland.tsx
 *
 * New-agent creation form for /u/agents/new.
 *
 * - Template picker (5 options)
 * - Name input with <50ms deterministic address preview via /api/identity/:uid/address
 * - Submit: POST /api/agents/sync → agent in TypeDB
 * - Shows live link: pay.one.ie/<agentName> on success
 *
 * Signals: ui:agents:new-select-template, ui:agents:new-submit
 */

import {
  AlertCircle,
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  Copy,
  ExternalLink,
  Loader2,
  PenLine,
  Sparkles,
  User,
} from 'lucide-react'
import { useEffect, useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AGENT_TEMPLATES, type AgentTemplate, type TemplateId } from '@/lib/agents/templates'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'

// ─── constants ─────────────────────────────────────────────────────────────────

const TEMPLATE_ORDER: TemplateId[] = ['trader', 'researcher', 'writer', 'concierge', 'blank']

const TEMPLATE_ICONS: Record<TemplateId, React.ReactNode> = {
  trader: <Sparkles className="w-4 h-4" />,
  researcher: <Bot className="w-4 h-4" />,
  writer: <PenLine className="w-4 h-4" />,
  concierge: <User className="w-4 h-4" />,
  blank: <ChevronRight className="w-4 h-4" />,
}

const TEMPLATE_COLORS: Record<TemplateId, string> = {
  trader: 'border-primary-bright/60 bg-primary/10 text-primary-bright',
  researcher: 'border-secondary-bright/60 bg-secondary/10 text-secondary-bright',
  writer: 'border-gold/60 bg-gold/10 text-gold',
  concierge: 'border-tertiary-bright/60 bg-tertiary/10 text-tertiary-bright',
  blank: 'border-border bg-card/30 text-foreground',
}

// ─── helpers ───────────────────────────────────────────────────────────────────

/** Slugify an agent name to match how the API derives UIDs. */
function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

/** Build the markdown that /api/agents/sync expects. */
function buildMarkdown(name: string, template: AgentTemplate): string {
  return [
    '---',
    `name: ${slugify(name)}`,
    'model: meta-llama/llama-4-maverick',
    'sensitivity: 0.6',
    '---',
    '',
    template.systemPrompt || `You are ${name}.`,
  ].join('\n')
}

// ─── types ─────────────────────────────────────────────────────────────────────

interface SyncResult {
  ok: boolean
  uid?: string
  wallet?: string | null
  error?: string
}

// ─── component ─────────────────────────────────────────────────────────────────

export function NewAgentIsland() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('blank')
  const [name, setName] = useState('')
  const [agentAddress, setAgentAddress] = useState<string | null>(null)
  const [addressLoading, setAddressLoading] = useState(false)
  const [result, setResult] = useState<SyncResult | null>(null)
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)

  const addressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const template = AGENT_TEMPLATES[selectedTemplate]

  // ── deterministic address preview (debounced, <50ms after settle) ────────────
  useEffect(() => {
    if (addressTimer.current) clearTimeout(addressTimer.current)

    const slug = slugify(name)
    if (!slug) {
      setAgentAddress(null)
      return
    }

    // Optimistically clear while debouncing
    setAddressLoading(true)
    addressTimer.current = setTimeout(async () => {
      try {
        const uid = encodeURIComponent(slug)
        const res = await fetch(`/api/identity/${uid}/address`)
        if (!res.ok) throw new Error('address lookup failed')
        const data = (await res.json()) as { address?: string }
        setAgentAddress(data.address ?? null)
      } catch {
        setAgentAddress(null)
      } finally {
        setAddressLoading(false)
      }
    }, 300)

    return () => {
      if (addressTimer.current) clearTimeout(addressTimer.current)
    }
  }, [name])

  // ── template selection ───────────────────────────────────────────────────────
  function selectTemplate(id: TemplateId) {
    emitClick('ui:agents:new-select-template')
    setSelectedTemplate(id)
    setResult(null)
  }

  // ── submit ───────────────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const slug = slugify(name)
    if (!slug) return

    emitClick('ui:agents:new-submit')
    setResult(null)

    startTransition(async () => {
      try {
        const markdown = buildMarkdown(name, template)
        const res = await fetch('/api/agents/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markdown }),
        })
        const data = (await res.json()) as SyncResult
        setResult(data)
      } catch (err) {
        setResult({
          ok: false,
          error: err instanceof Error ? err.message : 'Network error',
        })
      }
    })
  }

  // ── copy address ─────────────────────────────────────────────────────────────
  async function copyAddress() {
    if (!agentAddress) return
    await navigator.clipboard.writeText(agentAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const slug = slugify(name)
  const canSubmit = slug.length > 0 && !isPending

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="w-full max-w-lg mx-auto space-y-8">
        {/* ── header ── */}
        <div>
          <h1 className="text-2xl font-semibold text-white mb-1">New Agent</h1>
          <p className="text-muted-foreground text-sm">Pick a template, give it a name, and deploy in seconds.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── template picker ── */}
          <div className="space-y-2">
            <Label className="text-foreground text-sm font-medium">Template</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TEMPLATE_ORDER.map((id) => {
                const t = AGENT_TEMPLATES[id]
                const active = selectedTemplate === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectTemplate(id)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-all',
                      'hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-bright',
                      active
                        ? cn(
                            TEMPLATE_COLORS[id],
                            'ring-2 ring-offset-1 ring-offset-background',
                            id === 'trader'
                              ? 'ring-primary-bright'
                              : id === 'researcher'
                                ? 'ring-secondary-bright'
                                : id === 'writer'
                                  ? 'ring-gold'
                                  : id === 'concierge'
                                    ? 'ring-tertiary-bright'
                                    : 'ring-muted-foreground',
                          )
                        : 'border-border bg-card text-muted-foreground',
                    )}
                    aria-pressed={active}
                  >
                    <span className="shrink-0">{TEMPLATE_ICONS[id]}</span>
                    <span className="font-medium truncate">{t.name}</span>
                  </button>
                )
              })}
            </div>
            {template.description && <p className="text-muted-foreground text-xs pl-1 pt-1">{template.description}</p>}
          </div>

          {/* ── name input ── */}
          <div className="space-y-1.5">
            <Label htmlFor="agent-name" className="text-foreground text-sm font-medium">
              Agent name
            </Label>
            <Input
              id="agent-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setResult(null)
              }}
              placeholder="e.g. my-trader"
              autoComplete="off"
              spellCheck={false}
              className="bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary-bright focus:ring-primary-bright/30"
            />
            {/* slug preview */}
            {name && (
              <p className="text-muted-foreground text-xs pl-1">
                uid: <span className="font-mono text-muted-foreground">{slug || '…'}</span>
              </p>
            )}
          </div>

          {/* ── deterministic address card ── */}
          {slug && (
            <div className="rounded-xl border border-border bg-card px-4 py-3 space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Agent address</p>
              {addressLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="text-xs font-mono">deriving…</span>
                </div>
              ) : agentAddress ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-foreground truncate">{agentAddress}</span>
                  <button
                    type="button"
                    onClick={copyAddress}
                    aria-label="Copy address"
                    className="shrink-0 text-muted-foreground hover:text-white transition-colors"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-tertiary-bright" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground font-mono">—</span>
              )}
            </div>
          )}

          {/* ── submit button ── */}
          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-primary-bright text-background hover:opacity-90 text-white disabled:opacity-40 transition-colors"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Creating…
              </>
            ) : (
              <>
                Create agent
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>

        {/* ── success state ── */}
        {result?.ok && (
          <Card className="border-tertiary-bright/40 bg-tertiary/20">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm text-tertiary-bright flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Agent created
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              {result.uid && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">UID</span>
                  <span className="font-mono text-foreground">{result.uid}</span>
                </div>
              )}
              {result.wallet && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Wallet</span>
                  <span className="font-mono text-foreground truncate max-w-[200px]">{result.wallet}</span>
                </div>
              )}
              {slug && (
                <a
                  href={`https://pay.one.ie/${slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary-bright hover:text-[hsl(var(--color-primary-bright))] transition-colors"
                  onClick={() => emitClick('ui:agents:new-open-paylink')}
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  pay.one.ie/{slug}
                </a>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── error state ── */}
        {result && !result.ok && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-[hsl(var(--color-destructive)_/_0.4)] bg-[hsl(var(--color-destructive)_/_0.15)] px-4 py-3 text-[hsl(var(--color-destructive))] text-sm"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {result.error ?? 'Agent creation failed'}
          </div>
        )}

        {/* ── back link ── */}
        <div className="text-center pt-2">
          <a href="/u" className="text-muted-foreground text-xs hover:text-foreground underline underline-offset-2">
            Back to wallet
          </a>
        </div>
      </div>
    </div>
  )
}
