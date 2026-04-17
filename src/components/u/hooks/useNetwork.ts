import { useCallback, useEffect, useState } from 'react'
import type { Network } from '../lib/NetworkConfig'
import { DEFAULT_NETWORK, SUPPORTED_NETWORKS, TEST_NETWORKS } from '../lib/NetworkConfig'

export interface UseNetworkReturn {
  network: Network
  isTestnet: boolean
  switchNetwork: (chainId: string) => void
  toggleTestnet: () => void
  availableNetworks: Network[]
}

// Global state for network (simple implementation)
// In a real app we might use Context, but for this lightweight integration hooks work well
// if we persist to localStorage
let currentNetwork: Network = DEFAULT_NETWORK
const listeners = new Set<(n: Network) => void>()

function notifyListeners() {
  listeners.forEach((l) => l(currentNetwork))
}

export function useNetwork(): UseNetworkReturn {
  const [network, setNetwork] = useState<Network>(currentNetwork)
  const [isTestnet, setIsTestnet] = useState(false)

  // Initialize from storage
  useEffect(() => {
    const stored = localStorage.getItem('u_network_id')
    if (stored) {
      const found = Object.values({ ...SUPPORTED_NETWORKS, ...TEST_NETWORKS }).find((n) => n.id === stored)
      if (found) {
        currentNetwork = found
        setNetwork(found)
        setIsTestnet(!found.mainnet)
      }
    }

    // Subscribe to global changes
    const listener = (n: Network) => {
      setNetwork(n)
      setIsTestnet(!n.mainnet)
    }
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const switchNetwork = useCallback(
    (chainId: string) => {
      const networks = isTestnet ? TEST_NETWORKS : SUPPORTED_NETWORKS
      const next = networks[chainId] || Object.values(networks).find((n) => n.id === chainId)

      if (next) {
        currentNetwork = next
        localStorage.setItem('u_network_id', next.id)
        notifyListeners()
      }
    },
    [isTestnet],
  )

  const toggleTestnet = useCallback(() => {
    const nextIsTestnet = !isTestnet
    setIsTestnet(nextIsTestnet)

    // Switch to corresponding network in new mode (e.g. eth -> eth_sepolia)
    // For simplicity, just pick the first available in the new mode
    const networks = nextIsTestnet ? TEST_NETWORKS : SUPPORTED_NETWORKS
    const first = Object.values(networks)[0]

    if (first) {
      currentNetwork = first
      localStorage.setItem('u_network_id', first.id)
      notifyListeners()
    }
  }, [isTestnet])

  return {
    network,
    isTestnet,
    switchNetwork,
    toggleTestnet,
    availableNetworks: Object.values(isTestnet ? TEST_NETWORKS : SUPPORTED_NETWORKS),
  }
}
