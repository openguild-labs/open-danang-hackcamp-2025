const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing single contract deployment...");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📍 Account:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "PAS");
  
  if (balance < ethers.parseEther("0.1")) {
    throw new Error("Insufficient balance");
  }
  
  console.log("\n🚀 Deploying simple WETH contract...");
  
  try {
    // Get contract factory
    const WETH = await ethers.getContractFactory("WETH");
    
    // Deploy with default settings (let network decide gas)
    console.log("⏳ Sending deployment transaction...");
    const weth = await WETH.deploy();
    
    console.log("📝 Transaction hash:", weth.deploymentTransaction().hash);
    console.log("⏰ Waiting for confirmation...");
    
    await weth.waitForDeployment();
    const address = await weth.getAddress();
    
    console.log("✅ WETH deployed successfully to:", address);
    
    // Test a simple call
    console.log("🧪 Testing contract call...");
    const name = await weth.name();
    console.log("📛 Contract name:", name);
    
    return address;
    
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    
    if (error.message.includes("temporarily banned")) {
      console.log("\n💡 Suggestions:");
      console.log("   1. Wait 10-30 minutes for rate limit reset");
      console.log("   2. Try during off-peak hours (early morning/late night)");
      console.log("   3. Contact Polkadot support if issue persists");
    }
    
    throw error;
  }
}

main()
  .then((address) => {
    console.log("\n🎉 Single contract deployment successful!");
    console.log("📍 Contract address:", address);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Test deployment failed");
    process.exit(1);
  }); 