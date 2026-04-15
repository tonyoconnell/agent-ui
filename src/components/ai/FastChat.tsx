import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { DEFAULT_MODEL } from '@/lib/chat/models'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

/**
 * FastChat — single prompt → Groq → stream.
 * No director. No agents. No overhead.
 * Default model: groq:meta-llama/llama-4-scout-17b-16e-instruct (~445ms)
 */
export function FastChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text }
    const assistantId = crypto.randomUUID()
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '', streaming: true }

    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setLoading(true)

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }))
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
      setLoading(false)
      textareaRef.current?.focus()
    }
  }, [input, loading, messages])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-3xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <span className="text-4xl">⚡</span>
            <p className="text-sm">Llama 4 Scout · Groq LPU · ~445ms</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
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
      <div className="border-t bg-background px-4 py-4">
        <div className="max-w-3xl mx-auto flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ask anything... (Enter to send)"
            rows={1}
            className="flex-1 resize-none rounded-xl border bg-muted px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[48px] max-h-[160px] overflow-y-auto"
            style={{ height: 'auto' }}
            onInput={(e) => {
              const t = e.currentTarget
              t.style.height = 'auto'
              t.style.height = `${Math.min(t.scrollHeight, 160)}px`
            }}
          />
          <Button onClick={send} disabled={loading || !input.trim()} className="h-12 px-5 rounded-xl">
            {loading ? '...' : '⚡ Send'}
          </Button>
        </div>
      </div>
    </div>
  )
}
