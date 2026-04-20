import { SubstrateProvider } from '@oneie/sdk/react'
import type { ReactNode } from 'react'
import { sdk } from '@/lib/sdk'

export function SdkProvider({ children }: { children: ReactNode }) {
  return <SubstrateProvider client={sdk}>{children}</SubstrateProvider>
}
