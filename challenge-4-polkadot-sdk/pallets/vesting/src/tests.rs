#![cfg(test)]

use super::*;
use polkadot_sdk::frame_support::{assert_noop, assert_ok};
use polkadot_sdk::pallet_balances::{BalanceLock, Reasons};
use mock::*;


// HINTS:
// - Set block number in mock tests : System::set_block_number(<number>);
// - Get signed origin from the caller: RuntimeOrigin::signed(ALICE)/ RuntimeOrigin::signed(BOB)
// - Call vested_transfer with the origin, destination, and schedule : Vesting::vested_transfer(origin, dest, schedule)
// - Get the vesting schedules for an account: Vesting::vesting_schedules(&<account>)
// - Get error : Error::<Runtime>::ZeroVestingPeriod / Error::<Runtime>::ZeroVestingPeriodCount
// - Get the balance of an account: PalletBalances::free_balance(&<account>)
// - Get locked balance of an account: Vesting::locked(&<account>)
// - Transfer balance : PalletBalances::transfer(&<account>, &<account>, <amount>, <reason>)


#[test]
fn vested_transfer_works() {
	ExtBuilder::build().execute_with(|| {
		System::set_block_number(1);
		let schedule = VestingSchedule {
			start: 2u64,
			period: 10u64,
			period_count: 5u32,
			per_period: 100u64,
		};
		let total_amount = schedule.total_amount().unwrap();
		assert_eq!(total_amount, 500);
		assert_ok!(Vesting::vested_transfer(RuntimeOrigin::signed(ALICE), BOB, schedule.clone()));
		assert_eq!(PalletBalances::free_balance(&ALICE), ALICE_BALANCE - total_amount);
		assert_eq!(PalletBalances::free_balance(&BOB), total_amount);
		let locks = PalletBalances::locks(&BOB);
		assert_eq!(locks.len(), 1);
		assert_eq!(locks[0].id, VESTING_ID);
		assert_eq!(locks[0].amount, total_amount);
		let schedules = VestingSchedules::<Runtime>::get(&BOB);
		assert_eq!(schedules.len(), 1);
		assert_eq!(schedules[0], schedule);
	});
}


#[test]
fn vested_transfer_fails_if_zero_period_or_count() {
    ExtBuilder::build().execute_with(|| { 
		System::set_block_number(1);
		let schedule_zero_period = VestingSchedule {
			start: 2u64,
			period: 0u64,
			period_count: 5u32,
			per_period: 100u64,
		};
		assert_noop!(
			Vesting::vested_transfer(RuntimeOrigin::signed(ALICE), BOB, schedule_zero_period),
			Error::<Runtime>::ZeroVestingPeriod
		);
		let schedule_zero_count = VestingSchedule {
			start: 2u64,
			period: 10u64,
			period_count: 0u32,
			per_period: 100u64,
		};
		assert_noop!(
			Vesting::vested_transfer(RuntimeOrigin::signed(ALICE), BOB, schedule_zero_count),
			Error::<Runtime>::ZeroVestingPeriodCount
		);
    });
}

#[test]
fn claim_works() {
	ExtBuilder::build().execute_with(|| {
		System::set_block_number(1);
		let schedule = VestingSchedule {
			start: 2u64,
			period: 10u64,
			period_count: 5u32,
			per_period: 100u64,
		};
		let total_amount = schedule.total_amount().unwrap();
		assert_ok!(Vesting::vested_transfer(RuntimeOrigin::signed(ALICE), BOB, schedule));
		System::set_block_number(12);
		assert_ok!(Vesting::claim(RuntimeOrigin::signed(BOB)));
		let locks = PalletBalances::locks(&BOB);
		assert_eq!(locks.len(), 1);
		assert_eq!(locks[0].amount, 400); // 500 - 100 vested at block 12
	});
}

#[test]
fn update_vesting_schedules_works() {
	ExtBuilder::build().execute_with(|| {
		System::set_block_number(1);
		let schedule1 = VestingSchedule {
			start: 2u64,
			period: 10u64,
			period_count: 5u32,
			per_period: 100u64,
		};
		assert_ok!(Vesting::vested_transfer(RuntimeOrigin::signed(ALICE), BOB, schedule1.clone()));
		let new_schedules = vec![
			VestingSchedule {
				start: 3u64,
				period: 5u64,
				period_count: 2u32,
				per_period: 50u64,
			}, // total=100
			VestingSchedule {
				start: 4u64,
				period: 20u64,
				period_count: 2u32,
				per_period: 100u64,
			}, // total=200
		];
		assert_noop!(
			Vesting::update_vesting_schedules(RuntimeOrigin::signed(ALICE), BOB, new_schedules.clone()),
			DispatchError::BadOrigin
		);
		assert_ok!(Vesting::update_vesting_schedules(RuntimeOrigin::root(), BOB, new_schedules.clone()));
		let stored_schedules = VestingSchedules::<Runtime>::get(&BOB);
		assert_eq!(stored_schedules.len(), 2);
		assert_eq!(stored_schedules[0], new_schedules[0]);
		assert_eq!(stored_schedules[1], new_schedules[1]);
		let locks = PalletBalances::locks(&BOB);
		assert_eq!(locks[0].amount, 300); // 100 + 200 at block 1
	});
}


#[test]
fn multiple_vesting_schedule_claim_works() {
	ExtBuilder::build().execute_with(|| {
		System::set_block_number(1);
		let schedule1 = VestingSchedule {
			start: 2u64,
			period: 10u64,
			period_count: 3u32,
			per_period: 100u64,
		}; // total=300
		let schedule2 = VestingSchedule {
			start: 5u64,
			period: 5u64,
			period_count: 4u32,
			per_period: 50u64,
		}; // total=200
		assert_ok!(Vesting::vested_transfer(RuntimeOrigin::signed(ALICE), BOB, schedule1));
		assert_ok!(Vesting::vested_transfer(RuntimeOrigin::signed(ALICE), BOB, schedule2));
		let total_transferred = 300 + 200;
		assert_eq!(PalletBalances::free_balance(&BOB), total_transferred);
		let locks = PalletBalances::locks(&BOB);
		assert_eq!(locks[0].amount, total_transferred); // initially locked=500
		System::set_block_number(10);
		assert_ok!(Vesting::claim(RuntimeOrigin::signed(BOB)));
		// At block 10:
		// schedule1: (10-2)/10=0, vested=0, locked=300
		// schedule2: (10-5)/5=1, vested=1*50=50, locked=200-50=150
		// total locked=300+150=450
		let locks_after = PalletBalances::locks(&BOB);
		assert_eq!(locks_after[0].amount, 450);
	});
}

#[test]
fn force_remove_vesting_schedule_works() {
	ExtBuilder::build().execute_with(|| {
		System::set_block_number(1);
		// Create two vesting schedules
		let schedule1 = VestingSchedule {
			start: 2u64,
			period: 10u64,
			period_count: 3u32,
			per_period: 100u64,
		}; // total=300
		let schedule2 = VestingSchedule {
			start: 5u64,
			period: 5u64,
			period_count: 4u32,
			per_period: 50u64,
		}; // total=200

		// Create vesting schedules for BOB
		assert_ok!(Vesting::vested_transfer(RuntimeOrigin::signed(ALICE), BOB, schedule1));
		assert_ok!(Vesting::vested_transfer(RuntimeOrigin::signed(ALICE), BOB, schedule2.clone()));

		// Verify initial state
		let total_transferred = 300 + 200;
		assert_eq!(PalletBalances::free_balance(&BOB), total_transferred);
		let initial_schedules = VestingSchedules::<Runtime>::get(&BOB);
		assert_eq!(initial_schedules.len(), 2);

		// Try to remove schedule with non-root origin (should fail)
		assert_noop!(
			Vesting::force_remove_vesting_schedule(RuntimeOrigin::signed(ALICE), BOB, 0),
			DispatchError::BadOrigin
		);

		// Try to remove schedule with invalid index (should fail)
		assert_noop!(
			Vesting::force_remove_vesting_schedule(RuntimeOrigin::root(), BOB, 2),
			Error::<Runtime>::InvalidVestingIndex
		);

		// Remove first schedule (index 0)
		assert_ok!(Vesting::force_remove_vesting_schedule(RuntimeOrigin::root(), BOB, 0));

		// Verify state after removal
		let remaining_schedules = VestingSchedules::<Runtime>::get(&BOB);
		assert_eq!(remaining_schedules.len(), 1);
		assert_eq!(remaining_schedules[0], schedule2);

		// Verify lock amount is updated
		let locks = PalletBalances::locks(&BOB);
		assert_eq!(locks[0].amount, 200); // Only schedule2 remains (200 total)

		// Remove second schedule (index 0 since we removed the first one)
		assert_ok!(Vesting::force_remove_vesting_schedule(RuntimeOrigin::root(), BOB, 0));

		// Verify all schedules are removed
		let final_schedules = VestingSchedules::<Runtime>::get(&BOB);
		assert_eq!(final_schedules.len(), 0);

		// Verify lock is removed
		let final_locks = PalletBalances::locks(&BOB);
		assert_eq!(final_locks.len(), 0);
	});
}


