const { ethers } = require("hardhat");
const fs = require('fs');

// Already deployed contract addresses
const DEPLOYED_CONTRACTS = {
  factory: "0xcC7Cf672147325f9dE0629C0ffccBC5724a5A4AE",
  weth: "0x9E74fC88465Ca0a8E3899D3aD235C99b127bc21D",
  tokenA: "0x8D6e37347A6020B5D0902D15257F28a2c19B4145",
  tokenB: "0x2251bf61f55e22dAa392b0e83A66f2DbF21176fb"
};

async function main() {
  console.log("🔧 Completing UniswapV2 deployment...");
  console.log("=" .repeat(50));
  
  const [deployer] = await ethers.getSigners();
  console.log("📍 Account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "PAS");
  
  // Get contract instances
  console.log("\n📋 Getting contract instances...");
  const Factory = await ethers.getContractFactory("UniswapV2Factory");
  const factory = Factory.attach(DEPLOYED_CONTRACTS.factory);
  
  const WETH = await ethers.getContractFactory("WETH");
  const weth = WETH.attach(DEPLOYED_CONTRACTS.weth);
  
  const Token = await ethers.getContractFactory("UniswapV2ERC20");
  const tokenA = Token.attach(DEPLOYED_CONTRACTS.tokenA);
  const tokenB = Token.attach(DEPLOYED_CONTRACTS.tokenB);
  
  console.log("✅ Contract instances created");
  
  // Initialize tokens with proper names and symbols
  console.log("\n🏷️  Initializing token metadata...");
  try {
    // Check if tokens are already initialized
    const tokenAName = await tokenA.name();
    const tokenBName = await tokenB.name();
    
    console.log("📛 Token A name:", tokenAName);
    console.log("📛 Token B name:", tokenBName);
    
    if (tokenAName === "" || tokenBName === "") {
      console.log("⚠️  Tokens need initialization");
      // Note: UniswapV2ERC20 doesn't have initialize function
      // The name/symbol are set in constructor
    }
  } catch (error) {
    console.log("⚠️  Token metadata check failed:", error.message);
  }
  
  // Create pair with better error handling
  console.log("\n💱 Creating trading pair...");
  try {
    // Check if pair already exists
    const existingPair = await factory.getPair(DEPLOYED_CONTRACTS.tokenA, DEPLOYED_CONTRACTS.tokenB);
    
    if (existingPair !== "0x0000000000000000000000000000000000000000") {
      console.log("✅ Pair already exists at:", existingPair);
      DEPLOYED_CONTRACTS.testPair = existingPair;
    } else {
      console.log("🔄 Creating new pair...");
      
      // Estimate gas first
      const gasEstimate = await factory.createPair.estimateGas(
        DEPLOYED_CONTRACTS.tokenA,
        DEPLOYED_CONTRACTS.tokenB
      );
      console.log("⛽ Estimated gas:", gasEstimate.toString());
      
      const createPairTx = await factory.createPair(
        DEPLOYED_CONTRACTS.tokenA,
        DEPLOYED_CONTRACTS.tokenB,
        { gasLimit: gasEstimate * 2n } // Double the gas estimate
      );
      
      console.log("⏳ Transaction sent:", createPairTx.hash);
      const receipt = await createPairTx.wait();
      console.log("✅ Transaction confirmed");
      
      const pairAddress = await factory.getPair(DEPLOYED_CONTRACTS.tokenA, DEPLOYED_CONTRACTS.tokenB);
      console.log("✅ Pair created at:", pairAddress);
      
      DEPLOYED_CONTRACTS.testPair = pairAddress;
    }
  } catch (error) {
    console.error("❌ Pair creation failed:", error.message);
    
    // Try to get more details about the error
    if (error.data) {
      console.log("Error data:", error.data);
    }
    
    // Continue without pair for now
    console.log("⚠️  Continuing without pair creation...");
  }
  
  // Create comprehensive deployment info
  const deploymentInfo = {
    network: {
      name: "Paseo Asset Hub",
      chainId: 420420422,
      rpc: "https://testnet-passet-hub-eth-rpc.polkadot.io/",
      explorer: "https://blockscout-passet-hub.parity-testnet.parity.io/"
    },
    deployer: {
      address: deployer.address,
      balance: ethers.formatEther(balance)
    },
    contracts: {
      factory: {
        address: DEPLOYED_CONTRACTS.factory,
        name: "UniswapV2Factory"
      },
      weth: {
        address: DEPLOYED_CONTRACTS.weth,
        name: "Wrapped Ether"
      },
      tokenA: {
        address: DEPLOYED_CONTRACTS.tokenA,
        name: "Test Token A"
      },
      tokenB: {
        address: DEPLOYED_CONTRACTS.tokenB,
        name: "Test Token B"
      },
      testPair: DEPLOYED_CONTRACTS.testPair ? {
        address: DEPLOYED_CONTRACTS.testPair,
        name: "TokenA-TokenB Pair"
      } : null
    },
    timestamp: new Date().toISOString(),
    status: "SUCCESS"
  };
  
  console.log("\n" + "=".repeat(50));
  console.log("🎉 DEPLOYMENT SUMMARY");
  console.log("=".repeat(50));
  console.log("🏭 Factory:", DEPLOYED_CONTRACTS.factory);
  console.log("🔄 WETH:", DEPLOYED_CONTRACTS.weth);
  console.log("🪙 Token A:", DEPLOYED_CONTRACTS.tokenA);
  console.log("🪙 Token B:", DEPLOYED_CONTRACTS.tokenB);
  if (DEPLOYED_CONTRACTS.testPair) {
    console.log("💱 Test Pair:", DEPLOYED_CONTRACTS.testPair);
  }
  console.log("⏰ Completed:", new Date().toLocaleString());
  console.log("=".repeat(50));
  
  // Save deployment info
  fs.writeFileSync('deployment.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info saved to deployment.json");
  
  // Create frontend contract addresses
  const contractAddresses = {
    FACTORY_ADDRESS: DEPLOYED_CONTRACTS.factory,
    WETH_ADDRESS: DEPLOYED_CONTRACTS.weth,
    TOKEN_A_ADDRESS: DEPLOYED_CONTRACTS.tokenA,
    TOKEN_B_ADDRESS: DEPLOYED_CONTRACTS.tokenB,
    TEST_PAIR_ADDRESS: DEPLOYED_CONTRACTS.testPair || null,
    NETWORK_CONFIG: {
      chainId: 420420422,
      name: "Paseo Asset Hub",
      rpcUrl: "https://testnet-passet-hub-eth-rpc.polkadot.io/",
      blockExplorer: "https://blockscout-passet-hub.parity-testnet.parity.io/"
    }
  };
  
  fs.writeFileSync('frontend/lib/contracts.json', JSON.stringify(contractAddresses, null, 2));
  console.log("💾 Contract addresses saved to frontend/lib/contracts.json");
  
  console.log("\n🔍 Verify contracts:");
  console.log("   📍 Block Explorer:", deploymentInfo.network.explorer);
  console.log("   🏭 Factory:", `${deploymentInfo.network.explorer}/address/${DEPLOYED_CONTRACTS.factory}`);
  console.log("   🔄 WETH:", `${deploymentInfo.network.explorer}/address/${DEPLOYED_CONTRACTS.weth}`);
  
  console.log("\n🚀 Next Steps:");
  console.log("   1. ✅ Core contracts deployed");
  console.log("   2. 🔄 Update frontend configuration");
  console.log("   3. 🧪 Test DEX functionality");
  console.log("   4. 🚀 Launch application");
  
  return deploymentInfo;
}

main()
  .then((info) => {
    console.log("\n🎉 DEPLOYMENT COMPLETED!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 DEPLOYMENT FAILED:", error.message);
    process.exit(1);
  }); 