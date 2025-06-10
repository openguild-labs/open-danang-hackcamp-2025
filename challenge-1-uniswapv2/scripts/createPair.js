require("dotenv").config();
const { ethers } = require("hardhat");
const hre = require("hardhat");
const { JsonRpcProvider } = require("ethers");

async function createPair() {
  const [signer] = await ethers.getSigners();
  const factoryAddress = "0x9793abb16089e263fccefbe62386901a71a81fc9";
  const tokenAddress = "0x78718af494f756d50a05b6bc541c2afb01ecb85f";
  const wethAddress = "0x1b81f613852b3659f1f6a50121ba3719bb7b187a";
  const factoryArtifact = await hre.artifacts.readArtifact("UniswapV2Factory");
  const factory = await ethers.getContractAt(
    factoryArtifact.abi,
    factoryAddress,
    signer
  );

  const pairTx = await factory.createPair(tokenAddress, wethAddress);
  await pairTx.wait();

  const PairAddress = await factory.getPair(tokenAddress, wethAddress);

  console.log(`Pair created at address: ${PairAddress}`);
}

createPair()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
