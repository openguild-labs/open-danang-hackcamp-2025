const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LendingBorrowing", function () {
    let lendingBorrowing;
    let collateralToken;
    let loanToken;
    let owner;
    let user1;
    let user2;

    // Increase timeout for slow networks
    this.timeout(120000);

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        try {
            // Deploy mock tokens
            const MyToken = await ethers.getContractFactory("MyToken");

            console.log("Deploying collateral token...");
            collateralToken = await MyToken.deploy("Collateral Token", "COL");
            await collateralToken.waitForDeployment();

            console.log("Deploying loan token...");
            loanToken = await MyToken.deploy("Loan Token", "LOAN");
            await loanToken.waitForDeployment();

            // Deploy LendingBorrowing contract
            console.log("Deploying LendingBorrowing contract...");
            const LendingBorrowing = await ethers.getContractFactory("LendingBorrowing");
            lendingBorrowing = await LendingBorrowing.deploy(
                await collateralToken.getAddress(),
                await loanToken.getAddress()
            );
            await lendingBorrowing.waitForDeployment();

            // Mint tokens to users with explicit gas settings
            console.log("Minting tokens...");
            const mintAmount = ethers.parseEther("1000");

            await collateralToken.mint(user1.address, mintAmount);
            await collateralToken.mint(user2.address, mintAmount);
            await loanToken.mint(owner.address, ethers.parseEther("10000"));
            await loanToken.mint(user1.address, mintAmount);
            await loanToken.mint(user2.address, mintAmount);

            // Transfer loan tokens to contract for liquidity
            console.log("Providing liquidity...");
            await loanToken.transfer(await lendingBorrowing.getAddress(), ethers.parseEther("5000"));

            console.log("Setup complete!");
        } catch (error) {
            console.error("Setup failed:", error);
            throw error;
        }
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await lendingBorrowing.owner()).to.equal(owner.address);
        });

        it("Should set correct collateral factor", async function () {
            expect(await lendingBorrowing.collateralFactor()).to.equal(150);
        });

        it("Should set correct token addresses", async function () {
            expect(await lendingBorrowing.collateralToken()).to.equal(await collateralToken.getAddress());
            expect(await lendingBorrowing.loanToken()).to.equal(await loanToken.getAddress());
        });
    });

    describe("Deposit Collateral", function () {
        it("Should allow users to deposit collateral", async function () {
            const depositAmount = ethers.parseEther("100");

            // Check user has tokens first
            const userBalance = await collateralToken.balanceOf(user1.address);
            expect(userBalance).to.be.gte(depositAmount);

            // Approve and deposit
            await collateralToken.connect(user1).approve(await lendingBorrowing.getAddress(), depositAmount);
            await lendingBorrowing.connect(user1).depositCollateral(depositAmount);

            expect(await lendingBorrowing.getCollateralBalance(user1.address)).to.equal(depositAmount);
        });

        it("Should emit CollateralDeposited event", async function () {
            const depositAmount = ethers.parseEther("100");

            await collateralToken.connect(user1).approve(await lendingBorrowing.getAddress(), depositAmount);

            await expect(lendingBorrowing.connect(user1).depositCollateral(depositAmount))
                .to.emit(lendingBorrowing, "CollateralDeposited")
                .withArgs(user1.address, depositAmount);
        });

        it("Should revert when depositing zero amount", async function () {
            await expect(lendingBorrowing.connect(user1).depositCollateral(0))
                .to.be.revertedWith("Amount must be greater than 0");
        });
    });

    describe("Withdraw Collateral", function () {
        beforeEach(async function () {
            const depositAmount = ethers.parseEther("300");
            await collateralToken.connect(user1).approve(await lendingBorrowing.getAddress(), depositAmount);
            await lendingBorrowing.connect(user1).depositCollateral(depositAmount);
        });

        it("Should allow users to withdraw collateral when no active loan", async function () {
            const withdrawAmount = ethers.parseEther("100");

            await lendingBorrowing.connect(user1).withdrawCollateral(withdrawAmount);

            expect(await lendingBorrowing.getCollateralBalance(user1.address))
                .to.equal(ethers.parseEther("200"));
        });

        it("Should revert when withdrawing more than balance", async function () {
            const withdrawAmount = ethers.parseEther("400");

            await expect(lendingBorrowing.connect(user1).withdrawCollateral(withdrawAmount))
                .to.be.revertedWith("Insufficient collateral balance");
        });
    });

    describe("Take Loan", function () {
        beforeEach(async function () {
            // Deposit enough collateral for loan tests
            const depositAmount = ethers.parseEther("300");
            await collateralToken.connect(user1).approve(await lendingBorrowing.getAddress(), depositAmount);
            await lendingBorrowing.connect(user1).depositCollateral(depositAmount);
        });

        it("Should allow users to take a loan", async function () {
            const loanAmount = ethers.parseEther("100");

            await lendingBorrowing.connect(user1).takeLoan(loanAmount);

            const loanDetails = await lendingBorrowing.getLoanDetails(user1.address);
            expect(loanDetails.loanAmount).to.equal(loanAmount);
            expect(loanDetails.isActive).to.be.true;
            expect(loanDetails.collateralAmount).to.equal(ethers.parseEther("150")); // 150% of loan
        });

        it("Should revert when insufficient collateral", async function () {
            const loanAmount = ethers.parseEther("250"); // Would need 375 collateral, but only have 300

            await expect(lendingBorrowing.connect(user1).takeLoan(loanAmount))
                .to.be.revertedWith("Insufficient collateral");
        });
    });

    describe("Repay Loan", function () {
        beforeEach(async function () {
            const depositAmount = ethers.parseEther("300");
            const loanAmount = ethers.parseEther("100");

            // Deposit collateral and take loan
            await collateralToken.connect(user1).approve(await lendingBorrowing.getAddress(), depositAmount);
            await lendingBorrowing.connect(user1).depositCollateral(depositAmount);
            await lendingBorrowing.connect(user1).takeLoan(loanAmount);
        });

        it("Should allow users to repay loan", async function () {
            const repayAmount = ethers.parseEther("100");

            await loanToken.connect(user1).approve(await lendingBorrowing.getAddress(), repayAmount);
            await lendingBorrowing.connect(user1).repayLoan();

            const loanDetails = await lendingBorrowing.getLoanDetails(user1.address);
            expect(loanDetails.isActive).to.be.false;
            expect(loanDetails.loanAmount).to.equal(0);
        });
    });

    describe("Admin Functions", function () {
        it("Should allow owner to set collateral factor", async function () {
            const newFactor = 200;

            await lendingBorrowing.setCollateralFactor(newFactor);

            expect(await lendingBorrowing.collateralFactor()).to.equal(newFactor);
        });

        it("Should emit CollateralFactorUpdated event", async function () {
            const newFactor = 200;

            await expect(lendingBorrowing.setCollateralFactor(newFactor))
                .to.emit(lendingBorrowing, "CollateralFactorUpdated")
                .withArgs(newFactor);
        });
    });

    describe("View Functions", function () {
        it("Should return correct available liquidity", async function () {
            const expectedLiquidity = ethers.parseEther("5000");
            expect(await lendingBorrowing.getAvailableLiquidity()).to.equal(expectedLiquidity);
        });
    });
});
