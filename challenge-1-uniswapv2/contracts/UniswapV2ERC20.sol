//SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

/**
 * Ultra-compact ERC-20 used solely for Uniswap V2 LP tokens.
 * Only essential state (totalSupply, balanceOf) and the `transfer`
 * function are kept—no allowances—drastically cutting bytecode size
 * so the Pair implementation stays under the 49 kB init-code cap.
 */
contract UniswapV2ERC20 {
    string public constant name     = "Uniswap V2 LP";
    string public constant symbol   = "UNI-V2";
    uint8  public constant decimals = 18;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    /* --------------------------- Internal mint/burn --------------------------- */
    function _mint(address to, uint256 value) internal {
        totalSupply += value;
        balanceOf[to] += value;
        emit Transfer(address(0), to, value);
    }

    function _burn(address from, uint256 value) internal {
        balanceOf[from] -= value;
        totalSupply     -= value;
        emit Transfer(from, address(0), value);
    }

    /* ------------------------------ ERC-20 API ------------------------------- */
    function transfer(address to, uint256 value) external returns (bool) {
        balanceOf[msg.sender] -= value;
        balanceOf[to]         += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    /* -------------------------------- Events --------------------------------- */
    event Transfer(address indexed from, address indexed to, uint256 value);
}