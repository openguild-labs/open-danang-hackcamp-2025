**Business Analysis (BA) và Technical Product Document** dành cho **giao diện người dùng (UI)** của sản phẩm đang phát triển trên **Paseo Asset Hub**.

---

# 📄 DOCUMENT UI SẢN PHẨM UNISWAP V2 – PASEO ASSET HUB

---

## 🧭 1. MỤC TIÊU SẢN PHẨM

### 🎯 Mục tiêu

Xây dựng một ứng dụng web đơn giản, mượt mà, cho phép người dùng:

* Swap token trên Uniswap V2 (các token ERC-20 như PAS, USDT, USDC…)
* Thêm/rút thanh khoản
* Xem tỷ giá, slippage, và thông tin giao dịch

---

## 👤 2. ĐỐI TƯỢNG NGƯỜI DÙNG (User Personas)

| Nhóm         | Mô tả                                                     |
| ------------ | --------------------------------------------------------- |
| Retail User  | Người mới học về DeFi, cần UI đơn giản, dễ hiểu           |
| Dev / Hacker | Người dùng kỹ thuật tham gia Hackathon cần test nhanh AMM |
| Builder      | Người test UI/UX để customize vào dự án khác              |

---

## 🧱 3. CẤU TRÚC CHỨC NĂNG GIAO DIỆN

### A. **Trang chủ / Swap**

| Thành phần UI     | Mô tả                                             |
| ----------------- | ------------------------------------------------- |
| Token Selector    | Dropdown chọn token A / B (hiển thị logo, symbol) |
| Amount Input      | Nhập số lượng cần hoán đổi (có nút “Max”)         |
| Estimated Receive | Hiển thị lượng token ước lượng nhận được          |
| Price Impact      | Tính % thay đổi giá                               |
| Slippage Control  | Chọn ngưỡng trượt giá: 0.1%, 0.5%, 1% hoặc custom |
| Swap Button       | Nút thực hiện giao dịch                           |
| Tx Summary        | Modal xác nhận thông tin giao dịch                |
| Tx Status         | Hiển thị khi giao dịch được xác nhận / pending    |

---

### B. **Trang Liquidity**

| Thành phần UI         | Mô tả                                                 |
| --------------------- | ----------------------------------------------------- |
| Pool Selector         | Chọn cặp token để thêm/rút thanh khoản                |
| Add Liquidity Form    | Nhập số lượng token A và token B, preview phần chia % |
| Remove Liquidity Form | Thanh trượt chọn % muốn rút                           |
| Your Position         | Hiển thị LP token, tỷ lệ, giá trị hiện tại            |
| Tx Status             | Kết quả các thao tác add/remove liquidity             |

---

### C. **Header / Footer**

| Phần           | Mô tả                                                         |
| -------------- | ------------------------------------------------------------- |
| Wallet Connect | Tích hợp MetaMask, WalletConnect                              |
| Chain Status   | Hiển thị đang kết nối với Paseo Asset Hub (ChainID 420420422) |
| Theme          | Dark/Light toggle                                             |
| Link           | GitHub, Docs, Explorer, Faucet, Contact                       |

---

## 📈 4. FLOW NGƯỜI DÙNG (USER FLOW)

```plaintext
[User Truy Cập Website]
     ↓
[Connect Wallet] —> [Switch Network nếu sai RPC]
     ↓
[Trang Swap] —— Chọn Token → Nhập Số Lượng
     ↓
[Xem tỷ giá, slippage, fee] → [Swap Confirm Modal]
     ↓
[Ký giao dịch] → [Tx Pending] → [Hiển thị Tx Hash]
     ↓
[Hoàn tất / Lỗi / Thông báo Toast]
```

---

## 🧪 5. TÍNH NĂNG (FEATURES LIST)

| Tính năng              | Ưu tiên  | Ghi chú                    |
| ---------------------- | -------- | -------------------------- |
| Swap token             | ✅        | Core                       |
| Add / Remove Liquidity | ✅        | Core                       |
| Token list quản lý     | ✅        | Dùng file `.json` hoặc API |
| Slippage setting       | ✅        | Default 0.5%               |
| Wallet connection      | ✅        | MetaMask / WalletConnect   |
| Theme switch           | Medium   | Tùy chọn                   |
| Tx history (local)     | Optional | Lưu cache localStorage     |

---

## 🛠️ 6. KỸ THUẬT UI/UX

| Stack                     | Mô tả                            |
| ------------------------- | -------------------------------- |
| **React**                 | Core UI                          |
| **Tailwind CSS**          | Giao diện nhanh, responsive      |
| **Wagmi + Viem**          | Tích hợp ví & contract call      |
| **Ethers.js**             | Tương tác smart contract         |
| **Zustand / Redux**       | Quản lý trạng thái token, wallet |
| **Ton/Toastify**          | Hiển thị thông báo               |
| **React Hook Form / Zod** | Quản lý form và validate         |
| **RainbowKit** (optional) | UI connect ví chuyên nghiệp      |

---

## 🎨 7. DESIGN GUIDELINES

| Element       | Style                            |
| ------------- | -------------------------------- |
| Font          | Inter / Space Grotesk            |
| Primary Color | #2D80FF                          |
| Background    | #0D111C (dark) / #FFFFFF (light) |
| Border Radius | 16px                             |
| Hover States  | Opacity + Border highlight       |
| Loading State | Skeleton loading hoặc spinner    |

---

## 📦 8. FOLDER STRUCTURE GỢI Ý

```bash
📁 /src
  ├── 📁 components/
  │     ├── SwapBox.tsx
  │     ├── LiquidityBox.tsx
  │     └── TokenSelector.tsx
  ├── 📁 pages/
  │     ├── index.tsx (Swap)
  │     ├── liquidity.tsx
  ├── 📁 hooks/
  │     └── useSwap.ts
  ├── 📁 utils/
  │     └── format.ts, calculateImpact.ts
  ├── 📁 config/
  │     └── tokens.ts, chains.ts
  ├── 📁 context/
  │     └── WalletProvider.tsx
  └── App.tsx
```

---

## ✅ 9. TASK TIẾP THEO

1. [ ] Chuẩn hoá token list (PAS, USDC, USDT) ở file JSON
2. [ ] Xây dựng `SwapBox.tsx` (UI + logic tương tác Router)
3. [ ] Tích hợp MetaMask qua Viem hoặc Wagmi
4. [ ] Hiển thị tx result bằng toast + explorer link
5. [ ] Thêm Liquidity UI sau khi Swap hoạt động
