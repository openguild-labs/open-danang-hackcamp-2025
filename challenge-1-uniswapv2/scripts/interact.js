const { ethers } = require("hardhat");

// Contract addresses from deployment
const FACTORY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const TOKEN_A_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const TOKEN_B_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const PAIR_ADDRESS = "0x68F1EF64B6A473E6e782871e4F98B2AaD2bbaD95";

async function main() {
    const [deployer, user1] = await ethers.getSigners();

    console.log("🚀 Testing Uniswap V2 DEX Features");
    console.log("=".repeat(50));

    // Get contract instances
    const factory = await ethers.getContractAt("UniswapV2Factory", FACTORY_ADDRESS);
    const tokenA = await ethers.getContractAt("TestToken", TOKEN_A_ADDRESS);
    const tokenB = await ethers.getContractAt("TestToken", TOKEN_B_ADDRESS);
    const pair = await ethers.getContractAt("UniswapV2Pair", PAIR_ADDRESS);

    console.log("📋 Contract Information:");
    console.log(`Factory: ${FACTORY_ADDRESS}`);
    console.log(`Token A: ${TOKEN_A_ADDRESS} (${await tokenA.symbol()})`);
    console.log(`Token B: ${TOKEN_B_ADDRESS} (${await tokenB.symbol()})`);
    console.log(`Pair: ${PAIR_ADDRESS}`);
    console.log();

    // 1. CHECK INITIAL BALANCES
    console.log("💰 Initial Token Balances:");
    const balanceA = await tokenA.balanceOf(deployer.address);
    const balanceB = await tokenB.balanceOf(deployer.address);
    console.log(`Deployer Token A: ${ethers.formatEther(balanceA)} TKA`);
    console.log(`Deployer Token B: ${ethers.formatEther(balanceB)} TKB`);
    console.log();

    // 2. PROVIDE INITIAL LIQUIDITY
    console.log("🏊‍♂️ Feature 1: Providing Initial Liquidity");
    console.log("-".repeat(30));

    const liquidityA = ethers.parseEther("1000"); // 1000 TKA
    const liquidityB = ethers.parseEther("2000"); // 2000 TKB (1:2 ratio)

    // Approve tokens
    await tokenA.approve(PAIR_ADDRESS, liquidityA);
    await tokenB.approve(PAIR_ADDRESS, liquidityB);
    console.log("✅ Approved tokens for liquidity provision");

    // Transfer tokens to pair
    await tokenA.transfer(PAIR_ADDRESS, liquidityA);
    await tokenB.transfer(PAIR_ADDRESS, liquidityB);
    console.log("✅ Transferred tokens to pair");

    // Mint liquidity tokens
    const mintTx = await pair.mint(deployer.address);
    await mintTx.wait();
    console.log("✅ Minted liquidity tokens");

    const liquidityBalance = await pair.balanceOf(deployer.address);
    console.log(`📊 Liquidity tokens received: ${ethers.formatEther(liquidityBalance)} UNI-V2`);

    const [reserve0, reserve1] = await pair.getReserves();
    console.log(`📊 Pool reserves: ${ethers.formatEther(reserve0)} / ${ethers.formatEther(reserve1)}`);
    console.log();

    // 3. TOKEN SWAP
    console.log("🔄 Feature 2: Token Swap");
    console.log("-".repeat(30));

    const swapAmountIn = ethers.parseEther("100"); // 100 TKA

    // Calculate swap output using constant product formula
    // amountOut = (amountIn * reserveOut * 997) / (reserveIn * 1000 + amountIn * 997)
    const amountInWithFee = swapAmountIn * 997n;
    const numerator = amountInWithFee * reserve1;
    const denominator = reserve0 * 1000n + amountInWithFee;
    const amountOut = numerator / denominator;

    console.log(`💱 Swapping ${ethers.formatEther(swapAmountIn)} TKA for ~${ethers.formatEther(amountOut)} TKB`);

    // Transfer tokens to pair for swap
    await tokenA.transfer(PAIR_ADDRESS, swapAmountIn);

    // Execute swap
    const swapTx = await pair.swap(0, amountOut, deployer.address, "0x");
    await swapTx.wait();
    console.log("✅ Swap executed successfully");

    const newBalanceA = await tokenA.balanceOf(deployer.address);
    const newBalanceB = await tokenB.balanceOf(deployer.address);
    console.log(`📊 New balances: ${ethers.formatEther(newBalanceA)} TKA, ${ethers.formatEther(newBalanceB)} TKB`);
    console.log();

    // 4. ADD MORE LIQUIDITY
    console.log("➕ Feature 3: Add Liquidity to Existing Pool");
    console.log("-".repeat(30));

    const addLiquidityA = ethers.parseEther("500");
    const addLiquidityB = ethers.parseEther("1000");

    await tokenA.approve(PAIR_ADDRESS, addLiquidityA);
    await tokenB.approve(PAIR_ADDRESS, addLiquidityB);
    await tokenA.transfer(PAIR_ADDRESS, addLiquidityA);
    await tokenB.transfer(PAIR_ADDRESS, addLiquidityB);

    const addLiqTx = await pair.mint(deployer.address);
    await addLiqTx.wait();
    console.log("✅ Added more liquidity");

    const newLiquidityBalance = await pair.balanceOf(deployer.address);
    console.log(`📊 Total liquidity tokens: ${ethers.formatEther(newLiquidityBalance)} UNI-V2`);
    console.log();

    // 5. REMOVE LIQUIDITY
    console.log("➖ Feature 4: Remove Liquidity");
    console.log("-".repeat(30));

    const removeLiquidity = ethers.parseEther("500"); // Remove 500 UNI-V2 tokens

    // Transfer liquidity tokens to pair for burning
    await pair.transfer(PAIR_ADDRESS, removeLiquidity);

    const burnTx = await pair.burn(deployer.address);
    await burnTx.wait();
    console.log("✅ Removed liquidity");

    const finalLiquidityBalance = await pair.balanceOf(deployer.address);
    const finalBalanceA = await tokenA.balanceOf(deployer.address);
    const finalBalanceB = await tokenB.balanceOf(deployer.address);

    console.log(`📊 Final liquidity tokens: ${ethers.formatEther(finalLiquidityBalance)} UNI-V2`);
    console.log(`📊 Final token balances: ${ethers.formatEther(finalBalanceA)} TKA, ${ethers.formatEther(finalBalanceB)} TKB`);
    console.log();

    console.log("🎉 All DEX features tested successfully!");
    console.log("=".repeat(50));

    // Summary
    console.log("📋 Feature Summary:");
    console.log("✅ 1. Provide liquidity - WORKING");
    console.log("✅ 2. Swap tokens - WORKING");
    console.log("✅ 3. Add liquidity to existing pool - WORKING");
    console.log("✅ 4. Remove liquidity - WORKING");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    });