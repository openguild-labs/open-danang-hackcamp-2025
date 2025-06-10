const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const UniswapV2ERC20Module = buildModule("UniswapV2ERC20Module", (m) => {
  const token = m.contract("UniswapV2ERC20", [], { solidityVersion: "0.8.19" });

  return {
    token,
  };
});

module.exports = UniswapV2ERC20Module;
