import { SubstrateClient } from '@oneie/sdk'

function browserBaseUrl(): string {
  if (typeof window !== 'undefined') return window.location.origin
  return typeof process !== 'undefined' && process.env?.ONEIE_API_URL
    ? process.env.ONEIE_API_URL
    : 'http://localhost:4321'
}

export const sdk = new SubstrateClient({
  baseUrl: browserBaseUrl(),
  retry: { maxAttempts: 2, backoff: 'exp' },
  validate: 'warn',
})

export type {
  Health,
  HighwaysResponse,
  HypothesesResponse,
  MarkDimsResponse,
  Outcome,
  SignalResponse,
  Stats,
} from '@oneie/sdk'
export * from '@oneie/sdk/errors'
export { SubstrateClient }
