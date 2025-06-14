const hre = require("hardhat");
require('dotenv').config();

async function main() {
  console.log("🚀 Deploying AIINSIGHT Token to Paseo Asset Hub...");
  
  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "PAS");
  
  if (balance < hre.ethers.parseEther("1")) {
    console.log("❌ Insufficient balance for deployment");
    return;
  }

  try {
    // Deploy AIINSIGHT Token
    console.log("\n📦 Deploying AIINSIGHT Token...");
    const AIInsightToken = await hre.ethers.getContractFactory("AIInsightToken");
    
    const aiinsightToken = await AIInsightToken.deploy({
      gasLimit: 2000000
    });
    
    await aiinsightToken.waitForDeployment();
    const aiinsightAddress = await aiinsightToken.getAddress();
    
    console.log("✅ AIINSIGHT Token deployed to:", aiinsightAddress);
    
    // Verify deployment
    const name = await aiinsightToken.name();
    const symbol = await aiinsightToken.symbol();
    const totalSupply = await aiinsightToken.totalSupply();
    const deployerBalance = await aiinsightToken.balanceOf(deployer.address);
    
    console.log("\n📊 Token Details:");
    console.log("   Name:", name);
    console.log("   Symbol:", symbol);
    console.log("   Total Supply:", hre.ethers.formatEther(totalSupply));
    console.log("   Deployer Balance:", hre.ethers.formatEther(deployerBalance));
    
    // Update deployment.json
    const fs = require('fs');
    const deploymentPath = './deployment.json';
    
    let deployment = {};
    if (fs.existsSync(deploymentPath)) {
      deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    }
    
    deployment.contracts = deployment.contracts || {};
    deployment.contracts.aiinsight = {
      address: aiinsightAddress,
      name: "AI Insight Token"
    };
    deployment.timestamp = new Date().toISOString();
    
    fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
    console.log("\n✅ Deployment info updated in deployment.json");
    
    console.log("\n🎉 AIINSIGHT Token deployment completed successfully!");
    console.log("📝 Contract Address:", aiinsightAddress);
    console.log("🔗 Explorer:", `https://blockscout-passet-hub.parity-testnet.parity.io/address/${aiinsightAddress}`);
    
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 