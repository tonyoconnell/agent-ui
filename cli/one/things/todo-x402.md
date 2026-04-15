---
title: Todo X402
dimension: things
primary_dimension: things
category: todo-x402.md
tags: agent, ai, architecture, connections, groups, cycle, ontology, people, protocol, things
related_dimensions: connections, events, groups, knowledge, people
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the todo-x402.md category.
  Location: one/things/todo-x402.md
  Purpose: Documents one platform: x402 integration roadmap v1.0.0
  Related dimensions: connections, events, groups, knowledge, people
  For AI agents: Read this to understand todo x402.
---

# ONE Platform: X402 Integration Roadmap v1.0.0

**Focus:** Integrate X402 HTTP-native payments into the web platform
**Protocol:** https://www.x402.org/ (HTTP 402 Payment Required)
**Timeline:** 100 cycles (cycle-based planning, not time-based)
**Target:** AI agent micropayments, API monetization, provider discovery via Bazar

---

## PHASE 1: FOUNDATION & SETUP (Cycle 1-10)

**Purpose:** Validate architecture, map to 6-dimension ontology, plan implementation

### Cycle 1: Validate X402 Protocol Alignment with Ontology

- [ ] Read `/one/connections/x402.md` (protocol spec)
- [ ] Map X402 payment flow to 6-dimension ontology:
  - [ ] **Groups:** Merchant group owns API service, customer group initiates payment
  - [ ] **People:** Platform owner authorizes payment schemes, merchant/customer actors
  - [ ] **Things:** payment (transaction), external_agent (service provider), product (API listing)
  - [ ] **Connections:** transacted (payment relationship), communicated (X402 protocol handshake)
  - [ ] **Events:** payment_event (402 response, payment verified, settled)
  - [ ] **Knowledge:** payment_method label, x402_scheme, blockchain_network labels
- [ ] Identify 3 core use cases:
  - [ ] Agent-to-agent API calls (internal agents)
  - [ ] External provider access (ElizaOS agents via A2A)
  - [ ] Bazar marketplace discovery + payment

### Cycle 2: Review Existing Payment Infrastructure

- [ ] Examine `backend/convex/schema.ts` for payment thing type
- [ ] Check `web/src/components/` for any existing payment UI
- [ ] Review `backend/convex/mutations/` for payment flows
- [ ] Document current payment handling:
  - [ ] Stripe integration (if any)
  - [ ] Token purchase flows
  - [ ] Invoice/subscription patterns
- [ ] Note: **Goal is X402 as PRIMARY payment, not replacement**

### Cycle 3: Map X402 to Web Application Layers

- [ ] **Frontend (Astro):**
  - [ ] X402 payment prompt components (402 handling)
  - [ ] Wallet connection UI (viem, wagmi)
  - [ ] Payment status display
- [ ] **API Routes (Astro):**
  - [ ] GET routes that can respond 402
  - [ ] Handle X-PAYMENT header verification
  - [ ] Return protected resources on valid payment
- [ ] **Backend (Convex):**
  - [ ] X402PaymentService (Effect.ts)
  - [ ] Blockchain provider integrations
  - [ ] Payment verification + settlement
- [ ] **Database (Convex):**
  - [ ] payment thing type schema
  - [ ] payment_event event types
  - [ ] transacted connection metadata

### Cycle 4: Define X402 Integration Scope

- [ ] **Phase 1 (Cycle 1-100):** Core X402 infrastructure
  - [ ] HTTP 402 protocol implementation
  - [ ] Base network support (preferred for low fees)
  - [ ] Permit + Transfer payment schemes
  - [ ] Payment verification via facilitator
- [ ] **Future phases (separate todos):**
  - [ ] Bazar marketplace discovery layer
  - [ ] Multi-chain support (Ethereum, Solana)
  - [ ] Advanced payment schemes (invoice, signature)
  - [ ] Revenue distribution to merchants
- [ ] Document assumptions:
  - [ ] Base USDC as primary token
  - [ ] Coinbase facilitator for verification
  - [ ] Pay-per-request model (not subscriptions initially)

### Cycle 5: Set Up Development Environment

- [ ] Ensure `.env.local` in `/web` contains:
  - [ ] `PUBLIC_CONVEX_URL` (Convex endpoint)
  - [ ] `BETTER_AUTH_SECRET` (auth)
  - [ ] Add (new): `VITE_X402_FACILITATOR_URL` (e.g., Coinbase CDP)
  - [ ] Add (new): `VITE_BLOCKCHAIN_RPC_BASE` (Base network RPC)
- [ ] Ensure `backend/.env.local` contains:
  - [ ] `CONVEX_DEPLOYMENT` (Convex)
  - [ ] Add (new): `X402_PAYMENT_ADDRESS_BASE` (treasury address)
  - [ ] Add (new): `X402_PAYMENT_ADDRESS_ETHEREUM` (treasury address)
  - [ ] Add (new): `X402_PAYMENT_ADDRESS_SOLANA` (future)
  - [ ] Add (new): `FACILITATOR_URL` (Coinbase CDP)
  - [ ] Add (new): `FACILITATOR_API_KEY` (if needed)
- [ ] Add to `package.json` dependencies:
  - [ ] `viem` (blockchain client)
  - [ ] `wagmi` (React hooks)
  - [ ] `@coinbase/cdp-sdk` (facilitator)
  - [ ] `effect` (Effect.ts already included)

### Cycle 6: Review Convex Schema for Payment Thing Type

- [ ] Open `backend/convex/schema.ts`
- [ ] Verify payment thing type exists:
  ```typescript
  {
    type: "payment",
    properties: {
      protocol: "x402",  // NEW: add protocol field
      amount: number,
      currency: "USDC",
      paymentMethod: "crypto",
      scheme: "permit" | "transfer",
      network: "base" | "ethereum" | "solana",
      status: "pending" | "verified" | "settled" | "failed",
      txHash: string,
      paymentId: string,
      payTo: string,
      facilitatorResponse: any,  // NEW: store facilitator verification
    }
  }
  ```
- [ ] If missing, add payment thing type to schema
- [ ] Verify indexes on payment things:
  - [ ] by_type(type = "payment")
  - [ ] by_status(status)
  - [ ] by_protocol(protocol)

### Cycle 7: Create X402 Protocol Type Definitions File

- [ ] Create `backend/convex/protocols/x402.ts` with:
  - [ ] PaymentRequired interface (402 response)
  - [ ] PaymentRequirement interface (per-scheme/network)
  - [ ] PaymentPayload interface (X-PAYMENT header)
  - [ ] PermitPayload, TransferPayload interfaces
  - [ ] FacilitatorEndpoints, VerifyPaymentRequest/Response
  - [ ] SupportedSchemesResponse interface
  - [ ] Convex validators for all above
  - [ ] X402_VERSION = 1 constant
- [ ] Document TypeScript patterns for each interface
- [ ] Note: Copy from `/one/connections/x402.md` "TypeScript Protocol Interfaces" section

### Cycle 8: Understand X402 Protocol Flow in Web Context

- [ ] Study the 4-step HTTP 402 flow:
  1. Client requests protected resource
  2. Server responds 402 with PaymentRequired
  3. Client sends payment in X-PAYMENT header + retries
  4. Server verifies, returns resource + X-PAYMENT-ID header
- [ ] Map to Astro patterns:
  - [ ] `GET /api/agent/execute` (Astro API route)
  - [ ] Check if payment required (config-based)
  - [ ] Return 402 if unpaid
  - [ ] Handle POST with X-PAYMENT header
  - [ ] Verify via Convex effect service
  - [ ] Execute agent + return 200
- [ ] Identify which endpoints need X402 protection:
  - [ ] Agent execution: `/api/agent/[agentId]/execute`
  - [ ] Provider access: `/api/provider/[providerId]/call`
  - [ ] N8N workflows: `/api/workflow/[workflowId]/trigger`
  - [ ] Custom API: `/api/custom/[name]` (future)

### Cycle 9: Plan Blockchain Integration

- [ ] Choose primary network: **Base (Coinbase L2)**
  - [ ] Lowest fees (~$0.001 per transaction)
  - [ ] USDC natively supported
  - [ ] ERC-2612 permit support
  - [ ] Fast finality (~2 seconds)
- [ ] Secondary networks (future):
  - [ ] Ethereum mainnet (if higher value txns)
  - [ ] Solana (if volume justifies)
- [ ] Choose permit scheme (preferred):
  - [ ] ERC-2612 permit (gasless approval)
  - [ ] No approval tx needed
  - [ ] Saves gas + UX
- [ ] Identify token: **USDC on Base**
  - [ ] Address: `0x833589fcd6edb6e08f4c7c32d4f71b54bda02913` (Base)
  - [ ] Decimals: 6
  - [ ] Facilitator: Coinbase CDP (pre-hosted)

### Cycle 10: Define Success Metrics for X402 Phase

- [ ] Integration complete when:
  - [ ] [ ] HTTP 402 responses sent from Astro API routes
  - [ ] [ ] X-PAYMENT header validation working
  - [ ] [ ] Blockchain payment verification functional
  - [ ] [ ] Payment events logged in Convex
  - [ ] [ ] UI shows payment prompt + wallet connection
  - [ ] [ ] Demo: Agent request → 402 prompt → payment → resource delivered
- [ ] Test targets:
  - [ ] 3+ protected endpoints (agent, provider, workflow)
  - [ ] 2+ payment schemes (permit, transfer)
  - [ ] Payment history queryable
  - [ ] E2E test: Request → payment → access
- [ ] Document in: `one/events/deployments/x402-phase1.md`

---

## PHASE 2: BACKEND SCHEMA & SERVICES (Cycle 11-20)

**Purpose:** Implement Effect.ts payment services, update Convex schema

### Cycle 11: Extend Payment Thing Type in Schema

- [ ] Edit `backend/convex/schema.ts`
- [ ] Update payment thing properties:

  ```typescript
  properties: {
    protocol: v.literal('x402'),  // X402-specific
    scheme: v.union(
      v.literal('permit'),
      v.literal('transfer'),
      v.literal('signature'),
      v.literal('invoice')
    ),
    network: v.union(
      v.literal('base'),
      v.literal('ethereum'),
      v.literal('solana'),
      v.literal('arbitrum'),
      v.literal('optimism'),
      v.literal('polygon')
    ),
    amount: v.string(),  // Decimal string
    currency: v.literal('USDC'),
    paymentMethod: v.literal('crypto'),

    // Payment details
    payTo: v.string(),  // Recipient address
    payFrom: v.string(),  // Payer address
    txHash: v.optional(v.string()),
    paymentId: v.string(),  // Unique ID

    // Status tracking
    status: v.union(
      v.literal('pending'),
      v.literal('payment_required'),
      v.literal('verified'),
      v.literal('settled'),
      v.literal('failed')
    ),

    // X402 request/response
    resource: v.string(),  // Protected endpoint
    payload: v.optional(v.any()),  // X-PAYMENT payload
    facilitatorResponse: v.optional(v.any()),  // Verification response

    // Metadata
    description: v.optional(v.string()),
    invoiceId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  }
  ```

- [ ] Add payment indexes:
  - [ ] by_type("payment")
  - [ ] by_status(status)
  - [ ] by_network(network)
  - [ ] by_payto(payTo)
- [ ] Create migration if needed (Convex migrations)

### Cycle 12: Create X402PaymentService (Effect.ts)

- [ ] Create `backend/convex/services/x402-payment.ts`
- [ ] Implement X402PaymentService class:
  ```typescript
  export class X402PaymentService extends Effect.Service<...>() {
    // Service methods (from /one/connections/x402.md)
  }
  ```
- [ ] Implement core methods:
  - [ ] `createPaymentRequest()` → PaymentRequired (402 response)
  - [ ] `verifyPayment()` → boolean (X-PAYMENT validation)
  - [ ] `settlePayment()` → string (txHash)
  - [ ] `getPaymentHistory()` → Payment[]
  - [ ] `recordPayment()` → void (log event)
- [ ] Document each method with:
  - [ ] Input types
  - [ ] Output types
  - [ ] Effect.ts error handling
  - [ ] Blockchain interaction
- [ ] Note: Reference `/one/connections/x402.md` Part 2 for code

### Cycle 13: Create X402FacilitatorService (Effect.ts)

- [ ] Create `backend/convex/services/x402-facilitator.ts`
- [ ] Implement X402FacilitatorService class:
  ```typescript
  export class X402FacilitatorService extends Effect.Service<...>() {
    // Facilitator interaction methods
  }
  ```
- [ ] Implement methods to interact with Coinbase CDP:
  - [ ] `verifyPayment(paymentPayload)` → VerifyPaymentResponse
  - [ ] `settlePayment(settlementRequest)` → SettlePaymentResponse
  - [ ] `getSupportedSchemes()` → SupportedSchemesResponse
  - [ ] `checkNetworkSupport(network)` → boolean
- [ ] Handle facilitator API calls:
  - [ ] POST /verify (validate X402 payment)
  - [ ] POST /settle (execute settlement)
  - [ ] GET /supported (list schemes)
- [ ] Implement error handling:
  - [ ] Network errors (retry logic)
  - [ ] Invalid payment (return error)
  - [ ] Unsupported scheme/network

### Cycle 14: Create Blockchain Provider Service (Effect.ts)

- [ ] Create `backend/convex/services/blockchain-provider.ts`
- [ ] Implement BlockchainProviderService class:
  ```typescript
  export class BlockchainProviderService extends Effect.Service<...>() {
    // Multi-chain provider methods
  }
  ```
- [ ] Support networks:
  - [ ] **Base:** via viem/ethers client
  - [ ] **Ethereum:** via viem/ethers client
  - [ ] **Solana:** (stub for now, full in future)
- [ ] Implement methods:
  - [ ] `getProvider(network)` → Client instance
  - [ ] `getTokenContract(network)` → Contract ABI
  - [ ] `verifyTransaction(txHash, network)` → tx details
  - [ ] `estimateGas(tx, network)` → gas estimate
  - [ ] `getGasPrice(network)` → current gas price
- [ ] Cache provider instances for efficiency

### Cycle 15: Implement Payment Event Logging

- [ ] Ensure payment_event exists in events table (from ontology)
- [ ] Create `backend/convex/services/payment-event-logger.ts`
- [ ] Log event types:
  - [ ] `payment_event` with metadata.status = "requested" (402 sent)
  - [ ] `payment_event` with metadata.status = "verified" (X-PAYMENT valid)
  - [ ] `payment_event` with metadata.status = "settled" (blockchain confirmed)
  - [ ] `payment_event` with metadata.status = "failed" (error occurred)
- [ ] Event structure:
  ```typescript
  {
    type: 'payment_event',
    actorId: userId,  // Who initiated payment
    targetId: paymentId,  // Payment thing ID
    timestamp: Date.now(),
    metadata: {
      protocol: 'x402',
      status: 'requested' | 'verified' | 'settled' | 'failed',
      network: 'base' | 'ethereum' | ...,
      scheme: 'permit' | 'transfer' | ...,
      amount: amount,
      txHash: txHash,  // if settled
      resource: resourcePath,
      facilitatorResponse: response,
    }
  }
  ```
- [ ] Create helper function to log events
- [ ] Test event logging in dev environment

### Cycle 16: Create X402Middleware for Astro API Routes

- [ ] Create `web/src/middleware/x402-middleware.ts`
- [ ] Implement middleware that:
  - [ ] Intercepts API route requests
  - [ ] Checks if endpoint requires X402 payment
  - [ ] Validates X-PAYMENT header if present
  - [ ] Returns 402 if payment required + not provided
  - [ ] Returns 200 + X-PAYMENT-ID if valid payment
- [ ] Middleware signature:
  ```typescript
  export function x402Middleware(
    request: Request,
    endpoint: X402ProtectedEndpoint,
  ): {
    requiresPayment: boolean;
    statusCode: number;
    paymentRequired?: PaymentRequired;
    xPaymentId?: string;
  };
  ```
- [ ] Handle edge cases:
  - [ ] Missing X-PAYMENT header
  - [ ] Invalid X-PAYMENT JSON
  - [ ] Payment amount < required
  - [ ] Payment already used (replay protection)

### Cycle 17: Set Up X402 Configuration

- [ ] Create `backend/convex/config/x402-config.ts`
- [ ] Define configuration object:
  ```typescript
  export const x402Config = {
    enabled: true,
    facilitator: {
      url: process.env.FACILITATOR_URL,
      apiKey: process.env.FACILITATOR_API_KEY,
    },
    networks: {
      base: {
        rpcUrl: process.env.VITE_BLOCKCHAIN_RPC_BASE,
        chainId: 8453,
        usdcAddress: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
        treasury: process.env.X402_PAYMENT_ADDRESS_BASE,
      },
      ethereum: {
        rpcUrl: process.env.VITE_BLOCKCHAIN_RPC_ETHEREUM,
        chainId: 1,
        usdcAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        treasury: process.env.X402_PAYMENT_ADDRESS_ETHEREUM,
      },
    },
    payments: {
      minAmount: "0.001", // $0.001 minimum
      defaultAmount: "0.01", // $0.01 default for API calls
      defaultNetwork: "base",
      defaultScheme: "permit",
      expirationTime: 5 * 60 * 1000, // 5 minutes
    },
  };
  ```
- [ ] Load config from env vars in both `.env` files
- [ ] Document required env vars

### Cycle 18: Implement Payment Verification Logic

- [ ] Create `backend/convex/lib/x402-verify.ts`
- [ ] Implement verification function:
  ```typescript
  export async function verifyX402Payment(
    paymentPayload: PaymentPayload,
    requirement: PaymentRequirement,
    resource: string,
  ): Promise<{ valid: boolean; paymentId: string; error?: string }>;
  ```
- [ ] Verification steps:
  1. Validate payload structure (JSON schema)
  2. Verify X402 version matches
  3. Validate scheme (permit/transfer/etc)
  4. Call facilitator API to verify payment
  5. Check payment amount >= required
  6. Verify recipient address matches
  7. Check replay (txHash not used before)
  8. Log result in events table
  9. Return validation result
- [ ] Handle each error case with descriptive message

### Cycle 19: Implement Payment Settlement

- [ ] Create `backend/convex/lib/x402-settle.ts`
- [ ] Implement settlement function:
  ```typescript
  export async function settleX402Payment(
    paymentPayload: PaymentPayload,
    paymentId: string,
  ): Promise<{ settled: boolean; txHash: string; error?: string }>;
  ```
- [ ] Settlement steps:
  1. Get verified payment from database
  2. Check status = "verified"
  3. Call facilitator to execute settlement
  4. Update payment status to "settled"
  5. Log settlement event
  6. Return settlement result
- [ ] Handle settlement errors:
  - [ ] Blockchain errors (retry)
  - [ ] Insufficient gas (recommend amount)
  - [ ] Network issues (queue for retry)

### Cycle 20: Create Convex Mutations for Payment Handling

- [ ] Create `backend/convex/mutations/payments.ts`
- [ ] Implement mutations:
  - [ ] `createPaymentRequest(resource, amount)` → PaymentRequired
  - [ ] `verifyPayment(paymentPayload, requirement)` → verification result
  - [ ] `recordPayment(paymentPayload, resource)` → paymentId
  - [ ] `updatePaymentStatus(paymentId, status)` → void
- [ ] Each mutation:
  - [ ] Takes typed arguments (Convex v)
  - [ ] Calls appropriate Effect.ts service
  - [ ] Handles errors gracefully
  - [ ] Returns structured result
  - [ ] Logs events
- [ ] Document expected flow:
  - [ ] Frontend requests resource
  - [ ] Astro calls `createPaymentRequest` mutation
  - [ ] Returns 402 to frontend
  - [ ] Frontend shows payment prompt
  - [ ] User connects wallet + makes payment
  - [ ] Frontend calls `verifyPayment` mutation
  - [ ] If valid, calls `recordPayment` mutation
  - [ ] Astro re-processes original request

---

## PHASE 3: FRONTEND COMPONENTS & PAGES (Cycle 21-30)

**Purpose:** Build React components and Astro pages for payment flow

### Cycle 21: Create PaymentRequired Component

- [ ] Create `web/src/components/features/PaymentRequired.tsx`
- [ ] Component displays:
  - [ ] Payment amount in USD + tokens
  - [ ] Multiple network options (Base, Ethereum)
  - [ ] Multiple scheme options (Permit, Transfer)
  - [ ] "Connect Wallet" button
  - [ ] Error messages
  - [ ] Loading state during payment
- [ ] Props:
  ```typescript
  interface PaymentRequiredProps {
    paymentRequired: PaymentRequired; // 402 response
    onPaymentComplete: (payload: PaymentPayload) => void;
    onCancel: () => void;
  }
  ```
- [ ] Features:
  - [ ] Responsive design
  - [ ] Dark mode support
  - [ ] Accessibility (WCAG)
  - [ ] Mobile wallet support

### Cycle 22: Create WalletConnection Component

- [ ] Create `web/src/components/features/WalletConnection.tsx`
- [ ] Component handles:
  - [ ] Connecting wallet (MetaMask, Rainbow Kit, etc)
  - [ ] Displaying connected address
  - [ ] Showing wallet balance (USDC)
  - [ ] Switching networks (to Base, Ethereum)
  - [ ] Disconnecting wallet
- [ ] Use libraries:
  - [ ] `wagmi` (React hooks for wallet)
  - [ ] `viem` (blockchain client)
  - [ ] `@rainbow-me/rainbowkit` (UI kit)
- [ ] Features:
  - [ ] One-click connect
  - [ ] Auto-switch to required network
  - [ ] Display balance in USD + tokens
  - [ ] Error handling for network mismatch

### Cycle 23: Create PaymentProcessor Component

- [ ] Create `web/src/components/features/PaymentProcessor.tsx`
- [ ] Component orchestrates:
  - [ ] Taking PaymentRequired + PaymentPayload
  - [ ] Calling Convex to verify payment
  - [ ] Handling verification response
  - [ ] Showing success/error to user
  - [ ] Retrying if transaction pending
- [ ] Handles payment schemes:
  - [ ] **Permit:** ERC-2612 signature + transfer in one tx
  - [ ] **Transfer:** Direct token transfer (requires approval first)
- [ ] Features:
  - [ ] Retry logic for network timeouts
  - [ ] Shows tx hash when sent
  - [ ] Polls for confirmation (~2 seconds on Base)
  - [ ] Timeout after 5 minutes

### Cycle 24: Create PaymentPrompt Modal

- [ ] Create `web/src/components/features/PaymentPromptModal.tsx`
- [ ] Modal that combines:
  - [ ] PaymentRequired display
  - [ ] WalletConnection
  - [ ] PaymentProcessor
  - [ ] Success/error states
- [ ] Behavior:
  - [ ] Shows when backend returns 402
  - [ ] User connects wallet
  - [ ] Processes payment
  - [ ] Auto-closes + retries original request on success
- [ ] Design:
  - [ ] Centered modal with overlay
  - [ ] Progress indicator (step 1/3, etc)
  - [ ] Clear instructions for user
  - [ ] Cancel button to dismiss

### Cycle 25: Create PaymentHistory Component

- [ ] Create `web/src/components/features/PaymentHistory.tsx`
- [ ] Component displays:
  - [ ] List of past payments
  - [ ] Amount, date, status, network
  - [ ] Tx hash link to explorer
  - [ ] Filter by status, network, date range
  - [ ] Search by tx hash
- [ ] Table columns:
  - [ ] Timestamp
  - [ ] Resource (API endpoint)
  - [ ] Amount (USD + tokens)
  - [ ] Network
  - [ ] Status badge (✓ settled, ⏳ verified, ✗ failed)
  - [ ] Tx hash (link to block explorer)
  - [ ] Action button (view details)
- [ ] Fetches data from Convex query
- [ ] Pagination for many transactions

### Cycle 26: Create BalanceDisplay Component

- [ ] Create `web/src/components/features/BalanceDisplay.tsx`
- [ ] Component shows:
  - [ ] Wallet USDC balance
  - [ ] Formatted in USD + token units
  - [ ] Network indicator (Base, Ethereum, etc)
  - [ ] Refresh button
  - [ ] Low balance warning (if < $0.05)
- [ ] Real-time updates:
  - [ ] Subscribes to Convex changes
  - [ ] Updates when new payment made
- [ ] Design:
  - [ ] Card layout
  - [ ] Badge showing network
  - [ ] Loading skeleton
  - [ ] Error message if balance fetch fails

### Cycle 27: Create AgentExecutionFlow with X402

- [ ] Create `web/src/components/features/AgentExecutionFlow.tsx`
- [ ] Component orchestrates:
  - [ ] User selects agent + parameters
  - [ ] Clicks "Execute" button
  - [ ] Backend returns 402 if payment required
  - [ ] Shows PaymentPromptModal
  - [ ] User pays
  - [ ] Retries agent execution
  - [ ] Shows agent result
- [ ] Handles all payment states:
  - [ ] Payment required
  - [ ] Payment processing
  - [ ] Payment verified
  - [ ] Agent executing
  - [ ] Agent complete
  - [ ] Payment failed (show retry)
- [ ] UX flow:
  ```
  Agent Selection → Execute → [Payment Modal if 402] → Agent Results
  ```

### Cycle 28: Update ExternalProviderAccess Component

- [ ] Modify `web/src/components/features/ExternalProviderAccess.tsx`
- [ ] Add X402 payment flow:
  - [ ] Show provider listing from Bazar (future)
  - [ ] Compare pricing + availability
  - [ ] Select provider + call API
  - [ ] Handle 402 payment prompt
  - [ ] Execute provider request
  - [ ] Show results
- [ ] Features:
  - [ ] Provider comparison table
  - [ ] Price in USD per request
  - [ ] Network availability badge
  - [ ] Success rate %

### Cycle 29: Create X402 Demo Page

- [ ] Create `web/src/pages/demo/x402-payments.astro`
- [ ] Interactive demo showing:
  - [ ] Protected API endpoint (returns 402)
  - [ ] Payment requirement breakdown
  - [ ] Wallet connection flow
  - [ ] Payment execution
  - [ ] Transaction confirmation
  - [ ] Final resource access
- [ ] Demo scenarios:
  - [ ] Minimum payment ($0.001)
  - [ ] Standard payment ($0.01)
  - [ ] Higher amount ($1.00)
- [ ] Educational content:
  - [ ] How X402 works (animation)
  - [ ] Why X402 > API keys
  - [ ] Integration for developers
  - [ ] FAQ section

### Cycle 30: Create X402 Documentation Page

- [ ] Create `web/src/pages/docs/x402-integration.astro`
- [ ] Document for developers:
  - [ ] X402 protocol overview
  - [ ] How to protect endpoints
  - [ ] How to handle 402 responses
  - [ ] Integration examples (curl, JS, Python)
  - [ ] Error handling
  - [ ] Retry logic
- [ ] Code examples:
  - [ ] Backend: Mark endpoint as requiring payment
  - [ ] Frontend: Handle 402 + show payment modal
  - [ ] Wallet: Connect + sign permit
  - [ ] Settlement: Verify payment + grant access
- [ ] Deploy to `/docs/x402-integration`

---

## PHASE 4: API ROUTES & ASTRO INTEGRATION (Cycle 31-40)

**Purpose:** Implement X402-protected API routes in Astro

### Cycle 31: Create X402 Astro API Route Handler

- [ ] Create `web/src/lib/x402-route-handler.ts`
- [ ] Export function:
  ```typescript
  export async function handleX402Request(
    request: Request,
    handler: (req: Request) => Promise<Response>,
    options: X402RouteOptions,
  ): Promise<Response>;
  ```
- [ ] Implements full X402 flow:
  1. Check if X-PAYMENT header exists
  2. If not → return 402 PaymentRequired
  3. If yes → verify payment via Convex
  4. If invalid → return 402 with error
  5. If valid → call handler to get resource
  6. Return 200 + X-PAYMENT-ID header + resource
- [ ] Options interface:
  ```typescript
  interface X402RouteOptions {
    requiresPayment: boolean;
    amount?: string;
    description?: string;
    resource: string; // endpoint path
  }
  ```
- [ ] Error handling:
  - [ ] Invalid payload format
  - [ ] Verification failed
  - [ ] Facilitator error (return 502)
  - [ ] Payment expired

### Cycle 32: Create Agent Execution API Route

- [ ] Create `web/src/pages/api/agent/execute.ts`
- [ ] Astro API route that:
  - [ ] Accepts POST request with agent config
  - [ ] Checks if payment required (config-based)
  - [ ] Uses handleX402Request to enforce payment
  - [ ] Calls Convex to execute agent
  - [ ] Returns agent result
- [ ] Request body:
  ```typescript
  {
    agentId: string;
    parameters: Record<string, any>;
    userId: string;
  }
  ```
- [ ] Response on success (200):
  ```typescript
  {
    success: true;
    result: any;
    executionTime: number;
    paymentId: string; // X-PAYMENT-ID
  }
  ```
- [ ] Response on payment required (402):
  ```typescript
  {
    x402Version: 1;
    accepts: PaymentRequirement[];
  }
  ```

### Cycle 33: Create Provider API Call Route

- [ ] Create `web/src/pages/api/provider/[providerId]/call.ts`
- [ ] Astro API route that:
  - [ ] Accepts POST request with provider method + params
  - [ ] Enforces X402 payment
  - [ ] Forwards request to external provider
  - [ ] Returns provider response
- [ ] Request body:
  ```typescript
  {
    method: string;
    parameters: Record<string, any>;
  }
  ```
- [ ] Handles:
  - [ ] Rate limiting per provider
  - [ ] Provider availability check
  - [ ] Timeout handling
  - [ ] Error forwarding from provider

### Cycle 34: Create Workflow Trigger Route

- [ ] Create `web/src/pages/api/workflow/[workflowId]/trigger.ts`
- [ ] Astro API route that:
  - [ ] Accepts POST with workflow inputs
  - [ ] Enforces X402 payment
  - [ ] Triggers N8N workflow
  - [ ] Returns workflow execution status
- [ ] Workflow payment tiers (future):
  - [ ] Small workflow ($0.001)
  - [ ] Medium workflow ($0.01)
  - [ ] Large workflow ($0.10)
- [ ] Integration with N8N:
  - [ ] POST to N8N webhook URL
  - [ ] Include payment ID in headers
  - [ ] Track execution in Convex

### Cycle 35: Create Payment Verification Route

- [ ] Create `web/src/pages/api/payments/verify.ts`
- [ ] POST route that:
  - [ ] Takes X-PAYMENT payload
  - [ ] Calls Convex to verify
  - [ ] Returns verification result
- [ ] Request body:
  ```typescript
  {
    paymentPayload: PaymentPayload;
    resource: string;
  }
  ```
- [ ] Response:
  ```typescript
  {
    valid: boolean;
    paymentId: string;
    txHash: string;
    error?: string;
  }
  ```

### Cycle 36: Create Payment Settlement Route

- [ ] Create `web/src/pages/api/payments/settle.ts`
- [ ] POST route that:
  - [ ] Takes verified payment
  - [ ] Calls Convex to settle on blockchain
  - [ ] Returns settlement result
- [ ] Request body:
  ```typescript
  {
    paymentId: string;
  }
  ```
- [ ] Response:
  ```typescript
  {
    settled: boolean;
    txHash: string;
    blockNumber: number;
    error?: string;
  }
  ```

### Cycle 37: Create Payment Query Route

- [ ] Create `web/src/pages/api/payments/history.ts`
- [ ] GET route that:
  - [ ] Requires authentication
  - [ ] Returns user's payment history
  - [ ] Supports filtering + pagination
- [ ] Query params:
  ```
  ?status=settled&network=base&limit=20&offset=0&sortBy=date
  ```
- [ ] Response:
  ```typescript
  {
    payments: Payment[];
    total: number;
    page: number;
  }
  ```

### Cycle 38: Create Payment Configuration Route

- [ ] Create `web/src/pages/api/x402/config.ts`
- [ ] GET route that returns:
  - [ ] Supported networks
  - [ ] Supported payment schemes
  - [ ] Min/max payment amounts
  - [ ] Accepted tokens
  - [ ] Facilitator details
- [ ] Used by frontend to:
  - [ ] Display payment options
  - [ ] Validate amounts
  - [ ] Show available networks
- [ ] Response:
  ```typescript
  {
    version: 1;
    networks: BlockchainNetwork[];
    schemes: PaymentScheme[];
    tokens: Token[];
    minAmount: string;
    maxAmount: string;
    facilitator: FacilitatorInfo;
  }
  ```

### Cycle 39: Add Error Handling Middleware

- [ ] Create `web/src/middleware/error-handler.ts`
- [ ] Handle X402-specific errors:
  - [ ] 402: Payment Required
  - [ ] 402 with error: Payment Invalid
  - [ ] 503: Facilitator Down
  - [ ] 500: Internal Server Error
- [ ] Error response format:
  ```typescript
  {
    error: string;
    code: string;
    details: any;
    x402Info?: PaymentRequired;  // If 402
  }
  ```

### Cycle 40: Test All API Routes

- [ ] Write tests for each route:
  - [ ] Test without payment (expect 402)
  - [ ] Test with invalid payment (expect error)
  - [ ] Test with valid payment (expect 200)
  - [ ] Test payment history query
  - [ ] Test config endpoint
- [ ] Test error scenarios:
  - [ ] Malformed X-PAYMENT header
  - [ ] Expired payment request
  - [ ] Replay attack (same txHash twice)
  - [ ] Insufficient amount
- [ ] Document test results

---

## PHASE 5: BLOCKCHAIN & PAYMENT MECHANICS (Cycle 41-50)

**Purpose:** Implement blockchain payment processing

### Cycle 41: Implement Permit-Based Payment Flow

- [ ] Create `backend/convex/lib/permit-payment.ts`
- [ ] Implement permit generation:
  ```typescript
  export async function generatePermit(
    token: string, // USDC address
    owner: string, // User's wallet
    spender: string, // Treasury contract
    amount: string, // Amount in token units
    deadline: number, // Unix timestamp
    nonce: number, // Permit nonce
  ): Promise<{
    permit: PermitData;
    signature: string;
  }>;
  ```
- [ ] Permit structure (ERC-2612):
  - [ ] Token holder (owner) can authorize transfer
  - [ ] Without separate approval transaction
  - [ ] Signature proves authorization
  - [ ] Spender executes transfer with permit
- [ ] Frontend flow:
  1. Show permit details to user
  2. User signs with wallet (MetaMask popup)
  3. Signature sent to backend
  4. Backend calls facilitator to execute transfer

### Cycle 42: Implement Transfer-Based Payment Flow

- [ ] Create `backend/convex/lib/transfer-payment.ts`
- [ ] For chains without permit support (Solana):
  - [ ] User approves spender in separate tx
  - [ ] User signs transfer in second tx
  - [ ] Both txHashes submitted to backend
- [ ] Flow:
  1. Generate approval tx (user can preview)
  2. User submits + signs approval
  3. Wait for approval confirmation
  4. Generate transfer tx
  5. User submits + signs transfer
  6. Backend verifies both on-chain
- [ ] Handle edge cases:
  - [ ] User cancels approval
  - [ ] Approval expires (re-generate)
  - [ ] Insufficient allowance (show error)

### Cycle 43: Integrate with Coinbase CDP Facilitator

- [ ] Create `backend/convex/lib/coinbase-facilitator.ts`
- [ ] Implement facilitator client:
  ```typescript
  export class CoinbaseFacilitator {
    async verifyPayment(payload: PaymentPayload): Promise<VerifyResponse>;
    async settlePayment(txHash: string): Promise<SettleResponse>;
    async getSupportedSchemes(): Promise<SupportedSchemesResponse>;
  }
  ```
- [ ] API calls to Coinbase:
  - [ ] POST /verify - Check payment validity
  - [ ] POST /settle - Execute on-chain settlement
  - [ ] GET /supported - List supported schemes/networks
- [ ] Authentication:
  - [ ] API key in env var
  - [ ] Include in Authorization header
- [ ] Error handling:
  - [ ] Retry on 5xx errors
  - [ ] Propagate validation errors
  - [ ] Log all facilitator calls

### Cycle 44: Implement Gas Estimation

- [ ] Create `backend/convex/lib/gas-estimation.ts`
- [ ] Estimate gas for:
  - [ ] Permit signature (no gas)
  - [ ] Transfer transaction (gas cost on Base ~$0.0001)
  - [ ] Settlement on Base (gas cost)
- [ ] Functions:
  ```typescript
  async function estimateTransferGas(network: string): Promise<string>;
  async function estimateTxCost(network: string, gas: string): Promise<string>;
  ```
- [ ] Show to user:
  - [ ] Gas cost in USD
  - [ ] Total cost = amount + gas
- [ ] On Base: Gas typically negligible (~$0.0001)

### Cycle 45: Implement Transaction Verification

- [ ] Create `backend/convex/lib/tx-verification.ts`
- [ ] Verify on-chain transaction:
  ```typescript
  async function verifyTransaction(
    txHash: string,
    network: string,
    expectedAmount: string,
    expectedRecipient: string,
  ): Promise<{
    valid: boolean;
    blockNumber: number;
    confirmations: number;
    error?: string;
  }>;
  ```
- [ ] Checks:
  - [ ] Tx exists on-chain
  - [ ] Status = success
  - [ ] Amount >= required
  - [ ] Recipient = treasury address
  - [ ] Token = USDC
  - [ ] Enough confirmations (1 on Base)
- [ ] Handle cases:
  - [ ] Tx pending (return confirmations = 0)
  - [ ] Tx failed (return error)
  - [ ] Wrong recipient (return error)
  - [ ] Insufficient amount (return error)

### Cycle 46: Implement Replay Protection

- [ ] Create `backend/convex/lib/replay-protection.ts`
- [ ] Prevent using same payment twice:
  ```typescript
  async function checkReplayProtection(
    paymentPayload: PaymentPayload,
  ): Promise<boolean>;
  ```
- [ ] Methods:
  - [ ] Check txHash not in used payments
  - [ ] Check nonce unique (if present)
  - [ ] Check timestamp recent (< 5 minutes)
  - [ ] Mark txHash as used after payment
- [ ] Store used txHashes:
  - [ ] In Convex `payments` table (status = "settled")
  - [ ] Add index: by_txHash(txHash)
- [ ] Query existing payments:
  ```typescript
  const existing = await db
    .query("entities")
    .withIndex("by_type", (q) => q.eq("type", "payment"))
    .filter((q) => q.eq(q.field("properties.txHash"), txHash))
    .first();
  ```

### Cycle 47: Implement Rate Limiting per User

- [ ] Create `backend/convex/lib/rate-limiter.ts`
- [ ] Rate limit payment attempts:
  - [ ] Per user: 10 requests/minute (prevent spam)
  - [ ] Per endpoint: 100 payments/minute (per-resource)
  - [ ] Sliding window counter
- [ ] Store rates in Convex or in-memory (fast)
- [ ] Return 429 Too Many Requests if exceeded
- [ ] Log rate limit violations

### Cycle 48: Implement Payment Reconciliation

- [ ] Create `backend/convex/services/payment-reconciliation.ts`
- [ ] Scheduled job to:
  - [ ] Check pending payments (every minute)
  - [ ] Verify status with blockchain
  - [ ] Update payment status in DB
  - [ ] Log discrepancies
- [ ] States:
  - [ ] payment_required: Awaiting user action
  - [ ] verified: User signed, awaiting settlement
  - [ ] settled: Confirmed on-chain
  - [ ] failed: Error, mark for cleanup
- [ ] Reconciliation logic:
  ```typescript
  async function reconcilePendingPayments() {
    // Get all payments with status != "settled"
    // For each, check blockchain
    // Update status + log event
  }
  ```

### Cycle 49: Implement Refund Logic (Future)

- [ ] Create `backend/convex/lib/refund-handler.ts`
- [ ] Handle refunds if:
  - [ ] Service fails after payment
  - [ ] User cancels within timeout
  - [ ] Overpayment (refund difference)
- [ ] Refund flow:
  1. Receive refund request
  2. Verify eligibility
  3. Call facilitator to issue refund
  4. Update payment status to "refunded"
  5. Log refund event
- [ ] Note: Implement in Phase 2+ (not required for MVP)

### Cycle 50: Document Payment Architecture

- [ ] Write `one/connections/x402-architecture.md`
- [ ] Document:
  - [ ] Payment flow diagram
  - [ ] Components + responsibilities
  - [ ] Data structures
  - [ ] Error scenarios + recovery
  - [ ] Security considerations
  - [ ] Performance characteristics
- [ ] Add to `/one` documentation

---

## PHASE 6: QUALITY & TESTING (Cycle 51-60)

**Purpose:** Test all payment flows end-to-end

### Cycle 51: Write Unit Tests for X402 Services

- [ ] Create `backend/convex/__tests__/x402-payment.test.ts`
- [ ] Test X402PaymentService:
  - [ ] createPaymentRequest returns 402 structure
  - [ ] verifyPayment validates payload
  - [ ] getPaymentHistory returns user's payments
- [ ] Test X402FacilitatorService:
  - [ ] verifyPayment calls Coinbase API
  - [ ] settlePayment executes transaction
  - [ ] Error handling + retries
- [ ] Mock external calls:
  - [ ] Mock Convex database
  - [ ] Mock HTTP calls to facilitator
  - [ ] Mock blockchain calls

### Cycle 52: Write Integration Tests

- [ ] Create `backend/convex/__tests__/x402-integration.test.ts`
- [ ] Test complete flow:
  1. Create payment request (get 402)
  2. Create payment payload (sign)
  3. Verify payment (call facilitator)
  4. Settle payment (on-chain)
  5. Verify recorded in DB
- [ ] Test error scenarios:
  - [ ] Invalid signature
  - [ ] Insufficient balance
  - [ ] Wrong recipient
  - [ ] Replay attack
  - [ ] Network timeout

### Cycle 53: Write Frontend Component Tests

- [ ] Create `web/src/components/__tests__/PaymentRequired.test.tsx`
- [ ] Test PaymentRequired component:
  - [ ] Renders correctly
  - [ ] Shows network/scheme options
  - [ ] Handles wallet connection
  - [ ] Displays error messages
  - [ ] Callback on payment
- [ ] Test WalletConnection component:
  - [ ] Connect button works
  - [ ] Wallet list shows
  - [ ] Balance displays
  - [ ] Network switching
- [ ] Test PaymentProcessor:
  - [ ] Calls verify endpoint
  - [ ] Handles verification result
  - [ ] Retries on failure
  - [ ] Shows success message

### Cycle 54: Write E2E Tests

- [ ] Create `web/src/__tests__/x402-e2e.test.ts`
- [ ] Test full user flow:
  1. Visit protected endpoint
  2. Get 402 response
  3. Modal shows payment prompt
  4. User connects wallet
  5. User approves permit
  6. Payment verified
  7. Endpoint returns resource
- [ ] Use test wallet (e.g., testnet USDC)
- [ ] Verify in block explorer
- [ ] Test retry flows

### Cycle 55: Write API Route Tests

- [ ] Create `web/src/pages/api/__tests__/agent-execute.test.ts`
- [ ] Test agent execution endpoint:
  - [ ] Without payment → 402
  - [ ] With invalid payment → error
  - [ ] With valid payment → 200 + result
- [ ] Test other routes similarly:
  - [ ] Provider call
  - [ ] Workflow trigger
  - [ ] Payment history

### Cycle 56: Create Test Fixtures

- [ ] Create `web/src/__fixtures__/x402-fixtures.ts`
- [ ] Define test data:
  - [ ] Sample payment payloads
  - [ ] Sample facilitator responses
  - [ ] Sample blockchain transactions
  - [ ] Mock wallet addresses
  - [ ] Test amounts
- [ ] Reuse across all tests

### Cycle 57: Test Error Scenarios

- [ ] Create `web/src/__tests__/x402-error-scenarios.test.ts`
- [ ] Test error handling:
  - [ ] Facilitator down (503)
  - [ ] Invalid payment (402 with error)
  - [ ] Expired request
  - [ ] Malformed payload
  - [ ] Network timeout
  - [ ] Gas estimation error
  - [ ] Insufficient gas
- [ ] Verify error messages are helpful

### Cycle 58: Test Security

- [ ] Create `web/src/__tests__/x402-security.test.ts`
- [ ] Test security aspects:
  - [ ] Replay protection works
  - [ ] Signature verification
  - [ ] Recipient validation
  - [ ] Amount validation
  - [ ] Rate limiting
  - [ ] XSS protection (payment modal)
  - [ ] CSRF protection

### Cycle 59: Test Performance

- [ ] Create `web/src/__tests__/x402-performance.test.ts`
- [ ] Measure:
  - [ ] Payment creation time (< 100ms)
  - [ ] Verification time (< 500ms)
  - [ ] Settlement time (< 2s on Base)
  - [ ] UI responsiveness during payment
  - [ ] Load test: 100 concurrent payments
- [ ] Document results in metrics file

### Cycle 60: Final Test Coverage Report

- [ ] Run full test suite: `bun test`
- [ ] Generate coverage report
- [ ] Target: 80%+ coverage
- [ ] Document:
  - [ ] Test count
  - [ ] Coverage %
  - [ ] Known gaps
  - [ ] Performance metrics
- [ ] Save to: `one/events/x402-test-report.md`

---

## PHASE 7: DESIGN & WIREFRAMES (Cycle 61-70)

**Purpose:** Finalize UI/UX design for payment flow

### Cycle 61: Design Payment Prompt Modal

- [ ] Create wireframe: PaymentPromptModal
- [ ] Layout:
  - [ ] Title: "Payment Required"
  - [ ] Amount display (USD + tokens)
  - [ ] Network selector dropdown
  - [ ] Scheme selector (Permit, Transfer)
  - [ ] "Connect Wallet" button
  - [ ] "Cancel" button
- [ ] States:
  - [ ] Initial (awaiting wallet connect)
  - [ ] Connected (show address + balance)
  - [ ] Signing (show "Please sign in wallet")
  - [ ] Processing (show spinner)
  - [ ] Success (show checkmark + close)
  - [ ] Error (show error message + retry)

### Cycle 62: Design Payment History Page

- [ ] Create wireframe: PaymentHistory
- [ ] Components:
  - [ ] Header: "Payment History"
  - [ ] Filter bar (status, network, date)
  - [ ] Table with columns:
    - [ ] Date/time
    - [ ] Resource (API endpoint)
    - [ ] Amount
    - [ ] Network badge
    - [ ] Status badge
    - [ ] Tx hash (clickable)
  - [ ] Pagination controls
  - [ ] Empty state (no payments)
  - [ ] Error state (failed to load)

### Cycle 63: Design Balance Display

- [ ] Create wireframe: BalanceDisplay
- [ ] Card layout:
  - [ ] Title: "Wallet Balance"
  - [ ] Network badge (Base, Ethereum)
  - [ ] Large balance display ($X.XX)
  - [ ] Token display (Y USDC)
  - [ ] Refresh button
  - [ ] Low balance warning (if < $0.05)
  - [ ] "Add Funds" link (future)

### Cycle 64: Design Agent Execution Flow

- [ ] Create wireframe: AgentExecutionFlow
- [ ] States:
  - [ ] Initial: Agent selection + parameters
  - [ ] Submitted: Show spinner "Executing..."
  - [ ] Payment required: Show PaymentPromptModal
  - [ ] Retrying: Show spinner "Retrying execution..."
  - [ ] Success: Show agent result
  - [ ] Error: Show error message + retry button
- [ ] Include payment info in result:
  - [ ] Payment ID
  - [ ] Tx hash
  - [ ] Network used
  - [ ] Cost in USD

### Cycle 65: Design X402 Demo Page

- [ ] Create wireframe: DemoPage (/demo/x402-payments)
- [ ] Sections:
  - [ ] Hero: "Try X402 Payments"
  - [ ] How it works (3-step animation)
  - [ ] Live demo (test payment)
  - [ ] Pricing comparison (X402 vs traditional)
  - [ ] FAQ section
  - [ ] CTA: "Integrate X402"
- [ ] Interactive elements:
  - [ ] Animated flow chart
  - [ ] Live payment example
  - [ ] Code snippets (copy-able)

### Cycle 66: Create Design Tokens for X402

- [ ] Update `web/src/styles/x402-tokens.css`:

  ```css
  :root {
    --x402-primary: hsl(180, 82%, 50%); /* X402 blue */
    --x402-success: hsl(120, 100%, 50%); /* Payment success */
    --x402-warning: hsl(45, 100%, 50%); /* Awaiting user */
    --x402-error: hsl(0, 100%, 50%); /* Payment failed */
    --x402-pending: hsl(45, 100%, 50%); /* Processing */

    --blockchain-base: hsl(220, 90%, 50%); /* Base blue */
    --blockchain-ethereum: hsl(250, 60%, 50%); /* Ethereum purple */
    --blockchain-solana: hsl(280, 80%, 50%); /* Solana pink */

    --x402-border-radius: 12px;
    --x402-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  ```

### Cycle 67: Ensure Accessibility (WCAG 2.1 AA)

- [ ] Update components for accessibility:
  - [ ] PaymentPromptModal: Add aria-modal, role, keyboard nav
  - [ ] WalletConnection: Add labels, focus states
  - [ ] PaymentProcessor: Add aria-live for status updates
  - [ ] PaymentHistory: Add table headers, sort buttons
  - [ ] BalanceDisplay: Add aria-label for amount
- [ ] Test with:
  - [ ] Screen reader (NVDA, JAWS)
  - [ ] Keyboard navigation (Tab, Enter, Escape)
  - [ ] Color contrast (ratio 4.5:1 minimum)
  - [ ] Focus indicators (visible)

### Cycle 68: Test Mobile Responsiveness

- [ ] Test PaymentPromptModal on:
  - [ ] iPhone 12 (390px)
  - [ ] iPad (768px)
  - [ ] Android phone (360px)
- [ ] Issues to fix:
  - [ ] Modal overflow
  - [ ] Button sizes (tap targets 48px+)
  - [ ] Text readability
  - [ ] Wallet connect dropdown
- [ ] Test touch interactions:
  - [ ] Network selector (dropdown)
  - [ ] Scheme selector (radio buttons)
  - [ ] Buttons (click area)

### Cycle 69: Design Dark Mode Styles

- [ ] Update CSS for dark mode:
  ```css
  @media (prefers-color-scheme: dark) {
    --x402-bg: hsl(220, 13%, 13%);
    --x402-text: hsl(0, 0%, 100%);
    --x402-border: hsl(220, 13%, 23%);
    --x402-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  }
  ```
- [ ] Test all components in dark mode
- [ ] Verify contrast ratios still valid

### Cycle 70: Create Component Library Documentation

- [ ] Document all X402 components:
  - [ ] PaymentPromptModal
  - [ ] WalletConnection
  - [ ] PaymentProcessor
  - [ ] PaymentHistory
  - [ ] BalanceDisplay
  - [ ] AgentExecutionFlow
- [ ] For each: Props, states, usage examples
- [ ] Add Storybook stories (future):
  - [ ] Story for each state
  - [ ] Interactive playground
  - [ ] Component docs

---

## PHASE 8: PERFORMANCE & OPTIMIZATION (Cycle 71-80)

**Purpose:** Optimize payment flow for speed + efficiency

### Cycle 71: Optimize Frontend Bundle Size

- [ ] Audit bundle:
  - [ ] Run `bun run build` with analysis
  - [ ] Identify large dependencies (wagmi, viem)
  - [ ] Tree-shake unused code
- [ ] Optimize:
  - [ ] Code-split payment components (lazy load)
  - [ ] Minimize Redux/state duplicates
  - [ ] Remove unused shadcn/ui components
- [ ] Target: Payment modal < 50KB gzipped

### Cycle 72: Implement Payment Caching

- [ ] Cache frequently accessed data:
  - [ ] X402 config (supported networks, amounts)
  - [ ] User payment history (first 50 records)
  - [ ] Facilitator status
- [ ] Cache strategy:
  - [ ] Config: 1 hour (update on page load)
  - [ ] History: 5 minutes (refresh on new payment)
  - [ ] Facilitator: 5 minutes (health check)
- [ ] Use Convex caching + browser localStorage

### Cycle 73: Implement Pagination for Payment History

- [ ] Load payments in batches:
  - [ ] Initial load: 20 most recent
  - [ ] On scroll: Load next 20
  - [ ] User can jump to page
- [ ] Database query optimization:
  - [ ] Index: by_timestamp(createdAt)
  - [ ] Limit + offset in query
  - [ ] Count total for pagination info

### Cycle 74: Optimize Blockchain RPC Calls

- [ ] Batch RPC requests:
  - [ ] Use eth_call for read-only operations
  - [ ] Batch multiple calls in single JSON-RPC batch
  - [ ] Cache results (gas prices, contract state)
- [ ] Reduce RPC calls:
  - [ ] Cache token balances (poll every 10 seconds)
  - [ ] Cache gas prices (poll every 30 seconds)
  - [ ] Cache supported schemes (poll on demand)
- [ ] Monitor RPC usage:
  - [ ] Track calls per second
  - [ ] Alert if quota exceeded

### Cycle 75: Implement Permit Caching

- [ ] Cache permit data to avoid re-generating:
  - [ ] Store permit in localStorage + Convex
  - [ ] Reuse for 5 minutes (before expiry)
  - [ ] User can view previous permits
- [ ] Cache structure:
  ```typescript
  {
    paymentId: string;
    permit: PermitData;
    signature: string;
    expiresAt: number;
    usedAt?: number;
  }
  ```

### Cycle 76: Implement Progressive Enhancement

- [ ] Website works without JavaScript (server-rendered):
  - [ ] Show payment form with standard HTML
  - [ ] POST to API endpoint
  - [ ] Server returns 402 with HTML form
  - [ ] User can submit (without client-side validation)
- [ ] With JavaScript: Enhanced UX
  - [ ] Client-side validation
  - [ ] Real-time feedback
  - [ ] Wallet integration
- [ ] Goal: Graceful degradation

### Cycle 77: Monitor Payment Latency

- [ ] Add performance metrics:
  - [ ] Payment creation time
  - [ ] Verification time
  - [ ] Settlement time
  - [ ] UI render time
- [ ] Track in Convex events:
  ```typescript
  {
    type: 'payment_event',
    metadata: {
      status: 'settled',
      createdAt: 1234567890,
      verifiedAt: 1234567900,
      settledAt: 1234567910,
      creationMs: 10,
      verificationMs: 10,
      settlementMs: 10,
    }
  }
  ```
- [ ] Alert if > expected time

### Cycle 78: Implement Connection Pooling

- [ ] Reuse blockchain client connections:
  - [ ] Create single viem client per network
  - [ ] Share across multiple requests
  - [ ] Avoid creating new clients per request
- [ ] Connection pooling strategy:
  - [ ] Singleton pattern for viem clients
  - [ ] Base client created on startup
  - [ ] Reuse for all requests

### Cycle 79: Optimize Payment Settlement

- [ ] Parallelize settlement tasks:
  - [ ] Verify payment on blockchain (parallel)
  - [ ] Update DB (parallel)
  - [ ] Log event (parallel)
  - [ ] Notify user (parallel)
- [ ] Use Convex's scheduler for batch operations
- [ ] Goal: Settlement < 2 seconds on Base

### Cycle 80: Performance Baseline & Regression Testing

- [ ] Establish baseline metrics:
  - [ ] Payment creation: 50-100ms
  - [ ] Verification: 300-500ms
  - [ ] Settlement: 1-2s (blockchain dependent)
  - [ ] UI responsiveness: 60 FPS
- [ ] CI/CD integration:
  - [ ] Run performance tests on every PR
  - [ ] Fail if regression > 10%
  - [ ] Report metrics in PR
- [ ] Document in: `one/events/x402-performance.md`

---

## PHASE 9: DEPLOYMENT & DOCUMENTATION (Cycle 81-90)

**Purpose:** Deploy to production, document for users + developers

### Cycle 81: Set Up Production Environment Variables

- [ ] Update `.env` (root) with production values:
  - [ ] VITE_BLOCKCHAIN_RPC_BASE (Coinbase mainnet RPC)
  - [ ] VITE_BLOCKCHAIN_RPC_ETHEREUM (if needed)
  - [ ] X402_PAYMENT_ADDRESS_BASE (production treasury)
  - [ ] FACILITATOR_URL (production Coinbase endpoint)
  - [ ] FACILITATOR_API_KEY (production API key)
- [ ] Secure env vars:
  - [ ] Use Cloudflare secrets (not .env.local)
  - [ ] Rotate API keys quarterly
  - [ ] Audit access logs monthly
- [ ] Document in: `DEPLOYMENT.md`

### Cycle 82: Deploy Backend to Convex

- [ ] Ensure all backend changes committed:
  - [ ] `backend/convex/schema.ts` updated
  - [ ] `backend/convex/protocols/x402.ts` created
  - [ ] `backend/convex/services/x402-*.ts` created
  - [ ] `backend/convex/mutations/payments.ts` created
  - [ ] `backend/convex/queries/payments.ts` created
- [ ] Run deployment checks:
  - [ ] `npx convex dev` (local test)
  - [ ] TypeScript check passes
  - [ ] No schema breaking changes
- [ ] Deploy: `npx convex deploy`
- [ ] Verify in Convex dashboard

### Cycle 83: Build + Deploy Frontend to Cloudflare

- [ ] Build frontend:
  - [ ] `cd web && bun run build`
  - [ ] Type check: `bunx astro check`
  - [ ] Verify dist/ created
- [ ] Deploy to Cloudflare Pages:
  - [ ] `wrangler pages deploy dist --project-name=web`
  - [ ] Verify deployment URL: https://web.one.ie
  - [ ] Test in browser (smoke test)
- [ ] Monitor for errors:
  - [ ] Check DevTools console
  - [ ] Monitor Cloudflare logs

### Cycle 84: Verify Production Endpoints

- [ ] Test in production:
  - [ ] GET /api/agent/execute (without payment) → 402
  - [ ] POST /api/agent/execute (with payment) → 200
  - [ ] GET /api/payments/history → user's payments
  - [ ] GET /api/x402/config → config object
- [ ] Verify payment flows:
  - [ ] Create payment request
  - [ ] Verify payment
  - [ ] Settle payment
  - [ ] Check Convex logs
- [ ] Monitor for issues:
  - [ ] Error rates
  - [ ] Slow requests
  - [ ] Failed payments

### Cycle 85: Create User Documentation

- [ ] Write `web/public/docs/x402-user-guide.md`:
  - [ ] How to connect wallet
  - [ ] How to approve payments
  - [ ] How to view payment history
  - [ ] Supported networks
  - [ ] Minimum/maximum amounts
  - [ ] Troubleshooting section
  - [ ] FAQ
- [ ] Include screenshots:
  - [ ] Payment prompt
  - [ ] Wallet connection
  - [ ] Payment confirmation
  - [ ] Payment history

### Cycle 86: Create Developer Documentation

- [ ] Write `one/connections/x402-developer-guide.md`:
  - [ ] X402 protocol overview
  - [ ] How to protect endpoints with X402
  - [ ] How to handle 402 responses
  - [ ] Integration examples:
    - [ ] cURL
    - [ ] JavaScript/fetch
    - [ ] Python
    - [ ] Go
  - [ ] Error codes + meanings
  - [ ] Rate limiting info
  - [ ] Security best practices
- [ ] Code examples:

  ```bash
  # Request protected resource
  curl https://one.ie/api/agent/execute
  # → 402 Payment Required (with PaymentRequired body)

  # Make payment + retry
  curl -H "X-PAYMENT: {...}" https://one.ie/api/agent/execute
  # → 200 OK (with X-PAYMENT-ID header)
  ```

### Cycle 87: Create Integration Guide for Partners

- [ ] Write `one/connections/x402-integration-guide.md`:
  - [ ] High-level overview
  - [ ] When to use X402
  - [ ] How to onboard:
    1. Set payment requirements on endpoints
    2. Choose amount + description
    3. Choose networks
    4. Configure payout address
  - [ ] How to test:
    1. Use testnet (if available)
    2. Test 402 responses
    3. Test payment flows
  - [ ] How to monitor:
    - [ ] Payment history
    - [ ] Error rates
    - [ ] Settlement times
  - [ ] Support + troubleshooting

### Cycle 88: Write Architecture Decision Record (ADR)

- [ ] Create `one/events/adr-x402-integration.md`:
  - [ ] Context: Why X402?
  - [ ] Decision: Use X402 for micropayments
  - [ ] Consequences:
    - [ ] Positive: No payment infrastructure needed
    - [ ] Positive: Instant settlement
    - [ ] Positive: Blockchain transparent
    - [ ] Negative: Requires user wallet
    - [ ] Negative: Blockchain dependent
  - [ ] Alternatives considered:
    - [ ] Stripe/PayPal
    - [ ] Custom payment solution
  - [ ] Status: APPROVED/IN PROGRESS

### Cycle 89: Create Monitoring + Alerting

- [ ] Set up monitoring for:
  - [ ] Payment success rate (target 99%+)
  - [ ] Settlement time (target < 2s)
  - [ ] Facilitator availability (target 99.9%)
  - [ ] Blockchain RPC uptime (target 99.99%)
- [ ] Alerting rules:
  - [ ] Payment success rate < 95% → alert
  - [ ] Settlement time > 5s → alert
  - [ ] Facilitator down → alert
  - [ ] RPC down → alert
- [ ] Dashboard:
  - [ ] Real-time metrics
  - [ ] Payment volume
  - [ ] Revenue tracked
  - [ ] Error rate by type

### Cycle 90: Plan Maintenance + Updates

- [ ] Document maintenance schedule:
  - [ ] Monthly: Security updates
  - [ ] Quarterly: Dependency updates
  - [ ] Annually: Major version upgrades
- [ ] Runbooks:
  - [ ] How to handle facilitator outage
  - [ ] How to handle blockchain outage
  - [ ] How to handle security incident
  - [ ] How to rollback deployment
- [ ] Store in: `one/events/x402-maintenance.md`

---

## PHASE 10: KNOWLEDGE & LESSONS LEARNED (Cycle 91-100)

**Purpose:** Document learnings, capture institutional knowledge

### Cycle 91: Document Ontology Mapping

- [ ] Write `one/knowledge/x402-ontology-mapping.md`:
  - [ ] **Groups:** Merchant group, customer group, platform
  - [ ] **People:** Platform owner, merchant, customer
  - [ ] **Things:** payment, external_agent, product
  - [ ] **Connections:** transacted, communicated, delegated
  - [ ] **Events:** payment_event (with protocol: x402)
  - [ ] **Knowledge:** payment_method, x402_scheme labels
- [ ] Use 6-dimension framework throughout
- [ ] Show examples of real data structures

### Cycle 92: Create Payment Flow State Diagram

- [ ] Create `one/events/x402-state-diagram.md` with diagram:
  ```
  [ initial ] --request_payment--> [ payment_required ]
         ^                               |
         |                         user_initiates_payment
         |                               ↓
         +--- [verify_failed] <-- [ payment_signing ]
         |                               |
         |                        user_signs_permit
         |                               ↓
         +--- [verify_success] <-- [ verification ]
                                         |
                                  facilitator_confirms
                                         ↓
                                    [ settled ]
  ```
- [ ] Document transitions:
  - [ ] Timeout: 5 minutes in any state
  - [ ] Retry: User can retry on failure
  - [ ] Settlement: Happens automatically after verification

### Cycle 93: Document Security Considerations

- [ ] Write `one/connections/x402-security.md`:
  - [ ] **Signature Verification:** User signature proves authorization
  - [ ] **Replay Protection:** Each txHash used only once
  - [ ] **Amount Validation:** Check >= required
  - [ ] **Recipient Validation:** Check = treasury address
  - [ ] **Expiry:** Payment request valid 5 minutes
  - [ ] **Rate Limiting:** 10 requests/min per user
  - [ ] **Facilitator Verification:** Trust Coinbase CDP
  - [ ] **Blockchain Finality:** Verify 1+ confirmations on Base
- [ ] Known risks:
  - [ ] User sends to wrong address (no recovery)
  - [ ] Private key compromised (wallet issue, not ours)
  - [ ] Blockchain reorg (very unlikely on Base)
  - [ ] Facilitator breach (trust issue)

### Cycle 94: Document Blockchain Specifics

- [ ] Write `one/connections/x402-blockchain.md`:
  - [ ] **Base Network:**
    - [ ] Chain ID: 8453
    - [ ] Block time: ~2 seconds
    - [ ] Finality: 1 block (~2 seconds)
    - [ ] USDC address: 0x833589fcd6edb6e08f4c7c32d4f71b54bda02913
    - [ ] Average cost per transaction: $0.0001
  - [ ] **Permit Support:**
    - [ ] ERC-2612 standard
    - [ ] No separate approval needed
    - [ ] Deadline: must be > current block timestamp
    - [ ] Nonce: auto-incrementing for each permit
  - [ ] **Token Contracts:**
    - [ ] USDC decimals: 6
    - [ ] Balance queries: eth_call (read-only)
    - [ ] Transfer: state-changing transaction

### Cycle 95: Capture Performance Benchmarks

- [ ] Write `one/events/x402-performance-benchmarks.md`:
  - [ ] **Payment Creation:** 50-100ms
  - [ ] **Permit Generation:** 30-50ms
  - [ ] **User Signature:** 2-5s (user-dependent)
  - [ ] **Facilitator Verification:** 200-300ms
  - [ ] **Blockchain Settlement:** 1-2s (on Base)
  - [ ] **Total E2E Time:** 4-8s
  - [ ] **UI Responsiveness:** 60 FPS (payment modal)
  - [ ] **Bundle Size:** 45KB gzipped (payment module)
  - [ ] **Cache Hit Rate:** 85%+ for config/history
- [ ] Comparison to alternatives:
  - [ ] Stripe: 1-3s (no blockchain wait)
  - [ ] PayPal: 2-5s (no blockchain wait)
  - [ ] X402: 4-8s (includes blockchain settlement)

### Cycle 96: Document Common Issues + Solutions

- [ ] Write `one/connections/x402-troubleshooting.md`:
  - [ ] **Issue: Payment times out**
    - [ ] Cause: Facilitator slow or down
    - [ ] Solution: Retry after 5 minutes
  - [ ] **Issue: "Insufficient Balance"**
    - [ ] Cause: User balance < payment amount
    - [ ] Solution: Show user balance, suggest adding funds
  - [ ] **Issue: "Wrong Recipient"**
    - [ ] Cause: Payment sent to wrong address
    - [ ] Solution: Show treasury address before signing
  - [ ] **Issue: "Permit Signature Invalid"**
    - [ ] Cause: User canceled signing
    - [ ] Solution: Show error, let user retry
  - [ ] **Issue: "Network Mismatch"**
    - [ ] Cause: User on wrong blockchain
    - [ ] Solution: Auto-switch or show dialog
  - [ ] **Issue: "Replay Protection Triggered"**
    - [ ] Cause: User tried same payment twice
    - [ ] Solution: Create new payment request

### Cycle 97: Create Cost Analysis Report

- [ ] Write `one/events/x402-cost-analysis.md`:
  - [ ] **Blockchain Costs:**
    - [ ] Base: $0.0001 per payment
    - [ ] Ethereum: $1-5 per payment (high)
    - [ ] Solana: $0.00001 per payment (future)
  - [ ] **Facilitator Costs:**
    - [ ] Coinbase CDP: Free (for now)
  - [ ] **Infrastructure Costs:**
    - [ ] Convex: Included in platform costs
    - [ ] Cloudflare: Included in platform costs
    - [ ] RPC Provider: $100-500/month (if own node)
  - [ ] **Revenue Potential:**
    - [ ] If 1000 payments/day at $0.01 = $10/day
    - [ ] At 80% markup = $2/day profit
    - [ ] Annualized: $730/year at current volume
  - [ ] **Break-even Analysis:**
    - [ ] Need 10+ payments/day to offset costs

### Cycle 98: Plan Future Enhancements

- [ ] Document Phase 2+ features in `one/things/todo-x402-phase2.md`:
  - [ ] [ ] Bazar marketplace discovery layer
  - [ ] [ ] Multi-chain support (Ethereum, Solana, Polygon)
  - [ ] [ ] Invoice payment scheme
  - [ ] [ ] Signature-based payments
  - [ ] [ ] Refund mechanism
  - [ ] [ ] Revenue distribution to merchants
  - [ ] [ ] Subscription-based payments
  - [ ] [ ] Conditional payments (if/then logic)
  - [ ] [ ] Payment analytics dashboard
  - [ ] [ ] Webhook notifications on payment
  - [ ] [ ] Custom facilitator support
  - [ ] [ ] Stablecoin alternatives (USDT, DAI)
- [ ] Prioritize by impact + effort

### Cycle 99: Create Lessons Learned Document

- [ ] Write `one/events/x402-lessons-learned.md`:
  - [ ] **What went well:**
    - [ ] Coinbase CDP integration smooth
    - [ ] Permit-based payments have great UX
    - [ ] Base network perfect for micropayments
  - [ ] **What was challenging:**
    - [ ] Wallet integration complexity
    - [ ] Blockchain async operations
    - [ ] Testing with real wallets
  - [ ] **What we'd do differently:**
    - [ ] Start with testnet longer
    - [ ] Build more test utilities earlier
    - [ ] Design payment history upfront
  - [ ] **Skills gained:**
    - [ ] ERC-2612 permits
    - [ ] Facilitator patterns
    - [ ] Blockchain integration testing
  - [ ] **Team feedback:**
    - [ ] Quotes from team members
    - [ ] What they learned

### Cycle 100: Final Summary + Celebration

- [ ] Create `one/events/x402-phase1-complete.md`:
  - [ ] **Project Status:** ✅ COMPLETE
  - [ ] **Timeline:** Cycle 1-100 (100 cycles)
  - [ ] **Delivered:**
    - [ ] [x] HTTP 402 protocol implementation
    - [ ] [x] X402PaymentService (Effect.ts)
    - [ ] [x] Blockchain integration (Base)
    - [ ] [x] Frontend components (React)
    - [ ] [x] Astro API routes (protected)
    - [ ] [x] Payment history tracking
    - [ ] [x] Full E2E testing
    - [ ] [x] Production deployment
    - [ ] [x] Complete documentation
  - [ ] **Next Steps:**
    - [ ] Monitor production metrics
    - [ ] Gather user feedback
    - [ ] Plan Phase 2 features
  - [ ] **Thank you message:**
    - [ ] Credit to team
    - [ ] Thanks to Coinbase for CDP
    - [ ] Thanks to users for feedback
  - [ ] 🎉 **X402 Phase 1 Complete!**

---

## SUCCESS CRITERIA

X402 integration is complete when:

- ✅ HTTP 402 responses sent from Astro API routes
- ✅ X-PAYMENT header validation working end-to-end
- ✅ Blockchain payment verification via Coinbase facilitator
- ✅ Payment events logged in Convex events table
- ✅ Payment history queryable + filterable
- ✅ Frontend components (React) render correctly
- ✅ UI shows payment prompt + wallet connection
- ✅ Demo: Request → 402 → payment → access
- ✅ 3+ protected endpoints (agent, provider, workflow)
- ✅ All tests passing (80%+ coverage)
- ✅ Performance baselines established
- ✅ Production deployment verified
- ✅ Documentation complete (user + developer)
- ✅ Architecture documented in ontology
- ✅ Lessons learned captured

---

## QUICK REFERENCE

**Files Created:**

- `backend/convex/protocols/x402.ts` - Type definitions
- `backend/convex/services/x402-payment.ts` - Payment service
- `backend/convex/services/x402-facilitator.ts` - Facilitator service
- `backend/convex/services/blockchain-provider.ts` - Blockchain client
- `backend/convex/config/x402-config.ts` - Configuration
- `backend/convex/mutations/payments.ts` - Convex mutations
- `backend/convex/queries/payments.ts` - Convex queries
- `web/src/components/features/PaymentRequired.tsx` - Component
- `web/src/components/features/WalletConnection.tsx` - Component
- `web/src/components/features/PaymentProcessor.tsx` - Component
- `web/src/pages/api/agent/execute.ts` - API route
- `web/src/pages/api/provider/[providerId]/call.ts` - API route
- `web/src/pages/api/payments/verify.ts` - API route
- `web/src/pages/demo/x402-payments.astro` - Demo page
- `one/connections/x402-architecture.md` - Architecture docs
- `one/connections/x402-developer-guide.md` - Developer docs
- `one/connections/x402-security.md` - Security docs

**Environment Variables Required:**

- `VITE_BLOCKCHAIN_RPC_BASE` - Base network RPC URL
- `X402_PAYMENT_ADDRESS_BASE` - Treasury address
- `FACILITATOR_URL` - Coinbase CDP endpoint
- `FACILITATOR_API_KEY` - API key (if needed)

**Tests to Write:**

- Unit tests (payment services)
- Integration tests (E2E payment flow)
- Component tests (React components)
- API route tests (Astro endpoints)
- Security tests (replay, validation)
- Performance tests (benchmarks)

---

**Remember:** Plan in cycles, not days. Where in the sequence does each thing belong?

**Status:** Ready for execution. Begin with Cycle 1-10 (Foundation).
