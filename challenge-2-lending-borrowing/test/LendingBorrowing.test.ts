import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import hre from "hardhat";
import { 
    LendingBorrowing,
    MockERC20
} from "../typechain-types";

describe("LendingBorrowing", function () {
    let lendingBorrowing: LendingBorrowing;
    let collateralToken: MockERC20;
    let lendingToken: MockERC20;
    let owner: HardhatEthersSigner;
    let user1: HardhatEthersSigner;
    let user2: HardhatEthersSigner;
    
    const COLLATERAL_FACTOR: bigint = 50n; // 50%
    const INITIAL_SUPPLY: bigint = ethers.parseEther("1000000"); // 1 million tokens

    beforeEach(async function () {
        [owner, user1, user2] = await hre.ethers.getSigners();

        // Deploy MockERC20 for collateral token
        const CollateralToken = await ethers.getContractFactory("MockERC20");
        collateralToken = await CollateralToken.deploy("Collateral Token", "CTK");

        // Deploy MockERC20 for lending token
        const LendingToken = await ethers.getContractFactory("MockERC20");
        lendingToken = await LendingToken.deploy("Lending Token", "LTK");

        // Mint initial supply
        await collateralToken.mint(owner.address, INITIAL_SUPPLY);
        await lendingToken.mint(owner.address, INITIAL_SUPPLY);

        // Deploy LendingBorrowing contract
        const LendingBorrowing = await ethers.getContractFactory("LendingBorrowing");
        lendingBorrowing = await LendingBorrowing.deploy(
            collateralToken.getAddress(),
            lendingToken.getAddress(),
            COLLATERAL_FACTOR
        );

        // Setup test environment
        await collateralToken.transfer(user1.address, ethers.parseEther("1000"));
        await collateralToken.transfer(user2.address, ethers.parseEther("1000"));
        await lendingToken.transfer(await lendingBorrowing.getAddress(), ethers.parseEther("10000"));
    });

    describe("Contract Deployment", function () {
        it("Should set the correct collateral factor", async function () {
            expect(await lendingBorrowing.collateralFactor()).to.equal(COLLATERAL_FACTOR);
        });

        it("Should set the correct token addresses", async function () {
            expect(await lendingBorrowing.collateralToken()).to.equal(await collateralToken.getAddress());
            expect(await lendingBorrowing.lendingToken()).to.equal(await lendingToken.getAddress());
        });

        it("Check balance of user1", async function () {
            expect(await collateralToken.balanceOf(user1.address)).to.equal(ethers.parseEther("1000"));
        });

        it("Check balance of lendingBorrowing", async function () {
            expect(await lendingToken.balanceOf(await lendingBorrowing.getAddress())).to.equal(ethers.parseEther("10000"));
        });
    });

    describe("Collateral Management", function () {
        const depositAmount: bigint = ethers.parseUnits("100", 18);

        beforeEach(async function () {
            await collateralToken.connect(user1).approve(await lendingBorrowing.getAddress(), depositAmount);
        });

        it("Should allow users to deposit collateral", async function () {
            await expect(lendingBorrowing.connect(user1).depositCollateral(depositAmount))
                .to.emit(lendingBorrowing, "CollateralDeposited")
                .withArgs(user1.address, depositAmount);
            
            expect(await lendingBorrowing.collateralBalances(user1.address)).to.equal(depositAmount);
        });

        it("Should not allow zero amount deposits", async function () {
            await expect(lendingBorrowing.connect(user1).depositCollateral(0))
                .to.be.revertedWith("Amount must be > 0");
        });

        it("Should allow users to withdraw collateral if no active loan", async function () {
            await lendingBorrowing.connect(user1).depositCollateral(depositAmount);
            await expect(lendingBorrowing.connect(user1).withdrawCollateral(depositAmount))
                .to.emit(lendingBorrowing, "CollateralWithdrawn")
                .withArgs(user1.address, depositAmount);
            
            expect(await lendingBorrowing.collateralBalances(user1.address)).to.equal(0);
        });

        it("Should not allow withdrawal of locked collateral", async function () {
            await lendingBorrowing.connect(user1).depositCollateral(depositAmount);
            await lendingToken.connect(user1).approve(await lendingBorrowing.getAddress(), depositAmount);
            await lendingBorrowing.connect(user1).takeLoan(ethers.parseEther("40"));
            
            await expect(lendingBorrowing.connect(user1).withdrawCollateral(depositAmount))
                .to.be.revertedWith("Cant withdraw collateral");
        });
    });

    describe("Loan Operations", function () {
        const collateralAmount: bigint = ethers.parseEther("100");
        const loanAmount: bigint = ethers.parseEther("40");

        beforeEach(async function () {
            await collateralToken.connect(user1).approve(await lendingBorrowing.getAddress(), collateralAmount);
            await lendingBorrowing.connect(user1).depositCollateral(collateralAmount);
        });

        it("Should allow users to take loans within collateral limit", async function () {
            await expect(lendingBorrowing.connect(user1).takeLoan(loanAmount))
                .to.emit(lendingBorrowing, "LoanTaken")
                .withArgs(user1.address, loanAmount);

            const loanDetails = await lendingBorrowing.getLoanDetails(user1.address);
            expect(loanDetails.amount).to.equal(loanAmount);
            expect(loanDetails.isActive).to.be.true;
        });

        it("Should not allow loans exceeding collateral limit", async function () {
            const excessiveLoanAmount = ethers.parseEther("60"); // More than 50% collateral factor
            await expect(lendingBorrowing.connect(user1).takeLoan(excessiveLoanAmount))
                .to.be.revertedWith("Loan exceeds collateral limit");
        });

        it("Should not allow multiple active loans", async function () {
            await lendingBorrowing.connect(user1).takeLoan(loanAmount);
            await expect(lendingBorrowing.connect(user1).takeLoan(loanAmount))
                .to.be.revertedWith("Existing loan must be repaid first");
        });

        it("Should allow users to repay loans", async function () {
            await lendingBorrowing.connect(user1).takeLoan(loanAmount);
            await lendingToken.connect(user1).approve(await lendingBorrowing.getAddress(), loanAmount);

            await expect(lendingBorrowing.connect(user1).repayLoan(loanAmount))
                .to.emit(lendingBorrowing, "LoanRepaid")
                .withArgs(user1.address, loanAmount);

            const loanDetails = await lendingBorrowing.getLoanDetails(user1.address);
            expect(loanDetails.isActive).to.be.false;
        });

        it("Should not allow repayment of non-existent loans", async function () {
            await expect(lendingBorrowing.connect(user1).repayLoan(loanAmount))
                .to.be.revertedWith("No active loan");
        });
    });

    describe("Owner Functions", function () {
        it("Should allow owner to change collateral factor", async function () {
            const newFactor = 60n;
            await lendingBorrowing.setCollateralFactor(newFactor);
            expect(await lendingBorrowing.collateralFactor()).to.equal(newFactor);
        });

        it("Should not allow non-owners to change collateral factor", async function () {
            await expect(lendingBorrowing.connect(user1).setCollateralFactor(60))
                .to.be.revertedWithCustomError(lendingBorrowing, "OwnableUnauthorizedAccount");
        });

        it("Should not allow collateral factor greater than 100", async function () {
            await expect(lendingBorrowing.setCollateralFactor(101))
                .to.be.revertedWith("Collatereal Factor must be <= 100");
        });
    });
});