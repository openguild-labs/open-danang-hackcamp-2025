#![cfg(test)]

use super::*;
use polkadot_sdk::{
	frame_support::{
		construct_runtime, derive_impl, parameter_types,
		traits::{ConstU32, ConstU64},
		PalletId,
	},
	sp_runtime::{traits::IdentityLookup, BuildStorage, ConvertInto},
};

use crate as native_pools;

/// Alias types for the mock runtime.
pub type AccountId = u128;
type Balance = u64;
type Block = frame_system::mocking::MockBlock<Runtime>;

/// Pallet identifier used by the NativePools pallet in tests.
parameter_types! {
	pub const NativePoolsPalletId: PalletId = PalletId(*b"py/natpl");
}

/// --- System configuration ---
#[derive_impl(frame_system::config_preludes::TestDefaultConfig as frame_system::DefaultConfig)]
impl polkadot_sdk::frame_system::Config for Runtime {
	type AccountId = AccountId;
	type Lookup = IdentityLookup<Self::AccountId>;
	type Block = Block;
	type AccountData = pallet_balances::AccountData<Balance>;
}

/// --- Balances configuration ---
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

/// --- NativePools configuration ---
impl Config for Runtime {
	type Currency = PalletBalances;
	type PalletId = NativePoolsPalletId;
	type RewardOrigin = frame_system::EnsureRoot<AccountId>;
}

/// --- Construct the runtime ---
construct_runtime!(
	pub enum Runtime {
		System: frame_system,
		NativePools: native_pools,
		PalletBalances: pallet_balances,
	}
);

/// Predefined accounts used in the tests.
pub const ALICE: AccountId = 1;
pub const BOB: AccountId = 2;

/// Initial balances for test accounts.
pub const ALICE_BALANCE: Balance = 100;
pub const BOB_BALANCE: Balance = 100;

/// Test externalities builder.
#[derive(Default)]
pub struct ExtBuilder;

impl ExtBuilder {
	pub fn build() -> sp_io::TestExternalities {
		let mut storage = frame_system::GenesisConfig::<Runtime>::default()
			.build_storage()
			.unwrap();

		pallet_balances::GenesisConfig::<Runtime> {
			balances: vec![(ALICE, ALICE_BALANCE), (BOB, BOB_BALANCE)],
			..Default::default()
		}
		.assimilate_storage(&mut storage)
		.unwrap();

		storage.into()
	}
}