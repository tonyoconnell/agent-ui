import type { Sid, Cursor } from "../types-session"
import type { StreamChunk } from "./stream"

// Props for the web chat island
export interface ChatIslandProps {
  initialSid?: Sid
  initialCursor?: Cursor
  embedded?: boolean      // true for ⌘K widget
}

// Persisted chat state (IndexedDB)
export interface ChatState {
  sid: Sid
  cursor: Cursor
  lastMessage?: string
  savedAt: string
}
