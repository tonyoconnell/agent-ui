/**
 * MobileNav - Mobile Bottom Navigation
 *
 * iOS-style bottom tab bar for mobile devices
 * Shows on mobile (< 768px), hidden on desktop
 *
 * Navigation items:
 * - Wallets
 * - Send
 * - Receive
 * - Sell (Products)
 * - People
 */

import { Download, Menu, Send, ShoppingBag, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface NavItem {
  title: string
  icon: React.ReactNode
  url: string
  color?: string
}

const NAV_ITEMS: NavItem[] = [
  { title: 'Wallets', icon: <Wallet className="w-5 h-5" />, url: '/u/wallets', color: 'from-amber-500 to-orange-500' },
  { title: 'Send', icon: <Send className="w-5 h-5" />, url: '/u/send', color: 'from-green-500 to-emerald-500' },
  {
    title: 'Receive',
    icon: <Download className="w-5 h-5" />,
    url: '/u/receive',
    color: 'from-purple-500 to-violet-500',
  },
  { title: 'Sell', icon: <ShoppingBag className="w-5 h-5" />, url: '/u/products', color: 'from-pink-500 to-rose-500' },
  { title: 'Menu', icon: <Menu className="w-5 h-5" />, url: '#menu', color: 'from-indigo-500 to-purple-500' },
]

export function MobileNav() {
  const [currentPath, setCurrentPath] = useState('')
  const [mounted, setMounted] = useState(false)
  const [isMobileWidth, setIsMobileWidth] = useState(true)

  useEffect(() => {
    // Set initial path
    setCurrentPath(window.location.pathname)

    // Responsive check
    const media = window.matchMedia('(max-width: 1024px)')
    const updateWidth = () => setIsMobileWidth(media.matches)
    updateWidth()
    media.addEventListener('change', updateWidth)

    // Mark portal ready
    setMounted(true)

    // Listen for Astro View Transitions navigation events
    const handleNavigation = () => {
      setCurrentPath(window.location.pathname)
    }

    // Listen for both popstate (back/forward) and Astro's navigation events
    window.addEventListener('popstate', handleNavigation)
    document.addEventListener('astro:page-load', handleNavigation)

    return () => {
      window.removeEventListener('popstate', handleNavigation)
      document.removeEventListener('astro:page-load', handleNavigation)
      media.removeEventListener('change', updateWidth)
    }
  }, [])

  // Hide on desktop widths
  if (!isMobileWidth) return null

  const navContent = (
    <nav
      className="fixed inset-x-0 bottom-0 w-full bg-background/95 backdrop-blur-xl border-t flex items-center justify-around h-20 z-999 pb-safe pointer-events-auto"
      style={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
    >
      {NAV_ITEMS.map((item) => {
        const isMenu = item.url === '#menu'
        const isActive =
          !isMenu &&
          currentPath.startsWith(item.url) &&
          (item.url === '/u/wallets' ? currentPath === '/u/wallets' : true)

        const handleClick = (e: React.MouseEvent) => {
          if (isMenu) {
            e.preventDefault()
            window.dispatchEvent(new CustomEvent('u:open-sidebar'))
            return
          }
          // allow normal navigation
        }

        const Element = isMenu ? 'button' : 'a'

        return (
          <Element
            key={item.url}
            href={isMenu ? undefined : item.url}
            onClick={handleClick}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-label={item.title}
            type={isMenu ? 'button' : undefined}
          >
            {item.icon}
            <span className="text-xs font-medium">{item.title}</span>
          </Element>
        )
      })}
    </nav>
  )

  // Render into body to avoid any transformed parents affecting positioning
  if (!mounted || typeof document === 'undefined') return null
  return createPortal(navContent, document.body)
}
