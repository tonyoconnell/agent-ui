import type { Sid } from '../types-session'

// Conversational checkout via /chat
export interface PayChatRequest {
  message: string
  sid?: Sid
  payContext?: {
    amount?: string
    currency?: string
    recipient?: string
  }
}
