'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, formatUnits } from 'viem';
import { CONTRACT_ADDRESSES, LENDING_POOL_ABI, ERC20_ABI, LENDING_OPERATIONS } from '../src/config/wagmi';
import Image from "next/image";

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
    address: CONTRACT_ADDRESSES.LENDING_POOL as `0x${string}`,
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

  // Helper Function: calculateRequiredCollateral calculation
  const calculateLoanRequiredCollateral = (loanAmount: string) => {
    if (!loanAmount || !collateralFactor) return '0';
    const required = LENDING_OPERATIONS.calculateRequiredCollateral(
      parseEther(loanAmount),
      collateralFactor
    );
    return formatEther(required);
  };

  // Helper function to get health factor color
  const getHealthFactorColor = (healthFactor: any) => {
    if (!healthFactor) return 'text-gray-500';
    const health = Number(healthFactor);
    if (health >= 150) return 'text-green-600';
    if (health >= 120) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (CONTRACT_ADDRESSES.LENDING_POOL === "0x0000000000000000000000000000000000000000") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <Image
            src="/og-logo.png"
            alt="OpenGuild logo"
            width={180}
            height={38}
            priority
            className="mx-auto mb-6"
          />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">🏦 DeFi Lending Setup Required</h1>
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
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-4 mb-2">
              <Image
                src="/og-logo.png"
                alt="OpenGuild logo"
                width={120}
                height={25}
                priority
              />
              <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Challenge 2
              </span>
            </div>
            <h1 className="text-4xl font-bold text-gray-800">🏦 DeFi Lending & Borrowing</h1>
            <p className="text-gray-600 mt-2">Built on Paseo Asset Hub • Open Danang Hackcamp 2025</p>
          </div>
          <ConnectButton />
        </div>

        {!isConnected ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
              <div className="text-6xl mb-4">🔗</div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                Connect your wallet to get started
              </h2>
              <p className="text-gray-500 mb-6">
                Connect your wallet to access DeFi lending and borrowing features
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <p>✅ Deposit Collateral</p>
                <p>✅ Withdraw Collateral</p>
                <p>✅ Take Loan</p>
                <p>✅ Repay Loan</p>
              </div>
            </div>
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
                  {interestRate ? `${formatUnits(Number(interestRate), 2)}%` : '0%'}
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
                <h3 className="text-lg font-semibold text-gray-700 mb-4">💰 Your Collateral</h3>
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
                <h3 className="text-lg font-semibold text-gray-700 mb-4">📊 Your Loan</h3>
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
                <h3 className="text-lg font-semibold text-gray-700 mb-4">🚀 Borrowing Power</h3>
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
                <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto">
                  {[
                    { id: 'depositCollateral', name: 'Deposit Collateral', icon: '🏦', desc: 'Core Function' },
                    { id: 'withdrawCollateral', name: 'Withdraw Collateral', icon: '💰', desc: 'Core Function' },
                    { id: 'takeLoan', name: 'Take Loan', icon: '📈', desc: 'Core Function' },
                    { id: 'repayLoan', name: 'Repay Loan', icon: '💳', desc: 'Core Function' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm relative`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-lg mb-1">{tab.icon}</span>
                        <span>{tab.name}</span>
                        <span className="text-xs text-green-600 font-bold">{tab.desc}</span>
                      </div>
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {/* Core Function Implementation Tabs */}
                {activeTab === 'depositCollateral' && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                      <h4 className="font-semibold text-blue-800">🏦 Core Function: depositCollateral</h4>
                      <p className="text-sm text-blue-700">Deposit collateral tokens to secure loans and earn lending rewards</p>
                    </div>
                    <h3 className="text-lg font-semibold">Deposit Collateral</h3>
                    <input
                      type="number"
                      placeholder="Amount (COL)"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={amounts.depositCollateral}
                      onChange={(e) => setAmounts(prev => ({ ...prev, depositCollateral: e.target.value }))}
                    />
                    <div className="text-sm text-gray-600">
                      Available: {collateralTokenBalance ? formatEther(collateralTokenBalance) : '0'} COL
                    </div>
                    <button
                      onClick={handleDepositCollateral}
                      disabled={isPending || isConfirming || !amounts.depositCollateral}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {isPending || isConfirming ? 'Processing...' : '🏦 Deposit Collateral'}
                    </button>
                  </div>
                )}

                {activeTab === 'withdrawCollateral' && (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
                      <h4 className="font-semibold text-green-800">💰 Core Function: withdrawCollateral</h4>
                      <p className="text-sm text-green-700">Withdraw your deposited collateral (only if no active loans)</p>
                    </div>
                    <h3 className="text-lg font-semibold">Withdraw Collateral</h3>
                    <input
                      type="number"
                      placeholder="Amount (COL)"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      value={amounts.withdrawCollateral}
                      onChange={(e) => setAmounts(prev => ({ ...prev, withdrawCollateral: e.target.value }))}
                    />
                    <div className="text-sm text-gray-600">
                      Available: {collateralBalance ? formatEther(collateralBalance) : '0'} COL
                    </div>
                    <button
                      onClick={handleWithdrawCollateral}
                      disabled={isPending || isConfirming || !amounts.withdrawCollateral}
                      className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {isPending || isConfirming ? 'Processing...' : '💰 Withdraw Collateral'}
                    </button>
                  </div>
                )}

                {activeTab === 'takeLoan' && (
                  <div className="space-y-4">
                    <div className="bg-purple-50 border border-purple-200 rounded p-3 mb-4">
                      <h4 className="font-semibold text-purple-800">📈 Core Function: takeLoan</h4>
                      <p className="text-sm text-purple-700">Borrow tokens against your collateral with competitive interest rates</p>
                    </div>
                    <h3 className="text-lg font-semibold">Take Loan</h3>
                    <input
                      type="number"
                      placeholder="Loan Amount (LOAN)"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                      className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    >
                      {isPending || isConfirming ? 'Processing...' : '📈 Take Loan'}
                    </button>
                    {loanDetails?.isActive && (
                      <p className="text-sm text-red-500">⚠️ You already have an active loan</p>
                    )}
                  </div>
                )}

                {activeTab === 'repayLoan' && (
                  <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                      <h4 className="font-semibold text-red-800">💳 Core Function: repayLoan</h4>
                      <p className="text-sm text-red-700">Repay your outstanding loans with interest to unlock collateral</p>
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
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          value={amounts.repayLoan}
                          onChange={(e) => setAmounts(prev => ({ ...prev, repayLoan: e.target.value }))}
                        />
                        <div className="text-sm text-gray-600">
                          Your LOAN Balance: {loanTokenBalance ? formatEther(loanTokenBalance) : '0'} LOAN
                        </div>
                        <button
                          onClick={handleRepayLoan}
                          disabled={isPending || isConfirming}
                          className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {isPending || isConfirming ? 'Processing...' : '💳 Repay Loan'}
                        </button>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-4">📄</div>
                        <p className="text-gray-500">No active loan to repay</p>
                        <p className="text-sm text-gray-400 mt-2">Take a loan first to use this function</p>
                      </div>
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
        )}
      </div>
    </div>
  );
}
