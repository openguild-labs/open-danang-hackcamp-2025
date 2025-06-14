# ⚡ QUICK START GUIDE

## 🚀 Bắt đầu trong 5 phút

### 1. Clone & Install
```bash
git clone <repo-url>
cd challenge-1-uniswapv2
npm install
cd frontend && npm install && cd ..
```

### 2. Setup Environment
```bash
# Tạo .env file
echo "AH_PRIV_KEY=your_private_key_here" > .env
echo "LOCAL_PRIV_KEY=your_local_private_key_here" >> .env
```

### 3. Setup MetaMask
**Network**: Paseo Asset Hub
- RPC: `https://testnet-passet-hub-eth-rpc.polkadot.io/`
- Chain ID: `420420422`
- Symbol: `PAS`

**Faucet**: https://faucet.polkadot.io/?parachain=1111

### 4. Test & Deploy
```bash
# Test contracts
npx hardhat test

# Deploy to Paseo Asset Hub
npx hardhat run scripts/deploy.js --network paseoAssetHub
```

### 5. Run Frontend
```bash
cd frontend
npm run dev
```

## 📋 Checklist nhanh

- [ ] Dependencies installed
- [ ] Environment variables set
- [ ] MetaMask configured
- [ ] Testnet tokens received
- [ ] Contracts compiled
- [ ] Tests passing
- [ ] Contracts deployed
- [ ] Frontend running

## 🆘 Cần giúp đỡ?

- **Compilation error**: `npx hardhat clean && npx hardhat compile`
- **Network error**: Kiểm tra RPC URL và private key
- **Gas error**: Ensure có đủ PAS tokens từ faucet
- **Frontend error**: Check contract addresses trong config

## 📖 Tài liệu đầy đủ

- 📋 **Kế hoạch**: [HACKATHON_PLAN.md](./HACKATHON_PLAN.md)
- 🔧 **Kỹ thuật**: [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md)  
- 🚀 **Deployment**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

**Good luck! 🍀** 