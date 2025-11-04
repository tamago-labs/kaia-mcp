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
  cUSDT: "0x20A2Cbc68fbee094754b2F03d15B1F5466f1F649" as const,
  cSIX: "0x287770f1236AdbE3F4dA4f29D0f1a776f303C966" as const,
  cBORA: "0xA7247a6f5EaC85354642e0E90B515E2dC027d5F4" as const,
  cMBX: "0xa024B1DE3a6022FB552C2ED9a8050926Fb22d7b6" as const,
  cKAIA: "0x2029f3E3C667EBd68b1D29dbd61dc383BdbB56e5" as const,
  cStKAIA: "0x8A424cCf2D2B7D85F1DFb756307411D2BBc73e07" as const
} as const;

// Underlying token addresses
export const UNDERLYING_ADDRESSES = {
  USDT: "0xd077a400968890eacc75cdc901f0356c943e4fdb" as const,
  SIX: "0xEf82b1C6A550e730D8283E1eDD4977cd01FAF435" as const,
  BORA: "0x02cbE46fB8A1F579254a9B485788f2D86Cad51aa" as const,
  MBX: "0xD068c52d81f4409B9502dA926aCE3301cc41f623" as const,
  KAIA: "0x0000000000000000000000000000000000000000" as const, // Native
  STAKED_KAIA: "0x42952B873ed6f7f0A7E4992E2a9818E3A9001995" as const
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
