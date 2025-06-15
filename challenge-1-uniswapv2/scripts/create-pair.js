const { ethers } = require("hardhat");
const hre = require("hardhat");
const { JsonRpcProvider } = require("ethers");
require("dotenv").config();

async function deploy() {
  const [account] = await ethers.getSigners();
  const deployerAddress = account.address;
  console.log(`Deploying contracts using ${deployerAddress}`);

  // // Deploy ERC20
  // console.log("Deploying ERC20...");
  // const uniswapV2ERC20 = await ethers.getContractFactory("UniswapV2ERC20");
  // const uniswapV2ERC20Instance = await uniswapV2ERC20.deploy();
  // await uniswapV2ERC20Instance.waitForDeployment();
  // console.log(
  //   `ERC20 deployed to : ${await uniswapV2ERC20Instance.getAddress()}`
  // );

  // // Get WETH
  // console.log("Deploying WETH...");
  // const wethFactory = await ethers.getContractFactory("WETH");
  // const weth = wethFactory.attach("0x0e9b6D90e50bc5D164ef35E5bA416661F68eb82C");
  // console.log(`WETH got to : ${await weth.getAddress()}`);

  console.log("Deploying First...");
  const firstTokenFactory = await ethers.getContractFactory("MockERC20");
  const firstToken = firstTokenFactory.attach(
    "0xf864e893cbad10b152fd3a1790dd8302036c0a4d"
  );
  console.log(`First token got to : ${await firstToken.getAddress()}`);

  console.log("Deploying Second...");
  const secondTokenFactory = await ethers.getContractFactory("MockERC20");
  const secondToken = secondTokenFactory.attach(
    "0xf0039ac8ce720266326c934cc558eb53a1962f49"
  );
  console.log(`Second token got to : ${await firstToken.getAddress()}`);

  //Get the Factory contract
  console.log("Deploying UniswapV2Factory...");
  const factory = await ethers.getContractFactory("UniswapV2Factory");
  const factoryInstance = factory.attach(
    "0xE5bCCcAb71BF664Ed954C904990a6F3F80b2A9cc"
  );
  console.log(`Factory got to : ${await factoryInstance.getAddress()}`);

  console.log(`Creating pair for First and Second...`);
  const pairTx = await factoryInstance.createPair(
    await firstToken.getAddress(),
    await secondToken.getAddress()
  );
  await pairTx.wait();

  const checkedPair = await factoryInstance.getPair(
    await firstToken.getAddress(),
    await secondToken.getAddress()
  );

  console.log(`Pair created at address: ${checkedPair}`);

  const pairFactory = await ethers.getContractFactory("UniswapV2Pair");
  const pairInstance = pairFactory.attach(checkedPair);

  await firstToken.transfer(
    await pairInstance.getAddress(),
    ethers.parseEther("100")
  );
  await secondToken.transfer(
    await pairInstance.getAddress(),
    ethers.parseEther("70")
  );
  await pairInstance.mint(deployerAddress);

  console.log(
    `Balance of liquidity: ${await pairInstance.balanceOf(deployerAddress)}`
  );
}

deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
