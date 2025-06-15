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

export function getBlockExplorerUrl(
  config: any,
  chainId: number | undefined
): string | undefined {
  const chain = config.chains?.find((chain: any) => chain.id === chainId);
  return (
    chain?.blockExplorers?.default?.url ||
    config.chains?.[0]?.blockExplorers?.default?.url
  );
}
