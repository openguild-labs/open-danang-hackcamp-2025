const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UniswapV2 DEX Integration", function () {
    let factory, tokenA, tokenB, pair;
    let owner, user1, user2;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy Factory
        const Factory = await ethers.getContractFactory("UniswapV2Factory");
        factory = await Factory.deploy(owner.address);

        // Deploy Tokens
        const Token = await ethers.getContractFactory("TestERC20");
        tokenA = await Token.deploy("Token A", "TKA", ethers.parseEther("10000"));
        tokenB = await Token.deploy("Token B", "TKB", ethers.parseEther("10000"));

        // Create Pair
        await factory.createPair(await tokenA.getAddress(), await tokenB.getAddress());
        const pairAddress = await factory.getPair(await tokenA.getAddress(), await tokenB.getAddress());

        const Pair = await ethers.getContractFactory("UniswapV2Pair");
        pair = Pair.attach(pairAddress);
    });

    describe("Token Operations", function () {
        it("Should mint tokens to users", async function () {
            await tokenA.mint(user1.address, ethers.parseEther("1000"));
            await tokenB.mint(user1.address, ethers.parseEther("1000"));

            expect(await tokenA.balanceOf(user1.address)).to.equal(ethers.parseEther("1000"));
            expect(await tokenB.balanceOf(user1.address)).to.equal(ethers.parseEther("1000"));
        });
    });

    describe("Liquidity Operations", function () {
        beforeEach(async function () {
            // Mint tokens to user1 and user2
            await tokenA.mint(user1.address, ethers.parseEther("1000"));
            await tokenB.mint(user1.address, ethers.parseEther("1000"));
            await tokenA.mint(user2.address, ethers.parseEther("1000"));
            await tokenB.mint(user2.address, ethers.parseEther("1000"));
        });

        it("Should provide initial liquidity (first liquidity provider)", async function () {
            const amountA = ethers.parseEther("100");
            const amountB = ethers.parseEther("50"); // Different ratio - user sets the initial price

            // Check pool is empty
            const [initialReserve0, initialReserve1] = await pair.getReserves();
            expect(initialReserve0).to.equal(0);
            expect(initialReserve1).to.equal(0);

            // Get token addresses to determine order
            const tokenAAddress = await tokenA.getAddress();
            const tokenBAddress = await tokenB.getAddress();
            const token0Address = await pair.token0();
            const token1Address = await pair.token1();

            // Transfer tokens to pair
            await tokenA.connect(user1).transfer(await pair.getAddress(), amountA);
            await tokenB.connect(user1).transfer(await pair.getAddress(), amountB);

            // Mint liquidity tokens - this sets the initial exchange rate
            await pair.mint(user1.address);

            // Check reserves - they will be ordered by token address (token0 < token1)
            const [reserve0, reserve1] = await pair.getReserves();

            if (tokenAAddress.toLowerCase() < tokenBAddress.toLowerCase()) {
                // tokenA is token0, tokenB is token1
                expect(reserve0).to.equal(amountA);
                expect(reserve1).to.equal(amountB);
            } else {
                // tokenB is token0, tokenA is token1
                expect(reserve0).to.equal(amountB);
                expect(reserve1).to.equal(amountA);
            }

            // Initial liquidity provider gets sqrt(amountA * amountB) - MINIMUM_LIQUIDITY
            const liquidity = await pair.balanceOf(user1.address);
            const expectedLiquidity = ethers.parseEther("70.710678118654752440") - 1000n; // sqrt(100 * 50) - 1000
            expect(liquidity).to.be.closeTo(expectedLiquidity, ethers.parseEther("0.01"));

            console.log("Initial liquidity provided:");
            console.log(`- Set exchange rate: 1 TKA = ${Number(amountB) / Number(amountA)} TKB`);
            console.log(`- LP tokens received: ${ethers.formatEther(liquidity)}`);
        });

        it("Should add liquidity to existing pool (must follow current ratio)", async function () {
            // First, user1 provides initial liquidity
            const initialAmountA = ethers.parseEther("100");
            const initialAmountB = ethers.parseEther("50");

            await tokenA.connect(user1).transfer(pair.target, initialAmountA);
            await tokenB.connect(user1).transfer(pair.target, initialAmountB);
            await pair.mint(user1.address);

            // Get current ratio
            const [reserve0, reserve1] = await pair.getReserves();
            const ratio = reserve1 * ethers.parseEther("1") / reserve0; // TKB per TKA

            console.log(`Current pool ratio: 1 TKA = ${ethers.formatEther(ratio)} TKB`);

            // Now user2 wants to add liquidity - must follow the existing ratio
            const addAmountA = ethers.parseEther("20");
            const addAmountB = (addAmountA * reserve1) / reserve0; // Calculate required TKB

            console.log(`To add ${ethers.formatEther(addAmountA)} TKA, user2 must provide ${ethers.formatEther(addAmountB)} TKB`);

            // Transfer tokens maintaining the ratio
            await tokenA.connect(user2).transfer(pair.target, addAmountA);
            await tokenB.connect(user2).transfer(pair.target, addAmountB);

            const user1LiquidityBefore = await pair.balanceOf(user1.address);
            await pair.mint(user2.address);
            const user2Liquidity = await pair.balanceOf(user2.address);

            // Check that reserves increased proportionally
            const [newReserve0, newReserve1] = await pair.getReserves();
            expect(newReserve0).to.equal(reserve0 + addAmountA);
            expect(newReserve1).to.equal(reserve1 + addAmountB);

            // User2 gets proportional LP tokens
            const totalSupplyBefore = user1LiquidityBefore + 1000n; // Including MINIMUM_LIQUIDITY
            const expectedUser2Liquidity = (addAmountA * totalSupplyBefore) / reserve0;
            expect(user2Liquidity).to.be.closeTo(expectedUser2Liquidity, ethers.parseEther("0.01"));

            console.log(`User2 LP tokens received: ${ethers.formatEther(user2Liquidity)}`);
        });

        it("Should demonstrate impermanent loss when adding to existing pool with wrong ratio", async function () {
            // Initial liquidity: 100 TKA : 50 TKB (1:0.5 ratio)
            await tokenA.connect(user1).transfer(pair.target, ethers.parseEther("100"));
            await tokenB.connect(user1).transfer(pair.target, ethers.parseEther("50"));
            await pair.mint(user1.address);

            // User2 tries to add with different ratio (this would cause arbitrage)
            const wrongAmountA = ethers.parseEther("10");
            const wrongAmountB = ethers.parseEther("10"); // Should be 5 TKB, not 10

            await tokenA.connect(user2).transfer(pair.target, wrongAmountA);
            await tokenB.connect(user2).transfer(pair.target, wrongAmountB);
            await pair.mint(user2.address);

            // The pool will only use the proportional amount, excess is kept in reserves
            const [reserve0, reserve1] = await pair.getReserves();

            // Pool should now have more TKB relative to TKA than the original ratio
            const newRatio = reserve1 * ethers.parseEther("1") / reserve0;
            const originalRatio = ethers.parseEther("50") * ethers.parseEther("1") / ethers.parseEther("100");

            expect(newRatio).to.be.gt(originalRatio);
            console.log(`Original ratio: ${ethers.formatEther(originalRatio)}`);
            console.log(`New ratio: ${ethers.formatEther(newRatio)}`);
            console.log("Excess tokens create arbitrage opportunity!");
        });
    });

    describe("Swap Operations", function () {
        beforeEach(async function () {
            // Setup liquidity
            await tokenA.mint(user1.address, ethers.parseEther("1000"));
            await tokenB.mint(user1.address, ethers.parseEther("1000"));
            await tokenA.mint(user2.address, ethers.parseEther("100"));

            // Add initial liquidity
            const amountA = ethers.parseEther("100");
            const amountB = ethers.parseEther("100");
            await tokenA.connect(user1).transfer(pair.target, amountA);
            await tokenB.connect(user1).transfer(pair.target, amountB);
            await pair.mint(user1.address);
        });

        it("Should perform token swap", async function () {
            const swapAmount = ethers.parseEther("10");

            // Get initial balances
            const initialTokenBBalance = await tokenB.balanceOf(user2.address);

            // Perform swap: TKA -> TKB
            await tokenA.connect(user2).transfer(pair.target, swapAmount);

            // Calculate expected output
            const [reserve0, reserve1] = await pair.getReserves();
            const amountOut = (swapAmount * reserve1 * 997n) / (reserve0 * 1000n + swapAmount * 997n);

            await pair.swap(0, amountOut, user2.address, "0x");

            const finalTokenBBalance = await tokenB.balanceOf(user2.address);
            expect(finalTokenBBalance).to.be.gt(initialTokenBBalance);
        });
    });

    describe("Price Impact and Slippage", function () {
        beforeEach(async function () {
            // Setup liquidity
            await tokenA.mint(user1.address, ethers.parseEther("1000"));
            await tokenB.mint(user1.address, ethers.parseEther("1000"));
            await tokenA.mint(user2.address, ethers.parseEther("100"));

            // Add initial liquidity with 1:1 ratio
            await tokenA.connect(user1).transfer(pair.target, ethers.parseEther("1000"));
            await tokenB.connect(user1).transfer(pair.target, ethers.parseEther("1000"));
            await pair.mint(user1.address);
        });

        it("Should demonstrate price impact on large swaps", async function () {
            const [initialReserve0, initialReserve1] = await pair.getReserves();
            const initialPrice = initialReserve1 * ethers.parseEther("1") / initialReserve0;

            console.log(`Initial price: 1 TKA = ${ethers.formatEther(initialPrice)} TKB`);

            // Large swap: 100 TKA for TKB
            const swapAmount = ethers.parseEther("100");
            await tokenA.connect(user2).transfer(pair.target, swapAmount);

            const amountOut = (swapAmount * initialReserve1 * 997n) / (initialReserve0 * 1000n + swapAmount * 997n);
            await pair.swap(0, amountOut, user2.address, "0x");

            const [newReserve0, newReserve1] = await pair.getReserves();
            const newPrice = newReserve1 * ethers.parseEther("1") / newReserve0;

            const priceImpact = ((newPrice - initialPrice) * 100n) / initialPrice;

            console.log(`New price: 1 TKA = ${ethers.formatEther(newPrice)} TKB`);
            console.log(`Price impact: ${ethers.formatEther(priceImpact)}%`);
            console.log(`Tokens received: ${ethers.formatEther(amountOut)} TKB`);

            expect(newPrice).to.be.gt(initialPrice); // Price of TKA increased
        });
    });
});
