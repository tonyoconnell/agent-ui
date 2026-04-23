// =============================================================================
// SCOPED_WALLET_TESTS.MOVE — Test suite for one::scoped_wallet
// =============================================================================
//
// Error code reference (all are private `const` in scoped_wallet — use literals):
//   0  EZeroDailyCap
//   1  E_NOT_AGENT
//   2  E_PAUSED
//   3  E_CAP_EXCEEDED
//   4  E_NOT_ALLOWED
//   5  E_NOT_OWNER
//
// Public constants: none — all are module-private. Use numeric abort codes
// in every #[expected_failure] annotation.
// =============================================================================

#[test_only]
module one::scoped_wallet_tests {
    use one::scoped_wallet;
    use sui::test_scenario;
    use sui::coin;
    use sui::sui::SUI;

    // =========================================================================
    // Constants
    // =========================================================================

    const OWNER: address     = @0xAA;
    const AGENT: address     = @0xBB;
    const RECIPIENT: address = @0xCC;
    const OTHER: address     = @0xDD;
    const DAILY_CAP: u64     = 1_000_000_000; // 1 SUI in MIST

    // =========================================================================
    // Helper: create a wallet (owner calls create<SUI>)
    // =========================================================================

    // Creates a ScopedWallet<SUI> with no allowlist (any recipient permitted)
    // and transfers it to OWNER. Returns the scenario ready for next_tx.
    fun setup_wallet_open(): test_scenario::Scenario {
        let mut scenario = test_scenario::begin(OWNER);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            scoped_wallet::create<SUI>(
                AGENT,
                DAILY_CAP,
                vector[],   // empty allowlist → any recipient allowed
                ctx,
            );
        };
        scenario
    }

    // Creates a ScopedWallet<SUI> restricted to RECIPIENT only.
    fun setup_wallet_restricted(): test_scenario::Scenario {
        let mut scenario = test_scenario::begin(OWNER);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            scoped_wallet::create<SUI>(
                AGENT,
                DAILY_CAP,
                vector[RECIPIENT],
                ctx,
            );
        };
        scenario
    }

    // =========================================================================
    // Test: create — verify fields after creation
    // =========================================================================

    #[test]
    fun test_create() {
        let mut scenario = test_scenario::begin(OWNER);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            scoped_wallet::create<SUI>(AGENT, DAILY_CAP, vector[], ctx);
        };
        // Owner receives the wallet object
        test_scenario::next_tx(&mut scenario, OWNER);
        {
            let wallet = test_scenario::take_from_sender<scoped_wallet::ScopedWallet<SUI>>(&scenario);
            // The module exposes no accessor functions — field correctness is
            // validated indirectly via spend/pause behaviour in subsequent tests.
            // Return the object cleanly.
            test_scenario::return_to_sender(&scenario, wallet);
        };
        test_scenario::end(scenario);
    }

    // =========================================================================
    // Test: spend within daily cap — succeeds, spent_today tracked
    // =========================================================================

    #[test]
    fun test_spend_within_cap() {
        let mut scenario = setup_wallet_open();
        // Advance to AGENT's transaction
        test_scenario::next_tx(&mut scenario, AGENT);
        {
            let mut wallet =
                test_scenario::take_from_address<scoped_wallet::ScopedWallet<SUI>>(
                    &scenario, OWNER,
                );
            let ctx = test_scenario::ctx(&mut scenario);
            // Mint a coin and spend half the daily cap
            let mut coin = coin::mint_for_testing<SUI>(DAILY_CAP, ctx);
            let amount = DAILY_CAP / 2;
            scoped_wallet::spend<SUI>(&mut wallet, &mut coin, RECIPIENT, amount, ctx);
            // Coin value should be reduced by amount
            assert!(coin::value(&coin) == DAILY_CAP - amount, 0);
            // Clean up
            coin::burn_for_testing(coin);
            test_scenario::return_to_address(OWNER, wallet);
        };
        test_scenario::end(scenario);
    }

    // =========================================================================
    // Test: spend exceeds daily cap → aborts E_CAP_EXCEEDED (3)
    // =========================================================================

    #[test]
    #[expected_failure(abort_code = 3)]
    fun test_spend_exceeds_cap() {
        let mut scenario = setup_wallet_open();
        test_scenario::next_tx(&mut scenario, AGENT);
        {
            let mut wallet =
                test_scenario::take_from_address<scoped_wallet::ScopedWallet<SUI>>(
                    &scenario, OWNER,
                );
            let ctx = test_scenario::ctx(&mut scenario);
            // Attempt to spend more than daily_cap in one call
            let mut coin = coin::mint_for_testing<SUI>(DAILY_CAP + 1, ctx);
            scoped_wallet::spend<SUI>(&mut wallet, &mut coin, RECIPIENT, DAILY_CAP + 1, ctx);
            // Unreachable — abort expected
            coin::burn_for_testing(coin);
            test_scenario::return_to_address(OWNER, wallet);
        };
        test_scenario::end(scenario);
    }

    // =========================================================================
    // Test: non-agent tries to spend → aborts E_NOT_AGENT (1)
    // =========================================================================

    #[test]
    #[expected_failure(abort_code = 1)]
    fun test_spend_not_agent() {
        let mut scenario = setup_wallet_open();
        // OTHER (not AGENT) attempts spend
        test_scenario::next_tx(&mut scenario, OTHER);
        {
            let mut wallet =
                test_scenario::take_from_address<scoped_wallet::ScopedWallet<SUI>>(
                    &scenario, OWNER,
                );
            let ctx = test_scenario::ctx(&mut scenario);
            let mut coin = coin::mint_for_testing<SUI>(DAILY_CAP, ctx);
            scoped_wallet::spend<SUI>(&mut wallet, &mut coin, RECIPIENT, 1, ctx);
            // Unreachable
            coin::burn_for_testing(coin);
            test_scenario::return_to_address(OWNER, wallet);
        };
        test_scenario::end(scenario);
    }

    // =========================================================================
    // Test: pause blocks spend; unpause restores it
    // =========================================================================

    #[test]
    fun test_pause_blocks_spend() {
        let mut scenario = setup_wallet_open();

        // OWNER pauses
        test_scenario::next_tx(&mut scenario, OWNER);
        {
            let mut wallet =
                test_scenario::take_from_sender<scoped_wallet::ScopedWallet<SUI>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            scoped_wallet::pause<SUI>(&mut wallet, ctx);
            test_scenario::return_to_sender(&scenario, wallet);
        };

        // AGENT tries to spend — must abort (E_PAUSED = 2)
        // We verify the paused branch via a separate expected_failure test below.
        // Here we test the full pause → unpause → spend sequence:
        test_scenario::next_tx(&mut scenario, OWNER);
        {
            let mut wallet =
                test_scenario::take_from_sender<scoped_wallet::ScopedWallet<SUI>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            scoped_wallet::unpause<SUI>(&mut wallet, ctx);
            test_scenario::return_to_sender(&scenario, wallet);
        };

        // After unpause, AGENT can spend again
        test_scenario::next_tx(&mut scenario, AGENT);
        {
            let mut wallet =
                test_scenario::take_from_address<scoped_wallet::ScopedWallet<SUI>>(
                    &scenario, OWNER,
                );
            let ctx = test_scenario::ctx(&mut scenario);
            let mut coin = coin::mint_for_testing<SUI>(DAILY_CAP, ctx);
            scoped_wallet::spend<SUI>(&mut wallet, &mut coin, RECIPIENT, 1, ctx);
            coin::burn_for_testing(coin);
            test_scenario::return_to_address(OWNER, wallet);
        };
        test_scenario::end(scenario);
    }

    // =========================================================================
    // Test: spend while paused → aborts E_PAUSED (2)
    // =========================================================================

    #[test]
    #[expected_failure(abort_code = 2)]
    fun test_spend_while_paused() {
        let mut scenario = setup_wallet_open();

        // OWNER pauses
        test_scenario::next_tx(&mut scenario, OWNER);
        {
            let mut wallet =
                test_scenario::take_from_sender<scoped_wallet::ScopedWallet<SUI>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            scoped_wallet::pause<SUI>(&mut wallet, ctx);
            test_scenario::return_to_sender(&scenario, wallet);
        };

        // AGENT tries to spend → abort
        test_scenario::next_tx(&mut scenario, AGENT);
        {
            let mut wallet =
                test_scenario::take_from_address<scoped_wallet::ScopedWallet<SUI>>(
                    &scenario, OWNER,
                );
            let ctx = test_scenario::ctx(&mut scenario);
            let mut coin = coin::mint_for_testing<SUI>(DAILY_CAP, ctx);
            scoped_wallet::spend<SUI>(&mut wallet, &mut coin, RECIPIENT, 1, ctx);
            coin::burn_for_testing(coin);
            test_scenario::return_to_address(OWNER, wallet);
        };
        test_scenario::end(scenario);
    }

    // =========================================================================
    // Test: revoke destroys the object — non-owner revoke aborts (E_NOT_OWNER = 5)
    // =========================================================================

    #[test]
    fun test_revoke() {
        let mut scenario = setup_wallet_open();
        // OWNER revokes — takes ownership of the object (revoke consumes it)
        test_scenario::next_tx(&mut scenario, OWNER);
        {
            let wallet =
                test_scenario::take_from_sender<scoped_wallet::ScopedWallet<SUI>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            scoped_wallet::revoke<SUI>(wallet, ctx);
            // Object deleted — no return needed
        };
        test_scenario::end(scenario);
    }

    // =========================================================================
    // Test: non-owner revoke → aborts E_NOT_OWNER (5)
    // =========================================================================

    #[test]
    #[expected_failure(abort_code = 5)]
    fun test_revoke_not_owner() {
        let mut scenario = setup_wallet_open();
        // OTHER takes and tries to revoke — must abort
        test_scenario::next_tx(&mut scenario, OTHER);
        {
            // Wallet is owned by OWNER; we take from OWNER's address since
            // take_from_sender would fail (wrong sender). Instead, we borrow
            // from owner's address explicitly.
            let wallet =
                test_scenario::take_from_address<scoped_wallet::ScopedWallet<SUI>>(
                    &scenario, OWNER,
                );
            let ctx = test_scenario::ctx(&mut scenario);
            // ctx.sender() == OTHER ≠ wallet.owner → E_NOT_OWNER
            scoped_wallet::revoke<SUI>(wallet, ctx);
        };
        test_scenario::end(scenario);
    }

    // =========================================================================
    // Test: fund — coin transferred to wallet address, event emitted
    // =========================================================================

    #[test]
    fun test_fund() {
        let mut scenario = setup_wallet_open();
        // Anyone (RECIPIENT) can fund the wallet
        test_scenario::next_tx(&mut scenario, RECIPIENT);
        {
            let mut wallet =
                test_scenario::take_from_address<scoped_wallet::ScopedWallet<SUI>>(
                    &scenario, OWNER,
                );
            let ctx = test_scenario::ctx(&mut scenario);
            // Mint a coin representing the top-up
            let top_up = coin::mint_for_testing<SUI>(500_000_000, ctx);
            // fund() transfers coin to wallet's object address and emits WalletFunded
            scoped_wallet::fund<SUI>(&mut wallet, top_up, ctx);
            // No balance accessor — correctness verified by absence of abort
            test_scenario::return_to_address(OWNER, wallet);
        };
        test_scenario::end(scenario);
    }

    // =========================================================================
    // Test: rotate_day — resets spent_today after epoch advances
    // =========================================================================

    #[test]
    fun test_rotate_day() {
        let mut scenario = setup_wallet_open();

        // AGENT spends up to the cap in epoch 0
        test_scenario::next_tx(&mut scenario, AGENT);
        {
            let mut wallet =
                test_scenario::take_from_address<scoped_wallet::ScopedWallet<SUI>>(
                    &scenario, OWNER,
                );
            let ctx = test_scenario::ctx(&mut scenario);
            let mut coin = coin::mint_for_testing<SUI>(DAILY_CAP, ctx);
            scoped_wallet::spend<SUI>(&mut wallet, &mut coin, RECIPIENT, DAILY_CAP, ctx);
            coin::burn_for_testing(coin);
            test_scenario::return_to_address(OWNER, wallet);
        };

        // Advance epoch (anyone can call rotate_day — permissionless)
        test_scenario::next_tx(&mut scenario, OTHER);
        {
            let mut wallet =
                test_scenario::take_from_address<scoped_wallet::ScopedWallet<SUI>>(
                    &scenario, OWNER,
                );
            let ctx = test_scenario::ctx(&mut scenario);
            // Increment the epoch counter on the context
            sui::tx_context::increment_epoch_number(ctx);
            scoped_wallet::rotate_day<SUI>(&mut wallet, ctx);
            test_scenario::return_to_address(OWNER, wallet);
        };

        // AGENT can now spend again (spent_today was reset to 0)
        test_scenario::next_tx(&mut scenario, AGENT);
        {
            let mut wallet =
                test_scenario::take_from_address<scoped_wallet::ScopedWallet<SUI>>(
                    &scenario, OWNER,
                );
            let ctx = test_scenario::ctx(&mut scenario);
            // Advance the ctx epoch so spend()'s maybe_reset_epoch fires consistently
            sui::tx_context::increment_epoch_number(ctx);
            let mut coin = coin::mint_for_testing<SUI>(DAILY_CAP, ctx);
            scoped_wallet::spend<SUI>(&mut wallet, &mut coin, RECIPIENT, DAILY_CAP, ctx);
            coin::burn_for_testing(coin);
            test_scenario::return_to_address(OWNER, wallet);
        };
        test_scenario::end(scenario);
    }

    // =========================================================================
    // Test: rotate_owner — transfers ownership to new_owner
    // =========================================================================

    #[test]
    fun test_rotate_owner() {
        let mut scenario = setup_wallet_open();

        // OWNER rotates ownership to OTHER
        test_scenario::next_tx(&mut scenario, OWNER);
        {
            let mut wallet =
                test_scenario::take_from_sender<scoped_wallet::ScopedWallet<SUI>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            scoped_wallet::rotate_owner<SUI>(&mut wallet, OTHER, ctx);
            test_scenario::return_to_sender(&scenario, wallet);
        };

        // Verify: original OWNER can no longer pause (should abort E_NOT_OWNER)
        // Instead, verify new owner (OTHER) can successfully pause.
        // The wallet object is still at OWNER's address (transfer didn't change
        // the owning address — only the `owner` field in the struct changed).
        test_scenario::next_tx(&mut scenario, OTHER);
        {
            let mut wallet =
                test_scenario::take_from_address<scoped_wallet::ScopedWallet<SUI>>(
                    &scenario, OWNER,
                );
            let ctx = test_scenario::ctx(&mut scenario);
            // OTHER is now the owner — pause must succeed
            scoped_wallet::pause<SUI>(&mut wallet, ctx);
            test_scenario::return_to_address(OWNER, wallet);
        };
        test_scenario::end(scenario);
    }

    // =========================================================================
    // Test: rotate_owner by non-owner → aborts E_NOT_OWNER (5)
    // =========================================================================

    #[test]
    #[expected_failure(abort_code = 5)]
    fun test_rotate_owner_not_owner() {
        let mut scenario = setup_wallet_open();
        test_scenario::next_tx(&mut scenario, OTHER);
        {
            let mut wallet =
                test_scenario::take_from_address<scoped_wallet::ScopedWallet<SUI>>(
                    &scenario, OWNER,
                );
            let ctx = test_scenario::ctx(&mut scenario);
            scoped_wallet::rotate_owner<SUI>(&mut wallet, OTHER, ctx);
            test_scenario::return_to_address(OWNER, wallet);
        };
        test_scenario::end(scenario);
    }

    // =========================================================================
    // Test: spawn_child — creates child wallet owned by parent's object address
    // =========================================================================

    #[test]
    fun test_spawn_child() {
        let mut scenario = setup_wallet_open();

        test_scenario::next_tx(&mut scenario, OWNER);
        {
            let wallet =
                test_scenario::take_from_sender<scoped_wallet::ScopedWallet<SUI>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            // Spawn a child with half the parent's daily cap
            scoped_wallet::spawn_child<SUI>(
                &wallet,
                AGENT,
                DAILY_CAP / 2,
                vector[],
                ctx,
            );
            test_scenario::return_to_sender(&scenario, wallet);
        };
        // Child wallet is transferred to parent's object address.
        // We verify the call succeeded without aborting — no accessor for child fields.
        test_scenario::end(scenario);
    }

    // =========================================================================
    // Test: spawn_child with cap exceeding parent's → aborts E_CAP_EXCEEDED (3)
    // =========================================================================

    #[test]
    #[expected_failure(abort_code = 3)]
    fun test_spawn_child_exceeds_parent_cap() {
        let mut scenario = setup_wallet_open();
        test_scenario::next_tx(&mut scenario, OWNER);
        {
            let wallet =
                test_scenario::take_from_sender<scoped_wallet::ScopedWallet<SUI>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            // child_daily_cap > parent.daily_cap → E_CAP_EXCEEDED
            scoped_wallet::spawn_child<SUI>(
                &wallet,
                AGENT,
                DAILY_CAP + 1,
                vector[],
                ctx,
            );
            test_scenario::return_to_sender(&scenario, wallet);
        };
        test_scenario::end(scenario);
    }

    // =========================================================================
    // Test: spawn_child by non-owner → aborts E_NOT_OWNER (5)
    // =========================================================================

    #[test]
    #[expected_failure(abort_code = 5)]
    fun test_spawn_child_not_owner() {
        let mut scenario = setup_wallet_open();
        test_scenario::next_tx(&mut scenario, OTHER);
        {
            let wallet =
                test_scenario::take_from_address<scoped_wallet::ScopedWallet<SUI>>(
                    &scenario, OWNER,
                );
            let ctx = test_scenario::ctx(&mut scenario);
            scoped_wallet::spawn_child<SUI>(
                &wallet,
                AGENT,
                DAILY_CAP / 2,
                vector[],
                ctx,
            );
            test_scenario::return_to_address(OWNER, wallet);
        };
        test_scenario::end(scenario);
    }

    // =========================================================================
    // Test: allowlist enforcement — spend to non-allowed recipient aborts (E_NOT_ALLOWED = 4)
    // =========================================================================

    #[test]
    #[expected_failure(abort_code = 4)]
    fun test_allowlist_violation() {
        // Wallet restricted to RECIPIENT only
        let mut scenario = setup_wallet_restricted();
        test_scenario::next_tx(&mut scenario, AGENT);
        {
            let mut wallet =
                test_scenario::take_from_address<scoped_wallet::ScopedWallet<SUI>>(
                    &scenario, OWNER,
                );
            let ctx = test_scenario::ctx(&mut scenario);
            let mut coin = coin::mint_for_testing<SUI>(DAILY_CAP, ctx);
            // OTHER is not in the allowlist → E_NOT_ALLOWED
            scoped_wallet::spend<SUI>(&mut wallet, &mut coin, OTHER, 1, ctx);
            coin::burn_for_testing(coin);
            test_scenario::return_to_address(OWNER, wallet);
        };
        test_scenario::end(scenario);
    }

    // =========================================================================
    // Test: allowlist permit — spend to allowed recipient succeeds
    // =========================================================================

    #[test]
    fun test_allowlist_permit() {
        let mut scenario = setup_wallet_restricted();
        test_scenario::next_tx(&mut scenario, AGENT);
        {
            let mut wallet =
                test_scenario::take_from_address<scoped_wallet::ScopedWallet<SUI>>(
                    &scenario, OWNER,
                );
            let ctx = test_scenario::ctx(&mut scenario);
            let mut coin = coin::mint_for_testing<SUI>(DAILY_CAP, ctx);
            // RECIPIENT is in the allowlist → succeeds
            scoped_wallet::spend<SUI>(&mut wallet, &mut coin, RECIPIENT, 1, ctx);
            coin::burn_for_testing(coin);
            test_scenario::return_to_address(OWNER, wallet);
        };
        test_scenario::end(scenario);
    }

    // =========================================================================
    // Test: cumulative spend across two calls — both within cap → succeed
    // =========================================================================

    #[test]
    fun test_cumulative_spend_within_cap() {
        let mut scenario = setup_wallet_open();
        test_scenario::next_tx(&mut scenario, AGENT);
        {
            let mut wallet =
                test_scenario::take_from_address<scoped_wallet::ScopedWallet<SUI>>(
                    &scenario, OWNER,
                );
            let ctx = test_scenario::ctx(&mut scenario);
            let half = DAILY_CAP / 2;
            let mut coin = coin::mint_for_testing<SUI>(DAILY_CAP, ctx);
            // First spend: half cap
            scoped_wallet::spend<SUI>(&mut wallet, &mut coin, RECIPIENT, half, ctx);
            // Second spend: remaining half
            scoped_wallet::spend<SUI>(&mut wallet, &mut coin, RECIPIENT, half, ctx);
            assert!(coin::value(&coin) == 0, 0);
            coin::burn_for_testing(coin);
            test_scenario::return_to_address(OWNER, wallet);
        };
        test_scenario::end(scenario);
    }

    // =========================================================================
    // Test: cumulative spend exceeds cap on second call → aborts E_CAP_EXCEEDED (3)
    // =========================================================================

    #[test]
    #[expected_failure(abort_code = 3)]
    fun test_cumulative_spend_exceeds_cap() {
        let mut scenario = setup_wallet_open();
        test_scenario::next_tx(&mut scenario, AGENT);
        {
            let mut wallet =
                test_scenario::take_from_address<scoped_wallet::ScopedWallet<SUI>>(
                    &scenario, OWNER,
                );
            let ctx = test_scenario::ctx(&mut scenario);
            let mut coin = coin::mint_for_testing<SUI>(DAILY_CAP + 1, ctx);
            // First spend: full cap
            scoped_wallet::spend<SUI>(&mut wallet, &mut coin, RECIPIENT, DAILY_CAP, ctx);
            // Second spend: even 1 MIST more → cap exceeded
            scoped_wallet::spend<SUI>(&mut wallet, &mut coin, RECIPIENT, 1, ctx);
            coin::burn_for_testing(coin);
            test_scenario::return_to_address(OWNER, wallet);
        };
        test_scenario::end(scenario);
    }

    // =========================================================================
    // Test: create with zero daily_cap → aborts EZeroDailyCap (0)
    // =========================================================================

    #[test]
    #[expected_failure(abort_code = 0)]
    fun test_create_zero_cap() {
        let mut scenario = test_scenario::begin(OWNER);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            scoped_wallet::create<SUI>(AGENT, 0, vector[], ctx);
        };
        test_scenario::end(scenario);
    }

    // =========================================================================
    // Test: pause by non-owner → aborts E_NOT_OWNER (5)
    // =========================================================================

    #[test]
    #[expected_failure(abort_code = 5)]
    fun test_pause_not_owner() {
        let mut scenario = setup_wallet_open();
        test_scenario::next_tx(&mut scenario, OTHER);
        {
            let mut wallet =
                test_scenario::take_from_address<scoped_wallet::ScopedWallet<SUI>>(
                    &scenario, OWNER,
                );
            let ctx = test_scenario::ctx(&mut scenario);
            scoped_wallet::pause<SUI>(&mut wallet, ctx);
            test_scenario::return_to_address(OWNER, wallet);
        };
        test_scenario::end(scenario);
    }

    // =========================================================================
    // Test: unpause by non-owner → aborts E_NOT_OWNER (5)
    // =========================================================================

    #[test]
    #[expected_failure(abort_code = 5)]
    fun test_unpause_not_owner() {
        let mut scenario = setup_wallet_open();

        // First pause as OWNER
        test_scenario::next_tx(&mut scenario, OWNER);
        {
            let mut wallet =
                test_scenario::take_from_sender<scoped_wallet::ScopedWallet<SUI>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            scoped_wallet::pause<SUI>(&mut wallet, ctx);
            test_scenario::return_to_sender(&scenario, wallet);
        };

        // OTHER tries to unpause → abort
        test_scenario::next_tx(&mut scenario, OTHER);
        {
            let mut wallet =
                test_scenario::take_from_address<scoped_wallet::ScopedWallet<SUI>>(
                    &scenario, OWNER,
                );
            let ctx = test_scenario::ctx(&mut scenario);
            scoped_wallet::unpause<SUI>(&mut wallet, ctx);
            test_scenario::return_to_address(OWNER, wallet);
        };
        test_scenario::end(scenario);
    }
}
