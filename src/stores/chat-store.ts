/**
 * Chat Store — Nanostores for chat state
 */

import { atom } from 'nanostores'

// Streaming state
export const isStreaming$ = atom(false)

// Current model
export const currentModel$ = atom('anthropic/claude-sonnet-4-20250514')

// Messages
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  command?: {
    type: string
    [key: string]: unknown
  }
}

export const messages$ = atom<ChatMessage[]>([])

// Add message
export function addMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>) {
  const newMessage: ChatMessage = {
    ...message,
    id: `msg-${Date.now()}`,
    timestamp: new Date(),
  }
  messages$.set([...messages$.get(), newMessage])
  return newMessage
}

// Clear messages
export function clearMessages() {
  messages$.set([])
}

// Set streaming
export function setStreaming(value: boolean) {
  isStreaming$.set(value)
}
