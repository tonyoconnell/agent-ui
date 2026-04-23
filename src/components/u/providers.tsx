'use client'
/**
 * AppProviders — canonical Sui dapp-kit provider wrapper.
 *
 * Single source of truth for SuiClientProvider + WalletProvider + QueryClientProvider.
 * All three previous inline usages (CryptoAuthPanel, ChairmanPanel, PayPage) now
 * delegate here.
 */

import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit'
import '@mysten/dapp-kit/dist/index.css'
import { getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useState } from 'react'

// Module-level to ensure reference-stability across re-renders (SuiClientProvider
// compares networks by identity; re-creating the object triggers unnecessary resets).
const networks = {
  mainnet: { url: getJsonRpcFullnodeUrl('mainnet'), network: 'mainnet' as const },
  testnet: { url: getJsonRpcFullnodeUrl('testnet'), network: 'testnet' as const },
} as const

type AppNetwork = keyof typeof networks

interface AppProvidersProps {
  children: ReactNode
  network?: AppNetwork
  autoConnect?: boolean
}

export function AppProviders({ children, network = 'testnet', autoConnect = false }: AppProvidersProps) {
  // Lazy-init: each mount gets its own stable QueryClient instance without
  // sharing state between unrelated component trees.
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork={network}>
        <WalletProvider autoConnect={autoConnect}>{children}</WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  )
}
