const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy Uniswap V2 core contracts (Factory + Pair) together with two mock
 * ERC‑20 tokens on Paseo Asset Hub and persist the deployed addresses to
 * `challenge-1-uniswapv2/deployments/paseo.json`.
 *
 * Usage:
 *   npx hardhat run scripts/deploy-uniswapv2.js --network paseoAssetHub
 */

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("\nDeployer:", deployer.address);

  // 1. Deploy mock ERC‑20 tokens
  const ERC20 = await hre.ethers.getContractFactory("ERC20");
  const totalSupply = hre.ethers.parseUnits("1000000", 18); // 1 000 000 tokens

  const tokenA = await ERC20.deploy(totalSupply);
  await tokenA.waitForDeployment();
  const tokenAAddress = await tokenA.getAddress();
  console.log("TokenA deployed:", tokenAAddress);

  const tokenB = await ERC20.deploy(totalSupply);
  await tokenB.waitForDeployment();
  const tokenBAddress = await tokenB.getAddress();
  console.log("TokenB deployed:", tokenBAddress);

  // 2. Deploy Uniswap V2 Factory (feeToSetter is deployer)
  const Factory = await hre.ethers.getContractFactory("UniswapV2Factory");
  const factory = await Factory.deploy(deployer.address);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("Factory deployed:", factoryAddress);

  // 3. Create trading pair
  const createTx = await factory.createPair(tokenAAddress, tokenBAddress);
  const receipt = await createTx.wait();
  const pairAddress = await factory.getPair(tokenAAddress, tokenBAddress);
  console.log("Pair created:", pairAddress);
  console.log(
    "PairCreated tx hash:",
    receipt && receipt.hash ? receipt.hash : "n/a"
  );

  // 4. Persist addresses for frontend/verification
  const output = {
    network: "paseoAssetHub",
    deployer: deployer.address,
    tokenA: tokenAAddress,
    tokenB: tokenBAddress,
    factory: factoryAddress,
    pair: pairAddress,
  };

  const outDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outFile = path.join(outDir, "paseo.json");
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2));
  console.log(`\nDeployment data written to ${outFile}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });