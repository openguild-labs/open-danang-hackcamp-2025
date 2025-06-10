const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying to Paseo Asset Hub...");

    // Get the deployer
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

    // Deploy mock tokens (for testing)
    console.log("\nDeploying mock tokens...");
    const MyToken = await ethers.getContractFactory("MyToken");

    const collateralToken = await MyToken.deploy("Collateral Token", "COL");
    await collateralToken.waitForDeployment();
    console.log("Collateral Token deployed to:", await collateralToken.getAddress());

    const loanToken = await MyToken.deploy("Loan Token", "LOAN");
    await loanToken.waitForDeployment();
    console.log("Loan Token deployed to:", await loanToken.getAddress());

    // Deploy LendingBorrowing contract
    console.log("\nDeploying LendingBorrowing contract...");
    const LendingBorrowing = await ethers.getContractFactory("LendingBorrowing");
    const lendingBorrowing = await LendingBorrowing.deploy(
        await collateralToken.getAddress(),
        await loanToken.getAddress()
    );
    await lendingBorrowing.waitForDeployment();
    console.log("LendingBorrowing deployed to:", await lendingBorrowing.getAddress());

    // Mint some tokens for testing
    console.log("\nMinting initial tokens...");
    const mintAmount = ethers.parseEther("1000000");
    await collateralToken.mint(deployer.address, mintAmount);
    await loanToken.mint(deployer.address, mintAmount);

    // Transfer some loan tokens to the contract for liquidity
    console.log("Providing initial liquidity...");
    const liquidityAmount = ethers.parseEther("100000");
    await loanToken.transfer(await lendingBorrowing.getAddress(), liquidityAmount);
    console.log("Transferred", ethers.formatEther(liquidityAmount), "LOAN tokens to contract");

    console.log("\n=== Deployment Summary ===");
    console.log("Collateral Token:", await collateralToken.getAddress());
    console.log("Loan Token:", await loanToken.getAddress());
    console.log("LendingBorrowing Contract:", await lendingBorrowing.getAddress());
    console.log("Network: Paseo Asset Hub");
    console.log("Explorer: https://blockscout-passet-hub.parity-testnet.parity.io/");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
