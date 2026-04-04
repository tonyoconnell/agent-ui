import { useEffect, useState } from "react";

export function useAgentContext(conversationId: string) {
	const [context, setContext] = useState<Record<string, any>>({});

	useEffect(() => {
		// Sync context with backend
		// TODO: Implement with Convex mutation
	}, [context, conversationId]);

	return {
		shareContext: (key: string, value: any) => {
			setContext((prev) => ({ ...prev, [key]: value }));
		},
		removeContext: (key: string) => {
			setContext((prev) => {
				const { [key]: _, ...rest } = prev;
				return rest;
			});
		},
		getContext: () => context,
	};
}
