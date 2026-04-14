/**
 * Chat Messages Component
 *
 * Wraps messages with scroll detection using StickToBottom context
 */

import { useEffect } from 'react'
import { useStickToBottomContext } from 'use-stick-to-bottom'

export interface ExtendedMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata?: {
    sender?: string
    [key: string]: any
  }
  [key: string]: any
}

interface ChatMessagesProps {
  messages: ExtendedMessage[]
  renderMessage: (msg: ExtendedMessage) => React.ReactNode
  onScrollStateChange: (isAtBottom: boolean, latestSender: string | null) => void
}

export function ChatMessages({ messages, renderMessage, onScrollStateChange }: ChatMessagesProps) {
  const { isAtBottom } = useStickToBottomContext()

  // Notify parent of scroll state changes
  useEffect(() => {
    const latestMessage = messages[messages.length - 1]
    const latestSender = latestMessage?.metadata?.sender || null

    onScrollStateChange(isAtBottom, latestSender)
  }, [isAtBottom, messages, onScrollStateChange])

  return <>{messages.map((msg) => renderMessage(msg))}</>
}
