#![cfg(test)]

use super::*;
use polkadot_sdk::frame_support::{assert_noop, assert_ok};
use mock::*; 

#[test]
fn create_pool_should_work() {
    new_test_ext().execute_with(|| {
 
        assert_ok!(NativePools::create_pool(Origin::signed(1), 0, 1_000));
        
        let pool = NativePools::pools(0).expect("Pool should exist");
        assert_eq!(pool.total_liquidity, 1_000);
        assert_eq!(pool.owner, 1);
    });
}

#[test]
fn join_pool_should_increase_liquidity() {
    new_test_ext().execute_with(|| {
        assert_ok!(NativePools::create_pool(Origin::signed(1), 0, 1_000));

        assert_ok!(NativePools::join_pool(Origin::signed(2), 0, 500));

        let pool = NativePools::pools(0).unwrap();
        assert_eq!(pool.total_liquidity, 1_500);
    });
}

#[test]
fn exit_pool_should_reduce_liquidity() {
    new_test_ext().execute_with(|| {
        assert_ok!(NativePools::create_pool(Origin::signed(1), 0, 1_000));
        assert_ok!(NativePools::join_pool(Origin::signed(2), 0, 500));
        
        assert_ok!(NativePools::exit_pool(Origin::signed(2), 0, 300));

        let pool = NativePools::pools(0).unwrap();
        assert_eq!(pool.total_liquidity, 1_200);
    });
}

#[test]
fn join_pool_should_fail_for_nonexistent_pool() {
    new_test_ext().execute_with(|| {
        assert_noop!(
            NativePools::join_pool(Origin::signed(1), 99, 500),
            Error::<Test>::PoolDoesNotExist
        );
    });
}

#[test]
fn exit_pool_should_fail_if_insufficient_liquidity() {
    new_test_ext().execute_with(|| {
        assert_ok!(NativePools::create_pool(Origin::signed(1), 0, 1_000));
        assert_ok!(NativePools::join_pool(Origin::signed(2), 0, 200));

        assert_noop!(
            NativePools::exit_pool(Origin::signed(2), 0, 300),
            Error::<Test>::InsufficientLiquidity
        );
    });
}
