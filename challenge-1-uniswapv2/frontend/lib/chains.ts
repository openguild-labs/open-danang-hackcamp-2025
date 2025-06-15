import { defineChain } from "viem";

export const paseoAssetHub = defineChain({
  id: 420420422,
  name: "Passet Hub",
  nativeCurrency: {
    decimals: 18,
    name: "Paseo",
    symbol: "PAS",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-passet-hub-eth-rpc.polkadot.io/"],
      webSocket: ["wss://testnet-passet-hub.polkadot.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "Explorer",
      url: "https://blockscout-passet-hub.parity-testnet.parity.io/",
    },
  },
  contracts: {
    HARRY_TOKEN: {
      address: "0x8545d06fb3f2475e39280c9ce5562059c8043408",
    },
    WETH: {
      address: "0x0e9b6d90e50bc5d164ef35e5ba416661f68eb82c",
    },
    UNISWAPV2FACTORY: {
      address: "0xe5bcccab71bf664ed954c904990a6f3f80b2a9cc",
    },
    UNISWAPV2PAIRHARRYWETH: {
      address: "0x91c5d624fa83969fc3750d50d3c19f683d158a52",
    },
    TOKEN_1: {
      address: "0xf864e893cbad10b152fd3a1790dd8302036c0a4d",
    },
    TOKEN_2: {
      address: "0xf0039ac8ce720266326c934cc558eb53a1962f49",
    },
    TOKEN_3: {
      address: "0x3d4f99a653f9f9055565b930b7408392de028703",
    },
    UNISWAPV2PAIRTOKEN1TOKEN2: {
      address: "0x3C157e371F68D4189Eca81fE34DFc19e594806aA",
    },
  },
});
