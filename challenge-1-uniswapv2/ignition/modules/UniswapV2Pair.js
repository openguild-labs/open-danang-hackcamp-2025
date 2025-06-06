const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const UniswapV2PairModule = buildModule("UniswapV2PairModule", (m) => {
  console.log("Deploying UniswapV2PairModule...");

  const weth = m.contractAt(
    "WETH",
    "0x0eb09a1b25EC457f442E5F4F84591F94B9d6B846"
  );

  const harryToken = m.contractAt(
    "UniswapV2ERC20",
    "0x2cD71Fb0600627757b212bd174B9FE3F315E9786"
  );

  const factory = m.contractAt(
    "UniswapV2Factory",
    // "0xabD36F22729543D7A43b6E044d17F51201ACd326"
    "0x2421575005CA2340D6Cc80E568E8622a07Bfd170"
  );

  console.log("Creating UniswapV2Pair contract...");

  const pair = m.call(factory, "createPair", [
    harryToken.address,
    weth.address,
  ]);

  return {
    pair,
  };
});

module.exports = UniswapV2PairModule;
