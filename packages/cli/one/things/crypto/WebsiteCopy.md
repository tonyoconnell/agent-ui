# Website Copy & Structure

## PAGE: Home (/)

**Theme:** Convergence. **Goal:** Establish authority immediately.

$$Hero Section$$

**Headline:** The Universal Commerce Layer. **Subheadline:** Accept ETH, SOL, BTC, and USDC on any chain. Settle instantly on yours. No bridges. No wrapping. **Primary CTA:**

$$Deploy Your Node$$

**Secondary CTA:**

$$Read the Protocol$$$$The "Problem" Section - "The Fragmentation"$$

**Headline:** The Internet of Value is Broken. **Copy:** To move value from Chain A to Chain B, the world currently relies on a fragile architecture of bridges, wrapped assets, and 15-minute waiting periods. Merchants lose 40% of conversions to "Wrong Network" errors. Founders lose liquidity because investors refuse to bridge. The friction is not a bug. It is a design flaw.

$$The "Solution" Section - "The Convergence"$$

**Headline:** We Didn't Build a Better Bridge. We Removed the Water. **Copy:** ONE is a stateless payment protocol built on the **x402 Standard**. It treats every blockchain as a simple data source.

- **Identity is ONE:** A user's Email or Telegram ID creates a deterministic, permanent wallet on every chain instantly.
    
- **Liquidity is ONE:** A payment in SOL is cryptographically recognized as a settlement on Base in milliseconds.
    
- **Experience is ONE:** The user never leaves the chat. The user never leaves the flow.
    

$$Feature Grid - "The Infrastructure"$$

1. **The Identity Foundry:**
    
    - _Copy:_ Stop asking users to connect wallets. We derive permanent deposit addresses from their digital identity. Zero database. 100% Sovereign.
        
2. **The Concierge Relayer (Pro Feature):**
    
    - _Copy:_ **Stop forcing users to pay gas.** In standard protocols, users must pay ETH to claim their tokens. Our Pro "Invisible Fee" engine handles network costs on the destination chain for them. They pay. They receive. You profit.
        
3. **The Smart Sweeper:**
    
    - _Copy:_ Automated asset consolidation. Funds are swept from thousands of identity wallets to your cold storage on a configurable heartbeat.
        

## PAGE: The x402 Protocol (/protocol)

**Theme:** The Technical Truth. **Goal:** Prove superiority over Coinbase/BitPay without naming them directly.

$$The Concept$$

**Headline:** Settlement is Slow. Signaling is Instant. **Copy:** Traditional payment gateways act like banks. They wait for funds to "clear" and "settle" into their custody before releasing a product. This creates latency and centralization risk.

**ONE uses Optimistic x402.** We decouple **Verification** (The Signal) from **Settlement** (The Movement).

$$The Comparison$$

**The Custodial Model (The Old Way):**

1. User sends funds.
    
2. Gateway waits for 6 confirmations (~20 mins).
    
3. Gateway moves funds to their hot wallet.
    
4. Gateway updates a SQL database.
    
5. User gets product.
    

**The x402 Model (The ONE Way):**

1. User sends funds.
    
2. **The Worker Oracle** detects the transaction in the mempool (0ms).
    
3. **The Worker** signs a cryptographic "Permission Coupon."
    
4. User gets product instantly.
    
5. Funds settle lazily in the background.
    

**Impact:**

- **Latency:** Reduced from Minutes to Milliseconds.
    
- **Gas Costs:** Reduced by 90% (via Batch Sweeping).
    
- **Security:** Fail-Closed. The Oracle holds signing keys, not treasury keys.
    

## PAGE: Pricing (/pricing)

**Theme:** Ownership vs. Renting. **Goal:** Push the "Pro" and "Empire" tiers.

$$The Philosophy$$

**Headline:** Stop Renting Your Infrastructure. **Copy:** SaaS payment gateways charge 1% forever and can deplatform you tomorrow. ONE is different. You buy the Source Code. You deploy the Node. You own the Bank.

$$The Tiers$$

#### 1. ONE Core (The Protocol) - $299

_For developers who want the raw infrastructure._

- **Includes:** The Universal Worker, Solidity/Move Contracts, React Components.
    
- **Capability:** Accept Any Token, Settle Anywhere.
    
- **Model:** **Signature Mode** (User pays destination gas to claim).
    

#### 2. ONE Pro (The Business) - $997 (Recommended)

_For merchants who demand maximum conversion._

- **Includes:** Everything in Core + **The Automation Layer**.
    
- **The Concierge:** **Gasless Relayer** (We pay gas -> Conversion +40%).
    
- **The Foundry:** Identity-Based Wallet Generation.
    
- **The Agent:** AI Sales Chatbot for automated closing.
    
- **The Subscription:** Recurring crypto billing engine.
    

#### 3. ONE Empire (The Franchise) - $3,997

_For agencies and founders launching platforms._

- **Includes:** Everything in Pro + **White Label Rights**.
    
- **The Template:** Full Astro Landing Page Source Code.
    
- **The Scale:** Unlimited Client Deployments.
    
- **The Support:** Priority "White Glove" Installation.
    

## PAGE: Documentation (/docs)

**Theme:** Simplicity. **Goal:** Show how easy it is to deploy.

$$Quickstart$$

**Headline:** Deploy in 5 Minutes.

**Step 1: Configure Secrets**

```
npx wrangler secret put MASTER_SECRET
npx wrangler secret put WORKER_PRIVATE_KEY

```

**Step 2: Deploy Worker**

```
npm run deploy

```

**Step 3: Drop-in Component**

```
import { UniversalPay } from '@one-protocol/react';

<UniversalPay 
  amount={100} 
  recipient="your_treasury_address" 
/>

```

**That's it. You are now a global bank.**