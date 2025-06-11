'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import toast, { Toaster } from 'react-hot-toast';
import { ArrowLeftRight, Plus, Minus, Droplets, Wallet } from 'lucide-react';

// Extend the Window interface to include ethereum
declare global {
    interface Window {
        ethereum?: any;
    }
}


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

    // Loading states
    const [isLoading, setIsLoading] = useState(true);
    const [isContractsLoaded, setIsContractsLoaded] = useState(false);
    const [contractsError, setContractsError] = useState<string>('');

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

    useEffect(() => {
        const initializeApp = async () => {
            setIsLoading(true);

            // Check for MetaMask
            if (typeof window !== 'undefined' && window.ethereum) {
                const provider = new ethers.BrowserProvider(window.ethereum);
                setProvider(provider);

                // Check if already connected
                try {
                    const accounts = await provider.listAccounts();
                    if (accounts.length > 0) {
                        const signer = await provider.getSigner();
                        const address = await signer.getAddress();
                        setSigner(signer);
                        setAccount(address);
                    }
                } catch (error) {
                    console.log('Not connected yet');
                }
            } else {
                setContractsError('MetaMask not detected. Please install MetaMask to use this DEX.');
                setIsLoading(false);
                return;
            }

            // Load contract addresses from config file
            try {
                const response = await fetch('/config/contracts.json');
                if (response.ok) {
                    const contractData = await response.json();
                    setContracts(contractData);
                    setIsContractsLoaded(true);
                    console.log(' Loaded contract addresses from config');
                } else {
                    console.log(' Using default contract addresses - make sure to deploy contracts first');
                    setIsContractsLoaded(true);
                }
            } catch (error) {
                console.log('Using default contract addresses - config file not found');
                setIsContractsLoaded(true);
            }

            setIsLoading(false);
        };

        initializeApp();
    }, []);

    const connectWallet = async () => {
        if (!provider) {
            toast.error('MetaMask not detected!');
            return;
        }

        try {
            // Check current network
            const network = await provider.getNetwork();
            console.log('Current network:', network);

            // Check if we're on localhost (chain ID 1337 or 31337)
            if (network.chainId !== 1337n && network.chainId !== 31337n) {
                toast.error('Please switch to Localhost network (http://127.0.0.1:8545)');
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x539' }], // 1337 in hex
                    });
                } catch (switchError: any) {
                    // This error code indicates that the chain has not been added to MetaMask
                    if (switchError.code === 4902) {
                        try {
                            await window.ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [
                                    {
                                        chainId: '0x539',
                                        chainName: 'Localhost 8545',
                                        rpcUrls: ['http://127.0.0.1:8545'],
                                        nativeCurrency: {
                                            name: 'Ethereum',
                                            symbol: 'ETH',
                                            decimals: 18,
                                        },
                                    },
                                ],
                            });
                        } catch (addError) {
                            console.error('Failed to add network:', addError);
                            toast.error('Failed to add localhost network');
                            return;
                        }
                    } else {
                        console.error('Failed to switch network:', switchError);
                        return;
                    }
                }
            }

            // First check if already connected
            const accounts = await provider.listAccounts();
            if (accounts.length > 0) {
                const signer = await provider.getSigner();
                const address = await signer.getAddress();
                setSigner(signer);
                setAccount(address);
                toast.success('Wallet already connected!');
                if (isContractsLoaded) {
                    await loadBalances(signer, address);
                }
                return;
            }

            // Request connection
            await window.ethereum.request({
                method: 'eth_requestAccounts',
            });

            const signer = await provider.getSigner();
            const address = await signer.getAddress();

            setSigner(signer);
            setAccount(address);
            toast.success(`Wallet connected! Address: ${address}`);

            // Show helpful message about Hardhat accounts
            if (address === '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E') {
                toast.success('🎉 Connected to Hardhat test account with 10,000 ETH!');
            }

            // Only load balances if contracts are loaded
            if (isContractsLoaded) {
                await loadBalances(signer, address);
            }
        } catch (error: any) {
            if (error.code === 4001) {
                toast.error('Please connect to MetaMask.');
            } else if (error.code === -32002) {
                toast.error('Please check MetaMask - connection request is pending.');
            } else {
                toast.error('Failed to connect wallet');
                console.error(error);
            }
        }
    };

    const loadBalances = async (signer: ethers.JsonRpcSigner, address: string) => {
        if (!isContractsLoaded) {
            toast.error('Contracts not loaded yet');
            return;
        }

        try {
            console.log('📊 Loading balances for:', address);
            console.log('🔗 Using contracts:', contracts);

            const tokenA = new ethers.Contract(contracts.tokenA, ERC20_ABI, signer);
            const tokenB = new ethers.Contract(contracts.tokenB, ERC20_ABI, signer);
            const pair = new ethers.Contract(contracts.pair, PAIR_ABI, signer);

            // Test contract connectivity first
            await Promise.all([
                tokenA.symbol(),
                tokenB.symbol(),
                pair.totalSupply()
            ]);

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

            // Show setup instructions if no tokens
            if (balanceA === 0n && balanceB === 0n) {
                toast('💡 No tokens found! Use the "Get Test Tokens" button to mint some tokens for testing.', {
                    duration: 5000,
                    icon: '💡'
                });
            }
        } catch (error) {
            console.error('❌ Failed to load balances:', error);
            toast.error('Failed to load contract data. Please check network and contract deployment.');
        }
    };

    const getTestTokens = async () => {
        if (!signer || !account) {
            toast.error('Please connect wallet first');
            return;
        }

        try {
            toast.loading('Minting test tokens...');

            const tokenA = new ethers.Contract(contracts.tokenA, [
                ...ERC20_ABI,
                "function mint(address to, uint256 amount) external"
            ], signer);

            const tokenB = new ethers.Contract(contracts.tokenB, [
                ...ERC20_ABI,
                "function mint(address to, uint256 amount) external"
            ], signer);

            // Mint 1000 tokens of each type
            const mintAmount = ethers.parseEther("1000");

            await tokenA.mint(account, mintAmount);
            await tokenB.mint(account, mintAmount);

            toast.dismiss();
            toast.success('🎉 Test tokens minted! You now have 1000 TKA and 1000 TKB');

            // Reload balances
            await loadBalances(signer, account);
        } catch (error: any) {
            toast.dismiss();
            if (error.message.includes('mint')) {
                toast.error('Minting failed. These tokens might not support minting or you might not have permission.');
            } else {
                toast.error('Failed to get test tokens');
            }
            console.error(error);
        }
    };

    const addInitialLiquidity = async () => {
        if (!signer || !account) {
            toast.error('Please connect wallet first');
            return;
        }

        try {
            toast.loading('Adding initial liquidity...');

            const amountA = ethers.parseEther("100"); // 100 TKA
            const amountB = ethers.parseEther("100"); // 100 TKB

            const tokenA = new ethers.Contract(contracts.tokenA, ERC20_ABI, signer);
            const tokenB = new ethers.Contract(contracts.tokenB, ERC20_ABI, signer);
            const pair = new ethers.Contract(contracts.pair, PAIR_ABI, signer);

            // Check balances first
            const balanceA = await tokenA.balanceOf(account);
            const balanceB = await tokenB.balanceOf(account);

            if (balanceA < amountA || balanceB < amountB) {
                toast.dismiss();
                toast.error('Insufficient token balance. Get test tokens first!');
                return;
            }

            await tokenA.transfer(contracts.pair, amountA);
            await tokenB.transfer(contracts.pair, amountB);
            await pair.mint(account);

            toast.dismiss();
            toast.success('🎉 Initial liquidity added! Pool is now active with 100 TKA and 100 TKB');

            await loadBalances(signer, account);
        } catch (error) {
            toast.dismiss();
            toast.error('Failed to add initial liquidity');
            console.error(error);
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

    // Show loading spinner while initializing
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
                <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
                    <h2 className="text-2xl font-bold mb-2">Loading DEXERT</h2>
                    <p className="text-white/70">Initializing contracts and checking network...</p>
                </div>
            </div>
        );
    }

    // Show error if contracts failed to load
    if (contractsError) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
                <div className="text-center text-white max-w-md">
                    <div className="text-6xl mb-4"></div>
                    <h2 className="text-2xl font-bold mb-4">Setup Required</h2>
                    <p className="text-white/70 mb-6">{contractsError}</p>
                    <div className="bg-white/10 p-4 rounded-lg text-left text-sm">
                        <p className="font-semibold mb-2">To use this DEX:</p>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Install MetaMask browser extension</li>
                            <li>Deploy contracts using: <code className="bg-black/20 px-1 rounded">npx hardhat run scripts/deploy.js --network localhost</code></li>
                            <li>Make sure you're on the correct network</li>
                            <li>Refresh this page</li>
                        </ol>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
            <Toaster position="top-right" />

            {/* Header */}
            <header className="p-6 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                    <Droplets size={24} />
                    UniswapV2 DEX
                </h1>

                <button
                    onClick={connectWallet}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-lg border border-white/30 rounded-xl px-6 py-3 text-white font-medium transition-all duration-300 flex items-center gap-2"
                >
                    <Wallet size={20} />
                    {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect Wallet'}
                </button>
            </header>

            {/* Network Info Banner */}
            <div className="mx-6 mb-4 bg-blue-600/20 border border-blue-500/30 rounded-lg p-4 text-blue-100">
                <p className="text-sm">
                    🌐 Connect to: <code className="bg-black/20 px-1 rounded">Localhost 8545 (http://127.0.0.1:8545)</code>
                    <br />
                    💰 Test Account Available: <code className="bg-black/20 px-1 rounded">0xbDA5747bFD65F08deb54cb465eB87D40e51B197E</code>
                </p>
            </div>

            {/* Contract deployment banner */}
            {contracts === defaultContracts && (
                <div className="mx-6 mb-4 bg-yellow-600/20 border border-yellow-500/30 rounded-lg p-4 text-yellow-100">
                    <p className="text-sm">⚠️ Using default contract addresses. Make sure Hardhat node is running and contracts are deployed using: <code className="bg-black/20 px-1 rounded">npx hardhat run scripts/deploy.js --network localhost</code></p>
                </div>
            )}

            {/* Setup Helper Buttons */}
            {account && (parseFloat(tokenABalance) === 0 || parseFloat(tokenBBalance) === 0 || parseFloat(reserves.reserve0) === 0) && (
                <div className="mx-6 mb-4 bg-green-600/20 border border-green-500/30 rounded-lg p-4 text-green-100">
                    <h3 className="font-semibold mb-2">🚀 Quick Setup for Testing</h3>
                    <div className="flex flex-wrap gap-2">
                        {(parseFloat(tokenABalance) === 0 || parseFloat(tokenBBalance) === 0) && (
                            <button
                                onClick={getTestTokens}
                                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white font-medium transition-colors"
                            >
                                Get Test Tokens (1000 each)
                            </button>
                        )}
                        {parseFloat(tokenABalance) > 0 && parseFloat(tokenBBalance) > 0 && parseFloat(reserves.reserve0) === 0 && (
                            <button
                                onClick={addInitialLiquidity}
                                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium transition-colors"
                            >
                                Add Initial Liquidity (100 each)
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="container mx-auto px-6 py-8">
                {/* Pool Info */}
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8 text-white">
                    <h2 className="text-xl font-semibold mb-4">Pool Information</h2>
                    {parseFloat(reserves.reserve0) === 0 && parseFloat(reserves.reserve1) === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-4xl mb-4">🏊‍♂️</div>
                            <h3 className="text-lg font-semibold mb-2">Pool is Empty</h3>
                            <p className="text-white/70">Add initial liquidity to start trading!</p>
                        </div>
                    ) : (
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
                    )}
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
                            <ArrowLeftRight size={20} />
                            Swap
                        </button>
                        <button
                            onClick={() => setActiveTab('liquidity')}
                            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'liquidity' ? 'bg-blue-600 text-white' : 'text-white/70 hover:text-white'
                                }`}
                        >
                            <Droplets size={20} />
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
                                    <ArrowLeftRight size={20} />
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
                                    <Plus size={20} />
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
                                    <Minus size={20} />
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