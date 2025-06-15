/* Centralised application-wide interfaces */

/* -------------------------------------------------------------------------- */
/*                                Balance flows                               */
/* -------------------------------------------------------------------------- */

export interface BalancesProps {
  nativeBalance: bigint
  isNativeBalanceLoading: boolean
  refetchNativeBalance: () => void
  tokenBalances: bigint[]
  isTokenBalancesLoading: boolean
  refetchTokenBalances: () => void
}

export interface MintProps {
  nativeBalance: bigint | undefined
  tokenBalances:
    | readonly [
        bigint | undefined,
        bigint | undefined,
        bigint | undefined
      ]
    | undefined
}

export interface RedeemProps {
  tokenBalances:
    | readonly [
        bigint | undefined,
        bigint | undefined,
        bigint | undefined
      ]
    | undefined
}

/* -------------------------------------------------------------------------- */
/*                             Order status model                             */
/* -------------------------------------------------------------------------- */

export interface OrderStatus {
  id: string
  token: string
  amount: bigint
  state: "pending" | "processing" | "completed" | "failed"
  txHash?: string
}

/* -------------------------------------------------------------------------- */
/*                        AI message & conversation types                     */
/* -------------------------------------------------------------------------- */

export interface AiChatMessage {
  role: "user" | "system"
  content: string
  /* Optional arbitrary metadata used by custom cards / renderers */
  [key: string]: any
}