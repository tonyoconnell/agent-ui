# How ONE Core Works: The x402 Standard

## The Paradigm Shift

Traditional payment gateways (Stripe, Coinbase) are **Custodial Databases**. They wait for funds to settle in _their_ wallet before updating a SQL row to say "Paid." This is slow (block times) and centralized.

ONE Core is a **Stateless Signaling Protocol**. We decouple **Verification** from **Settlement**.

## The 4-Step Signal Flow

### 1. The Intent

The user selects a product and a payment chain (e.g., Solana).

- **Frontend:** Fetches a live rate from the Worker Oracle (e.g., 1000 ONE = 1.5 SOL).
    
- **Action:** User sends 1.5 SOL to your Treasury Address.
    

### 2. The Signal (x402)

The user sends the Transaction Hash (`tx_123abc`) to the ONE Worker.

- **Worker:** Queries the Solana RPC. "Did `tx_123abc` move 1.5 SOL to `Treasury`?"
    
- **Result:** **True.** (This happens in milliseconds).
    

### 3. The Authorization (The Coupon)

Instead of moving funds, the Worker signs a **Cryptographic Coupon** (EIP-712 or Ed25519).

> _"I, the ONE Oracle, certify that User X paid 1.5 SOL. Authorized to mint 1000 ONE on Base."_

### 4. The Execution

The Frontend receives the Coupon and prompts the user to sign a "Claim" transaction on the destination chain (Base).

- **Contract:** Verifies the Worker's signature.
    
- **Contract:** Checks the Nonce (Anti-Replay).
    
- **Result:** Tokens are minted instantly.
    

**Latency:** ~5 Seconds. **Gas Cost:** User pays destination gas. **Security:** Fail-Closed. Worker holds no funds.