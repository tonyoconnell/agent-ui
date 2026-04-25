/**
 * Sidebar — global nav, one source of truth, two surfaces.
 *
 *   Desktop (md+): vertical 64px rail, fixed left, full height.
 *   Mobile  (<md): hamburger trigger → shadcn <Sheet> slides in from left.
 *
 * Both render from the same NAV_ITEMS array. No JS breakpoint detection —
 * Tailwind responsive classes pick the surface.
 *
 * Auth lives in Header. This component is nav-only.
 */

import {
  ArrowLeftRight,
  Coins,
  Download,
  FileCode,
  Home,
  Key,
  Menu,
  Send,
  ShoppingBag,
  Users,
  Wallet,
} from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import { useState } from 'react'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { emitClick } from '@/lib/ui-signal'

interface NavItem {
  id: string
  label: string
  href: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  color: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', href: '/u', icon: Home, color: 'from-blue-500 to-indigo-500' },
  { id: 'wallets', label: 'Wallets', href: '/u/wallets', icon: Wallet, color: 'from-amber-500 to-orange-500' },
  { id: 'send', label: 'Send', href: '/u/send', icon: Send, color: 'from-green-500 to-emerald-500' },
  { id: 'receive', label: 'Receive', href: '/u/receive', icon: Download, color: 'from-purple-500 to-violet-500' },
  {
    id: 'transactions',
    label: 'Activity',
    href: '/u/transactions',
    icon: ArrowLeftRight,
    color: 'from-cyan-500 to-teal-500',
  },
  { id: 'tokens', label: 'Tokens', href: '/u/tokens', icon: Coins, color: 'from-cyan-500 to-blue-500' },
  { id: 'contracts', label: 'Contracts', href: '/u/contracts', icon: FileCode, color: 'from-sky-500 to-indigo-500' },
  { id: 'products', label: 'Products', href: '/u/products', icon: ShoppingBag, color: 'from-pink-500 to-rose-500' },
  { id: 'people', label: 'People', href: '/u/people', icon: Users, color: 'from-indigo-500 to-purple-500' },
  { id: 'keys', label: 'Keys', href: '/u/keys', icon: Key, color: 'from-red-500 to-orange-500' },
]

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
      <MobileSheet current={current} />
    </>
  )
}

function NavLink({ item, current, expanded = false }: { item: NavItem; current: string; expanded?: boolean }) {
  const isActive = isItemActive(item, current)
  const Icon = item.icon
  return (
    <a
      href={item.href}
      onClick={() => emitClick(`ui:sidebar:${item.id}`)}
      aria-current={isActive ? 'page' : undefined}
      title={expanded ? undefined : item.label}
      className={`
        relative flex items-center gap-3 rounded-lg
        h-12 ${expanded ? 'px-3' : 'justify-center'}
        transition-colors duration-200
        ${isActive ? 'bg-white/[0.06] text-white' : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'}
      `}
    >
      {isActive && (
        <span aria-hidden="true" className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-emerald-400" />
      )}
      <span
        className={`
          flex items-center justify-center shrink-0
          w-9 h-9 rounded-full
          transition-colors duration-200
          ${isActive ? `bg-linear-to-br ${item.color} text-white shadow-md` : 'bg-white/[0.04] text-slate-300'}
        `}
      >
        <Icon className="w-4 h-4" />
      </span>
      {expanded ? (
        <span className="text-sm font-medium">{item.label}</span>
      ) : (
        <span className="sr-only">{item.label}</span>
      )}
    </a>
  )
}

function DesktopRail({ current }: { current: string }) {
  return (
    <aside
      className="hidden md:flex md:flex-col bg-[#0a0a0f]/90 backdrop-blur border-r border-white/5 overflow-hidden shadow-[8px_0_24px_-12px_rgba(0,0,0,0.6)]"
      style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: '4rem', zIndex: 40 }}
      aria-label="Primary navigation"
    >
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
        <ul className="space-y-1 px-2">
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <NavLink item={item} current={current} />
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

function MobileSheet({ current }: { current: string }) {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Open navigation"
        className="
          md:hidden
          fixed top-3 left-3 z-50
          flex items-center justify-center
          w-10 h-10 rounded-lg
          bg-[#0a0a0f]/90 backdrop-blur
          border border-white/10
          text-slate-200 hover:text-white
          shadow-md
        "
      >
        <Menu className="w-5 h-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-64 border-r border-white/5 bg-[#0a0a0f] p-0 text-foreground">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <nav className="flex h-full flex-col py-3" aria-label="Primary navigation">
          <ul className="space-y-1 px-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <span onClick={() => setOpen(false)}>
                  <NavLink item={item} current={current} expanded />
                </span>
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
