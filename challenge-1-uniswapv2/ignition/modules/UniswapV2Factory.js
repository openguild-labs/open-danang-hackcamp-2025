const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const UniswapV2FactoryModule = buildModule("UniswapV2FactoryModule", (m) => {
  console.log("Deploying UniswapV2FactoryModule...");

  const deployer = m.getAccount(0);

  console.log("Deploying UniswapV2Factory contract...");

  // Deploying the UniswapV2Factory contract with the deployer account
  const factory = m.contract("UniswapV2Factory", [deployer]);

  return { factory };
});

module.exports = UniswapV2FactoryModule;
