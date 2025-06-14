const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking network connection...");
  
  try {
    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log("📍 Connected to network:", network.name);
    console.log("🔗 Chain ID:", network.chainId.toString());
    
    // Get latest block
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log("📦 Latest block:", blockNumber);
    
    // Get signer
    const [signer] = await ethers.getSigners();
    console.log("👤 Signer address:", signer.address);
    
    // Check balance
    const balance = await ethers.provider.getBalance(signer.address);
    console.log("💰 Balance:", ethers.formatEther(balance), "PAS");
    
    if (balance > 0n) {
      console.log("✅ Account has funds - ready for deployment!");
    } else {
      console.log("❌ Account has no funds - need to get tokens from faucet");
      console.log("🔗 Faucet: https://faucet.polkadot.io/?parachain=1111");
    }
    
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    
    if (error.message.includes("Invalid URL")) {
      console.log("💡 Check RPC URL in hardhat.config.js");
    } else if (error.message.includes("private key")) {
      console.log("💡 Check private key in .env file");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 