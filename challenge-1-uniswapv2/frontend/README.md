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

- [Node (current LTS version)](https://nodejs.org/en/download/)
- [npm (latest version or > v10)](https://www.npmjs.com/get-npm)
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
  "dev": "next dev", // Change the port here to -p <port>
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

# UniswapV2 DEX Frontend

## Setup Instructions

### 1. Start Hardhat Node
```bash
# In the project root directory
npx hardhat node
```
This will start a local blockchain at `http://127.0.0.1:8545` with test accounts.

### 2. Deploy Contracts
```bash
# Deploy contracts to local network
npx hardhat run scripts/deploy.js --network localhost
```

### 3. Configure MetaMask

Add the local network to MetaMask:
- **Network Name**: `Localhost 8545`
- **RPC URL**: `http://127.0.0.1:8545`
- **Chain ID**: `1337`
- **Currency Symbol**: `ETH`

### 4. Import Test Account

Import the test account with 10,000 ETH:
- **Address**: `0xbDA5747bFD65F08deb54cb465eB87D40e51B197E`
- **Private Key**: Available in Hardhat console output

### 5. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` and connect your wallet!
