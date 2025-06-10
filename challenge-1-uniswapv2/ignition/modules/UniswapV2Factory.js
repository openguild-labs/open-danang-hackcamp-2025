const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const UniswapV2FactoryModule = buildModule("UniswapV2FactoryModule", (m) => {
  const deployer = m.getAccount(0);

  const factory = m.contract("UniswapV2Factory", [deployer]);

  return {
    factory,
  };
});

module.exports = UniswapV2FactoryModule;
