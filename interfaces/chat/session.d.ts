import type { Sid, Cursor, Uid } from "../types-session"

export interface ChatSession {
  sid: Sid
  uid?: Uid              // null for anonymous
  cursor: Cursor
  createdAt: string
  lastActiveAt: string
}

// Create a new chat session
export declare function createSession(uid?: Uid): Promise<ChatSession>

// Resume a session by ID (reattaches; replays missed events if cursor provided)
export declare function resumeSession(sid: Sid, cursor?: Cursor): Promise<ChatSession>
