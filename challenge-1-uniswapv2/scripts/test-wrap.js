const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing WETH wrap/unwrap functionality...");

  const [deployer] = await ethers.getSigners();
  const WETH_ADDRESS = "0x9E74fC88465Ca0a8E3899D3aD235C99b127bc21D";

  // Get WETH contract
  const weth = await ethers.getContractAt("WETH", WETH_ADDRESS);

  console.log(`👤 Testing with address: ${deployer.address}`);

  // Check initial balances
  const initialPASBalance = await ethers.provider.getBalance(deployer.address);
  const initialWETHBalance = await weth.balanceOf(deployer.address);

  console.log("\n📊 INITIAL BALANCES:");
  console.log(`PAS: ${ethers.formatEther(initialPASBalance)} PAS`);
  console.log(`WETH: ${ethers.formatEther(initialWETHBalance)} WETH`);

  // Test 1: Wrap 1 PAS to WETH
  console.log("\n🔄 Test 1: Wrapping 1 PAS to WETH...");
  try {
    const wrapAmount = ethers.parseEther("1");
    const wrapTx = await weth.deposit({ value: wrapAmount });
    await wrapTx.wait();
    console.log(`✅ Wrap successful! TX: ${wrapTx.hash}`);
  } catch (error) {
    console.log(`❌ Wrap failed: ${error.message}`);
  }

  // Check balances after wrap
  const afterWrapPASBalance = await ethers.provider.getBalance(deployer.address);
  const afterWrapWETHBalance = await weth.balanceOf(deployer.address);

  console.log("\n📊 BALANCES AFTER WRAP:");
  console.log(`PAS: ${ethers.formatEther(afterWrapPASBalance)} PAS`);
  console.log(`WETH: ${ethers.formatEther(afterWrapWETHBalance)} WETH`);

  // Test 2: Unwrap 0.5 WETH to PAS
  console.log("\n🔄 Test 2: Unwrapping 0.5 WETH to PAS...");
  try {
    const unwrapAmount = ethers.parseEther("0.5");
    const unwrapTx = await weth.withdraw(unwrapAmount);
    await unwrapTx.wait();
    console.log(`✅ Unwrap successful! TX: ${unwrapTx.hash}`);
  } catch (error) {
    console.log(`❌ Unwrap failed: ${error.message}`);
  }

  // Check final balances
  const finalPASBalance = await ethers.provider.getBalance(deployer.address);
  const finalWETHBalance = await weth.balanceOf(deployer.address);

  console.log("\n📊 FINAL BALANCES:");
  console.log(`PAS: ${ethers.formatEther(finalPASBalance)} PAS`);
  console.log(`WETH: ${ethers.formatEther(finalWETHBalance)} WETH`);

  console.log("\n✅ Wrap/Unwrap testing completed!");
  console.log("🎯 Frontend should now work with proper MetaMask popups for transactions");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 