/**
 * AI Core Utilities - Main Export
 *
 * Central export point for all AI chat utilities.
 *
 * Usage:
 * ```typescript
 * import { sendMessage, parseSSEStream, formatMessageContent } from '@/lib/ai';
 * ```
 */

// Chat Engine
export {
  type ChatConfig,
  cancelStream,
  estimateMessageCost,
  type SendMessageResult,
  sendMessage,
  sendMessageWithRetry,
  validateChatConfig,
} from './chat-engine'
// Message Formatter
export {
  type CodeBlock,
  createMessage,
  createReasoningMessage,
  createToolCallMessage,
  createToolResultMessage,
  createUIMessage,
  estimateTokens,
  extractCodeBlocks,
  extractToolCalls,
  formatMessageContent,
  formatTimeOnly,
  formatTimestamp,
  formatToolState,
  type Message,
  type MessageRole,
  type MessageType,
  type ToolCall,
  toAPIMessage,
  toAPIMessages,
  truncateText,
} from './message-formatter'
// Model Config
export {
  type AIModel,
  CLAUDE_CODE_MODELS,
  FREE_MODELS,
  getDefaultModel,
  getModelById,
  getModelCapabilities,
  getModelCategories,
  getModelDisplayName,
  getModelTierVariant,
  isModelFree,
  type ModelCapabilities,
  type ModelCategory,
  PREMIUM_MODELS,
} from './model-config'
// Stream Parser
export {
  createStreamReader,
  isStreamResponse,
  parseFullStream,
  parseNonStreamResponse,
  parseSSEStream,
  parseTextStream,
  StreamAccumulator,
  type StreamCallbacks,
  type StreamEvent,
  type StreamEventType,
} from './stream-parser'
