import { createConfig, http } from 'wagmi'
import { defineChain } from 'viem'

// Paseo Asset Hub Testnet
export const paseoAssetHub = defineChain({
  id: 420420422,
  name: 'Paseo Asset Hub',
  network: 'paseo-asset-hub',
  nativeCurrency: {
    decimals: 18,
    name: 'PAS',
    symbol: 'PAS',
  },
  rpcUrls: {
    default: { http: ['https://testnet-passet-hub-eth-rpc.polkadot.io'] },
    public: { http: ['https://testnet-passet-hub-eth-rpc.polkadot.io'] },
  },
  blockExplorers: {
    default: { name: 'BlockScout', url: 'https://blockscout-passet-hub.parity-testnet.parity.io' },
  },
})

export const config = createConfig({
  chains: [paseoAssetHub],
  transports: {
    [paseoAssetHub.id]: http(),
  },
})

// Deployed Contract Addresses
export const CONTRACTS = {
  UNISWAP_V2_FACTORY: '0xcC7Cf672147325f9dE0629C0ffccBC5724a5A4AE',
  UNISWAP_V2_ROUTER: '', // Router deployment failed - using direct pair swaps
  WETH: '0x9E74fC88465Ca0a8E3899D3aD235C99b127bc21D',
  TOKEN_A: '0x8D6e37347A6020B5D0902D15257F28a2c19B4145',
  TOKEN_B: '0x2251bf61f55e22dAa392b0e83A66f2DbF21176fb',
}

// Contract ABIs (simplified for demo)
export const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address, address) view returns (uint256)',
  'function approve(address, uint256) returns (bool)',
  'function transfer(address, uint256) returns (bool)',
  'function transferFrom(address, address, uint256) returns (bool)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function name() view returns (string)',
  'function totalSupply() view returns (uint256)',
] as const

export const UNISWAP_V2_FACTORY_ABI = [
  'function getPair(address, address) view returns (address)',
  'function createPair(address, address) returns (address)',
  'function allPairs(uint256) view returns (address)',
  'function allPairsLength() view returns (uint256)',
] as const

export const UNISWAP_V2_PAIR_ABI = [
  'function getReserves() view returns (uint112, uint112, uint32)',
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function totalSupply() view returns (uint256)',
  'function swap(uint256, uint256, address, bytes)',
] as const

export const WETH_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address, address) view returns (uint256)',
  'function approve(address, uint256) returns (bool)',
  'function transfer(address, uint256) returns (bool)',
  'function transferFrom(address, address, uint256) returns (bool)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function name() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function deposit() payable',
  'function withdraw(uint256)',
] as const 