//! Vesting pallet for managing token vesting schedules.
//!
//! This pallet allows for creating, managing, and claiming from vesting schedules.
//! It supports both time‑based and block‑based vesting mechanisms.

#![cfg_attr(not(feature = "std"), no_std)]

use frame::prelude::*;
use polkadot_sdk::polkadot_sdk_frame as frame;
use polkadot_sdk::frame_support::{
	ensure,
	traits::{
		Currency, LockIdentifier, LockableCurrency, WithdrawReasons, ExistenceRequirement, Get,
	},
};
use polkadot_sdk::sp_runtime::{
	traits::{
		AccountIdConversion, AtLeast32Bit, CheckedAdd, CheckedMul, Convert, Saturating, Zero,
	},
	ArithmeticError,
};
use polkadot_sdk::sp_std::{cmp::PartialEq, prelude::*, vec::Vec};

pub const VESTING_ID: LockIdentifier = *b"vesting ";

type BalanceOf<T> =
	<<T as Config>::Currency as Currency<<T as frame_system::Config>::AccountId>>::Balance;
type BlockNumberFor<T> = frame_system::pallet_prelude::BlockNumberFor<T>;
type VestingScheduleOf<T> = VestingSchedule<BlockNumberFor<T>, BalanceOf<T>>;

mod mock;
mod tests;

/// A vesting schedule over a currency.
#[derive(Clone, Encode, Decode, MaxEncodedLen, TypeInfo, Debug, PartialEq, DecodeWithMemTracking)]
pub struct VestingSchedule<BlockNumber, Balance> {
	pub start: BlockNumber,
	pub period: BlockNumber,
	pub period_count: u32,
	pub per_period: Balance,
}

impl<
		BlockNumber: AtLeast32Bit + Copy + Saturating + Zero + PartialOrd,
		Balance: AtLeast32Bit
			+ MaxEncodedLen
			+ Copy
			+ Saturating
			+ Zero
			+ CheckedMul
			+ CheckedAdd
			+ From<u32>,
	> VestingSchedule<BlockNumber, Balance>
{
	/// Returns the total amount to be vested or `None` on overflow.
	pub fn total_amount(&self) -> Option<Balance> {
		self.per_period.checked_mul(&self.period_count.into())
	}

	/// Returns the vested amount at the given block.
	pub fn vested_amount<BlockNumberToBalance: Convert<BlockNumber, Balance>>(
		&self,
		now: BlockNumber,
	) -> Balance {
		if now < self.start || self.period.is_zero() {
			return Zero::zero();
		}
		let elapsed_blocks = now.saturating_sub(self.start);
		let mut elapsed_periods: BlockNumber =
			elapsed_blocks / self.period;
		let max_periods: BlockNumber = self.period_count.into();
		if elapsed_periods > max_periods {
			elapsed_periods = max_periods;
		}
		let elapsed_as_balance: Balance = BlockNumberToBalance::convert(elapsed_periods);
		self.per_period.saturating_mul(elapsed_as_balance)
	}

	/// Returns the remaining locked amount at the given block.
	pub fn locked_amount<BlockNumberToBalance: Convert<BlockNumber, Balance>>(
		&self,
		now: BlockNumber,
	) -> Balance {
		let total = self.total_amount().unwrap_or_else(Zero::zero);
		let vested = self.vested_amount::<BlockNumberToBalance>(now);
		total.saturating_sub(vested)
	}

	/// Validates start block is in the future.
	pub fn is_valid_start_block(&self, current_block: BlockNumber) -> bool {
		self.start > current_block
	}
}

#[frame::pallet]
pub mod pallet {
	use super::*;

	#[pallet::config]
	pub trait Config: polkadot_sdk::frame_system::Config {
		type Currency: LockableCurrency<Self::AccountId, Moment = BlockNumberFor<Self>>;
		type BlockNumberToBalance: Convert<BlockNumberFor<Self>, BalanceOf<Self>>;
		#[pallet::constant]
		type MaxVestingSchedules: Get<u32>;
		#[pallet::constant]
		type MinVestedTransfer: Get<BalanceOf<Self>>;
	}

	#[pallet::pallet]
	pub struct Pallet<T>(_);

	#[pallet::storage]
	#[pallet::getter(fn vesting_schedules)]
	pub type VestingSchedules<
		T: Config,
	> = StorageMap<_, Blake2_128Concat, T::AccountId, BoundedVec<VestingScheduleOf<T>, T::MaxVestingSchedules>, ValueQuery>;

	#[pallet::error]
	pub enum Error<T> {
		ZeroVestingPeriod,
		ZeroVestingPeriodCount,
		InsufficientBalanceToLock,
		TooManyVestingSchedules,
		AmountLow,
		NotVested,
		InvalidVestingIndex,
		ArithmeticOverflow,
		InvalidVestingStart,
	}

	#[pallet::call]
	impl<T: Config> Pallet<T> {
		#[pallet::call_index(0)]
		#[pallet::weight(10_000)]
		pub fn vested_transfer(
			origin: OriginFor<T>,
			dest: T::AccountId,
			schedule: VestingScheduleOf<T>,
		) -> DispatchResult {
			let who = ensure_signed(origin)?;
			Self::do_vested_transfer(&who, &dest, schedule)
		}

		#[pallet::call_index(1)]
		#[pallet::weight(10_000)]
		pub fn claim(origin: OriginFor<T>) -> DispatchResult {
			let who = ensure_signed(origin)?;
			let locked = Self::update_lock(&who)?;
			if locked.is_zero() {
				T::Currency::remove_lock(VESTING_ID, &who);
			}
			Ok(())
		}

		#[pallet::call_index(2)]
		#[pallet::weight(10_000)]
		pub fn update_vesting_schedules(
			origin: OriginFor<T>,
			who: T::AccountId,
			schedules: Vec<VestingScheduleOf<T>>,
		) -> DispatchResult {
			ensure_root(origin)?;
			let bounded: BoundedVec<_, _> = schedules.try_into().map_err(|_| Error::<T>::TooManyVestingSchedules)?;
			let total_locked = Self::calculate_total_locked_amount(&bounded)?;
			let free = T::Currency::free_balance(&who);
			ensure!(free >= total_locked, Error::<T>::InsufficientBalanceToLock);
			VestingSchedules::<T>::insert(&who, &bounded);
			Self::update_lock(&who)?;
			Ok(())
		}

		#[pallet::call_index(3)]
		#[pallet::weight(10_000)]
		pub fn update_vesting_schedule(
			origin: OriginFor<T>,
			who: T::AccountId,
			index: u32,
			schedule: VestingScheduleOf<T>,
		) -> DispatchResult {
			ensure_root(origin)?;
			VestingSchedules::<T>::try_mutate(&who, |vec| {
				let idx = index as usize;
				let len = vec.len();
				ensure!(idx < len, Error::<T>::InvalidVestingIndex);
				ensure!(!schedule.period.is_zero(), Error::<T>::ZeroVestingPeriod);
				ensure!(schedule.period_count > 0, Error::<T>::ZeroVestingPeriodCount);
				vec[idx] = schedule;
				Ok(())
			})?;
			Self::update_lock(&who)?;
			Ok(())
		}

		#[pallet::call_index(4)]
		#[pallet::weight(10_000)]
		pub fn force_remove_vesting_schedule(
			origin: OriginFor<T>,
			who: T::AccountId,
			schedule_index: u32,
		) -> DispatchResult {
			ensure_root(origin)?;
			VestingSchedules::<T>::try_mutate(&who, |vec| {
				let idx = schedule_index as usize;
				ensure!(idx < vec.len(), Error::<T>::InvalidVestingIndex);
				vec.remove(idx);
				Ok(())
			})?;
			if VestingSchedules::<T>::get(&who).is_empty() {
				T::Currency::remove_lock(VESTING_ID, &who);
			} else {
				Self::update_lock(&who)?;
			}
			Ok(())
		}
	}

	impl<T: Config> Pallet<T> {
		fn do_vested_transfer(
			from: &T::AccountId,
			to: &T::AccountId,
			schedule: VestingScheduleOf<T>,
		) -> DispatchResult {
			let now = frame_system::Pallet::<T>::block_number();

			ensure!(!schedule.period.is_zero(), Error::<T>::ZeroVestingPeriod);
			ensure!(schedule.period_count > 0, Error::<T>::ZeroVestingPeriodCount);
			ensure!(schedule.is_valid_start_block(now), Error::<T>::InvalidVestingStart);

			let total = schedule
				.total_amount()
				.ok_or(Error::<T>::ArithmeticOverflow)?;
			ensure!(total >= T::MinVestedTransfer::get(), Error::<T>::AmountLow);

			let free_from = T::Currency::free_balance(from);
			ensure!(free_from >= total, Error::<T>::InsufficientBalanceToLock);

			T::Currency::transfer(from, to, total, ExistenceRequirement::AllowDeath)?;

			VestingSchedules::<T>::try_mutate(to, |vec| {
				if (vec.len() as u32) >= T::MaxVestingSchedules::get() {
					return Err(Error::<T>::TooManyVestingSchedules.into());
				}
				vec.try_push(schedule).map_err(|_| Error::<T>::TooManyVestingSchedules)?;
				Ok::<_, DispatchError>(())
			})?;

			Self::update_lock(to)?;
			Ok(())
		}

		fn update_lock(who: &T::AccountId) -> Result<BalanceOf<T>, DispatchError> {
			let schedules = VestingSchedules::<T>::get(who);
			let total_locked = Self::calculate_total_locked_amount(&schedules)?;
			if total_locked.is_zero() {
				T::Currency::remove_lock(VESTING_ID, who);
			} else {
				T::Currency::set_lock(VESTING_ID, who, total_locked, WithdrawReasons::all());
			}
			Ok(total_locked)
		}

		fn calculate_total_locked_amount(
			schedules: &BoundedVec<VestingScheduleOf<T>, T::MaxVestingSchedules>,
		) -> Result<BalanceOf<T>, DispatchError> {
			let now = frame_system::Pallet::<T>::block_number();
			schedules
				.iter()
				.try_fold(Zero::zero(), |acc, s| {
					let locked = s.locked_amount::<T::BlockNumberToBalance>(now);
					acc.checked_add(&locked).ok_or(Error::<T>::ArithmeticOverflow)
				})
				.map_err(Into::into)
		}

		pub fn vested_balance(who: &T::AccountId) -> BalanceOf<T> {
			let now = frame_system::Pallet::<T>::block_number();
			VestingSchedules::<T>::get(who)
				.iter()
				.fold(Zero::zero(), |acc, s| {
					let vested = s.vested_amount::<T::BlockNumberToBalance>(now);
					acc.saturating_add(vested)
				})
		}

		pub fn locked_balance(who: &T::AccountId) -> BalanceOf<T> {
			let now = frame_system::Pallet::<T>::block_number();
			VestingSchedules::<T>::get(who)
				.iter()
				.fold(Zero::zero(), |acc, s| {
					let locked = s.locked_amount::<T::BlockNumberToBalance>(now);
					acc.saturating_add(locked)
				})
		}
	}
}