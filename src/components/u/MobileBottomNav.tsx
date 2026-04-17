/**
 * MobileBottomNav - iOS-style bottom tab bar
 *
 * Features:
 * - Fixed bottom position with safe area
 * - Haptic feedback ready
 * - Active state indicators
 * - Smooth transitions
 */
import { motion } from 'framer-motion'
import { useResponsive } from './hooks/useResponsive'

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
  badge?: number
}

interface MobileBottomNavProps {
  items: NavItem[]
  activeId: string
  onNavigate?: (id: string, href: string) => void
}

export function MobileBottomNav({ items, activeId, onNavigate }: MobileBottomNavProps) {
  const { isMobile } = useResponsive()

  // Only show on mobile
  if (!isMobile) return null

  return (
    <nav
      className={`
        fixed bottom-0 left-0 right-0 z-50
        bg-background/95 backdrop-blur-xl
        border-t border-border/50
        pb-safe
      `}
    >
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const isActive = item.id === activeId

          return (
            <a
              key={item.id}
              href={item.href}
              onClick={(e) => {
                if (onNavigate) {
                  e.preventDefault()
                  onNavigate(item.id, item.href)
                }
              }}
              className={`
                relative flex flex-col items-center justify-center
                flex-1 h-full
                transition-colors duration-200
                ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}
              `}
            >
              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-0.5 left-1/4 right-1/4 h-0.5 bg-primary rounded-full"
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                />
              )}

              {/* Icon */}
              <div className="relative">
                <div className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform`}>{item.icon}</div>

                {/* Badge */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-primary' : ''}`}>{item.label}</span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}

// Pre-built nav items for wallet pages
export const WALLET_NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/u',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    id: 'wallets',
    label: 'Wallets',
    href: '/u/wallets',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
        />
      </svg>
    ),
  },
  {
    id: 'send',
    label: 'Send',
    href: '#send',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
      </svg>
    ),
  },
  {
    id: 'receive',
    label: 'Receive',
    href: '#receive',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
      </svg>
    ),
  },
  {
    id: 'activity',
    label: 'Activity',
    href: '/u/transactions',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
]

// Floating Action Button for quick actions
export function FloatingActionButton({
  onClick,
  icon,
  label,
}: {
  onClick: () => void
  icon: React.ReactNode
  label?: string
}) {
  const { isMobile } = useResponsive()

  if (!isMobile) return null

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        fixed right-4 bottom-24 z-40
        w-14 h-14 rounded-full
        bg-primary text-primary-foreground
        shadow-lg shadow-primary/25
        flex items-center justify-center
        active:opacity-90
      `}
      aria-label={label}
    >
      {icon}
    </motion.button>
  )
}
