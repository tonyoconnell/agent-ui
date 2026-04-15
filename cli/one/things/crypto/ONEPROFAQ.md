# FAQ: ONE Pro

### The Concierge & Automation

**Q: How does the "Gasless" mode work? Do I lose money?** **A:** No. Our "Invisible Fee" engine automatically adds a small buffer (e.g., $0.50) to the quote you give the customer. When the customer pays, you collect that extra $0.50. Your Worker then uses that collected money to pay the gas fee on the destination chain. It is net-neutral or even profitable for you.

**Q: What if gas fees spike suddenly?** **A:** ONE Pro includes a **Profit Protection Circuit Breaker**. Before submitting a transaction, the Worker checks the live network gas price. If the cost to mint is higher than the fee you collected, the transaction is paused and added to a **Queue**. It will retry when gas prices normalize, ensuring you never mint at a loss.

**Q: How does the Identity Wallet work?** **A:** We use a cryptographic method called **HMAC Key Derivation**. When a user enters their email, we combine it with your `MASTER_SECRET` to generate a unique private key. This means `alice@gmail.com` will _always_ generate the same wallet address on your system, without you needing to store a database of keys. It is secure, stateless, and permanent.

**Q: Is this custodial? Do you hold my funds?** **A:** **Absolutely not.** The system is "Fail-Closed."

1. User funds go to their generated Identity Wallet.
    
2. The **Smart Sweeper** moves those funds to _your_ Cold Wallet (Ledger/Trezor) every 10 minutes.
    
3. We (ONE Protocol) never have access to your keys or your funds.
    

**Q: Can I use this for subscriptions?** **A:** Yes. The Pro tier includes a **Credit Ledger**. Users can top up their Identity Wallet with $100, and your system can programmatically deduct $10/month from their internal balance without paying gas fees for every monthly charge.

**Q: Do I need to know how to code?** **A:** You need basic familiarity with the command line (Terminal) to run the initial setup script. Once deployed, the system runs itself. If you prefer, you can purchase our **"Done-For-You" Installation Service** at checkout.