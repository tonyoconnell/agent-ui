import type { Sid, Cursor } from "../types-session"

export interface StreamRequest {
  sid: Sid
  cursor?: Cursor       // resume from here; server rejects stale cursor with "cursor-stale"
  message: string
}

export interface StreamChunk {
  type: "text" | "rich" | "done" | "error"
  content?: string
  richType?: string      // e.g. "payment-card", "agent-card"
  richPayload?: unknown
  cursor?: Cursor        // updated cursor after each chunk
  error?: string
}

// Stream a chat turn via ai-sdk
export declare function streamTurn(
  req: StreamRequest,
  onChunk: (chunk: StreamChunk) => void
): Promise<void>
