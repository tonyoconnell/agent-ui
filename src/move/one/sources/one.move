// =============================================================================
// ONE.MOVE — The Substrate on Sui
// =============================================================================
//
// Same ontology as sui.tql. Same structures. Same rules.
// TQL reasons. Move enforces. Two fires, one truth.
//
// Objects:
//   Unit     — owned object, fast path (no consensus)
//   Colony   — shared object, consensus required
//   Envelope — owned object, transferred on send, consumed on receive
//   Flow     — shared object, both endpoints modify
//   Highway  — frozen object, crystallized knowledge (immutable)
//
// =============================================================================

module one::substrate {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::vec_map::{Self, VecMap};
    use sui::clock::{Self, Clock};
    use std::string::{Self, String};

    // =========================================================================
    // OBJECTS — Mirror of sui.tql entities
    // =========================================================================

    /// Unit — an actor in the colony.
    /// Owned object: fast path, no consensus needed.
    /// TQL: entity unit, owns unit-id @key ...
    public struct Unit has key, store {
        id: UID,
        name: String,
        unit_type: String,          // "agent", "llm", "oracle", "worker"
        tasks: VecMap<String, bool>, // registered task names
        success_count: u64,
        failure_count: u64,
        activity: u64,              // recent activity score
        balance: u64,               // token balance
    }

    /// Colony — a group of units.
    /// Shared object: multiple units read/write.
    /// TQL: entity colony, owns colony-id @key ...
    public struct Colony has key {
        id: UID,
        name: String,
        colony_type: String,        // "swarm", "team", "coalition"
        units: vector<ID>,          // member unit IDs
        treasury: u64,              // shared pool
    }

    /// Envelope — a signal between units.
    /// Owned object: transferred to receiver, consumed on process.
    /// TQL: entity envelope, owns envelope-id @key ...
    public struct Envelope has key, store {
        id: UID,
        receiver: ID,               // target unit
        task_name: String,          // which task to invoke
        sender: ID,                 // origin unit
        payload: vector<u8>,        // arbitrary data
        timestamp: u64,
    }

    /// Flow — a weighted connection between units.
    /// Shared object: both source and target strengthen/resist.
    /// TQL: relation flow, owns strength, owns resistance ...
    public struct Flow has key {
        id: UID,
        source: ID,                 // source unit
        target: ID,                 // target unit
        flow_type: String,          // "interaction", "payment", "holding"
        strength: u64,              // success pheromone (trail)
        resistance: u64,            // failure pheromone (alarm)
        hits: u64,                  // successful traversals
        misses: u64,                // failed traversals
    }

    /// Highway — crystallized knowledge. Frozen on-chain.
    /// TQL: entity highway ... confidence
    /// Sui: transfer::freeze_object — immutable forever.
    public struct Highway has key {
        id: UID,
        source: ID,
        target: ID,
        strength: u64,              // strength at crystallization
        confidence: u64,            // certainty (0-100)
        crystallized_at: u64,       // timestamp
    }

    // =========================================================================
    // EVENTS — What Move emits, TypeDB ingests
    // =========================================================================

    public struct UnitCreated has copy, drop { unit_id: ID, name: String, unit_type: String }
    public struct EnvelopeSent has copy, drop { envelope_id: ID, sender: ID, receiver: ID, task: String }
    public struct EnvelopeConsumed has copy, drop { envelope_id: ID, receiver: ID }
    public struct FlowStrengthened has copy, drop { flow_id: ID, source: ID, target: ID, strength: u64 }
    public struct FlowResisted has copy, drop { flow_id: ID, source: ID, target: ID, resistance: u64 }
    public struct HighwayFormed has copy, drop { highway_id: ID, source: ID, target: ID, strength: u64 }
    public struct UnitDissolved has copy, drop { unit_id: ID }
    public struct ColonySplit has copy, drop { parent: ID, child_a: ID, child_b: ID }

    // =========================================================================
    // CREATE — Birth
    // =========================================================================

    /// Create a new unit. Caller owns it.
    /// TQL: insert $u isa unit, has unit-id $id, has name $name ...
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
            balance: 0,
        };
        event::emit(UnitCreated {
            unit_id: object::id(&unit),
            name: unit.name,
            unit_type: unit.unit_type,
        });
        unit
    }

    /// Register a task on a unit.
    public fun register_task(unit: &mut Unit, task_name: String) {
        vec_map::insert(&mut unit.tasks, task_name, true);
    }

    /// Create a shared colony.
    /// TQL: insert $c isa colony ...
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
            treasury: 0,
        };
        transfer::share_object(colony);
    }

    /// Join a colony. Adds unit ID to members.
    /// TQL: insert $m (group: $c, member: $u) isa membership
    public fun join_colony(colony: &mut Colony, unit: &Unit) {
        vector::push_back(&mut colony.units, object::id(unit));
    }

    // =========================================================================
    // SEND — The only operation that matters
    // =========================================================================

    /// Create and send an envelope. Transfers to receiver's owner.
    /// TQL: insert $e isa envelope, has receiver $r, has task-name $t ...
    public fun send(
        sender: &Unit,
        receiver_id: ID,
        task_name: String,
        payload: vector<u8>,
        receiver_owner: address,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let envelope = Envelope {
            id: object::new(ctx),
            receiver: receiver_id,
            task_name,
            sender: object::id(sender),
            payload,
            timestamp: clock::timestamp_ms(clock),
        };
        event::emit(EnvelopeSent {
            envelope_id: object::id(&envelope),
            sender: object::id(sender),
            receiver: receiver_id,
            task: envelope.task_name,
        });
        transfer::transfer(envelope, receiver_owner);
    }

    /// Consume an envelope. Unit processes it, envelope is destroyed.
    /// TQL: delete $e isa envelope ...
    /// This is the zero-return pattern: signal consumed, not bounced.
    public fun consume(envelope: Envelope, unit: &Unit) {
        let Envelope { id, receiver: _, task_name: _, sender: _, payload: _, timestamp: _ } = envelope;
        event::emit(EnvelopeConsumed {
            envelope_id: object::uid_to_inner(&id),
            receiver: object::id(unit),
        });
        object::delete(id);
    }

    // =========================================================================
    // STRENGTHEN / RESIST — Pheromone trail operations
    // =========================================================================

    /// Create a flow between two units.
    /// TQL: insert $f (source: $s, target: $t) isa flow ...
    public fun create_flow(
        source: ID,
        target: ID,
        flow_type: String,
        ctx: &mut TxContext,
    ) {
        let flow = Flow {
            id: object::new(ctx),
            source,
            target,
            flow_type,
            strength: 0,
            resistance: 0,
            hits: 0,
            misses: 0,
        };
        transfer::share_object(flow);
    }

    /// Strengthen a flow. Success pheromone.
    /// TQL: $f has strength ($s + $amount)
    public fun strengthen(flow: &mut Flow, amount: u64) {
        flow.strength = flow.strength + amount;
        flow.hits = flow.hits + 1;
        event::emit(FlowStrengthened {
            flow_id: object::id(flow),
            source: flow.source,
            target: flow.target,
            strength: flow.strength,
        });
    }

    /// Resist a flow. Failure pheromone.
    /// TQL: $f has resistance ($r + $amount)
    public fun resist(flow: &mut Flow, amount: u64) {
        flow.resistance = flow.resistance + amount;
        flow.misses = flow.misses + 1;
        event::emit(FlowResisted {
            flow_id: object::id(flow),
            source: flow.source,
            target: flow.target,
            resistance: flow.resistance,
        });
    }

    // =========================================================================
    // FADE — Decay (the forgetting that enables learning)
    // =========================================================================

    /// Decay all flows in a colony. Called periodically.
    /// TQL: external process — TypeDB doesn't mutate, Move does.
    /// This is where Move and TQL diverge: Move ACTS, TQL REASONS.
    public fun fade(flow: &mut Flow, rate: u64) {
        // rate = percentage to retain (e.g., 95 = 5% decay)
        flow.strength = flow.strength * rate / 100;
        flow.resistance = flow.resistance * rate / 100;
    }

    // =========================================================================
    // CRYSTALLIZE — Freeze knowledge permanently
    // =========================================================================

    /// When a flow reaches highway status, crystallize it.
    /// Sui: transfer::freeze_object — object becomes immutable.
    /// TQL: insert $h isa highway ... (permanent knowledge)
    ///
    /// This is the most beautiful mapping:
    /// freeze_object() IS crystallization.
    /// An immutable on-chain object IS permanent knowledge.
    public fun crystallize(
        flow: &Flow,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        // Only crystallize highways (strength >= 50)
        assert!(flow.strength >= 50, 0);

        let highway = Highway {
            id: object::new(ctx),
            source: flow.source,
            target: flow.target,
            strength: flow.strength,
            confidence: (flow.hits * 100) / (flow.hits + flow.misses + 1),
            crystallized_at: clock::timestamp_ms(clock),
        };
        event::emit(HighwayFormed {
            highway_id: object::id(&highway),
            source: flow.source,
            target: flow.target,
            strength: flow.strength,
        });
        // Frozen forever. Immutable. Permanent knowledge.
        transfer::freeze_object(highway);
    }

    // =========================================================================
    // APOPTOSIS — Programmed death (Spark 6)
    // =========================================================================

    /// Dissolve a unit with no incoming flows.
    /// Balance returns to colony treasury.
    /// TQL rule: dissolved-unit fires when activity < 1.0, no strong flows
    public fun dissolve(unit: Unit, colony: &mut Colony) {
        colony.treasury = colony.treasury + unit.balance;
        event::emit(UnitDissolved { unit_id: object::id(&unit) });
        let Unit { id, name: _, unit_type: _, tasks: _, success_count: _, failure_count: _, activity: _, balance: _ } = unit;
        object::delete(id);
    }

    // =========================================================================
    // ACCESSORS — Read state (for TypeDB sync)
    // =========================================================================

    public fun flow_strength(flow: &Flow): u64 { flow.strength }
    public fun flow_resistance(flow: &Flow): u64 { flow.resistance }
    public fun flow_hits(flow: &Flow): u64 { flow.hits }
    public fun flow_misses(flow: &Flow): u64 { flow.misses }
    public fun unit_activity(unit: &Unit): u64 { unit.activity }
    public fun unit_balance(unit: &Unit): u64 { unit.balance }
    public fun colony_treasury(colony: &Colony): u64 { colony.treasury }
    public fun is_highway(flow: &Flow): bool { flow.strength >= 50 }
    public fun is_toxic(flow: &Flow): bool { flow.resistance > flow.strength * 3 }
}
