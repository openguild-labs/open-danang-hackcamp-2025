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

// Re-export all pallet parts, this is needed to properly import the pallet into the runtime.
pub use pallet::*;

type BalanceOf<T> =
	<<T as Config>::Currency as Currency<<T as frame_system::Config>::AccountId>>::Balance;

type BlockNumberFor<T> = frame_system::pallet_prelude::BlockNumberFor<T>;

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
		pub fn deposit(
			origin: OriginFor<T>,
			amount: BalanceOf<T>,
		) -> DispatchResult {
			let who = ensure_signed(origin)?;
			
			ensure!(!amount.is_zero(), Error::<T>::ZeroAmount);
			ensure!(
				T::Currency::free_balance(&who) >= amount,
				Error::<T>::InsufficientBalance
			);

			// Update pool state before modifying user deposit
			Self::update_pool()?;

			// Transfer tokens from user to pool
			T::Currency::transfer(&who, &Self::account_id(), amount, ExistenceRequirement::AllowDeath)?;

			// Update user's deposit info
			let current_acc_reward_per_share = AccRewardPerShare::<T>::get();
			
			Deposits::<T>::mutate(&who, |deposit_info| {
				match deposit_info {
					Some(info) => {
						// User already has a deposit, add to existing
						info.amount = info.amount.saturating_add(amount);
						info.reward_debt = info.amount.saturating_mul(current_acc_reward_per_share) / Self::precision();
					},
					None => {
						// New deposit
						*deposit_info = Some(DepositInfo {
							amount,
							deposit_block: frame_system::Pallet::<T>::block_number(),
							reward_debt: amount.saturating_mul(current_acc_reward_per_share) / Self::precision(),
						});
					}
				}
			});

			// Update total deposited
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
			let who = ensure_signed(origin)?;
			
			let deposit_info = Deposits::<T>::get(&who).ok_or(Error::<T>::NoDeposit)?;

			// Update pool state before calculating rewards
			Self::update_pool()?;

			// Calculate pending rewards
			let pending_rewards = Self::calculate_pending_rewards(&who)?;

			// Determine withdrawal amount
			let withdraw_amount = amount.unwrap_or(deposit_info.amount);
			ensure!(withdraw_amount <= deposit_info.amount, Error::<T>::InsufficientBalance);
			ensure!(!withdraw_amount.is_zero(), Error::<T>::ZeroAmount);

			let total_withdrawal = withdraw_amount.saturating_add(pending_rewards);

			// Check pool has sufficient balance
			ensure!(
				T::Currency::free_balance(&Self::account_id()) >= total_withdrawal,
				Error::<T>::InsufficientPoolBalance
			);

			// Update user's deposit info
			let remaining_amount = deposit_info.amount.saturating_sub(withdraw_amount);
			
			if remaining_amount.is_zero() {
				// Full withdrawal, remove deposit info
				Deposits::<T>::remove(&who);
			} else {
				// Partial withdrawal, update deposit info
				let current_acc_reward_per_share = AccRewardPerShare::<T>::get();
				Deposits::<T>::insert(&who, DepositInfo {
					amount: remaining_amount,
					deposit_block: deposit_info.deposit_block,
					reward_debt: remaining_amount.saturating_mul(current_acc_reward_per_share) / Self::precision(),
				});
			}

			// Update total deposited
			TotalDeposited::<T>::mutate(|total| *total = total.saturating_sub(withdraw_amount));

			// Transfer tokens back to user
			T::Currency::transfer(&Self::account_id(), &who, total_withdrawal, ExistenceRequirement::AllowDeath)?;

			Ok(())
		}

		/// Claim pending rewards without withdrawing deposit
		///
		/// The dispatch origin for this call must be _Signed_.
		#[pallet::call_index(2)]
		#[pallet::weight({10_000})]
		pub fn claim_rewards(origin: OriginFor<T>) -> DispatchResult {
			let who = ensure_signed(origin)?;
			
			let deposit_info = Deposits::<T>::get(&who).ok_or(Error::<T>::NoDeposit)?;

			// Update pool state before calculating rewards
			Self::update_pool()?;

			// Calculate pending rewards
			let pending_rewards = Self::calculate_pending_rewards(&who)?;
			ensure!(!pending_rewards.is_zero(), Error::<T>::ZeroAmount);

			// Check pool has sufficient balance
			ensure!(
				T::Currency::free_balance(&Self::account_id()) >= pending_rewards,
				Error::<T>::InsufficientPoolBalance
			);

			// Update user's reward debt
			let current_acc_reward_per_share = AccRewardPerShare::<T>::get();
			Deposits::<T>::insert(&who, DepositInfo {
				amount: deposit_info.amount,
				deposit_block: deposit_info.deposit_block,
				reward_debt: deposit_info.amount.saturating_mul(current_acc_reward_per_share) / Self::precision(),
			});

			// Transfer rewards to user
			T::Currency::transfer(&Self::account_id(), &who, pending_rewards, ExistenceRequirement::AllowDeath)?;

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

			T::RewardOrigin::ensure_origin(origin.clone())?;
			let who = ensure_signed(origin)?;
			
			ensure!(!amount.is_zero(), Error::<T>::ZeroAmount);

			// Update pool state before adding rewards
			Self::update_pool()?;

			// Transfer rewards to pool
			let pool_account = Self::account_id();
			T::Currency::transfer(&who, &pool_account, amount, ExistenceRequirement::AllowDeath)?;

			// Update total rewards
			TotalRewards::<T>::mutate(|total| *total = total.saturating_add(amount));

			// Update accumulated reward per share
			let total_deposited = TotalDeposited::<T>::get();
			if !total_deposited.is_zero() {
				let reward_per_share_increase = amount.saturating_mul(Self::precision()) / total_deposited;
				AccRewardPerShare::<T>::mutate(|acc| *acc = acc.saturating_add(reward_per_share_increase));
			}

			Ok(())
		}
	}

	impl<T: Config> Pallet<T> {
		/// The account ID of the pool
		pub fn account_id() -> T::AccountId {
			T::PalletId::get().into_account_truncating()
		}

		/// Precision factor for reward calculations (1e12)
		fn precision() -> BalanceOf<T> {
			1_000_000_000_000u128.try_into().unwrap_or_else(|_| BalanceOf::<T>::max_value())
		}

		/// Update pool state (called before any state-changing operation)
		fn update_pool() -> DispatchResult {
			let current_block = frame_system::Pallet::<T>::block_number();
			LastRewardBlock::<T>::put(current_block);
			Ok(())
		}

		/// Calculate pending rewards for a user
		fn calculate_pending_rewards(who: &T::AccountId) -> Result<BalanceOf<T>, DispatchError> {
			let deposit_info = Deposits::<T>::get(who).ok_or(Error::<T>::NoDeposit)?;
			let current_acc_reward_per_share = AccRewardPerShare::<T>::get();
			
			let total_rewards = deposit_info.amount.saturating_mul(current_acc_reward_per_share) / Self::precision();
			let pending = total_rewards.saturating_sub(deposit_info.reward_debt);
			
			Ok(pending)
		}

	}
}
