# DOT UI Kit

An open-source, up-to-date, opinionated UI scaffolding kit for the Polkadot ecosystem (starting with Asset Hub). The technical stack is:

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide icons](https://lucide.dev/)
- [ShadCN UI](https://ui.shadcn.com/)
- [RainbowKit](https://www.rainbowkit.com/)
- [Wagmi](https://wagmi.sh/)
- [Viem](https://viem.sh/)
- [Jotai](https://jotai.org/)
- [Tanstack React Query](https://tanstack.com/query)
- [Vaul](https://vaul.fun/)
- [Zod](https://zod.dev/)
- [React Hook Form](https://react-hook-form.com/)

## Features

- [x] Multi-chain support
- [x] In-dapp-wallet support
- [x] WalletConnect support
- [x] Collection of web3 components to quickly build your frontend or use as a reference
- [x] React hooks for various onchain interactions with Wagmi

## Requirements

Before you begin, you need to install the following tools:

- [Node.js (v18.0.0 or later)](https://nodejs.org/en/download/)
- [npm (v9.0.0 or later) or pnpm (recommended)](https://pnpm.io/installation)
- [Git](https://git-scm.com/downloads)

## Getting started

```
git clone https://github.com/buildstationorg/dotui.git
cd dotui
npm install
```

## Running the project

```
npm run dev
```

Default port is 3002. You can change the port in the `package.json` file.

```json
"scripts": {
  "dev": "next dev -p 3002", // Change the port here to -p <port>
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
},
```

## Building the project

```
npm run build
```

## Documentation

Please see [`docs`](docs) for more information and guidelines for contributing to DotUI.

## Contributing to DotUI

We welcome contributions to DotUI!

Please see [`CONTRIBUTING.md`](CONTRIBUTING.md) for more information and guidelines for contributing to DotUI.

# DeFi Lending & Borrowing Platform - Frontend

A decentralized finance (DeFi) lending and borrowing platform built on Paseo Asset Hub, featuring a modern React/Next.js frontend with comprehensive Web3 integration.

## 🎯 Core Features

- **🏦 Deposit Collateral** - Secure your position with collateral tokens
- **💰 Withdraw Collateral** - Release collateral when loans are repaid
- **📈 Take Loan** - Borrow assets against your collateral
- **💳 Repay Loan** - Clear your debt with interest

## 🛠️ Technical Stack

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide icons](https://lucide.dev/)
- [ShadCN UI](https://ui.shadcn.com/)
- [RainbowKit](https://www.rainbowkit.com/)
- [Wagmi](https://wagmi.sh/)
- [Viem](https://viem.sh/)
- [Jotai](https://jotai.org/)
- [Tanstack React Query](https://tanstack.com/query)
- [Vaul](https://vaul.fun/)
- [Zod](https://zod.dev/)
- [React Hook Form](https://react-hook-form.com/)

## 📋 Requirements

Before you begin, you need to install the following tools:

- [Node.js (v18.0.0 or later)](https://nodejs.org/en/download/)
- [npm (v9.0.0 or later) or pnpm (recommended)](https://pnpm.io/installation)
- [Git](https://git-scm.com/downloads)

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-repo/challenge-2-lending-borrowing.git
cd challenge-2-lending-borrowing/frontend
```

### 2. Install Dependencies

Using npm:
```bash
npm install
```

Using pnpm (recommended):
```bash
pnpm install
```

Using yarn:
```bash
yarn install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Configure your environment variables:

```env
# WalletConnect Project ID (Get from https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id

# Smart Contract Addresses (Update after deployment)
NEXT_PUBLIC_LENDING_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_COLLATERAL_TOKEN_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_LOAN_TOKEN_ADDRESS=0x0000000000000000000000000000000000000000
```

### 4. Get WalletConnect Project ID

1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com)
2. Create a new project
3. Copy your Project ID
4. Add it to your `.env.local` file

### 5. Deploy Smart Contracts (Required)

Before running the frontend, you need to deploy the smart contracts:

```bash
# Navigate to the smart contracts directory
cd ../smart-contracts

# Install dependencies
npm install

# Deploy to Paseo Asset Hub testnet
npm run deploy:paseo

# Copy the deployed contract addresses to your .env.local file
```

### 6. Update Contract Addresses

After deploying smart contracts, update your `.env.local` file with the actual contract addresses:

```env
NEXT_PUBLIC_LENDING_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
NEXT_PUBLIC_COLLATERAL_TOKEN_ADDRESS=0x2345678901234567890123456789012345678901
NEXT_PUBLIC_LOAN_TOKEN_ADDRESS=0x3456789012345678901234567890123456789012
```

## 🏃‍♂️ Running the Application

### Development Mode

```bash
npm run dev
```

Or with pnpm:
```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
# Build the application
npm run build

# Start the production server
npm run start
```

### Custom Port

To run on a different port, modify the `package.json` file:

```json
{
  "scripts": {
    "dev": "next dev -p 3002", // Change to your desired port
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

## 🔧 Configuration

### Network Configuration

The app is configured for Paseo Asset Hub testnet. Network details are in `src/config/wagmi.js`:

```javascript
const paseoAssetHub = {
  id: 420420421, // 420420421
  name: 'Paseo Asset Hub',
  nativeCurrency: {
    decimals: 18,
    name: 'PAS',
    symbol: 'PAS',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-passet-hub-eth-rpc.polkadot.io/'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://blockscout-passet-hub.parity-testnet.parity.io/',
    },
  },
  testnet: true,
};
```

## 🎮 Usage Guide

### 1. Connect Your Wallet

1. Click "Connect Wallet" in the top-right corner
2. Choose your preferred wallet (MetaMask, WalletConnect, etc.)
3. Approve the connection to Paseo Asset Hub testnet

### 2. Get Testnet Tokens

1. Get PAS tokens from the [Paseo Faucet](https://faucet.polkadot.io/)
2. Get test collateral and loan tokens from the deployed faucet contracts

### 3. Using Core Functions

#### 🏦 Deposit Collateral
1. Click on "Deposit Collateral" tab
2. Enter the amount of collateral tokens
3. Approve the transaction
4. Wait for confirmation

#### 📈 Take Loan
1. Ensure you have sufficient collateral deposited
2. Click on "Take Loan" tab
3. Enter desired loan amount
4. Review required collateral ratio
5. Confirm the transaction

#### 💳 Repay Loan
1. Ensure you have sufficient loan tokens in your wallet
2. Click on "Repay Loan" tab
3. Enter repayment amount (partial or full)
4. Approve and confirm the transaction

#### 💰 Withdraw Collateral
1. Ensure all loans are repaid
2. Click on "Withdraw Collateral" tab
3. Enter amount to withdraw
4. Confirm the transaction

## 🛠️ Development

### Project Structure

```
src/
├── app/                  # Next.js app directory
│   ├── layout.jsx       # Root layout
│   ├── page.jsx         # Main page with DeFi interface
│   └── globals.css      # Global styles
├── components/          # React components
│   ├── providers.jsx    # Web3 providers wrapper
│   └── client-only.jsx  # Client-side rendering wrapper
└── config/
    └── wagmi.js         # Web3 configuration
```

### Key Components

- **`page.jsx`** - Main DeFi interface with all core functions
- **`wagmi.js`** - Web3 configuration, ABIs, and contract addresses
- **`providers.jsx`** - Wagmi, RainbowKit, and React Query providers

### Adding New Features

1. Update contract ABIs in `src/config/wagmi.js`
2. Add new contract interactions in `src/app/page.jsx`
3. Update UI components as needed

## 🐛 Troubleshooting

### Common Issues

1. **"indexedDB is not defined" error**
   - Ensure you're using the `ClientOnly` wrapper
   - Check that `'use client'` directive is present

2. **Contract not deployed error**
   - Verify contract addresses in `.env.local`
   - Ensure contracts are deployed to Paseo Asset Hub

3. **Wallet connection issues**
   - Check WalletConnect Project ID
   - Ensure you're on the correct network (Paseo Asset Hub)

4. **Transaction failures**
   - Check token balances and allowances
   - Verify collateral requirements for loans
   - Ensure gas fees are sufficient

### Debug Mode

Enable debug logging by adding to your `.env.local`:

```env
NEXT_PUBLIC_DEBUG=true
```

## 📚 Documentation

For more detailed documentation:

- [Smart Contracts Documentation](../smart-contracts/README.md)
- [API Reference](./docs/API.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

## 🤝 Contributing

We welcome contributions! Please see [`CONTRIBUTING.md`](CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- [GitHub Issues](https://github.com/your-repo/challenge-2-lending-borrowing/issues)
- [Discord Community](https://discord.gg/polkadot)
- [Documentation](./docs/)

---

Built with ❤️ for the Polkadot ecosystem 🎉
