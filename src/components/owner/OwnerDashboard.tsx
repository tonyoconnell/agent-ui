import { useState } from 'react'
import { AgentList } from '@/components/owner/AgentList'
import { AuditLogViewer } from '@/components/owner/AuditLogViewer'
import { KeyRotationPanel } from '@/components/owner/KeyRotationPanel'
import { SessionUnlockButton } from '@/components/owner/SessionUnlockButton'
import { Badge } from '@/components/ui/badge'

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
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export function OwnerDashboard() {
  // Read owner address from meta tag (can be injected by the Astro page if needed).
  const [ownerAddress] = useState<string>(() => readMeta('owner-address', ''))
  const daemonUrl = readMeta('owner-daemon-url', 'http://127.0.0.1:48923')
  const daemonKey = readMeta('owner-daemon-key', '')

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-foreground">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb">
          <ol className="flex items-center gap-1.5 text-xs text-slate-500">
            <li>
              <a href="/u" className="hover:text-slate-300 transition-colors">
                /u
              </a>
            </li>
            <li aria-hidden="true" className="text-slate-700">
              ›
            </li>
            <li className="text-slate-400" aria-current="page">
              owner
            </li>
          </ol>
        </nav>

        {/* Header strip */}
        <div className="border-b border-[#1e293b] pb-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-lg font-semibold text-white">Owner Dashboard</h1>
                <Badge className="bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs font-mono">
                  substrate root
                </Badge>
              </div>
              {ownerAddress ? (
                <p className="text-xs text-slate-500 font-mono">
                  <span className="text-slate-400 cursor-default" title={ownerAddress}>
                    {truncateAddress(ownerAddress)}
                  </span>
                  <span className="ml-2 text-slate-600">· hover for full address</span>
                </p>
              ) : (
                <p className="text-xs text-slate-600">
                  Set <code className="font-mono text-slate-500">owner-address</code> meta tag to display address.
                </p>
              )}
            </div>

            {/* Lock banner — owner-only affirmation */}
            <div
              className="flex items-center gap-1.5 text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-md"
              role="note"
            >
              <span aria-hidden="true">🔒</span>
              <span>Owner-only</span>
            </div>
          </div>
        </div>

        {/* Top grid: session + quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Session unlock — full width on mobile, left column on md+ */}
          <section aria-label="Session management">
            <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Session</h2>
            {daemonKey ? (
              <SessionUnlockButton daemonUrl={daemonUrl} daemonKey={daemonKey} getPrf={stubGetPrf} className="w-full" />
            ) : (
              <p className="text-xs text-slate-600 font-mono">
                Set <code className="text-slate-500">owner-daemon-key</code> meta tag to enable session unlock.
              </p>
            )}
          </section>

          {/* Quick stats placeholder — populated by child components via counts */}
          <section aria-label="Quick statistics">
            <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">At a glance</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#161622] border border-[#252538] rounded-lg p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Agents</p>
                <p className="text-lg font-semibold text-white font-mono" id="stat-agents">
                  —
                </p>
              </div>
              <div className="bg-[#161622] border border-[#252538] rounded-lg p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Key versions</p>
                <p className="text-lg font-semibold text-white font-mono" id="stat-keys">
                  —
                </p>
              </div>
              <div className="bg-[#161622] border border-[#252538] rounded-lg p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Audit (24h)</p>
                <p className="text-lg font-semibold text-white font-mono" id="stat-audit">
                  —
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Bottom: full-width panels stacked */}
        <section aria-label="Agent wallets">
          <AgentList />
        </section>

        <section aria-label="Audit log">
          <AuditLogViewer />
        </section>

        <section aria-label="Key rotation">
          <KeyRotationPanel />
        </section>
      </div>
    </div>
  )
}
