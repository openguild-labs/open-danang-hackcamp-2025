const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const UniswapV2WETHModule = buildModule("UniswapV2WETHModule", (m) => {
  const weth = m.contract("WETH", []);

  return {
    weth,
  };
});

module.exports = UniswapV2WETHModule;
