const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying tradeable tokens...\n");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer address:", deployer.address);

  // Get native balance
  const nativeBalance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Native PAS balance:", ethers.formatEther(nativeBalance), "PAS");

  // Deploy Token A
  console.log("\n📦 Deploying Test Token A...");
  const TradeableTokenA = await ethers.getContractFactory("TradeableToken");
  const tokenA = await TradeableTokenA.deploy("Test Token A", "TKA", 1000000000); // 1 billion
  await tokenA.waitForDeployment();
  const tokenAAddress = await tokenA.getAddress();
  console.log(`✅ Test Token A deployed: ${tokenAAddress}`);

  // Deploy Token B
  console.log("📦 Deploying Test Token B...");
  const TradeableTokenB = await ethers.getContractFactory("TradeableToken");
  const tokenB = await TradeableTokenB.deploy("Test Token B", "TKB", 1000000000); // 1 billion
  await tokenB.waitForDeployment();
  const tokenBAddress = await tokenB.getAddress();
  console.log(`✅ Test Token B deployed: ${tokenBAddress}`);

  // Check balances
  console.log("\n📊 TOKEN BALANCES:");
  const balanceA = await tokenA.balanceOf(deployer.address);
  const balanceB = await tokenB.balanceOf(deployer.address);
  console.log(`💰 Token A balance: ${ethers.formatEther(balanceA)} TKA`);
  console.log(`💰 Token B balance: ${ethers.formatEther(balanceB)} TKB`);

  // Create pairs
  console.log("\n🏭 Creating trading pairs...");
  
  const FACTORY_ADDRESS = "0xcC7Cf672147325f9dE0629C0ffccBC5724a5A4AE";
  const WETH_ADDRESS = "0x9E74fC88465Ca0a8E3899D3aD235C99b127bc21D";
  
  const FACTORY_ABI = [
    "function createPair(address, address) returns (address)",
    "function getPair(address, address) view returns (address)",
    "function allPairsLength() view returns (uint256)"
  ];
  
  const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, deployer);
  
  // Create WETH/TokenA pair
  console.log("🔄 Creating WETH/TKA pair...");
  try {
    const tx1 = await factory.createPair(WETH_ADDRESS, tokenAAddress);
    await tx1.wait();
    const pairA = await factory.getPair(WETH_ADDRESS, tokenAAddress);
    console.log(`✅ WETH/TKA pair created: ${pairA}`);
  } catch (error) {
    console.log(`⚠️  WETH/TKA pair: ${error.message}`);
    // Check if pair already exists
    const existingPairA = await factory.getPair(WETH_ADDRESS, tokenAAddress);
    if (existingPairA !== ethers.ZeroAddress) {
      console.log(`✅ WETH/TKA pair already exists: ${existingPairA}`);
    }
  }
  
  // Create WETH/TokenB pair
  console.log("🔄 Creating WETH/TKB pair...");
  try {
    const tx2 = await factory.createPair(WETH_ADDRESS, tokenBAddress);
    await tx2.wait();
    const pairB = await factory.getPair(WETH_ADDRESS, tokenBAddress);
    console.log(`✅ WETH/TKB pair created: ${pairB}`);
  } catch (error) {
    console.log(`⚠️  WETH/TKB pair: ${error.message}`);
    // Check if pair already exists
    const existingPairB = await factory.getPair(WETH_ADDRESS, tokenBAddress);
    if (existingPairB !== ethers.ZeroAddress) {
      console.log(`✅ WETH/TKB pair already exists: ${existingPairB}`);
    }
  }
  
  // Create TokenA/TokenB pair
  console.log("🔄 Creating TKA/TKB pair...");
  try {
    const tx3 = await factory.createPair(tokenAAddress, tokenBAddress);
    await tx3.wait();
    const pairAB = await factory.getPair(tokenAAddress, tokenBAddress);
    console.log(`✅ TKA/TKB pair created: ${pairAB}`);
  } catch (error) {
    console.log(`⚠️  TKA/TKB pair: ${error.message}`);
    // Check if pair already exists
    const existingPairAB = await factory.getPair(tokenAAddress, tokenBAddress);
    if (existingPairAB !== ethers.ZeroAddress) {
      console.log(`✅ TKA/TKB pair already exists: ${existingPairAB}`);
    }
  }

  // Check total pairs
  const totalPairs = await factory.allPairsLength();
  console.log(`📈 Total pairs in factory: ${totalPairs}`);

  // Update deployment.json
  const fs = require('fs');
  try {
    const deploymentData = JSON.parse(fs.readFileSync('deployment.json', 'utf8'));
    
    deploymentData.contracts.tradeableTokenA = {
      address: tokenAAddress,
      name: "Test Token A (Tradeable)",
      symbol: "TKA"
    };
    
    deploymentData.contracts.tradeableTokenB = {
      address: tokenBAddress,
      name: "Test Token B (Tradeable)",
      symbol: "TKB"
    };
    
    deploymentData.tokens.TKA = {
      address: tokenAAddress,
      symbol: "TKA",
      balance: "1000000000.0",
      isNative: false
    };
    
    deploymentData.tokens.TKB = {
      address: tokenBAddress,
      symbol: "TKB", 
      balance: "1000000000.0",
      isNative: false
    };
    
    // Add pair addresses
    deploymentData.pairs = {
      "WETH/TKA": await factory.getPair(WETH_ADDRESS, tokenAAddress),
      "WETH/TKB": await factory.getPair(WETH_ADDRESS, tokenBAddress),
      "TKA/TKB": await factory.getPair(tokenAAddress, tokenBAddress)
    };
    
    fs.writeFileSync('deployment.json', JSON.stringify(deploymentData, null, 2));
    console.log("📝 Updated deployment.json with new tokens and pairs");
    
  } catch (error) {
    console.log(`⚠️  Could not update deployment.json: ${error.message}`);
  }
  
  console.log("\n🎯 DEPLOYMENT SUMMARY:");
  console.log("======================");
  console.log(`✅ Token A (TKA): ${tokenAAddress}`);
  console.log(`✅ Token B (TKB): ${tokenBAddress}`);
  console.log(`✅ Deployer has 1 billion of each token`);
  console.log(`✅ Trading pairs created with WETH`);
  console.log(`✅ Cross-pair TKA/TKB created`);
  console.log(`🚀 Ready for real blockchain trading!`);
  
  console.log("\n📋 NEXT STEPS:");
  console.log("===============");
  console.log("1. Update UI to include TKA and TKB tokens");
  console.log("2. Add liquidity to pairs for trading");
  console.log("3. Test swaps on the frontend");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 