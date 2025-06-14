# 📋 KẾ HOẠCH HACKATHON: UNISWAP V2 DEX TRÊN POLKADOT ASSET HUB

## 🎯 TỔNG QUAN DỰ ÁN

### Mục tiêu
Xây dựng một **Decentralized Exchange (DEX)** hoàn chỉnh dựa trên kiến trúc Uniswap V2 cho **Polkadot Asset Hub**, bao gồm:
- Smart contracts cho automated market making
- Giao diện người dùng cho swap và quản lý thanh khoản
- Tích hợp với MetaMask và Web3 tools

### Thông tin mạng
- **Network Name**: Paseo Asset Hub
- **RPC URL**: https://testnet-passet-hub-eth-rpc.polkadot.io/
- **Chain ID**: 420420422
- **Explorer**: https://blockscout-passet-hub.parity-testnet.parity.io/
- **Faucet**: https://faucet.polkadot.io/?parachain=1111

## 🏗️ KIẾN TRÚC DỰ ÁN

### Smart Contracts
1. **UniswapV2Factory.sol** - Tạo và quản lý các cặp token
2. **UniswapV2Pair.sol** - Logic swap và quản lý thanh khoản
3. **UniswapV2ERC20.sol** - Token chuẩn cho LP tokens
4. **WETH.sol** - Wrapped ETH cho tương tác

### Frontend
- **Framework**: Next.js 14 + TypeScript
- **Styling**: Tailwind CSS + ShadCN UI
- **Web3**: RainbowKit + Wagmi + Viem
- **State Management**: Jotai + React Query

### Development Tools
- **Smart Contract**: Hardhat + Solidity 0.8.19
- **Testing**: Ethereum Waffle + Mocha
- **Deployment**: Hardhat Ignition

## 📅 TIMELINE & MILESTONE

### Phase 1: Nghiên cứu & Setup (Ngày 1-2)
**Timeline**: 2 ngày
- [ ] Nghiên cứu kiến trúc Uniswap V2
- [ ] Tìm hiểu Polkadot Asset Hub & EVM compatibility
- [ ] Setup môi trường development
- [ ] Cấu hình network và wallet

### Phase 2: Smart Contract Development (Ngày 3-5)
**Timeline**: 3 ngày
- [ ] Review và hiểu rõ code contracts hiện tại
- [ ] Viết và chạy unit tests
- [ ] Deploy contracts lên Paseo Asset Hub
- [ ] Verify contracts trên explorer

### Phase 3: Frontend Development (Ngày 6-8)
**Timeline**: 3 ngày
- [ ] Setup Next.js với Web3 integration
- [ ] Tạo giao diện Swap
- [ ] Tạo giao diện Liquidity Management
- [ ] Tích hợp với smart contracts

### Phase 4: Testing & Integration (Ngày 9-10)
**Timeline**: 2 ngày
- [ ] End-to-end testing
- [ ] UI/UX optimization
- [ ] Bug fixing và performance tuning
- [ ] Deployment frontend

## 🔧 HƯỚNG DẪN SETUP CHI TIẾT

### Bước 1: Environment Setup
```bash
# Clone repository
git clone <repo-url>
cd challenge-1-uniswapv2

# Install dependencies
npm install
cd frontend && npm install
```

### Bước 2: Cấu hình Environment Variables
Tạo file `.env`:
```
LOCAL_PRIV_KEY=your_local_private_key
AH_PRIV_KEY=your_asset_hub_private_key
```

### Bước 3: Setup MetaMask
1. Thêm Paseo Asset Hub network vào MetaMask
2. Lấy testnet tokens từ faucet
3. Test kết nối với network

### Bước 4: Compile & Test Contracts
```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Paseo Asset Hub
npx hardhat run scripts/deploy.js --network paseoAssetHub
```

### Bước 5: Chạy Frontend
```bash
cd frontend
npm run dev
```

## 📚 TÀI LIỆU NGHIÊN CỨU

### Core Concepts Cần Nắm Vững

#### 1. Uniswap V2 Architecture
- **Automated Market Maker (AMM)**: Thuật toán định giá dựa trên constant product formula `x * y = k`
- **Liquidity Pools**: Cặp token được pool lại để tạo thanh khoản
- **LP Tokens**: Token đại diện cho phần sở hữu trong pool
- **Factory Pattern**: Tạo và quản lý các pair contracts

#### 2. Smart Contract Components
- **Factory Contract**: Tạo pair contracts, quản lý fees
- **Pair Contract**: Logic swap, mint/burn LP tokens
- **Router Contract**: Helper contract cho multi-hop swaps
- **ERC20 Implementation**: Chuẩn token với permit functionality

#### 3. Frontend Integration
- **Web3 Connection**: Kết nối wallet qua RainbowKit
- **Contract Interaction**: Sử dụng Wagmi hooks
- **State Management**: Jotai atoms cho global state
- **UI Components**: ShadCN UI components

## 🎨 UI/UX REQUIREMENTS

### Swap Interface
- [ ] Token selection với search
- [ ] Amount input với max button
- [ ] Slippage tolerance settings
- [ ] Transaction preview
- [ ] Swap confirmation modal

### Liquidity Management
- [ ] Add liquidity form
- [ ] Remove liquidity interface
- [ ] Pool overview và statistics
- [ ] LP token balance display

### General Features
- [ ] Wallet connection button
- [ ] Network switcher
- [ ] Transaction history
- [ ] Loading states và error handling

## 🧪 TESTING STRATEGY

### Smart Contract Tests
- [ ] Factory contract tests (pair creation, fee management)
- [ ] Pair contract tests (swap, mint, burn, fees)
- [ ] ERC20 tests (transfer, approve, permit)
- [ ] Integration tests (full swap flow)

### Frontend Tests
- [ ] Component unit tests
- [ ] Integration tests với mock contracts
- [ ] E2E tests với real network

## 🚀 DEPLOYMENT CHECKLIST

### Smart Contracts
- [ ] Contracts compiled successfully
- [ ] All tests passing
- [ ] Deployed to Paseo Asset Hub
- [ ] Contracts verified on explorer
- [ ] Contract addresses documented

### Frontend
- [ ] Build successful
- [ ] All features working on testnet
- [ ] Responsive design tested
- [ ] Deployed to hosting platform
- [ ] Domain configured

## 🏆 SUBMISSION REQUIREMENTS

### Deliverables
1. ✅ **Smart Contracts Deployed**
   - Factory contract address
   - Example pair contract address
   - ERC20 token contracts for testing

2. ✅ **Complete UI**
   - Swap interface
   - Liquidity management
   - Wallet integration
   - Working on Paseo Asset Hub

### Documentation Required
- [ ] Deployment addresses và transaction hashes
- [ ] User guide cho việc sử dụng DEX
- [ ] Technical documentation
- [ ] Demo video (optional but recommended)

## 🔥 SUCCESS METRICS

### Technical Metrics
- [ ] Smart contracts deployed without errors
- [ ] All core functions working (swap, add/remove liquidity)
- [ ] Frontend fully integrated với contracts
- [ ] Responsive design trên all devices

### User Experience Metrics
- [ ] Intuitive UI/UX
- [ ] Fast transaction confirmations
- [ ] Clear error messages
- [ ] Comprehensive features

## 📞 RESOURCES & SUPPORT

### Documentation Links
- [Uniswap V2 Whitepaper](https://uniswap.org/whitepaper.pdf)
- [Polkadot Asset Hub Docs](https://wiki.polkadot.network/docs/learn-assets)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Wagmi Docs](https://wagmi.sh/)

### Community Support
- Polkadot Developer Discord
- Uniswap Developer Forum
- Stack Overflow

---

## 💡 PRO TIPS

1. **Start with contracts**: Đảm bảo smart contracts hoạt động trước khi làm frontend
2. **Use testnet extensively**: Test mọi thứ trên Paseo Asset Hub trước khi submit
3. **Document everything**: Ghi lại addresses, transaction hashes, và decisions
4. **Keep it simple**: Focus vào core features trước, optimize sau
5. **Test edge cases**: Empty pools, insufficient balance, slippage protection

**Good luck và may the code be with you! 🚀** 