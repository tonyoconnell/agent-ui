import { useState } from "react";

export interface AgentAction {
	id: string;
	label: string;
	description?: string;
	params?: any;
}

export function useAgentActions() {
	const [pendingActions, setPendingActions] = useState<AgentAction[]>([]);

	const executeAction = async (action: AgentAction) => {
		// Execute action via API
		console.log("Executing action:", action);
		// TODO: Implement with Convex mutation
	};

	const addAction = (action: AgentAction) => {
		setPendingActions((prev) => [...prev, action]);
	};

	const clearActions = () => {
		setPendingActions([]);
	};

	return {
		pendingActions,
		executeAction,
		addAction,
		clearActions,
	};
}
