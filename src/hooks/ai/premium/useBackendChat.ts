/**
 * Backend AI Chat Hook (PREMIUM TIER)
 *
 * Client → Your Backend → Database → AI provider
 * - Persistent chat threads
 * - Human-in-the-loop
 * - Analytics tracking
 * - Multi-tenant
 */

import { useEffect, useState } from "react";
import { backendConfig } from "@/config/backend";

export interface UseBackendChatOptions {
	threadId?: string;
	groupId?: string;
	agentId?: string;
}

export interface Message {
	id: string;
	role: "user" | "assistant" | "system";
	content: string;
	timestamp: number;
	metadata?: Record<string, any>;
}

export function useBackendChat(options: UseBackendChatOptions) {
	const { threadId, groupId, agentId } = options;
	const [messages, setMessages] = useState<Message[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	// Load persisted messages from database
	useEffect(() => {
		if (threadId && backendConfig.features.persistence) {
			loadMessages();
		}
	}, [threadId]);

	const loadMessages = async () => {
		try {
			const response = await fetch(
				`${backendConfig.endpoints.api}/chat/threads/${threadId}`,
				{
					headers: {
						"Content-Type": "application/json",
					},
				},
			);
			const data = await response.json();
			setMessages(data.messages || []);
		} catch (err) {
			console.error("Failed to load messages:", err);
			setError(err as Error);
		}
	};

	const sendMessage = async (content: string) => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch(`${backendConfig.endpoints.api}/chat`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					threadId,
					groupId,
					agentId,
					message: content,
				}),
			});

			const data = await response.json();

			// Update messages with response
			setMessages((prev) => [...prev, data.userMessage, data.assistantMessage]);
		} catch (err) {
			console.error("Failed to send message:", err);
			setError(err as Error);
		} finally {
			setIsLoading(false);
		}
	};

	const inviteHuman = async (userId: string) => {
		if (!backendConfig.features.humanInTheLoop) {
			throw new Error("Human-in-the-loop requires premium tier");
		}

		// Implementation for inviting human agent
		await fetch(
			`${backendConfig.endpoints.api}/chat/threads/${threadId}/invite`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ userId }),
			},
		);
	};

	return {
		messages,
		sendMessage,
		inviteHuman,
		isLoading,
		error,
		// Premium features
		isPersistent: backendConfig.features.persistence,
		canInviteHumans: backendConfig.features.humanInTheLoop,
		hasAnalytics: backendConfig.features.analytics,
	};
}
