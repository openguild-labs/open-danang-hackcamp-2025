"use client";
import BalancesComponent from "@/components/balances-component";
import DepositToVaultComponent from "@/components/deposit-to-vault-component";
import VaultDepositsManagementComponent from "@/components/vault-deposits-management-component";
import { useBalance, useAccount, useReadContracts } from "wagmi";
import { erc20Abi, Address } from "viem";
import { TOKEN_LIST } from "@/lib/constants";

export default function Page() {
  const { address } = useAccount();

  const {
    data: nativeBalance,
    isLoading: isLoadingNativeBalance,
    refetch: refetchNativeBalance,
  } = useBalance({
    address: address,
  });

  const {
    data: tokenBalances,
    isLoading: isTokenBalancesLoading,
    refetch: refetchTokenBalances,
  } = useReadContracts({
    contracts: [
      // DOT
      {
        abi: erc20Abi,
        address: TOKEN_LIST.filter((token) => token.symbol === "DOT")[0]
          .address as Address,
        functionName: "balanceOf",
        args: [address as Address],
      },
      // vETH
      {
        abi: erc20Abi,
        address: TOKEN_LIST.filter((token) => token.symbol === "vETH")[0]
          .address as Address,
        functionName: "balanceOf",
        args: [address as Address],
      },
      // vDOT
      {
        abi: erc20Abi,
        address: TOKEN_LIST.filter((token) => token.symbol === "vDOT")[0]
          .address as Address,
        functionName: "balanceOf",
        args: [address as Address],
      },
    ],
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <BalancesComponent
        nativeBalance={nativeBalance?.value ?? BigInt(0)}
        isNativeBalanceLoading={isLoadingNativeBalance}
        refetchNativeBalance={refetchNativeBalance}
        tokenBalances={
          tokenBalances?.map((token) => token.result ?? BigInt(0)) ?? []
        }
        isTokenBalancesLoading={isTokenBalancesLoading}
        refetchTokenBalances={refetchTokenBalances}
      />
      <DepositToVaultComponent
        tokenBalances={
          tokenBalances?.map((balance) => balance.result) as
            | [bigint | undefined, bigint | undefined, bigint | undefined]
            | undefined
        }
      />
      <VaultDepositsManagementComponent />
    </div>
  );
}
