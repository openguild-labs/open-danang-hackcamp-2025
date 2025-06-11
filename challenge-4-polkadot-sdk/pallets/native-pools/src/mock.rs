//! Mocks for the vesting module.

#![cfg(test)]

use super::*;
use polkadot_sdk::{frame_support::{
	construct_runtime, derive_impl, parameter_types,
	traits::{ConstU32, ConstU64},
}, sp_runtime::traits::ConvertInto};

use polkadot_sdk::{
	polkadot_sdk_frame::runtime::prelude::*,
	*,
};

use polkadot_sdk::sp_runtime::{traits::IdentityLookup, BuildStorage};

use crate as native_pools;

pub type AccountId = u128;

#[derive_impl(frame_system::config_preludes::TestDefaultConfig as frame_system::DefaultConfig)]
impl polkadot_sdk::frame_system::Config for Runtime {
	type AccountId = AccountId;
	type Lookup = IdentityLookup<Self::AccountId>;
	type Block = Block;
	type AccountData = pallet_balances::AccountData<Balance>;
}

type Balance = u64;

impl pallet_balances::Config for Runtime {
	type RuntimeEvent = RuntimeEvent;
	type Balance = Balance;
	type DustRemoval = ();
	type ExistentialDeposit = ConstU64<1>;
	type AccountStore = frame_system::Pallet<Runtime>;
	type MaxLocks = ();
	type MaxReserves = ();
	type ReserveIdentifier = [u8; 8];
	type WeightInfo = ();
	type RuntimeHoldReason = RuntimeHoldReason;
	type RuntimeFreezeReason = RuntimeFreezeReason;
	type FreezeIdentifier = [u8; 8];
	type MaxFreezes = ();
	type DoneSlashHandler = ();
}

parameter_types! {
	pub const NativePoolsPalletId: PalletId = PalletId(*b"nativepl");
}

impl Config for Runtime {
	type Currency = PalletBalances;
	type PalletId = NativePoolsPalletId;
	type RewardOrigin = frame_system::EnsureSigned<AccountId>; // Any signed origin is allowed
}

type Block = frame_system::mocking::MockBlock<Runtime>;

construct_runtime!(
	pub enum Runtime {
		System: frame_system,
		NativePools: native_pools,
		PalletBalances: pallet_balances,
	}
);

pub const ALICE: AccountId = 1;
pub const BOB: AccountId = 2;
pub const CHARLIE: AccountId = 3;

pub const ALICE_BALANCE: u64 = 1000;
pub const BOB_BALANCE: u64 = 1000;
pub const CHARLIE_BALANCE: u64 = 2000; // Increased to support reward deposits

#[derive(Default)]
pub struct ExtBuilder;

impl ExtBuilder {
	pub fn build() -> sp_io::TestExternalities {
		let mut t = frame_system::GenesisConfig::<Runtime>::default()
			.build_storage()
			.unwrap();

		pallet_balances::GenesisConfig::<Runtime> {
			balances: vec![
				(ALICE, ALICE_BALANCE),
				(BOB, BOB_BALANCE),
				(CHARLIE, CHARLIE_BALANCE),
			],
			..Default::default()
		}
		.assimilate_storage(&mut t)
		.unwrap();

		t.into()
	}
}
