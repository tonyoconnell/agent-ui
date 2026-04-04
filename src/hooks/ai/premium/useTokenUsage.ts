import { useEffect, useState } from "react";

export interface TokenUsage {
	promptTokens: number;
	completionTokens: number;
	totalTokens: number;
	estimatedCost: number;
}

export function useTokenUsage() {
	const [usage, setUsage] = useState<TokenUsage>({
		promptTokens: 0,
		completionTokens: 0,
		totalTokens: 0,
		estimatedCost: 0,
	});

	const trackTokens = (prompt: number, completion: number) => {
		setUsage((prev) => ({
			promptTokens: prev.promptTokens + prompt,
			completionTokens: prev.completionTokens + completion,
			totalTokens: prev.totalTokens + prompt + completion,
			estimatedCost:
				prev.estimatedCost + ((prompt + completion) / 1000) * 0.002,
		}));
	};

	const resetUsage = () => {
		setUsage({
			promptTokens: 0,
			completionTokens: 0,
			totalTokens: 0,
			estimatedCost: 0,
		});
	};

	return { usage, trackTokens, resetUsage };
}
