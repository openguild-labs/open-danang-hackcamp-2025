#![cfg(test)]

use super::*;
use polkadot_sdk::frame_support::{assert_noop, assert_ok};
use polkadot_sdk::pallet_balances::{BalanceLock, Reasons};
use mock::*;


// HINTS:
// - Set block number in mock tests : System::set_block_number(<number>);
// - Get signed origin from the caller: RuntimeOrigin::signed(ALICE)/ RuntimeOrigin::signed(BOB)
// - Call vested_transfer with the origin, destination, and schedule : Vesting::vested_transfer(origin, dest, schedule)





#[test]
fn vested_transfer_works() {
	ExtBuilder::build().execute_with(|| {
			System::set_block_number(1);
		// TODO: check if the vested transfer works
		let origin = RuntimeOrigin::signed(ALICE);
		let dest = BOB;
		let schedule = VestingSchedule {start: 2,period:10,period_count: 5,per_period: 200,};
		let total_amount = schedule.total_amount().unwrap();
		assert_eq!(total_amount, 1000);

		assert_ok!(Vesting::vested_transfer(origin, dest, schedule.clone()));
		assert_eq!(PalletBalances::free_balance(&ALICE), ALICE_BALANCE- total_amount);
		assert_eq!(PalletBalances::free_balance(&BOB), total_amount);

	let locks = PalletBalances::locks(&BOB);
assert_eq!(locks.len(), 1);
assert_eq!(locks[0].id, VESTING_ID);
assert_eq!(locks[0].amount, total_amount);

// - Get the vesting schedules for an account: Vesting::vesting_schedules(&<account>)
// - Get error : Error::<Runtime>::ZeroVestingPeriod / Error::<Runtime>::ZeroVestingPeriodCount
// - Get the balance of an account: PalletBalances::free_balance(&<account>)
// - Get locked balance of an account: Vesting::locked(&<account>)
// - Transfer balance : PalletBalances::transfer(&<account>, &<account>, <amount>, <reason>)
let vesting_schedules = VestingSchedules::<Runtime>::get(&BOB);
	assert_eq!(vesting_schedules.len(), 1);
	assert_eq!(vesting_schedules[0], schedule);		
	});

	
}


#[test]
fn vested_transfer_fails_if_zero_period_or_count() {
    ExtBuilder::build().execute_with(|| { 
		// TODO: check if the vested transfer fails if the period or count is zero
		System::set_block_number(1);
		let origin = RuntimeOrigin::signed(ALICE);
		let dest = BOB;
		let schedule = VestingSchedule {
			start: 2,
			period: 0, // Zero period
			period_count: 5,
			per_period: 200,
		};

		assert_noop!(
			Vesting::vested_transfer(origin.clone(), dest, schedule.clone()),
			Error::<Runtime>::ZeroVestingPeriod
		);

		let schedule = VestingSchedule {
			start: 2,
			period: 10,
			period_count: 0, // Zero period count
			per_period: 200,
		};

		assert_noop!(
			Vesting::vested_transfer(origin, dest, schedule),
			Error::<Runtime>::ZeroVestingPeriodCount
		);
    });
}

#[test]
fn claim_works() {
	ExtBuilder::build().execute_with(|| {
		// TODO: check if the claim works
		System::set_block_number(1);
		let origin = RuntimeOrigin::signed(ALICE);
		let dest = BOB;
		let schedule = VestingSchedule {
			start: 2,
			period: 10,
			period_count: 5,
			per_period: 200,
		};
		let total_amount = schedule.total_amount().unwrap();
		assert_ok!(Vesting::vested_transfer(origin, dest, schedule.clone()));

		System::set_block_number(3); 
		assert_ok!(Vesting::claim(RuntimeOrigin::signed(BOB)));

		let locks = PalletBalances::locks(&BOB);
assert_eq!(locks.len(), 1);

assert_eq!(locks[0].amount, 1000);
		
	});
}

#[test]
fn update_vesting_schedules_works() {
	ExtBuilder::build().execute_with(|| {
		// TODO: check if the update vesting schedules works
		System::set_block_number(1);
		let origin = RuntimeOrigin::signed(ALICE);
		let dest = BOB;
		let schedule = VestingSchedule {
			start: 2,
			period: 10,
			period_count: 5,
			per_period: 200,
		};

	
		
		let new_schedules = vec![
			VestingSchedule {
				start: 2,
				period: 10,
				period_count: 5,
				per_period: 200,
			},
			VestingSchedule {
				start: 3,
				period: 10,
				period_count: 5,
				per_period: 300,
			},
			];
			
	assert_ok!(Vesting::vested_transfer(origin.clone(), dest, schedule.clone()));
assert_ok!(Vesting::vested_transfer(origin.clone(), dest, new_schedules[1].clone()));

	
		 assert_noop!(
			Vesting::update_vesting_schedules(origin.clone(), dest, new_schedules.clone()),
		
	 DispatchError::BadOrigin);		
assert_ok!(Vesting::update_vesting_schedule(RuntimeOrigin::root(), dest, 0, new_schedules[0].clone()));
assert_ok!(Vesting::update_vesting_schedule(RuntimeOrigin::root(), dest, 1, new_schedules[1].clone()));
	let saved_schedules = VestingSchedules::<Runtime>::get(&BOB);
		assert_eq!(saved_schedules.len(), 2);
		assert_eq!(saved_schedules[0], new_schedules[0]);
		assert_eq!(saved_schedules[1], new_schedules[1]);

		let locks = PalletBalances::locks(&BOB);
		assert_eq!(locks.len(), 1);
		
	
	});
}


#[test]
fn multiple_vesting_schedule_claim_works() {
	ExtBuilder::build().execute_with(|| {

		// TODO: check if the multiple vesting schedule claim works

			System::set_block_number(1);
		let origin = RuntimeOrigin::signed(ALICE);
		let dest = BOB;
	
	let schedule1 = VestingSchedule {
		start: 2,
		period: 10,
		period_count: 5,
		per_period: 200,
	};

	let schedule2 = VestingSchedule {
		start: 3,
		period: 10,
		period_count: 5,
		per_period: 300,
	};

let total_amount1 = schedule1.total_amount().unwrap();
let total_amount2 = schedule2.total_amount().unwrap();
assert_ok!(Vesting::vested_transfer(origin.clone(), dest, schedule1.clone()));
assert_ok!(Vesting::vested_transfer(origin.clone(), dest, schedule2.clone()));

System::set_block_number(3); 

assert_ok!(Vesting::claim(RuntimeOrigin::signed(BOB)));

let total_claimed = 1000 + 1500;
assert_eq!(PalletBalances::free_balance(&BOB), total_claimed);

let locks = PalletBalances::locks(&BOB);

assert_eq!(locks[0].amount,total_claimed);

System::set_block_number(4);
		assert_ok!(Vesting::claim(RuntimeOrigin::signed(BOB)));

		let locks_after_claims = PalletBalances::locks(&BOB);

assert_eq!(locks_after_claims[0].amount, 2500);

	});
}



