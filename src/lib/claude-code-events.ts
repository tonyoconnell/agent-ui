/**
 * Claude Code Event Types
 *
 * Complete list of all events that Claude Code emits during execution.
 * Each event type converts to a `ConversationMessage` for rendering in
 * the ONE UI's chat timeline (React component tree).
 *
 * SCOPE: This file is **UI-only** — it describes the shape of messages
 * shown to humans, not substrate telemetry. Do NOT bridge PostToolUse
 * hook JSON through this file to `/api/signal`; the two shapes solve
 * different problems and joining them invents a translation layer that
 * doesn't belong in either.
 *
 * For substrate telemetry on tool calls, see `.claude/hooks/tool-signal.sh`
 * which consumes the raw hook JSON directly and emits canonical
 * `tool:<name>:<outcome>` signals per `.claude/skills/signal.md`.
 */

export type ClaudeCodeEventType =
  // Text and Content
  | 'text' // Regular streaming text
  | 'text_delta' // Incremental text updates

  // Tool Execution
  | 'tool_call' // When Claude calls a tool (Read, Write, Edit, Bash, etc.)
  | 'tool_result' // Result from tool execution

  // Thinking/Reasoning
  | 'reasoning_start' // Claude starts reasoning
  | 'reasoning_content' // Reasoning text
  | 'reasoning_end' // Reasoning complete

  // File Operations
  | 'file_read' // Read a file
  | 'file_write' // Write/create a file
  | 'file_edit' // Edit existing file
  | 'file_created' // New file created
  | 'file_modified' // Existing file modified

  // Command Execution
  | 'bash_start' // Bash command started
  | 'bash_output' // Bash command output
  | 'bash_complete' // Bash command completed
  | 'bash_error' // Bash command error

  // Search and Discovery
  | 'grep_search' // Code search
  | 'glob_search' // File pattern search
  | 'search_result' // Search results

  // Agent Coordination
  | 'agent_assigned' // Agent assigned to task
  | 'agent_started' // Agent started work
  | 'agent_progress' // Agent progress update
  | 'agent_complete' // Agent completed task
  | 'agent_joined' // Agent joined conversation
  | 'agent_left' // Agent left conversation

  // System Events
  | 'status_update' // Status change
  | 'error' // Error occurred
  | 'warning' // Warning message
  | 'success' // Success message

  // Stream Control
  | 'stream_start' // Stream started
  | 'stream_end' // Stream ended
  | 'done' // All processing complete

export interface ClaudeCodeEvent {
  type: ClaudeCodeEventType
  timestamp: number
  data: any

  // Optional fields
  agentId?: string // Which agent triggered this
  toolName?: string // Tool name if applicable
  filePath?: string // File path if applicable
  command?: string // Bash command if applicable
  duration?: number // How long something took
}

export interface ConversationMessage {
  id: string
  type: 'user' | 'director' | 'agent' | 'system' | 'tool' | 'file' | 'command'
  sender: string // 'You', 'Agent Director', 'agent-frontend', etc.
  content: string // Main message content
  timestamp: number

  // Visual styling
  avatar?: string // Avatar icon/emoji
  color?: string // Message color theme

  // Rich content
  metadata?: {
    toolName?: string
    filePath?: string
    fileContent?: string
    command?: string
    output?: string
    agents?: string[]
    status?: 'pending' | 'running' | 'complete' | 'error'
  }

  // Streaming
  isStreaming?: boolean
  isComplete?: boolean
}

/**
 * Convert Claude Code event to conversational message
 */
export function eventToMessage(event: ClaudeCodeEvent): ConversationMessage | null {
  const baseMessage: Partial<ConversationMessage> = {
    id: `msg-${event.timestamp}`,
    timestamp: event.timestamp,
  }

  switch (event.type) {
    case 'text':
    case 'text_delta':
      return {
        ...baseMessage,
        type: event.agentId ? 'agent' : 'director',
        sender: event.agentId || 'Agent Director',
        content: event.data.content,
        avatar: event.agentId ? '🔧' : '🤖',
        isStreaming: event.type === 'text_delta',
      } as ConversationMessage

    case 'tool_call':
      return {
        ...baseMessage,
        type: 'tool',
        sender: event.agentId || 'Agent Director',
        content: `Using ${event.toolName}`,
        avatar: '🔧',
        metadata: {
          toolName: event.toolName,
          status: 'running',
        },
      } as ConversationMessage

    case 'tool_result':
      return {
        ...baseMessage,
        type: 'tool',
        sender: event.agentId || 'Agent Director',
        content: `Completed ${event.toolName}`,
        avatar: '✅',
        metadata: {
          toolName: event.toolName,
          output: event.data.result,
          status: 'complete',
          duration: event.duration,
        },
      } as ConversationMessage

    case 'file_edit':
    case 'file_write':
      return {
        ...baseMessage,
        type: 'file',
        sender: event.agentId || 'Agent Director',
        content: `${event.type === 'file_edit' ? 'Edited' : 'Created'} ${event.filePath}`,
        avatar: '📝',
        metadata: {
          filePath: event.filePath,
          fileContent: event.data.content,
        },
      } as ConversationMessage

    case 'bash_start':
      return {
        ...baseMessage,
        type: 'command',
        sender: event.agentId || 'Agent Director',
        content: `$ ${event.command}`,
        avatar: '⚡',
        metadata: {
          command: event.command,
          status: 'running',
        },
      } as ConversationMessage

    case 'bash_output':
      return {
        ...baseMessage,
        type: 'command',
        sender: 'System',
        content: event.data.output,
        avatar: '📟',
        metadata: {
          command: event.command,
          output: event.data.output,
        },
      } as ConversationMessage

    case 'agent_joined':
      return {
        ...baseMessage,
        type: 'system',
        sender: 'System',
        content: `${event.data.agentName} joined the conversation`,
        avatar: '👋',
        color: 'blue',
      } as ConversationMessage

    case 'agent_assigned':
      return {
        ...baseMessage,
        type: 'director',
        sender: 'Agent Director',
        content: `Assigning ${event.data.agents?.join(', ')} to work on this`,
        avatar: '🤖',
        metadata: {
          agents: event.data.agents,
        },
      } as ConversationMessage

    default:
      return null
  }
}

/**
 * Agent Avatars and Colors
 */
export const AGENT_PROFILES = {
  director: { avatar: '🤖', name: 'Agent Director', color: 'purple' },
  'agent-frontend': { avatar: '🎨', name: 'Frontend', color: 'blue' },
  'agent-backend': { avatar: '⚙️', name: 'Backend', color: 'green' },
  'agent-builder': { avatar: '🔨', name: 'Builder', color: 'orange' },
  'agent-quality': { avatar: '✅', name: 'Quality', color: 'teal' },
  'agent-designer': { avatar: '🎭', name: 'Designer', color: 'pink' },
  'agent-integrator': { avatar: '🔌', name: 'Integrator', color: 'indigo' },
  'agent-ops': { avatar: '🚀', name: 'DevOps', color: 'red' },
  system: { avatar: '💻', name: 'System', color: 'gray' },
} as const
