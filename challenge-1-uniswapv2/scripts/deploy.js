const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🚀 Starting deployment to Paseo Asset Hub...");
  console.log("=" .repeat(50));
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying contracts with account:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "PAS");
  
  if (balance < ethers.parseEther("0.1")) {
    console.log("⚠️  Warning: Low balance, may not be sufficient for deployment");
  }
  
  console.log("\n🏗️  Starting contract deployments...");
  
  // Deploy Factory
  console.log("\n📦 Deploying UniswapV2Factory...");
  const Factory = await ethers.getContractFactory("UniswapV2Factory");
  console.log("   ⏳ Factory contract compilation complete");
  
  const factory = await Factory.deploy(deployer.address); // feeToSetter = deployer
  console.log("   ⏳ Factory deployment transaction sent:", factory.deployTransaction.hash);
  
  await factory.deployed();
  console.log("   ✅ Factory deployed to:", factory.address);
  
  // Deploy WETH
  console.log("\n📦 Deploying WETH...");
  const WETH = await ethers.getContractFactory("WETH");
  console.log("   ⏳ WETH contract compilation complete");
  
  const weth = await WETH.deploy();
  console.log("   ⏳ WETH deployment transaction sent:", weth.deployTransaction.hash);
  
  await weth.deployed();
  console.log("   ✅ WETH deployed to:", weth.address);
  
  // Create sample ERC20 tokens for testing
  console.log("\n📦 Deploying sample tokens for testing...");
  
  // Deploy Token A
  console.log("   📋 Deploying Token A...");
  const TokenA = await ethers.getContractFactory("UniswapV2ERC20");
  const tokenA = await TokenA.deploy();
  await tokenA.deployed();
  console.log("   ✅ Token A deployed to:", tokenA.address);
  
  // Deploy Token B
  console.log("   📋 Deploying Token B...");
  const TokenB = await ethers.getContractFactory("UniswapV2ERC20");
  const tokenB = await TokenB.deploy();
  await tokenB.deployed();
  console.log("   ✅ Token B deployed to:", tokenB.address);
  
  // Create a test pair
  console.log("\n🔗 Creating test pair...");
  console.log("   ⏳ Creating pair for Token A <-> Token B");
  
  const createPairTx = await factory.createPair(tokenA.address, tokenB.address);
  console.log("   ⏳ Create pair transaction sent:", createPairTx.hash);
  
  const receipt = await createPairTx.wait();
  console.log("   ✅ Create pair transaction confirmed");
  
  const pairAddress = await factory.getPair(tokenA.address, tokenB.address);
  console.log("   ✅ Pair created at:", pairAddress);
  
  // Verify all pairs count
  const allPairsLength = await factory.allPairsLength();
  console.log("   📊 Total pairs created:", allPairsLength.toString());
  
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
       balance: ethers.formatEther(balance)
     },
    contracts: {
      factory: {
        address: factory.address,
        txHash: factory.deployTransaction.hash
      },
      weth: {
        address: weth.address,
        txHash: weth.deployTransaction.hash
      },
      tokenA: {
        address: tokenA.address,
        txHash: tokenA.deployTransaction.hash
      },
      tokenB: {
        address: tokenB.address,
        txHash: tokenB.deployTransaction.hash
      },
      testPair: {
        address: pairAddress,
        txHash: createPairTx.hash,
        token0: tokenA.address,
        token1: tokenB.address
      }
    },
    timestamp: new Date().toISOString(),
    status: "SUCCESS"
  };
  
  console.log("\n" + "=".repeat(50));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(50));
  console.log("🏭 Factory Contract:", factory.address);
  console.log("🔄 WETH Contract:", weth.address);
  console.log("🪙 Token A:", tokenA.address);
  console.log("🪙 Token B:", tokenB.address);
  console.log("💱 Test Pair:", pairAddress);
  console.log("⏰ Deployed at:", new Date().toLocaleString());
  console.log("=".repeat(50));
  
  // Save deployment info to file
  const deploymentJson = JSON.stringify(deploymentInfo, null, 2);
  fs.writeFileSync('deployment.json', deploymentJson);
  console.log("💾 Deployment info saved to deployment.json");
  
  // Create contract addresses file for frontend
  const contractAddresses = {
    FACTORY_ADDRESS: factory.address,
    WETH_ADDRESS: weth.address,
    TOKEN_A_ADDRESS: tokenA.address,
    TOKEN_B_ADDRESS: tokenB.address,
    TEST_PAIR_ADDRESS: pairAddress,
    NETWORK_CONFIG: {
      chainId: 420420422,
      name: "Paseo Asset Hub",
      rpcUrl: "https://testnet-passet-hub-eth-rpc.polkadot.io/",
      blockExplorer: "https://blockscout-passet-hub.parity-testnet.parity.io/"
    }
  };
  
  fs.writeFileSync('frontend/lib/contracts.json', JSON.stringify(contractAddresses, null, 2));
  console.log("💾 Contract addresses saved to frontend/lib/contracts.json");
  
  console.log("\n🎉 Deployment completed successfully!");
  console.log("🔍 Verify contracts on Block Explorer:");
  console.log("   📍", deploymentInfo.network.explorer);
  
  console.log("\n🚀 Next Steps:");
  console.log("   1. Verify contracts on block explorer");
  console.log("   2. Test contract interactions");
  console.log("   3. Update frontend configuration");
  console.log("   4. Deploy frontend");
  
  return deploymentInfo;
}

// Execute deployment
main()
  .then((deploymentInfo) => {
    console.log("\n✅ Deployment script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  }); 