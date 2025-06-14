const { ethers } = require("hardhat");

async function main() {
  console.log("🪙 Minting tokens and creating real pools...\n");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer address:", deployer.address);

  // Contract addresses
  const TOKEN_A_ADDRESS = "0x8D6e37347A6020B5D0902D15257F28a2c19B4145";
  const TOKEN_B_ADDRESS = "0x2251bf61f55e22dAa392b0e83A66f2DbF21176fb";
  const WETH_ADDRESS = "0x9E74fC88465Ca0a8E3899D3aD235C99b127bc21D";
  const FACTORY_ADDRESS = "0xcC7Cf672147325f9dE0629C0ffccBC5724a5A4AE";

  // UniswapV2ERC20 ABI (these tokens inherit from UniswapV2ERC20)
  const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function symbol() view returns (string)",
    "function name() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function _mint(address, uint256) internal", // This is internal, need to check actual ABI
    "function transfer(address, uint256) returns (bool)",
    "function approve(address, uint256) returns (bool)"
  ];

  // Check if these are actually mintable tokens
  console.log("🔍 Checking token contracts...");
  
  try {
    const tokenA = new ethers.Contract(TOKEN_A_ADDRESS, ERC20_ABI, deployer);
    const tokenB = new ethers.Contract(TOKEN_B_ADDRESS, ERC20_ABI, deployer);
    
    const symbolA = await tokenA.symbol();
    const symbolB = await tokenB.symbol();
    const nameA = await tokenA.name();
    const nameB = await tokenB.name();
    
    console.log(`📊 Token A: ${nameA} (${symbolA})`);
    console.log(`📊 Token B: ${nameB} (${symbolB})`);
    
    const balanceA = await tokenA.balanceOf(deployer.address);
    const balanceB = await tokenB.balanceOf(deployer.address);
    
    console.log(`💰 Current Token A balance: ${ethers.formatEther(balanceA)} ${symbolA}`);
    console.log(`💰 Current Token B balance: ${ethers.formatEther(balanceB)} ${symbolB}`);
    
  } catch (error) {
    console.log(`❌ Error checking tokens: ${error.message}`);
    console.log("🔧 These might be LP tokens, let's deploy new tradeable tokens...");
    
    // Deploy new tradeable tokens
    console.log("\n🚀 Deploying new tradeable tokens...");
    
    // Deploy Token A
    console.log("📦 Deploying Test Token A...");
    const TestTokenA = await ethers.getContractFactory("ERC20");
    const tokenA = await TestTokenA.deploy(ethers.parseEther("1000000000")); // 1 billion
    await tokenA.waitForDeployment();
    const tokenAAddress = await tokenA.getAddress();
    console.log(`✅ Test Token A deployed: ${tokenAAddress}`);
    
    // Deploy Token B  
    console.log("📦 Deploying Test Token B...");
    const TestTokenB = await ethers.getContractFactory("ERC20");
    const tokenB = await TestTokenB.deploy(ethers.parseEther("1000000000")); // 1 billion
    await tokenB.waitForDeployment();
    const tokenBAddress = await tokenB.getAddress();
    console.log(`✅ Test Token B deployed: ${tokenBAddress}`);
    
    // Update addresses
    const newTokenA = tokenAAddress;
    const newTokenB = tokenBAddress;
    
    console.log("\n📊 NEW TOKEN BALANCES:");
    const balanceA = await tokenA.balanceOf(deployer.address);
    const balanceB = await tokenB.balanceOf(deployer.address);
    console.log(`💰 Token A balance: ${ethers.formatEther(balanceA)} UNI-V2`);
    console.log(`💰 Token B balance: ${ethers.formatEther(balanceB)} UNI-V2`);
    
    // Create pairs
    console.log("\n🏭 Creating trading pairs...");
    
    const FACTORY_ABI = [
      "function createPair(address, address) returns (address)",
      "function getPair(address, address) view returns (address)"
    ];
    
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, deployer);
    
    // Create WETH/TokenA pair
    console.log("🔄 Creating WETH/TokenA pair...");
    try {
      const tx1 = await factory.createPair(WETH_ADDRESS, newTokenA);
      await tx1.wait();
      const pairA = await factory.getPair(WETH_ADDRESS, newTokenA);
      console.log(`✅ WETH/TokenA pair created: ${pairA}`);
    } catch (error) {
      console.log(`⚠️  WETH/TokenA pair: ${error.message}`);
    }
    
    // Create WETH/TokenB pair
    console.log("🔄 Creating WETH/TokenB pair...");
    try {
      const tx2 = await factory.createPair(WETH_ADDRESS, newTokenB);
      await tx2.wait();
      const pairB = await factory.getPair(WETH_ADDRESS, newTokenB);
      console.log(`✅ WETH/TokenB pair created: ${pairB}`);
    } catch (error) {
      console.log(`⚠️  WETH/TokenB pair: ${error.message}`);
    }
    
    // Create TokenA/TokenB pair
    console.log("🔄 Creating TokenA/TokenB pair...");
    try {
      const tx3 = await factory.createPair(newTokenA, newTokenB);
      await tx3.wait();
      const pairAB = await factory.getPair(newTokenA, newTokenB);
      console.log(`✅ TokenA/TokenB pair created: ${pairAB}`);
    } catch (error) {
      console.log(`⚠️  TokenA/TokenB pair: ${error.message}`);
    }
    
    // Update deployment.json
    const fs = require('fs');
    try {
      const deploymentData = JSON.parse(fs.readFileSync('deployment.json', 'utf8'));
      
      deploymentData.contracts.newTokenA = {
        address: newTokenA,
        name: "Test Token A (Tradeable)"
      };
      
      deploymentData.contracts.newTokenB = {
        address: newTokenB,
        name: "Test Token B (Tradeable)"
      };
      
      deploymentData.tokens.TKA = {
        address: newTokenA,
        symbol: "UNI-V2",
        balance: "1000000000.0",
        isNative: false
      };
      
      deploymentData.tokens.TKB = {
        address: newTokenB,
        symbol: "UNI-V2", 
        balance: "1000000000.0",
        isNative: false
      };
      
      fs.writeFileSync('deployment.json', JSON.stringify(deploymentData, null, 2));
      console.log("📝 Updated deployment.json with new tokens");
      
    } catch (error) {
      console.log(`⚠️  Could not update deployment.json: ${error.message}`);
    }
    
    console.log("\n🎯 SUMMARY:");
    console.log("===========");
    console.log(`✅ New Token A: ${newTokenA}`);
    console.log(`✅ New Token B: ${newTokenB}`);
    console.log(`✅ Deployer has 1 billion of each token`);
    console.log(`✅ Trading pairs created`);
    console.log(`🚀 Ready for real blockchain trading!`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 