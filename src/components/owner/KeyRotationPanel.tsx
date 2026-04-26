import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { emitClick } from '@/lib/ui-signal'

interface KeyVersion {
  key_hash: string
  address: string
  version: number
  role: string
  group: string
  issued_at: string | null
  expires_at: string | null
}

function truncate(s: string, len = 12): string {
  if (!s || s.length <= len) return s
  return `${s.slice(0, 6)}…${s.slice(-6)}`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export function KeyRotationPanel() {
  const [versions, setVersions] = useState<KeyVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/owner-key-versions')
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      const json = (await res.json()) as { versions: KeyVersion[] }
      setVersions(json.versions ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [load])

  async function handleRevoke(keyHash: string) {
    emitClick('ui:owner:revoke-key')
    setRevoking(keyHash)
    try {
      const res = await fetch('/api/auth/owner-key-versions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyHash }),
      })
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setRevoking(null)
    }
  }

  return (
    <Card className="bg-[#0f0f14] border-[#1e293b]">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-slate-300">
          Owner Key Versions
          {!loading && !error && (
            <Badge variant="outline" className="ml-2 text-xs border-[#1e293b] text-slate-500">
              {versions.length} active
            </Badge>
          )}
        </CardTitle>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs text-slate-400 hover:text-white"
          onClick={() => {
            emitClick('ui:owner:refresh-keys')
            void load()
          }}
        >
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-sm text-slate-500">Loading…</p>}
        {error && (
          <div className="space-y-2">
            <p className="text-sm text-red-400">{error}</p>
            <Button
              size="sm"
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              onClick={() => {
                emitClick('ui:owner:retry-keys')
                void load()
              }}
            >
              Retry
            </Button>
          </div>
        )}
        {!loading && !error && versions.length === 0 && (
          <p className="text-sm text-slate-500 font-mono">
            No owner key versions registered yet. Use POST /api/auth/owner-key-versions to register.
          </p>
        )}
        {!loading && !error && versions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-slate-500 border-b border-[#1e293b]">
                  <th className="text-left py-2 pr-3">Version</th>
                  <th className="text-left py-2 pr-3">Role</th>
                  <th className="text-left py-2 pr-3">Group</th>
                  <th className="text-left py-2 pr-3">Key hash</th>
                  <th className="text-left py-2 pr-3">Issued</th>
                  <th className="text-left py-2 pr-3">Expires</th>
                  <th className="text-left py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((v) => (
                  <tr key={v.key_hash} className="border-b border-[#1e293b]/50 hover:bg-[#161622]">
                    <td className="py-2 pr-3 text-blue-400">v{v.version}</td>
                    <td className="py-2 pr-3">
                      <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">
                        {v.role}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3 text-slate-400">{v.group}</td>
                    <td className="py-2 pr-3 text-slate-500" title={v.key_hash}>
                      {truncate(v.key_hash, 16)}
                    </td>
                    <td className="py-2 pr-3 text-slate-400 whitespace-nowrap">{formatDate(v.issued_at)}</td>
                    <td className="py-2 pr-3 text-slate-400 whitespace-nowrap">
                      {v.expires_at ? (
                        formatDate(v.expires_at)
                      ) : (
                        <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">
                          no expiry
                        </Badge>
                      )}
                    </td>
                    <td className="py-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                        disabled={revoking === v.key_hash}
                        onClick={() => {
                          void handleRevoke(v.key_hash)
                        }}
                      >
                        {revoking === v.key_hash ? 'Revoking…' : 'Revoke'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-slate-600">
          To rotate: derive a new key client-side via Touch ID, then POST to /api/auth/owner-key-versions. PRF
          derivation is out of scope for this panel.
        </p>
      </CardContent>
    </Card>
  )
}
