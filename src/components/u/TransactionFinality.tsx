import { Zap } from 'lucide-react'

interface TransactionFinalityProps {
  finality?: number // in milliseconds
  className?: string
}

export function TransactionFinality({ finality = 300, className = '' }: TransactionFinalityProps) {
  // Determine color based on finality speed
  const getFinalityColor = (ms: number) => {
    if (ms < 250) return { bg: 'bg-blue-50 dark:bg-blue-950/50', text: 'text-blue-600 dark:text-blue-400' }
    if (ms < 500) return { bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-600 dark:text-emerald-400' }
    return { bg: 'bg-amber-50 dark:bg-amber-950/50', text: 'text-amber-600 dark:text-amber-400' }
  }

  const colors = getFinalityColor(finality)

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${colors.bg} ${className}`}>
      {/* Lightning bolt icon */}
      <Zap className={`w-3.5 h-3.5 ${colors.text}`} />

      {/* Finality text */}
      <span className={`text-xs font-medium ${colors.text}`}>{finality}ms</span>
    </div>
  )
}
