# ONE Empire: Agency Reseller Kit (Tier 3)

Congratulations. You now own the **ONE Protocol** source code and the rights to deploy it for your clients.

This kit allows you to charge **$5,000 - $15,000** for a custom "Cross-Chain Launchpad" implementation.

## 📦 What's Inside?

1. **`backend/`**: The ONE Pro Worker (Identity + Concierge + AI). Deploy this to Cloudflare.
    
2. **`web/`**: The "Golden Template" Astro site. High-conversion design ready for branding.
    
3. **`bots/`**: Telegram & Discord bots that connect to the backend.
    

## 💰 How to Resell This (The Playbook)

### Scenario: Client Launching a Memecoin on Base

Your client wants to raise funds but is afraid Solana users won't bridge.

**Step 1: Deployment (Backend)**

1. Create a new Cloudflare Worker for the client.
    
2. Generate a `MASTER_SECRET` for them.
    
3. Set their Cold Wallet addresses in `wrangler.toml`.
    
4. Deploy `one-pro` code.
    

**Step 2: Deployment (Frontend)**

1. Open `web/src/pages/index.astro`.
    
2. Update `PROJECT_NAME` and `TOKEN_NAME`.
    
3. Change the colors in Tailwind config to match their brand.
    
4. Deploy to Vercel/Netlify.
    

**Step 3: Deliver Value**

- Hand them the **Admin Dashboard** URL.
    
- Set up the **Telegram Bot** for their community group.
    
- Charge them a **Setup Fee ($5k)** and a **Monthly Retainer ($500)** to "maintain" the worker (even though it needs zero maintenance).
    

## ⚠️ White Label Rules

- You **CAN** remove the "Powered by ONE" branding.
    
- You **CAN** rebrand the code as your own "proprietary launchpad technology."
    
- You **CANNOT** resell the source code itself on Gumroad/CodeCanyon. You must provide it as a service or a compiled end-product to a client.
    

## 🚀 Support

If you need help with a complex client deployment, contact the ONE Enterprise team for priority support.