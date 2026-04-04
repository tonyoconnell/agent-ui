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
	sendMessage,
	sendMessageWithRetry,
	cancelStream,
	estimateMessageCost,
	validateChatConfig,
	type ChatConfig,
	type SendMessageResult,
} from "./chat-engine";

// Stream Parser
export {
	parseSSEStream,
	parseTextStream,
	parseFullStream,
	StreamAccumulator,
	createStreamReader,
	isStreamResponse,
	parseNonStreamResponse,
	type StreamEventType,
	type StreamEvent,
	type StreamCallbacks,
} from "./stream-parser";

// Message Formatter
export {
	formatMessageContent,
	extractCodeBlocks,
	extractToolCalls,
	formatTimestamp,
	formatTimeOnly,
	truncateText,
	estimateTokens,
	formatToolState,
	createMessage,
	createToolCallMessage,
	createToolResultMessage,
	createUIMessage,
	createReasoningMessage,
	toAPIMessage,
	toAPIMessages,
	type MessageRole,
	type MessageType,
	type Message,
	type CodeBlock,
	type ToolCall,
} from "./message-formatter";

// Model Config
export {
	getModelCategories,
	getModelById,
	isModelFree,
	getDefaultModel,
	getModelDisplayName,
	getModelTierVariant,
	getModelCapabilities,
	FREE_MODELS,
	PREMIUM_MODELS,
	CLAUDE_CODE_MODELS,
	type AIModel,
	type ModelCategory,
	type ModelCapabilities,
} from "./model-config";
