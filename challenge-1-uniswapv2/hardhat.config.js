require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ignition");

require("hardhat-resolc");
require("hardhat-revive-node");

require("dotenv").config();
console.log(process.env.LOCAL_PRIV_KEY);
console.log(process.env.AH_PRIV_KEY);
// require("hardhat-revive-node");
/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: "0.8.19",
  resolc: {
        compilerSource: 'npm',
  },
  networks: {
    hardhat: {
      blockGasLimit: 30000000, // Increase gas limit,
      polkavm: true,
      nodeConfig: {
        nodeBinaryPath: './binaries/substrate-node',
        rpcPort: 8000,
        dev: true,
      },
      adapterConfig: {
        adapterBinaryPath: './binaries/eth-rpc',
        dev: true,
      },
    },
    polkavm: {
      polkavm: true,   
      url: 'http://127.0.0.1:8545',
      accounts: [process.env.AH_PRIV_KEY],
    },

    paseoAssetHub: { 
      polkavm: true,
      url: "https://testnet-passet-hub-eth-rpc.polkadot.io/",
      accounts: [process.env.AH_PRIV_KEY],
    },
  },
};


module.exports = config;
