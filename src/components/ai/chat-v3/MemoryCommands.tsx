import { type ReactNode, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { MemoryCard as MemoryCardType } from '@/engine/persist'
import { MemoryCard } from './MemoryCard'

function ForgetConfirm({ uid, onCancel }: { uid: string; onCancel?: () => void }): ReactNode {
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (!confirmed) return
    fetch('/api/identity/forget', { method: 'POST' }).then(() => window.location.reload())
  }, [confirmed])

  if (confirmed) {
    return <p className="text-slate-400">Erasing memory...</p>
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-yellow-400">This will permanently erase all memory for {uid}. Are you sure?</p>
      <div className="flex gap-2">
        <Button variant="destructive" onClick={() => setConfirmed(true)}>
          Erase memory
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

export async function handleCommand(text: string, uid: string, onDismiss?: () => void): Promise<ReactNode> {
  const command = text.trim().toLowerCase()

  if (command === '/memory' || command === '/memory help') {
    const res = await fetch(`/api/memory/reveal/${uid}`)
    if (!res.ok) return <p className="text-red-400">Could not load memory.</p>
    const data: MemoryCardType = await res.json()
    return <MemoryCard data={data} />
  }

  if (command === '/forget') {
    return <ForgetConfirm uid={uid} onCancel={onDismiss} />
  }

  if (command === '/explore') {
    const res = await fetch(`/api/memory/frontier/${uid}`)
    if (!res.ok) return <p className="text-red-400">Could not load frontier.</p>
    const tags: string[] = await res.json()
    if (tags.length === 0) return <p className="text-slate-400">No unexplored territory found.</p>
    return (
      <div className="flex flex-col gap-2">
        <p>Unexplored areas:</p>
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span key={tag} className="bg-slate-700 text-slate-200 px-2 py-0.5 rounded text-sm">
              {tag}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return <p className="text-slate-500">Unknown command. Try /memory, /forget, or /explore.</p>
}
