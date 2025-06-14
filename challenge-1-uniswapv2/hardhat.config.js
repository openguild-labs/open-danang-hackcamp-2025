require("@nomicfoundation/hardhat-toolbox");
// require("@nomicfoundation/hardhat-ignition");

// require("hardhat-resolc");
// require("hardhat-revive-node");

require("dotenv").config();
console.log("Local Private Key:", process.env.LOCAL_PRIV_KEY ? "✅ Configured" : "❌ Missing");
console.log("Asset Hub Private Key:", process.env.AH_PRIV_KEY ? "✅ Configured" : "❌ Missing");

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      chainId: 31337
    },
    paseo: { 
      url: "https://testnet-passet-hub-eth-rpc.polkadot.io/",
      chainId: 420420422,
      accounts: [process.env.AH_PRIV_KEY],
      timeout: 60000,
      gasPrice: "auto"
    },
  },
};

module.exports = config;
