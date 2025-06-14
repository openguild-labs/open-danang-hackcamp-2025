const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking token balances for deployer...\n");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer address:", deployer.address);

  // Get native balance
  const nativeBalance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Native PAS balance:", ethers.formatEther(nativeBalance), "PAS");

  // Contract addresses from deployment
  const contracts = {
    WETH: "0x9E74fC88465Ca0a8E3899D3aD235C99b127bc21D",
    TOKEN_A: "0x8D6e37347A6020B5D0902D15257F28a2c19B4145",
    TOKEN_B: "0x2251bf61f55e22dAa392b0e83A66f2DbF21176fb"
  };

  // ERC20 ABI for checking balances
  const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function symbol() view returns (string)",
    "function name() view returns (string)",
    "function decimals() view returns (uint8)",
    "function mint(address, uint256) public", // For test tokens
    "function totalSupply() view returns (uint256)"
  ];

  console.log("\n📊 TOKEN BALANCES:");
  console.log("==================");

  for (const [name, address] of Object.entries(contracts)) {
    try {
      const contract = new ethers.Contract(address, ERC20_ABI, deployer);
      
      const symbol = await contract.symbol();
      const balance = await contract.balanceOf(deployer.address);
      const decimals = await contract.decimals();
      const totalSupply = await contract.totalSupply();
      
      console.log(`\n🪙 ${name} (${symbol}):`);
      console.log(`   Address: ${address}`);
      console.log(`   Balance: ${ethers.formatUnits(balance, decimals)} ${symbol}`);
      console.log(`   Total Supply: ${ethers.formatUnits(totalSupply, decimals)} ${symbol}`);
      
      // If balance is 0, try to mint some tokens (for test tokens)
      if (balance.toString() === "0" && (name === "TOKEN_A" || name === "TOKEN_B")) {
        console.log(`   ⚠️  Zero balance detected! Attempting to mint...`);
        try {
          const mintAmount = ethers.parseUnits("1000000", decimals); // 1M tokens
          const tx = await contract.mint(deployer.address, mintAmount);
          await tx.wait();
          
          const newBalance = await contract.balanceOf(deployer.address);
          console.log(`   ✅ Minted! New balance: ${ethers.formatUnits(newBalance, decimals)} ${symbol}`);
        } catch (mintError) {
          console.log(`   ❌ Mint failed: ${mintError.message}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Error checking ${name}: ${error.message}`);
    }
  }

  console.log("\n🏭 FACTORY INFO:");
  console.log("================");
  
  const FACTORY_ADDRESS = "0xcC7Cf672147325f9dE0629C0ffccBC5724a5A4AE";
  const FACTORY_ABI = [
    "function allPairsLength() view returns (uint256)",
    "function getPair(address, address) view returns (address)"
  ];
  
  try {
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, deployer);
    const pairsCount = await factory.allPairsLength();
    console.log(`📈 Total pairs created: ${pairsCount}`);
    
    // Check specific pairs
    const pairs = [
      ["WETH", "TOKEN_A"],
      ["WETH", "TOKEN_B"], 
      ["TOKEN_A", "TOKEN_B"]
    ];
    
    for (const [tokenA, tokenB] of pairs) {
      const pairAddress = await factory.getPair(contracts[tokenA], contracts[tokenB]);
      console.log(`🔗 ${tokenA}/${tokenB} pair: ${pairAddress === ethers.ZeroAddress ? "Not created" : pairAddress}`);
    }
    
  } catch (error) {
    console.log(`❌ Error checking factory: ${error.message}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 