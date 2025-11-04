import { Abi } from 'viem';

export const COMPTROLLER_ABI: Abi = [
  // Market entry/exit
  {
    inputs: [{ internalType: "address[]", name: "cTokens", type: "address[]" }],
    name: "enterMarkets",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "cToken", type: "address" }],
    name: "exitMarket",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  
  // Account liquidity
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "getAccountLiquidity",
    outputs: [
      { internalType: "uint256", name: "error", type: "uint256" },
      { internalType: "uint256", name: "liquidity", type: "uint256" },
      { internalType: "uint256", name: "shortfall", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  
  // Markets
  {
    inputs: [],
    name: "getAllMarkets",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "cToken", type: "address" }],
    name: "markets",
    outputs: [
      { internalType: "bool", name: "isListed", type: "bool" },
      { internalType: "uint256", name: "collateralFactorMantissa", type: "uint256" },
      { internalType: "bool", name: "isComped", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  
  // Assets in account
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "getAssetsIn",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function"
  },
  
  // Oracle
  {
    inputs: [],
    name: "oracle",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  
  // Close factor
  {
    inputs: [],
    name: "closeFactorMantissa",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  
  // Liquidation incentive
  {
    inputs: [],
    name: "liquidationIncentiveMantissa",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  
  // Claim rewards (if applicable)
  {
    inputs: [{ internalType: "address", name: "holder", type: "address" }],
    name: "claimComp",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

// Export ABI with alias
export const comptrollerAbi = COMPTROLLER_ABI;

export const COMPTROLLER_ADDRESS = "0x2591d179a0B1dB1c804210E111035a3a13c95a48" as const;
