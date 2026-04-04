/**
 * Client-Side AI Chat Hook (FREE TIER)
 *
 * Browser → /api/chat → OpenRouter → Any AI model
 * - No persistence (messages lost on refresh)
 * - User provides their own OpenRouter API key
 * - Access to GPT-4, Claude, Llama, etc.
 */

import { useChat } from "@ai-sdk/react";

export interface UseClientChatOptions {
	apiKey: string;
	model?: string;
	initialMessages?: Array<{ role: "user" | "assistant"; content: string }>;
}

/**
 * Popular OpenRouter Models:
 * - google/gemini-2.5-flash-lite (Default - Fast & Free)
 * - openai/gpt-4
 * - openai/gpt-3.5-turbo
 * - anthropic/claude-3-opus
 * - anthropic/claude-3-sonnet
 * - meta-llama/llama-3-70b-instruct
 * - google/gemini-pro-1.5
 */

export function useClientChat(options: UseClientChatOptions) {
	const {
		apiKey,
		model = "google/gemini-2.5-flash-lite",
		initialMessages = [],
	} = options;

	const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
		useChat({
			api: "/api/chat",
			body: {
				apiKey, // User's OpenRouter API key
				model,
			},
			initialMessages,
		});

	return {
		messages,
		input,
		handleInputChange,
		handleSubmit,
		isLoading,
		error,
		// Free tier limitations
		isPersistent: false,
		canInviteHumans: false,
		hasAnalytics: false,
	};
}
