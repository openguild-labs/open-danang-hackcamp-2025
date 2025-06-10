'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, formatUnits } from 'viem';
import { CONTRACT_ADDRESSES, LENDING_POOL_ABI, ERC20_ABI, LENDING_OPERATIONS } from '../config/wagmi';

export default function DeFiInterface() {
    const { address, isConnected } = useAccount();
    const [amounts, setAmounts] = useState({
        deposit: '',
        withdraw: '',
        loan: '',
        repay: ''
    });
    const [activeTab, setActiveTab] = useState('deposit');

    // Contract reads for user data
    const { data: collateralBalance, refetch: refetchCollateral } = useReadContract({
        address: CONTRACT_ADDRESSES.LENDING_POOL,
        abi: LENDING_POOL_ABI,
        functionName: 'getCollateralBalance',
        args: [address],
        enabled: !!address && CONTRACT_ADDRESSES.LENDING_POOL !== "0x0000000000000000000000000000000000000000"
    });

    const { data: loanDetails, refetch: refetchLoan } = useReadContract({
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

    const { data: userHealth } = useReadContract({
        address: CONTRACT_ADDRESSES.LENDING_POOL,
        abi: LENDING_POOL_ABI,
        functionName: 'getUserHealth',
        args: [address],
        enabled: !!address && CONTRACT_ADDRESSES.LENDING_POOL !== "0x0000000000000000000000000000000000000000"
    });

    // Contract reads for protocol data
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
            refetchCollateral();
            refetchLoan();
        }
    }, [isSuccess, refetchCollateral, refetchLoan]);

    // Core Functions Implementation
    const depositCollateral = async () => {
        if (!amounts.deposit || !isConnected) return;

        try {
            const amount = parseEther(amounts.deposit);

            // First approve tokens
            await writeContract({
                address: CONTRACT_ADDRESSES.COLLATERAL_TOKEN,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [CONTRACT_ADDRESSES.LENDING_POOL, amount]
            });

            // Then deposit
            await writeContract({
                address: CONTRACT_ADDRESSES.LENDING_POOL,
                abi: LENDING_POOL_ABI,
                functionName: 'depositCollateral',
                args: [amount]
            });

            setAmounts(prev => ({ ...prev, deposit: '' }));
        } catch (error) {
            console.error('Deposit failed:', error);
        }
    };

    const withdrawCollateral = async () => {
        if (!amounts.withdraw || !isConnected) return;

        try {
            const amount = parseEther(amounts.withdraw);
            await writeContract({
                address: CONTRACT_ADDRESSES.LENDING_POOL,
                abi: LENDING_POOL_ABI,
                functionName: 'withdrawCollateral',
                args: [amount]
            });

            setAmounts(prev => ({ ...prev, withdraw: '' }));
        } catch (error) {
            console.error('Withdraw failed:', error);
        }
    };

    const takeLoan = async () => {
        if (!amounts.loan || !isConnected) return;

        try {
            const amount = parseEther(amounts.loan);
            await writeContract({
                address: CONTRACT_ADDRESSES.LENDING_POOL,
                abi: LENDING_POOL_ABI,
                functionName: 'takeLoan',
                args: [amount]
            });

            setAmounts(prev => ({ ...prev, loan: '' }));
        } catch (error) {
            console.error('Take loan failed:', error);
        }
    };

    const repayLoan = async () => {
        if (!isConnected || !loanDetails?.isActive) return;

        try {
            const repayAmount = amounts.repay ? parseEther(amounts.repay) : loanDetails.loanAmount;

            // First approve loan tokens
            await writeContract({
                address: CONTRACT_ADDRESSES.LOAN_TOKEN,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [CONTRACT_ADDRESSES.LENDING_POOL, repayAmount]
            });

            // Then repay
            await writeContract({
                address: CONTRACT_ADDRESSES.LENDING_POOL,
                abi: LENDING_POOL_ABI,
                functionName: 'repayLoan',
                args: []
            });

            setAmounts(prev => ({ ...prev, repay: '' }));
        } catch (error) {
            console.error('Repay loan failed:', error);
        }
    };

    // Helper function to calculate required collateral
    const calculateRequiredCollateral = (loanAmount) => {
        if (!loanAmount || !collateralFactor) return '0';
        const required = LENDING_OPERATIONS.calculateRequiredCollateral(
            parseEther(loanAmount),
            collateralFactor
        );
        return formatEther(required);
    };

    // Helper function to get health factor color
    const getHealthColor = (healthFactor) => {
        if (!healthFactor) return 'text-gray-500';
        const health = Number(healthFactor);
        if (health >= 150) return 'text-green-600';
        if (health >= 120) return 'text-yellow-600';
        return 'text-red-600';
    };

    if (!isConnected) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                    Connect your wallet to access DeFi features
                </h2>
                <p className="text-gray-500">
                    Connect your wallet to deposit collateral, take loans, and manage your positions
                </p>
            </div>
        );
    }

    if (CONTRACT_ADDRESSES.LENDING_POOL === "0x0000000000000000000000000000000000000000") {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Contracts Not Deployed</h3>
                <p className="text-yellow-700">
                    Please deploy the smart contracts and update the contract addresses in your environment variables.
                </p>
            </div>
        );
    }

    return (
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
                    <p className={`text-2xl font-bold ${getHealthColor(userHealth)}`}>
                        {userHealth ? `${formatUnits(userHealth, 2)}%` : 'N/A'}
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

            {/* Action Tabs */}
            <div className="bg-white rounded-lg shadow">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 px-6">
                        {[
                            { id: 'deposit', name: 'Deposit Collateral', icon: '🏦' },
                            { id: 'withdraw', name: 'Withdraw Collateral', icon: '💰' },
                            { id: 'borrow', name: 'Take Loan', icon: '📈' },
                            { id: 'repay', name: 'Repay Loan', icon: '💳' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                {tab.icon} {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === 'deposit' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Deposit Collateral</h3>
                            <input
                                type="number"
                                placeholder="Amount (COL)"
                                className="w-full p-3 border rounded-lg"
                                value={amounts.deposit}
                                onChange={(e) => setAmounts(prev => ({ ...prev, deposit: e.target.value }))}
                            />
                            <button
                                onClick={depositCollateral}
                                disabled={isPending || isConfirming || !amounts.deposit}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isPending || isConfirming ? 'Processing...' : 'Deposit Collateral'}
                            </button>
                        </div>
                    )}

                    {activeTab === 'withdraw' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Withdraw Collateral</h3>
                            <input
                                type="number"
                                placeholder="Amount (COL)"
                                className="w-full p-3 border rounded-lg"
                                value={amounts.withdraw}
                                onChange={(e) => setAmounts(prev => ({ ...prev, withdraw: e.target.value }))}
                            />
                            <div className="text-sm text-gray-600">
                                Available: {collateralBalance ? formatEther(collateralBalance) : '0'} COL
                            </div>
                            <button
                                onClick={withdrawCollateral}
                                disabled={isPending || isConfirming || !amounts.withdraw}
                                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {isPending || isConfirming ? 'Processing...' : 'Withdraw Collateral'}
                            </button>
                        </div>
                    )}

                    {activeTab === 'borrow' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Take Loan</h3>
                            <input
                                type="number"
                                placeholder="Loan Amount (LOAN)"
                                className="w-full p-3 border rounded-lg"
                                value={amounts.loan}
                                onChange={(e) => setAmounts(prev => ({ ...prev, loan: e.target.value }))}
                            />
                            {amounts.loan && (
                                <div className="bg-gray-50 p-3 rounded text-sm">
                                    <div className="flex justify-between">
                                        <span>Required Collateral:</span>
                                        <span className="font-semibold">
                                            {calculateRequiredCollateral(amounts.loan)} COL
                                        </span>
                                    </div>
                                </div>
                            )}
                            <div className="text-sm text-gray-600">
                                Max Available: {maxLoanAmount ? formatEther(maxLoanAmount) : '0'} LOAN
                            </div>
                            <button
                                onClick={takeLoan}
                                disabled={isPending || isConfirming || !amounts.loan || loanDetails?.isActive}
                                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                            >
                                {isPending || isConfirming ? 'Processing...' : 'Take Loan'}
                            </button>
                            {loanDetails?.isActive && (
                                <p className="text-sm text-red-500">You already have an active loan</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'repay' && (
                        <div className="space-y-4">
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
                                        value={amounts.repay}
                                        onChange={(e) => setAmounts(prev => ({ ...prev, repay: e.target.value }))}
                                    />
                                    <div className="text-sm text-gray-600">
                                        Your LOAN Balance: {loanTokenBalance ? formatEther(loanTokenBalance) : '0'} LOAN
                                    </div>
                                    <button
                                        onClick={repayLoan}
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
    );
}
