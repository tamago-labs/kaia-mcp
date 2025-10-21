import { Abi } from 'viem';

export const CTOKEN_ABI: Abi = [
  // Basic ERC20 functions
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  
  // CToken specific functions
  {
    inputs: [],
    name: "underlying",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "exchangeRateStored",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "supplyRatePerBlock",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "borrowRatePerBlock",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalBorrows",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalReserves",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getCash",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  
  // User functions
  {
    inputs: [{ internalType: "uint256", name: "mintAmount", type: "uint256" }],
    name: "mint",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "redeemTokens", type: "uint256" }],
    name: "redeem",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "redeemAmount", type: "uint256" }],
    name: "redeemUnderlying",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "borrowAmount", type: "uint256" }],
    name: "borrow",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "repayAmount", type: "uint256" }],
    name: "repayBorrow",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "borrower", type: "address" },
      { internalType: "uint256", name: "repayAmount", type: "uint256" }
    ],
    name: "repayBorrowBehalf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function"
  },
  
  // Account data
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "borrowBalanceStored",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "borrowBalanceCurrent",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  
  // Comptroller
  {
    inputs: [],
    name: "comptroller",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

// CToken addresses on KAIA mainnet
export const CTOKEN_ADDRESSES = {
  cUSDT: "0x498823F094f6F2121CcB4e09371a57A96d619695" as const,
  cSIX: "0xC468dFD0C96691035B3b1A4CA152Cb64F0dbF64c" as const,
  cBORA: "0x7a937C07d49595282c711FBC613c881a83B9fDFD" as const,
  cMBX: "0xE321e20F0244500A194543B1EBD8604c02b8fA85" as const,
  cKAIA: "0x98Ab86C97Ebf33D28fc43464353014e8c9927aB3" as const,
  cStKAIA: "0x0BC926EF3856542134B06DCf53c86005b08B9625" as const
} as const;

// Underlying token addresses
export const UNDERLYING_ADDRESSES = {
  USDT: "0x7f3d646560653A6F3a3b3327347d5d6d7A0B5f0E" as const,
  SIX: "0x8b3d5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F" as const,
  BORA: "0x4f3D646560653A6F3a3b3327347d5d6d7A0B5f0B" as const,
  MBX: "0x5f3d646560653A6F3a3b3327347d5d6d7A0B5f0C" as const,
  KAIA: "0x0000000000000000000000000000000000000000" as const, // Native
  STAKED_KAIA: "0x6f3d646560653A6F3a3b3327347d5d6d7A0B5f0D" as const
} as const;

// Token symbols mapping
export const TOKEN_SYMBOLS = {
  [CTOKEN_ADDRESSES.cUSDT]: 'USDT',
  [CTOKEN_ADDRESSES.cSIX]: 'SIX',
  [CTOKEN_ADDRESSES.cBORA]: 'BORA',
  [CTOKEN_ADDRESSES.cMBX]: 'MBX',
  [CTOKEN_ADDRESSES.cKAIA]: 'KAIA',
  [CTOKEN_ADDRESSES.cStKAIA]: 'STAKED_KAIA'
} as const;

// Reverse mapping from symbol to cToken address
export const SYMBOL_TO_CTOKEN = {
  'USDT': CTOKEN_ADDRESSES.cUSDT,
  'SIX': CTOKEN_ADDRESSES.cSIX,
  'BORA': CTOKEN_ADDRESSES.cBORA,
  'MBX': CTOKEN_ADDRESSES.cMBX,
  'KAIA': CTOKEN_ADDRESSES.cKAIA,
  'STAKED_KAIA': CTOKEN_ADDRESSES.cStKAIA
} as const;

// Token addresses for underlying assets
export const TOKEN_ADDRESSES = {
  'USDT': UNDERLYING_ADDRESSES.USDT,
  'SIX': UNDERLYING_ADDRESSES.SIX,
  'BORA': UNDERLYING_ADDRESSES.BORA,
  'MBX': UNDERLYING_ADDRESSES.MBX,
  'KAIA': UNDERLYING_ADDRESSES.KAIA,
  'STAKED_KAIA': UNDERLYING_ADDRESSES.STAKED_KAIA
} as const;

// Export ABI with alias
export const cTokenAbi = CTOKEN_ABI;
