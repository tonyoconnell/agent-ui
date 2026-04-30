interface NetworkStatusProps {
  network?: 'testnet' | 'mainnet'
  status?: 'live' | 'offline'
  className?: string
}

export function NetworkStatus({ network = 'testnet', status = 'live', className = '' }: NetworkStatusProps) {
  const isLive = status === 'live'
  const pulseColor = isLive ? 'bg-tertiary-bright' : 'bg-destructive'
  const textColor = isLive ? 'text-tertiary-bright dark:text-tertiary-bright' : 'text-destructive dark:text-destructive'
  const bgColor = isLive ? 'bg-tertiary-bright/10 dark:bg-tertiary-bright/5' : 'bg-destructive/10 dark:bg-destructive/5'

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
