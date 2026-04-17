interface NetworkStatusProps {
  network?: 'testnet' | 'mainnet'
  status?: 'live' | 'offline'
  className?: string
}

export function NetworkStatus({ network = 'testnet', status = 'live', className = '' }: NetworkStatusProps) {
  const isLive = status === 'live'
  const pulseColor = isLive ? 'bg-emerald-500' : 'bg-red-500'
  const textColor = isLive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
  const bgColor = isLive ? 'bg-emerald-50 dark:bg-emerald-950/50' : 'bg-red-50 dark:bg-red-950/50'

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${bgColor} ${className}`}>
      {/* Pulsing indicator dot */}
      <div className="relative w-2 h-2">
        <div className={`absolute inset-0 rounded-full ${pulseColor}`} />
        {isLive && (
          <>
            <div className={`absolute inset-0 rounded-full ${pulseColor} animate-pulse`} />
            <div className={`absolute inset-0 rounded-full ${pulseColor} animate-ping`} style={{ opacity: 0.3 }} />
          </>
        )}
      </div>

      {/* Text */}
      <span className={`text-xs font-medium ${textColor}`}>
        {network === 'testnet' ? 'Testnet' : 'Mainnet'} · {isLive ? 'Live' : 'Offline'}
      </span>
    </div>
  )
}
