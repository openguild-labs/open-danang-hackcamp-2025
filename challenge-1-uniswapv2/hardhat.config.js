require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ignition");
require("hardhat-resolc");
require("hardhat-revive-node");
require("./tasks/compile-revive");
require("./tasks/deploy-revive");
require("./tasks/deploy");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */

const SOLC_VERSION = "0.8.29";
const BASE_COMPILER_SETTINGS = {
  viaIR: true,
  optimizer: { enabled: true, runs: 800 },
  metadata: { bytecodeHash: "none" },
};

const config = {
  solidity: { version: SOLC_VERSION, settings: BASE_COMPILER_SETTINGS },
  resolc: { compilerSource: "npm", version: SOLC_VERSION },

  networks: {
    hardhat: {
      polkavm: true,
      allowUnlimitedContractSize: true,
      nodeConfig: {
        nodeBinaryPath: "../binaries/substrate-node",
        rpcPort: 8000,
        dev: true,
      },
      adapterConfig: {
        adapterBinaryPath: "../binaries/eth-rpc",
        dev: true,
      },
    },

    polkavm: {
      polkavm: true,
      url: "http://127.0.0.1:8545",
      accounts: [process.env.LOCAL_PRIV_KEY, process.env.AH_PRIV_KEY],
      allowUnlimitedContractSize: true,
    },

    paseoAssetHub: {
      polkavm: true,
      url: "https://testnet-passet-hub-eth-rpc.polkadot.io/",
      accounts: [process.env.AH_PRIV_KEY],
      allowUnlimitedContractSize: true,
    },
  },

  etherscan: {
    apiKey: { paseoAssetHub: "empty" },
    customChains: [
      {
        network: "paseoAssetHub",
        chainId: 420420422,
        urls: {
          apiURL: "https://blockscout-passet-hub.parity-testnet.parity.io/api",
          browserURL: "https://blockscout-passet-hub.parity-testnet.parity.io",
        },
      },
    ],
  },
};

module.exports = config;