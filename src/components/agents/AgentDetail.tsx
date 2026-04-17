/**
 * AgentDetail — Agent profile + embedded chat
 *
 * Top section: agent info, skills, tags, model (shadcn Card/Badge).
 * Bottom section: chat with the agent using its system prompt.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { emitClick } from '@/lib/ui-signal'

interface Skill {
  name: string
  price: number
  tags: string[]
  description?: string
}

interface AgentData {
  id: string
  name: string
  group: string
  model: string
  tags: string[]
  skills: Skill[]
  channels: string[]
  sensitivity: number
  prompt: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

interface Props {
  agentId: string
}

// ─── Component ─────────────────────────────────────────────────────────────

export function AgentDetail({ agentId }: Props) {
  const [agent, setAgent] = useState<AgentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/agents/detail?id=${encodeURIComponent(agentId)}`, {
      signal: AbortSignal.timeout(10000),
    })
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 404 ? 'Agent not found' : `Error ${r.status}`)
        return r.json() as Promise<AgentData>
      })
      .then(setAgent)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [agentId])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading agent...</div>
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen p-6 max-w-4xl mx-auto">
        <a href="/agents" className="text-sm text-primary hover:text-primary/80 mb-4 inline-block">
          &larr; All agents
        </a>
        <div className="text-muted-foreground text-center py-12">{error || 'Agent not found'}</div>
      </div>
    )
  }

  const modelShort = agent.model.split('/').pop() || agent.model

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <a href="/agents" className="text-sm text-primary hover:text-primary/80 mb-6 inline-block">
        &larr; All agents
      </a>

      {/* Agent Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{agent.name}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <span>{agent.group}</span>
                <span className="text-muted-foreground/40">·</span>
                <span className="font-mono text-xs">{modelShort}</span>
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {agent.channels.map((ch) => (
                <Badge key={ch} variant="secondary">
                  {ch}
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Sensitivity meter */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>sensitivity</span>
              <span>{agent.sensitivity.toFixed(2)}</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${agent.sensitivity * 100}%` }}
              />
            </div>
          </div>

          {/* Tags */}
          {agent.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {agent.tags.map((t) => (
                <a key={t} href={`/agents?tag=${encodeURIComponent(t)}`}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-secondary">
                    #{t}
                  </Badge>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skills */}
      {agent.skills.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              Skills
              <span className="text-muted-foreground font-normal ml-2">{agent.skills.length}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {agent.skills.map((skill) => (
                <div
                  key={skill.name}
                  className="flex items-start justify-between p-3 rounded-lg bg-secondary/50 border"
                >
                  <div className="space-y-1">
                    <div className="font-mono text-sm font-medium">{skill.name}</div>
                    {skill.description && <div className="text-xs text-muted-foreground">{skill.description}</div>}
                    {skill.tags.length > 0 && (
                      <div className="flex gap-1">
                        {skill.tags.map((t) => (
                          <span key={t} className="text-[10px] text-muted-foreground">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {skill.price > 0 && (
                    <Badge variant="outline" className="font-mono text-xs shrink-0 ml-2">
                      {skill.price.toFixed(3)}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Section */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="text-sm">Chat with {agent.name}</CardTitle>
          <CardDescription className="text-xs">Uses this agent's system prompt and personality</CardDescription>
        </CardHeader>
        <AgentChat agent={agent} />
      </Card>
    </div>
  )
}

// ─── Agent Chat ────────────────────────────────────────────────────────────

function AgentChat({ agent }: { agent: AgentData }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || sending) return

    emitClick('ui:agents:chat-send', { agent: agent.id })
    setInput('')
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text }
    const assistantId = crypto.randomUUID()
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '', streaming: true }

    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setSending(true)

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: agent.prompt,
          messages: [...history, { role: 'user', content: text }],
        }),
      })

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += dec.decode(value, { stream: true })
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: full } : m)))
      }

      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m)))
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `Error: ${err instanceof Error ? err.message : 'failed'}`, streaming: false }
            : m,
        ),
      )
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }, [input, sending, messages, agent.id, agent.prompt])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex flex-col" style={{ height: '480px' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <p className="text-sm">Start a conversation with {agent.name}</p>
            <p className="text-xs text-muted-foreground/60 font-mono">{agent.model.split('/').pop()}</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {m.content}
              {m.streaming && (
                <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-current opacity-70 animate-pulse align-middle" />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t px-6 py-4">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder={`Message ${agent.name}...`}
            rows={1}
            className="flex-1 resize-none rounded-xl border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[48px] max-h-[120px] overflow-y-auto"
            style={{ height: 'auto' }}
            onInput={(e) => {
              const t = e.currentTarget
              t.style.height = 'auto'
              t.style.height = `${Math.min(t.scrollHeight, 120)}px`
            }}
          />
          <button
            type="button"
            onClick={send}
            disabled={sending || !input.trim()}
            className="h-12 px-5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-40 text-primary-foreground text-sm font-medium transition-colors"
          >
            {sending ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
