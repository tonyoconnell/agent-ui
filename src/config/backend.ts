export interface BackendConfig {
  enabled: boolean
  tier: 'free' | 'starter' | 'pro' | 'enterprise'
  features: { persistence: boolean; humanInTheLoop: boolean; analytics: boolean; rag: boolean; multiTenant: boolean }
  endpoints: { api: string; convex?: string }
}
const isBackendEnabled = import.meta.env.PUBLIC_BACKEND === 'on'
export const backendConfig: BackendConfig = {
  enabled: isBackendEnabled,
  tier: isBackendEnabled ? (import.meta.env.PUBLIC_TIER as any) || 'starter' : 'free',
  features: { persistence: false, humanInTheLoop: false, analytics: false, rag: false, multiTenant: false },
  endpoints: { api: import.meta.env.PUBLIC_BACKEND_URL || '/api' },
}
export const isFeatureEnabled = (f: keyof BackendConfig['features']) => backendConfig.features[f]
export const isFreeTier = () => backendConfig.tier === 'free'
export const canAccessPremium = () => backendConfig.enabled
