/**
 * Smart AI Chat Hook
 *
 * Automatically routes to correct implementation based on backend configuration:
 * - FREE TIER (backend=off): useClientChat (ephemeral, client-side only)
 * - PREMIUM TIER (backend=on): useBackendChat (persistent, database, analytics)
 */

import { backendConfig } from "@/config/backend";
import {
	type UseClientChatOptions,
	useClientChat,
} from "./basic/useClientChat";
import {
	type UseBackendChatOptions,
	useBackendChat,
} from "./premium/useBackendChat";

export type UseAIChatOptions = UseClientChatOptions | UseBackendChatOptions;

export function useAIChat(options: any) {
	if (backendConfig.enabled) {
		// PREMIUM: Use backend with persistence, analytics, HITL
		return useBackendChat(options as UseBackendChatOptions);
	} else {
		// FREE: Direct client-side chat (no persistence)
		return useClientChat(options as UseClientChatOptions);
	}
}
