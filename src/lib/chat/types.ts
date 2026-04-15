import type { ToolUIPart } from 'ai'

export interface ExtendedMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  type?: 'text' | 'reasoning' | 'tool_call' | 'tool_result' | 'ui'
  payload?: unknown
  timestamp?: number
  reasoning?: {
    content: string
    duration?: number
  }
  isReasoningComplete?: boolean
  isReasoningStreaming?: boolean
  toolCalls?: Array<{
    name: string
    args: Record<string, unknown>
    result?: unknown
    state: ToolUIPart['state']
  }>
  metadata?: {
    sender?: string
    avatar?: string
    isStreaming?: boolean
    isComplete?: boolean
    agents?: string[]
  }
}

export interface Model {
  id: string
  name: string
  chef: string
  chefSlug: string
  providers: string[]
  free: boolean
  context: string
  requiresAuth?: string
  hasTools?: boolean
  isClaudeCode?: boolean
}

export interface SuggestionGroup {
  label: string
  highlight: string
  items: string[]
}

export type StreamEvent =
  | { type: 'text'; content: string }
  | { type: 'reasoning'; content: string }
  | { type: 'tool_call'; name: string; args: Record<string, unknown> }
  | { type: 'tool_result'; name: string; result: unknown; args?: Record<string, unknown> }
  | { type: 'ui'; component: string; payload: unknown }
  | {
      type: 'message'
      sender: string
      content: string
      timestamp: number
      isStreaming: boolean
      avatar?: string
      metadata?: Record<string, unknown>
    }
  | { type: 'agent-presence'; agents: string[] }
  | { type: 'done' }
  | { type: 'error'; message: string }
