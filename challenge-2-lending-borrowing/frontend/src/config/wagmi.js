'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';

// Paseo Asset Hub configuration
const paseoAssetHub = {
    id: 419430469, // 0x190f1b45
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
        "inputs": [{ "name": "loanAmount", "type": "uint256" }],
        "name": "_loanRequiredCollateral",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
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

    // Admin Functions
    {
        "inputs": [{ "name": "_collateralFactor", "type": "uint256" }],
        "name": "setCollateralFactor",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "name": "_interestRate", "type": "uint256" }],
        "name": "setInterestRate",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "name": "_liquidationThreshold", "type": "uint256" }],
        "name": "setLiquidationThreshold",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },

    // View Functions for Contract State
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
    },
    {
        "inputs": [],
        "name": "liquidationThreshold",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalCollateral",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalLoans",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },

    // Events
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "name": "user", "type": "address" },
            { "indexed": false, "name": "amount", "type": "uint256" }
        ],
        "name": "CollateralDeposited",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "name": "user", "type": "address" },
            { "indexed": false, "name": "amount", "type": "uint256" }
        ],
        "name": "CollateralWithdrawn",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "name": "user", "type": "address" },
            { "indexed": false, "name": "loanAmount", "type": "uint256" },
            { "indexed": false, "name": "collateralAmount", "type": "uint256" }
        ],
        "name": "LoanTaken",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "name": "user", "type": "address" },
            { "indexed": false, "name": "amount", "type": "uint256" }
        ],
        "name": "LoanRepaid",
        "type": "event"
    }
];

// ERC20 Token ABI for collateral and loan tokens
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
    },
    {
        "inputs": [
            { "name": "owner", "type": "address" },
            { "name": "spender", "type": "address" }
        ],
        "name": "allowance",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [{ "name": "", "type": "uint8" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "symbol",
        "outputs": [{ "name": "", "type": "string" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "name",
        "outputs": [{ "name": "", "type": "string" }],
        "stateMutability": "view",
        "type": "function"
    }
];

// Utility functions for contract interactions
export const LENDING_OPERATIONS = {
    // Calculate required collateral for a loan amount
    calculateRequiredCollateral: (loanAmount, collateralFactor) => {
        if (!loanAmount || !collateralFactor) return 0n;
        return (BigInt(loanAmount) * BigInt(collateralFactor)) / 100n;
    },

    // Calculate maximum loan amount from collateral
    calculateMaxLoan: (collateralAmount, collateralFactor) => {
        if (!collateralAmount || !collateralFactor) return 0n;
        return (BigInt(collateralAmount) * 100n) / BigInt(collateralFactor);
    },

    // Calculate health factor (collateral value / loan value)
    calculateHealthFactor: (collateralAmount, loanAmount, collateralFactor) => {
        if (!loanAmount || loanAmount === 0n) return 1000n; // Max health if no loan
        const collateralValue = (BigInt(collateralAmount) * 100n) / BigInt(collateralFactor);
        return (collateralValue * 100n) / BigInt(loanAmount);
    },

    // Check if position is healthy (health factor > liquidation threshold)
    isPositionHealthy: (healthFactor, liquidationThreshold = 120n) => {
        return healthFactor >= liquidationThreshold;
    }
};

export const config = getDefaultConfig({
    appName: 'DeFi Lending & Borrowing',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id',
    chains: [paseoAssetHub],
    ssr: false, // Disable SSR for wallet connections
});
