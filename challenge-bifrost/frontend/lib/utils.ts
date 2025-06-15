import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function roundLongDecimals(string?: string, decimals?: number) {
  if (!string || !decimals) {
    return "-";
  }

  if (string === "0") {
    return "0";
  }

  // if stringToNumber doesn't have decimals, don't add them
  if (!string.includes(".")) {
    return string;
  }

  const stringToNumber = Number(string);
  return stringToNumber.toFixed(decimals);
}

export function truncateHash(hash: string, startLength: number = 6, endLength: number = 4) {
  return `${hash.slice(0, startLength)}...${hash.slice(-endLength)}`;
}

export function formatNumberStringInput(value: string) {
  if (value === "") {
    return "";
  }

  // Split by decimal point
  const parts = value.split(".")

  // Format the integer part with commas
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")

  // Join back with decimal point if there was one
  return parts.join(".")
}

export function formatNumberStringWithThousandSeparators(value: string) {
  if (value === "") {
    return "";
  }

  // Split by decimal point
  const parts = value.split(".")

  // Format the integer part with commas
  parts[0] = Number(parts[0]).toLocaleString();

  // Join back with decimal point if there was one
  return parts.join(".")
}