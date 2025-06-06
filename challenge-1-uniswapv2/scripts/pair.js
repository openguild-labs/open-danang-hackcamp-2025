const { ethers } = require("hardhat");
const hre = require("hardhat");
const { JsonRpcProvider } = require("ethers");
require("dotenv").config();

async function deploy() {
  const [account] = await ethers.getSigners();
  deployerAddress = account.address;
  console.log(`Deploying contracts using ${deployerAddress}`);

  const pairFactory = await ethers.getContractFactory("UniswapV2Pair");

  const pairInstance = pairFactory.attach(
    "0x91c5D624Fa83969fc3750d50D3c19F683d158A52"
  );

  console.log(`Pair got to : ${await pairInstance.getAddress()}`);

  const token0 = await pairInstance.token0();
  const token1 = await pairInstance.token1();

  console.log("Pair details:");
  console.log(`Token0: ${token0}`);
  console.log(`Token1: ${token1}`);
}

deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
