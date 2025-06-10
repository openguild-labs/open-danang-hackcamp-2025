const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const UniswapV2PairModule = buildModule("UniswapV2PairModule", (m) => {
  const factory = m.contractAt(
    "UniswapV2Factory",
    "0x9793abb16089e263FccEFbe62386901A71A81FC9"
  );
  const weth = m.contractAt(
    "WETH",
    "0x1B81f613852B3659F1F6a50121ba3719Bb7B187A"
  );
  const token = m.contractAt(
    "UniswapV2ERC20",
    "0x78718AF494F756D50A05B6bc541C2AfB01eCb85f"
  );

  const pair = m.call(factory, "createPair", [token.address, weth.address]);

  return {
    pair,
  };
});

module.exports = UniswapV2PairModule;
