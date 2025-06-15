//SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import "./UniswapV2ERC20.sol";

/* -------------------------------------------------------------------------- */
/*                          Minimal delegate-proxy core                       */
/* -------------------------------------------------------------------------- */
error AlreadyInit();

contract UniswapV2Pair is UniswapV2ERC20 {
    /* Immutable address of the logic contract housing AMM functionality */
    address public immutable logic;

    /* Token addresses and factory set once via initialize */
    address public token0;
    address public token1;
    address public factory;

    /* Packed reserves (kept for on-chain reads) */
    uint112 private reserve0;
    uint112 private reserve1;
    uint32  private blockTimestampLast;

    constructor(address _logic) {
        logic = _logic;
    }

    /* One-time initialiser called by the factory immediately after clone */
    function initialize(address _token0, address _token1) external {
        if (factory != address(0)) revert AlreadyInit();
        factory = msg.sender;
        token0  = _token0;
        token1  = _token1;
    }

    /* Public getter used by the UI and other contracts */
    function getReserves() external view returns (uint112, uint112, uint32) {
        return (reserve0, reserve1, blockTimestampLast);
    }

    /* ------------------------------------------------------------------ */
    /*                         Fallback delegatecall                      */
    /* ------------------------------------------------------------------ */
    fallback() external payable {
        address impl = logic;
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), impl, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0  { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }

    receive() external payable { revert(); }
}