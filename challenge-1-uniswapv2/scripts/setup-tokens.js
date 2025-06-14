const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Setting up tokens for DEX...\n");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer address:", deployer.address);

  // Get native balance
  const nativeBalance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Native PAS balance:", ethers.formatEther(nativeBalance), "PAS");

  // WETH contract address
  const WETH_ADDRESS = "0x9E74fC88465Ca0a8E3899D3aD235C99b127bc21D";
  
  // WETH ABI with deposit function
  const WETH_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function deposit() payable",
    "function withdraw(uint256)",
    "function transfer(address, uint256) returns (bool)"
  ];

  console.log("\n🔄 Wrapping PAS to WETH...");
  console.log("==========================");

  try {
    const weth = new ethers.Contract(WETH_ADDRESS, WETH_ABI, deployer);
    
    // Check current WETH balance
    const currentWethBalance = await weth.balanceOf(deployer.address);
    console.log(`📊 Current WETH balance: ${ethers.formatEther(currentWethBalance)} WETH`);
    
    // Wrap 10 PAS to WETH
    const wrapAmount = ethers.parseEther("10");
    console.log(`🔄 Wrapping ${ethers.formatEther(wrapAmount)} PAS to WETH...`);
    
    const tx = await weth.deposit({ value: wrapAmount });
    console.log(`⏳ Transaction sent: ${tx.hash}`);
    
    await tx.wait();
    console.log("✅ Wrap transaction confirmed!");
    
    // Check new WETH balance
    const newWethBalance = await weth.balanceOf(deployer.address);
    console.log(`📊 New WETH balance: ${ethers.formatEther(newWethBalance)} WETH`);
    
  } catch (error) {
    console.log(`❌ WETH wrap failed: ${error.message}`);
  }

  console.log("\n📋 UPDATED TOKEN STATUS:");
  console.log("========================");

  // Contract addresses
  const contracts = {
    WETH: "0x9E74fC88465Ca0a8E3899D3aD235C99b127bc21D",
    TOKEN_A: "0x8D6e37347A6020B5D0902D15257F28a2c19B4145",
    TOKEN_B: "0x2251bf61f55e22dAa392b0e83A66f2DbF21176fb"
  };

  const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)"
  ];

  for (const [name, address] of Object.entries(contracts)) {
    try {
      const contract = new ethers.Contract(address, ERC20_ABI, deployer);
      
      const symbol = await contract.symbol();
      const balance = await contract.balanceOf(deployer.address);
      const decimals = await contract.decimals();
      
      console.log(`\n🪙 ${name} (${symbol}):`);
      console.log(`   Balance: ${ethers.formatUnits(balance, decimals)} ${symbol}`);
      
    } catch (error) {
      console.log(`❌ Error checking ${name}: ${error.message}`);
    }
  }

  console.log("\n💡 RECOMMENDATIONS:");
  console.log("===================");
  console.log("✅ You now have WETH tokens to trade");
  console.log("⚠️  TOKEN_A and TOKEN_B are LP tokens (not tradeable)");
  console.log("🔧 Use WETH and PAS (native) for trading");
  console.log("🏭 Create pairs: WETH/PAS");
  
  // Update deployment.json with AIINSIGHT info
  const fs = require('fs');
  try {
    const deploymentData = JSON.parse(fs.readFileSync('deployment.json', 'utf8'));
    
    // Add WETH balance info
    const wethContract = new ethers.Contract(WETH_ADDRESS, WETH_ABI, deployer);
    const wethBalance = await wethContract.balanceOf(deployer.address);
    
    deploymentData.tokens = {
      PAS: {
        address: "0x0000000000000000000000000000000000000000",
        symbol: "PAS",
        balance: ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
        isNative: true
      },
      WETH: {
        address: WETH_ADDRESS,
        symbol: "WETH", 
        balance: ethers.formatEther(wethBalance),
        isNative: false
      }
    };
    
    fs.writeFileSync('deployment.json', JSON.stringify(deploymentData, null, 2));
    console.log("📝 Updated deployment.json with token info");
    
  } catch (error) {
    console.log(`⚠️  Could not update deployment.json: ${error.message}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 