import { defineChain } from "viem";

export const paseoAssetHub = defineChain({
  id: 420420421,
  name: "Paseo AssetHub",
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
    multicall3: {
      address: "0x5545dec97cb957e83d3e6a1e82fabfacf9764cf1",
      blockCreated: 10174702,
    },
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
  },
});
