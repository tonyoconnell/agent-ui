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
    use std::vector;

    // =========================================================================
    // ERRORS
    // =========================================================================

    const EZeroDailyCap: u64 = 0;
    const E_NOT_AGENT: u64 = 1;
    const E_PAUSED: u64 = 2;
    const E_CAP_EXCEEDED: u64 = 3;
    const E_NOT_ALLOWED: u64 = 4;
    const E_NOT_OWNER: u64 = 5;

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

    /// Emitted when anyone tops up a ScopedWallet via fund().
    public struct WalletFunded has copy, drop {
        wallet_id: address,
        by: address,
        amount: u64,
        epoch: u64,
    }


    /// Emitted when the agent successfully executes a spend().
    public struct SpendExecuted has copy, drop {
        wallet_id: address,
        to: address,
        amount: u64,
        epoch: u64,
    }

    /// Emitted when a ScopedWallet is revoked by its owner.
    public struct WalletRevoked has copy, drop {
        wallet_id: address,
        by: address,
        funds_returned_to: address,
        epoch: u64,
    }

    /// Emitted when the owner pauses a ScopedWallet.
    public struct WalletPaused has copy, drop {
        wallet_id: address,
        by: address,
        epoch: u64,
    }

    /// Emitted when the owner unpauses a ScopedWallet.
    public struct WalletUnpaused has copy, drop {
        wallet_id: address,
        by: address,
        epoch: u64,
    }

    /// Emitted when a parent wallet spawns a child ScopedWallet.
    public struct ChildSpawned has copy, drop {
        parent_wallet_id: address,
        child_wallet_id: address,
        child_agent: address,
        daily_cap: u64,
        epoch: u64,
    }

    // =========================================================================
    // INTERNAL HELPERS
    // =========================================================================

    /// Reset spent_today to 0 if the current epoch has advanced past the
    /// epoch in which the last reset occurred.
    fun maybe_reset_epoch<T>(wallet: &mut ScopedWallet<T>, ctx: &TxContext) {
        if (ctx.epoch() > wallet.epoch_of_last_reset) {
            wallet.spent_today = 0;
            wallet.epoch_of_last_reset = ctx.epoch();
        }
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

    /// Anyone can top up a ScopedWallet by sending it a Coin<T>.
    ///
    /// The coin is transferred directly to the wallet object's address so it
    /// is held by the object itself. Emits WalletFunded for off-chain indexers.
    public entry fun fund<T>(
        wallet: &mut ScopedWallet<T>,
        coin: Coin<T>,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&coin);
        // The wallet object itself holds the balance — transfer coin to wallet address
        transfer::public_transfer(coin, object::uid_to_address(&wallet.id));
        event::emit(WalletFunded {
            wallet_id: object::uid_to_address(&wallet.id),
            by: ctx.sender(),
            amount,
            epoch: ctx.epoch(),
        });
    }

    /// Agent-initiated spend: split `amount` from `coin` and send to `to`.
    ///
    /// Guards (in order):
    ///   1. Caller must be wallet.agent             (E_NOT_AGENT)
    ///   2. Wallet must not be paused               (E_PAUSED)
    ///   3. Epoch reset if needed, then cap check   (E_CAP_EXCEEDED)
    ///   4. Allowlist check (empty = any recipient) (E_NOT_ALLOWED)
    ///
    /// State mutations:
    ///   - wallet.spent_today incremented by amount
    ///   - wallet.epoch_of_last_reset updated on epoch advance
    ///
    /// Emits SpendExecuted.
    public entry fun spend<T>(
        wallet: &mut ScopedWallet<T>,
        coin: &mut Coin<T>,
        to: address,
        amount: u64,
        ctx: &mut TxContext
    ) {
        // Guard 1 — only the designated agent may spend
        assert!(ctx.sender() == wallet.agent, E_NOT_AGENT);

        // Guard 2 — wallet must be active
        assert!(!wallet.paused, E_PAUSED);

        // Reset epoch counter if a new epoch has started
        maybe_reset_epoch(wallet, ctx);

        // Guard 3 — daily cap
        assert!(wallet.spent_today + amount <= wallet.daily_cap, E_CAP_EXCEEDED);

        // Guard 4 — allowlist (empty allowlist permits any recipient)
        let allowed = vector::is_empty(&wallet.allowlist) ||
                      vector::contains(&wallet.allowlist, &to);
        assert!(allowed, E_NOT_ALLOWED);

        // Execute: split the requested amount and transfer to recipient
        let payment = coin::split(coin, amount, ctx);
        transfer::public_transfer(payment, to);

        // Update running total for this epoch
        wallet.spent_today = wallet.spent_today + amount;

        // Emit event for off-chain indexers
        event::emit(SpendExecuted {
            wallet_id: object::uid_to_address(&wallet.id),
            to,
            amount,
            epoch: ctx.epoch(),
        });
    }

    /// Revoke a ScopedWallet — owner only. Destroys the object permanently.
    ///
    /// ScopedWallet holds no Balance<T> directly (funds are separate Coin objects
    /// owned by the wallet address). The caller must drain any coin objects from
    /// the wallet's address before or after revoking — Move's ownership model
    /// keeps those Coins independent of this object's lifecycle.
    ///
    /// Aborts with E_NOT_OWNER if the sender is not the wallet owner.
    public entry fun revoke<T>(
        wallet: ScopedWallet<T>,
        ctx: &mut TxContext
    ) {
        assert!(ctx.sender() == wallet.owner, E_NOT_OWNER);

        let wallet_id = object::uid_to_address(&wallet.id);
        let owner = wallet.owner;

        // Destructure and delete the object — all fields must be named explicitly
        // because ScopedWallet has `key` (not `drop`).
        let ScopedWallet {
            id,
            owner: _,
            agent: _,
            daily_cap: _,
            spent_today: _,
            epoch_of_last_reset: _,
            paused: _,
            allowlist: _,
        } = wallet;
        object::delete(id);

        event::emit(WalletRevoked {
            wallet_id,
            by: ctx.sender(),
            funds_returned_to: owner,
            epoch: ctx.epoch(),
        });
    }

    /// Pause a wallet — only owner can pause.
    ///
    /// Sets `paused = true`. While paused, spend() will abort.
    /// Emits WalletPaused for off-chain indexers.
    public entry fun pause<T>(
        wallet: &mut ScopedWallet<T>,
        ctx: &mut TxContext
    ) {
        assert!(ctx.sender() == wallet.owner, E_NOT_OWNER);
        wallet.paused = true;
        event::emit(WalletPaused {
            wallet_id: object::uid_to_address(&wallet.id),
            by: ctx.sender(),
            epoch: ctx.epoch(),
        });
    }

    /// Unpause — only owner can unpause.
    ///
    /// Clears `paused = false`, re-enabling spend(). Emits WalletUnpaused.
    public entry fun unpause<T>(
        wallet: &mut ScopedWallet<T>,
        ctx: &mut TxContext
    ) {
        assert!(ctx.sender() == wallet.owner, E_NOT_OWNER);
        wallet.paused = false;
        event::emit(WalletUnpaused {
            wallet_id: object::uid_to_address(&wallet.id),
            by: ctx.sender(),
            epoch: ctx.epoch(),
        });
    }

    /// Spawn a child ScopedWallet<T> owned by the parent wallet's object address.
    ///
    /// Only the parent wallet's owner may call this. The child's `owner` field
    /// is set to the parent wallet's object address (not the human caller),
    /// forming a recursive ownership tree: human → parent wallet → child wallet.
    ///
    /// Constraints:
    ///   - child_daily_cap must be > 0
    ///   - child_daily_cap must be ≤ parent.daily_cap (child cannot exceed parent)
    ///
    /// The child is transferred to the parent wallet's object address so it is
    /// held at that address. Emits ChildSpawned for off-chain indexers.
    public entry fun spawn_child<T>(
        parent: &ScopedWallet<T>,
        child_agent: address,
        child_daily_cap: u64,
        child_allowlist: vector<address>,
        ctx: &mut TxContext
    ) {
        // Only parent owner can spawn a child
        assert!(ctx.sender() == parent.owner, E_NOT_OWNER);
        assert!(child_daily_cap > 0, 0);
        assert!(child_daily_cap <= parent.daily_cap, E_CAP_EXCEEDED);  // child cap ≤ parent cap

        // Child's owner is the parent wallet's object address
        let parent_addr = object::uid_to_address(&parent.id);

        let child = ScopedWallet<T> {
            id: object::new(ctx),
            owner: parent_addr,  // parent wallet owns the child
            agent: child_agent,
            daily_cap: child_daily_cap,
            spent_today: 0,
            epoch_of_last_reset: ctx.epoch(),
            paused: false,
            allowlist: child_allowlist,
        };

        let child_id = object::uid_to_address(&child.id);

        event::emit(ChildSpawned {
            parent_wallet_id: parent_addr,
            child_wallet_id: child_id,
            child_agent,
            daily_cap: child_daily_cap,
            epoch: ctx.epoch(),
        });

        // Transfer child to its owner (the parent wallet address)
        transfer::transfer(child, parent_addr);
    }

    /// Permissionless epoch boundary advance (C.m6).
    ///
    /// Resets spent_today to 0 if the current epoch has advanced past
    /// epoch_of_last_reset. Anyone may call this — it is idempotent within
    /// a single epoch and only mutates the reset marker, never transfers funds.
    public entry fun rotate_day<T>(
        wallet: &mut ScopedWallet<T>,
        ctx: &mut TxContext
    ) {
        if (ctx.epoch() > wallet.epoch_of_last_reset) {
            wallet.spent_today = 0;
            wallet.epoch_of_last_reset = ctx.epoch();
        }
        // If same epoch, no-op (idempotent)
    }

    /// Emitted when the owner transfers wallet ownership via rotate_owner().
    public struct OwnerRotated has copy, drop {
        wallet_id: address,
        old_owner: address,
        new_owner: address,
        epoch: u64,
    }

    /// Transfer ownership without re-funding (C.m9 — agents.md §Pattern D).
    ///
    /// Funds stay in the wallet; only the `owner` field changes. The new owner
    /// immediately gains pause / revoke / rotate authority. Emits OwnerRotated.
    ///
    /// Aborts with E_NOT_OWNER if the sender is not the current owner.
    public entry fun rotate_owner<T>(
        wallet: &mut ScopedWallet<T>,
        new_owner: address,
        ctx: &mut TxContext
    ) {
        assert!(ctx.sender() == wallet.owner, E_NOT_OWNER);
        let old_owner = wallet.owner;
        wallet.owner = new_owner;
        event::emit(OwnerRotated {
            wallet_id: object::uid_to_address(&wallet.id),
            old_owner,
            new_owner,
            epoch: ctx.epoch(),
        });
    }
}
