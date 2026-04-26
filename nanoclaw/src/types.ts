/**
 * NanoClaw Types
 */

export interface Env {
  DB: D1Database
  KV: KVNamespace
  AGENT_QUEUE: Queue
  GATEWAY_URL: string
  OPENROUTER_API_KEY: string
  GROQ_API_KEY?: string
  TELEGRAM_TOKEN?: string
  TELEGRAM_TOKEN_DONAL?: string
  TELEGRAM_TOKEN_ONE?: string
  DISCORD_TOKEN?: string
  VERSION: string
  /** Worker-level persona key. If set, all groups on this worker use this persona as default. */
  BOT_PERSONA?: string
  /** If set, all non-webhook routes require Authorization: Bearer <API_KEY> */
  API_KEY?: string
  /**
   * Agent identity — required for owner-architecture key-loading (Gap 1).
   * Provision via `wrangler secret put <VAR>` before deploy.
   * See nanoclaw/src/lib/boot.ts and docs/agent-boot-unlock.md.
   */
  /** Agent uid, e.g. "marketing:scout". Required for ensureAgentSeed(). */
  AGENT_UID?: string
  /** Bearer minted at registration (POST /api/agents/register). Shown once. */
  AGENT_BEARER?: string
  /** base64url HMAC key shared with one.ie /api/agents/:uid/unlock endpoint. */
  UNLOCK_SIGNING_KEY?: string
  /** Defaults to "https://one.ie". Override for staging / local dev tunnels. */
  ONE_HOST?: string
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
  type: 'message' | 'substrate' | 'scheduled' | 'complex'
  signal?: Signal
  group?: string
  sender?: string
  receiver?: string
  data?: unknown
  prompt?: string
  taskId?: string
  tags?: string[]
  context?: { uid?: string; pack?: unknown; reply?: string; confidence?: number }
  ts?: number
}

export interface GroupContext {
  id: string
  name?: string
  systemPrompt: string
  model: string
  sensitivity: number
  tags?: string[]
}

export interface AgentResponse {
  reply?: string
  signals?: { receiver: string; data: unknown }[]
  toolCalls?: { name: string; input: unknown; result: unknown }[]
}
