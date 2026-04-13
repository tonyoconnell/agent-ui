import type { Edge } from '@/engine'

interface EdgeInfoProps {
  highways: Edge[]
  agentId: string
  direction: 'incoming' | 'outgoing'
}

export function EdgeInfo({ highways, agentId, direction }: EdgeInfoProps) {
  const edges = highways.filter(({ path }) => {
    const parts = path.includes(' → ') ? path.split(' → ') : path.split('→')
    const [from, to] = parts
    if (!from || !to) return false
    if (direction === 'incoming') {
      return to.startsWith(`${agentId}:`) || to === agentId
    } else {
      return from.startsWith(`${agentId}:`) || from === agentId
    }
  })

  return (
    <div className="px-4 py-2 border-b border-[#252538]">
      <div className="text-xs text-slate-500 uppercase mb-2">
        {direction === 'incoming' ? 'Incoming Edges' : 'Outgoing Edges'}
      </div>
      <div className="space-y-1">
        {edges.map(({ path, strength }) => (
          <div key={path} className="flex items-center gap-2 text-xs">
            <code className="text-slate-400 flex-1 truncate">{path}</code>
            <div className="w-16 h-1.5 bg-[#252538] rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(strength, 100)}%` }} />
            </div>
            <span className="text-slate-500 w-8 text-right">{strength.toFixed(0)}</span>
          </div>
        ))}
        {edges.length === 0 && <div className="text-xs text-slate-600">No edges yet</div>}
      </div>
    </div>
  )
}
