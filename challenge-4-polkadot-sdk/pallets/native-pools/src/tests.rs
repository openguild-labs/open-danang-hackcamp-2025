#![cfg(test)]

use super::*;
use frame_support::{
	assert_ok, assert_noop,
	parameter_types,
	traits::{Currency, GenesisBuild},
};
use sp_core::H256;
use sp_runtime::{
	testing::Header,
	traits::{BlakeTwo256, IdentityLookup},
};
use frame_system as system;

// --- Mock Runtime Setup ---

type AccountId = u64;
type Balance = u128;
type BlockNumber = u64;

pub const ALICE: AccountId = 1;
pub const BOB: AccountId = 2;

impl system::Config for Test {
	type BaseCallFilter = frame_support::traits::Everything;
	type BlockWeights = ();
	type BlockLength = ();
	type DbWeight = ();
	type Origin = Origin;
	type Call = Call;
	type Index = u64;
	type BlockNumber = BlockNumber;
	type Hash = H256;
	type Hashing = BlakeTwo256;
	type AccountId = AccountId;
	type Lookup = IdentityLookup<AccountId>;
	type Header = Header;
	type Event = ();
	type BlockHashCount = ();
	type Version = ();
	type PalletInfo = PalletInfo;
	type AccountData = pallet_balances::AccountData<Balance>;
	type OnNewAccount = ();
	type OnKilledAccount = ();
	type SystemWeightInfo = ();
	type SS58Prefix = ();
	type OnSetCode = ();
	type MaxConsumers = frame_support::traits::ConstU32<16>;
}

parameter_types! {
	pub const ExistentialDeposit: Balance = 1;
}

impl pallet_balances::Config for Test {
	type MaxLocks = ();
	type MaxReserves = ();
	type ReserveIdentifier = [u8; 8];
	type Balance = Balance;
	type Event = ();
	type DustRemoval = ();
	type ExistentialDeposit = ExistentialDeposit;
	type AccountStore = System;
	type WeightInfo = ();
}

impl Config for Test {
	type Event = ();
	type Currency = Balances;
	type PoolId = u32;
	type Balance = Balance;
}

type System = frame_system::Pallet<Test>;
type Balances = pallet_balances::Pallet<Test>;
type NativePools = crate::Pallet<Test>;

frame_support::construct_runtime!(
	pub enum Test where
		Block = Block,
		NodeBlock = Block,
		UncheckedExtrinsic = UncheckedExtrinsic
	{
		System: frame_system,
		Balances: pallet_balances,
		NativePools: crate,
	}
);

// --- Helper ---

fn new_test_ext() -> sp_io::TestExternalities {
	let mut t = frame_system::GenesisConfig::default().build_storage::<Test>().unwrap();

	pallet_balances::GenesisConfig::<Test> {
		balances: vec![(ALICE, 10_000), (BOB, 5_000)],
	}
	.assimilate_storage(&mut t)
	.unwrap();

	t.into()
}

// --- Tests ---

#[test]
fn create_pool_should_work() {
	new_test_ext().execute_with(|| {
		assert_ok!(NativePools::create_pool(Origin::signed(ALICE), 0, 1_000));

		let pool = NativePools::pools(0).expect("Pool should exist");
		assert_eq!(pool.total_liquidity, 1_000);
		assert_eq!(pool.owner, ALICE);
	});
}

#[test]
fn join_pool_should_increase_liquidity() {
	new_test_ext().execute_with(|| {
		assert_ok!(NativePools::create_pool(Origin::signed(ALICE), 0, 1_000));
		assert_ok!(NativePools::join_pool(Origin::signed(BOB), 0, 500));

		let pool = NativePools::pools(0).unwrap();
		assert_eq!(pool.total_liquidity, 1_500);
	});
}

#[test]
fn exit_pool_should_reduce_liquidity() {
	new_test_ext().execute_with(|| {
		assert_ok!(NativePools::create_pool(Origin::signed(ALICE), 0, 1_000));
		assert_ok!(NativePools::join_pool(Origin::signed(BOB), 0, 500));
		assert_ok!(NativePools::exit_pool(Origin::signed(BOB), 0, 300));

		let pool = NativePools::pools(0).unwrap();
		assert_eq!(pool.total_liquidity, 1_200);
	});
}

#[test]
fn join_pool_should_fail_for_nonexistent_pool() {
	new_test_ext().execute_with(|| {
		assert_noop!(
			NativePools::join_pool(Origin::signed(ALICE), 42, 500),
			Error::<Test>::PoolDoesNotExist
		);
	});
}

#[test]
fn exit_pool_should_fail_if_insufficient_liquidity() {
	new_test_ext().execute_with(|| {
		assert_ok!(NativePools::create_pool(Origin::signed(ALICE), 0, 1_000));
		assert_ok!(NativePools::join_pool(Origin::signed(BOB), 0, 200));

		assert_noop!(
			NativePools::exit_pool(Origin::signed(BOB), 0, 300),
			Error::<Test>::InsufficientLiquidity
		);
	});
}
