"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type BaseError,
  useWaitForTransactionReceipt,
  useReadContract,
  useWriteContract,
  useCapabilities,
  useSendCalls,
  useAccount,
  useChainId,
  useConfig,
  useWaitForCallsStatus,
  useCallsStatus,
} from "wagmi";
import type { Token } from "@/types/token";
import Image from "next/image";
import { TOKEN_LIST, L2SLPX_CONTRACT_ADDRESS } from "@/lib/constants";
import { useForm } from "@tanstack/react-form";
import type { AnyFieldApi } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { MintProps } from "@/types/shared";
import { parseEther, formatEther, Address, maxUint256, erc20Abi } from "viem";
import { useMediaQuery } from "@/hooks/use-media-query";
import { roundLongDecimals } from "@/lib/utils";
import { Loader2, MessageSquare } from "lucide-react";
import { l2SlpxAbi } from "@/lib/abis";
import { TransactionStatus } from "@/components/transaction-status";
import { useAiAgentContext } from "@/hooks/use-ai-agent-context";

const tokens: Token[] = TOKEN_LIST.filter(
  (token) => token.symbol === "vDOT" || token.symbol === "vETH"
);

export default function MintComponent({
  nativeBalance,
  tokenBalances,
}: MintProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { open: openAgent } = useAiAgentContext();
  const [open, setOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const config = useConfig();
  const chainId = useChainId();
  const { address } = useAccount();
  const { data: availableCapabilities } = useCapabilities({
    account: address,
    chainId: chainId,
  });

  const { data: tokenAllowance, refetch: refetchTokenAllowance } =
    useReadContract({
      address: TOKEN_LIST.filter((token) => token.symbol === "DOT")[0]
        .address as Address,
      abi: erc20Abi,
      functionName: "allowance",
      args: [address as Address, L2SLPX_CONTRACT_ADDRESS],
    });

  const { data: hash, error, isPending, writeContract } = useWriteContract();

  /* ---------------------------------------------------------------------- */
  /*                                Batching                                */
  /* ---------------------------------------------------------------------- */
  const {
    data: batchCallsId,
    isPending: isBatching,
    error: batchError,
    sendCalls,
  } = useSendCalls();

  /* ---------------------------------------------------------------------- */
  /*                               Form logic                               */
  /* ---------------------------------------------------------------------- */
  const form = useForm({
    defaultValues: {
      amount: "",
    },
    onSubmit: async ({ value }) => {
      if (selectedToken?.symbol === "vETH") {
        writeContract({
          address: L2SLPX_CONTRACT_ADDRESS,
          abi: l2SlpxAbi,
          functionName: "createOrder",
          value: parseEther(value.amount),
          args: [
            "0x0000000000000000000000000000000000000000",
            parseEther(value.amount),
            0,
            "bifrost",
          ],
        });
      }

      if (selectedToken?.symbol === "vDOT") {
        if (availableCapabilities?.atomic?.status === "supported") {
          sendCalls({
            calls: [
              {
                to: TOKEN_LIST.filter((token) => token.symbol === "DOT")[0]
                  .address as Address,
                abi: erc20Abi,
                functionName: "approve",
                args: [L2SLPX_CONTRACT_ADDRESS, parseEther(value.amount)],
              },
              {
                to: L2SLPX_CONTRACT_ADDRESS,
                abi: l2SlpxAbi,
                functionName: "createOrder",
                args: [
                  TOKEN_LIST.filter((token) => token.symbol === "DOT")[0]
                    .address as Address,
                  parseEther(value.amount),
                  0,
                  "bifrost",
                ],
              },
            ],
          });
        }

        if (availableCapabilities?.atomic?.status !== "supported") {
          if (tokenAllowance === BigInt(0)) {
            writeContract({
              address: TOKEN_LIST.filter((token) => token.symbol === "DOT")[0]
                .address as Address,
              abi: erc20Abi,
              functionName: "approve",
              args: [L2SLPX_CONTRACT_ADDRESS, maxUint256],
            });
          }

          if (tokenAllowance && tokenAllowance >= parseEther(value.amount)) {
            writeContract({
              address: L2SLPX_CONTRACT_ADDRESS,
              abi: l2SlpxAbi,
              functionName: "createOrder",
              args: [
                TOKEN_LIST.filter((token) => token.symbol === "DOT")[0]
                  .address as Address,
                parseEther(value.amount),
                0,
                "bifrost",
              ],
            });
          }
        }
      }
    },
  });

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const { isLoading: isSendingCalls } = useWaitForCallsStatus({
    id: batchCallsId?.id,
  });

  const {
    data: batchCallsStatus,
    isLoading: isBatchCallsLoading,
    isSuccess: isBatchCallsSuccess,
  } = useCallsStatus(
    batchCallsId
      ? {
          id: batchCallsId.id,
        }
      : {
          id: "",
        }
  );

  /* ---------------------------------------------------------------------- */
  /*                        UI side-effects / helpers                       */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    if (isConfirming || isSendingCalls) {
      setOpen(true);
    }
  }, [isConfirming, isSendingCalls]);

  useEffect(() => {
    if (isConfirmed) {
      refetchTokenAllowance();
    }
  }, [isConfirmed, refetchTokenAllowance]);

  /* ---------------------------------------------------------------------- */
  /*                                 Render                                 */
  /* ---------------------------------------------------------------------- */
  return (
    <div className="flex flex-col gap-4 w-full p-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Mint</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openAgent("How do I mint vETH quickly?")}
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-muted-foreground">Mint Liquid Staking Tokens</p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div className="flex flex-col gap-4">
          <Select
            onValueChange={(value) => {
              const token = tokens.find((token) => token.symbol === value);
              if (token) {
                setSelectedToken(token);
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a token" />
            </SelectTrigger>
            <SelectContent>
              {tokens.map((token) => (
                <SelectMintToken key={token.symbol} token={token} />
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-col gap-2 rounded-lg border p-4">
            <div>
              {/* A type-safe field component*/}
              <form.Field
                name="amount"
                validators={{
                  onChange: ({ value }) =>
                    !value
                      ? "Please enter an amount to mint"
                      : parseEther(value) < 0
                      ? "Amount must be greater than 0"
                      : parseEther(value) >
                        (selectedToken?.symbol === "vETH"
                          ? nativeBalance ?? BigInt(0)
                          : tokenBalances?.[0] ?? BigInt(0))
                      ? "Amount must be less than or equal to your balance"
                      : undefined,
                }}
              >
                {(field) => (
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-row gap-2 items-center justify-between">
                      <p className="text-muted-foreground">Minting</p>
                      <button className="bg-transparent border border-muted-foreground text-muted-foreground rounded-md px-2 py-0.5 hover:cursor-pointer">
                        Max
                      </button>
                    </div>
                    <div className="flex flex-row gap-2">
                      {isDesktop ? (
                        <input
                          id={field.name}
                          name={field.name}
                          value={field.state.value || ""}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="bg-transparent text-4xl outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          type="number"
                          placeholder="0"
                          required
                        />
                      ) : (
                        <input
                          id={field.name}
                          name={field.name}
                          value={field.state.value || ""}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="bg-transparent text-4xl outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          type="number"
                          inputMode="decimal"
                          pattern="[0-9]*"
                          placeholder="0"
                          required
                        />
                      )}
                      <p className="place-self-end text-lg text-muted-foreground">
                        {selectedToken?.symbol === "vETH"
                          ? "ETH"
                          : selectedToken?.symbol === "vDOT"
                          ? "DOT"
                          : "-"}
                      </p>
                    </div>
                    <div className="flex flex-row gap-2">
                      {selectedToken?.symbol === "vETH" ? (
                        <p className="text-muted-foreground">
                          {roundLongDecimals(
                            formatEther(nativeBalance ?? BigInt(0)),
                            6
                          )}{" "}
                          ETH
                        </p>
                      ) : selectedToken?.symbol === "vDOT" ? (
                        <p className="text-muted-foreground">
                          {roundLongDecimals(
                            formatEther(tokenBalances?.[0] ?? BigInt(0)),
                            6
                          )}{" "}
                          DOT
                        </p>
                      ) : (
                        <p className="text-muted-foreground">-</p>
                      )}
                    </div>
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
            </div>
          </div>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <Button
                size="lg"
                className="hover:cursor-pointer text-lg font-bold"
                type="submit"
                disabled={
                  !canSubmit ||
                  isSubmitting ||
                  isPending ||
                  isBatching ||
                  isSendingCalls
                }
              >
                {isSubmitting || isPending || isBatching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Please confirm in wallet
                  </>
                ) : isSendingCalls ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : availableCapabilities?.atomic?.status !== "supported" &&
                  tokenAllowance === BigInt(0) &&
                  selectedToken?.symbol === "vDOT" ? (
                  <>Approve</>
                ) : (
                  <>Mint</>
                )}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </form>
      <TransactionStatus
        hash={hash || batchCallsStatus?.receipts?.[0]?.transactionHash}
        isPending={isPending || isSendingCalls}
        isConfirming={isConfirming || isBatchCallsLoading}
        isConfirmed={isConfirmed || isBatchCallsSuccess}
        error={(error as BaseError) || (batchError as BaseError)}
        config={config}
        chainId={chainId}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}

function FieldInfo({ field }: { field: AnyFieldApi }) {
  return (
    <>
      {!field.state.meta.isTouched ? (
        <em>Please enter an amount to mint</em>
      ) : field.state.meta.isTouched && !field.state.meta.isValid ? (
        <em
          className={`${
            field.state.meta.errors.join(",") ===
            "Please enter an amount to mint"
              ? ""
              : "text-red-500"
          }`}
        >
          {field.state.meta.errors.join(",")}
        </em>
      ) : (
        <em className="text-green-500">ok!</em>
      )}
      {field.state.meta.isValidating ? "Validating..." : null}
    </>
  );
}

function SelectMintToken({ token }: { token: Token }) {
  return (
    <SelectItem value={token.symbol}>
      <div className="flex flex-row gap-2 items-center justify-center">
        <Image src={token.image} alt={token.symbol} width={24} height={24} />
        <p className="text-lg">{token.name}</p>
        <p className="text-lg text-muted-foreground">{token.symbol}</p>
      </div>
    </SelectItem>
  );
}
