//SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import "./UniswapV2ERC20.sol";
import "./libraries/Math.sol";
import "./interfaces/IERC20.sol";

/* -------------------------------------------------------------------------- */
/*                             Custom revert errors                           */
/* -------------------------------------------------------------------------- */
error Locked();
error Overflow();
error InsufficientLiquidityMinted();
error TransferFailed();
error NoOutput();
error InvalidTo();
error Liquidity();
error NoInput();
error KInvariant();

contract UniswapV2PairLogic is UniswapV2ERC20 {
    uint public constant MINIMUM_LIQUIDITY = 1_000;
    bytes4 private constant SELECTOR = bytes4(keccak256("transfer(address,uint256)"));

    address public token0;
    address public token1;
    address public factory;

    uint112 private reserve0;
    uint112 private reserve1;
    uint32  private blockTimestampLast;

    uint private unlocked = 1;
    modifier lock() {
        if (unlocked != 1) revert Locked();
        unlocked = 0;
        _;
        unlocked = 1;
    }

    /* --------------------------- View helper --------------------------- */
    function getReserves() external view returns (uint112, uint112, uint32) {
        return (reserve0, reserve1, blockTimestampLast);
    }

    /* ------------------------------ Internal --------------------------- */
    function _safeTransfer(address _token, address to, uint value) private {
        (bool success, bytes memory data) = _token.call(
            abi.encodeWithSelector(SELECTOR, to, value)
        );
        if (!(success && (data.length == 0 || abi.decode(data, (bool))))) {
            revert TransferFailed();
        }
    }

    function _update(uint balance0, uint balance1) private {
        if (balance0 > type(uint112).max || balance1 > type(uint112).max) revert Overflow();
        reserve0 = uint112(balance0);
        reserve1 = uint112(balance1);
        blockTimestampLast = uint32(block.timestamp % 2**32);
        emit Sync(reserve0, reserve1);
    }

    /* ------------------------------- Events ---------------------------- */
    event Mint(address indexed sender, uint amount0, uint amount1);
    event Burn(address indexed sender, uint amount0, uint amount1, address indexed to);
    event Swap(
        address indexed sender,
        uint amount0In,
        uint amount1In,
        uint amount0Out,
        uint amount1Out,
        address indexed to
    );
    event Sync(uint112 reserve0, uint112 reserve1);

    /* ------------------------------ Liquidity -------------------------- */
    function mint(address to) external lock returns (uint liquidity) {
        uint112 _reserve0 = reserve0;
        uint112 _reserve1 = reserve1;
        uint balance0 = IERC20(token0).balanceOf(address(this));
        uint balance1 = IERC20(token1).balanceOf(address(this));
        uint amount0  = balance0 - _reserve0;
        uint amount1  = balance1 - _reserve1;

        uint _totalSupply = totalSupply;
        if (_totalSupply == 0) {
            liquidity = Math.sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY;
            _mint(address(0), MINIMUM_LIQUIDITY);
        } else {
            liquidity = Math.min(
                (amount0 * _totalSupply) / _reserve0,
                (amount1 * _totalSupply) / _reserve1
            );
        }
        if (liquidity == 0) revert InsufficientLiquidityMinted();
        _mint(to, liquidity);

        _update(balance0, balance1);
        emit Mint(msg.sender, amount0, amount1);
    }

    function burn(address to) external lock returns (uint amount0, uint amount1) {
        uint balance0  = IERC20(token0).balanceOf(address(this));
        uint balance1  = IERC20(token1).balanceOf(address(this));
        uint liquidity = balanceOf[address(this)];

        uint _totalSupply = totalSupply;
        amount0 = (liquidity * balance0) / _totalSupply;
        amount1 = (liquidity * balance1) / _totalSupply;
        if (amount0 == 0 || amount1 == 0) revert InsufficientLiquidityMinted();
        _burn(address(this), liquidity);
        _safeTransfer(token0, to, amount0);
        _safeTransfer(token1, to, amount1);

        balance0 = IERC20(token0).balanceOf(address(this));
        balance1 = IERC20(token1).balanceOf(address(this));
        _update(balance0, balance1);
        emit Burn(msg.sender, amount0, amount1, to);
    }

    /* -------------------------------- Swap ----------------------------- */
    function swap(
        uint amount0Out,
        uint amount1Out,
        address to,
        bytes calldata
    ) external lock {
        if (amount0Out == 0 && amount1Out == 0) revert NoOutput();
        if (to == token0 || to == token1) revert InvalidTo();

        uint112 _reserve0 = reserve0;
        uint112 _reserve1 = reserve1;
        if (amount0Out >= _reserve0 || amount1Out >= _reserve1) revert Liquidity();

        if (amount0Out > 0) _safeTransfer(token0, to, amount0Out);
        if (amount1Out > 0) _safeTransfer(token1, to, amount1Out);

        uint balance0 = IERC20(token0).balanceOf(address(this));
        uint balance1 = IERC20(token1).balanceOf(address(this));

        uint amount0In = balance0 > _reserve0 - amount0Out ? balance0 - (_reserve0 - amount0Out) : 0;
        uint amount1In = balance1 > _reserve1 - amount1Out ? balance1 - (_reserve1 - amount1Out) : 0;
        if (amount0In == 0 && amount1In == 0) revert NoInput();

        if (balance0 * balance1 < uint(_reserve0) * uint(_reserve1)) revert KInvariant();

        _update(balance0, balance1);
        emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out, to);
    }

    /* --------------------------- Utility hooks ------------------------- */
    function skim(address to) external lock {
        _safeTransfer(token0, to, IERC20(token0).balanceOf(address(this)) - reserve0);
        _safeTransfer(token1, to, IERC20(token1).balanceOf(address(this)) - reserve1);
    }

    function sync() external lock {
        _update(
            IERC20(token0).balanceOf(address(this)),
            IERC20(token1).balanceOf(address(this))
        );
    }
}