// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const LendingBorrowingModule = buildModule('LendingBorrowingModule', (m) => {

    const collateralToken = m.getParameter('collateralToken', '0x9506A23C9E5C160CBCC2E7681ADE2e6C78157770');
    const lendingToken = m.getParameter('lendingToken', '0x9FBD5A1b99569c346CB1cAaFb780d4a1a9DFfe37');
    const collateralFactor = m.getParameter('collateralFactor', 50);

    const lendingBorrowing = m.contract('LendingBorrowing', [collateralToken, lendingToken, collateralFactor], { id: 'LendingBorrowing' });

    return { lendingBorrowing };
});

export default LendingBorrowingModule;


