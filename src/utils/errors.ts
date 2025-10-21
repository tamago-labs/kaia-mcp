export class KiloLendError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'KiloLendError';
  }
}

export class NetworkError extends KiloLendError {
  constructor(message: string, public originalError?: any) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class TransactionError extends KiloLendError {
  constructor(message: string, public txHash?: string) {
    super(message, 'TRANSACTION_ERROR');
    this.name = 'TransactionError';
  }
}

export class ValidationError extends KiloLendError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class InsufficientBalanceError extends KiloLendError {
  constructor(token: string, required: string, available: string) {
    super(`Insufficient ${token} balance. Required: ${required}, Available: ${available}`, 'INSUFFICIENT_BALANCE');
    this.name = 'InsufficientBalanceError';
  }
}

export class InsufficientLiquidityError extends KiloLendError {
  constructor(message: string = 'Insufficient account liquidity for this operation') {
    super(message, 'INSUFFICIENT_LIQUIDITY');
    this.name = 'InsufficientLiquidityError';
  }
}

export class MarketNotListedError extends KiloLendError {
  constructor(symbol: string) {
    super(`Market ${symbol} is not listed`, 'MARKET_NOT_LISTED');
    this.name = 'MarketNotListedError';
  }
}

export class TokenNotSupportedError extends KiloLendError {
  constructor(symbol: string) {
    super(`Token ${symbol} is not supported`, 'TOKEN_NOT_SUPPORTED');
    this.name = 'TokenNotSupportedError';
  }
}

export function handleApiError(error: any): KiloLendError {
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message || error.message;
    
    switch (status) {
      case 400:
        return new ValidationError(message);
      case 401:
        return new KiloLendError('Unauthorized', 'UNAUTHORIZED');
      case 403:
        return new KiloLendError('Forbidden', 'FORBIDDEN');
      case 404:
        return new KiloLendError('Not found', 'NOT_FOUND');
      case 429:
        return new KiloLendError('Rate limit exceeded', 'RATE_LIMIT');
      case 500:
        return new NetworkError('Internal server error', error);
      default:
        return new NetworkError(`API error: ${message}`, error);
    }
  }
  
  if (error.request) {
    return new NetworkError('Network request failed', error);
  }
  
  return new KiloLendError(error.message || 'Unknown error');
}

export function handleContractError(error: any): KiloLendError {
  if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
    return new TransactionError('Transaction may fail', error.transactionHash);
  }
  
  if (error.code === 'INSUFFICIENT_FUNDS') {
    return new InsufficientBalanceError('KAIA', 'unknown', 'unknown');
  }
  
  if (error.message?.includes('revert')) {
    const revertReason = error.message.match(/revert (.+)/)?.[1];
    return new TransactionError(revertReason || 'Transaction reverted', error.transactionHash);
  }
  
  return new TransactionError(error.message || 'Contract error', error.transactionHash);
}
