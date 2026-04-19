# FAQ: ONE Core

### Technical & Security

**Q: Is this a hosted API?** **A:** No. ONE Core is source code that you deploy to your _own_ Cloudflare account. We do not host it. We do not see your data. You are the sovereign owner of the infrastructure.

**Q: Do I need a server?** **A:** No. The backend runs on **Cloudflare Workers** (Serverless). It scales to zero when not in use and handles millions of requests automatically. The free tier of Cloudflare is usually sufficient for small to medium projects.

**Q: How do you prevent double-spending without a database?** **A:** We use **Deterministic Nonces**. The Worker hashes the payment transaction ID (e.g., `keccak256(txHash)`). The destination smart contract tracks these nonces in a mapping. If a user tries to claim the same payment twice, the contract reverts because the nonce is already marked as used.

**Q: Which chains are supported out of the box?** **A:**

- **Source (Payment):** Ethereum, Base, Arbitrum, Optimism, Polygon, Solana, Bitcoin.
    
- **Destination (Settlement):** Any EVM Chain (Ethereum, Base, BSC, etc.) and Sui (Move).
    

**Q: Does the user pay gas?** **A:** Yes, in the **Core** tier. The user pays the gas fee on the destination chain to submit the "Claim" transaction. If you want to pay gas for them (Gasless), you need the **Pro** tier.

**Q: Is the code audited?** **A:** The smart contracts use standard OpenZeppelin libraries (EIP-712) and simple checks-effects-interactions patterns. However, as with any self-hosted financial software, you are responsible for your final deployment security.

**Q: Can I customize the React component?** **A:** Yes. You get the full source code for `<UniversalPay />`. You can style it with Tailwind, CSS Modules, or whatever you prefer. It is headless-ready.