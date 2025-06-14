const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying SimpleRouter...");

  // Get deployed contract addresses
  const FACTORY_ADDRESS = "0xcC7Cf672147325f9dE0629C0ffccBC5724a5A4AE";
  const WETH_ADDRESS = "0x9E74fC88465Ca0a8E3899D3aD235C99b127bc21D";

  // Deploy Router
  const SimpleRouter = await ethers.getContractFactory("SimpleRouter");
  const router = await SimpleRouter.deploy(FACTORY_ADDRESS, WETH_ADDRESS);
  await router.waitForDeployment();

  const routerAddress = await router.getAddress();
  console.log("SimpleRouter deployed to:", routerAddress);

  // Verify deployment
  console.log("Verifying deployment...");
  const factory = await router.factory();
  const weth = await router.WETH();
  
  console.log("Router factory:", factory);
  console.log("Router WETH:", weth);
  
  console.log("✅ SimpleRouter deployment completed!");
  console.log("📝 Update your frontend with this Router address:", routerAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 