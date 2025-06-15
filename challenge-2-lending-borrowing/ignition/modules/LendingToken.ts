// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LendingTokenModule = buildModule("LendingTokenModule", (m) => {
  const initialSupply = m.getParameter(
    "initialSupply",
    1_000_000n * 10n ** 18n
  );
  const name = m.getParameter("name", "HARRY_LendingToken");
  const symbol = m.getParameter("symbol", "HLTK");

  const lendingToken = m.contract("MockERC20", [initialSupply, name, symbol], {
    id: "LendingToken",
  });

  return { lendingToken };
});

export default LendingTokenModule;
