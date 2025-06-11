import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@parity/hardhat-polkadot";
import dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.26",
  resolc: {
    version: "1.5.2",
    compilerSource: "npm",
  },
  networks: {
    hardhat: {
      polkavm: true,
      // Uncomment to deploy to a local fork of the westend network.
      // forking: {
      //     url: 'wss://westend-asset-hub-rpc.polkadot.io',
      // },
      // Uncomment to deploy to a local node using the node binary
      nodeConfig: {
        nodeBinaryPath: "./binaries/substrate-node",
        rpcPort: 8000,
        dev: true,
      },
      adapterConfig: {
        adapterBinaryPath: "./binaries/eth-rpc",
        dev: true,
      },
      accounts: {
        accountsBalance: "10000000000000000000000", // 10000 ETH,
        count: 5,
      },
    },
    localNode: {
      polkavm: true,
      url: `http://127.0.0.1:8545`,
    },
    paseoAssetHub: {
      polkavm: true,
      url: "https://testnet-passet-hub-eth-rpc.polkadot.io/",
      accounts: [
        process.env.PRIVATE_KEY as string,
        process.env.PRIVATE_KEY_2 as string,
        process.env.PRIVATE_KEY_3 as string,
      ],
      timeout: 40000000000000000000, // 60 seconds
    },
  },
};

export default config;
