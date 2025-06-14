// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const CollateralTokenModule = buildModule('CollateralTokenModule', (m) => {
    const initialSupply = m.getParameter('initialSupply', 1_000_000n * 10n ** 18n);
    const name = m.getParameter('name', 'CollateralToken');
    const symbol = m.getParameter('symbol', 'CTK');

    const collateralToken = m.contract('MockERC20', [name, symbol], { id: 'CollateralToken' });

    const owner = m.getAccount(0);
    m.call(collateralToken, 'mint', [owner, initialSupply]);

    return { collateralToken };
});
    

export default CollateralTokenModule;
