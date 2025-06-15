import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateHash(
  hash: string,
  startLength: number = 6,
  endLength: number = 4
) {
  return `${hash.slice(0, startLength)}...${hash.slice(-endLength)}`;
}

/**
 * Convert a human‑readable decimal string (e.g. "1.23") to bigint given asset decimals.
 * Trailing or missing fractional digits are normalised so the result always has the
 * exact precision specified by `decimals`.
 */
export function decimalToBigInt(value: string, decimals: number): bigint {
  const [whole, fraction = ""] = value.split(".");
  const fracNormalised = fraction.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(`${whole}${fracNormalised}`);
}