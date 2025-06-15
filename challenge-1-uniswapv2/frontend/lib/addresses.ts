import type { Address } from "viem";
import { DEPLOYED } from "./config/deployedAddresses";

/**
 * Helper that validates an address‑shaped string and falls back to default.
 */
function pickAddress(
  candidate: string | undefined,
  fallback: Address
): Address {
  return candidate && candidate.length === 42 ? (candidate as Address) : fallback;
}

/**
 * Exported addresses — pulled from environment when available,
 * otherwise from the statically‑defined deployment map.
 */
export const TOKEN_A_ADDRESS: Address = pickAddress(
  process.env.NEXT_PUBLIC_TOKEN_A_ADDRESS,
  DEPLOYED.tokenA as Address
);

export const TOKEN_B_ADDRESS: Address = pickAddress(
  process.env.NEXT_PUBLIC_TOKEN_B_ADDRESS,
  DEPLOYED.tokenB as Address
);

export const PAIR_ADDRESS: Address = pickAddress(
  process.env.NEXT_PUBLIC_PAIR_ADDRESS,
  DEPLOYED.pair as Address
);

/**
 * Convenience collection of supported token addresses.
 */
export const SUPPORTED_TOKENS = [TOKEN_A_ADDRESS, TOKEN_B_ADDRESS] as const;