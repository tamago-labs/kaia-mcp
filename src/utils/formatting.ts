import { formatUnits, parseUnits } from 'viem';

export function formatTokenAmount(
  amount: bigint,
  symbol: string,
  decimals: number = 18
): string {
  const formatted = formatUnits(amount, decimals);
  return `${parseFloat(formatted).toFixed(6)} ${symbol}`;
}

export function parseTokenAmount(
  amount: string,
  decimals: number = 18
): bigint {
  return parseUnits(amount, decimals);
}

export function formatAPY(apy: string | number): string {
  const rate = typeof apy === 'string' ? parseFloat(apy) : apy;
  return `${rate.toFixed(2)}%`;
}

export function formatHealthFactor(factor: number): string {
  if (factor === Infinity) return '∞';
  return factor.toFixed(2);
}

export function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}

export function formatLargeNumber(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(2);
}
