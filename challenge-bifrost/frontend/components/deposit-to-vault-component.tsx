"use client"

import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
} from "wagmi"
import type { Token } from "@/types/token"
import Image from "next/image"
import {
  TOKEN_LIST,
  L2SLPX_CONTRACT_ADDRESS,
  YIELD_DELEGATION_VAULT_CONTRACT_ADDRESS,
} from "@/lib/constants"
import { useForm } from "@tanstack/react-form"
import type { AnyFieldApi } from "@tanstack/react-form"
import { Button } from "@/components/ui/button"
import type { BalancesProps } from "@/types/shared"
import {
  parseEther,
  formatEther,
  Address,
  maxUint256,
  erc20Abi,
} from "viem"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
  roundLongDecimals,
  formatNumberStringInput,
  formatNumberStringWithThousandSeparators,
} from "@/lib/utils"
import { Loader2, MessageSquare } from "lucide-react"
import { useAiAgentContext } from "@/hooks/use-ai-agent-context"
import { yieldDelegationVaultAbi } from "@/lib/abis"
import { TransactionStatus } from "@/components/transaction-status"

const tokens: Token[] = TOKEN_LIST.filter(
  (token) => token.symbol === "vDOT" || token.symbol === "vETH",
)

type DepositProps = Pick<BalancesProps, "tokenBalances">

export default function DepositToVaultComponent({
  tokenBalances,
}: DepositProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const { open } = useAiAgentContext()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedToken, setSelectedToken] = useState<Token | null>(null)
  const config = useConfig()
  const chainId = useChainId()
  const { address } = useAccount()
  const { data: availableCapabilities } = useCapabilities({
    account: address,
    chainId: chainId,
  })

  const { data: tokenAllowance, refetch: refetchTokenAllowance } =
    useReadContract({
      address: TOKEN_LIST.filter((token) => token.symbol === "DOT")[0]
        .address as Address,
      abi: erc20Abi,
      functionName: "allowance",
      args: [address as Address, L2SLPX_CONTRACT_ADDRESS],
    })

  const { data: hash, error, isPending, writeContract } = useWriteContract()

  // Batching
  const {
    data: batchCallsId,
    isPending: isBatching,
    error: batchError,
    sendCalls,
  } = useSendCalls()

  const form = useForm({
    defaultValues: {
      amount: "",
    },
    onSubmit: async ({ value }) => {
      if (selectedToken?.symbol === "vETH") {
        if (availableCapabilities?.atomic?.status === "supported") {
          sendCalls({
            calls: [
              {
                to: TOKEN_LIST.filter((token) => token.symbol === "vETH")[0]
                  .address as Address,
                abi: erc20Abi,
                functionName: "approve",
                args: [
                  YIELD_DELEGATION_VAULT_CONTRACT_ADDRESS,
                  parseEther(value.amount),
                ],
              },
              {
                to: YIELD_DELEGATION_VAULT_CONTRACT_ADDRESS,
                abi: yieldDelegationVaultAbi,
                functionName: "deposit",
                args: [
                  TOKEN_LIST.filter((token) => token.symbol === "vETH")[0]
                    .address as Address,
                  parseEther(value.amount),
                ],
              },
            ],
          })
        }

        if (availableCapabilities?.atomic?.status !== "supported") {
          if (tokenAllowance === BigInt(0)) {
            writeContract({
              address: TOKEN_LIST.filter((token) => token.symbol === "vETH")[0]
                .address as Address,
              abi: erc20Abi,
              functionName: "approve",
              args: [L2SLPX_CONTRACT_ADDRESS, maxUint256],
            })
          }

          if (tokenAllowance && tokenAllowance >= parseEther(value.amount)) {
            writeContract({
              address: YIELD_DELEGATION_VAULT_CONTRACT_ADDRESS,
              abi: yieldDelegationVaultAbi,
              functionName: "deposit",
              args: [
                TOKEN_LIST.filter((token) => token.symbol === "vETH")[0]
                  .address as Address,
                parseEther(value.amount),
              ],
            })
          }
        }
      }

      if (selectedToken?.symbol === "vDOT") {
        if (availableCapabilities?.atomic?.status === "supported") {
          sendCalls({
            calls: [
              {
                to: TOKEN_LIST.filter((token) => token.symbol === "vDOT")[0]
                  .address as Address,
                abi: erc20Abi,
                functionName: "approve",
                args: [
                  YIELD_DELEGATION_VAULT_CONTRACT_ADDRESS,
                  parseEther(value.amount),
                ],
              },
              {
                to: YIELD_DELEGATION_VAULT_CONTRACT_ADDRESS,
                abi: yieldDelegationVaultAbi,
                functionName: "deposit",
                args: [
                  TOKEN_LIST.filter((token) => token.symbol === "vDOT")[0]
                    .address as Address,
                  parseEther(value.amount),
                ],
              },
            ],
          })
        }

        if (availableCapabilities?.atomic?.status !== "supported") {
          if (tokenAllowance === BigInt(0)) {
            writeContract({
              address: TOKEN_LIST.filter((token) => token.symbol === "vDOT")[0]
                .address as Address,
              abi: erc20Abi,
              functionName: "approve",
              args: [YIELD_DELEGATION_VAULT_CONTRACT_ADDRESS, maxUint256],
            })
          }

          if (tokenAllowance && tokenAllowance >= parseEther(value.amount)) {
            writeContract({
              address: YIELD_DELEGATION_VAULT_CONTRACT_ADDRESS,
              abi: yieldDelegationVaultAbi,
              functionName: "deposit",
              args: [
                TOKEN_LIST.filter((token) => token.symbol === "vDOT")[0]
                  .address as Address,
                parseEther(value.amount),
              ],
            })
          }
        }
      }
    },
  })

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

  const { isLoading: isSendingCalls } = useWaitForCallsStatus({
    id: batchCallsId?.id,
  })

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
        },
  )

  useEffect(() => {
    if (isConfirming || isSendingCalls) {
      setModalOpen(true)
    }
  }, [isConfirming, isSendingCalls])

  useEffect(() => {
    if (isConfirmed) {
      refetchTokenAllowance()
    }
  }, [isConfirmed, refetchTokenAllowance])

  return (
    <div className="flex flex-col gap-4 w-full p-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Deposit to Vault</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => open("Explain Yield Delegation Vault")}
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-muted-foreground">
          Deposit to the Yield Delegation Vault
        </p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
      >
        <div className="flex flex-col gap-4">
          <Select
            onValueChange={(value) => {
              const token = tokens.find((token) => token.symbol === value)
              if (token) {
                setSelectedToken(token)
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a token" />
            </SelectTrigger>
            <SelectContent>
              {tokens.map((token) => (
                <SelectDepositToken key={token.symbol} token={token} />
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
                          ? tokenBalances?.[1] ?? BigInt(0)
                          : tokenBalances?.[2] ?? BigInt(0))
                      ? "Amount must be less than or equal to your balance"
                      : undefined,
                }}
              >
                {(field) => (
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-row gap-2 items-center justify-between">
                      <p className="text-muted-foreground">Depositing</p>
                      <button
                        type="button"
                        className="bg-transparent border border-muted-foreground text-muted-foreground rounded-md px-2 py-0.5 hover:cursor-pointer"
                        onClick={() => {
                          if (selectedToken?.symbol === "vETH") {
                            field.handleChange(
                              formatEther(
                                tokenBalances?.[1] ?? BigInt(0),
                              ),
                            )
                          }
                          if (selectedToken?.symbol === "vDOT") {
                            field.handleChange(
                              formatEther(
                                tokenBalances?.[2] ?? BigInt(0),
                              ),
                            )
                          }
                        }}
                      >
                        Max
                      </button>
                    </div>
                    <div className="flex flex-row gap-2">
                      {isDesktop ? (
                        <input
                          id={field.name}
                          name={field.name}
                          value={
                            field.state.value
                              ? formatNumberStringInput(field.state.value)
                              : ""
                          }
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(/,/g, "")
                            field.handleChange(rawValue)
                          }}
                          className="bg-transparent text-4xl outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          type="number"
                          placeholder="0"
                          required
                        />
                      ) : (
                        <input
                          id={field.name}
                          name={field.name}
                          value={
                            field.state.value
                              ? formatNumberStringInput(field.state.value)
                              : ""
                          }
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(/,/g, "")
                            field.handleChange(rawValue)
                          }}
                          className="bg-transparent text-4xl outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]*"
                          placeholder="0"
                          required
                        />
                      )}
                      <p className="place-self-end text-lg text-muted-foreground">
                        {selectedToken?.symbol === "vETH"
                          ? "vETH"
                          : selectedToken?.symbol === "vDOT"
                          ? "vDOT"
                          : "-"}
                      </p>
                    </div>
                    <div className="flex flex-row gap-2">
                      {selectedToken?.symbol === "vETH" ? (
                        <p className="text-muted-foreground">
                          {formatNumberStringWithThousandSeparators(
                            roundLongDecimals(
                              formatEther(
                                tokenBalances?.[1] ?? BigInt(0),
                              ),
                              6,
                            ),
                          )}{" "}
                          vETH
                        </p>
                      ) : selectedToken?.symbol === "vDOT" ? (
                        <p className="text-muted-foreground">
                          {formatNumberStringWithThousandSeparators(
                            roundLongDecimals(
                              formatEther(
                                tokenBalances?.[2] ?? BigInt(0),
                              ),
                              6,
                            ),
                          )}{" "}
                          vDOT
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
                  <>Deposit</>
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
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  )
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
  )
}

function SelectDepositToken({ token }: { token: Token }) {
  return (
    <SelectItem value={token.symbol}>
      <div className="flex flex-row gap-2 items-center justify-center">
        <Image src={token.image} alt={token.symbol} width={24} height={24} />
        <p className="text-lg">{token.name}</p>
        <p className="text-lg text-muted-foreground">{token.symbol}</p>
      </div>
    </SelectItem>
  )
}