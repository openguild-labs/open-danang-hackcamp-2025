// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CollateralTokenModule = buildModule("CollateralTokenModule", (m) => {
  const initialSupply = m.getParameter(
    "initialSupply",
    1_000_000n * 10n ** 18n
  );
  const name = m.getParameter("name", "HARRY_CollateralToken");
  const symbol = m.getParameter("symbol", "HCTK");

  const collateralToken = m.contract(
    "MockERC20",
    [initialSupply, name, symbol],
    {
      id: "CollateralToken",
    }
  );

  return { collateralToken };
});

export default CollateralTokenModule;
