# ONE Contracts - Universal Smart Contract Platform

> **Note**: The production Sui smart contracts are located at `apps/one-core/contracts/sui/`
> This directory contains the universal entity contract specification that integrates with the ONE Protocol.

## Related Files

- **Production Contracts**: `apps/one-core/contracts/sui/`
  - `gateway.move` - Payment verification gateway (1% protocol fee)
  - `merchant.move` - HD wallet merchant authorization
  - `subscription.move` - Recurring payment management
  - `credits.move` - Prepaid credit system
  - `verifier.move` - Signature verification

- **TypeScript SDK**: `apps/one-core/packages/one-protocol/`
  - Full TypeScript SDK with Zod schemas
  - Protocol definitions for Sui, EVM, Solana
  - Published as `one-protocol` on npm

## Philosophy: Sui as a Database

The ONE Contract represents a paradigm shift in how we think about smart contracts. Instead of building specialized contracts for each use case (NFT contract, token contract, marketplace contract), we've created a **universal container** that can represent ANY entity.

**Why Sui?**

Sui's object model is revolutionary because:
1. **Objects exist in parallel** - No global state bottleneck
2. **Objects ARE the database** - Each object has a unique ID, can be queried, transferred
3. **Composability** - Objects can contain other objects
4. **Instant finality** - Sub-second transactions
5. **Low cost** - Parallel execution = lower fees

## The Universal Entity Model

```
┌─────────────────────────────────────────────────────────────┐
│                    ONE CONTRACT                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Entity {                                                   │
│     entity_type: product | subscription | lesson | ...      │
│     name: String                                            │
│     price: u64                                              │
│     metadata: JSON (flexible attributes)                    │
│   }                                                          │
│                                                              │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│   │   Product   │  │Subscription │  │   Lesson    │         │
│   │  type: 1    │  │   type: 2   │  │   type: 3   │         │
│   └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│   │ Membership  │  │ Credential  │  │Event Ticket │         │
│   │  type: 4    │  │   type: 5   │  │   type: 9   │         │
│   └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Supported Entity Types

| Type | ID | Use Case |
|------|-----|----------|
| Product | 1 | Physical/digital goods, downloads, files |
| Subscription | 2 | Recurring access, SaaS, memberships |
| Lesson | 3 | Courses, tutorials, educational content |
| Membership | 4 | Club access, community membership |
| Credential | 5 | Certificates, badges, achievements |
| Token | 6 | Fungible tokens, loyalty points |
| NFT | 7 | Unique collectibles, art, 1/1s |
| Access Pass | 8 | Gated content, premium features |
| Event Ticket | 9 | Concerts, conferences, meetups |
| Digital Good | 10 | Software, plugins, templates |
| Service | 11 | Consulting, support, services |
| License | 12 | Software licenses, usage rights |

## How It Works

### 1. Merchant Registration
```move
register_merchant(registry, "Acme Store", metadata, clock, ctx)
// Returns: Merchant object + MerchantCap (ownership proof)
```

### 2. Create Any Entity
```move
// Universal function - just change entity_type
create_entity(merchant, cap, ENTITY_PRODUCT, "Cool Thing", desc, price, supply, metadata, clock, ctx)

// Or use typed helpers
create_product(merchant, cap, "Cool Product", ...)
create_subscription(merchant, cap, "Pro Plan", ...)
create_lesson(merchant, cap, "Learn Move", ...)
create_event_ticket(merchant, cap, "SuiCon 2025", ...)
```

### 3. Purchase & Ownership
```move
purchase_entity(registry, merchant, entity, payment, expires_in_ms, clock, ctx)
// Returns: Ownership object to buyer
```

### 4. Secondary Market
```move
list_for_sale(ownership, price, clock, ctx)
buy_listing(listing, payment, clock, ctx)
```

## Metadata Flexibility

The `metadata` field is a JSON string that allows ANY attributes. Examples:

**Product:**
```json
{
  "image_url": "https://...",
  "category": "electronics",
  "weight_kg": 0.5,
  "dimensions": { "w": 10, "h": 5, "d": 2 }
}
```

**Subscription:**
```json
{
  "duration_ms": 2592000000,
  "features": ["feature1", "feature2"],
  "tier": "pro",
  "auto_renew": true
}
```

**Lesson:**
```json
{
  "duration_minutes": 90,
  "instructor": "John Doe",
  "materials": ["pdf", "video"],
  "difficulty": "intermediate"
}
```

**Event Ticket:**
```json
{
  "event_date": 1735689600000,
  "venue": "Moscone Center",
  "seat": "A-123",
  "vip": true
}
```

## Integration with ONE Platform

The ONE Contract maps directly to the 6-dimension ontology:

| Dimension | Contract Mapping |
|-----------|-----------------|
| **Things** | Entity, Ownership, Merchant |
| **People** | Merchant (creators), Buyers (owners) |
| **Groups** | Merchant = Group of products |
| **Connections** | Ownership = Connection between buyer and entity |
| **Events** | All on-chain events (Created, Purchased, Listed) |
| **Knowledge** | Metadata fields, entity types |

## Convex Integration

```typescript
// Store entity reference in Convex
await db.insert("entities", {
  type: "product",
  name: "Cool Product",
  properties: {
    network: "sui",
    objectId: entity.id,
    packageId: "0x...",
    merchantId: merchant.id,
    price: 1000000000,
    metadata: JSON.parse(entity.metadata)
  },
  status: "active"
});

// Query owned items
const ownerships = await suiClient.getOwnedObjects({
  owner: userAddress,
  filter: { StructType: "one::one::Ownership" }
});
```

## SDK Usage (one-protocol)

```typescript
import { 
  sui_create_entity, 
  sui_purchase_entity,
  sui_get_ownerships,
  ONE_ENTITY_TYPES,
  getEntityTypeName 
} from 'one-protocol/protocols';

// Create a product
const result = await registry.execute({
  protocol: 'sui_create_entity',
  data: {
    packageId: '0x...',
    merchantId: '0x...',
    merchantCapId: '0x...',
    entityType: ONE_ENTITY_TYPES.PRODUCT,
    name: 'Premium Course',
    description: 'Learn Move development',
    price: '1000000000', // 1 SUI
    maxSupply: '100',
    metadata: {
      image_url: 'https://...',
      category: 'education'
    }
  }
});

// Purchase an entity
const purchase = await registry.execute({
  protocol: 'sui_purchase_entity',
  data: {
    packageId: '0x...',
    registryId: '0x...',
    merchantId: '0x...',
    entityId: result.entityId,
    paymentCoinId: '0x...',
  }
});

// Get user's ownerships
const ownerships = await registry.execute({
  protocol: 'sui_get_ownerships',
  data: {
    owner: userAddress,
    packageId: '0x...',
    entityType: ONE_ENTITY_TYPES.SUBSCRIPTION,
  }
});
```

## Why This Design?

1. **One Contract to Rule Them All** - No need to deploy separate contracts for each product type
2. **Sui as Database** - Object IDs are like primary keys, queryable and transferable
3. **Parallel Execution** - Each entity is independent, no bottlenecks
4. **Composable** - Entities can reference other entities via metadata
5. **Flexible** - JSON metadata allows any attributes without contract upgrades
6. **Efficient** - Single purchase function handles all entity types

## Files

- `one.move` - Main universal contract
  - `one::one` - Core entity, merchant, ownership logic
  - `one::market` - Secondary marketplace

## Deployment

```bash
# Build
sui move build

# Test
sui move test

# Deploy to testnet
sui client publish --gas-budget 100000000

# Deploy to mainnet
sui client publish --gas-budget 100000000 --network mainnet
```

## Events for Indexing

All events include timestamps and can be subscribed to for real-time updates:

- `MerchantCreated` - New seller registered
- `EntityCreated` - New product/subscription/etc created
- `EntityPurchased` - Someone bought something
- `ItemListed` - Secondary market listing
- `ItemSold` - Secondary market sale
- `ListingCanceled` - Seller canceled listing

---

*The ONE Contract: Because everything is just a Thing with attributes.*
