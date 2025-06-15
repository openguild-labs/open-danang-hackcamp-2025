import { Token } from "@/types/token"

export const L2SLPX_CONTRACT_ADDRESS = "0x262e52beD191a441CBD28dB151A11D7c41384F72"

export const YIELD_DELEGATION_VAULT_CONTRACT_ADDRESS =
  "0xa0C9789F449E4525b21647c67FEFeD121b73ef5d"

/* -------------------------------------------------------------------------- */
/*                              Chain identifiers                             */
/* -------------------------------------------------------------------------- */

export const PASEO_ASSETHUB_CHAIN_ID = 420420422

/* -------------------------------------------------------------------------- */
/*                                Token catalog                               */
/* -------------------------------------------------------------------------- */

export const TOKEN_LIST: Token[] = [
  {
    name: "Ethereum",
    symbol: "ETH",
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    decimals: 18,
    image: "/eth.svg",
  },
  {
    name: "Polkadot",
    symbol: "DOT",
    address: "0x4B16E254E7848e0826eBDd3049474fD9E70A244c",
    decimals: 18,
    image: "/dot.svg",
  },
  {
    name: "Paseo",
    symbol: "PAS",
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    decimals: 18,
    image: "/pas.svg",
  },
  {
    name: "Voucher ETH",
    symbol: "vETH",
    address: "0x6e0f9f2d25CC586965cBcF7017Ff89836ddeF9CC",
    decimals: 18,
    image: "/veth.svg",
  },
  {
    name: "Voucher DOT",
    symbol: "vDOT",
    address: "0x8bFA30329F2A7A7b72fa4A76FdcE8aC92284bb94",
    decimals: 18,
    image: "/vdot.svg",
  },
]