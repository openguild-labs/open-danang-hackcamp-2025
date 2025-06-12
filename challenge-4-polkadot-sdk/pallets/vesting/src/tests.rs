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
        System::set_block_number(1);

        let schedule = VestingSchedule {
            start: 10,
            period: 5,
            period_count: 4,
            per_period: 100,
        };

        // Check initial balances
        assert_eq!(PalletBalances::free_balance(&ALICE), 1000);
        assert_eq!(PalletBalances::free_balance(&BOB), 1000);

        // Perform vested transfer
        assert_ok!(Vesting::vested_transfer(
            RuntimeOrigin::signed(ALICE),
            BOB,
            schedule.clone()
        ));

        // Check balances after transfer
        assert_eq!(PalletBalances::free_balance(&ALICE), 600); // 1000 - 400
        assert_eq!(PalletBalances::free_balance(&BOB), 1400); // 1000 + 400

        // Check vesting schedule was created
        let schedules = Vesting::vesting_schedules(&BOB);
        assert_eq!(schedules.len(), 1);
        assert_eq!(schedules[0], schedule);

        // Check locked balance
        assert_eq!(Vesting::locked_balance(&BOB), 400);
    });
}

#[test]
fn vested_transfer_fails_if_zero_period_or_count() {
    ExtBuilder::build().execute_with(|| {
        System::set_block_number(1);

        // Test zero period
        let schedule_zero_period = VestingSchedule {
            start: 10,
            period: 0,
            period_count: 4,
            per_period: 100,
        };

        assert_noop!(
            Vesting::vested_transfer(RuntimeOrigin::signed(ALICE), BOB, schedule_zero_period),
            Error::<Runtime>::ZeroVestingPeriod
        );

        // Test zero period count
        let schedule_zero_count = VestingSchedule {
            start: 10,
            period: 5,
            period_count: 0,
            per_period: 100,
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
            start: 10,
            period: 5,
            period_count: 4,
            per_period: 100,
        };

        // Create vested transfer
        assert_ok!(Vesting::vested_transfer(
            RuntimeOrigin::signed(ALICE),
            BOB,
            schedule
        ));

        // Initially all tokens are locked
        assert_eq!(Vesting::locked_balance(&BOB), 400);
        assert_eq!(Vesting::vested_balance(&BOB), 0);

        // Move to block 15 (1 period passed)
        System::set_block_number(15);

        // Claim should update locks
        assert_ok!(Vesting::claim(RuntimeOrigin::signed(BOB)));

        // Check vested and locked amounts
        assert_eq!(Vesting::vested_balance(&BOB), 100);
        assert_eq!(Vesting::locked_balance(&BOB), 300);

        // Move to block 25 (3 periods passed)
        System::set_block_number(25);
        assert_ok!(Vesting::claim(RuntimeOrigin::signed(BOB)));

        assert_eq!(Vesting::vested_balance(&BOB), 300);
        assert_eq!(Vesting::locked_balance(&BOB), 100);

        // Move to block 35 (all periods passed)
        System::set_block_number(35);
        assert_ok!(Vesting::claim(RuntimeOrigin::signed(BOB)));

        assert_eq!(Vesting::vested_balance(&BOB), 400);
        assert_eq!(Vesting::locked_balance(&BOB), 0);
    });
}

#[test]
fn update_vesting_schedules_works() {
    ExtBuilder::build().execute_with(|| {
        System::set_block_number(1);

        let schedule1 = VestingSchedule {
            start: 10,
            period: 5,
            period_count: 2,
            per_period: 100,
        };

        let schedule2 = VestingSchedule {
            start: 20,
            period: 10,
            period_count: 3,
            per_period: 50,
        };

        let new_schedules = vec![schedule1.clone(), schedule2.clone()];

        // Only root can update schedules
        assert_noop!(
            Vesting::update_vesting_schedules(
                RuntimeOrigin::signed(ALICE),
                BOB,
                new_schedules.clone()
            ),
            polkadot_sdk::frame_support::error::BadOrigin
        );

        // Root can update schedules
        assert_ok!(Vesting::update_vesting_schedules(
            RuntimeOrigin::root(),
            BOB,
            new_schedules
        ));

        // Check schedules were updated
        let schedules = Vesting::vesting_schedules(&BOB);
        assert_eq!(schedules.len(), 2);
        assert_eq!(schedules[0], schedule1);
        assert_eq!(schedules[1], schedule2);

        // Check total locked amount
        assert_eq!(Vesting::locked_balance(&BOB), 350); // 200 + 150
    });
}

#[test]
fn multiple_vesting_schedule_claim_works() {
    ExtBuilder::build().execute_with(|| {
        System::set_block_number(1);

        // Create first vesting schedule
        let schedule1 = VestingSchedule {
            start: 10,
            period: 5,
            period_count: 2,
            per_period: 100,
        };

        assert_ok!(Vesting::vested_transfer(
            RuntimeOrigin::signed(ALICE),
            BOB,
            schedule1
        ));

        // Create second vesting schedule
        let schedule2 = VestingSchedule {
            start: 15,
            period: 10,
            period_count: 3,
            per_period: 50,
        };

        assert_ok!(Vesting::vested_transfer(
            RuntimeOrigin::signed(ALICE),
            BOB,
            schedule2
        ));

        // Check both schedules exist
        let schedules = Vesting::vesting_schedules(&BOB);
        assert_eq!(schedules.len(), 2);

        // Initially all tokens are locked
        assert_eq!(Vesting::locked_balance(&BOB), 350); // 200 + 150
        assert_eq!(Vesting::vested_balance(&BOB), 0);

        // Move to block 15 (first schedule: 1 period, second schedule: 0 periods)
        System::set_block_number(15);
        assert_ok!(Vesting::claim(RuntimeOrigin::signed(BOB)));

        assert_eq!(Vesting::vested_balance(&BOB), 100); // Only first schedule
        assert_eq!(Vesting::locked_balance(&BOB), 250);

        // Move to block 25 (first schedule: 2 periods, second schedule: 1 period)
        System::set_block_number(25);
        assert_ok!(Vesting::claim(RuntimeOrigin::signed(BOB)));

        assert_eq!(Vesting::vested_balance(&BOB), 250); // 200 + 50
        assert_eq!(Vesting::locked_balance(&BOB), 100);

        // Move to block 45 (all periods passed for both schedules)
        System::set_block_number(45);
        assert_ok!(Vesting::claim(RuntimeOrigin::signed(BOB)));

        assert_eq!(Vesting::vested_balance(&BOB), 350);
        assert_eq!(Vesting::locked_balance(&BOB), 0);
    });
}
