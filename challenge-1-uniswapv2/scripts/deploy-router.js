const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying UniswapV2Router02...");

  // Get deployed contract addresses
  const FACTORY_ADDRESS = "0xcC7Cf672147325f9dE0629C0ffccBC5724a5A4AE";
  const WETH_ADDRESS = "0x9E74fC88465Ca0a8E3899D3aD235C99b127bc21D";

  // Deploy Router
  const UniswapV2Router02 = await ethers.getContractFactory("UniswapV2Router02");
  const router = await UniswapV2Router02.deploy(FACTORY_ADDRESS, WETH_ADDRESS);
  await router.waitForDeployment();

  const routerAddress = await router.getAddress();
  console.log("UniswapV2Router02 deployed to:", routerAddress);

  // Verify deployment
  console.log("Verifying deployment...");
  const factory = await router.factory();
  const weth = await router.WETH();
  
  console.log("Router factory:", factory);
  console.log("Router WETH:", weth);
  
  console.log("✅ Router deployment completed!");
  console.log("📝 Update your frontend with this Router address:", routerAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 