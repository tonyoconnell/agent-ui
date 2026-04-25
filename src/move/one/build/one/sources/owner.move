// =============================================================================
// OWNER.MOVE — Substrate owner pin (Gap 0 of owner-todo)
// =============================================================================
//
// On-chain hardening for substrate owner identity. The off-chain
// OWNER_EXPECTED_ADDRESS env var gates first-mint at the API layer
// (see /api/auth/passkey/assert.ts); this module pins the resolved
// owner address on-chain so D1 wipes lose audit history but cannot
// transfer the role.
//
// Lifecycle (operator runs both in a single PTB at deploy time):
//   1. bootstrap(&upgrade_cap): creates an unlocked SubstrateOwner
//      shared object. UpgradeCap reference proves caller is the
//      package publisher (only they can mint a fresh pin).
//   2. init_substrate_owner(&mut pin, addr): sets owner = addr,
//      locked = true; emits OwnerLocked.
//   3. ANY second call to init_substrate_owner on the same pin:
//      aborts with E_OWNER_LOCKED.
//
// Why no `fun init` module-initializer: this module ships as part of
// a package UPGRADE (the existing `one` package was first-published
// at 0xd064...). Sui runs `init` only on the package's first publish,
// not on upgrades that add new modules. So the SubstrateOwner shared
// object is created lazily via the `bootstrap` entry function.
//
// Reads of "who is the owner" prefer this on-chain object over off-chain
// D1 state. owner_of(&pin) is read-only and gas-free for clients holding
// the object reference.
// =============================================================================

module one::owner {
    use sui::event;
    use sui::package::UpgradeCap;

    // =========================================================================
    // ERRORS
    // =========================================================================

    /// Attempted to call init_substrate_owner after the pin was already locked.
    const E_OWNER_LOCKED: u64 = 100;

    // =========================================================================
    // OBJECTS
    // =========================================================================

    /// The substrate's owner pin. `owner: address` is set exactly once,
    /// then `locked: true` prevents further writes. Shared so anyone can
    /// read the owner address (gas-free for object-ref reads).
    public struct SubstrateOwner has key {
        id: UID,
        owner: address,
        locked: bool,
        locked_at_epoch: u64,
    }

    // =========================================================================
    // EVENTS
    // =========================================================================

    public struct OwnerLocked has copy, drop {
        owner: address,
        locked_at_epoch: u64,
    }

    // =========================================================================
    // ENTRY
    // =========================================================================

    /// Bootstrap — creates the unlocked SubstrateOwner shared object.
    /// Requires &UpgradeCap as proof of publisher identity; the cap is
    /// held by whoever published `one` (the substrate operator) and can
    /// be transferred but not forged. Operator hygiene: only call this
    /// once; if called twice, the second pin is orphaned (off-chain
    /// canonical-pin tracking uses the first OwnerLocked event).
    public entry fun bootstrap(_proof: &UpgradeCap, ctx: &mut TxContext) {
        let pin = SubstrateOwner {
            id: object::new(ctx),
            owner: @0x0,
            locked: false,
            locked_at_epoch: 0,
        };
        transfer::share_object(pin)
    }

    /// Lock the substrate's owner address. Callable exactly once per pin;
    /// second call aborts with E_OWNER_LOCKED. After this returns, the
    /// pin is immutable — there is no entry function that takes
    /// &mut SubstrateOwner besides this one, and the assert blocks repeat.
    public entry fun init_substrate_owner(
        pin: &mut SubstrateOwner,
        addr: address,
        ctx: &TxContext,
    ) {
        assert!(!pin.locked, E_OWNER_LOCKED);
        pin.owner = addr;
        pin.locked = true;
        pin.locked_at_epoch = ctx.epoch();
        event::emit(OwnerLocked {
            owner: addr,
            locked_at_epoch: ctx.epoch(),
        });
    }

    // =========================================================================
    // READ
    // =========================================================================

    public fun owner_of(pin: &SubstrateOwner): address {
        pin.owner
    }

    public fun is_locked(pin: &SubstrateOwner): bool {
        pin.locked
    }

    public fun locked_at_epoch(pin: &SubstrateOwner): u64 {
        pin.locked_at_epoch
    }
}
