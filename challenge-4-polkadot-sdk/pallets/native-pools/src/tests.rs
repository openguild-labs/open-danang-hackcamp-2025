#![cfg(test)]

use super::*;
use polkadot_sdk::frame_support::{assert_noop, assert_ok};
use mock::*;

/// Happy‑path flow: user deposits, rewards are added, user withdraws all.
#[test]
fn deposit_and_withdraw_with_rewards() {
    ExtBuilder::build().execute_with(|| {
        // Alice deposits 50 tokens.
        assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), 50));

        // Pool state updated.
        assert_eq!(NativePools::total_deposited(), 50);

        // Root deposits 20 tokens as rewards.
        assert_ok!(NativePools::deposit_rewards(RuntimeOrigin::root(), 20));

        // Pending rewards for Alice should now equal 20.
        let pending = NativePools::calculate_pending_rewards(&ALICE).unwrap();
        assert_eq!(pending, 20);

        // Alice withdraws her full stake (None implies full withdrawal).
        assert_ok!(NativePools::withdraw(RuntimeOrigin::signed(ALICE), None));

        // Alice ends up with initial balance plus reward (100 + 20).
        assert_eq!(PalletBalances::free_balance(&ALICE), 120);

        // Pool state reset.
        assert_eq!(NativePools::total_deposited(), 0);
        assert_eq!(NativePools::total_rewards(), 0);
    });
}

/// User claims rewards without withdrawing the principal.
#[test]
fn claim_rewards_works() {
    ExtBuilder::build().execute_with(|| {
        // Initial deposit.
        assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), 40));

        // Add rewards.
        assert_ok!(NativePools::deposit_rewards(RuntimeOrigin::root(), 10));

        // Claim rewards only.
        assert_ok!(NativePools::claim_rewards(RuntimeOrigin::signed(ALICE)));

        // Balance should reflect reward payout.
        assert_eq!(PalletBalances::free_balance(&ALICE), ALICE_BALANCE - 40 + 10);

        // Rewards pool emptied.
        assert_eq!(NativePools::total_rewards(), 0);

        // Deposit remains locked.
        let info = NativePools::deposits(&ALICE).expect("deposit info should exist");
        assert_eq!(info.amount, 40);
    });
}

/// Zero‑amount deposit must fail.
#[test]
fn deposit_fails_for_zero_amount() {
    ExtBuilder::build().execute_with(|| {
        assert_noop!(
            NativePools::deposit(RuntimeOrigin::signed(ALICE), 0),
            Error::<Runtime>::ZeroAmount
        );
    });
}