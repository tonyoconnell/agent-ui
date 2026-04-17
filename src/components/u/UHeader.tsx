/**
 * UHeader - Header for /u/* pages
 *
 * Features:
 * - Integrated navigation (from sidebar)
 * - Testnet/Live toggle (top right)
 * - Add Wallets button aligned with assets tab
 * - View transitions between pages
 */

import {
  ArrowLeftRight,
  ChevronDown,
  Coins,
  Download,
  FileText,
  Home,
  Key,
  Plus,
  Send,
  ShoppingBag,
  Users,
  Wallet,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { ModeToggle } from '@/components/ModeToggle'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { emitClick } from '@/lib/ui-signal'

interface NavItem {
  title: string
  icon: React.ReactNode
  url: string
  color?: string
}

const navItems: NavItem[] = [
  { title: 'Home', icon: <Home className="w-4 h-4" />, url: '/u' },
  { title: 'Wallets', icon: <Wallet className="w-4 h-4" />, url: '/u/wallets' },
  { title: 'Send', icon: <Send className="w-4 h-4" />, url: '/u/send' },
  { title: 'Receive', icon: <Download className="w-4 h-4" />, url: '/u/receive' },
  { title: 'Tokens', icon: <Coins className="w-4 h-4" />, url: '/u/tokens' },
  { title: 'Contracts', icon: <FileText className="w-4 h-4" />, url: '/u/contracts' },
  { title: 'Products', icon: <ShoppingBag className="w-4 h-4" />, url: '/u/products' },
  { title: 'Transactions', icon: <ArrowLeftRight className="w-4 h-4" />, url: '/u/transactions' },
  { title: 'People', icon: <Users className="w-4 h-4" />, url: '/u/people' },
  { title: 'Keys', icon: <Key className="w-4 h-4" />, url: '/u/keys' },
]

interface UHeaderProps {
  onAddWallet?: () => void
  currentPath?: string
}

export function UHeader({ onAddWallet, currentPath = '' }: UHeaderProps) {
  const [isTestnet, setIsTestnet] = useState(true)
  const [displayPath, setDisplayPath] = useState(currentPath)

  useEffect(() => {
    setDisplayPath(window.location.pathname)
  }, [])

  const currentNavItem = navItems.find((item) => displayPath.startsWith(item.url))
  const pageTitle = currentNavItem?.title || 'Universal Wallet'

  const handleNetworkToggle = (isTest: boolean) => {
    setIsTestnet(isTest)
    // TODO: Implement network switching logic
    console.log('Network switched to:', isTest ? 'Testnet' : 'Live')
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Page title and breadcrumb */}
        <div className="flex items-center gap-3">
          <h1 className="text-lg sm:text-xl font-semibold truncate">{pageTitle}</h1>
        </div>

        {/* Center: Navigation Tabs (visible on medium+ screens) */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              displayPath.startsWith(item.url) &&
              (item.url === '/u' ? displayPath === '/u' || displayPath === '/u/' : true)

            return (
              <a
                key={item.url}
                href={item.url}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
                  transition-colors duration-200
                  ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }
                `}
              >
                {item.icon}
                <span className="hidden lg:inline">{item.title}</span>
              </a>
            )
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Network Toggle */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-muted/50">
            <button
              onClick={() => {
                emitClick('ui:dashboard:open-card')
                handleNetworkToggle(true)
              }}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                isTestnet ? 'bg-background text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Testnet
            </button>
            <div className="w-px h-4 bg-border" />
            <button
              onClick={() => {
                emitClick('ui:dashboard:open-card')
                handleNetworkToggle(false)
              }}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                !isTestnet
                  ? 'bg-gradient-to-r from-green-500/20 to-green-500/10 text-green-600 border border-green-500/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${!isTestnet ? 'bg-green-500' : 'bg-muted-foreground'}`} />
              Live
            </button>
          </div>

          {/* Add Wallets Button */}
          <Button onClick={onAddWallet} variant="outline" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Wallets</span>
          </Button>

          {/* Mobile Menu (for small screens) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {navItems.map((item) => {
                const isActive = displayPath.startsWith(item.url)

                return (
                  <DropdownMenuItem key={item.url} asChild>
                    <a href={item.url} className={`flex items-center gap-2 ${isActive ? 'bg-muted' : ''}`}>
                      {item.icon}
                      <span>{item.title}</span>
                    </a>
                  </DropdownMenuItem>
                )
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onAddWallet}>
                <Plus className="w-4 h-4 mr-2" />
                Add Wallets
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
