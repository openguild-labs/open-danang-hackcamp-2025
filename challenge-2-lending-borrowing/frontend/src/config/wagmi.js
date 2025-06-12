'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';

// Paseo Asset Hub configuration
const paseoAssetHub = {
    id: 420420421, // 0x190f1b45
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
        public: {
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

// Contract addresses - update after deployment
export const CONTRACT_ADDRESSES = {
    LENDING_POOL: process.env.NEXT_PUBLIC_LENDING_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000",
    COLLATERAL_TOKEN: process.env.NEXT_PUBLIC_COLLATERAL_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000",
    LOAN_TOKEN: process.env.NEXT_PUBLIC_LOAN_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000",
};

// Complete DeFi Lending Contract ABI
export const LENDING_POOL_ABI = [
    // Core Functions
    {
        "inputs": [{ "name": "amount", "type": "uint256" }],
        "name": "depositCollateral",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "name": "amount", "type": "uint256" }],
        "name": "withdrawCollateral",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "name": "loanAmount", "type": "uint256" }],
        "name": "takeLoan",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "repayLoan",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // Helper Functions
    {
        "inputs": [{ "name": "user", "type": "address" }],
        "name": "getLoanDetails",
        "outputs": [
            {
                "components": [
                    { "name": "collateralAmount", "type": "uint256" },
                    { "name": "loanAmount", "type": "uint256" },
                    { "name": "timestamp", "type": "uint256" },
                    { "name": "isActive", "type": "bool" },
                    { "name": "interestRate", "type": "uint256" },
                    { "name": "dueDate", "type": "uint256" }
                ],
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "name": "user", "type": "address" }],
        "name": "getCollateralBalance",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getAvailableLiquidity",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "name": "user", "type": "address" }],
        "name": "getUserHealth",
        "outputs": [{ "name": "healthFactor", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "name": "user", "type": "address" }],
        "name": "getMaxLoanAmount",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "collateralFactor",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "interestRate",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
];

// ERC20 Token ABI
export const ERC20_ABI = [
    {
        "inputs": [
            { "name": "spender", "type": "address" },
            { "name": "amount", "type": "uint256" }
        ],
        "name": "approve",
        "outputs": [{ "name": "", "type": "bool" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "name": "account", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
];

// Utility functions for contract interactions
export const LENDING_OPERATIONS = {
    calculateRequiredCollateral: (loanAmount, collateralFactor) => {
        if (!loanAmount || !collateralFactor) return 0n;
        return (BigInt(loanAmount) * BigInt(collateralFactor)) / 100n;
    }
};

export const config = getDefaultConfig({
    appName: 'DeFi Lending & Borrowing',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id',
    chains: [paseoAssetHub],
    ssr: false,
});
