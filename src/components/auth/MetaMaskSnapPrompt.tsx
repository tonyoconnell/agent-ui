import { useEffect, useState } from 'react'
import { emitClick } from '@/lib/ui-signal'

// Sui MetaMask Snap npm id (Kunalabs community snap)
const SUI_SNAP_ID = 'npm:@kunalabs-io/sui-snap'

interface EthereumProvider {
  isMetaMask?: boolean
  request: (args: { method: string; params?: unknown }) => Promise<unknown>
}

declare global {
  interface Window {
    ethereum?: EthereumProvider
  }
}

type Status = 'checking' | 'no-metamask' | 'needs-install' | 'installing' | 'ready' | 'error'

export function MetaMaskSnapPrompt() {
  const [status, setStatus] = useState<Status>('checking')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const eth = window.ethereum
    if (!eth?.isMetaMask) {
      setStatus('no-metamask')
      return
    }
    eth
      .request({ method: 'wallet_getSnaps' })
      .then((snaps) => {
        const installed = snaps && typeof snaps === 'object' && SUI_SNAP_ID in (snaps as Record<string, unknown>)
        setStatus(installed ? 'ready' : 'needs-install')
      })
      .catch(() => setStatus('needs-install'))
  }, [])

  const install = async () => {
    emitClick('ui:auth:snap:install')
    const eth = window.ethereum
    if (!eth) return
    setStatus('installing')
    setError(null)
    try {
      await eth.request({
        method: 'wallet_requestSnaps',
        params: { [SUI_SNAP_ID]: {} },
      })
      setStatus('ready')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'snap install rejected')
      setStatus('error')
    }
  }

  if (status === 'checking') return null
  if (status === 'no-metamask') return null
  if (status === 'ready') {
    return <p className="text-xs text-emerald-400">Sui Snap installed — use Connect Wallet above.</p>
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs text-slate-400">MetaMask detected — install the Sui Snap to sign in.</p>
      <button
        type="button"
        onClick={install}
        disabled={status === 'installing'}
        className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors"
      >
        {status === 'installing' ? 'Installing…' : 'Install Sui Snap'}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
