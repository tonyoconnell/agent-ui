// MCP tool contract for chat
export interface McpChatToolInput {
  message: string
  sessionId?: string
}

export interface McpChatToolOutput {
  content: string
  sessionId: string
}
