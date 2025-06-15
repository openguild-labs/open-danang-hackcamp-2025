import { ethers } from "hardhat";

async function main() {
  /* -------------------------------------------------------------------------- */
  /*                                DEPLOYER SETUP                              */
  /* -------------------------------------------------------------------------- */
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with account: ${deployer.address}`);

  /* -------------------------------------------------------------------------- */
  /*                           PARAMETER CONFIGURATION                          */
  /* -------------------------------------------------------------------------- */
  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1 000 000 tokens
  const COLLATERAL_FACTOR = 50n; // 50 %

  /* -------------------------------------------------------------------------- */
  /*                             DEPLOY MOCK TOKENS                             */
  /* -------------------------------------------------------------------------- */
  const MockERC20 = await ethers.getContractFactory("MockERC20");

  const collateralToken = await MockERC20.deploy("CollateralToken", "COL");
  await collateralToken.waitForDeployment();
  await (await collateralToken.mint(deployer.address, INITIAL_SUPPLY)).wait();
  console.log(`CollateralToken deployed at: ${collateralToken.target}`);

  const lendingToken = await MockERC20.deploy("LendingToken", "LND");
  await lendingToken.waitForDeployment();
  await (await lendingToken.mint(deployer.address, INITIAL_SUPPLY)).wait();
  console.log(`LendingToken   deployed at: ${lendingToken.target}`);

  /* -------------------------------------------------------------------------- */
  /*                        DEPLOY LENDING‑BORROWING CORE                       */
  /* -------------------------------------------------------------------------- */
  const LendingBorrowing = await ethers.getContractFactory("LendingBorrowing");
  const lendingBorrowing = await LendingBorrowing.deploy(
    collateralToken.target,
    lendingToken.target,
    COLLATERAL_FACTOR
  );
  await lendingBorrowing.waitForDeployment();
  console.log(`LendingBorrowing deployed at: ${lendingBorrowing.target}`);

  /* -------------------------------------------------------------------------- */
  /*                       SEED PROTOCOL WITH LENDING TOKENS                    */
  /* -------------------------------------------------------------------------- */
  const LIQUIDITY = ethers.parseEther("500000"); // 500 000 LND
  await (await lendingToken.transfer(lendingBorrowing.target, LIQUIDITY)).wait();
  console.log(`Seeded ${ethers.formatEther(LIQUIDITY)} LND to protocol`);

  console.log("\n✔ Deployment completed successfully");
}

/* -------------------------------------------------------------------------- */
/*                                    MAIN                                    */
/* -------------------------------------------------------------------------- */
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});