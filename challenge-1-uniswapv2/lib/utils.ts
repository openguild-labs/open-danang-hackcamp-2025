import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format token amounts
export function formatTokenAmount(amount: string | number, decimals: number = 18): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  } else if (num >= 1) {
    return num.toFixed(4);
  } else {
    return num.toFixed(6);
  }
}

// Format price with proper decimals
export function formatPrice(price: string | number): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '0';
  
  if (num >= 1) {
    return num.toFixed(4);
  } else {
    return num.toFixed(8);
  }
}

// Calculate price impact
export function calculatePriceImpact(
  inputAmount: string,
  outputAmount: string,
  reserveIn: string,
  reserveOut: string
): number {
  try {
    const input = parseFloat(inputAmount);
    const output = parseFloat(outputAmount);
    const resIn = parseFloat(reserveIn);
    const resOut = parseFloat(reserveOut);
    
    if (input === 0 || output === 0 || resIn === 0 || resOut === 0) return 0;
    
    const currentPrice = resOut / resIn;
    const executedPrice = output / input;
    const priceImpact = ((currentPrice - executedPrice) / currentPrice) * 100;
    
    return Math.abs(priceImpact);
  } catch {
    return 0;
  }
}

// Format percentage
export function formatPercent(percent: number): string {
  return `${percent.toFixed(2)}%`;
}

// Truncate address
export function truncateAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Format transaction hash
export function formatTxHash(hash: string): string {
  if (!hash) return '';
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

// Validate token amount
export function isValidAmount(amount: string): boolean {
  if (!amount || amount === '0' || amount === '') return false;
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
}

// Convert to Wei equivalent (for display purposes)
export function toDisplayAmount(amount: string, decimals: number = 18): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return '0';
  return (num / Math.pow(10, decimals)).toString();
}

// Add commas to large numbers
export function addCommas(num: string | number): string {
  const numStr = typeof num === 'number' ? num.toString() : num;
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Get explorer URL
export function getExplorerUrl(hash: string, type: 'tx' | 'address' = 'tx'): string {
  const baseUrl = 'https://blockscout-passet-hub.parity-testnet.parity.io';
  return `${baseUrl}/${type}/${hash}`;
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
} 