import type { Sid } from "../types-session"

// Public HTTP API contract for /api/chat/*
export interface ApiChatRequest {
  message: string
  sid?: Sid
}

export interface ApiChatResponse {
  sid: Sid
  message: string
  richMessages?: unknown[]
}
