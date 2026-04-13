/**
 * Smart AI Chat Hook
 *
 * Automatically routes to correct implementation based on backend configuration:
 * - FREE TIER (backend=off): useClientChat (ephemeral, client-side only)
 * - PREMIUM TIER (backend=on): useBackendChat (persistent, database, analytics)
 */

import { backendConfig } from '@/config/backend'
import { type UseClientChatOptions, useClientChat } from './basic/useClientChat'
import { type UseBackendChatOptions, useBackendChat } from './premium/useBackendChat'

export type UseAIChatOptions = UseClientChatOptions | UseBackendChatOptions

export function useAIChat(options: any) {
  // backendConfig.enabled is a static module-level constant — never changes between renders
  // biome-ignore lint/correctness/useHookAtTopLevel: static config branch, not reactive
  if (backendConfig.enabled) return useBackendChat(options as UseBackendChatOptions)
  // biome-ignore lint/correctness/useHookAtTopLevel: static config branch, not reactive
  return useClientChat(options as UseClientChatOptions)
}
