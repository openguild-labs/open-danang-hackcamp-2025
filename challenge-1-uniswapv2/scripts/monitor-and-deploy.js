const { ethers } = require("hardhat");
const fs = require('fs');

async function checkBalance() {
  const [signer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(signer.address);
  return balance;
}

async function deployContracts() {
  console.log("🚀 Starting deployment to Paseo Asset Hub...");
  console.log("=" .repeat(50));
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying contracts with account:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "PAS");
  
  console.log("\n🏗️  Starting contract deployments...");
  
  // Deploy Factory
  console.log("\n📦 Deploying UniswapV2Factory...");
  const Factory = await ethers.getContractFactory("UniswapV2Factory");
  console.log("   ⏳ Factory contract compilation complete");
  
  const factory = await Factory.deploy(deployer.address);
  console.log("   ⏳ Factory deployment transaction sent:", factory.deploymentTransaction().hash);
  
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("   ✅ Factory deployed to:", factoryAddress);
  
  // Deploy WETH
  console.log("\n📦 Deploying WETH...");
  const WETH = await ethers.getContractFactory("WETH");
  console.log("   ⏳ WETH contract compilation complete");
  
  const weth = await WETH.deploy();
  console.log("   ⏳ WETH deployment transaction sent:", weth.deploymentTransaction().hash);
  
  await weth.waitForDeployment();
  const wethAddress = await weth.getAddress();
  console.log("   ✅ WETH deployed to:", wethAddress);
  
  // Create sample ERC20 tokens for testing
  console.log("\n📦 Deploying sample tokens for testing...");
  
  // Deploy Token A
  console.log("   📋 Deploying Token A...");
  const TokenA = await ethers.getContractFactory("UniswapV2ERC20");
  const tokenA = await TokenA.deploy();
  await tokenA.waitForDeployment();
  const tokenAAddress = await tokenA.getAddress();
  console.log("   ✅ Token A deployed to:", tokenAAddress);
  
  // Deploy Token B
  console.log("   📋 Deploying Token B...");
  const TokenB = await ethers.getContractFactory("UniswapV2ERC20");
  const tokenB = await TokenB.deploy();
  await tokenB.waitForDeployment();
  const tokenBAddress = await tokenB.getAddress();
  console.log("   ✅ Token B deployed to:", tokenBAddress);
  
  // Create a test pair
  console.log("\n🔗 Creating test pair...");
  console.log("   ⏳ Creating pair for Token A <-> Token B");
  
  const createPairTx = await factory.createPair(tokenAAddress, tokenBAddress);
  console.log("   ⏳ Create pair transaction sent:", createPairTx.hash);
  
  const receipt = await createPairTx.wait();
  console.log("   ✅ Create pair transaction confirmed");
  
  const pairAddress = await factory.getPair(tokenAAddress, tokenBAddress);
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
        address: factoryAddress,
        txHash: factory.deploymentTransaction().hash
      },
      weth: {
        address: wethAddress,
        txHash: weth.deploymentTransaction().hash
      },
      tokenA: {
        address: tokenAAddress,
        txHash: tokenA.deploymentTransaction().hash
      },
      tokenB: {
        address: tokenBAddress,
        txHash: tokenB.deploymentTransaction().hash
      },
      testPair: {
        address: pairAddress,
        txHash: createPairTx.hash,
        token0: tokenAAddress,
        token1: tokenBAddress
      }
    },
    timestamp: new Date().toISOString(),
    status: "SUCCESS"
  };
  
  console.log("\n" + "=".repeat(50));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(50));
  console.log("🏭 Factory Contract:", factoryAddress);
  console.log("🔄 WETH Contract:", wethAddress);
  console.log("🪙 Token A:", tokenAAddress);
  console.log("🪙 Token B:", tokenBAddress);
  console.log("💱 Test Pair:", pairAddress);
  console.log("⏰ Deployed at:", new Date().toLocaleString());
  console.log("=".repeat(50));
  
  // Save deployment info to file
  const deploymentJson = JSON.stringify(deploymentInfo, null, 2);
  fs.writeFileSync('deployment.json', deploymentJson);
  console.log("💾 Deployment info saved to deployment.json");
  
  // Create contract addresses file for frontend
  const contractAddresses = {
    FACTORY_ADDRESS: factoryAddress,
    WETH_ADDRESS: wethAddress,
    TOKEN_A_ADDRESS: tokenAAddress,
    TOKEN_B_ADDRESS: tokenBAddress,
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
  
  return deploymentInfo;
}

async function main() {
  console.log("🔄 Monitoring balance and waiting for funds...");
  console.log("📍 Account:", "0x15820099D07106fb55C3487610ab673d870833F0");
  console.log("🔗 Please send PAS tokens to this address using the faucet:");
  console.log("   https://faucet.polkadot.io/?parachain=1111");
  console.log("⏰ Checking balance every 10 seconds...\n");
  
  while (true) {
    try {
      const balance = await checkBalance();
      const balanceEther = ethers.formatEther(balance);
      
      process.stdout.write(`\r💰 Current balance: ${balanceEther} PAS`);
      
      if (balance > ethers.parseEther("0.1")) {
        console.log("\n\n✅ Sufficient funds detected! Starting deployment...\n");
        await deployContracts();
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    } catch (error) {
      console.error("\n❌ Error checking balance:", error.message);
      break;
    }
  }
}

main()
  .then(() => {
    console.log("\n✅ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:");
    console.error(error);
    process.exit(1);
  }); 