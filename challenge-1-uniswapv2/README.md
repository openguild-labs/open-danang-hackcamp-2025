# Uniswap V2 DEX for Polkadot Asset Hub

A decentralized exchange implementation based on Uniswap V2's architecture, adapted for Polkadot Asset Hub.

## Features

- 🔄 **Swap Token** - Exchange tokens with automated market making
- 💧 **Provide Liquidity** - Create new liquidity pools for token pairs
- ➕ **Add Liquidity to Existing Pool** - Contribute to existing trading pairs
- ➖ **Remove Liquidity** - Withdraw your liquidity from pools


## Requirements

Before you begin, you need to install the following tools:

- **Node.js** ( 20 or higher) - [Download here](https://nodejs.org/)
- **npm** (latest version or > v10)
- **Git** - [Download here](https://git-scm.com/)
- **MetaMask** browser extension - [Install here](https://metamask.io/)

## Paseo Testnet Information

### Paseo Contract Faucet
Link: https://faucet.polkadot.io/?parachain=1111

### Explorer
Link: https://blockscout-passet-hub.parity-testnet.parity.io/

### RPC
ETH - EVM-compatible RPC: https://testnet-passet-hub-eth-rpc.polkadot.io/

### ChainID
0x190f1b45

## Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/ajiguruhprasetyo/open-danang-hackcamp-2025.git

# Navigate to project
cd open-danang-hackcamp-2025/challenge-1-uniswapv2

# Install dependencies
npm install
```

### 2. Start Local Blockchain

```bash
# Terminal 1: Start Hardhat node
npx hardhat node
```

### 3. Deploy Contracts

```bash
# Terminal 2: Deploy contracts
npx hardhat run scripts/deploy.js --network localhost
```

### 4. Setup Frontend

```bash
# Navigate to frontend
cd frontend

# Install frontend dependencies
npm install

# Start development server (default port 3000)
npm run dev

# To change port, modify package.json:
# "dev": "next dev -p <port>"
```

### 5. Configure MetaMask

Add local network to MetaMask:
- **Network Name**: `Localhost 8545`
- **RPC URL**: `http://127.0.0.1:8545`
- **Chain ID**: `1337`
- **Currency Symbol**: `DOT`

For Paseo Testnet:
- **Network Name**: `Paseo Asset Hub`
- **RPC URL**: `https://testnet-passet-hub-eth-rpc.polkadot.io/`
- **Chain ID**: `0x190f1b45` (420417733)
- **Currency Symbol**: `PAS`

### 6. Use the DEX

1. Open http://localhost:3000
2. Connect your MetaMask wallet
3. Start swapping tokens and managing liquidity!

## Project Structure

```
challenge-1-uniswapv2/
├── contracts/                 # Smart contracts
├── scripts/                  # Deployment scripts  
├── frontend/                 # React frontend
└── test/                     # Contract tests
```

## Main Commands

```bash
# Backend
npm run compile                # Compile contracts
npm test                      # Run tests
npx hardhat node             # Start local blockchain

# Frontend
cd frontend
npm run dev                  # Start development server
npm run build               # Build for production
```

## Building the Project

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Participant Registration

| 🦄 | Aji Guruh Prasetyo | ajiguruhprasetyo | Blockchain Engineer |

## License

MIT License

Happy DEXing! 🚀



