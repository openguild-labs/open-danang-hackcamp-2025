## Challenge details

A decentralized lending and borrowing protocol built on Polkadot Asset Hub that enables users to lend their assets and borrow against their collateral, leveraging Polkadot's cross-chain capabilities and security features.

## Functional Specifications

- Collateral System : Users can deposit tokens as collateral, withdraw them when not locked in a loan, and use this collateral to secure their borrowing needs.

- Lending System : Users can borrow tokens against their collateral up to a limit determined by the collateral factor, with the restriction of having only one active loan at a time.

- Repayment System: Users can repay their loans either partially or in full, with the loan status automatically updating to reflect the current repayment state.

## Implementation Smart Contract Requirements

Link contract: [Contract](./contracts)

### 1. Core Functions

- [x] **depositCollateral**: Implement collateral deposit logic

- [x] **withdrawCollateral**: Implement collateral withdrawal logic

- [x] **takeLoan**: Implement loan taking logic

- [x] **repayLoan**: Implement loan repayment logic

### 2. Helper Functions

- [x] **\_loanRequiredCollateral**: Implement required collateral calculation

- [x] **getLoanDetails**: Implement loan information retrieval

### 3. Admin Functions

- [x] **setCollateralFactor**: Implement collateral factor update

### 4. Tests

- [ ] Test all function implementations

## Implementation UI Requirements

Link UI sample: [DOT UI](./frontend)

Build the UI with features based on the requirements:

- [ ] **Deposit/Withdraw Collateral**
- [ ] **Loan and Repay**
- [ ] **Show loan details**

## Submission Requirements

- [ ] Finish `TODO` smart contract logic
- [ ] Complete UI
- [ ] Run tests
- [ ] Deploy to Paseo Asset Hub
