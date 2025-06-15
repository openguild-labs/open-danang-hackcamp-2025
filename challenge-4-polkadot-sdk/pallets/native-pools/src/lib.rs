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
	traits::{AccountIdConversion, Saturating, Zero, SaturatedConversion}
};
use polkadot_sdk::frame_support::ensure;

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
			let who = frame_system::Pallet::<T>::ensure_signed(origin)?;
			ensure!(!amount.is_zero(), Error::<T>::ZeroAmount);

			let free_balance = T::Currency::free_balance(&who);
			ensure!(free_balance >= amount, Error::<T>::InsufficientBalance);

			Self::update_pool()?;

			let pool_account = Self::account_id();
			T::Currency::transfer(&who, &pool_account, amount, ExistenceRequirement::AllowDeath)?;

			let pending = Self::calculate_pending_rewards(&who).unwrap_or_default();
			if !pending.is_zero() {
				let pool_balance = T::Currency::free_balance(&pool_account);
				ensure!(pool_balance >= pending, Error::<T>::InsufficientPoolBalance);
				T::Currency::transfer(&pool_account, &who, pending, ExistenceRequirement::AllowDeath)?;
				TotalRewards::<T>::mutate(|r| *r = r.saturating_sub(pending));
			}

			let acc_per_share = Self::acc_reward_per_share();
			let precision = Self::precision();

			Deposits::<T>::mutate(&who, |maybe_info| {
				match maybe_info {
					Some(info) => {
						info.amount = info.amount.saturating_add(amount);
						info.reward_debt = acc_per_share.saturating_mul(info.amount) / precision;
						info.deposit_block = frame_system::Pallet::<T>::block_number();
					},
					None => {
						let reward_debt = acc_per_share.saturating_mul(amount) / precision;
						*maybe_info = Some(DepositInfo {
							amount,
							deposit_block: frame_system::Pallet::<T>::block_number(),
							reward_debt,
						});
					},
				}
			});

			TotalDeposited::<T>::mutate(|v| *v = v.saturating_add(amount));

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
			let who = frame_system::Pallet::<T>::ensure_signed(origin)?;
			let mut info = Deposits::<T>::get(&who).ok_or(Error::<T>::NoDeposit)?;

			Self::update_pool()?;

			let acc_per_share = Self::acc_reward_per_share();
			let precision = Self::precision();
			let pending = Self::calculate_pending_rewards(&who)?;

			let withdraw_amount = amount.unwrap_or(info.amount);
			ensure!(!withdraw_amount.is_zero(), Error::<T>::ZeroAmount);
			ensure!(withdraw_amount <= info.amount, Error::<T>::InsufficientBalance);

			let pool_account = Self::account_id();
			let pool_balance = T::Currency::free_balance(&pool_account);
			let total_payout = withdraw_amount.saturating_add(pending);
			ensure!(pool_balance >= total_payout, Error::<T>::InsufficientPoolBalance);

			info.amount = info.amount.saturating_sub(withdraw_amount);
			if info.amount.is_zero() {
				Deposits::<T>::remove(&who);
			} else {
				info.reward_debt = acc_per_share.saturating_mul(info.amount) / precision;
				Deposits::<T>::insert(&who, &info);
			}

			TotalDeposited::<T>::mutate(|v| *v = v.saturating_sub(withdraw_amount));
			TotalRewards::<T>::mutate(|r| *r = r.saturating_sub(pending));

			T::Currency::transfer(&pool_account, &who, total_payout, ExistenceRequirement::AllowDeath)?;

			Ok(())
		}

		/// Claim pending rewards without withdrawing deposit
		///
		/// The dispatch origin for this call must be _Signed_.
		#[pallet::call_index(2)]
		#[pallet::weight({10_000})]
		pub fn claim_rewards(origin: OriginFor<T>) -> DispatchResult {
			let who = frame_system::Pallet::<T>::ensure_signed(origin)?;
			let mut info = Deposits::<T>::get(&who).ok_or(Error::<T>::NoDeposit)?;

			Self::update_pool()?;

			let pending = Self::calculate_pending_rewards(&who)?;
			ensure!(!pending.is_zero(), Error::<T>::ZeroAmount);

			let pool_account = Self::account_id();
			let pool_balance = T::Currency::free_balance(&pool_account);
			ensure!(pool_balance >= pending, Error::<T>::InsufficientPoolBalance);

			let acc_per_share = Self::acc_reward_per_share();
			let precision = Self::precision();
			info.reward_debt = acc_per_share.saturating_mul(info.amount) / precision;
			Deposits::<T>::insert(&who, &info);

			TotalRewards::<T>::mutate(|r| *r = r.saturating_sub(pending));
			T::Currency::transfer(&pool_account, &who, pending, ExistenceRequirement::AllowDeath)?;

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
			let who = T::RewardOrigin::ensure_origin(origin)?;
			ensure!(!amount.is_zero(), Error::<T>::ZeroAmount);

			let pool_account = Self::account_id();
			T::Currency::transfer(&who, &pool_account, amount, ExistenceRequirement::AllowDeath)?;

			TotalRewards::<T>::mutate(|r| *r = r.saturating_add(amount));

			let total_deposited = Self::total_deposited();
			if !total_deposited.is_zero() {
				let precision = Self::precision();
				let increment = amount.saturating_mul(precision) / total_deposited;
				AccRewardPerShare::<T>::mutate(|v| *v = v.saturating_add(increment));
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
			(1_000_000_000_000u128).saturated_into()
		}

		/// Update pool state (called before any state-changing operation)
		fn update_pool() -> DispatchResult {
			let now = frame_system::Pallet::<T>::block_number();
			LastRewardBlock::<T>::put(now);
			Ok(())
		}
		/// Calculate pending rewards for a user
		fn calculate_pending_rewards(who: &T::AccountId) -> Result<BalanceOf<T>, DispatchError> {
			if let Some(info) = Deposits::<T>::get(who) {
				let acc_per_share = Self::acc_reward_per_share();
				let precision = Self::precision();
				let total_due = acc_per_share.saturating_mul(info.amount) / precision;
				let pending = total_due.saturating_sub(info.reward_debt);
				Ok(pending)
			} else {
				Err(Error::<T>::NoDeposit.into())
			}
		}

	}
}