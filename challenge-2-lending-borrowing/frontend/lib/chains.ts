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
    HARRY_CollateralToken: {
      address: "0x5687F0A7AD0a66A1EBF6Bc3924A00E5416ED3ebB",
    },
    HARRY_LendingToken: {
      address: "0x9d25c235D90F54181e6577E7E9bf8205bBB24692",
    },
    LendingBorrowing: {
      address: "0x8CA10E7a97a24907CC98F22e58bB74280DB76dDE",
    },
  },
});
