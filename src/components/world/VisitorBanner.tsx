/**
 * VISITOR BANNER — Greeting for unauthenticated users
 *
 * Slides in from top when no session (visitor mode)
 * Text: "This is the ONE world. It's alive right now. Click anything. Drag anything. Or [follow the guide]."
 * Three buttons: [Follow the guide] [Build your own ↗ /build] [Sign up ↗ /signup]
 * Dismiss: Click X to hide (localStorage to remember)
 * Styling: Dark background, gradient, professional
 * Condition: Only show when NOT authenticated (check session context)
 */

import { useState, useEffect } from 'react'
import { useSkin } from '@/contexts/SkinContext'
import { cn } from '@/lib/utils'

interface Props {
  isAuthenticated?: boolean
  className?: string
}

export function VisitorBanner({ isAuthenticated = false, className }: Props) {
  const { skin } = useSkin()
  const [isVisible, setIsVisible] = useState(!isAuthenticated)

  // Check localStorage to see if user dismissed the banner
  useEffect(() => {
    if (!isAuthenticated) {
      const dismissed = localStorage.getItem('visitor-banner-dismissed')
      setIsVisible(!dismissed)
    } else {
      setIsVisible(false)
    }
  }, [isAuthenticated])

  // Don't show if authenticated
  if (isAuthenticated) {
    return null
  }

  // Don't show if dismissed
  if (!isVisible) {
    return null
  }

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('visitor-banner-dismissed', 'true')
  }

  const handleFollowGuide = () => {
    const params = new URLSearchParams(window.location.search)
    params.set('guide', '1')
    const newUrl = `${window.location.pathname}?${params.toString()}`
    window.history.replaceState({}, '', newUrl)
  }

  const handleBuild = () => {
    window.location.href = '/build'
  }

  const handleSignUp = () => {
    window.location.href = '/signup'
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden border-b transition-all duration-300 ease-out',
        'animate-in slide-in-from-top-4',
        className
      )}
      style={{
        backgroundColor: `linear-gradient(135deg, ${skin.colors.primary}15 0%, ${skin.colors.secondary}10 100%)`,
        borderColor: skin.colors.primary + '30',
      }}
    >
      {/* Animated gradient background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `linear-gradient(90deg, ${skin.colors.primary}20 0%, transparent 50%, ${skin.colors.secondary}20 100%)`,
          animation: 'slide-gradient 8s ease-in-out infinite',
        }}
      />

      <div className="relative px-6 py-4 flex items-center justify-between gap-6">
        {/* Main message */}
        <div className="flex-1">
          <p
            className="text-sm leading-relaxed font-medium"
            style={{ color: skin.colors.muted }}
          >
            This is the ONE world. It's alive right now. Click anything. Drag anything. Or{' '}
            <button
              onClick={handleFollowGuide}
              className="font-semibold underline hover:opacity-80 transition-opacity"
              style={{ color: skin.colors.primary }}
            >
              follow the guide
            </button>
            .
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={handleFollowGuide}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:shadow-lg"
            style={{
              backgroundColor: skin.colors.primary,
              color: skin.colors.surface,
            }}
            title="Start the interactive guide"
          >
            Follow the guide
          </button>

          <button
            onClick={handleBuild}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-white/10"
            style={{
              backgroundColor: skin.colors.primary + '20',
              color: skin.colors.primary,
              borderWidth: 1,
              borderColor: skin.colors.primary + '40',
            }}
            title="Build your own agents"
          >
            Build your own ↗
          </button>

          <button
            onClick={handleSignUp}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-white/10"
            style={{
              backgroundColor: skin.colors.primary + '20',
              color: skin.colors.primary,
              borderWidth: 1,
              borderColor: skin.colors.primary + '40',
            }}
            title="Sign up for an account"
          >
            Sign up ↗
          </button>

          {/* Dismiss button (X) */}
          <button
            onClick={handleDismiss}
            className="p-2 rounded-lg transition-all hover:bg-white/5"
            style={{ color: skin.colors.muted }}
            title="Dismiss this banner"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Subtle bottom border glow */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px opacity-50"
        style={{
          background: `linear-gradient(90deg, transparent, ${skin.colors.primary}80, transparent)`,
        }}
      />

      <style>{`
        @keyframes slide-gradient {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ~150 lines. Slides in from top for visitors. localStorage remembers dismiss.
// ═══════════════════════════════════════════════════════════════════════════════
