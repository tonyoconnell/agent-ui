# PLAN-U: Merchant Dashboard Migration & Integration

**Status**: Active Development Plan
**Version**: 1.0.0
**Created**: 2025-12-05
**Owner**: @claude-code

---

## 📋 Executive Summary

This plan describes the complete migration of merchant dashboard components from `one-core/frontend/` and `one-core/backend/src/` into the ONE platform's web experience at `web/src/pages/u/` (Unified Merchant Dashboard).

**Key Objectives:**
1. ✅ Create beautiful, fast, clear merchant dashboard (`/u` route)
2. ✅ Migrate all frontend components into `/web/src/components/`
3. ✅ Move HTML pages into `/web/src/pages/u/` structure
4. ✅ Integrate pay.one.ie/merchant dashboard code into ONE platform
5. ✅ Implement 6-dimension ontology mapping (groups, people, things, connections, events, knowledge)
6. ✅ Create index dashboard with cards for: wallets, tokens, contracts, products, transactions

---

## 🗂️ File Inventory & Migration Map

### Phase 1: Source Code Analysis

#### Frontend Components (one-core/frontend/)
```
/Users/toc/Server/ONE/apps/one-core/frontend/
├── Claim.tsx                 → /web/src/components/merchant/Claim.tsx
├── ClaimProvider.tsx         → /web/src/components/merchant/ClaimProvider.tsx
├── ClaimWithDappKit.tsx      → /web/src/components/merchant/ClaimWithDappKit.tsx
├── Pay.tsx                   → /web/src/components/payment/Pay.tsx
├── PayOpen.tsx               → /web/src/components/payment/PayOpen.tsx
├── WalletDashboard.tsx       → /web/src/pages/u/wallets.astro (convert to page)
├── School.tsx                → /web/src/components/forms/School.tsx
├── ZkLogin.tsx               → /web/src/components/auth/ZkLogin.tsx
├── school.html               → /web/src/pages/u/school.astro (convert to page)
├── index.ts                  → /web/src/lib/merchant-exports.ts (utilities)
├── SETUP.md                  → /web/src/pages/u/SETUP.md
├── SETUP-ASTRO.md            → /one/knowledge/guides/merchant-setup-astro.md
└── README.md                 → /one/knowledge/guides/merchant-dashboard.md
```

#### Backend Merchant Code (one-core/backend/src/merchant.ts)
```
/Users/toc/Server/ONE/apps/one-core/backend/src/merchant.ts
├── MerchantConfig interface       → /backend/convex/schema.ts (extend things table)
├── getMerchantConfig()            → /backend/convex/queries/merchant-config.ts
├── getDepositAddresses()          → /backend/convex/queries/merchant-addresses.ts
├── buildSponsoredClaimPtb()       → /backend/convex/mutations/merchant-claim.ts
├── sweepDerivedWallets()          → /backend/convex/mutations/merchant-sweep.ts
└── buildMerchantRegistrationPtb() → /backend/convex/mutations/merchant-register.ts
```

#### Backend Index Routes (one-core/backend/src/index.ts)
```
Lines: ~3200+ with merchant dashboard HTML
├── Merchant dashboard view       → /web/src/pages/u/index.astro (main dashboard)
├── Wallet view                   → /web/src/pages/u/wallets.astro
├── Tokens view                   → /web/src/pages/u/tokens.astro
├── Contracts view                → /web/src/pages/u/contracts.astro
├── Products view                 → /web/src/pages/u/products.astro
└── Transactions view             → /web/src/pages/u/transactions.astro
```

---

## 📋 Detailed File Mapping: Pages & Components

### Pages/u/ Directory File Mapping

#### Main Dashboard Pages

| Source File | Source Location | Target File | Target Path | Purpose |
|-------------|-----------------|-------------|-------------|---------|
| `school.html` | `one-core/frontend/` | `index.astro` | `web/src/pages/u/index.astro` | Main merchant dashboard overview |
| N/A (new) | - | `layout.astro` | `web/src/pages/u/layout.astro` | Merchant dashboard layout wrapper |

#### Wallets Pages

| Source File | Source Location | Target File | Target Path | Purpose |
|-------------|-----------------|-------------|-------------|---------|
| `WalletDashboard.tsx` | `one-core/frontend/` | `wallets.astro` | `web/src/pages/u/wallets.astro` | List all merchant wallets |
| N/A (new) | - | `[walletId].astro` | `web/src/pages/u/wallets/[walletId].astro` | Individual wallet detail page |
| N/A (new) | - | `create.astro` | `web/src/pages/u/wallets/create.astro` | Create/import new wallet |

#### Tokens Pages

| Source File | Source Location | Target File | Target Path | Purpose |
|-------------|-----------------|-------------|-------------|---------|
| N/A (extract from index.ts) | `one-core/backend/src/index.ts` | `tokens.astro` | `web/src/pages/u/tokens.astro` | List all merchant tokens |
| N/A (new) | - | `[tokenId].astro` | `web/src/pages/u/tokens/[tokenId].astro` | Individual token detail page |
| N/A (new) | - | `deploy.astro` | `web/src/pages/u/tokens/deploy.astro` | Deploy new token form |

#### Contracts Pages

| Source File | Source Location | Target File | Target Path | Purpose |
|-------------|-----------------|-------------|-------------|---------|
| N/A (extract from index.ts) | `one-core/backend/src/index.ts` | `contracts.astro` | `web/src/pages/u/contracts.astro` | List all smart contracts |
| N/A (new) | - | `[contractId].astro` | `web/src/pages/u/contracts/[contractId].astro` | Contract detail + ABI explorer |
| N/A (new) | - | `connect.astro` | `web/src/pages/u/contracts/connect.astro` | Connect existing contract |

#### Products Pages

| Source File | Source Location | Target File | Target Path | Purpose |
|-------------|-----------------|-------------|-------------|---------|
| N/A (extract from index.ts) | `one-core/backend/src/index.ts` | `products.astro` | `web/src/pages/u/products.astro` | Product catalog |
| N/A (new) | - | `[productId].astro` | `web/src/pages/u/products/[productId].astro` | Individual product detail |
| N/A (new) | - | `create.astro` | `web/src/pages/u/products/create.astro` | Create new product form |

#### Transactions Pages

| Source File | Source Location | Target File | Target Path | Purpose |
|-------------|-----------------|-------------|-------------|---------|
| N/A (extract from index.ts) | `one-core/backend/src/index.ts` | `transactions.astro` | `web/src/pages/u/transactions.astro` | Transaction history + filtering |
| N/A (new) | - | `[txId].astro` | `web/src/pages/u/transactions/[txId].astro` | Individual transaction detail |

#### Settings Pages

| Source File | Source Location | Target File | Target Path | Purpose |
|-------------|-----------------|-------------|-------------|---------|
| N/A (new) | - | `settings.astro` | `web/src/pages/u/settings.astro` | Merchant account settings |
| N/A (new) | - | `settings/api-keys.astro` | `web/src/pages/u/settings/api-keys.astro` | API key management |
| N/A (new) | - | `settings/webhooks.astro` | `web/src/pages/u/settings/webhooks.astro` | Webhook configuration |

#### API Routes

| Source File | Source Location | Target File | Target Path | Purpose |
|-------------|-----------------|-------------|-------------|---------|
| N/A (new) | - | `config.json.ts` | `web/src/pages/api/merchant/config.json.ts` | Get merchant configuration |
| N/A (new) | - | `wallets.json.ts` | `web/src/pages/api/merchant/wallets.json.ts` | List merchant wallets |
| N/A (new) | - | `tokens.json.ts` | `web/src/pages/api/merchant/tokens.json.ts` | List merchant tokens |
| N/A (new) | - | `contracts.json.ts` | `web/src/pages/api/merchant/contracts.json.ts` | List contracts |
| N/A (new) | - | `products.json.ts` | `web/src/pages/api/merchant/products.json.ts` | List products |
| N/A (new) | - | `transactions.json.ts` | `web/src/pages/api/merchant/transactions.json.ts` | List transactions |

---

### Components Directory File Mapping

#### Merchant Components (Main Dashboard)

| Source File | Source Location | Target File | Target Path | Purpose |
|-------------|-----------------|-------------|-------------|---------|
| `WalletDashboard.tsx` | `one-core/frontend/` | `WalletDashboard.tsx` | `web/src/components/merchant/WalletDashboard.tsx` | Wallet management component |
| N/A (new) | - | `Dashboard.tsx` | `web/src/components/merchant/Dashboard.tsx` | Main dashboard container |
| N/A (new) | - | `DashboardCard.tsx` | `web/src/components/merchant/DashboardCard.tsx` | Reusable dashboard card |
| N/A (new) | - | `IndexCards.tsx` | `web/src/components/merchant/IndexCards.tsx` | 5-card grid for index page |
| N/A (new) | - | `MerchantNav.tsx` | `web/src/components/merchant/MerchantNav.tsx` | Navigation sidebar |
| N/A (new) | - | `ChainSelector.tsx` | `web/src/components/merchant/ChainSelector.tsx` | Chain/network selector |

#### Wallet Components

| Source File | Source Location | Target File | Target Path | Purpose |
|-------------|-----------------|-------------|-------------|---------|
| N/A (new) | - | `WalletCard.tsx` | `web/src/components/merchant/WalletCard.tsx` | Wallet display card |
| N/A (new) | - | `WalletList.tsx` | `web/src/components/merchant/WalletList.tsx` | Wallet list with filtering |
| N/A (new) | - | `WalletDetail.tsx` | `web/src/components/merchant/WalletDetail.tsx` | Wallet detail view |
| N/A (new) | - | `WalletBalance.tsx` | `web/src/components/merchant/WalletBalance.tsx` | Balance display widget |
| N/A (new) | - | `CreateWallet.tsx` | `web/src/components/merchant/CreateWallet.tsx` | Create/import wallet form |

#### Token Components

| Source File | Source Location | Target File | Target Path | Purpose |
|-------------|-----------------|-------------|-------------|---------|
| N/A (new) | - | `TokenCard.tsx` | `web/src/components/merchant/TokenCard.tsx` | Token display card |
| N/A (new) | - | `TokenList.tsx` | `web/src/components/merchant/TokenList.tsx` | Token list with search |
| N/A (new) | - | `TokenDetail.tsx` | `web/src/components/merchant/TokenDetail.tsx` | Token detail with metadata |
| N/A (new) | - | `TokenHolders.tsx` | `web/src/components/merchant/TokenHolders.tsx` | Token holders list |
| N/A (new) | - | `DeployToken.tsx` | `web/src/components/merchant/DeployToken.tsx` | Deploy new token form |

#### Contract Components

| Source File | Source Location | Target File | Target Path | Purpose |
|-------------|-----------------|-------------|-------------|---------|
| N/A (new) | - | `ContractCard.tsx` | `web/src/components/merchant/ContractCard.tsx` | Contract display card |
| N/A (new) | - | `ContractList.tsx` | `web/src/components/merchant/ContractList.tsx` | Contract list |
| N/A (new) | - | `ContractDetail.tsx` | `web/src/components/merchant/ContractDetail.tsx` | Contract detail view |
| N/A (new) | - | `ABIExplorer.tsx` | `web/src/components/merchant/ABIExplorer.tsx` | ABI function explorer |
| N/A (new) | - | `ContractInteraction.tsx` | `web/src/components/merchant/ContractInteraction.tsx` | Call contract functions |
| N/A (new) | - | `ConnectContract.tsx` | `web/src/components/merchant/ConnectContract.tsx` | Connect existing contract |

#### Product Components

| Source File | Source Location | Target File | Target Path | Purpose |
|-------------|-----------------|-------------|-------------|---------|
| N/A (new) | - | `ProductCard.tsx` | `web/src/components/merchant/ProductCard.tsx` | Product display card |
| N/A (new) | - | `ProductList.tsx` | `web/src/components/merchant/ProductList.tsx` | Product catalog view |
| N/A (new) | - | `ProductDetail.tsx` | `web/src/components/merchant/ProductDetail.tsx` | Product detail page |
| N/A (new) | - | `CreateProduct.tsx` | `web/src/components/merchant/CreateProduct.tsx` | Create product form |
| N/A (new) | - | `ProductPricing.tsx` | `web/src/components/merchant/ProductPricing.tsx` | Pricing management |

#### Transaction Components

| Source File | Source Location | Target File | Target Path | Purpose |
|-------------|-----------------|-------------|-------------|---------|
| N/A (new) | - | `TransactionCard.tsx` | `web/src/components/merchant/TransactionCard.tsx` | Transaction display card |
| N/A (new) | - | `TransactionList.tsx` | `web/src/components/merchant/TransactionList.tsx` | Transaction history |
| N/A (new) | - | `TransactionDetail.tsx` | `web/src/components/merchant/TransactionDetail.tsx` | Transaction detail view |
| N/A (new) | - | `TransactionFilter.tsx` | `web/src/components/merchant/TransactionFilter.tsx` | Transaction filters |
| N/A (new) | - | `TransactionExport.tsx` | `web/src/components/merchant/TransactionExport.tsx` | Export transactions (CSV/JSON) |

#### Claim & Payment Components (From one-core/frontend/)

| Source File | Source Location | Target File | Target Path | Purpose |
|-------------|-----------------|-------------|-------------|---------|
| `Claim.tsx` | `one-core/frontend/` | `Claim.tsx` | `web/src/components/merchant/Claim.tsx` | Claim token component |
| `ClaimProvider.tsx` | `one-core/frontend/` | `ClaimProvider.tsx` | `web/src/components/merchant/ClaimProvider.tsx` | Claim context provider |
| `ClaimWithDappKit.tsx` | `one-core/frontend/` | `ClaimWithDappKit.tsx` | `web/src/components/merchant/ClaimWithDappKit.tsx` | DappKit claim integration |

#### Payment Components (From one-core/frontend/)

| Source File | Source Location | Target File | Target Path | Purpose |
|-------------|-----------------|-------------|-------------|---------|
| `Pay.tsx` | `one-core/frontend/` | `Pay.tsx` | `web/src/components/payment/Pay.tsx` | Payment component |
| `PayOpen.tsx` | `one-core/frontend/` | `PayOpen.tsx` | `web/src/components/payment/PayOpen.tsx` | Payment modal/open |

#### Form Components (From one-core/frontend/)

| Source File | Source Location | Target File | Target Path | Purpose |
|-------------|-----------------|-------------|-------------|---------|
| `School.tsx` | `one-core/frontend/` | `School.tsx` | `web/src/components/forms/School.tsx` | School/organization form |

#### Auth Components (From one-core/frontend/)

| Source File | Source Location | Target File | Target Path | Purpose |
|-------------|-----------------|-------------|-------------|---------|
| `ZkLogin.tsx` | `one-core/frontend/` | `ZkLogin.tsx` | `web/src/components/auth/ZkLogin.tsx` | ZK login component |

#### Widget Components

| Source File | Source Location | Target File | Target Path | Purpose |
|-------------|-----------------|-------------|-------------|---------|
| N/A (new) | - | `BalanceWidget.tsx` | `web/src/components/merchant/BalanceWidget.tsx` | Balance summary widget |
| N/A (new) | - | `StatsPanel.tsx` | `web/src/components/merchant/StatsPanel.tsx` | Stats overview panel |
| N/A (new) | - | `RecentActivity.tsx` | `web/src/components/merchant/RecentActivity.tsx` | Recent transactions |
| N/A (new) | - | `QuickActions.tsx` | `web/src/components/merchant/QuickActions.tsx` | Quick action buttons |

---

## 📐 Directory Structure (Target)

```
/Users/toc/Server/ONE/web/
├── src/
│   ├── pages/
│   │   ├── u/                           # Merchant/User Dashboard
│   │   │   ├── index.astro              # Main dashboard (beautiful index view)
│   │   │   ├── wallets.astro            # Wallet management
│   │   │   ├── wallets/
│   │   │   │   └── [walletId].astro     # Individual wallet detail
│   │   │   ├── tokens.astro             # Token inventory
│   │   │   ├── tokens/
│   │   │   │   └── [tokenId].astro      # Individual token detail
│   │   │   ├── contracts.astro          # Smart contract management
│   │   │   ├── contracts/
│   │   │   │   └── [contractId].astro   # Individual contract detail
│   │   │   ├── products.astro           # Product catalog
│   │   │   ├── products/
│   │   │   │   └── [productId].astro    # Individual product detail
│   │   │   ├── transactions.astro       # Transaction history
│   │   │   ├── transactions/
│   │   │   │   └── [txId].astro         # Individual transaction detail
│   │   │   ├── settings.astro           # Merchant settings
│   │   │   ├── SETUP.md                 # Setup documentation
│   │   │   └── CLAUDE.md                # Merchant dashboard guidelines
│   │   │
│   │   └── api/
│   │       └── merchant/
│   │           ├── config.json.ts       # Get merchant config
│   │           ├── wallets.json.ts      # List wallets
│   │           ├── tokens.json.ts       # List tokens
│   │           ├── contracts.json.ts    # List contracts
│   │           ├── products.json.ts     # List products
│   │           └── transactions.json.ts # List transactions
│   │
│   ├── components/
│   │   ├── merchant/
│   │   │   ├── Claim.tsx                # Claim token component
│   │   │   ├── ClaimProvider.tsx        # Claim context provider
│   │   │   ├── ClaimWithDappKit.tsx     # DappKit integration
│   │   │   ├── Dashboard.tsx            # Main dashboard container
│   │   │   ├── DashboardCard.tsx        # Reusable card component
│   │   │   ├── WalletCard.tsx           # Wallet display card
│   │   │   ├── TokenCard.tsx            # Token display card
│   │   │   ├── ContractCard.tsx         # Contract display card
│   │   │   ├── ProductCard.tsx          # Product display card
│   │   │   ├── TransactionCard.tsx      # Transaction display card
│   │   │   ├── BalanceWidget.tsx        # Balance summary
│   │   │   ├── StatsPanel.tsx           # Stats overview
│   │   │   ├── ChainSelector.tsx        # Chain switcher
│   │   │   └── MerchantNav.tsx          # Navigation bar
│   │   │
│   │   ├── payment/
│   │   │   ├── Pay.tsx                  # Payment component
│   │   │   └── PayOpen.tsx              # Payment open/modal
│   │   │
│   │   ├── forms/
│   │   │   └── School.tsx               # School/organization form
│   │   │
│   │   ├── auth/
│   │   │   └── ZkLogin.tsx              # ZK login component
│   │   │
│   │   └── dashboard/
│   │       ├── IndexCards.tsx           # Dashboard card grid
│   │       ├── WalletWidget.tsx         # Wallet summary widget
│   │       ├── TokenWidget.tsx          # Token summary widget
│   │       ├── ContractWidget.tsx       # Contract summary widget
│   │       ├── ProductWidget.tsx        # Product summary widget
│   │       └── TransactionWidget.tsx    # Transaction summary widget
│   │
│   └── lib/
│       ├── merchant-api.ts              # API client functions
│       ├── merchant-utils.ts            # Utility functions
│       ├── merchant-exports.ts          # Exported utilities from one-core
│       └── merchant-types.ts            # TypeScript types
│
└── public/
    └── merchant/
        ├── icons/                       # Merchant dashboard icons
        ├── illustrations/               # SVG illustrations
        └── favicons/                    # Brand favicons
```

---

## 🔄 Six-Dimension Ontology Mapping

### Groups (Multi-tenant Organization)
- **groupId**: Merchant organization (payment processor, marketplace)
- **Instance**: Each merchant has their own group
- **Relations**: Merchant owns wallets, tokens, contracts, products within group

### People (Authorization & Roles)
- **Creator**: Merchant owner (platform_owner within group)
- **Roles**:
  - `merchant_owner` - Full access
  - `merchant_admin` - Manage team, view analytics
  - `merchant_user` - View-only access
  - `customer` - End user making payments

### Things (All Entities)
```
type: 'merchant'          - Merchant account record
type: 'wallet'            - Merchant wallet (EVM, Sui, SOL, BTC)
type: 'token'             - Fungible or NFT token
type: 'contract'          - Smart contract (Sui Move, EVM Solidity)
type: 'product'           - Product for sale (digital or physical)
type: 'transaction'       - Payment transaction history
type: 'customer_record'   - End user payment record
type: 'payment_link'      - Generated payment link
```

### Connections (Relationships)
```
owns               - Merchant owns wallets/tokens/products
holds_wallet       - Merchant holds custody of wallet
deployed_contract  - Merchant deployed this contract
has_product        - Merchant has product for sale
processed_payment  - Merchant processed transaction
paid_in_token      - Customer paid using token
received_in_wallet - Funds received in wallet
```

### Events (Audit Trail)
```
merchant_registered       - New merchant account created
wallet_created           - New wallet generated
wallet_connected         - External wallet connected
token_deployed           - New token deployed
contract_deployed        - Smart contract deployed
product_created          - Product added to catalog
transaction_processed    - Payment claimed on-chain
transaction_failed       - Payment verification failed
payment_link_generated   - Payment link created
```

### Knowledge (Labels, Tags, Vectors)
```
search: ['merchant', 'dashboard', 'wallet', 'token', 'payment']
category: 'merchant-tools'
tags: ['one-core', 'multi-chain', 'payment-processor']
vector: [embeddings for RAG search]
```

---

## 🎯 Implementation Phases

### Phase 1: Component Migration (Cycles 1-5)
**Goal**: Move all UI components into `/web/src/components/` with proper structure

**Tasks**:
1. Copy frontend components from one-core/frontend/ to web/src/components/
2. Update imports and dependencies
3. Create merchant component directory structure
4. Register components in web/src/components/index.ts
5. Test each component in isolation

**Deliverables**:
- All React/TSX components migrated
- Component dependencies resolved
- Storybook entries (optional)

---

### Phase 2: Page Architecture (Cycles 6-10)
**Goal**: Convert pages from HTML/React to Astro with component composition

**Tasks**:
1. Create `/web/src/pages/u/` directory
2. Create index.astro (beautiful dashboard)
3. Create wallets.astro, tokens.astro, contracts.astro, products.astro, transactions.astro
4. Create dynamic routes for detail pages ([walletId], [tokenId], etc.)
5. Implement layout inheritance

**Deliverables**:
- 6 main pages + 5 detail page templates
- Navigation structure
- Layout components

---

### Phase 3: Backend Integration (Cycles 11-15)
**Goal**: Implement Convex queries/mutations for merchant operations

**Tasks**:
1. Extend schema.ts with merchant-specific tables
2. Create queries: merchant-config.ts, merchant-addresses.ts, etc.
3. Create mutations: merchant-register.ts, merchant-sweep.ts, etc.
4. Implement transaction history queries
5. Add webhook support for payment notifications

**Deliverables**:
- Merchant Convex queries/mutations
- Real-time subscription support
- Transaction history tracking

---

### Phase 4: API Endpoints (Cycles 16-20)
**Goal**: Create serverless API endpoints for dashboard

**Tasks**:
1. Create /api/merchant/config endpoint
2. Create /api/merchant/wallets endpoint
3. Create /api/merchant/tokens endpoint
4. Create /api/merchant/contracts endpoint
5. Create /api/merchant/products endpoint
6. Create /api/merchant/transactions endpoint

**Deliverables**:
- 6 API endpoints
- Authentication/authorization
- Rate limiting

---

### Phase 5: Dashboard Integration (Cycles 21-25)
**Goal**: Wire up beautiful, fast dashboard UI with real data

**Tasks**:
1. Build DashboardCard component system
2. Create index page with card grid layout
3. Implement wallet card with balance
4. Implement token card with supply/holders
5. Implement contract card with ABI explorer
6. Implement product card with pricing
7. Implement transaction card with status
8. Add filters, search, pagination

**Deliverables**:
- Fully functional merchant dashboard
- Real-time data updates
- Beautiful UI matching ONE brand

---

### Phase 6: Pay.one.ie Integration (Cycles 26-30)
**Goal**: Integrate existing pay.one.ie/merchant code into ONE platform

**Tasks**:
1. Extract merchant HTML from backend/src/index.ts
2. Convert HTML to Astro components
3. Port all styles to Tailwind v4
4. Integrate authentication flow
5. Link payment processing to backend
6. Test complete flow

**Deliverables**:
- Pay.one.ie merchant dashboard fully integrated
- Authentication working
- Payments processing end-to-end

---

## 🔑 Key Features

### Index Dashboard (Beautiful Overview)
- **Card Grid Layout**: 5 main cards (Wallets, Tokens, Contracts, Products, Transactions)
- **Quick Stats**: Total balance, transaction volume, active wallets
- **Recent Activity**: Last 5 transactions with timestamps
- **Action Buttons**: Quick access to common operations
- **Responsive**: Mobile-first, beautiful on all devices

### Wallets Page
- List of all merchant wallets by chain
- Balance display with USD conversion
- Import/generate new wallet
- Sweep functionality for derived wallets
- QR code for sharing address
- Transaction history per wallet

### Tokens Page
- List of deployed tokens (ERC-20, SPL, Move, etc.)
- Token metadata (name, symbol, supply, decimals)
- Holders list
- Burn/mint operations
- Token contract verification

### Contracts Page
- Smart contracts deployed or connected
- Network and address display
- ABI explorer and interaction
- Function call interface
- Contract verification status

### Products Page
- Product catalog
- Payment links for each product
- Pricing management
- Inventory tracking
- Sales analytics

### Transactions Page
- Complete payment history
- Filter by status (pending, confirmed, failed)
- Filter by chain
- Search by tx hash
- Export CSV/JSON

---

## 📦 File Copy Matrix

| Source | Destination | Type | Action |
|--------|-------------|------|--------|
| `one-core/frontend/Claim.tsx` | `web/src/components/merchant/Claim.tsx` | Component | Copy + Update imports |
| `one-core/frontend/ClaimProvider.tsx` | `web/src/components/merchant/ClaimProvider.tsx` | Provider | Copy + Update imports |
| `one-core/frontend/ClaimWithDappKit.tsx` | `web/src/components/merchant/ClaimWithDappKit.tsx` | Component | Copy + Update imports |
| `one-core/frontend/Pay.tsx` | `web/src/components/payment/Pay.tsx` | Component | Copy + Update imports |
| `one-core/frontend/PayOpen.tsx` | `web/src/components/payment/PayOpen.tsx` | Component | Copy + Update imports |
| `one-core/frontend/WalletDashboard.tsx` | `web/src/components/merchant/WalletDashboard.tsx` | Component | Copy + Extract logic |
| `one-core/frontend/School.tsx` | `web/src/components/forms/School.tsx` | Component | Copy + Update imports |
| `one-core/frontend/ZkLogin.tsx` | `web/src/components/auth/ZkLogin.tsx` | Component | Copy + Update imports |
| `one-core/frontend/school.html` | `web/src/pages/u/school.astro` | Page | Convert HTML → Astro |
| `one-core/frontend/index.ts` | `web/src/lib/merchant-exports.ts` | Module | Adapt exports |
| `one-core/backend/src/merchant.ts` | `backend/convex/mutations/merchant.ts` | Service | Adapt to Convex |
| `one-core/backend/src/index.ts` (merchant HTML) | `web/src/pages/u/index.astro` | Page | Extract + Convert |

---

## 🛠️ Technical Requirements

### Dependencies
```json
{
  "astro": "^5.0",
  "react": "^19.0",
  "tailwindcss": "^4.0",
  "@shadcn/ui": "latest",
  "ethers": "^6.x",
  "@mysten/sui.js": "^0.50+",
  "@solana/web3.js": "^1.x",
  "zustand": "^4.x"
}
```

### Environment Variables
```bash
# Merchant Dashboard
VITE_MERCHANT_API_URL=https://one.ie/api/merchant
VITE_CONVEX_URL=https://YOUR.convex.cloud

# Blockchain RPC
VITE_RPC_SUI=https://fullnode.testnet.sui.io
VITE_RPC_EVM=https://sepolia.base.org
VITE_RPC_SOL=https://api.devnet.solana.com
```

---

## 🔒 Security Considerations

1. **API Key Management**: Merchant API keys in Convex secure storage
2. **Private Key Protection**: Never expose merchant private keys to client
3. **Rate Limiting**: Implement per-merchant rate limits
4. **CORS**: Restrict dashboard to one.ie domain
5. **Audit Logging**: Log all merchant actions via event system
6. **Signature Verification**: Verify all state-changing operations with signatures

---

## 📊 Success Metrics

- ✅ All 100+ components migrated
- ✅ Dashboard loads in <500ms (Core Web Vitals)
- ✅ 100% TypeScript coverage
- ✅ Zero broken imports
- ✅ Full 6-dimension ontology mapping
- ✅ 95%+ test coverage for critical paths
- ✅ Mobile responsive (Lighthouse 95+)

---

## 🚀 Deployment Strategy

### Phase 1: Staging
1. Deploy to staging environment
2. Run integration tests
3. Performance profiling
4. Security audit

### Phase 2: Beta
1. Limited rollout to 10% of merchants
2. Monitor error rates and performance
3. Gather feedback
4. Iterate based on feedback

### Phase 3: Production
1. Full rollout to all merchants
2. Monitor all metrics
3. Support escalation process
4. Continuous optimization

---

## 📖 Documentation

All documentation should be created in `/one/knowledge/guides/` following the cascading context system:

```
/one/
├── knowledge/
│   ├── guides/
│   │   ├── merchant-dashboard.md          # Overview and getting started
│   │   ├── merchant-components.md         # Component documentation
│   │   ├── merchant-api.md                # API reference
│   │   ├── merchant-setup-astro.md        # Setup guide
│   │   ├── merchant-deployment.md         # Deployment guide
│   │   ├── merchant-security.md           # Security best practices
│   │   └── merchant-ontology.md           # 6-dimension mapping
│   │
│   └── patterns/
│       ├── merchant/
│       │   ├── wallet-management.md
│       │   ├── payment-processing.md
│       │   ├── transaction-history.md
│       │   └── analytics.md
```

---

## ⚙️ Configuration Files

### web/src/pages/u/CLAUDE.md
```markdown
# Merchant Dashboard Guidelines

## Navigation Structure
- /u - Main dashboard
- /u/wallets - Wallet management
- /u/tokens - Token inventory
- /u/contracts - Smart contract management
- /u/products - Product catalog
- /u/transactions - Transaction history
- /u/settings - Merchant settings

## Component Reuse
Always use components from web/src/components/merchant/
Never duplicate component logic

## State Management
Use Convex for data, Zustand for UI state

## Performance
- Target: <500ms dashboard load
- Lazy load detail pages
- Paginate lists (20 items per page)
```

---

## 🎓 Related Documentation

- **[ONE Architecture](/one/knowledge/architecture.md)** - Full system design
- **[6-Dimension Ontology](/one/knowledge/ontology.md)** - Data model specification
- **[Development Workflow](/one/connections/workflow.md)** - 6-phase implementation process
- **[Frontend Patterns](/one/knowledge/patterns/frontend/)** - React + Astro patterns
- **[Backend Patterns](/one/knowledge/patterns/backend/)** - Convex patterns

---

## 🔗 Related Projects

- **one-core**: Source project with original implementation
- **ONE Platform (main)**: Target platform where this integrates
- **pay.one.ie**: Current production deployment
- **web**: Frontend deployment (Cloudflare Pages)
- **backend**: Backend deployment (Convex Cloud)

---

## 📊 Summary Statistics

### Total Files to Create/Migrate

**From one-core/frontend/**: 8 files
- Claim.tsx
- ClaimProvider.tsx
- ClaimWithDappKit.tsx
- Pay.tsx
- PayOpen.tsx
- WalletDashboard.tsx
- School.tsx
- ZkLogin.tsx

**Pages**: 23 files
- 1 layout (layout.astro)
- 6 main pages (index, wallets, tokens, contracts, products, transactions)
- 3 settings pages (settings, api-keys, webhooks)
- 8 detail/sub-pages ([walletId], [tokenId], [contractId], [productId], [txId], create, deploy, connect)
- 6 API endpoints (.json.ts routes)

**Components**: 59 new component files
- 6 merchant main components (Dashboard, DashboardCard, IndexCards, MerchantNav, ChainSelector, WalletDashboard)
- 5 wallet components (Card, List, Detail, Balance, Create)
- 5 token components (Card, List, Detail, Holders, Deploy)
- 6 contract components (Card, List, Detail, ABIExplorer, Interaction, Connect)
- 5 product components (Card, List, Detail, Create, Pricing)
- 5 transaction components (Card, List, Detail, Filter, Export)
- 3 claim components (Claim, ClaimProvider, ClaimWithDappKit) - migrated
- 2 payment components (Pay, PayOpen) - migrated
- 1 form component (School) - migrated
- 1 auth component (ZkLogin) - migrated
- 4 widget components (BalanceWidget, StatsPanel, RecentActivity, QuickActions)

**Documentation**: 3 files
- /web/src/pages/u/SETUP.md (setup guide)
- /one/knowledge/guides/merchant-dashboard.md (overview)
- /one/knowledge/guides/merchant-setup-astro.md (Astro setup)

**Total New Files**: 90+ files (59 components + 23 pages + 8 migrated + docs)

---

## 🎯 Component Organization Summary

### /web/src/components/merchant/
**Core Dashboard Components** (6)
- Dashboard.tsx - Main container
- DashboardCard.tsx - Reusable card
- IndexCards.tsx - 5-card grid
- MerchantNav.tsx - Navigation
- ChainSelector.tsx - Network selector
- WalletDashboard.tsx - Wallet management

**Wallet Components** (5)
- WalletCard.tsx
- WalletList.tsx
- WalletDetail.tsx
- WalletBalance.tsx
- CreateWallet.tsx

**Token Components** (5)
- TokenCard.tsx
- TokenList.tsx
- TokenDetail.tsx
- TokenHolders.tsx
- DeployToken.tsx

**Contract Components** (6)
- ContractCard.tsx
- ContractList.tsx
- ContractDetail.tsx
- ABIExplorer.tsx
- ContractInteraction.tsx
- ConnectContract.tsx

**Product Components** (5)
- ProductCard.tsx
- ProductList.tsx
- ProductDetail.tsx
- CreateProduct.tsx
- ProductPricing.tsx

**Transaction Components** (5)
- TransactionCard.tsx
- TransactionList.tsx
- TransactionDetail.tsx
- TransactionFilter.tsx
- TransactionExport.tsx

**Widget Components** (4)
- BalanceWidget.tsx
- StatsPanel.tsx
- RecentActivity.tsx
- QuickActions.tsx

**Claim Components** (3) - From one-core
- Claim.tsx
- ClaimProvider.tsx
- ClaimWithDappKit.tsx

### /web/src/components/payment/
- Pay.tsx (migrated)
- PayOpen.tsx (migrated)

### /web/src/components/forms/
- School.tsx (migrated)

### /web/src/components/auth/
- ZkLogin.tsx (migrated)

---

## 🗂️ Pages Organization Summary

### /web/src/pages/u/
**Root Pages** (1)
- index.astro - Main dashboard with 5-card overview
- layout.astro - Shared layout

**Wallets** (3)
- wallets.astro - List all wallets
- wallets/[walletId].astro - Individual wallet detail
- wallets/create.astro - Create/import wallet

**Tokens** (3)
- tokens.astro - List all tokens
- tokens/[tokenId].astro - Token detail with metadata
- tokens/deploy.astro - Deploy new token form

**Contracts** (3)
- contracts.astro - List all contracts
- contracts/[contractId].astro - Contract detail + ABI
- contracts/connect.astro - Connect existing contract

**Products** (3)
- products.astro - Product catalog
- products/[productId].astro - Individual product
- products/create.astro - Create new product

**Transactions** (2)
- transactions.astro - Transaction history with filters
- transactions/[txId].astro - Transaction detail

**Settings** (3)
- settings.astro - Main settings
- settings/api-keys.astro - API key management
- settings/webhooks.astro - Webhook configuration

### /web/src/pages/api/merchant/
- config.json.ts
- wallets.json.ts
- tokens.json.ts
- contracts.json.ts
- products.json.ts
- transactions.json.ts

---

## 🚀 Next Steps After Plan

1. **Copy 8 files** from one-core/frontend/ to web/src/components/
2. **Create 59 new components** (stub implementations with types)
3. **Create 23 pages** in /web/src/pages/u/
4. **Create 6 API endpoints** in /web/src/pages/api/merchant/
5. **Extract pay.one.ie merchant HTML** from backend/src/index.ts
6. **Create Convex backend** for merchant operations
7. **Wire up data flows** between components and API
8. **Build merchant settings** and configuration UI

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2025-12-05 | Added detailed file mapping tables and component organization |
| 1.0.0 | 2025-12-05 | Initial plan created |

---

## 👥 Contributors

- @claude-code - Plan creation and guidance

---

## 📞 Questions?

Refer to `/one/knowledge/` for detailed guides on each component, or review the subdirectory CLAUDE.md files for layer-specific guidance.
