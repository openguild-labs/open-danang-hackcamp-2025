# Uniswap V2 DEX for Polkadot Asset Hub

A decentralized exchange implementation based on Uniswap V2's architecture, adapted for Polkadot Asset Hub.

## Features

- 🔄 Token swapping with automated market making
- 💧 Liquidity provision and management
- 🏊‍♂️ Add/remove liquidity from pools
- 🏭 Factory pattern for pair creation
- 🔒 Secure smart contract implementation
- 🎨 Modern React frontend with MetaMask integration

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MetaMask** browser extension - [Install here](https://metamask.io/)
- **Git** - [Download here](https://git-scm.com/)

## Quick Start Guide

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/your-username/challenge-1-uniswapv2.git

# Navigate to the project directory
cd challenge-1-uniswapv2
```

### Step 2: Install Backend Dependencies

```bash
# Install smart contract dependencies
npm install
```

### Step 3: Setup Environment

```bash
# Copy environment file
cp .env.example .env

# Edit .env file with your private key (optional for local development)
# PRIVATE_KEY=your_private_key_without_0x_prefix
```

### Step 4: Compile Smart Contracts

```bash
# Compile contracts
npm run compile
```

### Step 5: Start Local Blockchain

```bash
# Terminal 1: Start local Hardhat node
npx hardhat node
```

Keep this terminal running. You should see:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
```

### Step 6: Deploy Contracts

```bash
# Terminal 2: Deploy contracts to local network
npx hardhat run scripts/deploy.js --network localhost
```

You should see output like:
```
Factory deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Token A deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
Token B deployed to: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
Pair deployed to: 0x68F1EF64B6A473E6e782871e4F98B2AaD2bbaD95
```

### Step 7: Setup Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install frontend dependencies
npm install
```

### Step 8: Start Frontend Development Server

```bash
# Start the frontend (in frontend directory)
npm run dev
```

The frontend will be available at: **http://localhost:3000**

### Step 9: Configure MetaMask

1. **Open MetaMask** in your browser
2. **Add Local Network**:
   - Network Name: `Localhost 8545`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `1337`
   - Currency Symbol: `ETH`

3. **Import Test Account** (optional):
   - Use one of the private keys from Hardhat node output
   - Example: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

### Step 10: Use the DEX

1. **Open** http://localhost:3000 in your browser
2. **Connect Wallet** - Click "Connect Wallet" button
3. **Approve MetaMask** connection
4. **Use DEX Features**:
   - 🔄 **Swap Tokens** - Exchange TKA ↔ TKB
   - ➕ **Add Liquidity** - Provide liquidity to earn fees
   - ➖ **Remove Liquidity** - Withdraw your liquidity
   - 📊 **View Pool Info** - See reserves and exchange rates

## Testing the DEX Features

### Test Swap Feature
1. Go to "Swap" tab
2. Enter amount (e.g., `100`)
3. Select direction (TKA → TKB or TKB → TKA)
4. Click "Swap"
5. Confirm MetaMask transaction

### Test Liquidity Features
1. Go to "Liquidity" tab
2. **Add Liquidity**:
   - Enter TKA amount (e.g., `1000`)
   - Enter TKB amount (e.g., `2000`)
   - Click "Add Liquidity"
3. **Remove Liquidity**:
   - Enter LP token amount
   - Click "Remove Liquidity"

## Project Structure

```
challenge-1-uniswapv2/
├── contracts/                 # Smart contracts
│   ├── interfaces/
│   ├── libraries/
│   ├── UniswapV2Factory.sol
│   ├── UniswapV2Pair.sol
│   └── TestToken.sol
├── scripts/                  # Deployment scripts
│   ├── deploy.js
│   └── interact.js
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx     # Main DEX interface
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   └── config/
│   │       └── contracts.json
│   ├── package.json
│   └── next.config.js
├── test/                     # Tests
├── hardhat.config.js         # Hardhat configuration
└── package.json             # Project dependencies
```

## Available Scripts

### Backend Commands
```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Deploy to local network
npx hardhat run scripts/deploy.js --network localhost

# Deploy to Paseo testnet
npm run deploy

# Interact with deployed contracts
npm run interact

# Start local blockchain
npx hardhat node

# Clean artifacts
npm run clean
```

### Frontend Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Troubleshooting

### Common Issues

1. **"Module not found" errors**:
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **CSS Tailwind errors** (border-border class does not exist):
   ```bash
   # Fix the globals.css file
   cd frontend/src/app
   echo "@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  padding: 0;
}" > globals.css
   ```

3. **Frontend files in wrong location**:
   ```bash
   # Make sure frontend structure is correct
   cd frontend
   # Files should be in frontend/src/app/ not frontend/app/
   mkdir -p src/app src/config
   # Move files if they're in wrong location
   ```

4. **MetaMask connection issues**:
   - Make sure you're on the correct network (Localhost 8545)
   - Reset MetaMask account if needed

5. **Transaction failures**:
   - Ensure Hardhat node is running
   - Check MetaMask has enough ETH for gas
   - Verify contract addresses in frontend/src/config/contracts.json

6. **Frontend not loading contract data**:
   - Redeploy contracts: `npx hardhat run scripts/deploy.js --network localhost`
   - Restart frontend: `npm run dev`

### Quick Fix for Frontend Issues

If you're getting CSS or file structure errors:

```bash
cd frontend

# Clean everything
rm -rf node_modules package-lock.json .next

# Ensure correct structure
mkdir -p src/app src/config

# Reinstall
npm install

# Restart
npm run dev
```

### Emergency Fix for Persistent CSS Errors

If you're still getting `border-border` class errors or `frontend/app/globals.css` errors:

```bash
# Stop the dev server (Ctrl+C)
cd frontend

# COMPLETELY remove the problematic app directory
rm -rf app/

# Remove all cache and node modules
rm -rf .next/ node_modules/ package-lock.json

# Verify only correct structure exists
ls -la
# You should only see: src/, package.json, and config files

# If app/ directory still exists, force remove:
sudo rm -rf app/

# Reinstall everything
npm install

# Start fresh
npm run dev
```

### Immediate Fix for Current Error

**If you're seeing the `border-border` class error right now, run this:**

```bash
# Navigate to frontend directory
cd frontend

# Remove the problematic app/ directory that's causing conflicts
rm -rf app/

# Clear Next.js cache completely
rm -rf .next/

# Restart the development server
npm run dev
```

**The error occurs because Next.js is trying to load `frontend/app/globals.css` instead of `frontend/src/app/globals.css`. Removing the `app/` directory forces it to use the correct `src/app/` structure.**

### Manual Directory Check

If problems persist, manually verify your frontend structure:

```bash
cd frontend
find . -name "globals.css" -type f
# Should ONLY show: ./src/app/globals.css
# If you see ./app/globals.css, remove it:
rm -rf app/

find . -name "layout.tsx" -type f  
# Should ONLY show: ./src/app/layout.tsx
```

### Complete Frontend Reset (Last Resort)

If nothing else works, completely recreate the frontend:

```bash
# From project root
cd challenge-1-uniswapv2
rm -rf frontend/

# Recreate frontend directory
mkdir frontend
cd frontend

# Create package.json
cat > package.json << 'EOF'
{
  "name": "uniswap-v2-frontend",
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "14.2.29",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "ethers": "^6.8.0",
    "react-hot-toast": "^2.4.1"
  },
  "devDependencies": {
    "@types/node": "^20.8.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "tailwindcss": "^3.3.5",
    "typescript": "^5.2.2"
  }
}
EOF

# Create correct structure
mkdir -p src/app src/config

# Install and start
npm install
npm run dev
```

## Deployment to Paseo Testnet

1. **Get Paseo testnet tokens** from faucet
2. **Update .env** with your private key
3. **Deploy**:
   ```bash
   npm run deploy
   ```

## Network Configuration

- **Local Development**: Hardhat Network (Chain ID: 1337)
- **Testnet**: Paseo Asset Hub (Chain ID: 1000)
- **Frontend**: React + Next.js + Tailwind CSS

## Demo Video

Record a demo showing:
1. MetaMask connection
2. Swapping tokens
3. Adding liquidity
4. Removing liquidity
5. Real-time balance updates

## Security Considerations

- ✅ Reentrancy protection implemented
- ✅ Integer overflow protection with Solidity 0.8+
- ✅ Proper access controls
- ✅ Safe token transfers
- ✅ Constant product formula validation

## License

MIT License

## Support

If you encounter any issues:
1. Check the troubleshooting section
2. Ensure all prerequisites are installed
3. Follow the step-by-step guide exactly
4. Check console errors in browser developer tools

Happy DEXing! 🚀



