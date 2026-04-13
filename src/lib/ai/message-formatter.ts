/**
 * Message Formatting Utilities
 *
 * Format AI messages for display with markdown, code blocks, and rich formatting.
 *
 * Ontology Mapping:
 * - Message = Thing (type: 'chat_message')
 * - Formatting applied = Event (type: 'message_formatted')
 */

/**
 * Message types
 */
export type MessageRole = 'user' | 'assistant' | 'system'
export type MessageType = 'text' | 'reasoning' | 'tool_call' | 'tool_result' | 'ui'

/**
 * Base message interface
 */
export interface Message {
  id: string
  role: MessageRole
  type: MessageType
  content: string
  timestamp: number

  // Optional fields
  reasoning?: string
  toolName?: string
  toolInput?: unknown
  toolOutput?: unknown
  toolState?: 'pending' | 'running' | 'completed' | 'error'
  uiPayload?: {
    component: string
    data: unknown
  }
}

/**
 * Format message content with markdown and code highlighting
 */
export function formatMessageContent(content: string): string {
  // Remove tool-call blocks from display (they're handled separately)
  let formatted = content.replace(/```tool-call\s*\n[\s\S]*?\n```/g, '')

  // Remove UI blocks from display (they're rendered as components)
  formatted = formatted.replace(/```ui-\w+\s*\n[\s\S]*?\n```/g, '')

  // Clean up extra newlines
  formatted = formatted.replace(/\n{3,}/g, '\n\n')

  return formatted.trim()
}

/**
 * Extract code blocks from message content
 */
export interface CodeBlock {
  language: string
  code: string
}

export function extractCodeBlocks(content: string): CodeBlock[] {
  const blocks: CodeBlock[] = []
  const regex = /```(\w+)?\s*\n([\s\S]*?)\n```/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(content)) !== null) {
    blocks.push({
      language: match[1] || 'plaintext',
      code: match[2].trim(),
    })
  }

  return blocks
}

/**
 * Extract tool calls from message content
 */
export interface ToolCall {
  tool: string
  parameters: Record<string, unknown>
}

export function extractToolCalls(content: string): ToolCall[] {
  const calls: ToolCall[] = []
  const regex = /```tool-call\s*\n([\s\S]*?)\n```/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1])
      calls.push(parsed)
    } catch (error) {
      console.error('Failed to parse tool call:', error)
    }
  }

  return calls
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  // Less than 1 minute
  if (diffMins < 1) {
    return 'just now'
  }

  // Less than 1 hour
  if (diffMins < 60) {
    return `${diffMins}m ago`
  }

  // Less than 24 hours
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  // Less than 7 days
  if (diffDays < 7) {
    return `${diffDays}d ago`
  }

  // Full date
  return date.toLocaleDateString()
}

/**
 * Format timestamp as time only
 */
export function formatTimeOnly(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 3)}...`
}

/**
 * Count tokens (rough estimate)
 */
export function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4)
}

/**
 * Format tool state for display
 */
export function formatToolState(state: Message['toolState']): {
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
} {
  switch (state) {
    case 'pending':
      return { label: 'Pending', variant: 'outline' }
    case 'running':
      return { label: 'Running', variant: 'secondary' }
    case 'completed':
      return { label: 'Completed', variant: 'default' }
    case 'error':
      return { label: 'Error', variant: 'destructive' }
    default:
      return { label: 'Unknown', variant: 'outline' }
  }
}

/**
 * Create a message object
 */
export function createMessage(role: MessageRole, content: string, type: MessageType = 'text'): Message {
  return {
    id: crypto.randomUUID(),
    role,
    type,
    content,
    timestamp: Date.now(),
  }
}

/**
 * Create a tool call message
 */
export function createToolCallMessage(
  toolName: string,
  toolInput: unknown,
  toolState: Message['toolState'] = 'pending',
): Message {
  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    type: 'tool_call',
    content: '',
    timestamp: Date.now(),
    toolName,
    toolInput,
    toolState,
  }
}

/**
 * Create a tool result message
 */
export function createToolResultMessage(toolName: string, toolOutput: unknown): Message {
  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    type: 'tool_result',
    content: '',
    timestamp: Date.now(),
    toolName,
    toolOutput,
  }
}

/**
 * Create a UI component message
 */
export function createUIMessage(component: string, data: unknown): Message {
  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    type: 'ui',
    content: '',
    timestamp: Date.now(),
    uiPayload: { component, data },
  }
}

/**
 * Create a reasoning message
 */
export function createReasoningMessage(reasoning: string): Message {
  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    type: 'reasoning',
    content: '',
    timestamp: Date.now(),
    reasoning,
  }
}

/**
 * Convert message to API format
 */
export function toAPIMessage(message: Message): {
  role: string
  content: string
} {
  return {
    role: message.role,
    content: message.content,
  }
}

/**
 * Convert messages to API format (batch)
 */
export function toAPIMessages(messages: Message[]): Array<{ role: string; content: string }> {
  // Only send text messages to API (exclude tool calls, UI, reasoning)
  return messages.filter((m) => m.type === 'text' && m.content.trim()).map(toAPIMessage)
}
