import { CONTRACTS } from './web3'

export interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI?: string;
  isNative?: boolean;
}

// Real deployed tokens on Paseo Asset Hub
export const TOKENS: Record<string, Token> = {
  PAS: {
    symbol: 'PAS',
    name: 'Paseo Asset Hub Native',
    address: '0x0000000000000000000000000000000000000000', // Native token
    decimals: 18,
    isNative: true,
  },
  WETH: {
    symbol: 'WETH',
    name: 'Wrapped PAS',
    address: CONTRACTS.WETH,
    decimals: 18,
  },
}

// Show all tokens for trading
export const POPULAR_TOKENS = [
  TOKENS.PAS,
  TOKENS.WETH,
]

export const getTokenByAddress = (address: string): Token | undefined => {
  return Object.values(TOKENS).find(
    token => token.address.toLowerCase() === address.toLowerCase()
  )
}

export const getTokenBySymbol = (symbol: string): Token | undefined => {
  return TOKENS[symbol.toUpperCase()]
} 