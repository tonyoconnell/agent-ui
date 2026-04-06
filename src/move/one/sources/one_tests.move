#[test_only]
module one::substrate_tests {
    use one::substrate::{Self, Unit, Path, Protocol};
    use sui::test_scenario;
    use sui::coin;
    use sui::sui::SUI;
    use std::string;

    const ADMIN: address = @0xAD;
    const ALICE: address = @0xA1;
    const BOB: address = @0xB0;

    // =========================================================================
    // Helpers
    // =========================================================================

    fun make_protocol(ctx: &mut TxContext): Protocol {
        // Mirror init() but return for test use
        substrate::test_make_protocol(ctx)
    }

    fun make_unit(name: vector<u8>, unit_type: vector<u8>, ctx: &mut TxContext): Unit {
        substrate::create_unit(
            string::utf8(name),
            string::utf8(unit_type),
            ctx,
        )
    }

    // =========================================================================
    // Tests
    // =========================================================================

    #[test]
    fun test_create_unit() {
        let mut scenario = test_scenario::begin(ALICE);
        let ctx = test_scenario::ctx(&mut scenario);

        let unit = make_unit(b"scout", b"agent", ctx);
        assert!(substrate::unit_balance(&unit) == 0);
        assert!(substrate::unit_activity(&unit) == 0);

        transfer::public_transfer(unit, ALICE);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_deposit_withdraw() {
        let mut scenario = test_scenario::begin(ALICE);
        let ctx = test_scenario::ctx(&mut scenario);

        let mut unit = make_unit(b"scout", b"agent", ctx);

        // Deposit 1000 MIST
        let coin = coin::mint_for_testing<SUI>(1000, ctx);
        substrate::deposit(&mut unit, coin);
        assert!(substrate::unit_balance(&unit) == 1000);

        // Withdraw 400
        let withdrawn = substrate::withdraw(&mut unit, 400, ctx);
        assert!(coin::value(&withdrawn) == 400);
        assert!(substrate::unit_balance(&unit) == 600);

        coin::burn_for_testing(withdrawn);
        transfer::public_transfer(unit, ALICE);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_create_path_and_mark_warn() {
        let mut scenario = test_scenario::begin(ALICE);
        let ctx = test_scenario::ctx(&mut scenario);

        let scout = make_unit(b"scout", b"agent", ctx);
        let analyst = make_unit(b"analyst", b"agent", ctx);

        let scout_id = object::id(&scout);
        let analyst_id = object::id(&analyst);

        substrate::create_path(scout_id, analyst_id, string::utf8(b"interaction"), ctx);

        transfer::public_transfer(scout, ALICE);
        transfer::public_transfer(analyst, BOB);

        // Mark and warn the path
        test_scenario::next_tx(&mut scenario, ALICE);
        let mut path = test_scenario::take_shared<Path>(&scenario);

        substrate::mark(&mut path, 3);
        assert!(substrate::path_strength(&path) == 3);
        assert!(substrate::path_hits(&path) == 1);

        substrate::warn(&mut path, 1);
        assert!(substrate::path_resistance(&path) == 1);
        assert!(substrate::path_misses(&path) == 1);

        assert!(!substrate::is_highway(&path));
        assert!(!substrate::is_toxic(&path));

        test_scenario::return_shared(path);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_pay() {
        let mut scenario = test_scenario::begin(ADMIN);
        let ctx = test_scenario::ctx(&mut scenario);

        let mut from = make_unit(b"scout", b"agent", ctx);
        let to = make_unit(b"analyst", b"agent", ctx);
        let from_id = object::id(&from);
        let to_id = object::id(&to);

        // Fund sender
        let coin = coin::mint_for_testing<SUI>(10000, ctx);
        substrate::deposit(&mut from, coin);

        // Create path + protocol
        substrate::create_path(from_id, to_id, string::utf8(b"payment"), ctx);
        let mut protocol = make_protocol(ctx);

        transfer::public_transfer(from, ALICE);
        transfer::public_transfer(to, BOB);

        test_scenario::next_tx(&mut scenario, ALICE);
        let mut from = test_scenario::take_from_address<Unit>(&scenario, ALICE);
        let mut to = test_scenario::take_from_address<Unit>(&scenario, BOB);
        let mut path = test_scenario::take_shared<Path>(&scenario);

        // Pay 1000 MIST (fee = 50 bps = 5 MIST)
        substrate::pay(&mut from, &mut to, 1000, &mut path, &mut protocol);

        assert!(substrate::unit_balance(&from) == 9000);
        assert!(substrate::unit_balance(&to) == 995);     // 1000 - 5 fee
        assert!(substrate::protocol_treasury(&protocol) == 5);
        assert!(substrate::path_strength(&path) == 1);
        assert!(substrate::path_revenue(&path) == 1000);

        test_scenario::return_to_address(ALICE, from);
        test_scenario::return_to_address(BOB, to);
        test_scenario::return_shared(path);
        substrate::test_destroy_protocol(protocol);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_fade() {
        let mut scenario = test_scenario::begin(ALICE);
        let ctx = test_scenario::ctx(&mut scenario);

        let scout = make_unit(b"scout", b"agent", ctx);
        let analyst = make_unit(b"analyst", b"agent", ctx);
        let scout_id = object::id(&scout);
        let analyst_id = object::id(&analyst);

        substrate::create_path(scout_id, analyst_id, string::utf8(b"interaction"), ctx);

        transfer::public_transfer(scout, ALICE);
        transfer::public_transfer(analyst, BOB);

        test_scenario::next_tx(&mut scenario, ALICE);
        let mut path = test_scenario::take_shared<Path>(&scenario);

        substrate::mark(&mut path, 100);
        substrate::warn(&mut path, 50);

        // Fade at 95% (decay 5%)
        substrate::fade(&mut path, 95);
        assert!(substrate::path_strength(&path) == 95);
        assert!(substrate::path_resistance(&path) == 47);  // 50 * 95 / 100

        test_scenario::return_shared(path);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_is_highway_and_toxic() {
        let mut scenario = test_scenario::begin(ALICE);
        let ctx = test_scenario::ctx(&mut scenario);

        let scout = make_unit(b"a", b"agent", ctx);
        let analyst = make_unit(b"b", b"agent", ctx);

        substrate::create_path(object::id(&scout), object::id(&analyst), string::utf8(b"interaction"), ctx);

        transfer::public_transfer(scout, ALICE);
        transfer::public_transfer(analyst, BOB);

        test_scenario::next_tx(&mut scenario, ALICE);
        let mut path = test_scenario::take_shared<Path>(&scenario);

        // Highway: strength >= 50
        substrate::mark(&mut path, 50);
        assert!(substrate::is_highway(&path));

        // Toxic: resistance > strength * 3
        substrate::warn(&mut path, 151);
        assert!(substrate::is_toxic(&path));

        test_scenario::return_shared(path);
        test_scenario::end(scenario);
    }
}
