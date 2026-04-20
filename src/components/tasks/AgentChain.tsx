import { ArrowRight, Bot, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface Match {
  uid: string
  score: number
  overlapTags: string[]
}

interface AssignResponse {
  taskTags?: string[]
  matches?: Match[]
}

const agentIcon = (uid: string) => {
  // ceo / chairman / board are special governance icons; everything else is Bot
  if (uid === 'ceo' || uid === 'chairman' || uid === 'board' || uid === 'human') return User
  return Bot
}

/**
 * Show who owns this task + the top alternates the substrate would pick if it
 * were routed fresh. Fetches /api/tasks/:id/assign once when mounted so cards
 * that scroll into view paint instantly; cold-path round trip is ~30ms, cached
 * for 10s by the match scorer. Render only — never writes.
 */
export function AgentChain({ tid, assignee, inline = false }: { tid: string; assignee?: string; inline?: boolean }) {
  const [alternates, setAlternates] = useState<Match[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancel = false
    if (loaded) return
    fetch(`/api/tasks/${encodeURIComponent(tid)}/assign`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const data = d as AssignResponse | null
        if (cancel || !data?.matches) return
        // Show alternates EXCLUDING the current owner (already rendered primary)
        setAlternates(data.matches.filter((m) => m.uid !== assignee).slice(0, 2))
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
    return () => {
      cancel = true
    }
  }, [tid, assignee, loaded])

  if (!assignee && alternates.length === 0) return null

  if (inline) {
    // Compact inline chain: @owner → @next → @next
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-white/45 font-mono">
        {assignee && <Pill uid={assignee} primary />}
        {alternates.slice(0, 1).map((m) => (
          <span key={m.uid} className="inline-flex items-center gap-1">
            <ArrowRight className="w-2.5 h-2.5 text-white/20" />
            <Pill uid={m.uid} />
          </span>
        ))}
      </span>
    )
  }

  // Full chain rendered in TaskDetail / drawer
  return (
    <div className="flex items-center flex-wrap gap-1.5">
      {assignee && <Pill uid={assignee} primary expanded />}
      {alternates.length > 0 && (
        <>
          <ArrowRight className="w-3 h-3 text-white/20" />
          <span className="text-[10px] uppercase tracking-wider text-white/30">likely next</span>
        </>
      )}
      {alternates.map((m) => (
        <Pill key={m.uid} uid={m.uid} score={m.score} expanded />
      ))}
    </div>
  )
}

function Pill({
  uid,
  primary,
  expanded,
  score,
}: {
  uid: string
  primary?: boolean
  expanded?: boolean
  score?: number
}) {
  const Icon = agentIcon(uid)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-1.5',
        expanded ? 'py-0.5 text-[10px]' : 'py-0 text-[9px]',
        primary ? 'border-sky-400/30 bg-sky-400/8 text-sky-200' : 'border-white/[0.08] bg-white/[0.02] text-white/55',
      )}
    >
      <Icon className={cn(expanded ? 'w-3 h-3' : 'w-2.5 h-2.5', primary ? 'text-sky-300' : 'text-white/40')} />
      <span className="font-mono">{uid}</span>
      {score !== undefined && score > 0 && <span className="text-white/30 tabular-nums">{score.toFixed(2)}</span>}
    </span>
  )
}
