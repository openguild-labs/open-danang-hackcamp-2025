const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const UniswapV2ERC20Module = buildModule("UniswapV2ERC20Module", (m) => {
  console.log("Deploying UniswapV2ERC20Module...");

  const deployer = m.getAccount(0);

  console.log("Deploying UniswapV2ERC20 contract...");

  // Deploying the UniswapV2ERC20 contract for the Harry token
  const harryToken = m.contract("UniswapV2ERC20", []);

  return {
    harryToken,
  };
});

module.exports = UniswapV2ERC20Module;
