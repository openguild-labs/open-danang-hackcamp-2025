// eslint-disable-next-line import/no-extraneous-dependencies
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("\\n▶ Deployer:", deployer.address);

  /* ------------------------------------------------------------------ */
  /*                     1. Mock ERC-20 tokens                          */
  /* ------------------------------------------------------------------ */
  const ERC20 = await ethers.getContractFactory("ERC20");
  const totalSupply = ethers.parseUnits("1000000", 18);

  const tokenA = await ERC20.deploy(totalSupply);
  await tokenA.waitForDeployment();
  const tokenAAddress = await tokenA.getAddress();
  console.log("✓ Token A deployed →", tokenAAddress);

  const tokenB = await ERC20.deploy(totalSupply);
  await tokenB.waitForDeployment();
  const tokenBAddress = await tokenB.getAddress();
  console.log("✓ Token B deployed →", tokenBAddress);

  /* ------------------------------------------------------------------ */
  /*                 2. Deploy heavy logic implementation               */
  /* ------------------------------------------------------------------ */
  const PairLogic = await ethers.getContractFactory("UniswapV2PairLogic");
  const pairLogic = await PairLogic.deploy();
  await pairLogic.waitForDeployment();
  const pairLogicAddress = await pairLogic.getAddress();
  console.log("✓ Pair logic deployed →", pairLogicAddress);

  /* ------------------------------------------------------------------ */
  /*           3. Deploy lightweight core (cloned by factory)           */
  /* ------------------------------------------------------------------ */
  const PairCore = await ethers.getContractFactory("UniswapV2Pair");
  const pairImpl = await PairCore.deploy(pairLogicAddress);
  await pairImpl.waitForDeployment();
  const pairImplAddress = await pairImpl.getAddress();
  console.log("✓ Pair core implementation deployed →", pairImplAddress);

  /* ------------------------------------------------------------------ */
  /*                          4. Factory                                */
  /* ------------------------------------------------------------------ */
  const Factory = await ethers.getContractFactory("UniswapV2Factory");
  const factory = await Factory.deploy(pairImplAddress, deployer.address);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✓ Factory deployed →", factoryAddress);

  /* ------------------------------------------------------------------ */
  /*                       5. Create trading pair                       */
  /* ------------------------------------------------------------------ */
  const createPairTx = await factory.createPair(tokenAAddress, tokenBAddress);
  const receipt = await createPairTx.wait();
  const pairAddress = await factory.getPair(tokenAAddress, tokenBAddress);
  console.log("✓ Pair created   →", pairAddress);
  console.log("  ↳ Tx hash:", receipt?.hash ?? "n/a");

  /* ------------------------------------------------------------------ */
  /*                       6. Persist addresses                         */
  /* ------------------------------------------------------------------ */
  const out = {
    network: "paseoAssetHub",
    deployer: deployer.address,
    tokenA: tokenAAddress,
    tokenB: tokenBAddress,
    factory: factoryAddress,
    pairImpl: pairImplAddress,
    pairLogic: pairLogicAddress,
    pair: pairAddress
  };

  const outDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "paseo.json");
  fs.writeFileSync(outFile, JSON.stringify(out, null, 2));
  console.log(`\\n📄 Deployment data written to ${outFile}\\n`);
}

main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exit(1);
});