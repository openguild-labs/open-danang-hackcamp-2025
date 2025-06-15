//! Vesting pallet for managing token vesting schedules.
//!
//! This pallet allows for creating, managing, and claiming from vesting schedules.
//! It supports both time-based and block-based vesting mechanisms.

#![cfg_attr(not(feature = "std"), no_std)]

use frame::prelude::*;
use polkadot_sdk::frame_support::{
    traits::{Currency, ExistenceRequirement, LockIdentifier, LockableCurrency, WithdrawReasons},
    BoundedVec,
};
use polkadot_sdk::polkadot_sdk_frame as frame;
use polkadot_sdk::sp_std::{cmp::PartialEq, vec::Vec};

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
#[derive(
    Clone, Encode, Decode, MaxEncodedLen, TypeInfo, Debug, PartialEq, DecodeWithMemTracking,
)]
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
        self.per_period
            .checked_mul(&Balance::from(self.period_count))
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
    pub fn vested_amount<BlockNumberToBalance: Convert<BlockNumber, Balance>>(
        &self,
        now: BlockNumber,
    ) -> Balance {
        if now < self.start {
            return Zero::zero();
        }

        let elapsed_block = now.saturating_sub(self.start);
        let elapsed_periods = elapsed_block / self.period;
        let capped_periods =
            BlockNumberToBalance::convert(elapsed_periods.min(self.period_count.into()));
        capped_periods.saturating_mul(self.per_period)
    }

    /// Returns the remaining locked amount at the given block
    pub fn locked_amount<BlockNumberToBalance: Convert<BlockNumber, Balance>>(
        &self,
        now: BlockNumber,
    ) -> Balance {
        self.total_amount()
            .unwrap_or(Zero::zero())
            .saturating_sub(self.vested_amount::<BlockNumberToBalance>(now))
    }

    /// Returns true if the vesting schedule has started
    pub fn is_valid_start_block(&self, current_block: BlockNumber) -> bool {
        current_block >= self.start
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
        /// Per period vested is zero
        ZeroPerPeriodVested,
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
            // Ensure the origin is signed
            let sender = ensure_signed(origin)?;

            // Create a vested transfer from sender to a destination for a given schedule
            Self::do_vested_transfer(&sender, &dest, schedule)?;

            Ok(())
        }

        /// Claim vested tokens
        ///
        /// The dispatch origin for this call must be _Signed_.
        ///
        #[pallet::call_index(1)]
        #[pallet::weight({10_000})]
        pub fn claim(origin: OriginFor<T>) -> DispatchResult {
            // Ensure the origin is signed
            let sender = ensure_signed(origin)?;

            // Update the lock for the sender
            let locked_amount = Self::update_lock(&sender)?;

            // If the locked amount is zero, remove the lock
            if locked_amount.is_zero() {
                T::Currency::remove_lock(VESTING_ID, &sender)
            };

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
            // Ensure the origin is root
            ensure_root(origin)?;

            // Convert the schedules to a bounded vector
            let bounded_schedules: BoundedVec<VestingScheduleOf<T>, T::MaxVestingSchedules> =
                schedules
                    .try_into()
                    .map_err(|_| Error::<T>::TooManyVestingSchedules)?;

            // Calculate the total locked amount for the schedules
            let total_locked_amount = Self::calculate_total_locked_amount(&bounded_schedules)?;

            // Get the free balance of the account
            let balance = T::Currency::free_balance(&who);

            // Check if the account has enough balance to be locked
            ensure!(
                balance >= total_locked_amount,
                Error::<T>::InsufficientBalanceToLock
            );

            // Insert the schedules into the storage
            VestingSchedules::<T>::insert(&who, bounded_schedules);

            // Update the lock for the account
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
            // Ensure the origin is root
            ensure_root(origin)?;

            // Validate the new schedule
            ensure!(
                schedule.period > Zero::zero(),
                Error::<T>::ZeroVestingPeriod
            );
            ensure!(
                schedule.period_count > Zero::zero(),
                Error::<T>::ZeroVestingPeriodCount
            );
            ensure!(
                schedule.per_period > Zero::zero(),
                Error::<T>::ZeroPerPeriodVested
            );

            // Update the schedule safely using try_mutate
            VestingSchedules::<T>::try_mutate(&who, |schedules| -> Result<(), DispatchError> {
                // Get the mutable reference to the schedule at the given index
                // If the index is out of bounds, return InvalidVestingIndex error
                schedules
                    .get_mut(index as usize)
                    .ok_or(Error::<T>::InvalidVestingIndex)
                    // Update the schedule at the given index
                    .map(|s| *s = schedule)?;
                Ok(())
            })?;

            // Once the schedules are successfully updated, update the lock
            Self::update_lock(&who)?;

            Ok(())
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
            // Ensure the origin is root
            ensure_root(origin)?;

            // Try to mutate the schedules
            VestingSchedules::<T>::try_mutate(&who, |schedules| -> Result<(), DispatchError> {
                // Get the mutable reference to the schedule at the given index
                // If the index is out of bounds, return InvalidVestingIndex error
                schedules
                    .get_mut(schedule_index as usize)
                    .ok_or(Error::<T>::InvalidVestingIndex)?;
                // Once the schedule is found, remove it
                schedules.remove(schedule_index as usize);
                Ok(())
            })?;

            // If there are no schedules, remove the lock
            if VestingSchedules::<T>::get(&who).is_empty() {
                T::Currency::remove_lock(VESTING_ID, &who);
            } else {
                // Otherwise, update the lock with remaining schedules
                Self::update_lock(&who)?;
            }

            Ok(())
        }
    }

    impl<T: Config> Pallet<T> {
        /// Create a vested transfer
        fn do_vested_transfer(
            from: &T::AccountId,
            to: &T::AccountId,
            schedule: VestingScheduleOf<T>,
        ) -> DispatchResult {
            // Get the current block number
            let current_block = frame_system::Pallet::<T>::block_number();

            // Validate the schedule
            ensure!(
                schedule.period > Zero::zero(),
                Error::<T>::ZeroVestingPeriod
            );
            ensure!(
                schedule.period_count > Zero::zero(),
                Error::<T>::ZeroVestingPeriodCount
            );
            ensure!(
                schedule.is_valid_start_block(current_block),
                Error::<T>::InvalidVestingStart
            );

            // Calculate the total amount
            // If the total amount calculation overflows, return ArithmeticOverflow error
            let total_amount = schedule
                .total_amount()
                .ok_or(Error::<T>::ArithmeticOverflow)?;

            // Get the minimum vested transfer amount
            let min_vested_transfer = T::MinVestedTransfer::get();

            // Ensure the total amount is greater than the minimum vested transfer amount
            ensure!(total_amount >= min_vested_transfer, Error::<T>::AmountLow);

            // Check if sender has enough balance
            let sender_balance = T::Currency::free_balance(from);
            ensure!(
                sender_balance >= total_amount,
                Error::<T>::InsufficientBalanceToLock
            );

            // Transfer the tokens while ensuring that the sender has enough balance
            T::Currency::transfer(from, to, total_amount, ExistenceRequirement::KeepAlive)?;

            // Add the schedule to the storage
            VestingSchedules::<T>::try_mutate(&to, |schedules| -> Result<(), DispatchError> {
                schedules
                    .try_push(schedule)
                    .map_err(|_| Error::<T>::TooManyVestingSchedules)?;
                Ok(())
            })?;

            // Update the lock for the destination account
            Self::update_lock(to)?;

            Ok(())
        }

        /// Update the lock amount for an account
        fn update_lock(who: &T::AccountId) -> Result<BalanceOf<T>, DispatchError> {
            // Get all vesting schedules for the account
            let schedules = VestingSchedules::<T>::get(who);

            // Calculate the total locked amount for the schedules
            let total_locked_amount = Self::calculate_total_locked_amount(&schedules)?;

            // If the total locked amount is zero, remove the lock
            if total_locked_amount.is_zero() {
                T::Currency::remove_lock(VESTING_ID, who);
            } else {
                // Otherwise, set the lock for the account with the total locked amount
                T::Currency::set_lock(
                    VESTING_ID,
                    who,
                    total_locked_amount,
                    WithdrawReasons::RESERVE,
                );
            }

            Ok(total_locked_amount)
        }

        /// Calculate the total locked amount for a set of schedules
        fn calculate_total_locked_amount(
            schedules: &BoundedVec<VestingScheduleOf<T>, T::MaxVestingSchedules>,
        ) -> Result<BalanceOf<T>, DispatchError> {
            // Get the current block number
            let current_block = frame_system::Pallet::<T>::block_number();

            // Iterate through given schedules
            let total_locked_amount = schedules
                .iter()
                // Sum locked amounts for each valid schedule
                .try_fold(Zero::zero(), |acc: BalanceOf<T>, schedule| {
                    let locked_amount =
                        schedule.locked_amount::<T::BlockNumberToBalance>(current_block);
                    // If the locked amount calculation overflows, return ArithmeticOverflow error
                    acc.checked_add(&locked_amount)
                        .ok_or(Error::<T>::ArithmeticOverflow)
                })?;

            Ok(total_locked_amount)
        }

        /// Get vested amount for an account
        pub fn vested_balance(who: &T::AccountId) -> BalanceOf<T> {
            // Get all schedules for the account
            let schedules = VestingSchedules::<T>::get(who);

            // Get the current block number
            let current_block = frame_system::Pallet::<T>::block_number();

            // Iterate through given schedules
            let total_vested_amount = schedules
                .iter()
                // Sum vested amounts for each valid schedule
                .try_fold(Zero::zero(), |acc: BalanceOf<T>, schedule| {
                    let vested_amount =
                        schedule.vested_amount::<T::BlockNumberToBalance>(current_block);
                    // If the vested amount calculation overflows, return ArithmeticOverflow error
                    acc.checked_add(&vested_amount)
                        .ok_or(Error::<T>::ArithmeticOverflow)
                })
                .unwrap_or(Zero::zero());

            total_vested_amount
        }

        /// Get locked balance for an account
        pub fn locked_balance(who: &T::AccountId) -> BalanceOf<T> {
            // Get all schedules for the account
            let schedules = VestingSchedules::<T>::get(who);

            // Get the current block number
            let current_block = frame_system::Pallet::<T>::block_number();

            // Iterate through given schedules
            let total_locked_amount = schedules
                .iter()
                // Sum locked amounts for each valid schedule
                .try_fold(Zero::zero(), |acc: BalanceOf<T>, schedule| {
                    let locked_amount =
                        schedule.locked_amount::<T::BlockNumberToBalance>(current_block);
                    // If the locked amount calculation overflows, return ArithmeticOverflow error
                    acc.checked_add(&locked_amount)
                        .ok_or(Error::<T>::ArithmeticOverflow)
                })
                .unwrap_or(Zero::zero());

            total_locked_amount
        }
    }
}
