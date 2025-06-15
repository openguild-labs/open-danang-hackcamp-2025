#![cfg(test)]

use super::*;
use mock::*;
use polkadot_sdk::frame_support::{assert_noop, assert_ok};
use polkadot_sdk::pallet_balances::{BalanceLock, Reasons};

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
        // Check if the initial balances are correct
        assert_eq!(PalletBalances::free_balance(&ALICE), 100);
        assert_eq!(PalletBalances::free_balance(&BOB), 0);

        // Create a vesting schedule
        let schedule = VestingSchedule {
            start: 100,
            period: 10,
            period_count: 5,
            per_period: 10,
        };

        // Total amount should be 5 (period_count) * 10 (per_period) = 50
        assert_eq!(schedule.total_amount(), Some(50));

        // Perform vested transfer
        assert_ok!(Vesting::vested_transfer(
            RuntimeOrigin::signed(ALICE),
            BOB,
            schedule
        ));

        // Verify balances after transfer
        // ALICE has 50 after transfer
        assert_eq!(PalletBalances::free_balance(&ALICE), 50);
        // BOB has 50 free balance but it's considered frozen/locked
        assert_eq!(PalletBalances::free_balance(&BOB), 50);

        // Verify vesting schedule was created
        let schedules = Vesting::vesting_schedules(&BOB);
        assert_eq!(schedules.len(), 1);
        assert_eq!(schedules[0].start, 100);
        assert_eq!(schedules[0].period, 10);
        assert_eq!(schedules[0].period_count, 5);
        assert_eq!(schedules[0].per_period, 10);

        // Verify locked balance of BOB (should be 50 since all tokens are locked)
        assert_eq!(Vesting::locked_balance(&BOB), 50);
        assert_eq!(Vesting::vested_balance(&BOB), 0);
    });
}

#[test]
fn vested_transfer_fails_if_zero_period_or_count() {
    ExtBuilder::build().execute_with(|| {
        // Create a vesting schedule with zero period
        let schedule_1 = VestingSchedule {
            start: 100,
            period: 0,
            period_count: 10,
            per_period: 10,
        };

        // Check if the vested transfer fails if the period is zero
        assert_noop!(
            Vesting::vested_transfer(RuntimeOrigin::signed(ALICE), BOB, schedule_1),
            Error::<Runtime>::ZeroVestingPeriod
        );

        // Create another with zero count
        let schedule_2 = VestingSchedule {
            start: 100,
            period: 10,
            period_count: 0,
            per_period: 10,
        };

        // Check if the vested transfer fails if the count is zero
        assert_noop!(
            Vesting::vested_transfer(RuntimeOrigin::signed(ALICE), BOB, schedule_2),
            Error::<Runtime>::ZeroVestingPeriodCount
        );
    });
}

#[test]
fn claim_works() {
    ExtBuilder::build().execute_with(|| {
        // Create a vesting schedule
        let schedule = VestingSchedule {
            start: 100,
            period: 10,
            period_count: 5,
            per_period: 10,
        };

        // Perform vested transfer
        assert_ok!(Vesting::vested_transfer(
            RuntimeOrigin::signed(ALICE),
            BOB,
            schedule
        ));

        // Validation before claim, locked balance is 50
        // Check if the locked balance of BOB is 50
        assert_eq!(Vesting::locked_balance(&BOB), 50);

        // Check if the vested balance of BOB is 0
        assert_eq!(Vesting::vested_balance(&BOB), 0);

        // Check if BOB has 50 free balance but frozen/locked
        assert_eq!(PalletBalances::free_balance(&BOB), 50);

        // Check if the vesting schedule has 1 schedule
        let schedules = Vesting::vesting_schedules(&BOB);
        assert_eq!(schedules.len(), 1);

        // Move block until the end of the vesting schedule, which is schedule.period_count * schedule.period
        System::set_block_number(150);

        // Check if the claim works
        assert_ok!(Vesting::claim(RuntimeOrigin::signed(BOB)));

        // Validation after claim, locked balance will move to vested balance
        // Check if the locked balance of BOB is 0
        assert_eq!(Vesting::locked_balance(&BOB), 0);

        // Check if the vested balance of BOB is 50
        assert_eq!(Vesting::vested_balance(&BOB), 50);
    });
}

#[test]
fn update_vesting_schedules_works() {
    ExtBuilder::build().execute_with(|| {
        // Create a vesting schedule, with total amount 50
        let schedule = VestingSchedule {
            start: 100,
            period: 10,
            period_count: 5,
            per_period: 10,
        };

        // Perform vested transfer
        assert_ok!(Vesting::vested_transfer(
            RuntimeOrigin::signed(ALICE),
            BOB,
            schedule.clone()
        ));

        // Check if the vesting schedule is updated
        let schedules = Vesting::vesting_schedules(&BOB);
        assert_eq!(schedules.len(), 1);
        assert_eq!(schedules[0].start, schedule.start.clone());
        assert_eq!(schedules[0].period, schedule.period.clone());
        assert_eq!(schedules[0].period_count, schedule.period_count.clone());
        assert_eq!(schedules[0].per_period, schedule.per_period.clone());

        // Check if the locked balance of BOB is 50
        assert_eq!(Vesting::locked_balance(&BOB), 50);

        // Check if the vested balance of BOB is 0
        assert_eq!(Vesting::vested_balance(&BOB), 0);

        // Check if BOB has 50 free balance but frozen/locked
        assert_eq!(PalletBalances::free_balance(&BOB), 50);

        // Update the vesting schedule, but keeping the same total amount (50)
        let new_schedule = VestingSchedule {
            start: 50,
            period: 2,
            period_count: 2,
            per_period: 25,
        };

        // Check if BOB has 50 free balance but frozen/locked
        assert_eq!(PalletBalances::free_balance(&BOB), 50);

        // Update the vesting schedule
        assert_ok!(Vesting::update_vesting_schedules(
            RuntimeOrigin::root(),
            BOB,
            vec![new_schedule.clone()]
        ));

        // Check if the vesting schedule is updated
        let schedules = Vesting::vesting_schedules(&BOB);
        assert_eq!(schedules.len(), 1);
        assert_eq!(schedules[0].start, new_schedule.start.clone());
        assert_eq!(schedules[0].period, new_schedule.period.clone());
        assert_eq!(schedules[0].period_count, new_schedule.period_count.clone());
        assert_eq!(schedules[0].per_period, new_schedule.per_period.clone());
    });
}

#[test]
fn multiple_vesting_schedule_claim_works() {
    ExtBuilder::build().execute_with(|| {
        // Create a vesting schedule
        let schedule = VestingSchedule {
            start: 100,
            period: 4,
            period_count: 5,
            per_period: 4,
        };

        // Perform vested transfer
        assert_ok!(Vesting::vested_transfer(
            RuntimeOrigin::signed(ALICE),
            BOB,
            schedule.clone()
        ));

        // Create another vesting schedule
        let schedule_2 = VestingSchedule {
            start: 100,
            period: 2,
            period_count: 10,
            per_period: 2,
        };

        // Perform vested transfer
        assert_ok!(Vesting::vested_transfer(
            RuntimeOrigin::signed(ALICE),
            BOB,
            schedule_2.clone()
        ));

        // Validation before claim
        // Check if the locked balance of BOB is 40
        assert_eq!(Vesting::locked_balance(&BOB), 40);
        // Check if the vested balance of BOB is 0
        assert_eq!(Vesting::vested_balance(&BOB), 0);
        // Check if BOB has 40 free balance but frozen/locked
        assert_eq!(PalletBalances::free_balance(&BOB), 40);

        // Check if the vesting schedule is updated
        let schedules = Vesting::vesting_schedules(&BOB);
        assert_eq!(schedules.len(), 2);
        assert_eq!(schedules[0].start, schedule.start.clone());
        assert_eq!(schedules[0].period, schedule.period.clone());
        assert_eq!(schedules[0].period_count, schedule.period_count.clone());
        assert_eq!(schedules[0].per_period, schedule.per_period.clone());
        assert_eq!(schedules[1].start, schedule_2.start.clone());
        assert_eq!(schedules[1].period, schedule_2.period.clone());
        assert_eq!(schedules[1].period_count, schedule_2.period_count.clone());
        assert_eq!(schedules[1].per_period, schedule_2.per_period.clone());

        // Move block until the end of the vesting schedule, which is schedule.period_count * schedule.period
        System::set_block_number(120);

        // Check if the claim works
        assert_ok!(Vesting::claim(RuntimeOrigin::signed(BOB)));

        // Validation after claim
        // Check if the locked balance of BOB is 0
        assert_eq!(Vesting::locked_balance(&BOB), 0);
        // Check if the vested balance of BOB is 40
        assert_eq!(Vesting::vested_balance(&BOB), 40);
        // Check if BOB has 40 free balance but frozen/locked
        assert_eq!(PalletBalances::free_balance(&BOB), 40);
    });
}
