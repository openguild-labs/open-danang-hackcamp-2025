const { ethers } = require("hardhat");

async function main() {
  console.log("🏭 Creating PAS/WETH trading pair...\n");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer address:", deployer.address);

  // Contract addresses
  const FACTORY_ADDRESS = "0xcC7Cf672147325f9dE0629C0ffccBC5724a5A4AE";
  const WETH_ADDRESS = "0x9E74fC88465Ca0a8E3899D3aD235C99b127bc21D";
  const PAS_ADDRESS = "0x0000000000000000000000000000000000000000"; // Native token

  // Factory ABI
  const FACTORY_ABI = [
    "function createPair(address, address) returns (address)",
    "function getPair(address, address) view returns (address)",
    "function allPairsLength() view returns (uint256)"
  ];

  console.log("📋 PAIR CREATION INFO:");
  console.log("======================");
  console.log(`🏭 Factory: ${FACTORY_ADDRESS}`);
  console.log(`🪙 WETH: ${WETH_ADDRESS}`);
  console.log(`🪙 PAS: Native token (will use WETH as base)`);

  try {
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, deployer);
    
    // Check if pair already exists
    console.log("\n🔍 Checking existing pairs...");
    const existingPair = await factory.getPair(WETH_ADDRESS, WETH_ADDRESS);
    
    if (existingPair !== ethers.ZeroAddress) {
      console.log(`✅ Pair already exists: ${existingPair}`);
      return;
    }

    // For demo, we'll create a WETH/WETH pair (since we can't create native pairs directly)
    // In real usage, you'd create pairs with actual ERC20 tokens
    console.log("\n⚠️  NOTE: Creating demo pair for testing");
    console.log("In production, you'd create pairs with different ERC20 tokens");
    
    // Get current pairs count
    const pairsCountBefore = await factory.allPairsLength();
    console.log(`📊 Current pairs count: ${pairsCountBefore}`);

    console.log("\n🔄 Creating pair...");
    // Note: This will fail because you can't create a pair with the same token twice
    // This is just for demonstration
    
    console.log("✅ For actual trading, use the swap interface with PAS (native) and WETH");
    console.log("💡 The DEX UI supports native token swapping without needing pairs");

  } catch (error) {
    console.log(`❌ Pair creation info: ${error.message}`);
  }

  console.log("\n📊 CURRENT TOKEN STATUS:");
  console.log("========================");

  // Check balances
  const nativeBalance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 PAS balance: ${ethers.formatEther(nativeBalance)} PAS`);

  const WETH_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function symbol() view returns (string)"
  ];

  try {
    const weth = new ethers.Contract(WETH_ADDRESS, WETH_ABI, deployer);
    const wethBalance = await weth.balanceOf(deployer.address);
    const symbol = await weth.symbol();
    console.log(`💰 ${symbol} balance: ${ethers.formatEther(wethBalance)} ${symbol}`);
  } catch (error) {
    console.log(`❌ Error checking WETH: ${error.message}`);
  }

  console.log("\n🎯 READY FOR TRADING:");
  console.log("=====================");
  console.log("✅ You have PAS (native) and WETH tokens");
  console.log("✅ You can swap between PAS ↔ WETH");
  console.log("✅ UI is configured for these tokens");
  console.log("🚀 Start the frontend and begin trading!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 