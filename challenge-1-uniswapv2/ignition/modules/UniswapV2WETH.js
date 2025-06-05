const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const UniswapV2WETHModule = buildModule("UniswapV2WETHModule", (m) => {
  console.log("Deploying UniswapV2WETHModule...");

  const deployer = m.getAccount(0);

  console.log("Deploying WETH contract...");

  // Deploying the WETH contract
  const weth = m.contract("WETH", []);

  return {
    weth,
  };
});

module.exports = UniswapV2WETHModule;
