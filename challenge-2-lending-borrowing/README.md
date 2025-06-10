# DeFi Lending & Borrowing DApp

A decentralized lending and borrowing application built for the Polkadot ecosystem, deployed on Paseo Asset Hub.

## Features

- **Deposit Collateral**: Users can deposit tokens as collateral
- **Withdraw Collateral**: Withdraw unused collateral (if not backing a loan)
- **Take Loan**: Borrow tokens against deposited collateral (150% collateralization ratio)
- **Repay Loan**: Pay back borrowed amount to unlock collateral
- **Admin Controls**: Owner can adjust collateral factor

## Installation & Setup

### Prerequisites
- Node.js (v20 or higher)
- pnpm or npm
- Git

### Step-by-Step Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ajiguruhprasetyo/open-danang-hackcamp-2025.git
   cd challenge-2-lending-borrowing
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Then edit the `.env` file and add your private key:
   ```bash
   # Private key for deployment (without 0x prefix)
   PRIVATE_KEY=your_private_key_here
   
   # Gas reporting
   REPORT_GAS=true
   
   # Network URLs
   PASEO_RPC_URL=https://testnet-passet-hub-eth-rpc.polkadot.io/
   ```

4. **Compile smart contracts**
   ```bash
   pnpm run compile
   # or
   npm run compile
   ```

5. **Run unit tests**
   ```bash
   pnpm test
   # or
   npm test
   ```

6. **Start local development node (optional)**
   ```bash
   # In one terminal
   pnpm run node
   
   # In another terminal, deploy locally
   pnpm run deploy:local
   ```

## Network Information

- **Network Name**: Paseo Asset Hub
- **RPC URL**: https://testnet-passet-hub-eth-rpc.polkadot.io/
- **Chain ID**: 420420421 
- **Explorer**: https://blockscout-passet-hub.parity-testnet.parity.io/
- **Faucet**: https://faucet.polkadot.io/?parachain=1111

## Smart Contract Development

### Compile Contracts
```bash
pnpm run compile
```

### Run Tests
```bash
pnpm test
```

### Test Coverage
The test suite includes:
- ✅ Contract deployment verification
- ✅ Collateral deposit and withdrawal
- ✅ Loan creation and repayment
- ✅ Admin function testing
- ✅ Error condition validation
- ✅ Event emission verification

### Deploy to Local Network
```bash
# Start local node
pnpm run node

# Deploy (in another terminal)
pnpm run deploy:local
```

### Deploy to Paseo Asset Hub
```bash
pnpm run deploy
```

## Frontend Development

### Start Development Server
```bash
pnpm run dev
```

### Build for Production
```bash
pnpm run build
```

## Project Structure

```
challenge-2-lending-borrowing/
├── contracts/              # Smart contracts
│   ├── LendingBorrowing.sol # Main lending contract
│   └── MyToken.sol         # Mock ERC20 token
├── test/                   # Test files
│   └── LendingBorrowing.test.js
├── scripts/                # Deployment scripts
│   └── deploy.js
├── src/                    # Frontend source code
├── hardhat.config.ts       # Hardhat configuration
├── .env.example           # Environment variables template
└── README.md              # This file
```

## Available Scripts

```bash
# Smart Contract Development
pnpm run compile         # Compile contracts
pnpm test               # Run unit tests
pnpm run deploy         # Deploy to Paseo Asset Hub
pnpm run deploy:local   # Deploy to local network
pnpm run node          # Start local Hardhat node

# Frontend Development
pnpm run dev           # Start development server
pnpm run build         # Build for production
```

## Contract Functions

### Core Functions
- `depositCollateral(uint256 amount)` - Deposit collateral tokens
- `withdrawCollateral(uint256 amount)` - Withdraw collateral tokens
- `takeLoan(uint256 loanAmount)` - Take a loan against collateral
- `repayLoan()` - Repay the active loan

### View Functions
- `getLoanDetails(address user)` - Get user's loan information
- `getCollateralBalance(address user)` - Get user's collateral balance
- `getAvailableLiquidity()` - Get available loan tokens in contract

### Admin Functions
- `setCollateralFactor(uint256 factor)` - Update collateralization ratio

## Testing

The test suite covers:
- Deployment and initialization
- Collateral deposit and withdrawal
- Loan taking and repayment
- Admin functions
- Edge cases and error conditions

Run tests with:
```bash
npm test
```

### Running Tests Step by Step

1. **Ensure all dependencies are installed**
   ```bash
   pnpm install
   ```

2. **Compile contracts first**
   ```bash
   pnpm run compile
   ```

3. **Run the test suite**
   ```bash
   pnpm test
   ```

4. **View detailed test output**
   ```bash
   pnpm test --verbose
   ```

## Usage

1. **Connect Wallet**: Connect your MetaMask wallet to Paseo Asset Hub
2. **Get Test Tokens**: Use the faucet to get test tokens
3. **Deposit Collateral**: Deposit tokens to use as collateral
4. **Take Loan**: Borrow up to 66% of your collateral value
5. **Repay Loan**: Pay back borrowed amount to unlock collateral

## Troubleshooting

### Common Issues

1. **"Invalid Transaction" errors in tests**
   - Ensure contracts are compiled: `pnpm run compile`
   - Check that all dependencies are installed

2. **Gas estimation errors**
   - The contracts are optimized for Polkadot's gas model
   - Local testing uses higher gas limits

3. **Private key errors**
   - Ensure `.env` file exists with valid `PRIVATE_KEY`
   - Private key should be without `0x` prefix

### Getting Test Tokens

For Paseo Asset Hub testing:
1. Visit the faucet: https://faucet.polkadot.io/?parachain=1111
2. Connect your wallet
3. Request test tokens

## Security Features

- ReentrancyGuard protection
- Ownable access controls
- Proper collateralization checks
- SafeERC20 token transfers

## License

ISC License



