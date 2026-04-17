---
title: X402 Baazar
dimension: connections
category: x402-baazar.md
tags: agent, ai, blockchain, marketplace, protocol
related_dimensions: events, knowledge, things
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the connections dimension in the x402-baazar.md category.
  Location: one/connections/x402-baazar.md
  Purpose: Documents X402 Baazar - API marketplace for AI agents
  Related dimensions: events, knowledge, things
  For AI agents: Read this to understand X402 Baazar integration.
---

# X402 Baazar - AI Agent API Marketplace

**Protocol:** [X402](https://www.x402.org/)
**Baazar Layer:** API Discovery and Marketplace
**Developer:** Coinbase Developer Platform (CDP)

---

## Overview

**X402 Baazar** is the discovery layer built on top of the X402 payment protocol. It creates an open marketplace where AI agents can discover, compare, and access APIs instantly without manual account setup, API keys, or subscriptions.

### The Problem with Traditional API Marketplaces

Traditional API marketplaces (RapidAPI, AWS Marketplace, etc.) require:
- ❌ Manual account creation
- ❌ API key management
- ❌ Subscription setup
- ❌ Billing configuration
- ❌ Human intervention

**Result:** AI agents cannot operate autonomously.

### The X402 + Baazar Solution

**Baazar (Discovery Layer)** + **X402 (Payment Protocol)** = Autonomous API Access

```
┌─────────────────────────────────────────────────────────────────┐
│                         Baazar Layer                             │
│  - API Discovery                                                 │
│  - Provider Comparison                                           │
│  - Service Listings                                              │
│  - Capability Matching                                           │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│                         X402 Layer                               │
│  - Instant Payments (USDC, Base network)                         │
│  - No accounts or API keys                                       │
│  - Pay-per-request billing                                       │
│  - Facilitator verification                                      │
└─────────────────────────────────────────────────────────────────┘
```

✅ AI agents can discover, compare, and pay for APIs autonomously
✅ No human intervention required
✅ No accounts, no API keys, no subscriptions

---

## Multi-Tenancy & Groups

All X402 services, payments, and interactions are scoped to a `groupId`:

```typescript
// Every entity
{
  groupId: Id<"groups">,  // Required for multi-tenancy
  type: "x402_service" | "payment" | "agent",
  // ... rest of fields
}

// Every connection
{
  groupId: Id<"groups">,  // Required for multi-tenancy
  fromEntityId: Id<"entities">,
  toEntityId: Id<"entities">,
  relationshipType: "uses_service" | "pays_for",
  // ... rest of fields
}

// Every event
{
  groupId: Id<"groups">,  // Required for multi-tenancy
  type: "x402_service_discovered" | "payment_verified",
  // ... rest of fields
}
```

This enables:
- Organizations to publish their own X402 services
- Group-level billing and analytics
- Isolated service catalogs per group
- Multi-tenant payment tracking

---

## Resources

- **X402 Protocol**: https://www.x402.org/
- **Coinbase CDP**: https://www.coinbase.com/cloud/products/cdp
- **Baazar Catalog**: https://baazar.x402.org/
- **GitHub**: https://github.com/coinbase/x402
- **Express Middleware**: https://www.npmjs.com/package/x402-express
- **Client SDK**: https://www.npmjs.com/package/x402-fetch
- **ONE X402 Integration**: See `one/connections/x402.md`

---

## Summary

**X402 + Baazar** represents the future of AI agent infrastructure:

1. **Baazar** = API discovery and marketplace
2. **X402** = Instant, trustless payments
3. **Facilitator** = On-chain verification
4. **SDK** = Autonomous payment handling

**Result:** AI agents can discover, compare, and autonomously pay for any API service without human intervention.

The combination enables a truly autonomous agent economy where services are discovered, priced, and paid for programmatically. ONE Platform's early adoption positions us as a leader in the emerging agent-to-agent commerce ecosystem.
