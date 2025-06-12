// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const CollateralTokenModule = buildModule('CollateralTokenModule', (m) => {
    const name = m.getParameter('name', 'CollateralToken');
    const symbol = m.getParameter('symbol', 'CTK');

    const collateralToken = m.contract('MyToken', [name, symbol], { id: 'CollateralToken' });


    return { collateralToken };
});


export default CollateralTokenModule;
