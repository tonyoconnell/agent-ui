import { Zap } from 'lucide-react'

interface TransactionFinalityProps {
  finality?: number // in milliseconds
  className?: string
}

export function TransactionFinality({ finality = 300, className = '' }: TransactionFinalityProps) {
  // Determine color based on finality speed
  const getFinalityColor = (ms: number) => {
    if (ms < 250)
      return {
        bg: 'bg-primary-bright/10 dark:bg-primary-bright/5',
        text: 'text-primary-bright dark:text-primary-bright',
      }
    if (ms < 500)
      return {
        bg: 'bg-tertiary-bright/10 dark:bg-tertiary-bright/5',
        text: 'text-tertiary-bright dark:text-tertiary-bright',
      }
    return { bg: 'bg-gold/10 dark:bg-gold/5', text: 'text-gold dark:text-gold' }
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
