// =============================================================================
// ONE.MOVE — The Substrate on Sui
// =============================================================================
//
// Same ontology as one.tql. Same structures. Same vocabulary.
// TQL reasons. Move enforces. Two fires, one truth.
//
// Objects:
//   Unit     — owned object, fast path (no consensus)
//   Colony   — shared object, consensus required
//   Signal   — owned object, transferred on send, consumed on receive
//   Path     — shared object, both endpoints modify
//   Highway  — frozen object, crystallized knowledge (immutable)
//   Escrow   — shared object, locked payment for async tasks
//   Protocol — shared singleton, fee treasury
//
// Vocabulary:
//   signal   — move through world
//   mark     — leave positive weight on path (success)
//   warn     — leave negative weight on path (failure)
//   follow   — traverse weighted path to best
//   fade     — decay all weights over time
//   sense    — read weight on path
//
// Revenue = weight. Every payment strengthens a path.
//
// =============================================================================

module one::substrate {
    use sui::event;
    use sui::vec_map::{Self, VecMap};
    use sui::clock::{Self, Clock};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use std::string::String;

    // =========================================================================
    // ERRORS
    // =========================================================================

    const EInsufficientBalance: u64 = 0;
    const ENotHighway: u64 = 1;
    const EDeadlineNotPassed: u64 = 2;
    const EDeadlinePassed: u64 = 3;
    const EWrongWorker: u64 = 4;
    const EWrongPoster: u64 = 5;
    const EZeroAmount: u64 = 6;

    // =========================================================================
    // OBJECTS
    // =========================================================================

    /// Unit — an actor in the colony.
    /// Owned object: fast path, no consensus needed.
    /// TQL: entity unit, owns uid @key ...
    public struct Unit has key, store {
        id: UID,
        name: String,
        unit_type: String,          // "agent", "llm", "oracle", "worker"
        tasks: VecMap<String, bool>, // registered task names
        success_count: u64,
        failure_count: u64,
        activity: u64,
        balance: Balance<SUI>,      // real tokens
    }

    /// Colony — a group of units.
    /// Shared object: multiple units read/write.
    /// TQL: entity group, owns gid @key ...
    public struct Colony has key {
        id: UID,
        name: String,
        colony_type: String,        // "swarm", "team", "coalition"
        units: vector<ID>,
        treasury: Balance<SUI>,     // shared pool — real tokens
    }

    /// Signal — the universal primitive. { receiver, data } on-chain.
    /// Owned object: transferred to receiver, consumed on process.
    /// Can carry payment (tokens attached to signal).
    /// TQL: relation signal, relates sender, relates receiver ...
    public struct Signal has key, store {
        id: UID,
        receiver: ID,               // target unit
        task_name: String,          // which task to invoke
        sender: ID,                 // origin unit
        payload: vector<u8>,        // arbitrary data
        payment: Balance<SUI>,      // tokens carried with signal (0 = free)
        timestamp: u64,
    }

    /// Path — a weighted connection between units.
    /// Shared object: both source and target modify.
    /// TQL: relation path, owns strength, owns resistance ...
    public struct Path has key {
        id: UID,
        source: ID,                 // source unit
        target: ID,                 // target unit
        path_type: String,          // "interaction", "payment", "holding"
        strength: u64,              // positive weight (mark)
        resistance: u64,                 // negative weight (warn)
        hits: u64,                  // successful traversals
        misses: u64,                // failed traversals
        revenue: u64,               // total SUI flowed through this path (MIST)
    }

    /// Highway — crystallized knowledge. Frozen on-chain.
    /// Sui: transfer::freeze_object — immutable forever.
    public struct Highway has key {
        id: UID,
        source: ID,
        target: ID,
        strength: u64,              // strength at crystallization
        confidence: u64,            // certainty (0-100)
        revenue: u64,               // total revenue at crystallization
        crystallized_at: u64,
    }

    /// Escrow — locked payment for async tasks.
    /// Shared object: poster creates, worker claims on completion.
    public struct Escrow has key {
        id: UID,
        poster: ID,                 // unit who posted the bounty
        worker: ID,                 // unit assigned to do the work
        task_name: String,
        bounty: Balance<SUI>,       // tokens locked until completion
        deadline: u64,              // ms timestamp — auto-cancel after this
        path_id: ID,                // path to mark on success / warn on failure
    }

    /// Protocol — singleton fee treasury.
    /// Shared object: collects protocol fees from every payment.
    public struct Protocol has key {
        id: UID,
        treasury: Balance<SUI>,
        fee_bps: u64,               // basis points (50 = 0.50%)
    }

    // =========================================================================
    // EVENTS
    // =========================================================================

    public struct UnitCreated has copy, drop { unit_id: ID, name: String, unit_type: String }
    public struct SignalSent has copy, drop { signal_id: ID, sender: ID, receiver: ID, task: String, amount: u64 }
    public struct SignalConsumed has copy, drop { signal_id: ID, receiver: ID, amount: u64 }
    public struct Marked has copy, drop { path_id: ID, source: ID, target: ID, strength: u64 }
    public struct Warned has copy, drop { path_id: ID, source: ID, target: ID, resistance: u64 }
    public struct HighwayFormed has copy, drop { highway_id: ID, source: ID, target: ID, strength: u64, revenue: u64 }
    public struct UnitDissolved has copy, drop { unit_id: ID, balance_returned: u64 }
    public struct ColonySplit has copy, drop { parent: ID, child_a: ID, child_b: ID }

    // Payment events
    public struct PaymentSent has copy, drop { from: ID, to: ID, amount: u64 }
    public struct EscrowCreated has copy, drop { escrow_id: ID, poster: ID, worker: ID, bounty: u64, task: String }
    public struct EscrowReleased has copy, drop { escrow_id: ID, worker: ID, amount: u64 }
    public struct EscrowCancelled has copy, drop { escrow_id: ID, poster: ID, amount: u64 }
    public struct ProtocolFeeCollected has copy, drop { amount: u64 }

    // =========================================================================
    // INIT
    // =========================================================================

    fun init(ctx: &mut TxContext) {
        let protocol = Protocol {
            id: object::new(ctx),
            treasury: balance::zero(),
            fee_bps: 50,
        };
        transfer::share_object(protocol);
    }

    // =========================================================================
    // CREATE
    // =========================================================================

    public fun create_unit(
        name: String,
        unit_type: String,
        ctx: &mut TxContext,
    ): Unit {
        let unit = Unit {
            id: object::new(ctx),
            name,
            unit_type,
            tasks: vec_map::empty(),
            success_count: 0,
            failure_count: 0,
            activity: 0,
            balance: balance::zero(),
        };
        event::emit(UnitCreated {
            unit_id: object::id(&unit),
            name: unit.name,
            unit_type: unit.unit_type,
        });
        unit
    }

    public fun register_task(unit: &mut Unit, task_name: String) {
        vec_map::insert(&mut unit.tasks, task_name, true);
    }

    public fun create_colony(
        name: String,
        colony_type: String,
        ctx: &mut TxContext,
    ) {
        let colony = Colony {
            id: object::new(ctx),
            name,
            colony_type,
            units: vector::empty(),
            treasury: balance::zero(),
        };
        transfer::share_object(colony);
    }

    public fun join_colony(colony: &mut Colony, unit: &Unit) {
        vector::push_back(&mut colony.units, object::id(unit));
    }

    // =========================================================================
    // DEPOSIT / WITHDRAW
    // =========================================================================

    public fun deposit(unit: &mut Unit, coin: Coin<SUI>) {
        let b = coin::into_balance(coin);
        balance::join(&mut unit.balance, b);
    }

    public fun withdraw(unit: &mut Unit, amount: u64, ctx: &mut TxContext): Coin<SUI> {
        assert!(balance::value(&unit.balance) >= amount, EInsufficientBalance);
        let b = balance::split(&mut unit.balance, amount);
        coin::from_balance(b, ctx)
    }

    public fun fund_colony(colony: &mut Colony, coin: Coin<SUI>) {
        let b = coin::into_balance(coin);
        balance::join(&mut colony.treasury, b);
    }

    // =========================================================================
    // PAY — Agent pays agent. Revenue = weight.
    // =========================================================================

    public fun pay(
        from: &mut Unit,
        to: &mut Unit,
        amount: u64,
        path: &mut Path,
        protocol: &mut Protocol,
    ) {
        assert!(amount > 0, EZeroAmount);
        assert!(balance::value(&from.balance) >= amount, EInsufficientBalance);

        let fee_amount = (amount * protocol.fee_bps) / 10000;

        let mut payment = balance::split(&mut from.balance, amount);

        if (fee_amount > 0) {
            let fee = balance::split(&mut payment, fee_amount);
            balance::join(&mut protocol.treasury, fee);
            event::emit(ProtocolFeeCollected { amount: fee_amount });
        };

        balance::join(&mut to.balance, payment);

        // Payment marks the path — revenue IS weight
        path.revenue = path.revenue + amount;
        path.strength = path.strength + 1;
        path.hits = path.hits + 1;

        from.activity = from.activity + 1;
        to.activity = to.activity + 1;

        event::emit(PaymentSent {
            from: object::id(from),
            to: object::id(to),
            amount,
        });
        event::emit(Marked {
            path_id: object::id(path),
            source: path.source,
            target: path.target,
            strength: path.strength,
        });
    }

    // =========================================================================
    // ESCROW — Lock tokens for async tasks
    // =========================================================================

    public fun create_escrow(
        poster: &mut Unit,
        worker_id: ID,
        task_name: String,
        amount: u64,
        deadline: u64,
        path_id: ID,
        ctx: &mut TxContext,
    ) {
        assert!(amount > 0, EZeroAmount);
        assert!(balance::value(&poster.balance) >= amount, EInsufficientBalance);

        let bounty = balance::split(&mut poster.balance, amount);

        let escrow = Escrow {
            id: object::new(ctx),
            poster: object::id(poster),
            worker: worker_id,
            task_name,
            bounty,
            deadline,
            path_id,
        };

        event::emit(EscrowCreated {
            escrow_id: object::id(&escrow),
            poster: object::id(poster),
            worker: worker_id,
            bounty: amount,
            task: escrow.task_name,
        });

        transfer::share_object(escrow);
    }

    /// Release escrow to worker. Task completed successfully.
    /// Payment + mark in one atomic transaction.
    public fun release_escrow(
        escrow: Escrow,
        worker: &mut Unit,
        path: &mut Path,
        protocol: &mut Protocol,
        clock: &Clock,
    ) {
        assert!(object::id(worker) == escrow.worker, EWrongWorker);
        assert!(clock::timestamp_ms(clock) <= escrow.deadline, EDeadlinePassed);

        let Escrow {
            id,
            poster: _,
            worker: _,
            task_name: _,
            bounty,
            deadline: _,
            path_id: _,
        } = escrow;

        let amount = balance::value(&bounty);

        let fee_amount = (amount * protocol.fee_bps) / 10000;
        let mut payment = bounty;

        if (fee_amount > 0) {
            let fee = balance::split(&mut payment, fee_amount);
            balance::join(&mut protocol.treasury, fee);
            event::emit(ProtocolFeeCollected { amount: fee_amount });
        };

        balance::join(&mut worker.balance, payment);

        // Success: mark path
        path.strength = path.strength + 1;
        path.hits = path.hits + 1;
        path.revenue = path.revenue + amount;

        worker.activity = worker.activity + 1;
        worker.success_count = worker.success_count + 1;

        event::emit(EscrowReleased {
            escrow_id: object::uid_to_inner(&id),
            worker: object::id(worker),
            amount,
        });

        object::delete(id);
    }

    /// Cancel escrow. Deadline passed. Tokens return. Path warned.
    public fun cancel_escrow(
        escrow: Escrow,
        poster: &mut Unit,
        path: &mut Path,
        clock: &Clock,
    ) {
        assert!(object::id(poster) == escrow.poster, EWrongPoster);
        assert!(clock::timestamp_ms(clock) > escrow.deadline, EDeadlineNotPassed);

        let Escrow {
            id,
            poster: _,
            worker: _,
            task_name: _,
            bounty,
            deadline: _,
            path_id: _,
        } = escrow;

        let amount = balance::value(&bounty);

        balance::join(&mut poster.balance, bounty);

        // Failure: warn path
        path.resistance = path.resistance + 1;
        path.misses = path.misses + 1;

        event::emit(EscrowCancelled {
            escrow_id: object::uid_to_inner(&id),
            poster: object::id(poster),
            amount,
        });

        object::delete(id);
    }

    // =========================================================================
    // SEND / CONSUME — Signal with optional payment
    // =========================================================================

    public fun send(
        sender: &mut Unit,
        receiver_id: ID,
        task_name: String,
        payload: vector<u8>,
        payment_amount: u64,
        receiver_owner: address,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let payment = if (payment_amount > 0) {
            assert!(balance::value(&sender.balance) >= payment_amount, EInsufficientBalance);
            balance::split(&mut sender.balance, payment_amount)
        } else {
            balance::zero()
        };

        let signal = Signal {
            id: object::new(ctx),
            receiver: receiver_id,
            task_name,
            sender: object::id(sender),
            payload,
            payment,
            timestamp: clock::timestamp_ms(clock),
        };

        sender.activity = sender.activity + 1;

        event::emit(SignalSent {
            signal_id: object::id(&signal),
            sender: object::id(sender),
            receiver: receiver_id,
            task: signal.task_name,
            amount: payment_amount,
        });

        transfer::transfer(signal, receiver_owner);
    }

    /// Consume a signal. Collect any payment. Destroy the object.
    /// Zero-return pattern: signal consumed, not bounced.
    public fun consume(
        signal: Signal,
        unit: &mut Unit,
        path: &mut Path,
        protocol: &mut Protocol,
    ) {
        let Signal {
            id,
            receiver: _,
            task_name: _,
            sender: _,
            payload: _,
            payment,
            timestamp: _,
        } = signal;

        let amount = balance::value(&payment);

        if (amount > 0) {
            let fee_amount = (amount * protocol.fee_bps) / 10000;
            let mut received = payment;

            if (fee_amount > 0) {
                let fee = balance::split(&mut received, fee_amount);
                balance::join(&mut protocol.treasury, fee);
                event::emit(ProtocolFeeCollected { amount: fee_amount });
            };

            balance::join(&mut unit.balance, received);

            // Payment marks path
            path.revenue = path.revenue + amount;
            path.strength = path.strength + 1;
            path.hits = path.hits + 1;

            event::emit(Marked {
                path_id: object::id(path),
                source: path.source,
                target: path.target,
                strength: path.strength,
            });
        } else {
            balance::destroy_zero(payment);
        };

        unit.activity = unit.activity + 1;

        event::emit(SignalConsumed {
            signal_id: object::uid_to_inner(&id),
            receiver: object::id(unit),
            amount,
        });

        object::delete(id);
    }

    // =========================================================================
    // MARK / WARN — The two weight operations
    // =========================================================================

    /// Create a path between two units.
    /// TQL: insert $p (source: $s, target: $t) isa path ...
    public fun create_path(
        source: ID,
        target: ID,
        path_type: String,
        ctx: &mut TxContext,
    ) {
        let path = Path {
            id: object::new(ctx),
            source,
            target,
            path_type,
            strength: 0,
            resistance: 0,
            hits: 0,
            misses: 0,
            revenue: 0,
        };
        transfer::share_object(path);
    }

    /// Mark a path. Positive weight. Strength increases.
    public fun mark(path: &mut Path, amount: u64) {
        path.strength = path.strength + amount;
        path.hits = path.hits + 1;
        event::emit(Marked {
            path_id: object::id(path),
            source: path.source,
            target: path.target,
            strength: path.strength,
        });
    }

    /// Warn a path. Negative weight. Resistance increases.
    public fun warn(path: &mut Path, amount: u64) {
        path.resistance = path.resistance + amount;
        path.misses = path.misses + 1;
        event::emit(Warned {
            path_id: object::id(path),
            source: path.source,
            target: path.target,
            resistance: path.resistance,
        });
    }

    // =========================================================================
    // FADE — Decay (the forgetting that enables learning)
    // =========================================================================

    public fun fade(path: &mut Path, rate: u64) {
        path.strength = path.strength * rate / 100;
        path.resistance = path.resistance * rate / 100;
    }

    // =========================================================================
    // CRYSTALLIZE — Freeze knowledge permanently
    // =========================================================================

    public fun crystallize(
        path: &Path,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(path.strength >= 50, ENotHighway);

        let highway = Highway {
            id: object::new(ctx),
            source: path.source,
            target: path.target,
            strength: path.strength,
            confidence: (path.hits * 100) / (path.hits + path.misses + 1),
            revenue: path.revenue,
            crystallized_at: clock::timestamp_ms(clock),
        };
        event::emit(HighwayFormed {
            highway_id: object::id(&highway),
            source: path.source,
            target: path.target,
            strength: path.strength,
            revenue: path.revenue,
        });
        transfer::freeze_object(highway);
    }

    // =========================================================================
    // DISSOLVE — Programmed death
    // =========================================================================

    public fun dissolve(unit: Unit, colony: &mut Colony) {
        let Unit {
            id,
            name: _,
            unit_type: _,
            tasks: _,
            success_count: _,
            failure_count: _,
            activity: _,
            balance,
        } = unit;

        let returned = balance::value(&balance);
        balance::join(&mut colony.treasury, balance);

        event::emit(UnitDissolved {
            unit_id: object::uid_to_inner(&id),
            balance_returned: returned,
        });
        object::delete(id);
    }

    // =========================================================================
    // PROTOCOL ADMIN
    // =========================================================================

    public fun withdraw_protocol_fees(
        protocol: &mut Protocol,
        amount: u64,
        ctx: &mut TxContext,
    ): Coin<SUI> {
        assert!(balance::value(&protocol.treasury) >= amount, EInsufficientBalance);
        let b = balance::split(&mut protocol.treasury, amount);
        coin::from_balance(b, ctx)
    }

    public fun set_fee_bps(protocol: &mut Protocol, new_fee_bps: u64) {
        protocol.fee_bps = new_fee_bps;
    }

    // =========================================================================
    // ACCESSORS
    // =========================================================================

    public fun path_strength(path: &Path): u64 { path.strength }
    public fun path_resistance(path: &Path): u64 { path.resistance }
    public fun path_hits(path: &Path): u64 { path.hits }
    public fun path_misses(path: &Path): u64 { path.misses }
    public fun path_revenue(path: &Path): u64 { path.revenue }
    public fun unit_activity(unit: &Unit): u64 { unit.activity }
    public fun unit_balance(unit: &Unit): u64 { balance::value(&unit.balance) }
    public fun colony_treasury(colony: &Colony): u64 { balance::value(&colony.treasury) }
    public fun protocol_treasury(protocol: &Protocol): u64 { balance::value(&protocol.treasury) }
    public fun protocol_fee_bps(protocol: &Protocol): u64 { protocol.fee_bps }
    public fun is_highway(path: &Path): bool { path.strength >= 50 }
    public fun is_toxic(path: &Path): bool { path.resistance > path.strength * 3 }
    public fun escrow_bounty(escrow: &Escrow): u64 { balance::value(&escrow.bounty) }
    public fun escrow_deadline(escrow: &Escrow): u64 { escrow.deadline }

    // =========================================================================
    // TEST HELPERS
    // =========================================================================

    #[test_only]
    public fun test_make_protocol(ctx: &mut TxContext): Protocol {
        Protocol {
            id: object::new(ctx),
            treasury: balance::zero(),
            fee_bps: 50,
        }
    }

    #[test_only]
    public fun test_destroy_protocol(protocol: Protocol) {
        let Protocol { id, treasury, fee_bps: _ } = protocol;
        balance::destroy_for_testing(treasury);
        object::delete(id);
    }
}
