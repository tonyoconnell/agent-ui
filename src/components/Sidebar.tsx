/**
 * Sidebar — global nav, one source of truth, two surfaces.
 *
 *   Desktop (md+): vertical 64px rail, hover/focus expands to 240px overlay.
 *   Mobile  (<md): bottom tab bar with 5 priority items.
 *
 * Both render from the same NAV_ITEMS array. No JS breakpoint detection —
 * Tailwind responsive classes pick the surface.
 *
 * State model mirrors TQL path-status (sui.tql:74):
 *   collapsed  = "open"      (rail visible, ready, no pheromone yet)
 *   hover      = "highway"   (path forms under cursor — labels reveal)
 *   active     = hardened    (route highlighted with gradient)
 *
 * Auth lives in Header. This component is nav-only.
 */

import { ArrowLeftRight, Coins, Download, FileCode, Home, Key, Send, ShoppingBag, Users, Wallet } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import { emitClick } from '@/lib/ui-signal'

interface NavItem {
  id: string
  label: string
  href: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  color: string
  /** Show on mobile bottom nav. Top 5 items are visible; others rail-only. */
  mobile?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', href: '/u', icon: Home, color: 'from-blue-500 to-indigo-500', mobile: true },
  {
    id: 'wallets',
    label: 'Wallets',
    href: '/u/wallets',
    icon: Wallet,
    color: 'from-amber-500 to-orange-500',
    mobile: true,
  },
  { id: 'send', label: 'Send', href: '/u/send', icon: Send, color: 'from-green-500 to-emerald-500', mobile: true },
  {
    id: 'receive',
    label: 'Receive',
    href: '/u/receive',
    icon: Download,
    color: 'from-purple-500 to-violet-500',
    mobile: true,
  },
  {
    id: 'transactions',
    label: 'Activity',
    href: '/u/transactions',
    icon: ArrowLeftRight,
    color: 'from-cyan-500 to-teal-500',
    mobile: true,
  },
  { id: 'tokens', label: 'Tokens', href: '/u/tokens', icon: Coins, color: 'from-cyan-500 to-blue-500' },
  { id: 'contracts', label: 'Contracts', href: '/u/contracts', icon: FileCode, color: 'from-sky-500 to-indigo-500' },
  { id: 'products', label: 'Products', href: '/u/products', icon: ShoppingBag, color: 'from-pink-500 to-rose-500' },
  { id: 'people', label: 'People', href: '/u/people', icon: Users, color: 'from-indigo-500 to-purple-500' },
  { id: 'keys', label: 'Keys', href: '/u/keys', icon: Key, color: 'from-red-500 to-orange-500' },
]

const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((i) => i.mobile)

interface Props {
  current?: string
}

function isItemActive(item: NavItem, current: string): boolean {
  return current === item.id || current === item.href
}

export function Sidebar({ current = '' }: Props) {
  return (
    <>
      <DesktopRail current={current} />
      <MobileBottomBar current={current} />
    </>
  )
}

function DesktopRail({ current }: { current: string }) {
  return (
    <aside
      className="
        group/sidebar
        hidden md:flex md:flex-col
        fixed left-0 top-14 bottom-0
        w-16 hover:w-60 focus-within:w-60
        bg-[#0a0a0f]/90 backdrop-blur
        border-r border-white/5
        overflow-hidden
        transition-[width] duration-200 ease-out
        z-40
        shadow-[8px_0_24px_-12px_rgba(0,0,0,0.6)]
        hover:shadow-[12px_0_32px_-12px_rgba(0,0,0,0.7)]
      "
      aria-label="Primary navigation"
    >
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
        <ul className="space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = isItemActive(item, current)
            const Icon = item.icon
            return (
              <li key={item.id}>
                <a
                  href={item.href}
                  onClick={() => emitClick(`ui:sidebar:${item.id}`)}
                  aria-current={isActive ? 'page' : undefined}
                  title={item.label}
                  className={`
                    relative flex items-center gap-3 rounded-lg
                    h-12 px-2
                    transition-all duration-200
                    ${isActive ? 'bg-white/[0.06] text-white' : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'}
                  `}
                >
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-emerald-400"
                    />
                  )}

                  <span
                    className={`
                      flex items-center justify-center shrink-0
                      w-9 h-9 rounded-full
                      transition-all duration-200
                      ${
                        isActive
                          ? `bg-linear-to-br ${item.color} text-white shadow-md`
                          : 'bg-white/[0.04] text-slate-300 group-hover/sidebar:bg-white/[0.08]'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                  </span>

                  <span
                    className="
                      whitespace-nowrap text-sm font-medium
                      opacity-0 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100
                      transition-opacity duration-200 delay-75
                    "
                  >
                    {item.label}
                  </span>
                </a>
              </li>
            )
          })}
        </ul>
      </nav>

      <div
        className="
          shrink-0 border-t border-white/5 px-4 py-3
          text-[10px] leading-relaxed text-slate-600
          opacity-0 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100
          transition-opacity duration-200 delay-100
          whitespace-nowrap
        "
      >
        <p>670 lines of engine.</p>
        <p>Zero silent returns.</p>
      </div>
    </aside>
  )
}

function MobileBottomBar({ current }: { current: string }) {
  return (
    <nav
      className="
        md:hidden
        fixed bottom-0 left-0 right-0 z-40
        bg-[#0a0a0f]/95 backdrop-blur-xl
        border-t border-white/5
        pb-[env(safe-area-inset-bottom)]
      "
      aria-label="Primary navigation"
    >
      <ul className="flex items-stretch justify-around h-16">
        {MOBILE_NAV_ITEMS.map((item) => {
          const isActive = isItemActive(item, current)
          const Icon = item.icon
          return (
            <li key={item.id} className="flex-1">
              <a
                href={item.href}
                onClick={() => emitClick(`ui:sidebar:${item.id}`)}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  relative flex flex-col items-center justify-center
                  h-full gap-0.5
                  transition-colors duration-150
                  ${isActive ? 'text-white' : 'text-slate-400 active:text-slate-200'}
                `}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-1/4 right-1/4 h-0.5 rounded-full bg-emerald-400"
                  />
                )}
                <span
                  className={`
                    flex items-center justify-center
                    w-8 h-8 rounded-full
                    transition-all duration-200
                    ${isActive ? `bg-linear-to-br ${item.color} text-white shadow-md` : 'bg-transparent'}
                  `}
                >
                  <Icon className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
