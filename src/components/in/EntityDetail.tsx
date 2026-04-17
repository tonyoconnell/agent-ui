import { Archive, Bookmark, Check, Reply, Send, Share2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { InboxEntity } from '@/data/in-types'
import { emitClick } from '@/lib/ui-signal'

interface EntityDetailProps {
  entity: InboxEntity | null
}

export function EntityDetail({ entity }: EntityDetailProps) {
  const [reply, setReply] = useState('')

  if (!entity) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="space-y-2 text-center">
          <div className="text-4xl">✉</div>
          <p className="text-sm">Select an item to view</p>
        </div>
      </div>
    )
  }

  const isMessage = entity.dimension === 'events' && entity.channel !== 'substrate'

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-[#252538] bg-[#0d0d14] px-6 py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-700/10 font-mono text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/20">
            {entity.code ?? entity.dimension.slice(0, 3).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold text-foreground">{entity.title}</h2>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{entity.subtitle}</p>
          </div>
          <time className="flex-shrink-0 whitespace-nowrap text-[11px] font-medium text-muted-foreground">
            {new Date(entity.timestamp).toLocaleString()}
          </time>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="mx-auto max-w-2xl space-y-5">
          <p className="text-sm leading-relaxed text-foreground/90">{entity.body ?? entity.preview}</p>

          {entity.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {entity.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#161622] px-2.5 py-1 text-xs font-medium text-muted-foreground ring-1 ring-[#252538]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {entity.related && entity.related.length > 0 && (
            <section>
              <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Related</h3>
              <div className="flex flex-wrap gap-1.5">
                {entity.related.map((id) => (
                  <span
                    key={id}
                    className="rounded-full bg-emerald-500/5 px-2.5 py-1 font-mono text-[11px] text-emerald-300/80 ring-1 ring-emerald-500/20"
                  >
                    {id}
                  </span>
                ))}
              </div>
            </section>
          )}

          {entity.properties && Object.keys(entity.properties).length > 0 && (
            <section>
              <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Properties
              </h3>
              <dl className="space-y-1.5 rounded-lg border border-[#252538] bg-[#0d0d14] p-3 text-xs">
                {Object.entries(entity.properties).map(([k, v]) => (
                  <div key={k} className="flex gap-3">
                    <dt className="w-32 flex-shrink-0 font-medium text-muted-foreground">{k}</dt>
                    <dd className="text-foreground/90">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      </div>

      <footer className="border-t border-[#252538] bg-[#0d0d14]">
        <div className="flex items-center gap-1 border-b border-[#252538] px-3 py-2">
          {[
            { id: 'reply', label: 'Reply', icon: Reply },
            { id: 'share', label: 'Share', icon: Share2 },
            { id: 'save', label: 'Save', icon: Bookmark },
            { id: 'archive', label: 'Archive', icon: Archive },
            { id: 'complete', label: 'Complete', icon: Check },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => emitClick(`ui:in:${id}`, { entityId: entity.id })}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-[#161622] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {isMessage && (
          <form
            className="p-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!reply.trim()) return
              emitClick('ui:in:send', { entityId: entity.id, text: reply })
              setReply('')
            }}
          >
            <div className="flex gap-2">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (!reply.trim()) return
                    emitClick('ui:in:send', { entityId: entity.id, text: reply })
                    setReply('')
                  }
                }}
                rows={1}
                placeholder={`Reply to ${entity.sender ?? 'conversation'}…`}
                className="flex-1 resize-none rounded-xl border border-[#252538] bg-[#0a0a0f] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <Button
                type="submit"
                disabled={!reply.trim()}
                className="gap-1.5 rounded-xl bg-emerald-600 px-4 text-black hover:bg-emerald-500"
              >
                <Send className="h-3.5 w-3.5" />
                Send
              </Button>
            </div>
          </form>
        )}
      </footer>
    </div>
  )
}
