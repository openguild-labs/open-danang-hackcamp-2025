// SPDX‑License‑Identifier: MIT
"use client";

import { localConfig, paseoAssetHub } from "@/app/providers";
import { addressAtom } from "@/components/sigpasskit";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { erc20AbiExtend } from "@/lib/abi";
import { lendingBorrowingAbi } from "@/lib/lendingBorrowingAbi";
import { truncateHash } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAtomValue } from "jotai";
import {
  RefreshCcw,
  ShieldPlus,
  ShieldMinus,
  HandCoins,
  RotateCw,
  Info,
  Ban,
  Hash,
  LoaderCircle,
  CircleCheck,
  ExternalLink,
  ChevronDown,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Address,
  formatUnits,
  parseUnits,
} from "viem";
import {
  useAccount,
  useChainId,
  useConfig,
  useReadContracts,
  useSwitchChain,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { z } from "zod";
import { useMediaQuery } from "@/hooks/use-media-query";
import CopyButton from "@/components/copy-button";

/* -------------------------------------------------------------------------- */
/*                         ENV‑CONFIGURED CONTRACT ADDRS                      */
/* -------------------------------------------------------------------------- */

const LENDING_BORROWING_ADDRESS = process.env
  .NEXT_PUBLIC_LENDING_BORROWING_ADDRESS as Address;
const COLLATERAL_TOKEN_ADDRESS = process.env
  .NEXT_PUBLIC_COLLATERAL_TOKEN_ADDRESS as Address;
const LENDING_TOKEN_ADDRESS = process.env
  .NEXT_PUBLIC_LENDING_TOKEN_ADDRESS as Address;

/* -------------------------------------------------------------------------- */
/*                                   SCHEMA                                   */
/* -------------------------------------------------------------------------- */

const amountSchema = z.object({
  amount: z
    .string()
    .refine((v) => parseFloat(v) > 0, { message: "Must be > 0" }),
});

/* -------------------------------------------------------------------------- */
/*                              REACT COMPONENT                               */
/* -------------------------------------------------------------------------- */

export default function LendingBorrowing() {
  const { toast } = useToast();

  /* --------------------------- addresses & config -------------------------- */
  const wagmiCfg = useConfig();
  const sigpassAddr = useAtomValue(addressAtom);
  const effectiveCfg = sigpassAddr ? localConfig : wagmiCfg;
  const { address: connectedAddr } = useAccount();
  const userAddress = sigpassAddr ?? connectedAddr;

  /* --------------------------- chain switch helper ------------------------- */
  const walletChainId = useChainId();
  const { switchChainAsync } = useSwitchChain({ config: effectiveCfg });

  async function ensurePaseoChain() {
    if (walletChainId !== paseoAssetHub.id) {
      try {
        await switchChainAsync({ chainId: paseoAssetHub.id });
      } catch {
        toast({ title: "Switch to Paseo network in your wallet" });
        throw new Error("Wrong network");
      }
    }
  }

  /* ------------------------------ read queries ----------------------------- */
  const { data: readData, refetch, isFetching } = useReadContracts({
    contracts: [
      // protocol state
      {
        address: LENDING_BORROWING_ADDRESS,
        abi: lendingBorrowingAbi,
        functionName: "collateralBalances",
        args: [userAddress as Address],
        chainId: paseoAssetHub.id,
      },
      {
        address: LENDING_BORROWING_ADDRESS,
        abi: lendingBorrowingAbi,
        functionName: "getLoanDetails",
        args: [userAddress as Address],
        chainId: paseoAssetHub.id,
      },
      // token metadata
      {
        address: COLLATERAL_TOKEN_ADDRESS,
        abi: erc20AbiExtend,
        functionName: "decimals",
        chainId: paseoAssetHub.id,
      },
      {
        address: LENDING_TOKEN_ADDRESS,
        abi: erc20AbiExtend,
        functionName: "decimals",
        chainId: paseoAssetHub.id,
      },
      // wallet balances
      {
        address: COLLATERAL_TOKEN_ADDRESS,
        abi: erc20AbiExtend,
        functionName: "balanceOf",
        args: [userAddress as Address],
        chainId: paseoAssetHub.id,
      },
      {
        address: LENDING_TOKEN_ADDRESS,
        abi: erc20AbiExtend,
        functionName: "balanceOf",
        args: [userAddress as Address],
        chainId: paseoAssetHub.id,
      },
    ],
    config: effectiveCfg,
    query: { enabled: Boolean(userAddress), staleTime: 0 },
  });

  /* ------------------------------ decode reads ----------------------------- */
  const collateralBal = readData?.[0]?.result as bigint | undefined;
  const loanTuple = readData?.[1]?.result as
    | readonly [bigint, bigint, boolean]
    | undefined;
  const collateralDecimals = (readData?.[2]?.result as number | undefined) ?? 18;
  const lendingDecimals = (readData?.[3]?.result as number | undefined) ?? 18;
  const walletCollateralBal = readData?.[4]?.result as bigint | undefined;
  const walletLendingBal = readData?.[5]?.result as bigint | undefined;

  const isDataReady =
    collateralDecimals !== undefined &&
    lendingDecimals !== undefined &&
    walletCollateralBal !== undefined &&
    walletLendingBal !== undefined;

  const isCollateralReady =
    collateralDecimals !== undefined;

  /* ------------------------------ write hook ------------------------------- */
  const { writeContractAsync, isPending } = useWriteContract({
    config: effectiveCfg,
  });

  /* ---------------------------- tx status state ---------------------------- */
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [pendingAction, setPendingAction] = useState<
    "deposit" | "withdraw" | "borrow" | "repay" | null
  >(null);
  const [open, setOpen] = useState(false);

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: txError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    config: effectiveCfg,
  });

  /* ------------------------------ forms setup ------------------------------ */
  const depositForm = useForm<z.infer<typeof amountSchema>>({
    resolver: zodResolver(amountSchema),
    defaultValues: { amount: "" },
  });
  const withdrawForm = useForm<z.infer<typeof amountSchema>>({
    resolver: zodResolver(amountSchema),
    defaultValues: { amount: "" },
  });
  const loanForm = useForm<z.infer<typeof amountSchema>>({
    resolver: zodResolver(amountSchema),
    defaultValues: { amount: "" },
  });
  const repayForm = useForm<z.infer<typeof amountSchema>>({
    resolver: zodResolver(amountSchema),
    defaultValues: { amount: "" },
  });

  /* ---------------------------- helper functions --------------------------- */
  async function approveToken(
    token: Address,
    amount: string,
    decimals: number
  ) {
    await ensurePaseoChain();
    const hash = await writeContractAsync({
      address: token,
      abi: erc20AbiExtend,
      functionName: "approve",
      args: [LENDING_BORROWING_ADDRESS, parseUnits(amount, decimals)],
      chainId: paseoAssetHub.id,
    });
    await waitForTransactionReceipt(effectiveCfg, { hash });
  }

  async function sendTx(
    params: Parameters<typeof writeContractAsync>[0],
    action: typeof pendingAction
  ) {
    await ensurePaseoChain();
    setPendingAction(action);
    const hash = await writeContractAsync(params);
    setTxHash(hash);
    setOpen(true);
  }

  /* ----------------------------- action handlers --------------------------- */
  async function onDeposit(values: z.infer<typeof amountSchema>) {
    if (!isCollateralReady) return;
    const parsed = parseUnits(values.amount, collateralDecimals);
    if (walletCollateralBal !== undefined && parsed > walletCollateralBal) {
      toast({
        title: "Insufficient wallet balance",
        description: "You do not have enough collateral tokens.",
      });
      return;
    }
    try {
      await approveToken(
        COLLATERAL_TOKEN_ADDRESS,
        values.amount,
        collateralDecimals
      );
      await sendTx(
        {
          address: LENDING_BORROWING_ADDRESS,
          abi: lendingBorrowingAbi,
          functionName: "depositCollateral",
          args: [parsed],
          chainId: paseoAssetHub.id,
        },
        "deposit"
      );
    } catch (err: unknown) {
      toast({ title: "Deposit failed", description: (err as Error).message });
    }
  }

  async function onWithdraw(values: z.infer<typeof amountSchema>) {
    if (!isCollateralReady) return;
    const parsed = parseUnits(values.amount, collateralDecimals);
    if (collateralBal !== undefined && parsed > collateralBal) {
      toast({
        title: "Insufficient deposited collateral",
        description: "Amount exceeds your deposited collateral.",
      });
      return;
    }
    try {
      await sendTx(
        {
          address: LENDING_BORROWING_ADDRESS,
          abi: lendingBorrowingAbi,
          functionName: "withdrawCollateral",
          args: [parsed],
          chainId: paseoAssetHub.id,
        },
        "withdraw"
      );
    } catch (err: unknown) {
      toast({ title: "Withdraw failed", description: (err as Error).message });
    }
  }

  async function onTakeLoan(values: z.infer<typeof amountSchema>) {
    if (!isDataReady) return;
    try {
      await sendTx(
        {
          address: LENDING_BORROWING_ADDRESS,
          abi: lendingBorrowingAbi,
          functionName: "takeLoan",
          args: [parseUnits(values.amount, lendingDecimals)],
          chainId: paseoAssetHub.id,
        },
        "borrow"
      );
    } catch (err: unknown) {
      toast({ title: "Borrow failed", description: (err as Error).message });
    }
  }

  async function onRepay(values: z.infer<typeof amountSchema>) {
    if (!isDataReady) return;
    const parsed = parseUnits(values.amount, lendingDecimals);
    if (loanTuple && parsed > loanTuple[0]) {
      toast({
        title: "Repay amount too large",
        description: "Cannot repay more than outstanding loan.",
      });
      return;
    }
    if (walletLendingBal !== undefined && parsed > walletLendingBal) {
      toast({
        title: "Insufficient wallet balance",
        description: "You do not have enough lending tokens.",
      });
      return;
    }
    try {
      await approveToken(
        LENDING_TOKEN_ADDRESS,
        values.amount,
        lendingDecimals
      );
      await sendTx(
        {
          address: LENDING_BORROWING_ADDRESS,
          abi: lendingBorrowingAbi,
          functionName: "repayLoan",
          args: [parsed],
          chainId: paseoAssetHub.id,
        },
        "repay"
      );
    } catch (err: unknown) {
      toast({ title: "Repay failed", description: (err as Error).message });
    }
  }

  /* ------------------------- refetch on confirmation ------------------------ */
  useEffect(() => {
    if (isConfirmed) {
      toast({ title: "Transaction confirmed!" });
      refetch();
      setPendingAction(null);
    }
    // eslint‑disable‑next‑line react‑hooks/exhaustive‑deps
  }, [isConfirmed]);

  /* ----------------------------- media query ------------------------------- */
  const isDesktop = useMediaQuery("(min-width: 768px)");

  /* -------------------------------------------------------------------------- */
  /*                                 UI LAYOUT                                  */
  /* -------------------------------------------------------------------------- */

  return (
    <section className="flex flex-col gap-8 w-full">
      {/* Overview Card */}
      <div className="relative overflow-hidden rounded-2xl border bg-card/70 p-6 backdrop-blur">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/20 via-pink-500/10 to-indigo-600/10" />
        <header className="mb-4 flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-lg">Account Overview</h2>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Refresh"
            className="ml-auto"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </header>
        <ul className="text-sm grid grid-cols-1 sm:grid-cols-2 gap-y-1">
          <li>
            Wallet Collateral:
            <span className="ml-1 font-mono">
              {walletCollateralBal
                ? formatUnits(walletCollateralBal, collateralDecimals)
                : "0"}
            </span>
          </li>
          <li>
            Collateral Deposited:
            <span className="ml-1 font-mono">
              {collateralBal
                ? formatUnits(collateralBal, collateralDecimals)
                : "0"}
            </span>
          </li>
          <li>
            Loan Active:
            <span className="ml-1 font-mono">{loanTuple?.[2] ? "Yes" : "No"}</span>
          </li>
          <li>
            Loan Amount:
            <span className="ml-1 font-mono">
              {loanTuple ? formatUnits(loanTuple[0], lendingDecimals) : "0"}
            </span>
          </li>
          <li>
            Locked Collateral:
            <span className="ml-1 font-mono">
              {loanTuple ? formatUnits(loanTuple[1], collateralDecimals) : "0"}
            </span>
          </li>
        </ul>
      </div>

      {/* Action Cards grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Deposit */}
        <Form {...depositForm}>
          <form
            onSubmit={depositForm.handleSubmit(onDeposit)}
            className="space-y-4 rounded-2xl border p-6 shadow-sm bg-card/60 backdrop-blur"
          >
            <header className="flex items-center gap-2">
              <ShieldPlus className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Deposit Collateral</h3>
            </header>
            <FormField
              control={depositForm.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input placeholder="0.0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              disabled={isPending || !userAddress || !isCollateralReady}
              className="w-full"
              type="submit"
            >
              {isPending && pendingAction === "deposit" ? (
                <>
                  <LoaderCircle className="w-4 h-4 animate-spin mr-2" />
                  Confirm in wallet...
                </>
              ) : (
                "Deposit"
              )}
            </Button>
          </form>
        </Form>

        {/* Withdraw */}
        <Form {...withdrawForm}>
          <form
            onSubmit={withdrawForm.handleSubmit(onWithdraw)}
            className="space-y-4 rounded-2xl border p-6 shadow-sm bg-card/60 backdrop-blur"
          >
            <header className="flex items-center gap-2">
              <ShieldMinus className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Withdraw Collateral</h3>
            </header>
            <FormField
              control={withdrawForm.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input placeholder="0.0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              disabled={isPending || !isCollateralReady}
              variant="outline"
              className="w-full"
              type="submit"
            >
              {isPending && pendingAction === "withdraw" ? (
                <>
                  <LoaderCircle className="w-4 h-4 animate-spin mr-2" />
                  Confirm in wallet...
                </>
              ) : (
                "Withdraw"
              )}
            </Button>
          </form>
        </Form>

        {/* Take Loan */}
        <Form {...loanForm}>
          <form
            onSubmit={loanForm.handleSubmit(onTakeLoan)}
            className="space-y-4 rounded-2xl border p-6 shadow-sm bg-card/60 backdrop-blur"
          >
            <header className="flex items-center gap-2">
              <HandCoins className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Borrow Tokens</h3>
            </header>
            <FormField
              control={loanForm.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input placeholder="0.0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              disabled={isPending || !isDataReady}
              className="w-full"
              type="submit"
            >
              {isPending && pendingAction === "borrow" ? (
                <>
                  <LoaderCircle className="w-4 h-4 animate-spin mr-2" />
                  Confirm in wallet...
                </>
              ) : (
                "Borrow"
              )}
            </Button>
          </form>
        </Form>

        {/* Repay */}
        <Form {...repayForm}>
          <form
            onSubmit={repayForm.handleSubmit(onRepay)}
            className="space-y-4 rounded-2xl border p-6 shadow-sm bg-card/60 backdrop-blur"
          >
            <header className="flex items-center gap-2">
              <RotateCw className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Repay Loan</h3>
            </header>
            <FormField
              control={repayForm.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input placeholder="0.0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              disabled={isPending || !isDataReady}
              variant="destructive"
              className="w-full"
              type="submit"
            >
              {isPending && pendingAction === "repay" ? (
                <>
                  <LoaderCircle className="w-4 h-4 animate-spin mr-2" />
                  Confirm in wallet...
                </>
              ) : (
                "Repay"
              )}
            </Button>
          </form>
        </Form>
      </div>

      {/* Transaction Status UI */}
      {isDesktop ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              Transaction status <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transaction status</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              Follow the transaction status below.
            </DialogDescription>
            <StatusContent
              hash={txHash}
              isPending={isPending}
              isConfirming={isConfirming}
              isConfirmed={isConfirmed}
              error={txError as Error | undefined}
              explorerUrl={paseoAssetHub.blockExplorers?.default.url}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <Button variant="outline" className="w-full">
              Transaction status <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Transaction status</DrawerTitle>
              <DrawerDescription>
                Follow the transaction status below.
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4">
              <StatusContent
                hash={txHash}
                isPending={isPending}
                isConfirming={isConfirming}
                isConfirmed={isConfirmed}
                error={txError as Error | undefined}
                explorerUrl={paseoAssetHub.blockExplorers?.default.url}
              />
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                        STATUS CONTENT SUB‑COMPONENT                        */
/* -------------------------------------------------------------------------- */

function StatusContent({
  hash,
  isPending,
  isConfirming,
  isConfirmed,
  error,
  explorerUrl,
}: {
  hash: `0x${string}` | undefined;
  isPending: boolean;
  isConfirming: boolean;
  isConfirmed: boolean;
  error: Error | undefined;
  explorerUrl?: string;
}) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      {hash ? (
        <div className="flex flex-row gap-2 items-center">
          <Hash className="w-4 h-4" />
          Transaction Hash
          <a
            className="flex flex-row gap-2 items-center underline underline-offset-4"
            href={`${explorerUrl}/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {truncateHash(hash)}
            <ExternalLink className="w-4 h-4" />
          </a>
          <CopyButton copyText={hash} />
        </div>
      ) : (
        <div className="flex flex-row gap-2 items-center">
          <Hash className="w-4 h-4" />
          No transaction hash
        </div>
      )}
      {!isPending && !isConfirming && !isConfirmed && (
        <div className="flex flex-row gap-2 items-center">
          <Ban className="w-4 h-4" /> No transaction submitted
        </div>
      )}
      {isConfirming && (
        <div className="flex flex-row gap-2 items-center text-yellow-500">
          <LoaderCircle className="w-4 h-4 animate-spin" /> Waiting for
          confirmation...
        </div>
      )}
      {isConfirmed && (
        <div className="flex flex-row gap-2 items-center text-green-600">
          <CircleCheck className="w-4 h-4" /> Transaction confirmed!
        </div>
      )}
      {error && (
        <div className="flex flex-row gap-2 items-center text-red-500">
          <X className="w-4 h-4" /> Error: {error.message}
        </div>
      )}
    </div>
  );
}