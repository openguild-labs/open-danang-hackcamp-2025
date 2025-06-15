//! NativePool pallet for managing native token deposits and daily rewards.
//!
//! This pallet allows users to deposit native tokens into a pool and receive
//! proportional daily rewards. Users can withdraw their deposits plus accumulated
//! rewards at any time. Only authorized team members can deposit rewards.

#![cfg_attr(not(feature = "std"), no_std)]

use frame::prelude::*;
use polkadot_sdk::polkadot_sdk_frame as frame;
use polkadot_sdk::frame_support::{
	traits::{Currency, ExistenceRequirement, Get},
	PalletId,
};
use polkadot_sdk::sp_runtime::{
	traits::{AccountIdConversion, Saturating, Zero}
};
use core::convert::TryFrom;

// Re-export all pallet parts, this is needed to properly import the pallet into the runtime.
pub use pallet::*;

type BalanceOf<T> =
	<<T as Config>::Currency as Currency<<T as frame_system::Config>::AccountId>>::Balance;

type BlockNumberFor<T> = frame_system::pallet_prelude::BlockNumberFor<T>;

mod mock;
mod tests;

/// Information about a user's deposit in the pool
#[derive(Clone, Encode, Decode, MaxEncodedLen, TypeInfo, Debug, PartialEq)]
pub struct DepositInfo<Balance, BlockNumber> {
	/// The amount deposited by the user
	pub amount: Balance,
	/// The block number when the deposit was made
	pub deposit_block: BlockNumber,
	/// The reward per share at the time of deposit (used for reward calculation)
	pub reward_debt: Balance,
}

#[frame::pallet]
pub mod pallet {
	use super::*;

	#[pallet::config]
	pub trait Config: polkadot_sdk::frame_system::Config {


		type Currency: Currency<Self::AccountId>;

		/// The pallet's account ID for holding pooled funds
		#[pallet::constant]
		type PalletId: Get<PalletId>;

		/// The origin that can deposit rewards (team members)
		type RewardOrigin: EnsureOrigin<Self::RuntimeOrigin>;
	}

	#[pallet::pallet]
	pub struct Pallet<T>(_);

	/// Total amount deposited in the pool by all users
	#[pallet::storage]
	#[pallet::getter(fn total_deposited)]
	pub type TotalDeposited<T: Config> = StorageValue<_, BalanceOf<T>, ValueQuery>;

	/// Total rewards accumulated in the pool
	#[pallet::storage]
	#[pallet::getter(fn total_rewards)]
	pub type TotalRewards<T: Config> = StorageValue<_, BalanceOf<T>, ValueQuery>;

	/// Accumulated reward per share (scaled by 1e12 for precision)
	#[pallet::storage]
	#[pallet::getter(fn acc_reward_per_share)]
	pub type AccRewardPerShare<T: Config> = StorageValue<_, BalanceOf<T>, ValueQuery>;

	/// Information about each user's deposit
	#[pallet::storage]
	#[pallet::getter(fn deposits)]
	pub type Deposits<T: Config> = StorageMap<
		_,
		Blake2_128Concat,
		T::AccountId,
		DepositInfo<BalanceOf<T>, BlockNumberFor<T>>,
		OptionQuery,
	>;

	/// Last block when rewards were updated
	#[pallet::storage]
	#[pallet::getter(fn last_reward_block)]
	pub type LastRewardBlock<T: Config> = StorageValue<_, BlockNumberFor<T>, ValueQuery>;

	/// Pending rewards for each user
	#[pallet::storage]
	#[pallet::getter(fn pending_rewards)]
	pub type PendingRewards<T: Config> = StorageMap<
		_,
		Blake2_128Concat,
		T::AccountId,
		BalanceOf<T>,
		ValueQuery,
	>;

	#[pallet::error]
	pub enum Error<T> {
		/// User has no deposit in the pool
		NoDeposit,
		/// Insufficient balance to deposit
		InsufficientBalance,
		/// Amount must be greater than zero
		ZeroAmount,
		/// Insufficient pool balance for withdrawal
		InsufficientPoolBalance,
		/// Arithmetic overflow occurred
		ArithmeticOverflow,
	}

	#[pallet::call]
	impl<T: Config> Pallet<T> {
		/// Deposit native tokens into the pool
		///
		/// The dispatch origin for this call must be _Signed_.
		///
		/// - `amount`: The amount of tokens to deposit
		#[pallet::call_index(0)]
		#[pallet::weight({10_000})]
		pub fn deposit(origin: OriginFor<T>, amount: BalanceOf<T>) -> DispatchResult {
			// Implement deposit functionality
            // 1. Ensure origin is signed
            // 2. Validate amount > 0 and user has sufficient balance
            // 3. Update pool state
            // 4. Transfer tokens from user to pool account
            // 5. Update or create user's deposit info with proper reward_debt
            // 6. Update total deposited amount
            // 
            // Hints:
            // - Use Self::update_pool() before modifying state
            // - Calculate reward_debt = amount × AccRewardPerShare / precision
            // - Use Deposits::<T>::mutate() to handle existing vs new deposits
			let sender = ensure_signed(origin)?;
			ensure!(amount > Zero::zero(), Error::<T>::ZeroAmount);
			ensure!(T::Currency::free_balance(&sender) >= amount, Error::<T>::InsufficientBalance);
			Self::update_pool()?;
			T::Currency::transfer(
				&sender,
				&Self::account_id(),
				amount,
				ExistenceRequirement::AllowDeath,
			)?;
			let current_block = frame_system::Pallet::<T>::block_number();
			let reward_debt = amount
				.saturating_mul(AccRewardPerShare::<T>::get())
				.checked_div(&Self::precision())
				.ok_or(Error::<T>::ArithmeticOverflow)?;
			Deposits::<T>::mutate(&sender, |deposit_info| {
				if let Some(deposit) = deposit_info {
					// User already has a deposit, add to existing amount
					deposit.amount = deposit.amount.saturating_add(amount);
					deposit.reward_debt = reward_debt;
					deposit.deposit_block = current_block;
				} else {	
					*deposit_info = Some(DepositInfo {
						amount,
						reward_debt,
						deposit_block: current_block,
					});
				}
			});
			
			TotalDeposited::<T>::mutate(|total| *total = total.saturating_add(amount));
			
			Ok(())
		}

		/// Withdraw tokens and rewards from the pool
		///
		/// The dispatch origin for this call must be _Signed_.
		///
		/// - `amount`: The amount of deposited tokens to withdraw (None for full withdrawal)
		#[pallet::call_index(1)]
		#[pallet::weight({10_000})]
		pub fn withdraw(
			origin: OriginFor<T>,
			amount: Option<BalanceOf<T>>,
		) -> DispatchResult {
			// 1. Ensure origin is signed and user has deposit
			let sender = ensure_signed(origin)?;
			let deposit_info = Deposits::<T>::get(&sender).ok_or(Error::<T>::NoDeposit)?;

			// 2. Update pool state
			Self::update_pool()?;

			// 3. Calculate pending rewards
			let pending_rewards = Self::calculate_pending_rewards(&sender)?;

			// 4. Determine withdrawal amount (use deposit amount if None)
			let withdraw_amount = amount.unwrap_or(deposit_info.amount);

			// 5. Validate withdrawal amount and pool balance
			ensure!(withdraw_amount > Zero::zero(), Error::<T>::ZeroAmount);
			ensure!(deposit_info.amount >= withdraw_amount, Error::<T>::InsufficientPoolBalance);

			// 6. Update user's deposit info (remove if full withdrawal)
			if withdraw_amount == deposit_info.amount {
				Deposits::<T>::remove(&sender);
				PendingRewards::<T>::remove(&sender);
			} else {
				let precision = Self::precision();
				// Calculate new reward debt based on remaining amount
				let new_reward_debt = deposit_info.amount
					.saturating_sub(withdraw_amount)
					.saturating_mul(AccRewardPerShare::<T>::get())
					.checked_div(&precision)
					.ok_or(Error::<T>::ArithmeticOverflow)?;

				Deposits::<T>::mutate(&sender, |deposit| {
					if let Some(deposit) = deposit {
						deposit.amount = deposit.amount.saturating_sub(withdraw_amount);
						deposit.reward_debt = new_reward_debt;
					}
				});
				
				// Recalculate pending rewards after withdrawal
				Self::calculate_pending_rewards(&sender)?;
			}

			// 7. Transfer tokens and rewards back to user
			let pool_balance = T::Currency::free_balance(&Self::account_id());
			let total_withdrawal = withdraw_amount.saturating_add(pending_rewards);
			ensure!(
                pool_balance >= total_withdrawal,
                Error::<T>::InsufficientPoolBalance
            );

			T::Currency::transfer(
				&Self::account_id(),
				&sender,
				total_withdrawal,
				ExistenceRequirement::AllowDeath,
			)?;

			// 8. Update total deposited amount
			TotalDeposited::<T>::mutate(|total| *total = total.saturating_sub(withdraw_amount));

			Ok(())
		}

		/// Claim pending rewards without withdrawing deposit
		///
		/// The dispatch origin for this call must be _Signed_.
		#[pallet::call_index(2)]
		#[pallet::weight({10_000})]
		pub fn claim_rewards(origin: OriginFor<T>) -> DispatchResult {
			// Implement claim_rewards functionality
			// 1. Ensure origin is signed and user has deposit
			let sender = ensure_signed(origin)?;
			let deposit_info = Deposits::<T>::get(&sender).ok_or(Error::<T>::NoDeposit)?;

			// 2. Update pool state
			Self::update_pool()?;

			// 3. Calculate pending rewards
			let pending_rewards = Self::calculate_pending_rewards(&sender)?;

			// 4. Validate rewards > 0 and pool has sufficient balance
			let pool_balance = T::Currency::free_balance(&Self::account_id());
			ensure!(pending_rewards > Zero::zero(), Error::<T>::ZeroAmount);
			ensure!(
				pool_balance >= pending_rewards,
				Error::<T>::InsufficientPoolBalance
			);

			// 5. Update user's reward debt
			let precision = Self::precision();
			let new_reward_debt = deposit_info.amount
				.saturating_mul(AccRewardPerShare::<T>::get())
				.checked_div(&precision)
				.ok_or(Error::<T>::ArithmeticOverflow)?;

			Deposits::<T>::mutate(&sender, |deposit| {
				if let Some(deposit) = deposit {
					deposit.reward_debt = new_reward_debt;
				}
			});
			// 6. Transfer rewards to user
			// Clear pending rewards after claiming
			PendingRewards::<T>::remove(&sender);

			T::Currency::transfer(
				&Self::account_id(),
				&sender,
				pending_rewards,
				ExistenceRequirement::AllowDeath,
			)?;

			Ok(())
		}

		/// Deposit rewards into the pool (team only)
		///
		/// The dispatch origin for this call must be from `RewardOrigin`.
		///
		/// - `amount`: The amount of rewards to deposit
		#[pallet::call_index(3)]
		#[pallet::weight({10_000})]
		pub fn deposit_rewards(
			origin: OriginFor<T>,
			amount: BalanceOf<T>,
		) -> DispatchResult {
			// Implement deposit_rewards functionality
			// 1. Ensure origin is from RewardOrigin and signed
			T::RewardOrigin::ensure_origin(origin.clone())?;
			let sender = ensure_signed(origin)?;
			// 2. Validate amount > 0
			ensure!(amount > Zero::zero(), Error::<T>::ZeroAmount);
			// 3. Check if there are any deposits
			let total_deposited = TotalDeposited::<T>::get();
			// 4. Update pool state
			Self::update_pool()?;
			// 5. Transfer rewards to pool account
			T::Currency::transfer(
				&sender,
				&Self::account_id(),
				amount,
				ExistenceRequirement::AllowDeath,
			)?;
			// 6. Update total rewards
			TotalRewards::<T>::mutate(|total| *total = total.saturating_add(amount));
			// 7. Update AccRewardPerShare
			let reward_per_share_increase = amount
				.saturating_mul(Self::precision())
				.checked_div(&total_deposited)
				.ok_or(Error::<T>::ArithmeticOverflow)?;
			if total_deposited > Zero::zero() {
				AccRewardPerShare::<T>::mutate(|acc_reward_per_share| {
					*acc_reward_per_share = acc_reward_per_share.saturating_add(reward_per_share_increase);
				});

				// Update pending rewards for all users with deposits
				Deposits::<T>::iter().for_each(|(account_id, _)| {
					let _ = Self::calculate_pending_rewards(&account_id);
				});
			}

			Ok(())
		}
	}

	impl<T: Config> Pallet<T> {
		/// The account ID of the pool
		pub fn account_id() -> T::AccountId {
			// Convert PalletId to AccountId
			// Hint: Use T::PalletId::get().into_account_truncating()
			T::PalletId::get().into_account_truncating()
		}

		/// Precision factor for reward calculations (1e12)
		fn precision() -> BalanceOf<T> {
			// Use a type-safe way to create the precision value
			// Convert from u64 to Balance using TryFrom
			match TryFrom::try_from(1_000_000_000_000u64) {
				Ok(precision) => precision,
				Err(_) => panic!("Precision value should fit in Balance type"),
			}
		}

		/// Update pool state (called before any state-changing operation)
		fn update_pool() -> DispatchResult {
			// Update the last reward block
			// 1. Get current block number
			// 2. Update LastRewardBlock storage
			// Hint: Use frame_system::Pallet::<T>::block_number()
			let current_block = frame_system::Pallet::<T>::block_number();
			LastRewardBlock::<T>::put(current_block);
			Ok(())
		}

		/// Calculate pending rewards for a user
		pub fn calculate_pending_rewards(who: &T::AccountId) -> Result<BalanceOf<T>, DispatchError> {
			//  Implement reward calculation
            // 1. Get user's deposit info
            // 2. Get current AccRewardPerShare
            // 3. Calculate total rewards user should have: amount × AccRewardPerShare / precision
            // 4. Calculate pending: total_rewards - reward_debt
            //
            // Formula: pending = (amount × AccRewardPerShare / precision) - reward_debt
            //
            // This works because:
            // - total_rewards = what user would earn if they were here from start
            // - reward_debt = what they would have earned before they joined
            // - pending = what they actually earned since joining
			let deposit_info = Deposits::<T>::get(who).ok_or(Error::<T>::NoDeposit)?;
			let acc_reward_per_share = AccRewardPerShare::<T>::get();
			
			// Calculate rewards based on current deposit amount
			let total_rewards = deposit_info.amount
				.saturating_mul(acc_reward_per_share)
				.checked_div(&Self::precision())
				.ok_or(Error::<T>::ArithmeticOverflow)?;
			
			// Calculate pending rewards by subtracting reward debt
			let pending_rewards = total_rewards.saturating_sub(deposit_info.reward_debt);
			
			// Store the calculated pending rewards
			PendingRewards::<T>::insert(who, pending_rewards);
			
			Ok(pending_rewards)
		}
	}
}

