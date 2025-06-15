const { ethers } = require("hardhat");
const hre = require("hardhat");
const { JsonRpcProvider } = require("ethers");
require("dotenv").config();

async function deploy_erc20() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  const erc20Factory = await ethers.getContractFactory("MockERC20");
  const erc20 = await erc20Factory.attach(
    "0xf864e893cbad10b152fd3a1790dd8302036c0a4d"
  );
  console.log(await erc20.balanceOf(deployer.address));

  console.log({
    address: "0x3C157e371F68D4189Eca81fE34DFc19e594806aA",
    amount: ethers.parseEther("111"),
  });

  const approveTx = await erc20.approve(
    "0x3C157e371F68D4189Eca81fE34DFc19e594806aA",
    ethers.parseEther("111")
  );

  console.log("Approve transaction:", approveTx.hash);
  console.log(approveTx);
  const response = await approveTx.wait();
  console.log("Transaction confirmed in block:", response.blockNumber);
  console.log(response);

  // for (let i = 0; i < 3; i++) {
  //   const erc20 = await erc20Factory.deploy(`Token-${i + 1}`, `T-${i + 1}`);
  //   await erc20.waitForDeployment();
  //   console.log(
  //     `Deployed MockERC20 Token-${i + 1} at address:`,
  //     await erc20.getAddress()
  //   );
  //   await erc20.mint(await deployer.getAddress(), ethers.parseEther("1000000"));
  // }
}

deploy_erc20()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
