#![cfg(test)]

use super::*;
use polkadot_sdk::frame_support::{assert_noop, assert_ok};
use mock::*;

#[test]
fn deposit_works() {
	ExtBuilder::build().execute_with(|| {
		System::set_block_number(1);
		let deposit_amount = 500;
		assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), deposit_amount));

		// Check final state
		assert_eq!(PalletBalances::free_balance(&ALICE), ALICE_BALANCE - deposit_amount);
		assert_eq!(PalletBalances::free_balance(&NativePools::account_id()), deposit_amount);
		assert_eq!(NativePools::total_deposited(), deposit_amount);

		// Check deposit info
		let deposit_info = NativePools::deposits(ALICE).unwrap();
		assert_eq!(deposit_info.amount, deposit_amount);
		assert_eq!(deposit_info.reward_debt, 0);
	});
}

#[test]
fn deposit_fails_with_insufficient_balance() {
	ExtBuilder::build().execute_with(|| {
		System::set_block_number(1);
		assert_noop!(
			NativePools::deposit(RuntimeOrigin::signed(ALICE), ALICE_BALANCE + 1),
			Error::<Runtime>::InsufficientBalance
		);
	});
}

#[test]
fn deposit_fails_with_zero_amount() {
	ExtBuilder::build().execute_with(|| {
		System::set_block_number(1);
		assert_noop!(
			NativePools::deposit(RuntimeOrigin::signed(ALICE), 0),
			Error::<Runtime>::ZeroAmount
		);
	});
}

#[test]
fn withdraw_works() {
	ExtBuilder::build().execute_with(|| {
		System::set_block_number(1);
		let deposit_amount = 500;
		assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), deposit_amount));

		let withdraw_amount = 300;
		assert_ok!(NativePools::withdraw(RuntimeOrigin::signed(ALICE), Some(withdraw_amount)));

		// Check final state
		assert_eq!(PalletBalances::free_balance(&ALICE), ALICE_BALANCE - deposit_amount + withdraw_amount);
		assert_eq!(PalletBalances::free_balance(&NativePools::account_id()), deposit_amount - withdraw_amount);
		assert_eq!(NativePools::total_deposited(), deposit_amount - withdraw_amount);

		// Check deposit info
		let deposit_info = NativePools::deposits(ALICE).unwrap();
		assert_eq!(deposit_info.amount, deposit_amount - withdraw_amount);
	});
}

#[test]
fn withdraw_all_works() {
	ExtBuilder::build().execute_with(|| {
		System::set_block_number(1);
		let deposit_amount = 500;
		assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), deposit_amount));

		assert_ok!(NativePools::withdraw(RuntimeOrigin::signed(ALICE), None));

		// Check final state
		assert_eq!(PalletBalances::free_balance(&ALICE), ALICE_BALANCE);
		assert_eq!(PalletBalances::free_balance(&NativePools::account_id()), 0);
		assert_eq!(NativePools::total_deposited(), 0);

		// Check deposit info is removed
		assert!(NativePools::deposits(ALICE).is_none());
	});
}

#[test]
fn withdraw_fails_with_no_deposit() {
	ExtBuilder::build().execute_with(|| {
		System::set_block_number(1);
		assert_noop!(
			NativePools::withdraw(RuntimeOrigin::signed(ALICE), Some(100)),
			Error::<Runtime>::NoDeposit
		);
	});
}

#[test]
fn withdraw_fails_with_insufficient_deposit() {
	ExtBuilder::build().execute_with(|| {
		System::set_block_number(1);
		let deposit_amount = 100;
		assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), deposit_amount));

		assert_noop!(
			NativePools::withdraw(RuntimeOrigin::signed(ALICE), Some(deposit_amount + 1)),
			Error::<Runtime>::InsufficientPoolBalance
		);
	});
}

#[test]
fn deposit_rewards_works() {
	ExtBuilder::build().execute_with(|| {
		System::set_block_number(1);
		let deposit_amount = 500;
		assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), deposit_amount));

		let reward_amount = 1000;
		assert_ok!(NativePools::deposit_rewards(RuntimeOrigin::signed(CHARLIE), reward_amount));

		// Check final state
		assert_eq!(NativePools::total_rewards(), reward_amount);
		assert_eq!(NativePools::acc_reward_per_share(), 2_000_000_000_000); // 1000 * precision / 500
	});
}

#[test]
fn deposit_rewards_fails_with_bad_origin() {
	ExtBuilder::build().execute_with(|| {
		System::set_block_number(1);
		assert_noop!(
			NativePools::deposit_rewards(RuntimeOrigin::root(), 1000),
			DispatchError::BadOrigin
		);
	});
}

#[test]
fn deposit_rewards_fails_with_zero_amount() {
	ExtBuilder::build().execute_with(|| {
		System::set_block_number(1);
		let deposit_amount = 500;
		assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), deposit_amount));

		assert_noop!(
			NativePools::deposit_rewards(RuntimeOrigin::signed(CHARLIE), 0),
			Error::<Runtime>::ZeroAmount
		);
	});
}

#[test]
fn claim_rewards_works() {
	ExtBuilder::build().execute_with(|| {
		System::set_block_number(1);
		let deposit_amount = 500;
		assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), deposit_amount));

		let reward_amount = 1000;
		assert_ok!(NativePools::deposit_rewards(RuntimeOrigin::signed(CHARLIE), reward_amount));

		assert_ok!(NativePools::claim_rewards(RuntimeOrigin::signed(ALICE)));

		// Check final state
		assert_eq!(PalletBalances::free_balance(&ALICE), ALICE_BALANCE - deposit_amount + reward_amount);
		assert_eq!(PalletBalances::free_balance(&NativePools::account_id()), deposit_amount);
	});
}

#[test]
fn claim_rewards_fails_with_no_deposit() {
	ExtBuilder::build().execute_with(|| {
		System::set_block_number(1);
		assert_noop!(
			NativePools::claim_rewards(RuntimeOrigin::signed(ALICE)),
			Error::<Runtime>::NoDeposit
		);
	});
}

#[test]
fn partial_withdraw_with_rewards_works() {
	ExtBuilder::build().execute_with(|| {
		System::set_block_number(1);
		let deposit_amount = 500;
		assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), deposit_amount));

		let reward_amount = 1000;
		assert_ok!(NativePools::deposit_rewards(RuntimeOrigin::signed(CHARLIE), reward_amount));

		let withdraw_amount = 200;
		assert_ok!(NativePools::withdraw(RuntimeOrigin::signed(ALICE), Some(withdraw_amount)));

		// Check final state
		assert_eq!(PalletBalances::free_balance(&ALICE), ALICE_BALANCE - deposit_amount + withdraw_amount + reward_amount);
		assert_eq!(PalletBalances::free_balance(&NativePools::account_id()), deposit_amount - withdraw_amount);

		// Check deposit info
		let deposit_info = NativePools::deposits(ALICE).unwrap();
		assert_eq!(deposit_info.amount, deposit_amount - withdraw_amount);
	});
}

#[test]
fn withdraw_zero_amount_fails() {
	ExtBuilder::build().execute_with(|| {
		System::set_block_number(1);
		let deposit_amount = 500;
		assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), deposit_amount));

		assert_noop!(
			NativePools::withdraw(RuntimeOrigin::signed(ALICE), Some(0)),
			Error::<Runtime>::ZeroAmount
		);
	});
}

#[test]
fn multiple_deposits_accumulate() {
	ExtBuilder::build().execute_with(|| {
		System::set_block_number(1);
		// Alice makes multiple deposits
		assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), 500));
		assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), 300));

		// Check accumulated deposit amount
		let deposit_info = NativePools::deposits(ALICE).unwrap();
		assert_eq!(deposit_info.amount, 800);
		assert_eq!(NativePools::total_deposited(), 800);
		assert_eq!(PalletBalances::free_balance(&ALICE), ALICE_BALANCE - 800);
	});
}

#[test]
fn multiple_deposits_should_sum() {
	ExtBuilder::build().execute_with(|| {
		System::set_block_number(1);
		// Alice makes multiple deposits
		assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), 500));
		assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), 300));

		// Check accumulated deposit amount
		let deposit_info = NativePools::deposits(ALICE).unwrap();
		assert_eq!(deposit_info.amount, 800);
		assert_eq!(NativePools::total_deposited(), 800);
		assert_eq!(PalletBalances::free_balance(&ALICE), ALICE_BALANCE - 800);
	});
}

#[test]
fn reward_distribution_multiple_users() {
	ExtBuilder::build().execute_with(|| {
		System::set_block_number(1);
		// Alice deposits 1000, Bob deposits 1000
		assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), 1000));
		assert_ok!(NativePools::deposit(RuntimeOrigin::signed(BOB), 1000));

		// Team (Charlie) deposits 300 rewards
		assert_ok!(NativePools::deposit_rewards(RuntimeOrigin::signed(CHARLIE), 300));

		let alice_pending = NativePools::calculate_pending_rewards(&ALICE).unwrap();
		let bob_pending = NativePools::calculate_pending_rewards(&BOB).unwrap();

		assert_eq!(alice_pending, 150); // 1/2 of 300
		assert_eq!(bob_pending, 150);   // 1/2 of 300

		// Both claim their rewards
		assert_ok!(NativePools::claim_rewards(RuntimeOrigin::signed(ALICE)));
		assert_ok!(NativePools::claim_rewards(RuntimeOrigin::signed(BOB)));

		// No pending rewards should remain
		assert_eq!(NativePools::calculate_pending_rewards(&ALICE).unwrap(), 0);
		assert_eq!(NativePools::calculate_pending_rewards(&BOB).unwrap(), 0);
	});
}

#[test]
fn rewards_accumulate_over_time() {
	ExtBuilder::build().execute_with(|| {
		System::set_block_number(1);
		// Alice deposits 1000
		assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), 1000));

		// First reward distribution
		assert_ok!(NativePools::deposit_rewards(RuntimeOrigin::signed(CHARLIE), 100));
		// Second reward distribution
		assert_ok!(NativePools::deposit_rewards(RuntimeOrigin::signed(CHARLIE), 50));

		// Alice should have accumulated 150 rewards
		let pending = NativePools::calculate_pending_rewards(&ALICE).unwrap();
		assert_eq!(pending, 150);

		// Claim rewards and verify balance increase
		let balance_before = PalletBalances::free_balance(&ALICE);
		assert_ok!(NativePools::claim_rewards(RuntimeOrigin::signed(ALICE)));
		assert_eq!(PalletBalances::free_balance(&ALICE), balance_before + 150);
	});
}

#[test]
fn rewards_accumulate_with_multiple_deposits() {
	ExtBuilder::build().execute_with(|| {
		System::set_block_number(1);
		// Alice deposits 1000
		assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), 1000));

		// First reward distribution
		assert_ok!(NativePools::deposit_rewards(RuntimeOrigin::signed(CHARLIE), 100));
		// Second reward distribution
		assert_ok!(NativePools::deposit_rewards(RuntimeOrigin::signed(CHARLIE), 50));

		// Alice should have accumulated 150 rewards
		let pending = NativePools::calculate_pending_rewards(&ALICE).unwrap();
		assert_eq!(pending, 150);

		// Claim rewards and verify balance increase
		let balance_before = PalletBalances::free_balance(&ALICE);
		assert_ok!(NativePools::claim_rewards(RuntimeOrigin::signed(ALICE)));
		assert_eq!(PalletBalances::free_balance(&ALICE), balance_before + 150);
	});
}

#[test]
fn late_joiner_receives_proportional_rewards() {
	ExtBuilder::build().execute_with(|| {
		System::set_block_number(1);
		// Alice deposits first
		assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), 1000));

		// First reward (Alice receives all)
		assert_ok!(NativePools::deposit_rewards(RuntimeOrigin::signed(CHARLIE), 100));

		// Bob joins later
		assert_ok!(NativePools::deposit(RuntimeOrigin::signed(BOB), 1000));

		// Second reward should be split evenly
		assert_ok!(NativePools::deposit_rewards(RuntimeOrigin::signed(CHARLIE), 200));

		let alice_pending = NativePools::calculate_pending_rewards(&ALICE).unwrap();
		let bob_pending = NativePools::calculate_pending_rewards(&BOB).unwrap();

		assert_eq!(alice_pending, 200); // 100 (first) + 100 (half of second)
		assert_eq!(bob_pending, 100);   // Half of second reward only
	});
}

#[test]
fn deposit_rewards_without_any_deposits_fails() {
	ExtBuilder::build().execute_with(|| {
		System::set_block_number(1);
		// No user deposits yet
		assert_noop!(
			NativePools::deposit_rewards(RuntimeOrigin::signed(CHARLIE), 1000),
			Error::<Runtime>::ArithmeticOverflow
		);
	});
}

#[test]
fn claim_rewards_twice_fails_with_zero_amount() {
	ExtBuilder::build().execute_with(|| {
		System::set_block_number(1);
		// Alice deposit and team adds rewards
		assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), 500));
		assert_ok!(NativePools::deposit_rewards(RuntimeOrigin::signed(CHARLIE), 200));

		// First claim succeeds
		assert_ok!(NativePools::claim_rewards(RuntimeOrigin::signed(ALICE)));

		// Second claim should fail because no rewards left
		assert_noop!(
			NativePools::claim_rewards(RuntimeOrigin::signed(ALICE)),
			Error::<Runtime>::ZeroAmount
		);
	});
}

#[test]
fn withdraw_full_using_amount_parameter_works() {
	ExtBuilder::build().execute_with(|| {
		System::set_block_number(1);
		// Alice deposits 400
		assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), 400));

		// Withdraw the entire amount specifying Some(amount)
		assert_ok!(NativePools::withdraw(RuntimeOrigin::signed(ALICE), Some(400)));

		// Deposit entry should be gone
		assert!(NativePools::deposits(ALICE).is_none());
		assert_eq!(NativePools::total_deposited(), 0);
	});
}

#[test]
fn partial_withdraw_then_claim_rewards_works() {
	ExtBuilder::build().execute_with(|| {
		System::set_block_number(1);
		// Alice deposits 1000
		assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), 1000));

		// Team deposits initial rewards 300
		assert_ok!(NativePools::deposit_rewards(RuntimeOrigin::signed(CHARLIE), 300));

		// Alice withdraws half (500)
		assert_ok!(NativePools::withdraw(RuntimeOrigin::signed(ALICE), Some(500)));

		// Team deposits more rewards 200
		assert_ok!(NativePools::deposit_rewards(RuntimeOrigin::signed(CHARLIE), 200));

		// Now Alice should have pending rewards only for remaining 500 stake
		let pending = NativePools::calculate_pending_rewards(&ALICE).unwrap();
		// Remaining stake 500, total rewards per share should allocate 200 across total 500 stake = 200 per share
		assert_eq!(pending, 200);

		// Claim rewards
		assert_ok!(NativePools::claim_rewards(RuntimeOrigin::signed(ALICE)));

		// Pending rewards now zero
		assert_eq!(NativePools::calculate_pending_rewards(&ALICE).unwrap(), 0);
	});
}

#[test]
fn minimal_deposit_and_reward_precision_works() {
	ExtBuilder::build().execute_with(|| {
		System::set_block_number(1);
		// Alice deposits the minimum amount 1
		assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), 1));

		// Charlie deposits reward 1
		assert_ok!(NativePools::deposit_rewards(RuntimeOrigin::signed(CHARLIE), 1));

		// Alice should have pending 1 reward (exact division with precision)
		let pending = NativePools::calculate_pending_rewards(&ALICE).unwrap();
		assert_eq!(pending, 1);
	});
}

#[test]
fn reward_debt_updates_after_claim_and_new_rewards() {
	ExtBuilder::build().execute_with(|| {
		System::set_block_number(1);
		// Alice deposits 300
		assert_ok!(NativePools::deposit(RuntimeOrigin::signed(ALICE), 300));
		// Charlie rewards 300
		assert_ok!(NativePools::deposit_rewards(RuntimeOrigin::signed(CHARLIE), 300));

		// Claim once
		assert_ok!(NativePools::claim_rewards(RuntimeOrigin::signed(ALICE)));
		assert_eq!(NativePools::calculate_pending_rewards(&ALICE).unwrap(), 0);

		// New rewards
		assert_ok!(NativePools::deposit_rewards(RuntimeOrigin::signed(CHARLIE), 150));
		// Now pending should equal 150
		assert_eq!(NativePools::calculate_pending_rewards(&ALICE).unwrap(), 150);
	});
}

