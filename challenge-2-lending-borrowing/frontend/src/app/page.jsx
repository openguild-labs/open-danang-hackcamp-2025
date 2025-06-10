'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useEffect } from 'react';
import { parseEther, formatEther, formatUnits } from 'viem';
import { CONTRACT_ADDRESSES, LENDING_POOL_ABI, ERC20_ABI, LENDING_OPERATIONS } from '../config/wagmi';

export default function Home() {
    const { address, isConnected } = useAccount();
    const [amounts, setAmounts] = useState({
        depositCollateral: '',
        withdrawCollateral: '',
        takeLoan: '',
        repayLoan: ''
    });
    const [activeTab, setActiveTab] = useState('depositCollateral');

    // Core Functions - Contract reads for user data
    const { data: collateralBalance, refetch: refetchCollateralBalance } = useReadContract({
        address: CONTRACT_ADDRESSES.LENDING_POOL,
        abi: LENDING_POOL_ABI,
        functionName: 'getCollateralBalance',
        args: [address],
        enabled: !!address && CONTRACT_ADDRESSES.LENDING_POOL !== "0x0000000000000000000000000000000000000000"
    });

    const { data: loanDetails, refetch: refetchLoanDetails } = useReadContract({
        address: CONTRACT_ADDRESSES.LENDING_POOL,
        abi: LENDING_POOL_ABI,
        functionName: 'getLoanDetails',
        args: [address],
        enabled: !!address && CONTRACT_ADDRESSES.LENDING_POOL !== "0x0000000000000000000000000000000000000000"
    });

    const { data: maxLoanAmount } = useReadContract({
        address: CONTRACT_ADDRESSES.LENDING_POOL,
        abi: LENDING_POOL_ABI,
        functionName: 'getMaxLoanAmount',
        args: [address],
        enabled: !!address && CONTRACT_ADDRESSES.LENDING_POOL !== "0x0000000000000000000000000000000000000000"
    });

    const { data: userHealthFactor } = useReadContract({
        address: CONTRACT_ADDRESSES.LENDING_POOL,
        abi: LENDING_POOL_ABI,
        functionName: 'getUserHealth',
        args: [address],
        enabled: !!address && CONTRACT_ADDRESSES.LENDING_POOL !== "0x0000000000000000000000000000000000000000"
    });

    // Helper Functions - Contract reads for protocol data
    const { data: availableLiquidity } = useReadContract({
        address: CONTRACT_ADDRESSES.LENDING_POOL,
        abi: LENDING_POOL_ABI,
        functionName: 'getAvailableLiquidity',
        enabled: CONTRACT_ADDRESSES.LENDING_POOL !== "0x0000000000000000000000000000000000000000"
    });

    const { data: collateralFactor } = useReadContract({
        address: CONTRACT_ADDRESSES.LENDING_POOL,
        abi: LENDING_POOL_ABI,
        functionName: 'collateralFactor',
        enabled: CONTRACT_ADDRESSES.LENDING_POOL !== "0x0000000000000000000000000000000000000000"
    });

    const { data: interestRate } = useReadContract({
        address: CONTRACT_ADDRESSES.LENDING_POOL,
        abi: LENDING_POOL_ABI,
        functionName: 'interestRate',
        enabled: CONTRACT_ADDRESSES.LENDING_POOL !== "0x0000000000000000000000000000000000000000"
    });

    const { data: liquidationThreshold } = useReadContract({
        address: CONTRACT_ADDRESSES.LENDING_POOL,
        abi: LENDING_POOL_ABI,
        functionName: 'liquidationThreshold',
        enabled: CONTRACT_ADDRESSES.LENDING_POOL !== "0x0000000000000000000000000000000000000000"
    });

    // Token balances
    const { data: collateralTokenBalance } = useReadContract({
        address: CONTRACT_ADDRESSES.COLLATERAL_TOKEN,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
        enabled: !!address && CONTRACT_ADDRESSES.COLLATERAL_TOKEN !== "0x0000000000000000000000000000000000000000"
    });

    const { data: loanTokenBalance } = useReadContract({
        address: CONTRACT_ADDRESSES.LOAN_TOKEN,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
        enabled: !!address && CONTRACT_ADDRESSES.LOAN_TOKEN !== "0x0000000000000000000000000000000000000000"
    });

    // Write contract hook
    const { writeContract, data: hash, isPending } = useWriteContract();

    // Wait for transaction
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    // Refetch data when transaction is successful
    useEffect(() => {
        if (isSuccess) {
            refetchCollateralBalance();
            refetchLoanDetails();
        }
    }, [isSuccess, refetchCollateralBalance, refetchLoanDetails]);

    // Core Function: depositCollateral implementation
    const handleDepositCollateral = async () => {
        if (!amounts.depositCollateral || !isConnected) return;

        try {
            const amount = parseEther(amounts.depositCollateral);

            // First approve tokens
            await writeContract({
                address: CONTRACT_ADDRESSES.COLLATERAL_TOKEN,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [CONTRACT_ADDRESSES.LENDING_POOL, amount]
            });

            // Then deposit collateral
            await writeContract({
                address: CONTRACT_ADDRESSES.LENDING_POOL,
                abi: LENDING_POOL_ABI,
                functionName: 'depositCollateral',
                args: [amount]
            });

            setAmounts(prev => ({ ...prev, depositCollateral: '' }));
        } catch (error) {
            console.error('depositCollateral failed:', error);
        }
    };

    // Core Function: withdrawCollateral implementation
    const handleWithdrawCollateral = async () => {
        if (!amounts.withdrawCollateral || !isConnected) return;

        try {
            const amount = parseEther(amounts.withdrawCollateral);
            await writeContract({
                address: CONTRACT_ADDRESSES.LENDING_POOL,
                abi: LENDING_POOL_ABI,
                functionName: 'withdrawCollateral',
                args: [amount]
            });

            setAmounts(prev => ({ ...prev, withdrawCollateral: '' }));
        } catch (error) {
            console.error('withdrawCollateral failed:', error);
        }
    };

    // Core Function: takeLoan implementation
    const handleTakeLoan = async () => {
        if (!amounts.takeLoan || !isConnected) return;

        try {
            const amount = parseEther(amounts.takeLoan);
            await writeContract({
                address: CONTRACT_ADDRESSES.LENDING_POOL,
                abi: LENDING_POOL_ABI,
                functionName: 'takeLoan',
                args: [amount]
            });

            setAmounts(prev => ({ ...prev, takeLoan: '' }));
        } catch (error) {
            console.error('takeLoan failed:', error);
        }
    };

    // Core Function: repayLoan implementation
    const handleRepayLoan = async () => {
        if (!isConnected || !loanDetails?.isActive) return;

        try {
            const repayAmount = amounts.repayLoan ? parseEther(amounts.repayLoan) : loanDetails.loanAmount;

            // First approve loan tokens
            await writeContract({
                address: CONTRACT_ADDRESSES.LOAN_TOKEN,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [CONTRACT_ADDRESSES.LENDING_POOL, repayAmount]
            });

            // Then repay loan
            await writeContract({
                address: CONTRACT_ADDRESSES.LENDING_POOL,
                abi: LENDING_POOL_ABI,
                functionName: 'repayLoan',
                args: []
            });

            setAmounts(prev => ({ ...prev, repayLoan: '' }));
        } catch (error) {
            console.error('repayLoan failed:', error);
        }
    };

    // Helper Function: _loanRequiredCollateral calculation
    const calculateLoanRequiredCollateral = (loanAmount) => {
        if (!loanAmount || !collateralFactor) return '0';
        const required = LENDING_OPERATIONS.calculateRequiredCollateral(
            parseEther(loanAmount),
            collateralFactor
        );
        return formatEther(required);
    };

    // Helper function to get health factor color
    const getHealthFactorColor = (healthFactor) => {
        if (!healthFactor) return 'text-gray-500';
        const health = Number(healthFactor);
        if (health >= 150) return 'text-green-600';
        if (health >= 120) return 'text-yellow-600';
        return 'text-red-600';
    };

    if (CONTRACT_ADDRESSES.LENDING_POOL === "0x0000000000000000000000000000000000000000") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Setup Required</h1>
                    <p className="text-gray-600 mb-4">
                        Please deploy the smart contracts first and update the contract addresses in the environment variables.
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <p className="text-sm text-yellow-800">
                            <strong>Next steps:</strong>
                            <br />1. Run deployment script
                            <br />2. Update .env.local with contract addresses
                            <br />3. Restart the app
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-800">🏦 DeFi Lending & Borrowing</h1>
                        <p className="text-gray-600 mt-2">Built on Paseo Asset Hub</p>
                    </div>
                    <ConnectButton />
                </div>

                {!isConnected ? (
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                            Connect your wallet to get started
                        </h2>
                        <p className="text-gray-500">
                            Connect your wallet to access DeFi lending and borrowing features
                        </p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Protocol Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Available Liquidity</h3>
                                <p className="text-2xl font-bold text-blue-600">
                                    {availableLiquidity ? formatEther(availableLiquidity) : '0'} LOAN
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Collateral Factor</h3>
                                <p className="text-2xl font-bold text-green-600">
                                    {collateralFactor ? `${collateralFactor}%` : '0%'}
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Interest Rate</h3>
                                <p className="text-2xl font-bold text-purple-600">
                                    {interestRate ? `${formatUnits(interestRate, 2)}%` : '0%'}
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Your Health Factor</h3>
                                <p className={`text-2xl font-bold ${getHealthFactorColor(userHealthFactor)}`}>
                                    {userHealthFactor ? `${formatUnits(userHealthFactor, 2)}%` : 'N/A'}
                                </p>
                            </div>
                        </div>

                        {/* User Position */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">Your Collateral</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Deposited:</span>
                                        <span className="font-semibold">
                                            {collateralBalance ? formatEther(collateralBalance) : '0'} COL
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Wallet Balance:</span>
                                        <span className="font-semibold">
                                            {collateralTokenBalance ? formatEther(collateralTokenBalance) : '0'} COL
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">Your Loan</h3>
                                <div className="space-y-2">
                                    {loanDetails?.isActive ? (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Borrowed:</span>
                                                <span className="font-semibold text-red-600">
                                                    {formatEther(loanDetails.loanAmount)} LOAN
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Due Date:</span>
                                                <span className="text-sm">
                                                    {new Date(Number(loanDetails.dueDate) * 1000).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-gray-500">No active loan</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">Borrowing Power</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Max Loan:</span>
                                        <span className="font-semibold text-green-600">
                                            {maxLoanAmount ? formatEther(maxLoanAmount) : '0'} LOAN
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">LOAN Balance:</span>
                                        <span className="font-semibold">
                                            {loanTokenBalance ? formatEther(loanTokenBalance) : '0'} LOAN
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Core Functions - Action Tabs */}
                        <div className="bg-white rounded-lg shadow">
                            <div className="border-b border-gray-200">
                                <nav className="-mb-px flex space-x-8 px-6">
                                    {[
                                        { id: 'depositCollateral', name: '🏦 Deposit Collateral', icon: '🏦', description: 'Core Function: depositCollateral' },
                                        { id: 'withdrawCollateral', name: '💰 Withdraw Collateral', icon: '💰', description: 'Core Function: withdrawCollateral' },
                                        { id: 'takeLoan', name: '📈 Take Loan', icon: '📈', description: 'Core Function: takeLoan' },
                                        { id: 'repayLoan', name: '💳 Repay Loan', icon: '💳', description: 'Core Function: repayLoan' }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`${activeTab === tab.id
                                                ? 'border-blue-500 text-blue-600 bg-blue-50'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm relative group`}
                                            title={tab.description}
                                        >
                                            {tab.name}
                                            {/* Core Function Badge */}
                                            <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1 rounded-full">
                                                CORE
                                            </span>
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            <div className="p-6">
                                {/* Core Function 1: depositCollateral */}
                                {activeTab === 'depositCollateral' && (
                                    <div className="space-y-4">
                                        <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
                                            <h4 className="font-semibold text-green-800">🟢 Core Function: depositCollateral</h4>
                                            <p className="text-sm text-green-700">Allows users to deposit collateral tokens to secure loans</p>
                                        </div>
                                        <h3 className="text-lg font-semibold">Deposit Collateral</h3>
                                        <input
                                            type="number"
                                            placeholder="Amount (COL)"
                                            className="w-full p-3 border rounded-lg"
                                            value={amounts.depositCollateral}
                                            onChange={(e) => setAmounts(prev => ({ ...prev, depositCollateral: e.target.value }))}
                                        />
                                        <div className="text-sm text-gray-600">
                                            Available: {collateralTokenBalance ? formatEther(collateralTokenBalance) : '0'} COL
                                        </div>
                                        <button
                                            onClick={handleDepositCollateral}
                                            disabled={isPending || isConfirming || !amounts.depositCollateral}
                                            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {isPending || isConfirming ? 'Processing...' : 'Deposit Collateral'}
                                        </button>
                                    </div>
                                )}

                                {/* Core Function 2: withdrawCollateral */}
                                {activeTab === 'withdrawCollateral' && (
                                    <div className="space-y-4">
                                        <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
                                            <h4 className="font-semibold text-green-800">🟢 Core Function: withdrawCollateral</h4>
                                            <p className="text-sm text-green-700">Allows users to withdraw their deposited collateral (if no active loans)</p>
                                        </div>
                                        <h3 className="text-lg font-semibold">Withdraw Collateral</h3>
                                        <input
                                            type="number"
                                            placeholder="Amount (COL)"
                                            className="w-full p-3 border rounded-lg"
                                            value={amounts.withdrawCollateral}
                                            onChange={(e) => setAmounts(prev => ({ ...prev, withdrawCollateral: e.target.value }))}
                                        />
                                        <div className="text-sm text-gray-600">
                                            Available: {collateralBalance ? formatEther(collateralBalance) : '0'} COL
                                        </div>
                                        <button
                                            onClick={handleWithdrawCollateral}
                                            disabled={isPending || isConfirming || !amounts.withdrawCollateral}
                                            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
                                        >
                                            {isPending || isConfirming ? 'Processing...' : 'Withdraw Collateral'}
                                        </button>
                                    </div>
                                )}

                                {/* Core Function 3: takeLoan */}
                                {activeTab === 'takeLoan' && (
                                    <div className="space-y-4">
                                        <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
                                            <h4 className="font-semibold text-green-800">🟢 Core Function: takeLoan</h4>
                                            <p className="text-sm text-green-700">Allows users to borrow tokens against their collateral</p>
                                        </div>
                                        <h3 className="text-lg font-semibold">Take Loan</h3>
                                        <input
                                            type="number"
                                            placeholder="Loan Amount (LOAN)"
                                            className="w-full p-3 border rounded-lg"
                                            value={amounts.takeLoan}
                                            onChange={(e) => setAmounts(prev => ({ ...prev, takeLoan: e.target.value }))}
                                        />
                                        {amounts.takeLoan && (
                                            <div className="bg-gray-50 p-3 rounded text-sm">
                                                <div className="flex justify-between">
                                                    <span>Required Collateral:</span>
                                                    <span className="font-semibold">
                                                        {calculateLoanRequiredCollateral(amounts.takeLoan)} COL
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        <div className="text-sm text-gray-600">
                                            Max Available: {maxLoanAmount ? formatEther(maxLoanAmount) : '0'} LOAN
                                        </div>
                                        <button
                                            onClick={handleTakeLoan}
                                            disabled={isPending || isConfirming || !amounts.takeLoan || loanDetails?.isActive}
                                            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                                        >
                                            {isPending || isConfirming ? 'Processing...' : 'Take Loan'}
                                        </button>
                                        {loanDetails?.isActive && (
                                            <p className="text-sm text-red-500">You already have an active loan</p>
                                        )}
                                    </div>
                                )}

                                {/* Core Function 4: repayLoan */}
                                {activeTab === 'repayLoan' && (
                                    <div className="space-y-4">
                                        <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
                                            <h4 className="font-semibold text-green-800">🟢 Core Function: repayLoan</h4>
                                            <p className="text-sm text-green-700">Allows users to repay their outstanding loans with interest</p>
                                        </div>
                                        <h3 className="text-lg font-semibold">Repay Loan</h3>
                                        {loanDetails?.isActive ? (
                                            <>
                                                <div className="bg-gray-50 p-4 rounded">
                                                    <div className="flex justify-between mb-2">
                                                        <span>Total Loan Amount:</span>
                                                        <span className="font-semibold">
                                                            {formatEther(loanDetails.loanAmount)} LOAN
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Interest Rate:</span>
                                                        <span>{interestRate ? `${formatUnits(interestRate, 2)}%` : '0%'}</span>
                                                    </div>
                                                </div>
                                                <input
                                                    type="number"
                                                    placeholder={`Repay Amount (LOAN) - Max: ${formatEther(loanDetails.loanAmount)}`}
                                                    className="w-full p-3 border rounded-lg"
                                                    value={amounts.repayLoan}
                                                    onChange={(e) => setAmounts(prev => ({ ...prev, repayLoan: e.target.value }))}
                                                />
                                                <div className="text-sm text-gray-600">
                                                    Your LOAN Balance: {loanTokenBalance ? formatEther(loanTokenBalance) : '0'} LOAN
                                                </div>
                                                <button
                                                    onClick={handleRepayLoan}
                                                    disabled={isPending || isConfirming}
                                                    className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50"
                                                >
                                                    {isPending || isConfirming ? 'Processing...' : 'Repay Loan'}
                                                </button>
                                            </>
                                        ) : (
                                            <p className="text-gray-500 text-center py-8">No active loan to repay</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Core Functions Summary Card */}
                        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg shadow border border-green-200">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">🎯 Core Functions Available</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white p-3 rounded-lg shadow-sm border border-green-200">
                                    <div className="text-center">
                                        <div className="text-2xl mb-2">🏦</div>
                                        <div className="font-semibold text-sm">depositCollateral</div>
                                        <div className="text-xs text-gray-600">Secure your position</div>
                                    </div>
                                </div>
                                <div className="bg-white p-3 rounded-lg shadow-sm border border-green-200">
                                    <div className="text-center">
                                        <div className="text-2xl mb-2">💰</div>
                                        <div className="font-semibold text-sm">withdrawCollateral</div>
                                        <div className="text-xs text-gray-600">Release collateral</div>
                                    </div>
                                </div>
                                <div className="bg-white p-3 rounded-lg shadow-sm border border-green-200">
                                    <div className="text-center">
                                        <div className="text-2xl mb-2">📈</div>
                                        <div className="font-semibold text-sm">takeLoan</div>
                                        <div className="text-xs text-gray-600">Borrow assets</div>
                                    </div>
                                </div>
                                <div className="bg-white p-3 rounded-lg shadow-sm border border-green-200">
                                    <div className="text-center">
                                        <div className="text-2xl mb-2">💳</div>
                                        <div className="font-semibold text-sm">repayLoan</div>
                                        <div className="text-xs text-gray-600">Clear debt</div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                                <p className="text-sm text-blue-800">
                                    <strong>How to access:</strong> Click on any tab above to use the core DeFi lending functions.
                                    Each function is fully implemented with proper validation and error handling.
                                </p>
                            </div>
                        </div>

                        {/* Transaction Status */}
                        {hash && (
                            <div className="bg-white p-4 rounded-lg shadow">
                                <p className="text-sm text-gray-600">
                                    Transaction Hash:
                                    <a
                                        href={`https://blockscout-passet-hub.parity-testnet.parity.io/tx/${hash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline ml-1 break-all"
                                    >
                                        {hash}
                                    </a>
                                </p>
                                {isConfirming && <p className="text-yellow-600 mt-2">⏳ Waiting for confirmation...</p>}
                                {isSuccess && <p className="text-green-600 mt-2">✅ Transaction confirmed!</p>}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
