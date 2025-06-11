//! Vesting pallet for managing token vesting schedules.
//!
//! This pallet allows for creating, managing, and claiming from vesting schedules.
//! It supports both time-based and block-based vesting mechanisms.

#![cfg_attr(not(feature = "std"), no_std)]

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
pub use pallet::*;

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
		self.per_period.checked_mul(&Balance::from(self.period_count))
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
		// If the vesting hasn't started yet, nothing is vested
		if now < self.start {
			return Balance::zero();
		}

		// Calculate how many complete periods have passed
		let elapsed = now.saturating_sub(self.start);
		let periods_passed = if self.period.is_zero() {
			// If period is zero, all tokens are immediately vested
			BlockNumber::from(self.period_count)
		} else {
			let passed = elapsed / self.period;
			core::cmp::min(passed, BlockNumber::from(self.period_count))
		};

		// Convert periods_passed back to Balance for multiplication
		self.per_period.saturating_mul(BlockNumberToBalance::convert(periods_passed))
	}

	/// Returns the remaining locked amount at the given block
	pub fn locked_amount<BlockNumberToBalance: Convert<BlockNumber, Balance>>(&self, now: BlockNumber) -> Balance {
		if let Some(total) = self.total_amount() {
			total.saturating_sub(self.vested_amount::<BlockNumberToBalance>(now))
		} else {
			Balance::zero()
		}
	}
	pub fn is_valid_start_block<>(&self, current_block: BlockNumber) -> bool {

		if self.start > current_block {
			return true;
		}
		return false;
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
		/// Failed because the maximum vesting schedules was exceeded
		MaxVestingSchedulesExceeded,
		/// Vesting schedule not found
		VestingScheduleNotFound,
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
		pub fn claim(origin: OriginFor<T>) -> DispatchResult {
			let who = ensure_signed(origin)?;
			let locked_amount = Self::update_lock(&who)?;
			
			if locked_amount.is_zero() {
				T::Currency::remove_lock(VESTING_ID, &who);
			}

			Ok(())
		}

		/// Update vesting schedules
		///
		/// The dispatch origin for this call must be _Signed_.
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
			ensure_root(origin)?;
			
			let bounded_schedules: BoundedVec<_, T::MaxVestingSchedules> = schedules
				.try_into()
				.map_err(|_| Error::<T>::TooManyVestingSchedules)?;

			let total_amount = Self::calculate_total_locked_amount(&bounded_schedules)?;

			// Ensure the account has enough balance for all schedules
			let free_balance = T::Currency::free_balance(&who);
			ensure!(free_balance >= total_amount, Error::<T>::InsufficientBalanceToLock);

			VestingSchedules::<T>::insert(&who, &bounded_schedules);
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
			ensure_root(origin)?;

			// Validate the new schedule
			ensure!(!schedule.period.is_zero(), Error::<T>::ZeroVestingPeriod);
			ensure!(schedule.period_count > 0, Error::<T>::ZeroVestingPeriodCount);
			ensure!(!schedule.per_period.is_zero(), Error::<T>::AmountLow);

			VestingSchedules::<T>::try_mutate(&who, |schedules| -> DispatchResult {
				let schedule_mut = schedules
					.get_mut(index as usize)
					.ok_or(Error::<T>::InvalidVestingIndex)?;
				
				*schedule_mut = schedule.clone();

				// Update the lock after modifying the schedule
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
			ensure_root(origin)?;

			VestingSchedules::<T>::try_mutate(&who, |schedules| -> DispatchResult {
				ensure!((schedule_index as usize) < schedules.len(), Error::<T>::InvalidVestingIndex);
				schedules.remove(schedule_index as usize);
				
				if schedules.is_empty() {
					T::Currency::remove_lock(VESTING_ID, &who);
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
			let current_block = frame_system::Pallet::<T>::block_number();
			// Validate the schedule
			ensure!(schedule.is_valid_start_block(current_block), Error::<T>::InvalidVestingStart);
			ensure!(!schedule.period.is_zero(), Error::<T>::ZeroVestingPeriod);
			ensure!(schedule.period_count > 0, Error::<T>::ZeroVestingPeriodCount);
			ensure!(!schedule.per_period.is_zero(), Error::<T>::AmountLow);

			let total_amount = schedule.total_amount().ok_or(Error::<T>::ArithmeticOverflow)?;
			ensure!(total_amount >= T::MinVestedTransfer::get(), Error::<T>::AmountLow);

			// Check if the sender has enough balance
			ensure!(
				T::Currency::free_balance(from) >= total_amount,
				Error::<T>::InsufficientBalanceToLock
			);

			// Transfer the amount
			T::Currency::transfer(from, to, total_amount, ExistenceRequirement::AllowDeath)?;

			// Add the vesting schedule
			VestingSchedules::<T>::try_mutate(to, |schedules| -> DispatchResult {
				schedules
					.try_push(schedule.clone())
					.map_err(|_| Error::<T>::TooManyVestingSchedules)?;
				Ok(())
			})?;

			// Update the lock
			Self::update_lock(to)?;


			Ok(())
		}

		/// Update the lock amount for an account
		fn update_lock(who: &T::AccountId) -> Result<BalanceOf<T>, DispatchError> {
			let schedules = VestingSchedules::<T>::get(who);
			let now = frame_system::Pallet::<T>::block_number();

			let total_locked = schedules
				.iter()
				.map(|schedule| schedule.locked_amount::<T::BlockNumberToBalance>(now))
				.fold(BalanceOf::<T>::zero(), |acc, amount| acc.saturating_add(amount));

			if !total_locked.is_zero() {
				T::Currency::set_lock(
					VESTING_ID,
					who,
					total_locked,
					WithdrawReasons::except(WithdrawReasons::TRANSACTION_PAYMENT),
				);
			}

			Ok(total_locked)
		}

		/// Calculate the total locked amount for a set of schedules
		fn calculate_total_locked_amount(
			schedules: &BoundedVec<VestingScheduleOf<T>, T::MaxVestingSchedules>,
		) -> Result<BalanceOf<T>, DispatchError> {
			let now = frame_system::Pallet::<T>::block_number();
			
			let total = schedules
				.iter()
				.try_fold(BalanceOf::<T>::zero(), |acc, schedule| {
					let locked = schedule.locked_amount::<T::BlockNumberToBalance>(now);
					acc.checked_add(&locked).ok_or(Error::<T>::ArithmeticOverflow)
				})?;

			Ok(total)
		}

		/// Get vested amount for an account
		pub fn vested_balance(who: &T::AccountId) -> BalanceOf<T> {
			let schedules = VestingSchedules::<T>::get(who);
			let now = frame_system::Pallet::<T>::block_number();

			schedules
				.iter()
				.map(|schedule| schedule.vested_amount::<T::BlockNumberToBalance>(now))
				.fold(BalanceOf::<T>::zero(), |acc, amount| acc.saturating_add(amount))
		}

		/// Get locked balance for an account
		pub fn locked_balance(who: &T::AccountId) -> BalanceOf<T> {
			let schedules = VestingSchedules::<T>::get(who);
			let now = frame_system::Pallet::<T>::block_number();

			schedules
				.iter()
				.map(|schedule| schedule.locked_amount::<T::BlockNumberToBalance>(now))
				.fold(BalanceOf::<T>::zero(), |acc, amount| acc.saturating_add(amount))
		}
	}
}
