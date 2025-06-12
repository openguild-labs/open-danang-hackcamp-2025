//! Vesting pallet for managing token vesting schedules.
//!
//! This pallet allows for creating, managing, and claiming from vesting schedules.
//! It supports both time-based and block-based vesting mechanisms.

#![cfg_attr(not(feature = "std"), no_std)]

pub use pallet::*;

use frame::prelude::*;
use polkadot_sdk::polkadot_sdk_frame as frame;
use polkadot_sdk::frame_support::{
	traits::{Currency, LockableCurrency, LockIdentifier, WithdrawReasons, ExistenceRequirement}
};
use polkadot_sdk::sp_std::{
	cmp::PartialEq,
	vec::Vec,
};

// Re-export all pallet parts, this is needed to properly import the pallet into the runtime.


pub const VESTING_ID: LockIdentifier = *b"vesting ";

type BalanceOf<T> =
	<<T as Config>::Currency as Currency<<T as frame_system::Config>::AccountId>>::Balance;

type BlockNumberFor<T> = frame_system::pallet_prelude::BlockNumberFor<T>;

type VestingScheduleOf<T> = VestingSchedule<BlockNumberFor<T>, BalanceOf<T>>;

mod mock;
mod tests;

/// A vesting schedule over a currency. This allows a particular currency to have vesting limits
/// applied to it.
#[derive(Clone, Encode, Decode, MaxEncodedLen, TypeInfo, Debug, PartialEq, DecodeWithMemTracking)]
pub struct VestingSchedule<BlockNumber, Balance> {
	/// The block number when the vesting schedule starts
	pub start: BlockNumber,
	/// The number of blocks between vesting periods
	pub period: BlockNumber,
	/// The number of vesting periods
	pub period_count: u32,
	/// The amount of balance that will be vested per period
	pub per_period: Balance,
}


impl<BlockNumber: AtLeast32Bit + Copy, Balance: AtLeast32Bit + MaxEncodedLen + Copy>
	VestingSchedule<BlockNumber, Balance>
{
	/// Returns the total amount to be vested
	pub fn total_amount(&self) -> Option<Balance> {
		// TODO: Calculate the total amount by multiplying per_period by period_count
		// Hint: Use checked_mul to avoid overflow and return None if overflow occurs
		let total_amount = self.per_period.checked_mul(&Balance::from(self.period_count));
		total_amount
	}

	/// Linear vesting schedule
	// start = 100
	// period = 10 (every 10 blocks)
	// period_count = 5 (5 periods total)
	// per_period = 1000 tokens

	// At block 120:
	// elapsed_blocks = 120 - 100 = 20
	// elapsed_periods = min(20/10, 5) = min(2, 5) = 2
	// vested_amount = 2 × 1000 = 2000 tokens
	
	/// Returns the vested amount at the given block
	pub fn vested_amount<BlockNumberToBalance: Convert<BlockNumber, Balance>>(&self, now: BlockNumber) -> Balance {
		// TODO: Implement vested amount calculation
		// 1. If vesting hasn't started (now < self.start), return zero
		// 2. Calculate elapsed blocks since start
		// 3. Calculate how many complete periods have passed (elapsed / period)
		// 4. Cap the periods at period_count
		// 5. Multiply periods by per_period amount
		// Hint: Use saturating operations to avoid overflow
		if now < self.start {
			return Zero::zero();
		}
		let elapsed_blocks = now - self.start;
		let mut completed_periods = elapsed_blocks / self.period;
		

		let  capped_periods = BlockNumberToBalance::convert(completed_periods.min(self.period_count.into()));
		let vested_amount = capped_periods.saturating_mul(self.per_period);

		vested_amount
	}

	/// Returns the remaining locked amount at the given block
	pub fn locked_amount<BlockNumberToBalance: Convert<BlockNumber, Balance>>(&self, now: BlockNumber) -> Balance {
		// TODO: Calculate locked amount
		// Hint: locked_amount = total_amount - vested_amount
		let total_amount = self.total_amount()
		.unwrap_or(Balance::zero())
		.saturating_sub(self.vested_amount::<BlockNumberToBalance>(now));
		
		total_amount
	
	}

	pub fn is_valid_start_block(&self, current_block: BlockNumber) -> bool {
		// TODO: Validate that the start block is in the future
		// Return true if start > current_block
		if self.start > current_block {
			return true;
		}
		false

	}

}

#[frame::pallet]
pub mod pallet {
	use super::*;

	#[pallet::config]
	pub trait Config: polkadot_sdk::frame_system::Config {

		type Currency: LockableCurrency<Self::AccountId, Moment = BlockNumberFor<Self>>;


		/// Convert the block number into a balance.
		type BlockNumberToBalance: Convert<BlockNumberFor<Self>, BalanceOf<Self>>;

		/// The maximum number of vesting schedules per account
		#[pallet::constant]
		type MaxVestingSchedules: Get<u32>;

		/// The minimum vesting amount
		#[pallet::constant]
		type MinVestedTransfer: Get<BalanceOf<Self>>;
	}

	#[pallet::pallet]
	pub struct Pallet<T>(_);

	/// Vesting schedules for an account
	#[pallet::storage]
	#[pallet::getter(fn vesting_schedules)]
	pub type VestingSchedules<T: Config> = StorageMap<
		_,
		Blake2_128Concat,
		T::AccountId,
		BoundedVec<VestingScheduleOf<T>, T::MaxVestingSchedules>,
		ValueQuery,
	>;

	
	#[pallet::error]
	pub enum Error<T> {
		/// Vesting period is zero
		ZeroVestingPeriod,
		/// Number of vests is zero
		ZeroVestingPeriodCount,
		/// Insufficient amount of balance to lock
		InsufficientBalanceToLock,
		/// This account has too many vesting schedules
		TooManyVestingSchedules,
		/// The vested transfer amount is too low
		AmountLow,
		/// Not vested
		NotVested,
		/// Invalid vesting index
		InvalidVestingIndex,
		/// Arithmetic overflow
		ArithmeticOverflow,
		/// Invalid vesting start
		InvalidVestingStart,
	}

	#[pallet::call]
	impl<T: Config> Pallet<T> {
		/// Create a vested transfer
		///
		/// The dispatch origin for this call must be _Signed_.
		///
		/// - `dest`: The account that will receive the vested transfer
		/// - `schedule`: The vesting schedule
		///
		#[pallet::call_index(0)]
		#[pallet::weight({10_000})]
		pub fn vested_transfer(
			origin: OriginFor<T>,
			dest: T::AccountId,
			schedule: VestingScheduleOf<T>,
		) -> DispatchResult {
			// TODO: Implement vested_transfer extrinsic
			// 1. Ensure the origin is signed
			// 2. Call do_vested_transfer helper function
			// Hint: Use ensure_signed(origin)? to get the sender

			let who = ensure_signed(origin)?;
			Self::do_vested_transfer(&who, &dest, schedule)?;
			
			Ok(())

		}

		/// Claim vested tokens
		///
		/// The dispatch origin for this call must be _Signed_.
		///
		#[pallet::call_index(1)]
		#[pallet::weight({10_000})]
		pub fn claim(
			origin: OriginFor<T>
		) -> DispatchResult {
			// TODO: Implement claim extrinsic
			// 1. Ensure the origin is signed
			// 2. Update the lock for the account
			// 3. If locked amount is zero, remove the lock entirely
			// Hint: Use Self::update_lock() and T::Currency::remove_lock()
			let who = ensure_signed(origin)?;
			let locked = Self::update_lock(&who)?;
			if locked == Zero::zero(){
				T::Currency::remove_lock(
					VESTING_ID,
					&who,
				);
			}
			Ok(())

		}


		/// Update vesting schedules
		///
		/// The dispatch origin for this call must be _Root_.
		///
		/// - `schedules`: The new vesting schedules
		///
		#[pallet::call_index(2)]
		#[pallet::weight({10_000})]
		pub fn update_vesting_schedules(
			origin: OriginFor<T>,
			who: T::AccountId,
			schedules: Vec<VestingScheduleOf<T>>,
		) -> DispatchResult {
			// TODO: Implement update_vesting_schedules extrinsic
			// 1. Ensure the origin is root
			// 2. Convert schedules Vec to BoundedVec
			// 3. Calculate total locked amount for validation
			// 4. Ensure account has enough balance
			// 5. Update storage and locks
			// Hint: Use ensure_root(origin)? and try_into() for BoundedVec conversion
			ensure_root(origin)?;
			let bounded: BoundedVec<_, _> = schedules.try_into()
			.map_err(|_| Error::<T>::TooManyVestingSchedules)?;
			
			let total_locked = Self::calculate_total_locked_amount(&bounded)?;
			ensure!(
				T::Currency::free_balance(&who) >= total_locked,
				Error::<T>::InsufficientBalanceToLock
			);
			VestingSchedules::<T>::insert(&who, bounded);
			Self::update_lock(&who)?;
			Ok(())
		
		}


		/// Update a specific vesting schedule
		///
		/// The dispatch origin for this call must be _Root_.
		///
		/// - `who`: The account whose vesting schedule will be updated
		/// - `index`: The index of the vesting schedule to update
		/// - `schedule`: The new vesting schedule
		///
		#[pallet::call_index(3)]
		#[pallet::weight({10_000})]
		pub fn update_vesting_schedule(
			origin: OriginFor<T>,
			who: T::AccountId,
			index: u32,
			schedule: VestingScheduleOf<T>,
		) -> DispatchResult {
			// TODO: Implement update_vesting_schedule extrinsic
			// 1. Ensure the origin is root
			// 2. Validate the new schedule (period > 0, period_count > 0, per_period > 0)
			// 3. Use VestingSchedules::<T>::try_mutate to update the specific schedule
			// 4. Update the lock after modifying the schedule
			// Hints:
			// - Use get_mut() to get mutable reference to the schedule at index
			// - Return InvalidVestingIndex error if index is out of bounds
			ensure_root(origin)?;
			ensure!(schedule.period > Zero::zero(), Error::<T>::ZeroVestingPeriod);
			ensure!(schedule.period_count > 0, Error::<T>::ZeroVestingPeriodCount);
			ensure!(schedule.per_period > Zero::zero(), Error::<T>::AmountLow);

			VestingSchedules::<T>::try_mutate(&who, |schedules| {
				if let Some(existing_schedule) = schedules.get_mut(index as usize){
					*existing_schedule = schedule;
				} else {
					return Err(Error::<T>::InvalidVestingIndex.into());
				}

				Self::update_lock(&who)?;
				Ok(())
			})
			
		}

		/// Force remove a vesting schedule
		///
		/// The dispatch origin for this call must be _Root_.
		///
		/// - `who`: The account whose vesting schedule will be removed
		/// - `schedule_index`: The index of the vesting schedule to remove
		#[pallet::call_index(4)]
		#[pallet::weight({10_000})]
		pub fn force_remove_vesting_schedule(
			origin: OriginFor<T>,
			who: T::AccountId,
			schedule_index: u32,
		) -> DispatchResult {
			// TODO: Implement force_remove_vesting_schedule extrinsic
			// 1. Ensure the origin is root
			// 2. Use VestingSchedules::<T>::try_mutate to modify the schedules
			// 3. Validate the schedule_index is within bounds
			// 4. Remove the schedule at the given index
			// 5. If no schedules remain, remove the lock entirely
			// 6. Otherwise, update the lock with remaining schedules
			// Hints:
			// - Use schedules.remove(index) to remove at specific index
			// - Use T::Currency::remove_lock() when schedules is empty

			ensure_root(origin)?;
			VestingSchedules::<T>::try_mutate(&who, |schedules| {
				if (schedule_index as usize) >= schedules.len() {
					return Err(Error::<T>::InvalidVestingIndex.into());
				}
				schedules.remove(schedule_index as usize);
				if schedules.is_empty() {
					T::Currency::remove_lock(VESTING_ID,&who)
				} else {
						Self::update_lock(&who)?;
					}
				Ok(())
			})
		}
	}

	impl<T: Config> Pallet<T> {
		/// Create a vested transfer
		fn do_vested_transfer(
			from: &T::AccountId,
			to: &T::AccountId,
			schedule: VestingScheduleOf<T>,
		) -> DispatchResult {
			// TODO: Implement the core vested transfer logic
			// 1. Get current block number
			// 2. Validate the schedule (period > 0, period_count > 0, valid start block)
			// 3. Calculate total amount and validate minimum transfer
			// 4. Check sender has enough balance
			// 5. Transfer the tokens
			// 6. Add schedule to storage
			// 7. Update locks
			// Hints:
			// - Use frame_system::Pallet::<T>::block_number() for current block
			// - Use T::Currency::transfer() for token transfer
			// - Use VestingSchedules::<T>::try_mutate() to update storage
			

			let current_block_number = frame_system::Pallet::<T>::block_number();
			ensure!(schedule.period > Zero::zero(), Error::<T>::ZeroVestingPeriod);
			ensure!(schedule.period_count > Zero::zero(), Error::<T>::ZeroVestingPeriodCount);
			ensure!(schedule.is_valid_start_block(current_block_number), Error::<T>::InvalidVestingStart);
			let total_amount = schedule.total_amount().ok_or(Error::<T>::ArithmeticOverflow)?;
			ensure!(total_amount >= T::MinVestedTransfer::get(), Error::<T>::AmountLow);
			ensure!(
				T::Currency::free_balance(from) >= total_amount,
				Error::<T>::InsufficientBalanceToLock
			);
			T::Currency::transfer(
				from,
				to,
				total_amount,
				ExistenceRequirement::KeepAlive,
			)?;
			VestingSchedules::<T>::try_mutate(to, |schedules| {
				schedules.try_push(schedule.clone())
				.map_err(|_| Error::<T>::TooManyVestingSchedules)
			
			
			})?;

			Self::update_lock(to)?;
			Ok(())
			
		}


		/// Update the lock amount for an account
		fn update_lock(who: &T::AccountId) -> Result<BalanceOf<T>, DispatchError> {
			// TODO: Implement lock update logic
			// 1. Get all vesting schedules for the account
			// 2. Get current block number
			// 3. Calculate total locked amount across all schedules
			// 4. Set the lock using T::Currency::set_lock()
			// 5. Return the total locked amount
			// Hint: Use VESTING_ID as the lock identifier
			let schedules = VestingSchedules::<T>::get(who);
			let current_block_number = frame_system::Pallet::<T>::block_number();
			let total_locked = Self::calculate_total_locked_amount(&schedules)?;
			T::Currency::set_lock(
				VESTING_ID,
				who,
				total_locked,
				WithdrawReasons::all(),

			);
			Ok(total_locked)
		}

		/// Calculate the total locked amount for a set of schedules
		fn calculate_total_locked_amount(
			schedules: &BoundedVec<VestingScheduleOf<T>, T::MaxVestingSchedules>,
		) -> Result<BalanceOf<T>, DispatchError> {
			// TODO: Calculate total locked amount
			// 1. Get current block number
			// 2. Iterate through schedules and sum locked amounts
			// 3. Use checked arithmetic to avoid overflow
			// Hint: Use try_fold() for safe accumulation
			let current_block_number = frame_system::Pallet::<T>::block_number();
			let total_locked = schedules.iter()
			.try_fold(BalanceOf::<T>::zero(), |acc, schedule| {
				let locked = schedule.locked_amount::<T::BlockNumberToBalance>(current_block_number);
				acc.checked_add(&locked).ok_or(Error::<T>::ArithmeticOverflow.into())
			});

			total_locked
		}

		/// Get vested amount for an account
		pub fn vested_balance(who: &T::AccountId) -> BalanceOf<T> {
			// TODO: Calculate total vested balance
			// 1. Get all schedules for the account
			// 2. Sum up vested amounts from all schedules
			// Hint: Use fold() to accumulate vested amounts
			let schedules = VestingSchedules::<T>::get(who);
			let current_block_number = frame_system::Pallet::<T>::block_number();
			let total_vested = schedules.iter()
				.fold(BalanceOf::<T>::zero(), |acc, schedule| {
					acc.saturating_add(
						schedule.vested_amount::<T::BlockNumberToBalance>(current_block_number))
				});
			total_vested
		}

		/// Get locked balance for an account
		pub fn locked_balance(who: &T::AccountId) -> BalanceOf<T> {
			// TODO: Calculate total locked balance
			// 1. Get all schedules for the account
			// 2. Sum up locked amounts from all schedules
			// Hint: Similar to vested_balance but use locked_amount()
			let schedules = VestingSchedules::<T>::get(who);
			let current_block_number = frame_system::Pallet::<T>::block_number();
			let total_locked = schedules.iter()
				.fold(BalanceOf::<T>::zero(), |acc, schedule| {
					acc.saturating_add(
						schedule.locked_amount::<T::BlockNumberToBalance>(current_block_number))
				});
			total_locked
			
		}
	}
}
