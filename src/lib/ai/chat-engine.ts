/**
 * Chat Engine - Core chat orchestration logic
 *
 * Handles:
 * - Message sending to API
 * - Stream parsing
 * - Error handling
 * - Tool execution coordination
 * - Generative UI rendering coordination
 *
 * Ontology Mapping:
 * - Chat session = Thing (type: 'chat_session')
 * - Message sent = Event (type: 'message_sent')
 * - Message received = Event (type: 'message_received')
 * - Tool executed = Event (type: 'tool_executed')
 * - UI generated = Event (type: 'ui_generated')
 */

import { parseSSEStream, type StreamCallbacks } from "./stream-parser";
import { toAPIMessages, type Message } from "./message-formatter";

/**
 * Chat configuration
 */
export interface ChatConfig {
	apiKey?: string;
	model?: string;
	enableGenerativeUI?: boolean;
	selectedTool?: string;
}

/**
 * Send message result
 */
export interface SendMessageResult {
	success: boolean;
	fullText?: string;
	error?: string;
}

/**
 * Send a message to the chat API
 *
 * @param messages - Conversation history
 * @param config - Chat configuration
 * @param callbacks - Stream event callbacks
 * @returns Result with success status and full text
 */
export async function sendMessage(
	messages: Message[],
	config: ChatConfig,
	callbacks: StreamCallbacks,
): Promise<SendMessageResult> {
	try {
		// Convert messages to API format (exclude tool calls, UI, reasoning)
		const apiMessages = toAPIMessages(messages);

		// Build request body
		const requestBody: Record<string, unknown> = {
			messages: apiMessages,
			model: config.model || "google/gemini-2.5-flash-lite",
		};

		// Add optional parameters
		if (config.apiKey) {
			requestBody.apiKey = config.apiKey;
		}
		if (config.enableGenerativeUI) {
			requestBody.enableGenerativeUI = true;
		}
		if (config.selectedTool) {
			requestBody.tool = config.selectedTool;
		}

		// Send request
		const response = await fetch("/api/chat", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(requestBody),
		});

		// Handle errors
		if (!response.ok) {
			let errorMessage = `API error: ${response.statusText}`;

			try {
				const errorData = await response.json();
				errorMessage = errorData.error || errorMessage;
			} catch (e) {
				// Use default error message
			}

			// Check for specific error types
			if (response.status === 429) {
				errorMessage = "Rate limit exceeded. Please wait a moment.";
			} else if (response.status === 401) {
				errorMessage = "API key invalid. Please check your settings.";
			}

			callbacks.onError?.(errorMessage);
			return { success: false, error: errorMessage };
		}

		// Parse streaming response
		const fullText = await parseSSEStream(response, callbacks);

		return { success: true, fullText };
	} catch (error) {
		console.error("[CHAT ENGINE] Error:", error);

		let errorMessage = "Failed to send message";

		if (error instanceof TypeError && error.message.includes("fetch")) {
			errorMessage = "Network error. Please check your connection.";
		} else if (error instanceof Error) {
			errorMessage = error.message;
		}

		callbacks.onError?.(errorMessage);
		return { success: false, error: errorMessage };
	}
}

/**
 * Retry a failed message with exponential backoff
 *
 * @param messages - Conversation history
 * @param config - Chat configuration
 * @param callbacks - Stream event callbacks
 * @param maxRetries - Maximum retry attempts (default: 3)
 * @returns Result with success status
 */
export async function sendMessageWithRetry(
	messages: Message[],
	config: ChatConfig,
	callbacks: StreamCallbacks,
	maxRetries = 3,
): Promise<SendMessageResult> {
	let lastError = "";

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		// Wait before retry (exponential backoff)
		if (attempt > 0) {
			const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
			await new Promise((resolve) => setTimeout(resolve, delay));
			console.log(`[CHAT ENGINE] Retry attempt ${attempt + 1}/${maxRetries}`);
		}

		const result = await sendMessage(messages, config, callbacks);

		if (result.success) {
			return result;
		}

		lastError = result.error || "Unknown error";

		// Don't retry on auth errors
		if (lastError.includes("API key") || lastError.includes("401")) {
			break;
		}
	}

	return { success: false, error: lastError };
}

/**
 * Cancel an ongoing stream
 *
 * Note: This is a placeholder. Actual cancellation requires an AbortController
 * to be passed through the fetch call.
 */
export function cancelStream(): void {
	console.log("[CHAT ENGINE] Stream cancellation requested");
	// Implementation would require AbortController integration
}

/**
 * Estimate cost for a message
 *
 * Rough estimates based on token counts and model pricing
 */
export function estimateMessageCost(
	messages: Message[],
	model: string,
): { tokens: number; cost: number } {
	// Calculate total tokens (rough estimate: ~4 chars per token)
	const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
	const tokens = Math.ceil(totalChars / 4);

	// Pricing estimates (per 1M tokens)
	const pricing: Record<string, number> = {
		"google/gemini-2.5-flash-lite": 0, // Free
		"google/gemini-2.0-flash-001": 0, // Free
		"deepseek/deepseek-chat-v3.1": 0, // Free
		"openai/gpt-4o": 5.0, // $5 per 1M tokens
		"anthropic/claude-sonnet-4.5": 3.0, // $3 per 1M tokens
	};

	const costPerMillion = pricing[model] || 0;
	const cost = (tokens / 1_000_000) * costPerMillion;

	return { tokens, cost };
}

/**
 * Validate chat configuration
 */
export function validateChatConfig(config: ChatConfig): {
	valid: boolean;
	error?: string;
} {
	// Check if premium model requires API key
	const premiumModels = [
		"openai/gpt-4o",
		"openai/gpt-5",
		"anthropic/claude-sonnet-4.5",
		"anthropic/claude-3-opus",
	];

	if (config.model && premiumModels.includes(config.model) && !config.apiKey) {
		return {
			valid: false,
			error: "Premium models require an API key. Please add your OpenRouter API key.",
		};
	}

	return { valid: true };
}
