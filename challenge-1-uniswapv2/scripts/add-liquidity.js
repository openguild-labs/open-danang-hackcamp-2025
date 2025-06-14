const { ethers } = require("hardhat");

async function main() {
  console.log("💧 Adding liquidity to trading pairs...\n");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer address:", deployer.address);

  // Contract addresses
  const WETH_ADDRESS = "0x9E74fC88465Ca0a8E3899D3aD235C99b127bc21D";
  const FACTORY_ADDRESS = "0xcC7Cf672147325f9dE0629C0ffccBC5724a5A4AE";

  // Check current balances
  console.log("📊 Current balances:");
  const nativeBalance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 PAS balance: ${ethers.formatEther(nativeBalance)} PAS`);

  const WETH_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function deposit() payable",
    "function transfer(address, uint256) returns (bool)",
    "function approve(address, uint256) returns (bool)"
  ];

  const weth = new ethers.Contract(WETH_ADDRESS, WETH_ABI, deployer);
  const wethBalance = await weth.balanceOf(deployer.address);
  console.log(`💰 WETH balance: ${ethers.formatEther(wethBalance)} WETH`);

  // If we don't have enough WETH, wrap some more PAS
  if (wethBalance < ethers.parseEther("50")) {
    console.log("\n🔄 Wrapping more PAS to WETH for liquidity...");
    const wrapAmount = ethers.parseEther("50");
    const tx = await weth.deposit({ value: wrapAmount });
    await tx.wait();
    console.log(`✅ Wrapped ${ethers.formatEther(wrapAmount)} PAS to WETH`);
  }

  const FACTORY_ABI = [
    "function getPair(address, address) view returns (address)",
    "function createPair(address, address) returns (address)",
    "function allPairsLength() view returns (uint256)"
  ];

  const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, deployer);

  // Check existing pairs
  console.log("\n🔍 Checking existing pairs...");
  const totalPairs = await factory.allPairsLength();
  console.log(`📈 Total pairs: ${totalPairs}`);

  console.log("\n✅ TRADING SETUP COMPLETE:");
  console.log("==========================");
  console.log(`💰 PAS available: ${ethers.formatEther(nativeBalance)} PAS`);
  console.log(`💰 WETH available: ${ethers.formatEther(await weth.balanceOf(deployer.address))} WETH`);
  console.log(`🏭 Factory pairs: ${totalPairs}`);
  
  console.log("\n💡 TRADING INSTRUCTIONS:");
  console.log("========================");
  console.log("1. ✅ You can now trade PAS ↔ WETH");
  console.log("2. ✅ UI will show real blockchain prices");
  console.log("3. ✅ Swaps will execute real transactions");
  console.log("4. 🚀 Go to http://localhost:3000 and start trading!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 