import { formatUnits, parseUnits } from 'viem';

const USDC_DECIMALS = 6;

/**
 * Format USDC amount from wei to readable string
 */
export function formatUSDC(amount: bigint | string | number): string {
  const amountBigInt = typeof amount === 'string' || typeof amount === 'number' 
    ? BigInt(amount) 
    : amount;
  return formatUnits(amountBigInt, USDC_DECIMALS);
}

/**
 * Parse USDC amount from string to wei
 */
export function parseUSDC(amount: string): bigint {
  return parseUnits(amount, USDC_DECIMALS);
}

/**
 * Format address for display
 */
export function formatAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format date for display
 */
export function formatDate(timestamp: bigint | number | string): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date and time for display
 */
export function formatDateTime(timestamp: bigint | number | string): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate days remaining until a date
 */
export function daysUntil(targetDate: bigint | number | string): number {
  const target = new Date(Number(targetDate) * 1000);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Calculate percentage
 */
export function calculatePercentage(part: bigint, total: bigint): number {
  if (total === 0n) return 0;
  return Number((part * 10000n) / total) / 100;
}

