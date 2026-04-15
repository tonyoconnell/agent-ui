import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { type DropdownGroup, type DropdownItem, dropdownGroups } from '@/lib/chat/ad-dropdowns'
import { DEFAULT_MODEL, POPULAR_MODELS } from '@/lib/chat/models'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'

type Message = { id: string; role: 'user' | 'assistant'; content: string; streaming?: boolean }

export function AdChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState<DropdownGroup['label'] | ''>('')
  const [firstTokenMs, setFirstTokenMs] = useState<number | null>(null)
  const [firstAssistantId, setFirstAssistantId] = useState<string | null>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const hasTypedRef = useRef(false)

  const hasMessages = messages.length > 0

  const modelMeta = useMemo(() => {
    const m = POPULAR_MODELS.find((x) => x.id === DEFAULT_MODEL)
    return { name: m?.name ?? DEFAULT_MODEL, provider: m?.providers?.[0] ?? '' }
  }, [])

  useEffect(() => {
    if (hasMessages) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [hasMessages])

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return
      const userId = crypto.randomUUID()
      const assistantId = crypto.randomUUID()
      const history = messages.map((m) => ({ role: m.role, content: m.content }))

      setMessages((prev) => [
        ...prev,
        { id: userId, role: 'user', content: text },
        { id: assistantId, role: 'assistant', content: '', streaming: true },
      ])
      setInput('')
      setLoading(true)
      setFirstAssistantId((prev) => prev ?? assistantId)
      if (taRef.current) {
        taRef.current.style.height = 'auto'
        taRef.current.focus()
      }

      const t0 = performance.now()
      emitClick('ui:ad:send', { type: 'text', content: text })

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: DEFAULT_MODEL,
            messages: [...history, { role: 'user', content: text }],
          }),
        })

        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

        const reader = res.body.getReader()
        const dec = new TextDecoder()
        let full = ''
        let gotFirst = false

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (!gotFirst) {
            gotFirst = true
            const latencyMs = Math.round(performance.now() - t0)
            setFirstTokenMs((prev) => prev ?? latencyMs)
            emitClick('ui:ad:first-token', { type: 'text', content: String(latencyMs) })
          }
          full += dec.decode(value, { stream: true })
          setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: full } : m)))
        }

        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m)))
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: `Error: ${(err as Error).message}`, streaming: false } : m,
          ),
        )
      } finally {
        setLoading(false)
      }
    },
    [messages, loading],
  )

  const onPick = (label: DropdownGroup['label'], item: DropdownItem, index: number) => {
    emitClick('ui:ad:pick-question', { type: 'text', content: `${label}:${index}:${item.text}` })
    setActiveCategory('')
    send(item.text)
  }

  const onOpenDropdown = (label: DropdownGroup['label']) => {
    if (activeCategory === label) return
    setActiveCategory(label)
    emitClick('ui:ad:open-dropdown', { type: 'text', content: label })
  }

  const activeGroup = dropdownGroups.find((g) => g.label === activeCategory)

  const inputDock = (
    <form
      className={cn('flex gap-2 items-end w-full', hasMessages && 'border-t bg-background px-4 py-4')}
      onSubmit={(e) => {
        e.preventDefault()
        send(input)
      }}
    >
      <div className={cn('flex gap-2 items-end w-full', hasMessages && 'max-w-2xl mx-auto')}>
        <textarea
          ref={taRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onInput={(e) => {
            const t = e.currentTarget
            t.style.height = 'auto'
            t.style.height = `${Math.min(t.scrollHeight, 160)}px`
            if (!hasTypedRef.current && t.value.length > 0) {
              hasTypedRef.current = true
              emitClick('ui:ad:type', { type: 'text', content: '' })
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send(input)
            }
          }}
          placeholder="Ask anything…"
          rows={1}
          className={cn(
            'flex-1 resize-none rounded-2xl border bg-background px-4 py-3 text-base leading-7 focus:outline-none focus:ring-2 focus:ring-primary',
            hasMessages && 'min-h-[52px] max-h-[160px] overflow-y-auto',
          )}
        />
        <Button type="submit" disabled={!input.trim() || loading} className="h-[52px] px-5 rounded-2xl text-base">
          {loading ? '…' : '⏎'}
        </Button>
      </div>
    </form>
  )

  const metaLine = (
    <div className="text-center text-xs uppercase tracking-[0.12em] text-muted-foreground">
      {firstTokenMs !== null ? (
        <>
          {firstTokenMs}ms · {modelMeta.name}
          {modelMeta.provider ? ` · ${modelMeta.provider}` : ''}
        </>
      ) : (
        <>
          {modelMeta.name}
          {modelMeta.provider ? ` · ${modelMeta.provider}` : ''}
        </>
      )}
    </div>
  )

  /* ── Pre-send: centered intro ── */
  if (!hasMessages) {
    return (
      <div className="grid w-full min-h-[100svh] place-items-center px-4">
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">
          <h1 className="text-center text-2xl font-light tracking-tight text-foreground">one — enter our world</h1>

          {inputDock}

          {metaLine}

          <div className="flex flex-col gap-4" onMouseLeave={() => setActiveCategory('')}>
            <div className="flex justify-center gap-2">
              {dropdownGroups.map((g) => (
                <button
                  key={g.label}
                  type="button"
                  onMouseEnter={() => onOpenDropdown(g.label)}
                  onClick={() => onOpenDropdown(g.label)}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-xs uppercase tracking-[0.12em] transition-all',
                    activeCategory === g.label
                      ? 'bg-accent text-foreground scale-105'
                      : 'bg-muted text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>

            <div className="relative min-h-[220px]">
              {activeGroup && (
                <div className="flex flex-col gap-1 animate-in slide-in-from-top-4 fade-in duration-300">
                  {activeGroup.items.map((item, index) => (
                    <button
                      key={item.text}
                      type="button"
                      onClick={() => onPick(activeGroup.label, item, index)}
                      style={{ animationDelay: `${index * 40}ms` }}
                      className="text-center text-base leading-7 px-4 py-2 rounded-lg hover:bg-accent/50 transition-colors animate-in fade-in"
                    >
                      {item.text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── Post-send: full chat layout ── */
  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto w-full space-y-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-3 text-base leading-7 whitespace-pre-wrap',
                  m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
                )}
              >
                {m.content}
                {m.streaming && (
                  <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-current opacity-70 animate-pulse align-middle" />
                )}
                {m.role === 'assistant' && m.id === firstAssistantId && firstTokenMs !== null && !m.streaming && (
                  <div className="mt-2 text-xs uppercase tracking-[0.12em] opacity-60">
                    {firstTokenMs}ms · {modelMeta.name}
                    {modelMeta.provider ? ` · ${modelMeta.provider}` : ''}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input dock */}
      {inputDock}
    </div>
  )
}
