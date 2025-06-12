//! Mocks for the vesting module.

#![cfg(test)]

use super::*;
use frame::prelude::*;
use polkadot_sdk::{
    frame_support::{
        construct_runtime, derive_impl,
        traits::{ConstU32, ConstU64},
    },
    sp_runtime::{
        traits::{BlakeTwo256, IdentityLookup},
        BuildStorage,
    },
};

use polkadot_sdk::{polkadot_sdk_frame::runtime::prelude::*, *};

type Block = polkadot_sdk::frame_system::mocking::MockBlock<Runtime>;

// Configure a mock runtime to test the pallet.
construct_runtime!(
    pub enum Runtime {
        System: polkadot_sdk::frame_system,
        PalletBalances: polkadot_sdk::pallet_balances,
        Vesting: pallet_vesting,
    }
);

#[derive_impl(polkadot_sdk::frame_system::config_preludes::TestDefaultConfig)]
impl polkadot_sdk::frame_system::Config for Runtime {
    type Block = Block;
    type AccountData = polkadot_sdk::pallet_balances::AccountData<Balance>;
}

type Balance = u64;
type AccountId = u64;

#[derive_impl(polkadot_sdk::pallet_balances::config_preludes::TestDefaultConfig)]
impl polkadot_sdk::pallet_balances::Config for Runtime {
    type AccountStore = System;
    type Balance = Balance;
}

impl pallet_vesting::Config for Runtime {
    type Currency = PalletBalances;
    type BlockNumberToBalance = polkadot_sdk::sp_runtime::traits::ConvertInto;
    type MaxVestingSchedules = ConstU32<10>;
    type MinVestedTransfer = ConstU64<10>;
}

// Test accounts
pub const ALICE: AccountId = 1;
pub const BOB: AccountId = 2;

// Build genesis storage according to the mock runtime.
pub fn new_test_ext() -> polkadot_sdk::sp_io::TestExternalities {
    let mut storage = polkadot_sdk::frame_system::GenesisConfig::<Runtime>::default()
        .build_storage()
        .unwrap();

    polkadot_sdk::pallet_balances::GenesisConfig::<Runtime> {
        balances: vec![(ALICE, 1000), (BOB, 1000)],
    }
    .assimilate_storage(&mut storage)
    .unwrap();

    storage.into()
}

pub struct ExtBuilder;

impl ExtBuilder {
    pub fn build() -> polkadot_sdk::sp_io::TestExternalities {
        new_test_ext()
    }
}
