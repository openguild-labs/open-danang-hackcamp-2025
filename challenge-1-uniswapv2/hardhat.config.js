require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ignition");

require("hardhat-resolc");
require("hardhat-revive-node");
require("./tasks/compile-revive");
require("./tasks/deploy-revive");
require("./tasks/deploy");
require("dotenv").config();
console.log(process.env.LOCAL_PRIV_KEY);
console.log(process.env.AH_PRIV_KEY);
// require("hardhat-revive-node");
/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: "0.8.19",
  resolc: {
    compilerSource: "npm",
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
  networks: {
    hardhat: {
      polkavm: true,
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
    },

    paseoAssetHub: {
      polkavm: true,
      url: "https://testnet-passet-hub-eth-rpc.polkadot.io/",
      accounts: [process.env.AH_PRIV_KEY],
    },
  },
  etherscan: {
    apiKey: {
      paseoAssetHub: "empty",
    },
    customChains: [
      {
        network: "paseoAssetHub",
        chainId: 420420421,
        urls: {
          apiURL: "https://blockscout-passet-hub.parity-testnet.parity.io/api",
          browserURL: "https://blockscout-passet-hub.parity-testnet.parity.io",
        },
      },
    ],
  },
};

module.exports = config;
