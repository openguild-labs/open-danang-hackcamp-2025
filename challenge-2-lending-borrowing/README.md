
## Challenge details
A decentralized lending and borrowing protocol built on Polkadot Asset Hub that enables users to lend their assets and borrow against their collateral, leveraging Polkadot's cross-chain capabilities and security features.

## Functional Specifications 

+ Collateral System : Users can deposit tokens as collateral, withdraw them when not locked in a loan, and use this collateral to secure their borrowing needs.

+ Lending System : Users can borrow tokens against their collateral up to a limit determined by the collateral factor, with the restriction of having only one active loan at a time.

+ Repayment System: Users can repay their loans either partially or in full, with the loan status automatically updating to reflect the current repayment state.


## Implementation Smart Contract Requirements

Link contract: [Contract](./contracts)

### 1. Core Functions

- [ ] **depositCollateral**: Implement collateral deposit logic

- [ ] **withdrawCollateral**: Implement collateral withdrawal logic

- [ ] **takeLoan**: Implement loan taking logic

- [ ] **repayLoan**: Implement loan repayment logic

### 2. Helper Functions

- [ ] **_loanRequiredCollateral**: Implement required collateral calculation

- [ ] **getLoanDetails**: Implement loan information retrieval

### 3. Admin Functions

- [ ] **setCollateralFactor**: Implement collateral factor update

### 4. Tests 
- [ ] Test all function implementations

## Implementation UI Requirements 

Link UI sample: [DOT UI](./frontend)

Build the UI with features based on the requirements:

- [ ] **Deposit/Withdraw Collateral**
- [ ] **Loan and Repay**
- [ ] **Show loan details**

## Network Info

| Property | Value |
|----------|--------|
| Network Name | Paseo Asset Hub |
| RPC URL | https://testnet-passet-hub-eth-rpc.polkadot.io/ |
| Chain ID | 0x190f1b45 |
| Explorer | https://blockscout-passet-hub.parity-testnet.parity.io/ |
| Faucet | https://faucet.polkadot.io/?parachain=1111 |

## Submission Requirements 
- [ ] Finish `TODO` smart contract logic
- [ ] Complete UI 
- [ ] Run tests 
- [ ] Deploy to Paseo Asset Hub 


