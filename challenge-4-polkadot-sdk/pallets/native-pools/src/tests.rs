#![cfg(test)]

use super::*;
use mock::*;
use polkadot_sdk::frame_support::{assert_noop, assert_ok};

#[test]
fn deposit_works() {
    ExtBuilder::build().execute_with(|| {
        // Check initial state
        assert_eq!(PalletBalances::free_balance(&ALICE), 10000);
        assert_eq!(NativePools::total_deposited(), 0);

        // Alice deposits 1000 tokens
        assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), 1000));

        // Check balances after deposit
        assert_eq!(PalletBalances::free_balance(&ALICE), 9000);
        assert_eq!(
            PalletBalances::free_balance(&NativePools::account_id()),
            1000
        );
        assert_eq!(NativePools::total_deposited(), 1000);

        // Check deposit info
        let deposit_info = NativePools::deposits(&ALICE).unwrap();
        assert_eq!(deposit_info.amount, 1000);
        assert_eq!(deposit_info.reward_debt, 0); // No rewards yet
    });
}

#[test]
fn deposit_fails_with_zero_amount() {
    ExtBuilder::build().execute_with(|| {
        assert_noop!(
            NativePools::deposit(RuntimeOrigin::signed(ALICE), 0),
            Error::<Runtime>::ZeroAmount
        );
    });
}

#[test]
fn deposit_fails_with_insufficient_balance() {
    ExtBuilder::build().execute_with(|| {
        assert_noop!(
            NativePools::deposit(RuntimeOrigin::signed(ALICE), 20000),
            Error::<Runtime>::InsufficientBalance
        );
    });
}

#[test]
fn multiple_deposits_accumulate() {
    ExtBuilder::build().execute_with(|| {
        // Alice makes multiple deposits
        assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), 500));
        assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), 300));

        // Check accumulated deposit
        let deposit_info = NativePools::deposits(&ALICE).unwrap();
        assert_eq!(deposit_info.amount, 800);
        assert_eq!(NativePools::total_deposited(), 800);
        assert_eq!(PalletBalances::free_balance(&ALICE), 9200);
    });
}

#[test]
fn deposit_rewards_works() {
    ExtBuilder::build().execute_with(|| {
        // Alice deposits first
        assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), 1000));

        // Team deposits rewards
        assert_ok!(NativePools::deposit_rewards(
            RuntimeOrigin::signed(TEAM),
            100
        ));

        // Check pool state
        assert_eq!(NativePools::total_rewards(), 100);
        assert!(NativePools::acc_reward_per_share() > 0);

        // Pool should have total deposits + rewards
        assert_eq!(
            PalletBalances::free_balance(&NativePools::account_id()),
            1100
        );
    });
}

#[test]
fn deposit_rewards_fails_with_zero_amount() {
    ExtBuilder::build().execute_with(|| {
        assert_noop!(
            NativePools::deposit_rewards(RuntimeOrigin::signed(TEAM), 0),
            Error::<Runtime>::ZeroAmount
        );
    });
}

#[test]
fn claim_rewards_works() {
    ExtBuilder::build().execute_with(|| {
        // Alice deposits
        assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), 1000));

        // Team adds rewards
        assert_ok!(NativePools::deposit_rewards(
            RuntimeOrigin::signed(TEAM),
            200
        ));

        // Alice should have pending rewards
        let pending = NativePools::calculate_pending_rewards(&ALICE).unwrap();
        assert_eq!(pending, 200);

        let alice_balance_before = PalletBalances::free_balance(&ALICE);

        // Alice claims rewards
        assert_ok!(NativePools::claim_rewards(RuntimeOrigin::signed(ALICE)));

        // Check Alice received rewards
        assert_eq!(
            PalletBalances::free_balance(&ALICE),
            alice_balance_before + 200
        );

        // Alice should have no more pending rewards
        let pending_after = NativePools::calculate_pending_rewards(&ALICE).unwrap();
        assert_eq!(pending_after, 0);
    });
}

#[test]
fn claim_rewards_fails_without_deposit() {
    ExtBuilder::build().execute_with(|| {
        assert_noop!(
            NativePools::claim_rewards(RuntimeOrigin::signed(ALICE)),
            Error::<Runtime>::NoDeposit
        );
    });
}

#[test]
fn withdraw_partial_works() {
    ExtBuilder::build().execute_with(|| {
        // Alice deposits
        assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), 1000));

        // Team adds rewards
        assert_ok!(NativePools::deposit_rewards(
            RuntimeOrigin::signed(TEAM),
            100
        ));

        let alice_balance_before = PalletBalances::free_balance(&ALICE);

        // Alice withdraws half her deposit
        assert_ok!(NativePools::withdraw(
            RuntimeOrigin::signed(ALICE),
            Some(500)
        ));

        // Check Alice received withdrawn amount + rewards
        assert_eq!(
            PalletBalances::free_balance(&ALICE),
            alice_balance_before + 500 + 100
        );

        // Check remaining deposit
        let deposit_info = NativePools::deposits(&ALICE).unwrap();
        assert_eq!(deposit_info.amount, 500);
        assert_eq!(NativePools::total_deposited(), 500);
    });
}

#[test]
fn withdraw_full_works() {
    ExtBuilder::build().execute_with(|| {
        // Alice deposits
        assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), 1000));

        // Team adds rewards
        assert_ok!(NativePools::deposit_rewards(
            RuntimeOrigin::signed(TEAM),
            100
        ));

        let alice_balance_before = PalletBalances::free_balance(&ALICE);

        // Alice withdraws everything (None means full withdrawal)
        assert_ok!(NativePools::withdraw(RuntimeOrigin::signed(ALICE), None));

        // Check Alice received everything
        assert_eq!(
            PalletBalances::free_balance(&ALICE),
            alice_balance_before + 1000 + 100
        );

        // Check deposit is removed
        assert_eq!(NativePools::deposits(&ALICE), None);
        assert_eq!(NativePools::total_deposited(), 0);
    });
}

#[test]
fn withdraw_fails_without_deposit() {
    ExtBuilder::build().execute_with(|| {
        assert_noop!(
            NativePools::withdraw(RuntimeOrigin::signed(ALICE), Some(100)),
            Error::<Runtime>::NoDeposit
        );
    });
}

#[test]
fn withdraw_fails_with_excessive_amount() {
    ExtBuilder::build().execute_with(|| {
        // Alice deposits
        assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), 1000));

        // Try to withdraw more than deposited
        assert_noop!(
            NativePools::withdraw(RuntimeOrigin::signed(ALICE), Some(1500)),
            Error::<Runtime>::InsufficientBalance
        );
    });
}

#[test]
fn multiple_users_fair_reward_distribution() {
    ExtBuilder::build().execute_with(|| {
        // Alice deposits 1000, Bob deposits 2000
        assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), 1000));
        assert_ok!(NativePools::deposit(RuntimeOrigin::signed(BOB), 2000));

        // Team adds 300 rewards (should be split 1:2 ratio)
        assert_ok!(NativePools::deposit_rewards(
            RuntimeOrigin::signed(TEAM),
            300
        ));

        // Check pending rewards
        let alice_pending = NativePools::calculate_pending_rewards(&ALICE).unwrap();
        let bob_pending = NativePools::calculate_pending_rewards(&BOB).unwrap();

        assert_eq!(alice_pending, 100); // 1/3 of 300
        assert_eq!(bob_pending, 200); // 2/3 of 300

        // Both claim rewards
        assert_ok!(NativePools::claim_rewards(RuntimeOrigin::signed(ALICE)));
        assert_ok!(NativePools::claim_rewards(RuntimeOrigin::signed(BOB)));

        // Verify no pending rewards left
        assert_eq!(NativePools::calculate_pending_rewards(&ALICE).unwrap(), 0);
        assert_eq!(NativePools::calculate_pending_rewards(&BOB).unwrap(), 0);
    });
}

#[test]
fn rewards_accumulate_over_time() {
    ExtBuilder::build().execute_with(|| {
        // Alice deposits
        assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), 1000));

        // First reward distribution
        assert_ok!(NativePools::deposit_rewards(
            RuntimeOrigin::signed(TEAM),
            100
        ));

        // Second reward distribution
        assert_ok!(NativePools::deposit_rewards(
            RuntimeOrigin::signed(TEAM),
            50
        ));

        // Alice should have accumulated rewards
        let pending = NativePools::calculate_pending_rewards(&ALICE).unwrap();
        assert_eq!(pending, 150);

        // Alice claims all accumulated rewards
        let alice_balance_before = PalletBalances::free_balance(&ALICE);
        assert_ok!(NativePools::claim_rewards(RuntimeOrigin::signed(ALICE)));
        assert_eq!(
            PalletBalances::free_balance(&ALICE),
            alice_balance_before + 150
        );
    });
}

#[test]
fn late_joiner_gets_proportional_rewards() {
    ExtBuilder::build().execute_with(|| {
        // Alice deposits first
        assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), 1000));

        // First reward (Alice gets all)
        assert_ok!(NativePools::deposit_rewards(
            RuntimeOrigin::signed(TEAM),
            100
        ));

        // Bob joins after first reward
        assert_ok!(NativePools::deposit(RuntimeOrigin::signed(BOB), 1000));

        // Second reward (Alice and Bob split equally)
        assert_ok!(NativePools::deposit_rewards(
            RuntimeOrigin::signed(TEAM),
            200
        ));

        // Check pending rewards
        let alice_pending = NativePools::calculate_pending_rewards(&ALICE).unwrap();
        let bob_pending = NativePools::calculate_pending_rewards(&BOB).unwrap();

        assert_eq!(alice_pending, 200); // 100 (first) + 100 (half of second)
        assert_eq!(bob_pending, 100); // 100 (half of second reward only)
    });
}
