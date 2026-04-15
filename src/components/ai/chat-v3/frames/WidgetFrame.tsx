import { MessageCircle, X } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { Button } from '@/components/ui/button'
import { emitClick } from '@/lib/ui-signal'

interface Props {
  children: ReactNode
  /** Badge count — number of messages since last open. */
  unreadCount?: number
}

/**
 * WidgetFrame — bottom-right bubble + slide-up panel.
 *
 * The bubble sits fixed in the bottom-right corner.
 * Clicking it slides up a 600px panel containing the full chat shell.
 * An unread badge counts messages received while minimized.
 */
export function WidgetFrame({ children, unreadCount = 0 }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Slide-up panel */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-96 h-[600px] flex flex-col rounded-2xl border border-border bg-background shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/95 backdrop-blur-sm shrink-0">
            <span className="text-sm font-semibold">Chat</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { emitClick('ui:widget:close'); setOpen(false) }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {/* Chat content */}
          <div className="relative flex-1 overflow-hidden">{children}</div>
        </div>
      )}

      {/* Bubble trigger */}
      <button
        type="button"
        onClick={() => { emitClick('ui:widget:toggle'); setOpen((v) => !v) }}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-all"
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && !open && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </>
  )
}
