import { useCallback, useEffect, useState } from 'react'
import { MemoryCard } from '@/components/ai/chat-v3/MemoryCard'
import type { MemoryCard as MemoryCardData } from '@/engine/persist'

interface Props {
  uid: string
  onClose: () => void
}

export function Inspector({ uid, onClose }: Props) {
  const [data, setData] = useState<MemoryCardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/memory/reveal/${uid}`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
        return res.json() as Promise<MemoryCardData>
      })
      .then((json) => {
        setData(json)
        setLoading(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err))
        setLoading(false)
      })
  }, [uid])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="text-sm font-medium text-font">Inspector</span>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-font">
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center gap-2 px-4 py-6 text-muted-foreground text-sm">
            <svg
              className="animate-spin h-4 w-4 text-muted-foreground"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Loading...
          </div>
        )}
        {!loading && error && (
          <div className="px-4 py-6 flex flex-col gap-3">
            <p className="text-sm text-[hsl(var(--color-destructive))]">{error}</p>
            <button
              type="button"
              onClick={fetchData}
              className="self-start text-xs px-3 py-1 rounded bg-muted hover:bg-muted/80 text-font"
            >
              Retry
            </button>
          </div>
        )}
        {!loading && !error && data && <MemoryCard data={data} onClose={onClose} />}
      </div>
    </div>
  )
}
