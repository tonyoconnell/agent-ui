import { emitClick } from '@/lib/ui-signal'
import { MetaMaskSnapPrompt } from './MetaMaskSnapPrompt'
import { WalletSignIn } from './WalletSignIn'

interface Props {
  onSuccess?: (result: { uid: string; wallet: string }) => void
}

export function SignInWithAnything({ onSuccess }: Props) {
  const zkLogin = () => {
    emitClick('ui:auth:zklogin:start')
    window.location.href = '/api/auth/zklogin/start'
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-xs">
      {/* Door 1: native Sui wallet (dapp-kit auto-detects including installed Snap) */}
      <WalletSignIn onSuccess={onSuccess} label="Sign in with Sui wallet" />

      <div className="flex items-center gap-2 w-full text-xs text-slate-600">
        <div className="flex-1 h-px bg-slate-800" />
        <span>or</span>
        <div className="flex-1 h-px bg-slate-800" />
      </div>

      {/* Door 2: Google zkLogin — one-click, no wallet install */}
      <button
        type="button"
        onClick={zkLogin}
        className="w-full px-4 py-2.5 bg-slate-100 hover:bg-white text-slate-900 rounded-lg text-sm font-semibold transition-colors"
      >
        Continue with Google
      </button>

      {/* Door 3: MetaMask Snap — shown only when MetaMask detected without Sui Snap */}
      <MetaMaskSnapPrompt />
    </div>
  )
}
