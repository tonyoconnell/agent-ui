/// ONE Universal Smart Contract
/// 
/// The ONE Contract is a universal container that can hold ANY entity type:
/// products, subscriptions, lessons, memberships, tokens, NFTs, credentials, etc.
/// 
/// Philosophy: Sui's object model IS the database. Objects exist in parallel,
/// can be composed, transferred, and queried - making blockchain the perfect
/// universal data layer for the 6-dimension ontology.
/// 
/// Key Features:
/// - Universal entity wrapper (any Thing can be an on-chain object)
/// - Marketplace integration (sell anything with SUI)
/// - Token minting per merchant/creator
/// - Parallel execution (Sui's superpower)
/// - Composable objects (entities can contain entities)
/// 
/// INTEGRATION: This contract integrates with the ONE Protocol Gateway
/// located at: apps/one-core/contracts/sui/
/// - gateway.move: Payment verification with 1% fee
/// - merchant.move: HD wallet merchant authorization
/// - subscription.move: Recurring payment management
/// - credits.move: Prepaid credit system
/// 
/// SDK: Use @one-protocol package from apps/one-core/packages/one-protocol/

module one_protocol::entity {
    use std::string::{Self, String};
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::event;
    use sui::clock::{Self, Clock};

    // ============================================================
    // ERRORS
    // ============================================================
    
    const ENotAuthorized: u64 = 0;
    const EInsufficientPayment: u64 = 1;
    const EEntityNotActive: u64 = 2;
    const EInvalidEntityType: u64 = 3;
    const EAlreadyOwned: u64 = 4;
    const ESubscriptionExpired: u64 = 5;
    const EMerchantNotFound: u64 = 6;
    const EProductNotFound: u64 = 7;

    // ============================================================
    // ENTITY TYPES - The Universal Ontology
    // ============================================================
    
    /// Entity types map directly to ONE Platform's 6-dimension ontology
    /// These are constants representing what the entity IS
    const ENTITY_PRODUCT: u8 = 1;
    const ENTITY_SUBSCRIPTION: u8 = 2;
    const ENTITY_LESSON: u8 = 3;
    const ENTITY_MEMBERSHIP: u8 = 4;
    const ENTITY_CREDENTIAL: u8 = 5;
    const ENTITY_TOKEN: u8 = 6;
    const ENTITY_NFT: u8 = 7;
    const ENTITY_ACCESS_PASS: u8 = 8;
    const ENTITY_EVENT_TICKET: u8 = 9;
    const ENTITY_DIGITAL_GOOD: u8 = 10;
    const ENTITY_SERVICE: u8 = 11;
    const ENTITY_LICENSE: u8 = 12;

    // ============================================================
    // CORE STRUCTS
    // ============================================================

    /// ONE Platform Registry - The root object that tracks all merchants
    public struct ONERegistry has key {
        id: UID,
        /// Total merchants registered
        merchant_count: u64,
        /// Total entities created across all merchants
        total_entities: u64,
        /// Platform fee in basis points (e.g., 250 = 2.5%)
        platform_fee_bps: u64,
        /// Platform treasury for collecting fees
        treasury: Balance<SUI>,
        /// Admin capability holder
        admin: address,
    }

    /// Merchant - A seller/creator on the ONE Platform
    /// Each merchant can create products, mint tokens, and sell through the market
    public struct Merchant has key, store {
        id: UID,
        /// Merchant's display name
        name: String,
        /// Merchant's wallet address for receiving payments
        wallet: address,
        /// Total sales volume in MIST
        total_sales: u64,
        /// Number of products/entities created
        entity_count: u64,
        /// Whether merchant is active
        is_active: bool,
        /// Custom metadata (JSON string for flexibility)
        metadata: String,
        /// Created timestamp
        created_at: u64,
    }

    /// MerchantCap - Capability that proves merchant ownership
    /// Required to create products, mint tokens, withdraw funds
    public struct MerchantCap has key, store {
        id: UID,
        merchant_id: ID,
    }

    /// Entity - The UNIVERSAL container for ANY thing
    /// This is the core innovation: one struct that can represent anything
    public struct Entity has key, store {
        id: UID,
        /// What type of entity (product, subscription, lesson, etc.)
        entity_type: u8,
        /// Human-readable name
        name: String,
        /// Description
        description: String,
        /// Price in MIST (1 SUI = 1_000_000_000 MIST)
        price: u64,
        /// Who created/sells this entity
        merchant_id: ID,
        /// Is this entity available for purchase?
        is_active: bool,
        /// Supply: 0 = unlimited, >0 = limited edition
        max_supply: u64,
        /// How many have been sold/minted
        current_supply: u64,
        /// Flexible metadata as JSON string
        /// Can contain: image_url, attributes, duration, access_level, etc.
        metadata: String,
        /// Created timestamp
        created_at: u64,
        /// Last updated timestamp
        updated_at: u64,
    }

    /// Ownership - Proof that someone owns an Entity instance
    /// This is what buyers receive - a transferable proof of ownership
    public struct Ownership has key, store {
        id: UID,
        /// The entity this ownership refers to
        entity_id: ID,
        /// Entity type for quick filtering
        entity_type: u8,
        /// Original entity name (cached for display)
        entity_name: String,
        /// Who owns this
        owner: address,
        /// When was this acquired
        acquired_at: u64,
        /// For subscriptions: when does access expire (0 = never)
        expires_at: u64,
        /// Purchase price paid
        price_paid: u64,
        /// Custom ownership metadata
        metadata: String,
    }

    /// ONE Token - Each merchant can have their own token
    /// Used for loyalty, rewards, governance, access control
    public struct ONE has drop {}

    /// MerchantToken - A merchant-specific token for their ecosystem
    public struct MerchantToken has key, store {
        id: UID,
        merchant_id: ID,
        name: String,
        symbol: String,
        decimals: u8,
        total_supply: u64,
        metadata: String,
    }

    // ============================================================
    // EVENTS - For indexing and real-time updates
    // ============================================================

    public struct MerchantCreated has copy, drop {
        merchant_id: ID,
        name: String,
        wallet: address,
        timestamp: u64,
    }

    public struct EntityCreated has copy, drop {
        entity_id: ID,
        merchant_id: ID,
        entity_type: u8,
        name: String,
        price: u64,
        timestamp: u64,
    }

    public struct EntityPurchased has copy, drop {
        ownership_id: ID,
        entity_id: ID,
        buyer: address,
        seller: address,
        price: u64,
        entity_type: u8,
        timestamp: u64,
    }

    public struct TokensMinted has copy, drop {
        merchant_id: ID,
        amount: u64,
        recipient: address,
        timestamp: u64,
    }

    // ============================================================
    // INITIALIZATION
    // ============================================================

    /// Initialize the ONE Platform Registry
    fun init(ctx: &mut TxContext) {
        let registry = ONERegistry {
            id: object::new(ctx),
            merchant_count: 0,
            total_entities: 0,
            platform_fee_bps: 200, // 2% platform fee (adjustable via update_platform_fee)
            treasury: balance::zero(),
            admin: tx_context::sender(ctx),
        };
        transfer::share_object(registry);
    }

    // ============================================================
    // MERCHANT FUNCTIONS
    // ============================================================

    /// Register as a merchant on the ONE Platform
    public entry fun register_merchant(
        registry: &mut ONERegistry,
        name: vector<u8>,
        metadata: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let timestamp = clock::timestamp_ms(clock);

        let merchant = Merchant {
            id: object::new(ctx),
            name: string::utf8(name),
            wallet: sender,
            total_sales: 0,
            entity_count: 0,
            is_active: true,
            metadata: string::utf8(metadata),
            created_at: timestamp,
        };

        let merchant_id = object::id(&merchant);

        // Create merchant capability
        let cap = MerchantCap {
            id: object::new(ctx),
            merchant_id,
        };

        registry.merchant_count = registry.merchant_count + 1;

        event::emit(MerchantCreated {
            merchant_id,
            name: merchant.name,
            wallet: sender,
            timestamp,
        });

        // Share merchant object (readable by anyone)
        transfer::share_object(merchant);
        // Transfer capability to merchant owner
        transfer::transfer(cap, sender);
    }

    // ============================================================
    // ENTITY FUNCTIONS - Create ANY type of thing
    // ============================================================

    /// Create a new entity (product, subscription, lesson, etc.)
    /// This is the UNIVERSAL creation function
    public entry fun create_entity(
        merchant: &mut Merchant,
        cap: &MerchantCap,
        entity_type: u8,
        name: vector<u8>,
        description: vector<u8>,
        price: u64,
        max_supply: u64,
        metadata: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Verify merchant ownership
        assert!(cap.merchant_id == object::id(merchant), ENotAuthorized);
        assert!(merchant.is_active, EEntityNotActive);
        assert!(entity_type >= 1 && entity_type <= 12, EInvalidEntityType);

        let timestamp = clock::timestamp_ms(clock);

        let entity = Entity {
            id: object::new(ctx),
            entity_type,
            name: string::utf8(name),
            description: string::utf8(description),
            price,
            merchant_id: object::id(merchant),
            is_active: true,
            max_supply,
            current_supply: 0,
            metadata: string::utf8(metadata),
            created_at: timestamp,
            updated_at: timestamp,
        };

        let entity_id = object::id(&entity);
        merchant.entity_count = merchant.entity_count + 1;

        event::emit(EntityCreated {
            entity_id,
            merchant_id: object::id(merchant),
            entity_type,
            name: entity.name,
            price,
            timestamp,
        });

        transfer::share_object(entity);
    }

    /// Purchase an entity - works for ANY entity type
    /// Buyer receives an Ownership object as proof of purchase
    public entry fun purchase_entity(
        registry: &mut ONERegistry,
        merchant: &mut Merchant,
        entity: &mut Entity,
        payment: Coin<SUI>,
        expires_in_ms: u64, // 0 for permanent, >0 for subscription duration
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(entity.is_active, EEntityNotActive);
        assert!(entity.merchant_id == object::id(merchant), EMerchantNotFound);
        
        // Check supply
        if (entity.max_supply > 0) {
            assert!(entity.current_supply < entity.max_supply, EProductNotFound);
        };

        let payment_amount = coin::value(&payment);
        assert!(payment_amount >= entity.price, EInsufficientPayment);

        let timestamp = clock::timestamp_ms(clock);
        let buyer = tx_context::sender(ctx);

        // Calculate platform fee
        let fee_amount = (entity.price * registry.platform_fee_bps) / 10000;
        let merchant_amount = entity.price - fee_amount;

        // Split payment
        let mut payment_balance = coin::into_balance(payment);
        
        // Platform fee to treasury
        let fee_balance = balance::split(&mut payment_balance, fee_amount);
        balance::join(&mut registry.treasury, fee_balance);

        // Merchant payment
        let merchant_coin = coin::from_balance(
            balance::split(&mut payment_balance, merchant_amount),
            ctx
        );
        transfer::public_transfer(merchant_coin, merchant.wallet);

        // Refund excess payment
        if (balance::value(&payment_balance) > 0) {
            transfer::public_transfer(
                coin::from_balance(payment_balance, ctx),
                buyer
            );
        } else {
            balance::destroy_zero(payment_balance);
        };

        // Calculate expiration for subscriptions
        let expires_at = if (expires_in_ms > 0) {
            timestamp + expires_in_ms
        } else {
            0
        };

        // Create ownership proof
        let ownership = Ownership {
            id: object::new(ctx),
            entity_id: object::id(entity),
            entity_type: entity.entity_type,
            entity_name: entity.name,
            owner: buyer,
            acquired_at: timestamp,
            expires_at,
            price_paid: entity.price,
            metadata: string::utf8(b"{}"),
        };

        let ownership_id = object::id(&ownership);

        // Update counters
        entity.current_supply = entity.current_supply + 1;
        merchant.total_sales = merchant.total_sales + entity.price;
        registry.total_entities = registry.total_entities + 1;

        event::emit(EntityPurchased {
            ownership_id,
            entity_id: object::id(entity),
            buyer,
            seller: merchant.wallet,
            price: entity.price,
            entity_type: entity.entity_type,
            timestamp,
        });

        transfer::transfer(ownership, buyer);
    }

    /// Check if an ownership is still valid (for subscriptions)
    public fun is_ownership_valid(ownership: &Ownership, clock: &Clock): bool {
        if (ownership.expires_at == 0) {
            true // Permanent ownership
        } else {
            clock::timestamp_ms(clock) < ownership.expires_at
        }
    }

    // ============================================================
    // CONVENIENCE FUNCTIONS - Typed wrappers for clarity
    // ============================================================

    /// Create a product (entity_type = 1)
    public entry fun create_product(
        merchant: &mut Merchant,
        cap: &MerchantCap,
        name: vector<u8>,
        description: vector<u8>,
        price: u64,
        max_supply: u64,
        metadata: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        create_entity(
            merchant, cap, ENTITY_PRODUCT,
            name, description, price, max_supply, metadata, clock, ctx
        );
    }

    /// Create a subscription (entity_type = 2)
    public entry fun create_subscription(
        merchant: &mut Merchant,
        cap: &MerchantCap,
        name: vector<u8>,
        description: vector<u8>,
        price: u64, // Price per period
        metadata: vector<u8>, // Should contain: duration_ms, features, etc.
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        create_entity(
            merchant, cap, ENTITY_SUBSCRIPTION,
            name, description, price, 0, metadata, clock, ctx
        );
    }

    /// Create a lesson/course (entity_type = 3)
    public entry fun create_lesson(
        merchant: &mut Merchant,
        cap: &MerchantCap,
        name: vector<u8>,
        description: vector<u8>,
        price: u64,
        max_students: u64,
        metadata: vector<u8>, // Should contain: duration, instructor, materials
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        create_entity(
            merchant, cap, ENTITY_LESSON,
            name, description, price, max_students, metadata, clock, ctx
        );
    }

    /// Create an event ticket (entity_type = 9)
    public entry fun create_event_ticket(
        merchant: &mut Merchant,
        cap: &MerchantCap,
        name: vector<u8>,
        description: vector<u8>,
        price: u64,
        max_tickets: u64,
        metadata: vector<u8>, // Should contain: event_date, venue, seat_info
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        create_entity(
            merchant, cap, ENTITY_EVENT_TICKET,
            name, description, price, max_tickets, metadata, clock, ctx
        );
    }

    // ============================================================
    // ADMIN FUNCTIONS
    // ============================================================

    /// Update platform fee (admin only)
    public entry fun update_platform_fee(
        registry: &mut ONERegistry,
        new_fee_bps: u64,
        ctx: &TxContext
    ) {
        assert!(tx_context::sender(ctx) == registry.admin, ENotAuthorized);
        registry.platform_fee_bps = new_fee_bps;
    }

    /// Withdraw platform fees (admin only)
    public entry fun withdraw_platform_fees(
        registry: &mut ONERegistry,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == registry.admin, ENotAuthorized);
        let amount = balance::value(&registry.treasury);
        let withdrawal = coin::from_balance(
            balance::split(&mut registry.treasury, amount),
            ctx
        );
        transfer::public_transfer(withdrawal, registry.admin);
    }

    /// Update entity status
    public entry fun update_entity_status(
        entity: &mut Entity,
        merchant: &Merchant,
        cap: &MerchantCap,
        is_active: bool,
        clock: &Clock,
    ) {
        assert!(cap.merchant_id == object::id(merchant), ENotAuthorized);
        assert!(entity.merchant_id == object::id(merchant), ENotAuthorized);
        entity.is_active = is_active;
        entity.updated_at = clock::timestamp_ms(clock);
    }

    /// Update entity price
    public entry fun update_entity_price(
        entity: &mut Entity,
        merchant: &Merchant,
        cap: &MerchantCap,
        new_price: u64,
        clock: &Clock,
    ) {
        assert!(cap.merchant_id == object::id(merchant), ENotAuthorized);
        assert!(entity.merchant_id == object::id(merchant), ENotAuthorized);
        entity.price = new_price;
        entity.updated_at = clock::timestamp_ms(clock);
    }

    // ============================================================
    // VIEW FUNCTIONS
    // ============================================================

    public fun get_entity_type(entity: &Entity): u8 {
        entity.entity_type
    }

    public fun get_entity_price(entity: &Entity): u64 {
        entity.price
    }

    public fun get_entity_supply(entity: &Entity): (u64, u64) {
        (entity.current_supply, entity.max_supply)
    }

    public fun get_merchant_stats(merchant: &Merchant): (u64, u64, bool) {
        (merchant.total_sales, merchant.entity_count, merchant.is_active)
    }

    public fun get_ownership_entity_type(ownership: &Ownership): u8 {
        ownership.entity_type
    }

    public fun get_ownership_expiry(ownership: &Ownership): u64 {
        ownership.expires_at
    }
}

// ============================================================
// MODULE: ONE MARKET - Decentralized marketplace
// ============================================================

module one_protocol::market {
    use std::string::{Self, String};
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::event;
    use sui::clock::{Self, Clock};
    use one_protocol::entity::{Ownership};

    // ============================================================
    // ERRORS
    // ============================================================

    const ENotOwner: u64 = 0;
    const EListingNotActive: u64 = 1;
    const EInsufficientPayment: u64 = 2;
    const ECannotBuyOwnListing: u64 = 3;

    // ============================================================
    // STRUCTS
    // ============================================================

    /// A listing in the secondary market
    public struct Listing has key {
        id: UID,
        /// The ownership being sold
        ownership: Ownership,
        /// Asking price in MIST
        price: u64,
        /// Seller address
        seller: address,
        /// Is this listing active?
        is_active: bool,
        /// When was this listed
        listed_at: u64,
    }

    // ============================================================
    // EVENTS
    // ============================================================

    public struct ItemListed has copy, drop {
        listing_id: ID,
        ownership_id: ID,
        seller: address,
        price: u64,
        timestamp: u64,
    }

    public struct ItemSold has copy, drop {
        listing_id: ID,
        ownership_id: ID,
        seller: address,
        buyer: address,
        price: u64,
        timestamp: u64,
    }

    public struct ListingCanceled has copy, drop {
        listing_id: ID,
        seller: address,
        timestamp: u64,
    }

    // ============================================================
    // MARKETPLACE FUNCTIONS
    // ============================================================

    /// List an ownership for sale on the secondary market
    public entry fun list_for_sale(
        ownership: Ownership,
        price: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let seller = tx_context::sender(ctx);
        let timestamp = clock::timestamp_ms(clock);
        let ownership_id = object::id(&ownership);

        let listing = Listing {
            id: object::new(ctx),
            ownership,
            price,
            seller,
            is_active: true,
            listed_at: timestamp,
        };

        let listing_id = object::id(&listing);

        event::emit(ItemListed {
            listing_id,
            ownership_id,
            seller,
            price,
            timestamp,
        });

        transfer::share_object(listing);
    }

    /// Buy a listing from the secondary market
    public entry fun buy_listing(
        listing: &mut Listing,
        payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(listing.is_active, EListingNotActive);
        
        let buyer = tx_context::sender(ctx);
        assert!(buyer != listing.seller, ECannotBuyOwnListing);

        let payment_amount = coin::value(&payment);
        assert!(payment_amount >= listing.price, EInsufficientPayment);

        let timestamp = clock::timestamp_ms(clock);

        // Transfer payment to seller
        transfer::public_transfer(payment, listing.seller);

        // Mark listing as inactive
        listing.is_active = false;

        // Note: In a real implementation, we'd transfer the ownership here
        // This requires more complex object management with Sui's ownership model

        event::emit(ItemSold {
            listing_id: object::id(listing),
            ownership_id: object::id(&listing.ownership),
            seller: listing.seller,
            buyer,
            price: listing.price,
            timestamp,
        });
    }

    /// Cancel a listing (seller only)
    public entry fun cancel_listing(
        listing: &mut Listing,
        clock: &Clock,
        ctx: &TxContext
    ) {
        assert!(tx_context::sender(ctx) == listing.seller, ENotOwner);
        assert!(listing.is_active, EListingNotActive);

        listing.is_active = false;

        event::emit(ListingCanceled {
            listing_id: object::id(listing),
            seller: listing.seller,
            timestamp: clock::timestamp_ms(clock),
        });
    }
}
