const { ethers } = require("hardhat");
const hre = require("hardhat");
const { JsonRpcProvider } = require("ethers");
require("dotenv").config();

async function deploy() {
  const [account] = await ethers.getSigners();
  deployerAddress = account.address;
  console.log(`Deploying contracts using ${deployerAddress}`);

  // Deploy ERC20
  console.log("Deploying HarryToken...");
  const uniswapV2ERC20 = await ethers.getContractFactory("UniswapV2ERC20");
  const uniswapV2ERC20Instance = await uniswapV2ERC20.deploy();
  await uniswapV2ERC20Instance.waitForDeployment();
  console.log(
    `HarryToken deployed to : ${await uniswapV2ERC20Instance.getAddress()}`
  );

  // DEploy WETH
  console.log("Deploying WETH...");
  const wethFactory = await ethers.getContractFactory("WETH");
  const weth = await wethFactory.deploy();
  await weth.waitForDeployment();
  console.log(`WETH deployed to : ${await weth.getAddress()}`);

  //Deploy Factory
  console.log("Deploying UniswapV2Factory...");
  const factory = await ethers.getContractFactory("UniswapV2Factory");
  const factoryInstance = await factory.deploy(deployerAddress);
  await factoryInstance.waitForDeployment();
  console.log(`Factory deployed to : ${await factoryInstance.getAddress()}`);

  // Deploy Pair using JsonRpcProvider to bypass size limits
  console.log("Deploying UniswapV2Pair...");

  const networkName = hre.network.name;
  const networkConfig = hre.config.networks[networkName];
  const rpcUrl = networkConfig.url || "http://localhost:8545";

  console.log(`Using RPC URL: ${rpcUrl}`);

  const provider = new JsonRpcProvider(rpcUrl);

  const pairArtifact = await hre.artifacts.readArtifact("UniswapV2Pair");

  let privateKey;
  if (networkName === "localNode") {
    privateKey = process.env.LOCAL_PRIV_KEY;
  }
  if (networkName === "paseoAssetHub") {
    privateKey = process.env.AH_PRIV_KEY;
  }

  const wallet = new ethers.Wallet(privateKey, provider);

  const pairFactory = new ethers.ContractFactory(
    pairArtifact.abi,
    pairArtifact.bytecode,
    wallet
  );

  const pairInstance = await pairFactory.deploy();
  console.log(`Pair deployed to : ${await pairInstance.getAddress()}`);

  console.log(`Creating pair for WETH and ERC20...`);
  const pairTx = await factoryInstance.createPair(
    await uniswapV2ERC20Instance.getAddress(),
    await weth.getAddress()
  );
  await pairTx.wait();

  const checkedPair = await factoryInstance.getPair(
    await uniswapV2ERC20Instance.getAddress(),
    await weth.getAddress()
  );

  console.log(`Pair created at address: ${checkedPair}`);
}

deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
