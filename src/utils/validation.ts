import { Address } from 'viem';

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && isFinite(num);
}

export function validateSymbol(symbol: string): boolean {
  return /^[A-Z][A-Z0-9]{0,9}$/.test(symbol);
}

export function validatePrivateKey(privateKey: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(privateKey);
}

export function validateTransactionParams(params: {
  to: string;
  amount: string;
  symbol?: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isValidAddress(params.to)) {
    errors.push('Invalid recipient address');
  }

  if (!isValidAmount(params.amount)) {
    errors.push('Invalid amount');
  }

  if (params.symbol && !validateSymbol(params.symbol)) {
    errors.push('Invalid token symbol');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
