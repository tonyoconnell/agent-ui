import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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

function truncate(s: string): string {
  if (!s || s.length <= 16) return s
  return `${s.slice(0, 6)}…${s.slice(-6)}`
}

function relativeDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const days = Math.floor(diff / 86_400_000)
    if (days === 0) return 'today'
    if (days === 1) return '1d ago'
    if (days < 30) return `${days}d ago`
    const months = Math.floor(days / 30)
    return `${months}mo ago`
  } catch {
    return iso
  }
}

function relativeExpiry(iso: string | null): string {
  if (!iso) return 'active'
  try {
    const diff = new Date(iso).getTime() - Date.now()
    if (diff < 0) return 'expired'
    const days = Math.ceil(diff / 86_400_000)
    if (days === 0) return 'today'
    if (days === 1) return 'in 1 day'
    if (days < 30) return `in ${days} days`
    return `in ${Math.ceil(days / 30)}mo`
  } catch {
    return iso
  }
}

export function KeyRotationPanel() {
  const [versions, setVersions] = useState<KeyVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)
  const retryButtonRef = useRef<HTMLButtonElement>(null)

  const load = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleRevoke(version: number, keyHash: string) {
    emitClick('ui:owner:key-revoke', { version, keyHash })
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

  function handleRetry() {
    emitClick('ui:owner:keys-retry')
    void load().then(() => {
      setTimeout(() => retryButtonRef.current?.focus(), 50)
    })
  }

  return (
    <Card className="bg-[#0f0f14] border-[#1e293b]">
      <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4 flex-wrap">
        <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
          Owner-key versions
          {!loading && !error && (
            <Badge variant="outline" className="text-xs border-[#1e293b] text-slate-500">
              {versions.length}
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          {/* Register new version — stub dialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-[#252538] text-slate-400 hover:text-white hover:border-[#1e293b]"
                onClick={() => emitClick('ui:owner:key-register-open')}
                aria-label="Register new key version"
              >
                + New version
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#0f0f14] border-[#252538] text-white">
              <AlertDialogHeader>
                <AlertDialogTitle>Register new key version</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400 text-sm space-y-2">
                  <span className="block">
                    Browser-side derivation is required to register a new owner key version. This panel cannot perform
                    the Touch ID / WebAuthn PRF ceremony.
                  </span>
                  <span className="block mt-2">
                    Use the{' '}
                    <a href="/u/keys/rotate" className="text-blue-400 underline hover:text-blue-300">
                      /u/keys/rotate
                    </a>{' '}
                    page, which runs the full biometric ceremony and POSTs the derived key hash to{' '}
                    <code className="font-mono text-xs text-slate-300">/api/auth/owner-key-versions</code>.
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  className="border-[#252538] text-slate-400 hover:text-white hover:bg-[#1e293b]"
                  onClick={() => emitClick('ui:owner:key-register-cancel')}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    emitClick('ui:owner:key-register-goto-rotate')
                    window.location.href = '/u/keys/rotate'
                  }}
                >
                  Go to /u/keys/rotate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-slate-400 hover:text-white"
            onClick={() => {
              emitClick('ui:owner:keys-refresh')
              void load()
            }}
            aria-label="Refresh key versions"
          >
            <svg aria-hidden="true" className="w-3.5 h-3.5 mr-1" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2.5a5.5 5.5 0 1 0 5.5 5.5.75.75 0 0 1 1.5 0 7 7 0 1 1-3.5-6.062V.75a.75.75 0 0 1 1.5 0v3a.75.75 0 0 1-.75.75h-3a.75.75 0 0 1 0-1.5h1.53A5.481 5.481 0 0 0 8 2.5Z" />
            </svg>
            <span>Refresh</span>
            <span className="sr-only"> key versions</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent aria-live="polite">
        {/* Skeleton loading */}
        {loading && (
          <div role="status" className="space-y-3">
            <span className="sr-only">Loading key versions</span>
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-10 bg-[#1e293b]" />
                <Skeleton className="h-4 w-16 bg-[#1e293b]" />
                <Skeleton className="h-4 w-20 bg-[#1e293b]" />
                <Skeleton className="h-4 w-24 bg-[#1e293b]" />
                <Skeleton className="h-4 w-16 bg-[#1e293b]" />
                <Skeleton className="h-4 w-16 bg-[#1e293b]" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-md p-4 space-y-3">
            <p className="text-sm text-red-400">{error}</p>
            <Button
              ref={retryButtonRef}
              size="sm"
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              onClick={handleRetry}
              aria-label="Retry loading key versions"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && versions.length === 0 && (
          <p className="text-sm text-slate-500 py-4 text-center">No owner-key versions registered.</p>
        )}

        {/* Key rows */}
        {!loading && !error && versions.length > 0 && (
          <TooltipProvider>
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-xs font-mono">
                <caption className="sr-only">Owner key versions</caption>
                <thead>
                  <tr className="text-slate-500 border-b border-[#1e293b]">
                    <th scope="col" className="text-left py-2 px-2 font-medium">
                      Version
                    </th>
                    <th scope="col" className="text-left py-2 px-2 font-medium">
                      Role
                    </th>
                    <th scope="col" className="text-left py-2 px-2 font-medium">
                      Group
                    </th>
                    <th scope="col" className="text-left py-2 px-2 font-medium">
                      Key hash
                    </th>
                    <th scope="col" className="text-left py-2 px-2 font-medium">
                      Issued
                    </th>
                    <th scope="col" className="text-left py-2 px-2 font-medium">
                      Expires
                    </th>
                    <th scope="col" className="text-left py-2 px-2 font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {versions.map((v) => (
                    <tr key={v.key_hash} className="border-b border-[#1e293b]/50 hover:bg-[#161622] transition-colors">
                      <td className="py-2.5 px-2">
                        <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
                          v{v.version}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-2">
                        <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">
                          {v.role}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-2 text-slate-400">{v.group}</td>
                      <td className="py-2.5 px-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-slate-500 cursor-default">{truncate(v.key_hash)}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <span className="font-mono text-xs break-all">{v.key_hash}</span>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                      <td className="py-2.5 px-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-slate-400 cursor-default whitespace-nowrap">
                              {relativeDate(v.issued_at)}
                            </span>
                          </TooltipTrigger>
                          {v.issued_at && (
                            <TooltipContent>
                              <span className="font-mono text-xs">{new Date(v.issued_at).toISOString()}</span>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </td>
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        {v.expires_at ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-slate-400 cursor-default">{relativeExpiry(v.expires_at)}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <span className="font-mono text-xs">{new Date(v.expires_at).toISOString()}</span>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400">
                            active
                          </Badge>
                        )}
                      </td>
                      <td className="py-2.5 px-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                          disabled={revoking === v.key_hash}
                          aria-label={`Force-revoke key version v${v.version}`}
                          onClick={() => {
                            void handleRevoke(v.version, v.key_hash)
                          }}
                        >
                          {revoking === v.key_hash ? 'Revoking…' : 'Force-revoke'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TooltipProvider>
        )}

        <p className="mt-4 text-xs text-slate-600">
          To rotate: derive a new key client-side via Touch ID, then use the{' '}
          <a href="/u/keys/rotate" className="text-blue-500 hover:text-blue-400">
            /u/keys/rotate
          </a>{' '}
          page.
        </p>
      </CardContent>
    </Card>
  )
}
