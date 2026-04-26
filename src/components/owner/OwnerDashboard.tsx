import { useState } from 'react'
import { AgentList } from '@/components/owner/AgentList'
import { AuditLogViewer } from '@/components/owner/AuditLogViewer'
import { KeyRotationPanel } from '@/components/owner/KeyRotationPanel'
import { SessionUnlockButton } from '@/components/owner/SessionUnlockButton'

// Read daemon config from server-rendered meta tags if present.
function readMeta(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') ?? fallback
}

// Stub getPrf — real PRF capture requires a full WebAuthn ceremony.
// The SessionUnlockButton will surface its own error if the daemon returns
// a bad-PRF response; this stub keeps the dashboard self-contained.
async function stubGetPrf(): Promise<Uint8Array> {
  throw new Error('Touch ID PRF capture not yet wired in this dashboard. Use the owner-daemon CLI flow.')
}

function truncateAddress(addr: string): string {
  if (!addr || addr.length <= 14) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-6)}`
}

export function OwnerDashboard() {
  // Read owner address from meta tag (can be injected by the Astro page if needed).
  const [ownerAddress] = useState<string>(() => readMeta('owner-address', ''))
  const daemonUrl = readMeta('owner-daemon-url', 'http://127.0.0.1:48923')
  const daemonKey = readMeta('owner-daemon-key', '')

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-foreground">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header strip */}
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-4">
          <div>
            <h1 className="text-lg font-semibold text-white">Owner Dashboard</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              <span className="text-purple-400 font-mono">Substrate owner</span>
              {ownerAddress && (
                <>
                  {' '}
                  —{' '}
                  <span className="font-mono text-slate-400" title={ownerAddress}>
                    {truncateAddress(ownerAddress)}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Session unlock */}
        <section>
          <h2 className="text-sm font-medium text-slate-400 mb-3">Session</h2>
          {daemonKey ? (
            <SessionUnlockButton daemonUrl={daemonUrl} daemonKey={daemonKey} getPrf={stubGetPrf} className="max-w-xs" />
          ) : (
            <p className="text-xs text-slate-600 font-mono">
              Set <code>owner-daemon-key</code> meta tag to enable session unlock. The owner daemon must be running
              locally.
            </p>
          )}
        </section>

        {/* Agent list */}
        <section>
          <h2 className="text-sm font-medium text-slate-400 mb-3">Agent Wallets</h2>
          <AgentList />
        </section>

        {/* Key rotation */}
        <section>
          <h2 className="text-sm font-medium text-slate-400 mb-3">Key Rotation</h2>
          <KeyRotationPanel />
        </section>

        {/* Audit log */}
        <section>
          <h2 className="text-sm font-medium text-slate-400 mb-3">Audit Log</h2>
          <AuditLogViewer />
        </section>
      </div>
    </div>
  )
}
