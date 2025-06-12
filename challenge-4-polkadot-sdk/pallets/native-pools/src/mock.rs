//! Mocks for the vesting module.

#![cfg(test)]

use super::*;
use polkadot_sdk::{
    frame_support::{
        construct_runtime, derive_impl, parameter_types,
        traits::{ConstU32, ConstU64, EitherOfDiverse},
    },
    sp_runtime::traits::ConvertInto,
};

use polkadot_sdk::{polkadot_sdk_frame::runtime::prelude::*, *};

use polkadot_sdk::sp_runtime::{traits::IdentityLookup, BuildStorage};

use crate as pallet_native_pools;

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

impl Config for Runtime {
    type Currency = PalletBalances;
}

type Block = polkadot_sdk::frame_system::mocking::MockBlock<Runtime>;

// Configure a mock runtime to test the pallet.
construct_runtime!(
    pub enum Runtime {
        System: polkadot_sdk::frame_system,
        PalletBalances: polkadot_sdk::pallet_balances,
        NativePools: pallet_native_pools,
    }
);

#[derive_impl(polkadot_sdk::frame_system::config_preludes::TestDefaultConfig)]
impl polkadot_sdk::frame_system::Config for Runtime {
    type Block = Block;
    type AccountData = polkadot_sdk::pallet_balances::AccountData<Balance>;
}

#[derive(Default)]
pub struct ExtBuilder;

impl ExtBuilder {
    pub fn build() -> sp_io::TestExternalities {
        let mut t = frame_system::GenesisConfig::<Runtime>::default()
            .build_storage()
            .unwrap();

        pallet_balances::GenesisConfig::<Runtime> {
            balances: vec![(ALICE, ALICE_BALANCE), (CHARLIE, CHARLIE_BALANCE)],
            ..Default::default()
        }
        .assimilate_storage(&mut t)
        .unwrap();

        t.into()
    }
}

// Test accounts
pub const ALICE: AccountId = 1;
pub const BOB: AccountId = 2;
pub const CHARLIE: AccountId = 3;
pub const TEAM: AccountId = 100;

// Pallet ID for the pool
pub const POOL_PALLET_ID: PalletId = PalletId(*b"ntvpools");
parameter_types! {
    pub const PoolPalletId: PalletId = POOL_PALLET_ID;
}

// Build genesis storage according to the mock runtime.
pub fn new_test_ext() -> polkadot_sdk::sp_io::TestExternalities {
    let mut storage = polkadot_sdk::frame_system::GenesisConfig::<Runtime>::default()
        .build_storage()
        .unwrap();

    polkadot_sdk::pallet_balances::GenesisConfig::<Runtime> {
        balances: vec![
            (ALICE, 10000),
            (BOB, 10000),
            (CHARLIE, 10000),
            (TEAM, 50000),
        ],
    }
    .assimilate_storage(&mut storage)
    .unwrap();

    storage.into()
}
