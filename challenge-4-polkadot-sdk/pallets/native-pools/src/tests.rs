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

// TODO: Add tests for the pallet native pools 
