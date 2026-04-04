/**
 * Generative UI Hook (FREE TIER)
 *
 * Client-side rendering of AI-generated UI components
 * - Works without backend
 * - No persistence
 */

import { useState } from "react";

export interface GenerativeUIComponent {
	type: "chart" | "table" | "form" | "card" | "list" | "timeline";
	props: Record<string, any>;
}

export function useGenerativeUI() {
	const [components, setComponents] = useState<GenerativeUIComponent[]>([]);

	const renderComponent = (component: GenerativeUIComponent) => {
		setComponents((prev) => [...prev, component]);
	};

	const clearComponents = () => {
		setComponents([]);
	};

	return {
		components,
		renderComponent,
		clearComponents,
	};
}
