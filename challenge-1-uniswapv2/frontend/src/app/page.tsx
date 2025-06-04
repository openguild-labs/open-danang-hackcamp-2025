'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import toast, { Toaster } from 'react-hot-toast';
import { ConnectWallet } from '../components/ConnectWallet';
import { useWeb3 } from '../hooks/useWeb3';

// Extend the Window interface to include ethereum
declare global {
    interface Window {
        ethereum?: any;
    }
}

// Simple SVG Icons
const ArrowDownUp = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </svg>
);

const Plus = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);

const Minus = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
);

const Droplets = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h18m-18 0L7.5 21m13.5-5L16.5 12M21 16.5m0 0L16.5 21M21 16.5H3" />
    </svg>
);

// Default contract addresses (will be replaced by actual deployment)
const defaultContracts = {
    factory: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    tokenA: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    tokenB: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    pair: "0x68F1EF64B6A473E6e782871e4F98B2AaD2bbaD95"
};

// Contract ABIs
const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)"
];

const PAIR_ABI = [
    "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
    "function mint(address to) returns (uint256 liquidity)",
    "function burn(address to) returns (uint256 amount0, uint256 amount1)",
    "function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data)",
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function totalSupply() view returns (uint256)"
];

export default function Home() {
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
    const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
    const [account, setAccount] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'swap' | 'liquidity'>('swap');
    const [contracts, setContracts] = useState(defaultContracts);

    // Token balances
    const [tokenABalance, setTokenABalance] = useState<string>('0');
    const [tokenBBalance, setTokenBBalance] = useState<string>('0');
    const [liquidityBalance, setLiquidityBalance] = useState<string>('0');

    // Pool info
    const [reserves, setReserves] = useState<{ reserve0: string; reserve1: string }>({ reserve0: '0', reserve1: '0' });

    // Form states
    const [swapAmount, setSwapAmount] = useState<string>('');
    const [swapDirection, setSwapDirection] = useState<'AtoB' | 'BtoA'>('AtoB');
    const [liquidityAmountA, setLiquidityAmountA] = useState<string>('');
    const [liquidityAmountB, setLiquidityAmountB] = useState<string>('');
    const [removeLiquidityAmount, setRemoveLiquidityAmount] = useState<string>('');

    const { address, isConnected, chain } = useWeb3();

    useEffect(() => {
        // Load contract addresses
        const loadContracts = async () => {
            try {
                // Try to load from the config file first
                const response = await fetch('/config/contracts.json');
                if (response.ok) {
                    const contractData = await response.json();
                    setContracts(contractData);
                    console.log('✅ Loaded contract addresses from config');
                } else {
                    console.log('⚠️ Using default contract addresses - make sure to deploy contracts first');
                }
            } catch (error) {
                console.log('⚠️ Using default contract addresses - config file not found');
            }
        };

        loadContracts();

        // Initialize provider
        if (typeof window !== 'undefined' && window.ethereum) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            setProvider(provider);
        } else {
            console.warn('MetaMask not detected. Please install MetaMask to use this DEX.');
        }
    }, []);

    const connectWallet = async () => {
        if (!provider) {
            toast.error('MetaMask not detected!');
            return;
        }

        try {
            await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();

            setSigner(signer);
            setAccount(address);
            toast.success('Wallet connected!');

            await loadBalances(signer, address);
        } catch (error) {
            toast.error('Failed to connect wallet');
            console.error(error);
        }
    };

    const loadBalances = async (signer: ethers.JsonRpcSigner, address: string) => {
        try {
            console.log('📊 Loading balances for:', address);
            console.log('🔗 Using contracts:', contracts);

            const tokenA = new ethers.Contract(contracts.tokenA, ERC20_ABI, signer);
            const tokenB = new ethers.Contract(contracts.tokenB, ERC20_ABI, signer);
            const pair = new ethers.Contract(contracts.pair, PAIR_ABI, signer);

            const [balanceA, balanceB, liquidityBal, reservesData] = await Promise.all([
                tokenA.balanceOf(address),
                tokenB.balanceOf(address),
                pair.balanceOf(address),
                pair.getReserves()
            ]);

            setTokenABalance(ethers.formatEther(balanceA));
            setTokenBBalance(ethers.formatEther(balanceB));
            setLiquidityBalance(ethers.formatEther(liquidityBal));
            setReserves({
                reserve0: ethers.formatEther(reservesData.reserve0),
                reserve1: ethers.formatEther(reservesData.reserve1)
            });

            console.log('✅ Balances loaded successfully');
        } catch (error) {
            console.error('❌ Failed to load balances:', error);
            toast.error('Failed to load data. Make sure contracts are deployed and you\'re on the correct network.');
        }
    };

    const executeSwap = async () => {
        if (!signer || !swapAmount) return;

        try {
            toast.loading('Executing swap...');

            const amountIn = ethers.parseEther(swapAmount);
            const tokenA = new ethers.Contract(contracts.tokenA, ERC20_ABI, signer);
            const tokenB = new ethers.Contract(contracts.tokenB, ERC20_ABI, signer);
            const pair = new ethers.Contract(contracts.pair, PAIR_ABI, signer);

            const [reserve0, reserve1] = await pair.getReserves();
            const reserveIn = swapDirection === 'AtoB' ? reserve0 : reserve1;
            const reserveOut = swapDirection === 'AtoB' ? reserve1 : reserve0;

            const amountInWithFee = amountIn * BigInt(997);
            const numerator = amountInWithFee * reserveOut;
            const denominator = reserveIn * BigInt(1000) + amountInWithFee;
            const amountOut = numerator / denominator;

            const inputToken = swapDirection === 'AtoB' ? tokenA : tokenB;
            await inputToken.transfer(contracts.pair, amountIn);

            const amount0Out = swapDirection === 'AtoB' ? 0 : amountOut;
            const amount1Out = swapDirection === 'AtoB' ? amountOut : 0;

            await pair.swap(amount0Out, amount1Out, account, "0x");

            toast.dismiss();
            toast.success('Swap successful!');
            await loadBalances(signer, account);
            setSwapAmount('');
        } catch (error) {
            toast.dismiss();
            toast.error('Swap failed');
            console.error(error);
        }
    };

    const addLiquidity = async () => {
        if (!signer || !liquidityAmountA || !liquidityAmountB) return;

        try {
            toast.loading('Adding liquidity...');

            const amountA = ethers.parseEther(liquidityAmountA);
            const amountB = ethers.parseEther(liquidityAmountB);

            const tokenA = new ethers.Contract(contracts.tokenA, ERC20_ABI, signer);
            const tokenB = new ethers.Contract(contracts.tokenB, ERC20_ABI, signer);
            const pair = new ethers.Contract(contracts.pair, PAIR_ABI, signer);

            await tokenA.transfer(contracts.pair, amountA);
            await tokenB.transfer(contracts.pair, amountB);
            await pair.mint(account);

            toast.dismiss();
            toast.success('Liquidity added!');
            await loadBalances(signer, account);
            setLiquidityAmountA('');
            setLiquidityAmountB('');
        } catch (error) {
            toast.dismiss();
            toast.error('Failed to add liquidity');
            console.error(error);
        }
    };

    const removeLiquidity = async () => {
        if (!signer || !removeLiquidityAmount) return;

        try {
            toast.loading('Removing liquidity...');

            const amount = ethers.parseEther(removeLiquidityAmount);
            const pair = new ethers.Contract(contracts.pair, PAIR_ABI, signer);

            await pair.transfer(contracts.pair, amount);
            await pair.burn(account);

            toast.dismiss();
            toast.success('Liquidity removed!');
            await loadBalances(signer, account);
            setRemoveLiquidityAmount('');
        } catch (error) {
            toast.dismiss();
            toast.error('Failed to remove liquidity');
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
            <Toaster position="top-right" />

            {/* Header */}
            <header className="p-6 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                    <Droplets />
                    UniswapV2 DEX
                </h1>

                <ConnectWallet />
            </header>

            <div className="container mx-auto px-6 py-8">
                {/* Pool Info */}
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8 text-white">
                    <h2 className="text-xl font-semibold mb-4">Pool Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white/10 p-4 rounded-lg">
                            <div className="text-sm opacity-70">TKA Reserve</div>
                            <div className="text-2xl font-bold">{parseFloat(reserves.reserve0).toFixed(2)}</div>
                        </div>
                        <div className="bg-white/10 p-4 rounded-lg">
                            <div className="text-sm opacity-70">TKB Reserve</div>
                            <div className="text-2xl font-bold">{parseFloat(reserves.reserve1).toFixed(2)}</div>
                        </div>
                        <div className="bg-white/10 p-4 rounded-lg">
                            <div className="text-sm opacity-70">Exchange Rate</div>
                            <div className="text-lg font-bold">
                                1 TKA = {reserves.reserve0 !== '0' ? (parseFloat(reserves.reserve1) / parseFloat(reserves.reserve0)).toFixed(4) : '0'} TKB
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Interface */}
                <div className="max-w-md mx-auto">
                    {/* Tab Switcher */}
                    <div className="flex bg-white/10 backdrop-blur-lg rounded-xl p-1 mb-6">
                        <button
                            onClick={() => setActiveTab('swap')}
                            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'swap' ? 'bg-blue-600 text-white' : 'text-white/70 hover:text-white'
                                }`}
                        >
                            <ArrowDownUp />
                            Swap
                        </button>
                        <button
                            onClick={() => setActiveTab('liquidity')}
                            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'liquidity' ? 'bg-blue-600 text-white' : 'text-white/70 hover:text-white'
                                }`}
                        >
                            <Droplets />
                            Liquidity
                        </button>
                    </div>

                    {/* Swap Interface */}
                    {activeTab === 'swap' && (
                        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-white">
                            <h3 className="text-lg font-semibold mb-4">Swap Tokens</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm opacity-70 mb-2">
                                        From: {swapDirection === 'AtoB' ? 'TKA' : 'TKB'}
                                    </label>
                                    <input
                                        type="number"
                                        value={swapAmount}
                                        onChange={(e) => setSwapAmount(e.target.value)}
                                        placeholder="0.0"
                                        className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
                                    />
                                    <div className="text-sm opacity-70 mt-1">
                                        Balance: {swapDirection === 'AtoB' ? parseFloat(tokenABalance).toFixed(4) : parseFloat(tokenBBalance).toFixed(4)}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSwapDirection(swapDirection === 'AtoB' ? 'BtoA' : 'AtoB')}
                                    className="w-full py-2 text-blue-400 hover:text-blue-300 transition-colors flex justify-center"
                                >
                                    <ArrowDownUp />
                                </button>

                                <div>
                                    <label className="block text-sm opacity-70 mb-2">
                                        To: {swapDirection === 'AtoB' ? 'TKB' : 'TKA'}
                                    </label>
                                    <div className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white/70">
                                        {swapAmount && reserves.reserve0 !== '0' ?
                                            (() => {
                                                const amountIn = parseFloat(swapAmount) || 0;
                                                const reserveIn = parseFloat(swapDirection === 'AtoB' ? reserves.reserve0 : reserves.reserve1);
                                                const reserveOut = parseFloat(swapDirection === 'AtoB' ? reserves.reserve1 : reserves.reserve0);
                                                const amountOut = (amountIn * reserveOut * 0.997) / (reserveIn + amountIn * 0.997);
                                                return amountOut.toFixed(6);
                                            })()
                                            : '0.0'
                                        }
                                    </div>
                                </div>

                                <button
                                    onClick={executeSwap}
                                    disabled={!account || !swapAmount}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                                >
                                    Swap
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Liquidity Interface */}
                    {activeTab === 'liquidity' && (
                        <div className="space-y-6">
                            {/* Add Liquidity */}
                            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-white">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Plus />
                                    Add Liquidity
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm opacity-70 mb-2">TKA Amount</label>
                                        <input
                                            type="number"
                                            value={liquidityAmountA}
                                            onChange={(e) => setLiquidityAmountA(e.target.value)}
                                            placeholder="0.0"
                                            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
                                        />
                                        <div className="text-sm opacity-70 mt-1">Balance: {parseFloat(tokenABalance).toFixed(4)}</div>
                                    </div>

                                    <div>
                                        <label className="block text-sm opacity-70 mb-2">TKB Amount</label>
                                        <input
                                            type="number"
                                            value={liquidityAmountB}
                                            onChange={(e) => setLiquidityAmountB(e.target.value)}
                                            placeholder="0.0"
                                            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
                                        />
                                        <div className="text-sm opacity-70 mt-1">Balance: {parseFloat(tokenBBalance).toFixed(4)}</div>
                                    </div>

                                    <button
                                        onClick={addLiquidity}
                                        disabled={!account || !liquidityAmountA || !liquidityAmountB}
                                        className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                                    >
                                        Add Liquidity
                                    </button>
                                </div>
                            </div>

                            {/* Remove Liquidity */}
                            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-white">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Minus />
                                    Remove Liquidity
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm opacity-70 mb-2">Liquidity Amount</label>
                                        <input
                                            type="number"
                                            value={removeLiquidityAmount}
                                            onChange={(e) => setRemoveLiquidityAmount(e.target.value)}
                                            placeholder="0.0"
                                            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
                                        />
                                        <div className="text-sm opacity-70 mt-1">
                                            Your Liquidity: {parseFloat(liquidityBalance).toFixed(4)} UNI-V2
                                        </div>
                                    </div>

                                    <button
                                        onClick={removeLiquidity}
                                        disabled={!account || !removeLiquidityAmount}
                                        className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                                    >
                                        Remove Liquidity
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Token Balances */}
                {account && (
                    <div className="max-w-md mx-auto mt-8">
                        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-white">
                            <h3 className="text-lg font-semibold mb-4">Your Balances</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>TKA:</span>
                                    <span>{parseFloat(tokenABalance).toFixed(4)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>TKB:</span>
                                    <span>{parseFloat(tokenBBalance).toFixed(4)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>LP Tokens:</span>
                                    <span>{parseFloat(liquidityBalance).toFixed(4)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
