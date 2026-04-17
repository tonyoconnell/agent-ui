import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ClawAdminProps {
  /** Base URL of the nanoclaw worker to monitor */
  clawUrl?: string
  /** Display name for the admin (shown on sent messages) */
  adminName?: string
}

const DEFAULT_CLAW_URL = 'https://debby-claw.oneie.workers.dev'

interface Conversation {
  group_id: string
  message_count: number
  last_ts: number
  last_message: string
  last_role: string
  handle: string | null
  onboarding_stage: string | null
  session_count: number | null
}

interface Message {
  id: string
  sender: string
  content: string
  role: string
  ts: number
}

export function ClawAdmin({ clawUrl, adminName = 'admin' }: ClawAdminProps) {
  const CLAW_URL =
    clawUrl ||
    new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('claw') ||
    DEFAULT_CLAW_URL
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)
  const [broadcast, setBroadcast] = useState('')
  const [broadcasting, setBroadcasting] = useState(false)
  const [broadcastResult, setBroadcastResult] = useState<{ sent: number; total: number } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch(`${CLAW_URL}/conversations`)
      if (!res.ok) return
      const data = await res.json()
      setConversations(data.conversations || [])
    } catch {}
  }, [CLAW_URL])

  // Load messages for selected conversation
  const loadMessages = useCallback(
    async (group: string) => {
      try {
        const res = await fetch(`${CLAW_URL}/messages/${encodeURIComponent(group)}`)
        if (!res.ok) return
        const data = await res.json()
        setMessages(data.messages || [])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      } catch {}
    },
    [CLAW_URL],
  )

  // Poll conversations every 5s
  useEffect(() => {
    loadConversations()
    const id = setInterval(loadConversations, 5000)
    return () => clearInterval(id)
  }, [loadConversations])

  // Poll selected conversation messages every 3s
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (!selected) return
    loadMessages(selected)
    pollRef.current = setInterval(() => loadMessages(selected), 3000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [selected, loadMessages])

  // Send reply as admin
  const sendReply = useCallback(async () => {
    if (!reply.trim() || !selected || loading) return
    setLoading(true)
    try {
      await fetch(`${CLAW_URL}/conversations/${encodeURIComponent(selected)}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: reply, sender: adminName }),
      })
      setReply('')
      await loadMessages(selected)
    } catch {}
    setLoading(false)
  }, [reply, selected, loading, loadMessages, adminName, CLAW_URL])

  // Broadcast to all conversations
  const sendBroadcast = useCallback(async () => {
    if (!broadcast.trim() || broadcasting) return
    setBroadcasting(true)
    setBroadcastResult(null)
    try {
      const res = await fetch(`${CLAW_URL}/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: broadcast, sender: adminName }),
      })
      if (res.ok) {
        const data = await res.json()
        setBroadcastResult({ sent: data.sent, total: data.total })
        setBroadcast('')
        // Refresh conversations to show the new messages
        loadConversations()
      }
    } catch {}
    setBroadcasting(false)
  }, [broadcast, broadcasting, CLAW_URL, adminName, loadConversations])

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts
    if (diff < 60000) return 'just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar: conversation list */}
      <div className="w-80 border-r overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Live Conversations</h2>
          <p className="text-xs text-muted-foreground mt-1">{conversations.length} active</p>
        </div>
        {conversations.map((c) => (
          <button
            key={c.group_id}
            type="button"
            onClick={() => setSelected(c.group_id)}
            className={cn(
              'w-full text-left p-3 border-b hover:bg-accent/50 transition-colors',
              selected === c.group_id && 'bg-accent',
            )}
          >
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium truncate">{c.handle || c.group_id.slice(0, 20)}</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{timeAgo(c.last_ts)}</span>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-1">{c.last_message?.slice(0, 60)}</p>
            <div className="flex gap-2 mt-1">
              {c.session_count && (
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{c.session_count} sessions</span>
              )}
              {c.onboarding_stage && c.onboarding_stage !== 'active' && (
                <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">{c.onboarding_stage}</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Main: conversation detail + reply */}
      <div className="flex-1 flex flex-col">
        {/* Broadcast bar — always visible at top */}
        <div className="border-b bg-green-950/30 p-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-green-400">Broadcast to all</span>
              <span className="text-xs text-muted-foreground">({conversations.length} conversations)</span>
              {broadcastResult && (
                <span className="text-xs text-green-400 ml-auto">
                  Sent to {broadcastResult.sent}/{broadcastResult.total} channels
                </span>
              )}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                sendBroadcast()
              }}
            >
              <textarea
                value={broadcast}
                onChange={(e) => setBroadcast(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendBroadcast()
                  }
                }}
                placeholder="Type a message to send to every student…"
                rows={1}
                className="flex-1 resize-none rounded-2xl border border-green-500/30 bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <Button
                type="submit"
                disabled={!broadcast.trim() || broadcasting}
                className="bg-green-600 hover:bg-green-700 rounded-2xl px-4"
              >
                {broadcasting ? 'Sending…' : 'Broadcast'}
              </Button>
            </form>
          </div>
        </div>

        {!selected ? (
          <div className="flex-1 grid place-items-center text-muted-foreground">Select a conversation to view</div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="max-w-2xl mx-auto space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap',
                        m.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : m.sender === adminName
                            ? 'bg-green-500/20 text-foreground border border-green-500/30'
                            : 'bg-muted text-foreground',
                      )}
                    >
                      {m.sender === adminName && (
                        <div className="text-xs font-medium text-green-400 mb-1">{adminName} (you)</div>
                      )}
                      {m.content}
                      <div className="text-xs opacity-40 mt-1">{timeAgo(m.ts)}</div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            </div>

            {/* Reply dock */}
            <form
              className="border-t p-4"
              onSubmit={(e) => {
                e.preventDefault()
                sendReply()
              }}
            >
              <div className="max-w-2xl mx-auto flex gap-2">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendReply()
                    }
                  }}
                  placeholder={`Reply as ${adminName}…`}
                  rows={1}
                  className="flex-1 resize-none rounded-2xl border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <Button
                  type="submit"
                  disabled={!reply.trim() || loading}
                  className="bg-green-600 hover:bg-green-700 rounded-2xl px-4"
                >
                  {loading ? '…' : `Send as ${adminName}`}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
