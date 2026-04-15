// @ts-nocheck
/**
 * Telegram-Style Message Component
 *
 * Simple, clean message bubbles like Telegram/WhatsApp
 * Supports streaming text, agent messages, tool calls, file edits, etc.
 */

import { CheckIcon, Clock, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ConversationMessage } from '@/lib/claude-code-events'
import { AGENT_PROFILES } from '@/lib/claude-code-events'
import { cn } from '@/lib/utils'
import { MarkdownContent } from './MarkdownContent'

interface TelegramMessageProps {
  message: ConversationMessage
  isUser?: boolean
}

export function TelegramMessage({ message, isUser = false }: TelegramMessageProps) {
  const profile =
    message.sender in AGENT_PROFILES ? AGENT_PROFILES[message.sender as keyof typeof AGENT_PROFILES] : null

  const avatar = message.avatar || profile?.avatar || '👤'
  const senderName = profile?.name || message.sender

  // Use the same background for all messages (matching prompt input)
  const messageColor = 'bg-[hsl(var(--color-sidebar))] text-foreground border border-border'

  const time = new Date(message.timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div
      className={cn(
        'flex gap-3 mb-1 animate-in fade-in slide-in-from-bottom-2 duration-300',
        isUser ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg">
          {avatar}
        </div>
      )}

      {/* Message Bubble */}
      <div className={cn('flex flex-col', isUser ? 'items-end' : 'items-start', 'max-w-[80%]')}>
        {/* Sender Name (only for non-user messages) */}
        {!isUser && <div className="text-base font-medium text-muted-foreground mb-1 px-2">{senderName}</div>}

        {/* Message Content */}
        <div
          className={cn('rounded-2xl px-5 py-4 shadow-sm', messageColor, isUser ? 'rounded-tr-sm' : 'rounded-tl-sm')}
        >
          {/* Tool/File/Command Metadata */}
          {message.metadata && (
            <div className="mb-2">
              {message.metadata.toolName && (
                <Badge variant="secondary" className="mb-2 text-xs">
                  {message.metadata.toolName}
                  {message.metadata.duration && <span className="ml-1">({message.metadata.duration.toFixed(2)}s)</span>}
                </Badge>
              )}
              {message.metadata.filePath && (
                <div className="text-xs font-mono opacity-75 mb-1">{message.metadata.filePath}</div>
              )}
            </div>
          )}

          {/* Main Content */}
          <div className="text-base leading-relaxed">
            {message.content ? (
              <MarkdownContent content={message.content} />
            ) : message.isStreaming ? (
              /* Typing indicator when streaming with no content yet */
              <div className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
                <span className="inline-block w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
                <span className="inline-block w-2 h-2 rounded-full bg-current animate-bounce" />
              </div>
            ) : null}
          </div>

          {/* Command Output */}
          {message.metadata?.output && (
            <div className="mt-2 p-2 rounded bg-black/10 dark:bg-white/10 font-mono text-xs overflow-x-auto max-h-40 overflow-y-auto">
              {message.metadata.output}
            </div>
          )}

          {/* Time and Status */}
          <div className="flex items-center justify-end gap-1 mt-1 opacity-70">
            <span className="text-xs">{time}</span>
            {message.isStreaming ? (
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium">streaming</span>
                <Loader2 className="h-3 w-3 animate-spin" />
              </div>
            ) : message.isComplete ? (
              <CheckIcon className="h-3 w-3" />
            ) : (
              <Clock className="h-3 w-3" />
            )}
          </div>
        </div>

        {/* Agents Assigned (for director messages) */}
        {message.metadata?.agents && message.metadata.agents.length > 0 && (
          <div className="flex gap-1 mt-2 px-2">
            {message.metadata.agents.map((agent, idx) => {
              const agentProfile = AGENT_PROFILES[agent as keyof typeof AGENT_PROFILES]
              return (
                <div
                  key={idx}
                  className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-xs"
                  title={agentProfile?.name || agent}
                >
                  <span>{agentProfile?.avatar || '🔧'}</span>
                  <span className="font-medium">{agentProfile?.name || agent}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * System Message (centered, no bubble)
 */
export function SystemMessage({ message }: { message: ConversationMessage }) {
  return (
    <div className="flex justify-center my-1 animate-in fade-in duration-200">
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground text-sm">
        <span>{message.avatar || '💻'}</span>
        <span>{message.content}</span>
      </div>
    </div>
  )
}
