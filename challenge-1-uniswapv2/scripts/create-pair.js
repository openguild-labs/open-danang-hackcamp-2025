const { ethers } = require("hardhat");
const hre = require("hardhat");
const { JsonRpcProvider } = require("ethers");
require("dotenv").config();

async function deploy() {
  const [account] = await ethers.getSigners();
  deployerAddress = account.address;
  console.log(`Deploying contracts using ${deployerAddress}`);

  // Deploy ERC20
  console.log("Deploying ERC20...");
  const uniswapV2ERC20 = await ethers.getContractFactory("UniswapV2ERC20");
  const uniswapV2ERC20Instance = await uniswapV2ERC20.deploy();
  await uniswapV2ERC20Instance.waitForDeployment();
  console.log(
    `ERC20 deployed to : ${await uniswapV2ERC20Instance.getAddress()}`
  );

  // Get WETH
  console.log("Deploying WETH...");
  const wethFactory = await ethers.getContractFactory("WETH");
  const weth = wethFactory.attach("0x0e9b6D90e50bc5D164ef35E5bA416661F68eb82C");
  console.log(`WETH got to : ${await weth.getAddress()}`);

  //Get the Factory contract
  console.log("Deploying UniswapV2Factory...");
  const factory = await ethers.getContractFactory("UniswapV2Factory");
  const factoryInstance = factory.attach(
    "0xE5bCCcAb71BF664Ed954C904990a6F3F80b2A9cc"
  );
  console.log(`Factory got to : ${await factoryInstance.getAddress()}`);

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
