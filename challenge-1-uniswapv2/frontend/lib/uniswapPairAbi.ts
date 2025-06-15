/**
 * Minimal Uniswap V2 Pair ABI (only the fragments used by the UI).
 */
export const uniswapPairAbi = [
  {
    "constant": true,
    "inputs": [],
    "name": "getReserves",
    "outputs": [
      { "name": "_reserve0", "type": "uint112" },
      { "name": "_reserve1", "type": "uint112" },
      { "name": "_blockTimestampLast", "type": "uint32" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  { "constant": true, "inputs": [], "name": "token0", "outputs": [{ "type": "address" }], "stateMutability": "view", "type": "function" },
  { "constant": true, "inputs": [], "name": "token1", "outputs": [{ "type": "address" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "name": "to", "type": "address" }], "name": "mint", "outputs": [{ "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "name": "to", "type": "address" }], "name": "burn", "outputs": [{ "type": "uint256" }, { "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" },
  {
    "inputs": [
      { "name": "amount0Out", "type": "uint256" },
      { "name": "amount1Out", "type": "uint256" },
      { "name": "to",        "type": "address" },
      { "name": "data",      "type": "bytes"   }
    ],
    "name": "swap",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  { "constant": true, "inputs": [], "name": "totalSupply", "outputs": [{ "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "constant": true, "inputs": [{ "type": "address" }], "name": "balanceOf", "outputs": [{ "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "name": "to", "type": "address" }, { "name": "value", "type": "uint256" }], "name": "transfer", "outputs": [{ "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }
] as const;