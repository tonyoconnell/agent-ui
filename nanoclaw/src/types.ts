/**
 * NanoClaw Types
 */

export interface Env {
  DB: D1Database
  KV: KVNamespace
  AGENT_QUEUE: Queue
  GATEWAY_URL: string
  OPENROUTER_API_KEY: string
  TELEGRAM_TOKEN?: string
  DISCORD_TOKEN?: string
  VERSION: string
}

export interface Signal {
  id: string
  group: string
  channel: string
  sender: string
  content: string
  replyTo?: string
  ts: number
}

export interface QueueMessage {
  type: 'message' | 'substrate' | 'scheduled'
  signal?: Signal
  group?: string
  sender?: string
  receiver?: string
  data?: unknown
  prompt?: string
  taskId?: string
}

export interface GroupContext {
  id: string
  name?: string
  systemPrompt: string
  model: string
  sensitivity: number
}

export interface AgentResponse {
  reply?: string
  signals?: { receiver: string; data: unknown }[]
  toolCalls?: { name: string; input: unknown; result: unknown }[]
}
