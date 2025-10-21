import { z } from 'zod';

export interface McpTool {
    name: string;
    description: string;
    schema: Record<string, any>;
    handler: (agent: any, input: Record<string, any>) => Promise<any>;
}

// Price API response types
export const PriceDataSchema = z.object({
  symbol: z.string(),
  price: z.number(),
  percent_change_24h: z.number(),
  market_cap: z.number(),
  volume_24h: z.number(),
  last_updated: z.string(),
  timestamp: z.string()
});

export const PriceApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(PriceDataSchema),
  count: z.number()
});

export type PriceData = z.infer<typeof PriceDataSchema>;
export type PriceApiResponse = z.infer<typeof PriceApiResponseSchema>;

// Market information types
export interface MarketInfo {
  cTokenAddress: string;
  underlyingAddress: string;
  symbol: string;
  underlyingSymbol: string;
  supplyApy: string;
  borrowApy: string;
  totalSupply: string;
  totalBorrows: string;
  utilizationRate: string;
  collateralFactor: string;
  price: number;
  isListed: boolean;
}

// Account position types
export interface AccountPosition {
  cTokenAddress: string;
  symbol: string;
  underlyingSymbol: string;
  supplyBalance: string;
  borrowBalance: string;
  supplyValueUSD: number;
  borrowValueUSD: number;
  collateralFactor: string;
  isCollateral: boolean;
}

export interface AccountLiquidity {
  liquidity: string;
  shortfall: string;
  healthFactor: number;
  totalCollateralUSD: number;
  totalBorrowUSD: number;
  positions: AccountPosition[];
}

// Transaction types
export interface TransactionResult {
  hash: string;
  status: 'success' | 'failed';
  blockNumber?: number;
  gasUsed?: string;
  error?: string;
}

// Protocol statistics
export interface ProtocolStats {
  totalTVL: number;
  totalBorrows: number;
  utilization: number;
  markets: MarketInfo[];
  prices: Record<string, number>;
  timestamp: string;
}

// Token balance types
export interface TokenBalance {
  symbol: string;
  address: string;
  balance: string;
  decimals: number;
  valueUSD: number;
}

export interface WalletInfo {
  address: string;
  nativeBalance: string;
  tokens: TokenBalance[];
  network: {
    chainId: number;
    name: string;
  };
}

// Operation parameters
export interface SupplyParams {
  token: string;
  amount: string;
  recipient?: string;
}

export interface WithdrawParams {
  cToken: string;
  amount: string;
  recipient?: string;
}

export interface BorrowParams {
  token: string;
  amount: string;
  recipient?: string;
}

export interface RepayParams {
  token: string;
  amount: string;
  borrower?: string;
}

export interface SendTokenParams {
  token: string;
  amount: string;
  recipient: string;
}

// Error types
export class KiloLendError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'KiloLendError';
  }
}

export class NetworkError extends KiloLendError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
  }
}

export class TransactionError extends KiloLendError {
  constructor(message: string, details?: any) {
    super(message, 'TRANSACTION_ERROR', details);
    this.name = 'TransactionError';
  }
}

export class InsufficientLiquidityError extends KiloLendError {
  constructor(message: string) {
    super(message, 'INSUFFICIENT_LIQUIDITY');
    this.name = 'InsufficientLiquidityError';
  }
}

export class InsufficientBalanceError extends KiloLendError {
  constructor(message: string) {
    super(message, 'INSUFFICIENT_BALANCE');
    this.name = 'InsufficientBalanceError';
  }
}
