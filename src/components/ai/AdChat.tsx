import { useCallback, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { type DropdownGroup, type DropdownItem, dropdownGroups } from '@/lib/chat/ad-dropdowns'
import { DEFAULT_MODEL, POPULAR_MODELS } from '@/lib/chat/models'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'

type Message = { id: string; role: 'user' | 'assistant'; content: string; streaming?: boolean }

export function AdChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [activeCategory, setActiveCategory] = useState<DropdownGroup['label'] | ''>('')
  const [sent, setSent] = useState(false)
  const [firstTokenMs, setFirstTokenMs] = useState<number | null>(null)
  const [firstAssistantId, setFirstAssistantId] = useState<string | null>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const hasTypedRef = useRef(false)

  const modelMeta = useMemo(() => {
    const m = POPULAR_MODELS.find((x) => x.id === DEFAULT_MODEL)
    const providers = m?.providers?.[0] ?? ''
    return { name: m?.name ?? DEFAULT_MODEL, provider: providers }
  }, [])

  const send = useCallback(
    async (text: string) => {
      if (!text.trim()) return
      const userId = crypto.randomUUID()
      const assistantId = crypto.randomUUID()
      const history = messages.map((m) => ({ role: m.role, content: m.content }))
      setMessages((prev) => [
        ...prev,
        { id: userId, role: 'user', content: text },
        { id: assistantId, role: 'assistant', content: '', streaming: true },
      ])
      setInput('')
      setSent(true)
      setFirstAssistantId((prev) => prev ?? assistantId)
      if (taRef.current) taRef.current.style.height = 'auto'

      const t0 = performance.now()
      emitClick('ui:ad:send', {
        type: 'text',
        content: text,
      })

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
            emitClick('ui:ad:first-token', {
              type: 'text',
              content: String(latencyMs),
            })
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
      }
    },
    [messages],
  )

  const onPick = (label: DropdownGroup['label'], item: DropdownItem, index: number) => {
    emitClick('ui:ad:pick-question', {
      type: 'text',
      content: `${label}:${index}:${item.text}`,
    })
    setActiveCategory('')
    send(item.text)
  }

  const onOpenDropdown = (label: DropdownGroup['label']) => {
    if (activeCategory === label) return
    setActiveCategory(label)
    emitClick('ui:ad:open-dropdown', {
      type: 'text',
      content: label,
    })
  }

  const activeGroup = dropdownGroups.find((g) => g.label === activeCategory)

  return (
    <div
      className={cn(
        'grid w-full min-h-[100svh] px-4 transition-all duration-500',
        sent ? 'place-items-start pt-[12vh]' : 'place-items-center',
      )}
    >
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">
        {!sent && (
          <h1 className="text-center text-sm font-light text-muted-foreground tracking-wide">ONE — ask anything</h1>
        )}

        <form
          className="flex gap-2 items-end"
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
        >
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
            placeholder="Ask anything..."
            rows={1}
            className="flex-1 resize-none rounded-2xl border bg-background px-4 py-3 text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button type="submit" disabled={!input.trim()}>
            ⏎
          </Button>
        </form>

        {!sent && (
          <div className="flex flex-col gap-3" onMouseLeave={() => setActiveCategory('')}>
            <div className="flex justify-center gap-6">
              {dropdownGroups.map((g) => (
                <button
                  key={g.label}
                  type="button"
                  onMouseEnter={() => onOpenDropdown(g.label)}
                  onClick={() => onOpenDropdown(g.label)}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-sm transition-all',
                    activeCategory === g.label ? 'bg-accent scale-105' : 'bg-muted hover:bg-accent/50',
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
                      className="text-left text-sm leading-relaxed px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors animate-in fade-in"
                    >
                      {item.text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {sent && (
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
                    m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
                  )}
                >
                  {m.content}
                  {m.streaming && (
                    <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-current opacity-70 animate-pulse align-middle" />
                  )}
                  {m.role === 'assistant' && m.id === firstAssistantId && firstTokenMs !== null && !m.streaming && (
                    <div className="mt-2 text-xs opacity-60">
                      ⚡ {firstTokenMs}ms · {modelMeta.name}
                      {modelMeta.provider ? ` · ${modelMeta.provider}` : ''}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
