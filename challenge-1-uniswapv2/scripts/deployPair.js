require("dotenv").config();
const { ethers } = require("hardhat");
const hre = require("hardhat");
const { JsonRpcProvider } = require("ethers");

async function deploy() {
  const provider = new JsonRpcProvider(
    "https://testnet-passet-hub-eth-rpc.polkadot.io/"
  );
  const privateKey = process.env.AH_PRIV_KEY;
  const wallet = new ethers.Wallet(privateKey, provider);

  const pairArtifact = await hre.artifacts.readArtifact("UniswapV2Pair");

  const pairFactory = new ethers.ContractFactory(
    pairArtifact.abi,
    pairArtifact.bytecode,
    wallet
  );

  const pair = await pairFactory.deploy();
  console.log(`Pair deployed to: ${await pair.getAddress()}`);
}

deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
