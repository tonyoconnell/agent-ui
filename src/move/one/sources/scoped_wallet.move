// =============================================================================
// SCOPED_WALLET.MOVE — Agent-scoped spending wallet
// =============================================================================
//
// A ScopedWallet<T> is a capability object that lets a designated agent
// address spend coin T on behalf of an owner, subject to:
//   - a daily cap (in MIST, resets each epoch boundary)
//   - an allowlist of recipient addresses
//   - a pause flag the owner can toggle
//
// Lifecycle:
//   C.m1  create<T>  — owner mints the wallet (this file)
//   C.m2  spend<T>   — agent withdraws up to daily_cap
//   C.m3  pause      — owner pauses / unpauses
//   C.m4  revoke     — owner destroys and reclaims funds
//
// Belongs to package: one
// Module: one::scoped_wallet
// =============================================================================

module one::scoped_wallet {
    use sui::coin::{Self, Coin};
    use sui::object::{Self, UID};
    use sui::tx_context::TxContext;
    use sui::transfer;
    use sui::event;

    // =========================================================================
    // ERRORS
    // =========================================================================

    const EZeroDailyCap: u64 = 0;

    // =========================================================================
    // OBJECTS
    // =========================================================================

    /// ScopedWallet<T> — an agent-scoped spending wallet for coin type T.
    ///
    /// Owned by `owner`. The object is transferred to the owner on creation
    /// so it travels the fast (owned-object) path for all mutations the owner
    /// initiates (pause, revoke, rotate). The `agent` address is stored inside
    /// and checked at spend-time (C.m2).
    ///
    /// T is phantom — the coin type is enforced at the type-system level but
    /// the struct itself holds no Balance<T>. Funds are deposited separately
    /// (C.m2 receives a Coin<T> argument at call time, matching the spend amount).
    public struct ScopedWallet<phantom T> has key {
        id: UID,
        /// Controls pause / revoke / rotate operations.
        owner: address,
        /// May call spend() up to daily_cap per epoch.
        agent: address,
        /// Maximum spend per epoch, denominated in MIST (or the smallest unit
        /// of T). Set at creation; mutable via rotate (C.m4).
        daily_cap: u64,
        /// Cumulative spend in the current epoch. Reset to 0 when the epoch
        /// advances past epoch_of_last_reset.
        spent_today: u64,
        /// The epoch during which spent_today was last reset (or initialised).
        /// Compared against ctx.epoch() at spend-time to detect day boundaries.
        epoch_of_last_reset: u64,
        /// When true, spend() aborts regardless of remaining cap.
        paused: bool,
        /// Exhaustive list of addresses that may receive funds via spend().
        /// An empty allowlist means any recipient is permitted.
        allowlist: vector<address>,
    }

    // =========================================================================
    // EVENTS
    // =========================================================================

    /// Emitted once when a ScopedWallet is created.
    public struct WalletCreated has copy, drop {
        /// The object ID of the newly created wallet (as address).
        wallet_id: address,
        owner: address,
        agent: address,
        daily_cap: u64,
    }

    // =========================================================================
    // ENTRY FUNCTIONS
    // =========================================================================

    /// Create a new ScopedWallet<T> and transfer it to the transaction sender.
    ///
    /// Parameters:
    ///   agent      — the address authorised to call spend()
    ///   daily_cap  — maximum spend per epoch in the smallest unit of T (MIST
    ///                for SUI). Must be > 0.
    ///   allowlist  — permitted recipient addresses; pass an empty vector to
    ///                allow any recipient.
    ///   ctx        — mutable transaction context (provides sender + epoch)
    public entry fun create<T>(
        agent: address,
        daily_cap: u64,
        allowlist: vector<address>,
        ctx: &mut TxContext
    ) {
        assert!(daily_cap > 0, EZeroDailyCap);

        let owner = ctx.sender();
        let uid = object::new(ctx);
        let wallet_id = object::uid_to_address(&uid);

        let wallet = ScopedWallet<T> {
            id: uid,
            owner,
            agent,
            daily_cap,
            spent_today: 0,
            epoch_of_last_reset: ctx.epoch(),
            paused: false,
            allowlist,
        };

        event::emit(WalletCreated {
            wallet_id,
            owner,
            agent,
            daily_cap,
        });

        transfer::transfer(wallet, owner);
    }
}
