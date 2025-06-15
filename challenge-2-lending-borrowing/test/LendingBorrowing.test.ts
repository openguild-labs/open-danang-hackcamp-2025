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

  const COLLATERAL_FACTOR: bigint = 50n; // 50 %
  const INITIAL_SUPPLY: bigint = ethers.parseEther("1000000"); // 1 000 000 tokens
  const LIQUIDITY: bigint = ethers.parseEther("500000"); // 500 000 lending tokens
  const USER_INITIAL_TOKENS: bigint = ethers.parseEther("1000");

  beforeEach(async function () {
    // - Deploy MockERC20 for collateral token
    [owner, user1, user2] = await hre.ethers.getSigners();

    // - Deploy MockERC20 for collateral token
    const ERC20Factory = await hre.ethers.getContractFactory("MockERC20");
    collateralToken = await ERC20Factory.deploy("Collateral Token", "COL") as MockERC20;

    // - Deploy MockERC20 for lending token
    lendingToken = await ERC20Factory.deploy("Lending Token", "LND") as MockERC20;

    // - Mint tokens to owner
    await collateralToken.mint(owner.address, INITIAL_SUPPLY);
    await lendingToken.mint(owner.address, INITIAL_SUPPLY);

    // - Deploy with correct parameters
    const LBFactory = await hre.ethers.getContractFactory("LendingBorrowing");
    lendingBorrowing = await LBFactory.deploy(
      collateralToken.getAddress(),
      lendingToken.getAddress(),
      COLLATERAL_FACTOR
    ) as LendingBorrowing;

    // - Transfer tokens to users
    await collateralToken.transfer(user1.address, USER_INITIAL_TOKENS);
    await collateralToken.transfer(user2.address, USER_INITIAL_TOKENS);

    // - Transfer lending tokens to contract
    await lendingToken.transfer(
      lendingBorrowing.getAddress(),
      LIQUIDITY
    );
  });

  describe("Contract Deployment", function () {
    it("Should set the correct collateral factor", async function () {
      // - Test collateral factor is set correctly
      expect(await lendingBorrowing.collateralFactor()).to.equal(COLLATERAL_FACTOR);
    });

    it("Should set the correct token addresses", async function () {
      // - Test token addresses are set correctly
      expect(await lendingBorrowing.collateralToken()).to.equal(await collateralToken.getAddress());
      expect(await lendingBorrowing.lendingToken()).to.equal(await lendingToken.getAddress());
    });

    it("Check balance of user1", async function () {
      // - Test user1 has correct collateral token balance
      expect(await collateralToken.balanceOf(user1.address)).to.equal(USER_INITIAL_TOKENS);
    });

    it("Check balance of lendingBorrowing", async function () {
      // - Test contract has correct lending token balance
      expect(await lendingToken.balanceOf(lendingBorrowing.getAddress())).to.equal(LIQUIDITY);
    });
  });

  describe("Collateral Management", function () {
    const depositAmount: bigint = ethers.parseEther("100");

    beforeEach(async function () {
      // - Approve tokens for deposit
      await collateralToken.connect(user1).approve(
        lendingBorrowing.getAddress(),
        depositAmount
      );
    });

    it("Should allow users to deposit collateral", async function () {
      // - Call depositCollateral
      await expect(lendingBorrowing.connect(user1).depositCollateral(depositAmount))
        .to.emit(lendingBorrowing, "CollateralDeposited")
        .withArgs(user1.address, depositAmount);

      // - Verify balance update
      expect(await lendingBorrowing.collateralBalances(user1.address)).to.equal(depositAmount);
    });

    it("Should not allow zero amount deposits", async function () {
      // - Test zero amount deposit should revert
      await expect(lendingBorrowing.connect(user1).depositCollateral(0)).to.be.revertedWith("Amount must be > 0");
    });

    it("Should allow users to withdraw collateral if no active loan", async function () {
      // - Deposit collateral first
      await lendingBorrowing.connect(user1).depositCollateral(depositAmount);

      // - Withdraw collateral
      await expect(lendingBorrowing.connect(user1).withdrawCollateral(depositAmount))
        .to.emit(lendingBorrowing, "CollateralWithdrawn")
        .withArgs(user1.address, depositAmount);

      // - Verify balance update
      expect(await lendingBorrowing.collateralBalances(user1.address)).to.equal(0);
    });

    it("Should not allow withdrawal of locked collateral", async function () {
      // - Deposit collateral
      await lendingBorrowing.connect(user1).depositCollateral(depositAmount);

      // - Take loan
      const loanAmount = ethers.parseEther("40"); // requires 20 collateral under 50 % factor
      await lendingToken.connect(user1).approve(lendingBorrowing.getAddress(), loanAmount); // not required but safe
      await lendingBorrowing.connect(user1).takeLoan(loanAmount);

      // - Try to withdraw locked collateral
      await expect(
        lendingBorrowing.connect(user1).withdrawCollateral(depositAmount)
      ).to.be.revertedWith("Remaining collateral below required minimum");
    });
  });

  describe("Loan Operations", function () {
    const collateralAmount: bigint = ethers.parseEther("100");
    const loanAmount: bigint = ethers.parseEther("40");

    beforeEach(async function () {
      // - Approve collateral tokens
      await collateralToken.connect(user1).approve(
        lendingBorrowing.getAddress(),
        collateralAmount
      );
      // - Deposit collateral
      await lendingBorrowing.connect(user1).depositCollateral(collateralAmount);
    });

    it("Should allow users to take loans within collateral limit", async function () {
      // - Take loan within limit
      await expect(lendingBorrowing.connect(user1).takeLoan(loanAmount))
        .to.emit(lendingBorrowing, "LoanTaken")
        .withArgs(user1.address, loanAmount, collateralAmount * COLLATERAL_FACTOR / 100n);

      // - Verify loan details
      const loan = await lendingBorrowing.getLoanDetails(user1.address);
      expect(loan.amount).to.equal(loanAmount);
      expect(loan.isActive).to.equal(true);
    });

    it("Should not allow loans exceeding collateral limit", async function () {
      // - Test excessive loan should revert
      const excessiveLoan = ethers.parseEther("300"); // needs 150 collateral, >100
      await expect(
        lendingBorrowing.connect(user1).takeLoan(excessiveLoan)
      ).to.be.revertedWith("Insufficient collateral deposited");
    });

    it("Should not allow multiple active loans", async function () {
      // - Take first loan
      await lendingBorrowing.connect(user1).takeLoan(loanAmount);

      // - Try to take second loan
      await expect(
        lendingBorrowing.connect(user1).takeLoan(loanAmount)
      ).to.be.revertedWith("Existing loan active");
    });

    it("Should allow users to repay loans", async function () {
      // - Take loan first
      await lendingBorrowing.connect(user1).takeLoan(loanAmount);

      // - Approve repayment tokens
      await lendingToken.connect(user1).approve(
        lendingBorrowing.getAddress(),
        loanAmount
      );

      // - Repay loan
      await expect(lendingBorrowing.connect(user1).repayLoan(loanAmount))
        .to.emit(lendingBorrowing, "LoanRepaid")
        .withArgs(user1.address, loanAmount);

      // - Verify loan status
      const loan = await lendingBorrowing.getLoanDetails(user1.address);
      expect(loan.isActive).to.equal(false);
      expect(loan.amount).to.equal(0);
    });

    it("Should not allow repayment of non-existent loans", async function () {
      // - Test repaying non-existent loan should revert
      await expect(
        lendingBorrowing.connect(user1).repayLoan(loanAmount)
      ).to.be.revertedWith("No active loan");
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to change collateral factor", async function () {
      // - Call setCollateralFactor as owner
      await lendingBorrowing.connect(owner).setCollateralFactor(60);
      // - Verify factor is updated
      expect(await lendingBorrowing.collateralFactor()).to.equal(60);
    });

    it("Should not allow non-owners to change collateral factor", async function () {
      // - Call setCollateralFactor as non-owner
      await expect(
        lendingBorrowing.connect(user1).setCollateralFactor(70)
      ).to.be.revertedWithCustomError(lendingBorrowing, "OwnableUnauthorizedAccount");
    });

    it("Should not allow collateral factor greater than 100", async function () {
      // - Try to set factor > 100
      await expect(
        lendingBorrowing.connect(owner).setCollateralFactor(150)
      ).to.be.revertedWith("Factor must be 1-100");
    });
  });
});