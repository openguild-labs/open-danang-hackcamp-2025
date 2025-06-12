// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const LendingTokenModule = buildModule('LendingTokenModule', (m) => {
    const name = m.getParameter('name', 'LendingToken');
    const symbol = m.getParameter('symbol', 'LTK');

    const lendingToken = m.contract('MyToken', [name, symbol], { id: 'LendingToken' });

    return { lendingToken };
});


export default LendingTokenModule;

