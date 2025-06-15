#![cfg(test)]

use super::*;
use polkadot_sdk::frame_support::{assert_noop, assert_ok};
use mock::*;

/// Vested transfer end‑to‑end flow with intermediate claims.
#[test]
fn vested_transfer_works() {
	ExtBuilder::build().execute_with(|| {
		// Current block
		System::set_block_number(1);

		// Create a schedule: total 20 vested over 2 periods.
		let schedule = VestingSchedule {
			start: 10,
			period: 5,
			period_count: 2,
			per_period: 10,
		};

		// Perform vested transfer from Alice to Bob.
		assert_ok!(Vesting::vested_transfer(RuntimeOrigin::signed(ALICE), BOB, schedule.clone()));

		// One schedule stored for Bob and full amount locked.
		assert_eq!(Vesting::vesting_schedules(&BOB).len(), 1);
		assert_eq!(Vesting::locked_balance(&BOB), 20);

		// Move one period forward and claim.
		System::set_block_number(15);
		assert_ok!(Vesting::claim(RuntimeOrigin::signed(BOB)));
		assert_eq!(Vesting::locked_balance(&BOB), 10);

		// Move past the final period and claim again to unlock everything.
		System::set_block_number(25);
		assert_ok!(Vesting::claim(RuntimeOrigin::signed(BOB)));
		assert_eq!(Vesting::locked_balance(&BOB), 0);
		assert_eq!(PalletBalances::locks(&BOB).len(), 0);
	});
}

/// Transfer must fail if period or period_count is zero.
#[test]
fn vested_transfer_fails_if_zero_period_or_count() {
    ExtBuilder::build().execute_with(|| { 
		let zero_period = VestingSchedule { start: 10, period: 0, period_count: 1, per_period: 10 };
		assert_noop!(
			Vesting::vested_transfer(RuntimeOrigin::signed(ALICE), BOB, zero_period),
			Error::<Runtime>::ZeroVestingPeriod
		);

		let zero_count = VestingSchedule { start: 10, period: 5, period_count: 0, per_period: 10 };
		assert_noop!(
			Vesting::vested_transfer(RuntimeOrigin::signed(ALICE), BOB, zero_count),
			Error::<Runtime>::ZeroVestingPeriodCount
		);
    });
}

/// Claim correctly updates and removes locks when fully vested.
#[test]
fn claim_works() {
	ExtBuilder::build().execute_with(|| {
		let schedule = VestingSchedule { start: 5, period: 5, period_count: 3, per_period: 10 };
		assert_ok!(Vesting::vested_transfer(RuntimeOrigin::signed(ALICE), BOB, schedule));

		// Fast‑forward beyond full vesting.
		System::set_block_number(30);
		assert_ok!(Vesting::claim(RuntimeOrigin::signed(BOB)));

		assert_eq!(Vesting::locked_balance(&BOB), 0);
		assert_eq!(PalletBalances::locks(&BOB).len(), 0);
	});
}

/// Root can overwrite an account's vesting schedules.
#[test]
fn update_vesting_schedules_works() {
	ExtBuilder::build().execute_with(|| {
		let schedule1 = VestingSchedule { start: 10, period: 10, period_count: 3, per_period: 10 };
		let schedule2 = VestingSchedule { start: 20, period: 10, period_count: 2, per_period: 10 };
		let schedules = vec![schedule1.clone(), schedule2.clone()];

		assert_ok!(Vesting::update_vesting_schedules(RuntimeOrigin::root(), CHARLIE, schedules));
		assert_eq!(Vesting::vesting_schedules(&CHARLIE).len(), 2);
		assert_eq!(Vesting::locked_balance(&CHARLIE), 50);

		// Partial vesting after some blocks.
		System::set_block_number(25);
		assert_ok!(Vesting::claim(RuntimeOrigin::signed(CHARLIE)));
		assert!(Vesting::locked_balance(&CHARLIE) < 50);
	});
}

/// Claims on multiple schedules unlock proportionally over time.
#[test]
fn multiple_vesting_schedule_claim_works() {
	ExtBuilder::build().execute_with(|| {
		let schedule1 = VestingSchedule { start: 5, period: 5, period_count: 2, per_period: 10 }; // total 20
		let schedule2 = VestingSchedule { start: 10, period: 5, period_count: 2, per_period: 10 }; // total 20

		assert_ok!(Vesting::vested_transfer(RuntimeOrigin::signed(ALICE), BOB, schedule1));
		assert_ok!(Vesting::vested_transfer(RuntimeOrigin::signed(ALICE), BOB, schedule2));

		assert_eq!(Vesting::vesting_schedules(&BOB).len(), 2);
		assert_eq!(Vesting::locked_balance(&BOB), 40);

		System::set_block_number(15);
		assert_ok!(Vesting::claim(RuntimeOrigin::signed(BOB)));
		let locked_mid = Vesting::locked_balance(&BOB);
		assert!(locked_mid < 40 && locked_mid > 0);

		System::set_block_number(30);
		assert_ok!(Vesting::claim(RuntimeOrigin::signed(BOB)));
		assert_eq!(Vesting::locked_balance(&BOB), 0);
	});
}