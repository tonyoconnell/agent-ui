import { useChat } from "ai/react";
import { useState } from "react";

export function useCompleteChatFlow(groupId: string, agentId: string) {
	const [threadId, setThreadId] = useState<string>("");

	const { messages, input, handleInputChange, handleSubmit, isLoading } =
		useChat({
			api: "/api/chat",
			body: { groupId, agentId, threadId },
		});

	return {
		messages,
		input,
		handleInputChange,
		handleSubmit,
		isLoading,
		threadId,
		setThreadId,
	};
}
