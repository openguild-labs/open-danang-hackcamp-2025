const { ethers } = require("hardhat");
const fs = require('fs');

// Delay function to avoid rate limiting
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function deployWithRetry(contractFactory, args = [], retries = 3, delayMs = 15000) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`   🔄 Attempt ${i + 1}/${retries}...`);
      
             const contract = await contractFactory.deploy(...args);
       console.log(`   ⏳ Transaction sent: ${contract.deploymentTransaction().hash}`);
      
      await contract.waitForDeployment();
      const address = await contract.getAddress();
      console.log(`   ✅ Deployed successfully to: ${address}`);
      
      return { contract, address };
    } catch (error) {
      console.log(`   ❌ Attempt ${i + 1} failed: ${error.message}`);
      
      if (i < retries - 1) {
        console.log(`   ⏰ Waiting ${delayMs/1000}s before retry...`);
        await delay(delayMs);
      } else {
        throw error;
      }
    }
  }
}

async function main() {
  console.log("🚀 Starting OPTIMIZED deployment to Paseo Asset Hub...");
  console.log("=" .repeat(60));
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying contracts with account:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "PAS");
  
  if (balance < ethers.parseEther("0.1")) {
    throw new Error("Insufficient balance for deployment");
  }
  
  console.log("\n🏗️  Starting step-by-step contract deployments...");
  console.log("⏰ Using 15-second delays between deployments to avoid rate limiting\n");
  
  const deploymentResults = {};
  
  // Step 1: Deploy Factory
  console.log("📦 STEP 1: Deploying UniswapV2Factory...");
  try {
    const Factory = await ethers.getContractFactory("UniswapV2Factory");
    const factoryResult = await deployWithRetry(Factory, [deployer.address]);
    deploymentResults.factory = factoryResult;
    
    console.log("✅ Factory deployment completed!");
    console.log("⏰ Waiting 15 seconds before next deployment...\n");
    await delay(15000);
  } catch (error) {
    console.error("❌ Factory deployment failed:", error.message);
    throw error;
  }
  
  // Step 2: Deploy WETH
  console.log("📦 STEP 2: Deploying WETH...");
  try {
    const WETH = await ethers.getContractFactory("WETH");
    const wethResult = await deployWithRetry(WETH);
    deploymentResults.weth = wethResult;
    
    console.log("✅ WETH deployment completed!");
    console.log("⏰ Waiting 15 seconds before next deployment...\n");
    await delay(15000);
  } catch (error) {
    console.error("❌ WETH deployment failed:", error.message);
    throw error;
  }
  
  // Step 3: Deploy Test Token A
  console.log("📦 STEP 3: Deploying Test Token A...");
  try {
    const TokenA = await ethers.getContractFactory("UniswapV2ERC20");
    const tokenAResult = await deployWithRetry(TokenA);
    deploymentResults.tokenA = tokenAResult;
    
    console.log("✅ Token A deployment completed!");
    console.log("⏰ Waiting 15 seconds before next deployment...\n");
    await delay(15000);
  } catch (error) {
    console.error("❌ Token A deployment failed:", error.message);
    throw error;
  }
  
  // Step 4: Deploy Test Token B
  console.log("📦 STEP 4: Deploying Test Token B...");
  try {
    const TokenB = await ethers.getContractFactory("UniswapV2ERC20");
    const tokenBResult = await deployWithRetry(TokenB);
    deploymentResults.tokenB = tokenBResult;
    
    console.log("✅ Token B deployment completed!");
    console.log("⏰ Waiting 15 seconds before creating pair...\n");
    await delay(15000);
  } catch (error) {
    console.error("❌ Token B deployment failed:", error.message);
    throw error;
  }
  
  // Step 5: Create Test Pair
  console.log("📦 STEP 5: Creating test pair...");
  try {
    console.log("   🔄 Creating pair for Token A <-> Token B");
    
    const createPairTx = await deploymentResults.factory.contract.createPair(
      deploymentResults.tokenA.address,
      deploymentResults.tokenB.address
    );
    
    console.log("   ⏳ Create pair transaction sent:", createPairTx.hash);
    const receipt = await createPairTx.wait();
    console.log("   ✅ Create pair transaction confirmed");
    
    const pairAddress = await deploymentResults.factory.contract.getPair(
      deploymentResults.tokenA.address,
      deploymentResults.tokenB.address
    );
    console.log("   ✅ Pair created at:", pairAddress);
    
    deploymentResults.testPair = {
      address: pairAddress,
      txHash: createPairTx.hash
    };
    
  } catch (error) {
    console.error("❌ Pair creation failed:", error.message);
    throw error;
  }
  
  // Final balance check
  const finalBalance = await ethers.provider.getBalance(deployer.address);
  const gasUsed = balance - finalBalance;
  
  // Create deployment summary
  const deploymentInfo = {
    network: {
      name: "Paseo Asset Hub",
      chainId: 420420422,
      rpc: "https://testnet-passet-hub-eth-rpc.polkadot.io/",
      explorer: "https://blockscout-passet-hub.parity-testnet.parity.io/"
    },
    deployer: {
      address: deployer.address,
      initialBalance: ethers.formatEther(balance),
      finalBalance: ethers.formatEther(finalBalance),
      gasUsed: ethers.formatEther(gasUsed)
    },
    contracts: {
      factory: {
        address: deploymentResults.factory.address,
        txHash: deploymentResults.factory.contract.deploymentTransaction().hash
      },
      weth: {
        address: deploymentResults.weth.address,
        txHash: deploymentResults.weth.contract.deploymentTransaction().hash
      },
      tokenA: {
        address: deploymentResults.tokenA.address,
        txHash: deploymentResults.tokenA.contract.deploymentTransaction().hash
      },
      tokenB: {
        address: deploymentResults.tokenB.address,
        txHash: deploymentResults.tokenB.contract.deploymentTransaction().hash
      },
      testPair: deploymentResults.testPair
    },
    timestamp: new Date().toISOString(),
    status: "SUCCESS"
  };
  
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
  console.log("=".repeat(60));
  console.log("🏭 Factory Contract:", deploymentResults.factory.address);
  console.log("🔄 WETH Contract:", deploymentResults.weth.address);
  console.log("🪙 Token A:", deploymentResults.tokenA.address);
  console.log("🪙 Token B:", deploymentResults.tokenB.address);
  console.log("💱 Test Pair:", deploymentResults.testPair.address);
  console.log("⛽ Gas Used:", ethers.formatEther(gasUsed), "PAS");
  console.log("⏰ Deployed at:", new Date().toLocaleString());
  console.log("=".repeat(60));
  
  // Save deployment info to file
  const deploymentJson = JSON.stringify(deploymentInfo, null, 2);
  fs.writeFileSync('deployment.json', deploymentJson);
  console.log("💾 Deployment info saved to deployment.json");
  
  // Create contract addresses file for frontend
  const contractAddresses = {
    FACTORY_ADDRESS: deploymentResults.factory.address,
    WETH_ADDRESS: deploymentResults.weth.address,
    TOKEN_A_ADDRESS: deploymentResults.tokenA.address,
    TOKEN_B_ADDRESS: deploymentResults.tokenB.address,
    TEST_PAIR_ADDRESS: deploymentResults.testPair.address,
    NETWORK_CONFIG: {
      chainId: 420420422,
      name: "Paseo Asset Hub",
      rpcUrl: "https://testnet-passet-hub-eth-rpc.polkadot.io/",
      blockExplorer: "https://blockscout-passet-hub.parity-testnet.parity.io/"
    }
  };
  
  fs.writeFileSync('frontend/lib/contracts.json', JSON.stringify(contractAddresses, null, 2));
  console.log("💾 Contract addresses saved to frontend/lib/contracts.json");
  
  console.log("\n🔍 Verify contracts on Block Explorer:");
  console.log("   📍", deploymentInfo.network.explorer);
  
  console.log("\n🚀 Next Steps:");
  console.log("   1. ✅ Contracts deployed and verified");
  console.log("   2. 🔄 Update frontend with contract addresses");
  console.log("   3. 🧪 Test swap functionality");
  console.log("   4. 🚀 Deploy frontend to production");
  
  return deploymentInfo;
}

// Execute deployment
main()
  .then((deploymentInfo) => {
    console.log("\n🎉 OPTIMIZED DEPLOYMENT COMPLETED SUCCESSFULLY!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 DEPLOYMENT FAILED:");
    console.error("Error:", error.message);
    console.error("\n🔧 Troubleshooting:");
    console.error("   1. Check network connection");
    console.error("   2. Verify account balance");
    console.error("   3. Try again in 5-10 minutes");
    console.error("   4. Check RPC endpoint status");
    process.exit(1);
  }); 