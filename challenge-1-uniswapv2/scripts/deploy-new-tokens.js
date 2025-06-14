const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying new SimpleTokens...");

  // Deploy Token A
  const SimpleToken = await ethers.getContractFactory("SimpleToken");
  const tokenA = await SimpleToken.deploy("Test Token A", "TKA");
  await tokenA.waitForDeployment();
  const tokenAAddress = await tokenA.getAddress();
  console.log("Test Token A deployed to:", tokenAAddress);

  // Deploy Token B
  const tokenB = await SimpleToken.deploy("Test Token B", "TKB");
  await tokenB.waitForDeployment();
  const tokenBAddress = await tokenB.getAddress();
  console.log("Test Token B deployed to:", tokenBAddress);

  // Check balances
  const [deployer] = await ethers.getSigners();
  const balanceA = await tokenA.balanceOf(deployer.address);
  const balanceB = await tokenB.balanceOf(deployer.address);
  
  console.log("\n📊 TOKEN BALANCES:");
  console.log("==================");
  console.log(`TKA Balance: ${ethers.formatEther(balanceA)} TKA`);
  console.log(`TKB Balance: ${ethers.formatEther(balanceB)} TKB`);
  
  console.log("\n✅ New tokens deployment completed!");
  console.log("📝 Update your frontend with these addresses:");
  console.log(`TOKEN_A: '${tokenAAddress}',`);
  console.log(`TOKEN_B: '${tokenBAddress}',`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 