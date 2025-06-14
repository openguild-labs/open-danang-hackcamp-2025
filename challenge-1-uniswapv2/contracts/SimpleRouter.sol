// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import './interfaces/IUniswapV2Factory.sol';
import './interfaces/IUniswapV2Pair.sol';
import './interfaces/IERC20.sol';

contract SimpleRouter {
    address public immutable factory;
    address public immutable WETH;

    constructor(address _factory, address _WETH) {
        factory = _factory;
        WETH = _WETH;
    }

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts) {
        require(deadline >= block.timestamp, 'SimpleRouter: EXPIRED');
        require(path.length == 2, 'SimpleRouter: INVALID_PATH');
        
        address pair = IUniswapV2Factory(factory).getPair(path[0], path[1]);
        require(pair != address(0), 'SimpleRouter: PAIR_NOT_EXISTS');
        
        // Transfer tokens to pair
        IERC20(path[0]).transferFrom(msg.sender, pair, amountIn);
        
        // Calculate and execute swap
        uint amountOut = _calculateAmountOut(pair, path[0], amountIn);
        require(amountOut >= amountOutMin, 'SimpleRouter: INSUFFICIENT_OUTPUT_AMOUNT');
        
        _executeSwap(pair, path[0], amountOut, to);
        
        amounts = new uint[](2);
        amounts[0] = amountIn;
        amounts[1] = amountOut;
    }
    
    function _calculateAmountOut(address pair, address tokenIn, uint amountIn) internal view returns (uint) {
        (uint reserve0, uint reserve1,) = IUniswapV2Pair(pair).getReserves();
        address token0 = IUniswapV2Pair(pair).token0();
        
        bool isToken0Input = tokenIn == token0;
        (uint reserveIn, uint reserveOut) = isToken0Input ? (reserve0, reserve1) : (reserve1, reserve0);
        
        uint amountInWithFee = amountIn * 997;
        return (amountInWithFee * reserveOut) / (reserveIn * 1000 + amountInWithFee);
    }
    
    function _executeSwap(address pair, address tokenIn, uint amountOut, address to) internal {
        address token0 = IUniswapV2Pair(pair).token0();
        bool isToken0Input = tokenIn == token0;
        (uint amount0Out, uint amount1Out) = isToken0Input ? (uint(0), amountOut) : (amountOut, uint(0));
        IUniswapV2Pair(pair).swap(amount0Out, amount1Out, to, new bytes(0));
    }
} 