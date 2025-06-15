import { ethers } from "hardhat";

async function deploy() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  const initialSupply = 1_000_000n * 10n ** 18n;

  // Deploy CollateralToken
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const collateralToken = await MockERC20.deploy(
    initialSupply,
    "HARRY_CollateralToken Token",
    "HCTK"
  );
  await collateralToken.waitForDeployment();
  console.log(
    "CollateralToken deployed to:",
    await collateralToken.getAddress()
  );

  // Deploy LendingToken
  const lendingToken = await MockERC20.deploy(
    initialSupply,
    "HARRY_LendingToken",
    "HLTK"
  );
  await lendingToken.waitForDeployment();
  console.log("LendingToken deployed to:", await lendingToken.getAddress());

  // Deploy LendingBorrowing contract
  const LendingBorrowing = await ethers.getContractFactory("LendingBorrowing");
  const lendingBorrowing = await LendingBorrowing.deploy(
    await collateralToken.getAddress(),
    await lendingToken.getAddress(),
    50
  );
  await lendingBorrowing.waitForDeployment();
  console.log(
    "LendingBorrowing deployed to:",
    await lendingBorrowing.getAddress()
  );
}

deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
