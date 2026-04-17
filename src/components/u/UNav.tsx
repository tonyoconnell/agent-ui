/**
 * UNav - Navigation for /u pages
 *
 * Minimal, Apple-like navigation with beautiful circular icons
 */

import { ArrowLeftRight, Coins, Download, FileText, Home, Key, Send, ShoppingBag, Users, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UNavProps {
  active:
    | 'home'
    | 'wallets'
    | 'send'
    | 'receive'
    | 'swap'
    | 'testnet-tokens'
    | 'tokens'
    | 'contracts'
    | 'products'
    | 'transactions'
    | 'people'
    | 'keys'
}

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home, href: '/u', color: 'from-blue-500 to-indigo-500' },
  { id: 'wallets', label: 'Wallets', icon: Wallet, href: '/u/wallets', color: 'from-amber-500 to-orange-500' },
  { id: 'send', label: 'Send', icon: Send, href: '/u/send', color: 'from-green-500 to-emerald-500' },
  { id: 'receive', label: 'Receive', icon: Download, href: '/u/receive', color: 'from-purple-500 to-violet-500' },
  { id: 'tokens', label: 'Tokens', icon: Coins, href: '/u/tokens', color: 'from-yellow-500 to-amber-500' },
  { id: 'testnet-tokens', label: 'Testnet', icon: '💧', href: '/u/testnet-tokens', color: 'from-cyan-500 to-blue-500' },
  { id: 'contracts', label: 'Contracts', icon: FileText, href: '/u/contracts', color: 'from-slate-500 to-gray-600' },
  { id: 'products', label: 'Products', icon: ShoppingBag, href: '/u/products', color: 'from-pink-500 to-rose-500' },
  {
    id: 'transactions',
    label: 'Transactions',
    icon: ArrowLeftRight,
    href: '/u/transactions',
    color: 'from-cyan-500 to-teal-500',
  },
  { id: 'people', label: 'People', icon: Users, href: '/u/people', color: 'from-indigo-500 to-purple-500' },
  { id: 'keys', label: 'Keys', icon: Key, href: '/u/keys', color: 'from-red-500 to-orange-500' },
]

export function UNav({ active }: UNavProps) {
  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-center h-16">
          {/* Nav Items - Centered */}
          <nav className="flex items-center gap-0.5 md:gap-1 overflow-x-auto scrollbar-hide">
            {NAV_ITEMS.map((item) => {
              const isActive = active === item.id
              return (
                <a key={item.id} href={item.href}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    className={`
                      gap-1.5 md:gap-2 px-2 md:px-3 h-9 md:h-10
                      transition-all duration-200
                      ${isActive ? 'bg-secondary/80 shadow-sm' : 'hover:bg-muted/50'}
                    `}
                  >
                    <span
                      className={`
                      flex items-center justify-center
                      w-6 h-6 md:w-7 md:h-7
                      rounded-full
                      text-sm md:text-base
                      transition-all duration-200
                      ${
                        isActive
                          ? `bg-linear-to-br ${item.color} text-black dark:text-white shadow-md`
                          : 'bg-gray-200 text-black dark:bg-zinc-800 dark:text-white group-hover:bg-gray-300 dark:group-hover:bg-zinc-700'
                      }
                    `}
                    >
                      {typeof item.icon === 'string' ? item.icon : <item.icon className="w-4 h-4 shrink-0" />}
                    </span>
                    <span
                      className={`
                      hidden lg:inline 
                      text-xs md:text-sm font-medium
                      ${isActive ? 'text-foreground' : 'text-muted-foreground'}
                    `}
                    >
                      {item.label}
                    </span>
                  </Button>
                </a>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}
