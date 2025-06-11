#![cfg(test)]

use super::*;
use polkadot_sdk::frame_support::{assert_noop, assert_ok};
use polkadot_sdk::pallet_balances::{BalanceLock, Reasons};
use mock::*;


#[test]
fn vested_transfer_works() {
	ExtBuilder::build().execute_with(|| {
		System::set_block_number(1);

		let schedule = VestingSchedule {
			start: 5u64,
			period: 10u64,
			period_count: 1u32,
			per_period: 100u64,
		};
		assert_ok!(Vesting::vested_transfer(
			RuntimeOrigin::signed(ALICE),
			BOB,
			schedule.clone()
		));
		assert_eq!(Vesting::vesting_schedules(&BOB), vec![schedule.clone()]);
	});
}


#[test]
fn vested_transfer_fails_if_zero_period_or_count() {
    ExtBuilder::build().execute_with(|| { 
        let schedule = VestingSchedule {
			start: 1u64,
			period: 0u64,
			period_count: 1u32,
			per_period: 100u64,
		};
		assert_noop!(
			Vesting::vested_transfer(RuntimeOrigin::signed(ALICE), BOB, schedule),
			Error::<Runtime>::ZeroVestingPeriod
		);

		let schedule = VestingSchedule {
			start: 1u64,
			period: 1u64,
			period_count: 0u32,
			per_period: 100u64,
		};
		assert_noop!(
			Vesting::vested_transfer(RuntimeOrigin::signed(ALICE), BOB, schedule),
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
			period_count: 2u32,
			per_period: 10u64,
		};
		assert_ok!(Vesting::vested_transfer(RuntimeOrigin::signed(ALICE), BOB, schedule));

		System::set_block_number(11);
		// remain locked if not claimed
		assert!(PalletBalances::transfer(&BOB, &ALICE, 10, ExistenceRequirement::AllowDeath).is_err());
		// unlocked after claiming
		assert_ok!(Vesting::claim(RuntimeOrigin::signed(BOB)));
		assert!(VestingSchedules::<Runtime>::contains_key(BOB));
		assert_ok!(PalletBalances::transfer(
			&BOB,
			&ALICE,
			10,
			ExistenceRequirement::AllowDeath
		));
		// more are still locked
		assert!(PalletBalances::transfer(&BOB, &ALICE, 1, ExistenceRequirement::AllowDeath).is_err());

		System::set_block_number(21);
		// claim more
		assert_ok!(Vesting::claim(RuntimeOrigin::signed(BOB)));
		assert!(!VestingSchedules::<Runtime>::contains_key(BOB));
		assert_ok!(PalletBalances::transfer(
			&BOB,
			&ALICE,
			10,
			ExistenceRequirement::AllowDeath
		));
		// all used up
		assert_eq!(PalletBalances::free_balance(BOB), 0);

		// no locks anymore
		assert_eq!(PalletBalances::locks(&BOB), vec![]);
	});
}

#[test]
fn update_vesting_schedules_works() {
	ExtBuilder::build().execute_with(|| {
        System::set_block_number(1);
		let schedule = VestingSchedule {
			start: 3u64,
			period: 10u64,
			period_count: 2u32,
			per_period: 10u64,
		};
		assert_ok!(Vesting::vested_transfer(RuntimeOrigin::signed(ALICE), BOB, schedule));

		let updated_schedule = VestingSchedule {
			start: 4u64,
			period: 20u64,
			period_count: 2u32,
			per_period: 10u64,
		};
		assert_ok!(Vesting::update_vesting_schedules(
			RuntimeOrigin::root(),
			BOB,
			vec![updated_schedule]
		));

		assert_ok!(Vesting::claim(RuntimeOrigin::signed(BOB)));
		assert!(PalletBalances::transfer(&BOB, &ALICE, 1, ExistenceRequirement::AllowDeath).is_err());

		assert_ok!(Vesting::claim(RuntimeOrigin::signed(BOB)));
		assert_ok!(PalletBalances::transfer(
			&BOB,
			&ALICE,
			10,
			ExistenceRequirement::AllowDeath
		));

		// empty vesting schedules cleanup the storage and unlock the fund
		assert!(VestingSchedules::<Runtime>::contains_key(BOB));
		assert_eq!(
			PalletBalances::locks(&BOB).get(0),
			Some(&BalanceLock {
				id: VESTING_ID,
				amount: 10u64,
				reasons: Reasons::All,
			})
		);
		assert_ok!(Vesting::update_vesting_schedules(RuntimeOrigin::root(), BOB, vec![]));
		assert!(!VestingSchedules::<Runtime>::contains_key(BOB));
		assert_eq!(PalletBalances::locks(&BOB), vec![]);
	});
}


#[test]
fn multiple_vesting_schedule_claim_works() {
	ExtBuilder::build().execute_with(|| {

        System::set_block_number(1);
		let schedule = VestingSchedule {
			start: 2u64,
			period: 10u64,
			period_count: 2u32,
			per_period: 10u64,
		};
		assert_ok!(Vesting::vested_transfer(
			RuntimeOrigin::signed(ALICE),
			BOB,
			schedule.clone()
		));
		System::set_block_number(23);

		let schedule2 = VestingSchedule {
			start: 25u64,
			period: 10u64,
			period_count: 3u32,
			per_period: 10u64,
		};
		assert_ok!(Vesting::vested_transfer(
			RuntimeOrigin::signed(ALICE),
			BOB,
			schedule2.clone()
		));

		assert_eq!(Vesting::vesting_schedules(&BOB), vec![schedule, schedule2.clone()]);

		System::set_block_number(56);

		assert_ok!(Vesting::claim(RuntimeOrigin::signed(BOB)));

		assert_eq!(Vesting::vesting_schedules(&BOB), vec![schedule2]);

		System::set_block_number(100);

		assert_ok!(Vesting::claim(RuntimeOrigin::signed(BOB)));

		assert!(!VestingSchedules::<Runtime>::contains_key(&BOB));

		assert_eq!(PalletBalances::locks(&BOB), vec![]);
	});
}



