const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

    // Deploy Factory
    const Factory = await ethers.getContractFactory("UniswapV2Factory");
    const factory = await Factory.deploy(deployer.address);
    await factory.waitForDeployment();
    console.log("Factory deployed to:", await factory.getAddress());

    // Deploy Test Tokens
    const TestToken = await ethers.getContractFactory("TestToken");
    const tokenA = await TestToken.deploy("Token A", "TKA", 1000000);
    await tokenA.waitForDeployment();
    console.log("Token A deployed to:", await tokenA.getAddress());

    const tokenB = await TestToken.deploy("Token B", "TKB", 1000000);
    await tokenB.waitForDeployment();
    console.log("Token B deployed to:", await tokenB.getAddress());

    // Create a pair
    await factory.createPair(await tokenA.getAddress(), await tokenB.getAddress());
    const pairAddress = await factory.getPair(await tokenA.getAddress(), await tokenB.getAddress());
    console.log("Pair deployed to:", pairAddress);

    // Save deployment addresses
    const deployments = {
        factory: await factory.getAddress(),
        tokenA: await tokenA.getAddress(),
        tokenB: await tokenB.getAddress(),
        pair: pairAddress,
        deployer: deployer.address,
        network: hre.network.name
    };

    console.log("\n=== Deployment Summary ===");
    console.log(JSON.stringify(deployments, null, 2));

    // Save addresses to file for frontend
    const deploymentsDir = path.join(__dirname, '..', 'frontend', 'src', 'config');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    fs.writeFileSync(
        path.join(deploymentsDir, 'contracts.json'),
        JSON.stringify(deployments, null, 2)
    );
    console.log("📄 Contract addresses saved to frontend/src/config/contracts.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });