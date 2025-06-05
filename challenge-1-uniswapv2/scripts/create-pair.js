const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  // const Factory = await hre.ethers.getContractFactory("UniswapV2Factory");
  // const factory = Factory.attach("0xabD36F22729543D7A43b6E044d17F51201ACd326");

  const factory = await hre.ethers.getContractAt(
    "UniswapV2Factory",
    "0xabD36F22729543D7A43b6E044d17F51201ACd326"
  );

  console.log("Creating UniswapV2Pair contract...");
  const pairTx = await factory.connect(deployer).createPair(
    "0x2cD71Fb0600627757b212bd174B9FE3F315E9786", // HarryToken address
    "0x0eb09a1b25EC457f442E5F4F84591F94B9d6B846" //  WETH address
  );

  await pairTx.wait();

  console.log(`UniswapV2Pair contract created at: ${pair}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
