# 🚀 HƯỚNG DẪN DEPLOYMENT CHI TIẾT

## 📋 CHECKLIST TRƯỚC KHI DEPLOY

### 1. Environment Setup
- [ ] Node.js v18+ installed
- [ ] npm hoặc yarn installed  
- [ ] Git installed
- [ ] MetaMask wallet setup
- [ ] Private key ready cho Paseo Asset Hub

### 2. Network Configuration
- [ ] Paseo Asset Hub network đã add vào MetaMask
- [ ] Có testnet tokens từ faucet
- [ ] RPC connection working

### 3. Code Preparation
- [ ] All dependencies installed
- [ ] Contracts compile successfully
- [ ] Tests passing
- [ ] Environment variables configured

## 🔧 BƯỚC 1: SETUP ENVIRONMENT

### Install Dependencies
```bash
# Root directory
npm install

# Frontend dependencies  
cd frontend
npm install
cd ..
```

### Tạo Environment File
Tạo file `.env` trong root directory:
```env
# Paseo Asset Hub Private Key
AH_PRIV_KEY=your_private_key_here

# Local Development Private Key  
LOCAL_PRIV_KEY=your_local_private_key_here

# Optional: Infura or Alchemy keys
INFURA_KEY=your_infura_key
ALCHEMY_KEY=your_alchemy_key
```

**⚠️ SECURITY WARNING**: Không commit private keys lên Git!

### MetaMask Network Configuration
Add Paseo Asset Hub network với thông tin:
```
Network Name: Paseo Asset Hub
RPC URL: https://testnet-passet-hub-eth-rpc.polkadot.io/
Chain ID: 0x190f1b45 (420093253 decimal)
Currency Symbol: PAS
Block Explorer: https://blockscout-passet-hub.parity-testnet.parity.io/
```

## 🏗️ BƯỚC 2: COMPILE & TEST CONTRACTS

### Compile Contracts
```bash
npx hardhat compile
```

Expected output:
```
Compiling 15 files with 0.8.19
Compilation finished successfully
```

### Run Tests
```bash
npx hardhat test
```

Expected output:
```
  UniswapV2Factory
    ✓ feeTo, feeToSetter, allPairsLength
    ✓ createPair
    ✓ createPair: identical tokens
    ... (more tests)

  25 passing (2s)
```

### Test Specific Contracts
```bash
# Test Factory only
npx hardhat test test/UniswapV2Factory.js

# Test Pair only  
npx hardhat test test/UniswapV2Pair.js

# Test ERC20 only
npx hardhat test test/UniswapV2ERC20.js
```

## 📝 BƯỚC 3: TẠO DEPLOYMENT SCRIPT

Tạo file `scripts/deploy.js`:
```javascript
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment to Paseo Asset Hub...");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Check balance
  const balance = await deployer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(balance), "PAS");
  
  // Deploy Factory
  console.log("\n📦 Deploying UniswapV2Factory...");
  const Factory = await ethers.getContractFactory("UniswapV2Factory");
  const factory = await Factory.deploy(deployer.address); // feeToSetter = deployer
  await factory.deployed();
  console.log("✅ Factory deployed to:", factory.address);
  
  // Deploy WETH
  console.log("\n📦 Deploying WETH...");
  const WETH = await ethers.getContractFactory("WETH");
  const weth = await WETH.deploy();
  await weth.deployed();
  console.log("✅ WETH deployed to:", weth.address);
  
  // Create sample ERC20 tokens for testing
  console.log("\n📦 Deploying sample tokens...");
  const Token = await ethers.getContractFactory("UniswapV2ERC20");
  
  const tokenA = await Token.deploy();
  await tokenA.deployed();
  console.log("✅ Token A deployed to:", tokenA.address);
  
  const tokenB = await Token.deploy();
  await tokenB.deployed();
  console.log("✅ Token B deployed to:", tokenB.address);
  
  // Create a pair
  console.log("\n🔗 Creating pair...");
  const createPairTx = await factory.createPair(tokenA.address, tokenB.address);
  const receipt = await createPairTx.wait();
  
  const pairAddress = await factory.getPair(tokenA.address, tokenB.address);
  console.log("✅ Pair created at:", pairAddress);
  
  // Save deployment info
  const deploymentInfo = {
    network: "paseoAssetHub",
    deployer: deployer.address,
    contracts: {
      factory: factory.address,
      weth: weth.address,
      tokenA: tokenA.address,
      tokenB: tokenB.address,
      pair: pairAddress
    },
    timestamp: new Date().toISOString(),
    transactionHashes: {
      factory: factory.deployTransaction.hash,
      weth: weth.deployTransaction.hash,
      tokenA: tokenA.deployTransaction.hash,
      tokenB: tokenB.deployTransaction.hash,
      createPair: createPairTx.hash
    }
  };
  
  console.log("\n📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  // Save to file
  const fs = require('fs');
  fs.writeFileSync('deployment.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to deployment.json");
  
  console.log("\n🎉 Deployment completed successfully!");
  console.log("🔍 Verify contracts on:", "https://blockscout-passet-hub.parity-testnet.parity.io/");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

## 🚀 BƯỚC 4: DEPLOY TO PASEO ASSET HUB

### Deploy Contracts
```bash
npx hardhat run scripts/deploy.js --network paseoAssetHub
```

Expected output:
```
🚀 Starting deployment to Paseo Asset Hub...
Deploying contracts with account: 0x1234...
Account balance: 1.0 PAS

📦 Deploying UniswapV2Factory...
✅ Factory deployed to: 0xabcd...

📦 Deploying WETH...
✅ WETH deployed to: 0xefgh...

📦 Deploying sample tokens...
✅ Token A deployed to: 0xijkl...
✅ Token B deployed to: 0xmnop...

🔗 Creating pair...
✅ Pair created at: 0xqrst...

🎉 Deployment completed successfully!
```

### Verify Deployment
Kiểm tra contracts trên block explorer:
1. Mở https://blockscout-passet-hub.parity-testnet.parity.io/
2. Search contract addresses
3. Verify contract code (optional)

## 🔍 BƯỚC 5: VERIFY CONTRACTS (OPTIONAL)

### Flatten Contracts
```bash
npx hardhat flatten contracts/UniswapV2Factory.sol > flattened/UniswapV2Factory_flat.sol
npx hardhat flatten contracts/UniswapV2Pair.sol > flattened/UniswapV2Pair_flat.sol
npx hardhat flatten contracts/WETH.sol > flattened/WETH_flat.sol
```

### Manual Verification trên Block Explorer
1. Go to contract address trên explorer
2. Click "Contract" tab
3. Click "Verify & Publish"
4. Enter contract details:
   - Compiler version: 0.8.19
   - Optimization: Yes (200 runs)
   - Contract code: paste flattened code

## 🌐 BƯỚC 6: DEPLOY FRONTEND

### Configure Frontend
Update `frontend/lib/contracts.ts` với deployed addresses:
```typescript
export const CONTRACTS = {
  FACTORY_ADDRESS: "0xYourFactoryAddress",
  WETH_ADDRESS: "0xYourWETHAddress",
  TOKEN_A_ADDRESS: "0xYourTokenAAddress", 
  TOKEN_B_ADDRESS: "0xYourTokenBAddress",
};

export const NETWORK_CONFIG = {
  chainId: 0x190f1b45,
  name: "Paseo Asset Hub",
  rpcUrl: "https://testnet-passet-hub-eth-rpc.polkadot.io/",
  blockExplorer: "https://blockscout-passet-hub.parity-testnet.parity.io/",
};
```

### Build Frontend
```bash
cd frontend
npm run build
```

### Deploy to Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Deploy to Netlify (Alternative)
```bash
# Build
npm run build

# Deploy build folder to Netlify
# Upload 'out' folder to Netlify dashboard
```

## 📊 BƯỚC 7: TESTING END-TO-END

### Test Smart Contracts
```bash
# Test trên testnet
npx hardhat run scripts/test-deployment.js --network paseoAssetHub
```

### Test Frontend
1. Mở deployed URL
2. Connect MetaMask với Paseo Asset Hub
3. Test wallet connection
4. Test swap functionality  
5. Test liquidity management

## 🐛 TROUBLESHOOTING

### Common Issues

#### 1. Compilation Errors
```bash
# Clear cache và rebuild
npx hardhat clean
npx hardhat compile
```

#### 2. Network Connection Issues  
```bash
# Test network connection
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  https://testnet-passet-hub-eth-rpc.polkadot.io/
```

#### 3. Gas Issues
- Ensure sufficient PAS tokens trong wallet
- Check gas price settings
- Use lower gas limit cho testing

#### 4. Frontend Web3 Issues
- Check network configuration
- Verify contract addresses
- Check console for errors

### Debug Commands
```bash
# Check contract bytecode
npx hardhat verify --network paseoAssetHub CONTRACT_ADDRESS

# Check transaction status
npx hardhat run scripts/check-tx.js --network paseoAssetHub

# Test contract calls
npx hardhat console --network paseoAssetHub
```

## 📝 POST-DEPLOYMENT CHECKLIST

### Smart Contracts
- [ ] Factory deployed successfully
- [ ] WETH deployed successfully  
- [ ] Sample tokens deployed
- [ ] Pair created successfully
- [ ] All contract addresses saved
- [ ] Contracts verified trên explorer (optional)

### Frontend  
- [ ] Frontend build successful
- [ ] Deployed to hosting platform
- [ ] Contract integration working
- [ ] Wallet connection working
- [ ] Swap functionality working
- [ ] Liquidity management working

### Documentation
- [ ] Contract addresses documented
- [ ] Transaction hashes saved
- [ ] User guide created
- [ ] Technical documentation updated

## 🎯 SUBMISSION PREPARATION

### Create Submission Package
```bash
# Create submission folder
mkdir hackathon-submission
cd hackathon-submission

# Copy important files
cp ../deployment.json .
cp ../README.md .
cp ../HACKATHON_PLAN.md .
cp ../TECHNICAL_DOCUMENTATION.md .

# Create submission summary
echo "# Hackathon Submission Summary

## Deployed Contracts
- Factory: $(grep factory ../deployment.json)
- WETH: $(grep weth ../deployment.json)
- Sample Pair: $(grep pair ../deployment.json)

## Frontend URL
- Live Demo: https://your-frontend-url.vercel.app

## Documentation
- Technical Docs: TECHNICAL_DOCUMENTATION.md
- Deployment Guide: DEPLOYMENT_GUIDE.md
- Project Plan: HACKATHON_PLAN.md

Deployed successfully on Paseo Asset Hub! 🚀
" > SUBMISSION.md
```

---

## 🏆 SUCCESS METRICS

Deployment được coi là thành công khi:
- ✅ All contracts deployed without errors
- ✅ Contract verification completed
- ✅ Frontend accessible và functional
- ✅ End-to-end testing passed
- ✅ Documentation completed

**🎉 Chúc mừng! Bạn đã hoàn thành deployment DEX trên Polkadot Asset Hub!** 