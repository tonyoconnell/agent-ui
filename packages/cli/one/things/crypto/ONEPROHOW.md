# How ONE Pro Works: The "Invisible" Engine

## The Friction Problem

In the Core model, the user has to pay gas on the destination chain to claim their tokens. **Problem:** If a user pays in SOL, they likely _don't have ETH_ on Base to pay for gas. **Result:** They abandon the cart.

ONE Pro solves this with the **Concierge Protocol**.

## The "Gasless" Flow

### 1. The Identity Lock

When the user enters the chat or website, they provide an Email or Telegram ID.

- **The Foundry:** We deterministically derive a unique **Deposit Wallet** for them.
    
- **Benefit:** They don't need to connect a wallet. They just need to send funds to that address.
    

### 2. The "Invisible Fee" Quote

The user asks to buy 10,000 Tokens ($100).

- **Worker:** Calculates the destination gas cost (e.g., $0.50 on Base).
    
- **Quote:** The Worker charges the user **$100.50** in SOL.
    
- **Psychology:** The user sees one price. They don't know they are paying for gas.
    

### 3. The Concierge Execution

The user sends the SOL.

- **Worker:** Detects the payment.
    
- **Relayer:** The Worker uses its own hot wallet to pay the $0.50 ETH gas fee and executes the mint on Base _for_ the user.
    
- **User Experience:** **Zero Clicks.** They send SOL, and the tokens simply appear in their destination wallet (or Identity Wallet).
    

### 4. The Smart Sweep

Every 10 minutes, the **Smart Sweeper** runs.

- It scans all Identity Wallets.
    
- It consolidates the SOL into your Cold Storage.
    
- It updates the internal CRM ledger.
    

**Result:** 40% Higher Conversion Rates because the "Gas Wall" is gone.