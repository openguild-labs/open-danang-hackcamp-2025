import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const collateralToken = await MockERC20.attach(
    "0x5687F0A7AD0a66A1EBF6Bc3924A00E5416ED3ebB"
  );

  const lendingToken = await MockERC20.attach(
    "0x9d25c235D90F54181e6577E7E9bf8205bBB24692"
  );

  // Deploy LendingBorrowing contract
  const LendingBorrowing = await ethers.getContractFactory("LendingBorrowing");
  const lendingBorrowing = await LendingBorrowing.attach(
    "0x8CA10E7a97a24907CC98F22e58bB74280DB76dDE"
  );

  // console.log(
  //   "balance collateral token of deployer:",
  //   await collateralToken.balanceOf(deployer.address)
  // );
  // console.log(
  //   "balance collateral token of lending:",
  //   await collateralToken.balanceOf(deployer.address)
  // );

  // console.log("Approving collateral token for lendingBorrowing contract...");

  // const approvalTx = await collateralToken.approve(
  //   await lendingBorrowing.getAddress(),
  //   ethers.parseEther("111")
  // );
  // await approvalTx.wait();

  // console.log("Depositing collateral...");

  // const depositTx = await lendingBorrowing.depositCollateral(
  //   ethers.parseEther("111")
  // );
  // await depositTx.wait();

  // console.log(
  //   "balance collateral token of deployer:",
  //   await collateralToken.balanceOf(deployer.address)
  // );
  // console.log(
  //   "balance collateral token of lending:",
  //   await collateralToken.balanceOf(deployer.address)
  // );
  // console.log("Collateral deposited successfully");

  console.log("loan details: ", await lendingBorrowing.loans(deployer.address));

  console.log(
    "balance lending token of deployer:",
    await lendingToken.balanceOf(deployer.address)
  );

  console.log(
    "balance lending token of lending:",
    await lendingToken.balanceOf(await lendingBorrowing.getAddress())
  );

  // await lendingToken.mint(
  //   await lendingBorrowing.getAddress(),
  //   ethers.parseEther("100000000000000000")
  // );

  console.log(
    "balance lending token of lending:",
    await lendingToken.balanceOf(await lendingBorrowing.getAddress())
  );

  console.log("Taking a loan...");

  // const borrowTx = await lendingBorrowing.takeLoan(ethers.parseEther("10"));
  // await borrowTx.wait();

  console.log("loan details: ", await lendingBorrowing.loans(deployer.address));
  // console.log(
  //   "balance lending token of deployer:",
  //   await lendingToken.balanceOf(deployer.address)
  // );

  // console.log("Approving lending token for lendingBorrowing contract...");
  // const approvalLendingTx = await lendingToken.approve(
  //   await lendingBorrowing.getAddress(),
  //   ethers.parseEther("10")
  // );

  // await approvalLendingTx.wait();

  // console.log("Repaying the loan...");

  // const repayTx = await lendingBorrowing.repayLoan(ethers.parseEther("10"));
  // await repayTx.wait();
  // console.log("Loan repaid successfully");
  // console.log(
  //   "balance lending token of deployer:",
  //   await lendingToken.balanceOf(deployer.address)
  // );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
