import type { Edge } from "@/engine"

interface HighwayPanelProps {
  highways: Edge[]  // Array of { edge: string, strength: number }
}

export function HighwayPanel({ highways }: HighwayPanelProps) {
  return (
    <div className="bg-[#161622] rounded-xl p-4 border border-[#252538]">
      <h3 className="text-sm text-slate-500 uppercase mb-3">Highways</h3>
      <div className="space-y-2">
        {highways.map(({ edge, strength }) => (
          <div key={edge} className="flex items-center gap-3">
            <div className="flex-1">
              <code className="text-xs text-slate-400">{edge}</code>
            </div>
            <div className="w-24 h-2 bg-[#252538] rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${Math.min(strength, 100)}%` }}
              />
            </div>
            <span className="text-xs text-slate-500 w-12 text-right">
              {strength.toFixed(0)}
            </span>
          </div>
        ))}
        {highways.length === 0 && (
          <div className="text-xs text-slate-600">No highways yet</div>
        )}
      </div>
    </div>
  )
}
