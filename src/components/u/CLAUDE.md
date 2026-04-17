# /u/ Universal Wallet Components - CLAUDE.md

## Overview

This directory contains the **Universal Wallet** components - a mobile-first, Apple-style crypto wallet experience for managing wallets across multiple blockchains.

## Mobile-First Architecture

**Design Philosophy:** What does a user see "above the fold" on each device?

### Device Breakpoints (Apple-style)

```typescript
const BREAKPOINTS = {
  mobile: 428,   // iPhone 15 Pro Max width
  tablet: 1024,  // iPad Pro 11" portrait
} as const;
```

### Above-the-Fold Content by Device

**Mobile (320-428px):**
- Total balance (large, centered)
- Primary wallet card with Send/Receive/Swap
- Bottom navigation bar
- No horizontal scroll

**Tablet (768-1024px):**
- Balance summary + 2x2 wallet grid
- Quick actions sidebar
- Floating action button

**Desktop (1024px+):**
- Full dashboard with all features visible
- 3-column wallet grid
- Side-by-side panels

## Directory Structure

```
/u/
├── CLAUDE.md                    # This file
├── UDashboard.tsx              # Main dashboard (legacy, being replaced)
├── WalletCard.tsx              # Original wallet card component
├── EnhancedWalletCard.tsx      # Enhanced desktop wallet card
│
├── hooks/
│   └── useResponsive.ts        # Device detection & responsive utilities
│
├── mobile/
│   └── index.ts                # Export all mobile components
│
├── MobileOnboarding.tsx        # Mobile-first onboarding screen
├── MobileWalletCard.tsx        # Mobile-optimized wallet card
├── MobileBottomNav.tsx         # iOS-style bottom tab bar
├── BottomSheet.tsx             # Responsive modal (sheet on mobile)
│
├── sheets/
│   ├── SendSheet.tsx           # Send crypto bottom sheet
│   ├── ReceiveSheet.tsx        # Receive crypto (QR code) sheet
│   └── SwapSheet.tsx           # Swap tokens sheet
│
├── lib/
│   ├── WalletProtocol.ts       # one-protocol SDK integration
│   ├── SecureKeyStorage.ts     # Encrypted localStorage
│   └── PayService.ts           # pay.one.ie integration
│
├── pages/                      # Page-level components
│   ├── WalletsPage.tsx
│   ├── WalletDetailPage.tsx
│   ├── TransactionsPage.tsx
│   └── ...
│
└── SecureStorageDialogs.tsx    # Security/backup dialogs
```

## Key Components

### 1. useResponsive Hook

```typescript
import { useResponsive } from "./hooks/useResponsive";

function MyComponent() {
  const { isMobile, isTablet, isDesktop, width, height } = useResponsive();

  return (
    <div className={isMobile ? "p-4" : "p-6"}>
      {isMobile ? <MobileView /> : <DesktopView />}
    </div>
  );
}
```

### 2. BottomSheet (Responsive Modal)

**Automatically adapts:**
- Mobile: Full-screen bottom sheet with drag-to-dismiss
- Tablet: Centered sheet (70% width)
- Desktop: Centered dialog (fixed width)

```typescript
import { BottomSheet, BottomSheetContent, BottomSheetFooter } from "./BottomSheet";

<BottomSheet
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Send ETH"
  description="Transfer to any address"
  headerGradient="from-blue-500 to-indigo-600"
  headerIcon={<SendIcon />}
>
  <BottomSheetContent>
    {/* Form content */}
  </BottomSheetContent>
  <BottomSheetFooter>
    <Button>Send Now</Button>
  </BottomSheetFooter>
</BottomSheet>
```

### 3. MobileWalletCard

Optimized for touch with 44pt minimum targets:

```typescript
import { MobileWalletCard } from "./MobileWalletCard";

<MobileWalletCard
  wallet={wallet}
  chain={chain}
  onSend={() => setShowSend(true)}
  onReceive={() => setShowReceive(true)}
  onSwap={() => setShowSwap(true)}
  onCopyAddress={handleCopy}
/>
```

### 4. MobileBottomNav

iOS-style bottom navigation:

```typescript
import { MobileBottomNav, WALLET_NAV_ITEMS } from "./MobileBottomNav";

<MobileBottomNav
  items={WALLET_NAV_ITEMS}
  activeId="home"
  onNavigate={(id, href) => navigate(href)}
/>
```

### 5. Send/Receive/Swap Sheets

Step-by-step flows optimized for mobile:

```typescript
import { SendSheet, ReceiveSheet, SwapSheet } from "./mobile";

<SendSheet
  open={showSend}
  onOpenChange={setShowSend}
  wallet={activeWallet}
  chain={activeChain}
  onSend={handleSend}
/>
```

## Design Patterns

### Touch Targets

All interactive elements have minimum 44x44pt touch targets (Apple HIG):

```typescript
// Good: Large touch target
<button className="min-h-[44px] min-w-[44px] p-3">

// Bad: Too small
<button className="p-1">
```

### Responsive Grid

```typescript
// Mobile: 2 columns, Tablet: 3 columns, Desktop: 3-4 columns
className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
```

### Responsive Typography

```typescript
// Mobile: 2xl, Tablet: 3xl, Desktop: 4xl
className="text-2xl sm:text-3xl md:text-4xl font-bold"
```

### Responsive Padding

```typescript
// Less padding on mobile for more content
className="px-4 sm:px-6 py-4 sm:py-6"
```

## Migration Guide

### From UDashboard to Mobile-First

**1. Replace Dialog with BottomSheet:**

```typescript
// Before (UDashboard)
<Dialog open={showSend} onOpenChange={setShowSend}>
  <DialogContent className="sm:max-w-[420px]">
    ...
  </DialogContent>
</Dialog>

// After (Mobile-First)
<SendSheet
  open={showSend}
  onOpenChange={setShowSend}
  wallet={wallet}
  chain={chain}
  onSend={handleSend}
/>
```

**2. Replace WalletCard with MobileWalletCard:**

```typescript
// Before
<EnhancedWalletCard wallet={wallet} chain={chain} />

// After (with responsive logic)
const { isMobile } = useResponsive();

{isMobile ? (
  <MobileWalletCard
    wallet={wallet}
    chain={chain}
    onSend={...}
    onReceive={...}
    onSwap={...}
  />
) : (
  <EnhancedWalletCard wallet={wallet} chain={chain} />
)}
```

**3. Add Bottom Navigation on Mobile:**

```typescript
const { isMobile } = useResponsive();

return (
  <>
    <MainContent />
    {isMobile && (
      <MobileBottomNav
        items={WALLET_NAV_ITEMS}
        activeId={currentPage}
      />
    )}
  </>
);
```

## Chain Support

6 supported blockchains with unique gradients:

```typescript
const SUPPORTED_CHAINS = [
  { id: "ETH", name: "Ethereum", color: "from-blue-500 to-indigo-600", icon: "⟠" },
  { id: "BTC", name: "Bitcoin", color: "from-orange-400 to-orange-600", icon: "₿" },
  { id: "SOL", name: "Solana", color: "from-purple-500 to-pink-500", icon: "◎" },
  { id: "SUI", name: "Sui", color: "from-cyan-400 to-blue-500", icon: "💧" },
  { id: "USDC", name: "USDC", color: "from-blue-400 to-blue-600", icon: "💵" },
  { id: "ONE", name: "ONEIE", color: "from-emerald-400 to-teal-600", icon: "①" },
];
```

## Performance Guidelines

1. **Use `client:only="react"`** for wallet components (heavy crypto libraries)
2. **Lazy load sheets** - Only render when `open={true}`
3. **Memoize chain lookups** to avoid repeated finds
4. **Use Framer Motion** for hardware-accelerated animations
5. **Minimize re-renders** with proper state management

## Testing

```bash
# Mobile viewport testing
bunx astro dev
# Then use browser DevTools to test:
# - iPhone SE (320px)
# - iPhone 14 (390px)
# - iPhone 15 Pro Max (428px)
# - iPad (768px)
# - iPad Pro (1024px)
```

## Dependencies

- `framer-motion` - Animations and drag gestures
- `@radix-ui/*` - Accessible UI primitives (via shadcn)
- `one-protocol` - Wallet generation SDK

## Related Files

- `/web/src/pages/u/index.astro` - Dashboard page
- `/web/src/layouts/ULayout.astro` - Wallet layout with SidebarU
- `/web/src/components/SidebarU.tsx` - Sidebar navigation

---

**Built for mobile-first, touch-optimized, Apple-quality wallet experience.**
