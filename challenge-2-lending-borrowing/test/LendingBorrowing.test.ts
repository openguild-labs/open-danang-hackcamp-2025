import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import hre from "hardhat";
import { LendingBorrowing, MockERC20 } from "../typechain-types";

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

    console.log("Owner address:", owner.address);
    console.log("User1 address:", user1.address);
    console.log("User2 address:", user2.address);

    const MyTokenFactory = await ethers.getContractFactory("MockERC20");

    const collateralTokenInstance = await MyTokenFactory.deploy(
      "Collateral Token",
      "HARRY"
    );
    collateralToken = await collateralTokenInstance.waitForDeployment();

    const lendingTokenInstance = await MyTokenFactory.deploy(
      "Lending Token",
      "HARRY-LEND"
    );
    lendingToken = await lendingTokenInstance.waitForDeployment();

    await collateralToken.mint(owner.address, INITIAL_SUPPLY);
    await lendingToken.mint(owner.address, INITIAL_SUPPLY);

    const LendingBorrowingFactory = await ethers.getContractFactory(
      "LendingBorrowing"
    );
    const lendingBorrowingInstance = await LendingBorrowingFactory.deploy(
      await collateralToken.getAddress(),
      await lendingToken.getAddress(),
      COLLATERAL_FACTOR
    );

    lendingBorrowing = await lendingBorrowingInstance.waitForDeployment();

    await collateralToken.transfer(user1.address, ethers.parseEther("100"));
    await collateralToken.transfer(user2.address, ethers.parseEther("100"));
    await lendingToken.transfer(
      await lendingBorrowing.getAddress(),
      INITIAL_SUPPLY
    );
  });

  describe("Contract Deployment", function () {
    it("Should set the correct collateral factor", async function () {
      const factor = await lendingBorrowing.collateralFactor();
      expect(factor).to.equal(COLLATERAL_FACTOR);
    });

    it("Should set the correct token addresses", async function () {
      const collateralAddress = await lendingBorrowing.collateralToken();
      expect(collateralAddress).to.equal(await collateralToken.getAddress());

      const lendingAddress = await lendingBorrowing.lendingToken();
      expect(lendingAddress).to.equal(await lendingToken.getAddress());
    });

    it("Check balance of user1", async function () {
      const user1Balance = await collateralToken.balanceOf(user1.address);
      expect(user1Balance).to.equal(ethers.parseEther("100"));
    });

    it("Check balance of lendingBorrowing", async function () {
      const contractBalance = await lendingToken.balanceOf(
        await lendingBorrowing.getAddress()
      );
      expect(contractBalance).to.equal(INITIAL_SUPPLY);
    });
  });

  describe("Collateral Management", function () {
    const depositAmount: bigint = ethers.parseUnits("100", 18);

    beforeEach(async function () {
      await collateralToken
        .connect(user1)
        .approve(await lendingBorrowing.getAddress(), depositAmount);

      await collateralToken
        .connect(user2)
        .approve(await lendingBorrowing.getAddress(), depositAmount);
    });

    it("Should allow users to deposit collateral", async function () {
      await expect(
        lendingBorrowing.connect(user1).depositCollateral(depositAmount)
      )
        .to.emit(lendingBorrowing, "CollateralDeposited")
        .withArgs(user1.address, depositAmount);

      const user1Balance = await lendingBorrowing.collateralBalances(
        user1.address
      );
      expect(user1Balance).to.equal(depositAmount);

      const contractBalance = await collateralToken.balanceOf(
        await lendingBorrowing.getAddress()
      );
      expect(contractBalance).to.equal(depositAmount);
    });

    it("Should not allow zero amount deposits", async function () {
      await expect(
        lendingBorrowing.connect(user1).depositCollateral(0)
      ).to.be.revertedWith("Deposit amount must be greater than zero");
    });

    it("Should allow users to withdraw collateral if no active loan", async function () {
      await lendingBorrowing.connect(user1).depositCollateral(depositAmount);
      await expect(
        lendingBorrowing.connect(user1).withdrawCollateral(depositAmount)
      )
        .to.emit(lendingBorrowing, "CollateralWithdrawn")
        .withArgs(user1.address, depositAmount);

      const user1Balance = await lendingBorrowing.collateralBalances(
        user1.address
      );
      expect(user1Balance).to.equal(0n);

      const contractBalance = await collateralToken.balanceOf(
        await lendingBorrowing.getAddress()
      );
      expect(contractBalance).to.equal(0n);
    });

    it("Should not allow withdrawal of locked collateral", async function () {
      await lendingBorrowing.connect(user1).depositCollateral(depositAmount);

      const loanAmount = (depositAmount * COLLATERAL_FACTOR) / 100n;
      await lendingBorrowing.connect(user1).takeLoan(loanAmount);

      await expect(
        lendingBorrowing.connect(user1).withdrawCollateral(depositAmount)
      ).to.be.revertedWith("Cannot withdraw locked collateral");
    });
  });

  describe("Loan Operations", function () {
    const collateralAmount: bigint = ethers.parseEther("100");
    const loanAmount: bigint = ethers.parseEther("40");

    beforeEach(async function () {
      await collateralToken
        .connect(user1)
        .approve(await lendingBorrowing.getAddress(), collateralAmount);
      await lendingBorrowing.connect(user1).depositCollateral(collateralAmount);
    });

    it("Should allow users to take loans within collateral limit", async function () {
      await expect(lendingBorrowing.connect(user1).takeLoan(loanAmount))
        .to.emit(lendingBorrowing, "LoanTaken")
        .withArgs(user1.address, loanAmount);
      const loanDetails = await lendingBorrowing.loans(user1.address);
      expect(loanDetails.amount).to.equal(loanAmount);
      expect(loanDetails.isActive).to.equal(true);
      const expectedCollateral = (loanAmount * 100n) / COLLATERAL_FACTOR;
      expect(loanDetails.collateral).to.equal(expectedCollateral);
    });

    it("Should not allow loans exceeding collateral limit", async function () {
      const excessiveLoanAmount =
        (collateralAmount * COLLATERAL_FACTOR) / 100n + 1n;
      await expect(
        lendingBorrowing.connect(user1).takeLoan(excessiveLoanAmount)
      ).to.be.revertedWith("Insufficient collateral for loan");
    });

    it("Should not allow multiple active loans", async function () {
      await lendingBorrowing.connect(user1).takeLoan(loanAmount);
      await expect(
        lendingBorrowing.connect(user1).takeLoan(loanAmount)
      ).to.be.revertedWith("Existing loan must be repaid first");
    });

    it("Should allow users to repay loans", async function () {
      await lendingBorrowing.connect(user1).takeLoan(loanAmount);

      await lendingToken
        .connect(user1)
        .approve(await lendingBorrowing.getAddress(), loanAmount);

      await expect(lendingBorrowing.connect(user1).repayLoan(loanAmount))
        .to.emit(lendingBorrowing, "LoanRepaid")
        .withArgs(user1.address, loanAmount);

      const loanDetails = await lendingBorrowing.loans(user1.address);
      expect(loanDetails.amount).to.equal(0n);
      expect(loanDetails.isActive).to.equal(false);

      const userCollateral = await lendingBorrowing.collateralBalances(
        user1.address
      );
      expect(userCollateral).to.equal(collateralAmount);

      const contractBalance = await lendingToken.balanceOf(
        await lendingBorrowing.getAddress()
      );
      expect(contractBalance).to.equal(INITIAL_SUPPLY + loanAmount);
    });

    it("Should not allow repayment of non-existent loans", async function () {
      await expect(
        lendingBorrowing.connect(user1).repayLoan(loanAmount)
      ).to.be.revertedWith("No active loan found for user");
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to change collateral factor", async function () {
      await lendingBorrowing.connect(owner).setCollateralFactor(75n);
      const newFactor = await lendingBorrowing.collateralFactor();
      expect(newFactor).to.equal(75n);
    });

    it("Should not allow non-owners to change collateral factor", async function () {
      await expect(lendingBorrowing.connect(user1).setCollateralFactor(75n))
        .to.be.revertedWithCustomError(
          lendingBorrowing,
          "OwnableUnauthorizedAccount"
        )
        .withArgs(user1.address);
    });

    it("Should not allow collateral factor greater than 100", async function () {
      await expect(
        lendingBorrowing.connect(owner).setCollateralFactor(101n)
      ).to.be.revertedWith("Collateral factor must not exceed 100%");
    });
  });
});
